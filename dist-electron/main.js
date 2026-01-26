import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { handleAutoLogin, handleAutoChangePhone, handleAutoChangeEmail, handleAutoChangePassword, handleDownloadBackUpCode, gotoWithRetry, delay, } from './service.js';
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
/**
 * Lưu lỗi ra file JSON để debug
 */
function saveErrorsToFile(errors, logDir = './logs') {
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
}
/**
 * Format và hiển thị lỗi theo từng category
 */
function printErrorSummary(errors) {
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
}
/**
 * Hiển thị lỗi theo từng profile
 */
function printErrorsByProfile(errors) {
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
            console.log(`  ${index + 1}. [${err.action}] ❌ ${err.error}`);
        });
        console.log();
    });
    console.log('═'.repeat(80));
}
function createWindow() {
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
    win.loadURL('http://localhost:5173/');
}
/**
 * ĐĂNG KÝ HANDLER: Đảm bảo tên 'launch-profile' khớp 100% với preload.js
 */
ipcMain.handle('launch-profile', async (_event, data) => {
    try {
        console.log('--- Bắt đầu quy trình launch-profile ---');
        const profiles = data?.profileIds || [];
        // Mảng lưu lỗi cho từng profile
        const errors = [];
        const startTime = Date.now();
        // 2. Chạy vòng lặp xử lý từng profile
        for (const profile of profiles) {
            console.log(`🔄 Đang xử lý: ${profile.name} (ID: ${profile.profile_id})`);
            let browser = null;
            try {
                // Guard thiếu dữ liệu
                if (!profile || !profile.profile_id) {
                    errors.push({
                        profileId: profile?.profile_id || 0,
                        profileName: profile?.name || 'unknown',
                        action: 'profile-open',
                        error: 'Thiếu profile_id để mở trình duyệt',
                        timestamp: new Date().toISOString(),
                    });
                    continue;
                }
                // Mở trình duyệt qua ixBrowser API (timeout + retry nhẹ)
                let openRes;
                try {
                    openRes = await axios.post(`${IX_API_BASE}/api/v2/profile-open`, { profile_id: profile.profile_id }, { timeout: 15000 });
                }
                catch (err) {
                    errors.push({
                        profileId: profile.profile_id,
                        profileName: profile.name,
                        action: 'profile-open',
                        error: `Không thể mở profile (network/timeout): ${err?.message || ''}`,
                        timestamp: new Date().toISOString(),
                    });
                    continue;
                }
                if (openRes?.data?.error?.code === 0) {
                    const debugUrl = openRes.data?.data?.debugging_address;
                    if (!debugUrl) {
                        errors.push({
                            profileId: profile.profile_id,
                            profileName: profile.name,
                            action: 'profile-open',
                            error: 'Thiếu debugging_address trong phản hồi',
                            timestamp: new Date().toISOString(),
                        });
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
                    for (const p of pages) {
                        const client = await p.target().createCDPSession();
                        // Xóa toàn bộ Cookies và Cache của trình duyệt
                        await client.send('Network.clearBrowserCookies');
                        await client.send('Network.clearBrowserCache');
                    }
                    console.log(profile);
                    console.log(`📍 Đang điều hướng profile ${profile.name} tới Gmail...`);
                    // Thao tác tự động
                    await gotoWithRetry(page, 'https://accounts.google.com/');
                    console.log(data, 'Dữ liệu nhận từ Renderer');
                    // ĐĂNG NHẬP
                    if (data.isAutoLogin) {
                        try {
                            await handleAutoLogin(page, profile);
                            console.log(`✅ Đăng nhập thành công cho: ${profile.name}`);
                        }
                        catch (loginError) {
                            const errorMsg = loginError.message || 'Lỗi đăng nhập không xác định';
                            console.error(`❌ Lỗi đăng nhập cho ${profile.name}:`, errorMsg);
                            errors.push({
                                profileId: profile.profile_id,
                                profileName: profile.name,
                                action: 'handleAutoLogin',
                                error: errorMsg,
                                timestamp: new Date().toISOString(),
                            });
                            // Tiếp tục vòng for sang profile tiếp theo
                            continue;
                        }
                    }
                    // THAY ĐỔI THÔNG TIN
                    if (data.isAutoChange) {
                        //Tải backup code
                        try {
                            await handleDownloadBackUpCode(page, profile);
                            console.log(`✅ Tải backup code thành công cho: ${profile.name}`);
                        }
                        catch (backupError) {
                            const errorMsg = backupError.message || 'Lỗi tải backup code không xác định';
                            console.error(`❌ Lỗi tải backup code cho ${profile.name}:`, errorMsg);
                            errors.push({
                                profileId: profile.profile_id,
                                profileName: profile.name,
                                action: 'handleDownloadBackUpCode',
                                error: errorMsg,
                                timestamp: new Date().toISOString(),
                            });
                        }
                        // // XOÁ SỐ ĐIỆN THOẠI
                        try {
                            await handleAutoChangePhone(page, profile);
                            console.log(`✅ Xóa số điện thoại thành công cho: ${profile.name}`);
                        }
                        catch (phoneError) {
                            const errorMsg = phoneError.message || 'Lỗi xóa số điện thoại không xác định';
                            console.error(`❌ Lỗi xóa số điện thoại cho ${profile.name}:`, errorMsg);
                            errors.push({
                                profileId: profile.profile_id,
                                profileName: profile.name,
                                action: 'handleAutoChangePhone',
                                error: errorMsg,
                                timestamp: new Date().toISOString(),
                            });
                        }
                        // // THAY ĐỔI EMAIL
                        try {
                            await handleAutoChangeEmail(page, profile);
                            console.log(`✅ Thay đổi email thành công cho: ${profile.name}`);
                        }
                        catch (emailError) {
                            const errorMsg = emailError.message || 'Lỗi thay đổi email không xác định';
                            console.error(`❌ Lỗi thay đổi email cho ${profile.name}:`, errorMsg);
                            errors.push({
                                profileId: profile.profile_id,
                                profileName: profile.name,
                                action: 'handleAutoChangeEmail',
                                error: errorMsg,
                                timestamp: new Date().toISOString(),
                            });
                        }
                        // // THAY ĐỔI MẬT KHẨU
                        try {
                            await handleAutoChangePassword(page, profile);
                            console.log(`✅ Thay đổi mật khẩu thành công cho: ${profile.name}`);
                        }
                        catch (pwdError) {
                            const errorMsg = pwdError.message || 'Lỗi thay đổi mật khẩu không xác định';
                            console.error(`❌ Lỗi thay đổi mật khẩu cho ${profile.name}:`, errorMsg);
                            errors.push({
                                profileId: profile.profile_id,
                                profileName: profile.name,
                                action: 'handleAutoChangePassword',
                                error: errorMsg,
                                timestamp: new Date().toISOString(),
                            });
                        }
                    }
                    console.log(`✅ Hoàn tất thao tác cho profile: ${profile.name}`);
                }
                else {
                    const errorMsg = `Không thể mở profile: ${openRes.data.message}`;
                    console.error(`❌ ${errorMsg}`);
                    errors.push({
                        profileId: profile.profile_id,
                        profileName: profile.name,
                        action: 'profile-open',
                        error: errorMsg,
                        timestamp: new Date().toISOString(),
                    });
                }
            }
            catch (profileError) {
                // Catch lỗi xảy ra trong xử lý từng profile
                const errorMsg = profileError.message || 'Lỗi xử lý profile không xác định';
                console.error(`❌ Lỗi xử lý profile ${profile.name}:`, errorMsg);
                errors.push({
                    profileId: profile.profile_id,
                    profileName: profile.name,
                    action: 'general',
                    error: errorMsg,
                    timestamp: new Date().toISOString(),
                });
                // Tiếp tục vòng for sang profile tiếp theo
                continue;
            }
            finally {
                // Đóng trình duyệt sau khi xử lý xong mỗi profile (kể cả lỗi)
                if (browser) {
                    try {
                        await browser.close();
                        console.log(`🚪 Đã đóng trình duyệt cho profile: ${profile.name}`);
                    }
                    catch (closeErr) {
                        console.error('⚠️ Lỗi khi đóng trình duyệt:', closeErr.message || closeErr);
                    }
                }
                try {
                    const response = await axios.post(`${IX_API_BASE}/api/v2/profile-close`, {
                        profile_id: profile.profile_id,
                    }, { timeout: 15000 });
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
                // 3. Nghỉ một khoảng ngắn (2-3s) trước khi chuyển sang Profile tiếp theo
                // Việc này giúp tránh lỗi "Profile is already running" do ixBrowser chưa kịp dọn dẹp xong tiến trình ngầm
                await delay(2500);
            }
        }
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
ipcMain.handle('get-profile-list', async (event, { page, limit }) => {
    try {
        const response = await axios.post('http://127.0.0.1:53200/api/v2/profile-list', {
            profile_id: 0,
            name: '',
            group_id: 0,
            tag_id: 0,
            page,
            limit,
        });
        return response.data;
    }
    catch (error) {
        return error;
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
