import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiService } from '../api/apiService';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';

const OTP_LENGTH = 6;

interface Props {
  visible: boolean;
  initialEmail?: string;
  phone?: string;
  title?: string;
  message?: string;
  showSkip?: boolean;
  onSkip?: () => void;
  onRequestClose?: () => void;
  onVerified?: () => void | Promise<void>;
}

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const EmailVerificationModal = ({
  visible,
  initialEmail = '',
  phone = '',
  title = 'Verify your email',
  message = 'Please verify your email address to complete your account setup and place orders.',
  showSkip = true,
  onSkip,
  onRequestClose,
  onVerified,
}: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const otpRefs = useRef<any[]>(Array(OTP_LENGTH).fill(null));
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setEmail(initialEmail || '');
      setError('');
      setInfo('');
      setOtp(Array(OTP_LENGTH).fill(''));
      setOtpSent(false);
      setVerified(false);
      setSending(false);
      setVerifying(false);
    }
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
    };
  }, [visible, initialEmail]);

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPhone = phone.trim();

  const handleSendOtp = async () => {
    if (!trimmedEmail) {
      setError('Email address is required.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!trimmedPhone) {
      setError('Phone number is required for email verification.');
      return;
    }
    if (sending) return;

    setError('');
    setInfo('');
    setSending(true);
    try {
      const response = await apiService.post<{
        success: boolean;
        message?: string;
      }>('/api/auth/otp/email/send', {
        email: trimmedEmail,
        phone: trimmedPhone,
      });

      if (!response?.success) {
        setError(response?.message || 'Unable to send OTP. Please try again.');
        return;
      }

      setOtpSent(true);
      setOtp(Array(OTP_LENGTH).fill(''));
      setInfo(response.message || 'OTP sent successfully to your email.');
      setTimeout(() => otpRefs.current[0]?.focus?.(), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send OTP. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (error) setError('');
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus?.();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const next = [...otp];
      next[index - 1] = '';
      setOtp(next);
      otpRefs.current[index - 1]?.focus?.();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    if (verifying) return;

    setError('');
    setVerifying(true);
    try {
      const response = await apiService.post<{
        success: boolean;
        message?: string;
      }>('/api/auth/otp/email/verify', {
        email: trimmedEmail,
        otp: code,
        phone: trimmedPhone,
      });

      if (!response?.success) {
        setError(response?.message || 'Invalid OTP. Please try again.');
        return;
      }

      setVerified(true);
      setInfo('');
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => {
        successTimeoutRef.current = null;
        onVerified?.();
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose ?? (showSkip ? onSkip : undefined)}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          {showSkip ? (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkip}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>{verified ? 'Close' : 'Skip'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}

          <View style={styles.badge}>
            <Text style={styles.badgeText}>@</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={[styles.inputWrapper, error && !otpSent ? styles.inputWrapperError : null]}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (error) setError('');
                }}
                placeholder="youremail@gmail.com"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!otpSent && !verified}
              />
            </View>
          </View>

          {info && !verified ? <Text style={styles.infoText}>{info}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {!otpSent && !verified ? (
            <TouchableOpacity
              style={[styles.primaryButton, sending && styles.primaryButtonDisabled]}
              onPress={handleSendOtp}
              activeOpacity={0.85}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color={theme.colors.textOnPrimary} />
              ) : (
                <Text style={styles.primaryButtonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          ) : null}

          {otpSent && !verified ? (
            <View style={styles.otpSection}>
              <Text style={styles.label}>ENTER OTP</Text>
              <View style={styles.otpRow}>
                {Array.from({ length: OTP_LENGTH }, (_, i) => (
                  <TextInput
                    key={i}
                    ref={(r) => {
                      otpRefs.current[i] = r;
                    }}
                    style={[
                      styles.otpBox,
                      otp[i] ? styles.otpBoxFilled : null,
                    ]}
                    value={otp[i]}
                    onChangeText={(v) => handleOtpChange(v, i)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, verifying && styles.primaryButtonDisabled]}
                onPress={handleVerifyOtp}
                activeOpacity={0.85}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator color={theme.colors.textOnPrimary} />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          {verified ? (
            <View style={styles.verifiedBanner}>
              <Text style={styles.verifiedBannerText}>Verified successfully</Text>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 22,
      alignItems: 'center',
    },
    skipButton: {
      alignSelf: 'flex-end',
      paddingVertical: 4,
      paddingHorizontal: 6,
    },
    skipPlaceholder: {
      alignSelf: 'flex-end',
      height: 24,
    },
    skipText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    badge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
      marginBottom: 12,
    },
    badgeText: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      fontFamily: fontFamily.heading,
      textAlign: 'center',
      marginBottom: 6,
    },
    message: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 19,
      marginBottom: 14,
    },
    fieldGroup: {
      width: '100%',
      marginBottom: 6,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    inputWrapper: {
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 14,
      justifyContent: 'center',
    },
    inputWrapperError: {
      borderWidth: 1,
      borderColor: colors.error,
      backgroundColor: colors.surfaceVariant,
    },
    input: {
      fontSize: 14,
      color: colors.text,
      padding: 0,
    },
    errorText: {
      color: colors.error,
      fontSize: 11,
      marginTop: 4,
      marginBottom: 4,
      alignSelf: 'flex-start',
    },
    infoText: {
      color: colors.primary,
      fontSize: 12,
      marginTop: 4,
      marginBottom: 4,
      textAlign: 'center',
    },
    successText: {
      color: colors.success,
      fontWeight: '600',
    },
    primaryButton: {
      width: '100%',
      minHeight: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    primaryButtonDisabled: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: colors.textOnPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    otpSection: {
      width: '100%',
      marginTop: 10,
    },
    otpRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 4,
    },
    otpBox: {
      flex: 1,
      height: 46,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    otpBoxFilled: {
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    verifiedBanner: {
      width: '100%',
      marginTop: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
    },
    verifiedBannerText: {
      color: colors.success,
      fontSize: 13,
      fontWeight: '700',
    },
  });
};

export default EmailVerificationModal;
