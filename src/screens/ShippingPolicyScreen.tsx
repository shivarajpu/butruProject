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
import { FONTS } from '../constants/fonts';

// Gradient IDs
const GRADIENT_INTRO_ID = 'gradIntro';
const GRADIENT_CONTACT_ID = 'gradContact';

// SVG Icons
const BACK_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="CURRENT_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const LEGAL_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="15" height="13" rx="1" stroke="#FFF" stroke-width="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" stroke="#FFF" stroke-width="2"/><circle cx="5.5" cy="18.5" r="2.5" stroke="#FFF" stroke-width="2"/><circle cx="18.5" cy="18.5" r="2.5" stroke="#FFF" stroke-width="2"/></svg>`;
const CLOCK_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#B12B5B" stroke-width="2"/><path d="M12 6v6l4 2" stroke="#B12B5B" stroke-width="2" stroke-linecap="round"/></svg>`;
const MONEY_ICON = `<svg width="17" height="12" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.75 6.75C9.125 6.75 8.59375 6.53125 8.15625 6.09375C7.71875 5.65625 7.5 5.125 7.5 4.5C7.5 3.875 7.71875 3.34375 8.15625 2.90625C8.59375 2.46875 9.125 2.25 9.75 2.25C10.375 2.25 10.9062 2.46875 11.3438 2.90625C11.7812 3.34375 12 3.875 12 4.5C12 5.125 11.7812 5.65625 11.3438 6.09375C10.9062 6.53125 10.375 6.75 9.75 6.75ZM4.5 9C4.0875 9 3.73438 8.85312 3.44062 8.55937C3.14687 8.26562 3 7.9125 3 7.5V1.5C3 1.0875 3.14687 0.734375 3.44062 0.440625C3.73438 0.146875 4.0875 0 4.5 0H15C15.4125 0 15.7656 0.146875 16.0594 0.440625C16.3531 0.734375 16.5 1.0875 16.5 1.5V7.5C16.5 7.9125 16.3531 8.26562 16.0594 8.55937C15.7656 8.85312 15.4125 9 15 9H4.5ZM6 7.5H13.5C13.5 7.0875 13.6469 6.73438 13.9406 6.44063C14.2344 6.14688 14.5875 6 15 6V3C14.5875 3 14.2344 2.85313 13.9406 2.55938C13.6469 2.26562 13.5 1.9125 13.5 1.5H6C6 1.9125 5.85312 2.26562 5.55937 2.55938C5.26562 2.85313 4.9125 3 4.5 3V6C4.9125 6 5.26562 6.14688 5.55937 6.44063C5.85312 6.73438 6 7.0875 6 7.5ZM14.25 12H1.5C1.0875 12 0.734375 11.8531 0.440625 11.5594C0.146875 11.2656 0 10.9125 0 10.5V2.25H1.5V10.5H14.25V12ZM4.5 7.5V1.5V7.5Z" fill="#B12B5B"/>
</svg>
`;
const CALENDAR_ICON = `<svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.9625 12.2625L3.3 9.6L4.3875 8.5125L5.9625 10.0875L9.1125 6.9375L10.2 8.025L5.9625 12.2625ZM1.5 15C1.0875 15 0.734375 14.8531 0.440625 14.5594C0.146875 14.2656 0 13.9125 0 13.5V3C0 2.5875 0.146875 2.23438 0.440625 1.94062C0.734375 1.64687 1.0875 1.5 1.5 1.5H2.25V0H3.75V1.5H9.75V0H11.25V1.5H12C12.4125 1.5 12.7656 1.64687 13.0594 1.94062C13.3531 2.23438 13.5 2.5875 13.5 3V13.5C13.5 13.9125 13.3531 14.2656 13.0594 14.5594C12.7656 14.8531 12.4125 15 12 15H1.5ZM1.5 13.5H12V6H1.5V13.5ZM1.5 4.5H12V3H1.5V4.5ZM1.5 4.5V3V4.5Z" fill="#B12B5B"/>
</svg>
`;
const TRUCK_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="15" height="13" rx="1" stroke="#B12B5B" stroke-width="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" stroke="#B12B5B" stroke-width="2"/><circle cx="5.5" cy="18.5" r="2.5" stroke="#B12B5B" stroke-width="2"/><circle cx="18.5" cy="18.5" r="2.5" stroke="#B12B5B" stroke-width="2"/></svg>`;
const TARGET_ICON = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.2125 14.925V13.425C8.7375 13.35 9.24688 13.2062 9.74063 12.9937C10.2344 12.7812 10.7 12.5125 11.1375 12.1875L12.225 13.275C11.6375 13.7375 11.0063 14.1094 10.3313 14.3906C9.65625 14.6719 8.95 14.85 8.2125 14.925ZM13.275 12.1875L12.225 11.1375C12.55 10.725 12.8125 10.2719 13.0125 9.77812C13.2125 9.28438 13.35 8.7625 13.425 8.2125H14.9625C14.8625 8.9875 14.6719 9.70938 14.3906 10.3781C14.1094 11.0469 13.7375 11.65 13.275 12.1875ZM13.425 6.7125C13.35 6.15 13.2125 5.62188 13.0125 5.12813C12.8125 4.63438 12.55 4.1875 12.225 3.7875L13.275 2.7375C13.75 3.2875 14.1344 3.9 14.4281 4.575C14.7219 5.25 14.9 5.9625 14.9625 6.7125H13.425ZM6.7125 14.925C4.8 14.7 3.20312 13.8813 1.92188 12.4688C0.640625 11.0562 0 9.3875 0 7.4625C0 5.525 0.640625 3.85 1.92188 2.4375C3.20312 1.025 4.8 0.2125 6.7125 0V1.5C5.2125 1.7125 3.96875 2.38125 2.98125 3.50625C1.99375 4.63125 1.5 5.95 1.5 7.4625C1.5 8.975 1.99375 10.2906 2.98125 11.4094C3.96875 12.5281 5.2125 13.2 6.7125 13.425V14.925ZM11.175 2.7375C10.725 2.4 10.25 2.125 9.75 1.9125C9.25 1.7 8.7375 1.5625 8.2125 1.5V0C8.95 0.0625 9.65625 0.234375 10.3313 0.515625C11.0063 0.796875 11.6375 1.175 12.225 1.65L11.175 2.7375ZM7.48125 11.2125C6.75625 10.6 6.075 9.94375 5.4375 9.24375C4.8 8.54375 4.48125 7.725 4.48125 6.7875C4.48125 5.9375 4.77187 5.2125 5.35313 4.6125C5.93438 4.0125 6.64375 3.7125 7.48125 3.7125C8.31875 3.7125 9.02812 4.0125 9.60938 4.6125C10.1906 5.2125 10.4812 5.9375 10.4812 6.7875C10.4812 7.725 10.1625 8.54375 9.525 9.24375C8.8875 9.94375 8.20625 10.6 7.48125 11.2125ZM7.48125 7.4625C7.70625 7.4625 7.89688 7.38438 8.05313 7.22813C8.20938 7.07188 8.2875 6.88125 8.2875 6.65625C8.2875 6.44375 8.20938 6.25625 8.05313 6.09375C7.89688 5.93125 7.70625 5.85 7.48125 5.85C7.25625 5.85 7.06563 5.93125 6.90938 6.09375C6.75313 6.25625 6.675 6.44375 6.675 6.65625C6.675 6.88125 6.75313 7.07188 6.90938 7.22813C7.06563 7.38438 7.25625 7.4625 7.48125 7.4625Z" fill="#B12B5B"/>
</svg>
`;
const SLASH_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.99375 6C9.99375 5.5875 9.84688 5.23438 9.55313 4.94063C9.25938 4.64688 8.90625 4.5 8.49375 4.5C8.36875 4.5 8.25 4.5125 8.1375 4.5375C8.025 4.5625 7.91875 4.60625 7.81875 4.66875L9.825 6.675C9.8875 6.575 9.93125 6.46875 9.95625 6.35625C9.98125 6.24375 9.99375 6.125 9.99375 6ZM13.1438 9.99375L12.0562 8.90625C12.3687 8.38125 12.6031 7.89062 12.7594 7.43437C12.9156 6.97812 12.9937 6.55 12.9937 6.15C12.9937 4.7875 12.5594 3.67188 11.6906 2.80312C10.8219 1.93437 9.75625 1.5 8.49375 1.5C7.94375 1.5 7.42812 1.58437 6.94688 1.75312C6.46563 1.92188 6.03125 2.16875 5.64375 2.49375L4.575 1.425C5.1125 0.9625 5.71875 0.609375 6.39375 0.365625C7.06875 0.121875 7.76875 0 8.49375 0C10.0812 0 11.4781 0.55625 12.6844 1.66875C13.8906 2.78125 14.4937 4.275 14.4937 6.15C14.4937 6.75 14.3813 7.36562 14.1562 7.99687C13.9312 8.62813 13.5938 9.29375 13.1438 9.99375ZM10.2 11.325L4.06875 5.19375C4.04375 5.34375 4.025 5.5 4.0125 5.6625C4 5.825 3.99375 5.9875 3.99375 6.15C3.99375 7.0375 4.3625 8.05312 5.1 9.19687C5.8375 10.3406 6.96875 11.6125 8.49375 13.0125C8.81875 12.725 9.12187 12.4406 9.40312 12.1594C9.68437 11.8781 9.95 11.6 10.2 11.325ZM14.85 15.975L11.25 12.375C10.85 12.8 10.425 13.2312 9.975 13.6687C9.525 14.1062 9.03125 14.55 8.49375 15C6.48125 13.2875 4.97813 11.6969 3.98438 10.2281C2.99062 8.75937 2.49375 7.4 2.49375 6.15C2.49375 5.75 2.525 5.36875 2.5875 5.00625C2.65 4.64375 2.7375 4.3 2.85 3.975L0 1.125L1.06875 0.05625L15.9187 14.9062L14.85 15.975Z" fill="#B12B5B"/>
</svg>
`;
const ALERT_ICON = `<svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 14.25L8.25 0L16.5 14.25H0ZM2.5875 12.75H13.9125L8.25 3L2.5875 12.75ZM8.25 12C8.4625 12 8.64062 11.9281 8.78438 11.7844C8.92813 11.6406 9 11.4625 9 11.25C9 11.0375 8.92813 10.8594 8.78438 10.7156C8.64062 10.5719 8.4625 10.5 8.25 10.5C8.0375 10.5 7.85938 10.5719 7.71562 10.7156C7.57187 10.8594 7.5 11.0375 7.5 11.25C7.5 11.4625 7.57187 11.6406 7.71562 11.7844C7.85938 11.9281 8.0375 12 8.25 12ZM7.5 9.75H9V6H7.5V9.75Z" fill="#B12B5B"/>
</svg>
`;
const MAIL_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#B12B5B" stroke-width="2"/><path d="M22 6l-10 7L2 6" stroke="#B12B5B" stroke-width="2"/></svg>`;
const MAIL_WHITE_ICON = `<svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.6667 11.3333L9.73333 10.4L10.7833 9.33333H8V8H10.7833L9.73333 6.93333L10.6667 6L13.3333 8.66667L10.6667 11.3333ZM1.33333 9.33333C0.966667 9.33333 0.652778 9.20278 0.391667 8.94167C0.130556 8.68056 0 8.36667 0 8V1.33333C0 0.966667 0.130556 0.652778 0.391667 0.391667C0.652778 0.130556 0.966667 0 1.33333 0H10C10.3667 0 10.6806 0.130556 10.9417 0.391667C11.2028 0.652778 11.3333 0.966667 11.3333 1.33333V4.73333C11.2222 4.71111 11.1111 4.69444 11 4.68333C10.8889 4.67222 10.7778 4.66667 10.6667 4.66667C10.5556 4.66667 10.4444 4.66944 10.3333 4.675C10.2222 4.68056 10.1111 4.69444 10 4.71667V2.26667L5.6 5.33333L1.33333 2.28333V8H6.71667C6.69444 8.11111 6.68056 8.22222 6.675 8.33333C6.66944 8.44444 6.66667 8.55556 6.66667 8.66667C6.66667 8.77778 6.67222 8.88889 6.68333 9C6.69444 9.11111 6.71111 9.22222 6.73333 9.33333H1.33333ZM2.3 1.33333L5.6 3.7L9 1.33333H2.3ZM1.33333 8C1.33333 7.08889 1.33333 6.31389 1.33333 5.675C1.33333 5.03611 1.33333 4.71667 1.33333 4.71667V2.26667C1.33333 2.11111 1.33333 1.95556 1.33333 1.8C1.33333 1.64444 1.33333 1.48889 1.33333 1.33333C1.33333 1.48889 1.33333 1.64722 1.33333 1.80833C1.33333 1.96944 1.33333 2.12778 1.33333 2.28333V8Z" fill="white"/>
</svg>
`;

