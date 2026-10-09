import { Router } from 'express';
import { Types } from 'mongoose';
import { Wishlist } from '../models/Wishlist.js';
import { Product } from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const list = await Wishlist.findOne({ user: req.user!.id }).populate('products');
    res.json({ products: list?.products ?? [] });
  }),
);

router.post(
  '/:productId',
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    if (!Types.ObjectId.isValid(productId) || !(await Product.exists({ _id: productId }))) throw AppError.notFound('Product not found');
    const list = (await Wishlist.findOne({ user: req.user!.id })) ?? new Wishlist({ user: req.user!.id, products: [] });
    const idx = list.products.findIndex((p) => String(p) === productId);
    const saved = idx === -1;
    if (saved) list.products.push(new Types.ObjectId(productId));
    else list.products.splice(idx, 1);
    await list.save();
    res.json({ saved, ids: list.products.map(String) });
  }),
);

router.get(
  '/ids',
  asyncHandler(async (req, res) => {
    const list = await Wishlist.findOne({ user: req.user!.id });
    res.json({ ids: (list?.products ?? []).map(String) });
  }),
);

export default router;
