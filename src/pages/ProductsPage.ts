import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parseSek } from '../utils/money';

export type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

export class ProductsPage extends BasePage {
  readonly path = '/products.html';
  readonly heading: Locator;
  readonly search: Locator;
  readonly sort: Locator;
  readonly resultCount: Locator;
  readonly cards: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'All products' });
    this.search = page.getByRole('searchbox', { name: 'Search products' });
    this.sort = page.getByRole('combobox', { name: 'Sort products' });
    this.resultCount = page.getByTestId('result-count');
    this.cards = page.getByTestId('product-card');
    this.emptyState = page.getByTestId('empty-state');
  }

  card(name: string): Locator {
    return this.cards.filter({ has: this.page.getByTestId('product-name').getByText(name, { exact: true }) });
  }

  addToCartButton(name: string): Locator {
    return this.card(name).getByTestId('add-to-cart');
  }

  async addToCart(...names: string[]) {
    for (const name of names) await this.addToCartButton(name).click();
  }

  async openProduct(name: string) {
    await this.card(name).getByTestId('product-name').click();
  }

  async sortBy(option: SortOption) {
    await this.sort.selectOption(option);
  }

  async searchFor(text: string) {
    await this.search.fill(text);
  }

  async productNames(): Promise<string[]> {
    return this.cards.getByTestId('product-name').allTextContents();
  }

  async productPrices(): Promise<number[]> {
    const texts = await this.cards.getByTestId('product-price').allTextContents();
    return texts.map(parseSek);
  }
}
