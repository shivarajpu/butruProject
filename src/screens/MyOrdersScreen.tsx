import React, { useState } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import { FONTS } from '../constants/fonts';

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

// ─── Types & Mock Data ────────────────────────────────────────────────────────

type ProductItem = {
  id: string;
  code?: string;
  name: string;
  size: string;
  qty: number;
  price: number;
  image: string;
};

type OrderType = {
  orderId: string;
  date: string;
  totalAmount: number;
  status: string;
  items: ProductItem[];
};

const MOCK_ORDER: OrderType = {
  orderId: '#ORD-790703-976472',
  date: 'September 14, 2026',
  totalAmount: 823.64,
  status: 'ORDER PLACED',
  items: [
    {
      id: '1',
      code: 'TSH02',
      name: 'Striped Short Sleeve',
      size: '7-8 Y',
      qty: 1,
      price: 399,
      image: 'https://via.placeholder.com/100',
    },
    {
      id: '2',
      code: 'H01',
      name: 'Stylish Western Frock',
      size: '3-4 Y',
      qty: 1,
      price: 299,
      image: 'https://via.placeholder.com/100',
    },
  ],
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
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
    },
    orderItemCount: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: fontFamily.regular,
    },
    priceAlignEnd: { alignItems: 'flex-end' },
    innerProductRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
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
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
    },
    productPriceBold: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
    },
    sectionHeading: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginVertical: 8,
      fontFamily: fontFamily.bold,
    },
    selectedTimelineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    selectedTimelineTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
    },
    totalBoldValue: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.primary,
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
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
      fontFamily: fontFamily.bold,
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
    radioLabelActive: { color: colors.text, fontWeight: '700', fontFamily: fontFamily.bold },
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
      fontFamily: fontFamily.bold,
    },
  });
};

// ─── Component ────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'MyOrders'>;

