import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { theme } from '../../theme';

interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: keyof typeof theme.spacing;
}

export function Card({ variant = 'elevated', padding = 'lg', style, children, ...props }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        { padding: theme.spacing[padding] },
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        variant === 'flat' && styles.flat,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
  },
  elevated: {
    ...theme.shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  outlined: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  flat: {
    backgroundColor: theme.colors.divider,
  },
});
