import { generate } from 'otplib';

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const typeLikeHuman = async (
  page: any,
  selector: string,
  text: string
) => {
  await page.waitForSelector(selector, { visible: true });
  await page.focus(selector);
  for (const char of text) {
    await page.keyboard.sendCharacter(char);
    await delay(Math.floor(Math.random() * 100) + 50); // Delay ngẫu nhiên giữa các phím
  }
};

export const handleAutoLogin = async (page: any, profile: any) => {
  const currentUrl = page.url();
  const isLoggedIn =
    currentUrl.includes('myaccount.google.com') &&
    !currentUrl.includes('signin');
  if (isLoggedIn) {
    console.log('✅ Đã đăng nhập sẵn. Bỏ qua bước login.');
    return;
  }

  await typeLikeHuman(page, 'input[type="email"]', profile?.username);
  await page.click('#identifierNext');

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
  } catch (e) {
    console.log(
      'Không thấy ô mật khẩu (có thể do Google bắt xác minh hoặc báo lỗi)'
    );
  }

  await delay(10000);
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
          .catch(() => {});
      } else {
        console.log('Cần 2FA nhưng Profile không có Secret Key!');
      }
    }
  } catch (error) {
    console.log('Không yêu cầu 2FA hoặc giao diện khác, bỏ qua bước này.');
  }
};

export const handleAutoChange = async (page: any, profile: any) => {
  // Chức năng thay đổi thông tin tự động (nếu cần)
  console.log('Chức năng thay đổi thông tin chưa được triển khai.');
};
