import React from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { residentTheme } from '../../theme';

interface ResidentBrandLockupProps {
  size?: 'header' | 'credential';
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}

export default function ResidentBrandLockup({
  size = 'header',
  subtitle,
  style,
}: ResidentBrandLockupProps) {
  const isCredential = size === 'credential';

  return (
    <View style={[styles.container, style]} accessibilityRole="image" accessibilityLabel="Kapit-Bisig">
      <Image
        source={require('../../assets/Logo1.png')}
        resizeMode="contain"
        style={isCredential ? styles.credentialLogo : styles.headerLogo}
      />
      <View style={styles.copy}>
        <Text style={[styles.name, isCredential && styles.credentialName]}>KAPIT-BISIG</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 38,
    height: 38,
  },
  credentialLogo: {
    width: 30,
    height: 30,
  },
  copy: {
    marginLeft: 9,
  },
  name: {
    color: residentTheme.colors.ink,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.05,
  },
  credentialName: {
    fontSize: 11.5,
    letterSpacing: 0.7,
  },
  subtitle: {
    marginTop: 1,
    color: residentTheme.colors.secondary,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
