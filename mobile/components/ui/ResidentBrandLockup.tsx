import React from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

interface ResidentBrandLockupProps {
  size?: 'header' | 'credential';
  style?: StyleProp<ViewStyle>;
}

export default function ResidentBrandLockup({
  size = 'header',
  style,
}: ResidentBrandLockupProps) {
  const isCredential = size === 'credential';

  return (
    <View style={[styles.container, style]} accessibilityRole="image" accessibilityLabel="Kapit-Bisig">
      <Image
        source={require('../../assets/Textual Logo2-transparent.png')}
        resizeMode="contain"
        style={isCredential ? styles.credentialLogo : styles.headerLogo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 156,
    height: 43,
  },
  credentialLogo: {
    width: 112,
    height: 31,
  },
});
