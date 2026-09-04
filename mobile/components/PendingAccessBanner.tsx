import React from 'react';
import { StyleProp, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { residentTheme } from '../theme';

const residentColors = residentTheme.colors;

interface PendingAccessBannerProps {
  message?: string;
  style?: StyleProp<ViewStyle>;
}

export default function PendingAccessBanner({
  message = 'Your account is pending admin review. Only Home and Profile are available right now.',
  style,
}: PendingAccessBannerProps) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="time-outline" size={18} color={residentColors.accentInk} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: residentColors.accent,
    backgroundColor: residentColors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    flex: 1,
    color: residentColors.accentInk,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
});