// Carrier Pills Icons
const CARRIER_ICON_1 = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 6V4H1V9H9V4H4V3H9C9.275 3 9.51042 3.09792 9.70625 3.29375C9.90208 3.48958 10 3.725 10 4V9C10 9.275 9.90208 9.51042 9.70625 9.70625C9.51042 9.90208 9.275 10 9 10H1C0.725 10 0.489583 9.90208 0.29375 9.70625C0.0979166 9.51042 0 9.275 0 9V4C0 3.725 0.0979166 3.48958 0.29375 3.29375C0.489583 3.09792 0.725 3 1 3H2V0H6V2H3V6H2ZM1 4V6V4V9V4Z" fill="#B12B5B"/>
</svg>
`;
const CARRIER_ICON_2 = `<svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.5 8C2.08333 8 1.72917 7.85417 1.4375 7.5625C1.14583 7.27083 1 6.91667 1 6.5H0V1C0 0.725 0.0979166 0.489583 0.29375 0.29375C0.489583 0.0979166 0.725 0 1 0H8V2H9.5L11 4V6.5H10C10 6.91667 9.85417 7.27083 9.5625 7.5625C9.27083 7.85417 8.91667 8 8.5 8C8.08333 8 7.72917 7.85417 7.4375 7.5625C7.14583 7.27083 7 6.91667 7 6.5H4C4 6.91667 3.85417 7.27083 3.5625 7.5625C3.27083 7.85417 2.91667 8 2.5 8ZM2.5 7C2.64167 7 2.76042 6.95208 2.85625 6.85625C2.95208 6.76042 3 6.64167 3 6.5C3 6.35833 2.95208 6.23958 2.85625 6.14375C2.76042 6.04792 2.64167 6 2.5 6C2.35833 6 2.23958 6.04792 2.14375 6.14375C2.04792 6.23958 2 6.35833 2 6.5C2 6.64167 2.04792 6.76042 2.14375 6.85625C2.23958 6.95208 2.35833 7 2.5 7ZM1 5.5H1.4C1.54167 5.35 1.70417 5.22917 1.8875 5.1375C2.07083 5.04583 2.275 5 2.5 5C2.725 5 2.92917 5.04583 3.1125 5.1375C3.29583 5.22917 3.45833 5.35 3.6 5.5H7V1H1V5.5ZM8.5 7C8.64167 7 8.76042 6.95208 8.85625 6.85625C8.95208 6.76042 9 6.64167 9 6.5C9 6.35833 8.95208 6.23958 8.85625 6.14375C8.76042 6.04792 8.64167 6 8.5 6C8.35833 6 8.23958 6.04792 8.14375 6.14375C8.04792 6.23958 8 6.35833 8 6.5C8 6.64167 8.04792 6.76042 8.14375 6.85625C8.23958 6.95208 8.35833 7 8.5 7ZM8 4.5H10.125L9 3H8V4.5Z" fill="#B12B5B"/>
</svg>
`;
const CARRIER_ICON_3 = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#B12B5B" stroke-width="2"/></svg>`;

