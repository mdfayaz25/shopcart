import { Heart, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { useAppDispatch } from '@/store';
import { addItem } from '@/store/cartSlice';
import { discountPct } from '@/lib/format';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';
import { ProductArt } from './ProductArt';
import { Price } from './Price';
import { Rating } from './Rating';

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const dispatch = useAppDispatch();
  const wishlist = useWishlist();
  const saved = wishlist.has(product.id);
  const off = discountPct(product.price, product.compareAtPrice);
  const soldOut = product.stock === 0;

  return (
    <article className={cn('group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:shadow-lift', className)}>
      <Link to={`/product/${product.slug}`} className="relative block" aria-label={product.name}>
        <ProductArt {...product} className="aspect-[4/3.4] transition duration-500 group-hover:scale-[1.04]" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {off > 0 && <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-white">−{off}%</span>}
          {soldOut ? (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-ink backdrop-blur">Sold out</span>
          ) : product.stock <= 5 ? (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-brand-700 backdrop-blur">Only {product.stock} left</span>
          ) : null}
        </div>
      </Link>
      <button
        onClick={() => wishlist.toggle(product.id)}
        aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        aria-pressed={saved}
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition hover:scale-110"
      >
        <Heart className={cn('h-4 w-4 transition', saved && 'fill-brand-500 text-brand-500')} />
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
          <span>{product.brand}</span>
          <Rating value={product.rating} size={12} className="text-xs" />
        </div>
        <Link to={`/product/${product.slug}`} className="line-clamp-2 font-display text-[17px] font-bold leading-snug text-ink hover:text-brand-600">
          {product.name}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <Price price={product.price} compareAt={product.compareAtPrice} />
          <button
            disabled={soldOut}
            onClick={() => {
              dispatch(addItem({ product }));
              toast.success(`${product.name} added to cart`);
            }}
            aria-label={`Add ${product.name} to cart`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-muted"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="aspect-[4/3.4] animate-pulse bg-surface-2" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-surface-2" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-surface-2" />
      </div>
    </div>
  );
}
