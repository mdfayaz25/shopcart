import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: ids = [] } = useQuery({
    queryKey: ['wishlist-ids'],
    queryFn: async () => (await api.get<{ ids: string[] }>('/wishlist/ids')).data.ids,
    enabled: Boolean(user),
  });

  const toggle = useMutation({
    mutationFn: async (productId: string) => (await api.post<{ saved: boolean; ids: string[] }>(`/wishlist/${productId}`)).data,
    onSuccess: (data) => {
      qc.setQueryData(['wishlist-ids'], data.ids);
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(data.saved ? 'Saved to your wishlist' : 'Removed from your wishlist');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return {
    has: (id: string) => ids.includes(id),
    toggle: (id: string) => {
      if (!user) {
        toast('Sign in to save products to your wishlist');
        navigate('/login');
        return;
      }
      toggle.mutate(id);
    },
  };
}
