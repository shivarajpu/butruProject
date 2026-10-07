import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FONTS } from '../constants/fonts';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
  ImageBackground,
  ActivityIndicator,
  Keyboard,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useAppTheme } from '../theme/useAppTheme';
import AppInput from '../components/AppInput';
import MenuDrawer, { type DrawerItem } from '../components/MenuDrawer';
import DynamicPage from '../components/DynamicPage';
import AnnouncementBar from '../widgets/AnnouncementBar';
import { useWidgetActions } from '../widgets/common';
import { selectCollections } from '../storefront/selectors';
import { useDispatch, useSelector } from 'react-redux';
import { addItem as addCartItem } from '../store/slices/cartSlice';
import type { AppDispatch, RootState } from '../store';
import { SHOP_ALL_CATEGORY, type WidgetAction } from '../storefront/links';
import { fetchProductsByCategoryName, fetchProductsForSource } from '../storefront/catalog';
import { useStorefront } from '../storefront/useStorefront';
import { useProfile, type Address, formatAddressLabel } from '../hooks/useProfile';
import AddressSelectionModal from '../components/AddressSelectionModal';
import AddAddressModal from '../components/AddAddressModal';
import { apiService } from '../api/apiService';
import type { AppTheme } from '../theme/types';
import {
  STAR_FILLED_SVG,
  heartFilledSvg,
  heartOutlineSvg,
  LOCATION_PIN_SVG,
} from '../assets/svg';
import { BRAND } from '../assets/svg/brand';
import {
  buildSuggestions,
  filterByQuery,
  shouldRequestCatalogue,
} from '../storefront/search';
import BrandIcon from '../components/BrandIcon';
import StoreLogo from '../components/StoreLogo';

import BagIconButton from '../components/BagIconButton';
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

// ─── Product API Config ───────────────────────────────────────────────────────
// Banners and collection cards are served by the widget layer
// (src/widgets/home) — this tab only lists products.

