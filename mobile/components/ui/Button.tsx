import React from 'react';
import { Pressable, StyleSheet, View, Animated, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Typography } from './Typography';
import { residentTheme, theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
  hapticFeedback?: boolean;
  appearance?: 'default' | 'resident';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  style,
  hapticFeedback = true,
  appearance = 'default',
}: ButtonProps) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  const handlePress = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.divider;
    if (appearance === 'resident') {
      switch (variant) {
        case 'primary': return residentTheme.colors.brand;
        case 'secondary': return residentTheme.colors.surfaceMuted;
        case 'outline':
        case 'ghost': return 'transparent';
        default: return residentTheme.colors.brand;
      }
    }
    switch (variant) {
      case 'primary': return theme.colors.primary;
      case 'secondary': return theme.colors.primaryLight;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textMuted;
    if (appearance === 'resident') {
      return variant === 'primary' ? residentTheme.colors.inverse : residentTheme.colors.icon;
    }
    switch (variant) {
      case 'primary': return theme.colors.textInverse;
      case 'secondary': return theme.colors.primaryDark;
      case 'outline': return theme.colors.primary;
      case 'ghost': return theme.colors.textPrimary;
      default: return theme.colors.textInverse;
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'sm': return 36;
      case 'lg': return 56;
      case 'md':
      default: return 48;
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          height: getHeight(),
          borderColor: appearance === 'resident' && (variant === 'outline' || variant === 'secondary')
            ? residentTheme.colors.borderAccent
            : variant === 'outline'
              ? theme.colors.primary
              : 'transparent',
          borderWidth: variant === 'outline' || (appearance === 'resident' && variant === 'secondary') ? 1 : 0,
        },
        style,
        { transform: [{ scale }] },
      ]}
    >
      <View style={styles.content}>
        {icon && (
          <Ionicons name={icon} size={size === 'sm' ? 18 : 20} color={getTextColor()} style={styles.icon} />
        )}
        <Typography variant="body" weight="semiBold" color={getTextColor()}>
          {title}
        </Typography>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
});
