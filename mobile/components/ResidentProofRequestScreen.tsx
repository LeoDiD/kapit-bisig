import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  fetchActiveBeneficiaryEvent,
  fetchResidentProofSubmissionStatus,
  getQueuedResidentProofSubmissions,
  getResidentSession,
  getResidentToken,
  ResidentDisasterEvent,
  ResidentProofSubmissionStatus,
  submitResidentProofSubmission,
  syncQueuedResidentProofSubmissions,
} from '../services/api/ResidentQrService';
import { saveProofDraft, loadProofDraft, clearProofDraft } from '../services/sync/ProofDraftService';
import {
  WatermarkOverlay,
  captureWatermarkedPhoto,
  buildWatermarkLabel,
} from '../services/sync/photoWatermark';

type DamageType = 'Flood' | 'House Damage' | 'Storm Surge' | 'Landslide' | 'Livelihood Loss' | 'Other';
type RequirementTone = 'ready' | 'pending' | 'warning';

type ProofPhoto = {
  id: string;
  uri: string;
  watermarked?: boolean;
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

interface ResidentProofRequestScreenProps {
  onBack: () => void;
}

export default function ResidentProofRequestScreen({ onBack }: ResidentProofRequestScreenProps) {
  const insets = useSafeAreaInsets();
  const [activeEvent, setActiveEvent] = useState<ResidentDisasterEvent | null>(null);
  const [proofStatus, setProofStatus] = useState<ResidentProofSubmissionStatus | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDamageType, setSelectedDamageType] = useState<DamageType>('Flood');
  const [description, setDescription] = useState('');
  const [supportingInfo, setSupportingInfo] = useState('');
  const [showSupportingInfo, setShowSupportingInfo] = useState(false);
  const [photos, setPhotos] = useState<ProofPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [draftRestoredBanner, setDraftRestoredBanner] = useState(false);
  const [residentBarangay, setResidentBarangay] = useState('');
  const [watermarkUri, setWatermarkUri] = useState<string | null>(null);
  const [watermarkBarangay, setWatermarkBarangay] = useState('');
  const [watermarkDateLabel, setWatermarkDateLabel] = useState('');
  const watermarkViewRef = useRef<View | null>(null);
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const residentTokenRef = useRef<string | null>(null);
  const draftLoadedRef = useRef(false);

  const trimmedDescriptionLength = description.trim().length;
  const descriptionReady = trimmedDescriptionLength >= 10;
  const photosReady = photos.length >= MIN_PHOTOS;
  const eventReady = Boolean(activeEvent);
  const completedRequirementCount = [eventReady, descriptionReady, photosReady].filter(Boolean).length;
  const remainingPhotos = Math.max(0, MIN_PHOTOS - photos.length);
  const proofLocked = proofStatus?.status === 'Approved' || proofStatus?.status === 'Pending Verification';
  const canEditProof = !proofLocked;
  const submitDisabled = submitting || eventLoading || !activeEvent || proofLocked;
  const footerPadding = Math.max(insets.bottom, theme.spacing.md);
  const hasSupportingInfo = supportingInfo.trim().length > 0;
  const showingSupportingInfo = showSupportingInfo || hasSupportingInfo;

  const missingItems = [
    !eventReady ? 'wait for an active disaster event' : null,
    !descriptionReady ? 'add a short description' : null,
    !photosReady ? `attach ${remainingPhotos} more photo${remainingPhotos === 1 ? '' : 's'}` : null,
  ].filter(Boolean) as string[];

  const footerMessage = missingItems.length === 0
      ? 'Everything looks ready for admin review.'
      : `Before sending, ${missingItems.join(', ')}.`;

  const loadScreenData = useCallback(async () => {
    setEventLoading(true);
    try {
      const token = await getResidentToken();
      if (!token) {
        setActiveEvent(null);
        setQueuedCount(0);
        return;
      }

      const [eventResult, syncResult, queue] = await Promise.all([
        fetchActiveBeneficiaryEvent(token),
        syncQueuedResidentProofSubmissions(token),
        getQueuedResidentProofSubmissions(),
      ]);

      setActiveEvent(eventResult.success ? eventResult.data ?? null : null);
      setQueuedCount(queue.length);

      const currentEvent = eventResult.success ? eventResult.data ?? null : null;
      const currentEventId = currentEvent?.id || currentEvent?._id;
      if (currentEventId) {
        const statusResult = await fetchResidentProofSubmissionStatus(token, currentEventId);
        setProofStatus(statusResult.success ? statusResult.data ?? null : null);
      } else {
        setProofStatus(null);
      }

      if (syncResult.success && syncResult.syncedCount > 0) {
        const refreshedQueue = await getQueuedResidentProofSubmissions();
        setQueuedCount(refreshedQueue.length);
      }
    } finally {
      setEventLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScreenData().catch(() => {
      setEventLoading(false);
    });

    // Load resident session for barangay (watermark) and draft restore
    (async () => {
      const token = await getResidentToken();
      residentTokenRef.current = token;
      if (!token) return;

      const session = await getResidentSession();
      if (session?.barangay) {
        setResidentBarangay(session.barangay);
      }

      // Restore draft if one exists
      const draft = await loadProofDraft(token);
      if (draft && !draftLoadedRef.current) {
        draftLoadedRef.current = true;
        setSelectedDamageType(draft.damageType as DamageType);
        setDescription(draft.description);
        setSupportingInfo(draft.supportingInfo);
        setShowSupportingInfo(draft.showSupportingInfo);
        if (draft.photoUris.length > 0) {
          setPhotos(draft.photoUris.map((uri, idx) => ({
            id: `draft-${idx}-${Date.now()}`,
            uri,
            watermarked: true,
          })));
        }
        setDraftRestoredBanner(true);
      }
    })().catch(() => undefined);
  }, [loadScreenData]);

  // Debounced draft auto-save
  useEffect(() => {
    if (!draftLoadedRef.current && !description && photos.length === 0) return;

    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
    }

    draftSaveTimerRef.current = setTimeout(() => {
      const token = residentTokenRef.current;
      if (!token) return;

      saveProofDraft(token, {
        damageType: selectedDamageType,
        description,
        supportingInfo,
        showSupportingInfo,
        selectedDistributionId: null,
        photoUris: photos.map((p) => p.uri),
      }).catch(() => undefined);
    }, 500);

    return () => {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
      }
    };
  }, [selectedDamageType, description, supportingInfo, showSupportingInfo, photos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadScreenData();
    } finally {
      setRefreshing(false);
    }
  }, [loadScreenData]);

  const appendAssets = useCallback(async (uris: string[]) => {
    // Apply watermark to each photo before adding
    const barangay = residentBarangay || 'Unknown';
    const dateLabel = buildWatermarkLabel();

    for (const uri of uris) {
      setWatermarkUri(uri);
      setWatermarkBarangay(barangay);
      setWatermarkDateLabel(dateLabel);

      // Give the watermark overlay time to render
      await new Promise((resolve) => setTimeout(resolve, 150));

      let finalUri = uri;
      try {
        if (watermarkViewRef.current) {
          finalUri = await captureWatermarkedPhoto(watermarkViewRef);
        }
      } catch {
        // Watermark failed — use original photo
      }

      setPhotos((current) => {
        if (current.length >= MAX_PHOTOS) return current;
        if (current.some((item) => item.uri === finalUri || item.uri === uri)) return current;
        return [
          ...current,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            uri: finalUri,
            watermarked: finalUri !== uri,
          },
        ];
      });
    }

    setWatermarkUri(null);
  }, [residentBarangay]);

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
      void appendAssets(result.assets.map((asset) => asset.uri));
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
      void appendAssets([result.assets[0].uri]);
    }
  }, [appendAssets, photos.length]);

  const removePhoto = useCallback((id: string) => {
    setPhotos((current) => current.filter((item) => item.id !== id));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!activeEvent) {
      Alert.alert('No active disaster', 'There is no active disaster event accepting proof submissions right now.');
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
        disasterEventId: activeEvent.id || activeEvent._id || '',
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

      // Clear draft after successful submission
      if (token) {
        clearProofDraft(token).catch(() => undefined);
      }

      if (!result.queued) {
        await loadScreenData();
      }
    } catch (error) {
      Alert.alert('Submission failed', error instanceof Error ? error.message : 'Unable to submit proof right now.');
    } finally {
      setSubmitting(false);
    }
  }, [activeEvent, description, loadScreenData, photos, selectedDamageType, supportingInfo]);

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
                Show how the active disaster affected you by adding a short damage note and clear photos.
              </Typography>
            </View>
          </View>

          {draftRestoredBanner ? (
            <Pressable
              style={styles.draftBanner}
              onPress={() => setDraftRestoredBanner(false)}
            >
              <Ionicons name="document-text-outline" size={16} color="#166534" />
              <Text style={styles.draftBannerText}>Draft restored from your last session</Text>
              <Ionicons name="close-outline" size={16} color="#6B7280" />
            </Pressable>
          ) : null}

          <Card variant="outlined" padding="md" style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryIcon}>
                <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.primaryDark} />
              </View>
              <View style={styles.summaryCopy}>
                <Typography variant="label" color={theme.colors.textMuted}>Target Beneficiary</Typography>
                <Typography variant="body" weight="semiBold">One verified proof per disaster</Typography>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Once approved, you will be enrolled automatically in matching barangay distributions.
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
                label={activeEvent ? 'Disaster event found' : eventLoading ? 'Checking active event' : 'No active event'}
                tone={activeEvent ? 'ready' : eventLoading ? 'pending' : 'warning'}
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
                <Typography variant="caption" color={theme.colors.textSecondary}>Active disaster event</Typography>
              </View>

              {eventLoading ? (
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Checking the active disaster event...
                </Typography>
              ) : !activeEvent ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-clear-outline" size={20} color={theme.colors.textMuted} />
                  <Typography variant="caption" color={theme.colors.textSecondary} style={styles.emptyStateText}>
                    No active disaster event is accepting proof submissions right now.
                  </Typography>
                </View>
              ) : (
                <View style={styles.selectedDistributionCard}>
                  <View style={styles.selectedDistributionHeader}>
                    <View style={styles.selectedDistributionIcon}>
                      <Ionicons name="thunderstorm-outline" size={16} color={theme.colors.primaryDark} />
                    </View>
                    <View style={styles.selectedDistributionCopy}>
                      <Typography variant="body" weight="semiBold">{activeEvent.name}</Typography>
                      <Typography variant="caption" color={theme.colors.textSecondary}>
                        {activeEvent.disasterType} | {formatSchedule(activeEvent.eventDate)}
                      </Typography>
                    </View>
                  </View>
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    Your approved proof will apply automatically to matching distributions in {residentBarangay || 'your barangay'}.
                  </Typography>
                </View>
              )}
            </View>
          </Card>

          {proofStatus ? (
            <View style={[
              styles.statusCard,
              proofStatus.status === 'Approved' && styles.statusCardApproved,
              proofStatus.status === 'Rejected' && styles.statusCardRejected,
            ]}>
              <View style={styles.statusIcon}>
                <Ionicons
                  name={proofStatus.status === 'Approved' ? 'checkmark-circle' : proofStatus.status === 'Rejected' ? 'alert-circle' : 'time'}
                  size={24}
                  color={proofStatus.status === 'Approved' ? '#15803D' : proofStatus.status === 'Rejected' ? '#B91C1C' : '#A16207'}
                />
              </View>
              <View style={styles.statusCopy}>
                <Text style={styles.statusEyebrow}>SUBMISSION STATUS</Text>
                <Text style={styles.statusTitle}>
                  {proofStatus.status === 'Approved' ? 'Proof approved' : proofStatus.status === 'Rejected' ? 'Changes are needed' : 'Under admin review'}
                </Text>
                <Text style={styles.statusMessage}>
                  {proofStatus.status === 'Approved'
                    ? `You are eligible for this event. Any matching distribution created for ${residentBarangay || 'your barangay'} will enroll you automatically.`
                    : proofStatus.status === 'Rejected'
                      ? (proofStatus.rejectionReason || 'Review the proof details and submit clearer information.')
                      : 'You do not need to submit again. We will notify you after the admin completes the review.'}
                </Text>
                <View style={styles.statusMetaRow}>
                  <Text style={styles.statusMeta}>{proofStatus.photoCount} photos</Text>
                  <Text style={styles.statusMeta}>Version {proofStatus.submissionVersion}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {canEditProof ? (
          <>
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
                  {photo.watermarked ? (
                    <View style={styles.watermarkBadge}>
                      <Ionicons name="shield-checkmark" size={10} color="#FFFFFF" />
                      <Text style={styles.watermarkBadgeText}>Stamped</Text>
                    </View>
                  ) : null}
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
          </>
          ) : null}
        </ScrollView>

        {canEditProof ? <View style={[styles.footer, { paddingBottom: footerPadding }]}>
          <View style={styles.footerCopy}>
            <Typography
              variant="caption"
              color={theme.colors.textSecondary}
            >
              {footerMessage}
            </Typography>
          </View>
          <Button
            title={submitting ? 'Submitting...' : 'Send proof'}
            onPress={() => {
              void handleSubmit();
            }}
            disabled={submitDisabled}
            icon="send-outline"
            style={styles.submitButton}
          />
        </View> : null}
      </KeyboardAvoidingView>

      {/* Off-screen watermark overlay for photo capture */}
      {watermarkUri ? (
        <WatermarkOverlay
          uri={watermarkUri}
          barangay={watermarkBarangay}
          dateLabel={watermarkDateLabel}
          viewRef={watermarkViewRef}
        />
      ) : null}
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
  statusCard: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 16, backgroundColor: '#FFF8E7', borderWidth: 1, borderColor: '#F2D68A' },
  statusCardApproved: { backgroundColor: '#ECFDF3', borderColor: '#BBE3C9' },
  statusCardRejected: { backgroundColor: '#FFF1F2', borderColor: '#F4C2C7' },
  statusIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.72)', alignItems: 'center', justifyContent: 'center' },
  statusCopy: { flex: 1 },
  statusEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#718078' },
  statusTitle: { marginTop: 2, fontSize: 16, fontWeight: '800', color: '#23382F' },
  statusMessage: { marginTop: 5, fontSize: 12.5, lineHeight: 18, color: '#586A61' },
  statusMetaRow: { marginTop: 9, flexDirection: 'row', gap: 8 },
  statusMeta: { fontSize: 10, fontWeight: '700', color: '#60736A', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 4 },
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
  rejectionReasonBox: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.warningBg,
    borderWidth: 1,
    borderColor: '#F5D487',
    gap: 4,
  },
  rejectionReasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.18)',
  },
  draftBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    fontWeight: '500',
  },
  watermarkBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(22,163,74,0.85)',
  },
  watermarkBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
