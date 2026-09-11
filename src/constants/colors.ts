/**
 * COLORS — Backward-compatibility shim.
 *
 * This file re-exports the light palette from app_config so that any files
 * not yet migrated to useAppTheme() continue to compile without changes.
 *
 * Migration path:
 *   Old:  import { COLORS } from '../constants/colors';
 *         style={{ color: COLORS.primary }}
 *
 *   New:  const theme = useAppTheme();
 *         style={{ color: theme.colors.primary }}
 *
 * Once all screens are migrated to useAppTheme(), this shim can be deleted.
 */

import APP_CONFIG from '../config/app_config';

export const COLORS = APP_CONFIG.colors.light;