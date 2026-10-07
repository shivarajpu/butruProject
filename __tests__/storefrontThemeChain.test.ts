/**
 * Proves the whole recolouring chain end to end, with no React involved:
 *
 *   API payload.primaryColor
 *     -> storefrontSlice
 *     -> mapStoreConfigToAppConfig
 *     -> themeSlice
 *     -> useAppTheme().colors.primary
 *     -> the token BrandIcon feeds to tintSvg
 *
 * Everything else in the icon work trusts this chain, so it is worth asserting
 * against the real store rather than a hand-rolled fake.
 */

import { configureStore } from '@reduxjs/toolkit';
import { loadStorefront } from '../src/store/slices/storefrontSlice';
import { applyConfig } from '../src/store/slices/themeSlice';
import { mapStoreConfigToAppConfig, readableOn, lighten, darken } from '../src/storefront/bridge';
import { TONE_TOKEN } from '../src/components/BrandIcon';
import { BRAND } from '../src/assets/svg/brand';
// Resolved per-client config (base app_config + the active client's overrides).
// Importing the resolver rather than the base is what keeps this assertion
// meaningful in a multi-client codebase: "falls back to the compiled-in default"
// must mean "this build's default", not "Butru's default, forever".
import APP_CONFIG from '../src/config/clients';
import type { StoreConfig } from '../src/storefront/types';
import themeReducer from '../src/store/slices/themeSlice';
import storefrontReducer from '../src/store/slices/storefrontSlice';

const TEAL = '#0F766E';
const PALE_TEAL = '#CCFBF1';

/** Perceived luminance, so ordering claims are about visibility, not hex order. */
const luma = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

// `primaryColor` is nested under `theme` in the API payload, which is exactly
// the path `mapStoreConfigToAppConfig` reads.
const configWith = (primaryColor: string): StoreConfig =>
  ({ theme: { primaryColor } } as unknown as StoreConfig);

/**
 * A fresh store per test: the app's `store` is a module-level singleton and
 * would leak theme state from one case into the next. Only the two slices this
 * chain touches are registered, so the assertions cannot be satisfied by
 * anything the auth/cart layers happen to do.
 */
function freshStore() {
  return configureStore({
    reducer: { theme: themeReducer, storefront: storefrontReducer },
  });
}

describe('storefront primaryColor -> theme -> icon', () => {
  it('pushes the API colour into the theme palette', () => {
    const store = freshStore();

    expect(store.getState().theme.config.colors.light.primary).not.toBe(TEAL);

    store.dispatch(loadStorefront.fulfilled(configWith(TEAL), '', undefined));
    store.dispatch(applyConfig(mapStoreConfigToAppConfig(configWith(TEAL), store.getState().theme.config)));

    expect(store.getState().theme.config.colors.light.primary).toBe(TEAL);
  });

  it('paints a brand icon with whatever the API returned', () => {
    const store = freshStore();
    const config = configWith(TEAL);

    store.dispatch(loadStorefront.fulfilled(config, '', undefined));
    store.dispatch(applyConfig(mapStoreConfigToAppConfig(config, store.getState().theme.config)));

    const brand = store.getState().theme.config.colors.light.primary;
    const painted = BRAND.profileUser.svg(brand);

    expect(painted).toContain(brand);
    // The baked-in brand hex must be gone, not merely supplemented.
    expect(painted.toUpperCase()).not.toContain('#B92D5E');
    expect(painted.toUpperCase()).not.toContain('#B12B5B');
  });

  it('keeps onPrimary ink legible on a pale brand colour', () => {
    const store = freshStore();
    const config = configWith(PALE_TEAL);

    store.dispatch(loadStorefront.fulfilled(config, '', undefined));
    store.dispatch(applyConfig(mapStoreConfigToAppConfig(config, store.getState().theme.config)));

    const onPrimary = store.getState().theme.config.colors.light.textOnPrimary;

    // Dark ink on a pale button, not the near-white default.
    expect(readableOn(PALE_TEAL)).toBe(onPrimary);
    expect(onPrimary).not.toBe('#FFFFFF');
  });

  it('falls back to the compiled-in default when the API omits the colour', () => {
    const store = freshStore();
    const config = { theme: {} } as unknown as StoreConfig;

    store.dispatch(applyConfig(mapStoreConfigToAppConfig(config, store.getState().theme.config)));

    expect(store.getState().theme.config.colors.light.primary).toBe(
      APP_CONFIG.colors.light.primary,
    );
  });

  it('routes each tone to the token the theme actually exposes', () => {
    const colors = APP_CONFIG.colors.light;
    for (const tone of Object.keys(TONE_TOKEN) as Array<keyof typeof TONE_TOKEN>) {
      expect(colors).toHaveProperty(TONE_TOKEN[tone]);
    }
  });
});

/**
 * `HomeScreen` paints the whole app with `colors.background`, so if the bridge
 * does not map that token it stays pinned to Butru's `#FEDDE5` and a tenant
 * rebrands everything except the surface their content sits on. The dark
 * palette needs its own guard too: `withBrandColors` used to blend towards
 * white for both modes, which put a pale-pink `primaryLight` on the dark theme.
 */
