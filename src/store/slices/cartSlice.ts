/**
 * Redux Toolkit — Cart Slice
 *
 * Global cart state shared across all screens. Persisted to AsyncStorage so
 * the bag badge count survives app restarts, similar to the auth session.
 */

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
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
  /** True while a cart API call is in flight (used for the cart screen loader). */
  loading: boolean;
  /**
   * Single product reserved by "Buy Now" for an immediate checkout.
   * Lives separately from the saved cart so a Buy Now order never mixes
   * with the user's existing bag items. Transient — not persisted.
   */
  buyNowItem: CartItem | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  buyNowItem: null,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

/** Add argument — mirrors the local CartItem plus the server-only fields. */
export type AddToCartArg = Omit<CartItem, 'cartId' | 'quantity'> & {
  quantity?: number;
  sku?: string;
  customisation?: unknown;
};

export type UpdateCartArg = {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
};

export type RemoveCartArg = {
  productId: string;
  size?: string;
  color?: string;
};

// ── thunks ─────────────────────────────────────────────────────────────────
// Every thunk replaces `items` with the cart returned by the server, so the
// cart screen and the header bag badge stay on the same source of truth.

export const fetchCart = createAsyncThunk<CartItem[], void, { rejectValue: string }>(
  'cart/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { cartApi } = await import('../../api/cart');
      return await cartApi.fetchCart();
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load the cart.'));
    }
  },
);

export const addToCart = createAsyncThunk<CartItem[], AddToCartArg, { rejectValue: string }>(
  'cart/add',
  async (item, { rejectWithValue }) => {
    try {
      const { cartApi } = await import('../../api/cart');
      return await cartApi.addItem({
        productId: item.productId,
        quantity: item.quantity ?? 1,
        setQuantity: true,
        size: item.size ?? '',
        color: item.color ?? '',
        sku: item.sku ?? item.productCode ?? '',
        customisation: item.customisation ?? null,
      });
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not add the item to the cart.'));
    }
  },
);

export const updateCartItem = createAsyncThunk<
  CartItem[],
  UpdateCartArg,
  { rejectValue: string }
>('cart/update', async (item, { rejectWithValue }) => {
  try {
    const { cartApi } = await import('../../api/cart');
    return await cartApi.updateItem(item.productId, {
      quantity: item.quantity,
      size: item.size ?? '',
      color: item.color ?? '',
    });
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not update the cart item.'));
  }
});

export const removeCartItem = createAsyncThunk<
  CartItem[],
  RemoveCartArg,
  { rejectValue: string }
>('cart/remove', async (item, { rejectWithValue }) => {
  try {
    const { cartApi } = await import('../../api/cart');
    return await cartApi.removeItem(item.productId, item.size, item.color);
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not remove the cart item.'));
  }
});

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
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ items: state.items }));
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
    setBuyNowItem(
      state,
      action: PayloadAction<
        Omit<CartItem, 'cartId' | 'quantity'> & {
          quantity?: number;
        }
      >,
    ) {
      const incoming = action.payload;
      state.buyNowItem = {
        ...incoming,
        cartId: `${incoming.productId}:${incoming.size || 'default'}`,
        quantity: incoming.quantity ?? 1,
      };
    },
    updateBuyNowQty(state, action: PayloadAction<{ delta: number }>) {
      if (!state.buyNowItem) {
        return;
      }
      state.buyNowItem = {
        ...state.buyNowItem,
        quantity: Math.max(1, state.buyNowItem.quantity + action.payload.delta),
      };
    },
    clearBuyNowItem(state) {
      state.buyNowItem = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCart.pending, state => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
        persistCartState(state);
      })
      .addCase(fetchCart.rejected, state => {
        state.loading = false;
      })
      .addCase(addToCart.pending, state => {
        state.loading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
        persistCartState(state);
      })
      .addCase(addToCart.rejected, state => {
        state.loading = false;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload;
        persistCartState(state);
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.items = action.payload;
        persistCartState(state);
      });
  },
});

export const {
  hydrate,
  addItem,
  increment,
  decrement,
  removeItem,
  clearCart,
  setBuyNowItem,
  updateBuyNowQty,
  clearBuyNowItem,
} = cartSlice.actions;

/**
 * Number of items in the bag (one per distinct product line) — used for the
 * bag badge. Adding another unit of a product that is already in the bag
 * raises that line's `quantity`, not this count.
 */
export const selectCartCount = (state: { cart: CartState }): number =>
  state.cart.items.length;

export default cartSlice.reducer;