import { generate } from 'otplib';
/**
 * Hàm tạo mật khẩu ngẫu nhiên bảo mật
 * @param length Độ dài mật khẩu (mặc định 12 ký tự)
 * @returns Chuỗi mật khẩu ngẫu nhiên
 */
export const generateRandomPassword = (length = 12) => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|';
    // Đảm bảo mật khẩu có ít nhất 1 ký tự từ mỗi nhóm để vượt qua kiểm tra của Google
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    // Tạo các ký tự còn lại
    for (let i = password.length; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * allChars.length);
        password += allChars[randomIndex];
    }
    // Trộn (shuffle) lại chuỗi để các ký tự bắt buộc không luôn nằm ở đầu
    return password
        .split('')
        .sort(() => 0.5 - Math.random())
        .join('');
};
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Kiểm tra xem có phải lỗi mạng không
 */
function isNetworkError(error) {
    const message = error.message.toLowerCase();
    return (message.includes('err_tunnel_connection_failed') ||
        message.includes('err_connection') ||
        message.includes('econnrefused') ||
        message.includes('timeout') ||
        message.includes('net::') ||
        message.includes('protocol error'));
}
/**
 * Goto URL với retry logic cho lỗi mạng
 * @param page Puppeteer page
 * @param url URL cần navigate tới
 * @param retries Số lần retry (mặc định 3)
 * @throws Error nếu tất cả retry đều thất bại
 */
export async function gotoWithRetry(page, url, retries = 3) {
    let lastError = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`📍 Attempt ${attempt}/${retries}: Navigate to ${url}`);
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 60000, // Tăng timeout lên 60s
            });
            console.log(`✅ Navigate thành công`);
            return;
        }
        catch (error) {
            lastError = error;
            console.error(`❌ Attempt ${attempt} failed:`, lastError.message);
            if (!isNetworkError(lastError)) {
                // Không phải lỗi mạng, throw ngay
                throw lastError;
            }
            if (attempt < retries) {
                // Đợi trước khi retry
                const waitTime = 3000 * attempt; // 3s, 6s, 9s
                console.log(`⏳ Chờ ${waitTime}ms trước khi retry...`);
                await delay(waitTime);
            }
        }
    }
    // Tất cả retry thất bại
    throw new Error(`Không thể navigate tới ${url} sau ${retries} lần thử. Lỗi: ${lastError?.message}`);
}
/**
 * Phát hiện trang yêu cầu xác nhận robot ("Confirm you're not a robot")
 * @param page Puppeteer page
 * @param timeout Thời gian chờ tìm selector (ms)
 * @returns true nếu phát hiện; false nếu không hoặc lỗi
 */
async function isRobotChallengePresent(page) {
    console.log('Đang rình xem có reCAPTCHA hiện lên không (đợi tối đa 15s)...');
    try {
        // 1. Đợi cho đến khi một trong hai dấu hiệu xuất hiện:
        // - Text "Confirm you’re not a robot"
        // - Hoặc Iframe có title="reCAPTCHA"
        const isDetected = await page
            .waitForFunction(() => {
            const hasText = document.body.innerText.includes('Confirm you’re not a robot') ||
                document.body.innerText.includes('Xác nhận bạn không phải là robot');
            const hasIframe = !!document.querySelector('iframe[title="reCAPTCHA"]') ||
                !!document.querySelector('iframe[src*="recaptcha"]');
            return hasText || hasIframe;
        }, { timeout: 15000 })
            .then(() => true)
            .catch(() => false);
        if (isDetected) {
            console.log('⚠️ Đã xác nhận: Màn hình Robot Challenge hiện diện.');
            return true;
        }
        console.log('✅ Không thấy Robot Challenge sau 15s.');
        return false;
    }
    catch (error) {
        return false;
    }
}
/**
 * Điền mã 2FA nếu có
 * @param page Puppeteer page object
 * @param profile Profile chứa tfa_secret
 * @returns true nếu điền 2FA thành công, false nếu không có 2FA
 * @throws Error nếu có 2FA nhưng không thể hoàn thành
 */
