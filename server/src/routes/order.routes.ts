import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Order, ORDER_STATUSES } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { computeTotals } from '../lib/pricing.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  items: z.array(z.object({ product: z.string().refine(Types.ObjectId.isValid, 'Invalid product'), qty: z.number().int().min(1).max(10) })).min(1).max(30),
  shippingAddress: z.object({
    fullName: z.string().trim().min(2).max(80),
    phone: z.string().trim().regex(/^[+\d][\d\s-]{7,15}$/, 'Enter a valid phone number'),
    line1: z.string().trim().min(5).max(160),
    city: z.string().trim().min(2).max(60),
    state: z.string().trim().min(2).max(60),
    postalCode: z.string().trim().regex(/^\d{6}$/, 'Enter a 6-digit PIN code'),
  }),
  paymentMethod: z.enum(['card', 'upi', 'cod']),
});

const newOrderNumber = () => `SC-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${randomBytes(3).toString('hex').toUpperCase()}`;

router.post(
  '/',
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    const ids = body.items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: ids } });
    const byId = new Map(products.map((p) => [String(p._id), p]));

    const items = body.items.map((i) => {
      const p = byId.get(i.product);
      if (!p) throw AppError.badRequest('A product in your cart is no longer available');
      if (p.stock < i.qty) throw AppError.badRequest(`Only ${p.stock} left of ${p.name}`);
      return { product: p._id, name: p.name, slug: p.slug, price: p.price, qty: i.qty, icon: p.icon, tone: p.tone, imageUrl: p.imageUrl };
    });

    // Reserve stock. Each update only succeeds if enough stock is still there.
    const reserved: { id: Types.ObjectId; qty: number }[] = [];
    for (const item of items) {
      const ok = await Product.updateOne({ _id: item.product, stock: { $gte: item.qty } }, { $inc: { stock: -item.qty } });
      if (ok.modifiedCount !== 1) {
        await Promise.all(reserved.map((r) => Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty } })));
        throw AppError.conflict(`${item.name} just sold out. Please update your cart.`);
      }
      reserved.push({ id: item.product, qty: item.qty });
    }

    const order = await Order.create({
      orderNumber: newOrderNumber(),
      user: req.user!.id,
      items,
      shippingAddress: body.shippingAddress,
      paymentMethod: body.paymentMethod,
      ...computeTotals(items),
      status: 'pending',
    });
    res.status(201).json({ order });
  }),
);

const paySchema = z.object({
  method: z.enum(['card', 'upi']),
  cardNumber: z.string().optional(),
  upiId: z.string().optional(),
});

/**
 * Mock payment gateway. Card 4000 0000 0000 0002 is declined so the failure path can be demoed.
 * Swap this handler for a Stripe or Razorpay webhook in production.
 */
router.post(
  '/:id/pay',
  validate({ body: paySchema }),
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user!.id });
    if (!order) throw AppError.notFound('Order not found');
    if (order.status !== 'pending') throw AppError.badRequest('This order is already paid');

    const { method, cardNumber, upiId } = req.body as z.infer<typeof paySchema>;
    const digits = (cardNumber ?? '').replace(/\s/g, '');
    if (method === 'card' && !/^\d{16}$/.test(digits)) throw AppError.badRequest('Enter a 16-digit card number');
    if (method === 'upi' && !/^[\w.-]{2,}@[a-z]{2,}$/i.test(upiId ?? '')) throw AppError.badRequest('Enter a valid UPI ID, e.g. name@okaxis');
    if (digits === '4000000000000002') throw new AppError(402, 'Your card was declined. Try another card.');

    order.status = 'paid';
    order.paidAt = new Date();
    order.paymentRef = `pay_${randomBytes(8).toString('hex')}`;
    await order.save();
    res.json({ order });
  }),
);

router.get(
  '/mine',
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user!.id }).sort({ createdAt: -1 });
    res.json({ orders });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!Types.ObjectId.isValid(req.params.id)) throw AppError.notFound('Order not found');
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) throw AppError.notFound('Order not found');
    const ownerId = String((order.user as unknown as { _id: Types.ObjectId })._id ?? order.user);
    if (ownerId !== req.user!.id && req.user!.role !== 'admin') throw AppError.notFound('Order not found');
    res.json({ order });
  }),
);

router.post(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user!.id });
    if (!order) throw AppError.notFound('Order not found');
    if (!['pending', 'paid'].includes(order.status)) throw AppError.badRequest('Shipped orders cannot be cancelled');
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();
    await Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } })));
    res.json({ order });
  }),
);

// ---------- admin ----------
router.get(
  '/',
  requireRole('admin'),
  validate({ query: z.object({ status: z.enum(ORDER_STATUSES).optional(), page: z.coerce.number().int().min(1).default(1) }) }),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const filter = req.query.status ? { status: req.query.status } : {};
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * 20).limit(20).populate('user', 'name email'),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total, page, pages: Math.max(1, Math.ceil(total / 20)) });
  }),
);

const NEXT: Record<string, string[]> = { pending: ['paid', 'cancelled'], paid: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] };

router.patch(
  '/:id/status',
  requireRole('admin'),
  validate({ body: z.object({ status: z.enum(ORDER_STATUSES) }) }),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw AppError.notFound('Order not found');
    const next = req.body.status as (typeof ORDER_STATUSES)[number];
    if (!NEXT[order.status]?.includes(next)) throw AppError.badRequest(`Cannot move an order from ${order.status} to ${next}`);
    order.status = next;
    const now = new Date();
    if (next === 'paid') order.paidAt = now;
    if (next === 'shipped') order.shippedAt = now;
    if (next === 'delivered') order.deliveredAt = now;
    if (next === 'cancelled') {
      order.cancelledAt = now;
      await Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } })));
    }
    await order.save();
    await order.populate('user', 'name email');
    res.json({ order });
  }),
);

export default router;
