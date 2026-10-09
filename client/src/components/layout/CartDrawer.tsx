import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Trash2, Truck, X } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { removeItem, setCartOpen, setQty } from '@/store/cartSlice';
import { estimateTotals, formatINR, FREE_SHIPPING_OVER } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { ProductArt } from '../ProductArt';
import { QuantityStepper } from '../QuantityStepper';

export function CartDrawer() {
  const { items, open } = useAppSelector((s) => s.cart);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const totals = estimateTotals(items);
  const remaining = Math.max(0, FREE_SHIPPING_OVER - totals.itemsPrice);
  const close = () => dispatch(setCartOpen(false));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.aside
            role="dialog"
            aria-label="Shopping cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="text-xl font-bold">Your cart <span className="tabular text-muted">({items.reduce((n, i) => n + i.qty, 0)})</span></h2>
              <button onClick={close} className="rounded-full p-2 transition hover:bg-surface-2" aria-label="Close cart">
                <X className="h-5 w-5" />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <ShoppingBag className="h-7 w-7" />
                </span>
                <div>
                  <p className="font-display text-lg font-bold">Your cart is empty</p>
                  <p className="mt-1 text-sm text-muted">Browse the shop and add something you love.</p>
                </div>
                <Button onClick={() => { close(); navigate('/shop'); }}>Start shopping</Button>
              </div>
            ) : (
              <>
                <div className="border-b border-line px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Truck className="h-4 w-4 text-brand-600" />
                    {remaining > 0 ? (
                      <span>Add <b className="tabular">{formatINR(remaining)}</b> more for free delivery</span>
                    ) : (
                      <span>You've unlocked <b>free delivery</b></span>
                    )}
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${Math.min(100, (totals.itemsPrice / FREE_SHIPPING_OVER) * 100)}%` }} />
                  </div>
                </div>

                <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-4 py-5">
                      <Link to={`/product/${item.slug}`} onClick={close} className="shrink-0">
                        <ProductArt {...item} size="sm" className="h-20 w-20 rounded-2xl" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{item.brand}</p>
                            <Link to={`/product/${item.slug}`} onClick={close} className="line-clamp-2 font-semibold leading-snug hover:text-brand-600">{item.name}</Link>
                          </div>
                          <p className="tabular shrink-0 font-bold">{formatINR(item.price * item.qty)}</p>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <QuantityStepper size="sm" value={item.qty} max={Math.min(10, item.stock)} onChange={(qty) => dispatch(setQty({ id: item.id, qty }))} />
                          <button onClick={() => dispatch(removeItem(item.id))} className="flex items-center gap-1 text-xs font-semibold text-muted transition hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <footer className="space-y-4 border-t border-line bg-surface-2/50 px-6 py-5">
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular font-semibold">{formatINR(totals.itemsPrice)}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="tabular font-semibold">{totals.shippingPrice ? formatINR(totals.shippingPrice) : 'Free'}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">GST (18%)</dt><dd className="tabular font-semibold">{formatINR(totals.taxPrice)}</dd></div>
                    <div className="flex justify-between border-t border-line pt-2 text-base"><dt className="font-bold">Total</dt><dd className="tabular font-display text-lg font-extrabold">{formatINR(totals.totalPrice)}</dd></div>
                  </dl>
                  <Button size="lg" className="w-full" onClick={() => { close(); navigate('/checkout'); }}>Checkout</Button>
                  <button onClick={() => { close(); navigate('/cart'); }} className="w-full text-center text-sm font-semibold text-muted hover:text-ink">View full cart</button>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
