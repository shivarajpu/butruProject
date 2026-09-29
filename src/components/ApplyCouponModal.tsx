import React, { useCallback, useEffect, useState } from 'react';
import { FONTS } from '../constants/fonts';
import { useSelector } from 'react-redux';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import { fetchCoupons, type StoreCoupon } from '../storefront/coupons';
import { formatPrice } from '../storefront/catalog';
import { selectCurrency } from '../storefront/selectors';

const { height } = Dimensions.get('window');

// --- Coupon Data Type ---
/** What one ticket row needs. Derived from `StoreCoupon` by `describeCoupon`. */
interface Coupon {
  id: string;
  code: string;
  discountText: string;
  subText: string;
  minOrderText: string;
}

const APPLIES_ON_LABEL: Record<string, string> = {
  cart_subtotal: 'cart subtotal',
  shipping: 'shipping',
};

/**
 * Turns one API coupon into the three lines a ticket can show.
 *
 * The badge carries the headline number, the middle line says what the discount
 * is computed against (and its ceiling, which a percentage coupon hiding its cap
 * would be misleading about), and the last line carries the conditions — the
 * two a shopper is most likely to trip on.
 */
const describeCoupon = (coupon: StoreCoupon, currency: string): Coupon => {
  const isPercentage = coupon.type === 'percentage';
  const amount = formatPrice(coupon.value, currency);
  const basis = APPLIES_ON_LABEL[coupon.appliesOn] ?? coupon.appliesOn;

  const discountText = isPercentage ? `${coupon.value}%\nOFF` : `${amount}\nOFF`;

  const cap =
    isPercentage && coupon.maxDiscount
      ? ` (up to ${formatPrice(coupon.maxDiscount, currency)})`
      : '';
  const subText = `${isPercentage ? `${coupon.value}% off` : `Flat ${amount} off`} on ${basis}${cap}`;

  const conditions = [
    coupon.minOrderAmount > 0
      ? `Min. order ${formatPrice(coupon.minOrderAmount, currency)}`
      : '',
    coupon.excludeDiscountedProducts ? 'Not on already-discounted items' : '',
    coupon.validTo ? `Valid till ${formatDate(coupon.validTo)}` : '',
  ].filter(Boolean);

  return {
    id: coupon.id,
    code: coupon.code,
    discountText,
    subText,
    minOrderText: conditions.join(' · '),
  };
};

const formatDate = (iso: string): string => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// --- Close (X) Icon SVG ---
interface CloseIconProps {
  color?: string;
}

const CloseIcon = ({ color = '#999' }: CloseIconProps) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

export interface ApplyCouponResult {
  success: boolean;
  message: string;
}

interface ApplyCouponModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyCoupon: (code: string) => Promise<ApplyCouponResult>;
}

