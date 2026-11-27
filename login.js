// One-time manual login: opens real Chrome, you sign in (solve CAPTCHA/OTP),
// set a US delivery address, then the session is saved to auth.json for the tests.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const USER_DATA = path.join(__dirname, '.userdata');
const AUTH_FILE = path.join(__dirname, 'auth.json');

(async () => {
  const context = await chromium.launchPersistentContext(USER_DATA, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1366, height: 900 },
    locale: 'en-US',
  });
  const page = context.pages()[0] || (await context.newPage());

  console.log('\n=== Amazon manual login ===');
  console.log('1) Sign in (solve any CAPTCHA / OTP).');
  console.log('2) Set your delivery location to a US ZIP (click "Deliver to" -> enter ZIP -> Apply).');
  console.log('3) Wait here until you see "Logged in". Do NOT close the window early.\n');

  await page.goto('https://www.amazon.com/', { waitUntil: 'domcontentloaded' });
  await page.locator('#nav-link-accountList').click().catch(() => {});

  // Wait until the account menu no longer says "Hello, sign in".
  await page.waitForFunction(
    () => {
      const el = document.querySelector('#nav-link-accountList');
      return el && !/hello,\s*sign in/i.test(el.textContent || '');
    },
    { timeout: 5 * 60 * 1000 }
  );

  console.log('\nLogged in. Saving session to auth.json ...');
  await context.storageState({ path: AUTH_FILE });
  console.log('Saved. You can close this window and run: npx playwright test');
  await new Promise((r) => setTimeout(r, 1500));
  await context.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});