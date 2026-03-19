import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import axios from 'axios';
import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';
import { handleAutoLogin, handleAutoChangePhone, handleAutoChangeEmail, handleAutoChangePassword, handleDownloadBackUpCode, handleAutoGoogleAlert, handleVerifyEmail, gotoWithRetry, delay, } from './service.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Đặt tên ứng dụng NGAY từ đầu sử dụng setName()
// Phải gọi trước khi app.whenReady()
app.setName('ProfilePilot');
console.log('📱 App name set to:', app.name);
console.log('📱 App getName():', app.getName());
// Set userData path để lưu config với tên ứng dụng mới
app.setPath('userData', `${app.getPath('appData')}/ProfilePilot`);
const IX_API_BASE = 'http://127.0.0.1:53200';
// Lưu cache vào thư mục userData của hệ thống (thư mục ghi được khi đóng gói)
const PROFILE_CACHE_PATH = () => path.join(app.getPath('userData'), 'profile-cache.json');
const closeProfileSession = async (browser, profile) => {
    if (browser) {
        try {
            await browser.close();
            console.log(`🚪 Đã đóng trình duyệt cho profile: ${profile.name}`);
        }
        catch (closeErr) {
            console.error('⚠️ Lỗi khi đóng trình duyệt:', closeErr?.message || closeErr);
        }
    }
    try {
        const response = await axios.post(`${IX_API_BASE}/api/v2/profile-close`, { profile_id: profile.profile_id }, { timeout: 15000 });
        if (response?.data?.code === 0) {
            console.log(`✅ ixBrowser API: Đã giải phóng Profile [${profile.name}] thành công.`);
        }
        else {
            console.warn(`⚠️ ixBrowser API cảnh báo: ${response?.data?.message || 'Không rõ lỗi'}`);
        }
    }
    catch (apiErr) {
        console.error(`❌ Không thể gửi API đóng tới ixBrowser: ${apiErr?.message || apiErr}`);
    }
};
/**
 * Lưu lỗi ra file JSON để debug
 */
const saveErrorsToFile = (errors, logDir = './logs') => {
    // Tạo folder logs nếu chưa tồn tại
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const logFilePath = path.join(logDir, `errors-${timestamp}.json`);
    const logData = {
        timestamp: new Date().toISOString(),
        totalErrors: errors.length,
        errors: errors.map((err) => ({
            ...err,
            // Format dễ đọc
            formattedError: `[${err.action}] ${err.profileName} (ID: ${err.profileId}) - ${err.error}`,
        })),
    };
    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2), 'utf-8');
    console.log(`📁 Lỗi đã lưu vào: ${logFilePath}`);
    return logFilePath;
};
/**
 * Format và hiển thị lỗi theo từng category
 */
const printErrorSummary = (errors) => {
    if (errors.length === 0) {
        console.log('✅ Không có lỗi!');
        return;
    }
    // Nhóm lỗi theo action
    const errorsByAction = {};
    errors.forEach((err) => {
        if (!errorsByAction[err.action]) {
            errorsByAction[err.action] = [];
        }
        errorsByAction[err.action].push(err);
    });
    console.log('\n📊 CHI TIẾT LỖI THEO ACTION:');
    console.log('═'.repeat(80));
    Object.entries(errorsByAction).forEach(([action, actionErrors]) => {
        console.log(`\n🔴 ${action.toUpperCase()} (${actionErrors.length} lỗi)`);
        console.log('─'.repeat(80));
        actionErrors.forEach((err, index) => {
            console.log(`  ${index + 1}. [${err.profileName}] ID: ${err.profileId}`);
            console.log(`     ❌ ${err.error}`);
            console.log(`     ⏰ ${err.timestamp}`);
            console.log();
        });
    });
    console.log('═'.repeat(80));
};
/**
 * Hiển thị lỗi theo từng profile
 */
