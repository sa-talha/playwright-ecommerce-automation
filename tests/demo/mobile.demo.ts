import { test, expect } from './demo-fixtures';
import { devices } from '@playwright/test';
import { products } from '../../src/data/products';
import { validCustomer } from '../../src/data/checkout';

const { defaultBrowserType, ...pixel } = devices['Pixel 7'];
test.use({ ...pixel, video: { mode: 'on', size: pixel.viewport } });

test('mobile-flow: checkout on a Pixel 7 viewport', async ({
  director,
  productsPage,
  cartPage,
  checkoutInfoPage,
  checkoutReviewPage,
  checkoutCompletePage,
}) => {
  await productsPage.goto();
  await director.caption('Pixel 7 · add to cart');
  await director.click(productsPage.addToCartButton(products.candles.name));
  await expect(productsPage.header.cartBadge).toHaveText('1');

  await director.caption('Pixel 7 · cart');
  await director.click(productsPage.header.cartLink);
  await expect(cartPage.items).toHaveCount(1);
  await director.click(cartPage.checkoutButton);

  await director.caption('Pixel 7 · details');
  await checkoutInfoPage.fill(validCustomer);
  await director.pause(500);
  await director.click(checkoutInfoPage.continueButton);

  await director.caption('Pixel 7 · place order');
  await director.click(checkoutReviewPage.placeOrderButton);
  await expect(checkoutCompletePage.title).toBeVisible();
  await director.caption('Pixel 7 · done ✓');
  await director.pause(1500);
});
