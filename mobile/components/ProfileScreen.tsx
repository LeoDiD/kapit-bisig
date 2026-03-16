import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getResidentToken,
  ResidentProfile,
  uploadResidentAvatar,
  updateResidentProfile,
} from '../services/api/ResidentQrService';
import {
  mobileAuthService,
  User as VolunteerUser,
} from '../services/auth/MobileAuthService';
import * as ImagePicker from 'expo-image-picker';
import PendingAccessBanner from './PendingAccessBanner';

interface ProfileScreenProps {
  onNavigate?: (screen: 'home' | 'qr' | 'profile') => void;
  onLogout?: () => void;
  accountType?: 'resident' | 'volunteer';
  residentStatus?: string;
  residentProfile?: ResidentProfile | null;
  volunteerUser?: VolunteerUser | null;
  onResidentProfileUpdated?: (profile: ResidentProfile) => void;
  onVolunteerProfileUpdated?: (user: VolunteerUser | null) => void;
}

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}

const SettingsItem = ({ icon, label, onPress, disabled = false }: SettingsItemProps) => (
  <TouchableOpacity style={[styles.settingsItem, disabled && styles.settingsItemDisabled]} onPress={onPress} disabled={disabled}>
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
  residentStatus,
  residentProfile,
  volunteerUser,
  onResidentProfileUpdated,
  onVolunteerProfileUpdated,
}: ProfileScreenProps) {
  const isVolunteer = accountType === 'volunteer';
  const isPendingResident = !isVolunteer && residentStatus === 'Pending';
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [firstNameInput, setFirstNameInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');
  const [mobileInput, setMobileInput] = useState('');
  const [streetAddressInput, setStreetAddressInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [avatarUri, setAvatarUri] = useState(
    residentProfile?.avatarUrl || 'https://randomuser.me/api/portraits/men/32.jpg'
  );

  const sanitizeResidentFullName = (rawName?: string): string => {
    const noiseWords = new Set([
      'APPROVED',
      'PENDING',
      'REJECTED',
      'VERIFIED',
      'ACTIVE',
      'INACTIVE',
      'HOUSEHOLD',
      'RESIDENT',
    ]);

    const parts = String(rawName || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .filter((part) => !noiseWords.has(part.toUpperCase()));
    if (parts.length === 0) return '';

    return parts.join(' ');
  };

  const toMaskedName = (rawName?: string): string => {
    const parts = String(rawName || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) return 'Uxxxx Uxxxx';
    if (parts.length === 1) return `${parts[0][0]?.toUpperCase() || 'U'}xxxx`;
    const firstInitial = parts[0][0]?.toUpperCase() || 'U';
    const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || 'U';
    return `${firstInitial}xxxx ${lastInitial}xxxx`;
  };

  const residentRawName = useMemo(() => {
    const cleanedFirst = sanitizeResidentFullName(residentProfile?.firstName || '');
    const cleanedLast = sanitizeResidentFullName(residentProfile?.lastName || '');
    const cleanedFull = sanitizeResidentFullName(residentProfile?.fullName || '');

    if (cleanedFirst && cleanedLast) return `${cleanedFirst} ${cleanedLast}`.trim();
    if (!cleanedFirst && !cleanedLast) return cleanedFull;

    const fullParts = cleanedFull.split(/\s+/).filter(Boolean);
    if (cleanedFirst && fullParts.length > 1) {
      return `${cleanedFirst} ${fullParts[fullParts.length - 1]}`.trim();
    }
    if (cleanedLast && fullParts.length > 0) {
      return `${fullParts[0]} ${cleanedLast}`.trim();
    }
    return `${cleanedFirst} ${cleanedLast}`.trim() || cleanedFull;
  }, [residentProfile?.firstName, residentProfile?.lastName, residentProfile?.fullName]);

  const displayName = isVolunteer
    ? `${volunteerUser?.firstName || ''} ${volunteerUser?.lastName || ''}`.trim() || 'Staff'
    : toMaskedName(residentRawName || 'Juan Dela Cruz');
  const isVerified = isVolunteer ? true : residentProfile?.status === 'Approved';
  const residentCode = residentProfile?.residentCode || 'SJ-10293';
  const lguTown = 'Labrador';
  const volunteerAddress = volunteerUser?.barangay
    ? `${volunteerUser.barangay}, ${lguTown}`
    : `No address, ${lguTown}`;
  const residentAddressParts = [
    residentProfile?.barangay || 'San Jose',
    lguTown,
  ].filter(Boolean);
  const fullAddress = isVolunteer
    ? volunteerAddress
    : residentAddressParts.join(', ');
  const householdSize = residentProfile?.householdSize || 4;
  const coverageArea = isVolunteer
    ? volunteerUser?.assignedBarangays?.join(', ') || volunteerUser?.barangay || 'No assigned area'
    : 'Sector 7-B';

  useEffect(() => {
    if (residentProfile?.avatarUrl) {
      setAvatarUri(residentProfile.avatarUrl);
    }
  }, [residentProfile?.avatarUrl]);

  const initialFields = useMemo(() => {
    if (isVolunteer) {
      return {
        firstName: volunteerUser?.firstName || '',
        lastName: volunteerUser?.lastName || '',
        mobileNumber: volunteerUser?.phoneNumber || '',
        streetAddress: '',
        city: '',
      };
    }

    return {
      firstName: residentProfile?.firstName || '',
      lastName: residentProfile?.lastName || '',
      mobileNumber: residentProfile?.mobileNumber || '',
      streetAddress: residentProfile?.streetAddress || '',
      city: residentProfile?.city || '',
    };
  }, [isVolunteer, residentProfile, volunteerUser]);

  const openEditModal = () => {
    setFirstNameInput(initialFields.firstName);
    setLastNameInput(initialFields.lastName);
    setMobileInput(initialFields.mobileNumber);
    setStreetAddressInput(initialFields.streetAddress);
    setCityInput(initialFields.city);
    setIsEditOpen(true);
  };

  const handleResidentAvatarPick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to update your profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const selectedUri = result.assets[0].uri;
    setAvatarUri(selectedUri);

    const token = await getResidentToken();
    if (!token) {
      Alert.alert('Session expired', 'Please log in again.');
      return;
    }

    const uploadResult = await uploadResidentAvatar(token, selectedUri);
    if (!uploadResult.success || !uploadResult.avatarUrl) {
      Alert.alert('Upload failed', uploadResult.message || 'Unable to save profile photo.');
      return;
    }

    setAvatarUri(uploadResult.avatarUrl);
    Alert.alert('Saved', 'Profile photo updated successfully.');
  };

  const handleSaveProfile = async () => {
    if (isSaving) return;

    const firstName = firstNameInput.trim();
    const lastName = lastNameInput.trim();
    if (!firstName || !lastName) {
      Alert.alert('Missing fields', 'First name and last name are required.');
      return;
    }

    setIsSaving(true);
    try {
      if (isVolunteer) {
        const result = await mobileAuthService.updateProfile({
          firstName,
          lastName,
          phoneNumber: mobileInput.trim(),
        });

        if (!result.success || !result.data) {
          Alert.alert('Update failed', result.error || 'Unable to update profile.');
          return;
        }

        onVolunteerProfileUpdated?.(result.data);
        Alert.alert('Saved', 'Profile updated successfully.');
        setIsEditOpen(false);
        return;
      }

      // Resident profile update
      const token = await getResidentToken();
      if (!token) {
        Alert.alert('Session expired', 'Please log in again.');
        return;
      }

      const result = await updateResidentProfile(token, {
        firstName,
        lastName,
        mobileNumber: mobileInput.trim() || undefined,
        streetAddress: streetAddressInput.trim() || undefined,
        city: cityInput.trim() || undefined,
      });

      if (!result.success || !result.data) {
        Alert.alert('Update failed', result.message || 'Unable to update profile.');
        return;
      }

      onResidentProfileUpdated?.(result.data);
      Alert.alert('Saved', 'Profile updated successfully.');
      setIsEditOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    onLogout?.();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {isVolunteer && (
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.navButton} onPress={() => onNavigate?.('home')}>
            <Ionicons name="chevron-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.topNavTitle}>Profile</Text>
          <TouchableOpacity style={styles.navButton} onPress={openEditModal}>
            <Ionicons name="settings-outline" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      )}

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
              source={{ uri: avatarUri }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarButton} onPress={openEditModal}>
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

          {isVolunteer && <Text style={styles.residentCode}>Resident Code: {residentCode}</Text>}
        </View>

        {isVolunteer ? (
          <View style={styles.infoCard}>
            <InfoRow label="Full Address" value={fullAddress} />
            <InfoRow label="Household Size" value={`${householdSize} members`} />
            <InfoRow label="Coverage Area" value={coverageArea} showDivider={false} />
          </View>
        ) : (
          <>
            {isPendingResident && (
              <PendingAccessBanner message="Your account is pending admin review. QR and announcements will unlock after approval." />
            )}
            <View style={styles.infoCard}>
              <InfoRow label="Full Name" value={displayName} />
              <InfoRow label="Home Address" value={fullAddress} showDivider={false} />
            </View>
          </>
        )}

        {/* Settings Section Card */}
        <View style={styles.settingsCard}>
          {!isVolunteer && (
            <>
              <SettingsItem
                icon="person-outline"
                label="Edit Profile"
                onPress={openEditModal}
              />
              <View style={styles.settingsDivider} />
            </>
          )}
          <SettingsItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => {
              if (isPendingResident) {
                Alert.alert('Pending Approval', 'Notifications are available after admin approval.');
                return;
              }
              Alert.alert('Notifications', 'No new notifications.');
            }}
          />
          <View style={styles.settingsDivider} />
          <SettingsItem
            icon="shield-checkmark-outline"
            label="Privacy & Security"
            onPress={() => Alert.alert('Privacy & Security', 'Security settings are available on the web admin panel.')}
          />
          <View style={styles.settingsDivider} />
          <SettingsItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => Alert.alert('Help & Support', 'Please contact your barangay office for support.')}
          />
        </View>

        {/* Logout Card */}
        <View style={styles.logoutCard}>
          <TouchableOpacity style={styles.logoutButton} onPress={() => setIsLogoutConfirmOpen(true)}>
            <View style={styles.logoutIconWrapper}>
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            </View>
            <Text style={styles.logoutText}>Log Out</Text>
            <Ionicons name="chevron-forward" size={18} color="#FCA5A5" />
          </TouchableOpacity>
        </View>
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
        <TouchableOpacity
          style={[styles.floatingQrButton, isPendingResident && styles.floatingQrButtonDisabled]}
          onPress={() => onNavigate?.('qr')}
          disabled={isPendingResident}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isEditOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstNameInput}
              onChangeText={setFirstNameInput}
              editable={!isSaving}
            />

            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastNameInput}
              onChangeText={setLastNameInput}
              editable={!isSaving}
            />

            <Text style={styles.inputLabel}>{isVolunteer ? 'Phone Number' : 'Mobile Number'}</Text>
            <TextInput
              style={styles.input}
              value={mobileInput}
              onChangeText={setMobileInput}
              keyboardType="phone-pad"
              editable={!isSaving}
            />

            {!isVolunteer && (
              <>
                <Text style={styles.inputLabel}>Street Address</Text>
                <TextInput
                  style={styles.input}
                  value={streetAddressInput}
                  onChangeText={setStreetAddressInput}
                  editable={!isSaving}
                />

                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  value={cityInput}
                  onChangeText={setCityInput}
                  editable={!isSaving}
                />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsEditOpen(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isLogoutConfirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLogoutConfirmOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.logoutModalMessage}>
              Are you sure you want to log out of your account?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsLogoutConfirmOpen(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmLogoutButton]}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.confirmLogoutButtonText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // Logout Card
  logoutCard: {
    marginTop: 12,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    overflow: 'hidden',
  },
  settingsItemDisabled: {
    opacity: 0.5,
  },
  logoutIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF1F2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    flex: 1,
    marginLeft: 10,
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
  floatingQrButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalButton: {
    minWidth: 88,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#16A34A',
  },
  confirmLogoutButton: {
    backgroundColor: '#DC2626',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  logoutModalMessage: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  confirmLogoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
