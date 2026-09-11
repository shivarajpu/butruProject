/**
 * useAppTheme — The one hook every component calls to get the current theme.
 *
 * Usage:
 *   const theme = useAppTheme();
 *   <View style={{ backgroundColor: theme.colors.background }} />
 *
 * Because this wraps useSelector, the component will automatically
 * re-render whenever the theme changes (e.g. mode toggle or config swap).
 */

import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import type { AppTheme } from './types';

export function useAppTheme(): AppTheme {
  return useSelector((state: RootState) => state.theme.current);
}
