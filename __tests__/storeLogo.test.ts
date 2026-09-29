/**
 * The app logo used to be a compiled-in SVG behind a `Butruname ? … : <Text>`
 * guard at nine call sites, so a tenant could only ever change it by rebuilding
 * the app. It now comes from the storefront config:
 *
 *   API data.logo  (or data.website.webConfig.logoUrl)
 *     -> storefrontSlice
 *     -> mapStoreConfigToAppConfig  -> AppConfig.logoUrl
 *     -> themeSlice                 -> useAppTheme().logoUrl
 *     -> <StoreLogo />              -> SvgUri / Image, then BRAND.logo, then text
 *
 * Two failure modes are worth pinning down: a payload that carries the logo
 * only under `website.webConfig.logoUrl`, and a payload with no logo at all,
 * which must leave the compiled SVG in place rather than rendering nothing.
 */

import { configureStore } from '@reduxjs/toolkit';

import { loadStorefront } from '../src/store/slices/storefrontSlice';
import { applyConfig } from '../src/store/slices/themeSlice';
import { mapStoreConfigToAppConfig } from '../src/storefront/bridge';
import APP_CONFIG from '../src/config/app_config';
import { BRAND } from '../src/assets/svg/brand';
import type { StoreConfig } from '../src/storefront/types';
import themeReducer from '../src/store/slices/themeSlice';
import storefrontReducer from '../src/store/slices/storefrontSlice';

// The value the live butru-store payload returns for `data.logo`.
const API_LOGO =
  'https://sttdevserver.s3.ap-south-1.amazonaws.com/butru/1790052419117-7454f9d3-92e5-403f-ae19-a6fd38c5aa06.svg';

const configWith = (over: Record<string, unknown>): StoreConfig =>
  ({ ...over } as unknown as StoreConfig);

function freshStore() {
  return configureStore({
    reducer: { theme: themeReducer, storefront: storefrontReducer },
  });
}

/** Runs the real slice chain and returns the theme the screens would read. */
function resolvedLogoUrl(over: Record<string, unknown>): string | null {
  const store = freshStore();
  const config = configWith(over);

  store.dispatch(loadStorefront.fulfilled(config, '', undefined));
  store.dispatch(applyConfig(mapStoreConfigToAppConfig(config, store.getState().theme.config)));

  return store.getState().theme.current.logoUrl;
}

describe('store logo comes from the API', () => {
  it('uses the top-level logo the payload returns', () => {
    expect(resolvedLogoUrl({ logo: API_LOGO, storeName: 'Butru' })).toBe(API_LOGO);
  });

  it('falls back to website.webConfig.logoUrl when the top-level one is absent', () => {
    expect(
      resolvedLogoUrl({
        website: { webConfig: { logoUrl: API_LOGO } },
      }),
    ).toBe(API_LOGO);
  });

  it('prefers the top-level logo when the payload carries both', () => {
    expect(
      resolvedLogoUrl({
        logo: API_LOGO,
        website: { webConfig: { logoUrl: 'https://cdn.example.com/other.svg' } },
      }),
    ).toBe(API_LOGO);
  });

  it('propagates the API store name for the text fallback tier', () => {
    const store = freshStore();
    const config = configWith({ logo: API_LOGO, storeName: 'Butru' });

    store.dispatch(loadStorefront.fulfilled(config, '', undefined));
    store.dispatch(applyConfig(mapStoreConfigToAppConfig(config, store.getState().theme.config)));

    expect(store.getState().theme.current.appName).toBe('Butru');
  });
});

describe('store logo fallback ladder', () => {
  it('has no compiled URL, so the bundled SVG is what renders offline', () => {
    // `logoUrl: null` is what keeps the remote tier inert until a config
    // arrives; if someone hardcodes a URL here the offline tier dies silently.
    expect(APP_CONFIG.logoUrl).toBeNull();
  });

  it('yields no URL for a payload with no logo anywhere', () => {
    expect(resolvedLogoUrl({ storeName: 'Butru', website: { webConfig: {} } })).toBeNull();
  });

  it('still ships a bundled logo to fall back to', () => {
    const ink = APP_CONFIG.colors.light.primary;

    expect(BRAND.logo.svg(ink)).toContain('<svg');
    // `wordmark` is a second registry entry over the same source SVG, so the
    // fallback tier has markup to render without another network round trip.
    expect(BRAND.wordmark.svg(ink)).toBe(BRAND.logo.svg(ink));
  });
});
