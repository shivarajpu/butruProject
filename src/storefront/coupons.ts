/**
 * Storefront coupons.
 *
 *   GET /api/storefront/coupons?slug=<storeSlug>
 *
 * Applying a code is a different endpoint and already lives with the cart
 * (`CartScreen` → POST /api/storefront/coupons/apply). This one only backs the
 * "Available Coupons" ticket list, so the shopper taps a coupon instead of
 * typing its code — the list is a convenience, the cart still does the real
 * validation and is what decides whether a discount actually applies.
 *
 * Deliberately not cached. `eligibilityType` is per user, so a cached list can
 * offer a code that is no longer valid for the signed-in shopper.
 */

import { apiService } from '../api/apiService';

const ENDPOINT = '/api/storefront/coupons';

/**
 * `percentage` reads as "10% off", `flat` as "₹50 off". Left open rather than
 * narrowed to a union: an unknown value must not become a type error here, it
 * should just fall through to the generic wording in `describeCoupon`.
 */
export type CouponType = 'percentage' | 'flat' | (string & {});

export interface StoreCoupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  /** Ceiling for a percentage coupon; `null`/absent means uncapped. */
  maxDiscount: number | null;
  validFrom: string | null;
  validTo: string | null;
  /** e.g. `all_users` — decides who may redeem, not how the ticket reads. */
  eligibilityType: string;
  /** e.g. `cart_subtotal` — what the discount is computed against. */
  appliesOn: string;
  excludeDiscountedProducts: boolean;
  /** `manual` / `gate` / … — bookkeeping, never shown to the shopper. */
  source: string;
}

interface CouponsResponse {
  success: boolean;
  count: number;
  data: StoreCoupon[] | null;
}

/** A ticket whose window has already closed is worse than no ticket at all. */
export const isLiveCoupon = (coupon: StoreCoupon): boolean => {
  if (!coupon.validTo) return true;
  const end = Date.parse(coupon.validTo);
  if (Number.isNaN(end)) return true;
  return end > Date.now();
};

/**
 * Best-effort list: a failed request yields no coupons rather than an error
 * state, because the shopper can still type a code by hand in the same sheet.
 */
export const fetchCoupons = async (slug: string): Promise<StoreCoupon[]> => {
  try {
    const response = await apiService.get<CouponsResponse>(
      `${ENDPOINT}?slug=${encodeURIComponent(slug)}`,
    );
    if (!response?.success) return [];
    return (response.data ?? []).filter(isLiveCoupon);
  } catch {
    return [];
  }
};
