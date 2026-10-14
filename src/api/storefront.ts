/**
 * Storefront API — store configuration endpoint.
 *
 *   GET /api/storefront/store?storeId=<storeId>
 *
 * The response is cached in AsyncStorage so the app can paint the correct
 * brand/theme instantly on the next launch, then refresh in the background.
 * A failed refresh never wipes the cached config.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './apiService';
import type { StoreConfig, StoreConfigResponse } from '../storefront/types';

const ENDPOINT = '/api/storefront/store';

const storageKey = (storeId: string) => `@storefront_config:${storeId}`;

type CachedConfig = {
  fetchedAt: number;
  config: StoreConfig;
};

export const getStoreConfig = (storeId: string): Promise<StoreConfig> =>
  apiService
    .get<StoreConfigResponse>(`${ENDPOINT}?storeId=${encodeURIComponent(storeId)}`)
    .then(response => {
      if (!response?.success || !response?.data) {
        throw new Error('Store configuration is unavailable.');
      }
      return response.data;
    });

export const readCachedConfig = async (storeId: string): Promise<CachedConfig | null> => {
  try {
    const raw = await AsyncStorage.getItem(storageKey(storeId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedConfig;
    if (!parsed?.config?.storeId) return null;

    return parsed;
  } catch {
    return null;
  }
};

export const writeCachedConfig = async (
  storeId: string,
  config: StoreConfig,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      storageKey(storeId),
      JSON.stringify({ fetchedAt: Date.now(), config } satisfies CachedConfig),
    );
  } catch {
    // Cache write failures are non-fatal.
  }
};
