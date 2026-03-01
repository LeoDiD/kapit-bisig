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
import { Audio } from 'expo-av';
import { mobileAuthService } from '../services/auth/MobileAuthService';

interface VolunteerQRScannerScreenProps {
  onBack: () => void;
  onNavigate?: (screen: 'home' | 'qr' | 'profile') => void;
}

interface ResolvedResident {
  residentId: string;
  residentCode: string;
  fullName: string;
  barangay: string;
  city: string;
  streetAddress: string;
  status: string;
  fromCache?: boolean;
}

interface ResolveQrPayload {
  success: boolean;
  message?: string;
  data?: ResolvedResident;
}

export default function VolunteerQRScannerScreen({ onBack }: VolunteerQRScannerScreenProps) {
  const SCAN_COOLDOWN_MS = 1500;
  const [permission, requestPermission] = useCameraPermissions();
  const [isResolving, setIsResolving] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedResident, setResolvedResident] = useState<ResolvedResident | null>(null);
  const [resolveLatencyMs, setResolveLatencyMs] = useState<number | null>(null);
  const lastScanRef = useRef<{ data: string; at: number } | null>(null);
  const successSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSound = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/qr-success.wav'),
          { shouldPlay: false, volume: 1.0 }
        );
        if (isMounted) {
          successSoundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch (err) {
        console.warn('[VolunteerQRScannerScreen] Failed to load success sound', err);
      }
    };

    loadSound();

    return () => {
      isMounted = false;
      if (successSoundRef.current) {
        successSoundRef.current.unloadAsync().catch(() => undefined);
        successSoundRef.current = null;
      }
    };
  }, []);

  const playSuccessFeedback = async () => {
    try {
      Vibration.vibrate(80);
      if (successSoundRef.current) {
        await successSoundRef.current.replayAsync();
      }
    } catch (err) {
      console.warn('[VolunteerQRScannerScreen] Failed to play feedback', err);
    }
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
    const startedAt = Date.now();

    const response = await mobileAuthService.authenticatedRequest<ResolveQrPayload>('/household/qr/resolve', {
      method: 'POST',
      body: JSON.stringify({ qrData: data }),
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

    setResolvedResident(response.data.data);
    await playSuccessFeedback();
    setResolveLatencyMs(Date.now() - startedAt);
    setIsResolving(false);
  };

  const handleScanAgain = () => {
    setHasScanned(false);
    setError(null);
    setResolvedResident(null);
    setResolveLatencyMs(null);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBlock}>
          <ActivityIndicator color="#15803D" />
          <Text style={styles.loadingText}>Checking camera permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Volunteer QR Scanner</Text>
          <View style={styles.iconSpacer} />
        </View>

        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={34} color="#15803D" />
          <Text style={styles.permissionTitle}>Camera permission is required</Text>
          <Text style={styles.permissionText}>
            Allow camera access so volunteer accounts can scan resident QR codes.
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
        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Volunteer QR Scanner</Text>
        <TouchableOpacity onPress={handleScanAgain} style={styles.iconButton}>
          <Ionicons name="refresh-outline" size={22} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.panel}>
          <View style={styles.cameraWrapper}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={hasScanned ? undefined : handleQrScanned}
            />
            <View style={styles.overlayBox}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
              <Text style={styles.overlayText}>Align resident QR inside this box</Text>
            </View>
          </View>

          {isResolving && (
            <View style={styles.stateBlock}>
              <ActivityIndicator color="#15803D" />
              <Text style={styles.stateText}>Validating scanned QR...</Text>
            </View>
          )}

          {!isResolving && error && (
            <View style={styles.stateBlock}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={handleScanAgain}>
                <Text style={styles.primaryButtonText}>Scan Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isResolving && resolvedResident && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Resident Found</Text>
              <Text style={styles.resultLine}>Name: {resolvedResident.fullName}</Text>
              <Text style={styles.resultLine}>Code: {resolvedResident.residentCode}</Text>
              <Text style={styles.resultLine}>Barangay: {resolvedResident.barangay}</Text>
              <Text style={styles.resultLine}>Address: {resolvedResident.streetAddress}</Text>
              <Text style={styles.resultLine}>Status: {resolvedResident.status}</Text>
              {resolveLatencyMs !== null && (
                <Text style={styles.resultMeta}>Resolve time: {resolveLatencyMs} ms</Text>
              )}
              <TouchableOpacity style={styles.primaryButton} onPress={handleScanAgain}>
                <Text style={styles.primaryButtonText}>Scan Next QR</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF3',
  },
  iconSpacer: {
    width: 36,
    height: 36,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 14,
  },
  cameraWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  camera: {
    flex: 1,
  },
  overlayBox: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 18,
    bottom: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  scanFrame: {
    width: '82%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#22C55E',
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    position: 'absolute',
    bottom: 10,
  },
  loadingBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#166534',
    fontSize: 14,
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
  },
  permissionText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    color: '#4B5563',
    lineHeight: 20,
  },
  stateBlock: {
    marginTop: 14,
    alignItems: 'center',
  },
  stateText: {
    marginTop: 10,
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  resultCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 12,
    backgroundColor: '#F9FFFB',
    padding: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
  },
  resultLine: {
    fontSize: 13,
    color: '#1F2937',
    marginTop: 2,
  },
  resultMeta: {
    marginTop: 6,
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#15803D',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
