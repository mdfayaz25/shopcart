import { Link } from 'react-router-dom';

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2" aria-label="ShopCart home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/30">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 5h2l2.2 9.2a1.5 1.5 0 0 0 1.5 1.1h7.6a1.5 1.5 0 0 0 1.4-1l1.8-6.3H6.2" />
          <circle cx="9" cy="19.5" r="1.2" fill="currentColor" />
          <circle cx="16" cy="19.5" r="1.2" fill="currentColor" />
        </svg>
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight">ShopCart</span>
    </Link>
  );
}
