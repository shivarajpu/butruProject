/**
 * Notifications API — the in-app notification feed and the FCM device-token
 * registry.
 *
 *   GET   /api/notifications/customer?page&limit&type
 *   GET   /api/notifications/unread-count
 *   PATCH /api/notifications/customer/{id}/read
 *   PATCH /api/notifications/customer/read-all
 *   POST  /api/notifications/device-token/register
 *   POST /api/notifications/device-token/unregister
 *
 * The contract lives in `docs/api/notifications.openapi.yaml`.
 *
 * ── Why the normalisers are so forgiving ────────────────────────────────────
 * The backend for this feed does not exist yet, so the exact field names it
 * will eventually return are not known. Rather than hard-coding one shape and
 * rendering a broken screen when the server picks a different one, every
 * response is funnelled through `normalizeNotification`, which accepts the
 * handful of plausible spellings for each field and falls back to something
 * sensible. Once the backend is live, the fallbacks simply never fire.
 */

import { apiService } from './apiService';

/** Filter tabs shown above the notification list. */
export type NotificationCategory = 'Orders' | 'Offers' | 'Updates';

/** Which artwork the row shows. */
export type NotificationIconType = 'offer' | 'order' | 'coupon' | 'image' | 'megaphone';

/**
 * The destination encoded in `metadata.screen` by the backend.
 *
 * Each value is paired with the filter keys the destination screen understands:
 *
 *   home           → no filter
 *   cart           → productId
 *   wishlist       → productId
 *   order_details  → orderId, orderNumber
 *   track_shipment → orderId, orderNumber, trackingNumber
 *   add_review     → productId, orderNumber
 *   product_details→ productId, newPrice, oldPrice
 */
export type NotificationScreenName =
  | 'home'
  | 'cart'
  | 'wishlist'
  | 'order_details'
  | 'track_shipment'
  | 'add_review'
  | 'product_details';

export interface NotificationMetadata {
  screen?: NotificationScreenName | string;
  notificationType?: string;
  productId?: string;
  orderId?: string;
  orderNumber?: string;
  trackingNumber?: string;
  newPrice?: number;
  oldPrice?: number;
  imageUrl?: string;
  link?: string;
  cta?: string;
  ctaText?: string;
  ctaUrl?: string;
  [key: string]: unknown;
}

/** A notification, normalised for the UI. */
export interface AppNotification {
  id: string;
  title: string;
  description: string;
  category: NotificationCategory;
  iconType: NotificationIconType;
  imageUri?: string;
  /** In-app path the row opens, e.g. `/orders`. */
  link?: string;
  /** Backend routing hint, e.g. `order_details`. */
  screen?: string;
  /** The raw metadata block, kept so a tap can apply its filters. */
  metadata?: NotificationMetadata;
  isRead: boolean;
  /** Epoch milliseconds. */
  createdAt: number;
  /** Pre-formatted relative time, e.g. `2h ago`. */
  time: string;
}

export interface NotificationPage {
  notifications: AppNotification[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
  pages?: number;
  hasMore?: boolean;
}

export type NotificationListResponse = {
  success?: boolean;
  message?: string;
  /** The live API returns the array directly, with pagination at the root. */
  data?: unknown[] | {
    notifications?: unknown[];
    total?: number;
    page?: number;
    limit?: number;
    unreadCount?: number;
    pages?: number;
  } | null;
  page?: number;
  total?: number;
  unreadCount?: number;
  pages?: number;
};

export type UnreadCountResponse = {
  success?: boolean;
  message?: string;
  data?: { count?: number; unreadCount?: number } | null;
  count?: number;
  unreadCount?: number;
};

export type SuccessResponse = {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown> | null;
};

export type DeviceTokenResponse = {
  success?: boolean;
  message?: string;
  data?: { id?: string; token?: string; platform?: string } | null;
};

export type DevicePlatform = 'ios' | 'android';

export type RegisterDeviceTokenInput = {
  token: string;
  platform: DevicePlatform;
  osVersion?: string;
  appVersion?: string;
};

// ── helpers ────────────────────────────────────────────────────────────────

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/** First non-empty string among `keys`. */
const pickString = (source: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
};

const pickBoolean = (source: Record<string, unknown>, keys: string[]): boolean | undefined => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return undefined;
};

