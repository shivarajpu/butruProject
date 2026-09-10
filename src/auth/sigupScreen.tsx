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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
import { Callicon } from '../assets/svg/authIcons';
import { userProfileIcon } from '../assets/svg/authIcons';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const SignUpScreen = ({ navigation }: Props) => {
  const { width, height } = useWindowDimensions();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Responsive layout
  const isTablet = width >= 768;
  const isSmallDevice = height < 700;

  const svgWidth = Math.min(width * 0.52, 220);
  const svgHeight = svgWidth * (221 / 187);

  const logoWidth = Math.min(width * 0.32, 133);
  const logoHeight = logoWidth * (55 / 133);

  const dynamicTopPadding =
    height * 0.05 + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

  const handleCreateAccount = () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }
    if (!mobile.trim()) {
      Alert.alert('Mobile Required', 'Please enter your mobile number.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter a password.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms and Conditions.');
      return;
    }
    // Navigate to OTP verification after sign-up
    navigation.navigate('OtpVarify', { phoneNumber: `+91 ${mobile}` });
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" />

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
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <SvgXml xml={userProfileIcon} width={18} height={18} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="John Deo"
                  placeholderTextColor="#A0A0A0"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <SvgXml xml={emailIcon} width={18} height={18} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="youremail@gmail.com"
                  placeholderTextColor="#A0A0A0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <SvgXml xml={Callicon} width={23} height={25} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="+91 9876543210"
                  placeholderTextColor="#A0A0A0"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <SvgXml xml={passwordIcon} width={18} height={18} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#A0A0A0"
                  value={password}
                  onChangeText={setPassword}
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
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <SvgXml xml={passwordIcon} width={18} height={18} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#A0A0A0"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
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
            </View>

            {/* Terms and Conditions */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
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

            {/* Create Account Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateAccount}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>Create Account</Text>
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
    fontSize: 26,
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
    fontSize: 13,
    color: '#666',
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
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
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
    borderColor: '#B8255F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#B8255F',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 12.5,
    color: '#444',
    flex: 1,
    lineHeight: 18,
  },
  termsLink: {
    color: '#B8255F',
    fontWeight: '700',
  },
  // Submit
  submitButton: {
    backgroundColor: '#B8255F',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingVertical: 14,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#B8255F',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  submitButtonText: {
    color: '#FFF',
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
    color: '#666',
  },
  signInLink: {
    fontSize: 13,
    color: '#B8255F',
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
});

export default SignUpScreen;
