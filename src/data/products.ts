/** Known catalogue, used to assert what the UI and API return. */
export const products = {
  fikaMug: { id: 1, name: 'Fika Mug', price: 149 },
  birchLamp: { id: 2, name: 'Birch Desk Lamp', price: 899 },
  woolThrow: { id: 3, name: 'Wool Throw Blanket', price: 649 },
  oakStool: { id: 4, name: 'Oak Stool', price: 1290 },
  candles: { id: 5, name: 'Beeswax Candle Set', price: 199 },
  monstera: { id: 6, name: 'Monstera Plant', price: 349, soldOut: true },
} as const;

export const catalogueSize = Object.keys(products).length;
