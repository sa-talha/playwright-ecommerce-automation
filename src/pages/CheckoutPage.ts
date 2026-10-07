import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parseSek } from '../utils/money';

export type Customer = { firstName: string; lastName: string; postalCode: string };

/** Step 1: delivery details. */
export class CheckoutInfoPage extends BasePage {
  readonly path = '/checkout.html';
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.firstName = page.getByLabel('First name');
    this.lastName = page.getByLabel('Last name');
    this.postalCode = page.getByLabel('Postal code');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.error = page.getByRole('alert');
  }

  field(name: keyof Customer): Locator {
    return { firstName: this.firstName, lastName: this.lastName, postalCode: this.postalCode }[name];
  }

  async fill(customer: Customer) {
    await this.firstName.fill(customer.firstName);
    await this.lastName.fill(customer.lastName);
    await this.postalCode.fill(customer.postalCode);
  }

  async submit(customer: Customer) {
    await this.fill(customer);
    await this.continueButton.click();
  }
}

/** Step 2: review the order and see the totals. */
export class CheckoutReviewPage extends BasePage {
  readonly path = '/checkout-review.html';
  readonly items: Locator;
  readonly shipTo: Locator;
  readonly subtotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly placeOrderButton: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.getByTestId('review-item');
    this.shipTo = page.getByTestId('ship-to');
    this.subtotal = page.getByTestId('summary-subtotal');
    this.tax = page.getByTestId('summary-tax');
    this.total = page.getByTestId('summary-total');
    this.placeOrderButton = page.getByRole('button', { name: 'Place order' });
    this.error = page.getByRole('alert');
  }

  async totals() {
    const [subtotal, tax, total] = await Promise.all(
      [this.subtotal, this.tax, this.total].map(async (l) => parseSek(await l.textContent())),
    );
    return { subtotal, tax, total };
  }

  async placeOrder() {
    await this.placeOrderButton.click();
  }
}

/** Step 3: order confirmation. */
export class CheckoutCompletePage extends BasePage {
  readonly path = '/checkout-complete.html';
  readonly title: Locator;
  readonly orderId: Locator;
  readonly orderTotal: Locator;
  readonly backHome: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: /your order is placed/i });
    this.orderId = page.getByTestId('order-id');
    this.orderTotal = page.getByTestId('order-total');
    this.backHome = page.getByRole('link', { name: 'Back to products' });
  }
}
