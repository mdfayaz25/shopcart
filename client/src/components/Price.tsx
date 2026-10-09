import { discountPct, formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';

export function Price({ price, compareAt, size = 'md', className }: { price: number; compareAt?: number; size?: 'md' | 'lg'; className?: string }) {
  const off = discountPct(price, compareAt);
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2 gap-y-1', className)}>
      <span className={cn('tabular font-bold text-ink', size === 'lg' ? 'font-display text-3xl' : 'text-base')}>{formatINR(price)}</span>
      {off > 0 && (
        <>
          <span className={cn('tabular text-muted line-through', size === 'lg' ? 'text-lg' : 'text-sm')}>{formatINR(compareAt!)}</span>
          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700">{off}% off</span>
        </>
      )}
    </span>
  );
}
