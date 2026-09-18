import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  StatusBar,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useAppTheme } from '../theme/useAppTheme';
import AppInput from '../components/AppInput';
import MenuDrawer from '../components/MenuDrawer';
import { useProfile, formatAddressLabel } from '../hooks/useProfile';
import { apiService } from '../api/apiService';
import type { AppTheme } from '../theme/types';
import {
  MENU_SVG,
  Butruname,
  STAR_FILLED_SVG,
  HEART_FILLED_SVG,
  HEART_OUTLINE_SVG,
  CART_WHITE_SVG,
  LOCATION_PIN_SVG,
  CHEVRON_DOWN_SVG,
  BELL_SVG,
  BAG_SVG,
SEARCH_SVG,
  BOX_ICON_SVG,
} from '../assets/svg';
import BagIconButton from '../components/BagIconButton';
import { useDispatch } from 'react-redux';
import { addItem as addCartItem } from '../store/slices/cartSlice';
import type { AppDispatch } from '../store';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../navigation/types';

/** HomeTab sits inside the bottom tabs, itself nested in the root stack. */
type HomeTabNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

// ─── Mock Data ────────────────────────────────────────────────────────────────

const COLLECTIONS = [
  {
    id: '1',
    title: 'Comfort',
    subtitle: 'Buy Now',
    image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '2',
    title: 'Cosy Nights',
    subtitle: 'Buy Now',
    image: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '3',
    title: 'Cosy Nights',
    subtitle: 'Buy Now',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=400',
  },
];

const BANNERS_ENDPOINT = '/api/storefront/banners?placement=home_hero';

interface Banner {
  id: string;
  image: string;
}

interface ApiBanner {
  _id: string;
  imageUrl: string;
}

interface BannersResponse {
  success: boolean;
  count: number;
  data: ApiBanner[];
}

const mapApiBanner = (item: ApiBanner): Banner => ({
  id: item._id,
  image: item.imageUrl,
});

// ─── Product Types & API Config ───────────────────────────────────────────────

const PRODUCTS_ENDPOINT = '/api/storefront/products';
const WISHLIST_ITEMS_ENDPOINT = '/api/storefront/wishlist/items';
const WISHLIST_ENDPOINT = '/api/storefront/wishlist';

/** Singleton product shape consumed by the ProductCard UI. */
interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  tag: string;
  sizes: string[];
  image: string;
}

interface ProductSku {
  size: string;
  sellingPrice: number;
  mrp: number;
}

interface ApiProduct {
  _id: string;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  tag?: string;
  isNewArrival?: boolean;
  isPopular?: boolean;
  images?: string[];
  skus?: ProductSku[];
}

interface ProductsApiResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: ApiProduct[];
}

interface WishlishProduct {
  id: string;
  name: string;
  price?: number;
  images?: string[];
}

interface WishlistItem {
  productId: string;
  product: WishlishProduct;
}

interface WishlistData {
  items: WishlistItem[];
  count: number;
}

interface WishlistResponse {
  success: boolean;
  data: WishlistData;
}

/** Maps API product -> Product shape used by the product grid UI. */
const mapApiProduct = (item: ApiProduct): Product => {
  const sku = item.skus?.[0];
  const price = sku?.sellingPrice ?? item.price ?? 0;
  const originalPrice = sku?.mrp ?? price;

  return {
    id: item._id,
    name: item.name,
    price,
    originalPrice,
    discount:
      originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0,
    rating: item.rating ?? 0,
    reviews: item.reviewCount ?? 0,
    tag:
      item.tag ||
      (item.isNewArrival ? 'New Arrival' : item.isPopular ? 'Best Seller' : ''),
    sizes: [...new Set((item.skus ?? []).map(skuEntry => skuEntry.size))],
    image: item.images?.[0] ?? '',
  };
};

