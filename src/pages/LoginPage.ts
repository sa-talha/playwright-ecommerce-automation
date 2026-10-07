import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly path = '/';
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.getByLabel('Username');
    this.password = page.getByLabel('Password');
    this.submit = page.getByRole('button', { name: 'Log in' });
    this.error = page.getByRole('alert');
  }

  async login(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }
}
