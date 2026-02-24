import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';
import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';
import {
  handleAutoLogin,
  handleAutoChangePhone,
  handleAutoChangeEmail,
  handleAutoChangePassword,
  handleDownloadBackUpCode,
  gotoWithRetry,
  delay,
} from './service.js';

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
const PROFILE_CACHE_PATH = () =>
  path.join(app.getPath('userData'), 'profile-cache.json');

const closeProfileSession = async (
  browser: Browser | null,
  profile: { profile_id: number; name: string }
): Promise<void> => {
  if (browser) {
    try {
      await browser.close();
      console.log(`🚪 Đã đóng trình duyệt cho profile: ${profile.name}`);
    } catch (closeErr: any) {
      console.error(
        '⚠️ Lỗi khi đóng trình duyệt:',
        closeErr?.message || closeErr
      );
    }
  }

  try {
    const response = await axios.post(
      `${IX_API_BASE}/api/v2/profile-close`,
      { profile_id: profile.profile_id },
      { timeout: 15000 }
    );

    if (response?.data?.code === 0) {
      console.log(
        `✅ ixBrowser API: Đã giải phóng Profile [${profile.name}] thành công.`
      );
    } else {
      console.warn(
        `⚠️ ixBrowser API cảnh báo: ${
          response?.data?.message || 'Không rõ lỗi'
        }`
      );
    }
  } catch (apiErr: any) {
    console.error(
      `❌ Không thể gửi API đóng tới ixBrowser: ${apiErr?.message || apiErr}`
    );
  }
};

/**
 * Loại lỗi theo action
 */
interface ErrorDetail {
  profileId: number;
  profileName: string;
  action: string;
  error: string;
  errCode: string;
  timestamp: string;
  stack?: string;
}

/**
 * Kết quả khi hoàn thành toàn bộ quy trình
 */
interface LaunchProfileResult {
  success: boolean;
  totalProfiles: number;
  successfulCount: number;
  errorCount: number;
  errors: ErrorDetail[];
  logFilePath?: string;
  executionTime?: string;
}

/**
 * Lưu lỗi ra file JSON để debug
 */
const saveErrorsToFile = (
  errors: ErrorDetail[],
  logDir: string = './logs'
): string => {
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
const printErrorSummary = (errors: ErrorDetail[]): void => {
  if (errors.length === 0) {
    console.log('✅ Không có lỗi!');
    return;
  }

  // Nhóm lỗi theo action
  const errorsByAction: Record<string, ErrorDetail[]> = {};
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
const printErrorsByProfile = (errors: ErrorDetail[]): void => {
  if (errors.length === 0) {
    return;
  }

  // Nhóm lỗi theo profile
  const errorsByProfile: Record<string, ErrorDetail[]> = {};
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
      console.log(
        `  ${index + 1}. [${err.action}] ❌ ${err.error}❌ ${err.errCode}`
      );
    });
    console.log();
  });

  console.log('═'.repeat(80));
};

