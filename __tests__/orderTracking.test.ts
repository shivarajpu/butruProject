import {
  getTrackingProgress,
  trackingStepForStatus,
  TRACKING_STEP_KEYS,
} from '../src/utils/orderTracking';

describe('order tracking timeline', () => {
  it('maps dotted notification types and plain statuses to the five steps', () => {
    expect(TRACKING_STEP_KEYS).toEqual([
      'placed',
      'confirmed',
      'inTransit',
      'outForDelivery',
      'delivered',
    ]);
    expect(trackingStepForStatus('order.placed')).toBe('placed');
    expect(trackingStepForStatus('order.confirmed')).toBe('confirmed');
    expect(trackingStepForStatus('order.shipped')).toBe('inTransit');
    expect(trackingStepForStatus('In Transit')).toBe('inTransit');
    expect(trackingStepForStatus('OUT_FOR_DELIVERY')).toBe('outForDelivery');
    expect(trackingStepForStatus('Delivered')).toBe('delivered');
    expect(trackingStepForStatus('order.cancelled')).toBeNull();
    expect(trackingStepForStatus('cart.reminder_1d')).toBeNull();
  });

  it('uses the furthest reported status and keeps one date per step', () => {
    const progress = getTrackingProgress([
      { status: 'order.placed', timestamp: '2026-11-20T13:31:17.432Z' },
      { status: 'order.placed', timestamp: '2026-11-20T13:31:17.435Z' },
      { status: 'order.shipped', timestamp: '2026-11-25T06:33:07.882Z' },
      { status: 'Shipped' },
      { status: 'order.cancelled' },
    ]);

    expect(progress.currentIndex).toBe(2);
    expect(progress.dates.placed).toBe('2026-11-20T13:31:17.432Z');
    expect(progress.dates.inTransit).toBe('2026-11-25T06:33:07.882Z');
    expect(progress.dates.confirmed).toBeUndefined();
  });

  it('prefers out for delivery over delivered when both words appear', () => {
    expect(trackingStepForStatus('out for delivery')).toBe('outForDelivery');
    expect(getTrackingProgress([{ status: 'order.delivered' }]).currentIndex).toBe(4);
  });

  it('uses the latest shipped notification instead of older delivered events', () => {
    const progress = getTrackingProgress([
      { status: 'completed' },
      { status: 'order.delivered', timestamp: '2026-11-20T13:31:17.432Z' },
      { status: 'order.shipped', timestamp: '2026-11-25T06:33:07.882Z' },
    ]);

    expect(progress.currentIndex).toBe(2);
    expect(progress.dates.delivered).toBe('2026-11-20T13:31:17.432Z');
    expect(progress.dates.inTransit).toBe('2026-11-25T06:33:07.882Z');
  });

  it('leaves the timeline empty when nothing was reported', () => {
    expect(getTrackingProgress([])).toEqual({ currentIndex: -1, dates: {} });
  });
});
