import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, IndianRupee, Package, ShoppingCart, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '@/lib/api';
import type { Order, Product } from '@/types';
import { ProductArt } from '@/components/ProductArt';
import { StatusBadge } from '@/components/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { formatINR } from '@/lib/format';
import { formatDate, timeAgo } from '@/lib/utils';

type Stats = {
  revenue: number;
  paidOrders: number;
  orders: number;
  toFulfil: number;
  customers: number;
  sales: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; qty: number; revenue: number; icon?: string; tone?: string }[];
  lowStock: Product[];
  recentOrders: Order[];
};

const compactINR = (n: number) => (n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `₹${Math.round(n / 1e3)}k` : `₹${n}`);

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: async () => (await api.get<Stats>('/admin/stats')).data });
  if (isLoading || !data) return <div className="grid min-h-[60vh] place-items-center"><Spinner className="h-8 w-8" /></div>;

  const last14 = data.sales.reduce((s, d) => s + d.revenue, 0);
  const avgOrder = data.paidOrders ? data.revenue / data.paidOrders : 0;
  const topMax = Math.max(1, ...data.topProducts.map((p) => p.revenue));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Overview</h1>
        <p className="mt-1 text-muted">How the store is doing, as of {formatDate(new Date(), { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={IndianRupee} label="Total revenue" value={formatINR(data.revenue)} sub={`${formatINR(avgOrder)} average order`} />
        <Stat icon={ShoppingCart} label="Orders" value={String(data.orders)} sub={`${data.paidOrders} paid`} />
        <Stat icon={Package} label="To fulfil" value={String(data.toFulfil)} sub="Awaiting payment or shipping" highlight={data.toFulfil > 0} />
        <Stat icon={Users} label="Customers" value={String(data.customers)} sub="Registered shoppers" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-bold">Revenue, last 14 days</h2>
              <p className="tabular mt-1 font-display text-2xl font-extrabold">{formatINR(last14)}</p>
            </div>
            <p className="text-xs text-muted">Paid, shipped and delivered orders</p>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.sales} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5A1F" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#FF5A1F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgb(var(--line))" />
                <XAxis dataKey="date" tickFormatter={(d) => formatDate(d, { day: 'numeric', month: 'short' })} tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tickFormatter={compactINR} tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} width={56} />
                <Tooltip
                  cursor={{ stroke: 'rgb(var(--line))' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid rgb(var(--line))', fontSize: 12, boxShadow: '0 8px 24px -12px rgba(0,0,0,.2)' }}
                  labelFormatter={(d) => formatDate(String(d), { weekday: 'short', day: 'numeric', month: 'short' })}
                  formatter={(v) => [formatINR(Number(v)), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#FF5A1F" strokeWidth={2.5} fill="url(#rev)" activeDot={{ r: 5, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-bold">Best sellers</h2>
          <p className="text-xs text-muted">By revenue, last 14 days</p>
          <ul className="mt-5 space-y-4">
            {data.topProducts.map((p) => (
              <li key={p.name} className="flex items-center gap-3">
                <ProductArt name={p.name} icon={p.icon} tone={p.tone} size="sm" className="h-11 w-11 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2 text-sm">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="tabular shrink-0 font-bold">{formatINR(p.revenue)}</p>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(p.revenue / topMax) * 100}%` }} />
                  </div>
                </div>
              </li>
            ))}
            {data.topProducts.length === 0 && <p className="text-sm text-muted">No sales in this period yet.</p>}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="font-bold">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-y border-line bg-surface-2/60 text-left text-xs uppercase tracking-wider text-muted">
                <tr><th className="px-6 py-2.5 font-semibold">Order</th><th className="px-3 py-2.5 font-semibold">Customer</th><th className="px-3 py-2.5 font-semibold">Status</th><th className="px-6 py-2.5 text-right font-semibold">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-2/40">
                    <td className="px-6 py-3"><Link to={`/orders/${o.id}`} className="tabular font-semibold hover:text-brand-600">{o.orderNumber}</Link><p className="text-xs text-muted">{timeAgo(o.createdAt)}</p></td>
                    <td className="px-3 py-3">{typeof o.user === 'object' ? o.user.name : '—'}</td>
                    <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
                    <td className="tabular px-6 py-3 text-right font-bold">{formatINR(o.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4 text-amber-500" /> Low stock</h2>
          <ul className="mt-4 divide-y divide-line">
            {data.lowStock.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <ProductArt {...p} size="sm" className="h-10 w-10 shrink-0 rounded-xl" />
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</p>
                <span className={`tabular rounded-full px-2.5 py-1 text-xs font-bold ${p.stock === 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</span>
              </li>
            ))}
            {data.lowStock.length === 0 && <p className="py-3 text-sm text-muted">Everything is well stocked.</p>}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, highlight }: { icon: typeof Users; label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${highlight ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-600'}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="tabular mt-3 font-display text-3xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </div>
  );
}
