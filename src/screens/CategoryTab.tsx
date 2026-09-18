import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../navigation/types';

/** CategoryTab sits inside the bottom tabs, itself nested in the root stack. */
type CategoryTabNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'CategoryTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

// Theme Imports
import { useAppTheme } from '../theme/useAppTheme';
import AppInput from '../components/AppInput';
import type { AppTheme } from '../theme/types';
import { apiService } from '../api/apiService';

// Asset Imports
import { ARROW_BACK_ICON } from '../assets/svg';
import BagIconButton from '../components/BagIconButton';

// Dynamic SVGs Factory
const getSearchIconSvg = (color: string) => 
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 21L16.65 16.65" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const getArrowRightSvg = (color: string) => 
  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const getHeartFilledSvg = (color: string) => 
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="${color}"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

const getHeartOutlineSvg = (color: string) => 
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

// Categories API
const CATEGORIES_ENDPOINT = '/api/storefront/categories';

// Products API
const PRODUCTS_ENDPOINT = '/api/storefront/products';

// Wishlist API
const WISHLIST_ENDPOINT = '/api/storefront/wishlist';
const WISHLIST_ITEMS_ENDPOINT = '/api/storefront/wishlist/items';

interface ApiCategory {
  name: string;
  slug: string;
  productCount: number;
  image: string;
}

interface CategoriesResponse {
  success: boolean;
  data: ApiCategory[];
}

interface NewArrivalProduct {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  tag: string;
  isNewArrival: boolean;
}

interface ApiProductListItem {
  _id: string;
  id?: string;
  name: string;
  price: number;
  rating: number;
  images: string[];
  tag: string;
  skus: { size: string; sellingPrice: number; mrp: number }[];
  isNewArrival: boolean;
  isPopular: boolean;
}

interface ProductsListApiResponse {
  success: boolean;
  count: number;
  total: number;
  data: ApiProductListItem[];
}

interface WishlistProduct {
  id: string;
  name: string;
}

interface WishlistItem {
  productId: string;
  product?: WishlistProduct;
}

interface WishlistData {
  items: WishlistItem[];
  count: number;
}

interface WishlistResponse {
  success: boolean;
  data: WishlistData;
}

const mapApiProductToItem = (item: ApiProductListItem): NewArrivalProduct => {
  const sku = item.skus?.[0];
  const sellingPrice = sku?.sellingPrice ?? item.price ?? 0;
  const mrp = sku?.mrp ?? sellingPrice;
  const discount = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  return {
    id: item._id || item.id || '',
    name: item.name ?? '',
    price: sellingPrice,
    originalPrice: mrp,
    discount,
    image: item.images?.[0] ?? '',
    tag: item.tag || (item.isNewArrival ? 'New Arrival' : item.isPopular ? 'Best Seller' : ''),
    isNewArrival: item.isNewArrival ?? false,
  };
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

    /* Header */
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      shadowColor: colors.text,
      shadowOpacity: 0.1,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    headerTitle: {
      fontSize: 16,
      fontFamily: fontFamily.bold,
      color: colors.text,
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },

    /* Search Bar */
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      height: 46,
      marginTop: 6,
      marginBottom: 16,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      fontFamily: fontFamily.regular,
    },

    /* Grid & Category Card */
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    categoryCard: {
      borderRadius: 16,
      padding: 12,
      height: 140,
      flexDirection: 'row',
      justifyContent: 'space-between',
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardInfo: {
      justifyContent: 'space-between',
      flex: 1,
      zIndex: 2,
    },
    catTitle: {
      fontSize: 15,
      fontFamily: fontFamily.bold,
      color: colors.primary,
    },
    catSubtitle: {
      fontSize: 10,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
      lineHeight: 14,
      marginTop: 2,
    },
    arrowCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
    },
    cardImage: {
      width: '55%',
      height: '100%',
      position: 'absolute',
      right: 0,
      bottom: 0,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
      paddingVertical: 20,
    },

    /* Promo Banner */
    promoBanner: {
      backgroundColor: colors.primaryLight,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6,
      marginBottom: 16,
      overflow: 'hidden',
    },
    promoLeft: {
      flex: 1,
    },
    promoTag: {
      fontSize: 11,
      color: colors.primary,
      fontFamily: fontFamily.medium,
      marginBottom: 4,
    },
    promoTitle: {
      fontSize: 14,
      fontFamily: fontFamily.bold,
      color: colors.text,
      lineHeight: 18,
      marginBottom: 10,
    },
    promoBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
    },
    promoBtnText: {
      color: colors.textOnPrimary,
      fontSize: 10,
      fontFamily: fontFamily.bold,
    },
    promoImage: {
      width: 120,
      height: 100,
      borderRadius: 12,
    },

    /* Bottom Grid Items */
    bottomGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    smallCard: {
      borderRadius: 12,
      height: 150,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 1,
      borderColor: colors.border,
    },
    smallBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: colors.text,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      zIndex: 2,
    },
    smallBadgeText: {
      color: colors.surface,
      fontSize: 8,
      fontFamily: fontFamily.medium,
    },
    smallImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    heartBtn: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: colors.surface,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      shadowColor: colors.text,
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },

    /* New Arrivals (side scroll) */
    newArrivalSection: {
      marginTop: 8,
      marginBottom: 16,
    },
    newArrivalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    newArrivalTitle: {
      fontSize: 16,
      fontFamily: fontFamily.bold,
      color: colors.text,
    },
    newArrivalCard: {
      width: 150,
    },
    newArrivalImgArea: {
      width: 150,
      height: 180,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
    },
    newArrivalImg: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    newArrivalBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: colors.text,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      zIndex: 2,
    },
    newArrivalName: {
      fontSize: 13,
      fontFamily: fontFamily.medium,
      color: colors.text,
      marginTop: 8,
      paddingHorizontal: 2,
    },
    newArrivalPriceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
      paddingHorizontal: 2,
    },
    newArrivalPrice: {
      fontSize: 14,
      fontFamily: fontFamily.bold,
      color: colors.primary,
    },
    newArrivalOldPrice: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
      textDecorationLine: 'line-through',
    },
    emptyText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
      paddingHorizontal: 16,
    },
  });
};

