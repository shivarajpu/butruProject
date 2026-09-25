import React, { useState, useEffect } from 'react';
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
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import {
  Butruname,
  LOCATION_PIN_SVG,
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
import { useProfile, type Address, formatAddressLabel } from '../hooks/useProfile';
import AddressSelectionModal from '../components/AddressSelectionModal';
import AddAddressModal from '../components/AddAddressModal';
import ApplyCouponModal, { type ApplyCouponResult } from '../components/ApplyCouponModal';
import { apiService } from '../api/apiService';

// Custom SVGs
const TAG_ICON_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B12B5B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
const INFO_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
const ARROW_RIGHT_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
const SHARE_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="#1A1A1A" stroke-width="2"/><path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.6569 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="#1A1A1A" stroke-width="2"/><path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="#1A1A1A" stroke-width="2"/><path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="#1A1A1A" stroke-width="2"/></svg>`;
const CLOSE_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;

// Payment Flow Icons
const SUCCESS_CHECK_SVG = `<svg width="72" height="72" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#2E7D32"/><path d="M7 12.5l3 3 7-7" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const PAYMENT_UPI_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg>`;
const PAYMENT_CARD_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/></svg>`;
const PAYMENT_COD_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>`;
const HOME_WHITE_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>`;

const CREATE_ORDER_ENDPOINT = '/api/storefront/orders/create';
const COUPON_APPLY_ENDPOINT = '/api/storefront/coupon/apply';

interface CouponApplyResponse {
  success: boolean;
  message?: string;
  discount?: number;
}

const CartScreen = () => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const addressMaxWidth = Math.min(width * 0.42, 200);
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useSelector((state: RootState) => state.cart.items);

  // Dynamic States
  const [appliedCoupon, setAppliedCoupon] = useState<number>(0);
  const [isCouponModalVisible, setIsCouponModalVisible] = useState(false);

  // Address modals state
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isAddAddressModalVisible, setIsAddAddressModalVisible] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const { profile, addresses, refresh } = useProfile();

  useEffect(() => {
    if (!selectedAddressId && addresses.length) {
      const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress._id || '0');
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress =
    addresses.find(a => (a._id || '') === selectedAddressId) || null;

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
              setDeliveryAddressInput('');
            }
            refresh();
          } catch (error) {
            Alert.alert(
              'Delete Failed',
              error instanceof Error
                ? error.message
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

  // Payment modal state
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [deliveryAddressInput, setDeliveryAddressInput] = useState('');

  useEffect(() => {
    if (selectedAddress) {
      const addressText =
        selectedAddress.fullAddress ||
        [
          selectedAddress.street,
          selectedAddress.locality,
          selectedAddress.city,
          selectedAddress.state,
        ]
          .filter(Boolean)
          .join(', ') +
          (selectedAddress.pincode ? ` - ${selectedAddress.pincode}` : '');
      setDeliveryAddressInput(addressText);
    }
  }, [selectedAddress]);

  const [orderId, setOrderId] = useState('');

  const generateIdempotencyKey = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleProcessPayment = async () => {
    if (isProcessingPayment) {
      return;
    }
    if (!cartItems.length) {
      return;
    }
    if (!selectedAddress) {
      Alert.alert('Missing Address', 'Please select a delivery address.');
      return;
    }
    setIsProcessingPayment(true);
    setIsPaymentSuccess(false);
    try {
      const customer = {
        name: profile?.name || selectedAddress.name || '',
        email: profile?.email || '',
        phone: profile?.phone || selectedAddress.phone || '',
      };

      const items = cartItems.map(item => ({
        productId: item.productId,
        productName: item.name,
        productCode: item.productCode || '',
        quantity: item.quantity,
        size: item.size,
        sku: item.size,
        variant: item.size,
        color: item.color,
      }));

      const shippingAddress = {
        name: selectedAddress.name || customer.name,
        phone: selectedAddress.phone || customer.phone,
        street: selectedAddress.street || '',
        city: selectedAddress.city || '',
        state: selectedAddress.state || '',
        pincode: selectedAddress.pincode || '',
        country: selectedAddress.country || 'India',
      };

      const payload = {
        idempotencyKey: generateIdempotencyKey(),
        customer,
        items,
        status: 'Pending',
        orderType: 'Regular',
        shippingAddress,
        pricing: {
          subtotal: subTotal,
          shippingCharges: 0,
          tax: 0,
          discount: appliedCoupon,
          total: finalTotal,
        },
        payment: {
          mode: paymentMethod,
          paymentStatus: 'Pending',
          amount: finalTotal,
        },
      };

      const response = await apiService.post<any>(CREATE_ORDER_ENDPOINT, payload);

      if (response?.success) {
        const placedOrder = response.data ?? response;
        const placedOrderNumber = placedOrder?.orderNumber || placedOrder?._id || placedOrder?.id || '';
        setOrderId(placedOrderNumber ? `#${placedOrderNumber}` : `BTRS${Math.floor(100000 + Math.random() * 900000)}`);
        dispatch(clearCart());
        setIsProcessingPayment(false);
        setIsPaymentSuccess(true);
      } else {
        setOrderId('');
        setIsProcessingPayment(false);
        Alert.alert(
          'Order Failed',
          response?.message || 'Something went wrong. Please try again.',
        );
      }
    } catch (error) {
      setOrderId('');
      setIsProcessingPayment(false);
      Alert.alert(
        'Order Failed',
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      );
    }
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

  const handleApplyCoupon = async (code: string): Promise<ApplyCouponResult> => {
    const trimmed = code.trim();
    if (!trimmed) {
      return { success: false, message: 'Please enter coupon code' };
    }
    if (cartItems.length === 0) {
      return { success: false, message: 'Your cart is empty.' };
    }
    try {
      const response = await apiService.post<CouponApplyResponse>(COUPON_APPLY_ENDPOINT, {
        code: trimmed,
        subtotal: subTotal,
        cartItems: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          price: item.price,
          finalPrice: item.price * item.quantity,
          category: item.name,
        })),
      });
      if (response.success) {
        setAppliedCoupon(response.discount ?? 0);
        return { success: true, message: response.message || 'Coupon applied successfully!' };
      }
      return { success: false, message: response.message || 'Invalid coupon code.' };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.',
      };
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
                <SvgXml xml={LOCATION_PIN_SVG} width={12} height={12} />
<Text style={[styles.locationText, { maxWidth: addressMaxWidth }]} numberOfLines={1}>
                   Delivering to {formatAddressLabel(selectedAddress)}
                 </Text>
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
        {cartItems.length > 0 && (
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
        )}

        {/* Coupon Modal */}
        <ApplyCouponModal
          visible={isCouponModalVisible}
          onClose={() => setIsCouponModalVisible(false)}
          onApplyCoupon={handleApplyCoupon}
        />

        {/* Address Selection Modal */}
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

        {/* Add New Address Modal */}
        <AddAddressModal
          visible={isAddAddressModalVisible}
          editingAddress={editingAddress}
          onClose={() => setIsAddAddressModalVisible(false)}
          onSaved={handleAddressSaved}
        />

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
                          width={12}
                          height={12}
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
    flexShrink: 1,
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
