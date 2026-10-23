/**
 * The in-app notification feed — the API normalisers and the Redux slice.
 *
 * The backend for this feed does not exist yet, so the normalisers have to be
 * forgiving about field names while still being strict about the two things
 * that matter: a record without an id cannot be rendered, and a record the
 * server calls "shipping" has to land in the Orders tab rather than in the
 * catch-all.
 *
 * The slice tests cover the badge: a push that arrives while the app is open
 * has to raise the unread count immediately, without a round trip.
 */

const mockGet = jest.fn<Promise<unknown>, [string]>();
const mockPost = jest.fn<Promise<unknown>, [string, unknown]>();

jest.mock('../src/api/apiService', () => ({
  apiService: {
    get: (endpoint: string) => mockGet(endpoint),
    post: (endpoint: string, body: unknown) => mockPost(endpoint, body),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

import {
  fetchNotifications,
  fetchUnreadCount,
  formatNotificationTime,
  normalizeCategory,
  normalizeNotification,
} from '../src/api/notifications';
import reducer, {
  hydrate,
  readAllNotifications,
  readNotification,
  receivePushNotification,
  setFilter,
  clearNotifications,
  type NotificationState,
} from '../src/store/slices/notificationSlice';

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
});

describe('normalizeCategory', () => {
  it('maps the server spellings onto the three tabs', () => {
    expect(normalizeCategory('order')).toBe('Orders');
    expect(normalizeCategory('Shipping')).toBe('Orders');
    expect(normalizeCategory('offer')).toBe('Offers');
    expect(normalizeCategory('coupon')).toBe('Offers');
    expect(normalizeCategory('new-arrivals')).toBe('Updates');
  });

  it('falls back to Updates for anything unknown', () => {
    expect(normalizeCategory('something-new')).toBe('Updates');
    expect(normalizeCategory(undefined)).toBe('Updates');
    expect(normalizeCategory(42)).toBe('Updates');
  });
});

describe('normalizeNotification', () => {
  it('reads the fields the API is expected to send', () => {
    const item = normalizeNotification({
      id: 'n1',
      type: 'offer',
      title: '50% off',
      message: 'This weekend only',
      image: 'https://cdn.example.com/offer.png',
      link: '/collections',
      isRead: false,
      createdAt: '2026-01-02T03:04:05.000Z',
    });

    expect(item?.id).toBe('n1');
    expect(item?.title).toBe('50% off');
    expect(item?.description).toBe('This weekend only');
    expect(item?.category).toBe('Offers');
    expect(item?.imageUri).toBe('https://cdn.example.com/offer.png');
    expect(item?.link).toBe('/collections');
    expect(item?.isRead).toBe(false);
    expect(item?.createdAt).toBe(Date.parse('2026-01-02T03:04:05.000Z'));
  });

  it('accepts the alternative spellings the backend might use', () => {
    const item = normalizeNotification({
      _id: 'n2',
      notificationType: 'shipping',
      heading: 'On its way',
      body: 'Left the warehouse',
      read: true,
      created_at: 1_700_000_000,
    });

    expect(item?.id).toBe('n2');
    expect(item?.title).toBe('On its way');
    expect(item?.description).toBe('Left the warehouse');
    expect(item?.category).toBe('Orders');
    expect(item?.isRead).toBe(true);
    expect(item?.createdAt).toBe(1_700_000_000_000);
  });

  it('reads the live metadata block used for routing', () => {
    const item = normalizeNotification({
      _id: 'n3',
      type: 'order.placed',
      title: 'Order confirmed',
      message: 'Thanks for shopping',
      ctaUrl: '/Orders/Track/6adaf66f178102698701001d',
      metadata: {
        screen: 'order_details',
        orderId: '6adaf66f178102698701001d',
        orderNumber: 'ORD-831317-755776',
        productId: 'product-1',
        newPrice: 499,
        oldPrice: 799,
        imageUrl: 'https://cdn.example.com/order.png',
      },
      isRead: false,
      createdAt: '2026-10-23T05:53:56.899Z',
    });

    expect(item?.category).toBe('Orders');
    expect(item?.screen).toBe('order_details');
    expect(item?.link).toBe('/Orders/Track/6adaf66f178102698701001d');
    expect(item?.imageUri).toBe('https://cdn.example.com/order.png');
    expect(item?.metadata).toEqual(
      expect.objectContaining({
        screen: 'order_details',
        orderId: '6adaf66f178102698701001d',
        orderNumber: 'ORD-831317-755776',
        productId: 'product-1',
        newPrice: 499,
        oldPrice: 799,
      }),
    );
  });

  it('drops a record with no id, because it cannot be keyed or marked read', () => {
    expect(normalizeNotification({ title: 'No id here' })).toBeNull();
    expect(normalizeNotification(null)).toBeNull();
    expect(normalizeNotification('nope')).toBeNull();
  });
});

describe('formatNotificationTime', () => {
  const now = Date.parse('2026-01-02T12:00:00.000Z');

  it('describes the recent past in relative terms', () => {
    expect(formatNotificationTime(now - 30_000, now)).toBe('Just now');
    expect(formatNotificationTime(now - 12 * 60_000, now)).toBe('12m ago');
    expect(formatNotificationTime(now - 5 * 3_600_000, now)).toBe('5h ago');
  });

  it('falls back to a date once the timestamp is old', () => {
    const old = Date.parse('2025-11-20T12:00:00.000Z');
    expect(formatNotificationTime(old, now)).toContain('Nov');
  });
});

describe('fetchNotifications', () => {
  it('normalises the page the API returns', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: {
        notifications: [{ id: 'n1', type: 'offer', title: 'Hi' }],
        total: 1,
        page: 1,
        limit: 20,
        unreadCount: 1,
      },
    });

    const page = await fetchNotifications({ page: 1, limit: 20 });

    expect(mockGet).toHaveBeenCalledWith('/api/notifications/customer?page=1&limit=20');
    expect(page.notifications).toHaveLength(1);
    expect(page.notifications[0].title).toBe('Hi');
    expect(page.unreadCount).toBe(1);
  });

  it('reads the live root-array response with its pagination fields', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: [
        {
          _id: 'n1',
          type: 'welcome',
          title: 'Welcome Aboard!',
          message: 'Start shopping',
          metadata: { screen: 'home', notificationType: 'welcome' },
          isRead: false,
          createdAt: '2026-10-23T05:51:46.322Z',
        },
      ],
      page: 1,
      total: 2,
      unreadCount: 2,
      pages: 1,
    });

    const page = await fetchNotifications({ page: 1, limit: 20 });

    expect(page.notifications).toHaveLength(1);
    expect(page.notifications[0].screen).toBe('home');
    expect(page.total).toBe(2);
    expect(page.unreadCount).toBe(2);
    expect(page.pages).toBe(1);
    expect(page.hasMore).toBe(false);
  });

  it('gives an empty page when the endpoint does not exist yet', async () => {
    mockGet.mockRejectedValue(new Error('Not Found - /api/notifications'));

    const page = await fetchNotifications();

    expect(page.notifications).toEqual([]);
    expect(page.total).toBe(0);
  });

  it('still fails loudly on a real error', async () => {
    mockGet.mockRejectedValue(new Error('Network request failed'));

    await expect(fetchNotifications()).rejects.toThrow('Network request failed');
  });
});

