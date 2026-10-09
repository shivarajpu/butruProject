/**
 * useWishlist — shared wishlist state for any surface that shows a heart.
 *
 * Only one request is made per mount and the optimistic update is reverted if
 * the server rejects it, so hearts in lists and grids stay in sync.
 */

import { useCallback, useEffect, useState } from 'react';
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

export function useWishlist() {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await apiService.get<WishlistResponse>(WISHLIST_ENDPOINT);
      if (!response?.success) return;
      const next = new Set(
        (response.data?.items ?? [])
          .map(item => item.product?.id ?? item.product?._id ?? item.productId)
          .filter(Boolean) as string[],
      );
      setIds(next);
    } catch {
      // Hearts simply render as unliked.
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (productId: string) => {
      if (busyId === productId) return;
      const liked = ids.has(productId);
      setBusyId(productId);
      setIds(previous => {
        const next = new Set(previous);
        if (liked) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        if (liked) {
          await apiService.delete(`${WISHLIST_ITEMS_ENDPOINT}/${productId}`);
        } else {
          await apiService.post(WISHLIST_ITEMS_ENDPOINT, { productId });
        }
      } catch {
        setIds(previous => {
          const next = new Set(previous);
          if (liked) next.add(productId);
          else next.delete(productId);
          return next;
        });
      } finally {
        setBusyId(null);
      }
    },
    [busyId, ids],
  );

  return { ids, isWishlisted: (productId: string) => ids.has(productId), toggle, refresh };
}
