import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Rating({ value, count, size = 14, className }: { value: number; count?: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm', className)} aria-label={`Rated ${value} out of 5`}>
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, value - i + 1));
          return (
            <span key={i} className="relative" style={{ width: size, height: size }}>
              <Star className="absolute inset-0 text-surface-3" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className="text-amber-400" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
              </span>
            </span>
          );
        })}
      </span>
      {count !== undefined && <span className="tabular text-muted">({count})</span>}
    </span>
  );
}

export function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          onClick={() => onChange(i)}
          className="rounded-md p-0.5 transition hover:scale-110"
        >
          <Star className={cn('h-7 w-7', i <= value ? 'text-amber-400' : 'text-surface-3')} fill="currentColor" strokeWidth={0} />
        </button>
      ))}
    </div>
  );
}
