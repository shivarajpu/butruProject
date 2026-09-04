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
  loginPagaImage
} from '../assets/svg';
import {COLORS} from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const { width, height } = useWindowDimensions();
  
  const [loginMethod, setLoginMethod] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = () => {
    console.log('Email:', email);
    console.log('Password:', password);
    navigation.replace('Home');
  };

  // Responsive dynamic values
  const svgWidth = width * 0.55;
  const svgHeight = svgWidth * 1.1; 
  const dynamicTopPadding = height * 0.05 + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      
      {/* Top Absolute SVG - Edge to Edge */}
      <View style={styles.topImagePosition}>
        <SvgXml xml={loginPagaImage} width={svgWidth} height={svgHeight} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: dynamicTopPadding }]} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={[styles.brandTextContainer, { paddingRight: svgWidth * 0.6 }]}>
            {Butruname ? (
              <SvgXml xml={Butruname} width={width * 0.26} height={height * 0.05} style={styles.logoSvg} />
            ) : (
              <Text style={styles.logoText}>BuTRu</Text>
            )}
           <View style={{ top: 43 }}>
             <Text style={styles.titleText}>Welcome Back!</Text>
            <Text style={styles.subtitleText}>Sign in to shop kids' fashion.</Text>
           </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabContainer, { marginTop: height * 0.17, marginBottom: height * 0.03 }]}>
          <TouchableOpacity
            style={[styles.tabButton, loginMethod === 'email' && styles.activeTabButton]}
            onPress={() => setLoginMethod('email')}
          >
            <SvgXml xml={emailIcon} width={18} height={18} />
            <Text style={[styles.tabText, loginMethod === 'email' && styles.activeTabText]}>
              Email Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, loginMethod === 'otp' && styles.activeTabButton]}
            onPress={() => setLoginMethod('otp')}
          >
            <SvgXml xml={phoneIcon} width={18} height={18} />
            <Text style={[styles.tabText, loginMethod === 'otp' && styles.activeTabText]}>
              OTP Login
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Inputs */}
        <View style={styles.formContainer}>
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
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <SvgXml xml={passwordIcon} width={18} height={18} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="********"
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <SvgXml xml={eyeIcon} width={18} height={18} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={[styles.submitButton, { height: Math.max(48, height * 0.06) }]} onPress={handleLogin}>
            <Text style={styles.submitButtonText}>Sign In</Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpRow}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Features */}
        <View style={[styles.footerContainer, { marginTop: height * 0.02 }]}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundColor,
  },
  topImagePosition: {
    position: 'absolute',
    top: 0,
    right: -8,
    zIndex: 0,
  },
  scrollContent: {
    paddingHorizontal: '4%',
    paddingBottom: 24,
    flexGrow: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    top:87
  },
  brandTextContainer: {
    flex: 1,
  },
  logoSvg: {
    marginBottom: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#B8255F',
    marginBottom: 8,
  },
  titleText: {
    fontSize: 22,
    color: '#111',
    fontFamily:'Inter_28pt-LightItalic',
  },
  subtitleText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontFamily:'Arimo-Regular',
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
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
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
    marginBottom: 16,
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
  },
  featureText: {
    fontSize: 10,
    color: '#888',
    fontWeight: 'bold',
  },
});

export default LoginScreen;