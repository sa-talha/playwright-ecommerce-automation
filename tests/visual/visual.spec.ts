import { test, expect } from '../../src/fixtures/test';

// Visual regression on the key screens. Baselines live in tests/__screenshots__.
// Update them on purpose with: npx playwright test --project=visual --update-snapshots
test.describe('Visual regression', () => {
  test.describe('logged out', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('login page', async ({ loginPage, page }) => {
      await loginPage.goto();
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot('login.png', { fullPage: true });
    });
  });

  test('product list', async ({ productsPage, page }) => {
    await productsPage.goto();
    await expect(productsPage.cards).toHaveCount(6);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('products.png', { fullPage: true });
  });

  test('cart with items', async ({ seedCart, cartPage, page }) => {
    await seedCart([
      { id: 2, qty: 1 },
      { id: 5, qty: 2 },
    ]);
    await cartPage.goto();
    await expect(cartPage.items).toHaveCount(2);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('cart.png', { fullPage: true });
  });
});
