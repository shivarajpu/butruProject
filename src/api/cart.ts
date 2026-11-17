/**
 * Storefront cart API.
 *
 *   POST   /api/storefront/cart/items                    { productId, quantity, setQuantity, size, color, sku, customisation }
 *   GET    /api/cart/:storeId                            → current cart (cart screen + bag badge)
 *   PUT    /api/storefront/cart/items/:productId         { quantity, size, color }
 *   DELETE /api/storefront/cart/items/:productId?size=..&color=..
 *
 * The server owns the cart. Every call returns the full cart, which is mapped
 * into the app's CartItem shape and mirrored into Redux so the cart screen and
 * the header bag icon always show the same source of truth.
 */

import { apiService } from './apiService';
import { STORE_ID } from '../config/storeIdentity';
import type { CartItem } from '../store/slices/cartSlice';

const CART_ITEMS_ENDPOINT = '/api/storefront/cart/items';
const CART_ENDPOINT = `/api/cart/${STORE_ID}`;

export interface CartApiItem {
  itemId: string;
  productId: string;
  name: string;
  productCode?: string;
  slug?: string;
  image?: string;
  images?: string[];
  size?: string;
  color?: string;
  sku?: string;
  quantity: number;
  unitPrice?: number;
  savedPrice?: number;
  priceChanged?: boolean;
  priceDifference?: number;
  mrp?: number;
  subtotal?: number;
  originalMrpTotal?: number;
  itemDiscount?: number;
  itemSavingsPercent?: number;
  availableStock?: number;
  isOutOfStock?: boolean;
  isAvailable?: boolean;
  stockWarning?: boolean;
  customisation?: unknown;
  addedAt?: string;
  platformPricingEnabled?: boolean;
}

export interface CartApiData {
  items: CartApiItem[];
  savedForLater?: CartApiItem[];
  appliedCoupon?: unknown;
  lastActivityAt?: string;
  summary?: {
    itemCount?: number;
    activeItemCount?: number;
    totalQuantity?: number;
    subtotal?: number;
    currency?: string;
    [key: string]: unknown;
  };
}

export interface CartApiResponse {
  success: boolean;
  message?: string;
  data: CartApiData;
}

export interface AddToCartPayload {
  productId: string;
  quantity: number;
  setQuantity: boolean;
  size?: string;
  color?: string;
  sku?: string;
  customisation?: unknown;
}

export interface UpdateCartPayload {
  quantity: number;
  size?: string;
  color?: string;
}

/** Server line → the local shape the cart screen and checkout already consume. */
export const mapCartApiItem = (item: CartApiItem): CartItem => {
  const quantity = item.quantity ?? 1;
  const price =
    item.unitPrice ?? (quantity > 0 ? (item.subtotal ?? 0) / quantity : 0);

  return {
    cartId: `${item.productId}:${item.size || 'default'}:${item.color || 'default'}`,
    productId: item.productId,
    name: item.name,
    price,
    originalPrice: item.mrp ?? price,
    image: item.image ?? item.images?.[0] ?? '',
    size: item.size ?? '',
    color: item.color ?? '',
    quantity,
    productCode: item.productCode ?? item.sku,
  };
};

const mapResponse = (response: CartApiResponse): CartItem[] =>
  (response?.data?.items ?? []).map(mapCartApiItem);

export const cartApi = {
  addItem: (payload: AddToCartPayload): Promise<CartItem[]> =>
    apiService
      .post<CartApiResponse>(CART_ITEMS_ENDPOINT, payload)
      .then(mapResponse),

  fetchCart: (): Promise<CartItem[]> =>
    apiService.get<CartApiResponse>(CART_ENDPOINT).then(mapResponse),

  updateItem: (
    productId: string,
    payload: UpdateCartPayload,
  ): Promise<CartItem[]> =>
    apiService
      .update<CartApiResponse>(
        `${CART_ITEMS_ENDPOINT}/${encodeURIComponent(productId)}`,
        payload,
      )
      .then(mapResponse),

  removeItem: (
    productId: string,
    size?: string,
    color?: string,
  ): Promise<CartItem[]> => {
    const query = [
      size ? `size=${encodeURIComponent(size)}` : '',
      color ? `color=${encodeURIComponent(color)}` : '',
    ]
      .filter(Boolean)
      .join('&');
    const path = `${CART_ITEMS_ENDPOINT}/${encodeURIComponent(productId)}`;

    return apiService
      .delete<CartApiResponse>(query ? `${path}?${query}` : path)
      .then(mapResponse);
  },
};
