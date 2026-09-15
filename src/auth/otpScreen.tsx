import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  Butruname,
  emailIconGray,
  phoneIconPink,
  secureIcon,
  supporIcon,
  rewardIcon,
  loginPagaImage,
} from '../assets/svg';
import { Callicon } from '../assets/svg/authIcons';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import AppInput from '../components/AppInput';
import { useDispatch } from 'react-redux';
import { login } from '../store/slices/authSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

const OtpScreen = ({ navigation }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const dispatch = useDispatch();
  const { width, height } = useWindowDimensions();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Screen size categories for responsive layout
  const isTablet = width >= 768;
  const isSmallDevice = height < 700;

  // Responsive illustration size maintaining original 187x221 aspect ratio
  const svgWidth = Math.min(width * 0.52, 220);
  const svgHeight = svgWidth * (221 / 187);

  // Responsive logo size maintaining original 133x55 aspect ratio
  const logoWidth = Math.min(width * 0.32, 133);
  const logoHeight = logoWidth * (55 / 133);

  const dynamicTopPadding =
    height * 0.05 + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

  const handleSendOtp = () => {
    const trimmed = phoneNumber.trim();
    if (!trimmed) {
      Alert.alert('Mobile Number Required', 'Please enter your mobile number.');
      return;
    }
    navigation.navigate('OtpVarify', { phoneNumber: trimmed });
  };

  const handleVerifyOtp = () => {
    if (!otpCode.trim()) {
      Alert.alert('OTP Required', 'Please enter the verification code.');
      return;
    }
    dispatch(login({ phone: phoneNumber.trim() }));
    navigation.replace('Home');
  };

  const handleEmailTabPress = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Top Absolute SVG Illustration - Edge to Edge */}
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
              style={styles.tabButton}
              onPress={handleEmailTabPress}
              activeOpacity={0.7}
            >
              <SvgXml xml={emailIconGray} width={18} height={18} />
              <Text style={styles.tabText}>Email Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, styles.activeTabButton]}
              activeOpacity={0.9}
            >
              <SvgXml xml={phoneIconPink} width={18} height={18} />
              <Text style={[styles.tabText, styles.activeTabText]}>OTP Login</Text>
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <View style={styles.formContainer}>
            {!isOtpSent ? (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                  <AppInput
                    containerStyle={styles.inputContainer}
                    inputContainerStyle={styles.inputWrapper}
                    leftIcon={<SvgXml xml={Callicon} width={23} height={25} />}
                    placeholder="+91 9876543210"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    maxLength={15}
                  />
                </View>

                {/* Send OTP Button */}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSendOtp}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitButtonText}>Send OTP</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.fieldGroup}>
                  <View style={styles.otpHeaderRow}>
                    <Text style={styles.inputLabel}>ENTER 4-DIGIT OTP</Text>
                    <TouchableOpacity onPress={() => setIsOtpSent(false)}>
                      <Text style={styles.changeNumberText}>Edit Number</Text>
                    </TouchableOpacity>
                  </View>
                  <AppInput
                    containerStyle={styles.inputContainer}
                    inputContainerStyle={styles.inputWrapper}
                    leftIcon={<SvgXml xml={phoneIconPink} width={18} height={18} />}
                    placeholder="Enter verification code"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleVerifyOtp}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitButtonText}>Verify & Sign In</Text>
                </TouchableOpacity>
              </>
            )}

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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: fontFamily.heading,
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 13.5,
    color: colors.textSecondary,
    marginTop: 4,
    fontFamily: 'Inter_28pt-LightItalic',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 4,
    elevation: 2,
    shadowColor: colors.text,
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
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  inputContainer: {
    marginBottom: 0,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  changeNumberText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
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
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 14,
    marginBottom: 16,
    elevation: 1,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  submitButtonText: {
    color: colors.textOnPrimary,
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
    color: colors.textSecondary,
  },
  signUpLink: {
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
    marginTop: 20,
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
  });
};

export default OtpScreen;
