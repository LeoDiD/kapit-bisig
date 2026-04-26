import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Typography } from './ui/Typography';
import { theme } from '../theme';
import {
  fetchOpenBeneficiaryDistributions,
  getQueuedResidentProofSubmissions,
  getResidentToken,
  ResidentBeneficiaryDistribution,
  submitResidentProofSubmission,
  syncQueuedResidentProofSubmissions,
} from '../services/api/ResidentQrService';

type DamageType = 'Flood' | 'House Damage' | 'Storm Surge' | 'Landslide' | 'Livelihood Loss' | 'Other';
type RequirementTone = 'ready' | 'pending' | 'warning';

type ProofPhoto = {
  id: string;
  uri: string;
};

const DAMAGE_TYPES: DamageType[] = [
  'Flood',
  'House Damage',
  'Storm Surge',
  'Landslide',
  'Livelihood Loss',
  'Other',
];

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 5;

function buildClientId(): string {
  return `resident-proof-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function RequirementPill({ label, tone }: { label: string; tone: RequirementTone }) {
  return (
    <View
      style={[
        styles.requirementPill,
        tone === 'ready' && styles.requirementPillReady,
        tone === 'pending' && styles.requirementPillPending,
        tone === 'warning' && styles.requirementPillWarning,
      ]}
    >
      <Text
        style={[
          styles.requirementPillText,
          tone === 'ready' && styles.requirementPillTextReady,
          tone === 'pending' && styles.requirementPillTextPending,
          tone === 'warning' && styles.requirementPillTextWarning,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

async function imageUriToDataUrl(uri: string): Promise<string> {
  const extensionMatch = uri.match(/\.(png|webp)$/i);
  const mimeType = extensionMatch?.[1]?.toLowerCase() === 'png'
    ? 'image/png'
    : extensionMatch?.[1]?.toLowerCase() === 'webp'
      ? 'image/webp'
      : 'image/jpeg';

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return `data:${mimeType};base64,${base64}`;
}

function formatSchedule(value?: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return 'Schedule to be announced';
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  return parsed.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatShortDate(value?: string | null): string | null {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  });
}

function getDistributionChipLabel(distribution: ResidentBeneficiaryDistribution): string {
  const shortDate = formatShortDate(distribution.scheduled);
  return shortDate ? `${distribution.barangay} | ${shortDate}` : distribution.barangay;
}

function getApplicationTone(
  status?: ResidentBeneficiaryDistribution['applicationStatus'],
): RequirementTone {
  switch (status) {
    case 'Approved':
      return 'ready';
    case 'Rejected':
      return 'warning';
    case 'Pending Verification':
    case 'Not Submitted':
    default:
      return 'pending';
  }
}

function getApplicationLabel(
  status?: ResidentBeneficiaryDistribution['applicationStatus'],
): string {
  switch (status) {
    case 'Approved':
      return 'Approved';
    case 'Rejected':
      return 'Needs update';
    case 'Pending Verification':
      return 'Pending review';
    case 'Not Submitted':
    default:
      return 'Not submitted';
  }
}

function getPrimaryActionLabel(
  status: ResidentBeneficiaryDistribution['applicationStatus'] | 'Not Submitted',
  submitting: boolean,
): string {
  if (submitting) {
    return 'Submitting...';
  }

  if (status === 'Approved') {
    return 'Already approved';
  }

  if (status === 'Rejected') {
    return 'Resubmit proof';
  }

  if (status === 'Pending Verification') {
    return 'Update proof';
  }

  return 'Send proof';
}

interface ResidentProofRequestScreenProps {
  onBack: () => void;
}

export default function ResidentProofRequestScreen({ onBack }: ResidentProofRequestScreenProps) {
  const insets = useSafeAreaInsets();
  const [openDistributions, setOpenDistributions] = useState<ResidentBeneficiaryDistribution[]>([]);
  const [distributionLoading, setDistributionLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDistributionId, setSelectedDistributionId] = useState<string | null>(null);
  const [selectedDamageType, setSelectedDamageType] = useState<DamageType>('Flood');
  const [description, setDescription] = useState('');
  const [supportingInfo, setSupportingInfo] = useState('');
  const [showSupportingInfo, setShowSupportingInfo] = useState(false);
  const [photos, setPhotos] = useState<ProofPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);

  const selectedDistribution = openDistributions.find((item) => item.id === selectedDistributionId)
    ?? openDistributions[0]
    ?? null;

  const trimmedDescriptionLength = description.trim().length;
  const descriptionReady = trimmedDescriptionLength >= 10;
  const photosReady = photos.length >= MIN_PHOTOS;
  const distributionReady = Boolean(selectedDistribution);
  const completedRequirementCount = [distributionReady, descriptionReady, photosReady].filter(Boolean).length;
  const remainingPhotos = Math.max(0, MIN_PHOTOS - photos.length);
  const selectedStatus = selectedDistribution?.applicationStatus ?? 'Not Submitted';
  const alreadyApproved = selectedStatus === 'Approved';
  const submitDisabled = submitting || distributionLoading || !selectedDistribution || alreadyApproved;
  const footerPadding = Math.max(insets.bottom, theme.spacing.md);
  const hasSupportingInfo = supportingInfo.trim().length > 0;
  const showingSupportingInfo = showSupportingInfo || hasSupportingInfo;

  const missingItems = [
    !distributionReady ? 'choose a distribution' : null,
    !descriptionReady ? 'add a short description' : null,
    !photosReady ? `attach ${remainingPhotos} more photo${remainingPhotos === 1 ? '' : 's'}` : null,
  ].filter(Boolean) as string[];

  const footerMessage = alreadyApproved
    ? 'This distribution already has an approved proof request.'
    : missingItems.length === 0
      ? 'Everything looks ready for admin review.'
      : `Before sending, ${missingItems.join(', ')}.`;

  const loadScreenData = useCallback(async () => {
    setDistributionLoading(true);
    try {
      const token = await getResidentToken();
      if (!token) {
        setOpenDistributions([]);
        setSelectedDistributionId(null);
        setQueuedCount(0);
        return;
      }

      const [distributionResult, syncResult, queue] = await Promise.all([
        fetchOpenBeneficiaryDistributions(token),
        syncQueuedResidentProofSubmissions(token),
        getQueuedResidentProofSubmissions(),
      ]);

      const nextDistributions = distributionResult.success ? distributionResult.data ?? [] : [];
      setOpenDistributions(nextDistributions);
      setSelectedDistributionId((current) => (
        nextDistributions.some((item) => item.id === current)
          ? current
          : nextDistributions[0]?.id ?? null
      ));
      setQueuedCount(queue.length);

      if (syncResult.success && syncResult.syncedCount > 0) {
        const refreshedQueue = await getQueuedResidentProofSubmissions();
        setQueuedCount(refreshedQueue.length);
      }
    } finally {
      setDistributionLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScreenData().catch(() => {
      setDistributionLoading(false);
    });
  }, [loadScreenData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadScreenData();
    } finally {
      setRefreshing(false);
    }
  }, [loadScreenData]);

  const appendAssets = useCallback((uris: string[]) => {
    setPhotos((current) => {
      const next = [...current];
      for (const uri of uris) {
        if (next.length >= MAX_PHOTOS) break;
        if (next.some((item) => item.uri === uri)) continue;
        next.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          uri,
        });
      }
      return next;
    });
  }, []);

  const pickFromGallery = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow media library access to attach proof photos.');
      return;
    }

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      Alert.alert('Photo limit reached', `You can only upload up to ${MAX_PHOTOS} proof photos.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7,
    });

    if (!result.canceled) {
      appendAssets(result.assets.map((asset) => asset.uri));
    }
  }, [appendAssets, photos.length]);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to capture proof photos.');
      return;
    }

    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Photo limit reached', `You can only upload up to ${MAX_PHOTOS} proof photos.`);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      appendAssets([result.assets[0].uri]);
    }
  }, [appendAssets, photos.length]);

  const removePhoto = useCallback((id: string) => {
    setPhotos((current) => current.filter((item) => item.id !== id));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedDistribution) {
      Alert.alert('No open distribution', 'There is no open relief distribution available for proof submission right now.');
      return;
    }

    if (selectedDistribution.applicationStatus === 'Approved') {
      Alert.alert('Already approved', 'This distribution already has an approved proof request.');
      return;
    }

    if (description.trim().length < 10) {
      Alert.alert('Description required', 'Please describe the damage in at least 10 characters.');
      return;
    }

    if (photos.length < MIN_PHOTOS) {
      Alert.alert('More photos needed', `Please attach at least ${MIN_PHOTOS} proof photos.`);
      return;
    }

    const token = await getResidentToken();
    if (!token) {
      Alert.alert('Login required', 'Please log in again before submitting a proof request.');
      return;
    }

    setSubmitting(true);
    try {
      const photoProofs = await Promise.all(photos.map((item) => imageUriToDataUrl(item.uri)));
      const result = await submitResidentProofSubmission(token, {
        distributionId: selectedDistribution.id,
        damageType: selectedDamageType,
        description: description.trim(),
        supportingInfo: supportingInfo.trim(),
        dateSubmitted: new Date().toISOString(),
        photoProofs,
        clientGeneratedId: buildClientId(),
      });

      if (!result.success) {
        Alert.alert('Submission failed', result.message || 'Unable to submit proof right now.');
        return;
      }

      const updatedQueue = await getQueuedResidentProofSubmissions();
      setQueuedCount(updatedQueue.length);

      Alert.alert(
        result.queued ? 'Saved offline' : 'Submitted',
        result.message || (result.queued
          ? 'Your request was saved offline and will sync automatically.'
          : 'Your proof submission is now pending admin verification.'),
      );

      setDescription('');
      setSupportingInfo('');
      setShowSupportingInfo(false);
      setPhotos([]);
      setSelectedDamageType('Flood');

      if (!result.queued) {
        await loadScreenData();
      }
    } catch (error) {
      Alert.alert('Submission failed', error instanceof Error ? error.message : 'Unable to submit proof right now.');
    } finally {
      setSubmitting(false);
    }
  }, [description, loadScreenData, photos, selectedDamageType, selectedDistribution, supportingInfo]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          )}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerTextWrap}>
              <Typography variant="label" color={theme.colors.textMuted}>Resident Request</Typography>
              <Typography variant="h3" weight="semiBold">Send proof</Typography>
              <Typography variant="body" color={theme.colors.textSecondary}>
                Choose a relief distribution, add a short damage note, and upload clear photos.
              </Typography>
            </View>
          </View>

          <Card variant="outlined" padding="md" style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryIcon}>
                <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.primaryDark} />
              </View>
              <View style={styles.summaryCopy}>
                <Typography variant="label" color={theme.colors.textMuted}>Target Beneficiary</Typography>
                <Typography variant="body" weight="semiBold">One application per distribution</Typography>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  When a new distribution opens, a new proof request is needed.
                </Typography>
              </View>
              <View style={styles.progressBubble}>
                <Text style={styles.progressBubbleText}>{completedRequirementCount}/3</Text>
              </View>
            </View>

            {queuedCount > 0 ? (
              <View style={styles.queueInline}>
                <Ionicons name="cloud-upload-outline" size={16} color={theme.colors.warning} />
                <Typography variant="caption" color={theme.colors.textSecondary} style={styles.queueInlineText}>
                  {queuedCount} saved request{queuedCount === 1 ? '' : 's'} waiting to sync.
                </Typography>
              </View>
            ) : null}

            <View style={styles.requirementWrap}>
              <RequirementPill
                label={selectedDistribution ? 'Distribution selected' : distributionLoading ? 'Checking distributions' : 'Choose distribution'}
                tone={selectedDistribution ? 'ready' : distributionLoading ? 'pending' : 'warning'}
              />
              <RequirementPill
                label={`${Math.min(trimmedDescriptionLength, 10)}/10 description`}
                tone={descriptionReady ? 'ready' : 'pending'}
              />
              <RequirementPill
                label={`${photos.length}/${MIN_PHOTOS} photos`}
                tone={photosReady ? 'ready' : 'pending'}
              />
            </View>

            <View style={styles.selectionBlock}>
              <View style={styles.selectionHeaderRow}>
                <Typography variant="caption" color={theme.colors.textSecondary}>Available distributions</Typography>
                {selectedDistribution ? (
                  <RequirementPill
                    label={getApplicationLabel(selectedDistribution.applicationStatus)}
                    tone={getApplicationTone(selectedDistribution.applicationStatus)}
                  />
                ) : null}
              </View>

              {distributionLoading ? (
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Checking open beneficiary distributions...
                </Typography>
              ) : openDistributions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-clear-outline" size={20} color={theme.colors.textMuted} />
                  <Typography variant="caption" color={theme.colors.textSecondary} style={styles.emptyStateText}>
                    No open beneficiary distribution is available for your barangay right now.
                  </Typography>
                </View>
              ) : (
                <>
                  {openDistributions.length > 1 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.distributionChipRow}
                    >
                      {openDistributions.map((distribution) => {
                        const selected = distribution.id === selectedDistribution?.id;
                        return (
                          <Pressable
                            key={distribution.id}
                            onPress={() => setSelectedDistributionId(distribution.id)}
                            style={[styles.distributionChip, selected && styles.distributionChipSelected]}
                          >
                            <Text style={[styles.distributionChipText, selected && styles.distributionChipTextSelected]}>
                              {getDistributionChipLabel(distribution)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  ) : null}

                  {selectedDistribution ? (
                    <View style={styles.selectedDistributionCard}>
                      <View style={styles.selectedDistributionHeader}>
                        <View style={styles.selectedDistributionIcon}>
                          <Ionicons name="cube-outline" size={16} color={theme.colors.primaryDark} />
                        </View>
                        <View style={styles.selectedDistributionCopy}>
                          <Typography variant="body" weight="semiBold">
                            {selectedDistribution.barangay} relief distribution
                          </Typography>
                          <Typography variant="caption" color={theme.colors.textSecondary}>
                            {formatSchedule(selectedDistribution.scheduled)}
                          </Typography>
                        </View>
                      </View>

                      <Typography variant="caption" color={theme.colors.textSecondary}>
                        Covers {selectedDistribution.targetBarangays.join(', ')}
                      </Typography>

                      {selectedDistribution.lastSubmissionAt ? (
                        <Typography variant="caption" color={theme.colors.textMuted}>
                          Last submitted {formatSchedule(selectedDistribution.lastSubmissionAt)}
                        </Typography>
                      ) : null}

                      {selectedDistribution.notes ? (
                        <Typography variant="caption" color={theme.colors.textSecondary} numberOfLines={2}>
                          {selectedDistribution.notes}
                        </Typography>
                      ) : null}
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </Card>

          <Card variant="outlined" padding="md" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderCopy}>
                <Typography variant="body" weight="semiBold">Damage details</Typography>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Keep this short, clear, and specific.
                </Typography>
              </View>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{trimmedDescriptionLength}/10</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Typography variant="caption" color={theme.colors.textSecondary}>Damage type</Typography>
              <View style={styles.chipWrap}>
                {DAMAGE_TYPES.map((type) => {
                  const selected = type === selectedDamageType;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setSelectedDamageType(type)}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{type}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldHeadingRow}>
                <Typography variant="caption" color={theme.colors.textSecondary}>Damage description</Typography>
                <Typography variant="caption" color={descriptionReady ? theme.colors.success : theme.colors.textMuted}>
                  Minimum 10 characters
                </Typography>
              </View>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Example: Knee-high flood water damaged our floor, bed, and school supplies."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                style={styles.textArea}
              />
            </View>

            {showingSupportingInfo ? (
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeadingRow}>
                  <Typography variant="caption" color={theme.colors.textSecondary}>Extra note</Typography>
                  {!hasSupportingInfo ? (
                    <Pressable onPress={() => setShowSupportingInfo(false)} style={styles.inlineAction}>
                      <Ionicons name="close-outline" size={16} color={theme.colors.textMuted} />
                      <Text style={styles.inlineActionText}>Hide</Text>
                    </Pressable>
                  ) : null}
                </View>
                <TextInput
                  value={supportingInfo}
                  onChangeText={setSupportingInfo}
                  placeholder="Optional details like water level, evacuation, or affected family members."
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  style={[styles.textArea, styles.secondaryTextArea]}
                />
              </View>
            ) : (
              <Pressable style={styles.optionalToggle} onPress={() => setShowSupportingInfo(true)}>
                <Ionicons name="add-circle-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.optionalToggleText}>Add optional note</Text>
              </Pressable>
            )}
          </Card>

          <Card variant="outlined" padding="md" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderCopy}>
                <Typography variant="body" weight="semiBold">Proof photos</Typography>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Add 3 to 5 clear photos of the visible damage.
                </Typography>
              </View>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{photos.length}/{MAX_PHOTOS}</Text>
              </View>
            </View>

            <Typography variant="caption" color={remainingPhotos === 0 ? theme.colors.success : theme.colors.textSecondary}>
              {remainingPhotos === 0
                ? 'Enough photos attached for review.'
                : `${remainingPhotos} more photo${remainingPhotos === 1 ? '' : 's'} needed to send.`}
            </Typography>

            <View style={styles.actionRow}>
              <Button
                title="Gallery"
                icon="images-outline"
                variant="secondary"
                size="sm"
                onPress={pickFromGallery}
                style={styles.actionButton}
              />
              <Button
                title="Camera"
                icon="camera-outline"
                variant="outline"
                size="sm"
                onPress={takePhoto}
                style={styles.actionButton}
              />
            </View>

            <View style={styles.photoGrid}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoTile}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  <TouchableOpacity style={styles.removePhotoButton} onPress={() => removePhoto(photo.id)}>
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}

              {Array.from({ length: Math.max(0, MIN_PHOTOS - photos.length) }).map((_, index) => (
                <View key={`placeholder-${index}`} style={styles.photoPlaceholder}>
                  <Ionicons name="image-outline" size={18} color={theme.colors.textMuted} />
                  <Text style={styles.photoPlaceholderText}>Required</Text>
                </View>
              ))}
            </View>
          </Card>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: footerPadding }]}>
          <View style={styles.footerCopy}>
            <Typography
              variant="caption"
              color={alreadyApproved ? theme.colors.primaryDark : theme.colors.textSecondary}
            >
              {footerMessage}
            </Typography>
          </View>
          <Button
            title={getPrimaryActionLabel(selectedStatus, submitting)}
            onPress={() => {
              void handleSubmit();
            }}
            disabled={submitDisabled}
            icon="send-outline"
            style={styles.submitButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F4',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
  },
  headerTextWrap: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  summaryCard: {
    gap: theme.spacing.md,
    borderColor: 'rgba(22,163,74,0.14)',
    backgroundColor: '#FCFEFC',
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: {
    flex: 1,
    gap: 2,
  },
  progressBubble: {
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    backgroundColor: '#E8F5EC',
  },
  progressBubbleText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  queueInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#FFF9ED',
    borderWidth: 1,
    borderColor: '#F5D487',
  },
  queueInlineText: {
    flex: 1,
  },
  requirementWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  requirementPill: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  requirementPillReady: {
    backgroundColor: '#E8F5EC',
  },
  requirementPillPending: {
    backgroundColor: '#F3F4F6',
  },
  requirementPillWarning: {
    backgroundColor: '#FEF2F2',
  },
  requirementPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requirementPillTextReady: {
    color: theme.colors.primaryDark,
  },
  requirementPillTextPending: {
    color: theme.colors.textSecondary,
  },
  requirementPillTextWarning: {
    color: theme.colors.error,
  },
  selectionBlock: {
    gap: theme.spacing.sm,
  },
  selectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  distributionChipRow: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
  },
  distributionChip: {
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FAFAF9',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  distributionChipSelected: {
    borderColor: 'rgba(21,128,61,0.16)',
    backgroundColor: '#E8F5EC',
  },
  distributionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  distributionChipTextSelected: {
    color: theme.colors.primaryDark,
  },
  selectedDistributionCard: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
  },
  selectedDistributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  selectedDistributionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDistributionCopy: {
    flex: 1,
    gap: 2,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
  },
  emptyStateText: {
    flex: 1,
  },
  sectionCard: {
    gap: theme.spacing.md,
    borderColor: 'rgba(17,24,39,0.08)',
    backgroundColor: theme.colors.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  sectionHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  sectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#F1F5F9',
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  fieldGroup: {
    gap: theme.spacing.sm,
  },
  fieldHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FAFAF9',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipSelected: {
    borderColor: 'rgba(21,128,61,0.18)',
    backgroundColor: '#E8F5EC',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  chipTextSelected: {
    color: theme.colors.primaryDark,
  },
  textArea: {
    minHeight: 92,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FAFAF9',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.textPrimary,
    textAlignVertical: 'top',
  },
  secondaryTextArea: {
    minHeight: 76,
  },
  optionalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: 4,
  },
  optionalToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  inlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  photoTile: {
    position: 'relative',
    width: '31%',
    aspectRatio: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(17,24,39,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FAFAF9',
  },
  photoPlaceholderText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  footer: {
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: 'rgba(244,246,244,0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(17,24,39,0.08)',
    gap: theme.spacing.sm,
  },
  footerCopy: {
    minHeight: 18,
  },
  submitButton: {
    width: '100%',
  },
});
