import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ResidentDistributionItem } from '../services/api/ResidentQrService';
import { residentTheme } from '../theme';
import BottomNavigation from './ui/BottomNavigation';

const residentColors = residentTheme.colors;

interface DistributionScreenProps {
  barangayName?: string;
  distributionItems?: ResidentDistributionItem[];
  isDistributionLoading?: boolean;
  isDistributionRefreshing?: boolean;
  distributionError?: string | null;
  distributionWarning?: string | null;
  distributionFetchedAt?: string | null;
  onRefreshDistributions?: (force?: boolean) => Promise<void>;
  onNavigate?: (screen: 'home' | 'distributions' | 'profile') => void;
}

interface DistributionView extends ResidentDistributionItem {
  key: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  monthLabel: string;
  dayLabel: string;
  location: string;
  coverage: string;
}

function formatDistribution(item: ResidentDistributionItem, index: number): DistributionView {
  const rawSchedule = item.scheduled?.trim() || '';
  const parsed = rawSchedule ? new Date(rawSchedule) : null;
  const validDate = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  const dateLabel = validDate
    ? validDate.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
    : rawSchedule || 'Schedule to be announced';
  const parsedEnd = item.endsAt ? new Date(item.endsAt) : null;
  const validEnd = parsedEnd && !Number.isNaN(parsedEnd.getTime()) ? parsedEnd : null;
  const timeLabel = validDate
    ? [
        validDate.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }),
        validEnd?.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }),
      ].filter(Boolean).join(' – ')
    : '';
  const coverageList = Array.from(new Set([item.barangay, ...(item.assignedBarangays || [])])).filter(Boolean);

  return {
    ...item,
    key: item.id || `${item.barangay}-${item.createdAt || index}`,
    title: item.residentClaimed
      ? 'Relief distribution claimed'
      : item.lifecycleStatus === 'Active'
        ? 'Distribution is open'
        : 'Upcoming relief distribution',
    dateLabel,
    timeLabel,
    monthLabel: validDate ? validDate.toLocaleDateString('en-PH', { month: 'short' }).toUpperCase() : 'DATE',
    dayLabel: validDate ? String(validDate.getDate()) : '—',
    location: `${item.barangay} Covered Court`,
    coverage: coverageList.join(', '),
  };
}

