import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Product } from '@/types';
import { ProductCard, ProductCardSkeleton } from '@/components/ProductCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Wishlist() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => (await api.get<{ products: (Product & { _id?: string })[] }>('/wishlist')).data.products.map((p) => ({ ...p, id: p.id ?? p._id! })),
  });

  return (
    <div className="container-x pt-8">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Wishlist</h1>
      <p className="mt-2 text-muted">Products you've saved for later.</p>
      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}</div>
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{data.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        ) : (
          <EmptyState icon={Heart} title="Nothing saved yet" text="Tap the heart on any product to keep it here." action={<Button onClick={() => navigate('/shop')}>Explore products</Button>} />
        )}
      </div>
    </div>
  );
}
