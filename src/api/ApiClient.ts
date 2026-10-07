import { type APIRequestContext, type APIResponse } from '@playwright/test';

export type OrderItem = { id: number; qty: number };
export type CustomerBody = { firstName?: string; lastName?: string; postalCode?: string };

/** Thin wrapper around the Lagom Store JSON API. */
export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  health(): Promise<APIResponse> {
    return this.request.get('/api/health');
  }

  products(params: { sort?: string; q?: string } = {}): Promise<APIResponse> {
    return this.request.get('/api/products', { params });
  }

  product(id: number | string): Promise<APIResponse> {
    return this.request.get(`/api/products/${id}`);
  }

  login(username?: string, password?: string): Promise<APIResponse> {
    return this.request.post('/api/login', { data: { username, password } });
  }

  /** Logs in and returns the bearer token, failing loudly if login does not work. */
  async token(username: string, password: string): Promise<string> {
    const res = await this.login(username, password);
    if (!res.ok()) throw new Error(`Login failed for ${username}: ${res.status()} ${await res.text()}`);
    return (await res.json()).token;
  }

  createOrder(
    body: { items?: OrderItem[]; customer?: CustomerBody },
    token?: string,
  ): Promise<APIResponse> {
    return this.request.post('/api/orders', {
      data: body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}
