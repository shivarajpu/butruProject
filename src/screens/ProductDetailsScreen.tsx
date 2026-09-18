import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  ImageBackground,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import AppIconButton from '../components/AppIconButton';
import {
  Butruname,
  STAR_FILLED_SVG,
  HEART_OUTLINE_SVG,
  HEART_FILLED_SVG,
  LOCATION_PIN_SVG,
  CHEVRON_DOWN_SVG,
  CART_WHITE_SVG,
  ARROW_BACK_ICON,
} from '../assets/svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { apiService } from '../api/apiService';
import { addItem as addCartItem } from '../store/slices/cartSlice';
import type { AppDispatch } from '../store';

// Custom SVGs
const SHARE_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="#1A1A1A" stroke-width="2"/><path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="#1A1A1A" stroke-width="2"/><path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="#1A1A1A" stroke-width="2"/><path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="#1A1A1A" stroke-width="2"/></svg>`;
const CHECK_GREEN_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#2E7D32" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CHEVRON_UP_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 15L12 9L6 15" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CLOSE_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;

// Dynamic Address Type Icons
const getHomeIconSvg = (color: string) => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 5.99992L8 1.33325L14 5.99992V13.3333C14 14.0691 13.4026 14.6666 12.6667 14.6666H3.33333C2.59745 14.6666 2 14.0691 2 13.3333V5.99992" stroke="#BE185D" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="6" y="8" width="4" height="6.66667" stroke="#BE185D" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
const getWorkIconSvg = (color: string) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
const getOtherLocationSvg = (color: string) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>`;
const CHECK_ROUND_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="#B12B5B"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Input Field Icons
const USER_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const PHONE_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
const PINCODE_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const MAP_BUILDING_SVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.833344 5.00008V18.3334L6.66668 15.0001L13.3333 18.3334L19.1667 15.0001V1.66675L13.3333 5.00008L6.66668 1.66675L0.833344 5.00008V5.00008" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6.66666 1.66675V15.0001" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M13.3333 5V18.3333" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const FLAG_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>`;
const CITY_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.99999 1.33325H12C12.7359 1.33325 13.3333 1.9307 13.3333 2.66659V13.3333C13.3333 14.0691 12.7359 14.6666 12 14.6666H3.99999C3.2641 14.6666 2.66666 14.0691 2.66666 13.3333V2.66659C2.66666 1.9307 3.2641 1.33325 3.99999 1.33325V1.33325" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6 14.6667V12H10V14.6667" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.33334 4H5.34001" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10.6667 4H10.6733" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 4H8.00667" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 6.66675H8.00667" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 9.33325H8.00667" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10.6667 6.66675H10.6733" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10.6667 9.33325H10.6733" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.33334 6.66675H5.34001" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.33334 9.33325H5.34001" stroke="#9CA3AF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const PRODUCT_ENDPOINT = '/api/storefront/products';
const WISHLIST_ENDPOINT = '/api/storefront/wishlist';
const WISHLIST_ITEMS_ENDPOINT = '/api/storefront/wishlist/items';

interface ProductSku {
  size: string;
  skuCode: string;
  sellingPrice: number;
  mrp: number;
  costPrice: number;
  heightCm: number;
  weightKg: number;
  lengthCm: number;
  breadthCm: number;
  volumeCm3: number;
  warehouse: string;
  quantity: number;
}

interface ProductAttribute {
  attribute: string;
  value: string;
  _id: string;
}

interface ApiProductDetail {
  _id: string;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  images: string[];
  videos: string[];
  description: string;
  tag: string;
  tags: string[];
  color: string;
  sku: string;
  skus: ProductSku[];
  attributes: ProductAttribute[];
  returnExchangeCondition: string;
  categoryPath: string[];
  totalInventory: number;
  isOutOfStock: boolean;
  isNewArrival: boolean;
  isPopular: boolean;
  isDealOfTheDay: boolean;
  sizeType: string;
  sizeChartUrl: string;
}

interface ProductDetailApiResponse {
  success: boolean;
  data: ApiProductDetail;
}

interface ProductListApiResponse {
  success: boolean;
  count: number;
  total: number;
  data: ApiProductDetail[];
}

interface ProductVariant {
  _id: string;
  id: string;
  name: string;
  productCode: string;
  color: string;
  price: number;
  images: string[];
  image: string;
}

