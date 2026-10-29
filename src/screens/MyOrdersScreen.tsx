import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  Clipboard,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import BlobUtil from 'react-native-blob-util';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';
import type { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import { FONTS } from '../constants/fonts';
import { apiService } from '../api/apiService';
import { downloadOrderInvoice } from '../api/invoice';

// ─── Icon Builders (Theme-aware) ──────────────────────────────────────────────

const backArrowIcon = (color: string) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const bagIcon = (color: string) =>
  `<svg width="19" height="21" viewBox="0 0 19 21" fill="none"><path d="M1.51894 8.19807C1.55715 7.72193 1.7733 7.27766 2.12435 6.95373C2.47539 6.6298 2.93557 6.44998 3.41323 6.45007H14.8683C15.346 6.44998 15.8061 6.6298 16.1572 6.95373C16.5082 7.27766 16.7244 7.72193 16.7626 8.19807L17.5254 17.698C17.5464 17.9595 17.5131 18.2224 17.4274 18.4703C17.3418 18.7182 17.2058 18.9457 17.0279 19.1385C16.8501 19.3312 16.6342 19.4851 16.394 19.5903C16.1538 19.6956 15.8944 19.75 15.6321 19.75H2.64943C2.38716 19.75 2.12774 19.6956 1.88752 19.5903C1.64729 19.4851 1.43145 19.3312 1.2536 19.1385C1.07575 18.9457 0.939725 18.7182 0.854102 18.4703C0.768479 18.2224 0.735108 17.9595 0.75609 17.698L1.51894 8.19807Z" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.9407 9.29997V4.54999C12.9407 3.54217 12.5403 2.57563 11.8277 1.86299C11.115 1.15035 10.1485 0.75 9.14069 0.75C8.13287 0.75 7.16632 1.15035 6.45369 1.86299C5.74105 2.57563 5.3407 3.54217 5.3407 4.54999V9.29997" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const searchIcon = (color: string) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="${color}" stroke-width="2"/><path d="M21 21L16.65 16.65" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg>`;

const filterIcon = (color: string) =>
  `<svg width="18" height="18" viewBox="0 0 27 27" fill="none"><path d="M12.375 9L22.5 9" stroke="${color}" stroke-width="2" stroke-linecap="round"/><path d="M4.5 18L15.75 18" stroke="${color}" stroke-width="2" stroke-linecap="round"/><ellipse cx="7.875" cy="9" rx="3.375" ry="3.375" transform="rotate(90 7.875 9)" stroke="${color}" stroke-width="2" stroke-linecap="round"/><ellipse cx="19.125" cy="18" rx="3.375" ry="3.375" transform="rotate(90 19.125 18)" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg>`;

const boxIcon = (color: string) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const crossIcon = (color: string) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const crossCircleIcon = (color: string) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="${color}"/><path d="M8 8l8 8M16 8l-8 8" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const checkCircleIcon = (color: string) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="${color}"/><path d="M8 12l3 3 5-5" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const checkIcon = (color: string) =>
  `<svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const infoIcon = (color: string, textColor: string) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="${color}"/><text x="12" y="16" font-size="12" font-weight="bold" fill="${textColor}" text-anchor="middle">i</text></svg>`;

const locationIcon = (color: string) =>
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/></svg>`;

const chevRight = (color: string) =>
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const copyIcon = (color: string) =>
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="${color}" stroke-width="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="${color}" stroke-width="2"/></svg>`;

const gearIcon = (color: string) =>
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="${color}" stroke-width="2"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="${color}" stroke-width="2"/></svg>`;

const truckIcon = (color: string) =>
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="15" height="13" stroke="${color}" stroke-width="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" stroke="${color}" stroke-width="2"/><circle cx="5.5" cy="18.5" r="2.5" fill="${color}"/><circle cx="18.5" cy="18.5" r="2.5" fill="${color}"/></svg>`;

const starIcon = (filled: boolean, size: number, color: string) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" ${filled ? `fill="${color}"` : 'fill="none"'}${filled ? '' : ` stroke="${color}" stroke-width="1.5"`}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>`;

// ─── Types & API Contracts ────────────────────────────────────────────────────

type ProductItem = {
  id: string;
  productId: string;
  code?: string;
  name: string;
  size: string;
  qty: number;
  price: number;
  originalPrice: number;
  image: string;
};

type OrderType = {
  id: string;
  apiOrderId: string;
  orderId: string;
  orderNumber: string;
  date: string;
  rawDate: string;
  totalAmount: number;
  subtotal: number;
  tax: number;
  discount: number;
  shippingCharges: number;
  status: string;
  trackingStatus: string;
  trackingNumber?: string;
  items: ProductItem[];
  shippingAddress?: {
    name?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  paymentMethod?: string;
};

type OrderItemAsset = {
  _id: string;
  productId:
    | string
    | {
        _id: string;
        name: string;
        productCode: string;
        price: number;
      };
  productName: string;
  productCode: string;
  quantity: number;
  size: string;
  sku: string;
  variant?: string;
  color?: string;
  pricePerUnit: number;
  finalPrice: number;
  weight?: number;
  image?: string;
};

type ApiOrder = {
  _id: string;
  id: string;
  orderId?: string;
  orderNumber: string;
  idempotencyKey: string;
  placedAt?: string;
  createdAt?: string;
  status: string;
  orderType: string;
  items: OrderItemAsset[];
  shippingAddress?: {
    name?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  payment?: {
    mode?: string;
    paymentStatus?: string;
    amount?: number;
  };
  pricing?: {
    subtotal?: number;
    shippingCharges?: number;
    tax?: number;
    discount?: number;
    total?: number;
  };
  tracking?: {
    currentStatus?: string;
    trackingNumber?: string;
    tracking_number?: string;
    awb?: string;
    statusHistory?: { status: string; timestamp: string }[];
  };
};

type OrdersResponse = {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: ApiOrder[];
};

type ApiReview = {
  _id?: string;
  id?: string;
  orderId?: string;
  productId?: string;
  rating?: number;
  reviewText?: string;
  comment?: string;
  images?: string[];
};

type ProductReviewsResponse = {
  success?: boolean;
  data?: ApiReview[];
};

type ReviewMutationResponse = {
  success?: boolean;
  message?: string;
  data?: ApiReview;
};

const MAX_REVIEW_IMAGES = 3;

type SavedReview = {
  id: string;
  rating: number;
  comment: string;
  images: string[];
};

const toSavedReview = (review?: ApiReview | null): SavedReview | null => {
  const id = review?._id || review?.id;
  if (!id) {
    return null;
  }

  return {
    id,
    rating: Number(review?.rating) || 0,
    comment: review?.reviewText || review?.comment || '',
    images: Array.isArray(review?.images) ? review.images.filter(Boolean) : [],
  };
};

type CancelOrderResponse = {
  success: boolean;
  message: string;
  data: ApiOrder;
};

type CancellationReasonsResponse = {
  success: boolean;
  data: {
    customer: string[];
    internal: string[];
  };
};

const MY_ORDERS_ENDPOINT = '/api/storefront/orders/my?limit=200&page=1';
const CANCEL_ORDER_ENDPOINT = '/api/storefront/orders';
const CANCELLATION_REASONS_ENDPOINT = '/api/storefront/orders/cancellation-reasons';
const REVIEWS_ENDPOINT = '/api/reviews';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];

const formatOrderDate = (iso?: string): string => {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (isNaN(date.getTime())) {
    return '';
  }
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

const formatMoney = (value: number): string => {
  const rounded = Math.round(value * 100) / 100;
  return rounded % 1 === 0 ? `${rounded}` : rounded.toFixed(2);
};

const mapApiOrder = (order: ApiOrder): OrderType => {
  const items: ProductItem[] = (order.items || []).map(item => {
    const productId =
      typeof item.productId === 'object' && item.productId
        ? item.productId._id
        : typeof item.productId === 'string'
        ? item.productId
        : item._id;
    const productName =
      (typeof item.productId === 'object' && item.productId?.name) ||
      item.productName;
    return {
      id: item._id || productId,
      productId: productId || '',
      code: item.productCode || item.sku,
      name: productName,
      size: item.size || item.sku || '',
      qty: item.quantity,
      price: item.pricePerUnit ?? item.finalPrice ?? 0,
      originalPrice: item.pricePerUnit ?? item.finalPrice ?? 0,
      image: item.image || '',
    };
  });

  const currentStatus =
    order.tracking?.currentStatus || (order.status ? `${order.status}` : 'Order Placed');

  return {
    id: order._id || order.id,
    apiOrderId: order.orderId || order._id || order.id,
    orderNumber: order.orderNumber,
    orderId: order.orderNumber ? `#${order.orderNumber}` : order.id || order._id,
    date: formatOrderDate(order.placedAt || order.createdAt),
    rawDate: order.placedAt || order.createdAt || '',
    totalAmount: order.pricing?.total ?? 0,
    subtotal: order.pricing?.subtotal ?? 0,
    tax: order.pricing?.tax ?? 0,
    discount: order.pricing?.discount ?? 0,
    shippingCharges: order.pricing?.shippingCharges ?? 0,
    status: order.status || 'Pending',
    trackingStatus: currentStatus,
    trackingNumber:
      order.tracking?.trackingNumber ||
      order.tracking?.tracking_number ||
      order.tracking?.awb,
    items,
    shippingAddress: order.shippingAddress,
    paymentMethod: order.payment?.mode || 'COD',
  };
};

const getOrderBucket = (order: OrderType): string => {
  const text = `${order.status} ${order.trackingStatus}`.toLowerCase();
  if (text.includes('cancel')) {
    return 'Cancelled';
  }
  if (text.includes('return') || text.includes('refund')) {
    return 'Returned';
  }
  if (text.includes('delivered') || text.includes('complete')) {
    return 'Delivered';
  }
  return 'On the way';
};

// ─── StyleSheet Factory (Theme-aware) ─────────────────────────────────────────

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitleContainer: { flex: 1, marginLeft: 12 },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      fontFamily: fontFamily.heading,
    },
    headerSubtitle: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
    },
    bagBtn: { padding: 4 },
    content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
    tabletContent: { maxWidth: 600, width: '100%', alignSelf: 'center' },

    /* Search & Tabs */
    searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingHorizontal: 12,
      height: 42,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 12,
      color: colors.text,
      fontFamily: fontFamily.regular,
    },
    insideFilterBtn: { paddingLeft: 8, paddingVertical: 4 },
    tabScroll: { marginBottom: 16 },
    tabChip: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      marginRight: 8,
    },
    tabChipActive: { backgroundColor: colors.primary },
    tabChipText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
      fontFamily: fontFamily.medium,
    },
    tabChipTextActive: {
      color: colors.textOnPrimary,
      fontWeight: '700',
      fontFamily: FONTS.poppinsBold,
    },

    /* Metrics */
    metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    metricCard: {
      flex: 1,
      backgroundColor: colors.primaryLight,
      padding: 12,
      borderRadius: 12,
      marginRight: 8,
    },
    metricLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
    },
    metricValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
      marginTop: 4,
      fontFamily: FONTS.poppinsBold,
    },

    /* Cards & Lists */
    orderCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    orderCardHeader: {
      flexDirection: 'column',
      backgroundColor: colors.hisemibackound,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginTop: -14,
      marginLeft: -14,
      marginRight: -14,
      marginBottom: 14,
    },
    orderHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statusBadgeRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    orderStatusIconBox: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.hiconbackround,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusBadgeText: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '700',
      fontFamily: FONTS.poppinsBold,
    },
    orderDate: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: fontFamily.regular,
      marginTop: 8,
    },
    orderSubHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    orderIdLabel: {
      fontSize: 10,
      color: colors.textMuted,
      fontFamily: fontFamily.regular,
    },
    orderIdRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    orderIdText: {
      fontSize: 13,
      color: colors.text,
      fontFamily: FONTS.inter18SemiBold,
    },
    orderPrice: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
      fontFamily: FONTS.poppinsBold,
    },
    orderItemCount: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
    },
    priceAlignEnd: { alignItems: 'flex-end' },
    innerProductRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: '#FFF8DE',
      marginHorizontal: -14,
    },
    innerProductCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    productListBox: {
      backgroundColor: '#FFF8DE',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    productThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.surfaceVariant },
    productThumbLarge: { width: 52, height: 52, borderRadius: 8, backgroundColor: colors.surfaceVariant },
    productInfo: { flex: 1, marginLeft: 12 },
    productCode: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: '700',
      fontFamily: FONTS.poppinsBold,
    },
    productTitle: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '500',
      fontFamily: fontFamily.medium,
    },
    productTitleBold: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      fontFamily: FONTS.poppinsBold,
    },
    productMeta: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: fontFamily.regular,
    },
    productPrice: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      fontFamily: FONTS.poppinsBold,
    },
    productPriceBold: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      fontFamily: FONTS.poppinsBold,
    },

    /* Buttons */
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    btnOutline: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: 'center',
    },
    btnOutlineText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
      fontFamily: FONTS.poppinsBold,
    },
    btnPrimary: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    btnPrimaryText: {
      color: colors.textOnPrimary,
      fontSize: 13,
      fontWeight: '700',
      fontFamily: FONTS.poppinsBold,
    },

    /* Track Screen Elements */
    pinkHeaderBox: {
      backgroundColor: colors.primaryLight,
      padding: 14,
      borderRadius: 16,
      marginBottom: 24,
    },
    orderInfoRow: { flexDirection: 'row', alignItems: 'center' },
    totalRowInBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 14,
    },
    totalAmountText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
      fontFamily: FONTS.poppinsBold,
    },
    cancelBtn: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.error + '1A',
    },
    cancelBtnText: {
      color: colors.error,
      fontSize: 12,
      fontWeight: '700',
      fontFamily: FONTS.poppinsBold,
    },

    /* Timeline */
    timelineContainer: {
      backgroundColor: "#FFFBEA",
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    timelineNodeCol: { alignItems: 'center', width: 24, marginRight: 12 },
    timelineNode: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    timelineNodeActive: { backgroundColor: colors.primary },
    timelineLine: {
      width: 2,
      height: 36,
      backgroundColor: colors.border,
      position: 'absolute',
      top: 22,
    },
    timelineContent: { flex: 1 },
    timelineTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      fontFamily: FONTS.poppinsBold,
    },
    timelineTime: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
      lineHeight: 14,
      fontFamily: fontFamily.regular,
    },
    statusTag: {
      fontSize: 10,
      color: colors.textMuted,
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      fontFamily: fontFamily.regular,
    },
    statusTagActive: {
      color: colors.primary,
      backgroundColor: colors.primaryLight,
      fontFamily: FONTS.poppinsBold,
    },
    infoNoteBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
    },
    infoNoteText: {
      flex: 1,
      fontSize: 11,
      color: colors.primary,
      marginLeft: 8,
      fontFamily: fontFamily.regular,
    },

    /* Selected Screen Specifics */
    sectionTag: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.5,
      fontFamily: FONTS.poppinsBold,
    },
    sectionHeading: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginVertical: 8,
      fontFamily: FONTS.poppinsBold,
    },
    selectedTimelineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    selectedTimelineTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      fontFamily: FONTS.poppinsBold,
    },
    selectedTimelineTime: {
      fontSize: 10,
      color: colors.textMuted,
      fontFamily: fontFamily.regular,
    },
    selectedProductCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
    },
    orderIdSub: {
      fontSize: 11,
      color: colors.textMuted,
      marginBottom: 8,
      fontFamily: fontFamily.regular,
    },
    summaryBox: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
    summaryLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
    },
    summaryValue: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      fontFamily: fontFamily.medium,
    },
    totalBoldLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      fontFamily: FONTS.poppinsBold,
    },
    totalBoldValue: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.primary,
      fontFamily: FONTS.poppinsBold,
    },
    downloadInvoiceBtn: {
      backgroundColor: "#837BA2",
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
      marginTop: 14,
    },
    downloadInvoiceText: {
      color: colors.textOnPrimary,
      fontSize: 12,
      fontWeight: '600',
      fontFamily: FONTS.poppinsBold,
    },
    addressCard: {
      backgroundColor: colors.primaryLight,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    addressNameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    addressName: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      fontFamily: FONTS.poppinsBold,
    },
    addressText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
      marginLeft: 18,
      fontFamily: fontFamily.regular,
    },
    paymentCard: {
      backgroundColor: colors.primaryLight,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
    },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    methodRow: { flexDirection: 'row', alignItems: 'center' },
    dotBorderCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth:3,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
    paymentLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
      alignSelf:'center'
    },
    paymentValue: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      fontFamily: FONTS.poppinsBold,
    },

    /* Modal */
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: '80%',
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.shimmer,
      alignSelf: 'center',
      marginBottom: 16,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      fontFamily: fontFamily.heading,
    },
    modalSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeBtnText: { fontSize: 16, color: colors.text },
    filterSectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginTop: 12,
      marginBottom: 8,
      fontFamily: FONTS.poppinsBold,
    },
    radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    radioActive: { borderColor: colors.primary },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    radioLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
    },
    radioLabelActive: { color: colors.text, fontWeight: '700', fontFamily: FONTS.poppinsBold },
    modalActionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
    clearBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    clearBtnText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      fontFamily: fontFamily.medium,
    },
    applyBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    applyBtnText: {
      color: colors.textOnPrimary,
      fontSize: 14,
      fontWeight: '700',
      fontFamily: FONTS.poppinsBold,
    },
    /* Modal Base Overlay */
