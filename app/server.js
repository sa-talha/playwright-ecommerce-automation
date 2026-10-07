// Lagom Store: a small demo web shop used as the system under test.
// Plain Node.js, no dependencies. Serves the static front end and a JSON API.
//
//   node app/server.js            -> http://localhost:3000
//   PORT=4000 node app/server.js  -> http://localhost:4000

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { VAT_RATE, users, products } = require('./data');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const sessions = new Map(); // token -> username
let orderCounter = 1000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const round2 = (n) => Math.round(n * 100) / 100;

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function authUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const username = token && sessions.get(token);
  return username ? users.find((u) => u.username === username) : null;
}

function sortProducts(list, sort) {
  const copy = [...list];
  switch (sort) {
    case 'name-asc':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return copy.sort((a, b) => b.name.localeCompare(a.name));
    case 'price-asc':
      return copy.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return copy.sort((a, b) => b.price - a.price);
    default:
      return copy;
  }
}

async function handleApi(req, res, url) {
  const { pathname, searchParams } = url;

  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, { status: 'ok' });
  }

  if (req.method === 'GET' && pathname === '/api/products') {
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    let list = products;
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return sendJson(res, 200, sortProducts(list, searchParams.get('sort')));
  }

  const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
  if (req.method === 'GET' && productMatch) {
    const product = products.find((p) => p.id === Number(productMatch[1]));
    return product
      ? sendJson(res, 200, product)
      : sendJson(res, 404, { error: 'Product not found' });
  }

  if (req.method === 'POST' && pathname === '/api/login') {
    let body;
    try {
      body = await readBody(req);
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON body' });
    }
    const { username, password } = body;
    if (!username) return sendJson(res, 400, { error: 'Username is required' });
    if (!password) return sendJson(res, 400, { error: 'Password is required' });
    const user = users.find((u) => u.username === username && u.password === password);
    if (!user) return sendJson(res, 401, { error: 'Username and password do not match any user' });
    if (user.locked) return sendJson(res, 423, { error: 'This account has been locked' });
    const token = crypto.randomBytes(16).toString('hex');
    sessions.set(token, user.username);
    return sendJson(res, 200, { token, user: { username: user.username, name: user.name } });
  }

  if (req.method === 'POST' && pathname === '/api/orders') {
    const user = authUser(req);
    if (!user) return sendJson(res, 401, { error: 'Authentication required' });
    let body;
    try {
      body = await readBody(req);
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON body' });
    }
    const { items, customer } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return sendJson(res, 400, { error: 'Cart is empty' });
    }
    const missing = ['firstName', 'lastName', 'postalCode'].filter(
      (f) => !customer || !String(customer[f] || '').trim(),
    );
    if (missing.length) {
      return sendJson(res, 400, { error: `Missing customer fields: ${missing.join(', ')}` });
    }
    if (!/^\d{3}\s?\d{2}$/.test(String(customer.postalCode).trim())) {
      return sendJson(res, 400, { error: 'Postal code must be 5 digits, for example 114 55' });
    }
    let subtotal = 0;
    const lines = [];
    for (const item of items) {
      const product = products.find((p) => p.id === Number(item.id));
      const qty = Number(item.qty);
      if (!product) return sendJson(res, 400, { error: `Unknown product id ${item.id}` });
      if (!Number.isInteger(qty) || qty < 1) {
        return sendJson(res, 400, { error: `Invalid quantity for ${product.name}` });
      }
      if (qty > product.stock) {
        return sendJson(res, 409, { error: `${product.name} is out of stock` });
      }
      subtotal += product.price * qty;
      lines.push({ id: product.id, name: product.name, qty, price: product.price });
    }
    const tax = round2(subtotal * VAT_RATE);
    orderCounter += 1;
    return sendJson(res, 201, {
      orderId: `LG-${orderCounter}`,
      lines,
      subtotal: round2(subtotal),
      tax,
      total: round2(subtotal + tax),
    });
  }

  if (req.method === 'POST' && pathname === '/api/logout') {
    const header = req.headers.authorization || '';
    sessions.delete(header.replace('Bearer ', ''));
    res.writeHead(204);
    return res.end();
  }

  return sendJson(res, 404, { error: 'Not found' });
}

function serveStatic(req, res, url) {
  let filePath = decodeURIComponent(url.pathname);
  if (filePath === '/') filePath = '/index.html';
  const resolved = path.normalize(path.join(PUBLIC_DIR, filePath));
  if (!resolved.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(resolved, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(resolved)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) {
    handleApi(req, res, url).catch(() => sendJson(res, 500, { error: 'Internal error' }));
  } else {
    serveStatic(req, res, url);
  }
});

server.listen(PORT, () => {
  console.log(`Lagom Store running at http://localhost:${PORT}`);
});
