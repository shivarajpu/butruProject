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
  phoneIcon,
  rewardIcon,
  passwordIcon,
  loginPagaImage,
} from '../assets/svg';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type LoginResponse = {
  success: boolean;
  message?: string;
  token?: string;
  requiresEmailVerification?: boolean;
  data?: {
    name?: string;
    email?: string;
  };
};

type FieldErrors = {
  email?: string;
  password?: string;
};

const LOGIN_ENDPOINT = '/api/auth/login';

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getEmailError = (value: string) => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return 'Email address is required.';
  }

  if (!isValidEmail(normalizedValue)) {
    return 'Enter a valid email address.';
  }

  return undefined;
};

const getPasswordError = (value: string) =>
  value.trim() ? undefined : 'Password is required.';

const LoginScreen = ({ navigation }: Props) => {
  const { width, height } = useWindowDimensions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Custom Error Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const isTablet = width >= 768;
  const isSmallDevice = height < 700;

  const svgWidth = Math.min(width * 0.52, 220);
  const svgHeight = svgWidth * (221 / 187);

  const logoWidth = Math.min(width * 0.32, 133);
  const logoHeight = logoWidth * (55 / 133);

  const dynamicTopPadding =
    height * 0.05 + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

  const handleEmailChange = (value: string) => {
    setEmail(value);

    if (fieldErrors.email) {
      setFieldErrors(previous => ({ ...previous, email: undefined }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);

    if (fieldErrors.password) {
      setFieldErrors(previous => ({ ...previous, password: undefined }));
    }
  };

  const validateForm = () => {
    const errors: FieldErrors = {
      email: getEmailError(email),
      password: getPasswordError(password),
    };

    setFieldErrors(errors);
    return !errors.email && !errors.password;
  };

  const showErrorModal = (message: string) => {
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiService.post<LoginResponse>(LOGIN_ENDPOINT, {
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (!response.success) {
        showErrorModal(response.message || 'Invalid email or password.');
        return;
      }

      // 🟢 Login Successful: Bina popup dikhaye direct Otp Screen navigate karein
      navigation.navigate('OtpVarify', { email : email.trim().toLowerCase() });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid credentials. Please try again.';
      showErrorModal(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpTabPress = () => {
    navigation.navigate('Otp');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Top Absolute SVG Illustration */}
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
          {/* Header Section */}
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
                <Text style={styles.titleText}>Welcome Back!</Text>
                <Text style={styles.subtitleText}>Sign in to shop kids' fashion.</Text>
              </View>
            </View>
          </View>

          {/* Tab Switcher */}
          <View
            style={[
              styles.tabContainer,
              isSmallDevice ? styles.tabSmall : styles.tabNormal,
            ]}
          >
            <TouchableOpacity
              style={[styles.tabButton, styles.activeTabButton]}
              activeOpacity={0.9}
            >
              <SvgXml xml={emailIcon} width={18} height={18} />
              <Text style={[styles.tabText, styles.activeTabText]}>
                Email Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabButton}
              onPress={handleOtpTabPress}
              activeOpacity={0.7}
            >
              <SvgXml xml={phoneIcon} width={18} height={18} />
              <Text style={styles.tabText}>
                OTP Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Inputs */}
          <View style={styles.formContainer}>
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS *</Text>
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
                  placeholderTextColor="#A0A0A0"
                  value={email}
                  onChangeText={handleEmailChange}
                  onBlur={() =>
                    setFieldErrors(previous => ({
                      ...previous,
                      email: getEmailError(email),
                    }))
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Email address"
                />
              </View>
              {fieldErrors.email && (
                <Text style={styles.errorText}>{fieldErrors.email}</Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>PASSWORD *</Text>
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
                  placeholder="********"
                  placeholderTextColor="#A0A0A0"
                  value={password}
                  onChangeText={handlePasswordChange}
                  onBlur={() =>
                    setFieldErrors(previous => ({
                      ...previous,
                      password: getPasswordError(password),
                    }))
                  }
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <SvgXml xml={eyeIcon} width={18} height={18} />
                </TouchableOpacity>
              </View>
              {fieldErrors.password && (
                <Text style={styles.errorText}>{fieldErrors.password}</Text>
              )}
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={isSubmitting}
              accessibilityRole="button"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpRow}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signUpLink}>Sign Up</Text>
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

      {/* Custom Error Modal (Red Cross Icon) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* 🔴 Red Cross Badge Icon */}
            <View style={styles.modalBadgeError}>
              <Text style={styles.modalBadgeTextError}>✕</Text>
            </View>

            <Text style={styles.modalTitle}>Login Failed</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundColor,
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
    color: '#B8255F',
    marginBottom: 8,
  },
  titleWrapper: {
    marginTop: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    fontFamily: Platform.select({
      ios: 'Inter28pt-Bold',
      android: 'Inter_28pt-Bold',
      default: 'Inter_28pt-Bold',
    }),
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 13.5,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Inter_28pt-LightItalic',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  tabSmall: {
    marginTop: 18,
    marginBottom: 14,
  },
  tabNormal: {
    marginTop: 24,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  activeTabButton: {
    backgroundColor: '#FFF',
    borderBottomWidth: 2,
    borderBottomColor: '#B8255F',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#B8255F',
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#A0A0A0',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputWrapperError: {
    borderWidth: 1,
    borderColor: '#D93025',
    backgroundColor: '#FFF7F7',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  errorText: {
    color: '#D93025',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#B8255F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#B8255F',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberText: {
    fontSize: 13,
    color: '#444',
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#B8255F',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#B8255F',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 14,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#B8255F',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  signUpText: {
    fontSize: 13,
    color: '#666',
  },
  signUpLink: {
    fontSize: 13,
    color: '#B8255F',
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
    marginTop: 20,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  featureText: {
    fontSize: 10,
    color: '#888',
    fontWeight: 'bold',
  },

  /* Custom Red Error Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  modalBadgeError: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FCE8E6',
    borderWidth: 2,
    borderColor: '#D93025',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalBadgeTextError: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D93025',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13.5,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButtonError: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#B8255F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;