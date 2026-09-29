/**
 * Storefront API types — `GET /api/storefront/store?slug=<slug>`
 *
 * SCOPE: this file intentionally models only the fields that the MOBILE APP
 * consumes. Web-only payloads (seo.*, googleAnalyticsId, webConfig.flags,
 * exitIntent, swipeUp, loader, coverMobile/coverDesktop, checkout meta) are
 * dropped here so nobody accidentally wires them into a screen.
 *
 * Everything the app renders is either a value here, or a widget `type` string
 * that the widget registry (src/widgets/registry.tsx) maps to a component.
 */

// ─── Pages ─────────────────────────────────────────────────────────────────────

export type PageType = 'home' | 'product' | 'oos' | 'orderStatus' | 'collection';

// ─── Widgets ───────────────────────────────────────────────────────────────────

export type WidgetType =
  // home
  | 'banner_cross_link'
  | 'hero_cards'
  | 'product_group'
  | 'deal_of_the_day'
  | 'girls_boys_fashion'
  | 'offer_cards'
  | 'party_poster'
  | 'fashion_section'
  | 'product_testimonial'
  | 'newsletter'
  // product / out-of-stock
  | 'product_media'
  | 'product_title'
  | 'product_size_picker'
  | 'product_colour_picker'
  | 'wa_reply_and_bag';

export type WidgetLayout = 'grid' | 'carousel' | 'infinite' | 'multiple' | '-' | '';

export type GalleryItem = {
  type: 'image' | 'text';
  src?: string;
  text?: string;
  hasStars?: boolean;
  bg?: string;
};

/**
 * Widget `config` is a free-form bag on the backend — one shared shape with
 * every known key optional. The index signature keeps unknown keys readable
 * without forcing `any` at the call site.
 */
export interface WidgetConfig {
  // shared
  showTitle?: boolean;
  heading?: string;
  subheading?: string;
  /**
   * Heading used instead of `heading` when a feed has to fall back to another
   * source (e.g. no product is flagged as a deal of the day).
   */
  fallbackHeading?: string;
  ctaText?: string;
  ctaUrl?: string;
  limit?: number;
  viewAllUrl?: string;
  pageId?: string;
  collectionId?: string;
  source?: ProductGroupSource | 'banners' | 'support_strip';
  layout?: string;
  layoutStyle?: string;
  zoomEnabled?: boolean;

  // banner
  bannerPlacement?: string;
  titleAlignment?: 'left' | 'center' | 'right';
  fitImage?: boolean;
  backgroundImage?: string;
  repeatBackground?: boolean;
  spacingDesktop?: string | number;
  spacingMobile?: string | number;
  templates?: unknown[];

  // pickers
  label?: string;
  required?: boolean;

  // out-of-stock
  whatsappNumber?: string;
  showBagLink?: boolean;

  // newsletter
  placeholder?: string;
  backgroundImagePath?: string;

  // support strip / testimonials
  phone?: string;
  phoneHref?: string;
  email?: string;
  helpLabel?: string;
  helpTitle?: string;
  helpPrefix?: string;
  supportLabel?: string;
  supportTitle?: string;
  supportPrefix?: string;
  downloadLabel?: string;
  downloadTitle?: string;
  connectLabel?: string;
  connectTitle?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  telegramUrl?: string;
  pinterestUrl?: string;

  // fashion section
  headingLine2?: string;
  body?: string;
  backgroundColor?: string;
  galleryRow1?: GalleryItem[];
  galleryRow2?: GalleryItem[];

  // product title
  showSku?: boolean;
  showRating?: boolean;

  [key: string]: unknown;
}

export interface StoreWidget {
  id: string;
  pageType: PageType;
  section: string;
  title: string;
  type: WidgetType;
  layout: WidgetLayout;
  visibility: 'live' | 'hidden' | string;
  automated: boolean;
  order: number;
  config: WidgetConfig;
}

/** Sources understood by the product_group widget. */
export type ProductGroupSource =
  | 'all'
  | 'new_arrivals'
  | 'popular'
  | 'best_and_new'
  | 'collection'
  | 'deal_of_the_day';

// ─── Navigation & Collections ──────────────────────────────────────────────────

export interface NavChild {
  id: string;
  title: string;
  link: string;
  collectionId: string;
  children?: NavChild[];
}

export interface NavItem {
  id: string;
  title: string;
  link: string;
  collectionId: string;
  automated: boolean;
  deleted: boolean;
  children: NavChild[];
}

export interface StoreCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  visibility: 'live' | 'hidden' | string;
}

// ─── Product page templates ────────────────────────────────────────────────────

export interface ProductPageTemplate {
  id: string;
  pageType: PageType;
  title: string;
  taggedCategory: string;
  slug: string;
  description: string;
  visibility: 'live' | 'hidden' | string;
  isDefault: boolean;
}

// ─── Checkout ──────────────────────────────────────────────────────────────────

export interface CheckoutFlow {
  id: string;
  title: string;
  type: string;
  visibility: 'live' | 'hidden' | string;
  config: {
    paymentPreference?: 'online_first' | 'cod_first' | string;
    emphasizeCod?: boolean;
    showOnlinePay?: boolean;
    defaultMethod?: 'COD' | 'ONLINE' | string;
  };
}

export interface PartialCodConfig {
  prepaidPercent: number;
  minOrderValue: number;
  label: string;
  note: string;
}

