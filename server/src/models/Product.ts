import { Schema, model, type InferSchemaType } from 'mongoose';

export const CATEGORIES = ['Audio', 'Wearables', 'Computing', 'Cameras', 'Gaming', 'Accessories', 'Home'] as const;

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    brand: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    description: { type: String, required: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    icon: { type: String, default: 'package' },
    tone: { type: String, default: '#FF5A1F' },
    imageUrl: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    specs: [{ label: String, value: String, _id: false }],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);


export type ProductType = InferSchemaType<typeof productSchema>;
export const Product = model('Product', productSchema);
