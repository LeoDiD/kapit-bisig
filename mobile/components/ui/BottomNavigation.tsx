import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { residentTheme, theme } from '../../theme';
import { Typography } from './Typography';

type BottomTab = 'home' | 'distributions' | 'profile';

interface BottomNavigationProps {
  activeTab: BottomTab;
  onNavigate?: (screen: BottomTab) => void;
  showDistributions?: boolean;
  appearance?: 'default' | 'resident';
}

const TABS: Array<{
  key: BottomTab;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: 'home', label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
  { key: 'distributions', label: 'Distributions', activeIcon: 'calendar', inactiveIcon: 'calendar-outline' },
  { key: 'profile', label: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' },
];

export default function BottomNavigation({
  activeTab,
  onNavigate,
  showDistributions = true,
  appearance = 'default',
}: BottomNavigationProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      appearance === 'resident' && styles.residentContainer,
      { paddingBottom: Math.max(insets.bottom, 6) },
    ]}>
      <View style={styles.navigation}>
        {TABS.filter((tab) => showDistributions || tab.key !== 'distributions').map((tab) => {
          const isActive = activeTab === tab.key;
          const isResident = appearance === 'resident';
          const color = isResident
            ? (isActive ? residentTheme.colors.brandDark : residentTheme.colors.secondary)
            : (isActive ? theme.colors.primary : theme.colors.textMuted);

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.item}
              onPress={() => onNavigate?.(tab.key)}
              disabled={isActive}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              {isResident && isActive ? <View style={styles.activeIndicator} /> : null}
              <Ionicons name={isActive ? tab.activeIcon : tab.inactiveIcon} size={22} color={color} />
              <Typography variant="caption" weight="semiBold" color={color} style={styles.label}>
                {tab.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  navigation: {
    minHeight: 58,
    paddingTop: 7,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  residentContainer: {
    backgroundColor: residentTheme.colors.surface,
    borderTopColor: residentTheme.colors.borderAccent,
  },
  item: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: residentTheme.colors.accent,
  },
  label: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 14,
  },
});
