import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parseSek } from '../utils/money';

export class CartPage extends BasePage {
  readonly path = '/cart.html';
  readonly items: Locator;
  readonly emptyMessage: Locator;
  readonly subtotal: Locator;
  readonly checkoutButton: Locator;
  readonly continueShopping: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.getByTestId('cart-item');
    this.emptyMessage = page.getByTestId('cart-empty');
    this.subtotal = page.getByTestId('cart-subtotal');
    this.checkoutButton = page.getByRole('link', { name: 'Checkout' });
    this.continueShopping = page.getByRole('link', { name: 'Continue shopping' });
  }

  item(name: string): Locator {
    return this.items.filter({ hasText: name });
  }

  quantityOf(name: string): Locator {
    return this.item(name).getByTestId('cart-item-qty');
  }

  async increase(name: string, times = 1) {
    for (let i = 0; i < times; i++) await this.item(name).getByRole('button', { name: 'Increase quantity' }).click();
  }

  async decrease(name: string) {
    await this.item(name).getByRole('button', { name: 'Decrease quantity' }).click();
  }

  async remove(name: string) {
    await this.item(name).getByRole('button', { name: 'Remove' }).click();
  }

  async subtotalValue(): Promise<number> {
    return parseSek(await this.subtotal.textContent());
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}
