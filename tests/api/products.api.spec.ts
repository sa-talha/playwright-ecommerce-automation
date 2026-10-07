import { test, expect } from '../../src/fixtures/test';
import { products, catalogueSize } from '../../src/data/products';

test.describe('Products API', () => {
  test('health check responds ok @smoke', async ({ api }) => {
    const res = await api.health();
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  test('GET /api/products returns every product with the expected shape @smoke', async ({ api }) => {
    const res = await api.products();

    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/json');
    const body = await res.json();
    expect(body).toHaveLength(catalogueSize);
    for (const item of body) {
      expect(item).toEqual({
        id: expect.any(Number),
        slug: expect.stringMatching(/^[a-z0-9-]+$/),
        name: expect.any(String),
        price: expect.any(Number),
        category: expect.any(String),
        description: expect.any(String),
        stock: expect.any(Number),
      });
      expect(item.price).toBeGreaterThan(0);
      expect(item.stock).toBeGreaterThanOrEqual(0);
    }
  });

  test('sort=price-asc returns products cheapest first', async ({ api }) => {
    const prices: number[] = (await (await api.products({ sort: 'price-asc' })).json()).map(
      (p: { price: number }) => p.price,
    );
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('q filters by name, case insensitive', async ({ api }) => {
    const body = await (await api.products({ q: 'OAK' })).json();
    expect(body.map((p: { name: string }) => p.name)).toEqual([products.oakStool.name]);
  });

  test('GET /api/products/:id returns one product', async ({ api }) => {
    const res = await api.product(products.birchLamp.id);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ id: products.birchLamp.id, name: products.birchLamp.name, price: products.birchLamp.price });
  });

  test('unknown product id returns 404', async ({ api }) => {
    const res = await api.product(999);
    expect(res.status()).toBe(404);
    expect(await res.json()).toEqual({ error: 'Product not found' });
  });
});
