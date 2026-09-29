/**
 * product_group — the workhorse widget.
 *
 * One component covers every product feed the backend can describe:
 *   config.source   → all | new_arrivals | popular | best_and_new | collection
 *   config.limit    → how many products
 *   layout          → grid | carousel | infinite | multiple
 *   config.showTitle / showViewAll / viewAllUrl / heading / subheading
 */

import React from 'react';
import { FONTS } from '../../constants/fonts';
import {
  ActivityIndicator,
  ScrollView,
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
import { fetchProductsForSource, type StoreProduct } from '../../storefront/catalog';
import { resolveProductSource } from '../../storefront/selectors';
import { useStoreConfig } from '../../storefront/useStorefront';
import type { StoreWidget } from '../../storefront/types';
import { useWishlist } from '../../hooks/useWishlist';
import {
  ProductTile,
  useWidgetActions,
  useWidgetData,
  useWidgetLayout,
} from '../common';

type Props = { widget: StoreWidget };

const ProductGroupWidget = ({ widget }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { gutter, tileWidth } = useWidgetLayout();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { onLink } = useWidgetActions();
  const config = useStoreConfig();
  const wishlist = useWishlist();

  const { config: widgetConfig } = widget;
  const source = resolveProductSource(widget);
  const limit = widgetConfig.limit ?? 12;
  const collectionId = widgetConfig.collectionId;
  const collections = config?.website?.collections ?? [];

  const { data: products, loading, error } = useWidgetData<StoreProduct[]>(
    () => fetchProductsForSource({ source, limit, collectionId, collections }),
    [source, limit, collectionId, collections.map(item => item.id).join(',')],
    [],
  );

  const heading = widgetConfig.heading || widget.title;
  // Opt-out, not opt-in: every other widget in the layer shows its heading
  // unless the config explicitly hides it. Gating on `=== true` here left most
  // product feeds rendering product tiles with no section label at all.
  const showHeading = widgetConfig.showTitle !== false && !!heading;
  const showViewAll = widgetConfig.showViewAll === true && !!widgetConfig.viewAllUrl;

  const openProduct = (product: StoreProduct) => {
    navigation.navigate('ProductDetails', { product });
  };

  const header = (showHeading || showViewAll) && (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        {showHeading && <Text style={styles.title}>{heading}</Text>}
        {!!widgetConfig.subheading && (
          <Text style={styles.subtitle}>{widgetConfig.subheading}</Text>
        )}
      </View>
      {showViewAll && (
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={8}
          onPress={() => onLink(widgetConfig.viewAllUrl)}>
          <Text style={styles.viewAll}>View all →</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && products.length === 0) {
    return (
      <View style={[styles.section, { paddingHorizontal: gutter }]}>
        {header}
        <View style={styles.loaderBox}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (error && products.length === 0) {
    return (
      <View style={[styles.section, { paddingHorizontal: gutter }]}>
        {header}
        <Text style={styles.emptyText}>{error}</Text>
      </View>
    );
  }

  if (products.length === 0) return null;

  const isCarousel = widget.layout === 'carousel' || widget.layout === 'infinite';

  return (
    <View style={[styles.section, { paddingHorizontal: gutter }]}>
      {header}

      {isCarousel ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}>
          {products.map(product => (
            <ProductTile
              key={product.id}
              product={product}
              width={tileWidth}
              wished={wishlist.isWishlisted(product.id)}
              onToggleWishlist={() => wishlist.toggle(product.id)}
              onPress={() => openProduct(product)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.grid}>
          {products.map(product => (
            <ProductTile
              key={product.id}
              product={product}
              width={tileWidth}
              wished={wishlist.isWishlisted(product.id)}
              onToggleWishlist={() => wishlist.toggle(product.id)}
              onPress={() => openProduct(product)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;
  return StyleSheet.create({
    section: { marginBottom: 22 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      letterSpacing: -0.2,
      color: colors.primary,
      fontFamily: FONTS.inter28Bold,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 3,
      fontFamily: fontFamily.regular,
    },
    viewAll: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: fontFamily.medium,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    carouselContent: {
      gap: 12,
      paddingRight: 8,
    },
    loaderBox: {
      paddingVertical: 26,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      fontFamily: fontFamily.regular,
    },
  });
};

export default ProductGroupWidget;
