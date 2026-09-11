import React, { type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

type AppSectionProps = {
  title: string;
  children: ReactNode;
  actionLabel?: string;
  onActionPress?: () => void;
};

const AppSection = ({ title, children, actionLabel, onActionPress }: AppSectionProps) => {
  const { colors, fontFamily } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fontFamily.bold }]}>{title}</Text>
        {actionLabel && onActionPress ? (
          <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
            <Text style={[styles.action, { color: colors.primary, fontFamily: fontFamily.medium }]}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 16 },
  action: { fontSize: 13 },
});

export default AppSection;
