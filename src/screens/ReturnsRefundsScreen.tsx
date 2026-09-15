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
const RET_POLICY_BADGE_ICON = `<svg width="9" height="10" viewBox="0 0 9 10" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.5 7.5L5.2 6.8L4.4125 6H6.5V5H4.4125L5.2 4.2L4.5 3.5L2.5 5.5L4.5 7.5ZM1 10C0.725 10 0.489583 9.90208 0.29375 9.70625C0.0979166 9.51042 0 9.275 0 9V2C0 1.725 0.0979166 1.48958 0.29375 1.29375C0.489583 1.09792 0.725 1 1 1H3.1C3.20833 0.7 3.38958 0.458333 3.64375 0.275C3.89792 0.0916667 4.18333 0 4.5 0C4.81667 0 5.10208 0.0916667 5.35625 0.275C5.61042 0.458333 5.79167 0.7 5.9 1H8C8.275 1 8.51042 1.09792 8.70625 1.29375C8.90208 1.48958 9 1.725 9 2V9C9 9.275 8.90208 9.51042 8.70625 9.70625C8.51042 9.90208 8.275 10 8 10H1ZM1 9H8V2H1V9ZM4.5 1.625C4.60833 1.625 4.69792 1.58958 4.76875 1.51875C4.83958 1.44792 4.875 1.35833 4.875 1.25C4.875 1.14167 4.83958 1.05208 4.76875 0.98125C4.69792 0.910417 4.60833 0.875 4.5 0.875C4.39167 0.875 4.30208 0.910417 4.23125 0.98125C4.16042 1.05208 4.125 1.14167 4.125 1.25C4.125 1.35833 4.16042 1.44792 4.23125 1.51875C4.30208 1.58958 4.39167 1.625 4.5 1.625ZM1 9V2V9Z" fill="white"/>
</svg>
`;
const CHECK_SHIELD_ICON = `<svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.60625 15.3L4.2 12.975L1.55625 12.375L1.8 9.675L0 7.65L1.8 5.625L1.55625 2.925L4.2 2.325L5.60625 0L8.1 1.06875L10.5938 0L12 2.325L14.6438 2.925L14.4 5.625L16.2 7.65L14.4 9.675L14.6438 12.375L12 12.975L10.5938 15.3L8.1 14.2312L5.60625 15.3ZM6.15 13.5938L8.1 12.7688L10.05 13.5938L11.1375 11.775L13.2 11.3062L13.0125 9.225L14.4 7.65L13.0125 6.075L13.2 3.99375L11.1375 3.525L10.05 1.70625L8.1 2.53125L6.15 1.70625L5.0625 3.525L3 3.975L3.1875 6.075L1.8 7.65L3.20625 9.225L3 11.325L5.0625 11.7937L6.15 13.5938ZM7.14375 10.35L11.6062 5.90625L10.65 4.95L7.14375 8.4375L5.55 6.8625L4.59375 7.81875L7.14375 10.35Z" fill="#B12B5B"/>
</svg>
`;
const VIDEO_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="15" height="16" rx="2" stroke="#B12B5B" stroke-width="2"/><path d="M17 9l5-3v12l-5-3" stroke="#B12B5B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const MAIL_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#B12B5B" stroke-width="2"/><path d="M22 6l-10 7L2 6" stroke="#B12B5B" stroke-width="2"/></svg>`;
const REFRESH_ICON = `<svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.75 13.5L0 9.75L3.75 6L4.81875 7.05L2.86875 9H14.25V10.5H2.86875L4.81875 12.45L3.75 13.5ZM11.25 7.5L10.1812 6.45L12.1313 4.5H0.75V3H12.1313L10.1812 1.05L11.25 0L15 3.75L11.25 7.5Z" fill="#B12B5B"/>
</svg>
`;
const WALLET_ICON = `<svg width="17" height="12" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.75 6.75C9.125 6.75 8.59375 6.53125 8.15625 6.09375C7.71875 5.65625 7.5 5.125 7.5 4.5C7.5 3.875 7.71875 3.34375 8.15625 2.90625C8.59375 2.46875 9.125 2.25 9.75 2.25C10.375 2.25 10.9062 2.46875 11.3438 2.90625C11.7812 3.34375 12 3.875 12 4.5C12 5.125 11.7812 5.65625 11.3438 6.09375C10.9062 6.53125 10.375 6.75 9.75 6.75ZM4.5 9C4.0875 9 3.73438 8.85312 3.44062 8.55937C3.14687 8.26562 3 7.9125 3 7.5V1.5C3 1.0875 3.14687 0.734375 3.44062 0.440625C3.73438 0.146875 4.0875 0 4.5 0H15C15.4125 0 15.7656 0.146875 16.0594 0.440625C16.3531 0.734375 16.5 1.0875 16.5 1.5V7.5C16.5 7.9125 16.3531 8.26562 16.0594 8.55937C15.7656 8.85312 15.4125 9 15 9H4.5ZM6 7.5H13.5C13.5 7.0875 13.6469 6.73438 13.9406 6.44063C14.2344 6.14688 14.5875 6 15 6V3C14.5875 3 14.2344 2.85313 13.9406 2.55938C13.6469 2.26562 13.5 1.9125 13.5 1.5H6C6 1.9125 5.85312 2.26562 5.55937 2.55938C5.26562 2.85313 4.9125 3 4.5 3V6C4.9125 6 5.26562 6.14688 5.55937 6.44063C5.85312 6.73438 6 7.0875 6 7.5ZM14.25 12H1.5C1.0875 12 0.734375 11.8531 0.440625 11.5594C0.146875 11.2656 0 10.9125 0 10.5V2.25H1.5V10.5H14.25V12ZM4.5 7.5V1.5V7.5Z" fill="#B12B5B"/>
</svg>
`;
const TRUCK_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="15" height="13" rx="1" stroke="#B12B5B" stroke-width="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" stroke="#B12B5B" stroke-width="2"/><circle cx="5.5" cy="18.5" r="2.5" stroke="#B12B5B" stroke-width="2"/><circle cx="18.5" cy="18.5" r="2.5" stroke="#B12B5B" stroke-width="2"/></svg>`;
const ALERT_ICON = `<svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 14.25L8.25 0L16.5 14.25H0ZM2.5875 12.75H13.9125L8.25 3L2.5875 12.75ZM8.25 12C8.4625 12 8.64062 11.9281 8.78438 11.7844C8.92813 11.6406 9 11.4625 9 11.25C9 11.0375 8.92813 10.8594 8.78438 10.7156C8.64062 10.5719 8.4625 10.5 8.25 10.5C8.0375 10.5 7.85938 10.5719 7.71562 10.7156C7.57187 10.8594 7.5 11.0375 7.5 11.25C7.5 11.4625 7.57187 11.6406 7.71562 11.7844C7.85938 11.9281 8.0375 12 8.25 12ZM7.5 9.75H9V6H7.5V9.75Z" fill="#B12B5B"/>
</svg>
`;
const MAIL_WHITE_ICON = `<svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.6667 11.3333L9.73333 10.4L10.7833 9.33333H8V8H10.7833L9.73333 6.93333L10.6667 6L13.3333 8.66667L10.6667 11.3333ZM1.33333 9.33333C0.966667 9.33333 0.652778 9.20278 0.391667 8.94167C0.130556 8.68056 0 8.36667 0 8V1.33333C0 0.966667 0.130556 0.652778 0.391667 0.391667C0.652778 0.130556 0.966667 0 1.33333 0H10C10.3667 0 10.6806 0.130556 10.9417 0.391667C11.2028 0.652778 11.3333 0.966667 11.3333 1.33333V4.73333C11.2222 4.71111 11.1111 4.69444 11 4.68333C10.8889 4.67222 10.7778 4.66667 10.6667 4.66667C10.5556 4.66667 10.4444 4.66944 10.3333 4.675C10.2222 4.68056 10.1111 4.69444 10 4.71667V2.26667L5.6 5.33333L1.33333 2.28333V8H6.71667C6.69444 8.11111 6.68056 8.22222 6.675 8.33333C6.66944 8.44444 6.66667 8.55556 6.66667 8.66667C6.66667 8.77778 6.67222 8.88889 6.68333 9C6.69444 9.11111 6.71111 9.22222 6.73333 9.33333H1.33333ZM2.3 1.33333L5.6 3.7L9 1.33333H2.3ZM1.33333 8C1.33333 7.08889 1.33333 6.31389 1.33333 5.675C1.33333 5.03611 1.33333 4.71667 1.33333 4.71667V2.26667C1.33333 2.11111 1.33333 1.95556 1.33333 1.8C1.33333 1.64444 1.33333 1.48889 1.33333 1.33333C1.33333 1.48889 1.33333 1.64722 1.33333 1.80833C1.33333 1.96944 1.33333 2.12778 1.33333 2.28333V8Z" fill="white"/>
</svg>
`;

