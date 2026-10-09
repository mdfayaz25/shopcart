import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-x grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="font-display text-8xl font-extrabold text-brand-500">404</p>
        <h1 className="mt-4 text-3xl font-extrabold">We couldn't find that page</h1>
        <p className="mt-2 text-muted">The link may be broken, or the product may have been removed.</p>
        <Link to="/shop" className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 font-semibold text-white hover:bg-brand-500">Back to the shop</Link>
      </div>
    </div>
  );
}
