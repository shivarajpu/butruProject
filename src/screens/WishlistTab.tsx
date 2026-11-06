import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FONTS } from '../constants/fonts';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';

import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import type { TabParamList } from '../navigation/types';
import { useProfile, type Address, formatDeliveryLabel } from '../hooks/useProfile';
import AddressSelectionModal from '../components/AddressSelectionModal';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppIconButton from '../components/AppIconButton';
import BagIconButton from '../components/BagIconButton';
import AddAddressModal from '../components/AddAddressModal';
import { apiService } from '../api/apiService';
import { publishWishlistChange } from '../hooks/useWishlist';
import { BRAND } from '../assets/svg/brand';
import { SvgXml } from 'react-native-svg';
import { heartFilledSvg } from '../assets/svg';
import BrandIcon from '../components/BrandIcon';
import { useDispatch } from 'react-redux';
import { addItem as addCartItem } from '../store/slices/cartSlice';
import type { AppDispatch } from '../store';

const WISHLIST_ENDPOINT = '/api/storefront/wishlist';
const PRODUCT_ENDPOINT = '/api/storefront/products';

interface WishlistSku {
  size?: string;
  sellingPrice?: number;
  mrp?: number;
}

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
  skus?: WishlistSku[];
}

interface ProductDetailForSizes {
  skus?: WishlistSku[];
}

interface ProductDetailForSizesResponse {
  success: boolean;
  data?: ProductDetailForSizes;
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
  productCode?: string;
  isOutOfStock?: boolean;
}

const mapWishlistItem = (item: WishlistItem): WishlistCardItem => {
  const product = item.product ?? ({} as WishlistProduct);
  const price = product.price ?? 0;
  const sizes = [
    ...new Set(
      (product.skus ?? [])
        .map(sku => sku.size)
        .filter((size): size is string => Boolean(size)),
    ),
  ];

  return {
    id: product.id ?? product._id ?? item.productId,
    name: product.name ?? 'Product',
    price,
    originalPrice: price,
    image: product.images?.[0] ?? '',
    sizes,
    productCode: product.productCode,
    isOutOfStock: product.isOutOfStock,
  };
};

