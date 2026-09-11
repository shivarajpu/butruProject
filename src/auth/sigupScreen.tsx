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
  eyeIcon,
  emailIcon,
  secureIcon,
  supporIcon,
  rewardIcon,
  passwordIcon,
  loginPagaImage,
} from '../assets/svg';
import { Callicon, userProfileIcon } from '../assets/svg/authIcons';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

type RegisterResponse = {
  success: boolean;
  message?: string;
  data?: any;
};

type FieldErrors = {
  name?: string;
  email?: string;
  mobile?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

const REGISTER_ENDPOINT = '/api/auth/register';

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidPhone = (value: string) =>
  /^[0-9]{10}$/.test(value.trim());

const SignUpScreen = ({ navigation }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { width, height } = useWindowDimensions();

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Validation & API States
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Red Cross Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Responsive layout
  const isTablet = width >= 768;
  const isSmallDevice = height < 700;

  const svgWidth = Math.min(width * 0.52, 220);
  const svgHeight = svgWidth * (221 / 187);

  const logoWidth = Math.min(width * 0.32, 133);
  const logoHeight = logoWidth * (55 / 133);

  const dynamicTopPadding =
    height * 0.05 + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

  const validateForm = () => {
    const errors: FieldErrors = {};

    if (!name.trim()) {
      errors.name = 'Your name is required.';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!isValidEmail(email.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    if (!mobile.trim()) {
      errors.mobile = 'Mobile number is required.';
    } else if (!isValidPhone(mobile.trim())) {
      errors.mobile = 'Enter a valid 10-digit mobile number.';
    }

    if (!password.trim()) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!agreedToTerms) {
      errors.terms = 'Please agree to the Terms and Conditions.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const showErrorModal = (message: string) => {
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCreateAccount = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // API Payload
    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: mobile.trim(),
      password: password,
    };

    try {
      const response = await apiService.post<RegisterResponse>(REGISTER_ENDPOINT, payload);

      if (!response.success) {
        showErrorModal(response.message || 'Registration failed. Please try again.');
        return;
      }

      // 🟢 Directly Navigate to OTP Verification Screen on Success
      navigation.navigate('OtpVarify', { email: `${email.trim()}` });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid credentials. Please try again.';
      showErrorModal(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Top Illustration */}
      <View pointerEvents="none" style={styles.topImagePosition}>
        <SvgXml xml={loginPagaImage} width={svgWidth} height={svgHeight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.tabletContent,
            { paddingTop: dynamicTopPadding },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View
            style={[
              styles.headerContainer,
              isSmallDevice ? styles.headerSmall : styles.headerNormal,
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
                <Text style={styles.titleText}>Sign Up</Text>
                <Text style={styles.subtitleText}>
                  Join us for adorable kids' fashion &amp; more.
                </Text>
              </View>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Your Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>YOUR NAME</Text>
              <View
                style={[
                  styles.inputWrapper,
                  fieldErrors.name && styles.inputWrapperError,
                ]}
              >
                <View style={styles.inputIcon}>
                  <SvgXml xml={userProfileIcon} width={18} height={18} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="John Deo"
                  placeholderTextColor={theme.colors.textMuted}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              {fieldErrors.name && <Text style={styles.errorText}>{fieldErrors.name}</Text>}
            </View>

            {/* Email Address */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View
                style={[
                  styles.inputWrapper,
                  fieldErrors.email && styles.inputWrapperError,
                ]}
              >
                <View style={styles.inputIcon}>
                  <SvgXml xml={emailIcon} width={18} height={18} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="youremail@gmail.com"
                  placeholderTextColor={theme.colors.textMuted}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}
            </View>

            {/* Mobile Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
              <View
                style={[
                  styles.inputWrapper,
                  fieldErrors.mobile && styles.inputWrapperError,
                ]}
              >
                <View style={styles.inputIcon}>
                  <SvgXml xml={Callicon} width={23} height={25} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="9876543210"
                  placeholderTextColor={theme.colors.textMuted}
                  value={mobile}
                  onChangeText={(val) => {
                    setMobile(val);
                    if (fieldErrors.mobile) setFieldErrors((prev) => ({ ...prev, mobile: undefined }));
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              {fieldErrors.mobile && <Text style={styles.errorText}>{fieldErrors.mobile}</Text>}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View
                style={[
                  styles.inputWrapper,
                  fieldErrors.password && styles.inputWrapperError,
                ]}
              >
                <View style={styles.inputIcon}>
                  <SvgXml xml={passwordIcon} width={18} height={18} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textMuted}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <SvgXml xml={eyeIcon} width={18} height={18} />
                </TouchableOpacity>
              </View>
              {fieldErrors.password && <Text style={styles.errorText}>{fieldErrors.password}</Text>}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <View
                style={[
                  styles.inputWrapper,
                  fieldErrors.confirmPassword && styles.inputWrapperError,
                ]}
              >
                <View style={styles.inputIcon}>
                  <SvgXml xml={passwordIcon} width={18} height={18} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textMuted}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (fieldErrors.confirmPassword)
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <SvgXml xml={eyeIcon} width={18} height={18} />
                </TouchableOpacity>
              </View>
              {fieldErrors.confirmPassword && (
                <Text style={styles.errorText}>{fieldErrors.confirmPassword}</Text>
              )}
            </View>

            {/* Terms and Conditions */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => {
                setAgreedToTerms(!agreedToTerms);
                if (fieldErrors.terms) setFieldErrors((prev) => ({ ...prev, terms: undefined }));
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms and Conditions</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            {fieldErrors.terms && (
              <Text style={[styles.errorText, { marginTop: -14, marginBottom: 14 }]}>
                {fieldErrors.terms}
              </Text>
            )}

            {/* Create Account Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleCreateAccount}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.colors.textOnPrimary} />
              ) : (
                <Text style={styles.submitButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Sign In Link */}
            <View style={styles.signInRow}>
              <Text style={styles.signInText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignIn} activeOpacity={0.7}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Features */}
          <View
            style={[
              styles.footerContainer,
              isSmallDevice ? styles.footerSmall : styles.footerNormal,
            ]}
          >
            <View style={styles.featureItem}>
              <View style={styles.featureIconBg}>
                <SvgXml xml={secureIcon} width={22} height={22} />
              </View>
              <Text style={styles.featureText}>SECURE</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBg}>
                <SvgXml xml={rewardIcon} width={22} height={22} />
              </View>
              <Text style={styles.featureText}>REWARDS</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBg}>
                <SvgXml xml={supporIcon} width={22} height={22} />
              </View>
              <Text style={styles.featureText}>SUPPORT</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Red Cross Icon Error Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalBadgeError}>
              <Text style={styles.modalBadgeTextError}>✕</Text>
            </View>

            <Text style={styles.modalTitle}>Registration Failed</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>

            <TouchableOpacity
              style={styles.modalButtonError}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Try Again</Text>
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
  tabletContent: {
    maxWidth: 440,
    alignSelf: 'center',
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
    paddingRight: '35%',
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
  },
  subtitleText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
    marginTop: 20,
  },
  fieldGroup: {
    marginBottom: 14,
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
  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.textOnPrimary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 12.5,
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '700',
  },
  // Submit
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
  // Sign In link
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  signInText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  signInLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: 'bold',
  },
  // Footer
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

  /* Custom Red Error Modal Styles */
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
    alignItems: 'center',
    elevation: 5,
    shadowColor: colors.text,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  modalBadgeError: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 2,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalBadgeTextError: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.error,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButtonError: {
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

export default SignUpScreen;
