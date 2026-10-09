import { Link } from 'react-router-dom';
import { CATEGORIES } from '@/types';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted">Hand-picked audio, wearables and everyday tech. Free delivery over ₹2,999 and easy 10-day returns.</p>
        </div>
        <FooterCol title="Shop" links={CATEGORIES.slice(0, 5).map((c) => [`/shop?category=${c}`, c])} />
        <FooterCol title="Account" links={[['/account/orders', 'Orders'], ['/account/wishlist', 'Wishlist'], ['/cart', 'Cart'], ['/login', 'Sign in']]} />
        <FooterCol title="Help" links={[['/shop', 'Shipping & delivery'], ['/shop', 'Returns'], ['/shop', 'Warranty'], ['/shop', 'Contact us']]} />
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} ShopCart. A portfolio project by Mohammed Fayaz.</p>
          <p>Prices include GST where shown at checkout.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <p className="mb-4 text-sm font-bold">{title}</p>
      <ul className="space-y-2.5 text-sm text-muted">
        {links.map(([to, label]) => (
          <li key={label}><Link to={to} className="transition hover:text-ink">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