export const typing2FA = async (page, profile) => {
    if (!page || typeof page.waitForSelector !== 'function') {
        throw new Error('Invalid page object provided to typing2FA');
    }
    if (!profile) {
        throw new Error('Profile is required for typing2FA');
    }
    const otpInputSelector = 'input[type="tel"], #totpPin, input[name="totpPin"]';
    try {
        const is2FAPage = await page.waitForSelector(otpInputSelector, {
            visible: true,
            timeout: 7000,
        });
        if (is2FAPage === null) {
            // Không có 2FA
            return false;
        }
        await is2FAPage.click();
        console.log('✅ Phát hiện trang 2FA. Đang tiến hành giải mã...');
        const secretKey = profile.tfa_secret?.trim();
        if (!secretKey) {
            throw new Error('Cần 2FA nhưng profile.tfa_secret không tồn tại hoặc rỗng');
        }
        const token = await generate({
            secret: secretKey.replace(/\s/g, ''),
        });
        await typeLikeHuman(page, otpInputSelector, token);
        await page.keyboard.press('Enter');
        console.log(`✅ Đã điền mã 2FA: ${token}`);
        // Chờ trang load sau khi điền 2FA
        try {
            await page.waitForNavigation({
                waitUntil: 'networkidle2',
                timeout: 300000,
            });
        }
        catch (navError) {
            throw new Error(`Navigation sau khi điền 2FA thất bại: ${navError.message}`);
        }
        return true;
    }
    catch (error) {
        // Chỉ ẩn error nếu thực sự là timeout (không có 2FA)
        if (error.message.includes('waiting for selector') ||
            error.message.includes('Timeout')) {
            return false;
        }
        // Re-throw nếu là lỗi khác
        throw error;
    }
};
/**
 * Nhập text vào input giống như con người
 * @param page Puppeteer page object
 * @param selector CSS selector của input
 * @param text Text cần nhập
 * @throws Error nếu selector không tồn tại hoặc nhập thất bại
 */
export const typeLikeHuman = async (page, selector, text) => {
    if (!page || typeof page.waitForSelector !== 'function') {
        throw new Error('Invalid page object provided to typeLikeHuman');
    }
    if (!selector || typeof selector !== 'string') {
        throw new Error('Selector must be a non-empty string');
    }
    if (text === undefined || text === null) {
        throw new Error('Text is required for typeLikeHuman');
    }
    try {
        await page.waitForSelector(selector, { visible: true, timeout: 5000 });
    }
    catch (error) {
        throw new Error(`Selector not found: "${selector}" - ${error.message}`);
    }
    try {
        await page.focus(selector);
    }
    catch (error) {
        throw new Error(`Cannot focus on selector "${selector}" - ${error.message}`);
    }
    for (const char of text) {
        try {
            await page.keyboard.sendCharacter(char);
        }
        catch (error) {
            throw new Error(`Cannot send character "${char}" to selector "${selector}" - ${error.message}`);
        }
        await delay(Math.floor(Math.random() * 100) + 50);
    }
};
/**
 * Đăng nhập tự động vào Google Account
 * @param page Puppeteer page object
 * @param profile Profile chứa username, password, tfa_secret
 * @throws Error nếu đăng nhập thất bại
 */
export const handleAutoLogin = async (page, profile) => {
    if (!page || typeof page.url !== 'function') {
        throw new Error('Invalid page object provided to handleAutoLogin');
    }
    if (!profile) {
        throw new Error('Profile is required for handleAutoLogin');
    }
    if (!profile.username) {
        throw new Error('profile.username is required');
    }
    // Ghi đè password
    const currentUrl = page.url();
    const isLoggedIn = currentUrl.includes('myaccount.google.com') &&
        !currentUrl.includes('signin');
    if (isLoggedIn) {
        console.log('✅ Đã đăng nhập sẵn. Bỏ qua bước login.');
        return;
    }
    try {
        // Nhập email
        console.log('📧 Đang nhập email...');
        await typeLikeHuman(page, 'input[type="email"]', profile.username);
        await page.click('#identifierNext');
        // Chờ trang mật khẩu load
        await delay(10000);
        const hasRobotAfterEmail = await isRobotChallengePresent(page);
        if (hasRobotAfterEmail) {
            throw new Error('Lỗi robot: yêu cầu xác minh người dùng.');
        }
        // Kiểm tra và nhập mật khẩu
        try {
            await page.waitForSelector('input[type="password"]', {
                visible: true,
                timeout: 7000,
            });
            console.log('🔑 Đang nhập mật khẩu...');
            console.log(profile.password, 'Mật khẩu sắp điền');
            await typeLikeHuman(page, 'input[type="password"]', profile.password);
            await page.click('#passwordNext');
        }
        catch (pwdError) {
            throw new Error(`Không tìm thấy ô nhập mật khẩu - ${pwdError.message}`);
        }
        await delay(5000);
        // Xử lý 2FA nếu có
        const has2FA = await typing2FA(page, profile);
        if (has2FA) {
            console.log('✅ Đã hoàn thành đăng nhập với 2FA');
        }
        else {
            console.log('✅ Đã hoàn thành đăng nhập (không có 2FA)');
        }
    }
    catch (error) {
        throw new Error(`handleAutoLogin thất bại: ${error.message}`);
    }
};
/**
 * Xóa số điện thoại khôi phục từ Google Account
 * @param page Puppeteer page object
 * @param profile Profile chứa username, password, tfa_secret
 * @throws Error nếu xóa thất bại
 */
