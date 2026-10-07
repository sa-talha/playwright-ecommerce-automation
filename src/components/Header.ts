import { type Locator, type Page } from '@playwright/test';

/** The sticky top bar shown on every page after login. */
export class Header {
  readonly brand: Locator;
  readonly greeting: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.brand = page.getByTestId('brand');
    this.greeting = page.getByTestId('greeting');
    this.cartLink = page.getByTestId('cart-link');
    this.cartBadge = page.getByTestId('cart-badge');
    this.logoutButton = page.getByTestId('logout');
  }

  async openCart() {
    await this.cartLink.click();
  }

  async logout() {
    await this.logoutButton.click();
  }
}
