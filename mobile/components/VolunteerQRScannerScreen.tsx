import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { mobileAuthService } from '../services/auth/MobileAuthService';

interface VolunteerQRScannerScreenProps {
  onBack: () => void;
  onNavigate?: (screen: 'home' | 'qr' | 'profile') => void;
}

interface ResolvedResident {
  residentId: string;
  fullName?: string;
  maskedName?: string;
  alreadyClaimed?: boolean;
  fromCache?: boolean;
}

interface ResolveQrPayload {
  success: boolean;
  message?: string;
  data?: ResolvedResident;
}

interface ScannerDistribution {
  id: string;
  barangay: string;
  assignedBarangays?: string[];
  scheduled?: string;
  endsAt?: string;
  status?: string;
  lifecycleStatus?: 'Upcoming' | 'Active' | 'Completed' | 'Archived';
  registeredHouseholds?: number;
  claimedHouseholds?: number;
}
type ScannerTone = 'ready' | 'working' | 'success' | 'warning' | 'error';

function formatScheduleLabel(value?: string): string {
  if (!value) return 'No schedule yet';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getToneStyles(tone: ScannerTone) {
  if (tone === 'success') {
    return {
      chipBg: '#DCFCE7',
      chipText: '#166534',
      panelBg: '#F4FFF7',
      panelBorder: '#BBF7D0',
      icon: 'checkmark-circle' as const,
      iconColor: '#16A34A',
    };
  }

  if (tone === 'warning') {
    return {
      chipBg: '#FEF3C7',
      chipText: '#92400E',
      panelBg: '#FFFDF6',
      panelBorder: '#FCD34D',
      icon: 'alert-circle' as const,
      iconColor: '#D97706',
    };
  }

  if (tone === 'error') {
    return {
      chipBg: '#FEE2E2',
      chipText: '#B91C1C',
      panelBg: '#FFF8F8',
      panelBorder: '#FECACA',
      icon: 'close-circle' as const,
      iconColor: '#DC2626',
    };
  }

  if (tone === 'working') {
    return {
      chipBg: '#DBEAFE',
      chipText: '#1D4ED8',
      panelBg: '#F8FBFF',
      panelBorder: '#BFDBFE',
      icon: 'scan-circle' as const,
      iconColor: '#2563EB',
    };
  }

  return {
    chipBg: '#E2E8F0',
    chipText: '#334155',
    panelBg: '#FFFFFF',
    panelBorder: '#E2E8F0',
    icon: 'qr-code-outline' as const,
    iconColor: '#475569',
  };
}

export default function VolunteerQRScannerScreen({ onBack }: VolunteerQRScannerScreenProps) {
  const SCAN_COOLDOWN_MS = 1500;
  const [permission, requestPermission] = useCameraPermissions();
  const [isResolving, setIsResolving] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedResident, setResolvedResident] = useState<ResolvedResident | null>(null);
  const [resolveLatencyMs, setResolveLatencyMs] = useState<number | null>(null);
  const [activeDistribution, setActiveDistribution] = useState<ScannerDistribution | null>(null);
  const [activeDistributions, setActiveDistributions] = useState<ScannerDistribution[]>([]);
  const [nearestUpcoming, setNearestUpcoming] = useState<ScannerDistribution | null>(null);
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);
  const [claimStatusText, setClaimStatusText] = useState<string | null>(null);
  const lastScanRef = useRef<{ data: string; at: number } | null>(null);
  const toMaskedName = (rawName?: string): string => {
    const parts = String(rawName || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return 'Uxxxx Uxxxx';
    }

    if (parts.length === 1) {
      const firstInitial = parts[0][0]?.toUpperCase() || 'U';
      return `${firstInitial}xxxx`;
    }

    const firstInitial = parts[0][0]?.toUpperCase() || 'U';
    const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || 'U';
    return `${firstInitial}xxxx ${lastInitial}xxxx`;
  };

  useEffect(() => {
    return () => {
      lastScanRef.current = null;
    };
  }, []);

  useEffect(() => {
    const loadActiveDistributions = async () => {
      const response = await mobileAuthService.authenticatedRequest<{
        success: boolean;
        data?: {
          active: Array<ScannerDistribution & { _id?: string }>;
          nearestUpcoming?: (ScannerDistribution & { _id?: string }) | null;
        };
      }>('/distributions/scanner/active', { method: 'GET' });

      if (!response.success || !response.data?.success || !response.data.data) {
        setAssignmentMessage(response.error || 'Unable to load scanner assignments.');
        return;
      }

      const normalize = (item: ScannerDistribution & { _id?: string }): ScannerDistribution => ({
        ...item,
        id: item.id || item._id || '',
        assignedBarangays: item.assignedBarangays || [],
      });
      const active = (response.data.data.active || []).map(normalize).filter((item) => item.id);
      const upcoming = response.data.data.nearestUpcoming
        ? normalize(response.data.data.nearestUpcoming)
        : null;

      setActiveDistributions(active);
      setNearestUpcoming(upcoming);
      setActiveDistribution(active.length === 1 ? active[0] : null);
      setAssignmentMessage(
        active.length > 1
          ? 'Choose which active distribution this scanner should record claims against.'
          : active.length === 0 && upcoming
            ? `No active distribution. Your nearest assignment starts ${formatScheduleLabel(upcoming.scheduled)}.`
            : active.length === 0
              ? 'No active or upcoming distribution is explicitly assigned to this account.'
              : null,
      );
    };

    loadActiveDistributions().catch(() => {
      setAssignmentMessage('Unable to load scanner assignments.');
    });
  }, []);

  const playSuccessFeedback = async () => {    Vibration.vibrate(80);
  };

  const handleQrScanned = async ({ data }: { data: string }) => {
    if (!data || isResolving || hasScanned) {
      return;
    }

    const now = Date.now();
    if (
      lastScanRef.current &&
      lastScanRef.current.data === data &&
      now - lastScanRef.current.at < SCAN_COOLDOWN_MS
    ) {
      return;
    }

    lastScanRef.current = { data, at: now };
    Vibration.vibrate(40);

    setHasScanned(true);
    setIsResolving(true);
    setError(null);
    setResolvedResident(null);
    setResolveLatencyMs(null);
    setClaimStatusText(null);
    const startedAt = Date.now();

    const response = await mobileAuthService.authenticatedRequest<ResolveQrPayload>('/household/qr/resolve', {
      method: 'POST',
      body: JSON.stringify({
        qrData: data,
        distributionId: activeDistribution?.id,
      }),
    });

    if (!response.success || !response.data) {
      setError(response.error || 'Unable to resolve QR. Please try again.');
      setResolveLatencyMs(Date.now() - startedAt);
      setIsResolving(false);
      return;
    }

    if (!response.data.success || !response.data.data) {
      setError(response.data.message || 'Invalid resident QR.');
      setResolveLatencyMs(Date.now() - startedAt);
      setIsResolving(false);
      return;
    }

    const resident = response.data.data;
    setResolvedResident(resident);
    await playSuccessFeedback();
    setResolveLatencyMs(Date.now() - startedAt);

    if (activeDistribution?.id && resident.residentId && !resident.alreadyClaimed) {
      const claimResponse = await mobileAuthService.authenticatedRequest<{
        success: boolean;
        message?: string;
        alreadyClaimed?: boolean;
      }>('/household/qr/claim', {
        method: 'POST',
        body: JSON.stringify({
          residentId: resident.residentId,
          distributionId: activeDistribution.id,
        }),
      });

      if (claimResponse.success && claimResponse.data?.success) {
        setClaimStatusText(
          claimResponse.data.alreadyClaimed
            ? 'Resident already claimed for this distribution.'
            : 'Claim recorded. Relief can now be released.',
        );
        setResolvedResident((prev) => (prev ? { ...prev, alreadyClaimed: true } : prev));
      } else {
        setClaimStatusText(claimResponse.error || claimResponse.data?.message || 'Claim record failed.');
      }
    } else if (resident.alreadyClaimed) {
      setClaimStatusText('Resident already claimed for this distribution.');
    } else if (!activeDistribution?.id) {
      setClaimStatusText('Validation-only mode. No active distribution is selected for claim recording.');
    }

    setIsResolving(false);
  };

  const handleScanAgain = () => {
    setHasScanned(false);
    setError(null);
    setResolvedResident(null);
    setResolveLatencyMs(null);
    setClaimStatusText(null);
  };

  const displayedDistribution = activeDistribution || nearestUpcoming;
  const includedBarangays = displayedDistribution
    ? [displayedDistribution.barangay, ...(displayedDistribution.assignedBarangays || [])]
    : [];
  const coveredBarangayCount = Array.from(new Set(includedBarangays.filter(Boolean))).length;
  const claimCountText = displayedDistribution?.registeredHouseholds
    ? `${displayedDistribution.claimedHouseholds || 0}/${displayedDistribution.registeredHouseholds} claimed`
    : displayedDistribution?.claimedHouseholds
      ? `${displayedDistribution.claimedHouseholds} claimed`
      : 'No claim totals yet';

  let scannerTone: ScannerTone = 'ready';  if (isResolving) scannerTone = 'working';
  else if (error) scannerTone = 'error';
  else if (resolvedResident?.alreadyClaimed) scannerTone = 'warning';
  else if (resolvedResident) scannerTone = 'success';

  const tone = getToneStyles(scannerTone);

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBlock}>
          <ActivityIndicator color="#0F766E" />
          <Text style={styles.loadingText}>Preparing scanner...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.roundButton}>
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Claim Scanner</Text>
          <View style={styles.roundButtonGhost} />
        </View>

        <View style={styles.permissionWrap}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera-outline" size={30} color="#0F766E" />
          </View>
          <Text style={styles.permissionTitle}>Camera access is needed</Text>
          <Text style={styles.permissionText}>
            Allow camera access so volunteer accounts can scan resident QR codes during distribution.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.roundButton}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Claim Scanner</Text>
        <TouchableOpacity onPress={handleScanAgain} style={styles.roundButton}>
          <Ionicons name="refresh-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.eyebrow}>Distribution Scanning</Text>
              <Text style={styles.heroTitle}>Scan resident QR and confirm release</Text>
            </View>
            <View style={[styles.stateChip, { backgroundColor: tone.chipBg }]}>
              <Text style={[styles.stateChipText, { color: tone.chipText }]}>
                {scannerTone === 'working'
                  ? 'Checking'
                  : scannerTone === 'success'
                    ? 'Approved'
                    : scannerTone === 'warning'
                      ? 'Already Claimed'
                      : scannerTone === 'error'
                        ? 'Needs Retry'
                        : 'Ready'}
              </Text>
            </View>
          </View>

          <Text style={styles.heroSubtext}>
            Keep the QR inside the frame. Claims are recorded automatically when the resident is eligible for the active distribution.
          </Text>
        </View>

        <View style={styles.distributionCard}>
          <View style={styles.distributionTopRow}>
            <View style={styles.distributionHostBlock}>
              <Text style={styles.distributionLabel}>Active Host Barangay</Text>
              <Text style={styles.distributionHost}>{displayedDistribution?.barangay || 'No assigned distribution'}</Text>
            </View>
            <View style={styles.distributionModePill}>
              <Ionicons                name={activeDistribution ? 'radio-button-on' : 'alert-circle-outline'}
                size={14}
                color={activeDistribution ? '#0F766E' : '#B45309'}
              />
              <Text style={[styles.distributionModeText, { color: activeDistribution ? '#0F766E' : '#B45309' }]}>
                {activeDistribution ? 'Live Claim Mode' : 'Validation Only'}
              </Text>
            </View>
          </View>

          {activeDistributions.length > 1 && (
            <View style={styles.assignmentChooser}>
              <Text style={styles.assignmentChooserTitle}>Choose active distribution</Text>
              <View style={styles.assignmentChoices}>
                {activeDistributions.map((distribution) => (
                  <TouchableOpacity
                    key={distribution.id}
                    style={[
                      styles.assignmentChoice,
                      activeDistribution?.id === distribution.id && styles.assignmentChoiceSelected,
                    ]}
                    onPress={() => {
                      setActiveDistribution(distribution);
                      setAssignmentMessage(null);
                      handleScanAgain();
                    }}
                  >
                    <Text style={[
                      styles.assignmentChoiceTitle,
                      activeDistribution?.id === distribution.id && styles.assignmentChoiceTitleSelected,
                    ]}>
                      {distribution.barangay}
                    </Text>
                    <Text style={styles.assignmentChoiceTime}>{formatScheduleLabel(distribution.scheduled)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {!!assignmentMessage && (
            <View style={styles.assignmentNotice}>
              <Ionicons name="information-circle-outline" size={17} color="#B45309" />
              <Text style={styles.assignmentNoticeText}>{assignmentMessage}</Text>
            </View>
          )}

          <View style={styles.distributionMetaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Schedule</Text>
              <Text style={styles.metaValue}>{formatScheduleLabel(displayedDistribution?.scheduled)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Coverage</Text>              <Text style={styles.metaValue}>{coveredBarangayCount || 0} barangays</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Progress</Text>
              <Text style={styles.metaValue}>{claimCountText}</Text>
            </View>
          </View>

          {includedBarangays.length > 0 && (
            <View style={styles.coverageWrap}>
              {Array.from(new Set(includedBarangays)).map((item) => (
                <View key={item} style={styles.coverageChip}>
                  <Text style={styles.coverageChipText}>{item}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.scannerCard}>
          <View style={styles.scannerHeader}>
            <View>
              <Text style={styles.scannerTitle}>Live QR Frame</Text>
              <Text style={styles.scannerHint}>
                {hasScanned ? 'Scanner is paused until you reset.' : 'Position the code inside the frame for fast validation.'}
              </Text>
            </View>
            <View style={styles.scannerBadge}>
              <Text style={styles.scannerBadgeText}>{hasScanned ? 'Paused' : 'Scanning'}</Text>
            </View>
          </View>

          <View style={styles.cameraShell}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={hasScanned ? undefined : handleQrScanned}
            />

            <View style={styles.cameraShadeTop} />
            <View style={styles.cameraShadeBottom}>
              <Text style={styles.overlayCaption}>Align permanent resident QR inside the scan area</Text>
            </View>

            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
              {!hasScanned && <View style={styles.scanLine} />}
            </View>
          </View>
        </View>

        <View style={[styles.feedbackCard, { backgroundColor: tone.panelBg, borderColor: tone.panelBorder }]}>
          <View style={styles.feedbackHeader}>
            <View style={[styles.feedbackIconWrap, { backgroundColor: tone.chipBg }]}>
              {isResolving ? (
                <ActivityIndicator size="small" color={tone.iconColor} />
              ) : (
                <Ionicons name={tone.icon} size={22} color={tone.iconColor} />
              )}
            </View>
            <View style={styles.feedbackTextWrap}>
              <Text style={styles.feedbackTitle}>
                {isResolving
                  ? 'Checking resident eligibility'
                  : error
                    ? 'Scanner needs another try'
                    : resolvedResident?.alreadyClaimed
                      ? 'Resident already claimed'
                      : resolvedResident
                        ? 'Resident verified'
                        : 'Ready for the next scan'}
              </Text>
              <Text style={styles.feedbackSubtitle}>
                {isResolving
                  ? 'We are resolving the QR and validating the active distribution.'
                  : error
                    ? error
                    : resolvedResident
                      ? claimStatusText || 'Resident record resolved successfully.'
                      : activeDistribution
                        ? 'The scanner is linked to the current active distribution.'
                        : 'No active distribution is selected, so scans will only validate the resident.'}
              </Text>
            </View>
          </View>

          {!isResolving && resolvedResident && (
            <View style={styles.personCard}>
              <View style={styles.personAvatar}>
                <Text style={styles.personAvatarText}>
                  {(resolvedResident.maskedName || toMaskedName(resolvedResident.fullName)).slice(0, 1)}
                </Text>
              </View>
              <View style={styles.personBody}>
                <Text style={styles.personName}>
                  {resolvedResident.maskedName || toMaskedName(resolvedResident.fullName)}
                </Text>
                <Text style={styles.personMeta}>
                  {resolvedResident.fromCache ? 'Resolved from offline cache' : 'Resolved from live server'}
                </Text>
                {resolveLatencyMs !== null && (
                  <Text style={styles.personMeta}>Response time: {resolveLatencyMs} ms</Text>
                )}
              </View>
            </View>
          )}

          {!isResolving && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleScanAgain}>
              <Text style={styles.primaryButtonText}>
                {resolvedResident || error ? 'Scan Next Resident' : 'Reset Scanner'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tipsCard}>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#0F766E" />
            <Text style={styles.tipText}>Use good lighting and hold the device steady for faster reads.</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="people-outline" size={18} color="#0F766E" />
            <Text style={styles.tipText}>The selected distribution covers the host barangay plus the listed additional barangays.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#F4F7F3',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roundButtonGhost: {
    width: 40,
    height: 40,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#0F766E',
    letterSpacing: 1.1,
  },
  heroTitle: {
    marginTop: 6,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.6,
    maxWidth: '82%',
  },
  heroSubtext: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: '#475569',
  },
  stateChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  stateChipText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  distributionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  distributionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  distributionHostBlock: {
    flex: 1,
  },
  distributionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  distributionHost: {
    marginTop: 5,
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  distributionModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  distributionModeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  assignmentChooser: {
    gap: 10,
  },
  assignmentChooserTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  assignmentChoices: {
    gap: 8,
  },
  assignmentChoice: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  assignmentChoiceSelected: {
    borderColor: '#0F766E',
    backgroundColor: '#F0FDFA',
  },
  assignmentChoiceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  assignmentChoiceTitleSelected: {
    color: '#0F766E',
  },
  assignmentChoiceTime: {
    marginTop: 3,
    fontSize: 11,
    color: '#64748B',
  },
  assignmentNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 14,
    padding: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  assignmentNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#92400E',
  },
  distributionMetaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metaValue: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  coverageWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  coverageChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  coverageChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  scannerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 28,
    padding: 16,
    gap: 14,
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start',
  },
  scannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  scannerHint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: '#CBD5E1',
    maxWidth: 220,
  },
  scannerBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  scannerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cameraShell: {
    width: '100%',
    aspectRatio: 0.92,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#020617',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraShadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: 'rgba(2,6,23,0.28)',
  },
  cameraShadeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 18,
    paddingHorizontal: 20,
    paddingTop: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(2,6,23,0.36)',
  },
  overlayCaption: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  scanFrame: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    top: '18%',
    bottom: '22%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: '46%',
    height: 3,
    borderRadius: 999,
    backgroundColor: '#34D399',
    opacity: 0.95,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#34D399',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 22,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 22,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 22,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 22,
  },
  feedbackCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  feedbackIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTextWrap: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  feedbackSubtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: '#475569',
  },
  personCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personAvatarText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  personBody: {
    flex: 1,
  },
  personName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  personMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#475569',
  },
  loadingBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '600',
  },
  permissionWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  permissionTitle: {
    marginTop: 14,
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  permissionText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    color: '#475569',
  },
  primaryButton: {
    backgroundColor: '#0F766E',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