type ClauseItem = {
  id: string;
  code: string;
  title: string;
  bullets: string[];
  icon: string;
  highlightText?: string;
  innerAlert?: {
    title: string;
    description: string;
  };
};

const CLAUSES_DATA: ClauseItem[] = [
  {
    id: '1',
    code: 'CLAUSE 01',
    title: 'Eligibility for Return, Refund & Exchange',
    icon: CHECK_SHIELD_ICON,
    bullets: [
      'Requests must be raised within 5 days from the date of delivery.',
      'The product must be unused, unworn, unwashed, and in original condition with all tags, labels, and packaging intact.',
    ],
    innerAlert: {
      title: 'Mandatory Unpacking Video',
      description:
        'A clear unpacking/opening video is mandatory showing the sealed package being opened from start to finish. No return, refund, or exchange request will be accepted without an unpacking video.',
    },
  },
  {
    id: '2',
    code: 'CLAUSE 02',
    title: 'How to Raise a Request',
    icon: MAIL_ICON,
    bullets: [
      'Email us at hellobutru@gmail.com within 5 days of receiving the order.',
      'Mention your order number, reason for return/refund/exchange, and attach the unpacking video.',
      'Our support team will review your request and guide you through the next steps if approved.',
    ],
    highlightText: 'hellobutru@gmail.com',
  },
  {
    id: '3',
    code: 'CLAUSE 03',
    title: 'Exchange Policy',
    icon: REFRESH_ICON,
    bullets: [
      'Exchanges are allowed only once per order.',
      'Exchange is applicable only for size or product defects, subject to stock availability.',
      'If the requested replacement item is unavailable, a refund will be processed as per our refund policy.',
      'Exchange requests without an unpacking video will not be accepted.',
    ],
  },
  {
    id: '4',
    code: 'CLAUSE 04',
    title: 'Refund Policy',
    icon: WALLET_ICON,
    bullets: [
      'Refunds will be initiated only after the returned product is received and passes quality inspection.',
      'The refund will be credited to the original mode of payment.',
      'Refund processing may take 7–10 business days after inspection.',
    ],
  },
  {
    id: '5',
    code: 'CLAUSE 05',
    title: 'Shipping Charges',
    icon: TRUCK_ICON,
    bullets: [
      'Return and exchange shipping costs are borne by the customer, unless the product is damaged or defective.',
      'Original shipping charges are non-refundable.',
    ],
  },
  {
    id: '6',
    code: 'CLAUSE 06',
    title: 'Damaged or Defective Products',
    icon: ALERT_ICON,
    bullets: [
      'In case of damaged, defective, or incorrect items, please inform us within 5 days of delivery with a valid unpacking video and images.',
      'After verification, we will arrange a replacement or full refund, as applicable.',
    ],
  },
];

