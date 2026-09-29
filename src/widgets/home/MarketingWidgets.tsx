/**
 * Banner-driven marketing widgets.
 *
 *   girls_boys_fashion — pulls the `home_girls_fashion` + `home_boys_fashion`
 *                        banner placements as two category cards.
 *   party_poster       — pulls the `home_party_poster` placement (typically a
 *                        poster strip with an offer badge).
 *   fashion_section    — fully bespoke gallery: two rows of image/text tiles
 *                        plus a CTA. All copy and imagery comes from `config`.
 */

import React, { useEffect, useRef, useState } from 'react';
import { FONTS } from '../../constants/fonts';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import type { AppTheme } from '../../theme/types';
import { fetchBanners, type StoreBanner } from '../../storefront/catalog';
import { SHOP_ALL_CATEGORY } from '../../storefront/links';
import type { GalleryItem, StoreWidget } from '../../storefront/types';
import { useWidgetActions, useWidgetData, useWidgetLayout } from '../common';

type Props = { widget: StoreWidget };

// ─── Girls & Boys fashion ──────────────────────────────────────────────────────

const FASHION_PLACEMENTS = ['home_girls_fashion', 'home_boys_fashion'] as const;

/** Label for the CTA that closes the pair of cards, overridable from `config`. */
const PAIR_CTA_LABEL = 'Shop Now';