const printErrorsByProfile = (errors) => {
    if (errors.length === 0) {
        return;
    }
    // Nhóm lỗi theo profile
    const errorsByProfile = {};
    errors.forEach((err) => {
        const key = `${err.profileName} (${err.profileId})`;
        if (!errorsByProfile[key]) {
            errorsByProfile[key] = [];
        }
        errorsByProfile[key].push(err);
    });
    console.log('\n📋 CHI TIẾT LỖI THEO PROFILE:');
    console.log('═'.repeat(80));
    Object.entries(errorsByProfile).forEach(([profileKey, profileErrors]) => {
        console.log(`\n👤 ${profileKey}`);
        console.log('─'.repeat(80));
        profileErrors.forEach((err, index) => {
            console.log(`  ${index + 1}. [${err.action}] ❌ ${err.error}❌ ${err.errCode}`);
        });
        console.log();
    });
    console.log('═'.repeat(80));
};
const readProfileCache = () => {
    try {
        const cachePath = PROFILE_CACHE_PATH();
        if (!fs.existsSync(cachePath)) {
            return [];
        }
        const raw = fs.readFileSync(cachePath, 'utf-8');
        return JSON.parse(raw || '[]');
    }
    catch (err) {
        console.error('⚠️ Không thể đọc cache profile:', err);
        return [];
    }
};
const writeProfileCache = (data) => {
    try {
        const cachePath = PROFILE_CACHE_PATH();
        const dir = path.dirname(cachePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('⚠️ Không thể ghi cache profile:', err);
    }
};
const updateProfileCache = (cached, incoming) => {
    // Update toàn bộ cache với dữ liệu từ incoming, chỉ update các trường cụ thể
    const map = new Map();
    // Thêm tất cả cached vào map
    cached.forEach((item) => {
        const key = item?.username ?? item?.profile_id;
        if (key !== undefined && key !== null) {
            map.set(key, item);
        }
    });
    // Update với incoming
    incoming.forEach((item) => {
        const key = item?.username ?? item?.profile_id;
        if (key === undefined || key === null)
            return;
        if (map.has(key)) {
            // Update các trường cụ thể, giữ nguyên các trường khác
            const existing = map.get(key);
            map.set(key, {
                ...existing,
                name: item.name || existing.name,
                username: item.username || existing.username,
                password: item.password || existing.password,
                new_password: item.new_password || existing.new_password,
                tfa_secret: item.tfa_secret || existing.tfa_secret,
                proxy_ip: item.proxy_ip || existing.proxy_ip,
                proxy_type: item.proxy_type || existing.proxy_type,
            });
        }
        else {
            // Thêm mới nếu chưa có
            map.set(key, item);
        }
    });
    return Array.from(map.values());
};
const updateCacheProfile = (cache, profileId, updates) => {
    if (!profileId)
        return;
    const idx = cache.findIndex((p) => p?.profile_id === profileId);
    if (idx === -1)
        return;
    cache[idx] = { ...cache[idx], ...updates };
    writeProfileCache(cache);
};
const normalizeProfiles = (items) => (items || []).map((item) => ({
    profile_id: item?.profile_id ?? item?.id ?? null,
    name: item?.name ?? '',
    username: item?.username ?? '',
    password: item?.password ?? '',
    new_password: item?.new_password ?? item?.newPassword ?? '',
    tfa_secret: item?.tfa_secret ?? item?.tfaSecret ?? '',
    proxy_ip: item?.proxy_ip ?? item?.proxy ?? '',
    proxy_type: item?.proxy_type ?? item?.proxyType ?? '',
    isLoginAction: false,
    isError: false,
    errorInfo: '',
    isProxyErr: false,
    isCaptchaErr: false,
    downCodeSuccess: false,
    changePassSuccess: false,
    delPhoneSuccess: false,
    changeEmailSuccess: false,
    verifyEmailSuccess: false,
    googleAlertSuccess: false,
}));
const createWindow = () => {
    // Icon path: sử dụng app.getAppPath() để lấy đường dẫn root
    const iconPath = path.join(app.getAppPath(), 'public/iconApp.png');
    const win = new BrowserWindow({
        fullscreen: true,
        title: 'ProfilePilot',
        icon: iconPath,
        webPreferences: {
            // Đảm bảo đường dẫn preload chính xác
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173/';
    if (!app.isPackaged) {
        win.loadURL(devServerUrl);
    }
    else {
        const indexPath = path.join(app.getAppPath(), // trỏ thẳng vào app.asar
        'dist', 'index.html');
        console.log('📦 Load index từ:', indexPath);
        if (!fs.existsSync(indexPath)) {
            console.error('❌ Không tìm thấy dist/index.html:', indexPath);
        }
        win.loadFile(indexPath);
    }
};
const sendMail = async (data) => {
    let config = {
        service: 'gmail',
        auth: {
            user: 'lemondev.id.vn@gmail.com',
            pass: 'tkgy snwr nccq gutq',
        },
    };
    let transporter = await nodemailer.createTransport(config);
    let message = {
        from: 'lemondev.id.vn@gmail.com',
        to: 'anhqt.dev@gmail.com',
        subject: 'Report Point Login & Point Info',
        html: `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
    
      <p style="font-family: 'Roboto', sans-serif; font-weight: 600; text-align: center; margin-top: 24px">Báo cáo điểm đăng nhập & thông tin điểm</p>
    <p style="font-family: 'Roboto'; text-align:center; font-weight: 600; margin:5px 0px; font-size: 12px ">Tổng số điểm đăng nhập:</p>
    <p style="font-family: 'Roboto'; text-align:center; font-weight: 600; font-size: 24px; margin:8px 0px">${data.pointLogin}</p>
    <p style="font-family: 'Roboto'; text-align:center; font-weight: 600; margin:5px 0px; font-size: 12px ">Tổng số điểm thông tin:</p>
    <p style="font-family: 'Roboto'; text-align:center; font-weight: 600; font-size: 24px; margin:8px 0px">${data.pointInfo}</p>
    <p style="font-family: 'Roboto';font-size: 12px;margin-top: 24px">Lemon Cloud<br>Copy right: https://lemondev.id.vn</p>`,
    };
    try {
        return await transporter.sendMail(message);
    }
    catch (error) { }
};
/**
 * ĐĂNG KÝ HANDLER: Đảm bảo tên 'launch-profile' khớp 100% với preload.js
 */
ipcMain.handle('launch-profile', async (_event, data) => {
    try {
        console.log('--- Bắt đầu quy trình launch-profile ---');
        const profiles = data?.profileIds || [];
        const cachedProfiles = readProfileCache();
        // Mảng lưu lỗi cho từng profile
        const errors = [];
        const startTime = Date.now();
        let totalPointLogin = 0;
        let totalPointInfo = 0;
        // Đọc hoặc tạo file config trong thư mục logs
        const configFilePath = path.join('./logs', 'config.json');
        let config = {};
        // Đảm bảo thư mục logs tồn tại
        if (!fs.existsSync('./logs')) {
            fs.mkdirSync('./logs', { recursive: true });
        }
        if (fs.existsSync(configFilePath)) {
            // Nếu đã có file config thì đọc dữ liệu
            try {
                const configData = fs.readFileSync(configFilePath, 'utf-8');
                config = JSON.parse(configData);
                console.log('📄 Đã đọc config từ file:', configFilePath);
            }
            catch (err) {
                console.error('⚠️ Lỗi khi đọc file config:', err);
            }
        }
        else {
            // Log thông tin máy tính
            const hostname = os.hostname();
            const username = os.userInfo().username;
            const platform = os.platform();
            const arch = os.arch();
            const networkInterfaces = os.networkInterfaces();
            let deviceIP = 'Unknown';
            // Tìm IP address đầu tiên không phải internal
            for (const interfaceName in networkInterfaces) {
                const interfaces = networkInterfaces[interfaceName];
                if (interfaces) {
                    for (const iface of interfaces) {
                        if (iface.family === 'IPv4' && !iface.internal) {
                            deviceIP = iface.address;
                            break;
                        }
                    }
                    if (deviceIP !== 'Unknown')
                        break;
                }
            }
            const deviceName = `${hostname} (${username})`;
            const deviceID = `${hostname}-${platform}-${arch}`;
            const dataSaveInfo = {
                device_id: deviceID,
                device_name: deviceName,
                device_ip: deviceIP,
                username: username,
                platform: platform,
                arch: arch,
                pointLogin: 0,
                pointInfo: 0,
            };
            // Nếu chưa có thì tạo file config mới với dataSaveInfo
            config = { ...dataSaveInfo };
            try {
                fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
                console.log('📄 Tạo file config mới:', configFilePath);
            }
            catch (err) {
                console.error('⚠️ Lỗi khi tạo file config:', err);
            }
        }
        // Sau này có thể cập nhật config và lưu lại
        // config là object luôn chứa dữ liệu mới nhất
        // 2. Chạy vòng lặp xử lý từng profile
        for (const profile of profiles) {
            let pointLogin = 0;
            let pointInfo = 0;
            console.log(`🔄 Đang xử lý: ${profile.name} (ID: ${profile.profile_id})`);
            let browser = null;
            let loginSuccess = false;
            let downCodeSuccess = false;
            let changePassSuccess = false;
            let delPhoneSuccess = false;
            let changeEmailSuccess = false;
            let verifyEmailSuccess = false;
            let googleAlertSuccess = false;
            let profileHadError = false;
            let firstErrorMsg = '';
            let isProxyErr = false;
            let isCaptchaErr = false;
            const markErrFlags = (code) => {
                if (code === 'NETWORK')
                    isProxyErr = true;
                if (code === 'ROBOT')
                    isCaptchaErr = true;
            };
            const markCache = () => {
                updateCacheProfile(cachedProfiles, profile.profile_id, {
                    isLoginAction: loginSuccess,
                    isError: profileHadError,
                    errorInfo: firstErrorMsg,
                    isProxyErr,
                    isCaptchaErr,
                    downCodeSuccess,
                    changePassSuccess,
                    delPhoneSuccess,
                    changeEmailSuccess,
                    verifyEmailSuccess,
                    googleAlertSuccess,
                });
            };
            try {
                // Guard thiếu dữ liệu
                if (!profile || !profile.profile_id) {
                    const errorMsg = 'Thiếu profile_id để mở trình duyệt';
                    errors.push({
                        profileId: profile?.profile_id || 0,
                        profileName: profile?.name || 'unknown',
                        action: 'profile-open',
                        error: errorMsg,
                        errCode: 'PROFILE_ID_MISSING',
                        timestamp: new Date().toISOString(),
                    });
                    profileHadError = true;
                    firstErrorMsg = firstErrorMsg
                        ? `${firstErrorMsg} | ${errorMsg}`
                        : errorMsg;
                    markCache();
                    continue;
                }
                // Mở trình duyệt qua ixBrowser API (timeout + retry nhẹ)
                let openRes;
                try {
                    openRes = await axios.post(`${IX_API_BASE}/api/v2/profile-open`, { profile_id: profile.profile_id }, { timeout: 15000 });
                }
                catch (err) {
                    const errorMsg = `Không thể mở profile (network/timeout): ${err?.message || ''}`;
                    errors.push({
                        profileId: profile.profile_id,
                        profileName: profile.name,
                        action: 'profile-open',
                        error: errorMsg,
                        errCode: 'PROFILE_OPEN_NETWORK',
                        timestamp: new Date().toISOString(),
                    });
                    profileHadError = true;
                    firstErrorMsg = firstErrorMsg
                        ? `${firstErrorMsg} | ${errorMsg}`
                        : errorMsg;
                    markCache();
                    continue;
                }
                if (openRes?.data?.error?.code === 0) {
                    const debugUrl = openRes.data?.data?.debugging_address;
                    if (!debugUrl) {
                        const errorMsg = 'Thiếu debugging_address trong phản hồi';
                        errors.push({
                            profileId: profile.profile_id,
                            profileName: profile.name,
                            action: 'profile-open',
                            error: errorMsg,
                            errCode: 'PROFILE_DEBUG_URL_MISSING',
                            timestamp: new Date().toISOString(),
                        });
                        profileHadError = true;
                        firstErrorMsg = firstErrorMsg
                            ? `${firstErrorMsg} | ${errorMsg}`
                            : errorMsg;
                        markCache();
                        continue;
                    }
                    // Kết nối Puppeteer
                    browser = await puppeteer.connect({
                        browserURL: `http://${debugUrl}`,
                        defaultViewport: null,
                        protocolTimeout: 0,
                    });
                    const pages = await browser.pages();
                    const page = pages.length > 0 ? pages[0] : await browser.newPage();
                    console.log(`📍 Đang điều hướng profile ${profile.name} tới Gmail...`);
                    // Thao tác tự động
                    await gotoWithRetry(page, 'https://accounts.google.com/');
                    // ĐĂNG NHẬP
                    if (data.isAutoLogin) {
                        try {
                            await handleAutoLogin(page, profile);
                            console.log(`✅ Đăng nhập thành công cho: ${profile.name}`);
                            loginSuccess = true;
                            pointLogin++;
                        }
                        catch (loginError) {
                            const errorMsg = loginError.message || 'Lỗi đăng nhập không xác định';
                            console.error(`❌ Lỗi đăng nhập cho ${profile.name}:`, errorMsg);
                            const errCode = loginError?.errCode || 'LOGIN_FAILED';
                            loginSuccess = false;
                            profileHadError = true;
                            firstErrorMsg = firstErrorMsg
                                ? `${firstErrorMsg} | ${errorMsg}`
                                : errorMsg;
                            errors.push({
                                profileId: profile.profile_id,
                                profileName: profile.name,
                                action: 'handleAutoLogin',
                                error: errorMsg,
                                errCode,
                                timestamp: new Date().toISOString(),
                            });
                            markErrFlags(errCode);
                            markCache();
                            // Tiếp tục vòng for sang profile tiếp theo
                            continue;
                        }
                    }
                    // THAY ĐỔI THÔNG TIN
                    //Tải backup code
                    if (data.isDownCode) {
                        try {
                            await handleDownloadBackUpCode(page, profile);
                            console.log(`✅ Tải backup code thành công cho: ${profile.name}`);
                            downCodeSuccess = true;
                            pointInfo++;
                        }
                        catch (backupError) {
                            const errorMsg = backupError.message || 'Lỗi tải backup code không xác định';
                            console.error(`❌ Lỗi tải backup code cho ${profile.name}:`, errorMsg);
                            const errCode = backupError?.errCode || 'BACKUP_DOWNLOAD_FAILED';
                            downCodeSuccess = false;
                            profileHadError = true;
                            firstErrorMsg = firstErrorMsg
                                ? `${firstErrorMsg} | ${errorMsg}`
                                : errorMsg;
                            errors.push({
                                profileId: profile.profile_id,
                                profileName: profile.name,
                                action: 'handleDownloadBackUpCode',
                                error: errorMsg,
                                errCode,
                                timestamp: new Date().toISOString(),
                            });
                            markErrFlags(errCode);
                        }
                    }
                    // XOÁ SỐ ĐIỆN THOẠI
                    if (data.isDelPhone) {
                        try {
                            await handleAutoChangePhone(page, profile);
                            console.log(`✅ Xóa số điện thoại thành công cho: ${profile.name}`);
                            delPhoneSuccess = true;
                            pointInfo++;
                        }
                        catch (phoneError) {
                            const errorMsg = phoneError.message || 'Lỗi xóa số điện thoại không xác định';
                            console.error(`❌ Lỗi xóa số điện thoại cho ${profile.name}:`, errorMsg);
                            const errCode = phoneError?.errCode || 'PHONE_CHANGE_FAILED';
                            delPhoneSuccess = false;
                            profileHadError = true;
                            firstErrorMsg = firstErrorMsg
                                ? `${firstErrorMsg} | ${errorMsg}`
                                : errorMsg;
                            errors.push({
                                profileId: profile.profile_id,
                                profileName: profile.name,
                                action: 'handleAutoChangePhone',
                                error: errorMsg,
                                errCode,
                                timestamp: new Date().toISOString(),
                            });
                            markErrFlags(errCode);
                        }
                    }
                    // THAY ĐỔI EMAIL
                    if (data.isChangeMail) {
                        try {
                            await handleAutoChangeEmail(page, profile);
                            console.log(`✅ Thay đổi email thành công cho: ${profile.name}`);
                            changeEmailSuccess = true;
                            pointInfo++;
                        }
                        catch (emailError) {
                            const errorMsg = emailError.message || 'Lỗi thay đổi email không xác định';
                            console.error(`❌ Lỗi thay đổi email cho ${profile.name}:`, errorMsg);
                            const errCode = emailError?.errCode || 'EMAIL_CHANGE_FAILED';
                            changeEmailSuccess = false;
                            profileHadError = true;
                            firstErrorMsg = firstErrorMsg
                                ? `${firstErrorMsg} | ${errorMsg}`
                                : errorMsg;
                            errors.push({
                                profileId: profile.profile_id,
                                profileName: profile.name,
                                action: 'handleAutoChangeEmail',
                                error: errorMsg,
                                errCode,
                                timestamp: new Date().toISOString(),
                            });
                            markErrFlags(errCode);
                        }
                    }
                    // THAY ĐỔI MẬT KHẨU
                    if (data.isChangePass) {
                        try {
                            await handleAutoChangePassword(page, profile);
                            console.log(`✅ Thay đổi mật khẩu thành công cho: ${profile.name}`);
                            changePassSuccess = true;
                            pointInfo++;
                        }
                        catch (pwdError) {
                            const errorMsg = pwdError.message || 'Lỗi thay đổi mật khẩu không xác định';
                            console.error(`❌ Lỗi thay đổi mật khẩu cho ${profile.name}:`, errorMsg);
                            const errCode = pwdError?.errCode || 'PASSWORD_CHANGE_FAILED';
                            changePassSuccess = false;
                            profileHadError = true;
                            firstErrorMsg = firstErrorMsg
                                ? `${firstErrorMsg} | ${errorMsg}`
                                : errorMsg;
                            errors.push({
                                profileId: profile.profile_id,
                                profileName: profile.name,
                                action: 'handleAutoChangePassword',
                                error: errorMsg,
                                errCode,
                                timestamp: new Date().toISOString(),
                            });
                            markErrFlags(errCode);
                        }
                    }
                    if (data.isVerifyEmail) {
                        try {
                            await handleVerifyEmail(page, profile);
                            console.log(`✅ Kiểm tra Verify Email thành công cho: ${profile.name}`);
                            verifyEmailSuccess = true;
                            pointInfo++;
                        }
                        catch (verifyError) {
                            const errorMsg = verifyError.message ||
                                'Lỗi kiểm tra Verify Email không xác định';
                            console.error(`❌ Lỗi kiểm tra Verify Email cho ${profile.name}:`, errorMsg);
                            const errCode = verifyError?.errCode || 'VERIFY_EMAIL_FAILED';
                            verifyEmailSuccess = false;
                            profileHadError = true;
                            firstErrorMsg = firstErrorMsg
                                ? `${firstErrorMsg} | ${errorMsg}`
                                : errorMsg;
                            errors.push({
                                profileId: profile.profile_id,
                                profileName: profile.name,
                                action: 'handleVerifyEmail',
                                error: errorMsg,
                                errCode,
                                timestamp: new Date().toISOString(),
                            });
                            markErrFlags(errCode);
                        }
                    }
                    if (data.isGoogleAlert) {
                        try {
                            await handleAutoGoogleAlert(page, profile);
                            console.log(`✅ Kiểm tra Google Alert thành công cho: ${profile.name}`);
                            googleAlertSuccess = true;
                            pointInfo++;
                        }
                        catch (alertError) {
                            const errorMsg = alertError.message ||
                                'Lỗi kiểm tra Google Alert không xác định';
                            console.error(`❌ Lỗi kiểm tra Google Alert cho ${profile.name}:`, errorMsg);
                            const errCode = alertError?.errCode || 'GOOGLE_ALERT_FAILED';
                            googleAlertSuccess = false;
                            profileHadError = true;
                            firstErrorMsg = firstErrorMsg
                                ? `${firstErrorMsg} | ${errorMsg}`
                                : errorMsg;
                            errors.push({
                                profileId: profile.profile_id,
                                profileName: profile.name,
                                action: 'handleAutoGoogleAlert',
                                error: errorMsg,
                                errCode,
                                timestamp: new Date().toISOString(),
                            });
                            markErrFlags(errCode);
                        }
                    }
                    // Cập nhật cache sau khi hoàn tất profile (trường hợp thành công)
                    markCache();
                    console.log(`✅ Hoàn tất thao tác cho profile: ${profile.name}`);
                }
                else {
                    const errorMsg = `Không thể mở profile: ${openRes?.data?.error?.message ||
                        openRes?.data?.message ||
                        'Không rõ lỗi'}`;
                    console.error(`❌ ${errorMsg}`);
                    errors.push({
                        profileId: profile.profile_id,
                        profileName: profile.name,
                        action: 'profile-open',
                        error: errorMsg,
                        errCode: 'PROFILE_OPEN_FAILED',
                        timestamp: new Date().toISOString(),
                    });
                    profileHadError = true;
                    firstErrorMsg = firstErrorMsg
                        ? `${firstErrorMsg} | ${errorMsg}`
                        : errorMsg;
                    markCache();
                }
            }
            catch (profileError) {
                // Catch lỗi xảy ra trong xử lý từng profile
                const errorMsg = profileError.message || 'Lỗi xử lý profile không xác định';
                console.error(`❌ Lỗi xử lý profile ${profile.name}:`, errorMsg);
                const errCode = profileError?.errCode || 'PROFILE_GENERAL_ERROR';
                profileHadError = true;
                firstErrorMsg = firstErrorMsg
                    ? `${firstErrorMsg} | ${errorMsg}`
                    : errorMsg;
                errors.push({
                    profileId: profile.profile_id,
                    profileName: profile.name,
                    action: 'general',
                    error: errorMsg,
                    errCode,
                    timestamp: new Date().toISOString(),
                });
                markErrFlags(errCode);
                markCache();
                // Tiếp tục vòng for sang profile tiếp theo
                continue;
            }
            finally {
                // Đóng trình duyệt và giải phóng profile qua ixBrowser
                if (pointLogin > 0) {
                    totalPointLogin += pointLogin;
                }
                if (pointInfo >= 4) {
                    // Xử lý lưu trữ
                    totalPointInfo += pointInfo;
                }
                await closeProfileSession(browser, profile);
                // 3. Nghỉ một khoảng ngắn (2-3s) trước khi chuyển sang Profile tiếp theo
                // Việc này giúp tránh lỗi "Profile is already running" do ixBrowser chưa kịp dọn dẹp xong tiến trình ngầm
                await delay(2500);
            }
        }
        config.pointLogin = totalPointLogin;
        config.pointInfo = totalPointInfo;
        // Cập nhật lại file config với điểm số mới
        try {
            fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
            console.log('📄 Cập nhật file config với điểm số mới:', configFilePath);
        }
        catch (err) {
            console.error('⚠️ Lỗi khi cập nhật file config:', err);
        }
        await sendMail(config);
        // Trả kết quả cuối cùng
        const result = {
            success: errors.length === 0,
            totalProfiles: profiles.length,
            successfulCount: profiles.length - errors.length,
            errorCount: errors.length,
            errors: errors,
        };
        // Tính thời gian thực thi
        const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
        // Lưu lỗi ra file nếu có
        let logFilePath;
        if (errors.length > 0) {
            logFilePath = saveErrorsToFile(errors);
        }
        // Hiển thị tóm tắt
        console.log('\n' + '═'.repeat(80));
        console.log('📊 TÓM TẮT KẾT QUẢ CUỐI CÙNG');
        console.log('═'.repeat(80));
        console.log(`   📝 Tổng profiles: ${result.totalProfiles}`);
        console.log(`   ✅ Thành công: ${result.successfulCount}`);
        console.log(`   ❌ Thất bại: ${result.errorCount}`);
        console.log(`   ⏱️  Thời gian thực thi: ${executionTime}s`);
        console.log('═'.repeat(80));
        // Hiển thị chi tiết lỗi
        if (errors.length > 0) {
            printErrorsByProfile(errors);
            printErrorSummary(errors);
        }
        return {
            ...result,
            logFilePath,
            executionTime: `${executionTime}s`,
        };
    }
    catch (error) {
        console.error('❌ Lỗi chi tiết trong Main:', error);
        return {
            success: false,
            totalProfiles: 0,
            successfulCount: 0,
            errorCount: 0,
            error: error.message,
            errors: [],
        };
    }
});
ipcMain.handle('get-profile-list', async (_event, { page, limit }) => {
    const cachedProfiles = readProfileCache();
    try {
        const response = await axios.post(`${IX_API_BASE}/api/v2/profile-list`, {
            profile_id: 0,
            name: '',
            group_id: 0,
            tag_id: 0,
            page,
            limit,
        });
        const apiPayload = response?.data || {};
        // Normalize dữ liệu từ API
        const freshProfiles = normalizeProfiles(apiPayload?.data?.data || []);
        const updatedProfiles = updateProfileCache(cachedProfiles, freshProfiles);
        // Ghi cache với dữ liệu đã update
        writeProfileCache(updatedProfiles);
        // Trả về dữ liệu từ cache
        const responseProfiles = readProfileCache();
        return {
            data: { data: responseProfiles },
            error: { code: 0, message: 'OK (cache)' },
            fromCache: true,
        };
    }
    catch (error) {
        console.error('⚠️ Lỗi khi lấy danh sách hồ sơ, fallback dữ liệu cache:', error?.message || error);
        if (cachedProfiles.length > 0) {
            return {
                data: { data: cachedProfiles },
                error: { code: 0, message: 'Dữ liệu từ cache (API lỗi)' },
                fromCache: true,
            };
        }
        return {
            data: { data: [] },
            error: { code: -1, message: error?.message || 'Không thể lấy dữ liệu' },
            fromCache: true,
        };
    }
});
// Khởi tạo App
app.whenReady().then(() => {
    // Re-confirm app name
    app.setName('ProfilePilot');
    console.log('🔄 Re-set app name in whenReady():', app.getName());
    // Setup dock icon trên macOS
    if (process.platform === 'darwin') {
        if (app.dock) {
            const dockIconPath = path.join(app.getAppPath(), 'public/iconApp.png');
            app.dock.setIcon(dockIconPath);
        }
    }
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});