export default function ReturnsRefundsScreen({ navigation }: any) {
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
            width={18}
            height={18}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Returns, Refunds & Exchange</Text>
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
          <View style={styles.introHeaderRow}>
            <View style={styles.badge}>
              <View style={styles.badgeIconContainer}>
                <SvgXml xml={RET_POLICY_BADGE_ICON} width={12} height={12} />
              </View>
              <Text style={styles.badgeText}>Return & Exchange Policy</Text>
            </View>
            <Text style={styles.policySubtext}>Policy Guidelines</Text>
          </View>
          <Text style={styles.introText}>
            We aim to provide a smooth shopping experience. If you are not fully satisfied with your purchase, please review the terms below.
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

            {/* Bullets List */}
            <View style={styles.bulletsContainer}>
              {item.bullets.map((bullet, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    {item.highlightText && bullet.includes(item.highlightText) ? (
                      <>
                        {bullet.split(item.highlightText)[0]}
                        <Text style={styles.emailHighlight}>{item.highlightText}</Text>
                        {bullet.split(item.highlightText)[1]}
                      </>
                    ) : (
                      bullet
                    )}
                  </Text>
                </View>
              ))}
            </View>

            {/* Special Alert Box (Clause 01) */}
            {item.innerAlert && (
              <View style={styles.innerAlertBox}>
                <View style={styles.innerAlertHeader}>
                  <SvgXml xml={VIDEO_ICON} width={14} height={14} style={{ marginRight: 6 }} />
                  <Text style={styles.innerAlertTitle}>{item.innerAlert.title}</Text>
                </View>
                <Text style={styles.innerAlertText}>{item.innerAlert.description}</Text>
              </View>
            )}
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
            <Text style={styles.contactTitle}>Contact Customer Care</Text>
          </View>

          <Text style={styles.contactText}>
            For any questions or concerns regarding returns, refunds or exchanges, feel free to contact our customer care team at hellobutru@gmail.com.
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
          © 2024 Butru. All rights reserved.
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
      width: 34,
      height: 34,
      borderRadius: 17,
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
    introHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
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
    policySubtext: {
      color: colors.primary,
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
      marginBottom: 10,
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
      marginTop: 1,
    },

    /* Bullets */
    bulletsContainer: {
      gap: 8,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    bulletDot: {
      fontSize: 14,
      color: '#5A4044',
      marginRight: 6,
      lineHeight: 19.5,
    },
    bulletText: {
      flex: 1,
      fontSize: 12,
      color: '#5A4044',
      lineHeight: 19.5,
      letterSpacing: 0,
      fontFamily: fontFamily.regular,
    },
    emailHighlight: {
      color: '#B12B5B',
      fontFamily: fontFamily.bold,
    },

    /* Inner Alert Box */
    innerAlertBox: {
      backgroundColor: "#FDF2F8CC",
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    innerAlertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    innerAlertTitle: {
      fontSize: 12,
      fontFamily: fontFamily.bold,
      color: '#B12B5B',
    },
    innerAlertText: {
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
    },
    contactText: {
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
      marginTop: 4,
      fontFamily: fontFamily.regular,
    },
  });
};