import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api, getErrorMessage } from '@/lib/api';
import type { Order, OrderStatus } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { formatINR } from '@/lib/format';
import { cn, formatDate } from '@/lib/utils';

const TABS: (OrderStatus | 'all')[] = ['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'];
const NEXT: Record<OrderStatus, OrderStatus[]> = { pending: ['paid', 'cancelled'], paid: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] };
const ACTION: Record<OrderStatus, string> = { paid: 'Mark paid', shipped: 'Mark shipped', delivered: 'Mark delivered', cancelled: 'Cancel', pending: '' };

export default function AdminOrders() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('all');
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-orders', tab],
    queryFn: async () => (await api.get<{ orders: Order[]; total: number }>('/orders', { params: { status: tab === 'all' ? undefined : tab } })).data,
    placeholderData: keepPreviousData,
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => (await api.patch(`/orders/${id}/status`, { status })).data,
    onSuccess: () => { toast.success('Order updated'); qc.invalidateQueries({ queryKey: ['admin-orders'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Orders</h1>
        <p className="tabular mt-1 text-muted">{data?.total ?? 0} {tab === 'all' ? 'orders' : `${tab} orders`}</p>
      </div>
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1 scrollbar-none sm:w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('shrink-0 rounded-xl px-4 py-2 text-sm font-semibold capitalize transition', tab === t ? 'bg-ink text-white' : 'text-muted hover:text-ink')}>{t}</button>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-line bg-surface-2/60 text-left text-xs uppercase tracking-wider text-muted">
            <tr><th className="px-5 py-3 font-semibold">Order</th><th className="px-3 py-3 font-semibold">Customer</th><th className="px-3 py-3 font-semibold">Items</th><th className="px-3 py-3 font-semibold">Status</th><th className="px-3 py-3 text-right font-semibold">Total</th><th className="px-5 py-3 text-right font-semibold">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data?.orders.map((o) => (
              <tr key={o.id} className="hover:bg-surface-2/40">
                <td className="px-5 py-3"><Link to={`/orders/${o.id}`} className="tabular font-semibold hover:text-brand-600">{o.orderNumber}</Link><p className="text-xs text-muted">{formatDate(o.createdAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p></td>
                <td className="px-3 py-3">{typeof o.user === 'object' ? <><p className="font-semibold">{o.user.name}</p><p className="text-xs text-muted">{o.user.email}</p></> : '—'}</td>
                <td className="tabular px-3 py-3 text-muted">{o.items.reduce((n, i) => n + i.qty, 0)} items · {o.paymentMethod.toUpperCase()}</td>
                <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
                <td className="tabular px-3 py-3 text-right font-bold">{formatINR(o.totalPrice)}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1.5">
                    {NEXT[o.status].map((s) => (
                      <button key={s} disabled={update.isPending} onClick={() => update.mutate({ id: o.id, status: s })} className={cn('rounded-lg px-2.5 py-1.5 text-xs font-bold transition disabled:opacity-50', s === 'cancelled' ? 'text-muted hover:bg-red-50 hover:text-red-600' : 'bg-ink text-white hover:bg-brand-500')}>
                        {ACTION[s]}
                      </button>
                    ))}
                    {NEXT[o.status].length === 0 && <span className="text-xs text-muted">—</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
