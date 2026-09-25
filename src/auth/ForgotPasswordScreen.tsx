import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { apiService } from '../api/apiService';
import type { RootStackParamList } from '../navigation/types';
import {
  Butruname,
  emailIcon,
  secureIcon,
  supporIcon,
  rewardIcon,
  loginPagaImage,
  CLOSE_SVG,
} from '../assets/svg';

import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';

type ForgotResponse = {
  success: boolean;
  message?: string;
};

const FORGOT_PASSWORD_ENDPOINT = '/api/storefront/auth/forgot-password';

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = ({ navigation }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const { width, height } = useWindowDimensions();

  const [inputValue, setInputValue] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const isSmallDevice = height < 700;

  const svgWidth = Math.min(width * 0.52, 220);
  const svgHeight = svgWidth * (221 / 187);

  const logoWidth = Math.min(width * 0.32, 133);
  const logoHeight = logoWidth * (55 / 133);

  const dynamicTopPadding =
    height * 0.05 +
    (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

  const handleEmailChange = (value: string) => {
    setInputValue(value);

    if (fieldError) {
      setFieldError(undefined);
    }
  };

  const handleSendResetLink = async () => {
    const email = inputValue.trim();

    if (!email) {
      setFieldError('Email address is required.');
      return;
    }

    if (!isValidEmail(email)) {
      setFieldError('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response =
        await apiService.post<ForgotResponse>(
          FORGOT_PASSWORD_ENDPOINT,
          { email: email.toLowerCase() },
        );

      setModalMessage(
        response.message ||
          'If an account exists for that email, a reset link has been sent.',
      );
      setModalVisible(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.';

      setModalMessage(message);
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={['left', 'right', 'bottom']}
    >
      <StatusBar
        barStyle={
          theme.mode === 'dark' ? 'light-content' : 'dark-content'
        }
      />

      {/* Top Illustration */}
      <View pointerEvents="none" style={styles.topImagePosition}>
        <SvgXml
          xml={loginPagaImage}
          width={svgWidth}
          height={svgHeight}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: dynamicTopPadding },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Logo */}
          <View
            style={[
              styles.headerContainer,
              isSmallDevice
                ? styles.headerSmall
                : styles.headerNormal,
            ]}
          >
            <View style={styles.brandTextContainer}>
              {Butruname ? (
                <SvgXml
                  xml={Butruname}
                  width={logoWidth}
                  height={logoHeight}
                  style={styles.logoSvg}
                />
              ) : (
                <Text style={styles.logoText}>BuTRu</Text>
              )}

              <View style={styles.titleWrapper}>
                <Text style={styles.titleText}>
                  Forgot Your{'\n'}Password?
                </Text>

                <Text style={styles.subtitleText}>
                  No worries! Enter your email or mobile number and
                  we'll send you a reset link.
                </Text>
              </View>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.fieldGroup}>
             

              <View
                style={[
                  styles.inputWrapper,
                  fieldError && styles.inputWrapperError,
                ]}
              >
                <View style={styles.inputIcon}>
                  <SvgXml
                    xml={emailIcon}
                    width={18}
                    height={18}
                  />
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="youremail@gmail.com"
                  placeholderTextColor={theme.colors.textMuted}
                  value={inputValue}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {fieldError && (
                <Text style={styles.errorText}>{fieldError}</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSendResetLink}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator
                  color={theme.colors.textOnPrimary}
                />
              ) : (
                <Text style={styles.submitButtonText}>
                  Send Reset Link
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>
                Remember your password?{' '}
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginLink}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Features */}
          <View
            style={[
              styles.footerContainer,
              isSmallDevice
                ? styles.footerSmall
                : styles.footerNormal,
            ]}
          >
            <View style={styles.featureItem}>
              <View style={styles.featureIconBg}>
                <SvgXml
                  xml={secureIcon}
                  width={22}
                  height={22}
                />
              </View>

              <Text style={styles.featureText}>SECURE</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBg}>
                <SvgXml
                  xml={rewardIcon}
                  width={22}
                  height={22}
                />
              </View>

              <Text style={styles.featureText}>REWARDS</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBg}>
                <SvgXml
                  xml={supporIcon}
                  width={22}
                  height={22}
                />
              </View>

              <Text style={styles.featureText}>SUPPORT</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Reset your password
              </Text>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <SvgXml xml={CLOSE_SVG} width={14} height={14} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalMessage}>
              {modalMessage}
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },

    keyboardAvoidingView: {
      flex: 1,
    },

    topImagePosition: {
      position: 'absolute',
      top: 0,
      right: 0,
      zIndex: 0,
    },

    scrollContent: {
      paddingHorizontal: '5%',
      paddingBottom: 24,
      flexGrow: 1,
      width: '100%',
    },

    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },

    headerSmall: {
      marginTop: 48,
    },

    headerNormal: {
      marginTop: 75,
    },

    brandTextContainer: {
      flex: 1,
      paddingRight: '12%',
    },

    logoSvg: {
      marginBottom: 16,
      marginTop: 15,
    },

    logoText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 8,
    },

    titleWrapper: {
      marginTop: 20,
    },

    titleText: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: fontFamily.heading,
      letterSpacing: -0.3,
      lineHeight: 32,
    },

subtitleText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 18,
    },

    formContainer: {
      width: '100%',
      marginTop: 22,
    },

    fieldGroup: {
      marginBottom: 18,
    },

    inputLabel: {
      fontSize: 11,
      fontWeight: 'bold',
      color: colors.textMuted,
      letterSpacing: 0.5,
      marginBottom: 6,
    },

    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 48,
    },

    inputWrapperError: {
      borderWidth: 1,
      borderColor: colors.error,
      backgroundColor: colors.surfaceVariant,
    },

    inputIcon: {
      marginRight: 10,
    },

    input: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },

    errorText: {
      color: colors.error,
      fontSize: 11,
      marginTop: 4,
      marginLeft: 4,
    },

    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
      paddingVertical: 14,
      marginBottom: 16,
      elevation: 1,
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },

    submitButtonDisabled: {
      opacity: 0.65,
    },

    submitButtonText: {
      color: colors.textOnPrimary,
      fontSize: 16,
      fontWeight: 'bold',
      letterSpacing: 0.3,
    },

    loginRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },

    loginText: {
      fontSize: 13,
      color: colors.textSecondary,
    },

    loginLink: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: 'bold',
    },

    footerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 10,
    },

    footerSmall: {
      marginTop: 10,
    },

    footerNormal: {
      marginTop: 16,
    },

    featureItem: {
      alignItems: 'center',
    },

    featureIconBg: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
      elevation: 2,
      shadowColor: colors.text,
      shadowOpacity: 0.05,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 },
    },

    featureText: {
      fontSize: 10,
      color: colors.textMuted,
      fontWeight: 'bold',
    },

    /* Success Modal */
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },

    modalCard: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      elevation: 5,
      shadowColor: colors.text,
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },

    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },

    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
      paddingRight: 8,
    },

    closeBtn: {
      padding: 4,
      backgroundColor: colors.surface,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: colors.text,
      shadowOpacity: 0.1,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
    },

    modalMessage: {
      fontSize: 13.5,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },

    modalButton: {
      width: '100%',
      paddingVertical: 12,
      borderRadius: 25,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    modalButtonText: {
      color: colors.textOnPrimary,
      fontSize: 14,
      fontWeight: 'bold',
    },
  });
};

export default ForgotPasswordScreen;