export const handleAutoChangePhone = async (page, profile) => {
    if (!page || typeof page.goto !== 'function') {
        throw new Error('Invalid page object provided to handleAutoChangePhone');
    }
    if (!profile) {
        throw new Error('Profile is required for handleAutoChangePhone');
    }
    if (!profile.username) {
        throw new Error('profile.username is required');
    }
    console.log(`--- Bắt đầu quy trình xóa số điện thoại cho: ${profile.username} ---`);
    try {
        // 1. Chuyển hướng thẳng tới trang Security (với retry cho lỗi mạng)
        try {
            await gotoWithRetry(page, 'https://myaccount.google.com/security');
        }
        catch (gotoError) {
            const errorMsg = gotoError.message;
            if (isNetworkError(gotoError)) {
                // Lỗi mạng - bỏ qua action này
                console.warn(`⚠️  Lỗi mạng khi navigate tới Security: ${errorMsg}. Bỏ qua xóa số điện thoại.`);
                return;
            }
            // Lỗi khác - throw
            throw new Error(`Không thể navigate tới trang Security: ${errorMsg}`);
        }
        // 2. Tìm và click vào mục "Recovery phone"
        const recoveryPhoneSelector = 'a[href*="signinoptions/rescuephone"]';
        console.log('🔍 Đang tìm mục Recovery Phone...');
        try {
            await page.waitForSelector(recoveryPhoneSelector, {
                visible: true,
                timeout: 10000,
            });
        }
        catch (selectorError) {
            throw new Error(`Không tìm thấy Recovery Phone link: ${selectorError.message}`);
        }
        // Click để vào trang quản lý số điện thoại
        try {
            await page.click(recoveryPhoneSelector);
        }
        catch (clickError) {
            throw new Error(`Không thể click vào Recovery Phone: ${clickError.message}`);
        }
        // Đợi trang load
        try {
            await page.waitForFunction(() => {
                const pwdInput = document.querySelector('input[type="password"]');
                const deleteBtn = document.querySelector('button[aria-label*="Delete"], button[aria-label*="Xóa"], [data-item-id="address"]');
                return ((pwdInput && pwdInput.getBoundingClientRect().width > 0) ||
                    deleteBtn);
            }, { timeout: 45000 });
        }
        catch (waitError) {
            throw new Error(`Timeout chờ password input hoặc delete button: ${waitError.message}`);
        }
        // 3. XỬ LÝ RE-AUTHENTICATION
        console.log('🔒 Kiểm tra re-authentication...');
        if (page.url().includes('v3/signin/challenge/pwd')) {
            console.log('🔑 Google yêu cầu xác minh lại mật khẩu...');
            await delay(2000);
            try {
                await typeLikeHuman(page, 'input[type="password"]', profile.password);
            }
            catch (typingError) {
                throw new Error(`Không thể nhập mật khẩu re-auth: ${typingError.message}`);
            }
            await page.keyboard.press('Enter');
            try {
                await page.waitForNavigation({
                    waitUntil: 'networkidle2',
                    timeout: 30000,
                });
            }
            catch (navError) {
                throw new Error(`Navigation sau re-auth thất bại: ${navError.message}`);
            }
            await delay(5000);
            try {
                await typing2FA(page, profile);
            }
            catch (twoFAError) {
                throw new Error(`2FA validation thất bại: ${twoFAError.message}`);
            }
        }
        // 4. THỰC HIỆN XOÁ SỐ ĐIỆN THOẠI
        console.log('🗑️  Đang tìm nút xóa số điện thoại...');
        const deleteBtnSelector = 'button[aria-label*="Delete"], button[aria-label*="Xóa"], button[aria-label="Remove phone number"]';
        try {
            await page.waitForSelector(deleteBtnSelector, {
                visible: true,
                timeout: 10000,
            });
        }
        catch (deleteError) {
            console.log('⚠️  Không tìm thấy nút xóa số - có thể không có số điện thoại khôi phục. Bỏ qua bước này.');
            return;
        }
        try {
            await page.click(deleteBtnSelector);
        }
        catch (clickDeleteError) {
            throw new Error(`Không thể click nút xóa: ${clickDeleteError.message}`);
        }
        // 5. XÁC NHẬN XOÁ (Confirm Dialog)
        console.log('⏳ Đang chờ nút xác nhận xóa...');
        try {
            await page.waitForFunction(() => {
                const elements = Array.from(document.querySelectorAll('span.snByac, div[role="button"]'));
                return elements.some((el) => el.textContent?.includes('Remove number') ||
                    el.textContent?.includes('Xóa số'));
            }, { timeout: 10000 });
        }
        catch (confirmWaitError) {
            throw new Error(`Timeout chờ nút xác nhận: ${confirmWaitError.message}`);
        }
        // Click nút xác nhận
        const confirmClicked = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('span.snByac, div[role="button"]'));
            const target = elements.find((el) => el.textContent?.includes('Remove number') ||
                el.textContent?.includes('Xóa số'));
            if (target) {
                const button = target.closest('div[role="button"]') || target;
                button.click();
                return true;
            }
            return false;
        });
        if (!confirmClicked) {
            throw new Error('Không tìm thấy nút xác nhận xóa');
        }
        console.log('✅ Đã xác nhận xóa số điện thoại thành công.');
    }
    catch (error) {
        throw new Error(`handleAutoChangePhone thất bại: ${error.message}`);
    }
};
/**
 * Thay đổi email khôi phục của Google Account
 * @param page Puppeteer page object
 * @param profile Profile chứa username, password, tfa_secret
 * @throws Error nếu thay đổi thất bại
 */
