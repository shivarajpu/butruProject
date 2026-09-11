import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Platform,
  StatusBar,
  ImageBackground,
  Modal,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useAppTheme } from '../theme/useAppTheme';
import AppInput from '../components/AppInput';
import type { AppTheme } from '../theme/types';
import {
  MENU_SVG,
  Butruname,
  HOME_ACTIVE_SVG,
  CLOTHING_SVG,
  SHOES_SVG,
  ACCESSORIES_SVG,
  TOYS_SVG,
  WISHLIST_SVG,
  ORDERS_SVG,
  ACCOUNT_SVG,
  HELP_SVG,
  STAR_FILLED_SVG,
  HEART_FILLED_SVG,
  HEART_OUTLINE_SVG,
  CART_WHITE_SVG,
  CLOSE_SVG,
  LOCATION_PIN_SVG,
  CHEVRON_DOWN_SVG,
  BELL_SVG,
  BAG_SVG,
  SEARCH_SVG,
  Sidebaarimage,
} from '../assets/svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

// ─── Drawer Menu Config ────────────────────────────────────────────────────────

const DRAWER_ITEMS = [
  { id: '1', name: 'Home', icon: HOME_ACTIVE_SVG, active: true },
  { id: '2', name: 'Clothing', icon: CLOTHING_SVG, active: false },
  { id: '3', name: 'Shoes', icon: SHOES_SVG, active: false },
  { id: '4', name: 'Accessories', icon: ACCESSORIES_SVG, active: false },
  { id: '5', name: 'Toys', icon: TOYS_SVG, active: false },
  { id: '6', name: 'Wishlist', icon: WISHLIST_SVG, active: false },
  { id: '7', name: 'My Orders', icon: ORDERS_SVG, active: false },
  { id: '8', name: 'Account', icon: ACCOUNT_SVG, active: false },
  { id: '9', name: 'Help & Support', icon: HELP_SVG, active: false },
];

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

const PRODUCTS = [
  {
    id: '1',
    name: 'Stylish Western Frock....',
    price: 299,
    originalPrice: 588,
    discount: 30,
    rating: 4.5,
    reviews: 53,
    tag: 'New Arrival',
    sizes: ['3-4 Y', '4-5 Y', '5-6 Y', '6-7 Y'],
    image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=500',
  },
  {
    id: '2',
    name: 'Stylish Western Frock',
    price: 299,
    originalPrice: 588,
    discount: 30,
    rating: 4.5,
    reviews: 53,
    tag: 'New Arrival',
    sizes: ['3-4 Y', '4-5 Y', '5-6 Y', '6-7 Y'],
    image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&q=80&w=500',
  },
];

const BANNER_SLIDES = [
  {
    id: '1',
    offerText: 'STARTING @ ₹99',
    image: 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: '2',
    offerText: 'FLAT 50% OFF',
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=1000',
  },
];

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
    bannerOverlay: {
      padding: 12,
      alignItems: 'center',
    },
    offerBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 6,
    },
    offerText: {
      color: colors.textOnPrimary,
      fontWeight: '800',
      fontSize: 15,
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
    // Drawer Overlay Styles
    drawerOverlay: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: colors.overlay,
    },
    drawerBackdrop: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
    drawerContent: {
      width: '82%',
      height: '100%',
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingBottom: 20,
      elevation: 10,
      shadowColor: colors.text,
      shadowOffset: { width: 4, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
    },
    drawerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 8,
    },
    closeBtn: {
      padding: 6,
    },
    drawerList: {
      gap: 4,
      marginBottom: 20,
    },
    drawerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 12,
      gap: 14,
    },
    drawerItemActive: {
      backgroundColor: colors.primaryLight,
    },
    drawerItemText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      fontFamily: fontFamily.medium,
    },
    drawerItemTextActive: {
      color: colors.primary,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
    },
    shopNowBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      alignSelf: 'flex-start',
      zIndex: 999,
      position: 'absolute',
      bottom: 24,
      left: 13,
    },
    shopNowText: {
      color: colors.textOnPrimary,
      fontSize: 9,
      fontWeight: '700',
    },
    promoSubtitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.primary,
      marginBottom: 8,
      fontFamily: fontFamily.bold,
    },
    promoImg: {
      width: 70,
      height: 70,
      borderRadius: 35,
      marginLeft: 8,
    },
  });
};

// ─── StarRating Component ──────────────────────────────────────────────────────

const StarRating = ({ rating }: { rating: number }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
    {[1, 2, 3, 4, 5].map(s => (
      <SvgXml key={s} xml={STAR_FILLED_SVG} width={10} height={10} />
    ))}
  </View>
);

// ─── BannerSlider Component ────────────────────────────────────────────────────

