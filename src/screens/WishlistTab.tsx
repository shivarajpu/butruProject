import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { ARROW_BACK_ICON, BAG_SVG, CHEVRON_DOWN_SVG } from '../assets/svg';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppIconButton from '../components/AppIconButton';

const LOCATION_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#B8235A"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
const HEART_PINK_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#B8235A"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

const INITIAL_ITEMS = [
  {
    id: '1',
    name: 'Boys Island Printed Shirt',
    price: 1199,
    originalPrice: 1599,
    discount: 30,
    rating: 5,
    reviews: 53,
    image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=600&auto=format&fit=crop',
    sizes: ['3-4 Y', '4-5 Y', '5-6 Y', '6-7 Y'],
    tag: 'New Arrival',
  },
  {
    id: '2',
    name: 'Stylish Western Frock',
    price: 299,
    originalPrice: 588,
    discount: 30,
    rating: 5,
    reviews: 53,
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=600&auto=format&fit=crop',
    sizes: ['3-4 Y', '4-5 Y', '5-6 Y', '6-7 Y'],
    tag: 'New Arrival',
  },
  {
    id: '3',
    name: 'Boys Island Printed Shirt',
    price: 1199,
    originalPrice: 1599,
    discount: 30,
    rating: 5,
    reviews: 53,
    image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=600&auto=format&fit=crop',
    sizes: ['3-4 Y', '4-5 Y', '5-6 Y', '6-7 Y'],
    tag: 'New Arrival',
  },
  {
    id: '4',
    name: 'Stylish Western Frock',
    price: 299,
    originalPrice: 588,
    discount: 30,
    rating: 5,
    reviews: 53,
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=600&auto=format&fit=crop',
    sizes: ['3-4 Y', '4-5 Y', '5-6 Y', '6-7 Y'],
    tag: 'New Arrival',
  },
];

const WishlistScreen = () => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();
  const [items, setItems] = useState(INITIAL_ITEMS);

  const navigation = useNavigation<any>();

  const isTablet = width >= 768;
  const hPad = 16;
  const gap = 12;
  const numCols = isTablet ? 3 : 2;
  const cardW = (width - hPad * 2 - gap * (numCols - 1)) / numCols;
  const dynamicTopPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
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

          <TouchableOpacity activeOpacity={0.7}>
            <SvgXml xml={BAG_SVG} width={22} height={22} />
          </TouchableOpacity>
        </View>

        {/* ── Product List ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: hPad,
            paddingTop: 12,
            paddingBottom: 40,
          }}>
          <View style={styles.grid}>
            {items.map(item => {
              const imgH = cardW * 1.05;

              return (
                <AppCard
                  key={item.id}
                  elevated={false}
                  borderRadius={12}
                  style={[styles.wishCard, { width: cardW, marginBottom: gap }]}>
                  
                  {/* Image Container (Non-clickable) */}
                  <View style={{ position: 'relative' }}>
                    <Image
                      source={{ uri: item.image }}
                      style={{ width: '100%', height: imgH, borderRadius: 10 }}
                      resizeMode="cover"
                    />

                    {item.tag && (
                      <View style={styles.tagBadge}>
                        <Text style={styles.tagText}>{item.tag}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.heartBtn}
                      onPress={() => removeItem(item.id)}
                      activeOpacity={0.8}>
                      <SvgXml xml={HEART_PINK_SVG} width={16} height={16} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.cardDetails}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.price}>₹{item.price}</Text>
                      <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
                      <Text style={styles.discountText}>{item.discount}% OFF</Text>
                    </View>

                    <View style={styles.ratingRow}>
                      <Text style={styles.starText}>★★★★★</Text>
                      <Text style={styles.reviewCount}>({item.reviews})</Text>
                    </View>

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

                    {/* Navigation only triggered here */}
                    <AppButton
                      style={styles.addToCartBtn}
                      textStyle={styles.addToCartText}
                      size="sm"
                      label="Add to Cart"
                      onPress={() => handleAddToCart(item)}
                    />
                  </View>
                </AppCard>
              );
            })}
          </View>
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
  });
};

export default WishlistScreen;
