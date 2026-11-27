const { defineConfig } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const authFile = path.join(__dirname, 'auth.json');
const hasAuth = fs.existsSync(authFile);

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,
  expect: { timeout: 15 * 1000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'https://www.amazon.com',
    channel: 'chrome',
    headless: false,
    viewport: { width: 1366, height: 900 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    storageState: hasAuth ? authFile : undefined,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },
  projects: [{ name: 'chrome', use: { channel: 'chrome', headless: false } }],
});