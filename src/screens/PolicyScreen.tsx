import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import type { RootStackParamList } from '../navigation/types';
import {
  getPolicy,
  policyHasContent,
  policyTitle,
  type Policy,
} from '../api/policies';
import PolicyContentView, { htmlToPolicyBlocks, type PolicyBlock } from '../components/PolicyContentView';

const BACK_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="CURRENT_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const EMPTY_ICON = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="CURRENT_COLOR" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="CURRENT_COLOR" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const closeIcon = (color: string) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>`;

type Props = NativeStackScreenProps<RootStackParamList, 'Policy'>;

const groupBlocks = (blocks: PolicyBlock[]): PolicyBlock[][] => {
  const groups: PolicyBlock[][] = [];
  let current: PolicyBlock[] = [];

  blocks.forEach(block => {
    if (block.type === 'heading') {
      if (current.length) groups.push(current);
      current = [block];
    } else {
      current.push(block);
    }
  });

  if (current.length) groups.push(current);
  return groups;
};

export default function PolicyScreen({ route, navigation }: Props) {
  const { policyKey, title } = route.params;
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { colors } = theme;
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>(
    'loading',
  );
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [blocks, setBlocks] = useState<PolicyBlock[]>([]);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await getPolicy(policyKey);
      const data = response?.data ?? null;
      if (!policyHasContent(data)) {
        setPolicy(null);
        setBlocks([]);
        setStatus('empty');
        return;
      }
      setPolicy(data);
      setBlocks(htmlToPolicyBlocks(data?.content ?? ''));
      setStatus('ready');
    } catch {
      setPolicy(null);
      setBlocks([]);
      setStatus('error');
    }
  }, [policyKey]);

  useEffect(() => {
    load();
  }, [load]);

  const headerTitle = title?.trim() || policy?.title || policyTitle(policyKey);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          activeOpacity={0.7}>
          <SvgXml
            xml={BACK_ICON.replace('CURRENT_COLOR', colors.text)}
            width={20}
            height={20}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {headerTitle}
        </Text>
      </View>

      {status === 'loading' ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateSubText}>Loading content…</Text>
        </View>
      ) : status === 'error' ? (
        <View style={styles.centerState}>
          <View style={styles.stateIconCircle}>
            <SvgXml
              xml={closeIcon(colors.textMuted)}
              width={18}
              height={18}
            />
          </View>
          <Text style={styles.stateTitle}>Something went wrong</Text>
          <Text style={styles.stateSubText}>
            We couldn't load this page. Please try again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.8}
            onPress={load}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : status === 'empty' ? (
        <View style={styles.centerState}>
          <View style={styles.stateIconCircle}>
            <SvgXml
              xml={EMPTY_ICON.replace('CURRENT_COLOR', colors.textMuted)}
              width={32}
              height={32}
            />
          </View>
          <Text style={styles.stateTitle}>Content coming soon</Text>
          <Text style={styles.stateSubText}>
            This page doesn't have any content yet. Please check back later.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.contentContainer,
            isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' },
          ]}
          showsVerticalScrollIndicator={false}>
          {groupBlocks(blocks).map((group, idx) => (
            <View key={idx} style={styles.card}>
              <PolicyContentView blocks={group} />
            </View>
          ))}

          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Butru. All rights reserved.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTitle: {
      flex: 1,
      fontSize: 16,
      fontFamily: fontFamily.heading,
      color: colors.text,
    },
    container: {
      flex: 1,
      backgroundColor: colors.backgroundColor,
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 24,
    },
    card: {
      backgroundColor: colors.primaryLight,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    footerText: {
      textAlign: 'center',
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 4,
      fontFamily: fontFamily.regular,
    },

    /* States */
    centerState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundColor,
      paddingHorizontal: 40,
    },
    stateIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    stateTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      fontFamily: fontFamily.bold,
      marginBottom: 8,
    },
    stateSubText: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: fontFamily.regular,
      textAlign: 'center',
      lineHeight: 18,
      marginTop: 8,
    },
    retryButton: {
      marginTop: 16,
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 28,
    },
    retryButtonText: {
      color: colors.textOnPrimary,
      fontSize: 13,
      fontFamily: fontFamily.bold,
    },
  });
};