const MyOrdersScreen = ({ navigation }: Props) => {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Navigation Flow States: 'LIST' | 'TRACK' | 'DETAILS'
  const [currentScreen, setCurrentScreen] = useState<'LIST' | 'TRACK' | 'DETAILS'>('LIST');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem>(MOCK_ORDER.items[0]);
  const [detailsFrom, setDetailsFrom] = useState<'TRACK' | 'LIST'>('TRACK');

  // Modal State
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All statuses');
  const [selectedTime, setSelectedTime] = useState('Anytime');
  const [activeTab, setActiveTab] = useState('All');

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
        <TouchableOpacity style={styles.bagBtn} activeOpacity={0.7}>
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
              />
              <TouchableOpacity
                style={styles.insideFilterBtn}
                onPress={() => setFilterVisible(true)}
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

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total orders</Text>
              <Text style={styles.metricValue}>1</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>In progress</Text>
              <Text style={[styles.metricValue , {color:"#2563EB"}]}>1</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Delivered</Text>
              <Text style={[styles.metricValue, { color: colors.success }]}>0</Text>
            </View>
          </View>

          {/* Main Order Box */}
          <View style={styles.orderCard}>
            <View style={styles.orderCardHeader}>
              <View style={styles.orderHeaderRow}>
                <View style={styles.statusBadgeRow}>
                  <View style={[styles.orderStatusIconBox ,{backgroundColor:colors.primary}]}>
                    <SvgXml xml={boxIcon(colors.surface)} width={20} height={20} />
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>ORDER PLACED</Text>
                  </View>
                </View>
                <SvgXml xml={chevRight(colors.textMuted)} />
              </View>
              <Text style={styles.orderDate}>Placed on 14 Sept 2026</Text>
            </View>

            <View style={styles.orderSubHeader}>
              <View>
                <Text style={styles.orderIdLabel}>ORDER ID</Text>
                <View style={styles.orderIdRow}>
                  <Text style={styles.orderIdText}>{MOCK_ORDER.orderId}</Text>
                  <SvgXml xml={copyIcon(colors.textMuted)} style={{ marginLeft: 6 }} />
                </View>
              </View>
              <View style={styles.priceAlignEnd}>
                <Text style={styles.orderPrice}>₹698</Text>
                <Text style={styles.orderItemCount}>2 Items</Text>
              </View>
            </View>

            {MOCK_ORDER.items.map(item => (
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
                <Text style={styles.productPrice}>₹{item.price}</Text>
                <SvgXml xml={chevRight(colors.textMuted)} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ))}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.btnOutline}
                onPress={() => {
                  setSelectedProduct(MOCK_ORDER.items[0]);
                  setDetailsFrom('LIST');
                  setCurrentScreen('DETAILS');
                }}
                activeOpacity={0.7}>
                <Text style={styles.btnOutlineText}>View details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => setCurrentScreen('TRACK')}
                activeOpacity={0.8}>
                <Text style={styles.btnPrimaryText}>Track order</Text>
              </TouchableOpacity>
            </View>
          </View>
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
              <View style={[styles.orderStatusIconBox ,{width:40 , height:40 ,borderRadius:20}]}>
                <SvgXml xml={boxIcon(colors.primary)} width={25} height={25} />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.orderIdText}>Order {MOCK_ORDER.orderId}</Text>
                <Text style={styles.orderDate}>Placed on September 14, 2026 • 2 Items</Text>
              </View>
            </View>
            <View style={{borderWidth:0.5,borderColor:'#F8D2DD' , marginTop:12}}/>
            <View style={styles.totalRowInBox}>
              <View>
                <Text style={styles.metricLabel}>Total Amount</Text>
                <Text style={styles.totalAmountText}>₹{MOCK_ORDER.totalAmount}</Text>
              </View>
              <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Timeline Section */}
          <View style={styles.timelineContainer}>
            {[
              { title: 'Order Placed', time: 'September 14, 2026\n10:43 AM', status: 'Completed', active: true, icon: checkIcon(colors.textOnPrimary) },
              { title: 'Processing', time: 'September 14, 2026\n2:30 PM', status: 'In Progress', active: false, icon: gearIcon(colors.textMuted) },
              { title: 'Shipped', time: 'September 14, 2026\n2:30 PM', status: 'Pending', active: false, icon: boxIcon(colors.textMuted) },
              { title: 'Out For Delivery', time: 'September 14, 2026\n2:30 PM', status: 'Pending', active: false, icon: truckIcon(colors.textMuted) },
              { title: 'Delivered', time: 'September 14, 2026\n2:30 PM', status: 'Pending', active: false, icon: boxIcon(colors.textMuted) },
            ].map((step, idx, arr) => (
              <View key={idx} style={styles.timelineRow}>
                <View style={styles.timelineNodeCol}>
                  <View style={[styles.timelineNode, step.active && styles.timelineNodeActive]}>
                    <SvgXml xml={step.icon} />
                  </View>
                  {idx !== arr.length - 1 && <View style={styles.timelineLine} />}
                </View>

                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{step.title}</Text>
                  <Text style={styles.timelineTime}>{step.time}</Text>
                </View>

                <Text style={[styles.statusTag, step.active && styles.statusTagActive]}>{step.status}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoNoteBox}>
            <SvgXml xml={infoIcon(colors.primary, colors.textOnPrimary)} />
            <Text style={styles.infoNoteText}>
              Tracking information may take a few hours to update. Thank you for your patience!
            </Text>
          </View>

          <Text style={styles.sectionHeading}>Order Item (2)</Text>
          <View style={styles.productListBox}>
            {MOCK_ORDER.items.map(item => (
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
                <Text style={styles.productPrice}>₹{item.price}</Text>
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
              <View style={styles.orderStatusIconBox}>
                <SvgXml xml={boxIcon(colors.primary)} width={20} height={20} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.orderIdText}>Order {MOCK_ORDER.orderId}</Text>
                <Text style={styles.orderDate}>Placed on September 14, 2026 • 2 Items</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTag}>SELECTED PRODUCT</Text>
          <Text style={styles.sectionHeading}>Order Timeline</Text>

          <View style={styles.selectedTimelineRow}>
            <SvgXml xml={checkCircleIcon(colors.success)} />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.selectedTimelineTitle}>Order Placed</Text>
              <Text style={styles.selectedTimelineTime}>September 14, 2026 • 10:43 AM</Text>
            </View>
          </View>

          <View style={styles.selectedProductCard}>
            <Image source={{ uri: selectedProduct.image }} style={styles.productThumbLarge} />
            <View style={styles.productInfo}>
              <Text style={styles.productTitleBold}>{selectedProduct.name}</Text>
              <Text style={styles.productMeta}>Size: {selectedProduct.size}  •  Qty: {selectedProduct.qty}</Text>
            </View>
            <Text style={styles.productPriceBold}>₹{selectedProduct.price}</Text>
          </View>

          <Text style={styles.sectionHeading}>Other Items In This Order</Text>
          <Text style={styles.orderIdSub}>Order ID {MOCK_ORDER.orderId}</Text>

          <View style={styles.productListBox}>
            {MOCK_ORDER.items
              .filter(i => i.id !== selectedProduct.id)
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
                  <Text style={styles.productPrice}>₹{item.price}</Text>
                  <SvgXml xml={chevRight(colors.textMuted)} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              ))}
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.sectionHeading}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>Rs. 698</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>Rs. 0</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>Rs. 125.64</Text>
            </View>

            <View style={[styles.summaryRow, { marginTop: 12 }]}>
              <Text style={styles.totalBoldLabel}>TOTAL</Text>
              <Text style={styles.totalBoldValue}>Rs. 823.64</Text>
            </View>

            <TouchableOpacity style={styles.downloadInvoiceBtn} activeOpacity={0.8}>
              <Text style={styles.downloadInvoiceText}>Download Invoice</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.addressCard}>
            <Text style={styles.sectionHeading}>Delivery Address</Text>
            <View style={styles.addressNameRow}>
              <SvgXml xml={locationIcon(colors.textSecondary)} />
              <Text style={styles.addressName}> GOUTAM CHAUDHARY</Text>
            </View>
            <Text style={styles.addressText}>sgtdf, Khandwa, Madhya Pradesh, 450881, India</Text>
            <Text style={styles.addressText}>9988776655</Text>
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
              <Text style={styles.paymentValue}>COD</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* FILTER BOTTOM SHEET MODAL */}
      <Modal visible={filterVisible} transparent animationType="slide" onRequestClose={() => setFilterVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
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
                }}
                activeOpacity={0.7}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setFilterVisible(false)} activeOpacity={0.8}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MyOrdersScreen;