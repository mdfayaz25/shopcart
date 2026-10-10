/* eslint-disable @typescript-eslint/no-explicit-any */
import seed from './seed.json';
import { createAdapter, createRouter, createStore, fail, newId, now, withStatus } from './kernel';

type Doc = Record<string, any>;
type DB = { users: Doc[]; products: Doc[]; reviews: Doc[]; orders: Doc[]; wishlists: Doc[] };

export const store = createStore<DB>('shopcart.demo.v1', seed as unknown as { exportedAt: string; data: DB });
const db = () => store.db;

const CATEGORIES = ['Audio', 'Wearables', 'Computing', 'Cameras', 'Gaming', 'Accessories', 'Home'];
const FREE_SHIPPING_OVER = 2999;
const round2 = (n: number) => Math.round(n * 100) / 100;
const totals = (items: { price: number; qty: number }[]) => {
  const itemsPrice = round2(items.reduce((s, i) => s + i.price * i.qty, 0));
  const shippingPrice = itemsPrice === 0 || itemsPrice >= FREE_SHIPPING_OVER ? 0 : 149;
  const taxPrice = round2(itemsPrice * 0.18);
  return { itemsPrice, shippingPrice, taxPrice, totalPrice: round2(itemsPrice + shippingPrice + taxPrice) };
};
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const publicUser = ({ password: _p, ...u }: Doc) => u;
const userRef = (id: string, fields: string[]) => {
  const u = db().users.find((x) => x.id === id);
  return u ? Object.fromEntries([['id', u.id], ...fields.map((f) => [f, u[f]])]) : null;
};
const me = (userId: string | null) => db().users.find((u) => u.id === userId) ?? fail(401, 'Please sign in to continue');
const requireAdmin = (userId: string | null) => { if (me(userId).role !== 'admin') fail(403, 'You do not have access to this resource'); };
const token = (u: Doc) => `demo.${u.id}`;
const touch = <T extends Doc>(d: T) => Object.assign(d, { updatedAt: now() });

const r = createRouter();

// ---------- auth ----------
r.post('/auth/register', ({ body }) => {
  const email = String(body.email ?? '').trim().toLowerCase();
  if (String(body.name ?? '').trim().length < 2) fail(400, 'name: Name must be at least 2 characters');
  if (!/^\S+@\S+\.\S+$/.test(email)) fail(400, 'email: Enter a valid email');
  if (String(body.password ?? '').length < 8) fail(400, 'password: Password must be at least 8 characters');
  if (db().users.some((u) => u.email === email)) fail(409, 'An account with this email already exists');
  const user = { id: newId(), name: body.name.trim(), email, password: body.password, role: 'user', avatarColor: '#0EA5E9', createdAt: now(), updatedAt: now() };
  db().users.push(user);
  store.save();
  return withStatus(201, { user: publicUser(user), token: token(user) });
}, false);
r.post('/auth/login', ({ body }) => {
  const user = db().users.find((u) => u.email === String(body.email ?? '').trim().toLowerCase());
  if (!user || user.password !== body.password) fail(401, 'Incorrect email or password');
  return { user: publicUser(user!), token: token(user!) };
}, false);
r.get('/auth/me', ({ userId }) => ({ user: publicUser(me(userId)) }));

// ---------- products ----------
const SORTS: Record<string, (a: Doc, b: Doc) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating || b.numReviews - a.numReviews,
  popular: (a, b) => b.numReviews - a.numReviews || b.rating - a.rating,
};

r.get('/products', ({ query: q }) => {
  let items = [...db().products];
  if (q.search) { const s = q.search.toLowerCase(); items = items.filter((p) => [p.name, p.brand, ...(p.tags ?? [])].some((v) => String(v).toLowerCase().includes(s))); }
  if (q.category) items = items.filter((p) => p.category === q.category);
  if (q.minPrice) items = items.filter((p) => p.price >= Number(q.minPrice));
  if (q.maxPrice) items = items.filter((p) => p.price <= Number(q.maxPrice));
  if (q.rating) items = items.filter((p) => p.rating >= Number(q.rating));
  if (q.featured === 'true') items = items.filter((p) => p.featured);
  if (q.inStock === 'true') items = items.filter((p) => p.stock > 0);
  items.sort(SORTS[q.sort ?? 'newest'] ?? SORTS.newest);
  const limit = Math.min(48, Number(q.limit) || 12);
  const page = Math.max(1, Number(q.page) || 1);
  return { items: items.slice((page - 1) * limit, page * limit), total: items.length, page, pages: Math.max(1, Math.ceil(items.length / limit)) };
}, false);

r.get('/products/categories', () => ({ categories: CATEGORIES.map((name) => ({ name, count: db().products.filter((p) => p.category === name).length })) }), false);

