/**
 * Redux Toolkit — Theme Slice
 *
 * Manages the resolved AppTheme in global state.
 *
 * Actions:
 *  switchMode(mode)    — Toggle between 'light' and 'dark'. Rebuilds theme.
 *  applyConfig(config) — Swap the entire AppConfig at runtime (server-driven
 *                        white-labeling without a rebuild). Rebuilds theme.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Appearance } from 'react-native';
import APP_CONFIG from '../../config/app_config';
import { buildTheme, resolveMode } from '../../theme/buildTheme';
import type { AppConfig, AppTheme, ColorMode } from '../../theme/types';

interface ThemeState {
  /** The fully-resolved theme object consumed by all components. */
  current: AppTheme;
  /** The active colour mode ('light' | 'dark'). */
  mode: 'light' | 'dark';
  /** The raw config — kept in state so applyConfig can swap it live. */
  config: AppConfig;
}

// Resolve mode at startup, respecting 'system' setting
const systemScheme = Appearance.getColorScheme() as 'light' | 'dark' | null;
const initialMode = resolveMode(APP_CONFIG.defaultMode, systemScheme);

const initialState: ThemeState = {
  current: buildTheme(APP_CONFIG, initialMode),
  mode: initialMode,
  config: APP_CONFIG,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    /**
     * Switch the colour mode and rebuild the resolved theme.
     * Accepts 'light' | 'dark' | 'system'.
     * 'system' resolves against the current OS appearance.
     */
    switchMode(state, action: PayloadAction<ColorMode>) {
      const scheme = Appearance.getColorScheme() as 'light' | 'dark' | null;
      const resolved = resolveMode(action.payload, scheme);
      state.mode = resolved;
      state.current = buildTheme(state.config, resolved);
    },

    /**
     * Replace the entire config (e.g. fetched from a remote server).
     * Re-resolves the current mode against the new config.
     * This is the key action that enables true runtime white-labeling.
     */
    applyConfig(state, action: PayloadAction<AppConfig>) {
      state.config = action.payload;
      state.current = buildTheme(action.payload, state.mode);
    },
  },
});

export const { switchMode, applyConfig } = themeSlice.actions;
export default themeSlice.reducer;
