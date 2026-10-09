import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api, getErrorMessage } from '@/lib/api';
import type { Order } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { OrderSummary } from '@/components/OrderSummary';
import { OrderTimeline } from '@/components/OrderTimeline';
import { ProductArt } from '@/components/ProductArt';
import { StatusBadge } from '@/components/StatusBadge';
import { emptyPay, PaymentFields, validatePay } from '@/components/PaymentFields';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatINR } from '@/lib/format';
import { formatDate } from '@/lib/utils';
import NotFound from './NotFound';

export default function OrderPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [pay, setPay] = useState({ ...emptyPay });

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => (await api.get<{ order: Order }>(`/orders/${id}`)).data.order,
  });

  const onUpdated = (o: Order) => {
    qc.setQueryData(['order', id], o);
    qc.invalidateQueries({ queryKey: ['orders'] });
  };

  const payNow = useMutation({
    mutationFn: async () => (await api.post<{ order: Order }>(`/orders/${id}/pay`, { method: pay.method, cardNumber: pay.cardNumber, upiId: pay.upiId })).data.order,
    onSuccess: (o) => { onUpdated(o); toast.success('Payment received. Thank you!'); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const cancel = useMutation({
    mutationFn: async () => (await api.post<{ order: Order }>(`/orders/${id}/cancel`)).data.order,
    onSuccess: (o) => { onUpdated(o); toast.success('Order cancelled'); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) return <div className="grid min-h-[50vh] place-items-center"><Spinner className="h-8 w-8" /></div>;
  if (isError || !order) return <NotFound />;

  const isOwner = typeof order.user === 'object' ? order.user.id === user?.id : order.user === user?.id;
  const placed = params.get('placed') === '1';

  return (
    <div className="container-x pt-8">
      <Link to="/account/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ChevronLeft className="h-4 w-4" /> All orders</Link>

      {placed && order.status !== 'cancelled' && (
        <div className="mt-6 flex items-start gap-4 rounded-3xl bg-emerald-50 p-6 text-emerald-900 animate-fade-up">
          <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-600" />
          <div>
            <p className="font-display text-xl font-extrabold">Order placed. Thank you, {user?.name.split(' ')[0]}!</p>
            <p className="mt-1 text-sm">We've emailed a confirmation. You can track your delivery from this page.</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="tabular text-3xl font-extrabold sm:text-4xl">Order {order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDate(order.createdAt, { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
        </div>
        <StatusBadge status={order.status} className="text-sm" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-line bg-surface p-6"><OrderTimeline order={order} /></section>

          {order.status === 'pending' && order.paymentMethod !== 'cod' && isOwner && (
            <section className="rounded-3xl border-2 border-brand-200 bg-surface p-6">
              <h2 className="text-lg font-bold">Complete your payment</h2>
              <p className="mb-5 mt-1 text-sm text-muted">Your items are reserved. Pay {formatINR(order.totalPrice)} to confirm the order.</p>
              <PaymentFields value={pay} onChange={setPay} allowCod={false} />
              <Button className="mt-5" loading={payNow.isPending} onClick={() => { const err = validatePay(pay); if (err) return toast.error(err); payNow.mutate(); }}>Pay {formatINR(order.totalPrice)}</Button>
            </section>
          )}

          <section className="rounded-3xl border border-line bg-surface">
            <h2 className="border-b border-line px-6 py-4 text-lg font-bold">Items</h2>
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.product} className="flex items-center gap-4 px-6 py-4">
                  <ProductArt name={i.name} icon={i.icon} tone={i.tone} imageUrl={i.imageUrl} size="sm" className="h-16 w-16 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    {i.slug ? <Link to={`/product/${i.slug}`} className="font-semibold hover:text-brand-600">{i.name}</Link> : <p className="font-semibold">{i.name}</p>}
                    <p className="tabular text-sm text-muted">{i.qty} × {formatINR(i.price)}</p>
                  </div>
                  <p className="tabular font-bold">{formatINR(i.qty * i.price)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-6 rounded-3xl border border-line bg-surface p-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Delivering to</p>
              <address className="mt-2 not-italic leading-relaxed">
                <span className="font-semibold">{order.shippingAddress.fullName}</span><br />
                {order.shippingAddress.line1}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                <span className="text-muted">{order.shippingAddress.phone}</span>
              </address>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Payment</p>
              <p className="mt-2 font-semibold">{{ card: 'Card', upi: 'UPI', cod: 'Cash on delivery' }[order.paymentMethod]}</p>
              <p className="text-sm text-muted">{order.paidAt ? `Paid ${formatDate(order.paidAt)}` : order.paymentMethod === 'cod' ? 'Pay on delivery' : 'Not paid yet'}</p>
            </div>
          </section>
        </div>

        <OrderSummary totals={order} title="Payment summary">
          {isOwner && ['pending', 'paid'].includes(order.status) && (
            <Button variant="outline" className="w-full" loading={cancel.isPending} onClick={() => cancel.mutate()}>Cancel order</Button>
          )}
        </OrderSummary>
      </div>
    </div>
  );
}
