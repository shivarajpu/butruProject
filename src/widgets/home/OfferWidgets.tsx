/**
 * Offer-style product widgets.
 *
 *   deal_of_the_day — products flagged `isDealOfTheDay`, with a live countdown
 *                     to `dealEndAt`.
 *   offer_cards     — the highest-discounted products, since the backend has
 *                     no dedicated banner placement for offers.
 *
 * Both are gated on `theme.saleEventVisible` so a store can switch the whole
 * offers surface off from the admin panel.
 */

import React, { useEffect, useState } from 'react';
import { FONTS } from '../../constants/fonts';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme/useAppTheme';
import type { AppTheme } from '../../theme/types';
import type { RootStackParamList } from '../../navigation/types';
import { fetchProductsForSource, formatPrice, type StoreProduct } from '../../storefront/catalog';
import { useStoreConfig } from '../../storefront/useStorefront';
import type { StoreWidget, WidgetConfig } from '../../storefront/types';
import { useWidgetActions, useWidgetData, useWidgetLayout, GRID_GAP } from '../common';
import { useWishlist } from '../../hooks/useWishlist';
import { SvgXml } from 'react-native-svg';
import { heartFilledSvg, heartOutlineSvg } from '../../assets/svg';

type Props = { widget: StoreWidget };

// ─── Countdown ─────────────────────────────────────────────────────────────────

const useCountdown = (target: string | null) => {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!target) {
      setRemaining(null);
      return undefined;
    }

    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target]);

  if (remaining === null) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, expired: remaining === 0 };
};

