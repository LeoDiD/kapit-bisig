import React from 'react';
import { StyleProp, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      <Ionicons name="time-outline" size={18} color="#92400E" />
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
    borderColor: '#FCD34D',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    flex: 1,
    color: '#92400E',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
});
