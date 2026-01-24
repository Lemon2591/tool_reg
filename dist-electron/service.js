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
export const typing2FA = async (page, profile) => {
    // Chỉ đợi tối đa 5 giây, nếu không thấy ô nhập mã thì coi như không có 2FA
    const otpInputSelector = 'input[type="tel"], #totpPin, input[name="totpPin"]';
    try {
        const is2FAPage = await page.waitForSelector(otpInputSelector, {
            visible: true,
            timeout: 7000,
        });
        if (is2FAPage !== null) {
            await is2FAPage.click();
            console.log('Phát hiện trang 2FA. Đang tiến hành giải mã...');
            const secretKey = profile.tfa_secret; // Lấy từ dữ liệu của bạn
            if (secretKey && secretKey.trim() !== '') {
                const token = await generate({
                    secret: secretKey.replace(/\s/g, ''),
                });
                await typeLikeHuman(page, otpInputSelector, token);
                await page.keyboard.press('Enter');
                console.log(`Đã điền mã 2FA: ${token}`);
                // Chờ trang load sau khi điền 2FA
                await page
                    .waitForNavigation({
                    waitUntil: 'networkidle2',
                    timeout: 20000,
                })
                    .catch(() => { });
            }
            else {
                console.log('Cần 2FA nhưng Profile không có Secret Key!');
            }
        }
    }
    catch (error) {
        console.log('Không yêu cầu 2FA hoặc giao diện khác, bỏ qua bước này.');
    }
};
export const typeLikeHuman = async (page, selector, text) => {
    await page.waitForSelector(selector, { visible: true });
    await page.focus(selector);
    for (const char of text) {
        await page.keyboard.sendCharacter(char);
        await delay(Math.floor(Math.random() * 100) + 50); // Delay ngẫu nhiên giữa các phím
    }
};
export const handleAutoLogin = async (page, profile) => {
    profile.password = 'c0zI8K76NN&i';
    const currentUrl = page.url();
    const isLoggedIn = currentUrl.includes('myaccount.google.com') &&
        !currentUrl.includes('signin');
    if (isLoggedIn) {
        console.log('✅ Đã đăng nhập sẵn. Bỏ qua bước login.');
        return;
    }
    await typeLikeHuman(page, 'input[type="email"]', profile?.username);
    await page.click('#identifierNext');
    // await page.keyboard.press('Enter');
    // Chờ trang mật khẩu load
    await delay(10000);
    // 4. ĐIỀN MẬT KHẨU
    // Google load mật khẩu bằng Ajax nên cần chờ selector xuất hiện
    try {
        await page.waitForSelector('input[type="password"]', {
            visible: true,
            timeout: 7000,
        });
        console.log(`Đang điền mật khẩu...`);
        await typeLikeHuman(page, 'input[type="password"]', profile?.password);
        await page.click('#passwordNext');
    }
    catch (e) {
        console.log('Không thấy ô mật khẩu (có thể do Google bắt xác minh hoặc báo lỗi)');
    }
    await delay(5000);
    // Chỉ đợi tối đa 5 giây, nếu không thấy ô nhập mã thì coi như không có 2FA
    await typing2FA(page, profile);
};
export const handleAutoChangePhone = async (page, profile) => {
    console.log(`--- Bắt đầu quy trình xóa số điện thoại cho: ${profile?.username} ---`);
    try {
        // 1. Chuyển hướng thẳng tới trang Security
        await page.goto('https://myaccount.google.com/security', {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });
        // 2. Tìm và click vào mục "Recovery phone"
        // Selector này nhắm vào khu vực quản lý số điện thoại khôi phục
        const recoveryPhoneSelector = 'a[href*="signinoptions/rescuephone"]';
        console.log('Đang tìm mục Recovery Phone...');
        await page.waitForSelector(recoveryPhoneSelector, {
            visible: true,
            timeout: 10000,
        });
        // Click để vào trang quản lý số điện thoại
        await page.click(recoveryPhoneSelector);
        await page.waitForFunction(() => {
            const pwdInput = document.querySelector('input[type="password"]');
            const deleteBtn = document.querySelector('button[aria-label*="Delete"], button[aria-label*="Xóa"], [data-item-id="address"]');
            return ((pwdInput && pwdInput.getBoundingClientRect().width > 0) || deleteBtn);
        }, { timeout: 45000 } // Đợi tối đa 45s tùy tốc độ mạng/proxy
        );
        // 3. XỬ LÝ RE-AUTHENTICATION (Nếu Google yêu cầu nhập lại mật khẩu)
        console.log(page.url().includes('v3/signin/challenge/pwd'), 'Kiểm tra re-authentication...');
        if (page.url().includes('v3/signin/challenge/pwd')) {
            console.log('Google yêu cầu xác minh lại mật khẩu...');
            await delay(2000);
            await typeLikeHuman(page, 'input[type="password"]', profile?.password);
            await page.keyboard.press('Enter');
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            await delay(5000);
            // Chỉ đợi tối đa 5 giây, nếu không thấy ô nhập mã thì coi như không có 2FA
            await typing2FA(page, profile);
        }
        // // 4. THỰC HIỆN XOÁ SỐ ĐIỆN THOẠI
        // // Sau khi vào trang https://myaccount.google.com/signinoptions/rescuephone
        console.log('Đang tìm biểu tượng thùng rác để xóa số...');
        // // Selector cho biểu tượng thùng rác (thường nằm trong button)
        const deleteBtnSelector = 'button[aria-label*="Delete"], button[aria-label*="Xóa"], button[aria-label="Remove phone number"]';
        await page.waitForSelector(deleteBtnSelector, {
            visible: true,
            timeout: 10000,
        });
        await page.click(deleteBtnSelector);
        // 5. XÁC NHẬN XOÁ (Confirm Dialog)
        await page.waitForFunction(() => {
            const elements = Array.from(document.querySelectorAll('span.snByac, div[role="button"]'));
            console.log(elements, 'Kiểm tra nút xác nhận...');
            return elements.some((el) => el.textContent?.includes('Remove number') ||
                el.textContent?.includes('Xóa số'));
        }, { timeout: 10000 }); // Đợi tối đa 10 giây
        // 2. Sau khi đã chắc chắn nút tồn tại, mới thực hiện click
        const confirmClicked = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('span.snByac, div[role="button"]'));
            const target = elements.find((el) => el.textContent?.includes('Remove number') ||
                el.textContent?.includes('Xóa số'));
            if (target) {
                const button = target.closest('div[role="button"]') || target;
                console.log(button, 'Nút xác nhận xóa số điện thoại');
                button.click();
                return true;
            }
            return false;
        });
        if (confirmClicked) {
            console.log('✅ Đã click xác nhận xóa.');
        }
        console.log('✅ Đã thực hiện lệnh xóa số điện thoại thành công.');
    }
    catch (error) {
        console.error('❌ Lỗi khi xóa số điện thoại:', error.message);
    }
};
export const handleAutoChangeEmail = async (page, profile) => {
    console.log(`--- Bắt đầu quy trình thay đổi email khôi phục cho: ${profile?.username} ---`);
    try {
        // 1. Vào trang Security tổng quát
        await page.goto('https://myaccount.google.com/security', {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });
        // 2. Tìm thẻ <a> dẫn đến trang quản lý Email khôi phục
        // Selector này tìm đường dẫn chứa cụm "recovery/email" hoặc "recoveryemail"
        const recoveryEmailSelector = 'a[href*="recovery/email"]';
        await Promise.all([
            page.click(recoveryEmailSelector),
            page
                .waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
                .catch(() => { }),
        ]);
        // --- BƯỚC 1: KIỂM TRA MẬT KHẨU ---
        // Đợi tối đa 5s xem ô password có hiện ra không
        const passwordInput = await page
            .waitForSelector('input[type="password"]', {
            visible: true,
            timeout: 5000,
        })
            .catch(() => null);
        if (passwordInput) {
            console.log('==> Phát hiện màn hình nhập mật khẩu.');
            await typeLikeHuman(page, 'input[type="password"]', profile?.password);
            await Promise.all([
                page.keyboard.press('Enter'),
                page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => { }),
            ]);
            await delay(2000); // Chờ Google quyết định có hiện 2FA hay không
        }
        // --- BƯỚC 2: KIỂM TRA 2FA ---
        const otpInputSelector = 'input[type="tel"], #totpPin, input[name="totpPin"]';
        const otpInput = await page
            .waitForSelector(otpInputSelector, {
            visible: true,
            timeout: 5000,
        })
            .catch(() => null);
        if (otpInput) {
            console.log('==> Phát hiện màn hình yêu cầu mã 2FA.');
            const secretKey = profile.tfa_secret;
            if (secretKey) {
                const token = await generate({ secret: secretKey.replace(/\s/g, '') });
                await typeLikeHuman(page, otpInputSelector, token);
                await Promise.all([
                    page.keyboard.press('Enter'),
                    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => { }),
                ]);
            }
        }
        // --- BƯỚC 3: KIỂM TRA MÀN HÌNH CUỐI ---
        // Đảm bảo đã ở màn hình nhập Email
        // 1. Sử dụng waitForFunction để đợi nút Edit xuất hiện
        // Chúng ta kiểm tra cả aria-label tiếng Anh và tiếng Việt để đảm bảo tính tương thích
        await page.waitForFunction(() => {
            const editBtn = document.querySelector('button[aria-label*="Edit recovery email"], button[aria-label*="Chỉnh sửa email"]');
            return editBtn && editBtn.offsetWidth > 0;
        }, { timeout: 15000 });
        // 2. Thực hiện click vào nút thay đổi
        const editClicked = await page.evaluate(() => {
            const editBtn = document.querySelector('button[aria-label*="Edit recovery email"], button[aria-label*="Chỉnh sửa email"]');
            if (editBtn) {
                editBtn.click();
                return true;
            }
            return false;
        });
        if (editClicked) {
            console.log('✅ Đã click vào nút thay đổi Email.');
            // Đợi màn hình nhập Email mới hiện ra
            const emailInputSelector = 'input[type="email"][jsname="YPqjbf"]';
            const newDomain = '@trandaimkt.com';
            await page.waitForFunction((selector) => {
                const input = document.querySelector(selector);
                return input && input.offsetWidth > 0;
            }, { timeout: 15000 }, emailInputSelector);
            const username = profile.username.split('@')[0];
            const newEmail = username + newDomain;
            // 4. Focus và xóa sạch ô input
            await page.focus(emailInputSelector);
            // Click 3 lần để bôi đen toàn bộ
            await page.click(emailInputSelector, { clickCount: 3 });
            await page.keyboard.press('Backspace');
            const currentVal = await page.$eval(emailInputSelector, (el) => el.value);
            if (currentVal !== '') {
                await page.keyboard.down('Control');
                await page.keyboard.press('A');
                await page.keyboard.up('Control');
                await page.keyboard.press('Backspace');
            }
            // 5. Nhập email mới
            await typeLikeHuman(page, emailInputSelector, newEmail);
            const saveBtnSelector = 'button[aria-label="Save your recovery email."], button[data-mdc-dialog-action="ok"]';
            // 2. Click vào nút Save
            const saveClicked = await page.evaluate((sel) => {
                const btn = document.querySelector(sel);
                if (btn) {
                    btn.click();
                    return true;
                }
                // Backup: Tìm theo text "Save" nếu selector aria-label thay đổi
                const allButtons = Array.from(document.querySelectorAll('button'));
                const backupBtn = allButtons.find((b) => b.innerText.includes('Save') || b.innerText.includes('Lưu'));
                if (backupBtn) {
                    backupBtn.click();
                    return true;
                }
                return false;
            }, saveBtnSelector);
            if (saveClicked) {
                console.log('✅ Đã click nút Save thành công.');
                const cancelBtnSelector = 'button[data-mdc-dialog-action="cancel"]';
                await page.waitForFunction((sel) => {
                    const btn = document.querySelector(sel);
                    // Kiểm tra nút tồn tại, hiển thị và không bị vô hiệu hóa
                    return btn && btn.offsetWidth > 0 && btn.offsetHeight > 0;
                }, { timeout: 10000 }, cancelBtnSelector);
                // 2. Thực hiện click vào nút Cancel
                const cancelClicked = await page.evaluate((sel) => {
                    const btn = document.querySelector(sel);
                    if (btn) {
                        btn.click();
                        return true;
                    }
                    // Backup: Tìm theo text "Cancel" hoặc "Hủy" nếu selector action thay đổi
                    const allButtons = Array.from(document.querySelectorAll('button'));
                    const backupBtn = allButtons.find((b) => b.innerText.includes('Cancel') || b.innerText.includes('Hủy'));
                    if (backupBtn) {
                        backupBtn.click();
                        return true;
                    }
                    return false;
                }, cancelBtnSelector);
                if (cancelClicked) {
                    console.log('✅ Đã nhấn nút Cancel thành công.');
                    // Đợi hộp thoại đóng lại và trang ổn định
                    await delay(2000);
                }
                else {
                    console.error('❌ Không tìm thấy nút Cancel.');
                }
            }
            else {
                console.error('❌ Không tìm thấy nút Save để click.');
            }
        }
        console.log('✅ Đã sẵn sàng tại trang quản lý Email.');
    }
    catch (error) {
        console.error('❌ Lỗi khi thay đổi email khôi phục:', error.message);
    }
};
export const handleAutoChangePassword = async (page, profile) => {
    try {
        // 1. Truy cập trang Security
        await page.goto('https://myaccount.google.com/security', {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });
        // 2. Đợi trang ổn định và tìm mục Password
        // Selector này tìm thẻ <a> có link dẫn đến trang đổi mật khẩu
        const passwordLinkSelector = 'a[href*="signinoptions/password"]';
        console.log('Đang rình mục Password xuất hiện...');
        // Sử dụng waitForFunction để đảm bảo mục này đã hiển thị và có thể click
        await page.waitForFunction((sel) => {
            const link = document.querySelector(sel);
            return link && link.offsetWidth > 0;
        }, { timeout: 15000 }, passwordLinkSelector);
        // 3. Click để vào trang đổi mật khẩu
        // Sử dụng Promise.all để bắt kịp sự kiện chuyển trang ngay sau khi click
        await Promise.all([
            page.click(passwordLinkSelector),
            page
                .waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
                .catch(() => { }),
        ]);
        console.log('✅ Đã nhấn vào mục Password.');
        // // 4. KIỂM TRA RE-AUTHENTICATION (Google luôn bắt nhập lại pass cũ trước khi đổi pass mới)
        // --- BƯỚC 1: KIỂM TRA MẬT KHẨU ---
        // Đợi tối đa 5s xem ô password có hiện ra không
        const passwordInput = await page
            .waitForSelector('input[type="password"]', {
            visible: true,
            timeout: 5000,
        })
            .catch(() => null);
        if (passwordInput) {
            console.log('==> Phát hiện màn hình nhập mật khẩu.');
            await typeLikeHuman(page, 'input[type="password"]', profile?.password);
            await Promise.all([
                page.keyboard.press('Enter'),
                page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => { }),
            ]);
            await delay(2000); // Chờ Google quyết định có hiện 2FA hay không
        }
        // --- BƯỚC 2: KIỂM TRA 2FA ---
        const otpInputSelector = 'input[type="tel"], #totpPin, input[name="totpPin"]';
        const otpInput = await page
            .waitForSelector(otpInputSelector, {
            visible: true,
            timeout: 5000,
        })
            .catch(() => null);
        if (otpInput) {
            console.log('==> Phát hiện màn hình yêu cầu mã 2FA.');
            const secretKey = profile.tfa_secret;
            if (secretKey) {
                const token = await generate({ secret: secretKey.replace(/\s/g, '') });
                await typeLikeHuman(page, otpInputSelector, token);
                await Promise.all([
                    page.keyboard.press('Enter'),
                    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => { }),
                ]);
            }
        }
        const newPwdSelector = 'input[name="password"]';
        const confirmPwdSelector = 'input[name="confirmation_password"]';
        await page.waitForFunction((s1, s2) => {
            const p1 = document.querySelector(s1);
            const p2 = document.querySelector(s2);
            return p1 && p1.offsetWidth > 0 && p2 && p2.offsetWidth > 0;
        }, { timeout: 15000 }, newPwdSelector, confirmPwdSelector);
        const newPass = generateRandomPassword();
        console.log(newPass, 'Đây là mật khẩu mới');
        await page.focus(newPwdSelector);
        await typeLikeHuman(page, newPwdSelector, newPass);
        await delay(1000); // Nghỉ một chút như người thật
        await page.focus(confirmPwdSelector);
        await typeLikeHuman(page, confirmPwdSelector, newPass);
        // 1. Định nghĩa các tiêu chí nhận diện nút "xịn"
        const TARGET_JSNAME = 'Pr7Yme';
        const VALID_TEXT_LOOKUP = [
            'Change password',
            'Đổi mật khẩu',
            'Thay đổi mật khẩu',
        ];
        console.log('--- Đang định vị chính xác nút xác nhận đổi mật khẩu ---');
        const isClicked = await page.evaluate((jsname, validTexts) => {
            // Tìm tất cả các button có jsname mục tiêu
            const buttons = Array.from(document.querySelectorAll(`button[jsname="${jsname}"]`));
            // Lọc ra nút thỏa mãn: 1. Hiển thị trên màn hình | 2. Chứa text đúng
            const correctBtn = buttons.find((btn) => {
                const htmlBtn = btn;
                const text = (htmlBtn.innerText || htmlBtn.textContent || '').trim();
                // Kiểm tra nút có bị ẩn không (rộng/cao > 0)
                const isVisible = htmlBtn.offsetWidth > 0 && htmlBtn.offsetHeight > 0;
                // Kiểm tra text có nằm trong danh sách hợp lệ không
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
        if (isClicked) {
            console.log('✅ Đã click chính xác nút Change Password.');
        }
    }
    catch (error) {
        console.error('❌ Không tìm thấy mục Password hoặc lỗi điều hướng:', error.message);
    }
};
