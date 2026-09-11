import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';

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

const THUMBNAILS = [
  'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=600',
];

const SIZES = ['3-4 Y', '4-5 Y', '5-6 Y', '6-7 Y', '7-8 Y', '8-9 Y', '9-10 Y'];

const RELATED_PRODUCTS = [
  {
    id: '101',
    name: 'Printed Summer Frock',
    price: 349,
    originalPrice: 699,
    discount: 50,
    rating: 4.6,
    reviews: 42,
    tag: 'Trending',
    sizes: ['3-4 Y', '4-5 Y'],
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=500',
  },
  {
    id: '102',
    name: 'Casual Party Dress',
    price: 499,
    originalPrice: 899,
    discount: 44,
    rating: 4.8,
    reviews: 88,
    tag: 'Best Seller',
    sizes: ['5-6 Y', '6-7 Y'],
    image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=500',
  },
  {
    id: '103',
    name: 'Cotton Floral Dress',
    price: 279,
    originalPrice: 599,
    discount: 53,
    rating: 4.3,
    reviews: 29,
    tag: 'New',
    sizes: ['3-4 Y', '4-5 Y', '5-6 Y'],
    image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&q=80&w=500',
  },
];

interface ProductDetailsProps {
  route?: {
    params?: {
      product?: any;
    };
  };
  navigation?: any;
}

const RelatedProductCard = ({ item, onSelect }: { item: any; onSelect: (prod: any) => void }) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const [isLiked, setIsLiked] = useState(false);

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
          onPress={() => setIsLiked(!isLiked)}>
          <SvgXml xml={isLiked ? HEART_FILLED_SVG : HEART_OUTLINE_SVG} width={14} height={14} />
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
  const product = route?.params?.product || {
    name: 'Stylish Western Frock for Baby Girls',
    price: 299,
    originalPrice: 588,
    discount: 30,
    rating: 4.5,
    reviews: 53,
    image: THUMBNAILS[0],
  };

  const Navigation = useNavigation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hPad = 16;

  const [selectedImg, setSelectedImg] = useState(product.image || THUMBNAILS[0]);
  const [selectedSize, setSelectedSize] = useState('3-4 Y');
  const [isLiked, setIsLiked] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [moreInfoOpen, setMoreInfoOpen] = useState(false);

  // Modals state
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isAddAddressModalVisible, setIsAddAddressModalVisible] = useState(false);
  const [selectedAddressType, setSelectedAddressType] = useState('Home');
  const [selectedAddressId, setSelectedAddressId] = useState('1');
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);

  const heroHeight = width * 1.1;

  const handleSelectRelated = (item: any) => {
    navigation?.push('ProductDetails', { product: item });
  };

  const handleOpenAddAddress = () => {
    setIsAddressModalVisible(false);
    setTimeout(() => {
      setIsAddAddressModalVisible(true);
    }, 250);
  };

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
          <Image source={{ uri: selectedImg }} style={[styles.heroImage, { height: heroHeight }]} />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbContainer}>
            {THUMBNAILS.map((imgUrl, idx) => {
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

          <View style={[styles.section, { paddingHorizontal: hPad }]}>
            <View style={styles.ratingHeartRow}>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map(s => (
                  <SvgXml key={s} xml={STAR_FILLED_SVG} width={12} height={12} />
                ))}
                <Text style={styles.reviewText}>({product.reviews})</Text>
              </View>
              <TouchableOpacity onPress={() => setIsLiked(!isLiked)} activeOpacity={0.7}>
                <SvgXml
                  xml={isLiked ? HEART_FILLED_SVG : HEART_OUTLINE_SVG}
                  width={20}
                  height={20}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.titleText}>{product.name}</Text>

            <Text style={styles.sectionLabel}>SELECT SIZE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.sizeRow}>
                {SIZES.map(sz => {
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

            <View style={styles.priceContainer}>
              <Text style={styles.currencySymbol}>Rs. </Text>
              <Text style={styles.mainPrice}>{product.price}</Text>
              <Text style={styles.mrpText}>MRP Rs. {product.originalPrice}</Text>
              <Text style={styles.discountBadge}>{product.discount}% OFF</Text>
            </View>
            <Text style={styles.taxText}>MRP inclusive of all taxes</Text>

            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                style={styles.buyNowBtn}
                activeOpacity={0.8}
                onPress={() => Navigation.navigate('CartScreen' as never)}>
                <Text style={styles.buyNowBtnText}>Buy Now</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.addCartBtn} activeOpacity={0.8}>
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

            <View style={styles.deliveryFeatureRow}>
              <SvgXml xml={CHECK_GREEN_SVG} width={14} height={14} />
              <Text style={styles.deliveryFeatureText}>Return within 3 days</Text>
            </View>

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
            {detailsOpen && (
              <Text style={styles.accordionContent}>
                • Fabric: 100% Breathable Cotton{'\n'}• Pattern: Solid Top with Layered Skirt{'\n'}• Sleeve: Cap Sleeves{'\n'}• Wash Care: Gentle Machine Wash
              </Text>
            )}

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setMoreInfoOpen(!moreInfoOpen)}>
              <Text style={styles.accordionTitle}>MORE INFO</Text>
              <SvgXml xml={moreInfoOpen ? CHEVRON_UP_SVG : CHEVRON_DOWN_SVG} width={14} height={14} />
            </TouchableOpacity>
            {moreInfoOpen && (
              <Text style={styles.accordionContent}>
                • Country of Origin: India{'\n'}• Manufactured By: Butru Kids Apparel Ltd.{'\n'}• Easy 3-day returns available.
              </Text>
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
              {RELATED_PRODUCTS.map(item => (
                <RelatedProductCard key={item.id} item={item} onSelect={handleSelectRelated} />
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
