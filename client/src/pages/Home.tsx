import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgePercent, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Paginated, Product } from '@/types';
import { ProductArt, PRODUCT_ICONS } from '@/components/ProductArt';
import { ProductCard, ProductCardSkeleton } from '@/components/ProductCard';
import { formatINR } from '@/lib/format';

const CATEGORY_META: { name: string; icon: string; tone: string }[] = [
  { name: 'Audio', icon: 'headphones', tone: '#FF5A1F' },
  { name: 'Wearables', icon: 'watch', tone: '#10B981' },
  { name: 'Computing', icon: 'laptop', tone: '#2563EB' },
  { name: 'Cameras', icon: 'camera', tone: '#F97316' },
  { name: 'Gaming', icon: 'gamepad', tone: '#8B5CF6' },
  { name: 'Accessories', icon: 'battery', tone: '#16A34A' },
  { name: 'Home', icon: 'lamp', tone: '#EAB308' },
];

export default function Home() {
  const featured = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => (await api.get<Paginated<Product>>('/products', { params: { featured: true, limit: 8 } })).data,
  });
  const counts = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<{ categories: { name: string; count: number }[] }>('/products/categories')).data.categories,
  });
  const hero = featured.data?.items.find((p) => p.icon === 'headphones') ?? featured.data?.items[0];

  return (
    <div>
      {/* Hero */}
      <section className="container-x pt-4 sm:pt-6">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-ink text-white">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_85%_20%,rgba(255,90,31,.55),transparent_60%),radial-gradient(40%_60%_at_10%_100%,rgba(255,156,115,.25),transparent_70%)]" />
          <div className="grid items-center gap-8 px-6 py-12 sm:px-12 lg:grid-cols-[1.1fr_1fr] lg:py-16">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                <BadgePercent className="h-3.5 w-3.5 text-brand-300" /> Festive sale · up to 25% off
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.02] sm:text-6xl">
                Tech that <span className="text-brand-400">moves</span> with you.
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
                Headphones, wearables and everyday gear, picked for build quality and tested before they ship.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3.5 font-semibold transition hover:bg-brand-400">
                  Shop now <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/shop?featured=true" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 font-semibold transition hover:bg-white/10">
                  Featured picks
                </Link>
              </div>
            </div>
            {hero ? (
              <Link to={`/product/${hero.slug}`} className="group relative mx-auto w-full max-w-[300px] animate-fade-up sm:max-w-md [animation-delay:.1s]">
                <ProductArt {...hero} size="lg" className="aspect-square rounded-[1.75rem] ring-1 ring-white/10 [&]:bg-white/5" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-2xl bg-white/95 p-3.5 text-ink shadow-xl backdrop-blur transition group-hover:-translate-y-1">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{hero.name}</p>
                    <p className="tabular text-sm text-muted">{formatINR(hero.price)}</p>
                  </div>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-white"><ArrowRight className="h-4 w-4" /></span>
                </div>
              </Link>
            ) : (
              <div className="mx-auto aspect-square w-full max-w-md animate-pulse rounded-[1.75rem] bg-white/5" />
            )}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="container-x mt-6 grid gap-3 sm:grid-cols-3">
        {[
          [Truck, 'Free delivery', 'On orders over ₹2,999'],
          [RotateCcw, '10-day returns', 'No questions asked'],
          [ShieldCheck, '1-year warranty', 'On every product'],
        ].map(([Icon, t, s]) => {
          const I = Icon as typeof Truck;
          return (
            <div key={t as string} className="flex items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><I className="h-5 w-5" /></span>
              <div>
                <p className="font-bold">{t as string}</p>
                <p className="text-sm text-muted">{s as string}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Categories */}
      <section className="container-x mt-20">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="label-eyebrow">Browse</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Shop by category</h2>
          </div>
          <Link to="/shop" className="hidden items-center gap-1.5 text-sm font-semibold hover:text-brand-600 sm:flex">All products <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-7">
          {CATEGORY_META.map((c) => {
            const Icon = PRODUCT_ICONS[c.icon];
            const count = counts.data?.find((x) => x.name === c.name)?.count;
            return (
              <Link
                key={c.name}
                to={`/shop?category=${c.name}`}
                className="group flex w-36 shrink-0 snap-start flex-col items-center gap-3 rounded-3xl border border-line bg-surface p-5 text-center transition hover:-translate-y-1 hover:shadow-card sm:w-auto"
              >
                <span className="grid h-16 w-16 place-items-center rounded-2xl transition group-hover:scale-110" style={{ background: `${c.tone}18`, color: c.tone }}>
                  <Icon className="h-8 w-8" strokeWidth={1.5} />
                </span>
                <span>
                  <span className="block font-bold">{c.name}</span>
                  <span className="tabular text-xs text-muted">{count ?? '–'} products</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      <section className="container-x mt-20">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="label-eyebrow">Editor's picks</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Featured this week</h2>
          </div>
          <Link to="/shop?featured=true" className="flex items-center gap-1.5 text-sm font-semibold hover:text-brand-600">See all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {featured.isLoading
            ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
            : featured.data?.items.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Banner */}
      <section className="container-x mt-20">
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-surface p-8 sm:p-12">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-100" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <p className="label-eyebrow">Student offer</p>
              <h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">Extra 10% off laptops and keyboards</h3>
              <p className="mt-2 max-w-lg text-muted">Verify your student email at checkout. Valid on the Computing range until the end of the month.</p>
            </div>
            <Link to="/shop?category=Computing" className="inline-flex items-center gap-2 justify-self-start rounded-full bg-ink px-6 py-3.5 font-semibold text-white transition hover:bg-brand-500">
              Shop computing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
