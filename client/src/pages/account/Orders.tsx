import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Order } from '@/types';
import { ProductArt } from '@/components/ProductArt';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatINR } from '@/lib/format';
import { formatDate } from '@/lib/utils';

export default function Orders() {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: async () => (await api.get<{ orders: Order[] }>('/orders/mine')).data.orders,
  });

  return (
    <div className="container-x pt-8">
      <h1 className="text-4xl font-extrabold sm:text-5xl">My orders</h1>
      <div className="mt-8 space-y-4">
        {isLoading && Array.from({ length: 3 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-surface" />)}
        {orders?.length === 0 && <EmptyState icon={Package} title="No orders yet" text="When you place an order, you can track it here." action={<Button onClick={() => navigate('/shop')}>Start shopping</Button>} />}
        {orders?.map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`} className="group flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 transition hover:shadow-card sm:flex-row sm:items-center">
            <div className="flex -space-x-3">
              {o.items.slice(0, 3).map((i) => (
                <ProductArt key={i.product} name={i.name} icon={i.icon} tone={i.tone} imageUrl={i.imageUrl} size="sm" className="h-14 w-14 rounded-2xl ring-4 ring-surface" />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="tabular font-bold">{o.orderNumber}</p>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-1 truncate text-sm text-muted">{o.items.map((i) => i.name).join(', ')}</p>
            </div>
            <div className="flex items-center justify-between gap-6 sm:justify-end">
              <div className="text-right">
                <p className="tabular font-display text-lg font-extrabold">{formatINR(o.totalPrice)}</p>
                <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted transition group-hover:translate-x-1 group-hover:text-ink" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
