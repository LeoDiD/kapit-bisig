import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface ProfileScreenProps {
  onNavigate?: (screen: 'home' | 'qr' | 'profile') => void;
  onLogout?: () => void;
}

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  isDestructive?: boolean;
}

const MenuItem = ({ icon, label, onPress, isDestructive }: MenuItemProps) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIconContainer, isDestructive && styles.menuIconDestructive]}>
      <Ionicons name={icon} size={20} color={isDestructive ? '#EF4444' : '#16A34A'} />
    </View>
    <Text style={[styles.menuLabel, isDestructive && styles.menuLabelDestructive]}>{label}</Text>
    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
  </TouchableOpacity>
);

export default function ProfileScreen({ onNavigate, onLogout }: ProfileScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editImageButton}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>Juan Dela Cruz</Text>
          <Text style={styles.profileEmail}>juan.delacruz@email.com</Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
            <Text style={styles.verifiedText}>Verified Household</Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="person-outline" label="Personal Information" />
            <View style={styles.menuDivider} />
            <MenuItem icon="home-outline" label="Address Details" />
            <View style={styles.menuDivider} />
            <MenuItem icon="people-outline" label="Family Members" />
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="notifications-outline" label="Notifications" />
            <View style={styles.menuDivider} />
            <MenuItem icon="lock-closed-outline" label="Privacy & Security" />
            <View style={styles.menuDivider} />
            <MenuItem icon="help-circle-outline" label="Help & Support" />
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.menuCard}>
            <MenuItem 
              icon="log-out-outline" 
              label="Log Out" 
              isDestructive 
              onPress={onLogout}
            />
          </View>
        </View>

        {/* App Version */}
        <Text style={styles.versionText}>Kapit-Bisig v1.0.0</Text>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate?.('home')}>
            <Ionicons name="home-outline" size={24} color="#9CA3AF" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <View style={styles.navItemPlaceholder} />
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="person" size={24} color="#16A34A" />
            <Text style={[styles.navText, styles.navTextActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.floatingQrButton} onPress={() => onNavigate?.('qr')}>
          <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#16A34A',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
    marginLeft: 6,
  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIconDestructive: {
    backgroundColor: '#FEE2E2',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  menuLabelDestructive: {
    color: '#EF4444',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 64,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 24,
    marginBottom: 20,
  },
  bottomNavContainer: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingBottom: 24,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navItemPlaceholder: {
    width: 70,
  },
  floatingQrButton: {
    position: 'absolute',
    top: -28,
    left: '50%',
    marginLeft: -35,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#16A34A',
  },
});