const GirlsBoysFashionWidget = ({ widget }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { gutter } = useWidgetLayout();
  const { onLink, run } = useWidgetActions();
  const { config } = widget;

  const { data: banners, loading } = useWidgetData<StoreBanner[]>(
    async () => {
      const groups = await Promise.all(
        FASHION_PLACEMENTS.map(placement => fetchBanners(placement)),
      );
      return groups.flat();
    },
    [],
    [],
  );

  // The two cards are the teaser, so the section closes on a CTA that opens the
  // whole catalogue — the same listing the drawer's "Shop Now" produces. A
  // `ctaUrl` from the backend still wins, so an admin can point it elsewhere
  // without a release.
  const handleShopNow = () => {
    if (config.ctaUrl) {
      onLink(config.ctaUrl);
      return;
    }
    run({ type: 'category', category: SHOP_ALL_CATEGORY });
  };

  const ctaLabel =
    typeof config.ctaText === 'string' && config.ctaText.trim()
      ? config.ctaText.trim()
      : PAIR_CTA_LABEL;

  if (loading && banners.length === 0) return null;
  if (!banners.length) return null;

  const cards = FASHION_PLACEMENTS.map((_, index) => banners[index]).filter(Boolean);
  if (!cards.length) return null;

  return (
    <View style={[styles.section, { paddingHorizontal: gutter }]}>
      {config.showTitle !== false && !!config.heading && (
        <Text style={styles.title}>{config.heading}</Text>
      )}
      <View style={styles.pairRow}>
        {cards.map(banner => (
          <View key={banner.id} style={styles.pairCard}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onLink(banner.ctaUrl || config.ctaUrl)}>
              <ImageBackground
                source={{ uri: banner.image }}
                style={styles.pairImage}>
                <View style={styles.pairFooter}>
                  <Text style={styles.pairTitle} numberOfLines={1}>
                    {banner.title}
                  </Text>

                  <TouchableOpacity
                    style={styles.pairCta}
                    activeOpacity={0.8}
                    onPress={handleShopNow}>
                    <Text style={styles.pairCtaText}>{ctaLabel}</Text>
                  </TouchableOpacity>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Party poster ──────────────────────────────────────────────────────────────

const PartyPosterWidget = ({ widget }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { gutter } = useWidgetLayout();
  const { onLink } = useWidgetActions();
  const { config } = widget;

  const { data: banners, loading } = useWidgetData<StoreBanner[]>(
    () => fetchBanners('home_party_poster'),
    [],
    [],
  );

  if (loading && banners.length === 0) return null;
  if (!banners.length) return null;

  return (
    <View style={[styles.section, { paddingHorizontal: gutter }]}>
      {config.showTitle !== false && !!config.heading && (
        <Text style={styles.title}>{config.heading}</Text>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.posterContent}>
        {banners.map(banner => (
          <TouchableOpacity
            key={banner.id}
            activeOpacity={0.85}
            style={styles.posterCard}
            onPress={() => onLink(banner.ctaUrl || config.ctaUrl)}>
            <Image source={{ uri: banner.image }} style={styles.posterImage} resizeMode="cover" />
            {!!banner.offerPercent && (
              <View style={[styles.posterBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.posterBadgeText}>{banner.offerPercent}% OFF</Text>
              </View>
            )}
            <Text numberOfLines={1} style={styles.posterTitle}>
              {banner.title}
            </Text>
            {!!banner.ctaText && (
              <View style={styles.posterCta}>
                <Text style={styles.posterCtaText}>{banner.ctaText} →</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// ─── Fashion section ───────────────────────────────────────────────────────────

const GalleryTile = ({
  item,
  styles,
}: {
  item: GalleryItem;
  styles: ReturnType<typeof createStyles>;
}) => (
  <View
    style={[
      styles.galleryTile,
      item.bg && item.bg !== 'gradient'
        ? { backgroundColor: item.bg }
        : styles.galleryTileFallback,
    ]}>
    {item.type === 'image' && item.src ? (
      <Image source={{ uri: item.src }} style={styles.galleryImage} resizeMode="cover" />
    ) : (
      <View style={styles.galleryTextWrap}>
        <Text style={styles.galleryText}>{item.text}</Text>
        {item.hasStars && <Text style={styles.galleryStars}>★ ★ ★</Text>}
      </View>
    )}
  </View>
);

/**
 * Marquee speed, in pixels per second.
 *
 * This deliberately runs on the native driver. The first version stepped the
 * row with `setInterval` + `scrollTo` — 20 times a second per row, ~40 animated
 * scroll calls a second across the page. That is enough JS work per frame to
 * starve the touch pipeline: the Home tab header's location, notification and
 * bag buttons stopped responding to taps, with no error and no redbox, because
 * the taps never got dispatched. Slowing the interval down did not fix it —
 * any continuous JS-driven `scrollTo` did it. An `Animated.loop` with
 * `useNativeDriver` does the same motion entirely on the native thread, so the
 * JS thread is idle and touches are delivered as normal.
 */
const MARQUEE_SPEED = 60;

const GalleryRow = ({ items, speed = MARQUEE_SPEED }: { items?: GalleryItem[]; speed?: number }) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const offset = useRef(new Animated.Value(0)).current;
  const [loopWidth, setLoopWidth] = useState(0);

  // The two copies sit side by side inside one animated container, so moving
  // the container by exactly one track width lands the second copy precisely
  // where the first one started. Restarting from 0 there is pixel-identical to
  // having carried on, which is what makes the loop seamless.
  useEffect(() => {
    if (!loopWidth) return undefined;

    const animation = Animated.loop(
      Animated.timing(offset, {
        toValue: -loopWidth,
        duration: (loopWidth / speed) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();

    return () => {
      animation.stop();
      offset.setValue(0);
    };
  }, [loopWidth, speed, offset]);

  if (!items?.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEnabled={false}
      contentContainerStyle={styles.galleryContent}>
      {/* `flexDirection: 'row'` is load-bearing. Without it this container
          defaults to a column and the two copies stack one under the other
          instead of running side by side, which is what made a 2-item row look
          like two stacked duplicate lists. */}
      <Animated.View style={[styles.galleryLoop, { transform: [{ translateX: offset }] }]}>
        {[0, 1].map(copy => (
          <View
            key={copy}
            style={styles.galleryTrack}
            onLayout={
              copy === 0 ? event => setLoopWidth(event.nativeEvent.layout.width) : undefined
            }>
            {items.map((item, index) => (
              <GalleryTile key={`${copy}-${index}`} item={item} styles={styles} />
            ))}
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  );
};

const FashionSectionWidget = ({ widget }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { gutter } = useWidgetLayout();
  const { onLink } = useWidgetActions();
  const { config } = widget;

  const heading = config.heading || widget.title;
  if (!heading && !config.galleryRow1?.length && !config.galleryRow2?.length) return null;

  return (
    <View style={[styles.section, { paddingHorizontal: gutter }]}>
      <View
        style={[
          styles.fashionCard,
          { backgroundColor: config.backgroundColor || theme.colors.surfaceVariant },
        ]}>
        {(config.showTitle !== false && !!heading) || !!config.body ? (
          <View style={styles.fashionHeader}>
            {config.showTitle !== false && !!heading && (
              <Text style={styles.fashionTitle}>
                {heading}
                {!!config.headingLine2 ? `\n${config.headingLine2}` : ''}
              </Text>
            )}
            {!!config.body && <Text style={styles.fashionBody}>{config.body}</Text>}
          </View>
        ) : null}

        <GalleryRow items={config.galleryRow1} speed={60} />
        <GalleryRow items={config.galleryRow2} speed={80} />

        {!!config.ctaText && (
          <TouchableOpacity
            style={styles.cta}
            activeOpacity={0.8}
            onPress={() => onLink(config.ctaUrl)}>
            <Text style={styles.ctaText}>{config.ctaText}</Text>
          </TouchableOpacity>
        )}
      </View>
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
    pairRow: { flexDirection: 'row', gap: 10 },
    pairCard: { flex: 1 },
    // The radius has to live on the container, not the image: `imageStyle`
    // only clips the bitmap, so the dark footer overlay kept painting square
    // corners past the rounded edge — the "shadow" under each card. Clipping
    // here is what makes the footer follow the card's corners.
    pairImage: {
      height: 190,
      justifyContent: 'flex-end',
      borderRadius: 12,
      overflow: 'hidden',
    },
    pairFooter: {
      paddingHorizontal: 8,
      paddingBottom: 8,
      paddingTop: 6,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pairTitle: { color: colors.textOnPrimary, fontSize: 12, fontFamily: fontFamily.medium },
    pairCta: {
      marginTop: 4,
      paddingHorizontal: 16,
      paddingVertical: 4,
      borderRadius: 14,
      backgroundColor: colors.primary,
    },
    pairCtaText: {
      color: colors.textOnPrimary,
      fontSize: 11,
      lineHeight: 16,
      fontFamily: FONTS.poppinsBold,
    },
    posterContent: { gap: 10, paddingRight: 8 },
    posterCard: { width: 150 },
    posterImage: { width: 150, height: 200, borderRadius: 12 },
    posterBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
    },
    posterBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
    posterTitle: { fontSize: 12, color: colors.text, marginTop: 6, fontFamily: fontFamily.medium },
    // Same pill as the hero cards in `BannerWidget` so a poster reads the same
    // as a hero tile: brand-filled surface, contrast-aware ink, slight lift.
    posterCta: {
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
    posterCtaText: {
      fontSize: 11,
      color: colors.textOnPrimary,
      fontWeight: '700',
    },
    fashionCard: { borderRadius: 18, padding: 14 },
    fashionHeader: { marginBottom: 12 },
    fashionTitle: {
      fontSize: 20,
      lineHeight: 26,
      color: colors.text,
      fontFamily: FONTS.inter28Bold,
      letterSpacing: 0.5,
    },
    fashionBody: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.textSecondary,
      marginTop: 6,
      fontFamily: fontFamily.regular,
    },
    // Padding on *both* sides keeps the leading tile off the viewport edge, so
    // the first and last item are never sliced by the scroll window. The two
    // copies carry their own gap, so the seam between them is the same 10px as
    // between any two tiles — the loop has nothing to give away.
    // No `marginRight` here: the loop slides by exactly one track width, so any
    // margin added to the end of a track would be outside the measured width
    // and show up as a visible jump every wrap. The seam spacing comes from the
    // second copy's own `paddingLeft`, which *is* inside its measured width.
    galleryContent: { flexDirection: 'row', paddingBottom: 10 },
    galleryLoop: { flexDirection: 'row' },
    galleryTrack: { flexDirection: 'row', gap: 8, paddingLeft: 8 },
    galleryTile: {
      width: 130,
      height: 160,
      borderRadius: 12,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    galleryTileFallback: { backgroundColor: colors.surfaceVariant },
    galleryImage: { width: '100%', height: '100%' },
    galleryTextWrap: { padding: 10, alignItems: 'center' },
    galleryText: {
      fontSize: 11,
      textAlign: 'center',
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.4,
    },
    galleryStars: { marginTop: 6, fontSize: 12, color: colors.star },
    cta: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 9,
      borderRadius: 20,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    ctaText: { color: colors.textOnPrimary, fontSize: 13, fontFamily: FONTS.poppinsBold },
  });
};

export { GirlsBoysFashionWidget, PartyPosterWidget, FashionSectionWidget };
