/**
 * Catalog helpers for dynamic widgets.
 *
 * The storefront config only describes *which* products a widget should show
 * (`config.source` + `config.limit`), never the products themselves. This
 * module translates a widget source into a products query and normalises the
 * response into the single `StoreProduct` shape every widget renders.
 *
 * A tiny in-memory cache keeps multiple widgets asking for the same source
 * (e.g. "new_arrivals" on home + product pages) down to one request.
 */

import { apiService } from '../api/apiService';
import type { ProductGroupSource, StoreCollection } from './types';

const PRODUCTS_ENDPOINT = '/api/storefront/products';
const BANNERS_ENDPOINT = '/api/storefront/banners';

// ─── Normalised product shape ──────────────────────────────────────────────────

export interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  productCode: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  tag: string;
  sizes: string[];
  /** Single colour label, carried onto the cart line item. */
  color: string;
  image: string;
  images: string[];
  isPopular: boolean;
  isNewArrival: boolean;
  isDealOfTheDay: boolean;
  /** ISO timestamp of the deal end, used for the countdown. */
  dealEndAt: string | null;
  isOutOfStock: boolean;
  categoryPath: string[];
  websiteCategory: string;
}

export interface StoreBanner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaUrl: string;
  productId: string;
  offerPercent: number;
}

interface ApiProductSku {
  size: string;
  sellingPrice: number;
  mrp: number;
}

interface ApiProduct {
  _id: string;
  id?: string;
  name: string;
  slug?: string;
  productCode?: string;
  price?: number;
  rating?: number;
  avgRating?: number;
  reviewCount?: number;
  tag?: string;
  isPopular?: boolean;
  isNewArrival?: boolean;
  isDealOfTheDay?: boolean;
  dealEndAt?: string | null;
  isOutOfStock?: boolean;
  images?: string[];
  color?: string;
  websiteCategory?: string;
  categoryPath?: string[];
  skus?: ApiProductSku[];
}

interface ApiProductsResponse {
  success: boolean;
  data: ApiProduct[];
}

interface ApiBanner {
  _id: string;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  ctaText?: string;
  ctaUrl?: string;
  productId?: string;
  offerPercent?: number;
}

interface ApiBannersResponse {
  success: boolean;
  data: ApiBanner[];
}

// ─── Mappers ───────────────────────────────────────────────────────────────────

const mapApiProduct = (item: ApiProduct): StoreProduct => {
  const sku = item.skus?.[0];
  const price = sku?.sellingPrice ?? item.price ?? 0;
  const originalPrice = sku?.mrp ?? price;
  const isPopular = item.isPopular === true;
  const isNewArrival = item.isNewArrival === true;

  return {
    id: item._id ?? item.id ?? '',
    slug: item.slug ?? '',
    name: item.name ?? '',
    productCode: item.productCode ?? '',
    price,
    originalPrice,
    discount:
      originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0,
    rating: item.rating ?? item.avgRating ?? 0,
    reviews: item.reviewCount ?? 0,
    tag:
      item.tag ||
      (isNewArrival ? 'New Arrival' : isPopular ? 'Best Seller' : ''),
    sizes: [...new Set((item.skus ?? []).map(entry => entry.size).filter(Boolean))],
    color: item.color ?? '',
    image: item.images?.[0] ?? '',
    images: item.images ?? [],
    isPopular,
    isNewArrival,
    isDealOfTheDay: item.isDealOfTheDay === true,
    dealEndAt: item.dealEndAt ?? null,
    isOutOfStock: item.isOutOfStock === true,
    categoryPath: item.categoryPath ?? [],
    websiteCategory: item.websiteCategory ?? '',
  };
};

/**
 * The admin panel auto-fills a banner title from the uploaded file, so titles
 * arrive as `"home_hero image 2026-06-03T12:59:04"`. Those are file names, not
 * copy, and rendering them over the slide shows a timestamp to the shopper.
 */
const AUTO_BANNER_TITLE = /^\s*\S+\s+image\s+\d{4}-\d{2}-\d{2}T/i;

const isRealBannerTitle = (title: string) =>
  !!title.trim() && !AUTO_BANNER_TITLE.test(title);

const mapApiBanner = (item: ApiBanner): StoreBanner => ({
  id: item._id,
  title: isRealBannerTitle(item.title ?? '') ? (item.title ?? '').trim() : '',
  subtitle: item.subtitle ?? '',
  image: item.imageUrl,
  ctaText: item.ctaText ?? '',
  ctaUrl: item.ctaUrl ?? '',
  productId: item.productId ?? '',
  offerPercent: item.offerPercent ?? 0,
});

// ─── Source → query ────────────────────────────────────────────────────────────

/**
 * Query flags per `config.source`.
 *
 * The products endpoint supports the product-level booleans directly, but has
 * no collection filter — collections live inside `categoryPath`, so those are
 * narrowed client-side (see `matchesCollection`).
 */
const sourceQuery = (source: ProductGroupSource): Record<string, string> => {
  switch (source) {
    case 'new_arrivals':
      return { isNewArrival: 'true' };
    case 'popular':
      return { isPopular: 'true' };
    case 'deal_of_the_day':
      return { isDealOfTheDay: 'true' };
    case 'best_and_new':
      // Both flags are true-ish server side only when set on the product, so
      // we request the new-arrivals set and re-rank by popularity below.
      return { isNewArrival: 'true' };
    case 'collection':
      // The API ignores `collectionId` and its `category` filter matches on a
      // human-readable category, not the id — so fetch the visible set wide
      // and let `matchesCollection` narrow it by categoryPath below.
      return {};
    case 'all':
    default:
      return {};
  }
};