describe('screen background follows the API primary', () => {
  const resolve = (primaryColor?: string) => {
    const store = freshStore();
    // `configWith` seeds a `primaryColor`; the dark-path cases need a payload
    // with no colour at all, so the store config is built here instead.
    const config = { theme: { primaryColor } } as unknown as StoreConfig;

    store.dispatch(loadStorefront.fulfilled(config, '', undefined));
    store.dispatch(applyConfig(mapStoreConfigToAppConfig(config, store.getState().theme.config)));

    return store.getState().theme.config.colors;
  };

  it('re-derives the background from the API colour instead of the default', () => {
    const light = resolve(TEAL).light;

    expect(light.background).not.toBe(APP_CONFIG.colors.light.background);
    expect(light.background).toBe(lighten(TEAL, 0.84));
  });

  it('changes the background when the tenant changes colour', () => {
    // `TEAL` is `#0F766E`; violet and orange have to land somewhere else, or a
    // hardcoded background would still satisfy this.
    const teal = resolve(TEAL).light.background;
    const violet = resolve('#7C3AED').light.background;
    const orange = resolve('#FF6B35').light.background;

    expect(teal).not.toBe(violet);
    expect(teal).not.toBe(orange);
    expect(violet).not.toBe(orange);
  });

  it('keeps the legacy backgroundColor alias in step with background', () => {
    // Several unmigrated screens still read `backgroundColor`; if the bridge
    // moved one and not the other, the two would disagree by tenant.
    for (const primary of [TEAL, '#7C3AED', undefined]) {
      const { light } = resolve(primary);
      expect(light.backgroundColor).toBe(light.background);
    }
  });

  it('stays a pale tint that a card tint can sit on', () => {
    const { light } = resolve(TEAL);

    // Background lighter than primary, card lighter than background: the same
    // ordering the compiled Butru palette has.
    expect(luma(light.background)).toBeGreaterThan(luma(TEAL));
    expect(luma(light.primaryLight)).toBeGreaterThan(luma(light.background));
  });

  it('keeps the dark palette dark instead of blending towards white', () => {
    const dark = resolve(TEAL).dark;

    expect(luma(dark.background)).toBeLessThan(luma(TEAL));
    expect(dark.background).toBe(darken(TEAL, 0.95));
    // The regression: this used to be `lighten(primary, 0.88)`, a pale pink.
    expect(dark.primaryLight).toBe(darken(TEAL, 0.75));
    expect(luma(dark.primaryLight)).toBeLessThan(luma(TEAL));
  });

  it('keeps the dark background near-black but brand-tinted', () => {
    const { dark } = resolve();

    // Should still read as "app chrome", not as a dark card.
    expect(luma(dark.background)).toBeLessThan(24);
  });
});

/**
 * `coupanBackroun` is the coupon ticket surface in `ApplyCouponModal` and
 * `NotificationScreen`. It was a literal `#FFE4ED` in the compiled palette and
 * was never overridden, so the three coupon cards in the apply-coupon sheet
 * stayed Butru-pink no matter what the API returned.
 */
describe('coupon ticket surface follows the API primary', () => {
  const resolve = (primaryColor?: string) => {
    const store = freshStore();
    const config = { theme: { primaryColor } } as unknown as StoreConfig;

    store.dispatch(loadStorefront.fulfilled(config, '', undefined));
    store.dispatch(applyConfig(mapStoreConfigToAppConfig(config, store.getState().theme.config)));

    return store.getState().theme.config.colors;
  };

  it('re-derives the ticket background from the API colour', () => {
    const light = resolve(TEAL).light;

    expect(light.coupanBackroun).toBe(lighten(TEAL, 0.88));
    expect(light.coupanBackroun).not.toBe(APP_CONFIG.colors.light.coupanBackroun);
  });

  it('changes the ticket colour when the tenant changes colour', () => {
    const teal = resolve(TEAL).light.coupanBackroun;
    const violet = resolve('#7C3AED').light.coupanBackroun;

    expect(teal).not.toBe(violet);
    expect(teal).toBe(lighten(TEAL, 0.88));
    expect(violet).toBe(lighten('#7C3AED', 0.88));
  });

  it('stays a visible tint on the white modal it sits in', () => {
    // The sheet background is `colors.surface`; a ticket that blended into it
    // would be as invisible as the account-tab boxes were. `luma` is
    // normalised 0–1, and the compiled design sits about 0.08 below white.
    const surface = APP_CONFIG.colors.light.surface;

    for (const primary of [TEAL, '#7C3AED', '#FF6B35']) {
      const ticket = resolve(primary).light.coupanBackroun;
      expect(luma(surface) - luma(ticket)).toBeGreaterThan(0.05);
    }
  });

  it('keeps the dark ticket dark rather than pale', () => {
    const dark = resolve(TEAL).dark;

    expect(dark.coupanBackroun).toBe(darken(TEAL, 0.75));
    expect(luma(dark.coupanBackroun)).toBeLessThan(luma(TEAL));
  });
});
