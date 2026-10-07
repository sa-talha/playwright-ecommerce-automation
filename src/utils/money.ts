/**
 * The shop shows prices in Swedish format, for example "1 290,00 kr".
 * These helpers turn that text into numbers so tests can do real arithmetic.
 */
export function parseSek(text: string | null): number {
  if (!text) throw new Error('Expected a price but got empty text');
  const normalised = text
    .replace(/−/g, '-') // Unicode minus sign
    .replace(/[^\d,-]/g, '') // drop spaces, non-breaking spaces and "kr"
    .replace(',', '.');
  const value = Number(normalised);
  if (Number.isNaN(value)) throw new Error(`Could not parse price from "${text}"`);
  return value;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const VAT_RATE = 0.25;
