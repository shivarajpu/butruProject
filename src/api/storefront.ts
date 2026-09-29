/**
 * Storefront API — store configuration endpoint.
 *
 *   GET /api/storefront/store?slug=<storeSlug>
 *
 * The response is cached in AsyncStorage so the app can paint the correct
 * brand/theme instantly on the next launch, then refresh in the background.
 * A failed refresh never wipes the cached config.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './apiService';
import type { StoreConfig, StoreConfigResponse } from '../storefront/types';

const ENDPOINT = '/api/storefront/store';

const storageKey = (slug: string) => `@storefront_config:${slug}`;

type CachedConfig = {
  fetchedAt: number;
  config: StoreConfig;
};

export const getStoreConfig = (slug: string): Promise<StoreConfig> =>
  apiService
    .get<StoreConfigResponse>(`${ENDPOINT}?slug=${encodeURIComponent(slug)}`)
    .then(response => {
      if (!response?.success || !response?.data) {
        throw new Error('Store configuration is unavailable.');
      }
      return response.data;
    });

export const readCachedConfig = async (slug: string): Promise<CachedConfig | null> => {
  try {
    const raw = await AsyncStorage.getItem(storageKey(slug));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedConfig;
    if (!parsed?.config?.storeId) return null;

    return parsed;
  } catch {
    return null;
  }
};

export const writeCachedConfig = async (
  slug: string,
  config: StoreConfig,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      storageKey(slug),
      JSON.stringify({ fetchedAt: Date.now(), config } satisfies CachedConfig),
    );
  } catch {
    // Cache write failures are non-fatal.
  }
};