modalOverlay1: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'flex-end',
},
modalHandle1: {
  width: 40,
  height: 4,
  borderRadius: 2,
  backgroundColor: '#E5E7EB',
  alignSelf: 'center',
  marginBottom: 16,
},

/* Cancel Modal Specific Styles */
cancelModalSheet: {
  backgroundColor: '#FFFFFF',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  paddingHorizontal: 20,
  paddingBottom: 28,
  paddingTop: 10,
},
cancelModalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
},
cancelModalTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: '#111827',
},
cancelModalSubtitle: {
  fontSize: 13,
  color: '#6B7280',
  marginTop: 2,
},
closeBtnCircle: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: '#F3F4F6',
  justifyContent: 'center',
  alignItems: 'center',
},

/* Write a Review */
writeReviewBtn: {
  backgroundColor: colors.primary,
  borderRadius: 12,
  paddingVertical: 13,
  alignItems: 'center',
  marginTop: 14,
},
writeReviewBtnText: {
  color: colors.textOnPrimary,
  fontSize: 14,
  fontFamily: FONTS.poppinsSemiBold,
},
reviewModalSheet: {
  backgroundColor: '#FFFFFF',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  paddingHorizontal: 20,
  paddingBottom: 28,
  paddingTop: 10,
  maxHeight: '88%',
},
reviewFieldLabel: {
  fontSize: 13,
  fontWeight: '600',
  color: '#374151',
  marginTop: 14,
  marginBottom: 8,
},
reviewStarPicker: {
  flexDirection: 'row',
  gap: 10,
},
reviewErrorText: {
  color: '#DC2626',
  fontSize: 12,
  marginTop: 8,
},
reviewInput: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 14,
  color: '#111827',
  backgroundColor: '#F9FAFB',
},
reviewTextArea: {
  minHeight: 96,
},
reviewImagesRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
},
reviewImageWrap: {
  width: 76,
  height: 76,
},
reviewImageThumb: {
  width: 76,
  height: 76,
  borderRadius: 10,
  backgroundColor: '#F3F4F6',
},
reviewImageRemove: {
  position: 'absolute',
  top: -6,
  right: -6,
  width: 22,
  height: 22,
  borderRadius: 11,
  backgroundColor: '#111827',
  alignItems: 'center',
  justifyContent: 'center',
},
reviewImageRemoveText: {
  color: '#FFFFFF',
  fontSize: 15,
  lineHeight: 17,
  fontWeight: '600',
},
reviewImageAdd: {
  width: 76,
  height: 76,
  borderRadius: 10,
  borderWidth: 1,
  borderStyle: 'dashed',
  borderColor: '#D1D5DB',
  backgroundColor: '#F9FAFB',
  alignItems: 'center',
  justifyContent: 'center',
},
reviewImageAddText: {
  color: '#6B7280',
  fontSize: 22,
  lineHeight: 24,
},
reviewImageAddLabel: {
  color: '#6B7280',
  fontSize: 10,
  marginTop: 2,
},
reviewSubmitBtn: {
  backgroundColor: colors.primary,
  borderRadius: 12,
  paddingVertical: 14,
  alignItems: 'center',
  marginTop: 20,
},
reviewSubmitBtnText: {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: '700',
},
dropdownContainer: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 16,
  overflow: 'hidden',
  marginBottom: 20,
  backgroundColor: '#F9FAFB',
},
dropdownHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 14,
  backgroundColor: '#FFFFFF',
},
dropdownHeaderText: {
  fontSize: 14,
  color: '#4B5563',
},
dropdownList: {
  maxHeight: 220,
  backgroundColor: '#F3F4F6',
  paddingHorizontal: 8,
},
reasonItem: {
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 8,
},
selectedReasonItem: {
  backgroundColor: '#E5E7EB',
},
reasonText: {
  fontSize: 13,
  color: '#4B5563',
},
selectedReasonText: {
  fontWeight: '600',
  color: '#111827',
},
cancelModalActions: {
  flexDirection: 'row',
  gap: 12,
},
keepOrderBtn: {
  flex: 1,
  height: 48,
  borderRadius: 24,
  borderWidth: 1,
  borderColor: '#374151',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#FFFFFF',
},
keepOrderBtnText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#111827',
},
confirmCancelBtn: {
  flex: 1,
  height: 48,
  borderRadius: 24,
  backgroundColor: colors.error,
  justifyContent: 'center',
  alignItems: 'center',
},
confirmCancelBtnText: {
  fontSize: 14,
  fontWeight: '700',
  color: '#FFFFFF',
},
  });
};



