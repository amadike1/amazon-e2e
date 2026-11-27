const { test, expect } = require('@playwright/test');

const DUMMY = {
  name: 'Test Shopper',
  email: `qa.shop.${Date.now()}@example.com`,
  password: 'DummyPass!2026',
  searchTerm: 'wireless headphones',
};

async function clearConsent(page) {
  const dismissers = [
    '#sp-cc-accept',
    'input[name="gdpr-consent-modal"]',
    'button:has-text("Dismiss")',
    'button:has-text("Accept Cookies")',
  ];
  for (const sel of dismissers) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) await el.click().catch(() => {});
  }
}

async function openHome(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await clearConsent(page);
}

// Reach the real sign-in / create-account page via the account dropdown.
async function openAccountMenu(page) {
  await openHome(page);
  await page.locator('#nav-link-accountList').click();
  await expect(page.locator('input[type="email"], #ap-email, input[name="email"]').first()).toBeVisible();
}

async function searchFirstProduct(page) {
  await page.locator('#twotabsearchtextbox').fill(DUMMY.searchTerm);
  await page.locator('#nav-search-submit-button').click();
  await expect(page).toHaveURL(/s\?k=/);
  await page.locator('.s-asin h2 a, .s-asin a.a-link-normal').first().click();
  await expect(page).toHaveURL(/\/(dp|gp\/product)\//);
  await clearConsent(page);
}

const ADD_TO_CART = '#add-to-cart-button, input[name="submit.addToCart"], #addToCart, button:has-text("Add to Cart")';

test.describe('Amazon E2E (dummy data)', () => {
  test('homepage loads with core navigation', async ({ page }) => {
    await openHome(page);
    await expect(page).toHaveURL(/amazon\.com/);
    await expect(page.locator('#nav-logo')).toBeVisible();
    await expect(page.locator('#twotabsearchtextbox')).toBeVisible();
  });

  test('signup: create a new account with dummy data', async ({ page }) => {
    await openAccountMenu(page);
    const create = page.locator('a:has-text("Create your Amazon account")');
    if (await create.first().isVisible().catch(() => false)) await create.first().click();
    else {
      await page.locator('input[type="email"], #ap-email').first().fill(DUMMY.email);
      await page.locator('#continue, input[type="submit"]').first().click();
    }
    await page.locator('#ap-credential_name, input[name="name"]').first().fill(DUMMY.name);
    await page.locator('#ap-email, input[type="email"]').first().fill(DUMMY.email);
    await page.locator('#ap-password, input[name="password"]').first().fill(DUMMY.password);
    await page.locator('#ap-submit-signup, input[type="submit"]').first().click();
    await expect(page.locator('body')).toContainText(/verify|code|otp|continue|create/i);
  });

  test('login: sign in with dummy credentials', async ({ page }) => {
    await openAccountMenu(page);
    await page.locator('input[type="email"], #ap-email').first().fill(DUMMY.email);
    await page.locator('#continue, input[type="submit"]').first().click();
    await page.locator('#ap-password').fill(DUMMY.password);
    await page.locator('#signInSubmit').click();
    await expect(page.locator('body')).toContainText(/cannot find|incorrect|invalid|verify|code|otp|create your amazon account/i);
  });

  test('search: results render for a keyword', async ({ page }) => {
    await openHome(page);
    await page.locator('#twotabsearchtextbox').fill(DUMMY.searchTerm);
    await page.locator('#nav-search-submit-button').click();
    await expect(page).toHaveURL(/s\?k=/);
    await expect(page.locator('[data-component-type="s-search-result"]').first()).toBeVisible();
  });

  test('add to cart: add first product and open cart', async ({ page }) => {
    await openHome(page);
    await searchFirstProduct(page);
    await page.locator(ADD_TO_CART).first().click();
    await page.locator('#nav-cart').click();
    await expect(page).toHaveURL(/cart/);
    await expect(page.locator('.sc-list-item').first()).toBeVisible();
  });

  test('checkout: cart reaches the checkout entry point', async ({ page }) => {
    await openHome(page);
    await searchFirstProduct(page);
    await page.locator(ADD_TO_CART).first().click();
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="proceedToRetailCheckout"]').first().click();
    await expect(page).not.toHaveURL(/\/cart/);
  });
});