const WishlistScreen = () => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<TabParamList, 'WishlistTab'>>();
  const dispatch = useDispatch<AppDispatch>();
  const { addresses, refresh } = useProfile();

  const [items, setItems] = useState<WishlistCardItem[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [sizeErrors, setSizeErrors] = useState<Record<string, boolean>>({});
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isAddAddressModalVisible, setIsAddAddressModalVisible] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(
    () => () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!selectedAddressId && addresses.length) {
      const defaultAddress = addresses.find(address => address.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress._id || '0');
    }
  }, [addresses, selectedAddressId]);

  const deliveryAddress =
    addresses.find(address => (address._id || '') === selectedAddressId) || null;

  const handleSelectAddress = (address: Address) => {
    setSelectedAddressId(address._id || '0');
  };

  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setIsAddressModalVisible(false);
    setTimeout(() => {
      setIsAddAddressModalVisible(true);
    }, 250);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsAddressModalVisible(false);
    setTimeout(() => {
      setIsAddAddressModalVisible(true);
    }, 250);
  };

  const handleDeleteAddress = (address: Address) => {
    if (!address._id) {
      return;
    }
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.delete(`/api/auth/profile/address/${address._id}`);
            if (selectedAddressId === address._id) {
              setSelectedAddressId(null);
            }
            refresh();
          } catch (deleteError) {
            Alert.alert(
              'Delete Failed',
              deleteError instanceof Error
                ? deleteError.message
                : 'Something went wrong. Please try again.',
            );
          }
        },
      },
    ]);
  };

  const handleAddressSaved = () => {
    setIsAddAddressModalVisible(false);
    setEditingAddress(null);
    refresh();
  };

  // A `wishlist` notification narrows the grid to the product it names. If that
  // product is no longer saved, fall back to the full wishlist instead of
  // showing a misleading empty state.
  const notificationProductId = route.params?.filterProductId;
  const matchedNotificationItems = notificationProductId
    ? items.filter(item => item.id === notificationProductId)
    : [];
  const displayItems =
    matchedNotificationItems.length > 0 ? matchedNotificationItems : items;

  const isTablet = width >= 768;
  const hPad = 16;
  const gap = 12;
  const numCols = isTablet ? 3 : 2;
  const cardW = (width - hPad * 2 - gap * (numCols - 1)) / numCols;

  const fetchWishlist = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiService.get<WishlistResponse>(WISHLIST_ENDPOINT);

      if (!response.success) {
        setItems([]);
        return;
      }

      const rawItems = response.data?.items ?? [];
      const mapped = rawItems.map(mapWishlistItem);

      // The wishlist payload does not always carry SKUs, so pull the product
      // detail for cards without sizes to expose a size picker like the
      // home/product screens.
      const withSizes = await Promise.all(
        mapped.map(async (card, index) => {
          if (card.sizes.length > 0) return card;
          const productId = card.id || rawItems[index]?.productId;
          if (!productId) return card;
          try {
            const detail = await apiService.get<ProductDetailForSizesResponse>(
              `${PRODUCT_ENDPOINT}/${productId}`,
            );
            const sizes = [
              ...new Set(
                (detail.data?.skus ?? [])
                  .map(sku => sku.size)
                  .filter((size): size is string => Boolean(size)),
              ),
            ];
            return sizes.length > 0 ? { ...card, sizes } : card;
          } catch {
            return card;
          }
        }),
      );

      setItems(withSizes);
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
      publishWishlistChange(id, false);
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

  const goToProduct = (product: WishlistCardItem) => {
    navigation.navigate('ProductDetails', { product });
  };

  const handleSelectSize = (productId: string, size: string) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
    setSizeErrors(prev => {
      if (!prev[productId]) return prev;
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const handleAddToCart = (product: WishlistCardItem) => {
    if (product.isOutOfStock) return;
    const size = selectedSizes[product.id] ?? '';
    if (product.sizes.length > 0 && !size) {
      setSizeErrors(prev => ({ ...prev, [product.id]: true }));
      return;
    }
    dispatch(
      addCartItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice ?? product.price,
        image: product.image,
        size,
        color: '',
        productCode: product.productCode,
      }),
    );

    // Show a green "Added" on this card for a moment, then offer it again.
    setAddedId(product.id);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        
        {/* ── Top Header ── */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <AppIconButton
              style={styles.headerBtn}
              icon={<BrandIcon icon={BRAND.arrowBack} width={15} height={15} />}
              accessibilityLabel="Go back"
              onPress={handleBackPress}
            />

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Wishlist</Text>
              <TouchableOpacity
                style={styles.deliveryRow}
                activeOpacity={0.7}
                onPress={() => setIsAddressModalVisible(true)}>
                <BrandIcon icon={BRAND.locationPinSm} width={12} height={12} />
                <Text style={[styles.deliveryText, { maxWidth: Math.min(width * 0.42, 200)  , marginLeft:4}]} numberOfLines={1}>
                 {formatDeliveryLabel(deliveryAddress)}
               </Text>
              </TouchableOpacity>
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
          ) : displayItems.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyTitle}>No items in your wishlist</Text>
              <Text style={styles.emptyMessage}>
                Tap the heart icon on any product to save it here.
              </Text>
            </View>
          ) : (
          <View style={styles.grid}>
            {displayItems.map(item => {
              const imgH = cardW * 1.05;
              const hasOriginalPrice =
                item.originalPrice != null && item.originalPrice > item.price;
              const isAdded = addedId === item.id;

              return (
                <AppCard
                  key={item.id}
                  elevated={false}
                  borderRadius={12}
                  style={[styles.wishCard, { width: cardW, marginBottom: gap }]}>
                  
                  {/* Image Container */}
                  <TouchableOpacity
                    style={{ position: 'relative', zIndex: 1 }}
                    activeOpacity={0.8}
                    onPress={() => goToProduct(item)}>
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
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.heartBtn, { zIndex: 1000 }]}
                    onPress={(e) => { e.stopPropagation(); removeItem(item.id); }}
                    activeOpacity={0.8}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <SvgXml xml={heartFilledSvg(theme.colors.primary)} width={16} height={16} />
                  </TouchableOpacity>

                  <View style={styles.cardDetails}>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => goToProduct(item)}>
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
                    </TouchableOpacity>

                    {item.sizes.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.sizeContainer}>
                        {item.sizes.map((size, idx) => {
                          const isSelected = selectedSizes[item.id] === size;
                          return (
                            <TouchableOpacity
                              key={`${size}-${idx}`}
                              activeOpacity={0.8}
                              style={[
                                styles.sizeChip,
                                isSelected && styles.sizeChipSelected,
                              ]}
                              onPress={() => handleSelectSize(item.id, size)}>
                              <Text
                                style={[
                                  styles.sizeText,
                                  isSelected && styles.sizeTextSelected,
                                ]}>
                                {size}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    ) : null}

                    {sizeErrors[item.id] ? (
                      <Text style={styles.sizeErrorText}>Please select a size</Text>
                    ) : null}

                    {/* Wishlist always adds; the Go to Cart shortcut lives on ProductDetails */}
                    <AppButton
                      style={[
                        styles.addToCartBtn,
                        isAdded && styles.addToCartBtnAdded,
                        item.isOutOfStock && styles.addToCartBtnOutOfStock,
                      ]}
                      textStyle={[
                        styles.addToCartText,
                        item.isOutOfStock && styles.addToCartTextOutOfStock,
                      ]}
                      size="sm"
                      label={
                        item.isOutOfStock
                          ? 'Out of Stock'
                          : isAdded
                            ? 'Added'
                            : 'Add to Cart'
                      }
                      disabled={item.isOutOfStock}
                      onPress={() => handleAddToCart(item)}
                    />
                  </View>
                </AppCard>
              );
            })}
          </View>
          )}
        </ScrollView>
      </View>
      <AddressSelectionModal
        visible={isAddressModalVisible}
        addresses={addresses}
        selectedAddressId={selectedAddressId}
        onSelect={handleSelectAddress}
        onClose={() => setIsAddressModalVisible(false)}
        onAddAddress={handleOpenAddAddress}
        onEditAddress={handleEditAddress}
        onDeleteAddress={handleDeleteAddress}
      />

      <AddAddressModal
        visible={isAddAddressModalVisible}
        editingAddress={editingAddress}
        onClose={() => setIsAddAddressModalVisible(false)}
        onSaved={handleAddressSaved}
      />
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
    flexShrink: 1,
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
    elevation: 6,
    shadowColor: colors.text,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 1000,
  },
  cardDetails: {
    padding: 10,
  },
  itemName: {
    fontSize: 13,
    fontFamily: FONTS.poppinsBold,
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
    fontFamily: FONTS.poppinsBold,
  },
  addToCartBtnOutOfStock: {
    backgroundColor: colors.surfaceVariant,
  },
  addToCartBtnAdded: {
    backgroundColor: colors.success,
  },
  addToCartTextOutOfStock: {
    color: colors.textMuted,
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
    fontFamily: FONTS.poppinsBold,
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
  sizeChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 3,
      backgroundColor: colors.surface,
    },
    sizeChipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    sizeChipDisabled: {
      opacity: 0.45,
    },
   
    sizeTextSelected: {
      color: colors.primary,
      fontWeight: '700',
    },
    sizeTextDisabled: {
      color: colors.textMuted,
    },
  });
};

export default WishlistScreen;
