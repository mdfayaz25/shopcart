import { CreditCard, Smartphone, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export type PayMethod = 'card' | 'upi' | 'cod';
export type PayState = { method: PayMethod; cardNumber: string; expiry: string; cvc: string; upiId: string };

export const emptyPay: PayState = { method: 'card', cardNumber: '', expiry: '', cvc: '', upiId: '' };

const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function validatePay(p: PayState): string | null {
  if (p.method === 'card') {
    if (p.cardNumber.replace(/\s/g, '').length !== 16) return 'Enter the 16-digit card number';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(p.expiry)) return 'Enter the expiry as MM/YY';
    if (!/^\d{3}$/.test(p.cvc)) return 'Enter the 3-digit CVC';
  }
  if (p.method === 'upi' && !/^[\w.-]{2,}@[a-z]{2,}$/i.test(p.upiId)) return 'Enter a valid UPI ID, e.g. name@okaxis';
  return null;
}

export function PaymentFields({ value, onChange, allowCod = true }: { value: PayState; onChange: (p: PayState) => void; allowCod?: boolean }) {
  const set = (patch: Partial<PayState>) => onChange({ ...value, ...patch });
  const methods = [
    { id: 'card' as const, label: 'Card', icon: CreditCard, hint: 'Visa, Mastercard, RuPay' },
    { id: 'upi' as const, label: 'UPI', icon: Smartphone, hint: 'GPay, PhonePe, Paytm' },
    ...(allowCod ? [{ id: 'cod' as const, label: 'Cash on delivery', icon: Wallet, hint: 'Pay when it arrives' }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className={cn('grid gap-3', allowCod ? 'sm:grid-cols-3' : 'sm:grid-cols-2')} role="radiogroup" aria-label="Payment method">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={value.method === m.id}
            onClick={() => set({ method: m.id })}
            className={cn(
              'flex items-start gap-3 rounded-2xl border p-4 text-left transition',
              value.method === m.id ? 'border-ink bg-ink/[.03] ring-1 ring-ink' : 'border-line hover:border-ink/30',
            )}
          >
            <m.icon className={cn('mt-0.5 h-5 w-5', value.method === m.id ? 'text-brand-600' : 'text-muted')} />
            <span>
              <span className="block text-sm font-bold">{m.label}</span>
              <span className="block text-xs text-muted">{m.hint}</span>
            </span>
          </button>
        ))}
      </div>

      {value.method === 'card' && (
        <div className="grid gap-3 sm:grid-cols-[1fr_110px_90px]">
          <Input inputMode="numeric" autoComplete="cc-number" placeholder="Card number" aria-label="Card number" value={value.cardNumber} onChange={(e) => set({ cardNumber: formatCard(e.target.value) })} />
          <Input inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" aria-label="Expiry date" value={value.expiry} onChange={(e) => set({ expiry: formatExpiry(e.target.value) })} />
          <Input inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" aria-label="CVC" value={value.cvc} onChange={(e) => set({ cvc: e.target.value.replace(/\D/g, '').slice(0, 3) })} />
          <p className="text-xs text-muted sm:col-span-3">
            Demo gateway: use <button type="button" className="tabular font-semibold text-ink underline underline-offset-2" onClick={() => set({ cardNumber: '4242 4242 4242 4242', expiry: '12/29', cvc: '123' })}>4242 4242 4242 4242</button> to succeed, or 4000 0000 0000 0002 to see a decline.
          </p>
        </div>
      )}
      {value.method === 'upi' && <Input placeholder="yourname@okaxis" aria-label="UPI ID" value={value.upiId} onChange={(e) => set({ upiId: e.target.value.trim() })} />}
      {value.method === 'cod' && <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">Pay in cash or by UPI when your order is delivered.</p>}
    </div>
  );
}
