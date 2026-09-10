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
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { useNavigation } from '@react-navigation/native';
import { ARROW_BACK_ICON, BAG_SVG, CHEVRON_DOWN_SVG } from '../assets/svg';

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
            <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7} onPress={handleBackPress}>
              <SvgXml xml={ARROW_BACK_ICON} width={15} height={15} />
            </TouchableOpacity>

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
                <View
                  key={item.id}
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
                    <TouchableOpacity
                      style={styles.addToCartBtn}
                      activeOpacity={0.85}
                      onPress={() => handleAddToCart(item)}>
                      <SvgXml
                        xml={`<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="#FFFFFF" stroke-width="2"/><path d="M3 6H21" stroke="#FFFFFF" stroke-width="2"/></svg>`}
                      />
                      <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const PRIMARY_COLOR = '#B8235A';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    backgroundColor: '#FFFFFF',
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
    fontFamily: FONTS.inter28Bold,
    color: '#1A1A1A',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  deliveryText: {
    fontSize: 12,
    color: '#767575',
    fontFamily: FONTS.poppinsMedium,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wishCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    overflow: 'hidden',
  },
  tagBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#2A233D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardDetails: {
    padding: 10,
  },
  itemName: {
    fontSize: 13,
    fontFamily: FONTS.inter18SemiBold,
    color: '#1A1A1A',
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
    fontFamily: FONTS.inter28Bold,
    color: PRIMARY_COLOR,
  },
  originalPrice: {
    fontSize: 11,
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  discountText: {
    fontSize: 9,
    color: '#00875A',
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  starText: {
    color: '#FFB800',
    fontSize: 11,
    letterSpacing: 1,
  },
  reviewCount: {
    fontSize: 10,
    color: '#888888',
  },
  sizeContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  sizeChip: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  sizeText: {
    fontSize: 9,
    color: '#555555',
  },
  addToCartBtn: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.inter18SemiBold,
  },
});

export default WishlistScreen;