const BannerSlider = ({ screenWidth }: { screenWidth: number }) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const [active, setActive] = useState(0);
  const bannerHeight = Math.min(screenWidth * 0.48, 220);

  return (
    <View style={{ marginHorizontal: screenWidth * 0.04, marginBottom: 16 }}>
      <ImageBackground
        source={{ uri: BANNER_SLIDES[active].image }}
        style={[styles.bannerCard, { height: bannerHeight }]}
        imageStyle={{ borderRadius: 16 }}>
        <View style={styles.bannerOverlay}>
          <View style={styles.offerBadge}>
            <Text style={styles.offerText}>{BANNER_SLIDES[active].offerText}</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.dotsRow}>
        {BANNER_SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setActive(i)}>
            <View style={[styles.dot, i === active && styles.activeDot]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── ProductCard Component ─────────────────────────────────────────────────────

const ProductCard = ({
  item,
  cardWidth,
  onAddToCart,
}: {
  item: (typeof PRODUCTS)[0];
  cardWidth: number;
  onAddToCart: () => void;
}) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const imgHeight = cardWidth * 1.15;

  return (
    <View style={[styles.productCard, { width: cardWidth }]}>
      <View style={{ position: 'relative' }}>
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
            onPress={() => setIsLiked(!isLiked)}>
            <SvgXml xml={isLiked ? HEART_FILLED_SVG : HEART_OUTLINE_SVG} width={16} height={16} />
          </TouchableOpacity>
        </ImageBackground>
      </View>

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
        style={styles.addToCartBtn}
        activeOpacity={0.8}
        onPress={onAddToCart}>
        <SvgXml xml={CART_WHITE_SVG} width={13} height={13} />
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Side Menu Drawer Modal Component ──────────────────────────────────────────

const MenuDrawer = ({
  visible,
  onClose,
  logoWidth,
  logoHeight,
}: {
  visible: boolean;
  onClose: () => void;
  logoWidth: number;
  logoHeight: number;
}) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.drawerOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.drawerBackdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.drawerContent, { paddingTop: insets.top + 10 }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header with Logo and Close Button */}
            <View style={styles.drawerHeader}>
              {Butruname ? (
                <SvgXml xml={Butruname} width={logoWidth * 1.1} height={logoHeight * 1.1} />
              ) : (
                <Text style={styles.logoFallback}>{theme.appName}</Text>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <SvgXml xml={CLOSE_SVG} width={18} height={18} />
              </TouchableOpacity>
            </View>

            {/* Menu Items List */}
            <View style={styles.drawerList}>
              {DRAWER_ITEMS.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.drawerItem, item.active && styles.drawerItemActive]}
                  activeOpacity={0.7}
                  onPress={onClose}>
                  <SvgXml xml={item.icon} width={21} height={21} />
                  <Text style={[styles.drawerItemText, item.active && styles.drawerItemTextActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bottom Promo Banner */}
            <View>
              <TouchableOpacity style={styles.shopNowBtn} activeOpacity={0.8}>
                <Text style={styles.shopNowText}>Shop Now →</Text>
              </TouchableOpacity>
              <SvgXml xml={Sidebaarimage} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main HomeTab Component ────────────────────────────────────────────────────

const HomeTab = () => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const [menuOpen, setMenuOpen] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isTablet = width >= 768;
  const hPad = width * 0.04;
  const logoWidth = Math.min(width * 0.22, 90);
  const logoHeight = logoWidth * 0.4;
  const collectionCardW = Math.min(width * 0.3, 120);
  const productCardW = (width - hPad * 2 - 12) / 2;

  const handleProductPress = (productItem: any) => {
    navigation?.push('ProductDetails', { product: productItem });
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
                <Text style={styles.locationText}>Delivering to Home</Text>
                <SvgXml xml={CHEVRON_DOWN_SVG} width={10} height={10} />
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <SvgXml xml={BELL_SVG} width={22} height={22} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <SvgXml xml={BAG_SVG} width={22} height={22} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <AppInput
          containerStyle={{ marginHorizontal: hPad, marginBottom: 0 }}
          inputContainerStyle={styles.searchBar}
          leftIcon={<SvgXml xml={SEARCH_SVG} width={18} height={18} />}
          style={styles.searchInput}
          placeholder="Search for styles, clothes & more"
        />

        {/* Top Banner Slider */}
        <BannerSlider screenWidth={width} />

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
          <Text style={styles.sectionTitle}>Premium Fashion for Kids</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.showAll}>Show all</Text>
          </TouchableOpacity>
        </View>

        {/* Product Grid */}
        <View style={[styles.productGrid, { paddingHorizontal: hPad }]}>
          {PRODUCTS.map(item => (
            <ProductCard
              key={item.id}
              item={item}
              cardWidth={productCardW}
              onAddToCart={() => handleProductPress(item)}
            />
          ))}
        </View>

        <View style={{ height: 100 + insets.bottom }} />
      </ScrollView>

      {/* Side Menu Drawer Component */}
      <MenuDrawer
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        logoWidth={logoWidth}
        logoHeight={logoHeight}
      />
    </SafeAreaView>
  );
};

export default HomeTab;