export default function ApplyCouponModal({
  visible,
  onClose,
  onApplyCoupon,
}: ApplyCouponModalProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  // The store's currency, so a tenant billing in something other than INR
  // renders ₹-prefixed thresholds from its own config.
  const currency = useSelector(selectCurrency);
  const [couponInput, setCouponInput] = useState('');
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [applying, setApplying] = useState(false);
  const [coupons, setCoupons] = useState<StoreCoupon[] | null>(null);

  /**
   * The ticket list is fetched per open, not once on mount: the sheet is only
   * reachable from the cart, `eligibilityType` is per user, and a code that was
   * valid ten minutes ago may not be now. `coupons === null` is the "not
   * fetched yet" state that renders the spinner; `[]` is a real empty list.
   */
  const loadCoupons = useCallback(async () => {
    setCoupons(null);
    const list = await fetchCoupons(theme.api.storeSlug);
    setCoupons(list);
  }, [theme.api.storeSlug]);

  useEffect(() => {
    if (visible) {
      loadCoupons();
    }
  }, [visible, loadCoupons]);

  const tickets = (coupons ?? []).map(coupon => describeCoupon(coupon, currency));

  const handleSelectCoupon = (coupon: Coupon) => {
    setSelectedCouponId(coupon.id);
    setCouponInput(coupon.code);
    setMessage('');
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  const handleApply = async () => {
    const code = couponInput.trim();
    if (!code) {
      setMessageType('error');
      setMessage('Please enter coupon code');
      return;
    }
    if (applying) {
      return;
    }
    setApplying(true);
    setMessage('');
    try {
      const result = await onApplyCoupon(code);
      setMessageType(result.success ? 'success' : 'error');
      setMessage(result.message);
      if (result.success) {
        setCouponInput('');
        setSelectedCouponId(null);
        onClose();
      }
    } catch {
      setMessageType('error');
      setMessage('Something went wrong. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      {/* Backdrop: Clicking outside closes the modal */}
      <Pressable style={styles.backdrop} onPress={handleClose}>
        {/* Modal Container */}
        <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
          {/* Top Handle Bar */}
          <View style={styles.dragIndicator} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Apply Coupon</Text>
              <Text style={styles.subtitle}>Apply a coupon and save more!</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
              <CloseIcon color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Coupon Input Area */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter coupon code"
              placeholderTextColor={theme.colors.textMuted}
              value={couponInput}
              onChangeText={text => {
                setCouponInput(text);
                setMessage('');
              }}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
              activeOpacity={0.8}
              disabled={applying}
            >
              {applying ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={styles.applyButtonText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* API response message */}
          {message ? (
            <Text
              style={[
                styles.messageText,
                messageType === 'success' ? styles.messageSuccess : styles.messageError,
              ]}>
              {message}
            </Text>
          ) : null}

          {/* Available Coupons Section */}
          <Text style={styles.sectionTitle}>Available Coupons</Text>

          {coupons === null ? (
            <View style={styles.stateBox}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : tickets.length === 0 ? (
            // The input above still works, so this is an invitation, not a dead end.
            <Text style={styles.stateText}>
              No coupons are running right now. You can still enter a code above.
            </Text>
          ) : (
            <FlatList
              data={tickets}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => {
                const isSelected = selectedCouponId === item.id;
                return (
                  <TouchableOpacity
                    style={styles.couponCard}
                    onPress={() => handleSelectCoupon(item)}
                    activeOpacity={0.85}>
                    {/* Left Side Discount Banner */}
                    <View style={styles.cardLeft}>
                      <Text style={styles.discountBadgeText}>{item.discountText}</Text>
                    </View>

                    {/* Dashed Ticket Divider */}
                    <View style={styles.dashedLineContainer}>
                      <View style={styles.topNotch} />
                      <View style={styles.dashedLine} />
                      <View style={styles.bottomNotch} />
                    </View>

                    {/* Right Side Details */}
                    <View style={styles.cardRight}>
                      <View style={styles.textDetails}>
                        <Text style={styles.couponCode}>{item.code}</Text>
                        <Text style={styles.couponSubText} numberOfLines={2}>
                          {item.subText}
                        </Text>
                        {!!item.minOrderText && (
                          <Text style={styles.minOrderText} numberOfLines={2}>
                            {item.minOrderText}
                          </Text>
                        )}
                      </View>

                      {/* Custom Radio Button */}
                      <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                        {isSelected && <View style={styles.radioInnerCircle} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
      maxHeight: height * 0.85,
    },
    dragIndicator: {
      width: 48,
      height: 5,
      backgroundColor: colors.border,
      borderRadius: 3,
      alignSelf: 'center',
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
      fontFamily: fontFamily.heading,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    input: {
      flex: 1,
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.surface,
      marginRight: 10,
      fontFamily: fontFamily.regular,
    },
    applyButton: {
      width: 90,
      height: 48,
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    applyButtonText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '700',
      fontFamily: FONTS.poppinsBold,
    },
    messageText: {
      fontSize: 12,
      marginBottom: 12,
      fontFamily: fontFamily.regular,
    },
    messageSuccess: {
      color: colors.success,
    },
    messageError: {
      color: colors.error,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 14,
      fontFamily: fontFamily.heading,
    },
    listContainer: {
      paddingBottom: 12,
    },
    stateBox: {
      paddingVertical: 28,
      alignItems: 'center',
    },
    stateText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: 20,
      paddingHorizontal: 12,
      fontFamily: fontFamily.regular,
    },
    couponCard: {
      flexDirection: 'row',
      backgroundColor: colors.coupanBackroun,
      borderRadius: 16,
      marginBottom: 14,
      overflow: 'hidden',
      height: 94,
    },
    cardLeft: {
      width: '28%',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    discountBadgeText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '900',
      textAlign: 'center',
      lineHeight: 18,
      fontFamily: FONTS.poppinsBold,
    },
    dashedLineContainer: {
      width: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    topNotch: {
      position: 'absolute',
      top: -6,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.surface,
      zIndex: 1,
    },
    bottomNotch: {
      position: 'absolute',
      bottom: -6,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.surface,
      zIndex: 1,
    },
    dashedLine: {
      height: '70%',
      width: 1,
      borderWidth: 1,
      borderColor: colors.primaryLight,
      borderStyle: 'dashed',
    },
    cardRight: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
    },
    textDetails: {
      flex: 1,
      marginRight: 8,
    },
    couponCode: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 2,
      fontFamily: fontFamily.heading,
    },
    couponSubText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 3,
      fontFamily: fontFamily.regular,
    },
    minOrderText: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: fontFamily.regular,
    },
    radioButton: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: colors.textMuted,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    radioButtonSelected: {
      borderColor: colors.primary,
    },
    radioInnerCircle: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
  });
};