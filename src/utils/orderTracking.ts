export type TrackingStepKey =
  | 'placed'
  | 'confirmed'
  | 'inTransit'
  | 'outForDelivery'
  | 'delivered';

export type TrackingEvent = {
  status?: string;
  timestamp?: string | number;
};

export type TrackingProgress = {
  currentIndex: number;
  dates: Partial<Record<TrackingStepKey, string>>;
};

export const TRACKING_STEP_KEYS: TrackingStepKey[] = [
  'placed',
  'confirmed',
  'inTransit',
  'outForDelivery',
  'delivered',
];

const normalizeStatus = (status?: string): string =>
  (status ?? '')
    .toLowerCase()
    .replace(/[._\-/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const trackingStepForStatus = (status?: string): TrackingStepKey | null => {
  const text = normalizeStatus(status);
  if (!text) return null;
  if (/cancel|return|refund/.test(text)) return null;
  if (/out for delivery|outfordelivery|\bofd\b/.test(text)) return 'outForDelivery';
  if (/deliver|complete/.test(text)) return 'delivered';
  if (/transit|ship|dispatch/.test(text)) return 'inTransit';
  if (/confirm|accept|process|pack/.test(text)) return 'confirmed';
  if (/place|pending|order/.test(text)) return 'placed';
  return null;
};

export const getTrackingProgress = (events: TrackingEvent[]): TrackingProgress => {
  let currentIndex = -1;
  let latestTime = -Infinity;
  const dates: Partial<Record<TrackingStepKey, string>> = {};

  events.forEach(event => {
    const step = trackingStepForStatus(event.status);
    if (!step) return;

    const parsed =
      event.timestamp === undefined || event.timestamp === null
        ? null
        : new Date(event.timestamp);
    const time = parsed && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : null;
    const index = TRACKING_STEP_KEYS.indexOf(step);

    if (time !== null) {
      if (!dates[step] && parsed) dates[step] = parsed.toISOString();
      if (time >= latestTime) {
        latestTime = time;
        currentIndex = index;
      }
    } else if (currentIndex === -1 && latestTime === -Infinity) {
      currentIndex = index;
    }
  });

  return { currentIndex, dates };
};
