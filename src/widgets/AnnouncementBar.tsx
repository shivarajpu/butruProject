/**
 * Announcement bar.
 *
 * Prefers `website.announcementBars[]` (multi) and falls back to the single
 * `website.announcementBar`. Text, colours, link and image all come from the
 * config, so the strip is fully editable from the admin panel.
 */

import React, { useState } from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';
import { selectAnnouncementBars } from '../storefront/selectors';
import { useWidgetActions } from './common';

type Props = {
  /** From `webConfig.appAnnouncement.sticky` — pins the bar under the status bar. */
  sticky?: boolean;
};

const AnnouncementBar = ({ sticky = false }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const bars = useSelector(selectAnnouncementBars);
  const { onLink } = useWidgetActions();
  const [index, setIndex] = useState(0);

  if (!bars.length) return null;

  const bar = bars[index % bars.length];

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: bar.backgroundColor || theme.colors.primary,
          zIndex: sticky ? 10 : 1,
        },
      ]}>
      {bar.imageUrl ? (
        <Image source={{ uri: bar.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <TouchableOpacity
          style={styles.textWrap}
          activeOpacity={0.8}
          onPress={() => onLink(bar.link)}>
          <Text
            style={[styles.text, { color: bar.textColor || theme.colors.textOnPrimary }]}
            numberOfLines={1}>
            {bar.text}
          </Text>
        </TouchableOpacity>
      )}

      {bars.length > 1 && (
        <View style={styles.dots}>
          {bars.map((_, dotIndex) => (
            <TouchableOpacity
              key={dotIndex}
              hitSlop={8}
              onPress={() => setIndex(dotIndex)}>
              <View
                style={[
                  styles.dot,
                  dotIndex === index % bars.length && {
                    backgroundColor: bar.textColor || theme.colors.textOnPrimary,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!!bar.link && !!bar.imageUrl && (
        <TouchableOpacity
          style={styles.imageLink}
          activeOpacity={0.8}
          onPress={() => {
            if (/^https?:/i.test(bar.link)) {
              Linking.openURL(bar.link).catch(() => undefined);
            } else {
              onLink(bar.link);
            }
          }}>
          <Text style={[styles.text, { color: bar.textColor || theme.colors.textOnPrimary }]}>
            {bar.text || 'Learn more'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 30,
      paddingVertical: 6,
      paddingHorizontal: 14,
    },
    textWrap: { flex: 1 },
    text: {
      fontSize: 11,
      textAlign: 'center',
      fontFamily: fontFamily.medium,
    },
    image: { width: '100%', height: 42 },
    imageLink: { flex: 1, alignItems: 'center' },
    dots: { flexDirection: 'row', gap: 4, marginLeft: 8 },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
  });
};

export default AnnouncementBar;
