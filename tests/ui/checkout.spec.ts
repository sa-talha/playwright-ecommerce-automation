import { test, expect } from '../../src/fixtures/test';
import { products } from '../../src/data/products';
import { validCustomer, invalidCustomers } from '../../src/data/checkout';
import { parseSek, round2, VAT_RATE } from '../../src/utils/money';

const { woolThrow, candles, oakStool } = products;

test.describe('Checkout', () => {
  test('customer can buy two products end to end @smoke', async ({
    page,
    productsPage,
    cartPage,
    checkoutInfoPage,
    checkoutReviewPage,
    checkoutCompletePage,
  }) => {
    await test.step('add products to the cart', async () => {
      await productsPage.goto();
      await productsPage.addToCart(woolThrow.name, candles.name);
      await expect(productsPage.header.cartBadge).toHaveText('2');
    });

    await test.step('go to checkout from the cart', async () => {
      await productsPage.header.openCart();
      await expect(cartPage.items).toHaveCount(2);
      await cartPage.checkout();
    });

    await test.step('enter delivery details', async () => {
      await checkoutInfoPage.submit(validCustomer);
      await expect(page).toHaveURL(/checkout-review\.html/);
    });

    let expectedTotal = 0;
    await test.step('review shows correct subtotal, VAT and total', async () => {
      const subtotal = woolThrow.price + candles.price;
      expectedTotal = round2(subtotal * (1 + VAT_RATE));

      await expect(checkoutReviewPage.items).toHaveCount(2);
      await expect(checkoutReviewPage.shipTo).toHaveText('Alva Lind, 114 55');
      expect(await checkoutReviewPage.totals()).toEqual({
        subtotal,
        tax: round2(subtotal * VAT_RATE),
        total: expectedTotal,
      });
    });

    await test.step('place the order and see the confirmation', async () => {
      // The page navigates right after the API answers, so capture the real response
      // body on the way through instead of reading it afterwards.
      let order: { orderId: string; total: number } | undefined;
      await page.route('**/api/orders', async (route) => {
        const response = await route.fetch();
        order = await response.json();
        await route.fulfill({ response });
      });

      await checkoutReviewPage.placeOrder();

      await expect(checkoutCompletePage.title).toBeVisible();
      if (!order) throw new Error('Order API was not called');
      await expect(checkoutCompletePage.orderId).toHaveText(order.orderId);
      await expect(checkoutCompletePage.orderId).toHaveText(/^LG-\d+$/);
      expect(order.total).toBe(expectedTotal);
      expect(parseSek(await checkoutCompletePage.orderTotal.textContent())).toBe(expectedTotal);
      await expect(checkoutCompletePage.header.cartBadge).toBeHidden();
    });
  });

  for (const { title, data, error, field } of invalidCustomers) {
    test(`delivery form rejects ${title}`, async ({ seedCart, checkoutInfoPage, page }) => {
      await seedCart([{ id: candles.id, qty: 1 }]);
      await checkoutInfoPage.goto();

      await checkoutInfoPage.submit(data);

      await expect(checkoutInfoPage.error).toHaveText(error);
      await expect(checkoutInfoPage.field(field)).toHaveAttribute('aria-invalid', 'true');
      await expect(checkoutInfoPage.field(field)).toBeFocused();
      await expect(page).toHaveURL(/checkout\.html/);
    });
  }

  test('shows the server error when an order fails (mocked 409)', async ({
    page,
    seedCart,
    checkoutInfoPage,
    checkoutReviewPage,
  }) => {
    // Network mocking: simulate stock running out between review and payment.
    await page.route('**/api/orders', (route) =>
      route.fulfill({ status: 409, json: { error: `${oakStool.name} is out of stock` } }),
    );
    await seedCart([{ id: oakStool.id, qty: 1 }]);
    await checkoutInfoPage.goto();
    await checkoutInfoPage.submit(validCustomer);

    await checkoutReviewPage.placeOrder();

    await expect(checkoutReviewPage.error).toHaveText(`${oakStool.name} is out of stock`);
    await expect(checkoutReviewPage.placeOrderButton).toBeEnabled();
    await expect(page).toHaveURL(/checkout-review\.html/);
  });

  test('checkout with an empty cart sends you back to the cart', async ({ page, cartPage }) => {
    await page.goto('/checkout.html');

    await expect(page).toHaveURL(/cart\.html/);
    await expect(cartPage.emptyMessage).toBeVisible();
  });

  test('delivery details are kept when going back from review', async ({
    seedCart,
    checkoutInfoPage,
    page,
  }) => {
    await seedCart([{ id: candles.id, qty: 1 }]);
    await checkoutInfoPage.goto();
    await checkoutInfoPage.submit(validCustomer);
    await expect(page).toHaveURL(/checkout-review\.html/);

    await page.getByRole('link', { name: 'Back', exact: true }).click();

    await expect(checkoutInfoPage.firstName).toHaveValue(validCustomer.firstName);
    await expect(checkoutInfoPage.lastName).toHaveValue(validCustomer.lastName);
    await expect(checkoutInfoPage.postalCode).toHaveValue(validCustomer.postalCode);
  });
});
