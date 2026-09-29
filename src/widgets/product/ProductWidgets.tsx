/**
 * Product / out-of-stock page widgets.
 *
 * Every one of these reads its own labels and rules from the widget config, so
 * the admin can rename "Size" → "Choose your size", make a picker optional,
 * zoom the gallery or add a WhatsApp notify button without a release.
 *
 * `customisationFlow` (sizeEnabled / colourEnabled / showWhatsappBag) is
 * honoured by the registry — a disabled picker is never rendered, even if a
 * stale widget definition is still marked `live`.
 */

import React, { useState } from 'react';
import { FONTS } from '../../constants/fonts';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import type { AppTheme } from '../../theme/types';
import { useSelector } from 'react-redux';
import { selectFeatures, selectSupportContact } from '../../storefront/selectors';
import type { StoreWidget } from '../../storefront/types';
import { Stars, useWidgetActions, useWidgetLayout } from '../common';

type Props = {
  widget: StoreWidget;
  product?: ProductWidgetProduct | undefined;
};

/** The minimum product shape the widgets need — the PDP passes its own object. */
export interface ProductWidgetProduct {
  id: string;
  name: string;
  productCode?: string;
  slug?: string;
  image?: string;
  images?: string[];
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  sizes?: string[];
  colors?: string[];
  isOutOfStock?: boolean;
  selectedSize?: string | null;
  selectedColor?: string | null;
  onSelectSize?: (size: string) => void;
  onSelectColor?: (color: string) => void;
}

// ─── product_media ─────────────────────────────────────────────────────────────

