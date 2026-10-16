/**
 * Banner widgets — `banner_cross_link` (hero slider) and `hero_cards`.
 *
 * Data comes from `/api/storefront/banners?placement=<config.bannerPlacement>`,
 * so adding or removing slides never requires a release.
 */

import React, { useEffect, useRef, useState } from 'react';
import { FONTS } from '../../constants/fonts';
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const offsetRef = useRef(0);
  const draggingRef = useRef(false);
  const restartRef = useRef<() => void>(() => {});

  const pageWidth = measuredWidth || width;

  useEffect(() => {
    if (banners.length < 2 || pageWidth <= 0) return undefined;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const advance = () => {
      if (draggingRef.current) return;
      let page = Math.round(offsetRef.current / pageWidth);
      if (page >= banners.length) {
        scrollRef.current?.scrollTo({ x: 0, animated: false });
        offsetRef.current = 0;
        page = 0;
      }
      scrollRef.current?.scrollTo({ x: (page + 1) * pageWidth, animated: true });
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        advance();
        schedule();
      }, AUTO_SCROLL_MS);
    };

    restartRef.current = schedule;
    schedule();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [banners.length, pageWidth]);

  if (loading && banners.length === 0) {
    return <View style={[styles.loaderBox, { height }]} />;
  }
  if (!banners.length) return null;

  const align =
    config.titleAlignment === 'left'
      ? 'flex-start'
      : config.titleAlignment === 'right'
      ? 'flex-end'
      : 'center';

  // The last slide is followed by a clone of the first so the auto-scroll can
  // keep moving forward forever; the clone snaps back to the real first page
  // as soon as the scroll settles.
  const slides = banners.length > 1 ? [...banners, banners[0]] : banners;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetRef.current = event.nativeEvent.contentOffset.x;
    if (pageWidth <= 0 || banners.length === 0) return;
    const current = Math.round(offsetRef.current / pageWidth) % banners.length;
    setIndex(previous => (previous === current ? previous : current));
  };

  const handleScrollBeginDrag = () => {
    draggingRef.current = true;
  };

  const handleScrollEndDrag = () => {
    draggingRef.current = false;
    restartRef.current();
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = pageWidth > 0 ? Math.round(offsetX / pageWidth) : 0;
    if (page >= banners.length) {
      offsetRef.current = 0;
      scrollRef.current?.scrollTo({ x: 0, animated: false });
      setIndex(0);
    } else {
      offsetRef.current = offsetX;
      setIndex(page % banners.length);
    }
    draggingRef.current = false;
    restartRef.current();
  };

  const goTo = (dotIndex: number) => {
    offsetRef.current = dotIndex * pageWidth;
    setIndex(dotIndex);
    scrollRef.current?.scrollTo({ x: offsetRef.current, animated: true });
    restartRef.current();
  };

  return (
    <View
      style={{ marginBottom: 20 }}
      onLayout={event => {
        const layoutWidth = event.nativeEvent.layout.width;
        if (layoutWidth > 0 && layoutWidth !== measuredWidth) {
          setMeasuredWidth(layoutWidth);
        }
      }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumEnd}>
        {slides.map((banner, slideIndex) => {
          // Banners often carry only an image (the panel leaves the title as a
          // file name), so the caption strip is skipped when nothing to say.
          const hasCaption =
            !!banner.title ||
            !!banner.subtitle ||
            banner.offerPercent > 0 ||
            !!(banner.ctaText || config.ctaText);

          return (
            <View
              key={`${banner.id}-${slideIndex}`}
              style={{ width: pageWidth, height }}>
              <ImageBackground
                source={{ uri: banner.image }}
                style={[
                  styles.slide,
                  {
                    height,
                    backgroundColor:
                      config.backgroundColor || theme.colors.surfaceVariant,
                  },
                ]}
                imageStyle={{ borderRadius: 16 }}
                resizeMode={config.fitImage ? 'contain' : 'cover'}>
                {hasCaption ? (
                  <View style={[styles.overlay, { alignItems: align }]}>
                    {!!banner.title && (
                      <Text style={styles.slideTitle}>{banner.title}</Text>
                    )}
                    {!!banner.subtitle && (
                      <Text style={styles.slideSubtitle}>{banner.subtitle}</Text>
                    )}
                    {!!banner.offerPercent && (
                      <View style={styles.offerPill}>
                        <Text style={styles.offerPillText}>
                          {banner.offerPercent}% OFF
                        </Text>
                      </View>
                    )}
                    {(banner.ctaText || config.ctaText) && (
                      <TouchableOpacity
                        style={styles.cta}
                        activeOpacity={0.8}
                        onPress={() => onLink(banner.ctaUrl || config.ctaUrl)}>
                        <Text style={styles.ctaText}>
                          {banner.ctaText || config.ctaText}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}
              </ImageBackground>
            </View>
          );
        })}
      </ScrollView>

      {banners.length > 1 && (
        <View style={styles.dots}>
          {banners.map((banner, dotIndex) => (
            <TouchableOpacity
              key={banner.id}
              onPress={() => goTo(dotIndex)}
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
                      {banner.ctaText || config.ctaText}
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
