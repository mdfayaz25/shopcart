import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { CATEGORIES, type Paginated, type Product } from '@/types';
import { ProductCard, ProductCardSkeleton } from '@/components/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Rating } from '@/components/Rating';
import { cn } from '@/lib/utils';

const SORTS = [
  ['newest', 'Newest'],
  ['popular', 'Most popular'],
  ['rating', 'Top rated'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
] as const;

const PRICE_RANGES: [string, number | undefined, number | undefined][] = [
  ['Any price', undefined, undefined],
  ['Under ₹5,000', undefined, 5000],
  ['₹5,000 – ₹15,000', 5000, 15000],
  ['₹15,000 – ₹40,000', 15000, 40000],
  ['Over ₹40,000', 40000, undefined],
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = Object.fromEntries(params.entries());
  const page = Number(params.get('page') ?? 1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', query],
    queryFn: async () => (await api.get<Paginated<Product>>('/products', { params: { limit: 12, ...query } })).data,
    placeholderData: keepPreviousData,
  });

  useEffect(() => window.scrollTo({ top: 0, behavior: 'smooth' }), [page]);

  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === undefined || v === '' ? next.delete(k) : next.set(k, v)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  const active = [
    params.get('search') && { key: 'search', label: `“${params.get('search')}”` },
    params.get('category') && { key: 'category', label: params.get('category')! },
    params.get('featured') && { key: 'featured', label: 'Featured' },
    params.get('rating') && { key: 'rating', label: `${params.get('rating')}★ & up` },
    params.get('inStock') && { key: 'inStock', label: 'In stock' },
    (params.get('minPrice') || params.get('maxPrice')) && { key: 'price', label: PRICE_RANGES.find(([, a, b]) => String(a ?? '') === (params.get('minPrice') ?? '') && String(b ?? '') === (params.get('maxPrice') ?? ''))?.[0] ?? 'Price' },
  ].filter(Boolean) as { key: string; label: string }[];

  const title = params.get('category') ?? (params.get('search') ? 'Search results' : params.get('featured') ? 'Featured' : 'All products');

  const filters = (
    <div className="space-y-8">
      <FilterGroup title="Category">
        <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start lg:gap-1">
          <FilterOption active={!params.get('category')} onClick={() => update({ category: undefined })}>All</FilterOption>
          {CATEGORIES.map((c) => (
            <FilterOption key={c} active={params.get('category') === c} onClick={() => update({ category: c })}>{c}</FilterOption>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Price">
        <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start lg:gap-1">
          {PRICE_RANGES.map(([label, min, max]) => (
            <FilterOption
              key={label}
              active={(params.get('minPrice') ?? '') === String(min ?? '') && (params.get('maxPrice') ?? '') === String(max ?? '')}
              onClick={() => update({ minPrice: min?.toString(), maxPrice: max?.toString() })}
            >
              {label}
            </FilterOption>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Rating">
        <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start lg:gap-1">
          {[4, 3].map((r) => (
            <FilterOption key={r} active={params.get('rating') === String(r)} onClick={() => update({ rating: params.get('rating') === String(r) ? undefined : String(r) })}>
              <Rating value={r} size={13} /> <span>& up</span>
            </FilterOption>
          ))}
        </div>
      </FilterGroup>
      <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
        <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={params.get('inStock') === 'true'} onChange={(e) => update({ inStock: e.target.checked ? 'true' : undefined })} />
        In stock only
      </label>
    </div>
  );

  return (
    <div className="container-x pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="label-eyebrow">Shop</p>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">{title}</h1>
          <p className="tabular mt-2 text-sm text-muted">{data ? `${data.total} product${data.total === 1 ? '' : 's'}` : 'Loading…'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" /> Filters {active.length > 0 && <span className="tabular rounded-full bg-ink px-1.5 text-xs text-white">{active.length}</span>}
          </Button>
          <label className="sr-only" htmlFor="sort">Sort by</label>
          <select
            id="sort"
            value={params.get('sort') ?? 'newest'}
            onChange={(e) => update({ sort: e.target.value })}
            className="h-10 rounded-xl border border-line bg-surface px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-ink/5"
          >
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {active.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {active.map((f) => (
            <button
              key={f.key}
              onClick={() => update(f.key === 'price' ? { minPrice: undefined, maxPrice: undefined } : { [f.key]: undefined })}
              className="chip"
            >
              {f.label} <X className="h-3.5 w-3.5" />
            </button>
          ))}
          <button onClick={() => setParams(params.get('sort') ? { sort: params.get('sort')! } : {})} className="text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline">Clear all</button>
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>

        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)}</div>
          ) : data && data.items.length > 0 ? (
            <>
              <div className={cn('grid grid-cols-2 gap-3 transition-opacity sm:gap-5 xl:grid-cols-3', isFetching && 'opacity-60')}>
                {data.items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {data.pages > 1 && (
                <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
                  <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
                  {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => update({ page: String(n) })}
                      aria-current={n === page ? 'page' : undefined}
                      className={cn('tabular h-9 w-9 rounded-lg text-sm font-bold transition', n === page ? 'bg-ink text-white' : 'hover:bg-surface-2')}
                    >
                      {n}
                    </button>
                  ))}
                  <Button variant="outline" size="icon" disabled={page >= data.pages} onClick={() => update({ page: String(page + 1) })} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
                </nav>
              )}
            </>
          ) : (
            <EmptyState icon={SearchX} title="No products match" text="Try a different search or remove a filter or two." action={<Button variant="outline" onClick={() => setParams({})}>Clear filters</Button>} />
          )}
        </div>
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFiltersOpen(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">Filters</h2>
                <button onClick={() => setFiltersOpen(false)} className="rounded-full p-2 hover:bg-surface-2" aria-label="Close filters"><X className="h-5 w-5" /></button>
              </div>
              {filters}
              <Button size="lg" className="mt-8 w-full" onClick={() => setFiltersOpen(false)}>Show {data?.total ?? ''} products</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-[.14em] text-muted">{title}</p>
      {children}
    </div>
  );
}

function FilterOption({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition lg:rounded-lg lg:px-2.5',
        active ? 'bg-ink text-white' : 'text-muted hover:bg-surface-2 hover:text-ink max-lg:border max-lg:border-line',
      )}
    >
      {children}
    </button>
  );
}
