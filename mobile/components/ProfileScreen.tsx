import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ResidentProfile } from '../services/api/ResidentQrService';
import { User as VolunteerUser } from '../services/auth/MobileAuthService';

interface ProfileScreenProps {
  onNavigate?: (screen: 'home' | 'qr' | 'profile') => void;
  onLogout?: () => void;
  accountType?: 'resident' | 'volunteer';
  residentProfile?: ResidentProfile | null;
  volunteerUser?: VolunteerUser | null;
}

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}

const SettingsItem = ({ icon, label, onPress }: SettingsItemProps) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
    <View style={styles.settingsIconWrapper}>
      <Ionicons name={icon} size={20} color="#6B7280" />
    </View>
    <Text style={styles.settingsLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
  </TouchableOpacity>
);

interface InfoRowProps {
  label: string;
  value: string;
  showDivider?: boolean;
}

const InfoRow = ({ label, value, showDivider = true }: InfoRowProps) => (
  <>
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
    {showDivider && <View style={styles.infoDivider} />}
  </>
);

export default function ProfileScreen({
  onNavigate,
  onLogout,
  accountType = 'resident',
  residentProfile,
  volunteerUser,
}: ProfileScreenProps) {
  const isVolunteer = accountType === 'volunteer';
  const displayName = isVolunteer
    ? `${volunteerUser?.firstName || ''} ${volunteerUser?.lastName || ''}`.trim() || 'Volunteer'
    : residentProfile?.fullName || 'Juan Dela Cruz';
  const isVerified = isVolunteer ? true : residentProfile?.status === 'Approved';
  const residentCode = residentProfile?.residentCode || 'SJ-10293';
  const fullAddress = isVolunteer
    ? volunteerUser?.barangay || 'No address'
    : [residentProfile?.streetAddress || '123 Maple St', residentProfile?.barangay || 'San Jose']
        .filter(Boolean)
        .join(', ');
  const householdSize = residentProfile?.householdSize || 4;
  const coverageArea = 'Sector 7-B';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => onNavigate?.('home')}>
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Profile</Text>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="settings-outline" size={22} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Identity Section */}
        <View style={styles.identitySection}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="pencil" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Name */}
          <Text style={styles.profileName}>{displayName}</Text>

          {/* Verified Badge */}
          <View style={styles.verifiedBadge}>
            <Ionicons 
              name={isVerified ? 'checkmark-circle' : 'time-outline'} 
              size={16} 
              color={isVerified ? '#16A34A' : '#F59E0B'} 
            />
            <Text style={styles.verifiedText}>
              {isVolunteer ? 'Active Staff' : isVerified ? 'Verified Household' : 'Pending Verification'}
            </Text>
          </View>

          {/* Resident Code */}
          <Text style={styles.residentCode}>Resident Code: {residentCode}</Text>
        </View>

        {/* Account Information Card */}
        <View style={styles.infoCard}>
          <InfoRow label="Full Address" value={fullAddress} />
          <InfoRow label="Household Size" value={`${householdSize} members`} />
          <InfoRow label="Coverage Area" value={coverageArea} showDivider={false} />
        </View>

        {/* Settings Section Card */}
        <View style={styles.settingsCard}>
          <SettingsItem icon="notifications-outline" label="Notifications" />
          <View style={styles.settingsDivider} />
          <SettingsItem icon="shield-checkmark-outline" label="Privacy & Security" />
          <View style={styles.settingsDivider} />
          <SettingsItem icon="help-circle-outline" label="Help & Support" />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.bottomNavItem} onPress={() => onNavigate?.('home')}>
            <Ionicons name="home-outline" size={22} color="#9CA3AF" />
            <Text style={styles.bottomNavText}>HOME</Text>
          </TouchableOpacity>
          <View style={styles.bottomNavPlaceholder} />
          <TouchableOpacity style={styles.bottomNavItem}>
            <Ionicons name="person" size={22} color="#16A34A" />
            <Text style={[styles.bottomNavText, styles.bottomNavTextActive]}>PROFILE</Text>
          </TouchableOpacity>
        </View>
        
        {/* Floating QR Button */}
        <TouchableOpacity style={styles.floatingQrButton} onPress={() => onNavigate?.('qr')}>
          <MaterialCommunityIcons name="qrcode-scan" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },

  // Top Navigation
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  navButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topNavTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },

  // Profile Identity Section
  identitySection: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#BBF7D0',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F8FAF9',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16A34A',
    marginLeft: 6,
  },
  residentCode: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '400',
  },

  // Information Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  infoLabel: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  infoValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  // Settings Card
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    minHeight: 56,
  },
  settingsIconWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '400',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  // Logout Button
  logoutButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
  },

  // Bottom Navigation
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 28,
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  bottomNavPlaceholder: {
    width: 64,
  },
  bottomNavText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  bottomNavTextActive: {
    color: '#16A34A',
  },
  floatingQrButton: {
    position: 'absolute',
    top: -28,
    left: '50%',
    marginLeft: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
});
