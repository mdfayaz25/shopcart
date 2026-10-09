/** All prices are in INR. Kept on the server so the client can never set its own totals. */
export const FREE_SHIPPING_OVER = 2999;
export const SHIPPING_FEE = 149;
export const GST_RATE = 0.18;

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeTotals(items: { price: number; qty: number }[]) {
  const itemsPrice = round2(items.reduce((sum, i) => sum + i.price * i.qty, 0));
  const shippingPrice = itemsPrice === 0 || itemsPrice >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
  const taxPrice = round2(itemsPrice * GST_RATE);
  return { itemsPrice, shippingPrice, taxPrice, totalPrice: round2(itemsPrice + shippingPrice + taxPrice) };
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
