import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentMethods'>;

// ─── Icon Builders (Theme-aware) ──────────────────────────────────────────────
const backArrowIcon = (color: string) =>
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const upiIcon = (color: string) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="2" width="10" height="20" rx="2" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><line x1="11" y1="18" x2="13" y2="18" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/></svg>`;

const cardIcon = (color: string) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="5" width="20" height="14" rx="2" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><line x1="2" y1="10" x2="22" y2="10" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/><line x1="6" y1="15" x2="10" y2="15" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/></svg>`;

const codIcon = (color: string) =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="20" height="12" rx="2" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.5" stroke="${color}" stroke-width="1.8"/></svg>`;

const checkIcon = (color: string) =>
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const lockIcon = (color: string) =>
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="11" width="16" height="10" rx="2" stroke="${color}" stroke-width="1.8"/><path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/></svg>`;

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
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      fontFamily: fontFamily.bold,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 32,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      fontFamily: fontFamily.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 20,
      marginBottom: 10,
    },
    methodCard: {
      borderRadius: 14,
      backgroundColor: colors.surfaceVariant,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    methodHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    methodIconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    methodTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      fontFamily: fontFamily.bold,
    },
    methodSub: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    methodBody: {
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingTop: 12,
    },
    methodTextWrap: {
      flex: 1,
    },
    methodText: {
      fontSize: 12.5,
      color: colors.textSecondary,
      lineHeight: 19,
      fontFamily: fontFamily.regular,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    featureText: {
      fontSize: 12.5,
      color: colors.textSecondary,
      marginLeft: 8,
      flex: 1,
      fontFamily: fontFamily.regular,
    },
    cardBrandsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    cardBrandBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    cardBrandText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      fontFamily: fontFamily.medium,
      letterSpacing: 0.3,
    },
    emptyCard: {
      borderRadius: 14,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border,
      padding: 20,
      alignItems: 'center',
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      fontFamily: fontFamily.bold,
      marginTop: 8,
    },
    emptySub: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
      textAlign: 'center',
    },
    secureNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    secureNoteText: {
      fontSize: 12,
      color: colors.textMuted,
      marginLeft: 6,
      fontFamily: fontFamily.regular,
    },
  });
};

// ─── Component Implementation ──────────────────────────────────────────────────
export const PaymentMethodsScreen = ({ navigation }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const accent = theme.colors.primary;

  const methodCards = [
    {
      key: 'upi',
      icon: upiIcon(accent),
      title: 'UPI',
      sub: 'GPay, PhonePe, Paytm',
      lines: [
        'Pay instantly using any UPI app of your choice.',
        'No extra charges — transaction is processed securely in real time.',
      ],
      features: [
        'Instant confirmation',
        'Works with all major banks',
        'No card details required',
      ],
      extras: null as React.ReactNode | null,
    },
    {
      key: 'card',
      icon: cardIcon(accent),
      title: 'Card',
      sub: 'Credit / Debit Cards',
      lines: [
        'Pay securely using your Credit or Debit Cards.',
        'Your card number, expiry and CVV are never stored by us.',
      ],
      features: [
        '3D secure checkout',
        'Supports domestic & international cards',
        'Instant payment confirmation',
      ],
      extras: (
        <View style={styles.cardBrandsRow}>
          {['VISA', 'MasterCard', 'RuPay', 'AMEX'].map(brand => (
            <View key={brand} style={styles.cardBrandBadge}>
              <Text style={styles.cardBrandText}>{brand}</Text>
            </View>
          ))}
        </View>
      ),
    },
    {
      key: 'cod',
      icon: codIcon(accent),
      title: 'Cash on Delivery',
      sub: 'Pay at your doorstep',
      lines: [
        'Pay in cash when your order is delivered to you.',
        'Available on most products across all pincodes.',
      ],
      features: [
        'No advance payment',
        'Inspect order before paying',
        'Limited to order value eligibility',
      ],
      extras: null as React.ReactNode | null,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}>
          <SvgXml xml={backArrowIcon(theme.colors.text)} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Available Options</Text>
        {methodCards.map(card => (
          <View key={card.key} style={styles.methodCard}>
            <View style={styles.methodHeader}>
              <View style={styles.methodIconBox}>
                <SvgXml xml={card.icon} width={20} height={20} />
              </View>
              <View style={styles.methodTextWrap}>
                <Text style={styles.methodTitle}>{card.title}</Text>
                <Text style={styles.methodSub}>{card.sub}</Text>
              </View>
            </View>

            <View style={styles.methodBody}>
              {card.lines.map((line, idx) => (
                <Text key={idx} style={styles.methodText}>
                  {line}
                </Text>
              ))}
              {card.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <SvgXml xml={checkIcon(theme.colors.success)} width={14} height={14} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
              {card.extras}
            </View>
          </View>
        ))}

        <Text style={styles.sectionLabel}>Saved Cards</Text>
        <View style={styles.emptyCard}>
          <SvgXml xml={cardIcon(theme.colors.textMuted)} width={26} height={26} />
          <Text style={styles.emptyTitle}>No saved cards yet</Text>
          <Text style={styles.emptySub}>
            Cards you save while checking out will appear here.
          </Text>
        </View>

        <View style={styles.secureNote}>
          <SvgXml xml={lockIcon(theme.colors.textMuted)} width={14} height={14} />
          <Text style={styles.secureNoteText}>
            Your payment details are 100% safe &amp; secure
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PaymentMethodsScreen;