// ─── StyleSheet Factory ────────────────────────────────────────────────────────
// Called inside each component AFTER reading the theme. This pattern
// ensures 100% of style values are sourced from the theme — zero hardcoded hex.

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
    scrollContent: {
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) / 2 : 0,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      backgroundColor: colors.surface,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuBtn: {
      padding: 2,
    },
    logoFallback: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
      fontFamily: fontFamily.heading,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    locationText: {
      flexShrink: 1,
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBtn: {
      padding: 4,
      position: 'relative',
    },
    notifDot: {
      position: 'absolute',
      top: 6.5,
      right: 6,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.notifDot,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingHorizontal: 14,
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 8,
      marginBottom: 16,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      fontFamily: fontFamily.regular,
      padding: 0,
    },
    bannerCard: {
      width: '100%',
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 10,
      gap: 6,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    activeDot: {
      width: 16,
      backgroundColor: colors.primary,
    },
    collectionCard: {
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    collectionOverlay: {
      padding: 8,
      backgroundColor: colors.overlay,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
    },
    collectionTitle: {
      color: colors.textOnPrimary,
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 4,
      fontFamily: fontFamily.bold,
    },
    buyNowBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    buyNowText: {
      color: colors.textOnPrimary,
      fontSize: 9,
      fontWeight: '700',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      fontFamily: fontFamily.bold,
    },
    showAll: {
      fontSize: 12,
      color: colors.textMuted,
    },
    productGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 16,
    },
    productCard: {
      backgroundColor: colors.surface,
    },
    productImgArea: {
      width: '100%',
      position: 'relative',
    },
    tagBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: colors.text,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
    },
    tagText: {
      color: colors.surface,
      fontSize: 8,
      fontWeight: '600',
    },
    heartBtn: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
    },
    productInfo: {
      paddingVertical: 6,
    },
    productName: {
      fontSize: 12,
      color: colors.text,
      marginBottom: 2,
      fontFamily: fontFamily.regular,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginVertical: 2,
    },
    price: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
      fontFamily: fontFamily.bold,
    },
    originalPrice: {
      fontSize: 10,
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
      marginBottom: 6,
    },
    reviewCount: {
      fontSize: 10,
      color: colors.textMuted,
    },
    starRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1,
    },
    sizeContainer: {
      flexDirection: 'row',
      gap: 4,
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
    sizeText: {
      fontSize: 9,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    sizeTextSelected: {
      color: colors.primary,
      fontWeight: '700',
    },
    addToCartBtn: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 7,
      borderRadius: 6,
      gap: 6,
    },
    addToCartText: {
      color: colors.textOnPrimary,
      fontSize: 11,
      fontWeight: '700',
    },
    addToCartBtnAdded: {
      backgroundColor: colors.success,
    },
    // State feedback
    centerBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 20,
    },
    loader: {
      paddingVertical: 60,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyIconText: {
      fontSize: 28,
      color: colors.primary,
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
      maxWidth: 260,
    },
    retryBtn: {
      marginTop: 18,
      backgroundColor: colors.primary,
      paddingHorizontal: 22,
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

// ─── StarRating Component ──────────────────────────────────────────────────────

const StarRating = ({ rating }: { rating: number }) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(index => (
        <SvgXml
          key={index}
          xml={STAR_FILLED_SVG}
          width={10}
          height={10}
          style={index <= Math.round(rating) ? undefined : { opacity: 0.25 }}
        />
      ))}
    </View>
  );
};

// ─── BannerSlider Component ────────────────────────────────────────────────────

