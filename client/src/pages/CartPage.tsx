import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { removeItem, setQty } from '@/store/cartSlice';
import { ProductArt } from '@/components/ProductArt';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrderSummary } from '@/components/OrderSummary';
import { formatINR } from '@/lib/format';

export default function CartPage() {
  const items = useAppSelector((s) => s.cart.items);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <div className="container-x pt-8">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Shopping cart</h1>
      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={ShoppingBag} title="Your cart is empty" text="Products you add will show up here." action={<Button onClick={() => navigate('/shop')}>Browse products</Button>} />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <ul className="divide-y divide-line rounded-3xl border border-line bg-surface px-5 sm:px-6">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 py-6 sm:gap-6">
                <Link to={`/product/${item.slug}`} className="shrink-0">
                  <ProductArt {...item} className="h-24 w-24 rounded-2xl sm:h-28 sm:w-28" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{item.brand}</p>
                      <Link to={`/product/${item.slug}`} className="font-display text-lg font-bold leading-snug hover:text-brand-600">{item.name}</Link>
                      <p className="tabular mt-1 text-sm text-muted">{formatINR(item.price)} each</p>
                    </div>
                    <p className="tabular font-display text-lg font-extrabold">{formatINR(item.price * item.qty)}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <QuantityStepper size="sm" value={item.qty} max={Math.min(10, item.stock)} onChange={(qty) => dispatch(setQty({ id: item.id, qty }))} />
                    <button onClick={() => dispatch(removeItem(item.id))} className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-red-600">
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <OrderSummary items={items}>
            <Button size="lg" className="w-full" onClick={() => navigate('/checkout')}>
              Proceed to checkout <ArrowRight className="h-4 w-4" />
            </Button>
            <Link to="/shop" className="block text-center text-sm font-semibold text-muted hover:text-ink">Continue shopping</Link>
          </OrderSummary>
        </div>
      )}
    </div>
  );
}
