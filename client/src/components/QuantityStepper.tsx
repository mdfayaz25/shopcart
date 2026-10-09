import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuantityStepper({ value, max, onChange, size = 'md' }: { value: number; max: number; onChange: (n: number) => void; size?: 'sm' | 'md' }) {
  const h = size === 'sm' ? 'h-8' : 'h-11';
  return (
    <div className={cn('inline-flex items-center rounded-full border border-line bg-surface', h)}>
      <button type="button" aria-label="Decrease quantity" disabled={value <= 1} onClick={() => onChange(value - 1)} className={cn('grid place-items-center rounded-full text-ink transition hover:bg-surface-2 disabled:opacity-30', size === 'sm' ? 'h-8 w-8' : 'h-11 w-11')}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="tabular w-7 text-center text-sm font-bold" aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(value + 1)} className={cn('grid place-items-center rounded-full text-ink transition hover:bg-surface-2 disabled:opacity-30', size === 'sm' ? 'h-8 w-8' : 'h-11 w-11')}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
