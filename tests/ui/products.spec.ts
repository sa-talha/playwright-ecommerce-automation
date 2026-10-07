import { test, expect } from '../../src/fixtures/test';
import { products, catalogueSize } from '../../src/data/products';
import { parseSek } from '../../src/utils/money';
import type { SortOption } from '../../src/pages/ProductsPage';

test.describe('Product list', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.goto();
  });

  test('shows the full catalogue @smoke', async ({ productsPage }) => {
    await expect(productsPage.cards).toHaveCount(catalogueSize);
    await expect(productsPage.resultCount).toHaveText(`${catalogueSize} products`);
  });

  const sortCases: { option: SortOption; label: string; check: 'names' | 'prices'; direction: 1 | -1 }[] = [
    { option: 'name-asc', label: 'name A to Z', check: 'names', direction: 1 },
    { option: 'name-desc', label: 'name Z to A', check: 'names', direction: -1 },
    { option: 'price-asc', label: 'price low to high', check: 'prices', direction: 1 },
    { option: 'price-desc', label: 'price high to low', check: 'prices', direction: -1 },
  ];

  for (const { option, label, check, direction } of sortCases) {
    test(`sorts by ${label}`, async ({ productsPage }) => {
      // Start from a different order so the test proves the sort really changed something.
      await productsPage.sortBy(option === 'price-desc' ? 'price-asc' : 'price-desc');
      await productsPage.sortBy(option);

      if (check === 'names') {
        await expect
          .poll(() => productsPage.productNames())
          .toEqual(Object.values(products).map((p) => p.name).sort((a, b) => direction * a.localeCompare(b)));
      } else {
        await expect
          .poll(() => productsPage.productPrices())
          .toEqual(Object.values(products).map((p) => p.price).sort((a, b) => direction * (a - b)));
      }
    });
  }

  test('search narrows the list as you type', async ({ productsPage }) => {
    await productsPage.searchFor('lamp');

    await expect(productsPage.cards).toHaveCount(1);
    await expect(productsPage.card(products.birchLamp.name)).toBeVisible();
    await expect(productsPage.resultCount).toHaveText('1 product');
  });

  test('search with no matches shows an empty state', async ({ productsPage }) => {
    await productsPage.searchFor('surfboard');

    await expect(productsPage.cards).toHaveCount(0);
    await expect(productsPage.emptyState).toContainText('No products match "surfboard"');
  });

  test('sold out products cannot be added to the cart', async ({ productsPage }) => {
    const button = productsPage.addToCartButton(products.monstera.name);

    await expect(button).toBeDisabled();
    await expect(button).toHaveText('Sold out');
  });

  test('prices on the cards match the catalogue', async ({ productsPage }) => {
    for (const p of Object.values(products)) {
      const text = await productsPage.card(p.name).getByTestId('product-price').textContent();
      expect.soft(parseSek(text), p.name).toBe(p.price);
    }
  });
});

test.describe('Product detail', () => {
  test('opens from the list and shows the right product', async ({ productsPage, productPage, page }) => {
    await productsPage.goto();
    await productsPage.openProduct(products.woolThrow.name);

    await expect(page).toHaveURL(new RegExp(`product\\.html\\?id=${products.woolThrow.id}`));
    await expect(productPage.name).toHaveText(products.woolThrow.name);
    await expect(productPage.description).not.toBeEmpty();
    expect(parseSek(await productPage.price.textContent())).toBe(products.woolThrow.price);
    await expect(page).toHaveTitle(`${products.woolThrow.name} | Lagom Store`);
  });

  test('adding from the detail page updates the cart badge', async ({ productPage }) => {
    await productPage.gotoProduct(products.oakStool.id);
    await expect(productPage.header.cartBadge).toBeHidden();

    await productPage.addToCart.click();

    await expect(productPage.header.cartBadge).toHaveText('1');
  });

  test('unknown product id shows a friendly message', async ({ productPage }) => {
    await productPage.gotoProduct(999);
    await expect(productPage.notFound).toHaveText('We could not find that product.');
  });
});