type ClauseItem = {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  carriers?: { name: string; icon: string }[];
  highlightText?: string;
};

const CLAUSES_DATA: ClauseItem[] = [
  {
    id: '1',
    code: 'CLAUSE 01',
    title: 'Processing Time',
    description:
      'Orders are typically processed within 2–3 business days. You will receive a confirmation email once your order has been shipped.',
    icon: CLOCK_ICON,
  },
  {
    id: '2',
    code: 'CLAUSE 02',
    title: 'Shipping Rates',
    description:
      'Shipping charges are calculated based on the weight of the items and the delivery location. The final shipping cost will be displayed at checkout before you complete your purchase.',
    icon: MONEY_ICON,
  },
  {
    id: '3',
    code: 'CLAUSE 03',
    title: 'Delivery Time',
    description:
      'Domestic Orders: Typically delivered within 5–7 business days depending on your location.',
    icon: CALENDAR_ICON,
  },
  {
    id: '4',
    code: 'CLAUSE 04',
    title: 'Shipping Methods',
    description:
      'We partner with reliable carriers such as India Post, DTDC, Blue Dart, and other trusted couriers to ensure your order arrives safely and on time.',
    icon: TRUCK_ICON,
    carriers: [
      { name: 'India Post', icon: CARRIER_ICON_1 },
      { name: 'DTDC', icon: CARRIER_ICON_2 },
      { name: 'Blue Dart', icon: CARRIER_ICON_3 },
    ],
  },
  {
    id: '5',
    code: 'CLAUSE 05',
    title: 'Tracking Your Order',
    description:
      'Once your order is shipped, you will receive a tracking number via email to monitor the progress of your shipment.',
    icon: TARGET_ICON,
  },
  {
    id: '6',
    code: 'CLAUSE 06',
    title: 'Shipping Restrictions',
    description:
      'We currently ship to locations within India. If your location is unavailable at checkout, please contact us and we will assist in finding a solution.',
    icon: SLASH_ICON,
  },
  {
    id: '7',
    code: 'CLAUSE 07',
    title: 'Delivery Issues',
    description:
      'If you experience any issues with your delivery, such as delays or a lost package, please reach out to us at hellobutru@gmail.com. We will work with the courier to resolve the issue.',
    icon: ALERT_ICON,
    highlightText: 'hellobutru@gmail.com',
  },
];

