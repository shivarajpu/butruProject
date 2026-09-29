/**
 * `newsletter` — email capture block.
 *
 * Heading, sub-heading, placeholder, CTA text, background image and social
 * handles all come from the widget config, so the copy is editable from the
 * admin panel. Subscribes via `POST /api/newsletter/subscribe`.
 */

import React, { useState } from 'react';
import { FONTS } from '../../constants/fonts';
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useAppTheme } from '../../theme/useAppTheme';
import type { AppTheme } from '../../theme/types';
import { apiService } from '../../api/apiService';
import { useStoreConfig } from '../../storefront/useStorefront';
import type { StoreWidget } from '../../storefront/types';
import { useWidgetActions, useWidgetLayout } from '../common';
import {
  FACEBOOK_SVG,
  INSTAGRAM_SVG,
  TELEGRAM_SVG,
  YOUTUBE_SVG,
} from '../../assets/svg/socialIcons';

const NEWSLETTER_ENDPOINT = '/api/newsletter/subscribe';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = { widget: StoreWidget };

const NewsletterWidget = ({ widget }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { gutter } = useWidgetLayout();
  const { config } = widget;
  const storeConfig = useStoreConfig();
  const { onLink } = useWidgetActions();

  const socialLinks = [
    { label: 'Instagram', url: config.instagramUrl, icon: INSTAGRAM_SVG },
    { label: 'Facebook', url: config.facebookUrl, icon: FACEBOOK_SVG },
    { label: 'YouTube', url: config.youtubeUrl, icon: YOUTUBE_SVG },
    { label: 'Telegram', url: config.telegramUrl, icon: TELEGRAM_SVG },
  ].filter(link => !!link.url);

  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async () => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setState('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setState('sending');
    try {
      const response = await apiService.post<{ message?: string }>(NEWSLETTER_ENDPOINT, {
        email: email.trim(),
        store: storeConfig?.slug,
        storeId: storeConfig?.storeId,
      });
      setState('done');
      setMessage(response?.message ?? 'Subscribed successfully.');
      setEmail('');
    } catch (error) {
      setState('error');
      setMessage(
        error instanceof Error ? error.message : 'Unable to subscribe right now.',
      );
    }
  };

  const heading = config.heading || widget.title;
  const background = config.backgroundImage || config.backgroundImagePath || '';

  const body = (
    <View style={styles.inner}>
      {config.showTitle !== false && !!heading && <Text style={styles.heading}>{heading}</Text>}
      {!!config.subheading && <Text style={styles.subheading}>{config.subheading}</Text>}

      <View style={styles.formRow}>
        <TextInput
          value={email}
          onChangeText={value => {
            setEmail(value);
            if (state !== 'idle') setState('idle');
          }}
          placeholder={config.placeholder ?? ''}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <TouchableOpacity
          style={[styles.cta, state === 'sending' && { opacity: 0.7 }]}
          activeOpacity={0.8}
          disabled={state === 'sending'}
          onPress={submit}>
          {state === 'sending' ? (
            <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
          ) : (
            <Text style={styles.ctaText}>{config.ctaText ?? 'Subscribe'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {!!message && (
        <Text
          style={[
            styles.message,
            { color: state === 'error' ? theme.colors.error : theme.colors.success },
          ]}>
          {message}
        </Text>
      )}

      {!!socialLinks.length && (
        <View style={styles.socialRow}>
          {socialLinks.map(link => (
            <TouchableOpacity
              key={link.label}
              activeOpacity={0.7}
              style={[styles.socialBtn, { borderColor: theme.colors.border }]}
              onPress={() => onLink(link.url)}>
              <SvgXml xml={link.icon} width={15} height={15} />
              <Text style={styles.socialText}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  if (background.startsWith('http')) {
    return (
      <View style={[styles.section, { paddingHorizontal: gutter }]}>
        <ImageBackground
          source={{ uri: background }}
          style={styles.card}
          imageStyle={{ borderRadius: 18 }}
          resizeMode="cover">
          {body}
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={[styles.section, { paddingHorizontal: gutter }]}>
      <View style={styles.card}>{body}</View>
    </View>
  );
};

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;
  return StyleSheet.create({
    section: { marginBottom: 22 },
    card: {
      backgroundColor: colors.primaryLight,
      borderRadius: 18,
      padding: 18,
      overflow: 'hidden',
    },
    inner: { width: '100%' },
    heading: {
      fontSize: 18,
      letterSpacing: -0.2,
      color: colors.primary,
      fontFamily: FONTS.inter28Bold,
    },
    subheading: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.textSecondary,
      marginTop: 4,
      fontFamily: fontFamily.regular,
    },
    formRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
    },
    input: {
      flex: 1,
      height: 42,
      borderRadius: 21,
      paddingHorizontal: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      fontSize: 13,
      fontFamily: fontFamily.regular,
    },
    cta: {
      height: 42,
      paddingHorizontal: 16,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaText: {
      color: colors.textOnPrimary,
      fontSize: 13,
      fontFamily: FONTS.poppinsBold,
    },
    message: {
      fontSize: 11,
      marginTop: 8,
      fontFamily: fontFamily.regular,
    },
    socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
    socialBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
    },
    socialText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  });
};

export default NewsletterWidget;