const CANCEL_REASONS = [
  'Changed my mind',
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Delivery is taking too long',
  'Shipping cost is too high',
  'Payment issue / failed transaction',
  'Ordered wrong size / variant',
  'Product no longer needed',
  'Placed duplicate order',
  'Want to change delivery address',
];

// ─── Component ────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'MyOrders'>;

const MyOrdersScreen = ({ navigation, route }: Props) => {
  const theme = useAppTheme();
  const { colors, fontFamily } = theme;
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const insets = useSafeAreaInsets();

  // Navigation Flow States: 'LIST' | 'TRACK' | 'DETAILS'
  const [currentScreen, setCurrentScreen] = useState<'LIST' | 'TRACK' | 'DETAILS'>('LIST');
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [detailsFrom, setDetailsFrom] = useState<'TRACK' | 'LIST'>('TRACK');
  // Modal State
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All statuses');
  const [selectedTime, setSelectedTime] = useState('Anytime');
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
const [cancelModalVisible, setCancelModalVisible] = useState(false);
const [isDropdownOpen, setIsDropdownOpen] = useState(true);
const [selectedReason, setSelectedReason] = useState<string | null>(null);
const [cancelling, setCancelling] = useState(false);
const [cancelReasons, setCancelReasons] = useState<string[]>(CANCEL_REASONS);
const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  // Write-a-Review (delivered items only)
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [existingReview, setExistingReview] = useState<SavedReview | null>(null);

  const selectedOrder =
    orders.find(o => o.id === selectedOrderId) || orders[0] || null;

  useEffect(() => {
    let cancelled = false;

    const loadExistingReview = async () => {
      setExistingReview(null);
      if (!selectedOrder || !selectedProduct?.productId) {
        return;
      }

      try {
        const response = await apiService.get<ProductReviewsResponse>(
          `${REVIEWS_ENDPOINT}/product/${encodeURIComponent(selectedProduct.productId)}`,
        );
        const list = Array.isArray(response?.data) ? response.data : [];
        const orderIds = [selectedOrder.id, selectedOrder.apiOrderId];
        const match = list.find(
          review =>
            !!review.orderId &&
            orderIds.includes(review.orderId) &&
            (!review.productId || review.productId === selectedProduct.productId),
        );
        if (!cancelled) {
          setExistingReview(toSavedReview(match));
        }
      } catch {
        // Non-fatal — the form simply starts as a new review.
      }
    };

    loadExistingReview();

    return () => {
      cancelled = true;
    };
  }, [selectedOrder, selectedProduct]);

  useEffect(() => {
    if (!reviewModalVisible || !existingReview) {
      return;
    }

    setReviewRating(prev => prev || existingReview.rating);
    setReviewComment(prev => prev || existingReview.comment);
    setReviewImages(prev => (prev.length ? prev : existingReview.images));
  }, [reviewModalVisible, existingReview]);

  /**
   * Notification taps pass the order they refer to. The list is filtered down
   * to that order as soon as it has loaded, and the matching view is opened.
   * `appliedTargetRef` keeps a re-render from re-running the same navigation
   * after the user has moved around inside the screen.
   */
  const appliedTargetRef = useRef<string | null>(null);
  const notificationProductId = route.params?.productId;
  const trackItems = useMemo(() => {
    const items = selectedOrder?.items ?? [];
    if (!notificationProductId) return items;
    const matched = items.filter(item => item.productId === notificationProductId);
    return matched.length ? matched : items;
  }, [notificationProductId, selectedOrder]);

  const isCancelled = selectedOrder
    ? `${selectedOrder.status} ${selectedOrder.trackingStatus}`
        .toLowerCase()
        .includes('cancel')
    : false;

  const isDelivered = selectedOrder
    ? getOrderBucket(selectedOrder) === 'Delivered'
    : false;

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matchesStatus = (order: OrderType) =>
      activeTab === 'All' || getOrderBucket(order) === activeTab;
    const matchesTime = (order: OrderType) => {
      if (selectedTime === 'Anytime' || !order.rawDate) {
        return true;
      }
      const placedAt = new Date(order.rawDate).getTime();
      if (Number.isNaN(placedAt)) {
        return true;
      }
      const now = Date.now();
      const days =
        selectedTime === 'Last 30 days' ? 30 : selectedTime === 'Last 6 months' ? 180 : 365;
      return now - placedAt <= days * 24 * 60 * 60 * 1000;
    };
    if (!query) {
      return orders.filter(order => matchesStatus(order) && matchesTime(order));
    }
    return orders.filter(order => {
      if (!matchesStatus(order) || !matchesTime(order)) {
        return false;
      }
      const idMatch =
        order.orderId.toLowerCase().includes(query) ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query);
      if (idMatch) {
        return true;
      }
      return order.items.some(
        item =>
          item.name.toLowerCase().includes(query) ||
          (item.code || '').toLowerCase().includes(query),
      );
    });
  }, [orders, activeTab, searchQuery, selectedTime]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get<OrdersResponse>(MY_ORDERS_ENDPOINT);
      if (response?.data) {
        const mapped = (Array.isArray(response.data) ? response.data : []).map(
          mapApiOrder,
        );
        setOrders(mapped);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!selectedOrderId && orders.length) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  useEffect(() => {
    const target = route.params;
    if (!target || loading || orders.length === 0) return;

    const targetKey = JSON.stringify(target);
    if (appliedTargetRef.current === targetKey) return;

    const normalize = (value?: string) =>
      (value ?? '').trim().toLowerCase().replace(/^#/, '');

    const wantedOrderId = normalize(target.orderId);
    const wantedOrderNumber = normalize(target.orderNumber);
    const wantedTracking = normalize(target.trackingNumber);

    const matchedOrder = orders.find(order => {
      const id = normalize(order.id);
      const number = normalize(order.orderNumber);
      const displayId = normalize(order.orderId);
      const tracking = normalize(order.trackingNumber);

      if (wantedOrderId && (id === wantedOrderId || displayId === wantedOrderId)) {
        return true;
      }
      if (wantedOrderNumber && (number === wantedOrderNumber || displayId === wantedOrderNumber)) {
        return true;
      }
      if (wantedTracking && tracking === wantedTracking) {
        return true;
      }
      return false;
    });

    if (!matchedOrder) return;

    appliedTargetRef.current = targetKey;
    setSelectedOrderId(matchedOrder.id);

    const matchedProduct = target.productId
      ? matchedOrder.items.find(item => item.productId === target.productId)
      : undefined;
    const productToShow = matchedProduct ?? matchedOrder.items[0];
    if (productToShow) {
      setSelectedProduct(productToShow);
    }

    if (target.view === 'track') {
      setCurrentScreen('TRACK');
    } else if (target.view === 'details') {
      setDetailsFrom('LIST');
      setCurrentScreen('DETAILS');
    }

    if (target.openReview && productToShow) {
      setReviewModalVisible(true);
    }
  }, [loading, orders, route.params]);

  const handleProductSelect = (product: ProductItem, from: 'TRACK' | 'LIST') => {
    setSelectedProduct(product);
    setDetailsFrom(from);
    setCurrentScreen('DETAILS');
  };

  const handleBack = () => {
    if (currentScreen === 'DETAILS') {
      // Came from Track — go back to Track, otherwise back to the list.
      setCurrentScreen(detailsFrom === 'TRACK' ? 'TRACK' : 'LIST');
    } else if (currentScreen === 'TRACK') {
      setCurrentScreen('LIST');
    } else {
      // On the main list — leave the screen.
      navigation.canGoBack() && navigation.goBack();
    }
  };

  const handleCopyOrderId = useCallback((orderId: string) => {
    Clipboard.setString(orderId.replace(/^#/, ''));
  }, []);

  const handleDownloadInvoice = useCallback(async () => {
    if (!selectedOrder) {
      return;
    }
    setDownloadingInvoice(true);
    try {
      const filePath = await downloadOrderInvoice(selectedOrder.apiOrderId);
      if (Platform.OS === 'android') {
        await BlobUtil.android.actionViewIntent(filePath, 'application/pdf');
      } else {
        await BlobUtil.ios.openDocument(filePath.replace(/^file:\/\//, ''));
      }
    } catch (err) {
      Alert.alert(
        'Invoice Failed',
        err instanceof Error ? err.message : 'Unable to download the invoice PDF. Please try again.',
      );
    } finally {
      setDownloadingInvoice(false);
    }
  }, [selectedOrder]);

  const handleOpenOrder = (order: OrderType, from: 'TRACK' | 'LIST') => {
    setSelectedOrderId(order.id);
    if (from === 'TRACK') {
      setCurrentScreen('TRACK');
    } else {
      if (order.items.length) {
        setSelectedProduct(order.items[0]);
      }
      setDetailsFrom('LIST');
      setCurrentScreen('DETAILS');
    }
  };

  const fetchCancellationReasons = useCallback(async () => {
    try {
      const response = await apiService.get<CancellationReasonsResponse>(
        CANCELLATION_REASONS_ENDPOINT,
      );
      if (response?.data?.customer?.length) {
        setCancelReasons(response.data.customer);
      }
    } catch {
      // Keep the static fallback list if the API fails.
    }
  }, []);

  const handleOpenCancelModal = () => {
    setSelectedReason(null);
    setIsDropdownOpen(true);
    setCancelModalVisible(true);
    fetchCancellationReasons();
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder) {
      return;
    }
    setCancelling(true);
    try {
      const response = await apiService.update<CancelOrderResponse>(
        `${CANCEL_ORDER_ENDPOINT}/${selectedOrder.id}/cancel`,
        {
          reason: selectedReason || 'Placed duplicate order',
          reasonType: 'customer',
        },
        undefined,
        'PATCH',
      );
      setOrders(prev =>
        prev.map(o => {
          if (o.id !== selectedOrder.id) {
            return o;
          }
          return response?.data ? mapApiOrder(response.data) : { ...o, status: 'Cancelled', trackingStatus: 'Cancelled' };
        }),
      );
      setActiveTab('Cancelled'); // Direct 'Cancelled' tab par navigate hoga
      setCancelModalVisible(false);
      setCurrentScreen('LIST');
      Alert.alert(
        'Order Cancelled',
        response?.message || 'Your order has been cancelled successfully.',
      );
    } catch (err) {
      Alert.alert(
        'Cancel Failed',
        err instanceof Error ? err.message : 'Unable to cancel the order. Please try again.',
      );
    } finally {
      setCancelling(false);
    }
  };

  const openReviewForm = () => {
    setReviewRating(existingReview?.rating ?? 0);
    setReviewComment(existingReview?.comment ?? '');
    setReviewImages(existingReview?.images ?? []);
    setReviewError('');
    setReviewModalVisible(true);
  };

  const closeReviewForm = () => {
    setReviewModalVisible(false);
  };

  const pickReviewImages = () => {
    if (reviewImages.length >= MAX_REVIEW_IMAGES) {
      Alert.alert('Photo limit', `You can add up to ${MAX_REVIEW_IMAGES} photos.`);
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: MAX_REVIEW_IMAGES - reviewImages.length,
        includeBase64: true,
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.6,
      },
      response => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('Photo', response.errorMessage || 'Unable to open your photo library.');
          return;
        }

        const picked = (response.assets ?? [])
          .map(asset =>
            asset.base64
              ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`
              : null,
          )
          .filter((image): image is string => Boolean(image));

        if (picked.length) {
          setReviewImages(prev => [...prev, ...picked].slice(0, MAX_REVIEW_IMAGES));
        }
      },
    );
  };

  const removeReviewImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const submitProductReview = async () => {
    if (submittingReview || !selectedOrder || !selectedProduct) {
      return;
    }
    if (reviewRating < 1) {
      setReviewError('Please select a star rating');
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError('Please write a few words about the product');
      return;
    }
    setReviewError('');
    setSubmittingReview(true);
    try {
      const payload = {
        rating: reviewRating,
        reviewText: reviewComment.trim(),
        images: reviewImages,
      };
      const response = existingReview
        ? await apiService.update<ReviewMutationResponse>(
            `${REVIEWS_ENDPOINT}/${existingReview.id}`,
            payload,
            undefined,
            'PATCH',
          )
        : await apiService.post<ReviewMutationResponse>(REVIEWS_ENDPOINT, {
            ...payload,
            productId: selectedProduct.productId,
            orderId: selectedOrder.id,
          });
      if (response?.success) {
        const saved = toSavedReview(response.data);
        const nextReview: SavedReview = saved ?? {
          id: existingReview?.id ?? '',
          rating: reviewRating,
          comment: reviewComment.trim(),
          images: reviewImages,
        };
        if (nextReview.id) {
          setExistingReview(nextReview);
        }
        Alert.alert(
          existingReview ? 'Review Updated' : 'Thank you!',
          response.message ||
            (existingReview
              ? 'Your review has been updated.'
              : 'Your review has been submitted and will appear shortly.'),
        );
        setReviewModalVisible(false);
      } else {
        Alert.alert(
          'Could not submit',
          response?.message || 'Something went wrong. Please try again.',
        );
      }
    } catch (err) {
      Alert.alert(
        'Could not submit',
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <SvgXml xml={backArrowIcon(colors.text)} width={20} height={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {currentScreen === 'LIST' ? 'My Orders' : 'Track Your Order'}
          </Text>
          <Text style={styles.headerSubtitle}>Track orders & purchases.</Text>
        </View>
        <TouchableOpacity style={styles.bagBtn} activeOpacity={0.7} onPress={()=> navigation.navigate("CartScreen")}>
          <SvgXml xml={bagIcon(colors.text)} width={19} height={21} />
        </TouchableOpacity>
      </View>

      {/* SCREEN 1: MY ORDERS LIST */}
      {currentScreen === 'LIST' && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={isTablet && styles.tabletContent}
          showsVerticalScrollIndicator={false}>
          {/* Search Box with Inside Filter Icon */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <SvgXml xml={searchIcon(colors.textMuted)} width={18} height={18} />
              <TextInput
                placeholder="Search by order ID or product name"
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.insideFilterBtn}
                onPress={() => {
                  setSelectedStatus(activeTab === 'All' ? 'All statuses' : activeTab);
                  setFilterVisible(true);
                }}
                activeOpacity={0.7}>
                <SvgXml xml={filterIcon(colors.textMuted)} width={18} height={18} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
            {['All', 'On the way', 'Delivered', 'Cancelled', 'Returned'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
                onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabChipText, activeTab === tab && styles.tabChipTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {activeTab === 'All' && !searchQuery.trim() && selectedTime === 'Anytime' ? (
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total orders</Text>
                <Text style={styles.metricValue}>{orders.length}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>On the way</Text>
                <Text style={[styles.metricValue , {color:"#2563EB"}]}>
                  {orders.filter(o => getOrderBucket(o) === 'On the way').length}
                </Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Delivered</Text>
                <Text style={[styles.metricValue, { color: colors.success }]}>
                  {orders.filter(o => getOrderBucket(o) === 'Delivered').length}
                </Text>
              </View>
            </View>
          ) : null}

          {loading ? (
            <View style={{ paddingVertical: 64, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={{
                  marginTop: 12,
                  color: colors.textMuted,
                  fontFamily: fontFamily.medium,
                }}>
                Loading your orders...
              </Text>
            </View>
          ) : error ? (
            <View style={{ paddingVertical: 64, alignItems: 'center' }}>
              <Text
                style={{
                  color: colors.error,
                  fontFamily: fontFamily.medium,
                  textAlign: 'center',
                  marginBottom: 16,
                }}>
                {error}
              </Text>
              <TouchableOpacity style={styles.btnOutline} onPress={fetchOrders} activeOpacity={0.7}>
                <Text style={styles.btnOutlineText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredOrders.length === 0 ? (
            <View style={{ paddingVertical: 64, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontFamily: fontFamily.medium }}>
                No orders found.
              </Text>
            </View>
          ) : (
            filteredOrders.map(order => {
              const cardCancelled = getOrderBucket(order) === 'Cancelled';
              const cancelledColor = cardCancelled ? colors.error : colors.success;
              return (
                <View key={order.id} style={[styles.orderCard, { marginBottom: 16 }]}>
                  <View style={styles.orderCardHeader}>
                    <View style={styles.orderHeaderRow}>
                      <View style={styles.statusBadgeRow}>
                        <View
                          style={[
                            styles.orderStatusIconBox,
                            { backgroundColor: cancelledColor },
                          ]}>
                          <SvgXml
                            xml={cardCancelled ? crossIcon(colors.surface) : boxIcon(colors.surface)}
                            width={20}
                            height={20}
                          />
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: cancelledColor + '1A' },
                          ]}>
                          <Text
                            style={[
                              styles.statusBadgeText,
                              { color: cancelledColor },
                            ]}>
                            {cardCancelled
                              ? 'CANCELLED'
                              : order.trackingStatus.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <SvgXml xml={chevRight(colors.textMuted)} />
                    </View>
                    <Text style={styles.orderDate}>
                      {cardCancelled
                        ? `Cancelled on ${order.date}`
                        : `Placed on ${order.date}`}
                    </Text>
                  </View>

                  <View style={styles.orderSubHeader}>
                    <View>
                      <Text style={styles.orderIdLabel}>ORDER ID</Text>
                      <View style={styles.orderIdRow}>
                        <Text style={styles.orderIdText}>{order.orderId}</Text>
                        <TouchableOpacity
                          onPress={() => handleCopyOrderId(order.orderId)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                          style={{ marginLeft: 6 }}>
                          <SvgXml xml={copyIcon(colors.textMuted)} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.priceAlignEnd}>
                      <Text style={styles.orderPrice}>₹{formatMoney(order.totalAmount)}</Text>
                      <Text style={styles.orderItemCount}>
                        {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                      </Text>
                    </View>
                  </View>

                  {order.items.slice(0, 3).map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.innerProductRow}
                      onPress={() => handleProductSelect(item, 'LIST')}
                      activeOpacity={0.7}>
                      <Image source={{ uri: item.image }} style={styles.productThumb} />
                      <View style={styles.productInfo}>
                        <Text style={styles.productCode}>{item.code}</Text>
                        <Text style={styles.productTitle}>{item.name}</Text>
                        <Text style={styles.productMeta}>Size: {item.size}  •  Qty: {item.qty}</Text>
                      </View>
                      <Text style={styles.productPrice}>₹{formatMoney(item.price)}</Text>
                      <SvgXml xml={chevRight(colors.textMuted)} style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  ))}

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.btnOutline}
                      onPress={() => handleOpenOrder(order, 'LIST')}
                      activeOpacity={0.7}>
                      <Text style={styles.btnOutlineText}>View details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnPrimary}
                      onPress={() => handleOpenOrder(order, 'TRACK')}
                      activeOpacity={0.8}>
                      <Text style={styles.btnPrimaryText}>Track order</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* SCREEN 2: TRACK ORDER TIMELINE */}
      {currentScreen === 'TRACK' && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={isTablet && styles.tabletContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.pinkHeaderBox}>
            <View style={styles.orderInfoRow}>
              <View
                style={[
                  styles.orderStatusIconBox,
                  { width: 40, height: 40, borderRadius: 20, backgroundColor: isCancelled ? colors.error : colors.success },
                ]}>
                <SvgXml
                  xml={isCancelled ? crossIcon(colors.surface) : boxIcon(colors.surface)}
                  width={25}
                  height={25}
                />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.orderIdText}>Order {selectedOrder?.orderId}</Text>
                <Text style={styles.orderDate}>
                  {isCancelled
                    ? `Cancelled on ${selectedOrder?.date} • ${selectedOrder?.items.length ?? 0} Items`
                    : `Placed on ${selectedOrder?.date} • ${selectedOrder?.items.length ?? 0} Items`}
                </Text>
                {!!selectedOrder?.trackingNumber && (
                  <Text style={styles.orderDate}>
                    Tracking No: {selectedOrder.trackingNumber}
                  </Text>
                )}
              </View>
            </View>
            <View style={{borderWidth:0.5,borderColor:'#F8D2DD' , marginTop:12}}/>
            <View style={styles.totalRowInBox}>
              <View>
                <Text style={styles.metricLabel}>Total Amount</Text>
                <Text style={styles.totalAmountText}>₹{formatMoney(selectedOrder?.totalAmount ?? 0)}</Text>
              </View>
              {!isCancelled && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                  onPress={handleOpenCancelModal}>
                  <Text style={styles.cancelBtnText}>Cancel Order</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Timeline Section */}
          <View style={styles.timelineContainer}>
            {isCancelled ? (
              <View style={styles.timelineRow}>
                <View style={styles.timelineNodeCol}>
                  <View style={[styles.timelineNode, { backgroundColor: colors.error }]}>
                    <SvgXml xml={crossIcon(colors.surface)} />
                  </View>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Order Cancelled</Text>
                  <Text style={styles.timelineTime}>{selectedOrder?.date || ''}{'\n'}Cancelled</Text>
                </View>
                <Text
                  style={[
                    styles.statusTag,
                    { color: colors.error, backgroundColor: colors.error + '1A', fontFamily: FONTS.poppinsBold },
                  ]}>
                  Cancelled
                </Text>
              </View>
            ) : (
              [
                { title: 'Order Placed', time: selectedOrder?.date || '', status: 'Completed', active: true, icon: checkIcon(colors.textOnPrimary) },
                { title: 'Processing', time: selectedOrder?.date || '', status: 'Pending', active: false, icon: gearIcon(colors.textMuted) },
                { title: 'Shipped', time: selectedOrder?.date || '', status: 'Pending', active: false, icon: boxIcon(colors.textMuted) },
                { title: 'Out For Delivery', time: selectedOrder?.date || '', status: 'Pending', active: false, icon: truckIcon(colors.textMuted) },
                { title: 'Delivered', time: selectedOrder?.date || '', status: 'Pending', active: false, icon: boxIcon(colors.textMuted) },
              ].map((step, idx, arr) => (
                <View key={idx} style={styles.timelineRow}>
                  <View style={styles.timelineNodeCol}>
                    <View
                      style={[
                        styles.timelineNode,
                        step.active && { backgroundColor: colors.success },
                      ]}>
                      <SvgXml xml={step.icon} />
                    </View>
                    {idx !== arr.length - 1 && <View style={styles.timelineLine} />}
                  </View>

                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>{step.title}</Text>
                    <Text style={styles.timelineTime}>{step.time}</Text>
                  </View>

                  <Text style={[styles.statusTag, step.active && styles.statusTagActive, step.active && { color: colors.success, backgroundColor: colors.success + '1A', fontFamily: FONTS.poppinsBold }]}>{step.status}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.infoNoteBox}>
            <SvgXml xml={infoIcon(colors.primary, colors.textOnPrimary)} />
            <Text style={styles.infoNoteText}>
              Tracking information may take a few hours to update. Thank you for your patience!
            </Text>
          </View>

          <Text style={styles.sectionHeading}>Order Item ({trackItems.length})</Text>
          <View style={styles.productListBox}>
            {trackItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.innerProductCard}
                onPress={() => handleProductSelect(item, 'TRACK')}
                activeOpacity={0.7}>
                <Image source={{ uri: item.image }} style={styles.productThumb} />
                <View style={styles.productInfo}>
                  <Text style={styles.productCode}>{item.code}</Text>
                  <Text style={styles.productTitle}>{item.name}</Text>
                  <Text style={styles.productMeta}>Size: {item.size}  •  Qty: {item.qty}</Text>
                </View>
                <Text style={styles.productPrice}>₹{formatMoney(item.price)}</Text>
                <SvgXml xml={chevRight(colors.textMuted)} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* SCREEN 3: TRACK YOUR ORDER - SELECTED */}
      {currentScreen === 'DETAILS' && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={isTablet && styles.tabletContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.pinkHeaderBox}>
            <View style={styles.orderInfoRow}>
              <View
                style={[
                  styles.orderStatusIconBox,
                  { backgroundColor: isCancelled ? colors.error : colors.success },
                ]}>
                <SvgXml
                  xml={isCancelled ? crossIcon(colors.surface) : boxIcon(colors.surface)}
                  width={20}
                  height={20}
                />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.orderIdText}>Order {selectedOrder?.orderId}</Text>
                <Text style={styles.orderDate}>
                  {isCancelled
                    ? `Cancelled on ${selectedOrder?.date} • ${selectedOrder?.items.length ?? 0} Items`
                    : `Placed on ${selectedOrder?.date} • ${selectedOrder?.items.length ?? 0} Items`}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTag}>SELECTED PRODUCT</Text>
          <Text style={styles.sectionHeading}>Order Timeline</Text>

          <View style={styles.selectedTimelineRow}>
            <SvgXml
              xml={isCancelled ? crossCircleIcon(colors.error) : checkCircleIcon(colors.success)}
            />
            <View style={{ marginLeft: 8 }}>
              <Text
                style={[
                  styles.selectedTimelineTitle,
                  isCancelled && { color: colors.error },
                ]}>
                {isCancelled ? 'Order Cancelled' : 'Order Placed'}
              </Text>
              <Text style={styles.selectedTimelineTime}>
                {selectedOrder?.date}
              </Text>
            </View>
          </View>

          {selectedProduct && (
            <View style={styles.selectedProductCard}>
              <Image source={{ uri: selectedProduct.image }} style={styles.productThumbLarge} />
              <View style={styles.productInfo}>
                <Text style={styles.productTitleBold}>{selectedProduct.name}</Text>
                <Text style={styles.productMeta}>Size: {selectedProduct.size}  •  Qty: {selectedProduct.qty}</Text>
              </View>
              <Text style={styles.productPriceBold}>₹{formatMoney(selectedProduct.price)}</Text>
            </View>
          )}

          {isDelivered && selectedProduct && (
            <TouchableOpacity
              style={styles.writeReviewBtn}
              activeOpacity={0.8}
              onPress={openReviewForm}>
              <Text style={styles.writeReviewBtnText}>
                {existingReview ? 'Edit Review' : 'Write a Review'}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionHeading}>Other Items In This Order</Text>
          <Text style={styles.orderIdSub}>Order ID {selectedOrder?.orderId}</Text>

          <View style={styles.productListBox}>
            {(selectedOrder?.items ?? [])
              .filter(i => i.id !== selectedProduct?.id)
              .map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.innerProductCard}
                  onPress={() => setSelectedProduct(item)}
                  activeOpacity={0.7}>
                  <Image source={{ uri: item.image }} style={styles.productThumb} />
                  <View style={styles.productInfo}>
                    <Text style={styles.productTitle}>{item.name}</Text>
                    <Text style={styles.productMeta}>Size: {item.size}  •  Qty: {item.qty}</Text>
                  </View>
                  <Text style={styles.productPrice}>₹{formatMoney(item.price)}</Text>
                  <SvgXml xml={chevRight(colors.textMuted)} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              ))}
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.sectionHeading}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>Rs. {formatMoney(selectedOrder?.subtotal ?? 0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>Rs. {formatMoney(selectedOrder?.shippingCharges ?? 0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>Rs. {formatMoney(selectedOrder?.tax ?? 0)}</Text>
            </View>

            <View style={[styles.summaryRow, { marginTop: 12 }]}>
              <Text style={styles.totalBoldLabel}>TOTAL</Text>
              <Text style={styles.totalBoldValue}>Rs. {formatMoney(selectedOrder?.totalAmount ?? 0)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.downloadInvoiceBtn, downloadingInvoice && { opacity: 0.6 }]}
              onPress={handleDownloadInvoice}
              disabled={downloadingInvoice}
              activeOpacity={0.8}>
              {downloadingInvoice ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.downloadInvoiceText}>Download Invoice</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.addressCard}>
            <Text style={styles.sectionHeading}>Delivery Address</Text>
            <View style={styles.addressNameRow}>
              <SvgXml xml={locationIcon(colors.textSecondary)} />
              <Text style={styles.addressName}>
                {' '}{(selectedOrder?.shippingAddress?.name || 'N/A').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.addressText}>
              {[
                selectedOrder?.shippingAddress?.street,
                selectedOrder?.shippingAddress?.city,
                selectedOrder?.shippingAddress?.state,
                selectedOrder?.shippingAddress?.country,
              ]
                .filter(Boolean)
                .join(', ')}
              {selectedOrder?.shippingAddress?.pincode
                ? ` - ${selectedOrder.shippingAddress.pincode}`
                : ''}
            </Text>
            <Text style={styles.addressText}>{selectedOrder?.shippingAddress?.phone || ''}</Text>
          </View>

          <View style={styles.paymentCard}>
            <Text style={styles.sectionHeading}>Payment Method</Text>
            <View style={styles.paymentRow}>
              <View style={styles.methodRow}>
                <View style={styles.dotBorderCircle}>
                  <View style={styles.redDot} />
                </View>
                <Text style={styles.paymentLabel}>Method</Text>
              </View>
              <Text style={styles.paymentValue}>{selectedOrder?.paymentMethod}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* FILTER BOTTOM SHEET MODAL */}
      <Modal visible={filterVisible} transparent animationType="slide" onRequestClose={() => setFilterVisible(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: 20 + Math.max(insets.bottom, 16) },
            ]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Filter Orders</Text>
                <Text style={styles.modalSubtitle}>Update your personal details</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setFilterVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Status</Text>
            {['All statuses', 'On the way', 'Delivered', 'Cancelled', 'Returned'].map(status => (
              <TouchableOpacity
                key={status}
                style={styles.radioRow}
                onPress={() => setSelectedStatus(status)}
                activeOpacity={0.7}>
                <View style={[styles.radioCircle, selectedStatus === status && styles.radioActive]}>
                  {selectedStatus === status && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.radioLabel, selectedStatus === status && styles.radioLabelActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.filterSectionTitle}>Time period</Text>
            {['Anytime', 'Last 30 days', 'Last 6 months', 'Last year'].map(time => (
              <TouchableOpacity
                key={time}
                style={styles.radioRow}
                onPress={() => setSelectedTime(time)}
                activeOpacity={0.7}>
                <View style={[styles.radioCircle, selectedTime === time && styles.radioActive]}>
                  {selectedTime === time && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.radioLabel, selectedTime === time && styles.radioLabelActive]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  setSelectedStatus('All statuses');
                  setSelectedTime('Anytime');
                  setActiveTab('All');
                }}
                activeOpacity={0.7}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setActiveTab(selectedStatus === 'All statuses' ? 'All' : selectedStatus);
                  setFilterVisible(false);
                }}
                activeOpacity={0.8}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* CANCEL ORDER BOTTOM SHEET MODAL */}
<Modal
  visible={cancelModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setCancelModalVisible(false)}>
  <View style={styles.modalOverlay1}>
    <View
      style={[
        styles.cancelModalSheet,
        { paddingBottom: 28 + Math.max(insets.bottom, 16) },
      ]}>
      <View style={styles.modalHandle1} />

      {/* Modal Header */}
      <View style={styles.cancelModalHeader}>
        <View>
          <Text style={styles.cancelModalTitle}>Cancel Order</Text>
          <Text style={styles.cancelModalSubtitle}>Why are you cancelling this order?</Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtnCircle}
          onPress={() => setCancelModalVisible(false)}>
          <BrandIcon icon={BRAND.close} />
        </TouchableOpacity>
      </View>

      {/* Dropdown Container */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={styles.dropdownHeader}
          activeOpacity={0.7}
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}>
          <Text style={styles.dropdownHeaderText}>
            {selectedReason || 'Choose a reason'}
          </Text>
          <BrandIcon
            icon={BRAND.chevronDown}
            style={isDropdownOpen && { transform: [{ rotate: '180deg' }] }}
          />
        </TouchableOpacity>

        {isDropdownOpen && (
          <ScrollView style={styles.dropdownList} nestedScrollEnabled>
            {cancelReasons.map(reason => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonItem,
                  selectedReason === reason && styles.selectedReasonItem,
                ]}
                onPress={() => {
                  setSelectedReason(reason);
                  setIsDropdownOpen(false);
                }}>
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason && styles.selectedReasonText,
                  ]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.cancelModalActions}>
        <TouchableOpacity
          style={styles.keepOrderBtn}
          activeOpacity={0.7}
          onPress={() => setCancelModalVisible(false)}>
          <Text style={styles.keepOrderBtnText}>Keep Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmCancelBtn, cancelling && { opacity: 0.6 }]}
          activeOpacity={0.8}
          disabled={cancelling}
          onPress={handleConfirmCancel}>
          {cancelling ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmCancelBtnText}>Confirm Cancel</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

      {/* WRITE A REVIEW BOTTOM SHEET MODAL */}
      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeReviewForm}>
        <View style={styles.modalOverlay1}>
          <View
            style={[
              styles.reviewModalSheet,
              { paddingBottom: 28 + Math.max(insets.bottom, 16) },
            ]}>
            <View style={styles.modalHandle1} />

            <View style={styles.cancelModalHeader}>
              <View>
                <Text style={styles.cancelModalTitle}>
                  {existingReview ? 'Edit Review' : 'Write a Review'}
                </Text>
                <Text style={styles.cancelModalSubtitle} numberOfLines={1}>
                  {selectedProduct?.name || 'Rate this product'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtnCircle} onPress={closeReviewForm}>
                <BrandIcon icon={BRAND.close} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.reviewFieldLabel}>Your Rating</Text>
              <View style={styles.reviewStarPicker}>
                {[1, 2, 3, 4, 5].map(i => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                    onPress={() => {
                      setReviewRating(i);
                      setReviewError('');
                    }}>
                    <SvgXml xml={starIcon(i <= reviewRating, 30, '#FFB400')} width={30} height={30} />
                  </TouchableOpacity>
                ))}
              </View>

              {!!reviewError && <Text style={styles.reviewErrorText}>{reviewError}</Text>}

              <Text style={styles.reviewFieldLabel}>Your Review</Text>
              <TextInput
                style={[styles.reviewInput, styles.reviewTextArea]}
                placeholder="Share your experience about this product…"
                placeholderTextColor={colors.textMuted}
                value={reviewComment}
                onChangeText={setReviewComment}
                multiline
                maxLength={600}
                textAlignVertical="top"
              />

              <Text style={styles.reviewFieldLabel}>Photos (optional)</Text>
              <View style={styles.reviewImagesRow}>
                {reviewImages.map((uri, index) => (
                  <View key={`${index}-${uri.slice(0, 24)}`} style={styles.reviewImageWrap}>
                    <Image source={{ uri }} style={styles.reviewImageThumb} />
                    <TouchableOpacity
                      style={styles.reviewImageRemove}
                      activeOpacity={0.8}
                      onPress={() => removeReviewImage(index)}>
                      <Text style={styles.reviewImageRemoveText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {reviewImages.length < MAX_REVIEW_IMAGES && (
                  <TouchableOpacity
                    style={styles.reviewImageAdd}
                    activeOpacity={0.7}
                    onPress={pickReviewImages}>
                    <Text style={styles.reviewImageAddText}>+</Text>
                    <Text style={styles.reviewImageAddLabel}>Add photo</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[styles.reviewSubmitBtn, submittingReview && { opacity: 0.6 }]}
                activeOpacity={0.8}
                disabled={submittingReview}
                onPress={submitProductReview}>
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.reviewSubmitBtnText}>
                    {existingReview ? 'Update Review' : 'Submit Review'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MyOrdersScreen;import { BRAND } from '../assets/svg/brand';
import BrandIcon from '../components/BrandIcon';