/**
 * Reads the `metadata` block. Push data can only carry strings, so a metadata
 * object may arrive JSON-encoded — parse it instead of dropping the routing
 * information.
 */
const readMetadata = (source: Record<string, unknown>): NotificationMetadata | undefined => {
  const raw = source.metadata;
  if (isRecord(raw)) return raw as NotificationMetadata;
  if (typeof raw === 'string' && raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      if (isRecord(parsed)) return parsed as NotificationMetadata;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

/** Parses an ISO string, epoch seconds or epoch milliseconds into epoch ms. */
export const toEpochMillis = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Anything below ~1e12 is far too small to be epoch milliseconds.
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string' && value.trim()) {
    const raw = value.trim();
    if (/^\d+$/.test(raw)) {
      const numeric = Number(raw);
      return numeric < 1e12 ? numeric * 1000 : numeric;
    }
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
};

// ── categorisation ─────────────────────────────────────────────────────────

const CATEGORY_ALIASES: Record<string, NotificationCategory> = {
  order: 'Orders',
  orders: 'Orders',
  orderupdate: 'Orders',
  orderstatus: 'Orders',
  shipping: 'Orders',
  delivered: 'Orders',
  offer: 'Offers',
  offers: 'Offers',
  promotion: 'Offers',
  promotions: 'Offers',
  sale: 'Offers',
  discount: 'Offers',
  coupon: 'Offers',
  coupons: 'Offers',
  voucher: 'Offers',
  offercoupon: 'Offers',
  update: 'Updates',
  updates: 'Updates',
  newarrival: 'Updates',
  newarrivals: 'Updates',
  collection: 'Updates',
  announcement: 'Updates',
  system: 'Updates',
  alert: 'Updates',
};

const OFFER_ICON_TYPES = new Set(['offer', 'promotion', 'promotions', 'sale', 'discount']);

/**
 * Maps whatever the server calls a notification type onto one of the three
 * list filters. Unknown types land in `Updates`, which is the catch-all tab.
 */
export const normalizeCategory = (raw: unknown): NotificationCategory => {
  if (typeof raw !== 'string') return 'Updates';
  const key = raw.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (!key) return 'Updates';

  const alias = CATEGORY_ALIASES[key];
  if (alias) return alias;

  // The live backend sends dotted types such as `order.placed`, `order.shipped`
  // and `welcome`. Match their prefixes so an order event never falls into the
  // catch-all Updates tab.
  if (
    key.startsWith('order') ||
    key.startsWith('ship') ||
    key.startsWith('deliver') ||
    key.startsWith('track') ||
    key.startsWith('return') ||
    key.startsWith('refund')
  ) {
    return 'Orders';
  }
  if (
    key.startsWith('offer') ||
    key.startsWith('coupon') ||
    key.startsWith('promo') ||
    key.startsWith('discount') ||
    key.startsWith('sale') ||
    key.startsWith('voucher')
  ) {
    return 'Offers';
  }

  return 'Updates';
};

/** Picks the artwork for a row from its type and optional image. */
export const notificationIconType = (
  rawType: unknown,
  imageUri?: string,
): NotificationIconType => {
  const key =
    typeof rawType === 'string' ? rawType.trim().toLowerCase().replace(/[\s_-]+/g, '') : '';

  // Server artwork wins over the generic type icon: order notifications carry
  // a product/shipment image in `metadata.imageUrl`.
  if (imageUri) return 'image';

  if (OFFER_ICON_TYPES.has(key) || key.startsWith('offer') || key.startsWith('promo')) {
    return 'offer';
  }
  if (key === 'coupon' || key === 'voucher' || key.startsWith('coupon')) return 'coupon';
  if (
    key.startsWith('order') ||
    key.startsWith('ship') ||
    key.startsWith('deliver') ||
    key.startsWith('track') ||
    key.startsWith('return') ||
    key.startsWith('refund')
  ) {
    return 'order';
  }
  // A row with artwork shows the artwork; the 'image' type always did.
  if (imageUri) return 'image';
  return 'megaphone';
};

// ── time formatting ────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const startOfDay = (timestamp: number): number => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

/**
 * Relative time for the list rows.
 *
 *   < 1 min   → "Just now"
 *   < 1 hour  → "12m ago"
 *   < 1 day   → "5h ago"
 *   yesterday → "Yesterday"
 *   < 7 days  → "3d ago"
 *   otherwise → "12 Mar" ("12 Mar 2025" when the year differs)
 */
export const formatNotificationTime = (timestamp: number, now: number = Date.now()): string => {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '';

  const diff = now - timestamp;
  if (diff < 0) return 'Just now';

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;

  const today = startOfDay(now);
  const yesterday = today - day;

  if (timestamp >= today) return `${Math.floor(diff / hour)}h ago`;
  if (timestamp >= yesterday) return 'Yesterday';

  const days = Math.floor((today - timestamp) / day);
  if (days < 7) return `${days}d ago`;

  const date = new Date(timestamp);
  const dayLabel = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return date.getFullYear() === new Date(now).getFullYear()
    ? dayLabel
    : `${dayLabel} ${date.getFullYear()}`;
};

// ── normalisation ──────────────────────────────────────────────────────────

/**
 * Turns one raw record from the API into the shape the UI renders.
 * Returns `null` for records without an id — they cannot be keyed or read.
 */
export const normalizeNotification = (raw: unknown, now: number = Date.now()): AppNotification | null => {
  if (!isRecord(raw)) return null;

  const id = pickString(raw, ['id', '_id', 'notificationId', 'uuid']);
  if (!id) return null;

  const metadata = readMetadata(raw);
  const meta = (metadata ?? {}) as Record<string, unknown>;

  const rawType =
    pickString(raw, ['type', 'category', 'notificationType', 'kind']) ??
    pickString(meta, ['notificationType', 'type']);

  const imageUri = pickString(raw, ['image', 'imageUrl', 'image_url', 'media', 'mediaUrl', 'thumbnail']) ??
    pickString(meta, ['imageUrl', 'image', 'image_url']);

  const createdAt =
    toEpochMillis(raw.createdAt ?? raw.created_at ?? raw.sentAt ?? raw.sent_at ?? raw.date ?? raw.timestamp) ??
    now;

  const isRead =
    pickBoolean(raw, ['isRead', 'is_read', 'read', 'seen']) ??
    (pickString(raw, ['status'])?.toLowerCase() === 'read' ? true : false);

  const title = pickString(raw, ['title', 'heading', 'subject']) ?? 'Update';
  const description =
    pickString(raw, ['message', 'body', 'description', 'text', 'content']) ?? '';

  // `metadata.screen` is the routing hint the backend attaches to every event.
  // The top-level `ctaUrl` / `metadata.link` are the fallback for notifications
  // that predate it.
  const screen =
    pickString(meta, ['screen', 'type']) ??
    pickString(raw, ['screen', 'notificationType', 'type']);

  const link =
    pickString(raw, ['link', 'url', 'ctaUrl', 'cta_url', 'actionUrl', 'action_url']) ??
    pickString(meta, ['link', 'ctaUrl', 'cta_url', 'url', 'actionUrl', 'action_url']);

  return {
    id,
    title,
    description,
    category: normalizeCategory(rawType),
    iconType: notificationIconType(rawType, imageUri),
    imageUri,
    link,
    screen,
    metadata,
    isRead,
    createdAt,
    time: formatNotificationTime(createdAt, now),
  };
};

// ── endpoints ──────────────────────────────────────────────────────────────

export const NOTIFICATIONS_ENDPOINT = '/api/notifications';

/** Customer feed endpoint (auth required). */
export const CUSTOMER_NOTIFICATIONS_ENDPOINT = '/api/notifications/customer';

export type NotificationQuery = {
  page?: number;
  limit?: number;
  /** `all` | `orders` | `offers` | `updates`. */
  type?: string;
};

/**
 * Fetches one page of notifications.
 *
 * The server contract is not live yet, so a 404 (endpoint missing) resolves to
 * an empty page rather than throwing — the bell then simply stays empty
 * instead of the whole screen erroring out.
 */
export const fetchNotifications = async (
  query: NotificationQuery = {},
): Promise<NotificationPage> => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (query.type && query.type !== 'all') params.append('type', query.type);

  let response: NotificationListResponse;
  try {
    response = await apiService.get<NotificationListResponse>(
      `${CUSTOMER_NOTIFICATIONS_ENDPOINT}?${params.toString()}`,
    );
  } catch (error) {
    if (isMissingEndpoint(error)) {
      return { notifications: [], total: 0, page, limit, unreadCount: 0 };
    }
    throw error;
  }

  // The live backend returns `data: [...]` with pagination at the root; older
  // mocks/tests use `data: { notifications: [...] }`. Support both.
  const payload = response?.data;
  const envelope = Array.isArray(payload) ? undefined : payload;
  const raw = Array.isArray(payload)
    ? payload
    : Array.isArray(envelope?.notifications)
      ? envelope.notifications
      : [];

  const resolvedTotal = Array.isArray(payload)
    ? response?.total ?? raw.length
    : envelope?.total ?? raw.length;
  const resolvedPage = Array.isArray(payload)
    ? response?.page ?? page
    : envelope?.page ?? page;
  const resolvedLimit = Array.isArray(payload)
    ? limit
    : envelope?.limit ?? limit;
  const resolvedUnread = Array.isArray(payload)
    ? response?.unreadCount ?? 0
    : envelope?.unreadCount ?? 0;
  const resolvedPages = Array.isArray(payload) ? response?.pages : envelope?.pages;

  return {
    notifications: raw
      .map(item => normalizeNotification(item))
      .filter((item): item is AppNotification => item !== null),
    total: resolvedTotal,
    page: resolvedPage,
    limit: resolvedLimit,
    unreadCount: resolvedUnread,
    pages: resolvedPages,
    hasMore: resolvedPages != null ? resolvedPage < resolvedPages : raw.length >= resolvedLimit,
  };
};

