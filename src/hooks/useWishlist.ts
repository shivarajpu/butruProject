/**
 * useWishlist — one shared wishlist store for every heart in the app.
 *
 * The id set lives at module level and is published through
 * `useSyncExternalStore`, so a like/unlike on any surface (wishlist tab,
 * product page, home card) instantly re-renders every mounted heart instead of
 * each component keeping a private, mount-only copy that never hears about
 * changes made elsewhere.
 */

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { apiService } from '../api/apiService';

const WISHLIST_ENDPOINT = '/api/storefront/wishlist';
const WISHLIST_ITEMS_ENDPOINT = '/api/storefront/wishlist/items';

interface WishlistItem {
  productId: string;
  product?: { id?: string; _id?: string };
}

interface WishlistResponse {
  success: boolean;
  data?: { items?: WishlistItem[] };
}

let ids: ReadonlySet<string> = new Set<string>();
const busyIds = new Set<string>();
const listeners = new Set<() => void>();
let inFlight: Promise<void> | null = null;

const emit = () => {
  listeners.forEach(listener => listener());
};

const publish = (next: ReadonlySet<string>) => {
  ids = next;
  emit();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => ids;

/** Re-fetches the wishlist; concurrent calls share one request. */
export const refreshWishlist = (): Promise<void> => {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const response = await apiService.get<WishlistResponse>(WISHLIST_ENDPOINT);
      if (!response?.success) return;
      publish(
        new Set(
          (response.data?.items ?? [])
            .map(item => item.product?.id ?? item.product?._id ?? item.productId)
            .filter(Boolean) as string[],
        ),
      );
    } catch {
      // Hearts simply render as unliked.
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
};

/**
 * Lets a surface that keeps its own copy of the ids (the wishlist tab's item
 * list, the product page, category/home grids) push its result into the shared
 * store so every other heart re-renders.
 */
export const publishWishlistChange = (productId: string, liked: boolean) => {
  if (!productId || ids.has(productId) === liked) return;
  const next = new Set(ids);
  if (liked) next.add(productId);
  else next.delete(productId);
  publish(next);
};

/** Shared optimistic toggle — a single write re-renders every heart. */
const toggle = async (productId: string) => {
  if (!productId || busyIds.has(productId)) return;
  const liked = ids.has(productId);
  busyIds.add(productId);
  const previous = ids;
  const next = new Set(ids);
  if (liked) next.delete(productId);
  else next.add(productId);
  publish(next);

  try {
    if (liked) {
      await apiService.delete(`${WISHLIST_ITEMS_ENDPOINT}/${productId}`);
    } else {
      await apiService.post(WISHLIST_ITEMS_ENDPOINT, { productId });
    }
  } catch {
    publish(previous);
  } finally {
    busyIds.delete(productId);
  }
};

export function useWishlist() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    refreshWishlist();
  }, []);

  const refresh = useCallback(() => refreshWishlist(), []);

  return {
    ids: current,
    isWishlisted: (productId: string) => current.has(productId),
    toggle,
    refresh,
  };
}
