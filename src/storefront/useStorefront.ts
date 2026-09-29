/**
 * useStorefront — the single entry point every screen uses to read the
 * tenant configuration.
 *
 * Responsibilities:
 *   1. Kick off the load exactly once per app launch.
 *   2. Hand the payload to the theme slice so colours / fonts / logo / support
 *      details re-skin the running app.
 *   3. Return plain data + helpers, memoised so widgets don't refetch on
 *      every render.
 */

import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { applyConfig } from '../store/slices/themeSlice';
import {
  hydrateFromCache,
  loadStorefront,
  refreshStorefront,
} from '../store/slices/storefrontSlice';
import { mapStoreConfigToAppConfig } from './bridge';
import { getPageWidgets } from './selectors';
import type { PageType, StoreConfig, StoreWidget } from './types';

/**
 * Module-level so the guard is shared by every hook instance — several
 * screens call `useStorefront()` on the same launch, and a per-hook `useRef`
 * would let each of them start its own request.
 */
let hasStartedLoad = false;

/** Loads the tenant config once and keeps the theme in sync with it. */
export function useStorefront() {
  const dispatch = useDispatch<AppDispatch>();
  const config = useSelector((state: RootState) => state.storefront.config);
  const status = useSelector((state: RootState) => state.storefront.status);
  const refreshing = useSelector((state: RootState) => state.storefront.refreshing);
  const error = useSelector((state: RootState) => state.storefront.error);
  const baseConfig = useSelector((state: RootState) => state.theme.config);

  useEffect(() => {
    if (hasStartedLoad) return;
    hasStartedLoad = true;

    dispatch(hydrateFromCache());
    dispatch(loadStorefront());
  }, [dispatch]);

  // Re-skin the app whenever a (new) store config arrives.
  useEffect(() => {
    if (!config) return;
    dispatch(applyConfig(mapStoreConfigToAppConfig(config, baseConfig)));
    // baseConfig is intentionally excluded: it would re-apply on mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, dispatch]);

  return {
    config,
    status,
    refreshing,
    error,
    ready: status === 'ready',
    refresh: () => dispatch(refreshStorefront()),
  };
}

/** Page widgets, sorted by the server-provided order. */
export function usePageWidgets(pageType: PageType): StoreWidget[] {
  const config = useSelector((state: RootState) => state.storefront.config);
  return useMemo(() => getPageWidgets(config, pageType), [config, pageType]);
}

/** Whole config, for screens that need several unrelated slices of it. */
export function useStoreConfig(): StoreConfig | null {
  return useSelector((state: RootState) => state.storefront.config);
}
