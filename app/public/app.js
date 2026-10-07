// Lagom Store front end. One small script shared by every page.
// The page to render is chosen from <body data-page="...">.

const SESSION_KEY = 'lagom.session';
const CART_KEY = 'lagom.cart';
const CUSTOMER_KEY = 'lagom.customer';
const ORDER_KEY = 'lagom.lastOrder';
const VAT_RATE = 0.25;

const money = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' });
const fmt = (n) => money.format(n);

const $ = (sel, root = document) => root.querySelector(sel);
const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ---------- storage helpers ----------
const store = {
  get(key, fallback, area = localStorage) {
    try {
      return JSON.parse(area.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value, area = localStorage) {
    area.setItem(key, JSON.stringify(value));
  },
};

const getSession = () => store.get(SESSION_KEY, null);
const getCart = () => store.get(CART_KEY, []);
const setCart = (cart) => {
  store.set(CART_KEY, cart);
  updateBadge();
};
const cartCount = () => getCart().reduce((sum, i) => sum + i.qty, 0);

function addToCart(id) {
  const cart = getCart();
  const line = cart.find((i) => i.id === id);
  if (line) line.qty += 1;
  else cart.push({ id, qty: 1 });
  setCart(cart);
}
function changeQty(id, delta) {
  const cart = getCart()
    .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
    .filter((i) => i.qty > 0);
  setCart(cart);
}
function removeFromCart(id) {
  setCart(getCart().filter((i) => i.id !== id));
}

async function api(path, options = {}) {
  const session = getSession();
  const headers = { 'Content-Type': 'application/json' };
  if (session) headers.Authorization = `Bearer ${session.token}`;
  const res = await fetch(path, { ...options, headers });
  const body = res.status === 204 ? null : await res.json();
  return { status: res.status, ok: res.ok, body };
}

// ---------- shared header ----------
function renderTopbar() {
  const slot = $('#topbar');
  if (!slot) return;
  const session = getSession();
  slot.replaceWith(
    el(`
    <header class="topbar">
      <a class="brand" href="products.html" data-test="brand"><span class="brand-mark">L</span>Lagom Store</a>
      <div class="topbar-actions">
        <span class="greeting" data-test="greeting">Hej, ${escapeHtml(session?.user.name.split(' ')[0] ?? '')}</span>
        <a class="cart-link" href="cart.html" data-test="cart-link" aria-label="Shopping cart">
          Cart <span class="cart-badge" data-test="cart-badge"></span>
        </a>
        <button class="link-button" data-test="logout">Log out</button>
      </div>
    </header>`),
  );
  $('[data-test="logout"]').addEventListener('click', async () => {
    await api('/api/logout', { method: 'POST' });
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CART_KEY);
    window.location.href = 'index.html';
  });
  updateBadge();
}

function updateBadge() {
  const badge = $('[data-test="cart-badge"]');
  if (!badge) return;
  const count = cartCount();
  badge.textContent = count;
  badge.hidden = count === 0;
}

function requireSession() {
  if (!getSession()) {
    window.location.replace('index.html?reason=login-required');
    return false;
  }
  return true;
}

// ---------- pages ----------
const pages = {
  login() {
    if (getSession()) return window.location.replace('products.html');
    const form = $('#login-form');
    const error = $('[data-test="error"]');
    const username = $('#username');
    const password = $('#password');

    if (new URLSearchParams(location.search).get('reason') === 'login-required') {
      showError('Please log in to continue.');
    }

    function showError(message) {
      $('[data-test="error-text"]').textContent = message;
      error.hidden = false;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      error.hidden = true;
      username.removeAttribute('aria-invalid');
      password.removeAttribute('aria-invalid');
      if (!username.value.trim()) {
        username.setAttribute('aria-invalid', 'true');
        return showError('Username is required');
      }
      if (!password.value) {
        password.setAttribute('aria-invalid', 'true');
        return showError('Password is required');
      }
      const submit = $('[data-test="login-button"]');
      submit.disabled = true;
      const res = await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.value.trim(), password: password.value }),
      });
      submit.disabled = false;
      if (!res.ok) {
        username.setAttribute('aria-invalid', 'true');
        password.setAttribute('aria-invalid', 'true');
        return showError(res.body.error);
      }
      store.set(SESSION_KEY, res.body);
      window.location.href = 'products.html';
    });
  },

  async products() {
    if (!requireSession()) return;
    renderTopbar();
    const grid = $('[data-test="product-grid"]');
    const search = $('[data-test="search"]');
    const sort = $('[data-test="sort"]');
    const count = $('[data-test="result-count"]');

    async function load() {
      const params = new URLSearchParams({ sort: sort.value });
      if (search.value.trim()) params.set('q', search.value.trim());
      const { body: list } = await api(`/api/products?${params}`);
      count.textContent = `${list.length} ${list.length === 1 ? 'product' : 'products'}`;
      grid.innerHTML = '';
      if (!list.length) {
        grid.append(el(`<div class="empty-state" data-test="empty-state">No products match "${escapeHtml(search.value)}".</div>`));
        return;
      }
      for (const p of list) {
        const card = el(`
          <article class="card" data-test="product-card" data-product-id="${p.id}">
            <img src="img/${p.slug}.svg" alt="${escapeHtml(p.name)}" />
            <div class="card-body">
              <span class="card-cat">${escapeHtml(p.category)}</span>
              <a class="card-title" href="product.html?id=${p.id}" data-test="product-name">${escapeHtml(p.name)}</a>
              <div class="card-foot">
                <span class="price" data-test="product-price">${fmt(p.price)}</span>
                ${
                  p.stock > 0
                    ? `<button class="btn btn-primary" data-test="add-to-cart">Add to cart</button>`
                    : `<button class="btn" disabled data-test="add-to-cart">Sold out</button>`
                }
              </div>
            </div>
          </article>`);
        const btn = $('[data-test="add-to-cart"]', card);
        btn.addEventListener('click', () => {
          addToCart(p.id);
          btn.textContent = 'Added ✓';
          setTimeout(() => (btn.textContent = 'Add to cart'), 900);
        });
        grid.append(card);
      }
    }

    let debounce;
    search.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(load, 150);
    });
    sort.addEventListener('change', load);
    await load();
  },

  async product() {
    if (!requireSession()) return;
    renderTopbar();
    const id = Number(new URLSearchParams(location.search).get('id'));
    const root = $('[data-test="product-detail"]');
    const res = await api(`/api/products/${id}`);
    if (!res.ok) {
      root.innerHTML = `<div class="empty-state" data-test="not-found">We could not find that product.</div>`;
      return;
    }
    const p = res.body;
    document.title = `${p.name} | Lagom Store`;
    root.innerHTML = `
      <div class="detail">
        <img src="img/${p.slug}.svg" alt="${escapeHtml(p.name)}" />
        <div>
          <span class="card-cat">${escapeHtml(p.category)}</span>
          <h1 data-test="detail-name">${escapeHtml(p.name)}</h1>
          <p class="desc" data-test="detail-description">${escapeHtml(p.description)}</p>
          <span class="price" data-test="detail-price">${fmt(p.price)}</span>
          ${
            p.stock > 0
              ? `<button class="btn btn-primary" data-test="add-to-cart">Add to cart</button>`
              : `<button class="btn" disabled data-test="add-to-cart">Sold out</button>`
          }
        </div>
      </div>`;
    const btn = $('[data-test="add-to-cart"]', root);
    btn.addEventListener('click', () => {
      addToCart(p.id);
      btn.textContent = 'Added ✓';
    });
  },

  async cart() {
    if (!requireSession()) return;
    renderTopbar();
    const { body: catalog } = await api('/api/products');
    const list = $('[data-test="cart-list"]');
    const summary = $('[data-test="cart-summary"]');

    function render() {
      const lines = getCart()
        .map((i) => ({ ...i, product: catalog.find((p) => p.id === i.id) }))
        .filter((l) => l.product);
      list.innerHTML = '';
      if (!lines.length) {
        list.append(
          el(`<div class="empty-state" data-test="cart-empty">Your cart is empty. <a href="products.html">Browse products</a></div>`),
        );
        summary.hidden = true;
        return;
      }
      summary.hidden = false;
      const panel = el('<div class="panel"></div>');
      for (const l of lines) {
        const row = el(`
          <div class="cart-item" data-test="cart-item" data-product-id="${l.id}">
            <img src="img/${l.product.slug}.svg" alt="" />
            <div>
              <div class="name" data-test="cart-item-name">${escapeHtml(l.product.name)}</div>
              <div class="meta">${fmt(l.product.price)} each</div>
              <div class="qty">
                <button aria-label="Decrease quantity" data-test="qty-decrease">−</button>
                <span data-test="cart-item-qty">${l.qty}</span>
                <button aria-label="Increase quantity" data-test="qty-increase">+</button>
              </div>
            </div>
            <div style="text-align:right">
              <div class="price" data-test="cart-item-total">${fmt(l.product.price * l.qty)}</div>
              <button class="link-button" data-test="remove-item">Remove</button>
            </div>
          </div>`);
        $('[data-test="qty-decrease"]', row).addEventListener('click', () => (changeQty(l.id, -1), render()));
        $('[data-test="qty-increase"]', row).addEventListener('click', () => (changeQty(l.id, 1), render()));
        $('[data-test="remove-item"]', row).addEventListener('click', () => (removeFromCart(l.id), render()));
        panel.append(row);
      }
      list.append(panel);
      const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
      $('[data-test="cart-subtotal"]').textContent = fmt(subtotal);
    }
    render();
  },

  checkout() {
    if (!requireSession()) return;
    renderTopbar();
    if (!getCart().length) return window.location.replace('cart.html');
    const form = $('#checkout-form');
    const error = $('[data-test="error"]');
    const saved = store.get(CUSTOMER_KEY, {}, sessionStorage);
    for (const f of ['firstName', 'lastName', 'postalCode']) if (saved[f]) form[f].value = saved[f];

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      for (const input of form.querySelectorAll('input')) input.removeAttribute('aria-invalid');
      const fail = (field, msg) => {
        form[field].setAttribute('aria-invalid', 'true');
        form[field].focus();
        $('[data-test="error-text"]').textContent = msg;
        error.hidden = false;
      };
      if (!values.firstName.trim()) return fail('firstName', 'First name is required');
      if (!values.lastName.trim()) return fail('lastName', 'Last name is required');
      if (!values.postalCode.trim()) return fail('postalCode', 'Postal code is required');
      if (!/^\d{3}\s?\d{2}$/.test(values.postalCode.trim())) {
        return fail('postalCode', 'Postal code must be 5 digits, for example 114 55');
      }
      store.set(CUSTOMER_KEY, values, sessionStorage);
      window.location.href = 'checkout-review.html';
    });
  },

  async review() {
    if (!requireSession()) return;
    renderTopbar();
    const customer = store.get(CUSTOMER_KEY, null, sessionStorage);
    if (!getCart().length) return window.location.replace('cart.html');
    if (!customer) return window.location.replace('checkout.html');

    const { body: catalog } = await api('/api/products');
    const lines = getCart().map((i) => ({ ...i, product: catalog.find((p) => p.id === i.id) }));
    const list = $('[data-test="review-list"]');
    for (const l of lines) {
      list.append(
        el(`
        <div class="cart-item" data-test="review-item">
          <img src="img/${l.product.slug}.svg" alt="" />
          <div>
            <div class="name">${escapeHtml(l.product.name)}</div>
            <div class="meta">Qty ${l.qty} × ${fmt(l.product.price)}</div>
          </div>
          <div class="price">${fmt(l.product.price * l.qty)}</div>
        </div>`),
      );
    }
    const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
    const tax = Math.round(subtotal * VAT_RATE * 100) / 100;
    $('[data-test="ship-to"]').textContent =
      `${customer.firstName} ${customer.lastName}, ${customer.postalCode}`;
    $('[data-test="summary-subtotal"]').textContent = fmt(subtotal);
    $('[data-test="summary-tax"]').textContent = fmt(tax);
    $('[data-test="summary-total"]').textContent = fmt(subtotal + tax);

    const error = $('[data-test="error"]');
    $('[data-test="place-order"]').addEventListener('click', async (e) => {
      e.target.disabled = true;
      const res = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ items: getCart(), customer }),
      });
      if (!res.ok) {
        e.target.disabled = false;
        $('[data-test="error-text"]').textContent = res.body.error;
        error.hidden = false;
        return;
      }
      store.set(ORDER_KEY, res.body, sessionStorage);
      setCart([]);
      window.location.href = 'checkout-complete.html';
    });
  },

  complete() {
    if (!requireSession()) return;
    renderTopbar();
    const order = store.get(ORDER_KEY, null, sessionStorage);
    if (!order) return window.location.replace('products.html');
    $('[data-test="order-id"]').textContent = order.orderId;
    $('[data-test="order-total"]').textContent = fmt(order.total);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  pages[page]?.();
});