export const handleAutoChangeEmail = async (page, profile) => {
    if (!page || typeof page.goto !== 'function') {
        throw new Error('Invalid page object provided to handleAutoChangeEmail');
    }
    if (!profile) {
        throw new Error('Profile is required for handleAutoChangeEmail');
    }
    if (!profile.username) {
        throw new Error('profile.username is required');
    }
    console.log(`--- Bắt đầu quy trình thay đổi email khôi phục cho: ${profile.username} ---`);
    try {
        // 1. Vào trang Security tổng quát
        try {
            await gotoWithRetry(page, 'https://myaccount.google.com/security');
        }
        catch (gotoError) {
            const errorMsg = gotoError.message;
            if (isNetworkError(gotoError)) {
                // Lỗi mạng - bỏ qua action này
                console.warn(`⚠️  Lỗi mạng khi navigate tới Security: ${errorMsg}. Bỏ qua thay đổi email.`);
                return;
            }
            // Lỗi khác - throw
            throw new Error(`Không thể navigate tới trang Security: ${errorMsg}`);
        }
        // 2. Tìm thẻ <a> dẫn đến trang quản lý Email khôi phục
        const recoveryEmailSelector = 'a[href*="recovery/email"]';
        console.log('🔍 Đang tìm Recovery Email link...');
        try {
            await Promise.all([
                page.click(recoveryEmailSelector),
                page.waitForNavigation({
                    waitUntil: 'networkidle2',
                    timeout: 60000,
                }),
            ]);
        }
        catch (emailNavError) {
            throw new Error(`Không thể navigate tới Recovery Email: ${emailNavError.message}`);
        }
        // --- BƯỚC 1: KIỂM TRA MẬT KHẨU ---
        console.log('🔑 Kiểm tra màn hình nhập mật khẩu...');
        const passwordInput = await page
            .waitForSelector('input[type="password"]', {
            visible: true,
            timeout: 5000,
        })
            .catch(() => null);
        if (passwordInput) {
            console.log('==> Phát hiện màn hình nhập mật khẩu.');
            try {
                await typeLikeHuman(page, 'input[type="password"]', profile.password);
            }
            catch (typingError) {
                throw new Error(`Không thể nhập password: ${typingError.message}`);
            }
            try {
                await Promise.all([
                    page.keyboard.press('Enter'),
                    page.waitForNavigation({
                        waitUntil: 'networkidle2',
                        timeout: 30000,
                    }),
                ]);
            }
            catch (navError) {
                throw new Error(`Navigation sau password thất bại: ${navError.message}`);
            }
            await delay(2000);
        }
        // --- BƯỚC 2: KIỂM TRA 2FA ---
        console.log('🔒 Kiểm tra 2FA...');
        try {
            const has2FA = await typing2FA(page, profile);
            if (has2FA) {
                console.log('✅ 2FA đã được xử lý');
            }
        }
        catch (twoFAError) {
            throw new Error(`2FA validation thất bại: ${twoFAError.message}`);
        }
        // --- BƯỚC 3: KIỂM TRA MÀN HÌNH CUỐI ---
        console.log('⏳ Đang chờ nút Edit recovery email...');
        try {
            await page.waitForFunction(() => {
                const editBtn = document.querySelector('button[aria-label*="Edit recovery email"], button[aria-label*="Chỉnh sửa email"]');
                return editBtn && editBtn.offsetWidth > 0;
            }, { timeout: 15000 });
        }
        catch (editBtnError) {
            throw new Error(`Không tìm thấy nút Edit recovery email: ${editBtnError.message}`);
        }
        // Click nút Edit
        const editClicked = await page.evaluate(() => {
            const editBtn = document.querySelector('button[aria-label*="Edit recovery email"], button[aria-label*="Chỉnh sửa email"]');
            if (editBtn) {
                editBtn.click();
                return true;
            }
            return false;
        });
        if (!editClicked) {
            throw new Error('Không thể click nút Edit recovery email');
        }
        console.log('✅ Đã click vào nút thay đổi Email.');
        // Đợi màn hình nhập Email mới hiện ra
        const emailInputSelector = 'input[type="email"][jsname="YPqjbf"]';
        const newDomain = '@trandaimkt.com';
        try {
            await page.waitForFunction((selector) => {
                const input = document.querySelector(selector);
                return input && input.offsetWidth > 0;
            }, { timeout: 15000 }, emailInputSelector);
        }
        catch (emailInputError) {
            throw new Error(`Không tìm thấy input email: ${emailInputError.message}`);
        }
        const username = profile.username.split('@')[0];
        const newEmail = username + newDomain;
        // Focus và xóa sạch ô input
        try {
            await page.focus(emailInputSelector);
            await page.click(emailInputSelector, { clickCount: 3 });
            await page.keyboard.press('Backspace');
            const currentVal = await page.$eval(emailInputSelector, (el) => el.value);
            if (currentVal !== '') {
                await page.keyboard.down('Control');
                await page.keyboard.press('A');
                await page.keyboard.up('Control');
                await page.keyboard.press('Backspace');
            }
        }
        catch (focusError) {
            throw new Error(`Không thể focus/clear email input: ${focusError.message}`);
        }
        // Nhập email mới
        try {
            await typeLikeHuman(page, emailInputSelector, newEmail);
        }
        catch (typingError) {
            throw new Error(`Không thể nhập email mới: ${typingError.message}`);
        }
        const saveBtnSelector = 'button[aria-label="Save your recovery email."], button[data-mdc-dialog-action="ok"]';
        // Click vào nút Save
        console.log('💾 Đang click nút Save...');
        const saveClicked = await page.evaluate((sel) => {
            const btn = document.querySelector(sel);
            if (btn) {
                btn.click();
                return true;
            }
            // Backup: Tìm theo text "Save"
            const allButtons = Array.from(document.querySelectorAll('button'));
            const backupBtn = allButtons.find((b) => b.innerText.includes('Save') || b.innerText.includes('Lưu'));
            if (backupBtn) {
                backupBtn.click();
                return true;
            }
            return false;
        }, saveBtnSelector);
        if (!saveClicked) {
            throw new Error('Không tìm thấy nút Save để click');
        }
        console.log('✅ Đã click nút Save thành công.');
        try {
            const cancelBtnSelector = 'button[data-mdc-dialog-action="cancel"]';
            try {
                await page.waitForFunction((sel) => {
                    const btn = document.querySelector(sel);
                    return btn && btn.offsetWidth > 0 && btn.offsetHeight > 0;
                }, { timeout: 10000 }, cancelBtnSelector);
            }
            catch (cancelWaitError) {
                throw new Error(`Không tìm thấy nút Cancel: ${cancelWaitError.message}`);
            }
            // Click nút Cancel
            console.log('❌ Đang click nút Cancel...');
            const cancelClicked = await page.evaluate((sel) => {
                const btn = document.querySelector(sel);
                if (btn) {
                    btn.click();
                    return true;
                }
                const allButtons = Array.from(document.querySelectorAll('button'));
                const backupBtn = allButtons.find((b) => b.innerText.includes('Cancel') || b.innerText.includes('Hủy'));
                if (backupBtn) {
                    backupBtn.click();
                    return true;
                }
                return false;
            }, cancelBtnSelector);
            if (!cancelClicked) {
                throw new Error('Không tìm thấy hoặc không thể click nút Cancel');
            }
            console.log('✅ Đã nhấn nút Cancel thành công.');
            await delay(2000);
        }
        catch (dialogError) {
            throw new Error(`Lỗi xử lý dialog: ${dialogError.message}`);
        }
        console.log('✅ Đã hoàn thành thay đổi email khôi phục.');
    }
    catch (error) {
        throw new Error(`handleAutoChangeEmail thất bại: ${error.message}`);
    }
};
/**
 * Thay đổi mật khẩu của Google Account
 * @param page Puppeteer page object
 * @param profile Profile chứa username, password, tfa_secret
 * @throws Error nếu thay đổi thất bại
 */
