import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  userName?: string;
  barangayName?: string;
  isVerified?: boolean;
  claimStatus?: 'claimed' | 'not-claimed';
  onNavigate?: (screen: 'home' | 'qr' | 'profile') => void;
}

interface AnnouncementItem {
  id: string;
  isUrgent: boolean;
  title: string;
  description: string;
  timeAgo: string;
}

const mockAnnouncements: AnnouncementItem[] = [
  {
    id: '1',
    isUrgent: true,
    title: 'Relief Pack Distribution #14',
    description: 'Distribution for Areas 1-A to 4-B. Please proceed to San Jose Covered Court starting 8:00 AM.',
    timeAgo: '10 MINS AGO',
  },
];

export default function HomeScreen({
  userName = 'Juan',
  barangayName = 'Barangay San Jose',
  isVerified = true,
  claimStatus = 'not-claimed',
  onNavigate,
}: HomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.lguIconContainer}>
            <Ionicons name="business" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>LOCAL GOVERNMENT UNIT</Text>
            <Text style={styles.headerTitle}>{barangayName}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
            style={styles.avatar}
          />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>Hi, {userName}! 👋</Text>
          <Text style={styles.greetingSubtext}>Safe and secure relief for you.</Text>
        </View>

        {/* Household Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusCardHeader}>
            <View style={styles.statusTitleContainer}>
              <View style={styles.checkIconContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              </View>
              <Text style={styles.statusCardTitle}>HOUSEHOLD STATUS</Text>
            </View>
            <View style={styles.liveUpdatesBadge}>
              <View style={styles.liveUpdatesDot} />
              <Text style={styles.liveUpdatesText}>LIVE UPDATES</Text>
            </View>
          </View>
          
          <View style={styles.statusCardContent}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>VERIFICATION</Text>
              <Text style={[styles.statusValue, isVerified && styles.statusVerified]}>
                {isVerified ? 'Verified' : 'Pending'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>LATEST CLAIM</Text>
              <Text style={[
                styles.statusValue,
                claimStatus === 'claimed' ? styles.statusClaimed : styles.statusNotClaimed
              ]}>
                {claimStatus === 'claimed' ? 'Claimed' : 'Not Yet Claimed'}
              </Text>
            </View>
          </View>
        </View>

        {/* Announcement Feed Section */}
        <View style={styles.announcementSection}>
          <View style={styles.announcementHeader}>
            <Text style={styles.announcementTitle}>ANNOUNCEMENT FEED</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>SEE ALL</Text>
            </TouchableOpacity>
          </View>

          {/* Announcement Cards */}
          {mockAnnouncements.map((announcement) => (
            <View key={announcement.id} style={styles.announcementCard}>
              <View style={styles.announcementCardHeader}>
                {announcement.isUrgent && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentIcon}>!</Text>
                    <Text style={styles.urgentText}>URGENT</Text>
                  </View>
                )}
                <Text style={styles.timeAgoText}>{announcement.timeAgo}</Text>
              </View>
              <Text style={styles.announcementCardTitle}>{announcement.title}</Text>
              <Text style={styles.announcementCardDescription}>
                {announcement.description}
              </Text>
              <TouchableOpacity style={styles.checkEligibilityButton}>
                <Text style={styles.checkEligibilityText}>Check eligibility</Text>
                <Ionicons name="arrow-forward" size={16} color="#16A34A" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={24} color="#16A34A" />
            <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
          </TouchableOpacity>
          <View style={styles.navItemPlaceholder} />
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate?.('profile')}>
            <Ionicons name="person" size={24} color="#9CA3AF" />
            <Text style={styles.navText}>Profile</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lguIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greetingSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  greetingSubtext: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIconContainer: {
    marginRight: 8,
  },
  statusCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.5,
  },
  liveUpdatesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveUpdatesDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  liveUpdatesText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.5,
  },
  statusCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusVerified: {
    color: '#16A34A',
  },
  statusClaimed: {
    color: '#16A34A',
  },
  statusNotClaimed: {
    color: '#EF4444',
  },
  announcementSection: {
    marginBottom: 20,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  announcementTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  announcementCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    marginRight: 4,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  timeAgoText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  announcementCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  announcementCardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  checkEligibilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkEligibilityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
    marginRight: 4,
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
