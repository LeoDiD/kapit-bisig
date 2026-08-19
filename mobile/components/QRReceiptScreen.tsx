import React, { useRef, useState } from 'react';
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
import ViewShot from 'react-native-view-shot';
import { ResidentQrData } from '../services/api/ResidentQrService';
import { residentTheme } from '../theme';
import { saveViewToMediaLibrary } from '../utils/saveViewToMediaLibrary';
import ResidentBrandLockup from './ui/ResidentBrandLockup';

const residentColors = residentTheme.colors;

interface QRReceiptScreenProps {
  onBack: () => void;
  onNavigate?: (screen: 'home' | 'qr' | 'profile') => void;
  idData: ResidentQrData | null;
  isLoading?: boolean;
  error?: string | null;
  warning?: string | null;
  onRefresh?: (force?: boolean) => Promise<void>;
}

function formatIssuedDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function QRReceiptScreen({
  onBack,
  idData,
  isLoading = false,
  error = null,
  warning = null,
  onRefresh,
}: QRReceiptScreenProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showLargeQr, setShowLargeQr] = useState(false);
  const idCardRef = useRef<any>(null);

  const handleDownload = async () => {
    if (!idCardRef.current || !idData || isDownloading) return;
    setIsDownloading(true);
    try {
      const result = await saveViewToMediaLibrary(idCardRef);
      if (result === 'permission-denied') {
        Alert.alert('Photos permission needed', 'Allow photo access to save your virtual ID.');
        return;
      }
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
          <Ionicons name="arrow-back" size={22} color={residentColors.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Virtual ID</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => Alert.alert('Virtual Resident ID', 'Present this ID at a Kapit-Bisig distribution. Staff will scan the QR and the system will verify your enrollment and claim status.')}
        >
          <Ionicons name="information-circle-outline" size={22} color={residentColors.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading && !idData ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={residentColors.icon} />
            <Text style={styles.stateText}>Preparing your verified ID…</Text>
          </View>
        ) : !idData && error ? (
          <View style={styles.stateCard}>
            <View style={styles.lockCircle}><Ionicons name="lock-closed" size={24} color="#9A6700" /></View>
            <Text style={styles.stateTitle}>Virtual ID is locked</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => onRefresh?.(true)}
              disabled={isLoading || !onRefresh}
            >
              <Text style={styles.outlineButtonText}>Check status again</Text>
            </TouchableOpacity>
          </View>
        ) : idData ? (
          <>
            <ViewShot ref={idCardRef} options={{ format: 'png', quality: 1 }} style={styles.shot}>
              <View style={styles.idCard}>
                <View style={styles.brandRail} />
                <View style={styles.idHeader}>
                  <ResidentBrandLockup size="credential" subtitle="VIRTUAL RESIDENT ID" style={styles.brandLockup} />
                  <View style={styles.verifiedPill}>
                    <View style={styles.verifiedDot} />
                    <Text style={styles.verifiedText}>VERIFIED</Text>
                  </View>
                </View>

                <View style={styles.idBody}>
                  <View style={styles.identityColumn}>
                    <View style={styles.photoFrame}>
                      {idData.resident.avatarUrl ? (
                        <Image source={{ uri: idData.resident.avatarUrl }} style={styles.photo} />
                      ) : (
                        <Ionicons name="person" size={45} color={residentColors.icon} />
                      )}
                    </View>
                    <Text style={styles.nameLabel}>RESIDENT NAME</Text>
                    <Text style={styles.residentName} numberOfLines={2}>{idData.resident.fullName}</Text>
                    <Text style={styles.residentCode}>{idData.residentCode}</Text>
                  </View>

                  <View style={styles.detailsColumn}>
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={15} color={residentColors.icon} />
                      <View><Text style={styles.detailLabel}>BARANGAY / CITY</Text><Text style={styles.detailValue}>{idData.resident.barangay}{idData.resident.city ? `, ${idData.resident.city}` : ''}</Text></View>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={15} color={residentColors.icon} />
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
              <Ionicons name="shield-checkmark-outline" size={22} color={residentColors.icon} />
              <View style={styles.instructionsCopy}>
                <Text style={styles.instructionsTitle}>Ready for relief verification</Text>
                <Text style={styles.instructionsText}>A successful scan still checks the active distribution, your barangay enrollment, and whether your household already claimed.</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.downloadButton} onPress={handleDownload} disabled={isDownloading}>
              {isDownloading ? <ActivityIndicator color={residentColors.inverse} /> : <><Ionicons name="download-outline" size={20} color={residentColors.inverse} /><Text style={styles.downloadText}>Download ID as image</Text></>}
            </TouchableOpacity>
            <Text style={styles.privacyNote}>Keep your QR private. Only show it to authorized Kapit-Bisig staff.</Text>
            {warning ? (
              <View style={styles.refreshWarning}>
                <Ionicons name="cloud-offline-outline" size={18} color="#9A6700" />
                <Text style={styles.refreshWarningText}>{warning} Your saved ID is still available.</Text>
                <TouchableOpacity onPress={() => onRefresh?.(true)} disabled={isLoading || !onRefresh}>
                  <Text style={styles.refreshWarningAction}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
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
  container: { flex: 1, backgroundColor: residentColors.background },
  header: { height: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: residentColors.surface, borderBottomWidth: 1, borderBottomColor: residentColors.borderAccent },
  headerButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: residentColors.iconSurface, borderWidth: 1, borderColor: residentColors.borderAccent, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: residentColors.ink },
  content: { padding: 18, paddingBottom: 36 },
  stateCard: { minHeight: 230, backgroundColor: residentColors.surface, borderRadius: 20, padding: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: residentColors.borderAccent, ...residentTheme.shadow },
  stateTitle: { marginTop: 12, fontSize: 18, fontWeight: '700', color: residentColors.ink },
  stateText: { marginTop: 9, fontSize: 14, lineHeight: 20, color: residentColors.secondary, textAlign: 'center' },
  lockCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF7D6', alignItems: 'center', justifyContent: 'center' },
  outlineButton: { marginTop: 18, borderWidth: 1, borderColor: residentColors.borderAccent, backgroundColor: residentColors.surface, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 18 },
  outlineButtonText: { color: residentColors.icon, fontWeight: '700' },
  refreshWarning: { marginTop: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, backgroundColor: '#FFF8E1' },
  refreshWarningText: { flex: 1, fontSize: 12, lineHeight: 17, color: '#76520A' },
  refreshWarningAction: { fontSize: 12, fontWeight: '800', color: residentColors.ink },
  shot: { borderRadius: 20, backgroundColor: residentColors.surface },
  idCard: { height: 230, borderRadius: 20, backgroundColor: residentColors.surface, overflow: 'hidden', borderWidth: 1, borderColor: residentColors.borderAccent, ...residentTheme.shadow },
  brandRail: { height: 3, backgroundColor: residentColors.brand },
  idHeader: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, backgroundColor: residentColors.surface },
  brandLockup: { flex: 1 },
  verifiedPill: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 10, backgroundColor: residentColors.surface, borderWidth: 1, borderColor: residentColors.borderAccent },
  verifiedDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: residentColors.brand },
  verifiedText: { fontSize: 7.5, fontWeight: '900', color: residentColors.ink },
  idBody: { flex: 1, flexDirection: 'row', paddingHorizontal: 13, paddingTop: 10 },
  identityColumn: { width: '57%', paddingRight: 8 },
  photoFrame: { width: 54, height: 57, borderRadius: 10, backgroundColor: residentColors.iconSurface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: residentColors.borderAccent },
  photo: { width: '100%', height: '100%' },
  nameLabel: { marginTop: 7, fontSize: 7.5, fontWeight: '800', letterSpacing: 0.8, color: residentColors.secondary },
  residentName: { marginTop: 2, fontSize: 14, lineHeight: 16, fontWeight: '800', color: residentColors.ink },
  residentCode: { marginTop: 3, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, color: residentColors.ink },
  detailsColumn: { width: '43%', alignItems: 'flex-end' },
  detailRow: { width: '100%', flexDirection: 'row', gap: 5, marginBottom: 5 },
  detailLabel: { fontSize: 6.5, fontWeight: '800', color: residentColors.secondary },
  detailValue: { maxWidth: 105, fontSize: 8.5, lineHeight: 10.5, fontWeight: '700', color: residentColors.inkSoft },
  qrFrame: { marginTop: 1, padding: 4, backgroundColor: residentColors.surface, borderRadius: 7, borderWidth: 1, borderColor: residentColors.borderAccent },
  tapHint: { marginTop: 2, fontSize: 6.5, color: residentColors.secondary },
  idFooter: { height: 23, paddingHorizontal: 13, backgroundColor: residentColors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disclaimer: { color: residentColors.inverse, fontSize: 7.5, fontWeight: '600' },
  version: { color: '#D1D5DB', fontSize: 7.5 },
  instructions: { marginTop: 18, flexDirection: 'row', gap: 11, padding: 15, borderRadius: 15, backgroundColor: residentColors.surface, borderWidth: 1, borderColor: residentColors.borderAccent },
  instructionsCopy: { flex: 1 },
  instructionsTitle: { fontSize: 14, fontWeight: '700', color: residentColors.ink },
  instructionsText: { marginTop: 4, fontSize: 12.5, lineHeight: 18, color: residentColors.secondary },
  downloadButton: { minHeight: 50, marginTop: 16, borderRadius: 14, backgroundColor: residentColors.brand, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' },
  downloadText: { color: residentColors.inverse, fontSize: 15, fontWeight: '700' },
  privacyNote: { marginTop: 12, textAlign: 'center', fontSize: 11.5, color: residentColors.secondary },
  modalOverlay: { flex: 1, padding: 24, backgroundColor: residentColors.overlay, alignItems: 'center', justifyContent: 'center' },
  qrModal: { width: '100%', maxWidth: 340, borderRadius: 22, padding: 22, backgroundColor: residentColors.surface, borderWidth: 1, borderColor: residentColors.borderAccent, alignItems: 'center' },
  qrModalTitle: { fontSize: 19, fontWeight: '800', color: residentColors.ink },
  largeQr: { marginTop: 18, padding: 12, borderWidth: 1, borderColor: residentColors.borderAccent, borderRadius: 14 },
  qrModalCode: { marginTop: 13, fontSize: 14, fontWeight: '700', letterSpacing: 1, color: residentColors.ink },
  modalClose: { alignSelf: 'stretch', marginTop: 18, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: residentColors.surface, borderWidth: 1, borderColor: residentColors.borderAccent },
  modalCloseText: { color: residentColors.icon, fontWeight: '700' },
});
