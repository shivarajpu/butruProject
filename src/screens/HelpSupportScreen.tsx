import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppTheme } from '../theme/useAppTheme';
import { apiService } from '../api/apiService';
import type { AppTheme, SupportConfig } from '../theme/types';
import type { RootStackParamList } from '../navigation/types';
import { phoneIcon, emailIcon, LOCATION_PIN_SVG, helpSupportnameicon, helpsupportmailicon, helpSupportcallicon } from '../assets/svg';
import { FONTS } from '../constants/fonts';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpSupport'>;

// ─── Icon Builders (Theme-aware) ──────────────────────────────────────────────
const backArrowIcon = (color: string) =>
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const locationIcon = (color: string) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 13.5C13.6569 13.5 15 12.1569 15 10.5C15 8.84315 13.6569 7.5 12 7.5C10.3431 7.5 9 8.84315 9 10.5C9 12.1569 10.3431 13.5 12 13.5Z" stroke="${color}" stroke-width="2"/><path d="M12 22C16 18 20 14.4183 20 10.5C20 6.08172 16.4183 2.5 12 2.5C7.58172 2.5 4 6.08172 4 10.5C4 14.4183 8 18 12 22Z" stroke="${color}" stroke-width="2"/></svg>`;

const userIcon = (color: string) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 21C20 16.5817 16.4183 13 12 13C7.58172 13 4 16.5817 4 21" stroke="${color}" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="4" stroke="${color}" stroke-width="2"/></svg>`;

// ─── StyleSheet Factory (Theme-aware) ─────────────────────────────────────────
const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    flexOne: {
      flex: 1,
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
    tabletScrollContent: {
      maxWidth: 500,
      width: '100%',
      alignSelf: 'center',
    },
    introCard: {
      backgroundColor: colors.primaryLight,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    introTitle: {
      fontSize: 21,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: fontFamily.heading,
      marginBottom: 8,
    },
    introSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      fontWeight: '400',
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.helptextprcolor,
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    assistanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 16,
    },
    assistanceCard: {
      flex: 1,
      backgroundColor: colors.primaryLight,
      borderRadius: 20,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    cardHeader: {
      marginBottom: 12,
    },
    cardHeaderWithBadge: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.hiconbackround,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeBadge: {
      backgroundColor: colors.hrsbacroundc,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 5,
    },
    timeBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.primary,
    },
    cardSmallLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.helptextprcolor,
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    cardValueText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 14,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 13,
      paddingVertical: 10,
      alignItems: 'center',
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderRadius: 13,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primaryLight,
    },
    primaryButtonText: {
      color: colors.textOnPrimary,
      fontSize: 13,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
    },
    secondaryButtonText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
    },
    addressCard: {
      backgroundColor: colors.primaryLight,
      borderRadius: 20,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    addressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    addressHeaderTitleWrapper: {
      marginLeft: 10,
    },
    addressCardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      fontFamily: fontFamily.bold,
    },
    addressBox: {
      backgroundColor: colors.hisemibackound,
      borderRadius: 14,
      padding: 14,
      marginBottom: 14,
    },
    companyTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    redDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: colors.primary,
      marginRight: 6,
    },
    companyNameText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.5,
      fontFamily: fontFamily.bold,
    },
    addressFullText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      fontWeight: '500',
    },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      fontFamily: fontFamily.bold,
      marginBottom: 14,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: 20,
      paddingHorizontal: 14,
      height: 46,
      marginBottom: 12,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      fontFamily:FONTS.arimoRegular
    },
    textAreaWrapper: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 16,
      height: 100,
    },
    textArea: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
            fontFamily:FONTS.arimoRegular

    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 13,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitButtonText: {
      color: colors.textOnPrimary,
      fontSize: 14,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
    },
  });
};

// ─── HelpSupportScreen ────────────────────────────────────────────────────────

