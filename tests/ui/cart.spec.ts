import { test, expect } from '../../src/fixtures/test';
import { products } from '../../src/data/products';
import { parseSek } from '../../src/utils/money';

const { fikaMug, candles, birchLamp } = products;

test.describe('Cart', () => {
  test('items added from the list show up in the cart @smoke', async ({ productsPage, cartPage }) => {
    await productsPage.goto();
    await productsPage.addToCart(fikaMug.name, candles.name);
    await expect(productsPage.header.cartBadge).toHaveText('2');

    await productsPage.header.openCart();

    await expect(cartPage.items).toHaveCount(2);
    await expect(cartPage.item(fikaMug.name)).toBeVisible();
    await expect(cartPage.item(candles.name)).toBeVisible();
    expect(await cartPage.subtotalValue()).toBe(fikaMug.price + candles.price);
  });

  test('changing quantity updates line total and subtotal', async ({ seedCart, cartPage }) => {
    await seedCart([{ id: fikaMug.id, qty: 1 }, { id: birchLamp.id, qty: 1 }]);
    await cartPage.goto();

    await cartPage.increase(fikaMug.name, 2);

    await expect(cartPage.quantityOf(fikaMug.name)).toHaveText('3');
    const lineTotal = await cartPage.item(fikaMug.name).getByTestId('cart-item-total').textContent();
    expect(parseSek(lineTotal)).toBe(fikaMug.price * 3);
    expect(await cartPage.subtotalValue()).toBe(fikaMug.price * 3 + birchLamp.price);
    await expect(cartPage.header.cartBadge).toHaveText('4');

    await cartPage.decrease(fikaMug.name);
    await expect(cartPage.quantityOf(fikaMug.name)).toHaveText('2');
    expect(await cartPage.subtotalValue()).toBe(fikaMug.price * 2 + birchLamp.price);
  });

  test('decreasing quantity to zero removes the line', async ({ seedCart, cartPage }) => {
    await seedCart([{ id: candles.id, qty: 1 }, { id: fikaMug.id, qty: 1 }]);
    await cartPage.goto();

    await cartPage.decrease(candles.name);

    await expect(cartPage.item(candles.name)).toHaveCount(0);
    await expect(cartPage.items).toHaveCount(1);
  });

  test('removing the last item shows the empty cart', async ({ seedCart, cartPage }) => {
    await seedCart([{ id: birchLamp.id, qty: 2 }]);
    await cartPage.goto();

    await cartPage.remove(birchLamp.name);

    await expect(cartPage.emptyMessage).toBeVisible();
    await expect(cartPage.checkoutButton).toBeHidden();
    await expect(cartPage.header.cartBadge).toBeHidden();
  });

  test('cart survives a page reload', async ({ productsPage, cartPage, page }) => {
    await productsPage.goto();
    await productsPage.addToCart(birchLamp.name);
    await cartPage.goto();
    await expect(cartPage.items).toHaveCount(1);

    await page.reload();

    await expect(cartPage.items).toHaveCount(1);
    await expect(cartPage.header.cartBadge).toHaveText('1');
  });

  test('continue shopping goes back to the product list', async ({ seedCart, cartPage, productsPage }) => {
    await seedCart([{ id: fikaMug.id, qty: 1 }]);
    await cartPage.goto();

    await cartPage.continueShopping.click();

    await expect(productsPage.heading).toBeVisible();
  });
});
