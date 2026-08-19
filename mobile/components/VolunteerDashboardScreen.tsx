import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  DashboardSummary,
  mobileAuthService,
  User as VolunteerUser,
} from '../services/auth/MobileAuthService';
import { theme } from '../theme';
import { Typography } from './ui/Typography';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface VolunteerDashboardScreenProps {
  volunteerUser?: VolunteerUser | null;
  onNavigate?: (screen: 'home' | 'qr' | 'profile') => void;
  onLogout?: () => void;
}

interface DistributionData {
  id: string;
  title: string;
  barangay: string;
  coverage: string[];
  schedule: string;
  startTime: string;
  isLive: boolean;
  isUrgent: boolean;
  registeredHouseholds: number;
  claimedHouseholds: number;
}

interface DashboardStats {
  totalHouseholds: number;
  verifiedHouseholds: number;
  pendingQueue: number;
  scansToday: number;
  scansTrend: number;
  activeDistributions: number;
  confirmedClaimsToday: number;
  scopedBarangays: string[];
}

interface VolunteerNotificationItem {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt?: string;
}

export default function VolunteerDashboardScreen({
  volunteerUser,
  onNavigate,
  onLogout,
}: VolunteerDashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [distributions, setDistributions] = useState<DistributionData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalHouseholds: 0,
    verifiedHouseholds: 0,
    pendingQueue: 0,
    scansToday: 0,
    scansTrend: 0,
    activeDistributions: 0,
    confirmedClaimsToday: 0,
    scopedBarangays: [],
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState<VolunteerNotificationItem[]>([]);

  const displayName = volunteerUser
    ? `${volunteerUser.firstName || ''} ${volunteerUser.lastName || ''}`.trim() || 'Staff Member'
    : 'Staff Member';

  const progressPercentage = stats.totalHouseholds > 0
    ? Math.round((stats.verifiedHouseholds / stats.totalHouseholds) * 100)
    : 0;

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [distributionResult, summaryResult] = await Promise.all([
        mobileAuthService.authenticatedRequest<{
          success: boolean;
          data?: Array<{
            id?: string;
            _id?: string;
            barangay: string;
            assignedBarangays?: string[];
            scheduled?: string;
            notes?: string;
            registeredHouseholds?: number;
            claimedHouseholds?: number;
            lifecycleStatus?: 'Upcoming' | 'Active' | 'Completed' | 'Archived';
          }>;
        }>('/distributions', { method: 'GET' }),
        mobileAuthService.getDashboardSummary(),
      ]);

      if (summaryResult.success && summaryResult.data) {
        const summary: DashboardSummary = summaryResult.data;
        setStats({
          totalHouseholds: summary.residents.total,
          verifiedHouseholds: summary.residents.approved,
          pendingQueue: summary.residents.pending,
          scansToday: summary.scans.today,
          scansTrend: summary.scans.trend,
          activeDistributions: summary.distributions.active,
          confirmedClaimsToday: summary.claims.confirmedToday,
          scopedBarangays: summary.scopedBarangays,
        });
      }

      if (
        distributionResult.success &&
        distributionResult.data?.success &&
        Array.isArray(distributionResult.data.data)
      ) {
        const mappedDistributions: DistributionData[] = distributionResult.data.data
          .slice(0, 3)
          .map((item, idx) => ({
            id: item.id || item._id || `dist-${idx}`,
            title: `${item.barangay} Relief Drive`,
            barangay: item.barangay,
            coverage: item.assignedBarangays || [item.barangay],
            schedule: item.scheduled || '09:00 AM - 12:30 PM',
            startTime: '08:30 AM',
            isLive: item.lifecycleStatus === 'Active',
            isUrgent: idx === 0,
            registeredHouseholds: Number(item.registeredHouseholds || 0),
            claimedHouseholds: Number(item.claimedHouseholds || 0),
          }));
        setDistributions(mappedDistributions);
      } else {
        setDistributions([]);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboardData]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const featuredDistribution = distributions[0];
  const unreadNotificationCount = notifications.filter((item) => !item.isRead).length;

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const result = await mobileAuthService.authenticatedRequest<{
        success: boolean;
        data?: { notifications?: VolunteerNotificationItem[] };
      }>('/notifications?limit=30', { method: 'GET' });

      if (result.success && result.data?.success && Array.isArray(result.data.data?.notifications)) {
        setNotifications(result.data.data.notifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const handleOpenNotifications = async () => {
    setShowNotificationsModal(true);
    await loadNotifications();
  };

  const handleNotificationPress = async (notification: VolunteerNotificationItem) => {
    if (notification.isRead) return;

    try {
      await mobileAuthService.authenticatedRequest(`/notifications/${notification._id}/read`, {
        method: 'PATCH',
      });
      setNotifications((prev) =>
        prev.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item)),
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  useEffect(() => {
    if (mobileAuthService.isLoggedIn()) {
      loadDashboardData();
      loadNotifications().catch(() => undefined);
    }
  }, [loadDashboardData, loadNotifications]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{displayName}</Text>
              <View style={styles.staffBadge}>
                <Text style={styles.staffBadgeText}>STAFF</Text>
              </View>
            </View>
            <View style={styles.syncRow}>
              <View style={styles.syncDot} />
              <Text style={styles.syncText}>Sync Online</Text>
              <Text style={styles.syncSeparator}>•</Text>
              <Text style={styles.syncText}>Last updated {formatTime(lastUpdated)}</Text>
            </View>
            {stats.scopedBarangays.length > 0 && (
              <Text style={styles.scopeText}>Scope: {stats.scopedBarangays.join(', ')}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.notificationButton} onPress={handleOpenNotifications}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.textPrimary} />
            {unreadNotificationCount > 0 && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </View>

        {/* Primary Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <Text style={styles.progressLabel}>CURRENT OBJECTIVE</Text>
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>ACTIVE</Text>
            </View>
          </View>

          <Text style={styles.progressTitle}>Relief Goods Phase 1</Text>

          <View style={styles.progressStats}>
            <Text style={styles.progressCount}>
              <Text style={styles.progressCountBold}>{stats.verifiedHouseholds}</Text>
              {' / '}{stats.totalHouseholds} Households Verified
            </Text>
            <Text style={styles.progressPercent}>{progressPercentage}%</Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>

        {/* Secondary Operational Cards */}
        <View style={styles.statsRow}>
          {/* Pending Card */}
          <View style={styles.statsCard}>
            <View style={styles.statsCardHeader}>
              <View style={styles.pendingDot} />
              <Text style={styles.statsCardLabel}>PENDING</Text>
            </View>
            <Text style={styles.statsCardValue}>{stats.pendingQueue}</Text>
            <Text style={styles.statsCardSubtext}>Verification Queue</Text>
          </View>

          {/* Scans Today Card */}
          <View style={styles.statsCard}>
            <View style={styles.statsCardHeader}>
              <Text style={styles.statsCardLabel}>SCANS TODAY</Text>
              <View style={styles.trendBadge}>
                <Ionicons
                  name={stats.scansTrend >= 0 ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={stats.scansTrend >= 0 ? theme.colors.success : theme.colors.error}
                />
                <Text
                  style={[
                    styles.trendText,
                    stats.scansTrend < 0 ? styles.trendTextNegative : null,
                  ]}
                >
                  {stats.scansTrend}
                </Text>
              </View>
            </View>
            <Text style={styles.statsCardValue}>{stats.scansToday}</Text>
            <Text style={styles.statsCardSubtext}>Processed Scans</Text>
          </View>
        </View>

        <View style={styles.statusStrip}>
          <View style={styles.statusItem}>
            <Ionicons name="layers-outline" size={16} color={theme.colors.success} />
            <Text style={styles.statusText}>ACTIVE DISTRIBUTIONS: {stats.activeDistributions}</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="checkmark-done-outline" size={16} color={theme.colors.success} />
            <Text style={styles.statusText}>CONFIRMED TODAY: {stats.confirmedClaimsToday}</Text>
          </View>
        </View>

        {/* System Status Strip */}
        <View style={styles.statusStrip}>
          <View style={styles.statusItem}>
            <Ionicons name="checkmark" size={16} color={theme.colors.success} />
            <Text style={styles.statusText}>AUTHENTICATED</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="checkmark" size={16} color={theme.colors.success} />
            <Text style={styles.statusText}>SCANNER READY</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="checkmark" size={16} color={theme.colors.success} />
            <Text style={styles.statusText}>ACTIVE</Text>
          </View>
        </View>

        {/* Live Distributions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>LIVE DISTRIBUTIONS</Text>
          <View style={styles.sectionDivider} />
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {!loading && featuredDistribution && (
          <View style={styles.distributionCard}>
            <View style={styles.distributionHeader}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE NOW</Text>
              </View>
              <Text style={styles.distributionTime}>Started {featuredDistribution.startTime}</Text>
            </View>

            <Text style={styles.distributionTitle}>{featuredDistribution.title}</Text>

            <View style={styles.distributionInfo}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>COVERAGE</Text>
                  <Text style={styles.infoValue}>
                    {featuredDistribution.coverage.length > 1
                      ? `Zones ${featuredDistribution.coverage.slice(0, 3).join(', ')} (Priority)`
                      : featuredDistribution.coverage[0]}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>SCHEDULE</Text>
                  <Text style={styles.infoValue}>{featuredDistribution.schedule}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="people-outline" size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>HOUSEHOLDS</Text>
                  <Text style={styles.infoValue}>
                    {featuredDistribution.claimedHouseholds} claimed / {featuredDistribution.registeredHouseholds} registered
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.distributionFooter}>
              {featuredDistribution.isUrgent && (
                <View style={styles.urgentIndicator}>
                  <Text style={styles.urgentIcon}>!</Text>
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              )}
              <Button
                variant="outline"
                title="Details"
                icon="arrow-forward"
                size="sm"
                onPress={() =>
                  Alert.alert(
                    featuredDistribution.title,
                    `Coverage: ${featuredDistribution.coverage.join(', ')}\nSchedule: ${featuredDistribution.schedule}`
                  )
                }
              />
            </View>
          </View>
        )}

        {!loading && distributions.length === 0 && (
          <View style={[styles.emptyState, { paddingHorizontal: 32 }]}>
            <View style={{ backgroundColor: theme.colors.divider, padding: 24, borderRadius: 50, marginBottom: 24 }}>
              <Ionicons name="radio-outline" size={48} color={theme.colors.textMuted} />
            </View>
            <Typography variant="h3" weight="semiBold" align="center">No live distributions</Typography>
            <Typography variant="body" color={theme.colors.textSecondary} align="center" style={{ marginTop: 8 }}>
              Distributions will appear here when they go live.
            </Typography>
          </View>
        )}
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={showNotificationsModal}
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <Pressable style={styles.notificationsOverlay} onPress={() => setShowNotificationsModal(false)}>
          <Pressable style={styles.notificationsCard} onPress={() => undefined}>
            <View style={styles.notificationsHeader}>
              <Text style={styles.notificationsTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {notificationsLoading ? (
              <View style={styles.notificationsLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : notifications.length === 0 ? (
              <Text style={styles.notificationsEmpty}>No notifications found.</Text>
            ) : (
              <ScrollView>
                {notifications.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.notificationsItem}
                    onPress={() => handleNotificationPress(item)}
                  >
                    <View
                      style={[
                        styles.notificationsItemDot,
                        item.isRead && styles.notificationsItemDotRead,
                      ]}
                    />
                    <View style={styles.notificationsItemContent}>
                      <Text style={styles.notificationsItemTitle}>{item.title || 'Notification'}</Text>
                      <Text style={styles.notificationsItemMessage}>
                        {item.message || 'You have an update.'}
                      </Text>
                      {item.createdAt ? (
                        <Text style={styles.notificationsItemDate}>
                          {new Date(item.createdAt).toLocaleString('en-US')}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNavContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.bottomNavItem}>
            <Ionicons name="home" size={22} color={theme.colors.primary} />
            <Text style={[styles.bottomNavText, styles.bottomNavTextActive]}>HOME</Text>
          </TouchableOpacity>
          <View style={styles.bottomNavPlaceholder} />
          <TouchableOpacity style={styles.bottomNavItem} onPress={() => onNavigate?.('profile')}>
            <Ionicons name="person-outline" size={22} color={theme.colors.textMuted} />
            <Text style={styles.bottomNavText}>PROFILE</Text>
          </TouchableOpacity>
        </View>
        
        {/* Floating QR Button */}
        <TouchableOpacity style={styles.floatingQrButton} onPress={() => onNavigate?.('qr')}>
          <Ionicons name="qr-code-outline" size={26} color={theme.colors.surface} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    backgroundColor: theme.colors.surface,
  },
  headerLeft: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  staffBadge: {
    backgroundColor: theme.colors.divider,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 10,
  },
  staffBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 8,
  },
  syncText: {
    fontSize: 13,
    color: '#6B7280',
  },
  syncSeparator: {
    fontSize: 13,
    color: '#D1D5DB',
    marginHorizontal: 8,
  },
  scopeText: {
    marginTop: 8,
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  notificationsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  notificationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    maxHeight: '68%',
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  notificationsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  notificationsLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  notificationsEmpty: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  notificationsItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationsItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginTop: 6,
    marginRight: 10,
  },
  notificationsItemDotRead: {
    backgroundColor: '#D1D5DB',
  },
  notificationsItemContent: {
    flex: 1,
  },
  notificationsItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  notificationsItemMessage: {
    marginTop: 2,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  notificationsItemDate: {
    marginTop: 4,
    fontSize: 11,
    color: '#9CA3AF',
  },

  // Progress Card
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  progressTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressCount: {
    fontSize: 15,
    color: '#4B5563',
  },
  progressCountBold: {
    fontWeight: '700',
    color: '#1F2937',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 5,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 16,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    marginRight: 6,
  },
  statsCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  statsCardValue: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statsCardSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
    marginLeft: 2,
  },
  trendTextNegative: {
    color: '#EF4444',
  },

  // Status Strip
  statusStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAF9',
    marginHorizontal: 24,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginLeft: 6,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 28,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginRight: 16,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  // Distribution Card
  distributionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  distributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 8,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  distributionTime: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  distributionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  distributionInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  distributionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  urgentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgentIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    marginRight: 6,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16A34A',
    marginRight: 4,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
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
    flex: 1,
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