export const HelpSupportScreen = ({ navigation, route }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { colors } = theme;

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Dynamic Support Config — route param overrides win, falls back to APP_CONFIG.
  const config: SupportConfig = {
    ...theme.support,
    ...(route.params?.config || {}),
  };

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCall = async () => {
    const url = `tel:${config.phone}`;
    let supported = false;
    try {
      supported = await Linking.canOpenURL(url);
    } catch {
      supported = false;
    }

    if (supported) {
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert('Error', 'Unable to open the phone dialer.');
      }
    } else {
      Alert.alert(
        'Not available in Simulator',
        Platform.OS === 'ios'
          ? 'Phone calls are not available in the iOS Simulator. Please test on your physical iPhone.'
          : 'Your device does not support phone calls.',
      );
    }
  };

  const handleEmail = async () => {
    const url = `mailto:${config.email}`;
    let supported = false;
    try {
      supported = await Linking.canOpenURL(url);
    } catch {
      supported = false;
    }

    if (supported) {
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert('Error', 'Unable to open the email app.');
      }
    } else {
      Alert.alert(
        'Not available in Simulator',
        Platform.OS === 'ios'
          ? 'The Mail app is not available in the iOS Simulator. Please test on your physical iPhone.'
          : 'No email app found on your device.',
      );
    }
  };

  const handleOpenMap = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(config.mapQuery)}`,
      android: `geo:0,0?q=${encodeURIComponent(config.mapQuery)}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        config.mapQuery
      )}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const handleSendMessage = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields before sending.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (config.supportEndpoint) {
        await apiService.post(config.supportEndpoint, {
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        });
      } else {
        // Fallback: simulate API call when no endpoint is configured.
        await new Promise<void>(resolve => setTimeout(resolve, 1200));
      }

      Alert.alert(
        'Success',
        'Your message has been sent successfully! Our support team will get back to you soon.',
      );
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          activeOpacity={0.7}
        >
          <SvgXml xml={backArrowIcon(colors.text)} width={20} height={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.tabletScrollContent,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>Contact Us</Text>
            <Text style={styles.introSubtitle}>
              Dress your kids in comfort and style. From essentials to festive looks, our clothes use soft fabrics and fun designs kids love.
            </Text>
          </View>

          <Text style={styles.sectionLabel}>DIRECT ASSISTANCE</Text>

          <View style={styles.assistanceRow}>
            <View style={styles.assistanceCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <SvgXml xml={helpSupportcallicon} width={16} height={16} />
                </View>
              </View>
              <Text style={styles.cardSmallLabel}>CALL US</Text>
              <Text style={styles.cardValueText}>{config.phone}</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCall}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Call Now</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.assistanceCard}>
              <View style={styles.cardHeaderWithBadge}>
                <View style={styles.iconCircle}>
                  <SvgXml xml={helpsupportmailicon} width={16} height={16} />
                </View>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>{config.responseTime}</Text>
                </View>
              </View>
              <Text style={styles.cardSmallLabel}>EMAIL US</Text>
              <Text style={styles.cardValueText} numberOfLines={1} adjustsFontSizeToFit>
                {config.email}
              </Text>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleEmail}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Send Mail</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={styles.iconCircle}>
                <SvgXml xml={LOCATION_PIN_SVG} width={16} height={16} />
              </View>
              <View style={styles.addressHeaderTitleWrapper}>
                <Text style={styles.cardSmallLabel}>ADDRESS</Text>
                <Text style={styles.addressCardTitle}>Where are we?</Text>
              </View>
            </View>

            <View style={styles.addressBox}>
              <View style={styles.companyTitleRow}>
                <View style={styles.redDot} />
                <Text style={styles.companyNameText}>{config.companyName}</Text>
              </View>
              <Text style={styles.addressFullText}>{config.address}</Text>
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleOpenMap}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Open in Google Maps</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Send us a message</Text>

            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <SvgXml xml={helpSupportnameicon} width={18} height={18} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <SvgXml xml={emailIcon || `<svg></svg>`} width={18} height={18} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Your email"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.textAreaWrapper}>
              <TextInput
                style={styles.textArea}
                placeholder="Your message"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSendMessage}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.textOnPrimary} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Send Message</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default HelpSupportScreen;