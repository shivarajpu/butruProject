/**
 * buildTheme — Pure function that takes the AppConfig and a resolved mode
 * ('light' | 'dark') and returns a fully-resolved AppTheme object.
 *
 * This is called once at store init and whenever the user toggles the mode.
 * It has NO side-effects and does NOT reference React, making it trivially
 * testable with plain Jest.
 */

import type { AppConfig, AppTheme } from './types';

/**
 * @param config - The raw AppConfig from app_config.ts
 * @param mode   - The resolved colour mode ('light' | 'dark')
 * @returns      - A fully resolved AppTheme ready for use in components
 */
export function buildTheme(
  config: AppConfig,
  mode: 'light' | 'dark',
): AppTheme {
  return {
    colors: config.colors[mode],
    fontFamily: config.fontFamily,
    appName: config.appName,
    logoUrl: config.logoUrl,
    mode,
    api: config.api,
    support: config.support,
  };
}

/**
 * Resolves 'system' mode to an explicit 'light' | 'dark' value.
 * Pass in the value from useColorScheme() / Appearance.getColorScheme().
 */
export function resolveMode(
  configDefault: AppConfig['defaultMode'],
  systemScheme: 'light' | 'dark' | null | undefined,
): 'light' | 'dark' {
  if (configDefault === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return configDefault;
}