const ProductMediaWidget = ({ widget, product }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { gutter, width } = useWidgetLayout();
  const { config } = widget;
  const images = product?.images?.length
    ? product.images
    : product?.image
    ? [product.image]
    : [];

  const [index, setIndex] = useState(0);
  if (!product || !images.length) return null;

  const isCarousel = (config.layoutStyle ?? widget.layout) === 'carousel' || images.length > 1;

  return (
    <View style={[styles.section, { paddingHorizontal: gutter }]}>
      <ScrollView
        horizontal={isCarousel}
        pagingEnabled={!isCarousel}
        showsHorizontalScrollIndicator={isCarousel}
        onMomentumScrollEnd={
          isCarousel
            ? event =>
                setIndex(
                  Math.round(
                    event.nativeEvent.contentOffset.x /
                      Math.max(event.nativeEvent.layoutMeasurement.width, 1),
                  ),
                )
            : undefined
        }>
        {images.map((uri, imageIndex) => (
          <Image
            key={`${uri}-${imageIndex}`}
            source={{ uri }}
            style={[
              styles.media,
              isCarousel ? { width: width - gutter * 2 } : { width: '100%' },
            ]}
            resizeMode={config.zoomEnabled ? 'contain' : 'cover'}
          />
        ))}
      </ScrollView>

      {isCarousel && images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, dotIndex) => (
            <View
              key={dotIndex}
              style={[
                styles.dot,
                dotIndex === index && { backgroundColor: theme.colors.primary },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// ─── product_title ─────────────────────────────────────────────────────────────

const ProductTitleWidget = ({ widget, product }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { gutter } = useWidgetLayout();
  const { config } = widget;
  if (!product) return null;

  return (
    <View style={[styles.section, { paddingHorizontal: gutter }]}>
      {config.showTitle !== false && (
        <Text style={styles.name}>{product.name}</Text>
      )}
      {config.showSku === true && !!product.productCode && (
        <Text style={styles.sku}>{product.productCode}</Text>
      )}
      {config.showRating === true && (product.rating ?? 0) > 0 && (
        <View style={styles.ratingRow}>
          <Stars rating={product.rating ?? 0} size={12} />
          {!!product.reviews && (
            <Text style={styles.reviews}>({product.reviews})</Text>
          )}
        </View>
      )}
    </View>
  );
};

// ─── product_size_picker ───────────────────────────────────────────────────────

const ProductSizePickerWidget = ({ widget, product }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { gutter } = useWidgetLayout();
  const { config } = widget;
  const features = useSelector(selectFeatures);

  if (!product || !features.sizeEnabled || !product.sizes?.length) return null;

  return (
    <View style={[styles.section, { paddingHorizontal: gutter }]}>
      {config.showTitle !== false && (
        <Text style={styles.pickerTitle}>
          {config.label ?? 'Size'}
          {config.required ? ' *' : ''}
        </Text>
      )}
      <View style={styles.chipRow}>
        {product.sizes.map(size => {
          const selected = product.selectedSize === size;
          return (
            <TouchableOpacity
              key={size}
              activeOpacity={0.75}
              style={[
                styles.chip,
                selected && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
              ]}
              onPress={() => product.onSelectSize?.(size)}>
              <Text
                style={[
                  styles.chipText,
                  selected && { color: theme.colors.primary, fontWeight: '700' },
                ]}>
                {size}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── product_colour_picker ─────────────────────────────────────────────────────

const ProductColourPickerWidget = ({ widget, product }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { gutter } = useWidgetLayout();
  const { config } = widget;
  const features = useSelector(selectFeatures);

  if (!product || !features.colourEnabled || !product.colors?.length) return null;

  return (
    <View style={[styles.section, { paddingHorizontal: gutter }]}>
      {config.showTitle !== false && (
        <Text style={styles.pickerTitle}>
          {config.label ?? 'Colour'}
          {config.required ? ' *' : ''}
        </Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipRow}>
          {product.colors.map(color => {
            const selected = product.selectedColor === color;
            return (
              <TouchableOpacity
                key={color}
                activeOpacity={0.75}
                style={[
                  styles.chip,
                  selected && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
                ]}
                onPress={() => product.onSelectColor?.(color)}>
                <Text
                  style={[
                    styles.chipText,
                    selected && { color: theme.colors.primary, fontWeight: '700' },
                  ]}>
                  {color}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

// ─── wa_reply_and_bag ──────────────────────────────────────────────────────────

const WhatsAppBagWidget = ({ widget, product }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { gutter } = useWidgetLayout();
  const { run } = useWidgetActions();
  const { config } = widget;
  const features = useSelector(selectFeatures);
  const support = useSelector(selectSupportContact);

  if (!product || !features.showWhatsappBag) return null;

  const number = (config.whatsappNumber || support.whatsapp || '').replace(/\D/g, '');
  const message = encodeURIComponent(
    `${product.name}${product.productCode ? ` (${product.productCode})` : ''} — notify me when available`,
  );

  return (
    <View style={[styles.section, { paddingHorizontal: gutter }]}>
      {config.showTitle !== false && !!config.heading && (
        <Text style={styles.pickerTitle}>{config.heading}</Text>
      )}

      <TouchableOpacity
        style={styles.primaryCta}
        activeOpacity={0.85}
        onPress={() => {
          if (number) {
            Linking.openURL(`https://wa.me/${number}?text=${message}`).catch(() => undefined);
          }
        }}>
        <Text style={styles.primaryCtaText}>{config.ctaText ?? 'Notify me on WhatsApp'}</Text>
      </TouchableOpacity>

      {config.showBagLink === true && (
        <TouchableOpacity
          style={styles.secondaryCta}
          activeOpacity={0.85}
          onPress={() => run({ type: 'stack', screen: 'CartScreen' })}>
          <Text style={styles.secondaryCtaText}>Go to Bag</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;
  return StyleSheet.create({
    section: { marginBottom: 16 },
    media: { height: 320, borderRadius: 14, marginRight: 8 },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
    name: { fontSize: 17, color: colors.text, fontFamily: FONTS.poppinsBold, lineHeight: 24 },
    sku: { fontSize: 11, color: colors.textMuted, marginTop: 4, fontFamily: fontFamily.regular },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    reviews: { fontSize: 11, color: colors.textMuted },
    pickerTitle: {
      fontSize: 13,
      color: colors.text,
      fontFamily: FONTS.poppinsBold,
      marginBottom: 8,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: colors.surface,
    },
    chipText: { fontSize: 12, color: colors.textSecondary, fontFamily: fontFamily.medium },
    primaryCta: {
      backgroundColor: theme.colors.success,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    primaryCtaText: { color: '#FFFFFF', fontSize: 13, fontFamily: FONTS.poppinsBold },
    secondaryCta: {
      marginTop: 10,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    secondaryCtaText: { color: colors.primary, fontSize: 13, fontFamily: FONTS.poppinsBold },
  });
};

export {
  ProductMediaWidget,
  ProductTitleWidget,
  ProductSizePickerWidget,
  ProductColourPickerWidget,
  WhatsAppBagWidget,
};
