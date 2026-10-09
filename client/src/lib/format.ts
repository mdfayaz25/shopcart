const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const formatINR = (n: number) => inr.format(Math.round(n));

export const FREE_SHIPPING_OVER = 2999;
export const SHIPPING_FEE = 149;
export const GST_RATE = 0.18;

/** Mirrors server/src/lib/pricing.ts for display. The server recalculates on checkout. */
export function estimateTotals(items: { price: number; qty: number }[]) {
  const itemsPrice = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingPrice = itemsPrice === 0 || itemsPrice >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
  const taxPrice = Math.round(itemsPrice * GST_RATE * 100) / 100;
  return { itemsPrice, shippingPrice, taxPrice, totalPrice: itemsPrice + shippingPrice + taxPrice };
}

export const discountPct = (price: number, compareAt?: number) => (compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0);