interface ProductVariantsApiResponse {
  success: boolean;
  count: number;
  groupId: string;
  groupName: string;
  data: ProductVariant[];
}

interface ProductVariantCardItem {
  id: string;
  name: string;
  color: string;
  price: number;
  image: string;
}

const mapApiVariant = (item: ProductVariant): ProductVariantCardItem => ({
  id: item._id || item.id,
  name: item.name,
  color: item.color,
  price: item.price ?? 0,
  image: item.images?.[0] || item.image || '',
});

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

const mapApiProductToUI = (item: ApiProductDetail) => {
  const sku = item.skus?.[0];
  const sellingPrice = sku?.sellingPrice ?? item.price ?? 0;
  const mrp = sku?.mrp ?? sellingPrice;
  const discount = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

  return {
    id: item._id,
    name: item.name,
    price: sellingPrice,
    originalPrice: mrp,
    discount,
    rating: item.rating ?? 0,
    reviews: item.reviewCount ?? 0,
    tag: item.tag || (item.isNewArrival ? 'New Arrival' : item.isPopular ? 'Best Seller' : ''),
    sizes: [...new Set((item.skus ?? []).map(s => s.size))],
    images: item.images ?? [],
    videos: item.videos ?? [],
    description: item.description ?? '',
    color: item.color ?? '',
    attributes: item.attributes ?? [],
    returnExchangeCondition: item.returnExchangeCondition ?? '',
    categoryPath: item.categoryPath ?? [],
    totalInventory: item.totalInventory ?? 0,
    isOutOfStock: item.isOutOfStock ?? false,
    sizeChartUrl: item.sizeChartUrl ?? '',
  };
};

interface ProductDetailsProps {
  route?: {
    params?: {
      product?: any;
    };
  };
  navigation?: any;
}

type UIProduct = ReturnType<typeof mapApiProductToUI>;

const RelatedProductCard = ({
  item,
  liked,
  onToggleLike,
  onSelect,
}: {
  item: any;
  liked: boolean;
  onToggleLike: () => void;
  onSelect: (prod: any) => void;
}) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.relatedCard}>
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.relatedImgArea}
        imageStyle={{ borderRadius: 10 }}>
        {item.tag && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{item.tag}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.heartBtn}
          activeOpacity={0.7}
          onPress={onToggleLike}>
          <SvgXml xml={liked ? HEART_FILLED_SVG : HEART_OUTLINE_SVG} width={14} height={14} />
        </TouchableOpacity>
      </ImageBackground>

      <Text style={styles.relatedName} numberOfLines={1}>
        {item.name}
      </Text>

      <View style={styles.priceRow}>
        <Text style={styles.relatedPrice}>₹{item.price}</Text>
        <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
      </View>

      <TouchableOpacity
        style={styles.relatedBtn}
        activeOpacity={0.8}
        onPress={() => onSelect(item)}>
        <Text style={styles.relatedBtnText}>View Item</Text>
      </TouchableOpacity>
    </View>
  );
};