/** Reads the unread count that drives the bell badge. */
export const fetchUnreadCount = async (): Promise<number> => {
  try {
    const response = await apiService.get<UnreadCountResponse>(
      `${NOTIFICATIONS_ENDPOINT}/unread-count`,
    );
    return (
      response?.data?.count ??
      response?.data?.unreadCount ??
      response?.count ??
      response?.unreadCount ??
      0
    );
  } catch (error) {
    if (isMissingEndpoint(error)) return 0;
    throw error;
  }
};

/** Marks one notification as read. */
export const markNotificationRead = (id: string) =>
  apiService.update<SuccessResponse>(
    `${CUSTOMER_NOTIFICATIONS_ENDPOINT}/${encodeURIComponent(id)}/read`,
    {},
    undefined,
    'PATCH',
  );

/** Marks every notification as read. */
export const markAllNotificationsRead = () =>
  apiService.update<SuccessResponse>(`${CUSTOMER_NOTIFICATIONS_ENDPOINT}/read-all`, {}, undefined, 'PATCH');

/**
 * Registers an FCM token for the signed-in user.
 *
 * Idempotent server-side, so this is safe to call on every app start.
 */
export const registerDeviceToken = (input: RegisterDeviceTokenInput) =>
  apiService.post<DeviceTokenResponse>(
    `${NOTIFICATIONS_ENDPOINT}/device-token/register`,
    {
      token: input.token,
      platform: input.platform,
      osVersion: input.osVersion,
      appVersion: input.appVersion,
    },
  );

/**
 * Removes an FCM token.
 *
 * POST rather than DELETE because the token travels in the body and the shared
 * `apiService.delete` helper cannot send one.
 */
export const unregisterDeviceToken = (token: string) =>
  apiService.post<SuccessResponse>(`${NOTIFICATIONS_ENDPOINT}/device-token/unregister`, { token });

/**
 * True when the failure means "this endpoint does not exist on the server".
 *
 * `apiService` throws a plain `Error` with the server's message, so the status
 * code is not available. A `404` message is what the API returns for unknown
 * routes; everything else (network down, 500, timeout) is a real failure.
 */
const isMissingEndpoint = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /\b404\b|not found|does not exist/i.test(message);
};
