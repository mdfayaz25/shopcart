import { Router } from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 13);

    const paidStatuses = ['paid', 'shipped', 'delivered'];
    const [revenueRows, paidCount, orderCount, pendingCount, customerCount, lowStock, recentOrders, recentPaid] = await Promise.all([
      Order.aggregate<{ total: number }>([
        { $match: { status: { $in: paidStatuses } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.countDocuments({ status: { $in: paidStatuses } }),
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['pending', 'paid'] } }),
      User.countDocuments({ role: 'user' }),
      Product.find({ stock: { $lte: 5 } }).sort({ stock: 1 }).limit(6),
      Order.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name email'),
      Order.find({ status: { $in: paidStatuses }, createdAt: { $gte: since } }).select('createdAt totalPrice items'),
    ]);

    // Daily revenue for the last 14 days, filled in JS so empty days still show up.
    const days: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      days.push({ date: d.toISOString().slice(0, 10), revenue: 0, orders: 0 });
    }
    const productTotals = new Map<string, { name: string; qty: number; revenue: number; icon?: string; tone?: string }>();
    for (const o of recentPaid) {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      const day = days.find((d) => d.date === key);
      if (day) {
        day.revenue += o.totalPrice;
        day.orders += 1;
      }
      for (const it of o.items) {
        const cur = productTotals.get(String(it.product)) ?? { name: it.name, qty: 0, revenue: 0, icon: it.icon ?? undefined, tone: it.tone ?? undefined };
        cur.qty += it.qty;
        cur.revenue += it.qty * it.price;
        productTotals.set(String(it.product), cur);
      }
    }

    res.json({
      revenue: revenueRows[0]?.total ?? 0,
      paidOrders: paidCount,
      orders: orderCount,
      toFulfil: pendingCount,
      customers: customerCount,
      sales: days.map((d) => ({ ...d, revenue: Math.round(d.revenue) })),
      topProducts: [...productTotals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      lowStock,
      recentOrders,
    });
  }),
);

router.get(
  '/customers',
  asyncHandler(async (_req, res) => {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(100);
    res.json({ users });
  }),
);

export default router;
