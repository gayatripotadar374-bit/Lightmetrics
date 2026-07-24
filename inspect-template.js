const { chromium } = require('playwright');
require('dotenv').config();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(process.env.BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/email/i).first().fill(process.env.LOGIN_EMAIL);
  await page.locator('input[type="password"]').first().fill(process.env.LOGIN_PASSWORD);
  await page.getByRole('button', { name: /log\s*in|sign\s*in/i }).first().click();
  await page.waitForLoadState('networkidle');
  await page.goto(process.env.BASE_URL + '/runpipeline');
  await page.waitForLoadState('networkidle');

  const combobox = page.getByRole('combobox', { name: /select existing template/i }).first();
  console.log('combobox count', await combobox.count());
  if (await combobox.count()) {
    await combobox.click();
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').innerText();
    console.log('---BODY TEXT---');
    console.log(bodyText);
    console.log('---HTML---');
    console.log((await page.locator('body').innerHTML()).slice(0, 40000));
  }

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
