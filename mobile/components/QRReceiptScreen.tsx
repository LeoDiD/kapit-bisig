import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import ViewShot, { captureRef } from 'react-native-view-shot';
import {
  fetchResidentQr,
  getResidentToken,
  ResidentQrData,
} from '../services/api/ResidentQrService';

interface QRReceiptScreenProps {
  onBack: () => void;
  onNavigate?: (screen: 'home' | 'qr' | 'profile') => void;
}

export default function QRReceiptScreen({ onBack }: QRReceiptScreenProps) {
  const [qrData, setQrData] = useState<ResidentQrData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const qrCardRef = useRef<ViewShot | null>(null);

  const sanitizeResidentFullName = (rawName?: string): string => {
    const noiseWords = new Set([
      'APPROVED',
      'PENDING',
      'REJECTED',
      'VERIFIED',
      'ACTIVE',
      'INACTIVE',
      'HOUSEHOLD',
      'RESIDENT',
    ]);

    const parts = String(rawName || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .filter((part) => !noiseWords.has(part.toUpperCase()));
    if (parts.length === 0) return '';

    return parts.join(' ');
  };

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

  const loadQrFromSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const existingToken = await getResidentToken();
      if (!existingToken) {
        setError('No active resident session. Please sign in first.');
        return;
      }

      const qrResult = await fetchResidentQr(existingToken);
      if (!qrResult.success || !qrResult.data) {
        setQrData(null);
        setError(qrResult.message || 'Session expired. Please sign in again.');
        return;
      }

      setQrData(qrResult.data);
    } catch {
      setError('Unable to load QR. Please try again.');
    } finally {
      setSessionChecked(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQrFromSession();
  }, []);

  const handleHelp = () => {
    Alert.alert(
      'Resident QR',
      'Show this QR at the claim point. It identifies your resident account for faster verification.',
      [{ text: 'OK' }]
    );
  };

  const handleDownloadQr = async () => {
    if (!qrCardRef.current || !qrData) {
      return;
    }

    setIsDownloading(true);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow Photos permission to download your QR image.');
        return;
      }

      const uri = await captureRef(qrCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (!uri) {
        throw new Error('Unable to capture QR card image.');
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Downloaded', 'Resident QR card saved to your gallery.');
    } catch {
      Alert.alert('Download Failed', 'Could not save QR image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Resident QR</Text>
        <TouchableOpacity onPress={handleHelp} style={styles.iconButton}>
          <Ionicons name="help-circle-outline" size={22} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {isLoading && (
          <View style={styles.panel}>
            <ActivityIndicator color="#15803D" />
            <Text style={styles.loadingText}>Preparing your QR card...</Text>
          </View>
        )}

        {!isLoading && sessionChecked && error && (
          <View style={styles.panel}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={onBack}>
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && qrData && (
          <View style={styles.panel}>
            <ViewShot ref={qrCardRef} options={{ format: 'png', quality: 1, result: 'tmpfile' }}>
              <View style={styles.downloadCard}>
                <View style={styles.cardTop}>
                  <View style={styles.cardLogoCircle}>
                    <MaterialIcons name="verified-user" size={22} color="#166534" />
                  </View>
                  <Text style={styles.cardTitle}>Kapit-Bisig Resident QR</Text>
                  <Text style={styles.cardSubtitle}>Official Relief Verification Pass</Text>
                </View>

                <View style={styles.qrBox}>
                  <QRCode value={qrData.qrData} size={210} />
                </View>

                <View style={styles.cardInfoBlock}>
                  <Text style={styles.cardInfoName}>
                    {toMaskedName(sanitizeResidentFullName(qrData.resident.fullName))}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>Present this QR to volunteer scanner for claim verification.</Text>
                </View>
              </View>
            </ViewShot>

            <TouchableOpacity
              style={[styles.primaryButton, isDownloading && styles.buttonDisabled]}
              onPress={handleDownloadQr}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Download QR Card</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
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
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  loadingText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#166534',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#B91C1C',
    marginBottom: 10,
    fontSize: 13,
  },
  downloadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    overflow: 'hidden',
    paddingBottom: 12,
  },
  cardTop: {
    backgroundColor: '#166534',
    paddingVertical: 14,
    alignItems: 'center',
  },
  cardLogoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#D1FAE5',
    fontSize: 12,
    marginTop: 2,
  },
  qrBox: {
    alignSelf: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 14,
  },
  cardInfoBlock: {
    marginTop: 12,
    paddingHorizontal: 14,
  },
  cardInfoName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  cardInfoLine: {
    fontSize: 13,
    color: '#374151',
    marginTop: 2,
  },
  cardFooter: {
    marginTop: 12,
    paddingHorizontal: 14,
  },
  cardFooterText: {
    fontSize: 12,
    color: '#6B7280',
  },
  primaryButton: {
    backgroundColor: '#15803D',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