// ─── Product Types & API Config ───────────────────────────────────────────────

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
      paddingTop: 0,
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
    searchBarActive: {
      marginTop: 4,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      fontFamily: fontFamily.regular,
      padding: 0,
    },
    suggestionsContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 2,
      marginBottom: 16,
      overflow: 'hidden',
    },
    suggestionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    suggestionText: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      fontFamily: fontFamily.regular,
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
      fontFamily: FONTS.poppinsBold,
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
      fontFamily: FONTS.poppinsBold,
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
      fontFamily: FONTS.poppinsBold,
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
    sizeErrorText: {
      color: colors.error,
      fontSize: 10,
      fontWeight: '600',
      marginBottom: 6,
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
      fontFamily: FONTS.poppinsBold,
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
  const [sizeError, setSizeError] = useState(false);
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
    if (item.sizes.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    dispatch(
      addCartItem({
        productId: item.id,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
        size: selectedSize ?? '',
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
            <SvgXml
              xml={liked ? heartFilledSvg(theme.colors.primary) : heartOutlineSvg(theme.colors.textMuted)}
              width={16}
              height={16}
            />
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
                onPress={() => {
                  setSelectedSize(sz);
                  setSizeError(false);
                }}
                style={[styles.sizeChip, isSelected && styles.sizeChipSelected]}>
                <Text style={[styles.sizeText, isSelected && styles.sizeTextSelected]}>
                  {sz}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {sizeError ? <Text style={styles.sizeErrorText}>Please select a size</Text> : null}

      <TouchableOpacity
        style={[styles.addToCartBtn, added && styles.addToCartBtnAdded]}
        activeOpacity={0.8}
        onPress={handleAddToCartPress}>
        <BrandIcon icon={BRAND.cart} width={13} height={13} />
        <Text style={styles.addToCartText}>{added ? 'Added' : 'Add to Cart'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Main HomeTab Component ────────────────────────────────────────────────────

/** Sentinel category: the drawer's "Shop Now" opens every product. */
// Shared with the link resolver so `/Collections` and the drawer's "Shop Now"
// produce the exact same filter value.
const SHOP_ALL = SHOP_ALL_CATEGORY;

const HomeTab = () => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isAddAddressModalVisible, setIsAddAddressModalVisible] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Remounts the home sections on refresh; see `DynamicPage.refreshKey`.
  const [refreshKey, setRefreshKey] = useState(0);
  // `false`, not `true`. The home feed is rendered by <DynamicPage />, which has
  // its own loading state, so this flag only ever describes "we asked for a
  // product list and it has not come back". Starting it at `true` meant the
  // first view switch (any search, any category) could not be distinguished
  // from a finished request, so the spinner could never be dismissed.
  const [loading, setLoading] = useState(false);
  /**
   * Guards the search-triggered catalogue fetch. `products` is empty until a
   * category is picked or a search runs, so the effect below keys off its
   * emptiness — but an empty *result* is also a legitimate outcome, and without
   * a latch the effect would re-request forever on a store with no matches.
   */
  const [catalogueRequested, setCatalogueRequested] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('Home');
  const { addresses, refresh } = useProfile();

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
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeTabNavigation>();
  const route = useRoute<RouteProp<TabParamList, 'HomeTab'>>();
  const widgetActions = useWidgetActions();
  const storeCollections = useSelector(selectCollections);
  // `useStorefront` is idempotent (module-level guard), so calling it here on
  // top of `App` just gives us `refresh` for pull-to-refresh.
  const { refresh: refreshStorefront } = useStorefront();
  const appAnnouncementSticky = useSelector(
    (state: RootState) =>
      state.storefront.config?.website?.webConfig?.appAnnouncement?.sticky === true,
  );
  const isTablet = width >= 768;
  const hPad = width * 0.04;
  const addressMaxWidth = Math.min(width * 0.42, 200);
  const logoWidth = Math.min(width * 0.22, 90);
  const logoHeight = logoWidth * 0.4;
  const productCardW = (width - hPad * 2 - 12) / 2;

  /** Search results and category listings replace the widget-driven home. */
  const isListView = searchActive || activeCategory !== 'Home';

  /** Category heading, preferring the collection's own description. */
  const activeCategoryTitle =
    storeCollections.find(
      item => item.title.toLowerCase() === activeCategory.toLowerCase(),
    )?.title ?? '';

  const filteredProducts = filterByQuery(products, searchQuery);
  const suggestions = buildSuggestions(products, searchQuery, 6);

  const handleExitSearch = () => {
    Keyboard.dismiss();
    setSearchQuery('');
    setSearchActive(false);
  };

  const fetchProducts = useCallback(async (category: string) => {
    setLoading(true);
    setError('');
    setProducts([]);

    try {
      // SHOP_ALL (and the default 'Home') show the whole catalogue, so no
      // filter is applied. Anything else is resolved by name: the endpoint
      // filters product types like `Clothing`, while collection titles such as
      // `New Arrivals` are narrowed against `categoryPath` client side.
      const list =
        category === 'Home' || category === SHOP_ALL
          ? await fetchProductsForSource({ source: 'all', limit: 100 })
          : await fetchProductsByCategoryName(
              category,
              storeCollections ?? [],
            );

      setProducts(list);
      setCatalogueRequested(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setCatalogueRequested(true);
    } finally {
      setLoading(false);
    }
  }, [storeCollections]);

  /**
   * Back to the unfiltered home feed.
   *
   * Tapping a widget CTA ("By Now →") or a drawer category pushes a `category`
   * param, which puts this tab into its list view. Resetting only the local
   * state was not enough:
   *  - the route param stayed behind, so any later re-render of the param effect
   *    could re-apply the stale filter, and
   *  - the ScrollView stayed parked wherever the list was scrolled to, which
   *    made the reset look like nothing had happened at all.
   */
  const resetToHomeFeed = useCallback(() => {
    setSearchQuery('');
    setSearchActive(false);
    setActiveCategory('Home');
    setCatalogueRequested(false);
    setProducts([]);
    setError('');
    searchInputRef.current?.blur();
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    navigation.setParams({ category: undefined, navNonce: undefined });
  }, [navigation]);

  /**
   * Pull-to-refresh.
   *
   * A pull is read as "take me back to the top of the feed", so this always
   * lands on the unfiltered home — the category filter, the search bar and the
   * list scroll position are dropped together, exactly as on a cold start.
   * Previously the refresh kept you in the list view, so pulling re-rendered the
   * same filtered products behind the search bar.
   *
   * Because the list view is always left, there is no point re-fetching its
   * products: the only things worth waiting on are the config (which remounts
   * the home sections via `refreshKey`) and the wishlist hearts.
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshStorefront(), fetchWishlistItems()]);
      setRefreshKey(key => key + 1);
    } finally {
      setRefreshing(false);
      // In `finally` so a failed request still returns the user to the home
      // feed — the gesture is a navigation intent, not just a data request.
      resetToHomeFeed();
    }
  }, [refreshStorefront, resetToHomeFeed]);

  useEffect(() => {
    // The default home view is built from the storefront config, so products
    // are only fetched when a category is picked (or a search runs).
    if (activeCategory !== 'Home') {
      fetchProducts(activeCategory);
    }
  }, [activeCategory, fetchProducts]);

  /**
   * Searching from the home feed.
   *
   * `products` is still empty at this point — the feed is <DynamicPage />, not
   * the product grid — so without this the first keystroke rendered
   * "No results found" for every term and the suggestion sheet never opened,
   * because both are computed from that empty list. One fetch per search
   * session; the latch in `fetchProducts` keeps a store with no matching
   * products from re-requesting on every render.
   */
  useEffect(() => {
    if (shouldRequestCatalogue({ searchActive, requested: catalogueRequested, loading })) {
      fetchProducts(activeCategory);
    }
  }, [searchActive, catalogueRequested, loading, activeCategory, fetchProducts]);

  // Category selected from CategoryTab, the menu drawer, or a widget CTA
  // ("View all"). `navNonce` is part of the deps because re-selecting the
  // category you are already on leaves `category` unchanged, and the effect
  // would otherwise never fire.
  useEffect(() => {
    if (route.params?.category) {
      setActiveCategory(route.params.category);
    }
  }, [route.params?.category, route.params?.navNonce]);

  useFocusEffect(
    useCallback(() => {
      setSearchQuery('');
      setSearchActive(false);
      searchInputRef.current?.blur();
      Keyboard.dismiss();
      fetchWishlistItems();
    }, []),
  );

  // Leaving the tab drops any applied filter and search. Without this the
  // category stuck around: apply one, visit Category / Wishlist / Account, come
  // back, and the home feed was still filtered to that collection.
  useEffect(() => {
    const unsub = navigation.addListener('blur', () => {
      resetToHomeFeed();
    });
    return unsub;
  }, [navigation, resetToHomeFeed]);

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

  // Drawer entries are server driven: the action is resolved from the config
  // link, so a renamed / added / removed menu item needs no app release.
  const handleMenuItemSelect = (action: WidgetAction, item: DrawerItem) => {
    if (item.category === 'Home') {
      resetToHomeFeed();
      return;
    }
    widgetActions.run(action);
  };

  /** Drawer's "Shop Now" — same listing a category click produces, unfiltered. */
  const handleShopNow = () => {
    setSearchActive(false);
    setActiveCategory(SHOP_ALL);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleProductPress = (productItem: any) => {
    navigation.navigate('ProductDetails', { product: productItem });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' },
        ]}>

        {/* Header */}
        {!searchActive && (
          <View style={[styles.header, { paddingHorizontal: hPad }]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.menuBtn}
                onPress={() => setMenuOpen(true)}>
                <BrandIcon icon={BRAND.menu} width={24} height={24} />
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginLeft: 8 }}
                activeOpacity={0.7}
                onPress={() => setIsAddressModalVisible(true)}>
                <StoreLogo width={logoWidth} height={logoHeight} textStyle={styles.logoFallback} />
                <View style={styles.locationRow}>
                  <SvgXml xml={LOCATION_PIN_SVG(theme.colors.primary)} width={12} height={12} />
                  <Text style={[styles.locationText, { maxWidth: addressMaxWidth }]} numberOfLines={1}>
                    Delivering to {formatAddressLabel(deliveryAddress)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Notification')}>
                <BrandIcon icon={BRAND.bellOutline} width={25} height={25} />
                <View style={styles.notifDot} />
              </TouchableOpacity>
              <BagIconButton />
            </View>
          </View>
        )}

        {/* Search Bar */}
        <AppInput
          ref={searchInputRef}
          containerStyle={{ marginHorizontal: hPad, marginBottom: 0 }}
          inputContainerStyle={[
            styles.searchBar,
            searchActive && styles.searchBarActive,
          ]}
          leftIcon={
            searchActive ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleExitSearch}>
                <BrandIcon icon={BRAND.backArrow} width={20} height={20} />
              </TouchableOpacity>
            ) : (
              <BrandIcon icon={BRAND.search} width={18} height={18} />
            )
          }
          rightIcon={
            searchQuery.length > 0 ? (
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => setSearchQuery('')}>
                <BrandIcon icon={BRAND.close} width={16} height={16} />
              </TouchableOpacity>
            ) : undefined
          }
          style={styles.searchInput}
          placeholder="Search for styles, clothes & more"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchActive(true)}
          onBlur={() => {
            if (!searchQuery.trim()) {
              setSearchActive(false);
            }
          }}
        />

        {/* Search Suggestions */}
        {searchActive && searchQuery.trim() && suggestions.length > 0 && (
          <View style={[styles.suggestionsContainer, { marginHorizontal: hPad }]}>
            {suggestions.map(name => (
              <TouchableOpacity
                key={name}
                style={styles.suggestionRow}
                activeOpacity={0.7}
                onPress={() => setSearchQuery(name)}>
                <BrandIcon icon={BRAND.search} width={15} height={15} />
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Announcement strip — text, colours and link all come from the config.
            Hidden while a search or category filter is on, so a filtered view
            shows products only (same as the search results). */}
        {!searchActive && activeCategory === 'Home' && (
          <AnnouncementBar sticky={appAnnouncementSticky} />
        )}

        {/* Home page: entirely server driven (order / visibility / config). */}
        {!searchActive && activeCategory === 'Home' ? (
          <DynamicPage
            pageType="home"
            emptyLabel="This store has no sections configured yet."
            refreshKey={refreshKey}
          />
        ) : null}

        {/* Section Header — title is resolved from the matching collection */}
        {!searchActive && activeCategory !== 'Home' && (
          <View style={[styles.sectionHeader, { paddingHorizontal: hPad }]}>
            <Text style={styles.sectionTitle}>
              {activeCategoryTitle ||
                (activeCategory === SHOP_ALL ? 'Shop' : activeCategory)}
            </Text>
          </View>
        )}

        {/* Product grid — only for search results and a picked category.
            The default home view is rendered by <DynamicPage /> above. */}
        {isListView &&
          (loading ? (
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
          ) : searchActive && !searchQuery.trim() ? null : searchActive ? (
            filteredProducts.length === 0 ? (
              <View style={styles.centerBox}>
                <View style={styles.emptyIcon}>
                  <BrandIcon icon={BRAND.search} width={28} height={28} />
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
            )
          ) : products.length === 0 ? (
            <View style={styles.centerBox}>
              <View style={styles.emptyIcon}>
                <BrandIcon icon={BRAND.box} width={30} height={30} />
              </View>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyMessage}>
                {`No items available in "${activeCategory === SHOP_ALL ? 'shop' : activeCategory}" right now. Try another category.`}
              </Text>
            </View>
          ) : (
            <View style={[styles.productGrid, { paddingHorizontal: hPad }]}>
              {products.map(item => (
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
          ))}

        <View style={{ height: 100 + insets.bottom }} />
      </ScrollView>

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

      {/* Side Menu Drawer Component */}
      <MenuDrawer
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelect={handleMenuItemSelect}
        activeCategory={activeCategory}
        logoWidth={logoWidth}
        logoHeight={logoHeight}
        onShopNow={handleShopNow}
      />
    </SafeAreaView>
  );
};

export default HomeTab;