const BannerSlider = ({
  slides,
  screenWidth,
}: {
  slides: Banner[];
  screenWidth: number;
}) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const [active, setActive] = useState(0);
  const bannerHeight = Math.min(screenWidth * 0.48, 220);

  useEffect(() => {
    if (slides.length < 2) return;

    const interval = setInterval(() => {
      setActive(prev => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) {
    return null;
  }

  return (
    <View style={{ marginHorizontal: screenWidth * 0.04, marginBottom: 16 }}>
      <ImageBackground
        source={{ uri: slides[Math.min(active, slides.length - 1)].image }}
        style={[styles.bannerCard, { height: bannerHeight }]}
        imageStyle={{ borderRadius: 16 }}
      />

      {slides.length > 1 && (
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setActive(i)}>
              <View style={[styles.dot, i === active && styles.activeDot]} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── ProductCard Component ─────────────────────────────────────────────────────

const ProductCard = ({
  item,
  cardWidth,
  onAddToCart,
  liked,
  onToggleWishlist,
}: {
  item: Product;
  cardWidth: number;
  onAddToCart: () => void;
  liked: boolean;
  onToggleWishlist: () => void;
}) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const dispatch = useDispatch<AppDispatch>();
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const addTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imgHeight = cardWidth * 1.15;

  useEffect(
    () => () => {
      if (addTimer.current) {
        clearTimeout(addTimer.current);
      }
    },
    [],
  );

  const handleAddToCartPress = () => {
    dispatch(
      addCartItem({
        productId: item.id,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
        size: selectedSize || item.sizes[0] || '',
        color: '',
      }),
    );
    setAdded(true);
    if (addTimer.current) {
      clearTimeout(addTimer.current);
    }
    addTimer.current = setTimeout(() => setAdded(false), 1200);
  };

  const handleLikePress = async () => {
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      await onToggleWishlist();
    } catch {
      // no-op — parent handles optimistic update
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <View style={[styles.productCard, { width: cardWidth }]}>
      <TouchableOpacity
        style={{ position: 'relative' }}
        activeOpacity={0.8}
        onPress={onAddToCart}>
        <ImageBackground
          source={{ uri: item.image }}
          style={[styles.productImgArea, { height: imgHeight }]}
          imageStyle={{ borderRadius: 12 }}>
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{item.tag}</Text>
          </View>
          <TouchableOpacity
            style={styles.heartBtn}
            activeOpacity={0.7}
            onPress={handleLikePress}>
            <SvgXml xml={liked ? HEART_FILLED_SVG : HEART_OUTLINE_SVG} width={16} height={16} />
          </TouchableOpacity>
        </ImageBackground>
      </TouchableOpacity>

      <TouchableOpacity onPress={onAddToCart} activeOpacity={0.8}>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹ {item.price}</Text>
            <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
            <Text style={styles.discountText}>{item.discount}% OFF</Text>
          </View>
          <View style={styles.ratingRow}>
            <StarRating rating={item.rating} />
            <Text style={styles.reviewCount}>({item.reviews})</Text>
          </View>
        </View>
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <View style={styles.sizeContainer}>
          {item.sizes.map((sz, idx) => {
            const isSelected = selectedSize === sz;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedSize(sz)}
                style={[styles.sizeChip, isSelected && styles.sizeChipSelected]}>
                <Text style={[styles.sizeText, isSelected && styles.sizeTextSelected]}>
                  {sz}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.addToCartBtn, added && styles.addToCartBtnAdded]}
        activeOpacity={0.8}
        onPress={handleAddToCartPress}>
        <SvgXml xml={CART_WHITE_SVG} width={13} height={13} />
        <Text style={styles.addToCartText}>{added ? 'Added' : 'Add to Cart'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Main HomeTab Component ────────────────────────────────────────────────────

const HomeTab = () => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const [menuOpen, setMenuOpen] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('Home');
  const { addresses } = useProfile();
  const deliveryAddress = addresses[0] || null;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeTabNavigation>();
  const route = useRoute<RouteProp<TabParamList, 'HomeTab'>>();
  const isTablet = width >= 768;
  const hPad = width * 0.04;
  const addressMaxWidth = Math.min(width * 0.42, 200);
  const logoWidth = Math.min(width * 0.22, 90);
  const logoHeight = logoWidth * 0.4;
  const collectionCardW = Math.min(width * 0.3, 120);
  const productCardW = (width - hPad * 2 - 12) / 2;

  const filteredProducts = searchQuery.trim()
    ? products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : products;

  const fetchProducts = async (category: string) => {
    setLoading(true);
    setError('');
    setProducts([]);

    try {
      const params =
        category === 'Home'
          ? 'isVisible=true&limit=20&page=1'
          : `isVisible=true&limit=20&page=1&category=${encodeURIComponent(category)}`;

      const response = await apiService.get<ProductsApiResponse>(
        `${PRODUCTS_ENDPOINT}?${params}`,
      );

      setProducts((response.data ?? []).map(mapApiProduct));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await apiService.get<BannersResponse>(BANNERS_ENDPOINT);
      if (response.success) {
        setBanners((response.data ?? []).map(mapApiBanner));
      }
    } catch {
      // non-fatal — banner slider simply stays hidden
    }
  };

  useEffect(() => {
    fetchProducts(activeCategory);
    fetchBanners();
  }, [activeCategory]);

  // Category selected from CategoryTab — apply it like the menu drawer does.
  useEffect(() => {
    if (route.params?.category) {
      setActiveCategory(route.params.category);
    }
  }, [route.params?.category]);

  useFocusEffect(
    useCallback(() => {
      fetchWishlistItems();
    }, []),
  );

  const fetchWishlistItems = async () => {
    try {
      const response = await apiService.get<WishlistResponse>(WISHLIST_ENDPOINT);
      if (response.success) {
        const ids = (response.data?.items ?? [])
          .map(i => i.product?.id ?? i.productId)
          .filter(Boolean);
        setWishlistIds(new Set(ids));
      }
    } catch {
      // non-fatal — hearts default to unliked
    }
  };

  const handleToggleWishlist = async (productId: string) => {
    const isCurrentlyLiked = wishlistIds.has(productId);

    // Optimistic UI update
    setWishlistIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyLiked) next.delete(productId); else next.add(productId);
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
        if (isCurrentlyLiked) next.add(productId); else next.delete(productId);
        return next;
      });
    }
  };

  const handleMenuItemSelect = (name: string) => {
    switch (name) {
      case 'Wishlist':
        navigation.navigate('WishlistTab');
        break;
      case 'My Orders':
        navigation.navigate('MyOrders');
        break;
      case 'Account':
        navigation.navigate('AccountTab');
        break;
      case 'Help & Support':
        navigation.navigate('HelpSupport');
        break;
      default:
        // Product categories (Home, Clothing, Shoes, Accessories, Toys...)
        setActiveCategory(name);
    }
  };

  const handleProductPress = (productItem: any) => {
    navigation.navigate('ProductDetails', { product: productItem });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' },
        ]}>

        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: hPad }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.menuBtn}
              onPress={() => setMenuOpen(true)}>
              <SvgXml xml={MENU_SVG} width={24} height={24} />
            </TouchableOpacity>

            <View style={{ marginLeft: 8 }}>
              {Butruname ? (
                <SvgXml xml={Butruname} width={logoWidth} height={logoHeight} />
              ) : (
                <Text style={styles.logoFallback}>{theme.appName}</Text>
              )}
              <View style={styles.locationRow}>
                <SvgXml xml={LOCATION_PIN_SVG} width={12} height={12} />
                <Text style={[styles.locationText, { maxWidth: addressMaxWidth }]} numberOfLines={1}>
                  Delivering to {formatAddressLabel(deliveryAddress)}
                </Text>
                <SvgXml xml={CHEVRON_DOWN_SVG} width={10} height={10} />
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <SvgXml xml={BELL_SVG} width={25} height={25} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <BagIconButton />
          </View>
        </View>

        {/* Search Bar */}
        <AppInput
          containerStyle={{ marginHorizontal: hPad, marginBottom: 0 }}
          inputContainerStyle={styles.searchBar}
          leftIcon={<SvgXml xml={SEARCH_SVG} width={18} height={18} />}
          style={styles.searchInput}
          placeholder="Search for styles, clothes & more"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Top Banner Slider */}
        <BannerSlider slides={banners} screenWidth={width} />

        {/* Horizontal Collections */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: hPad, gap: 10 }}
          style={{ marginBottom: 20 }}>
          {COLLECTIONS.map(item => (
            <ImageBackground
              key={item.id}
              source={{ uri: item.image }}
              style={[styles.collectionCard, { width: collectionCardW, height: collectionCardW * 1.25 }]}
              imageStyle={{ borderRadius: 12 }}>
              <View style={styles.collectionOverlay}>
                <Text style={styles.collectionTitle}>{item.title}</Text>
                <TouchableOpacity style={styles.buyNowBtn} activeOpacity={0.8}>
                  <Text style={styles.buyNowText}>{item.subtitle}</Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          ))}
        </ScrollView>

        {/* Section Header */}
        <View style={[styles.sectionHeader, { paddingHorizontal: hPad }]}>
          <Text style={styles.sectionTitle}>
            {activeCategory === 'Home'
              ? 'Premium Fashion for Kids'
              : `${activeCategory} Collection`}
          </Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.showAll}>Show all</Text>
          </TouchableOpacity>
        </View>

        {/* Product Grid */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>!</Text>
            </View>
            <Text style={styles.emptyTitle}>Oops!</Text>
            <Text style={styles.emptyMessage}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              activeOpacity={0.8}
              onPress={() => fetchProducts(activeCategory)}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.centerBox}>
            <View style={styles.emptyIcon}>
              <SvgXml xml={BOX_ICON_SVG} width={30} height={30} />
            </View>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyMessage}>
              {activeCategory === 'Home'
                ? 'We are updating our catalog. Please check back soon!'
                : `No items available in "${
                    activeCategory
                  }" right now. Try another category.`}
            </Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.centerBox}>
            <View style={styles.emptyIcon}>
              <SvgXml xml={SEARCH_SVG} width={28} height={28} />
            </View>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyMessage}>
              We couldn't find anything matching "{searchQuery.trim()}". Try a
              different keyword.
            </Text>
          </View>
        ) : (
          <View style={[styles.productGrid, { paddingHorizontal: hPad }]}>
            {filteredProducts.map(item => (
              <ProductCard
                key={item.id}
                item={item}
                cardWidth={productCardW}
                onAddToCart={() => handleProductPress(item)}
                liked={wishlistIds.has(item.id)}
                onToggleWishlist={() => handleToggleWishlist(item.id)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 100 + insets.bottom }} />
      </ScrollView>

      {/* Side Menu Drawer Component */}
      <MenuDrawer
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelect={handleMenuItemSelect}
        activeCategory={activeCategory}
        logoWidth={logoWidth}
        logoHeight={logoHeight}
      />
    </SafeAreaView>
  );
};

export default HomeTab;