export interface PaymentConfig {
  alternateContact: boolean;
  landmark: boolean;
  defaultMethod: 'COD' | 'ONLINE' | string;
  gstCheckout: boolean;
  gstOrderDetails: boolean;
  nudgeOnline: boolean;
  modes: {
    COD: boolean;
    Online: boolean;
    'Partial COD': boolean;
  };
  printCancel: string;
  packCancel: string;
  handoverCancel: string;
  rtoCancel: string;
  partialCod: PartialCodConfig;
  /** Rule buckets are always present but may be empty — nothing to render. */
  rules: {
    product: unknown[];
    orderValue: unknown[];
    pincode: unknown[];
    state: unknown[];
  };
}

// ─── Announcement ──────────────────────────────────────────────────────────────

export interface AnnouncementBar {
  enabled: boolean;
  text: string;
  link: string;
  imageUrl: string;
  backgroundColor: string;
  textColor: string;
}

// ─── Testimonials ──────────────────────────────────────────────────────────────

export interface StoreTestimonial {
  id: string;
  name: string;
  quote: string;
  review: string;
  rating: number;
  productCode: string;
  city: string;
  reviewDate: string;
  category: string;
  productImages: string[];
  profilePicture: string;
  visibility: 'live' | 'hidden' | string;
}

// ─── Reviews ───────────────────────────────────────────────────────────────────

export interface ReviewsConfig {
  enabled: boolean;
  autoPublish: boolean;
  minStarsToShow: number;
  showOnProductPage: boolean;
  displayType: string;
  showOnlyRatingHideReview: boolean;
  showReviewOnlyFor3Plus: boolean;
}

// ─── Customisation ─────────────────────────────────────────────────────────────

export interface CustomisationFlow {
  sizeEnabled: boolean;
  colourEnabled: boolean;
  showWhatsappBag: boolean;
}

// ─── Footer / Support ──────────────────────────────────────────────────────────

export interface FooterLink {
  name: string;
  link: string;
}

export interface FooterConfig {
  shopTitle: string;
  accountTitle: string;
  aboutTitle: string;
  paymentTitle: string;
  addressTitle: string;
  copyright: string;
  tagline: string;
  addressLines: string[];
  accountLinks: FooterLink[];
  aboutLinks: FooterLink[];
}

export interface SupportHours {
  startDay: string;
  endDay: string;
  startTime: string;
  endTime: string;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  telegram?: string;
  pinterest?: string;
  twitter?: string;
  linkedin?: string;
}

export interface DeliveryRange {
  min: number;
  max: number;
  enabled: boolean;
}

export interface WhatsappConnect {
  title: string;
  subtitle: string;
  cta: string;
  productPage: boolean;
  orderIssue: boolean;
  postDelivery: boolean;
}

export interface ContactUsToggles {
  call: boolean;
  whatsapp: boolean;
  supportTime: boolean;
  email: boolean;
  address: boolean;
}

export interface WebConfig {
  websiteName: string;
  logoUrl: string;
  faviconUrl: string;
  productCardLayout: 'portrait' | 'square' | string;
  fitToContainer: 'contain' | 'cover' | string;
  headerLogoType: 'image' | 'text' | string;
  headerLogoSize: 'small' | 'medium' | 'large' | string;
  addToBag: string;
  cancelOrderVariant: 'hidden' | 'simple' | 'detailed' | string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  telegramUrl: string;
  pinterestUrl: string;
  supportPhone: string;
  supportPhoneCountry: string;
  whatsappNumber: string;
  whatsappCountry: string;
  supportTime: string;
  supportHours: SupportHours;
  payment: PaymentConfig;
  whatsappConnect: WhatsappConnect;
  trustMarkers: string[];
  deliveryDate: {
    customisable: DeliveryRange;
    nonCustomisable: DeliveryRange;
  };
  contactUs: ContactUsToggles;
  appAnnouncement: {
    sticky: boolean;
    onAnnouncement: boolean;
  };
  footer: FooterConfig;
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export interface StoreThemeFonts {
  family: string;
  weight: string;
}

export interface StoreTheme {
  preset: string;
  saleEventVisible: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  headerStyle: 'solid' | 'transparent' | string;
  fonts: {
    title1?: StoreThemeFonts;
    title2?: StoreThemeFonts;
    title3?: StoreThemeFonts;
    heading?: StoreThemeFonts;
    body?: StoreThemeFonts;
  };
}

export interface ActiveFeatures {
  codEnabled: boolean;
  prepaidEnabled: boolean;
  guestCheckout: boolean;
  returnsEnabled: boolean;
}

export interface ReturnPolicy {
  returnsEnabled: boolean;
  returnWindowDays: number;
  exchangesEnabled: boolean;
}

export interface Website {
  widgets: StoreWidget[];
  productPages: ProductPageTemplate[];
  checkoutFlows: CheckoutFlow[];
  announcementBar: AnnouncementBar;
  /** Multi-bar list supersedes the single `announcementBar` when non-empty. */
  announcementBars: AnnouncementBar[];
  testimonials: StoreTestimonial[];
  navigation: NavItem[];
  collections: StoreCollection[];
  reviews: ReviewsConfig;
  customisationFlow: CustomisationFlow;
  selectedCheckoutFlowId: string;
  webConfig: WebConfig;
}

export interface StoreConfig {
  storeId: string;
  slug: string;
  storeName: string;
  logo: string;
  favicon: string;
  currency: string;
  timezone: string;
  description: string;
  contactEmail: string;
  business: {
    email: string;
    phone: string;
  };
  socialLinks: SocialLinks;
  theme: StoreTheme;
  returnPolicy: ReturnPolicy;
  activeFeatures: ActiveFeatures;
  website: Website;
}

export interface StoreConfigResponse {
  success: boolean;
  data: StoreConfig;
}
