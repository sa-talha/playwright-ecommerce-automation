import { test, expect } from '../../src/fixtures/test';
import { users } from '../../src/data/users';

// These tests are about logging in, so they start without a saved session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('standard user can log in and lands on the product list @smoke', async ({ loginPage, productsPage, page }) => {
    await loginPage.login(users.standard.username, users.standard.password);

    await expect(page).toHaveURL(/products\.html/);
    await expect(productsPage.heading).toBeVisible();
    await expect(productsPage.header.greeting).toHaveText(`Hej, ${users.standard.firstName}`);
  });

  test('locked user sees a clear error and stays on the login page', async ({ loginPage, page }) => {
    await loginPage.login(users.locked.username, users.locked.password);

    await expect(loginPage.error).toHaveText('This account has been locked');
    await expect(page).not.toHaveURL(/products/);
  });

  const badCredentials = [
    { case: 'wrong password', username: users.standard.username, password: 'wrong-password' },
    { case: 'unknown user', username: 'no_such_user', password: users.standard.password },
    { case: 'username in wrong case', username: 'STANDARD_USER', password: users.standard.password },
  ];
  for (const { case: name, username, password } of badCredentials) {
    test(`rejects ${name}`, async ({ loginPage }) => {
      await loginPage.login(username, password);

      await expect(loginPage.error).toHaveText('Username and password do not match any user');
      await expect(loginPage.username).toHaveAttribute('aria-invalid', 'true');
      await expect(loginPage.password).toHaveAttribute('aria-invalid', 'true');
    });
  }

  test('asks for a username when it is empty', async ({ loginPage }) => {
    await loginPage.login('', users.standard.password);
    await expect(loginPage.error).toHaveText('Username is required');
    await expect(loginPage.username).toHaveAttribute('aria-invalid', 'true');
  });

  test('asks for a password when it is empty', async ({ loginPage }) => {
    await loginPage.login(users.standard.username, '');
    await expect(loginPage.error).toHaveText('Password is required');
    await expect(loginPage.password).toHaveAttribute('aria-invalid', 'true');
  });

  test('protected pages redirect to login when there is no session', async ({ page, loginPage }) => {
    await page.goto('/cart.html');

    await expect(page).toHaveURL(/index\.html\?reason=login-required/);
    await expect(loginPage.error).toHaveText('Please log in to continue.');
  });

  test('log out ends the session and empties the cart', async ({ loginPage, productsPage, page }) => {
    await loginPage.login(users.standard.username, users.standard.password);
    await productsPage.addToCart('Fika Mug');
    await expect(productsPage.header.cartBadge).toHaveText('1');

    await productsPage.header.logout();
    await expect(loginPage.submit).toBeVisible();

    const storage = await page.evaluate(() => ({ ...localStorage }));
    expect(storage).toEqual({});

    await page.goto('/products.html');
    await expect(page).toHaveURL(/login-required/);
  });
});
