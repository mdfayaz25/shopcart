import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { CATEGORIES, Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { slugify } from '../lib/pricing.js';

const router = Router();

const listQuery = z.object({
  search: z.string().trim().max(80).optional(),
  category: z.enum(CATEGORIES).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  featured: z.enum(['true', 'false']).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'rating', 'popular']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get(
  '/',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const q = listQuery.parse(req.query);
    const filter: Record<string, unknown> = {};
    if (q.search) {
      const rx = new RegExp(escapeRegex(q.search), 'i');
      filter.$or = [{ name: rx }, { brand: rx }, { tags: rx }];
    }
    if (q.category) filter.category = q.category;
    if (q.minPrice !== undefined || q.maxPrice !== undefined) {
      filter.price = { ...(q.minPrice !== undefined && { $gte: q.minPrice }), ...(q.maxPrice !== undefined && { $lte: q.maxPrice }) };
    }
    if (q.rating) filter.rating = { $gte: q.rating };
    if (q.featured === 'true') filter.featured = true;
    if (q.inStock === 'true') filter.stock = { $gt: 0 };

    const sort: Record<string, 1 | -1> = {
      newest: { createdAt: -1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      rating: { rating: -1, numReviews: -1 },
      popular: { numReviews: -1, rating: -1 },
    }[q.sort] as Record<string, 1 | -1>;

    const [items, total] = await Promise.all([
      Product.find(filter).sort({ ...sort, _id: -1 }).skip((q.page - 1) * q.limit).limit(q.limit),
      Product.countDocuments(filter),
    ]);
    res.json({ items, total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)) });
  }),
);

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const rows = await Product.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    const counts = Object.fromEntries(rows.map((r) => [r._id, r.count]));
    res.json({ categories: CATEGORIES.map((name) => ({ name, count: counts[name] ?? 0 })) });
  }),
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) throw AppError.notFound('Product not found');
    const [reviews, related] = await Promise.all([
      Review.find({ product: product._id }).sort({ createdAt: -1 }).limit(30).populate('user', 'name avatarColor'),
      Product.find({ category: product.category, _id: { $ne: product._id } }).sort({ rating: -1 }).limit(4),
    ]);
    res.json({ product, reviews, related });
  }),
);

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(80).optional(),
  comment: z.string().trim().min(10, 'Write at least 10 characters').max(1000),
});

router.post(
  '/:id/reviews',
  requireAuth,
  validate({ body: reviewSchema }),
  asyncHandler(async (req, res) => {
    if (!Types.ObjectId.isValid(req.params.id)) throw AppError.notFound('Product not found');
    const product = await Product.findById(req.params.id);
    if (!product) throw AppError.notFound('Product not found');

    const existing = await Review.exists({ product: product._id, user: req.user!.id });
    if (existing) throw AppError.conflict('You have already reviewed this product');

    const purchased = await Order.exists({ user: req.user!.id, 'items.product': product._id, status: { $in: ['paid', 'shipped', 'delivered'] } });
    if (!purchased && req.user!.role !== 'admin') throw AppError.forbidden('Only customers who bought this product can review it');

    const review = await Review.create({ ...req.body, product: product._id, user: req.user!.id });
    const stats = await Review.aggregate<{ avg: number; count: number }>([
      { $match: { product: product._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    product.rating = Math.round((stats[0]?.avg ?? 0) * 10) / 10;
    product.numReviews = stats[0]?.count ?? 0;
    await product.save();
    await review.populate('user', 'name avatarColor');
    res.status(201).json({ review, product });
  }),
);

// ---------- admin ----------
const productBody = z.object({
  name: z.string().trim().min(2).max(120),
  brand: z.string().trim().min(1).max(60),
  category: z.enum(CATEGORIES),
  description: z.string().trim().min(10).max(2000),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional().nullable(),
  stock: z.number().int().min(0),
  featured: z.boolean().optional(),
  icon: z.string().max(40).optional(),
  tone: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string().trim().max(30)).max(10).optional(),
  specs: z.array(z.object({ label: z.string().max(40), value: z.string().max(120) })).max(12).optional(),
});

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validate({ body: productBody }),
  asyncHandler(async (req, res) => {
    let slug = slugify(req.body.name);
    if (await Product.exists({ slug })) slug = `${slug}-${Date.now().toString(36)}`;
    const product = await Product.create({ ...req.body, slug, compareAtPrice: req.body.compareAtPrice ?? undefined });
    res.status(201).json({ product });
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate({ body: productBody.partial() }),
  asyncHandler(async (req, res) => {
    const update = { ...req.body };
    if (update.compareAtPrice === null) {
      delete update.compareAtPrice;
      (update as Record<string, unknown>).$unset = { compareAtPrice: 1 };
    }
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!product) throw AppError.notFound('Product not found');
    res.json({ product });
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw AppError.notFound('Product not found');
    await Review.deleteMany({ product: product._id });
    res.status(204).end();
  }),
);

export default router;
