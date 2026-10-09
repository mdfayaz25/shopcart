import type { ReactNode } from 'react';
import { estimateTotals, formatINR, FREE_SHIPPING_OVER } from '@/lib/format';

type Totals = { itemsPrice: number; shippingPrice: number; taxPrice: number; totalPrice: number };

export function OrderSummary({ items, totals, children, title = 'Order summary' }: { items?: { price: number; qty: number }[]; totals?: Totals; children?: ReactNode; title?: string }) {
  const t = totals ?? estimateTotals(items ?? []);
  return (
    <aside className="h-fit space-y-5 rounded-3xl border border-line bg-surface p-6 lg:sticky lg:top-24">
      <h2 className="text-xl font-bold">{title}</h2>
      <dl className="space-y-3 text-sm">
        <Row label="Subtotal" value={formatINR(t.itemsPrice)} />
        <Row label="Delivery" value={t.shippingPrice ? formatINR(t.shippingPrice) : 'Free'} />
        <Row label="GST (18%)" value={formatINR(t.taxPrice)} />
        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <dt className="font-bold">Total</dt>
          <dd className="tabular font-display text-2xl font-extrabold">{formatINR(t.totalPrice)}</dd>
        </div>
      </dl>
      {!totals && t.shippingPrice > 0 && (
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800">Add {formatINR(FREE_SHIPPING_OVER - t.itemsPrice)} more to get free delivery.</p>
      )}
      {children && <div className="space-y-3">{children}</div>}
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular font-semibold">{value}</dd>
    </div>
  );
}
