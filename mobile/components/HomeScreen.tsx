import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  Pressable,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { mobileAuthService } from '../services/auth/MobileAuthService';
import { fetchResidentDistributions, getResidentToken } from '../services/api/ResidentQrService';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  userName?: string;
  barangayName?: string;
  isVerified?: boolean;
  claimStatus?: 'claimed' | 'not-claimed';
  residentCode?: string;
  streetAddress?: string;
  onNavigate?: (screen: 'home' | 'qr' | 'profile') => void;
  accountType?: 'resident' | 'volunteer';
}

interface DistributionItem {
  id: string;
  isUrgent: boolean;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  imageUrl: string;
  hostBarangay: string;
  coverage: string;
  coverageList: string[];
  schedule?: string;
  notes?: string;
}

interface DistributionResponseItem {
  id?: string;
  _id?: string;
  barangay: string;
  assignedBarangays?: string[];
  scheduled?: string;
  notes?: string;
  createdAt?: string;
}

function parseSchedule(scheduled?: string): { date: string; time: string } {
  if (!scheduled) {
    return { date: 'To be announced', time: '' };
  }
  
  // Try to parse the schedule string
  const dateMatch = scheduled.match(/(\w+ \d+,? \d{4}|\d{1,2}\/\d{1,2}\/\d{4})/);
  const timeMatch = scheduled.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?(?:\s*[-–]\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)?)/i);
  
  return {
    date: dateMatch ? dateMatch[0] : scheduled,
    time: timeMatch ? timeMatch[0] : '',
  };
}

function toDistribution(item: DistributionResponseItem, index: number): DistributionItem {
  const coverageList = Array.from(new Set([item.barangay, ...(item.assignedBarangays ?? [])]));
  const targetAreas = coverageList.join(', ');
  const { date, time } = parseSchedule(item.scheduled);

  return {
    id: item.id || item._id || `${item.barangay}-${item.createdAt || Date.now()}`,
    isUrgent: true,
    title: `Relief Pack Distribution #${index + 1}`,
    description: item.notes || 'Relief goods distribution for eligible residents.',
    date,
    time,
    location: `${item.barangay} Covered Court`,
    imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80',
    coverage: targetAreas,
    coverageList,
    schedule: item.scheduled,
    notes: item.notes,
    hostBarangay: item.barangay,
  };
}

