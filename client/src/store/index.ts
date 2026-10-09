import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import { cartReducer, CART_STORAGE_KEY } from './cartSlice';

export const store = configureStore({ reducer: { cart: cartReducer } });

store.subscribe(() => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(store.getState().cart.items));
  } catch {
    /* storage full or blocked; cart still works for this session */
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const selectCartCount = (s: RootState) => s.cart.items.reduce((n, i) => n + i.qty, 0);
