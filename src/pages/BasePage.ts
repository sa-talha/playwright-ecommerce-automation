import { type Page } from '@playwright/test';
import { Header } from '../components/Header';

export abstract class BasePage {
  readonly header: Header;

  constructor(readonly page: Page) {
    this.header = new Header(page);
  }

  /** Path relative to baseURL, for example "products.html". */
  abstract readonly path: string;

  async goto() {
    await this.page.goto(this.path);
  }
}
