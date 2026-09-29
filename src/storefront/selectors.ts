/**
 * Storefront selectors.
 *
 * Every screen reads the tenant config through here, never by touching
 * `state.storefront.config` directly, so a missing/partial payload always
 * degrades to a sane default instead of crashing.
 *
 * Web-only concerns (seo, exit intent, swipe-up intro, scroll flags) are
 * deliberately absent from this file.
 */

import type { RootState } from '../store';
import type {
  AnnouncementBar,
  CheckoutFlow,
  NavItem,
  ProductGroupSource,
  ReviewsConfig,
  StoreCollection,
  StoreConfig,
  StoreTestimonial,
  StoreWidget,
  PageType,
  WebConfig,
} from './types';

const EMPTY: StoreConfig | null = null;

export const selectStoreConfig = (state: RootState): StoreConfig | null =>
  state.storefront?.config ?? EMPTY;

export const selectStorefrontStatus = (state: RootState) =>
  state.storefront?.status ?? 'idle';

export const selectStorefrontReady = (state: RootState): boolean =>
  (state.storefront?.status ?? 'idle') === 'ready';

export const selectStorefrontRefreshing = (state: RootState): boolean =>
  state.storefront?.refreshing ?? false;

// ─── Identity ──────────────────────────────────────────────────────────────────

export const selectStoreName = (state: RootState): string =>
  state.storefront?.config?.storeName ?? '';

export const selectCurrency = (state: RootState): string =>
  state.storefront?.config?.currency ?? 'INR';

// ─── Feature flags ─────────────────────────────────────────────────────────────

const ALL_OFF = {
  codEnabled: false,
  prepaidEnabled: false,
  guestCheckout: false,
  returnsEnabled: false,
  sizeEnabled: false,
  colourEnabled: false,
  showWhatsappBag: false,
  dealsEnabled: false,
  reviewsEnabled: false,
  reviewsOnProductPage: false,
  minStarsToShow: 0,
  trustMarkers: [] as string[],
  deliveryMinDays: 0,
  deliveryMaxDays: 0,
  returnWindowDays: 0,
  exchangesEnabled: false,
};

export const selectFeatures = (state: RootState) => {
  const config = selectStoreConfig(state);
  if (!config) return ALL_OFF;

  const active = config.activeFeatures ?? ({} as StoreConfig['activeFeatures']);
  const customisation = config.website?.customisationFlow;
  const reviews: ReviewsConfig | undefined = config.website?.reviews;
  const webConfig: WebConfig | undefined = config.website?.webConfig;
  const delivery = webConfig?.deliveryDate?.customisable;

  return {
    codEnabled: active.codEnabled === true,
    prepaidEnabled: active.prepaidEnabled === true,
    guestCheckout: active.guestCheckout === true,
    returnsEnabled:
      active.returnsEnabled === true && config.returnPolicy?.returnsEnabled === true,
    sizeEnabled: customisation?.sizeEnabled === true,
    colourEnabled: customisation?.colourEnabled === true,
    showWhatsappBag: customisation?.showWhatsappBag === true,
    dealsEnabled: config.theme?.saleEventVisible === true,
    reviewsEnabled: reviews?.enabled === true,
    reviewsOnProductPage: reviews?.showOnProductPage === true,
    minStarsToShow: reviews?.minStarsToShow ?? 0,
    trustMarkers: webConfig?.trustMarkers ?? [],
    deliveryMinDays: delivery?.min ?? 0,
    deliveryMaxDays: delivery?.max ?? 0,
    returnWindowDays: config.returnPolicy?.returnWindowDays ?? 0,
    exchangesEnabled: config.returnPolicy?.exchangesEnabled === true,
  };
};

export type StoreFeatures = ReturnType<typeof selectFeatures>;

// ─── Widgets ───────────────────────────────────────────────────────────────────

