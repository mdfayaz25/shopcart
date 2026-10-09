import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '@/types';

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  icon: string;
  tone: string;
  imageUrl?: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  open: boolean;
}

const STORAGE_KEY = 'shopcart.cart';
const load = (): CartItem[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
};

const initialState: CartState = { items: load(), open: false };
const MAX_QTY = 10;

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, { payload }: PayloadAction<{ product: Product; qty?: number }>) {
      const { product, qty = 1 } = payload;
      const limit = Math.min(MAX_QTY, product.stock);
      const existing = state.items.find((i) => i.id === product.id);
      if (existing) existing.qty = Math.min(limit, existing.qty + qty);
      else
        state.items.push({
          id: product.id, slug: product.slug, name: product.name, brand: product.brand, price: product.price,
          stock: product.stock, icon: product.icon, tone: product.tone, imageUrl: product.imageUrl, qty: Math.min(limit, qty),
        });
      state.open = true;
    },
    setQty(state, { payload }: PayloadAction<{ id: string; qty: number }>) {
      const item = state.items.find((i) => i.id === payload.id);
      if (!item) return;
      item.qty = Math.max(1, Math.min(payload.qty, Math.min(MAX_QTY, item.stock)));
    },
    removeItem(state, { payload }: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== payload);
    },
    clearCart(state) {
      state.items = [];
    },
    setCartOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload;
    },
  },
});

export const { addItem, setQty, removeItem, clearCart, setCartOpen } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;
export const CART_STORAGE_KEY = STORAGE_KEY;
