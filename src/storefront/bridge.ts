/**
 * Storefront → AppConfig bridge.
 *
 * Turns the server response into the exact `AppConfig` shape the existing
 * theme system already consumes, so the whole app re-skins (colours, fonts,
 * name, logo, support details) from one pure function — no rebuild needed.
 *
 * Anything the API does not provide falls back to the values compiled into
 * `app_config.ts`, which keeps the app fully usable on a partial payload.
 */

import { FONTS, INSTALLED_FONT_NAMES } from '../constants/fonts';
import type { AppConfig, ColorPalette, FontFamilyMap } from '../theme/types';
import type { StoreConfig } from './types';

// ─── Colour helpers ────────────────────────────────────────────────────────────

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export const normalizeHex = (value?: string | null): string | null => {
  if (!value) return null;
  const match = value.trim().match(HEX);
  if (!match) return null;
  const hex = match[1];
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map(char => char + char)
          .join('')
      : hex;
  return `#${full.toUpperCase()}`;
};

const toRgb = (hex: string) => {
  const normalized = normalizeHex(hex) ?? '#000000';
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
};

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map(value => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;

/** Blends a colour towards white. `amount` 0–1. */
export const lighten = (hex: string, amount: number): string => {
  const { r, g, b } = toRgb(hex);
  return toHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
};

/** Blends a colour towards black. `amount` 0–1. */
export const darken = (hex: string, amount: number): string => {
  const { r, g, b } = toRgb(hex);
  return toHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
};

/** Perceived luminance, used to pick readable text on top of a brand colour. */
export const isLight = (hex: string): boolean => {
  const { r, g, b } = toRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
};

export const readableOn = (hex: string): string => (isLight(hex) ? '#101010' : '#FFFFFF');

// ─── Font resolution ───────────────────────────────────────────────────────────

/**
 * Fallback order used when the requested family cannot supply four different
 * faces: heaviest first, so a collision always costs the lightest slot.
 */
const WEIGHT_LADDER_ORDER = [
  'Inter28pt-Bold',
  'Poppins-Bold',
  'Arimo-Bold',
  'Inter18pt-SemiBold',
  'Poppins-SemiBold',
  'Poppins-Medium',
  'Arimo-Regular',
  'Poppins-Regular',
  'Inter24pt-Bold',
];

/**
 * Maps a server font request (family + weight) onto a font bundled with the
 * app. Unknown families fall back to the compiled default so text never
 * renders with a missing font.
 */
export const resolveFontFamily = (
  family: string | undefined,
  weight: string | number | undefined,
  fallback: string,
): string => {
  const name = (family ?? '').toLowerCase();
  const numericWeight =
    typeof weight === 'number' ? weight : Number.parseInt(weight ?? '400', 10) || 400;
  const isBold = numericWeight >= 600;

  // A family the app doesn't ship renders as the system font, which is what the
  // caller asked us to avoid — so verify before returning.
  const verified = (resolved: string | undefined) =>
    resolved && INSTALLED_FONT_NAMES.includes(resolved as never)
      ? resolved
      : fallback;

  if (!name) return verified(fallback);

  if (name.includes('poppins')) {
    if (numericWeight >= 700) return verified(FONTS.poppinsBold);
    if (numericWeight >= 600) return verified(FONTS.poppinsSemiBold);
    if (numericWeight >= 500) return verified(FONTS.poppinsMedium);
    return verified(FONTS.poppinsRegular);
  }
  if (name.includes('arimo')) {
    return verified(isBold ? FONTS.arimoBold : FONTS.arimoRegular);
  }
  if (name.includes('momo')) {
    return verified(FONTS.momoSignature);
  }
  if (name.includes('inter')) {
    if (numericWeight >= 700) return verified(FONTS.inter28Bold);
    if (numericWeight >= 600) return verified(FONTS.inter18SemiBold);
    if (numericWeight <= 300) return verified(FONTS.inter28LightItalic);
    return verified(FONTS.inter24Bold);
  }

  return verified(fallback);
};

// ─── Support normalisation ─────────────────────────────────────────────────────

const digitsOnly = (value?: string | null): string => (value ?? '').replace(/\D/g, '');

/**
 * The API currently returns a truncated `webConfig.supportPhone` while
 * `business.phone` is complete. We keep whichever has the most digits so the
 * dial/WhatsApp links are never broken.
 */
export const resolveSupportPhone = (
  businessPhone?: string,
  webConfigPhone?: string,
  country?: string,
): string => {
  const candidates = [digitsOnly(businessPhone), digitsOnly(webConfigPhone)]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  const longest = candidates[0] ?? '';
  if (!longest) return '';

  const dialCode = digitsOnly(country);
  if (dialCode && !longest.startsWith(dialCode)) {
    return `+${dialCode}${longest}`;
  }
  return `+${longest}`;
};

const formatPhone = (phone: string): string => {
  if (!phone.startsWith('+')) return phone;
  const rest = phone.slice(1);
  if (rest.length === 12 && rest.startsWith('91')) {
    return `+91 ${rest.slice(2, 4)} ${rest.slice(4, 9)} ${rest.slice(9)}`;
  }
  return phone;
};

// ─── Palette ───────────────────────────────────────────────────────────────────

/**
 * How far the primary is pushed towards white (light palette) or black (dark
 * palette) to reach each derived tint. The light figures reproduce the compiled
 * Butru palette — `primaryLight` is `lighten('#B12B5B', 0.88)` = `#F6E6EB` and
 * the dark figure reproduces its `primaryLight` of `#3A0F22`. Deriving from the
 * primary rather than shipping fixed tints is what lets a tenant's background
 * follow their brand instead of Butru's pink.
 */
const TINTS = {
  light: { card: 0.88, background: 0.84 },
  dark: { card: 0.75, background: 0.95 },
} as const;

/**
 * `withBrandColors` used to blend towards white for both palettes, which handed
 * the dark theme a pale-pink `primaryLight` on a near-black background. The
 * derived tints now follow the mode they are being built for.
 */
const withBrandColors = (
  base: ColorPalette,
  primary: string,
  secondary: string,
  accent: string,
  mode: 'light' | 'dark',
): ColorPalette => {
  const tint = TINTS[mode];
  const shift = (amount: number) => (mode === 'light' ? lighten(primary, amount) : darken(primary, amount));
  const background = shift(tint.background);

  return {
    ...base,
    primary,
    primaryLight: shift(tint.card),
    // The coupon ticket surface (`ApplyCouponModal`, `NotificationScreen`). It
    // shipped as a literal `#FFE4ED` in the palette, so it stayed Butru-pink
    // for every tenant. It is the same step of the ramp as `primaryLight` —
    // the compiled light and dark values both match — so it shares the tint.
    coupanBackroun: shift(tint.card),
    // The screen behind every tab. `HomeScreen` paints the whole app with it, so
    // leaving it un-mapped pinned the background to Butru's pink no matter what
    // the API returned.
    background,
    backgroundColor: background,
    secondary,
    borderFocus: primary,
    tabActive: primary,
    notifDot: accent,
    textOnPrimary: readableOn(primary),
  };
};

// ─── Bridge ────────────────────────────────────────────────────────────────────

export const buildFontMap = (
  config: StoreConfig,
  fallback: FontFamilyMap,
): FontFamilyMap => {
  const fonts = config.theme?.fonts ?? {};
  const bodyFamily = fonts.body?.family ?? config.theme?.fontFamily;
  const headingFamily = fonts.heading?.family ?? config.theme?.fontFamily;
  const titleFamily = fonts.title1?.family ?? headingFamily;

  // Ask the requested family for the weight each slot actually needs.
  const requested: FontFamilyMap = {
    heading: resolveFontFamily(headingFamily, fonts.heading?.weight, fallback.heading),
    bold: resolveFontFamily(titleFamily, 700, fallback.bold),
    medium: resolveFontFamily(bodyFamily, 500, fallback.medium),
    regular: resolveFontFamily(bodyFamily, 400, fallback.regular),
  };

  // The bundle ships only two Poppins faces (Medium + Bold), so a Poppins-based
  // ladder cannot give `regular`, `medium` and `bold` three different looks —
  // slots would silently collapse onto the same file. Resolving the slots from
  // heaviest to lightest and giving each the first candidate nobody has taken
  // yet keeps all four visually distinct.
  const order: Array<keyof FontFamilyMap> = ['bold', 'heading', 'medium', 'regular'];
  const result = { ...requested } as Record<keyof FontFamilyMap, string>;
  const used = new Set<string>();

  order.forEach(slot => {
    const candidates = [
      requested[slot],
      fallback[slot],
      ...WEIGHT_LADDER_ORDER.filter(font => !used.has(font)),
    ];
    const picked = candidates.find(font => !!font && !used.has(font)) ?? requested[slot];
    result[slot] = picked;
    used.add(picked);
  });

  return result as FontFamilyMap;
};

export const mapStoreConfigToAppConfig = (
  store: StoreConfig,
  base: AppConfig,
): AppConfig => {
  const primary = normalizeHex(store.theme?.primaryColor) ?? base.colors.light.primary;
  const secondary = normalizeHex(store.theme?.secondaryColor) ?? base.colors.light.secondary;
  const accent = normalizeHex(store.theme?.accentColor) ?? primary;

  const webConfig = store.website?.webConfig;
  const footer = webConfig?.footer;
  const addressLines = (footer?.addressLines ?? []).filter(Boolean);

  return {
    ...base,
    appName: store.storeName || base.appName,
    logoUrl: store.logo || webConfig?.logoUrl || base.logoUrl,
    fontFamily: buildFontMap(store, base.fontFamily),
    colors: {
      light: withBrandColors(base.colors.light, primary, secondary, accent, 'light'),
      dark: withBrandColors(base.colors.dark, primary, secondary, accent, 'dark'),
    },
    api: {
      storeSlug: store.slug || base.api.storeSlug,
      storeId: store.storeId || base.api.storeId,
      storeDomain: base.api.storeDomain,
    },
    support: {
      ...base.support,
      companyName: store.storeName || footer?.shopTitle || base.support.companyName,
      phone: formatPhone(
        resolveSupportPhone(
          store.business?.phone,
          webConfig?.supportPhone,
          webConfig?.supportPhoneCountry,
        ),
      ) || base.support.phone,
      email: store.contactEmail || store.business?.email || base.support.email,
      address: addressLines.join(', ') || base.support.address,
      mapQuery: addressLines[0] || base.support.mapQuery,
    },
  };
};
