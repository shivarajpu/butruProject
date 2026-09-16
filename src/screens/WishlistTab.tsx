import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ARROW_BACK_ICON, CHEVRON_DOWN_SVG } from '../assets/svg';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppIconButton from '../components/AppIconButton';
import BagIconButton from '../components/BagIconButton';
import { apiService } from '../api/apiService';

const LOCATION_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#B8235A"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
const HEART_PINK_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#B8235A"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

const WISHLIST_ENDPOINT = '/api/storefront/wishlist';

interface WishlistProduct {
  _id: string;
  storeId: string;
  name: string;
  productCode?: string;
  images?: string[];
  isVisible?: boolean;
  isOutOfStock?: boolean;
  price?: number;
  totalInventory?: number;
  id: string;
}

interface WishlistItem {
  productId: string;
  addedAt: string;
  product: WishlistProduct;
}

interface WishlistData {
  items: WishlistItem[];
  count: number;
}

interface WishlistResponse {
  success: boolean;
  data: WishlistData;
}

interface WishlistCardItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  reviews?: number;
  image: string;
  sizes: string[];
  tag?: string;
}

const mapWishlistItem = (item: WishlistItem): WishlistCardItem => {
  const product = item.product ?? ({} as WishlistProduct);
  const price = product.price ?? 0;

  return {
    id: product.id ?? item.productId,
    name: product.name ?? 'Product',
    price,
    originalPrice: price,
    image: product.images?.[0] ?? '',
    sizes: [],
  };
};

const WishlistScreen = () => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();

  const [items, setItems] = useState<WishlistCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isTablet = width >= 768;
  const hPad = 16;
  const gap = 12;
  const numCols = isTablet ? 3 : 2;
  const cardW = (width - hPad * 2 - gap * (numCols - 1)) / numCols;
  const dynamicTopPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

  const fetchWishlist = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiService.get<WishlistResponse>(WISHLIST_ENDPOINT);

      if (!response.success) {
        setItems([]);
        return;
      }

      setItems((response.data?.items ?? []).map(mapWishlistItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [])
  );

  const removeItem = async (id: string) => {
    try {
      await apiService.delete(`/api/storefront/wishlist/items/${id}`);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch {
      // Leave item in list if server removal fails
    }
  };

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleAddToCart = (product: any) => {
    navigation.navigate('ProductDetails', { product });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={[styles.container, { paddingTop: dynamicTopPadding }]}>
        
        {/* ── Top Header ── */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <AppIconButton
              style={styles.headerBtn}
              icon={<SvgXml xml={ARROW_BACK_ICON} width={15} height={15} />}
              accessibilityLabel="Go back"
              onPress={handleBackPress}
            />

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Wishlist</Text>
              <View style={styles.deliveryRow}>
                <SvgXml xml={LOCATION_SVG} width={12} height={12} />
                <Text style={styles.deliveryText}> Delivering to Home </Text>
                <SvgXml xml={CHEVRON_DOWN_SVG} width={15} height={15} />
              </View>
            </View>
          </View>

          <BagIconButton />
        </View>

        {/* ── Product List ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: hPad,
            paddingTop: 12,
            paddingBottom: 40,
          }}>
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyMessage}>{error}</Text>
              <AppButton
                style={styles.retryBtn}
                textStyle={styles.retryBtnText}
                size="sm"
                label="Try Again"
                onPress={fetchWishlist}
              />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyTitle}>No items in your wishlist</Text>
              <Text style={styles.emptyMessage}>
                Tap the heart icon on any product to save it here.
              </Text>
            </View>
          ) : (
          <View style={styles.grid}>
            {items.map(item => {
              const imgH = cardW * 1.05;
              const hasOriginalPrice =
                item.originalPrice != null && item.originalPrice > item.price;

              return (
                <AppCard
                  key={item.id}
                  elevated={false}
                  borderRadius={12}
                  style={[styles.wishCard, { width: cardW, marginBottom: gap }]}>
                  
                  {/* Image Container */}
                  <TouchableOpacity
                    style={{ position: 'relative' }}
                    activeOpacity={0.8}
                    onPress={() => handleAddToCart(item)}>
                    <Image
                      source={{ uri: item.image }}
                      style={{ width: '100%', height: imgH, borderRadius: 10 }}
                      resizeMode="cover"
                    />

                    {item.tag ? (
                      <View style={styles.tagBadge}>
                        <Text style={styles.tagText}>{item.tag}</Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      style={styles.heartBtn}
                      onPress={() => removeItem(item.id)}
                      activeOpacity={0.8}>
                      <SvgXml xml={HEART_PINK_SVG} width={16} height={16} />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.8} onPress={() => handleAddToCart(item)}>
                    <View style={styles.cardDetails}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.price}>₹{item.price}</Text>
                      {hasOriginalPrice && (
                        <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
                      )}
                      {hasOriginalPrice && item.discount ? (
                        <Text style={styles.discountText}>{item.discount}% OFF</Text>
                      ) : null}
                    </View>

                    {item.rating != null && item.rating > 0 ? (
                      <View style={styles.ratingRow}>
                        <Text style={styles.starText}>★★★★★</Text>
                        <Text style={styles.reviewCount}>({item.reviews})</Text>
                      </View>
                    ) : null}

                    {item.sizes.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.sizeContainer}>
                        {item.sizes.map((size, idx) => (
                          <View key={idx} style={styles.sizeChip}>
                            <Text style={styles.sizeText}>{size}</Text>
                          </View>
                        ))}
                      </ScrollView>
                    ) : null}

                    {/* Navigation only triggered here */}
                    <AppButton
                      style={styles.addToCartBtn}
                      textStyle={styles.addToCartText}
                      size="sm"
                      label="Add to Cart"
                      onPress={() => handleAddToCart(item)}
                    />
                    </View>
                  </TouchableOpacity>
                </AppCard>
              );
            })}
          </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;

  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  headerTitleContainer: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fontFamily.heading,
    color: colors.text,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  deliveryText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wishCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tagBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: colors.textOnPrimary,
    fontSize: 9,
    fontWeight: '600',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.surface,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: colors.text,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardDetails: {
    padding: 10,
  },
  itemName: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontFamily: fontFamily.heading,
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  discountText: {
    fontSize: 9,
    color: colors.discount,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  starText: {
    color: colors.star,
    fontSize: 11,
    letterSpacing: 1,
  },
  reviewCount: {
    fontSize: 10,
    color: colors.textMuted,
  },
  sizeContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  sizeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  sizeText: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  addToCartBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addToCartText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontFamily: fontFamily.bold,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fontFamily.bold,
    marginBottom: 6,
  },
  emptyMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: 20,
  },
  retryBtnText: {
    color: colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  });
};

export default WishlistScreen;
