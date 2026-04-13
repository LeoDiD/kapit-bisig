import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle } from 'react-native';
import { theme } from '../../theme';

export interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold';
  color?: string;
  align?: TextStyle['textAlign'];
}

export function Typography({
  variant = 'body',
  weight = 'regular',
  color = theme.colors.textPrimary,
  align = 'left',
  style,
  children,
  ...props
}: TextProps) {
  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'h1':
        return { fontSize: theme.typography.size.xxl, lineHeight: theme.typography.lineHeight.xxl, letterSpacing: -0.5 };
      case 'h2':
        return { fontSize: theme.typography.size.xl, lineHeight: theme.typography.lineHeight.xl, letterSpacing: -0.4 };
      case 'h3':
        return { fontSize: theme.typography.size.lg, lineHeight: theme.typography.lineHeight.lg, letterSpacing: -0.3 };
      case 'caption':
        return { fontSize: theme.typography.size.sm, lineHeight: theme.typography.lineHeight.sm };
      case 'label':
        return { fontSize: theme.typography.size.xs, lineHeight: theme.typography.lineHeight.xs, letterSpacing: 0.5, textTransform: 'uppercase' };
      case 'body':
      default:
        return { fontSize: theme.typography.size.md, lineHeight: theme.typography.lineHeight.md };
    }
  };

  const getFontFamily = () => theme.typography.fontFamily[weight];

  return (
    <RNText
      style={[
        getVariantStyle(),
        {
          fontFamily: getFontFamily(),
          color,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}
