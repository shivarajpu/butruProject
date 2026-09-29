/**
 * Banner widgets — `banner_cross_link` (hero slider) and `hero_cards`.
 *
 * Data comes from `/api/storefront/banners?placement=<config.bannerPlacement>`,
 * so adding or removing slides never requires a release.
 */

import React, { useEffect, useState } from 'react';
import { FONTS } from '../../constants/fonts';
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import type { AppTheme } from '../../theme/types';
import { fetchBanners, type StoreBanner } from '../../storefront/catalog';
import type { StoreWidget } from '../../storefront/types';
import { useWidgetActions, useWidgetData, useWidgetLayout } from '../common';

type Props = { widget: StoreWidget };

const AUTO_SCROLL_MS = 5000;

const BannerWidget = ({ widget }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { gutter, width } = useWidgetLayout();
  const { onLink } = useWidgetActions();
  const { config } = widget;
  const placement = config.bannerPlacement ?? 'home_hero';
  const height = Math.min(width * 0.5, 230);

  const { data: banners, loading } = useWidgetData<StoreBanner[]>(
    () => fetchBanners(placement),
    [placement],
    [],
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const timer = setInterval(() => {
      setIndex(current => (current + 1) % banners.length);
    }, AUTO_SCROLL_MS);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (loading && banners.length === 0) {
    return <View style={[styles.loaderBox, { height }]} />;
  }
  if (!banners.length) return null;

  const active = banners[Math.min(index, banners.length - 1)];
  const align =
    config.titleAlignment === 'left'
      ? 'flex-start'
      : config.titleAlignment === 'right'
      ? 'flex-end'
      : 'center';

  // Banners often carry only an image (the panel leaves the title as a file
  // name), so the caption strip is skipped when there's nothing to say.
  const hasCaption =
    !!active.title ||
    !!active.subtitle ||
    active.offerPercent > 0 ||
    !!(active.ctaText || config.ctaText);

  return (
    <View style={{ marginBottom: 20 }}>
      <ImageBackground
        source={{ uri: active.image }}
        style={[
          styles.slide,
          {
            height,
            backgroundColor: config.backgroundColor || theme.colors.surfaceVariant,
          },
        ]}
        imageStyle={{ borderRadius: 16 }}
        resizeMode={config.fitImage ? 'contain' : 'cover'}>
        {hasCaption ? (
          <View style={[styles.overlay, { alignItems: align }]}>
            {!!active.title && <Text style={styles.slideTitle}>{active.title}</Text>}
            {!!active.subtitle && <Text style={styles.slideSubtitle}>{active.subtitle}</Text>}
            {!!active.offerPercent && (
              <View style={styles.offerPill}>
                <Text style={styles.offerPillText}>{active.offerPercent}% OFF</Text>
              </View>
            )}
            {(active.ctaText || config.ctaText) && (
              <TouchableOpacity
                style={styles.cta}
                activeOpacity={0.8}
                onPress={() => onLink(active.ctaUrl || config.ctaUrl)}>
                <Text style={styles.ctaText}>{active.ctaText || config.ctaText}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </ImageBackground>

      {banners.length > 1 && (
        <View style={styles.dots}>
          {banners.map((banner, dotIndex) => (
            <TouchableOpacity
              key={banner.id}
              onPress={() => setIndex(dotIndex)}
              hitSlop={8}>
              <View
                style={[
                  styles.dot,
                  dotIndex === index && { backgroundColor: theme.colors.primary },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Horizontal strip of the other slides so they stay reachable. */}
      {config.layout === 'multiple' && banners.length > 1 && (
        <View style={[styles.strip, { paddingHorizontal: gutter }]}>
          {banners.map(banner => (
            <TouchableOpacity
              key={banner.id}
              activeOpacity={0.85}
              onPress={() => onLink(banner.ctaUrl || config.ctaUrl)}
              style={styles.stripItem}>
              <Image
                source={{ uri: banner.image }}
                style={styles.stripImage}
                resizeMode="cover"
              />
              {!!banner.ctaText && <Text style={styles.stripText}>{banner.ctaText}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const HeroCardsWidget = ({ widget }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { gutter } = useWidgetLayout();
  const { onLink } = useWidgetActions();
  const { config } = widget;
  const placement = config.bannerPlacement ?? 'home_hero_cards';
  const limit = config.limit ?? 8;

  const { data: banners, loading } = useWidgetData<StoreBanner[]>(
    () => fetchBanners(placement),
    [placement],
    [],
  );

  if (loading && banners.length === 0) return <View style={styles.loaderBox} />;
  if (!banners.length) return null;

  return (
    <View style={[styles.section, { paddingHorizontal: gutter }]}>
      {config.showTitle !== false && !!config.heading && (
        <Text style={[styles.sectionTitle, { paddingHorizontal: 0 }]}>{config.heading}</Text>
      )}
      <View style={styles.cardRow}>
        {banners.slice(0, limit).map(banner => (
          <TouchableOpacity
            key={banner.id}
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => onLink(banner.ctaUrl || config.ctaUrl)}>
            <ImageBackground
              source={{ uri: banner.image }}
              style={styles.cardImage}
              imageStyle={{ borderRadius: 12 }}>
              <View style={styles.cardFooter}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {banner.title}
                </Text>
                {!!(banner.ctaText || config.ctaText) && (
                  <View style={styles.cardCta}>
                    <Text style={styles.cardCtaText}>
                      {banner.ctaText || config.ctaText} →
                    </Text>
                  </View>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;
  return StyleSheet.create({
    section: { marginBottom: 20 },
    sectionTitle: {
      fontSize: 18,
      letterSpacing: -0.2,
      color: colors.primary,
      fontFamily: FONTS.inter28Bold,
      marginBottom: 10,
    },
    loaderBox: { marginBottom: 20 },
    slide: {
      width: '100%',
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    overlay: {
      padding: 16,
      backgroundColor: colors.overlay,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      width: '100%',
    },
    slideTitle: {
      color: colors.textOnPrimary,
      fontSize: 15,
      fontFamily: FONTS.poppinsBold,
    },
    slideSubtitle: {
      color: colors.textOnPrimary,
      fontSize: 12,
      marginTop: 2,
      fontFamily: fontFamily.regular,
    },
    offerPill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.discount,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginTop: 6,
    },
    offerPillText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
    cta: {
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 16,
      marginTop: 10,
      alignSelf: 'flex-start',
    },
    ctaText: {
      color: colors.textOnPrimary,
      fontSize: 12,
      fontFamily: FONTS.poppinsBold,
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    strip: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
    },
    stripItem: {
      width: 110,
    },
    stripImage: {
      width: 110,
      height: 140,
      borderRadius: 12,
    },
    stripText: {
      marginTop: 4,
      fontSize: 11,
      color: colors.text,
      fontFamily: fontFamily.medium,
    },
    cardRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 10,
    },
    card: {
      width: '47.8%',
    },
    cardImage: {
      width: '100%',
      height: 170,
      justifyContent: 'flex-end',
    },
    cardFooter: {
      padding: 8,
      backgroundColor: colors.overlay,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
    },
    cardTitle: {
      color: colors.textOnPrimary,
      fontSize: 11,
      fontFamily: fontFamily.medium,
    },
    // The card's "By Now →" line. It is a pill rather than plain caption text
    // so it stays legible on the dark image scrim: a brand-filled surface with
    // contrast-aware ink, lifted slightly off the footer to read as a button.
    cardCta: {
      alignSelf: 'flex-start',
      marginTop: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.primary,
      shadowColor: '#000000',
      shadowOpacity: 0.25,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    cardCtaText: {
      color: colors.textOnPrimary,
      fontSize: 10,
      fontWeight: '700',
    },
  });
};

export { BannerWidget, HeroCardsWidget };
export default BannerWidget;