export default function DistributionScreen({
  barangayName,
  distributionItems = [],
  isDistributionLoading = false,
  isDistributionRefreshing = false,
  distributionError = null,
  distributionWarning = null,
  distributionFetchedAt = null,
  onRefreshDistributions,
  onNavigate,
}: DistributionScreenProps) {
  const insets = useSafeAreaInsets();
  const items = useMemo(
    () => distributionItems.map(formatDistribution),
    [distributionItems],
  );
  const [selected, setSelected] = useState<DistributionView | null>(null);
  const activeCount = items.filter((item) => item.lifecycleStatus === 'Active').length;
  const upcomingCount = items.length - activeCount;

  const onRefresh = useCallback(async () => {
    if (isDistributionRefreshing || !onRefreshDistributions) return;
    await onRefreshDistributions(true);
  }, [isDistributionRefreshing, onRefreshDistributions]);

  const updatedLabel = useMemo(() => {
    if (!distributionFetchedAt) return 'UPDATED';
    const parsed = new Date(distributionFetchedAt);
    if (Number.isNaN(parsed.getTime())) return 'UPDATED';
    return `UPDATED ${parsed.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}`;
  }, [distributionFetchedAt]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 12) + 84 }]}
        refreshControl={(
          <RefreshControl
            refreshing={isDistributionRefreshing}
            onRefresh={onRefresh}
            tintColor={residentColors.icon}
            colors={[residentColors.icon]}
          />
        )}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>RELIEF SCHEDULES</Text>
            <Text style={styles.title}>Distributions</Text>
            <Text style={styles.subtitle}>
              {barangayName ? `Available for ${barangayName}` : 'Schedules available for your registered area'}
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="calendar-outline" size={24} color={residentColors.icon} />
          </View>
        </View>

        {!isDistributionLoading && !distributionError ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              {activeCount > 0 ? `${activeCount} active` : `${upcomingCount} upcoming`}
              {activeCount > 0 && upcomingCount > 0 ? ` • ${upcomingCount} upcoming` : ''}
            </Text>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{updatedLabel}</Text>
            </View>
          </View>
        ) : null}

        {distributionWarning ? (
          <View style={styles.warningCard}>
            <Ionicons name="cloud-offline-outline" size={18} color="#9A6700" />
            <Text style={styles.warningText}>{distributionWarning}</Text>
          </View>
        ) : null}

        {isDistributionLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={residentColors.icon} />
            <Text style={styles.stateText}>Loading schedules…</Text>
          </View>
        ) : distributionError ? (
          <View style={styles.stateCard}>
            <View style={styles.stateIcon}>
              <Ionicons name="cloud-offline-outline" size={24} color={residentColors.icon} />
            </View>
            <Text style={styles.stateTitle}>Schedules unavailable</Text>
            <Text style={styles.stateText}>{distributionError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRefresh}
              disabled={isDistributionRefreshing || !onRefreshDistributions}
            >
              <Ionicons name="refresh" size={16} color={residentColors.inverse} />
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.stateIcon}>
              <Ionicons name="calendar-clear-outline" size={24} color={residentColors.icon} />
            </View>
            <Text style={styles.stateTitle}>No active schedules</Text>
            <Text style={styles.stateText}>We’ll notify you when a relief distribution is announced.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.distributionCard}
                activeOpacity={0.78}
                onPress={() => setSelected(item)}
              >
                <View style={styles.dateTile}>
                  <Text style={styles.dateMonth}>{item.monthLabel}</Text>
                  <Text style={styles.dateDay}>{item.dayLabel}</Text>
                </View>
                <View style={styles.cardCopy}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    {item.lifecycleStatus === 'Active' ? (
                      <View style={styles.claimedPill}>
                        <View style={styles.liveDot} />
                        <Text style={styles.claimedText}>ACTIVE</Text>
                      </View>
                    ) : item.residentClaimed ? (
                      <View style={styles.claimedPill}>
                        <Ionicons name="checkmark" size={11} color={residentColors.icon} />
                        <Text style={styles.claimedText}>CLAIMED</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={14} color={residentColors.icon} />
                    <Text style={styles.metaText}>{item.timeLabel || item.dateLabel}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={14} color={residentColors.icon} />
                    <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={19} color={residentColors.icon} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={selected !== null}
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelected(null)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleCopy}>
                <Text style={styles.modalEyebrow}>DISTRIBUTION DETAILS</Text>
                <Text style={styles.modalTitle}>{selected?.title}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelected(null)}>
                <Ionicons name="close" size={20} color={residentColors.icon} />
              </TouchableOpacity>
            </View>

            {[
              { icon: 'calendar-outline' as const, label: 'Schedule', value: `${selected?.dateLabel || ''}${selected?.timeLabel ? ` • ${selected.timeLabel}` : ''}` },
              { icon: 'location-outline' as const, label: 'Location', value: selected?.location || 'To be announced' },
              { icon: 'map-outline' as const, label: 'Covered barangays', value: selected?.coverage || 'Not specified' },
            ].map((detail) => (
              <View key={detail.label} style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name={detail.icon} size={18} color={residentColors.icon} />
                </View>
                <View style={styles.detailCopy}>
                  <Text style={styles.detailLabel}>{detail.label}</Text>
                  <Text style={styles.detailValue}>{detail.value}</Text>
                </View>
              </View>
            ))}

            {selected?.notes ? (
              <View style={styles.notesBox}>
                <Text style={styles.detailLabel}>Important note</Text>
                <Text style={styles.notesText}>{selected.notes}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.doneButton} onPress={() => setSelected(null)}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <BottomNavigation activeTab="distributions" onNavigate={onNavigate} appearance="resident" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: residentColors.background },
  content: { paddingHorizontal: 20, paddingTop: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerCopy: { flex: 1, paddingRight: 16 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: residentColors.secondary },
  title: { marginTop: 5, fontSize: 28, lineHeight: 34, fontWeight: '800', color: residentColors.ink },
  subtitle: { marginTop: 5, fontSize: 13, lineHeight: 19, color: residentColors.secondary },
  headerIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: residentColors.iconSurface, borderWidth: 1, borderColor: residentColors.borderAccent },
  summaryRow: { marginTop: 24, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryText: { fontSize: 14, fontWeight: '700', color: residentColors.ink },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: residentColors.accentSoft, borderWidth: 1, borderColor: residentColors.accent },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: residentColors.brand },
  liveText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8, color: residentColors.ink },
  warningCard: { marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#F4D58D' },
  warningText: { flex: 1, fontSize: 11.5, lineHeight: 16, color: '#76520A' },
  list: { gap: 10 },
  distributionCard: { minHeight: 104, padding: 13, flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: residentColors.surface, borderWidth: 1, borderColor: residentColors.borderAccent, ...residentTheme.shadow },
  dateTile: { width: 58, height: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: residentColors.accentSoft, borderWidth: 1, borderColor: residentColors.accent },
  dateMonth: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8, color: residentColors.accentInk },
  dateDay: { marginTop: 2, fontSize: 24, lineHeight: 28, fontWeight: '800', color: residentColors.ink },
  cardCopy: { flex: 1, marginLeft: 13, marginRight: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: residentColors.ink },
  claimedPill: { paddingHorizontal: 6, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 999, backgroundColor: residentColors.surfaceMuted },
  claimedText: { fontSize: 7, fontWeight: '900', letterSpacing: 0.4, color: residentColors.ink },
  metaRow: { marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { flex: 1, fontSize: 11.5, color: residentColors.secondary },
  stateCard: { marginTop: 24, minHeight: 260, padding: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: residentColors.surface, borderWidth: 1, borderColor: residentColors.borderAccent, ...residentTheme.shadow },
  stateIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: residentColors.iconSurface, borderWidth: 1, borderColor: residentColors.borderAccent },
  stateTitle: { marginTop: 14, fontSize: 17, fontWeight: '800', color: residentColors.ink },
  stateText: { marginTop: 7, fontSize: 13, lineHeight: 19, color: residentColors.secondary, textAlign: 'center' },
  retryButton: { marginTop: 16, minHeight: 42, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 12, backgroundColor: residentColors.brand },
  retryText: { color: residentColors.inverse, fontSize: 13, fontWeight: '800' },
  modalOverlay: { flex: 1, padding: 20, justifyContent: 'flex-end', backgroundColor: residentColors.overlay },
  modalCard: { padding: 20, paddingBottom: 24, borderRadius: 24, backgroundColor: residentColors.surface, borderWidth: 1, borderColor: residentColors.borderAccent },
  modalHandle: { width: 42, height: 4, alignSelf: 'center', borderRadius: 2, backgroundColor: residentColors.border },
  modalHeader: { marginTop: 17, marginBottom: 20, flexDirection: 'row', alignItems: 'flex-start' },
  modalTitleCopy: { flex: 1, paddingRight: 12 },
  modalEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1, color: residentColors.secondary },
  modalTitle: { marginTop: 4, fontSize: 20, lineHeight: 25, fontWeight: '800', color: residentColors.ink },
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: residentColors.iconSurface, borderWidth: 1, borderColor: residentColors.borderAccent },
  detailRow: { paddingVertical: 11, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: residentColors.divider },
  detailIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: residentColors.iconSurface, borderWidth: 1, borderColor: residentColors.borderAccent },
  detailCopy: { flex: 1, marginLeft: 11 },
  detailLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', color: residentColors.secondary },
  detailValue: { marginTop: 3, fontSize: 13, lineHeight: 18, fontWeight: '600', color: residentColors.ink },
  notesBox: { marginTop: 10, padding: 13, borderRadius: 12, backgroundColor: residentColors.surfaceMuted },
  notesText: { marginTop: 5, fontSize: 12, lineHeight: 18, color: residentColors.secondary },
  doneButton: { marginTop: 18, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: residentColors.brand },
  doneText: { color: residentColors.inverse, fontSize: 14, fontWeight: '800' },
});
