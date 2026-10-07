import { test, expect } from '../../src/fixtures/test';
import { users } from '../../src/data/users';

test.describe('Accessibility basics', () => {
  test.describe('without a session', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('login works with the keyboard only', async ({ page, loginPage, productsPage, isMobile }) => {
      test.skip(isMobile, 'Keyboard navigation is a desktop concern');
      await loginPage.goto();

      await page.keyboard.press('Tab');
      await expect(loginPage.username).toBeFocused();
      await page.keyboard.type(users.standard.username);
      await page.keyboard.press('Tab');
      await expect(loginPage.password).toBeFocused();
      await page.keyboard.type(users.standard.password);
      await page.keyboard.press('Enter');

      await expect(productsPage.heading).toBeVisible();
    });

    test('login errors are announced to screen readers', async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login('', '');
      await expect(loginPage.error).toHaveAttribute('role', 'alert');
      await expect(loginPage.error).toBeVisible();
    });
  });

  test('every image on the product list has alt text', async ({ productsPage, page }) => {
    await productsPage.goto();
    await expect(productsPage.cards.first()).toBeVisible();

    const images = page.locator('main img');
    for (const img of await images.all()) {
      await expect(img).toHaveAttribute('alt', /\S/);
    }
  });

  test('form fields on checkout have accessible labels', async ({ seedCart, checkoutInfoPage }) => {
    await seedCart([{ id: 1, qty: 1 }]);
    await checkoutInfoPage.goto();
    // getByLabel only finds inputs that are properly labelled, so these act as the check.
    for (const field of [checkoutInfoPage.firstName, checkoutInfoPage.lastName, checkoutInfoPage.postalCode]) {
      await expect(field).toBeEditable();
    }
  });

  test('cart quantity buttons have accessible names', async ({ seedCart, cartPage }) => {
    await seedCart([{ id: 1, qty: 2 }]);
    await cartPage.goto();
    await expect(cartPage.items.first().getByRole('button', { name: 'Increase quantity' })).toBeVisible();
    await expect(cartPage.items.first().getByRole('button', { name: 'Decrease quantity' })).toBeVisible();
  });
});
