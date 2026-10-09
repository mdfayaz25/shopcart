import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Lock, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearCart } from '@/store/cartSlice';
import type { Order } from '@/types';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { OrderSummary } from '@/components/OrderSummary';
import { ProductArt } from '@/components/ProductArt';
import { emptyPay, PaymentFields, validatePay, type PayState } from '@/components/PaymentFields';
import { formatINR } from '@/lib/format';

const STATES = ['Andhra Pradesh', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Maharashtra', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'];

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{7,15}$/, 'Enter a valid phone number'),
  line1: z.string().trim().min(5, 'Enter your house number and street'),
  city: z.string().trim().min(2, 'Enter your city'),
  state: z.string().min(2, 'Choose your state'),
  postalCode: z.string().trim().regex(/^\d{6}$/, 'Enter a 6-digit PIN code'),
});
type AddressForm = z.infer<typeof schema>;

export default function Checkout() {
  const items = useAppSelector((s) => s.cart.items);
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [pay, setPay] = useState<PayState>(emptyPay);

  const { register, handleSubmit, formState: { errors } } = useForm<AddressForm>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: user?.name ?? '', phone: '', line1: '', city: '', state: '', postalCode: '' },
  });

  const placeOrder = useMutation({
    mutationFn: async (address: AddressForm) => {
      const { data } = await api.post<{ order: Order }>('/orders', {
        items: items.map((i) => ({ product: i.id, qty: i.qty })),
        shippingAddress: address,
        paymentMethod: pay.method,
      });
      dispatch(clearCart());
      if (pay.method === 'cod') return { order: data.order, paid: true };
      try {
        const paid = await api.post<{ order: Order }>(`/orders/${data.order.id}/pay`, { method: pay.method, cardNumber: pay.cardNumber, upiId: pay.upiId });
        return { order: paid.data.order, paid: true };
      } catch (e) {
        toast.error(getErrorMessage(e));
        return { order: data.order, paid: false };
      }
    },
    onSuccess: ({ order, paid }) => navigate(`/orders/${order.id}${paid ? '?placed=1' : ''}`, { replace: true }),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (items.length === 0 && !placeOrder.isPending && !placeOrder.isSuccess) return <Navigate to="/cart" replace />;

  const onSubmit = (address: AddressForm) => {
    const err = validatePay(pay);
    if (err) return toast.error(err);
    placeOrder.mutate(address);
  };

  return (
    <div className="container-x pt-8">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Checkout</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]" noValidate>
        <div className="space-y-6">
          <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold"><MapPin className="h-5 w-5 text-brand-600" /> Delivery address</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.fullName?.message} htmlFor="fullName"><Input id="fullName" autoComplete="name" invalid={!!errors.fullName} {...register('fullName')} /></Field>
              <Field label="Phone" error={errors.phone?.message} htmlFor="phone"><Input id="phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" invalid={!!errors.phone} {...register('phone')} /></Field>
              <div className="sm:col-span-2">
                <Field label="Address" error={errors.line1?.message} htmlFor="line1"><Input id="line1" autoComplete="street-address" placeholder="Flat, building, street" invalid={!!errors.line1} {...register('line1')} /></Field>
              </div>
              <Field label="City" error={errors.city?.message} htmlFor="city"><Input id="city" autoComplete="address-level2" invalid={!!errors.city} {...register('city')} /></Field>
              <Field label="State" error={errors.state?.message} htmlFor="state">
                <select id="state" {...register('state')} className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15">
                  <option value="">Choose a state</option>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="PIN code" error={errors.postalCode?.message} htmlFor="postalCode"><Input id="postalCode" inputMode="numeric" autoComplete="postal-code" maxLength={6} invalid={!!errors.postalCode} {...register('postalCode')} /></Field>
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold"><Lock className="h-5 w-5 text-brand-600" /> Payment</h2>
            <div className="mt-6"><PaymentFields value={pay} onChange={setPay} /></div>
          </section>
        </div>

        <OrderSummary items={items}>
          <ul className="max-h-64 space-y-3 overflow-y-auto border-y border-line py-4">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 text-sm">
                <span className="relative">
                  <ProductArt {...i} size="sm" className="h-12 w-12 rounded-xl" />
                  <span className="tabular absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">{i.qty}</span>
                </span>
                <span className="line-clamp-2 flex-1 font-semibold">{i.name}</span>
                <span className="tabular font-semibold">{formatINR(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <Button type="submit" size="lg" className="w-full" loading={placeOrder.isPending}>
            {pay.method === 'cod' ? 'Place order' : 'Pay and place order'}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted"><Lock className="h-3 w-3" /> Prices are confirmed by the server before you pay</p>
        </OrderSummary>
      </form>
    </div>
  );
}