const ProductDetailsScreen = ({ route, navigation }: ProductDetailsProps) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const productId = route?.params?.product?.id || route?.params?.product?._id || '';

  const [productData, setProductData] = useState<UIProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [variants, setVariants] = useState<ProductVariantCardItem[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantCardItem | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<(UIProduct & { image: string })[]>([]);

  const Navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hPad = 16;

  const loadProduct = useCallback(async (id: string, showLoader = true) => {
    if (!id) {
      setError('Product not found');
      setLoading(false);
      return;
    }
    if (showLoader) {
      setLoading(true);
    }
    setError('');
    try {
      const response = await apiService.get<ProductDetailApiResponse>(
        `${PRODUCT_ENDPOINT}/${id}`,
      );
      console.log("it is the rsponse of api" , response)
      if (response.success && response.data) {
        setProductData(mapApiProductToUI(response.data));
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  const fetchVariants = useCallback(async () => {
    if (!productId) return;
    try {
      const response = await apiService.get<ProductVariantsApiResponse>(
        `${PRODUCT_ENDPOINT}/${productId}/variants`,
      );
      if (response.success && Array.isArray(response.data)) {
        const mapped = response.data.map(mapApiVariant).filter(v => v.image);
        setVariants(mapped);
        if (mapped.length > 0) {
          const current = mapped.find(v => v.id === productId);
          setSelectedVariant(current || mapped[0]);
        }
      }
    } catch {
      // Non-fatal — variant selector simply stays hidden on failure
    }
  }, [productId]);

  const fetchRelatedProducts = useCallback(async () => {
    try {
      const response = await apiService.get<ProductListApiResponse>(
        `${PRODUCT_ENDPOINT}?limit=4&isVisible=true`,
      );
      if (response.success && Array.isArray(response.data)) {
        const mapped = response.data.slice(0, 4).map(p => {
          const ui = mapApiProductToUI(p);
          return { ...ui, image: ui.images?.[0] ?? '' };
        });
        setRelatedProducts(mapped);
      }
    } catch {
      // Non-fatal — related products section simply stays empty on failure
    }
  }, []);

  useEffect(() => {
    loadProduct(productId);
    fetchVariants();
    fetchRelatedProducts();
  }, [productId, loadProduct, fetchVariants, fetchRelatedProducts]);

  const product = productData;
  const thumbnails = product?.images?.length ? product.images : [];
  const sizes = product?.sizes?.length ? product.sizes : [];

  const [selectedImg, setSelectedImg] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [moreInfoOpen, setMoreInfoOpen] = useState(false);

  useEffect(() => {
    const firstImage = productData?.images?.[0];
    if (firstImage) {
      setSelectedImg(firstImage);
    }
  }, [productData]);

  useEffect(() => {
    const firstSize = productData?.sizes?.[0];
    if (firstSize) {
      setSelectedSize(firstSize);
    }
  }, [productData]);

  useEffect(() => {
    setIsLiked(productData ? wishlistIds.has(productData.id) : false);
  }, [productData, wishlistIds]);

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
      // Non-fatal — heart defaults to unliked
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshWishlist();
    }, [refreshWishlist]),
  );

  const handleToggleWishlist = async (id?: string) => {
    const currentId = id || productData?.id;
    if (!currentId || wishlistLoading) return;

    const isCurrentlyLiked = wishlistIds.has(currentId);
    setWishlistLoading(true);

    // Optimistic UI update
    setWishlistIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyLiked) next.delete(currentId);
      else next.add(currentId);
      return next;
    });

    try {
      if (isCurrentlyLiked) {
        await apiService.delete(`${WISHLIST_ITEMS_ENDPOINT}/${currentId}`);
      } else {
        await apiService.post(WISHLIST_ITEMS_ENDPOINT, { productId: currentId });
      }
    } catch {
      // Revert optimistic update on failure
      setWishlistIds(prev => {
        const next = new Set(prev);
        if (isCurrentlyLiked) next.add(currentId);
        else next.delete(currentId);
        return next;
      });
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleSelectVariant = (variant: ProductVariantCardItem) => {
    if (selectedVariant?.id === variant.id && productData?.id === variant.id) {
      return;
    }
    setSelectedVariant(variant);
    if (variant.image) {
      setSelectedImg(variant.image);
    }
    if (variant.id !== productData?.id) {
      loadProduct(variant.id, false);
    }
  };

  const handleAddToCart = () => {
    if (!productData) return;
    dispatch(
      addCartItem({
        productId: productData.id,
        name: productData.name,
        price: selectedVariant ? selectedVariant.price : productData.price,
        originalPrice: productData.originalPrice,
        image: selectedImg || productData.images?.[0] || '',
        size: selectedSize || (productData.sizes?.[0] ?? ''),
        color: selectedVariant?.color ?? productData.color ?? '',
      }),
    );
    Navigation.navigate('CartScreen' as never);
  };

  // Modals state
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isAddAddressModalVisible, setIsAddAddressModalVisible] = useState(false);
  const [selectedAddressType, setSelectedAddressType] = useState('Home');
  const [selectedAddressId, setSelectedAddressId] = useState('1');
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);

  const heroHeight = width * 1.1;

  const handleSelectRelated = (item: any) => {
    const relatedId = item?.id || item?._id;
    if (relatedId && /^[a-fA-F0-9]{24}$/.test(relatedId)) {
      navigation?.push('ProductDetails', { product: item });
    }
  };

  const handleOpenAddAddress = () => {
    setIsAddressModalVisible(false);
    setTimeout(() => {
      setIsAddAddressModalVisible(true);
    }, 250);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeftGroup}>
              <AppIconButton
                style={styles.headerIconBtn}
                icon={<SvgXml xml={ARROW_BACK_ICON} width={15} height={15} />}
                accessibilityLabel="Go back"
                onPress={() => navigation?.goBack()}
              />
            </View>
          </View>
          <View style={[styles.centerBox, { flex: 1 }]}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeftGroup}>
              <AppIconButton
                style={styles.headerIconBtn}
                icon={<SvgXml xml={ARROW_BACK_ICON} width={15} height={15} />}
                accessibilityLabel="Go back"
                onPress={() => navigation?.goBack()}
              />
            </View>
          </View>
          <View style={[styles.centerBox, { flex: 1 }]}>
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorMessage}>{error || 'Product not found'}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              activeOpacity={0.8}
              onPress={() => loadProduct(productId)}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeftGroup}>
            <AppIconButton
              style={styles.headerIconBtn}
              icon={<SvgXml xml={ARROW_BACK_ICON} width={15} height={15} />}
              accessibilityLabel="Go back"
              onPress={() => navigation?.goBack()}
            />

            <TouchableOpacity
              style={styles.locationWrapper}
              activeOpacity={0.7}
              onPress={() => setIsAddressModalVisible(true)}>
              {Butruname ? (
                <SvgXml xml={Butruname} width={65} height={24} />
              ) : (
                <Text style={styles.logoFallback}>Butru</Text>
              )}
              <View style={styles.locationRow}>
                <SvgXml xml={LOCATION_PIN_SVG} width={11} height={11} />
                <Text style={styles.locationText}>Delivering to Home</Text>
                <SvgXml xml={CHEVRON_DOWN_SVG} width={15} height={15} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.headerRightGroup}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              activeOpacity={0.7}
              onPress={() => setIsAddressModalVisible(true)}>
              <SvgXml xml={SHARE_SVG} width={18} height={18} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Main Content */}
          <Image source={{ uri: selectedImg || thumbnails[0] }} style={[styles.heroImage, { height: heroHeight }]} />

          {thumbnails.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbContainer}>
              {thumbnails.map((imgUrl, idx) => {
                const isSelected = selectedImg === imgUrl;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedImg(imgUrl)}
                    style={[styles.thumbBox, isSelected && styles.thumbBoxSelected]}>
                    <Image source={{ uri: imgUrl }} style={styles.thumbImage} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={[styles.section, { paddingHorizontal: hPad }]}>
            <View style={styles.ratingHeartRow}>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map(s => (
                  <SvgXml key={s} xml={STAR_FILLED_SVG} width={12} height={12}
                    style={s <= Math.round(product.rating) ? undefined : { opacity: 0.25 }}
                  />
                ))}
                <Text style={styles.reviewText}>({product.reviews})</Text>
              </View>
              <TouchableOpacity onPress={() => handleToggleWishlist()} activeOpacity={0.7}>
                <SvgXml
                  xml={isLiked ? HEART_FILLED_SVG : HEART_OUTLINE_SVG}
                  width={20}
                  height={20}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.titleText}>{product.name}</Text>

            {variants.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>SELECT COLOR</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.variantRow}>
                    {variants.map(variant => {
                      const isSelected = selectedVariant?.id === variant.id;
                      return (
                        <TouchableOpacity
                          key={variant.id}
                          onPress={() => handleSelectVariant(variant)}
                          activeOpacity={0.8}
                          style={[styles.variantChip, isSelected && styles.variantChipSelected]}>
                          <View>
                            <Image source={{ uri: variant.image }} style={styles.variantImage} />
                            <View style={styles.variantPriceBadge}>
                              <Text style={styles.variantPriceBadgeText}>Rs. {variant.price}</Text>
                            </View>
                          </View>
                          <Text style={[styles.variantName, isSelected && styles.variantNameSelected]} numberOfLines={1}>
                            {variant.color || variant.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </>
            )}

           

            {sizes.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>SELECT SIZE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.sizeRow}>
                    {sizes.map(sz => {
                      const isSelected = selectedSize === sz;
                      return (
                        <TouchableOpacity
                          key={sz}
                          onPress={() => setSelectedSize(sz)}
                          style={[styles.sizeChip, isSelected && styles.sizeChipSelected]}>
                          <Text style={[styles.sizeChipText, isSelected && styles.sizeChipTextSelected]}>
                            {sz}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </>
            )}

            <View style={styles.priceContainer}>
              <Text style={styles.currencySymbol}>Rs. </Text>
              <Text style={styles.mainPrice}>
                {selectedVariant ? selectedVariant.price : product.price}
              </Text>
              {product.originalPrice > (selectedVariant ? selectedVariant.price : product.price) && (
                <>
                  <Text style={styles.mrpText}>MRP Rs. {product.originalPrice}</Text>
                  <Text style={styles.discountBadge}>{product.discount}% OFF</Text>
                </>
              )}
            </View>
            <Text style={styles.taxText}>MRP inclusive of all taxes</Text>

            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                style={styles.buyNowBtn}
                activeOpacity={0.8}
                onPress={handleAddToCart}>
                <Text style={styles.buyNowBtnText}>Buy Now</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.addCartBtn} activeOpacity={0.8}
                onPress={handleAddToCart}>
                <SvgXml xml={CART_WHITE_SVG} width={14} height={14} />
                <Text style={styles.addCartBtnText}>Add To Cart</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Delivery Card */}
          <View style={[styles.deliveryCard, { marginHorizontal: hPad }]}>
            <View style={styles.deliveryHeader}>
              <Text style={styles.deliveryTitle}>Delivery</Text>
              <TouchableOpacity style={styles.pincodeBtn}>
                <Text style={styles.pincodeBtnText}>Check Pincode</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.deliveryFeatureRow}>
              <SvgXml xml={CHECK_GREEN_SVG} width={14} height={14} />
              <Text style={styles.deliveryFeatureText}>
                Get it in <Text style={styles.boldText}>2-3 days</Text>. Usually ships within a day
              </Text>
            </View>

            {product.returnExchangeCondition ? (
              <View style={styles.deliveryFeatureRow}>
                <SvgXml xml={CHECK_GREEN_SVG} width={14} height={14} />
                <Text style={styles.deliveryFeatureText}>{product.returnExchangeCondition}</Text>
              </View>
            ) : null}

            <View style={styles.deliveryFeatureRow}>
              <SvgXml xml={CHECK_GREEN_SVG} width={14} height={14} />
              <Text style={styles.deliveryFeatureText}>Cash On Delivery</Text>
            </View>
          </View>

          {/* Accordions */}
          <View style={[styles.accordionContainer, { marginHorizontal: hPad }]}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setDetailsOpen(!detailsOpen)}>
              <Text style={styles.accordionTitle}>PRODUCT DETAILS</Text>
              <SvgXml xml={detailsOpen ? CHEVRON_UP_SVG : CHEVRON_DOWN_SVG} width={14} height={14} />
            </TouchableOpacity>
            {detailsOpen && product.description ? (
              <Text style={styles.accordionContent}>{product.description}</Text>
            ) : detailsOpen ? (
              <Text style={styles.accordionContent}>No additional details available.</Text>
            ) : null}

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setMoreInfoOpen(!moreInfoOpen)}>
              <Text style={styles.accordionTitle}>MORE INFO</Text>
              <SvgXml xml={moreInfoOpen ? CHEVRON_UP_SVG : CHEVRON_DOWN_SVG} width={14} height={14} />
            </TouchableOpacity>
            {moreInfoOpen && (
              <View>
                {product.color ? (
                  <Text style={styles.accordionContent}>• Color: {product.color}</Text>
                ) : null}
                {product.attributes?.length > 0 ? (
                  product.attributes.map((attr) => (
                    <Text key={attr._id} style={styles.accordionContent}>
                      • {attr.attribute}: {attr.value}
                    </Text>
                  ))
                ) : null}
                {product.categoryPath?.length > 0 ? (
                  <Text style={styles.accordionContent}>• Category: {product.categoryPath.join(' > ')}</Text>
                ) : null}
                <Text style={styles.accordionContent}>• Country of Origin: India</Text>
              </View>
            )}
          </View>

          {/* Why ButruLove Banner */}
          <View style={[styles.loveBanner, { marginHorizontal: hPad }]}>
            <Text style={styles.loveScriptText}>Why</Text>
            <Text style={styles.loveBrandText}>ButruLove</Text>

            <View style={styles.loveFeaturesRow}>
              <View style={styles.loveFeatureItem}>
                <Text style={styles.loveFeatureTitle}>No Questions{'\n'}Asked</Text>
                <Text style={styles.loveFeatureSub}>Easy Returns</Text>
              </View>
              <View style={styles.loveFeatureItem}>
                <Text style={styles.loveFeatureTitle}>COD{'\n'}Available</Text>
                <Text style={styles.loveFeatureSub}>Pay On Delivery</Text>
              </View>
              <View style={styles.loveFeatureItem}>
                <Text style={styles.loveFeatureTitle}>Butru{'\n'}Promise</Text>
                <Text style={styles.loveFeatureSub}>Quality Checked</Text>
              </View>
            </View>
          </View>

          {/* Related Items */}
          <View style={styles.relatedSection}>
            <View style={[styles.relatedHeader, { paddingHorizontal: hPad }]}>
              <Text style={styles.relatedTitle}>You May Also Like</Text>
              <Text style={styles.relatedSubTitle}>Similar Products</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: hPad, gap: 12 }}>
              {relatedProducts.map(item => (
                <RelatedProductCard
                  key={item.id}
                  item={item}
                  liked={wishlistIds.has(item.id)}
                  onToggleLike={() => handleToggleWishlist(item.id)}
                  onSelect={handleSelectRelated}
                />
              ))}
            </ScrollView>
          </View>

          <View style={{ height: insets.bottom + 30 }} />
        </ScrollView>

        {/* 1. SELECT ADDRESS MODAL */}
        <Modal
          visible={isAddressModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsAddressModalVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setIsAddressModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.dragHandle} />

                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={styles.modalTitle}>Address</Text>
                      <Text style={styles.modalSubTitle}>Select delivery address</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.closeBtn}
                      onPress={() => setIsAddressModalVisible(false)}>
                      <SvgXml xml={CLOSE_SVG} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    <TouchableOpacity
                      style={[
                        styles.addressCard,
                        selectedAddressId === '1' && styles.selectedAddressCard,
                      ]}
                      onPress={() => setSelectedAddressId('1')}
                      activeOpacity={0.8}>
                      <View style={styles.addressHeaderRow}>
                        <View style={styles.addressTypeBadge}>
                          <SvgXml xml={getHomeIconSvg(theme.colors.primary)} />
                          <Text
                            style={[
                              styles.addressTypeText,
                              selectedAddressId !== '1' && { color: theme.colors.text },
                            ]}>
                            Home
                          </Text>
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>DEFAULT</Text>
                          </View>
                        </View>
                        <View style={styles.radioOuter}>
                          {selectedAddressId === '1' && <View style={styles.radioInner} />}
                        </View>
                      </View>
                      <Text style={styles.addressDetailsText}>
                        123, Green Park, Near City Mall,{'\n'}Indore, Madhya Pradesh - 452001
                      </Text>
                      <Text style={styles.addressPhoneText}>+91 98765 43210</Text>
                    </TouchableOpacity>

                    <Text style={styles.otherAddressTitle}>Other Addresses</Text>

                    <TouchableOpacity
                      style={[
                        styles.addressCard,
                        selectedAddressId === '2' && styles.selectedAddressCard,
                      ]}
                      onPress={() => setSelectedAddressId('2')}
                      activeOpacity={0.8}>
                      <View style={styles.addressHeaderRow}>
                        <View style={styles.addressTypeBadge}>
                          <SvgXml xml={getWorkIconSvg(theme.colors.textSecondary)} />
                          <Text
                            style={[
                              styles.addressTypeText,
                              selectedAddressId === '2'
                                ? { color: theme.colors.primary }
                                : { color: theme.colors.text },
                            ]}>
                            Work
                          </Text>
                        </View>
                        <View style={styles.radioOuter}>
                          {selectedAddressId === '2' && <View style={styles.radioInner} />}
                        </View>
                      </View>
                      <Text style={styles.addressDetailsText}>
                        456, Business Tower, MG Road,{'\n'}Indore, Madhya Pradesh - 452001
                      </Text>
                      <Text style={styles.addressPhoneText}>+91 98765 43211</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.addNewAddressBtn}
                      activeOpacity={0.7}
                      onPress={handleOpenAddAddress}>
                      <Text style={styles.addNewAddressText}>+ Add New Address</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* 2. ADD NEW ADDRESS MODAL */}
        <Modal
          visible={isAddAddressModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsAddAddressModalVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setIsAddAddressModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { maxHeight: '90%' }]}>
                  <View style={styles.dragHandle} />

                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={styles.modalTitle}>Add New Address</Text>
                      <Text style={styles.modalSubTitle}>Enter your address details</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.closeBtn}
                      onPress={() => setIsAddAddressModalVisible(false)}>
                      <SvgXml xml={CLOSE_SVG} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Dynamic Icon Colors Based on Active State */}
                    <Text style={styles.fieldLabel}>Address Type</Text>
                    <View style={styles.typeSelectorRow}>
                      {[
                        { type: 'Home', getIcon: getHomeIconSvg },
                        { type: 'Work', getIcon: getWorkIconSvg },
                        { type: 'Other', getIcon: getOtherLocationSvg },
                      ].map(item => {
                        const isSel = selectedAddressType === item.type;
                        const iconColor = isSel ? theme.colors.primary : theme.colors.textSecondary;

                        return (
                          <TouchableOpacity
                            key={item.type}
                            style={[styles.typeChip, isSel && styles.typeChipSelected]}
                            onPress={() => setSelectedAddressType(item.type)}>
                            <View style={styles.typeChipContent}>
                              <SvgXml xml={item.getIcon(iconColor)} width={14} height={14} />
                              <Text
                                style={[
                                  styles.typeChipText,
                                  isSel && styles.typeChipTextSelected,
                                ]}>
                                {item.type}
                              </Text>
                            </View>
                            {isSel && (
                              <View style={styles.chipCheckBadge}>
                                <SvgXml xml={CHECK_ROUND_SVG} width={16} height={16} />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Inputs with Icons */}
                    <Text style={styles.fieldLabel}>Full Name</Text>
                    <View style={styles.inputContainer}>
                      <SvgXml xml={USER_ICON_SVG} style={styles.inputLeftIcon} />
                      <TextInput
                        style={styles.formInputWithIcon}
                        placeholder="Enter full name"
                        placeholderTextColor={theme.colors.textMuted}
                      />
                    </View>

                    <Text style={styles.fieldLabel}>Mobile Number</Text>
                    <View style={styles.inputContainer}>
                      <SvgXml xml={PHONE_ICON_SVG} style={styles.inputLeftIcon} />
                      <TextInput
                        style={styles.formInputWithIcon}
                        placeholder="Enter mobile number"
                        keyboardType="phone-pad"
                        placeholderTextColor={theme.colors.textMuted}
                      />
                    </View>

                    <Text style={styles.fieldLabel}>Pincode</Text>
                    <View style={styles.pinRow}>
                      <View style={[styles.inputContainer, { flex: 1 }]}>
                        <SvgXml xml={PINCODE_ICON_SVG} style={styles.inputLeftIcon} />
                        <TextInput
                          style={styles.formInputWithIcon}
                          placeholder="Enter 6-digit pincode"
                          keyboardType="number-pad"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>
                      <TouchableOpacity style={styles.pinCheckBtn}>
                        <Text style={styles.pinCheckText}>Check Pincode</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.fieldLabel}>Address</Text>
                    <View style={styles.inputContainer}>
                      <SvgXml xml={MAP_BUILDING_SVG} style={styles.inputLeftIcon} width={15} height={15} />
                      <TextInput
                        style={styles.formInputWithIcon}
                        placeholder="House No., Building, Street, Area"
                        placeholderTextColor={theme.colors.textMuted}
                      />
                    </View>

                    <Text style={styles.fieldLabel}>Landmark (Optional)</Text>
                    <View style={styles.inputContainer}>
                      <SvgXml xml={FLAG_ICON_SVG} style={styles.inputLeftIcon} />
                      <TextInput
                        style={styles.formInputWithIcon}
                        placeholder="Enter landmark"
                        placeholderTextColor={theme.colors.textMuted}
                      />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>City</Text>
                        <View style={styles.inputContainer}>
                          <SvgXml xml={CITY_ICON_SVG} style={styles.inputLeftIcon} />
                          <TextInput
                            style={styles.formInputWithIcon}
                            placeholder="Enter city"
                            placeholderTextColor={theme.colors.textMuted}
                          />
                        </View>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>State</Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={[styles.formInputWithIcon, { paddingLeft: 12 }]}
                            placeholder="Select state"
                            placeholderTextColor={theme.colors.textMuted}
                          />
                          <SvgXml
                            xml={CHEVRON_DOWN_SVG}
                            width={14}
                            height={14}
                            style={{ marginRight: 10 }}
                          />
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.defaultCheckboxRow}
                      activeOpacity={0.7}
                      onPress={() => setIsDefaultAddress(!isDefaultAddress)}>
                      <View
                        style={[
                          styles.checkboxBox,
                          isDefaultAddress && styles.checkboxBoxSelected,
                        ]}>
                        {isDefaultAddress && (
                          <SvgXml xml={CHECK_GREEN_SVG} width={10} height={10} />
                        )}
                      </View>
                      <Text style={styles.defaultCheckboxLabel}>Set as default address</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.saveBtn}
                      activeOpacity={0.8}
                      onPress={() => setIsAddAddressModalVisible(false)}>
                      <Text style={styles.saveBtnText}>Save Address</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) => {
  const { colors } = theme;

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
     width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex:999,
    shadowOpacity:0.1,
    shadowRadius:3,
    shadowOffset:{width:0,height:1},
    elevation:2,  },
  
  locationWrapper: {
    marginLeft: 1,
  },
  logoFallback: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  /* Hero & Gallery */
  heroImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  thumbContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  thumbBox: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  thumbBoxSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  /* Section Styles */
  section: {
    marginTop: 8,
  },
  ratingHeartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reviewText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginVertical: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 8,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceVariant,
  },
  sizeChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  sizeChipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  sizeChipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  variantRow: {
    flexDirection: 'row',
    gap: 10,
  },
  variantChip: {
    width: 82,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceVariant,
    overflow: 'hidden',
  },
  variantChipSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryLight,
  },
  variantImage: {
    width: '100%',
    height: 78,
    resizeMode: 'cover',
  },
  variantPriceBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.overlay,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  variantPriceBadgeText: {
    color: colors.textOnPrimary,
    fontSize: 9,
    fontWeight: '700',
  },
  variantName: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  variantNameSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  selectedVariantText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
    gap: 6,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  mainPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  mrpText: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
    marginLeft: 4,
  },
  taxText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  buyNowBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  addCartBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addCartBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },

  /* Delivery Card */
  deliveryCard: {
    marginTop: 20,
    padding: 14,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deliveryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  pincodeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pincodeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  deliveryFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  deliveryFeatureText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  boldText: {
    fontWeight: '700',
    color: colors.text,
  },

  /* Accordions */
  accordionContainer: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 10,
    padding: 14,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  accordionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  accordionContent: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 10,
  },

  /* Love Banner */
  loveBanner: {
    marginTop: 20,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  loveScriptText: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: 'italic',
  },
  loveBrandText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 12,
  },
  loveFeaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  loveFeatureItem: {
    alignItems: 'center',
  },
  loveFeatureTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  loveFeatureSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },

  /* Related Section */
  relatedSection: {
    marginTop: 24,
  },
  relatedHeader: {
    marginBottom: 12,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  relatedSubTitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  relatedCard: {
    width: 140,
  },
  relatedImgArea: {
    width: 140,
    height: 160,
    justifyContent: 'space-between',
    padding: 6,
  },
  tagBadge: {
    backgroundColor: colors.overlay,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tagText: {
    color: colors.textOnPrimary,
    fontSize: 9,
    fontWeight: '600',
  },
  heartBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  relatedName: {
    fontSize: 12,
    color: colors.text,
    marginTop: 6,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  relatedPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  originalPrice: {
    fontSize: 10,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  relatedBtn: {
    marginTop: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  relatedBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },

  /* Loading & Error States */
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
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

  /* Modal Base */
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.shimmer,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
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

  /* Address Cards Inside Modal */
  addressCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceVariant,
    marginBottom: 12,
  },
  selectedAddressCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressTypeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  defaultBadge: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  defaultText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.success,
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  addressDetailsText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
  addressPhoneText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  otherAddressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginVertical: 8,
  },
  addNewAddressBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    marginTop: 4,
  },
  addNewAddressText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  /* Add Address Form Inputs */
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceVariant,
  },
  typeChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  typeChipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  chipCheckBadge: {
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
  },
  inputLeftIcon: {
    marginLeft: 10,
  },
  formInputWithIcon: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
    fontSize: 12,
    color: colors.text,
  },
  pinRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  pinCheckBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 16,
    justifyContent: 'center',
        borderColor: colors.primary,
        borderWidth:1

  },
  pinCheckText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  defaultCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxSelected: {
    borderColor: colors.success,
    backgroundColor: colors.surfaceVariant,
  },
  defaultCheckboxLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  });
};

export default ProductDetailsScreen;