const Countdown = ({ target }: { target: string | null }) => {
  const theme = useAppTheme();
  const countdown = useCountdown(target);
  if (!countdown) return null;

  const cells: Array<[string, number]> = [
    ['D', countdown.days],
    ['H', countdown.hours],
    ['M', countdown.minutes],
    ['S', countdown.seconds],
  ];

  return (
    <View style={stylesLocal.countdown}>
      {cells.map(([label, value], index) => (
        <React.Fragment key={label}>
          {index > 0 && <Text style={stylesLocal.separator}>:</Text>}
          <View style={[stylesLocal.countCell, { backgroundColor: theme.colors.primary }]}>
            <Text style={stylesLocal.countValue}>{String(value).padStart(2, '0')}</Text>
            <Text style={stylesLocal.countLabel}>{label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
};

const stylesLocal = StyleSheet.create({
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  countCell: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignItems: 'center' },
  countValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  countLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 8 },
  separator: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 1000,
  },
});

// ─── Deal of the day ───────────────────────────────────────────────────────────

/** Heading for the feed the section falls back to when nothing is flagged. */
const FALLBACK_HEADING = 'New Arrivals';

/** `config.fallbackHeading` is free-form on the backend, so it needs a guard. */
const fallbackHeadingOf = (config: WidgetConfig): string => {
  const value = config.fallbackHeading;
  return typeof value === 'string' && value.trim() ? value.trim() : FALLBACK_HEADING;
};

const DealOfTheDayWidget = ({ widget }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { gutter, tileWidth } = useWidgetLayout();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const storeConfig = useStoreConfig();
  const { config } = widget;

  const dealsEnabled = storeConfig?.theme?.saleEventVisible !== false;
  const wishlist = useWishlist();

  const { data, loading } = useWidgetData<StoreProduct[]>(
    () =>
      fetchProductsForSource({
        source: 'deal_of_the_day',
        limit: config.limit ?? 6,
        collections: storeConfig?.website?.collections ?? [],
      }),
    [config.limit],
    [],
  );

  // The backend may not flag any deal; fall back to the new-arrivals feed so
  // the section is never blank while `saleEventVisible` is on.
  const { data: fallback } = useWidgetData<StoreProduct[]>(
    () =>
      dealsEnabled && data.length === 0
        ? fetchProductsForSource({
            source: 'new_arrivals',
            limit: config.limit ?? 6,
            collections: storeConfig?.website?.collections ?? [],
          })
        : Promise.resolve([]),
    [data.length, dealsEnabled],
    [],
  );

  const usingFallback = data.length === 0 && fallback.length > 0;
  // Labelling new arrivals as "Deal Of The Day" is a lie the shopper sees, so
  // the fallback feed brings its own heading (overridable from the config).
  const heading = usingFallback
    ? fallbackHeadingOf(config)
    : config.heading || widget.title;

  const products = usingFallback ? fallback : data;

  if (!dealsEnabled && products.length === 0) return null;
  if (loading && products.length === 0) {
    return (
      <View style={[styles.section, { paddingHorizontal: gutter }]}>
        <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 24 }} />
      </View>
    );
  }
  if (!products.length) return null;

  return (
    <View style={[styles.section, { paddingHorizontal: gutter }]}>
      {config.showTitle !== false && !!heading && <Text style={styles.title}>{heading}</Text>}

      <View style={styles.dealRow}>
        {products.map(product => (
          <TouchableOpacity
            key={product.id}
            activeOpacity={0.85}
            style={{ width: tileWidth }}
            onPress={() => navigation.navigate('ProductDetails', { product })}>
            <View style={{ position: 'relative' }}>
              <Image
                source={{ uri: product.image }}
                style={[styles.dealImage, { backgroundColor: theme.colors.surfaceVariant }]}
                resizeMode="cover"
              />
              {!!product.discount && (
                <View style={[styles.dealBadge, { backgroundColor: theme.colors.discount }]}>
                  <Text style={stylesLocal.countLabel}>{product.discount}% OFF</Text>
                </View>
              )}
              {product.dealEndAt && <Countdown target={product.dealEndAt} />}
              <TouchableOpacity
                style={[
                  stylesLocal.heartBtn,
                  { backgroundColor: theme.colors.surface },
                ]}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={(e) => { e.stopPropagation(); wishlist.toggle(product.id); }}>
                <SvgXml
                  xml={wishlist.isWishlisted(product.id)
                    ? heartFilledSvg(theme.colors.primary)
                    : heartOutlineSvg(theme.colors.textMuted)}
                  width={16}
                  height={16}
                />
              </TouchableOpacity>
            </View>
            <Text numberOfLines={1} style={styles.dealName}>
              {product.name}
            </Text>
            <View style={styles.dealPriceRow}>
              <Text style={styles.dealPrice}>{formatPrice(product.price)}</Text>
              {!!product.discount && (
                <Text style={styles.dealMrp}>{formatPrice(product.originalPrice)}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── Offer cards ───────────────────────────────────────────────────────────────

const OfferCardsWidget = ({ widget }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { gutter, isTablet, tileWidthFor } = useWidgetLayout();
  const { onLink } = useWidgetActions();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { config } = widget;

  // Measured, not 31.5%: a full row is three-up on a phone, and a row that
  // isn't full has to keep the same 12px gaps instead of being split apart by
  // `space-between`.
  const columns = isTablet ? 4 : 3;
  const cardWidth = tileWidthFor(columns);

  const { data, loading } = useWidgetData<StoreProduct[]>(
    async () => {
      const products = await fetchProductsForSource({
        source: 'all',
        limit: 24,
      });
      return products
        .filter(product => product.discount > 0)
        .sort((a, b) => b.discount - a.discount)
        .slice(0, config.limit ?? 6);
    },
    [config.limit],
    [],
  );

  if (loading && data.length === 0) return null;
  if (!data.length) return null;

  const heading = config.heading || widget.title;

  return (
    <View style={[styles.section, { paddingHorizontal: gutter }]}>
      {config.showTitle !== false && !!heading && <Text style={styles.title}>{heading}</Text>}

      <View style={styles.offerRow}>
        {data.map(product => (
          <TouchableOpacity
            key={product.id}
            activeOpacity={0.85}
            style={[styles.offerCard, { width: cardWidth }]}
            onPress={() => navigation.navigate('ProductDetails', { product })}>
            <Image
              source={{ uri: product.image }}
              style={styles.offerImage}
              resizeMode="cover"
            />
            <Text numberOfLines={1} style={styles.offerName}>
              {product.name}
            </Text>
            <View style={styles.dealPriceRow}>
              <Text style={styles.dealPrice}>{formatPrice(product.price)}</Text>
              <Text style={styles.dealMrp}>{formatPrice(product.originalPrice)}</Text>
            </View>
            {!!product.discount && (
              <View style={[styles.offerStrip, { backgroundColor: theme.colors.discount }]}>
                <Text style={styles.offerStripText}>{product.discount}% OFF</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {!!config.ctaText && (
        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.8}
          onPress={() => onLink(config.ctaUrl)}>
          <Text style={styles.ctaText}>{config.ctaText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;
  return StyleSheet.create({
    section: { marginBottom: 22 },
    title: {
      fontSize: 18,
      letterSpacing: -0.2,
      color: colors.primary,
      fontFamily: FONTS.inter28Bold,
      marginBottom: 12,
    },
    dealRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: GRID_GAP,
      rowGap: 14,
    },
    dealImage: {
      width: '100%',
      aspectRatio: 0.82,
      borderRadius: 12,
    },
    dealBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
    },
    dealName: {
      fontSize: 12,
      color: colors.text,
      marginTop: 6,
      fontFamily: fontFamily.regular,
    },
    dealPriceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 2,
    },
    dealPrice: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    dealMrp: {
      fontSize: 10,
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    offerRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: GRID_GAP,
      rowGap: GRID_GAP,
    },
    offerCard: {
      width: '100%',
    },
    offerImage: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 10,
    },
    offerName: {
      fontSize: 11,
      color: colors.text,
      marginTop: 5,
    },
    offerStrip: {
      marginTop: 4,
      alignSelf: 'flex-start',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    offerStripText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '700',
    },
    cta: {
      backgroundColor: colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 20,
      alignSelf: 'center',
      marginTop: 4,
    },
    ctaText: {
      color: colors.textOnPrimary,
      fontSize: 13,
      fontFamily: FONTS.poppinsBold,
    },
  });
};

export { DealOfTheDayWidget, OfferCardsWidget };
