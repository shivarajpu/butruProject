/**
 * Deep-link parsing for notification destinations.
 *
 * Supports the custom scheme (`butru://orders/track/<id>`) and the storefront
 * URLs used in notification `ctaUrl`s (`https://butru.in/Orders/Track/<id>`).
 * The result is plain notification metadata, so the same router that handles a
 * push tap also handles a URL that opened the app.
 */

const CUSTOM_SCHEME = 'butru';

type DeepLinkData = Record<string, unknown>;

const decode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const readParam = (params: URLSearchParams, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = params.get(key);
    if (value && value.trim()) return value.trim();
  }
  return undefined;
};

const readNumberParam = (params: URLSearchParams, keys: string[]): number | undefined => {
  const raw = readParam(params, keys);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
};

/** Strips the scheme/host and returns the path plus its query string. */
const toPathAndQuery = (url: string): string => {
  const trimmed = url.trim();
  const schemeMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):\/\//i);

  if (!schemeMatch) return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  const scheme = schemeMatch[1].toLowerCase();
  let rest = trimmed.slice(schemeMatch[0].length);

  if (scheme === CUSTOM_SCHEME) {
    // `butru://orders/1` → `/orders/1`; the first segment is a path segment,
    // not a host.
    return rest.startsWith('/') ? rest : `/${rest}`;
  }

  if (scheme === 'http' || scheme === 'https') {
    const slash = rest.indexOf('/');
    return slash >= 0 ? rest.slice(slash) : '/';
  }

  return rest.startsWith('/') ? rest : `/${rest}`;
};

/**
 * Maps a URL to notification metadata (`screen` + filter keys).
 *
 * Returns `null` when the URL carries no usable path. Unknown paths still get
 * a `link` so the caller can fall back to the storefront link resolver.
 */
export const parseDeepLink = (url?: string | null): DeepLinkData | null => {
  if (!url) return null;

  // Only storefront hosts are app links. Other https URLs belong to the
  // browser, so leave them to the caller.
  const webMatch = url.trim().match(/^(https?):\/\/([^/?#]+)/i);
  if (webMatch) {
    const host = webMatch[2].toLowerCase().replace(/:\d+$/, '');
    if (host !== 'butru.in' && host !== 'www.butru.in') return null;
  }

  const pathAndQuery = toPathAndQuery(url);
  if (!pathAndQuery.trim()) return null;

  const queryIndex = pathAndQuery.indexOf('?');
  const path = queryIndex >= 0 ? pathAndQuery.slice(0, queryIndex) : pathAndQuery;
  const query = queryIndex >= 0 ? pathAndQuery.slice(queryIndex + 1) : '';
  const params = new URLSearchParams(query);

  const segments = path
    .split('/')
    .filter(Boolean)
    .map(decode);
  const lower = segments.map(segment => segment.toLowerCase());

  const link = `${path || '/'}${query ? `?${query}` : ''}`;

  const productId = readParam(params, ['productId', 'product_id', 'id']);
  const orderId = readParam(params, ['orderId', 'order_id', 'id']);
  const orderNumber = readParam(params, ['orderNumber', 'order_number']);
  const trackingNumber = readParam(params, [
    'trackingNumber',
    'tracking_number',
    'awb',
    'trackingId',
  ]);
  const newPrice = readNumberParam(params, ['newPrice', 'new_price']);
  const oldPrice = readNumberParam(params, ['oldPrice', 'old_price', 'mrp']);

  if (segments.length === 0) return { screen: 'home' };

  const [first, second, third] = lower;

  // Handle query-only links from various backends
  if (productId && (first === 'product' || first === 'productdetail')) {
    return { screen: 'product_details', productId, newPrice, oldPrice };
  }

  if (first === 'cart' || first === 'bag') {
    return { screen: 'cart', productId: productId || segments[1] };
  }

  if (first === 'wishlist') {
    return { screen: 'wishlist', productId: productId || segments[1] };
  }

  if (first === 'home' || first === 'index') {
    return { screen: 'home' };
  }

  if (first === 'orders' || first === 'order') {
    if (second === 'track' && third) {
      return {
        screen: 'track_shipment',
        orderId: segments[2],
        orderNumber,
        trackingNumber: trackingNumber ?? segments[2],
      };
    }

    if (second && second !== 'track') {
      return {
        screen: 'order_details',
        orderId: segments[1],
        orderNumber,
        productId,
      };
    }

    // Bare `/orders` keeps its existing behaviour (the orders list).
    return { link };
  }

  if (first === 'track' && second) {
    return {
      screen: 'track_shipment',
      orderId: segments[1],
      orderNumber,
      trackingNumber: trackingNumber ?? segments[1],
    };
  }

  if (
    first === 'product' ||
    first === 'products' ||
    first === 'product-details' ||
    first === 'productdetail' ||
    first === 'productdetails' ||
    first === 'productdetailpage'
  ) {
    if (second) {
      return {
        screen: 'product_details',
        productId: segments[1],
        newPrice,
        oldPrice,
      };
    }
    if (productId || orderId) {
      return {
        screen: 'product_details',
        productId: productId || orderId,
        newPrice,
        oldPrice,
      };
    }
  }

  if (first === 'add-review' || first === 'addreview' || first === 'review' || first === 'addreviewdetails') {
    if (second) {
      return {
        screen: 'add_review',
        productId: segments[1],
        orderNumber,
        orderId,
      };
    }
    return {
      screen: 'add_review',
      productId: productId || segments[1],
      orderNumber,
      orderId,
    };
  }

  return { link };
};
