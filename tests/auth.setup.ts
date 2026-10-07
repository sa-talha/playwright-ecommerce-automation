import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { users } from '../src/data/users';
import { STORAGE_STATE } from '../playwright.config';

// Log in once through the real UI and save the session.
// Every UI project reuses it, so most tests start already logged in.
setup('authenticate as standard user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(users.standard.username, users.standard.password);
  await expect(page).toHaveURL(/products\.html/);
  await page.context().storageState({ path: STORAGE_STATE });
});
