import React, { useState, useRef, useEffect } from 'react';
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
  secureIcon,
  supporIcon,
  rewardIcon,
  loginPagaImage,
} from '../assets/svg';
import { editPencilIcon, lockGreenIcon } from '../assets/svg/authIcons';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVarify'>;

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

const OtpVarify = ({ navigation, route }: Props) => {
  const { width, height } = useWindowDimensions();

  // ─── Responsive scale helpers ───────────────────────────────────────────────
  // Base design is 390pt wide (iPhone 14)
  const BASE_WIDTH = 390;
  const scale = (size: number) => (width / BASE_WIDTH) * size;
  const vs = (size: number) => (height / 844) * size;   // vertical scale

  const isTablet = width >= 768;
  const isSmall  = height < 700;

  // Illustration: maintain 187×221 aspect ratio, fills ~52% of screen width
  const svgW = Math.min(width * 0.52, isTablet ? 320 : 220);
  const svgH = svgW * (221 / 187);

  // Logo: 133×55 aspect ratio
  const logoW = Math.min(width * 0.34, isTablet ? 180 : 133);
  const logoH = logoW * (55 / 133);

  // OTP box: 6 boxes with equal spacing — each box = (contentWidth - 5 gaps) / 6
  const HORIZONTAL_PAD = scale(20);
  const contentWidth   = width - HORIZONTAL_PAD * 2;
  const BOX_GAP        = scale(8);
  const BOX_SIZE       = Math.floor((contentWidth - BOX_GAP * 5) / 6);
  const BOX_RADIUS     = scale(12);
  const BOX_FONT       = scale(22);

  // Dynamic top padding for status bar on Android
  const topPad =
    vs(isSmall ? 20 : 28) +
    (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

  // ─── State ───────────────────────────────────────────────────────────────────
  const phoneNumber = route?.params?.phoneNumber ?? '+91 9876543210';
  const [otp, setOtp]           = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer]       = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  // Countdown
  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const id = setInterval(() => setTimer(p => p - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleResend = () => {
    if (!canResend) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    setTimer(RESEND_SECONDS);
    setCanResend(false);
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const handleOtpChange = (value: string, idx: number) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next  = [...otp];
    next[idx]   = digit;
    setOtp(next);
    if (digit && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, idx: number) => {
    if (key === 'Backspace' && !otp[idx] && idx > 0) {
      const next = [...otp];
      next[idx - 1] = '';
      setOtp(next);
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert('Incomplete OTP', 'Please enter the complete 6-digit code.');
      return;
    }
    navigation.replace('Home');
  };

  // Timer label: "00:45"
  const mm = String(Math.floor(timer / 60)).padStart(2, '0');
  const ss = String(timer % 60).padStart(2, '0');
  const timerLabel = `${mm}:${ss}`;

  // ─── Box style per index ────────────────────────────────────────────────────
  const boxStyle = (idx: number) => {
    const active = otp[idx] !== '';
    return [
      {
        width:           BOX_SIZE,
        height:          BOX_SIZE,
        borderRadius:    BOX_RADIUS,
        fontSize:        BOX_FONT,
        fontWeight:      '700' as const,
        color:           '#B8255F',
        textAlign:       'center' as const,
        backgroundColor: active ? '#FFFFFF' : '#FAE4EE',
        borderWidth:     active ? 1.8 : 0,
        borderColor:     active ? '#B8255F' : 'transparent',
        // remove any default outline / underline on Android
        includeFontPadding: false,
      },
    ];
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundColor} />

      {/* ── Top illustration (absolute, behind content) ── */}
      <View pointerEvents="none" style={styles.topIllustration}>
        <SvgXml xml={loginPagaImage} width={svgW} height={svgH} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            isTablet && styles.scrollTablet,
            { paddingTop: topPad, paddingHorizontal: HORIZONTAL_PAD },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── HEADER ── */}
          <View style={[styles.header, { marginTop: isSmall ? vs(40) : vs(60) }]}>

            {/* Logo */}
            {Butruname ? (
              <SvgXml
                xml={Butruname}
                width={logoW}
                height={logoH}
                style={{ marginBottom: scale(14) , marginTop: scale(32)}}
              />
            ) : (
              <Text style={[styles.logoFallback, { fontSize: scale(28) }]}>BuTRu</Text>
            )}

            {/* Title + subtitle + phone row */}
            <View style={{ marginTop: vs(28), paddingRight: '35%' }}>
              <Text style={[styles.title, { fontSize: scale(24) }]}>Verify OTP</Text>

              <Text style={[styles.subtitle, { fontSize: scale(13.5), marginTop: vs(5) }]}>
                Enter the 6-digit code send to
              </Text>

              <View style={styles.phoneRow}>
                <Text style={[styles.phoneNumber, { fontSize: scale(14.5) }]}>
                  {phoneNumber}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <SvgXml xml={editPencilIcon} width={scale(15)} height={scale(15)} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── OTP BOXES ── */}
          <View style={[styles.otpRow, { marginTop: vs(isSmall ? 22 : 30), gap: BOX_GAP }]}>
            {Array.from({ length: OTP_LENGTH }, (_, i) => (
              <TextInput
                key={i}
                ref={r => { inputRefs.current[i] = r; }}
                style={boxStyle(i)}
                value={otp[i]}
                onChangeText={v => handleOtpChange(v, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                autoFocus={i === 0}
                selectTextOnFocus
                caretHidden={false}
                underlineColorAndroid="transparent"
              />
            ))}
          </View>

          {/* ── RESEND ROW ── */}
          <View style={[styles.resendRow, { marginTop: vs(12), marginBottom: vs(22) }]}>
            <TouchableOpacity
              onPress={handleResend}
              disabled={!canResend}
              activeOpacity={0.7}
            >
              <Text style={[styles.resendLeft, { fontSize: scale(12) }, !canResend && styles.resendLeftDisabled]}>
                Didn't Receive The Code?
              </Text>
            </TouchableOpacity>

            {canResend ? (
              <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                <Text style={[styles.resendBtn, { fontSize: scale(12.5) }]}>Resend</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.timerLabel, { fontSize: scale(12) }]}>
                Resend In{' '}
                <Text style={[styles.timerValue, { fontSize: scale(12.5) }]}>
                  {timerLabel}
                </Text>
              </Text>
            )}
          </View>

          {/* ── VERIFY BUTTON ── */}
          <TouchableOpacity
            style={[
              styles.verifyBtn,
              {
                height:       vs(isSmall ? 48 : 54),
                borderRadius: vs(27),
                marginBottom: vs(16),
              },
            ]}
            onPress={handleVerify}
            activeOpacity={0.85}
          >
            <Text style={[styles.verifyBtnText, { fontSize: scale(16) }]}>
              Verify &amp; Continue
            </Text>
          </TouchableOpacity>

          {/* ── SECURITY NOTE ── */}
          <View style={styles.secNote}>
            <SvgXml xml={lockGreenIcon} width={scale(15)} height={scale(15)} />
            <Text style={[styles.secNoteText, { fontSize: scale(12.5), marginLeft: scale(5) }]}>
              We never share your OTP with anyone.
            </Text>
          </View>

          {/* ── FOOTER ICONS ── */}
          <View style={[styles.footer, { marginTop: vs(isSmall ? 18 : 32) }]}>
            {[
              { icon: secureIcon,  label: 'SECURE'  },
              { icon: rewardIcon,  label: 'REWARDS' },
              { icon: supporIcon,  label: 'SUPPORT' },
            ].map(({ icon, label }) => (
              <View key={label} style={styles.featureItem}>
                <View
                  style={[
                    styles.featureCircle,
                    {
                      width:        scale(52),
                      height:       scale(52),
                      borderRadius: scale(26),
                      marginBottom: vs(6),
                    },
                  ]}
                >
                  <SvgXml xml={icon} width={scale(22)} height={scale(22)} />
                </View>
                <Text style={[styles.featureLabel, { fontSize: scale(10) }]}>{label}</Text>
              </View>
            ))}
          </View>

          {/* bottom breathing room */}
          <View style={{ height: vs(20) }} />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Static styles (non-responsive values only) ──────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.backgroundColor,
  },
  flex: { flex: 1 },
  topIllustration: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 0,
  },
  scroll: {
    flexGrow: 1,
  },
  scrollTablet: {
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },

  // Header
  header: {
    zIndex: 1,
  },
  logoFallback: {
    fontWeight: 'bold',
    color: '#B8255F',
  },
  title: {
    fontWeight: '800',
    color: '#111111',
    fontFamily: Platform.select({
      ios:     'Inter28pt-Bold',
      android: 'Inter_28pt-Bold',
      default: 'Inter_28pt-Bold',
    }),
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  subtitle: {
    color: '#666666',
    lineHeight: 20,
  },
  phoneRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    marginTop:      4,
  },
  phoneNumber: {
    color:      '#B8255F',
    fontWeight: '700',
  },

  // OTP
  otpRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'flex-start',
  },

  // Resend
  resendRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  resendLeft: {
    color: '#888888',
  },
  resendLeftDisabled: {
    color: '#BBBBBB',
  },
  timerLabel: {
    color: '#888888',
  },
  timerValue: {
    color:      '#B8255F',
    fontWeight: '700',
  },
  resendBtn: {
    color:      '#B8255F',
    fontWeight: '700',
  },

  // Verify button
  verifyBtn: {
    backgroundColor: '#B8255F',
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#B8255F',
    shadowOpacity:   0.30,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       3,
  },
  verifyBtnText: {
    color:       '#FFFFFF',
    fontWeight:  'bold',
    letterSpacing: 0.4,
  },

  // Security note
  secNote: {
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  secNoteText: {
    color: '#666666',
  },

  // Footer
  footer: {
    flexDirection:  'row',
    justifyContent: 'space-around',
  },
  featureItem: {
    alignItems: 'center',
  },
  featureCircle: {
    backgroundColor: '#FFFFFF',
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000000',
    shadowOpacity:   0.06,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  featureLabel: {
    color:       '#888888',
    fontWeight:  'bold',
    letterSpacing: 0.5,
  },
});

export default OtpVarify;
