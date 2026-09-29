/**
 * StoreLogo — the single place the app logo is decided.
 *
 * Nine call sites used to hardcode `<BrandIcon icon={BRAND.logo} … />` behind a
 * `{Butruname ? … : <Text>BuTRu</Text>}` guard. That meant the logo could only
 * ever change with a rebuild, and every site carried its own copy of the same
 * fallback ladder. The storefront API already hands us a logo
 * (`StoreConfig.logo` / `website.webConfig.logoUrl`, resolved into
 * `theme.logoUrl` by the bridge), so the ladder is inverted here:
 *
 *   1. the remote logo from the storefront config
 *   2. the compiled `BRAND.logo` SVG, if the remote one is absent or fails
 *   3. the store name as text
 *
 * SVG logos go through `SvgUri` because React Native's `Image` cannot rasterise
 * an `.svg`; anything else (PNG/JPG/WebP) goes through `Image` with
 * `resizeMode="contain"`. Either failure — bad URL, offline, 404 — falls
 * through to the bundled logo instead of rendering nothing.
 */

import React, { useState } from 'react';
import { Image, Text, type ImageStyle, type StyleProp, type TextStyle } from 'react-native';
import { SvgUri, type UriProps } from 'react-native-svg';

import { Butruname } from '../assets/svg';
import { BRAND } from '../assets/svg/brand';
import { useAppTheme } from '../theme/useAppTheme';
import { BrandIcon } from './BrandIcon';

export type StoreLogoProps = {
  /** Intrinsic width in px. Call sites keep their existing responsive sizing. */
  width: number;
  /** Intrinsic height in px. */
  height: number;
  /** Layout style applied to whichever tier renders. */
  style?: StyleProp<ImageStyle>;
  /** Style for the text tier. Each screen keeps its own logo text styling. */
  textStyle?: StyleProp<TextStyle>;
  /** Text tier content. Defaults to the dynamic store name. */
  fallbackText?: string;
};

const isSvgUri = (uri: string): boolean => /\.svg($|[?#])/i.test(uri);

export function StoreLogo({ width, height, style, textStyle, fallbackText }: StoreLogoProps) {
  const theme = useAppTheme();
  const [remoteFailed, setRemoteFailed] = useState(false);

  const remote = theme.logoUrl;

  if (remote && !remoteFailed) {
    const onError = () => setRemoteFailed(true);

    if (isSvgUri(remote)) {
      return (
        <SvgUri
          uri={remote}
          width={width}
          height={height}
          // Same narrowing `BrandIcon` re-types: react-native-svg's own
          // `style` is stricter than React Native's ViewStyle.
          style={style as UriProps['style']}
          onError={onError}
        />
      );
    }

    return (
      <Image
        source={{ uri: remote }}
        style={[{ width, height }, style]}
        resizeMode="contain"
        onError={onError}
      />
    );
  }

  if (Butruname) {
    return <BrandIcon icon={BRAND.logo} width={width} height={height} style={style} />;
  }

  return (
    <Text style={textStyle} numberOfLines={1}>
      {fallbackText || theme.appName}
    </Text>
  );
}

export default StoreLogo;
