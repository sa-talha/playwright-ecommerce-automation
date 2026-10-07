import { test, expect } from '../../src/fixtures/test';
import { users } from '../../src/data/users';

test.describe('Login API', () => {
  test('valid credentials return a token and the user @smoke', async ({ api }) => {
    const res = await api.login(users.standard.username, users.standard.password);

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.token).toMatch(/^[a-f0-9]{32}$/);
    expect(body.user).toEqual({ username: users.standard.username, name: 'Alva Lind' });
    expect(body.user).not.toHaveProperty('password');
  });

  test('each login gets a new token', async ({ api }) => {
    const first = await api.token(users.standard.username, users.standard.password);
    const second = await api.token(users.standard.username, users.standard.password);
    expect(first).not.toBe(second);
  });

  const negativeCases = [
    { name: 'wrong password', username: users.standard.username, password: 'nope', status: 401, error: 'Username and password do not match any user' },
    { name: 'locked account', username: users.locked.username, password: users.locked.password, status: 423, error: 'This account has been locked' },
    { name: 'missing username', username: undefined, password: 'x', status: 400, error: 'Username is required' },
    { name: 'missing password', username: users.standard.username, password: undefined, status: 400, error: 'Password is required' },
  ];

  for (const c of negativeCases) {
    test(`${c.name} returns ${c.status}`, async ({ api }) => {
      const res = await api.login(c.username, c.password);
      expect(res.status()).toBe(c.status);
      expect(await res.json()).toEqual({ error: c.error });
    });
  }
});