/** Live widgets for a page, sorted by the server-provided `order`. */
export const selectWidgets = (
  state: RootState,
  pageType: PageType,
): StoreWidget[] => {
  const widgets = selectStoreConfig(state)?.website?.widgets ?? [];
  return widgets
    .filter(widget => widget.pageType === pageType && widget.visibility === 'live')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

/** Same as `selectWidgets` but for a single page instance (React hook friendly). */
export const getPageWidgets = (
  config: StoreConfig | null,
  pageType: PageType,
): StoreWidget[] =>
  (config?.website?.widgets ?? [])
    .filter(widget => widget.pageType === pageType && widget.visibility === 'live')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const getWidgetByType = (
  config: StoreConfig | null,
  pageType: PageType,
  type: StoreWidget['type'],
): StoreWidget | undefined =>
  getPageWidgets(config, pageType).find(widget => widget.type === type);

// ─── Navigation ────────────────────────────────────────────────────────────────

export const selectNavigation = (state: RootState): NavItem[] => {
  const items = selectStoreConfig(state)?.website?.navigation ?? [];
  return items.filter(item => item.deleted !== true);
};

export const selectCollections = (state: RootState): StoreCollection[] => {
  const collections = selectStoreConfig(state)?.website?.collections ?? [];
  return collections.filter(item => item.visibility === 'live');
};

// ─── Announcement ──────────────────────────────────────────────────────────────

/**
 * Prefers the multi-bar list; falls back to the single `announcementBar`.
 * Disabled or text-less entries are dropped.
 */
export const selectAnnouncementBars = (state: RootState): AnnouncementBar[] => {
  const website = selectStoreConfig(state)?.website;
  if (!website) return [];

  const many = (website.announcementBars ?? []).filter(
    bar => bar.enabled !== false && (bar.text?.trim() || bar.imageUrl?.trim()),
  );
  if (many.length) return many;

  const single = website.announcementBar;
  if (single?.enabled && (single.text?.trim() || single.imageUrl?.trim())) {
    return [single];
  }
  return [];
};

// ─── Content blocks ────────────────────────────────────────────────────────────

export const selectTestimonials = (state: RootState): StoreTestimonial[] => {
  const items = selectStoreConfig(state)?.website?.testimonials ?? [];
  return items.filter(item => item.visibility === 'live');
};

export const selectWebConfig = (state: RootState): WebConfig | undefined =>
  selectStoreConfig(state)?.website?.webConfig;

export const selectSocialLinks = (state: RootState) => {
  const config = selectStoreConfig(state);
  const web = config?.website?.webConfig;
  return {
    instagram: web?.instagramUrl || config?.socialLinks?.instagram || '',
    facebook: web?.facebookUrl || config?.socialLinks?.facebook || '',
    youtube: web?.youtubeUrl || config?.socialLinks?.youtube || '',
    telegram: web?.telegramUrl || config?.socialLinks?.telegram || '',
    pinterest: web?.pinterestUrl || config?.socialLinks?.pinterest || '',
  };
};

export const selectSupportContact = (state: RootState) => {
  const config = selectStoreConfig(state);
  const web = config?.website?.webConfig;
  const phone = web?.whatsappNumber
    ? `${web.whatsappCountry ?? '+91'}${web.whatsappNumber}`
    : config?.business?.phone ?? '';

  return {
    phone: web?.supportPhone ?? config?.business?.phone ?? '',
    whatsapp: phone,
    email: config?.contactEmail || config?.business?.email || '',
    addressLines: web?.footer?.addressLines ?? [],
    supportTime: web?.supportTime ?? '',
    supportHours: web?.supportHours,
    show: web?.contactUs,
  };
};

// ─── Checkout ──────────────────────────────────────────────────────────────────

export const selectCheckoutFlow = (state: RootState): CheckoutFlow | undefined => {
  const website = selectStoreConfig(state)?.website;
  if (!website) return undefined;
  return (website.checkoutFlows ?? []).find(
    flow => flow.id === website.selectedCheckoutFlowId,
  );
};

export const selectPayment = (state: RootState) => {
  const web = selectWebConfig(state);
  const flow = selectCheckoutFlow(state);
  const payment = web?.payment;

  return {
    ...(payment ?? ({} as WebConfig['payment'])),
    /** The selected flow can override the default method. */
    defaultMethod: flow?.config?.defaultMethod ?? payment?.defaultMethod ?? 'COD',
    emphasizeCod: flow?.config?.emphasizeCod ?? false,
    showOnlinePay: flow?.config?.showOnlinePay ?? payment?.modes?.Online ?? false,
  };
};

// ─── Product page template ─────────────────────────────────────────────────────

/** Default template, or the one tagged for a category, whichever applies. */
export const selectProductTemplate = (
  state: RootState,
  category = '',
): { slug: string; title: string } | null => {
  const templates = selectStoreConfig(state)?.website?.productPages ?? [];
  const live = templates.filter(item => item.visibility === 'live');
  if (!live.length) return null;

  const tagged = category
    ? live.find(
        item => item.taggedCategory && item.taggedCategory.toLowerCase() === category.toLowerCase(),
      )
    : undefined;

  const chosen = tagged ?? live.find(item => item.isDefault) ?? live[0];
  return { slug: chosen.slug, title: chosen.title };
};

// ─── Helpers used by widgets ───────────────────────────────────────────────────

export const resolveProductSource = (widget: StoreWidget): ProductGroupSource => {
  const source = widget.config?.source;
  if (
    source === 'all' ||
    source === 'new_arrivals' ||
    source === 'popular' ||
    source === 'best_and_new' ||
    source === 'deal_of_the_day'
  ) {
    return source;
  }
  if (source === 'collection' || widget.config?.collectionId) return 'collection';
  return 'all';
};