export const handleAutoChangePassword = async (page, profile) => {
    if (!page || typeof page.goto !== 'function') {
        throw new Error('Invalid page object provided to handleAutoChangePassword');
    }
    if (!profile) {
        throw new Error('Profile is required for handleAutoChangePassword');
    }
    if (!profile.username) {
        throw new Error('profile.username is required');
    }
    try {
        // 1. Truy cập trang Security
        console.log('🔒 Đang navigate tới trang Security...');
        try {
            await gotoWithRetry(page, 'https://myaccount.google.com/security');
        }
        catch (gotoError) {
            const errorMsg = gotoError.message;
            if (isNetworkError(gotoError)) {
                // Lỗi mạng - bỏ qua action này
                console.warn(`⚠️  Lỗi mạng khi navigate tới Security: ${errorMsg}. Bỏ qua thay đổi mật khẩu.`);
                return;
            }
            // Lỗi khác - throw
            throw new Error(`Không thể navigate tới Security: ${errorMsg}`);
        }
        // 2. Tìm mục Password
        const passwordLinkSelector = 'a[href*="signinoptions/password"]';
        console.log('🔍 Đang tìm mục Password...');
        try {
            await page.waitForFunction((sel) => {
                const link = document.querySelector(sel);
                return link && link.offsetWidth > 0;
            }, { timeout: 15000 }, passwordLinkSelector);
        }
        catch (passwordLinkError) {
            throw new Error(`Không tìm thấy mục Password: ${passwordLinkError.message}`);
        }
        // 3. Click để vào trang đổi mật khẩu
        console.log('🔑 Đang click vào mục Password...');
        try {
            await Promise.all([
                page.click(passwordLinkSelector),
                page.waitForNavigation({
                    waitUntil: 'networkidle2',
                    timeout: 30000,
                }),
            ]);
        }
        catch (navError) {
            throw new Error(`Navigation tới trang đổi mật khẩu thất bại: ${navError.message}`);
        }
        console.log('✅ Đã nhấn vào mục Password.');
        // BƯỚC 1: KIỂM TRA MẬT KHẨU RE-AUTHENTICATION
        console.log('🔑 Kiểm tra màn hình nhập mật khẩu...');
        const passwordInput = await page
            .waitForSelector('input[type="password"]', {
            visible: true,
            timeout: 5000,
        })
            .catch(() => null);
        if (passwordInput) {
            console.log('==> Phát hiện màn hình nhập mật khẩu.');
            try {
                await typeLikeHuman(page, 'input[type="password"]', profile.password);
            }
            catch (typingError) {
                throw new Error(`Không thể nhập password: ${typingError.message}`);
            }
            try {
                await Promise.all([
                    page.keyboard.press('Enter'),
                    page.waitForNavigation({
                        waitUntil: 'networkidle2',
                        timeout: 30000,
                    }),
                ]);
            }
            catch (navError) {
                throw new Error(`Navigation sau password thất bại: ${navError.message}`);
            }
            await delay(2000);
        }
        // BƯỚC 2: KIỂM TRA 2FA
        console.log('🔒 Kiểm tra 2FA...');
        try {
            const has2FA = await typing2FA(page, profile);
            if (has2FA) {
                console.log('✅ 2FA đã được xử lý');
            }
        }
        catch (twoFAError) {
            throw new Error(`2FA validation thất bại: ${twoFAError.message}`);
        }
        // BƯỚC 3: NHẬP MẬT KHẨU MỚI
        console.log('🔑 Chờ input mật khẩu mới...');
        const newPwdSelector = 'input[name="password"]';
        const confirmPwdSelector = 'input[name="confirmation_password"]';
        try {
            await page.waitForFunction((s1, s2) => {
                const p1 = document.querySelector(s1);
                const p2 = document.querySelector(s2);
                return p1 && p1.offsetWidth > 0 && p2 && p2.offsetWidth > 0;
            }, { timeout: 15000 }, newPwdSelector, confirmPwdSelector);
        }
        catch (inputsError) {
            throw new Error(`Không tìm thấy input mật khẩu mới: ${inputsError.message}`);
        }
        const newPass = generateRandomPassword();
        console.log(`📝 Mật khẩu mới: ${newPass}`);
        try {
            await page.focus(newPwdSelector);
            await typeLikeHuman(page, newPwdSelector, newPass);
            await delay(1000);
            await page.focus(confirmPwdSelector);
            await typeLikeHuman(page, confirmPwdSelector, newPass);
        }
        catch (typingError) {
            throw new Error(`Không thể nhập mật khẩu mới: ${typingError.message}`);
        }
        // BƯỚC 4: CLICK NÚT SUBMIT
        console.log('🖱️  Đang định vị nút xác nhận...');
        const TARGET_JSNAME = 'Pr7Yme';
        const VALID_TEXT_LOOKUP = [
            'Change password',
            'Đổi mật khẩu',
            'Thay đổi mật khẩu',
        ];
        const isClicked = await page.evaluate((jsname, validTexts) => {
            const buttons = Array.from(document.querySelectorAll(`button[jsname="${jsname}"]`));
            const correctBtn = buttons.find((btn) => {
                const htmlBtn = btn;
                const text = (htmlBtn.innerText || htmlBtn.textContent || '').trim();
                const isVisible = htmlBtn.offsetWidth > 0 && htmlBtn.offsetHeight > 0;
                const hasCorrectText = validTexts.some((t) => text.toLowerCase().includes(t.toLowerCase()));
                return isVisible && hasCorrectText;
            });
            if (correctBtn) {
                correctBtn.focus();
                correctBtn.click();
                return true;
            }
            return false;
        }, TARGET_JSNAME, VALID_TEXT_LOOKUP);
        if (!isClicked) {
            throw new Error('Không tìm thấy nút Change Password để click. Có thể UI thay đổi.');
        }
        console.log('✅ Đã click chính xác nút Change Password.');
    }
    catch (error) {
        throw new Error(`handleAutoChangePassword thất bại: ${error.message}`);
    }
};
/**
 * Tải mã backup của Google Account
 * @param page Puppeteer page object
 * @param profile Profile chứa username, password
 * @throws Error nếu tải backup code thất bại
 */
