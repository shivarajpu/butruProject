/**
 * Redux Toolkit — Notification Slice
 *
 * Holds the in-app notification feed plus the unread count that drives the
 * bell badge. The feed is persisted to AsyncStorage so the screen opens with
 * content instead of a spinner (and still shows the last known notifications
 * when the device is offline).
 *
 * ── Filtering happens on the client ─────────────────────────────────────────
 * The list is fetched in full and filtered here, rather than asking the server
 * for `type=offers`. Two reasons: switching tabs is then instant, and the
 * notifications endpoint is not live yet — a server-side filter would leave
 * the filtered tabs empty even though the feed loaded.
 */

import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  normalizeNotification,
  type AppNotification,
  type NotificationCategory,
} from '../../api/notifications';

const STORAGE_KEY = '@butru_notifications';

export type NotificationFilter = 'All' | NotificationCategory;

export interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
  /** A further page is on its way (infinite scroll). */
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  page: number;
  total: number;
  hasMore: boolean;
  activeFilter: NotificationFilter;
  lastFetchedAt: number | null;
  /** Last time a notification was marked read locally (race guard). */
  lastLocalReadAt: number | null;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  status: 'idle',
  loadingMore: false,
  refreshing: false,
  error: null,
  page: 0,
  total: 0,
  hasMore: true,
  activeFilter: 'All',
  lastFetchedAt: null,
  lastLocalReadAt: null,
};

const PAGE_SIZE = 1000;

// ── persistence ────────────────────────────────────────────────────────────

export const loadNotificationState = async (): Promise<Partial<NotificationState>> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<NotificationState>;
    if (!parsed || !Array.isArray(parsed.items)) return {};
    return {
      items: parsed.items,
      unreadCount: parsed.unreadCount ?? 0,
      total: parsed.total ?? parsed.items.length,
      lastFetchedAt: parsed.lastFetchedAt ?? null,
    };
  } catch {
    // Ignore — fall back to an empty feed.
    return {};
  }
};

export const persistNotificationState = async (state: NotificationState) => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items: state.items.slice(0, 50),
        unreadCount: state.unreadCount,
        total: state.total,
        lastFetchedAt: state.lastFetchedAt,
      }),
    );
  } catch {
    // Ignore storage write failures.
  }
};

// ── thunks ─────────────────────────────────────────────────────────────────

export const loadNotifications = createAsyncThunk(
  'notifications/load',
  async (_: { refresh?: boolean } | undefined, { rejectWithValue }) => {
    try {
      const result = await fetchNotifications({ page: 1, limit: PAGE_SIZE });
      return { result, refresh: true };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Could not load notifications.');
    }
  },
);

export const loadMoreNotifications = createAsyncThunk(
  'notifications/loadMore',
  async (_: void, { getState, rejectWithValue }) => {
    const state = getState() as { notifications: NotificationState };
    const nextPage = state.notifications.page + 1;

    try {
      const result = await fetchNotifications({ page: nextPage, limit: PAGE_SIZE });
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Could not load more notifications.');
    }
  },
);

