import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { api, getErrorMessage } from '@/lib/api';
import { CATEGORIES, type Paginated, type Product } from '@/types';
import { ProductArt, PRODUCT_ICONS } from '@/components/ProductArt';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';

type Draft = {
  name: string; brand: string; category: string; description: string; price: string; compareAtPrice: string;
  stock: string; featured: boolean; icon: string; tone: string; imageUrl: string;
};
const blank: Draft = { name: '', brand: '', category: 'Audio', description: '', price: '', compareAtPrice: '', stock: '10', featured: false, icon: 'package', tone: '#FF5A1F', imageUrl: '' };
const TONES = ['#FF5A1F', '#0EA5E9', '#10B981', '#8B5CF6', '#EF4444', '#EAB308', '#2563EB', '#111827'];

export default function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank);

  const { data } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: async () => (await api.get<Paginated<Product>>('/products', { params: { search: search || undefined, limit: 48, sort: 'newest' } })).data,
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        name: draft.name, brand: draft.brand, category: draft.category, description: draft.description,
        price: Number(draft.price), compareAtPrice: draft.compareAtPrice ? Number(draft.compareAtPrice) : null,
        stock: Number(draft.stock), featured: draft.featured, icon: draft.icon, tone: draft.tone, imageUrl: draft.imageUrl,
      };
      return editing ? api.patch(`/products/${editing.id}`, body) : api.post('/products', body);
    },
    onSuccess: () => {
      toast.success(editing ? 'Product updated' : 'Product created');
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => { toast.success('Product deleted'); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const openEditor = (p?: Product) => {
    setEditing(p ?? null);
    setDraft(p ? { name: p.name, brand: p.brand, category: p.category, description: p.description, price: String(p.price), compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '', stock: String(p.stock), featured: p.featured, icon: p.icon, tone: p.tone, imageUrl: p.imageUrl ?? '' } : blank);
    setOpen(true);
  };
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Products</h1>
          <p className="tabular mt-1 text-muted">{data?.total ?? 0} products in the catalog</p>
        </div>
        <Button onClick={() => openEditor()}><Plus className="h-4 w-4" /> New product</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input className="pl-10" placeholder="Search by name or brand" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line bg-surface-2/60 text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">Product</th><th className="px-3 py-3 font-semibold">Category</th>
              <th className="px-3 py-3 text-right font-semibold">Price</th><th className="px-3 py-3 text-right font-semibold">Stock</th>
              <th className="px-3 py-3 font-semibold">Rating</th><th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data?.items.map((p) => (
              <tr key={p.id} className="hover:bg-surface-2/40">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <ProductArt {...p} size="sm" className="h-11 w-11 shrink-0 rounded-xl" />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate font-semibold">{p.name} {p.featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}</p>
                      <p className="text-xs text-muted">{p.brand}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-muted">{p.category}</td>
                <td className="tabular px-3 py-3 text-right font-semibold">{formatINR(p.price)}</td>
                <td className="px-3 py-3 text-right">
                  <span className={cn('tabular rounded-full px-2.5 py-1 text-xs font-bold', p.stock === 0 ? 'bg-red-50 text-red-700' : p.stock <= 5 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700')}>{p.stock}</span>
                </td>
                <td className="tabular px-3 py-3 text-muted">{p.rating.toFixed(1)} ({p.numReviews})</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditor(p)} aria-label={`Edit ${p.name}`}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (window.confirm(`Delete ${p.name}? This cannot be undone.`)) remove.mutate(p.id); }} aria-label={`Delete ${p.name}`} className="hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit product' : 'New product'} className="sm:max-w-2xl">
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
          <div className="flex items-center gap-4 rounded-2xl bg-surface-2 p-3">
            <ProductArt name={draft.name || 'Preview'} icon={draft.icon} tone={draft.tone} imageUrl={draft.imageUrl || undefined} className="h-20 w-20 shrink-0 rounded-2xl" />
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {TONES.map((t) => <button key={t} type="button" onClick={() => set({ tone: t })} aria-label={`Tone ${t}`} className={cn('h-6 w-6 rounded-full ring-offset-2 transition', draft.tone === t && 'ring-2 ring-ink')} style={{ background: t }} />)}
              </div>
              <select value={draft.icon} onChange={(e) => set({ icon: e.target.value })} aria-label="Icon" className="h-9 rounded-lg border border-line bg-surface px-2 text-sm">
                {Object.keys(PRODUCT_ICONS).map((k) => <option key={k}>{k}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="p-name"><Input id="p-name" required value={draft.name} onChange={(e) => set({ name: e.target.value })} /></Field>
            <Field label="Brand" htmlFor="p-brand"><Input id="p-brand" required value={draft.brand} onChange={(e) => set({ brand: e.target.value })} /></Field>
            <Field label="Category" htmlFor="p-cat">
              <select id="p-cat" value={draft.category} onChange={(e) => set({ category: e.target.value })} className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            </Field>
            <Field label="Stock" htmlFor="p-stock"><Input id="p-stock" type="number" min={0} required value={draft.stock} onChange={(e) => set({ stock: e.target.value })} /></Field>
            <Field label="Price (₹)" htmlFor="p-price"><Input id="p-price" type="number" min={0} required value={draft.price} onChange={(e) => set({ price: e.target.value })} /></Field>
            <Field label="Compare-at price (₹)" htmlFor="p-cmp" hint="Shown struck through when higher than the price"><Input id="p-cmp" type="number" min={0} value={draft.compareAtPrice} onChange={(e) => set({ compareAtPrice: e.target.value })} /></Field>
          </div>
          <Field label="Description" htmlFor="p-desc"><Textarea id="p-desc" required minLength={10} value={draft.description} onChange={(e) => set({ description: e.target.value })} /></Field>
          <Field label="Image URL" htmlFor="p-img" hint="Optional. Without one, the illustrated tile above is used."><Input id="p-img" type="url" placeholder="https://…" value={draft.imageUrl} onChange={(e) => set({ imageUrl: e.target.value })} /></Field>
          <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-brand-500" checked={draft.featured} onChange={(e) => set({ featured: e.target.checked })} /> Feature on the home page</label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={save.isPending}>{editing ? 'Save changes' : 'Create product'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