const readProfileCache = (): any[] => {
  try {
    const cachePath = PROFILE_CACHE_PATH();
    if (!fs.existsSync(cachePath)) {
      return [];
    }
    const raw = fs.readFileSync(cachePath, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('⚠️ Không thể đọc cache profile:', err);
    return [];
  }
};

const writeProfileCache = (data: any[]): void => {
  try {
    const cachePath = PROFILE_CACHE_PATH();
    const dir = path.dirname(cachePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('⚠️ Không thể ghi cache profile:', err);
  }
};

const mergeProfileCache = (cached: any[], incoming: any[]): any[] => {
  // Ưu tiên so sánh theo username; fallback profile_id/id khi thiếu username
  const map = new Map<string | number, any>();

  cached.forEach((item) => {
    const key = item?.username ?? item?.profile_id;
    if (key !== undefined && key !== null) {
      map.set(key, item);
    }
  });

  incoming.forEach((item) => {
    const key = item?.username ?? item?.profile_id;
    if (key === undefined || key === null) return;
    // Chỉ thêm mới nếu cache chưa có username này
    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
};

const updateCacheProfile = (
  cache: any[],
  profileId: number,
  updates: Record<string, any>
): void => {
  if (!profileId) return;
  const idx = cache.findIndex((p) => p?.profile_id === profileId);
  if (idx === -1) return;
  cache[idx] = { ...cache[idx], ...updates };
  writeProfileCache(cache);
};

const normalizeProfiles = (items: any[]): any[] =>
  (items || []).map((item) => ({
    profile_id: item?.profile_id ?? item?.id ?? null,
    name: item?.name ?? '',
    username: item?.username ?? '',
    password: item?.password ?? '',
    new_password: item?.new_password ?? item?.newPassword ?? '',
    tfa_secret: item?.tfa_secret ?? item?.tfaSecret ?? '',
    proxy_ip: item?.proxy_ip ?? item?.proxy ?? '',
    proxy_type: item?.proxy_type ?? item?.proxyType ?? '',
    isLoginAction: false,
    isChangeInfo: false,
    isError: false,
    errorInfo: '',
    isProxyErr: false,
    isCaptchaErr: false,
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

  const devServerUrl =
    process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173/';

  if (!app.isPackaged) {
    win.loadURL(devServerUrl);
  } else {
    const indexPath = path.join(
      app.getAppPath(), // trỏ thẳng vào app.asar
      'dist',
      'index.html'
    );

    console.log('📦 Load index từ:', indexPath);

    if (!fs.existsSync(indexPath)) {
      console.error('❌ Không tìm thấy dist/index.html:', indexPath);
    }

    win.loadFile(indexPath);
  }
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
    const errors: ErrorDetail[] = [];
    const startTime = Date.now();

    // 2. Chạy vòng lặp xử lý từng profile
    for (const profile of profiles) {
      console.log(`🔄 Đang xử lý: ${profile.name} (ID: ${profile.profile_id})`);
      let browser: Browser | null = null;
      let loginSuccess = false;
      let changeSuccess = false;
      let profileHadError = false;
      let firstErrorMsg = '';
      let isProxyErr = false;
      let isCaptchaErr = false;

      const markErrFlags = (code?: string) => {
        if (code === 'NETWORK') isProxyErr = true;
        if (code === 'ROBOT') isCaptchaErr = true;
      };

      const markCache = () => {
        updateCacheProfile(cachedProfiles, profile.profile_id, {
          isLoginAction: loginSuccess,
          isChangeInfo: changeSuccess,
          isError: profileHadError,
          errorInfo: firstErrorMsg,
          isProxyErr,
          isCaptchaErr,
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
          firstErrorMsg = firstErrorMsg || errorMsg;
          markCache();
          continue;
        }

        // Mở trình duyệt qua ixBrowser API (timeout + retry nhẹ)
        let openRes: any;
        try {
          openRes = await axios.post(
            `${IX_API_BASE}/api/v2/profile-open`,
            { profile_id: profile.profile_id },
            { timeout: 15000 }
          );
        } catch (err: any) {
          const errorMsg = `Không thể mở profile (network/timeout): ${
            err?.message || ''
          }`;
          errors.push({
            profileId: profile.profile_id,
            profileName: profile.name,
            action: 'profile-open',
            error: errorMsg,
            errCode: 'PROFILE_OPEN_NETWORK',
            timestamp: new Date().toISOString(),
          });
          profileHadError = true;
          firstErrorMsg = firstErrorMsg || errorMsg;
          markCache();
          continue;
        }

        console.log(openRes, 'Phản hồi mở profile từ ixBrowser API');
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
            firstErrorMsg = firstErrorMsg || errorMsg;
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

          console.log(profile);
          console.log(
            `📍 Đang điều hướng profile ${profile.name} tới Gmail...`
          );

          // Thao tác tự động
          await gotoWithRetry(page, 'https://accounts.google.com/');

          console.log(data, 'Dữ liệu nhận từ Renderer');

          // ĐĂNG NHẬP
          if (data.isAutoLogin) {
            try {
              await handleAutoLogin(page, profile);
              console.log(`✅ Đăng nhập thành công cho: ${profile.name}`);
              loginSuccess = true;
            } catch (loginError: any) {
              const errorMsg =
                loginError.message || 'Lỗi đăng nhập không xác định';
              console.error(`❌ Lỗi đăng nhập cho ${profile.name}:`, errorMsg);
              const errCode = loginError?.errCode || 'LOGIN_FAILED';
              profileHadError = true;
              firstErrorMsg = firstErrorMsg || errorMsg;
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
          if (data.isAutoChange) {
            changeSuccess = true;
            //Tải backup code
            try {
              await handleDownloadBackUpCode(page, profile);
              console.log(`✅ Tải backup code thành công cho: ${profile.name}`);
            } catch (backupError: any) {
              const errorMsg =
                backupError.message || 'Lỗi tải backup code không xác định';
              console.error(
                `❌ Lỗi tải backup code cho ${profile.name}:`,
                errorMsg
              );
              const errCode = backupError?.errCode || 'BACKUP_DOWNLOAD_FAILED';
              changeSuccess = false;
              profileHadError = true;
              firstErrorMsg = firstErrorMsg || errorMsg;
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
            // // XOÁ SỐ ĐIỆN THOẠI
            try {
              await handleAutoChangePhone(page, profile);
              console.log(
                `✅ Xóa số điện thoại thành công cho: ${profile.name}`
              );
            } catch (phoneError: any) {
              const errorMsg =
                phoneError.message || 'Lỗi xóa số điện thoại không xác định';
              console.error(
                `❌ Lỗi xóa số điện thoại cho ${profile.name}:`,
                errorMsg
              );
              const errCode = phoneError?.errCode || 'PHONE_CHANGE_FAILED';
              changeSuccess = false;
              profileHadError = true;
              firstErrorMsg = firstErrorMsg || errorMsg;
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
            // // THAY ĐỔI EMAIL
            try {
              await handleAutoChangeEmail(page, profile);
              console.log(`✅ Thay đổi email thành công cho: ${profile.name}`);
            } catch (emailError: any) {
              const errorMsg =
                emailError.message || 'Lỗi thay đổi email không xác định';
              console.error(
                `❌ Lỗi thay đổi email cho ${profile.name}:`,
                errorMsg
              );
              const errCode = emailError?.errCode || 'EMAIL_CHANGE_FAILED';
              changeSuccess = false;
              profileHadError = true;
              firstErrorMsg = firstErrorMsg || errorMsg;
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
            // // THAY ĐỔI MẬT KHẨU
            try {
              await handleAutoChangePassword(page, profile);
              console.log(
                `✅ Thay đổi mật khẩu thành công cho: ${profile.name}`
              );
            } catch (pwdError: any) {
              const errorMsg =
                pwdError.message || 'Lỗi thay đổi mật khẩu không xác định';
              console.error(
                `❌ Lỗi thay đổi mật khẩu cho ${profile.name}:`,
                errorMsg
              );
              const errCode = pwdError?.errCode || 'PASSWORD_CHANGE_FAILED';
              changeSuccess = false;
              profileHadError = true;
              firstErrorMsg = firstErrorMsg || errorMsg;
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

          // Cập nhật cache sau khi hoàn tất profile (trường hợp thành công)
          markCache();
          console.log(`✅ Hoàn tất thao tác cho profile: ${profile.name}`);
        } else {
          const errorMsg = `Không thể mở profile: ${
            openRes?.data?.error?.message ||
            openRes?.data?.message ||
            'Không rõ lỗi'
          }`;
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
          firstErrorMsg = firstErrorMsg || errorMsg;
          markCache();
        }
      } catch (profileError: any) {
        // Catch lỗi xảy ra trong xử lý từng profile
        const errorMsg =
          profileError.message || 'Lỗi xử lý profile không xác định';
        console.error(`❌ Lỗi xử lý profile ${profile.name}:`, errorMsg);
        const errCode = profileError?.errCode || 'PROFILE_GENERAL_ERROR';
        profileHadError = true;
        firstErrorMsg = firstErrorMsg || errorMsg;
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
      } finally {
        // Đóng trình duyệt và giải phóng profile qua ixBrowser
        await closeProfileSession(browser, profile);

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
    let logFilePath: string | undefined;
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
    } as LaunchProfileResult;
  } catch (error: any) {
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
    // Chỉ normalize dữ liệu mới từ API trước khi merge
    const freshProfiles = normalizeProfiles(apiPayload?.data?.data || []);
    const mergedProfiles = mergeProfileCache(cachedProfiles, freshProfiles);

    // Ghi cache nếu chưa có hoặc có dữ liệu mới
    const hasNewProfiles = mergedProfiles.length > cachedProfiles.length;

    if (hasNewProfiles || !fs.existsSync(PROFILE_CACHE_PATH())) {
      writeProfileCache(mergedProfiles);
    }

    // Luôn trả về dữ liệu đọc từ cache để đảm bảo đồng nhất với những gì đã lưu
    const responseProfiles = fs.existsSync(PROFILE_CACHE_PATH())
      ? readProfileCache()
      : mergedProfiles;

    return {
      data: { data: responseProfiles },
      error: { code: 0, message: 'OK (cache)' },
      fromCache: true,
    };
  } catch (error: any) {
    console.error(
      '⚠️ Lỗi khi lấy danh sách hồ sơ, fallback dữ liệu cache:',
      error?.message || error
    );

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
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
