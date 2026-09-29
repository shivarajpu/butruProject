/**
 * DynamicPage — renders a whole page from the storefront config.
 *
 * A page is nothing but an ordered list of live widgets for a `pageType`
 * (`home`, `product`, `oos`, `orderStatus`). Reordering, hiding or adding a
 * section is done in the admin panel; the app just follows `order`.
 */

import React from 'react';
import { FONTS } from '../constants/fonts';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import { useStorefront } from '../storefront/useStorefront';
import type { PageType } from '../storefront/types';
import DynamicWidget from '../widgets/registry';
import type { ProductWidgetProduct } from '../widgets/product/ProductWidgets';

type Props = {
  pageType: PageType;
  /** Only needed for `product` / `oos` pages. */
  product?: ProductWidgetProduct;
  /** Rendered when the store has no widgets for this page. */
  emptyLabel?: string;
  /** Caps the number of sections (used by compact surfaces). */
  limit?: number;
  /**
   * Bumping this remounts every widget, which re-runs each one's data loader.
   * `useWidgetData` only reloads when its own deps change, so a config refresh
   * alone would leave stale sections on screen.
   */
  refreshKey?: number;
};

const DynamicPage = ({ pageType, product, emptyLabel, limit, refreshKey = 0 }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { config, status, error, refresh } = useStorefront();

  if (status === 'loading' || status === 'idle') {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.stateBox}>
        <Text style={styles.stateTitle}>Could not load this store</Text>
        <Text style={styles.stateText}>{error ?? 'Please try again.'}</Text>
        <TouchableOpacity style={styles.retry} activeOpacity={0.8} onPress={refresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const widgets = (config?.website?.widgets ?? [])
    .filter(widget => widget.pageType === pageType && widget.visibility === 'live')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (!widgets.length) {
    return (
      <View style={styles.stateBox}>
        <Text style={styles.stateText}>{emptyLabel ?? 'Nothing here yet.'}</Text>
      </View>
    );
  }

  return (
    <View>
      {widgets.slice(0, limit ?? widgets.length).map(widget => (
        <DynamicWidget
          key={`${widget.id}:${refreshKey}`}
          widget={widget}
          product={product}
        />
      ))}
    </View>
  );
};

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;
  return StyleSheet.create({
    stateBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    stateTitle: {
      fontSize: 15,
      color: colors.text,
      fontFamily: FONTS.poppinsBold,
      marginBottom: 6,
    },
    stateText: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      fontFamily: fontFamily.regular,
    },
    retry: {
      marginTop: 16,
      backgroundColor: colors.primary,
      paddingHorizontal: 26,
      paddingVertical: 10,
      borderRadius: 20,
    },
    retryText: {
      color: colors.textOnPrimary,
      fontSize: 13,
      fontFamily: FONTS.poppinsBold,
    },
  });
};

export default DynamicPage;
