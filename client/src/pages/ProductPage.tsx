import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Heart, MessageSquareText, PackageCheck, RotateCcw, ShoppingBag, Truck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api, getErrorMessage } from '@/lib/api';
import type { Product, Review } from '@/types';
import { useAppDispatch } from '@/store';
import { addItem } from '@/store/cartSlice';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/hooks/useWishlist';
import { ProductArt } from '@/components/ProductArt';
import { ProductCard } from '@/components/ProductCard';
import { Price } from '@/components/Price';
import { Rating, RatingInput } from '@/components/Rating';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, formatDate } from '@/lib/utils';
import NotFound from './NotFound';

type Detail = { product: Product; reviews: Review[]; related: Product[] };

export default function ProductPage() {
  const { slug } = useParams();
  const dispatch = useAppDispatch();
  const wishlist = useWishlist();
  const [qty, setQty] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => (await api.get<Detail>(`/products/${slug}`)).data,
  });

  if (isLoading) return <div className="grid min-h-[60vh] place-items-center"><Spinner className="h-8 w-8" /></div>;
  if (isError || !data) return <NotFound />;

  const { product, reviews, related } = data;
  const soldOut = product.stock === 0;
  const saved = wishlist.has(product.id);
  const breakdown = [5, 4, 3, 2, 1].map((s) => ({ s, n: reviews.filter((r) => r.rating === s).length }));

  return (
    <div className="container-x pt-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-ink">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/shop?category=${product.category}`} className="hover:text-ink">{product.category}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductArt {...product} size="lg" className="aspect-square rounded-[2rem] border border-line" />
        </div>

        <div className="animate-fade-up">
          <p className="text-sm font-bold uppercase tracking-[.14em] text-brand-600">{product.brand}</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-[2.6rem]">{product.name}</h1>
          <a href="#reviews" className="mt-3 flex w-fit items-center gap-2 text-sm font-semibold hover:text-brand-600">
            <Rating value={product.rating} /> <span className="tabular">{product.rating.toFixed(1)}</span>
            <span className="text-muted">· {product.numReviews} review{product.numReviews === 1 ? "" : "s"}</span>
          </a>
          <div className="mt-6"><Price price={product.price} compareAt={product.compareAtPrice} size="lg" /></div>
          <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>

          <p className="mt-6 max-w-prose leading-relaxed text-muted">{product.description}</p>

          <div className="mt-6">
            {soldOut ? (
              <p className="font-semibold text-red-600">Out of stock</p>
            ) : product.stock <= 5 ? (
              <p className="font-semibold text-brand-700">Hurry, only {product.stock} left in stock</p>
            ) : (
              <p className="flex items-center gap-2 font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> In stock, ships in 24 hours</p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!soldOut && <QuantityStepper value={qty} max={Math.min(10, product.stock)} onChange={setQty} />}
            <Button
              size="lg"
              disabled={soldOut}
              className="flex-1 sm:flex-none sm:px-10"
              onClick={() => {
                dispatch(addItem({ product, qty }));
                toast.success(`${qty} × ${product.name} added to cart`);
              }}
            >
              <ShoppingBag className="h-5 w-5" /> {soldOut ? 'Sold out' : 'Add to cart'}
            </Button>
            <Button size="lg" variant="outline" onClick={() => wishlist.toggle(product.id)} aria-pressed={saved} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'} className="px-4">
              <Heart className={cn('h-5 w-5', saved && 'fill-brand-500 text-brand-500')} />
            </Button>
          </div>

          <div className="mt-8 grid gap-3 rounded-2xl border border-line bg-surface p-5 text-sm sm:grid-cols-3">
            {[[Truck, 'Free delivery over ₹2,999'], [RotateCcw, '10-day easy returns'], [PackageCheck, '1-year warranty']].map(([I, t]) => {
              const Icon = I as typeof Truck;
              return <div key={t as string} className="flex items-center gap-2.5 font-semibold"><Icon className="h-4 w-4 shrink-0 text-brand-600" /> {t as string}</div>;
            })}
          </div>

          {product.specs.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold">Specifications</h2>
              <dl className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
                {product.specs.map((s) => (
                  <div key={s.label} className="grid grid-cols-[140px_1fr] gap-4 px-5 py-3 text-sm">
                    <dt className="text-muted">{s.label}</dt>
                    <dd className="font-semibold">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      <section id="reviews" className="mt-20 scroll-mt-24">
        <h2 className="text-3xl font-extrabold">Customer reviews</h2>
        <div className="mt-8 grid gap-10 lg:grid-cols-[300px_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-line bg-surface p-6">
              <p className="tabular font-display text-5xl font-extrabold">{product.rating.toFixed(1)}</p>
              <Rating value={product.rating} size={18} className="mt-2" />
              <p className="mt-1 text-sm text-muted">Based on {product.numReviews} review{product.numReviews === 1 ? "" : "s"}</p>
              <div className="mt-5 space-y-2">
                {breakdown.map(({ s, n }) => (
                  <div key={s} className="flex items-center gap-3 text-sm">
                    <span className="tabular w-3 font-semibold">{s}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${reviews.length ? (n / reviews.length) * 100 : 0}%` }} />
                    </div>
                    <span className="tabular w-5 text-right text-muted">{n}</span>
                  </div>
                ))}
              </div>
            </div>
            <ReviewForm productId={product.id} slug={product.slug} />
          </div>

          <div>
            {reviews.length === 0 ? (
              <EmptyState icon={MessageSquareText} title="No reviews yet" text="Bought this? Be the first to share what you think." />
            ) : (
              <ul className="space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-3xl border border-line bg-surface p-6">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.user?.name ?? 'Customer'} color={r.user?.avatarColor} size={38} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{r.user?.name ?? 'Customer'}</p>
                        <p className="text-xs text-muted">{formatDate(r.createdAt)} · Verified purchase</p>
                      </div>
                      <Rating value={r.rating} />
                    </div>
                    {r.title && <p className="mt-4 font-bold">{r.title}</p>}
                    <p className="mt-1.5 leading-relaxed text-muted">{r.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-3xl font-extrabold">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}
    </div>
  );
}

function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: async () => (await api.post(`/products/${productId}/reviews`, { rating, title: title || undefined, comment })).data,
    onSuccess: () => {
      toast.success('Thanks! Your review is live.');
      setTitle('');
      setComment('');
      qc.invalidateQueries({ queryKey: ['product', slug] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (!user) {
    return (
      <div className="rounded-3xl border border-dashed border-line p-6 text-sm">
        <p className="font-semibold">Share your thoughts</p>
        <p className="mt-1 text-muted"><Link to="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link> to review products you've bought.</p>
      </div>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 10) return toast.error('Write at least 10 characters');
    mutation.mutate();
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl border border-line bg-surface p-6">
      <p className="font-bold">Write a review</p>
      <RatingInput value={rating} onChange={setRating} />
      <Input id="review-title" placeholder="Headline (optional)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} aria-label="Review headline" />
      <Textarea id="review-body" placeholder="What did you like or dislike?" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} aria-label="Review" />
      <Button type="submit" loading={mutation.isPending} className="w-full">Post review</Button>
    </form>
  );
}