export default function ShippingPolicyScreen({ navigation }: any) {
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
        <Text style={styles.headerTitle}>Shipping Policy</Text>
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
              <SvgXml xml={LEGAL_ICON} width={14} height={14} />\
                          <Text style={styles.badgeText}>Delivery Guidelines</Text>

            </View>
                      <Text style={styles.policySubtext}>Shipping Policy</Text>

          </View>
          <Text style={styles.introText}>
            We are committed to delivering your dress promptly and efficiently. Below is our shipping policy:
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

            <Text style={styles.clauseDescription}>
              {item.highlightText ? (
                <>
                  {item.description.split(item.highlightText)[0]}
                  <Text style={styles.emailHighlight}>{item.highlightText}</Text>
                  {item.description.split(item.highlightText)[1]}
                </>
              ) : (
                item.description
              )}
            </Text>

            {/* Carrier Pills for Clause 04 */}
            {item.carriers && (
              <View style={styles.carriersContainer}>
                {item.carriers.map((carrier, idx) => (
                  <View key={idx} style={styles.carrierPill}>
                    <SvgXml xml={carrier.icon} width={12} height={12} style={{ marginRight: 4 }} />
                    <Text style={styles.carrierText}>{carrier.name}</Text>
                  </View>
                ))}
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
            For any questions or concerns regarding shipping, feel free to contact our customer care team at hellobutru@gmail.com.
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
      borderColor: "#FBCFE8",
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
      justifyContent:'space-between'
    
    },
    badgeIconContainer: {
      justifyContent: 'center',
            backgroundColor: colors.primary,
  paddingHorizontal: 15,
      paddingVertical: 6,
      borderRadius: 20,
      flexDirection:'row',
      alignItems: 'center',
      marginRight: 6,
    },
    badgeText: {
      color: colors.textOnPrimary,
      fontSize: 12,
      fontFamily: fontFamily.bold,
      marginLeft:5
    },
    policySubtext: {
      color: colors.primary,
      fontSize: 13,
      fontFamily: FONTS.poppinsMedium,
    },
    introText: {
      fontSize: 13,
      color: '#500724',
      marginTop:10,
      fontFamily: fontFamily.regular,
      lineHeight:20,
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
      borderRadius: 16,
      backgroundColor: '#FFFFFF',
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
    clauseDescription: {
      fontSize: 12,
      color: '#5A4044',
      lineHeight: 19.5,
      fontFamily: fontFamily.regular,
    },
    emailHighlight: {
      color: '#B12B5B',
      fontFamily: fontFamily.bold,
    },

    /* Carriers Pills (Clause 04) */
    carriersContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    carrierPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    carrierText: {
      fontSize: 11,
      color: '#B12B5B',
      fontFamily: fontFamily.bold,
    },

    /* Contact Card */
    contactCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "#FBCFE8",
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