export default function HomeScreen({
  userName = 'Juan',
  barangayName = 'Barangay San Jose',
  isVerified = true,
  claimStatus = 'not-claimed',
  residentCode = 'N/A',
  streetAddress = 'Address not available',
  onNavigate,
  accountType = 'resident',
}: HomeScreenProps) {
  const [distributions, setDistributions] = useState<DistributionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState<DistributionItem | null>(null);

  const isVolunteer = accountType === 'volunteer';

  const loadDistributions = useCallback(async () => {
    if (isVolunteer && !mobileAuthService.isLoggedIn()) {
      setDistributions([]);
      return;
    }

    setLoading(true);

    let feed: DistributionResponseItem[] = [];
    if (isVolunteer) {
      const result = await mobileAuthService.authenticatedRequest<{
        success: boolean;
        data?: DistributionResponseItem[];
      }>('/distributions', { method: 'GET' });
      if (result.success && result.data?.success && Array.isArray(result.data.data)) {
        feed = result.data.data;
      }
    } else {
      const residentToken = await getResidentToken();
      if (residentToken) {
        const residentFeed = await fetchResidentDistributions(residentToken);
        if (residentFeed.success && Array.isArray(residentFeed.data)) {
          feed = residentFeed.data;
        }
      }
    }

    if (feed.length > 0) {
      setDistributions(feed.slice(0, 5).map((item, idx) => toDistribution(item, idx)));
      setLoading(false);
      return;
    }

    setDistributions([]);
    setLoading(false);
  }, [isVolunteer]);

  useEffect(() => {
    loadDistributions().catch(() => setLoading(false));
  }, [loadDistributions]);

  // Get the featured distribution (first one) for the hero card
  const featuredDistribution = distributions[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          !loading && distributions.length === 0 && styles.scrollContentCentered
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>Hi, {userName} 👋</Text>
            <Text style={styles.greetingSubtext}>Relief distribution updates</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Section Label - only show when loading or has distributions */}
        {(loading || distributions.length > 0) && (
          <Text style={styles.sectionLabel}>UPCOMING DISTRIBUTION</Text>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.loadingText}>Loading distributions...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && distributions.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIconWrapper}>
              <Ionicons name="calendar-outline" size={56} color="#D1D5DB" style={styles.emptyStateIcon} />
            </View>
            <Text style={styles.emptyStateTitle}>No active distribution right now</Text>
            <Text style={styles.emptyStateText}>
              We'll notify you when the next relief schedule is available.
            </Text>
          </View>
        )}

        {/* Featured Distribution Hero Card */}
        {!loading && featuredDistribution && (
          <View style={styles.heroCard}>
            {/* Image Section */}
            <View style={styles.heroImageContainer}>
              <ImageBackground
                source={{ uri: featuredDistribution.imageUrl }}
                style={styles.heroImage}
                imageStyle={styles.heroImageStyle}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.heroGradient}
                >
                  {/* Urgent Badge */}
                  {featuredDistribution.isUrgent && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>URGENT</Text>
                    </View>
                  )}
                  
                  {/* Title over image */}
                  <Text style={styles.heroTitle}>{featuredDistribution.title}</Text>
                </LinearGradient>
              </ImageBackground>
            </View>

            {/* Information Section */}
            <View style={styles.heroInfoSection}>
              {/* Date Row */}
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                <Text style={styles.infoText}>
                  {featuredDistribution.date}
                  {featuredDistribution.time ? ` • ${featuredDistribution.time}` : ''}
                </Text>
              </View>

              {/* Location Row */}
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color="#6B7280" />
                <Text style={styles.infoText}>{featuredDistribution.location}</Text>
              </View>

              {/* View Details Button */}
              <TouchableOpacity 
                style={styles.viewDetailsButton}
                onPress={() => setSelectedDistribution(featuredDistribution)}
              >
                <Text style={styles.viewDetailsText}>View Distribution Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Additional Distributions */}
        {!loading && distributions.length > 1 && (
          <View style={styles.additionalSection}>
            <Text style={styles.additionalLabel}>MORE DISTRIBUTIONS</Text>
            {distributions.slice(1).map((distribution) => (
              <TouchableOpacity 
                key={distribution.id} 
                style={styles.additionalCard}
                onPress={() => setSelectedDistribution(distribution)}
              >
                <View style={styles.additionalInfo}>
                  <Text style={styles.additionalTitle}>{distribution.title}</Text>
                  <View style={styles.additionalMeta}>
                    <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                    <Text style={styles.additionalMetaText}>{distribution.date}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Distribution Details Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={selectedDistribution !== null}
        onRequestClose={() => setSelectedDistribution(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedDistribution(null)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDistribution?.title}</Text>
              <TouchableOpacity 
                style={styles.modalCloseBtn} 
                onPress={() => setSelectedDistribution(null)}
              >
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBadgesRow}>
              <View style={styles.modalBadge}>
                <Text style={styles.modalBadgeLabel}>HOST</Text>
                <Text style={styles.modalBadgeValue}>{selectedDistribution?.hostBarangay || 'N/A'}</Text>
              </View>
              <View style={styles.modalBadge}>
                <Text style={styles.modalBadgeLabel}>COVERAGE</Text>
                <Text style={styles.modalBadgeValue}>
                  {(selectedDistribution?.coverageList?.length || 0).toString()} barangays
                </Text>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>Schedule</Text>
              <Text style={styles.modalSectionValue}>
                {selectedDistribution?.date}
                {selectedDistribution?.time ? ` • ${selectedDistribution.time}` : ''}
              </Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>Location</Text>
              <Text style={styles.modalSectionValue}>
                {selectedDistribution?.location || 'To be announced'}
              </Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>Covered Barangays</Text>
              <Text style={styles.modalSectionValue}>
                {selectedDistribution?.coverage || 'N/A'}
              </Text>
            </View>

            {selectedDistribution?.notes && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>Notes</Text>
                <Text style={styles.modalSectionValue}>{selectedDistribution.notes}</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.modalActionBtn} 
              onPress={() => setSelectedDistribution(null)}
            >
              <Text style={styles.modalActionText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={22} color="#16A34A" />
            <Text style={[styles.navText, styles.navTextActive]}>HOME</Text>
          </TouchableOpacity>
          <View style={styles.navItemPlaceholder} />
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate?.('profile')}>
            <Ionicons name="person-outline" size={22} color="#9CA3AF" />
            <Text style={styles.navText}>PROFILE</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  scrollContentCentered: {
    flexGrow: 1,
  },

  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '500',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  greetingSubtext: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
    opacity: 0.8,
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },

  // Section Label
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    paddingHorizontal: 24,
    marginBottom: 16,
  },

  // Loading State
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    marginHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingBottom: 80,
  },
  emptyStateIconWrapper: {
    marginBottom: 24,
  },
  emptyStateIcon: {
    opacity: 0.4,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyStateText: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  heroImageContainer: {
    height: 200,
    overflow: 'hidden',
  },
  heroImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroImageStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  urgentBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  heroInfoSection: {
    padding: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 15,
    color: '#4B5563',
    marginLeft: 12,
  },
  viewDetailsButton: {
    backgroundColor: '#16A34A',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  viewDetailsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Additional Distributions
  additionalSection: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  additionalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  additionalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  additionalInfo: {
    flex: 1,
  },
  additionalTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 6,
  },
  additionalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  additionalMetaText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 6,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    paddingRight: 16,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBadgesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  modalBadge: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 14,
  },
  modalBadgeLabel: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalBadgeValue: {
    marginTop: 4,
    fontSize: 14,
    color: '#166534',
    fontWeight: '600',
  },
  modalSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    marginTop: 16,
  },
  modalSectionLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 6,
  },
  modalSectionValue: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  modalActionBtn: {
    marginTop: 24,
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
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
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navItemPlaceholder: {
    width: 64,
  },
  navText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  navTextActive: {
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
