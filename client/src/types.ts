export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  createdAt: string;
}

export const CATEGORIES = ['Audio', 'Wearables', 'Computing', 'Cameras', 'Gaming', 'Accessories', 'Home'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: Category;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  rating: number;
  numReviews: number;
  featured: boolean;
  icon: string;
  tone: string;
  imageUrl?: string;
  tags: string[];
  specs: { label: string; value: string }[];
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  user: { id: string; name: string; avatarColor: string } | null;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  product: string;
  name: string;
  slug?: string;
  price: number;
  qty: number;
  icon?: string;
  tone?: string;
  imageUrl?: string;
}

export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  user: string | { id: string; name: string; email: string };
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: 'card' | 'upi' | 'cod';
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  status: OrderStatus;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