r.get('/products/:slug', ({ params }) => {
  const product = db().products.find((p) => p.slug === params.slug) ?? fail(404, 'Product not found');
  const reviews = db().reviews.filter((x) => x.product === product.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((x) => ({ ...x, user: userRef(x.user, ['name', 'avatarColor']) }));
  const related = db().products.filter((p) => p.category === product.category && p.id !== product.id).sort((a, b) => b.rating - a.rating).slice(0, 4);
  return { product, reviews, related };
}, false);

r.post('/products/:id/reviews', ({ params, body, userId }) => {
  const product = db().products.find((p) => p.id === params.id) ?? fail(404, 'Product not found');
  const user = me(userId);
  if (db().reviews.some((x) => x.product === product.id && x.user === user.id)) fail(409, 'You have already reviewed this product');
  const bought = db().orders.some((o) => o.user === user.id && ['paid', 'shipped', 'delivered'].includes(o.status) && o.items.some((i: Doc) => i.product === product.id));
  if (!bought && user.role !== 'admin') fail(403, 'Only customers who bought this product can review it');
  if (String(body.comment ?? '').trim().length < 10) fail(400, 'comment: Write at least 10 characters');
  const review = { id: newId(), product: product.id, user: user.id, rating: body.rating, title: body.title, comment: body.comment.trim(), createdAt: now(), updatedAt: now() };
  db().reviews.push(review);
  const mine = db().reviews.filter((x) => x.product === product.id);
  product.rating = Math.round((mine.reduce((s, x) => s + x.rating, 0) / mine.length) * 10) / 10;
  product.numReviews = mine.length;
  store.save();
  return withStatus(201, { review: { ...review, user: userRef(user.id, ['name', 'avatarColor']) }, product });
});

const productFields = (b: Doc) => ({
  name: b.name, brand: b.brand, category: b.category, description: b.description, price: Number(b.price), stock: Number(b.stock),
  featured: Boolean(b.featured), icon: b.icon ?? 'package', tone: b.tone ?? '#FF5A1F', imageUrl: b.imageUrl || undefined,
  ...(b.compareAtPrice ? { compareAtPrice: Number(b.compareAtPrice) } : {}),
});
r.post('/products', ({ body, userId }) => {
  requireAdmin(userId);
  if (!body.name || String(body.description ?? '').length < 10) fail(400, 'Fill in the name and a description of at least 10 characters');
  let slug = slugify(body.name);
  if (db().products.some((p) => p.slug === slug)) slug = `${slug}-${Date.now().toString(36)}`;
  const product = { id: newId(), slug, rating: 0, numReviews: 0, tags: [], specs: [], ...productFields(body), createdAt: now(), updatedAt: now() };
  db().products.push(product);
  store.save();
  return withStatus(201, { product });
});
r.patch('/products/:id', ({ params, body, userId }) => {
  requireAdmin(userId);
  const p = db().products.find((x) => x.id === params.id) ?? fail(404, 'Product not found');
  Object.assign(p, productFields({ ...p, ...body }));
  if (body.compareAtPrice === null) delete p.compareAtPrice;
  touch(p);
  store.save();
  return { product: p };
});
r.delete('/products/:id', ({ params, userId }) => {
  requireAdmin(userId);
  db().products = db().products.filter((p) => p.id !== params.id);
  db().reviews = db().reviews.filter((x) => x.product !== params.id);
  store.save();
});

// ---------- orders ----------
const withUser = (o: Doc) => ({ ...o, user: userRef(o.user, ['name', 'email']) });

r.post('/orders', ({ body, userId }) => {
  const user = me(userId);
  const a = body.shippingAddress ?? {};
  if (!/^\d{6}$/.test(String(a.postalCode ?? ''))) fail(400, 'postalCode: Enter a 6-digit PIN code');
  const items = (body.items ?? []).map((i: Doc) => {
    const p = db().products.find((x) => x.id === i.product) ?? fail(400, 'A product in your cart is no longer available');
    if (p.stock < i.qty) fail(400, `Only ${p.stock} left of ${p.name}`);
    return { product: p.id, name: p.name, slug: p.slug, price: p.price, qty: i.qty, icon: p.icon, tone: p.tone, imageUrl: p.imageUrl };
  });
  if (!items.length) fail(400, 'Your cart is empty');
  items.forEach((i: Doc) => { db().products.find((p) => p.id === i.product)!.stock -= i.qty; });
  const order = {
    id: newId(), orderNumber: `SC-${now().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
    user: user.id, items, shippingAddress: a, paymentMethod: body.paymentMethod, ...totals(items), status: 'pending', createdAt: now(), updatedAt: now(),
  };
  db().orders.push(order);
  store.save();
  return withStatus(201, { order });
});

r.post('/orders/:id/pay', ({ params, body, userId }) => {
  const order = db().orders.find((o) => o.id === params.id && o.user === userId) ?? fail(404, 'Order not found');
  if (order.status !== 'pending') fail(400, 'This order is already paid');
  const digits = String(body.cardNumber ?? '').replace(/\s/g, '');
  if (body.method === 'card' && !/^\d{16}$/.test(digits)) fail(400, 'Enter a 16-digit card number');
  if (body.method === 'upi' && !/^[\w.-]{2,}@[a-z]{2,}$/i.test(String(body.upiId ?? ''))) fail(400, 'Enter a valid UPI ID, e.g. name@okaxis');
  if (digits === '4000000000000002') fail(402, 'Your card was declined. Try another card.');
  Object.assign(order, { status: 'paid', paidAt: now(), paymentRef: `pay_${newId().slice(-12)}` });
  touch(order);
  store.save();
  return { order };
});

r.get('/orders/mine', ({ userId }) => ({ orders: db().orders.filter((o) => o.user === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }));

r.get('/orders/:id', ({ params, userId }) => {
  const order = db().orders.find((o) => o.id === params.id) ?? fail(404, 'Order not found');
  if (order.user !== userId && me(userId).role !== 'admin') fail(404, 'Order not found');
  return { order: withUser(order) };
});

r.post('/orders/:id/cancel', ({ params, userId }) => {
  const order = db().orders.find((o) => o.id === params.id && o.user === userId) ?? fail(404, 'Order not found');
  if (!['pending', 'paid'].includes(order.status)) fail(400, 'Shipped orders cannot be cancelled');
  Object.assign(order, { status: 'cancelled', cancelledAt: now() });
  order.items.forEach((i: Doc) => { const p = db().products.find((x) => x.id === i.product); if (p) p.stock += i.qty; });
  touch(order);
  store.save();
  return { order };
});

r.get('/orders', ({ query, userId }) => {
  requireAdmin(userId);
  const page = Number(query.page) || 1;
  const list = db().orders.filter((o) => !query.status || o.status === query.status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { orders: list.slice((page - 1) * 20, page * 20).map(withUser), total: list.length, page, pages: Math.max(1, Math.ceil(list.length / 20)) };
});

const NEXT: Record<string, string[]> = { pending: ['paid', 'cancelled'], paid: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] };
r.patch('/orders/:id/status', ({ params, body, userId }) => {
  requireAdmin(userId);
  const order = db().orders.find((o) => o.id === params.id) ?? fail(404, 'Order not found');
  if (!NEXT[order.status]?.includes(body.status)) fail(400, `Cannot move an order from ${order.status} to ${body.status}`);
  order.status = body.status;
  const at = now();
  if (body.status === 'paid') order.paidAt = at;
  if (body.status === 'shipped') order.shippedAt = at;
  if (body.status === 'delivered') order.deliveredAt = at;
  if (body.status === 'cancelled') { order.cancelledAt = at; order.items.forEach((i: Doc) => { const p = db().products.find((x) => x.id === i.product); if (p) p.stock += i.qty; }); }
  touch(order);
  store.save();
  return { order: withUser(order) };
});

// ---------- wishlist ----------
const listFor = (userId: string) => {
  let w = db().wishlists.find((x) => x.user === userId);
  if (!w) { w = { id: newId(), user: userId, products: [] }; db().wishlists.push(w); }
  return w;
};
r.get('/wishlist', ({ userId }) => ({ products: listFor(userId!).products.map((id: string) => db().products.find((p) => p.id === id)).filter(Boolean) }));
r.get('/wishlist/ids', ({ userId }) => ({ ids: listFor(userId!).products }));
r.post('/wishlist/:productId', ({ params, userId }) => {
  if (!db().products.some((p) => p.id === params.productId)) fail(404, 'Product not found');
  const w = listFor(userId!);
  const saved = !w.products.includes(params.productId);
  w.products = saved ? [...w.products, params.productId] : w.products.filter((id: string) => id !== params.productId);
  store.save();
  return { saved, ids: w.products };
});

// ---------- admin ----------
r.get('/admin/stats', ({ userId }) => {
  requireAdmin(userId);
  const paidStatuses = ['paid', 'shipped', 'delivered'];
  const orders = db().orders;
  const paid = orders.filter((o) => paidStatuses.includes(o.status));
  const since = new Date(); since.setHours(0, 0, 0, 0); since.setDate(since.getDate() - 13);
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(since); d.setDate(since.getDate() + i); return { date: d.toISOString().slice(0, 10), revenue: 0, orders: 0 }; });
  const top = new Map<string, Doc>();
  for (const o of paid.filter((x) => new Date(x.createdAt) >= since)) {
    const day = days.find((d) => d.date === o.createdAt.slice(0, 10));
    if (day) { day.revenue += o.totalPrice; day.orders += 1; }
    for (const it of o.items) {
      const cur = top.get(it.product) ?? { name: it.name, qty: 0, revenue: 0, icon: it.icon, tone: it.tone };
      cur.qty += it.qty; cur.revenue += it.qty * it.price; top.set(it.product, cur);
    }
  }
  return {
    revenue: paid.reduce((s, o) => s + o.totalPrice, 0),
    paidOrders: paid.length,
    orders: orders.length,
    toFulfil: orders.filter((o) => ['pending', 'paid'].includes(o.status)).length,
    customers: db().users.filter((u) => u.role === 'user').length,
    sales: days.map((d) => ({ ...d, revenue: Math.round(d.revenue) })),
    topProducts: [...top.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    lowStock: db().products.filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 6),
    recentOrders: [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map(withUser),
  };
});

export const demoAdapter = createAdapter(r, (t) => (t?.startsWith('demo.') ? t.slice(5) : null));