export const loadUnreadCount = createAsyncThunk(
  'notifications/unreadCount',
  async (_, { rejectWithValue }) => {
    const startedAt = Date.now();
    try {
      // Use the full feed (the same page the notification screen loads) rather
      // than `/unread-count`. The badge has to agree with the list the user
      // sees; a smaller page can miss unread items beyond the first page.
      const page = await fetchNotifications({ page: 1, limit: PAGE_SIZE });
      return {
        count: page.unreadCount || page.notifications.filter(item => !item.isRead).length,
        startedAt,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Could not load the unread count.');
    }
  },
);

export const readNotification = createAsyncThunk(
  'notifications/readOne',
  async (id: string, { rejectWithValue }) => {
    try {
      await markNotificationRead(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Could not mark the notification as read.');
    }
  },
);

export const readAllNotifications = createAsyncThunk(
  'notifications/readAll',
  async (_, { rejectWithValue }) => {
    try {
      await markAllNotificationsRead();
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Could not mark all notifications as read.');
    }
  },
);

// ── slice ──────────────────────────────────────────────────────────────────

const countUnread = (items: AppNotification[]): number => items.filter(item => !item.isRead).length;

/**
 * Applies "read" locally, before (or without) the server round trip.
 *
 * The badge and the per-row dot must react on tap even when the read endpoints
 * are slow or missing, so the pending thunks call these directly.
 */
const markOneRead = (state: NotificationState, id: string): void => {
  const target = state.items.find(item => item.id === id);
  if (!target || target.isRead) return;

  target.isRead = true;
  state.unreadCount = Math.max(0, state.unreadCount - 1);
  state.lastLocalReadAt = Date.now();
  persistNotificationState(state);
};

const markEveryRead = (state: NotificationState): void => {
  state.items.forEach(item => {
    item.isRead = true;
  });
  state.unreadCount = 0;
  state.lastLocalReadAt = Date.now();
  persistNotificationState(state);
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<Partial<NotificationState>>) {
      // Hydration is async and can land after a fresh server read (the app
      // restores storage while the token/unread-count requests are in flight).
      // Never let older persisted data overwrite a newer server/badge value.
      const incomingAt = action.payload.lastFetchedAt ?? 0;
      const currentAt = state.lastFetchedAt ?? 0;

      if (incomingAt < currentAt) {
        // A fresh read already ran. Keep its badge/feed, but still restore the
        // offline feed if the only thing fetched so far was the badge count.
        if (state.status === 'idle' && state.items.length === 0) {
          state.items = action.payload.items ?? state.items;
        }
        return;
      }

      state.items = action.payload.items ?? state.items;
      state.unreadCount = action.payload.unreadCount ?? state.unreadCount;
      state.total = action.payload.total ?? state.total;
      state.lastFetchedAt = incomingAt || state.lastFetchedAt;
    },
    setFilter(state, action: PayloadAction<NotificationFilter>) {
      state.activeFilter = action.payload;
    },
    /**
     * A push that arrived while the app is open. Prepended to the feed and
     * counted as unread so the bell badge reacts without a round trip.
     */
    receivePushNotification(state, action: PayloadAction<AppNotification>) {
      const incoming = action.payload;
      // The same push can arrive twice — once as a foreground message and once
      // again from the feed the next time the screen loads. Counting it twice
      // would leave a badge that never goes down.
      const alreadyKnown = state.items.some(item => item.id === incoming.id);

      state.items = [incoming, ...state.items.filter(item => item.id !== incoming.id)];
      if (!alreadyKnown) {
        state.unreadCount += 1;
        state.total += 1;
      }
      state.lastFetchedAt = Date.now();
      persistNotificationState(state);
    },
    clearNotifications(state) {
      state.items = [];
      state.unreadCount = 0;
      state.total = 0;
      state.page = 0;
      state.hasMore = true;
      persistNotificationState(state);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadNotifications.pending, (state, action) => {
        if (action.meta.arg?.refresh) {
          state.refreshing = true;
        } else {
          state.status = 'loading';
        }
        state.error = null;
      })
      .addCase(loadNotifications.fulfilled, (state, action) => {
        const { result } = action.payload;
        state.items = result.notifications;
        state.total = result.total;
        state.page = result.page;
        state.hasMore =
          result.hasMore ??
          (result.notifications.length >= result.limit && result.notifications.length > 0);
        state.unreadCount = result.unreadCount || countUnread(result.notifications);
        state.status = 'ready';
        state.refreshing = false;
        state.error = null;
        state.lastFetchedAt = Date.now();
        persistNotificationState(state);
      })
      .addCase(loadNotifications.rejected, (state, action) => {
        state.status = 'error';
        state.refreshing = false;
        state.error = (action.payload as string) ?? 'Could not load notifications.';
      })
      .addCase(loadMoreNotifications.pending, state => {
        state.loadingMore = true;
      })
      .addCase(loadMoreNotifications.fulfilled, (state, action) => {
        const result = action.payload;
        const known = new Set(state.items.map(item => item.id));
        const incoming = result.notifications.filter(item => !known.has(item.id));
        state.items = [...state.items, ...incoming];
        state.total = result.total;
        state.page = result.page;
        state.loadingMore = false;
        state.hasMore =
          result.hasMore ??
          (result.notifications.length >= result.limit && result.notifications.length > 0);
        persistNotificationState(state);
      })
      .addCase(loadMoreNotifications.rejected, state => {
        state.loadingMore = false;
      })
      .addCase(loadUnreadCount.fulfilled, (state, action) => {
        // A read made after this request started is newer than its payload;
        // applying the stale count would put the badge back up (the read
        // endpoint can commit after the feed was read).
        if (state.lastLocalReadAt != null && state.lastLocalReadAt > action.payload.startedAt) {
          return;
        }
        state.unreadCount = action.payload.count;
        state.lastFetchedAt = Date.now();
      })
      // Optimistic: the tap marks the row read before the request resolves, so
      // navigation never waits on the API and a failing endpoint cannot leave
      // an already-opened notification looking unread.
      .addCase(readNotification.pending, (state, action) => {
        markOneRead(state, action.meta.arg);
      })
      .addCase(readNotification.fulfilled, (state, action) => {
        markOneRead(state, action.payload);
      })
      .addCase(readAllNotifications.pending, markEveryRead)
      .addCase(readAllNotifications.fulfilled, markEveryRead);
  },
});

export const { hydrate, setFilter, receivePushNotification, clearNotifications } =
  notificationSlice.actions;

// ── selectors ──────────────────────────────────────────────────────────────

export const selectNotificationItems = (state: { notifications: NotificationState }): AppNotification[] =>
  state.notifications.items;

export const selectUnreadCount = (state: { notifications: NotificationState }): number =>
  state.notifications.unreadCount;

export const selectVisibleNotifications = (state: {
  notifications: NotificationState;
}): AppNotification[] => {
  const { items, activeFilter } = state.notifications;
  if (activeFilter === 'All') return items;
  return items.filter(item => item.category === activeFilter);
};

/**
 * Builds the notification for a push payload.
 *
 * The server sends data-only messages, so the title/body live in `data`. If a
 * message ever arrives with a `notification` block (a different sender, or a
 * hand-typed test in the Firebase console) those fields are used instead.
 */
export const notificationFromPush = (raw: unknown): AppNotification | null =>
  normalizeNotification(raw);

export default notificationSlice.reducer;
