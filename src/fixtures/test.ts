import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProductsPage } from '../pages/ProductsPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutInfoPage, CheckoutReviewPage, CheckoutCompletePage } from '../pages/CheckoutPage';
import { ApiClient, type OrderItem } from '../api/ApiClient';

type Fixtures = {
  loginPage: LoginPage;
  productsPage: ProductsPage;
  productPage: ProductDetailPage;
  cartPage: CartPage;
  checkoutInfoPage: CheckoutInfoPage;
  checkoutReviewPage: CheckoutReviewPage;
  checkoutCompletePage: CheckoutCompletePage;
  api: ApiClient;
  /**
   * Puts items straight into the cart (localStorage) instead of clicking through the UI.
   * Keeps tests that are about checkout fast and focused.
   */
  seedCart: (items: OrderItem[]) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  productsPage: async ({ page }, use) => use(new ProductsPage(page)),
  productPage: async ({ page }, use) => use(new ProductDetailPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutInfoPage: async ({ page }, use) => use(new CheckoutInfoPage(page)),
  checkoutReviewPage: async ({ page }, use) => use(new CheckoutReviewPage(page)),
  checkoutCompletePage: async ({ page }, use) => use(new CheckoutCompletePage(page)),
  api: async ({ request }, use) => use(new ApiClient(request)),

  seedCart: async ({ page }, use) => {
    await use(async (items) => {
      await page.goto('/products.html');
      await page.evaluate((cart) => localStorage.setItem('lagom.cart', JSON.stringify(cart)), items);
    });
  },
});

export { expect };