export const handleDownloadBackUpCode = async (page, profile) => {
    if (!page || typeof page.goto !== 'function') {
        throw new Error('Invalid page object provided to handleDownloadBackUpCode');
    }
    if (!profile) {
        throw new Error('Profile is required for handleDownloadBackUpCode');
    }
    if (!profile.username) {
        throw new Error('profile.username is required');
    }
    if (!profile.password) {
        throw new Error('profile.password is required for handleDownloadBackUpCode');
    }
    console.log(`--- Bắt đầu quy trình tải mã backup cho: ${profile.username} ---`);
    try {
        // 1. Vào trang Security
        console.log('🔒 Đang navigate tới trang Security...');
        try {
            await gotoWithRetry(page, 'https://myaccount.google.com/security');
        }
        catch (gotoError) {
            const errorMsg = gotoError.message;
            if (isNetworkError(gotoError)) {
                console.warn(`⚠️  Lỗi mạng khi navigate tới Security: ${errorMsg}. Bỏ qua tải backup code.`);
                return;
            }
            throw new Error(`Không thể navigate tới trang Security: ${errorMsg}`);
        }
        // 2. Tìm và click link Backup Codes
        const backupLinkSelector = 'a[href*="backup-codes"]';
        console.log('🔍 Đang tìm link Backup Codes...');
        try {
            await page.waitForSelector(backupLinkSelector, {
                visible: true,
                timeout: 10000,
            });
        }
        catch (selectorError) {
            throw new Error(`Không tìm thấy link Backup Codes: ${selectorError.message}`);
        }
        try {
            await Promise.all([
                page.click(backupLinkSelector),
                page.waitForNavigation({
                    waitUntil: 'networkidle2',
                    timeout: 30000,
                }),
            ]);
        }
        catch (clickError) {
            throw new Error(`Navigation sau click Backup Codes thất bại: ${clickError.message}`);
        }
        console.log('✅ Đã click vào link Backup Codes.');
        // 3. KIỂM TRA MẬT KHẨU
        console.log('🔑 Kiểm tra màn hình nhập mật khẩu...');
        const passwordInput = await page.$('input[type="password"]');
        if (passwordInput) {
            console.log('==> Phát hiện cần nhập lại mật khẩu.');
            try {
                await typeLikeHuman(page, 'input[type="password"]', profile.password);
            }
            catch (typingError) {
                throw new Error(`Không thể nhập password: ${typingError.message}`);
            }
            try {
                await Promise.all([
                    page.keyboard.press('Enter'),
                    page.waitForNavigation({
                        waitUntil: 'networkidle2',
                        timeout: 30000,
                    }),
                ]);
            }
            catch (navError) {
                throw new Error(`Navigation sau password thất bại: ${navError.message}`);
            }
            await delay(2000);
        }
        // 4. KIỂM TRA 2FA
        console.log('🔒 Kiểm tra 2FA...');
        try {
            const has2FA = await typing2FA(page, profile);
            if (has2FA) {
                console.log('✅ 2FA đã được xử lý');
            }
        }
        catch (twoFAError) {
            throw new Error(`2FA validation thất bại: ${twoFAError.message}`);
        }
        // 5. CLICK NÚT "Get Backup Codes"
        console.log('⏳ Đang chờ nút "Get Backup Codes"...');
        try {
            await page.waitForFunction(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.some((btn) => {
                    const text = (btn.textContent || '').toLowerCase();
                    return ((text.includes('get backup codes') ||
                        text.includes('nhận mã dự phòng')) &&
                        btn.offsetWidth > 0 &&
                        btn.offsetHeight > 0);
                });
            }, { timeout: 15000 });
        }
        catch (waitError) {
            throw new Error(`Không tìm thấy nút "Get Backup Codes": ${waitError.message}`);
        }
        const getCodesClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const targetBtn = buttons.find((btn) => {
                const text = (btn.textContent || '').toLowerCase();
                return ((text.includes('get backup codes') ||
                    text.includes('nhận mã dự phòng')) &&
                    btn.offsetWidth > 0 &&
                    btn.offsetHeight > 0);
            });
            if (targetBtn) {
                targetBtn.click();
                return true;
            }
            return false;
        });
        if (!getCodesClicked) {
            throw new Error('Không thể click nút "Get Backup Codes"');
        }
        console.log('✅ Đã click nút "Get Backup Codes".');
        await delay(2000);
        // 6. CLICK NÚT "Download Codes"
        console.log('⏳ Đang chờ nút "Download Codes"...');
        try {
            await page.waitForFunction(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.some((btn) => {
                    const text = (btn.textContent || '').toLowerCase();
                    return ((text.includes('download') || text.includes('tải')) &&
                        btn.offsetWidth > 0 &&
                        btn.offsetHeight > 0);
                });
            }, { timeout: 15000 });
        }
        catch (downloadWaitError) {
            throw new Error(`Không tìm thấy nút "Download Codes": ${downloadWaitError.message}`);
        }
        const downloadClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const targetBtn = buttons.find((btn) => {
                const text = (btn.textContent || '').toLowerCase();
                return ((text.includes('download') || text.includes('tải')) &&
                    btn.offsetWidth > 0 &&
                    btn.offsetHeight > 0);
            });
            if (targetBtn) {
                targetBtn.click();
                return true;
            }
            return false;
        });
        if (!downloadClicked) {
            throw new Error('Không thể click nút "Download Codes"');
        }
        console.log('✅ Đã click nút "Download Codes".');
        await delay(2000);
        console.log('✅ Đã hoàn thành tải mã backup thành công.');
    }
    catch (error) {
        throw new Error(`handleDownloadBackUpCode thất bại: ${error.message}`);
    }
};
