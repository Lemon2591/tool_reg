import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { handleAutoLogin, handleAutoChange } from './service.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IX_API_BASE = 'http://127.0.0.1:53200';
function createWindow() {
    const win = new BrowserWindow({
        fullscreen: true,
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
        // 1. Lấy danh sách từ ixBrowser
        const listRes = await axios.post(`${IX_API_BASE}/api/v2/profile-list`, {
            profile_id: 0,
            page: 1,
            limit: 20,
        });
        if (!listRes.data?.data || listRes.data.error.code !== 0) {
            throw new Error(`Lỗi lấy danh sách: ${listRes.data?.message}`);
        }
        const profiles = listRes.data.data.data;
        // 2. Chạy vòng lặp xử lý từng profile
        for (const profile of profiles) {
            console.log(`Đang xử lý: ${profile.name} (ID: ${profile.profile_id})`);
            // Mở trình duyệt qua ixBrowser API
            const openRes = await axios.post(`${IX_API_BASE}/api/v2/profile-open`, {
                profile_id: profile.profile_id,
            });
            if (openRes?.data?.error?.code === 0) {
                const debugUrl = openRes.data.data.debugging_address;
                // Kết nối Puppeteer
                const browser = await puppeteer.connect({
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
                console.log(`Đang điều hướng profile ${profile.name} tới Gmail...`);
                // Thao tác tự động
                await page.goto('https://accounts.google.com/', {
                    waitUntil: 'networkidle2',
                    timeout: 60000,
                });
                console.log(data, 'Dữ liệu nhận từ Renderer');
                if (data.isAutoLogin) {
                    await handleAutoLogin(page, profile);
                }
                if (data.isAutoChange) {
                    await handleAutoChange(page, profile);
                }
                // Đợi một chút để xem kết quả trước khi đóng
                console.log(`Hoàn thành thao tác cho profile: ${profile.name}`);
                // Chỉ ngắt kết nối điều khiển, đóng trình duyệt
                // await browser.close();
            }
            else {
                console.error(`Không thể mở profile ${profile.name}: ${openRes.data.message}`);
            }
        }
        return { success: true };
    }
    catch (error) {
        console.error('Lỗi chi tiết trong Main:', error);
        return { success: false, error: error.message };
    }
});
// Khởi tạo App
app.whenReady().then(() => {
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