const matchesCollection = (
  product: StoreProduct,
  collectionTitle?: string,
): boolean => {
  if (!collectionTitle) return true;
  return product.categoryPath.some(
    path => path.toLowerCase() === collectionTitle.toLowerCase(),
  );
};

/** Ranks the mixed "best sellers & new arrivals" feed: popular first, then new. */
const rankBestAndNew = (products: StoreProduct[]): StoreProduct[] =>
  [...products].sort((a, b) => {
    const score = (p: StoreProduct) => (p.isPopular ? 2 : 0) + (p.isNewArrival ? 1 : 0);
    return score(b) - score(a);
  });

/**
 * The deals endpoint answers `?isDealOfTheDay=true` with products that are
 * *not* flagged as deals — a plain "hoodie" came back in the middle of the
 * deal feed — so the flag has to be re-checked client side before those
 * products reach the deal widget.
 */
const isLiveDeal = (product: StoreProduct): boolean =>
  product.isDealOfTheDay && !product.isOutOfStock;

// ─── In-memory cache ───────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000;

const productCache = new Map<string, { at: number; data: StoreProduct[] }>();
const bannerCache = new Map<string, { at: number; data: StoreBanner[] }>();

const readCache = <T>(cache: Map<string, { at: number; data: T[] }>, key: string): T[] | null => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;
  return null;
};

const writeCache = <T>(cache: Map<string, { at: number; data: T[] }>, key: string, data: T[]) => {
  cache.set(key, { at: Date.now(), data });
};

/** Used by pull-to-refresh / retry so stale feeds are never shown. */
export const clearCatalogCache = () => {
  productCache.clear();
  bannerCache.clear();
};

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Products for a HomeTab category filter, by *name*.
 *
 * The drawer and the banner CTAs both address categories by title, and the
 * endpoint's `category` filter only understands the product type
 * (`websiteCategory`: `Clothing`, `Shoes`, `Accessories`) — for a collection
 * title such as `New Arrivals` it returns nothing. So the type filter is tried
 * first, and a collection title falls back to the same wide fetch plus
 * `matchesCollection` narrowing that `fetchProductsForSource` uses.
 */
export const fetchProductsByCategoryName = async (
  category: string,
  collections: StoreCollection[] = [],
  limit = 100,
): Promise<StoreProduct[]> => {
  const isCollection = collections.some(
    item => item.title.toLowerCase() === category.toLowerCase(),
  );

  // Product type — the endpoint filters this server side.
  if (!isCollection) {
    try {
      const response = await apiService.get<ApiProductsResponse>(
        `${PRODUCTS_ENDPOINT}?isVisible=true&category=${encodeURIComponent(category)}`,
      );
      const products = (response?.data ?? []).map(mapApiProduct);
      if (products.length) return products;
    } catch {
      // fall through to the client-side path below
    }
  }

  // Collection title (or a type the endpoint didn't know) — fetch the visible
  // set and narrow it against `categoryPath` client side.
  return fetchProductsForSource({
    source: 'all',
    limit,
    collectionTitle: category,
    collections,
  });
};

export type FetchProductsOptions = {
  source: ProductGroupSource;
  limit?: number;
  collectionId?: string;
  /**
   * Narrows by collection *title* instead of id — used when the caller only
   * knows the display name (drawer category, banner CTA).
   */
  collectionTitle?: string;
  collections?: StoreCollection[];
  /** Bypasses the in-memory cache. */
  force?: boolean;
};

export const fetchProductsForSource = async ({
  source,
  limit = 12,
  collectionId,
  collectionTitle,
  collections = [],
  force = false,
}: FetchProductsOptions): Promise<StoreProduct[]> => {
  // Over-fetch for client-side filtering, but never ask for the whole catalog.
  const wantsClientFilter = !!collectionId || !!collectionTitle;
  const requestLimit = wantsClientFilter ? Math.max(limit * 3, 24) : limit;
  const key = `${source}|${collectionId ?? ''}|${collectionTitle ?? ''}|${requestLimit}`;

  const cached = force ? null : readCache(productCache, key);
  const query = sourceQuery(source);

  const queryString = [
    'isVisible=true',
    `limit=${requestLimit}`,
    ...Object.entries(query).map(([k, v]) => `${k}=${encodeURIComponent(v)}`),
  ].join('&');

  let remote: StoreProduct[] | null = null;

  if (!cached) {
    try {
      const response = await apiService.get<ApiProductsResponse>(
        `${PRODUCTS_ENDPOINT}?${queryString}`,
      );
      remote = (response?.data ?? []).map(mapApiProduct);
      writeCache(productCache, key, remote);
    } catch {
      remote = null;
    }
  }

  const source_ = cached ?? remote ?? [];

  let result = source_;

  if (collectionId) {
    const collection = collections.find(item => item.id === collectionId);
    result = result.filter(product => matchesCollection(product, collection?.title));
  } else if (collectionTitle) {
    result = result.filter(product => matchesCollection(product, collectionTitle));
  }

  if (source === 'best_and_new') {
    result = rankBestAndNew(result);
  }

  if (source === 'deal_of_the_day') {
    result = result.filter(isLiveDeal);
  }

  return result.slice(0, limit);
};

export const fetchBanners = async (
  placement: string,
  force = false,
): Promise<StoreBanner[]> => {
  const key = placement;

  if (!force) {
    const cached = readCache(bannerCache, key);
    if (cached) return cached;
  }

  try {
    const response = await apiService.get<ApiBannersResponse>(
      `${BANNERS_ENDPOINT}?placement=${encodeURIComponent(placement)}`,
    );
    const banners = (response?.data ?? []).map(mapApiBanner);
    writeCache(bannerCache, key, banners);
    return banners;
  } catch {
    return [];
  }
};

export const formatPrice = (value: number, currency = 'INR'): string => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
};
