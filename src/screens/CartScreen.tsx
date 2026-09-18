import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import {
  Butruname,
  LOCATION_PIN_SVG,
  CHEVRON_DOWN_SVG,
  ARROW_BACK_ICON,
} from '../assets/svg';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import type { RootState, AppDispatch } from '../store';
import {
  increment,
  decrement,
  removeItem as removeCartItem,
  clearCart,
} from '../store/slices/cartSlice';

// Custom SVGs
const TAG_ICON_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B12B5B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
const INFO_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
const ARROW_RIGHT_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
const SHARE_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="#1A1A1A" stroke-width="2"/><path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.6569 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="#1A1A1A" stroke-width="2"/><path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="#1A1A1A" stroke-width="2"/><path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="#1A1A1A" stroke-width="2"/></svg>`;
const CLOSE_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
const CHECK_GREEN_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#2E7D32" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CHECK_ROUND_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="#B12B5B"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Dynamic Address Type Icons
const getHomeIconSvg = (color: string) => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 5.99992L8 1.33325L14 5.99992V13.3333C14 14.0691 13.4026 14.6666 12.6667 14.6666H3.33333C2.59745 14.6666 2 14.0691 2 13.3333V5.99992" stroke="#BE185D" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="6" y="8" width="4" height="6.66667" stroke="#BE185D" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
const getWorkIconSvg = (color: string) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
const getOtherLocationSvg = (color: string) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>`;

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
</svg>`;

// Payment Flow Icons
const SUCCESS_CHECK_SVG = `<svg width="72" height="72" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#2E7D32"/><path d="M7 12.5l3 3 7-7" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const PAYMENT_UPI_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg>`;
const PAYMENT_CARD_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/></svg>`;
const PAYMENT_COD_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>`;
const HOME_WHITE_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>`;

const CartScreen = () => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useSelector((state: RootState) => state.cart.items);

  // Dynamic States
  const [appliedCoupon, setAppliedCoupon] = useState<number>(0);
  const [couponCode, setCouponCode] = useState('');
  const [isCouponModalVisible, setIsCouponModalVisible] = useState(false);

  // Address modals state
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isAddAddressModalVisible, setIsAddAddressModalVisible] = useState(false);
  const [selectedAddressType, setSelectedAddressType] = useState('Home');
  const [selectedAddressId, setSelectedAddressId] = useState('1');
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);

  const handleOpenAddAddress = () => {
    setIsAddressModalVisible(false);
    setTimeout(() => {
      setIsAddAddressModalVisible(true);
    }, 250);
  };

  // Payment modal state
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [deliveryAddressInput, setDeliveryAddressInput] = useState(
    '123, Green Park, Near City Mall, Indore, Madhya Pradesh - 452001',
  );
  const [orderId] = useState(`BTRS${Math.floor(100000 + Math.random() * 900000)}`);

  const handleProcessPayment = () => {
    setIsProcessingPayment(true);
    setIsPaymentSuccess(false);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setIsPaymentSuccess(true);
      dispatch(clearCart());
    }, 1800);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalVisible(false);
    setIsProcessingPayment(false);
    setIsPaymentSuccess(false);
  };

  const isCOD = paymentMethod === 'COD';

  // --- Dynamic Calculations ---
  const totalMRP = cartItems.reduce((acc, item) => acc + item.originalPrice * item.quantity, 0);
  const subTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountRs = totalMRP - subTotal;
  const discountPercentage = totalMRP > 0 ? Math.round((discountRs / totalMRP) * 100) : 0;
  
  // Total Save = MRP Discount + Coupon Discount
  const totalSave = discountRs + appliedCoupon;
  const finalTotal = Math.max(0, subTotal - appliedCoupon);

  // --- Handlers ---
  const updateQuantity = (cartId: string, delta: number) => {
    if (delta < 0) {
      dispatch(decrement(cartId));
    } else {
      dispatch(increment(cartId));
    }
  };

  const removeItem = (cartId: string) => {
    dispatch(removeCartItem(cartId));
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'BUTRU100') {
      setAppliedCoupon(100);
      setIsCouponModalVisible(false);
    } else if (couponCode.trim().length > 0) {
      setAppliedCoupon(50); // Default dynamic discount for any entered coupon
      setIsCouponModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation?.goBack()}
              activeOpacity={0.7}>
              <SvgXml xml={ARROW_BACK_ICON} width={15} height={15} />
            </TouchableOpacity>

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
                <SvgXml xml={CHEVRON_DOWN_SVG} width={12} height={12} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.headerRightGroup}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              activeOpacity={0.7}
              onPress={() => setIsAddressModalVisible(true)}>
              <SvgXml xml={SHARE_SVG} width={16} height={16} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Dynamic Cart Items List */}
          {cartItems.map(item => (
            <View key={item.cartId} style={styles.cartItemCard}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />

              <View style={styles.itemDetails}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <TouchableOpacity onPress={() => removeItem(item.cartId)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.itemSize}>Size: {item.size}</Text>

                <View style={styles.priceAndQtyRow}>
                  <Text style={styles.itemPrice}>Rs. {item.price}</Text>

                  {/* Quantity Controller */}
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.cartId, -1)}>
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValueText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.cartId, 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {cartItems.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Your cart is empty!</Text>
            </View>
          )}

          {/* Dynamic Coupon Card */}
          <View style={styles.couponCard}>
            <View style={styles.couponHeader}>
              <SvgXml xml={TAG_ICON_SVG} width={22} height={22} />
              <Text style={styles.couponTitle}>COUPONS</Text>
            </View>
            <Text style={styles.couponSub}>
              Apply offer coupon codes and get extra discount on your order.
            </Text>
            <TouchableOpacity
              style={styles.applyCouponBtn}
              activeOpacity={0.8}
              onPress={() => setIsCouponModalVisible(true)}>
              <Text style={styles.applyCouponBtnText}>
                {appliedCoupon > 0 ? 'Change Coupon' : 'Apply Coupon'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dynamic Price Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Price Summary</Text>
            <Text style={styles.taxSubText}>Includes GST and all government taxes</Text>

            <View style={styles.summaryRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.summaryLabel}>Total MRP :</Text>
                <SvgXml xml={INFO_ICON_SVG} width={13} height={13} />
              </View>
              <Text style={styles.summaryValueBold}>Rs. {totalMRP.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount Percentage :</Text>
              <Text style={styles.greenValueText}>{discountPercentage}%</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount (Rs.) :</Text>
              <Text style={styles.greenValueText}>Rs. {discountRs.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Save :</Text>
              <Text style={styles.greenValueText}>Rs. {totalSave.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coupon Discount :</Text>
              {appliedCoupon > 0 ? (
                <Text style={styles.greenValueText}>- Rs. {appliedCoupon}</Text>
              ) : (
                <TouchableOpacity onPress={() => setIsCouponModalVisible(true)}>
                  <Text style={styles.applyCouponLinkText}>Apply coupon</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.summaryRow, { marginTop: 12 }]}>
              <Text style={styles.totalLabel}>Total :</Text>
              <Text style={styles.totalValue}>Rs. {finalTotal.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Dynamic Sticky Bottom Bar */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.bottomBarRow}>
            <Text style={styles.bottomTotalLabel}>Total</Text>
            <Text style={styles.bottomTotalValue}>
              Rs. {finalTotal.toLocaleString('en-IN')}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.paymentBtn}
            activeOpacity={0.85}
            onPress={() => setIsPaymentModalVisible(true)}>
            <SvgXml xml={ARROW_RIGHT_SVG} width={16} height={16} />
            <Text style={styles.paymentBtnText}>Continue to Payment</Text>
          </TouchableOpacity>
        </View>

        {/* Coupon Input Modal */}
        <Modal
          visible={isCouponModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsCouponModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enter Coupon Code</Text>
              <TextInput
                style={styles.couponInput}
                placeholder="Try BUTRU100"
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setIsCouponModalVisible(false)}>
                  <Text style={{ color: theme.colors.textSecondary }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalApplyBtn} onPress={handleApplyCoupon}>
                  <Text style={{ color: theme.colors.textOnPrimary, fontWeight: '700' }}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Address Selection Modal */}
        <Modal
          visible={isAddressModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsAddressModalVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setIsAddressModalVisible(false)}>
            <View style={styles.sheetOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.sheetContent}>
                  <View style={styles.sheetDragHandle} />

                  <View style={styles.sheetHeader}>
                    <View>
                      <Text style={styles.sheetTitle}>Address</Text>
                      <Text style={styles.sheetSubTitle}>Select delivery address</Text>
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

        {/* Add New Address Modal */}
        <Modal
          visible={isAddAddressModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsAddAddressModalVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setIsAddAddressModalVisible(false)}>
            <View style={styles.sheetOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.sheetContent, { maxHeight: '90%' }]}>
                  <View style={styles.sheetDragHandle} />

                  <View style={styles.sheetHeader}>
                    <View>
                      <Text style={styles.sheetTitle}>Add New Address</Text>
                      <Text style={styles.sheetSubTitle}>Enter your address details</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.closeBtn}
                      onPress={() => setIsAddAddressModalVisible(false)}>
                      <SvgXml xml={CLOSE_SVG} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
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

        {/* Payment Modal */}
        <Modal
          visible={isPaymentModalVisible}
          transparent
          animationType="slide"
          onRequestClose={handleClosePaymentModal}>
          <TouchableWithoutFeedback onPress={handleClosePaymentModal}>
            <View style={styles.sheetOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.sheetContent, { maxHeight: '90%' }]}>
                  {!isPaymentSuccess ? (
                    <ScrollView showsVerticalScrollIndicator={false}>
                      <View style={styles.sheetDragHandle} />
                      <View style={styles.sheetHeader}>
                        <View>
                          <Text style={styles.sheetTitle}>Payment</Text>
                          <Text style={styles.sheetSubTitle}>Complete your order securely</Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={handleClosePaymentModal}>
                          <SvgXml xml={CLOSE_SVG} />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.fieldLabel}>Deliver To</Text>
                      <View style={styles.inputContainer}>
                        <SvgXml
                          xml={LOCATION_PIN_SVG}
                          width={14}
                          height={14}
                          style={styles.inputLeftIcon}
                        />
                        <TextInput
                          style={[styles.formInputWithIcon, styles.addressInput]}
                          value={deliveryAddressInput}
                          onChangeText={setDeliveryAddressInput}
                          multiline
                          placeholder="Enter delivery address"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>

                      <Text style={styles.fieldLabel}>Summary</Text>
                      <View style={styles.amountBox}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.amountBoxLabel}>Total Payable</Text>
                          <Text style={styles.amountBoxSub}>{cartItems.length} item(s)</Text>
                        </View>
                        <Text style={styles.amountBoxValue}>
                          Rs. {finalTotal.toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <Text style={styles.fieldLabel}>Select Payment Method</Text>
                      <View style={styles.paymentMethodsList}>
                        {[
                          { key: 'UPI', icon: PAYMENT_UPI_SVG, label: 'UPI', sub: 'GPay, PhonePe, Paytm' },
                          { key: 'CARD', icon: PAYMENT_CARD_SVG, label: 'Card', sub: 'Credit / Debit Cards' },
                          { key: 'COD', icon: PAYMENT_COD_SVG, label: 'Cash on Delivery', sub: 'Pay at your doorstep' },
                        ].map(m => {
                          const isSel = paymentMethod === m.key;
                          return (
                            <TouchableOpacity
                              key={m.key}
                              style={[
                                styles.paymentMethodRow,
                                isSel && styles.paymentMethodRowSelected,
                              ]}
                              activeOpacity={0.7}
                              onPress={() => setPaymentMethod(m.key)}>
                              <View
                                style={[
                                  styles.paymentMethodIconBox,
                                  isSel && styles.paymentMethodIconBoxSelected,
                                ]}>
                                <SvgXml xml={m.icon} width={18} height={18} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.paymentMethodLabel,
                                    isSel && { color: theme.colors.primary },
                                  ]}>
                                  {m.label}
                                </Text>
                                <Text style={styles.paymentMethodSub}>{m.sub}</Text>
                              </View>
                              <View style={styles.radioOuter}>
                                {isSel && <View style={styles.radioInner} />}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <TouchableOpacity
                        style={[styles.payBtn, isProcessingPayment && styles.payBtnDisabled]}
                        activeOpacity={0.85}
                        onPress={handleProcessPayment}
                        disabled={isProcessingPayment}>
                        {isProcessingPayment ? (
                          <ActivityIndicator color={theme.colors.textOnPrimary} size="small" />
                        ) : (
                          <>
                            <Text style={styles.payBtnText}>
                              {isCOD ? 'Place Order' : 'Pay Now'}
                            </Text>
                            <SvgXml xml={ARROW_RIGHT_SVG} width={15} height={15} />
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.backToCartBtn}
                        onPress={handleClosePaymentModal}
                        activeOpacity={0.7}>
                        <Text style={styles.backToCartText}>Back</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  ) : (
                    <View style={styles.successContainer}>
                      <View style={styles.successIconCircle}>
                        <SvgXml xml={SUCCESS_CHECK_SVG} width={72} height={72} />
                      </View>
                      <Text style={styles.successTitle}>Order Placed Successfully!</Text>
                      <Text style={styles.successSub}>
                        {isCOD ? 'Order will be delivered soon. Pay at your doorstep.' : 'Payment received. Order confirmed.'}
                      </Text>

                      <View style={styles.successCard}>
                        <View style={styles.successCardRow}>
                          <Text style={styles.successCardLabel}>Order ID</Text>
                          <Text style={styles.successCardValue}>{orderId}</Text>
                        </View>
                        <View style={styles.successCardRow}>
                          <Text style={styles.successCardLabel}>Amount</Text>
                          <Text style={styles.successCardValue}>
                            Rs. {finalTotal.toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={styles.successCardRow}>
                          <Text style={styles.successCardLabel}>Payment Method</Text>
                          <Text style={styles.successCardValue}>
                            {isCOD
                              ? 'Cash on Delivery'
                              : paymentMethod === 'CARD'
                              ? 'Card'
                              : 'UPI'}
                          </Text>
                        </View>
                        <View style={styles.successCardRow}>
                          <Text style={styles.successCardLabel}>Deliver To</Text>
                          <Text style={[styles.successCardValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                            {deliveryAddressInput}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity style={styles.payBtn} activeOpacity={0.85} onPress={handleClosePaymentModal}>
                        <SvgXml xml={HOME_WHITE_SVG} width={16} height={16} />
                        <Text style={styles.payBtnText}>Back to Home</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.backToCartBtn}
                        onPress={handleClosePaymentModal}
                        activeOpacity={0.7}>
                        <Text style={styles.backToCartText}>Continue Shopping</Text>
                      </TouchableOpacity>
                    </View>
                  )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: 8,
    right:15,
    position:'absolute'
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: colors.text,
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  locationWrapper: {
    marginLeft: 4,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  cartItemCard: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  itemImage: {
    width: 90,
    height: 110,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  removeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  itemSize: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: -4,
  },
  priceAndQtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  qtyValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  couponCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  couponSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginVertical: 8,
    lineHeight: 15,
  },
  applyCouponBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
  },
  applyCouponBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryContainer: {
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  taxSubText: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryValueBold: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  greenValueText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.success,
  },
  applyCouponLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  bottomBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bottomTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  bottomTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  paymentBtn: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  paymentBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  couponInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    padding: 8,
  },
  modalApplyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
    maxHeight: '75%',
  },
  sheetDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  sheetSubTitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  selectedAddressCard: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addressTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  addressTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  defaultBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  defaultText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
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
    lineHeight: 17,
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
    marginBottom: 8,
  },
  addNewAddressBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  addNewAddressText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flex: 1,
    minHeight: 34,
  },
  typeChipSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  typeChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeChipTextSelected: {
    color: colors.primary,
  },
  chipCheckBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 40,
  },
  inputLeftIcon: {
    marginRight: 8,
  },
  formInputWithIcon: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 10,
  },
  pinRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pinCheckBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  pinCheckText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  defaultCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxSelected: {
    borderColor: colors.success,
  },
  defaultCheckboxLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  addressInput: {
    minHeight: 50,
    textAlignVertical: 'top',
    paddingVertical: 10,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  amountBoxLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  amountBoxSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  amountBoxValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  paymentMethodsList: {
    gap: 10,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  paymentMethodRowSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.primaryLight,
  },
  paymentMethodIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodIconBoxSelected: {
    backgroundColor: colors.surface,
  },
  paymentMethodLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  paymentMethodSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  payBtn: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal:20
  },
  payBtnDisabled: {
    opacity: 0.7,
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  backToCartBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  backToCartText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 17,
  },
  successCard: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 20,
    marginBottom: 4,
    gap: 10,
  },
  successCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  successCardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  successCardValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  });
};

export default CartScreen;
