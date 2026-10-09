import { ArrowLeft, LayoutDashboard, Package, ShoppingCart } from 'lucide-react';
import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { Logo } from '@/components/layout/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const links = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
];

export default function AdminLayout() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 z-30 flex items-center gap-4 border-b border-line bg-surface px-4 py-3 lg:h-screen lg:flex-col lg:items-stretch lg:gap-8 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="hidden lg:block"><Logo to="/admin" /></div>
        <nav className="flex flex-1 gap-1 overflow-x-auto scrollbar-none lg:flex-col" aria-label="Admin">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => cn('flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition', isActive ? 'bg-ink text-white' : 'text-muted hover:bg-surface-2 hover:text-ink')}
            >
              <l.icon className="h-4 w-4" /> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden space-y-4 lg:block">
          <NavLink to="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to store</NavLink>
          {user && (
            <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
              <Avatar name={user.name} color={user.avatarColor} size={36} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{user.name}</p>
                <p className="text-xs text-muted">Administrator</p>
              </div>
            </div>
          )}
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8">
        <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><Spinner className="h-8 w-8" /></div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
