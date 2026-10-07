// Seed data for the Lagom Store demo app.
// Prices are in Swedish kronor (SEK) and exclude VAT (moms).

const VAT_RATE = 0.25;

const users = [
  { username: 'standard_user', password: 'lagom2026', name: 'Alva Lind', locked: false },
  { username: 'locked_user', password: 'lagom2026', name: 'Nils Berg', locked: true },
];

const products = [
  {
    id: 1,
    slug: 'fika-mug',
    name: 'Fika Mug',
    price: 149,
    category: 'Kitchen',
    description: 'Hand-glazed stoneware mug that holds a proper afternoon coffee.',
    stock: 24,
  },
  {
    id: 2,
    slug: 'birch-desk-lamp',
    name: 'Birch Desk Lamp',
    price: 899,
    category: 'Lighting',
    description: 'Warm, dimmable lamp with a solid birch arm and a linen shade.',
    stock: 8,
  },
  {
    id: 3,
    slug: 'wool-throw',
    name: 'Wool Throw Blanket',
    price: 649,
    category: 'Textiles',
    description: 'Soft Gotland wool throw for long November evenings.',
    stock: 12,
  },
  {
    id: 4,
    slug: 'oak-stool',
    name: 'Oak Stool',
    price: 1290,
    category: 'Furniture',
    description: 'Three-legged stool in oiled oak. Works as a side table too.',
    stock: 5,
  },
  {
    id: 5,
    slug: 'beeswax-candles',
    name: 'Beeswax Candle Set',
    price: 199,
    category: 'Home',
    description: 'Four hand-dipped beeswax candles with a clean, slow burn.',
    stock: 40,
  },
  {
    id: 6,
    slug: 'monstera-plant',
    name: 'Monstera Plant',
    price: 349,
    category: 'Plants',
    description: 'Easy-going Monstera in a 17 cm ceramic pot.',
    stock: 0,
  },
];

module.exports = { VAT_RATE, users, products };
