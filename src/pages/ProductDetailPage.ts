import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductDetailPage extends BasePage {
  path = '/product.html';
  readonly name: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly addToCart: Locator;
  readonly backLink: Locator;
  readonly notFound: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.getByTestId('detail-name');
    this.description = page.getByTestId('detail-description');
    this.price = page.getByTestId('detail-price');
    this.addToCart = page.getByTestId('add-to-cart');
    this.backLink = page.getByTestId('back-to-products');
    this.notFound = page.getByTestId('not-found');
  }

  async gotoProduct(id: number | string) {
    await this.page.goto(`/product.html?id=${id}`);
  }
}
