import { Check, CreditCard, Package, Truck, X } from 'lucide-react';
import type { Order } from '@/types';
import { cn, formatDate } from '@/lib/utils';

export function OrderTimeline({ order }: { order: Order }) {
  if (order.status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-4 text-sm">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white"><X className="h-4 w-4" /></span>
        <div>
          <p className="font-bold">Order cancelled</p>
          {order.cancelledAt && <p className="text-muted">{formatDate(order.cancelledAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>}
        </div>
      </div>
    );
  }
  const steps = [
    { key: 'placed', label: 'Placed', icon: Package, at: order.createdAt, done: true },
    { key: 'paid', label: order.paymentMethod === 'cod' ? 'Confirmed' : 'Paid', icon: CreditCard, at: order.paidAt ?? (order.paymentMethod === 'cod' ? order.createdAt : undefined), done: Boolean(order.paidAt) || order.paymentMethod === 'cod' },
    { key: 'shipped', label: 'Shipped', icon: Truck, at: order.shippedAt, done: Boolean(order.shippedAt) },
    { key: 'delivered', label: 'Delivered', icon: Check, at: order.deliveredAt, done: Boolean(order.deliveredAt) },
  ];
  const lastDone = steps.map((s) => s.done).lastIndexOf(true);

  return (
    <ol className="grid grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.key} className="relative flex flex-col items-center text-center">
          {i > 0 && <span className={cn('absolute right-1/2 top-[18px] h-0.5 w-full -translate-y-1/2', i <= lastDone ? 'bg-brand-500' : 'bg-line')} />}
          <span className={cn('relative grid h-9 w-9 place-items-center rounded-full ring-4 ring-surface transition', s.done ? 'bg-brand-500 text-white' : 'bg-surface-2 text-muted')}>
            <s.icon className="h-4 w-4" />
          </span>
          <span className="mt-2 text-xs font-bold sm:text-sm">{s.label}</span>
          <span className="text-[11px] text-muted sm:text-xs">{s.at && s.done ? formatDate(s.at, { day: 'numeric', month: 'short' }) : '—'}</span>
        </li>
      ))}
    </ol>
  );
}
