import { test, expect } from './demo-fixtures';
import { users } from '../../src/data/users';
import { products } from '../../src/data/products';
import { validCustomer } from '../../src/data/checkout';

// Each test here is recorded and turned into a GIF for the README (npm run record:demos).
// They still assert, so a recording only exists if the flow really worked.

test.describe('logged out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login-flow: errors for bad and locked users, then a good login', async ({ page, director, loginPage, productsPage }) => {
    await loginPage.goto();
    await director.caption('Login: wrong password');
    await director.type(loginPage.username, users.standard.username);
    await director.type(loginPage.password, 'wrong-pass');
    await director.click(loginPage.submit);
    await expect(loginPage.error).toHaveText('Username and password do not match any user');
    await director.pause();

    await director.caption('Login: locked account');
    await director.type(loginPage.username, users.locked.username);
    await director.type(loginPage.password, users.locked.password);
    await director.click(loginPage.submit);
    await expect(loginPage.error).toHaveText('This account has been locked');
    await director.pause();

    await director.caption('Login: standard user ✓');
    await director.type(loginPage.username, users.standard.username);
    await director.type(loginPage.password, users.standard.password);
    await director.click(loginPage.submit);
    await expect(productsPage.heading).toBeVisible();
    await expect(page).toHaveURL(/products/);
    await director.pause(1200);
  });
});

test('shopping-flow: search, sort and manage the cart', async ({ director, productsPage, cartPage }) => {
  await productsPage.goto();
  await director.caption('Search filters the list as you type');
  await director.type(productsPage.search, 'lamp');
  await expect(productsPage.cards).toHaveCount(1);
  await director.pause(700);
  await productsPage.search.fill('');
  await expect(productsPage.cards).toHaveCount(6);

  await director.caption('Sort by price, high to low');
  await director.select(productsPage.sort, 'price-desc');
  await expect.poll(() => productsPage.productPrices()).toEqual([1290, 899, 649, 349, 199, 149]);
  await director.pause(600);

  await director.caption('Sold out items cannot be added');
  await productsPage.addToCartButton(products.monstera.name).hover();
  await expect(productsPage.addToCartButton(products.monstera.name)).toBeDisabled();
  await director.pause(700);

  await director.caption('Add to cart updates the badge');
  await director.click(productsPage.addToCartButton(products.birchLamp.name));
  await director.click(productsPage.addToCartButton(products.candles.name));
  await expect(productsPage.header.cartBadge).toHaveText('2');

  await director.caption('Change quantity and remove items in the cart');
  await director.click(productsPage.header.cartLink);
  await expect(cartPage.items).toHaveCount(2);
  await director.click(cartPage.item(products.candles.name).getByRole('button', { name: 'Increase quantity' }));
  await director.click(cartPage.item(products.candles.name).getByRole('button', { name: 'Increase quantity' }));
  await expect(cartPage.quantityOf(products.candles.name)).toHaveText('3');
  await director.click(cartPage.item(products.birchLamp.name).getByRole('button', { name: 'Remove' }));
  await expect(cartPage.items).toHaveCount(1);
  expect(await cartPage.subtotalValue()).toBe(products.candles.price * 3);
  await director.caption('Subtotal recalculated ✓');
  await director.pause(1200);
});

test('checkout-flow: buy two products end to end', async ({
  director,
  productsPage,
  cartPage,
  checkoutInfoPage,
  checkoutReviewPage,
  checkoutCompletePage,
}) => {
  await productsPage.goto();
  await director.caption('1. Add products to the cart');
  await director.click(productsPage.addToCartButton(products.woolThrow.name));
  await director.click(productsPage.addToCartButton(products.fikaMug.name));
  await expect(productsPage.header.cartBadge).toHaveText('2');

  await director.caption('2. Open the cart and check out');
  await director.click(productsPage.header.cartLink);
  await expect(cartPage.items).toHaveCount(2);
  await director.pause(500);
  await director.click(cartPage.checkoutButton);

  await director.caption('3. Fill in delivery details');
  await director.type(checkoutInfoPage.firstName, validCustomer.firstName);
  await director.type(checkoutInfoPage.lastName, validCustomer.lastName);
  await director.type(checkoutInfoPage.postalCode, validCustomer.postalCode);
  await director.click(checkoutInfoPage.continueButton);

  await director.caption('4. Review: subtotal + 25% VAT = total');
  const totals = await checkoutReviewPage.totals();
  expect(totals.total).toBe(totals.subtotal * 1.25);
  await director.pause(1200);
  await director.click(checkoutReviewPage.placeOrderButton);

  await director.caption('5. Order confirmed ✓');
  await expect(checkoutCompletePage.title).toBeVisible();
  await expect(checkoutCompletePage.orderId).toHaveText(/^LG-\d+$/);
  await director.pause(1500);
});

test('validation-flow: delivery form and a mocked server error', async ({
  page,
  director,
  seedCart,
  checkoutInfoPage,
  checkoutReviewPage,
}) => {
  await seedCart([{ id: products.oakStool.id, qty: 1 }]);
  await checkoutInfoPage.goto();

  await director.caption('Empty form: first name is required');
  await director.click(checkoutInfoPage.continueButton);
  await expect(checkoutInfoPage.error).toHaveText('First name is required');
  await director.pause(800);

  await director.caption('Postal code must be 5 digits');
  await director.type(checkoutInfoPage.firstName, 'Alva');
  await director.type(checkoutInfoPage.lastName, 'Lind');
  await director.type(checkoutInfoPage.postalCode, 'ABC 12');
  await director.click(checkoutInfoPage.continueButton);
  await expect(checkoutInfoPage.error).toHaveText('Postal code must be 5 digits, for example 114 55');
  await director.pause(800);

  await director.type(checkoutInfoPage.postalCode, '114 55');
  await director.click(checkoutInfoPage.continueButton);

  await director.caption('Network mock: the API answers 409 out of stock');
  await page.route('**/api/orders', (route) =>
    route.fulfill({ status: 409, json: { error: 'Oak Stool is out of stock' } }),
  );
  await director.pause(600);
  await director.click(checkoutReviewPage.placeOrderButton);
  await expect(checkoutReviewPage.error).toHaveText('Oak Stool is out of stock');
  await director.caption('The error is shown and the user can retry ✓');
  await director.pause(1500);
});
