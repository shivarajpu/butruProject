/**
 * Theme system type definitions.
 * All style tokens consumed across the app are derived from these types.
 */

// ── Color Palette ─────────────────────────────────────────────────────────────

export interface ColorPalette {
  // Core brand
  primary: string;
  primaryLight: string;
  secondary: string;

  // Surfaces
  background: string;
  /** @alias background — kept for backward compat with pre-migration screens */
  backgroundColor: string;
  coupanBackroun:string,
  surface: string;
  surfaceVariant: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;

  // UI chrome
  border: string;
  borderFocus: string;
  divider: string;

  // Semantic
  success: string;
  error: string;
  warning: string;
  star: string;
  discount: string;

  // Navigation
  tabActive: string;
  tabInactive: string;

  // Misc
  notifDot: string;
  overlay: string;
  shimmer: string;
}

// ── Font Family Map ───────────────────────────────────────────────────────────

export interface FontFamilyMap {
  regular: string;
  bold: string;
  medium: string;
  heading: string;
}

// ── API Config ────────────────────────────────────────────────────────────────

export interface ApiConfig {
  storeSlug: string;
  storeDomain: string;
  storeId: string;
}

// ── App Config (shape of app_config.ts) ──────────────────────────────────────

export type ColorMode = 'light' | 'dark' | 'system';

export interface AppConfig {
  appName: string;
  logoUrl: string | null;
  fontFamily: FontFamilyMap;
  defaultMode: ColorMode;
  colors: {
    light: ColorPalette;
    dark: ColorPalette;
  };
  api: ApiConfig;
}

// ── Resolved App Theme (what components actually use) ─────────────────────────

export interface AppTheme {
  colors: ColorPalette;
  fontFamily: FontFamilyMap;
  appName: string;
  logoUrl: string | null;
  mode: 'light' | 'dark';
  api: ApiConfig;
}
