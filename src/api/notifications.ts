/**
 * Notifications API — the in-app notification feed and the FCM device-token
 * registry.
 *
 *   GET  /api/notifications?page&limit&type
 *   GET  /api/notifications/unread-count
 *   POST /api/notifications/{id}/read
 *   POST /api/notifications/read-all
 *   POST /api/notifications/device-token/register
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
}

export type NotificationListResponse = {
  success?: boolean;
  message?: string;
  data?: {
    notifications?: unknown[];
    total?: number;
    page?: number;
    limit?: number;
    unreadCount?: number;
  } | null;
};

export type UnreadCountResponse = {
  success?: boolean;
  message?: string;
  data?: { count?: number } | null;
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
  return CATEGORY_ALIASES[key] ?? 'Updates';
};

/** Picks the artwork for a row from its type and optional image. */
export const notificationIconType = (
  rawType: unknown,
  imageUri?: string,
): NotificationIconType => {
  const key =
    typeof rawType === 'string' ? rawType.trim().toLowerCase().replace(/[\s_-]+/g, '') : '';

  if (OFFER_ICON_TYPES.has(key)) return 'offer';
  if (key === 'coupon' || key === 'voucher') return 'coupon';
  if (key === 'order' || key === 'orders' || key === 'shipping' || key === 'delivered') {
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

  const rawType = pickString(raw, ['type', 'category', 'notificationType', 'kind']);
  const imageUri = pickString(raw, ['image', 'imageUrl', 'image_url', 'media', 'mediaUrl', 'thumbnail']);
  const createdAt =
    toEpochMillis(raw.createdAt ?? raw.created_at ?? raw.sentAt ?? raw.sent_at ?? raw.date ?? raw.timestamp) ??
    now;

  const isRead =
    pickBoolean(raw, ['isRead', 'is_read', 'read', 'seen']) ??
    (pickString(raw, ['status'])?.toLowerCase() === 'read' ? true : false);

  const title = pickString(raw, ['title', 'heading', 'subject']) ?? 'Update';
  const description =
    pickString(raw, ['message', 'body', 'description', 'text', 'content']) ?? '';

  return {
    id,
    title,
    description,
    category: normalizeCategory(rawType),
    iconType: notificationIconType(rawType, imageUri),
    imageUri,
    link: pickString(raw, ['link', 'url', 'ctaUrl', 'cta_url', 'actionUrl', 'action_url']),
    isRead,
    createdAt,
    time: formatNotificationTime(createdAt, now),
  };
};

// ── endpoints ──────────────────────────────────────────────────────────────

export const NOTIFICATIONS_ENDPOINT = '/api/notifications';

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
      `${NOTIFICATIONS_ENDPOINT}?${params.toString()}`,
    );
  } catch (error) {
    if (isMissingEndpoint(error)) {
      return { notifications: [], total: 0, page, limit, unreadCount: 0 };
    }
    throw error;
  }

  const raw = Array.isArray(response?.data?.notifications) ? response.data.notifications : [];

  return {
    notifications: raw
      .map(item => normalizeNotification(item))
      .filter((item): item is AppNotification => item !== null),
    total: response?.data?.total ?? raw.length,
    page: response?.data?.page ?? page,
    limit: response?.data?.limit ?? limit,
    unreadCount: response?.data?.unreadCount ?? 0,
  };
};

/** Reads the unread count that drives the bell badge. */
export const fetchUnreadCount = async (): Promise<number> => {
  try {
    const response = await apiService.get<UnreadCountResponse>(
      `${NOTIFICATIONS_ENDPOINT}/unread-count`,
    );
    return response?.data?.count ?? 0;
  } catch (error) {
    if (isMissingEndpoint(error)) return 0;
    throw error;
  }
};

/** Marks one notification as read. */
export const markNotificationRead = (id: string) =>
  apiService.post<SuccessResponse>(`${NOTIFICATIONS_ENDPOINT}/${encodeURIComponent(id)}/read`, {});

/** Marks every notification as read. */
export const markAllNotificationsRead = () =>
  apiService.post<SuccessResponse>(`${NOTIFICATIONS_ENDPOINT}/read-all`, {});

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
