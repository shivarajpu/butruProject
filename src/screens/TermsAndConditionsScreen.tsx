import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { SvgXml, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';

// Gradient IDs
const GRADIENT_INTRO_ID = 'gradIntro';
const GRADIENT_CONTACT_ID = 'gradContact';

// SVG Icons
const BACK_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="CURRENT_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const RET_POLICY_BADGE_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="#FFF" stroke-width="2"/><path d="M16 2v4M8 2v4M7 11h10M7 15h7" stroke="#FFF" stroke-width="2" stroke-linecap="round"/></svg>`;
const CHECK_SHIELD_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#B12B5B" stroke-width="2"/><path d="M9 12l2 2 4-4" stroke="#B12B5B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const WALLET_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="#B12B5B" stroke-width="2"/><path d="M16 12h2" stroke="#B12B5B" stroke-width="2" stroke-linecap="round"/><path d="M2 9h20" stroke="#B12B5B" stroke-width="2"/></svg>`;
const REFRESH_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" stroke="#B12B5B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const TRUCK_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="15" height="13" rx="1" stroke="#B12B5B" stroke-width="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" stroke="#B12B5B" stroke-width="2"/><circle cx="5.5" cy="18.5" r="2.5" stroke="#B12B5B" stroke-width="2"/><circle cx="18.5" cy="18.5" r="2.5" stroke="#B12B5B" stroke-width="2"/></svg>`;
const ALERT_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="#B12B5B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const LOCK_ICON = `<svg width="14" height="17" viewBox="0 0 14 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.9 12.6C10.2125 12.6 10.4781 12.4906 10.6969 12.2719C10.9156 12.0531 11.025 11.7875 11.025 11.475C11.025 11.1625 10.9156 10.8969 10.6969 10.6781C10.4781 10.4594 10.2125 10.35 9.9 10.35C9.5875 10.35 9.32187 10.4594 9.10312 10.6781C8.88437 10.8969 8.775 11.1625 8.775 11.475C8.775 11.7875 8.88437 12.0531 9.10312 12.2719C9.32187 12.4906 9.5875 12.6 9.9 12.6ZM9.9 14.85C10.3 14.85 10.6688 14.75 11.0063 14.55C11.3438 14.35 11.6125 14.0875 11.8125 13.7625C11.525 13.6 11.2219 13.4781 10.9031 13.3969C10.5844 13.3156 10.25 13.275 9.9 13.275C9.55 13.275 9.21563 13.3188 8.89688 13.4062C8.57812 13.4937 8.275 13.6125 7.9875 13.7625C8.1875 14.0875 8.45625 14.35 8.79375 14.55C9.13125 14.75 9.5 14.85 9.9 14.85ZM3.15 5.4H7.65V3.6C7.65 2.975 7.43125 2.44375 6.99375 2.00625C6.55625 1.56875 6.025 1.35 5.4 1.35C4.775 1.35 4.24375 1.56875 3.80625 2.00625C3.36875 2.44375 3.15 2.975 3.15 3.6V5.4ZM5.75625 15.3H1.35C0.97875 15.3 0.660938 15.1678 0.396562 14.9034C0.132187 14.6391 0 14.3212 0 13.95V6.75C0 6.37875 0.132187 6.06094 0.396562 5.79656C0.660938 5.53219 0.97875 5.4 1.35 5.4H1.8V3.6C1.8 2.604 2.15141 1.755 2.85424 1.053C3.55707 0.351 4.40707 0 5.40424 0C6.40141 0 7.25 0.351 7.95 1.053C8.65 1.755 9 2.604 9 3.6V5.4H9.45C9.82125 5.4 10.1391 5.53219 10.4034 5.79656C10.6678 6.06094 10.8 6.37875 10.8 6.75V7.74375C10.5868 7.70625 10.3648 7.67813 10.1339 7.65938C9.90296 7.64062 9.675 7.64375 9.45 7.66875V6.75H1.35V13.95H5.1375C5.2125 14.2 5.3 14.4375 5.4 14.6625C5.5 14.8875 5.61875 15.1 5.75625 15.3ZM9.89576 16.2C8.89859 16.2 8.05 15.8486 7.35 15.1458C6.65 14.4429 6.3 13.5929 6.3 12.5958C6.3 11.5986 6.65141 10.75 7.35424 10.05C8.05707 9.35 8.90707 9 9.90424 9C10.9014 9 11.75 9.35141 12.45 10.0542C13.15 10.7571 13.5 11.6071 13.5 12.6042C13.5 13.6014 13.1486 14.45 12.4458 15.15C11.7429 15.85 10.8929 16.2 9.89576 16.2ZM1.35 6.75C1.35 6.75 1.35 7.125 1.35 7.875C1.35 8.625 1.35 9.45 1.35 10.35C1.35 11.25 1.35 12.075 1.35 12.825C1.35 13.575 1.35 13.95 1.35 13.95V6.75Z" fill="#B12B5B"/>
</svg>`;
const MAIL_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#B12B5B" stroke-width="2"/><path d="M22 6l-10 7L2 6" stroke="#B12B5B" stroke-width="2"/></svg>`;
const MAIL_WHITE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#FFF" stroke-width="2"/><path d="M22 6l-10 7L2 6" stroke="#FFF" stroke-width="2"/></svg>`;

type ClauseItem = {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
};

const CLAUSES_DATA: ClauseItem[] = [
  {
    id: '1',
    code: 'CLAUSE 01',
    title: 'Order Confirmation',
    description:
      'By placing an order, you confirm that all information provided is accurate, and you agree to pay for the products and any applicable shipping charges.',
    icon: CHECK_SHIELD_ICON,
  },
  {
    id: '2',
    code: 'CLAUSE 02',
    title: 'Pricing and Availability',
    description:
      'Prices may change without notice. If a product is out of stock, we will notify you and issue a refund if necessary.',
    icon: WALLET_ICON,
  },
  {
    id: '3',
    code: 'CLAUSE 03',
    title: 'Returns and Refunds',
    description:
      'Our Return and Refund Policy applies. Returns are accepted within 14 days of receiving the order, and items must be in original condition.',
    icon: REFRESH_ICON,
  },
  {
    id: '4',
    code: 'CLAUSE 04',
    title: 'Shipping',
    description:
      'We aim to ship orders within 2 to 3 business days, and delivery times may vary depending on your location.',
    icon: TRUCK_ICON,
  },
  {
    id: '5',
    code: 'CLAUSE 05',
    title: 'Liability',
    description:
      'We are not responsible for any damages or issues caused by improper use of products.',
    icon: ALERT_ICON,
  },
  {
    id: '6',
    code: 'CLAUSE 06',
    title: 'Privacy',
    description:
      'We protect your personal information and use it solely for processing orders and communication.',
    icon: CHECK_SHIELD_ICON,
  },
  {
    id: '7',
    code: 'CLAUSE 07',
    title: 'Account Use',
    description:
      'You are responsible for keeping your login credentials secure and for all activity under your account. Provide accurate contact and delivery details at all times.',
    icon: LOCK_ICON,
  },
];

export default function TermsAndConditionsScreen({ navigation }: any) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const handleEmailPress = () => {
    Linking.openURL('mailto:hellobutru@gmail.com');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
          activeOpacity={0.7}>
          <SvgXml
            xml={BACK_ICON.replace('CURRENT_COLOR', theme.colors.text)}
            width={20}
            height={20}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms and Conditions</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Intro Card */}
        <View style={styles.introCard}>
          <Svg style={styles.gradientFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id={GRADIENT_INTRO_ID} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#FFF0F5" />
                <Stop offset="1" stopColor="#FDF2F8" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${GRADIENT_INTRO_ID})`} rx={16} />
          </Svg>
          <View style={styles.badge}>
            <View style={styles.badgeIconContainer}>
              <SvgXml xml={RET_POLICY_BADGE_ICON} width={14} height={14} />
            </View>
            <Text style={styles.badgeText}>Legal Agreement</Text>
          </View>
          <Text style={styles.introText}>
            Please read these Terms and Conditions carefully before placing an
            order on Butru. By completing your purchase, you agree to these
            terms.
          </Text>
        </View>

        {/* Clauses List */}
        {CLAUSES_DATA.map(item => (
          <View key={item.id} style={styles.clauseCard}>
            <View style={styles.clauseHeader}>
              <View style={styles.iconCircle}>
                <SvgXml xml={item.icon} width={16} height={16} />
              </View>
              <View style={styles.clauseTitleContainer}>
                <Text style={styles.clauseCode}>{item.code}</Text>
                <Text style={styles.clauseTitle}>{item.title}</Text>
              </View>
            </View>
            <Text style={styles.clauseDescription}>{item.description}</Text>
          </View>
        ))}

        {/* Contact Card */}
        <View style={styles.contactCard}>
          <Svg style={styles.gradientFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id={GRADIENT_CONTACT_ID} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#FFF0F5" />
                <Stop offset="1" stopColor="#FDF2F8" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${GRADIENT_CONTACT_ID})`} rx={16} />
          </Svg>
          <View style={styles.contactHeader}>
            <View style={styles.iconCircle}>
              <SvgXml xml={MAIL_ICON} width={16} height={16} />
            </View>
            <Text style={styles.contactTitle}>Contact</Text>
          </View>

          <Text style={styles.contactText}>
            For any inquiries regarding these Terms and Conditions, contact us
            at{' '}
            <Text style={styles.emailHighlight}>hellobutru@gmail.com</Text>.
          </Text>

          <Text style={styles.contactTextSub}>
            For any inquiries, contact us at hellobutru@gmail.com.
          </Text>

          <TouchableOpacity
            style={styles.emailButton}
            onPress={handleEmailPress}
            activeOpacity={0.8}>
            <SvgXml
              xml={MAIL_WHITE_ICON}
              width={16}
              height={16}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.emailButtonText}>
              Email Us (hellobutru@gmail.com)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          © 2026 Butru. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 16,
      fontFamily: fontFamily.heading,
      color: colors.text,
    },
    container: {
      flex: 1,
      backgroundColor: colors.backgroundColor,
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
    },
    gradientFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },

    /* Intro Card */
    introCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.divider,
      overflow: 'hidden',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      marginBottom: 10,
    },
    badgeIconContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    },
    badgeText: {
      color: colors.textOnPrimary,
      fontSize: 11,
      fontFamily: fontFamily.bold,
    },
    introText: {
      fontSize: 12,
      color: '#500724',
      lineHeight: 19.5,
      letterSpacing: 0,
      fontFamily: fontFamily.regular,
    },

    /* Clause Card */
    clauseCard: {
      backgroundColor: colors.primaryLight,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    clauseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 12,
      backgroundColor: '#FDF2F8',
      borderWidth: 1,
      borderColor: colors.divider,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    clauseTitleContainer: {
      flex: 1,
    },
    clauseCode: {
      fontSize: 10,
      fontFamily: fontFamily.bold,
      color: '#B12B5B',
      lineHeight: 15,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    clauseTitle: {
      fontSize: 14,
      fontFamily: fontFamily.bold,
      color: '#1B1B21',
      lineHeight: 20,
      letterSpacing: 0,
      marginTop: 1,
    },
    clauseDescription: {
      fontSize: 12,
      color: '#5A4044',
      lineHeight: 19.5,
      letterSpacing: 0,
      fontFamily: fontFamily.regular,
    },

    /* Contact Card */
    contactCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.divider,
      overflow: 'hidden',
    },
    contactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    contactTitle: {
      fontSize: 14,
      fontFamily: fontFamily.bold,
      color: '#1B1B21',
      lineHeight: 20,
      letterSpacing: 0,
      marginTop: 1,
    },
    contactText: {
      fontSize: 12,
      color: '#5A4044',
      lineHeight: 19.5,
      letterSpacing: 0,
      marginBottom: 8,
      fontFamily: fontFamily.regular,
    },
    emailHighlight: {
      color: '#B12B5B',
      fontFamily: fontFamily.bold,
    },
    contactTextSub: {
      fontSize: 12,
      color: '#5A4044',
      lineHeight: 19.5,
      letterSpacing: 0,
      marginBottom: 14,
      fontFamily: fontFamily.regular,
    },
    emailButton: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emailButtonText: {
      color: colors.textOnPrimary,
      fontSize: 12,
      fontFamily: fontFamily.bold,
    },

    /* Footer */
    footerText: {
      textAlign: 'center',
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 8,
      fontFamily: fontFamily.regular,
    },
  });
};
