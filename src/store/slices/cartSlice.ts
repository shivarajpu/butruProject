/**
 * Redux Toolkit — Cart Slice
 *
 * Global cart state shared across all screens. Persisted to AsyncStorage so
 * the bag badge count survives app restarts, similar to the auth session.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@butru_cart';

export interface CartItem {
  /** Unique line id — `${productId}:${size}` so the same product with a different size is its own line. */
  cartId: string;
  productId: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  productCode?: string;
}

export interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

export const loadCartState = async (): Promise<CartState> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartState;
      if (parsed && Array.isArray(parsed.items)) {
        return parsed;
      }
    }
  } catch {
    // Ignore — fall back to empty cart.
  }
  return initialState;
};

export const persistCartState = async (state: CartState) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write failures.
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<CartState>) {
      state.items = action.payload.items;
    },
    addItem(
      state,
      action: PayloadAction<
        Omit<CartItem, 'cartId' | 'quantity' | 'productCode'> & {
          quantity?: number;
          productCode?: string;
        }
      >,
    ) {
      const incoming = action.payload;
      const cartId = `${incoming.productId}:${incoming.size || 'default'}`;
      const qty = incoming.quantity ?? 1;
      const existing = state.items.find(item => item.cartId === cartId);
      if (existing) {
        existing.quantity += qty;
      } else {
        state.items.push({ ...incoming, cartId, quantity: qty });
      }
      persistCartState(state);
    },
    increment(state, action: PayloadAction<string>) {
      const item = state.items.find(i => i.cartId === action.payload);
      if (item) {
        item.quantity += 1;
        persistCartState(state);
      }
    },
    decrement(state, action: PayloadAction<string>) {
      const index = state.items.findIndex(i => i.cartId === action.payload);
      if (index !== -1) {
        const item = state.items[index];
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          state.items.splice(index, 1);
        }
        persistCartState(state);
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter(i => i.cartId !== action.payload);
      persistCartState(state);
    },
    clearCart(state) {
      state.items = [];
      persistCartState(state);
    },
  },
});

export const {
  hydrate,
  addItem,
  increment,
  decrement,
  removeItem,
  clearCart,
} = cartSlice.actions;

/** Total units across all cart lines (used for the bag badge). */
export const selectCartCount = (state: { cart: CartState }): number =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export default cartSlice.reducer;