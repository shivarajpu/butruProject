/**
 * Redux Toolkit — Storefront Slice
 *
 * Holds the tenant configuration returned by `/api/storefront/store`.
 *
 * Load strategy (used by `useStorefront`) — stale-while-revalidate:
 *   1. `hydrateFromCache` — paint instantly from the AsyncStorage copy.
 *   2. `loadStorefront`   — always hit the network so admin changes (theme
 *                           colours, widgets, navigation) land on the very next
 *                           launch; a failed request never wipes the cache.
 *   3. The theme slice re-skins the app from the same payload.
 */

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import APP_CONFIG from '../../config/app_config';
import {
  getStoreConfig,
  readCachedConfig,
  writeCachedConfig,
} from '../../api/storefront';
import { clearCatalogCache } from '../../storefront/catalog';
import type { StoreConfig } from '../../storefront/types';

export type StorefrontStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface StorefrontState {
  config: StoreConfig | null;
  status: StorefrontStatus;
  /** True while a cached config is already on screen and a refresh is in flight. */
  refreshing: boolean;
  /** True when `config` came from disk rather than the network. */
  fromCache: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: StorefrontState = {
  config: null,
  status: 'idle',
  refreshing: false,
  fromCache: false,
  error: null,
  lastFetched: null,
};

export const hydrateFromCache = createAsyncThunk<StoreConfig | null>(
  'storefront/hydrateFromCache',
  async () => {
    const cached = await readCachedConfig(APP_CONFIG.api.storeSlug);
    return cached?.config ?? null;
  },
);

export const loadStorefront = createAsyncThunk<
  StoreConfig,
  void,
  { rejectValue: string }
>('storefront/load', async (_, { rejectWithValue }) => {
  const slug = APP_CONFIG.api.storeSlug;

  // Deliberately revalidates on every launch instead of trusting a TTL: the
  // cache is an offline fallback and a fast first paint, never the source of
  // truth, otherwise theme/widget edits would take hours to reach devices.
  try {
    const config = await getStoreConfig(slug);
    await writeCachedConfig(slug, config);
    clearCatalogCache();
    return config;
  } catch (error) {
    const cached = await readCachedConfig(slug);
    if (cached?.config) return cached.config;

    return rejectWithValue(
      error instanceof Error ? error.message : 'Unable to load store settings.',
    );
  }
});

/** Re-runs the network fetch and drops catalog caches. Used by pull-to-refresh. */
export const refreshStorefront = createAsyncThunk<StoreConfig, void, { rejectValue: string }>(
  'storefront/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const config = await getStoreConfig(APP_CONFIG.api.storeSlug);
      await writeCachedConfig(APP_CONFIG.api.storeSlug, config);
      clearCatalogCache();
      return config;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unable to refresh store settings.',
      );
    }
  },
);

const storefrontSlice = createSlice({
  name: 'storefront',
  initialState,
  reducers: {
    /** Clears the in-memory config — used by the retry button after a hard fail. */
    resetStorefront() {
      clearCatalogCache();
      return initialState;
    },
  },
  extraReducers: builder => {
    const settle = (state: StorefrontState, config: StoreConfig) => {
      const isSameStore = state.config?.storeId === config.storeId;
      state.config = config;
      state.status = 'ready';
      state.refreshing = false;
      state.error = null;
      state.fromCache = isSameStore ? state.fromCache : false;
      state.lastFetched = Date.now();
    };

    builder
      .addCase(hydrateFromCache.fulfilled, (state, action) => {
        if (action.payload && !state.config) {
          state.config = action.payload;
          state.status = 'ready';
          state.refreshing = true;
          state.fromCache = true;
        }
      })
      .addCase(loadStorefront.pending, state => {
        state.status = state.config ? 'ready' : 'loading';
        state.refreshing = !!state.config;
        state.error = null;
      })
      .addCase(loadStorefront.fulfilled, (state, action) => settle(state, action.payload))
      .addCase(loadStorefront.rejected, (state, action) => {
        state.status = state.config ? 'ready' : 'error';
        state.refreshing = false;
        state.error = action.payload ?? 'Unable to load store settings.';
      })
      .addCase(refreshStorefront.pending, state => {
        state.refreshing = true;
        state.error = null;
      })
      .addCase(refreshStorefront.fulfilled, (state, action) => settle(state, action.payload))
      .addCase(refreshStorefront.rejected, (state, action) => {
        state.refreshing = false;
        state.error = action.payload ?? null;
      });
  },
});

export const { resetStorefront } = storefrontSlice.actions;
export default storefrontSlice.reducer;
