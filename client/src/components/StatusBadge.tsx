import type { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

const styles: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  paid: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  shipped: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  cancelled: 'bg-surface-2 text-muted ring-line',
};
const labels: Record<OrderStatus, string> = { pending: 'Awaiting payment', paid: 'Paid', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset', styles[status], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}
