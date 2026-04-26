import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
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
  getResidentToken,
  ResidentProfile,
  submitResidentRegistrationRevision,
} from '../services/api/ResidentQrService';

type PickedImage = {
  uri: string;
};

const ID_TYPES = ['PhilSys ID', 'Driver\'s License', 'Passport', 'SSS ID', 'PhilHealth ID', 'Voter\'s ID'];

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

interface ResidentRegistrationRevisionScreenProps {
  residentNote?: string;
  onBack: () => void;
  onSubmitted: (profile: ResidentProfile) => void;
}

export default function ResidentRegistrationRevisionScreen({
  residentNote,
  onBack,
  onSubmitted,
}: ResidentRegistrationRevisionScreenProps) {
  const [selectedIdType, setSelectedIdType] = useState(ID_TYPES[0]);
  const [idNumber, setIdNumber] = useState('');
  const [frontIdImage, setFrontIdImage] = useState<PickedImage | null>(null);
  const [backIdImage, setBackIdImage] = useState<PickedImage | null>(null);
  const [faceImage, setFaceImage] = useState<PickedImage | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return Boolean(
      selectedIdType.trim()
      && idNumber.trim()
      && frontIdImage?.uri
      && backIdImage?.uri
      && faceImage?.uri,
    );
  }, [backIdImage?.uri, faceImage?.uri, frontIdImage?.uri, idNumber, selectedIdType]);

  const pickImage = useCallback(async (
    target: 'front' | 'back' | 'face',
    source: 'camera' | 'gallery',
  ) => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert('Permission needed', `Please allow ${source} access to continue.`);
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.7,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.7,
        });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    const nextValue = { uri: result.assets[0].uri };
    if (target === 'front') setFrontIdImage(nextValue);
    if (target === 'back') setBackIdImage(nextValue);
    if (target === 'face') setFaceImage(nextValue);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      Alert.alert('Missing files', 'Please complete the ID details and upload front ID, back ID, and selfie files.');
      return;
    }

    const token = await getResidentToken();
    if (!token) {
      Alert.alert('Login required', 'Please log in again before sending corrected files.');
      return;
    }

    setSubmitting(true);
    try {
      const [frontIdImagePayload, backIdImagePayload, faceImagePayload] = await Promise.all([
        imageUriToDataUrl(frontIdImage!.uri),
        imageUriToDataUrl(backIdImage!.uri),
        imageUriToDataUrl(faceImage!.uri),
      ]);

      const result = await submitResidentRegistrationRevision(token, {
        idType: selectedIdType,
        idNumber: idNumber.trim(),
        frontIdImage: frontIdImagePayload,
        backIdImage: backIdImagePayload,
        faceImage: faceImagePayload,
      });

      if (!result.success || !result.data) {
        Alert.alert('Submission failed', result.message || 'Unable to submit corrected files right now.');
        return;
      }

      Alert.alert(
        'Submitted',
        result.message || 'Your corrected registration files were submitted and are now pending admin review.',
      );
      onSubmitted(result.data);
    } catch (error) {
      Alert.alert(
        'Submission failed',
        error instanceof Error ? error.message : 'Unable to submit corrected files right now.',
      );
    } finally {
      setSubmitting(false);
    }
  }, [backIdImage, canSubmit, faceImage, frontIdImage, idNumber, onSubmitted, selectedIdType]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Typography variant="h3" weight="semiBold">Registration Revision</Typography>
            <Typography variant="body" color={theme.colors.textSecondary}>
              Upload corrected ID files and selfie so the admin can review your registration again.
            </Typography>
          </View>
        </View>

        {residentNote?.trim() ? (
          <Card variant="outlined" style={styles.noteCard}>
            <Ionicons name="document-text-outline" size={20} color="#0F172A" />
            <View style={{ flex: 1 }}>
              <Typography variant="body" weight="semiBold">Admin note</Typography>
              <Typography variant="body" color={theme.colors.textSecondary}>
                {residentNote.trim()}
              </Typography>
            </View>
          </Card>
        ) : null}

        <Card style={styles.sectionCard}>
          <Typography variant="body" weight="semiBold">ID type</Typography>
          <View style={styles.chipWrap}>
            {ID_TYPES.map((type) => {
              const selected = type === selectedIdType;
              return (
                <Pressable
                  key={type}
                  onPress={() => setSelectedIdType(type)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{type}</Text>
                </Pressable>
              );
            })}
          </View>

          <Typography variant="body" weight="semiBold" style={styles.fieldLabel}>ID number</Typography>
          <TextInput
            value={idNumber}
            onChangeText={setIdNumber}
            placeholder="Enter the corrected ID number"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
          />
        </Card>

        <UploadCard
          title="Front ID"
          image={frontIdImage}
          onPickCamera={() => pickImage('front', 'camera')}
          onPickGallery={() => pickImage('front', 'gallery')}
        />

        <UploadCard
          title="Back ID"
          image={backIdImage}
          onPickCamera={() => pickImage('back', 'camera')}
          onPickGallery={() => pickImage('back', 'gallery')}
        />

        <UploadCard
          title="Selfie / Face Capture"
          image={faceImage}
          onPickCamera={() => pickImage('face', 'camera')}
          onPickGallery={() => pickImage('face', 'gallery')}
        />

        <Button
          title={submitting ? 'Submitting...' : 'Submit corrected files'}
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

function UploadCard({
  title,
  image,
  onPickCamera,
  onPickGallery,
}: {
  title: string;
  image: PickedImage | null;
  onPickCamera: () => void;
  onPickGallery: () => void;
}) {
  return (
    <Card style={styles.sectionCard}>
      <View style={styles.uploadHeader}>
        <Typography variant="body" weight="semiBold">{title}</Typography>
        <Text style={styles.uploadStatus}>{image ? 'Ready' : 'Required'}</Text>
      </View>

      <View style={styles.previewWrap}>
        {image?.uri ? (
          <Image source={{ uri: image.uri }} style={styles.previewImage} />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Ionicons name="image-outline" size={24} color={theme.colors.textMuted} />
            <Text style={styles.previewPlaceholderText}>No image selected</Text>
          </View>
        )}
      </View>

      <View style={styles.actionRow}>
        <Button title="Gallery" icon="images-outline" variant="secondary" onPress={onPickGallery} style={styles.actionButton} />
        <Button title="Camera" icon="camera-outline" variant="outline" onPress={onPickCamera} style={styles.actionButton} />
      </View>
    </Card>
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
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
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
    borderColor: '#111827',
    backgroundColor: '#E5E7EB',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  chipTextSelected: {
    color: '#111827',
  },
  fieldLabel: {
    marginTop: 4,
  },
  input: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  previewWrap: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    minHeight: 190,
  },
  previewImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  previewPlaceholder: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  previewPlaceholderText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  submitButton: {
    marginTop: theme.spacing.sm,
  },
});
