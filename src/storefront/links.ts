/**
 * Link resolution.
 *
 * The API hands out web-style paths (`/Collections?type=Clothing`,
 * `/NEW-ARRIVALS/collection/rSdf9hx9`, `/terms`, `#`). This module turns any of
 * them into a navigation action the app understands, so no screen ever has to
 * string-match a raw link.
 */

import type { StoreConfig } from './types';
import type { PolicyKey } from '../api/policies';

export type WidgetAction =
  | { type: 'none' }
  | { type: 'stack'; screen: string; params?: Record<string, unknown> }
  | { type: 'tab'; screen: 'HomeTab' | 'CategoryTab' | 'WishlistTab' | 'AccountTab'; params?: Record<string, unknown> }
  | { type: 'category'; category: string }
  | { type: 'collection'; collectionId: string };

type PathRoute =
  | string
  | { screen: string; params?: Record<string, unknown> };

const policy = (policyKey: PolicyKey) => ({ screen: 'Policy', params: { policyKey } });

/**
 * Sentinel category meaning "the whole catalogue, no filter".
 *
 * HomeTab owns the constant; it is exported from here so link resolution can
 * produce the same value instead of hardcoding a second copy of the string.
 */
export const SHOP_ALL_CATEGORY = 'Shop';

/** App routes keyed by their normalised (lowercase, no slash) path segment. */
const PATH_ROUTES: Record<string, PathRoute> = {
  cart: 'CartScreen',
  bag: 'CartScreen',
  wishlist: 'WishlistTab',
  orders: 'MyOrders',
  'my-orders': 'MyOrders',
  account: 'AccountTab',
  profile: 'AccountTab',
  contact: 'HelpSupport',
  'help-support': 'HelpSupport',
  login: 'Login',
  signin: 'Login',
  signup: 'SignUp',
  'sign-up': 'SignUp',
  'create-new-account': 'SignUp',
  'payment-methods': 'PaymentMethods',
  notification: 'Notification',
  collections: SHOP_ALL_CATEGORY,
  collection: SHOP_ALL_CATEGORY,
  terms: policy('terms'),
  'terms-and-conditions': policy('terms'),
  privacy: policy('privacy'),
  'privacy-policy': policy('privacy'),
  shipping: policy('shipping'),
  'shipping-policy': policy('shipping'),
  returns: policy('returns'),
  'returns-refunds-exchange': policy('returns'),
  'returns-refunds': policy('returns'),
  about: policy('about'),
  'about-us': policy('about'),
};

const TAB_ROUTES = new Set(['CategoryTab', 'WishlistTab', 'AccountTab']);

/** `new-arrivals` → `New Arrivals` — the casing the API's type filter expects. */
const titleCaseSlug = (slug: string): string =>
  slug
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** `/NEW-ARRIVALS/collection/rSdf9hx9` → `new-arrivals` + collection id. */
const COLLECTION_PATH = /\/collection\/([^/?#]+)/i;
/**
 * Matches the already-normalised path, which has its slashes stripped — so the
 * leading `/` this used to require could never match and the whole bare-slug
 * branch below was dead code (`/clothing` resolved to `none`).
 */
const COLLECTION_HANDLE = /^([a-z0-9-]+)$/i;

export interface ResolveLinkContext {
  config?: StoreConfig | null;
}

const collectionTitleFor = (
  config: StoreConfig | null | undefined,
  idOrHandle: string,
): string => {
  const collections = config?.website?.collections ?? [];
  const needle = idOrHandle.toLowerCase();
  const match = collections.find(
    item =>
      item.id.toLowerCase() === needle ||
      item.handle.toLowerCase() === needle ||
      item.title.toLowerCase().replace(/\s+/g, '-') === needle,
  );
  return match?.title ?? '';
};

/**
 * @param rawLink        Raw `link` / `ctaUrl` / `viewAllUrl` from the API.
 * @param context        Current store config, used to resolve collections.
 * @param fallbackCategory Used when the link points at a collection we can
 *                         only identify by id.
 */
export const resolveLink = (
  rawLink: string | undefined,
  context: ResolveLinkContext = {},
): WidgetAction => {
  const link = (rawLink ?? '').trim();
  if (!link || link === '#' || link === '/') return { type: 'none' };

  // External links are opened by the caller, never pushed onto the stack.
  if (/^(https?:)?\/\//i.test(link) || link.startsWith('tel:') || link.startsWith('mailto:') || link.startsWith('whatsapp:')) {
    return { type: 'none' };
  }

  const [path, query = ''] = link.split('?');
  const params = new URLSearchParams(query);

  const collectionMatch = path.match(COLLECTION_PATH);
  if (collectionMatch) {
    const title = collectionTitleFor(context.config, collectionMatch[1]);
    if (title) return { type: 'category', category: title };
    return { type: 'collection', collectionId: collectionMatch[1] };
  }

  // `?type=Clothing` and friends — the products endpoint filters on this.
  const type = params.get('type') || params.get('category');
  if (type) return { type: 'category', category: type };

  const normalized = path.replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();

  const pathRoute = PATH_ROUTES[normalized];
  // `collections` resolves to the whole-catalogue sentinel, which is a HomeTab
  // filter rather than a screen name.
  if (typeof pathRoute === 'string' && pathRoute === SHOP_ALL_CATEGORY) {
    return { type: 'category', category: SHOP_ALL_CATEGORY };
  }

  if (pathRoute) {
    const route = pathRoute;
    if (typeof route === 'string') {
      return TAB_ROUTES.has(route)
        ? {
            type: 'tab',
            screen: route as 'CategoryTab' | 'WishlistTab' | 'AccountTab',
          }
        : { type: 'stack', screen: route };
    }
    return { type: 'stack', screen: route.screen, params: route.params };
  }

  // `/clothing`, `/new-arrivals` … — bare slugs are treated as collections.
  const handleMatch = normalized.match(COLLECTION_HANDLE);
  if (handleMatch) {
    const title = collectionTitleFor(context.config, handleMatch[1]);
    if (title) return { type: 'category', category: title };
    // Not a configured collection, but the products endpoint filters on the
    // product type (`Clothing`, `Shoes`, `Accessories`) — which is exactly what
    // the banner CTAs point at. Without this the CTA resolves to `none` and
    // the button is dead.
    return { type: 'category', category: titleCaseSlug(handleMatch[1]) };
  }

  return { type: 'none' };
};

export const isExternalLink = (link?: string): boolean =>
  !!link && /^(https?:)?\/\//i.test(link.trim());
