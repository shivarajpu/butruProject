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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import {
  Butruname,
  LOCATION_PIN_SVG,
  CHEVRON_DOWN_SVG,
  ARROW_BACK_ICON,
} from '../assets/svg';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';

// Custom SVGs
const TAG_ICON_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B12B5B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
const INFO_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
const ARROW_RIGHT_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

// Sample Initial Dynamic Cart Items Data
const INITIAL_CART = [
  {
    id: '1',
    name: 'Stylish Western Frock for Baby Girls',
    size: '3-4 Y',
    price: 299,
    mrp: 599,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: '2',
    name: 'Striped Short Sleeve Shirt',
    size: '6-4 Y',
    price: 799,
    mrp: 1577,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&q=80&w=600',
  },
];

const CartScreen = () => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Dynamic States
  const [cartItems, setCartItems] = useState(INITIAL_CART);
  const [appliedCoupon, setAppliedCoupon] = useState<number>(0);
  const [couponCode, setCouponCode] = useState('');
  const [isCouponModalVisible, setIsCouponModalVisible] = useState(false);

  // --- Dynamic Calculations ---
  const totalMRP = cartItems.reduce((acc, item) => acc + item.mrp * item.quantity, 0);
  const subTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountRs = totalMRP - subTotal;
  const discountPercentage = totalMRP > 0 ? Math.round((discountRs / totalMRP) * 100) : 0;
  
  // Total Save = MRP Discount + Coupon Discount
  const totalSave = discountRs + appliedCoupon;
  const finalTotal = Math.max(0, subTotal - appliedCoupon);

  // --- Handlers ---
  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prevItems =>
      prevItems
        .map(item => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as typeof INITIAL_CART
    );
  };

  const removeItem = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
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

            <TouchableOpacity style={styles.locationWrapper} activeOpacity={0.7}>
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
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Dynamic Cart Items List */}
          {cartItems.map(item => (
            <View key={item.id} style={styles.cartItemCard}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />

              <View style={styles.itemDetails}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <TouchableOpacity onPress={() => removeItem(item.id)}>
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
                      onPress={() => updateQuantity(item.id, -1)}>
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValueText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, 1)}>
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

          <TouchableOpacity style={styles.paymentBtn} activeOpacity={0.85}>
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
  });
};

export default CartScreen;
