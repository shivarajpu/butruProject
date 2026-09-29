/**
 * BrandIcon — renders a registered glyph in the theme colour it is assigned.
 *
 * The point of this component is that a call site cannot get the recolouring
 * wrong. It is not enough to hand `theme.colors.primary` to a tint factory at
 * each usage: with ~90 icon renders across the app, one missed argument leaves
 * a frozen brand pink behind, and there is no type error to catch it. Pairing
 * the glyph with its tone in the registry means the wiring happens exactly once
 * and every render follows `theme.primaryColor` by construction.
 *
 *   <BrandIcon icon={BRAND.box} width={18} height={18} />
 *   <BrandIcon icon={BRAND.cart} width={14} height={14} />   // → colors.textOnPrimary
 *
 * Icons that must *not* follow the brand — semantic greens, the social marks,
 * raster illustrations — stay on plain `<SvgXml xml={…} />`.
 */

import React, { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { SvgXml, type SvgProps } from 'react-native-svg';

import { useAppTheme } from '../theme/useAppTheme';
import type { BrandIconDef, BrandIconTone } from '../assets/svg/brand';
import type { ColorPalette } from '../theme/types';

export const TONE_TOKEN: Record<BrandIconTone, keyof ColorPalette> = {
  primary: 'primary',
  onPrimary: 'textOnPrimary',
  text: 'text',
  textSecondary: 'textSecondary',
  textMuted: 'textMuted',
};

export type BrandIconProps = Omit<SvgProps, 'xml' | 'style'> & {
  /** A registry entry from `assets/svg/brand`. */
  icon: BrandIconDef;
  /**
   * react-native-svg types `style` against its own narrower CSS-ish object —
   * it rejects values a `ViewStyle` legitimately allows, such as
   * `overflow: 'scroll'`. Call sites should not have to know that, so the
   * style is re-typed to React Native's and cast through once here.
   */
  style?: StyleProp<ViewStyle>;
};

export function BrandIcon({ icon, style, ...rest }: BrandIconProps) {
  const { colors } = useAppTheme();

  const xml = useMemo(
    () => icon.svg(colors[TONE_TOKEN[icon.tone]]),
    [icon, colors],
  );

  return <SvgXml xml={xml} style={style as SvgProps['style']} {...rest} />;
}

export default BrandIcon;
