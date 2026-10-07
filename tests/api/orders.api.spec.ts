import { test, expect } from '../../src/fixtures/test';
import { users } from '../../src/data/users';
import { products } from '../../src/data/products';
import { validCustomer } from '../../src/data/checkout';
import { round2, VAT_RATE } from '../../src/utils/money';

test.describe('Orders API', () => {
  let token: string;

  test.beforeEach(async ({ api }) => {
    token = await api.token(users.standard.username, users.standard.password);
  });

  test('creates an order and calculates VAT on the server @smoke', async ({ api }) => {
    const items = [
      { id: products.fikaMug.id, qty: 2 },
      { id: products.oakStool.id, qty: 1 },
    ];
    const res = await api.createOrder({ items, customer: validCustomer }, token);

    expect(res.status()).toBe(201);
    const order = await res.json();
    const subtotal = products.fikaMug.price * 2 + products.oakStool.price;
    expect(order).toMatchObject({
      orderId: expect.stringMatching(/^LG-\d+$/),
      subtotal,
      tax: round2(subtotal * VAT_RATE),
      total: round2(subtotal * (1 + VAT_RATE)),
    });
    expect(order.lines).toHaveLength(2);
  });

  test('order ids are unique', async ({ api }) => {
    const body = { items: [{ id: products.candles.id, qty: 1 }], customer: validCustomer };
    const [a, b] = await Promise.all([api.createOrder(body, token), api.createOrder(body, token)]);
    expect((await a.json()).orderId).not.toBe((await b.json()).orderId);
  });

  test('rejects requests without a token', async ({ api }) => {
    const res = await api.createOrder({ items: [{ id: 1, qty: 1 }], customer: validCustomer });
    expect(res.status()).toBe(401);
  });

  test('rejects an invalid token', async ({ api }) => {
    const res = await api.createOrder({ items: [{ id: 1, qty: 1 }], customer: validCustomer }, 'not-a-real-token');
    expect(res.status()).toBe(401);
  });

  const badOrders = [
    { name: 'empty cart', body: { items: [], customer: validCustomer }, status: 400, error: /Cart is empty/ },
    { name: 'missing customer', body: { items: [{ id: 1, qty: 1 }] }, status: 400, error: /Missing customer fields: firstName, lastName, postalCode/ },
    { name: 'bad postal code', body: { items: [{ id: 1, qty: 1 }], customer: { ...validCustomer, postalCode: '12' } }, status: 400, error: /Postal code must be 5 digits/ },
    { name: 'unknown product', body: { items: [{ id: 999, qty: 1 }], customer: validCustomer }, status: 400, error: /Unknown product id 999/ },
    { name: 'zero quantity', body: { items: [{ id: 1, qty: 0 }], customer: validCustomer }, status: 400, error: /Invalid quantity/ },
    { name: 'sold out product', body: { items: [{ id: products.monstera.id, qty: 1 }], customer: validCustomer }, status: 409, error: /out of stock/ },
  ];

  for (const c of badOrders) {
    test(`${c.name} returns ${c.status}`, async ({ api }) => {
      const res = await api.createOrder(c.body, token);
      expect(res.status()).toBe(c.status);
      expect((await res.json()).error).toMatch(c.error);
    });
  }
});
