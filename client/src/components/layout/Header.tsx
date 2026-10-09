import { AnimatePresence, motion } from 'framer-motion';
import { Heart, LayoutDashboard, LogOut, Menu, Package, Search, ShoppingBag, User as UserIcon, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { selectCartCount, useAppDispatch, useAppSelector } from '@/store';
import { setCartOpen } from '@/store/cartSlice';
import { CATEGORIES } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';

export function Header() {
  const { user, logout } = useAuth();
  const count = useAppSelector(selectCartCount);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('search') ?? '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/shop?search=${encodeURIComponent(q.trim())}` : '/shop');
  };

  return (
    <header className={cn('sticky top-0 z-40 border-b transition-colors', scrolled ? 'border-line bg-bg/85 backdrop-blur-xl' : 'border-transparent bg-bg')}>
      <div className="container-x flex h-[68px] items-center gap-4 lg:gap-8">
        <button className="-ml-2 rounded-lg p-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {[
            ['/shop', 'Shop all'],
            ['/shop?featured=true', 'Featured'],
            ['/shop?sort=price-asc', 'Deals'],
          ].map(([to, label]) => (
            <NavLink key={to} to={to} className="rounded-full px-3.5 py-2 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-ink">
              {label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submit} className="relative ml-auto hidden max-w-sm flex-1 md:block" role="search">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search headphones, laptops…"
            aria-label="Search products"
            className="h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm outline-none transition placeholder:text-muted/70 focus:border-ink/40 focus:ring-4 focus:ring-ink/5"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link to="/account/wishlist" className="hidden rounded-full p-2.5 transition hover:bg-surface-2 sm:block" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
          </Link>
          <button onClick={() => dispatch(setCartOpen(true))} className="relative rounded-full p-2.5 transition hover:bg-surface-2" aria-label={`Cart, ${count} items`}>
            <ShoppingBag className="h-5 w-5" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  className="tabular absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white ring-2 ring-bg"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {user ? (
            <div className="relative ml-1" ref={userRef}>
              <button onClick={() => setUserOpen((o) => !o)} className="flex items-center rounded-full p-1 transition hover:bg-surface-2" aria-label="Account menu" aria-expanded={userOpen}>
                <Avatar name={user.name} color={user.avatarColor} size={34} />
              </button>
              <AnimatePresence>
                {userOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-lift"
                  >
                    <div className="px-3 py-2.5">
                      <p className="truncate font-semibold">{user.name}</p>
                      <p className="truncate text-xs text-muted">{user.email}</p>
                    </div>
                    <div className="my-1 h-px bg-line" />
                    {user.role === 'admin' && <MenuLink to="/admin" icon={LayoutDashboard} label="Admin dashboard" />}
                    <MenuLink to="/account/orders" icon={Package} label="My orders" />
                    <MenuLink to="/account/wishlist" icon={Heart} label="Wishlist" />
                    <div className="my-1 h-px bg-line" />
                    <button onClick={() => { logout(); navigate('/'); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login" className="ml-1 hidden items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 sm:flex">
              <UserIcon className="h-4 w-4" /> Sign in
            </Link>
          )}
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenuOpen(false)} />
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute left-0 top-0 flex h-full w-[85%] max-w-sm flex-col gap-6 bg-surface p-6"
              aria-label="Mobile"
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button onClick={() => setMenuOpen(false)} className="rounded-full p-2 hover:bg-surface-2" aria-label="Close menu"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={submit} className="relative" role="search">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" aria-label="Search products" className="h-11 w-full rounded-full border border-line bg-bg pl-10 pr-4 text-sm outline-none" />
              </form>
              <div>
                <p className="label-eyebrow mb-3">Categories</p>
                <div className="grid gap-1">
                  <Link to="/shop" className="rounded-xl px-3 py-2.5 font-semibold hover:bg-surface-2">Shop all</Link>
                  {CATEGORIES.map((c) => (
                    <Link key={c} to={`/shop?category=${c}`} className="rounded-xl px-3 py-2.5 font-semibold hover:bg-surface-2">{c}</Link>
                  ))}
                </div>
              </div>
              {!user && <Link to="/login" className="mt-auto rounded-full bg-ink py-3 text-center font-semibold text-white">Sign in</Link>}
            </motion.nav>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MenuLink({ to, icon: Icon, label }: { to: string; icon: typeof Heart; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-surface-2">
      <Icon className="h-4 w-4 text-muted" /> {label}
    </Link>
  );
}