const CategoryTab = () => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [newArrivals, setNewArrivals] = useState<NewArrivalProduct[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const hPad = 16;
  const gap = 12;
  const numCols = isTablet ? 3 : 2;
  const cardW = (width - hPad * 2 - gap * (numCols - 1)) / numCols;
  const dynamicTopPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  
  const navigation = useNavigation<CategoryTabNavigation>();

  const handleCategoryPress = (name: string) => {
    navigation.navigate('HomeTab', { category: name });
  };

  const handleProductPress = (item: NewArrivalProduct) => {
    navigation.navigate('ProductDetails', { product: item });
  };

  const refreshWishlist = useCallback(async () => {
    try {
      const response = await apiService.get<WishlistResponse>(WISHLIST_ENDPOINT);
      if (response.success) {
        const ids = (response.data?.items ?? [])
          .map(i => i.product?.id ?? i.productId)
          .filter(Boolean);
        setWishlistIds(new Set(ids));
      }
    } catch {
      // Non-fatal — hearts default to unliked
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshWishlist();
    }, [refreshWishlist]),
  );

  const handleToggleWishlist = async (productId: string) => {
    if (!productId || wishlistLoading) return;

    const isCurrentlyLiked = wishlistIds.has(productId);
    setWishlistLoading(true);

    // Optimistic UI update
    setWishlistIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyLiked) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      if (isCurrentlyLiked) {
        await apiService.delete(`${WISHLIST_ITEMS_ENDPOINT}/${productId}`);
      } else {
        await apiService.post(WISHLIST_ITEMS_ENDPOINT, { productId });
      }
    } catch {
      // Revert optimistic update on failure
      setWishlistIds(prev => {
        const next = new Set(prev);
        if (isCurrentlyLiked) next.add(productId);
        else next.delete(productId);
        return next;
      });
    } finally {
      setWishlistLoading(false);
    }
  };

  const filteredCategories = searchQuery.trim()
    ? categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : categories;

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiService.get<CategoriesResponse>(CATEGORIES_ENDPOINT);
        if (response.success) {
          setCategories(response.data ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const response = await apiService.get<ProductsListApiResponse>(
          `${PRODUCTS_ENDPOINT}?limit=10&isVisible=true`,
        );
        if (response.success && Array.isArray(response.data)) {
          const mapped = response.data.map(mapApiProductToItem).filter(p => p.id);
          const newArrivalOnly = mapped.filter(p => p.isNewArrival);
          setNewArrivals(newArrivalOnly.length >= 3 ? newArrivalOnly : mapped);
        }
      } catch {
        // Non-fatal — new arrivals section simply stays empty on failure
      }
    };
    fetchNewArrivals();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={[styles.container, { paddingTop: dynamicTopPadding }]}>

        {/* Top Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={handleBackPress}>
              <SvgXml xml={ARROW_BACK_ICON} width={15} height={15} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Product Categories</Text>
          </View>

          <BagIconButton />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Search Input Box */}
          <AppInput
            containerStyle={{ marginHorizontal: hPad, marginBottom: 0 }}
            inputContainerStyle={styles.searchBox}
            leftIcon={<SvgXml xml={getSearchIconSvg(theme.colors.textMuted)} width={18} height={18} />}
            style={styles.searchInput}
            placeholder="Search for categories"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Category Cards Grid */}
          <View style={[styles.grid, { paddingHorizontal: hPad }]}>
            {loading ? (
              <Text style={styles.loadingText}>Loading categories...</Text>
            ) : filteredCategories.length === 0 ? (
              <Text style={styles.loadingText}>No categories found</Text>
            ) : (
              filteredCategories.map(cat => (
                <TouchableOpacity
                  key={cat.slug}
                  style={[styles.categoryCard, { width: cardW, marginBottom: gap }]}
                  activeOpacity={0.9}
                  onPress={() => handleCategoryPress(cat.name)}>

                  {/* Left Info Column */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.catTitle}>{cat.name}</Text>
                    <Text style={styles.catSubtitle}>
                      {cat.productCount > 0
                        ? `${cat.productCount} product${cat.productCount === 1 ? '' : 's'}`
                        : 'No products yet'}
                    </Text>

                    <View style={styles.arrowCircle}>
                      <SvgXml xml={getArrowRightSvg(theme.colors.textOnPrimary)} width={12} height={12} />
                    </View>
                  </View>

                  {/* Right Image */}
                  {cat.image ? (
                    <Image source={{ uri: cat.image }} style={styles.cardImage} resizeMode="contain" />
                  ) : null}
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* New Arrivals Promo Banner */}
          <View style={[styles.promoBanner, { marginHorizontal: hPad }]}>
            <View style={styles.promoLeft}>
              <Text style={styles.promoTag}>New Arrivals</Text>
              <Text style={styles.promoTitle}>{'Fresh Styles Just\nFor Your Little Ones'}</Text>
              <TouchableOpacity style={styles.promoBtn} activeOpacity={0.85}>
                <Text style={styles.promoBtnText}>New Arrivals</Text>
                <SvgXml xml={getArrowRightSvg(theme.colors.textOnPrimary)} width={10} height={10} />
              </TouchableOpacity>
            </View>

            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?q=80&w=600&auto=format&fit=crop' }}
              style={styles.promoImage}
              resizeMode="cover"
            />
          </View>

          {/* New Arrivals (side scroll) */}
          <View style={styles.newArrivalSection}>
            <View style={styles.newArrivalHeader}>
              <Text style={styles.newArrivalTitle}>New Arrivals</Text>
            </View>

            {newArrivals.length === 0 ? (
              <Text style={styles.emptyText}>No new arrivals yet</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: hPad, gap: 12 }}>
                {newArrivals.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.newArrivalCard}
                    activeOpacity={0.9}
                    onPress={() => handleProductPress(item)}>
                    <View style={styles.newArrivalImgArea}>
                      {item.tag ? (
                        <View style={styles.newArrivalBadge}>
                          <Text style={styles.smallBadgeText}>{item.tag}</Text>
                        </View>
                      ) : null}
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.newArrivalImg} />
                      ) : null}
                      <TouchableOpacity
                        style={styles.heartBtn}
                        activeOpacity={0.7}
                        onPress={() => handleToggleWishlist(item.id)}>
                        <SvgXml
                          xml={wishlistIds.has(item.id)
                            ? getHeartFilledSvg(theme.colors.primary)
                            : getHeartOutlineSvg(theme.colors.textMuted)}
                          width={14}
                          height={14}
                        />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.newArrivalName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.newArrivalPriceRow}>
                      <Text style={styles.newArrivalPrice}>₹{item.price}</Text>
                      <Text style={styles.newArrivalOldPrice}>₹{item.originalPrice}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default CategoryTab;