describe('fetchUnreadCount', () => {
  it('reads the count', async () => {
    mockGet.mockResolvedValue({ success: true, data: { count: 4 } });

    await expect(fetchUnreadCount()).resolves.toBe(4);
  });

  it('gives zero when the endpoint does not exist yet', async () => {
    mockGet.mockRejectedValue(new Error('404 Not Found'));

    await expect(fetchUnreadCount()).resolves.toBe(0);
  });
});

describe('notification slice', () => {
  const empty = (): NotificationState => reducer(undefined, { type: '@@init' });

  it('raises the badge the moment a push arrives', () => {
    const state = reducer(
      empty(),
      receivePushNotification({
        id: 'push_1',
        title: 'Order shipped',
        description: 'On its way',
        category: 'Orders',
        iconType: 'order',
        isRead: false,
        createdAt: 1_700_000_000_000,
        time: '2h ago',
      }),
    );

    expect(state.items).toHaveLength(1);
    expect(state.unreadCount).toBe(1);
  });

  it('marks a notification read as soon as it is opened', () => {
    let state = reducer(
      empty(),
      receivePushNotification({
        id: 'push_1',
        title: 'Order shipped',
        description: 'On its way',
        category: 'Orders',
        iconType: 'order',
        isRead: false,
        createdAt: 1,
        time: '',
      }),
    );

    state = reducer(state, readNotification.pending('request-1', 'push_1'));

    expect(state.items[0].isRead).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it('marks everything read as soon as the button is pressed', () => {
    let state = reducer(
      empty(),
      receivePushNotification({
        id: 'push_1',
        title: 'A',
        description: '',
        category: 'Updates',
        iconType: 'megaphone',
        isRead: false,
        createdAt: 1,
        time: '',
      }),
    );

    state = reducer(state, readAllNotifications.pending('request-2'));

    expect(state.items.every(item => item.isRead)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it('does not count the same push twice', () => {
    const push = {
      id: 'push_1',
      title: 'Order shipped',
      description: 'On its way',
      category: 'Orders' as const,
      iconType: 'order' as const,
      isRead: false,
      createdAt: 1_700_000_000_000,
      time: '2h ago',
    };

    let state = reducer(empty(), receivePushNotification(push));
    state = reducer(state, receivePushNotification(push));

    expect(state.items).toHaveLength(1);
    expect(state.unreadCount).toBe(1);
  });

  it('clears the badge when everything is marked read', () => {
    let state = reducer(
      empty(),
      receivePushNotification({
        id: 'push_1',
        title: 'A',
        description: '',
        category: 'Updates',
        iconType: 'megaphone',
        isRead: false,
        createdAt: 1,
        time: '',
      }),
    );

    state = { ...state, items: state.items.map(item => ({ ...item, isRead: true })), unreadCount: 0 };

    expect(state.unreadCount).toBe(0);
  });

  it('keeps the persisted feed when the app reopens', () => {
    const state = reducer(
      empty(),
      hydrate({
        items: [
          {
            id: 'n1',
            title: 'Saved',
            description: '',
            category: 'Updates',
            iconType: 'megaphone',
            isRead: false,
            createdAt: 1,
            time: '',
          },
        ],
        unreadCount: 3,
        total: 1,
      }),
    );

    expect(state.items).toHaveLength(1);
    expect(state.unreadCount).toBe(3);
  });

  it('filters on the client, so the tabs work without the server', () => {
    let state = reducer(
      empty(),
      receivePushNotification({
        id: 'push_1',
        title: 'Order shipped',
        description: '',
        category: 'Orders',
        iconType: 'order',
        isRead: false,
        createdAt: 1,
        time: '',
      }),
    );

    state = reducer(state, setFilter('Offers'));

    expect(state.activeFilter).toBe('Offers');
  });

  it('empties the feed on demand', () => {
    let state = reducer(
      empty(),
      receivePushNotification({
        id: 'push_1',
        title: 'A',
        description: '',
        category: 'Updates',
        iconType: 'megaphone',
        isRead: false,
        createdAt: 1,
        time: '',
      }),
    );

    state = reducer(state, clearNotifications());

    expect(state.items).toEqual([]);
    expect(state.unreadCount).toBe(0);
  });
});
