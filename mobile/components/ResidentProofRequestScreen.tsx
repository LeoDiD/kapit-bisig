import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Typography } from './ui/Typography';
import { theme } from '../theme';
import {
  fetchActiveBeneficiaryEvent,
  getQueuedResidentProofSubmissions,
  getResidentToken,
  ResidentDisasterEvent,
  submitResidentProofSubmission,
  syncQueuedResidentProofSubmissions,
} from '../services/api/ResidentQrService';

type DamageType = 'Flood' | 'House Damage' | 'Storm Surge' | 'Landslide' | 'Livelihood Loss' | 'Other';

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

interface ResidentProofRequestScreenProps {
  onBack: () => void;
}

export default function ResidentProofRequestScreen({ onBack }: ResidentProofRequestScreenProps) {
  const [activeEvent, setActiveEvent] = useState<ResidentDisasterEvent | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDamageType, setSelectedDamageType] = useState<DamageType>('Flood');
  const [description, setDescription] = useState('');
  const [supportingInfo, setSupportingInfo] = useState('');
  const [photos, setPhotos] = useState<ProofPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);

  const canSubmit = useMemo(() => {
    return Boolean(activeEvent) && description.trim().length >= 10 && photos.length >= MIN_PHOTOS;
  }, [activeEvent, description, photos.length]);

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

      if (eventResult.success) {
        setActiveEvent(eventResult.data ?? null);
      } else {
        setActiveEvent(null);
      }

      setQueuedCount(queue.length);

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
    if (!activeEvent) {
      Alert.alert('No active event', 'There is no active disaster event available for proof submission right now.');
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
        disasterEventId: String(activeEvent.id || activeEvent._id || ''),
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
  }, [activeEvent, description, loadScreenData, photos, selectedDamageType, supportingInfo]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Typography variant="h3" weight="semiBold">Disaster Proof Request</Typography>
            <Typography variant="body" color={theme.colors.textSecondary}>
              Submit 3 to 5 photos so admins can verify your eligibility.
            </Typography>
          </View>
        </View>

        <Card style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="images-outline" size={22} color={theme.colors.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="body" weight="semiBold">Current disaster event</Typography>
            {eventLoading ? (
              <Typography variant="body" color={theme.colors.textSecondary} style={styles.heroText}>
                Loading active event...
              </Typography>
            ) : activeEvent ? (
              <>
                <Typography variant="body" color={theme.colors.textPrimary} style={styles.heroText}>
                  {activeEvent.name}
                </Typography>
                <Typography variant="body" color={theme.colors.textSecondary}>
                  {activeEvent.disasterType} • {activeEvent.barangays.join(', ')}
                </Typography>
              </>
            ) : (
              <Typography variant="body" color={theme.colors.error}>
                No active disaster event available right now.
              </Typography>
            )}
          </View>
        </Card>

        {queuedCount > 0 ? (
          <Card variant="outlined" style={styles.syncCard}>
            <Ionicons name="cloud-upload-outline" size={20} color={theme.colors.warning} />
            <View style={{ flex: 1 }}>
              <Typography variant="body" weight="semiBold">Offline queue</Typography>
              <Typography variant="body" color={theme.colors.textSecondary}>
                {queuedCount} proof request{queuedCount === 1 ? '' : 's'} waiting to sync.
              </Typography>
            </View>
          </Card>
        ) : null}

        <Card style={styles.sectionCard}>
          <Typography variant="body" weight="semiBold">Damage type</Typography>
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

          <Typography variant="body" weight="semiBold" style={styles.fieldLabel}>Damage description</Typography>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what happened to your house, belongings, or livelihood."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            style={styles.textArea}
          />

          <Typography variant="body" weight="semiBold" style={styles.fieldLabel}>Supporting information</Typography>
          <TextInput
            value={supportingInfo}
            onChangeText={setSupportingInfo}
            placeholder="Optional notes like water level, evacuation status, or affected family members."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            style={[styles.textArea, styles.secondaryTextArea]}
          />
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.photoHeader}>
            <View>
              <Typography variant="body" weight="semiBold">Proof photos</Typography>
              <Typography variant="body" color={theme.colors.textSecondary}>
                Attach {MIN_PHOTOS} to {MAX_PHOTOS} photos.
              </Typography>
            </View>
            <Text style={styles.photoCount}>{photos.length}/{MAX_PHOTOS}</Text>
          </View>

          <View style={styles.actionRow}>
            <Button title="Gallery" icon="images-outline" variant="secondary" onPress={pickFromGallery} style={styles.actionButton} />
            <Button title="Camera" icon="camera-outline" variant="outline" onPress={takePhoto} style={styles.actionButton} />
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

          <Typography variant="body" color={theme.colors.textSecondary} style={styles.photoHint}>
            Clear, well-lit photos help admins review faster. Include flood level, house damage, or visible disaster impact.
          </Typography>
        </Card>

        <Button
          title={submitting ? 'Submitting...' : 'Send proof request'}
          onPress={() => {
            handleSubmit().catch(() => undefined);
          }}
          disabled={!canSubmit || submitting}
          icon="send-outline"
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
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
    borderColor: theme.colors.border,
  },
  headerTextWrap: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: '#F0FDF4',
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    marginTop: 2,
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  sectionCard: {
    gap: theme.spacing.md,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  chipTextSelected: {
    color: theme.colors.primaryDark,
  },
  fieldLabel: {
    marginTop: 4,
  },
  textArea: {
    minHeight: 112,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.textPrimary,
    textAlignVertical: 'top',
  },
  secondaryTextArea: {
    minHeight: 92,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoCount: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
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
    backgroundColor: '#F9FAFB',
  },
  photoPlaceholderText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  photoHint: {
    lineHeight: 20,
  },
  submitButton: {
    marginTop: theme.spacing.sm,
  },
});
