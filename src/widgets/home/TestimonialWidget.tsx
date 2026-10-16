/**
 * `product_testimonial` — two independent blocks on one section:
 *
 *   customer reviews — `website.testimonials` where `visibility === 'live'`,
 *                      newest first. Rendered as a snapping carousel so a store
 *                      with one review and a store with fifty both read well.
 *   support strip    — when any of helpTitle / supportTitle / connectTitle /
 *                      downloadTitle is filled in. Renders call, email, store
 *                      links and social handles straight from the config.
 *
 * Reviews sit *above* the support strip, which is the last block on the feed.
 */

import React, { useMemo } from 'react';
import { FONTS } from '../../constants/fonts';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import type { AppTheme } from '../../theme/types';
import { useSelector } from 'react-redux';
import { selectTestimonials } from '../../storefront/selectors';
import type { StoreTestimonial, StoreWidget } from '../../storefront/types';
import { Stars, useWidgetLayout } from '../common';

type Props = { widget: StoreWidget };

// ─── Reviews ───────────────────────────────────────────────────────────────────

/** Width of a review card in the carousel, and the gap between cards. */
const REVIEW_CARD_WIDTH = 262;
const REVIEW_GAP = 12;

/** Only the reviews a shopper can actually read are worth a carousel slot. */
const isUsable = (item: StoreTestimonial) =>
  !!(item.name?.trim() || item.quote?.trim() || item.review?.trim());

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `2026-09-24T00:00:00.000Z` → `24 Sep 2026`. Returns `''` for junk dates. */
const formatReviewDate = (value?: string): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

/** Newest first, so the freshest review leads once the list grows. */
const byNewest = (a: StoreTestimonial, b: StoreTestimonial) => {
  const left = new Date(a.reviewDate).getTime();
  const right = new Date(b.reviewDate).getTime();
  if (Number.isNaN(left) && Number.isNaN(right)) return 0;
  if (Number.isNaN(left)) return 1;
  if (Number.isNaN(right)) return -1;
  return right - left;
};

const ReviewCard = ({ item, styles }: { item: StoreTestimonial; styles: ReturnType<typeof createStyles> }) => {
  const quote = (item.quote || item.review || '').trim();
  const date = formatReviewDate(item.reviewDate);
  const initials = item.name?.trim()?.[0]?.toUpperCase() ?? '★';

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        {item.profilePicture ? (
          <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{initials}</Text>
          </View>
        )}
        <View style={styles.reviewWho}>
          <Text style={styles.reviewName} numberOfLines={1}>
            {item.name || 'Verified buyer'}
          </Text>
          {!!item.city && (
            <Text style={styles.reviewCity} numberOfLines={1}>
              {item.city}
            </Text>
          )}
        </View>
        <Stars rating={item.rating} size={12} />
      </View>

      {!!quote && (
        <Text style={styles.reviewQuote} numberOfLines={5}>
          {quote}
        </Text>
      )}

      {item.productImages?.length ? (
        <Image
          source={{ uri: item.productImages[0] }}
          style={styles.reviewProduct}
          resizeMode="cover"
        />
      ) : null}

      {!!date && <Text style={styles.reviewDate}>{date}</Text>}
    </View>
  );
};

const ReviewsSection = ({
  items,
  styles,
}: {
  items: StoreTestimonial[];
  styles: ReturnType<typeof createStyles>;
}) => {
  const { width, gutter } = useWidgetLayout();

  const reviews = useMemo(() => items.filter(isUsable).sort(byNewest), [items]);

  const { average, count } = useMemo(() => {
    const rated = reviews.filter(item => item.rating > 0);
    const total = rated.reduce((sum, item) => sum + item.rating, 0);
    return {
      average: rated.length ? total / rated.length : 0,
      count: reviews.length,
    };
  }, [reviews]);

  // One review has no peer to scroll to, so it takes the full row instead of
  // sitting in a 262px card with dead space beside it.
  const cardWidth = count === 1 ? width - gutter * 2 : REVIEW_CARD_WIDTH;

  if (!count) return null;

  const title = 'What customers say';

  return (
    <View style={[styles.section, { paddingHorizontal: gutter }]}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.ratingBar}>
        <Text style={styles.ratingValue}>{average ? average.toFixed(1) : '—'}</Text>
        <View style={styles.ratingDetail}>
          <Stars rating={average} size={13} />
          <Text style={styles.ratingCount}>
            {count === 1 ? '1 review' : `${count} reviews`}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + REVIEW_GAP}
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={styles.reviewContent}>
        {reviews.map(item => (
          <View key={item.id} style={{ width: cardWidth }}>
            <ReviewCard item={item} styles={styles} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// ─── Widget ────────────────────────────────────────────────────────────────────

const TestimonialWidget = (_props: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const testimonials = useSelector(selectTestimonials);

  return <ReviewsSection items={testimonials} styles={styles} />;
};

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;
  return StyleSheet.create({
    section: {
      marginBottom: 22,
    },
    title: {
      fontSize: 18,
      letterSpacing: -0.2,
      color: colors.primary,
      fontFamily: FONTS.inter28Bold,
      marginBottom: 12,
    },
    ratingBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },
    ratingValue: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
    },
    ratingDetail: { gap: 2 },
    ratingCount: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: fontFamily.regular,
    },

    reviewContent: { gap: REVIEW_GAP, paddingRight: 8 },
    reviewCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
    },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatar: { width: 34, height: 34, borderRadius: 17 },
    avatarFallback: {
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
      fontFamily: FONTS.poppinsBold,
    },
    reviewWho: { flex: 1 },
    reviewName: { fontSize: 13, color: colors.text, fontFamily: FONTS.poppinsBold },
    reviewCity: { fontSize: 10, color: colors.textMuted },
    reviewQuote: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.textSecondary,
      marginTop: 8,
      fontFamily: fontFamily.regular,
    },
    reviewProduct: { width: '100%', height: 110, borderRadius: 10, marginTop: 10 },
    reviewDate: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 8,
      fontFamily: fontFamily.regular,
    },
  });
};

export default TestimonialWidget;
