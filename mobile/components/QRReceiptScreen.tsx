import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Constants from 'expo-constants';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { fetchResidentQr, getResidentToken, ResidentQrData } from '../services/api/ResidentQrService';

const isExpoGo = Constants.executionEnvironment === 'storeClient';
const MediaLibrary = !isExpoGo ? require('expo-media-library') : null;

interface QRReceiptScreenProps {
  onBack: () => void;
  onNavigate?: (screen: 'home' | 'qr' | 'profile') => void;
}

function formatIssuedDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function QRReceiptScreen({ onBack }: QRReceiptScreenProps) {
  const [idData, setIdData] = useState<ResidentQrData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showLargeQr, setShowLargeQr] = useState(false);
  const idCardRef = useRef<any>(null);

  const loadId = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = await getResidentToken();
    if (!token) {
      setError('Please sign in again to view your virtual ID.');
      setIsLoading(false);
      return;
    }
    const result = await fetchResidentQr(token);
    if (!result.success || !result.data) {
      setIdData(null);
      setError(result.message || 'Unable to load your virtual ID.');
    } else {
      setIdData(result.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadId(); }, [loadId]);

  const handleDownload = async () => {
    if (isExpoGo) {
      Alert.alert('Development build required', 'Saving the ID to your gallery is available in the installed app or a development build.');
      return;
    }
    if (!idCardRef.current || !idData) return;
    setIsDownloading(true);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photos permission needed', 'Allow photo access to save your virtual ID.');
        return;
      }
      const uri = await captureRef(idCardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('ID saved', 'Your Kapit-Bisig Virtual Resident ID was saved to your gallery.');
    } catch {
      Alert.alert('Download failed', 'The ID could not be saved. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color="#18352A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Virtual ID</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => Alert.alert('Virtual Resident ID', 'Present this ID at a Kapit-Bisig distribution. Staff will scan the QR and the system will verify your enrollment and claim status.')}
        >
          <Ionicons name="information-circle-outline" size={22} color="#18352A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#16834B" />
            <Text style={styles.stateText}>Preparing your verified ID…</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <View style={styles.lockCircle}><Ionicons name="lock-closed" size={24} color="#9A6700" /></View>
            <Text style={styles.stateTitle}>Virtual ID is locked</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.outlineButton} onPress={loadId}><Text style={styles.outlineButtonText}>Check status again</Text></TouchableOpacity>
          </View>
        ) : idData ? (
          <>
            <ViewShot ref={idCardRef} options={{ format: 'png', quality: 1 }} style={styles.shot}>
              <View style={styles.idCard}>
                <View style={styles.greenRail} />
                <View style={styles.idHeader}>
                  <View style={styles.brandMark}><Ionicons name="people" size={18} color="#FFFFFF" /></View>
                  <View style={styles.brandCopy}>
                    <Text style={styles.brandName}>KAPIT-BISIG</Text>
                    <Text style={styles.brandSubtitle}>VIRTUAL RESIDENT ID</Text>
                  </View>
                  <View style={styles.verifiedPill}>
                    <Ionicons name="checkmark-circle" size={13} color="#166534" />
                    <Text style={styles.verifiedText}>VERIFIED</Text>
                  </View>
                </View>

                <View style={styles.idBody}>
                  <View style={styles.identityColumn}>
                    <View style={styles.photoFrame}>
                      {idData.resident.avatarUrl ? (
                        <Image source={{ uri: idData.resident.avatarUrl }} style={styles.photo} />
                      ) : (
                        <Ionicons name="person" size={45} color="#7BA690" />
                      )}
                    </View>
                    <Text style={styles.nameLabel}>RESIDENT NAME</Text>
                    <Text style={styles.residentName} numberOfLines={2}>{idData.resident.fullName}</Text>
                    <Text style={styles.residentCode}>{idData.residentCode}</Text>
                  </View>

                  <View style={styles.detailsColumn}>
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={15} color="#16834B" />
                      <View><Text style={styles.detailLabel}>BARANGAY / CITY</Text><Text style={styles.detailValue}>{idData.resident.barangay}{idData.resident.city ? `, ${idData.resident.city}` : ''}</Text></View>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={15} color="#16834B" />
                      <View><Text style={styles.detailLabel}>ISSUED</Text><Text style={styles.detailValue}>{formatIssuedDate(idData.issuedAt)}</Text></View>
                    </View>
                    <TouchableOpacity style={styles.qrFrame} onPress={() => setShowLargeQr(true)} activeOpacity={0.8}>
                      <QRCode value={idData.qrData} size={82} backgroundColor="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.tapHint}>Tap QR to enlarge</Text>
                  </View>
                </View>

                <View style={styles.idFooter}>
                  <Text style={styles.disclaimer}>Kapit-Bisig Resident ID • Not a national ID</Text>
                  <Text style={styles.version}>ID v{idData.qrVersion}</Text>
                </View>
              </View>
            </ViewShot>

            <View style={styles.instructions}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#166534" />
              <View style={styles.instructionsCopy}>
                <Text style={styles.instructionsTitle}>Ready for relief verification</Text>
                <Text style={styles.instructionsText}>A successful scan still checks the active distribution, your barangay enrollment, and whether your household already claimed.</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.downloadButton} onPress={handleDownload} disabled={isDownloading}>
              {isDownloading ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="download-outline" size={20} color="#FFFFFF" /><Text style={styles.downloadText}>Download ID as image</Text></>}
            </TouchableOpacity>
            <Text style={styles.privacyNote}>Keep your QR private. Only show it to authorized Kapit-Bisig staff.</Text>
          </>
        ) : null}
      </ScrollView>

      <Modal visible={showLargeQr} transparent animationType="fade" onRequestClose={() => setShowLargeQr(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLargeQr(false)}>
          <Pressable style={styles.qrModal} onPress={() => undefined}>
            <Text style={styles.qrModalTitle}>Scan Resident ID</Text>
            {idData && <View style={styles.largeQr}><QRCode value={idData.qrData} size={245} /></View>}
            <Text style={styles.qrModalCode}>{idData?.residentCode}</Text>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowLargeQr(false)}><Text style={styles.modalCloseText}>Close</Text></TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8F5' },
  header: { height: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E4ECE7' },
  headerButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EDF7F1', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#18352A' },
  content: { padding: 18, paddingBottom: 36 },
  stateCard: { minHeight: 230, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E1EBE5' },
  stateTitle: { marginTop: 12, fontSize: 18, fontWeight: '700', color: '#243B32' },
  stateText: { marginTop: 9, fontSize: 14, lineHeight: 20, color: '#64746D', textAlign: 'center' },
  lockCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF7D6', alignItems: 'center', justifyContent: 'center' },
  outlineButton: { marginTop: 18, borderWidth: 1, borderColor: '#16834B', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 18 },
  outlineButtonText: { color: '#166534', fontWeight: '700' },
  shot: { borderRadius: 20, backgroundColor: '#FFFFFF' },
  idCard: { height: 230, borderRadius: 20, backgroundColor: '#FFFFFF', overflow: 'hidden', borderWidth: 1, borderColor: '#CFE2D7', shadowColor: '#0F3926', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  greenRail: { height: 7, backgroundColor: '#16834B' },
  idHeader: { height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, backgroundColor: '#F2FBF5' },
  brandMark: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#16834B', alignItems: 'center', justifyContent: 'center' },
  brandCopy: { marginLeft: 8, flex: 1 },
  brandName: { fontSize: 13, fontWeight: '900', letterSpacing: 0.6, color: '#124C30' },
  brandSubtitle: { marginTop: 1, fontSize: 7.5, fontWeight: '700', letterSpacing: 1.1, color: '#547466' },
  verifiedPill: { flexDirection: 'row', gap: 3, alignItems: 'center', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 10, backgroundColor: '#DCFCE7' },
  verifiedText: { fontSize: 7.5, fontWeight: '900', color: '#166534' },
  idBody: { flex: 1, flexDirection: 'row', paddingHorizontal: 13, paddingTop: 10 },
  identityColumn: { width: '57%', paddingRight: 8 },
  photoFrame: { width: 54, height: 57, borderRadius: 10, backgroundColor: '#E6F2EB', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#C7DFD1' },
  photo: { width: '100%', height: '100%' },
  nameLabel: { marginTop: 7, fontSize: 7.5, fontWeight: '800', letterSpacing: 0.8, color: '#789084' },
  residentName: { marginTop: 2, fontSize: 14, lineHeight: 16, fontWeight: '800', color: '#172B23' },
  residentCode: { marginTop: 3, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, color: '#16834B' },
  detailsColumn: { width: '43%', alignItems: 'flex-end' },
  detailRow: { width: '100%', flexDirection: 'row', gap: 5, marginBottom: 5 },
  detailLabel: { fontSize: 6.5, fontWeight: '800', color: '#81948B' },
  detailValue: { maxWidth: 105, fontSize: 8.5, lineHeight: 10.5, fontWeight: '700', color: '#2E453B' },
  qrFrame: { marginTop: 1, padding: 4, backgroundColor: '#FFFFFF', borderRadius: 7, borderWidth: 1, borderColor: '#DDE8E1' },
  tapHint: { marginTop: 2, fontSize: 6.5, color: '#71837A' },
  idFooter: { height: 23, paddingHorizontal: 13, backgroundColor: '#153E2B', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disclaimer: { color: '#D8EEE2', fontSize: 7.5, fontWeight: '600' },
  version: { color: '#A9D5BC', fontSize: 7.5 },
  instructions: { marginTop: 18, flexDirection: 'row', gap: 11, padding: 15, borderRadius: 15, backgroundColor: '#EAF8EF', borderWidth: 1, borderColor: '#D0E9D9' },
  instructionsCopy: { flex: 1 },
  instructionsTitle: { fontSize: 14, fontWeight: '700', color: '#174C31' },
  instructionsText: { marginTop: 4, fontSize: 12.5, lineHeight: 18, color: '#527060' },
  downloadButton: { minHeight: 50, marginTop: 16, borderRadius: 14, backgroundColor: '#16834B', flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' },
  downloadText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  privacyNote: { marginTop: 12, textAlign: 'center', fontSize: 11.5, color: '#76867E' },
  modalOverlay: { flex: 1, padding: 24, backgroundColor: 'rgba(8, 24, 17, 0.72)', alignItems: 'center', justifyContent: 'center' },
  qrModal: { width: '100%', maxWidth: 340, borderRadius: 22, padding: 22, backgroundColor: '#FFFFFF', alignItems: 'center' },
  qrModalTitle: { fontSize: 19, fontWeight: '800', color: '#19382B' },
  largeQr: { marginTop: 18, padding: 12, borderWidth: 1, borderColor: '#DDE8E1', borderRadius: 14 },
  qrModalCode: { marginTop: 13, fontSize: 14, fontWeight: '700', letterSpacing: 1, color: '#16834B' },
  modalClose: { alignSelf: 'stretch', marginTop: 18, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#EAF5EE' },
  modalCloseText: { color: '#166534', fontWeight: '700' },
});
