import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface QRReceiptScreenProps {
  onBack: () => void;
  onNavigate?: (screen: 'home' | 'qr' | 'profile') => void;
}

export default function QRReceiptScreen({ onBack, onNavigate }: QRReceiptScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <View style={styles.backButtonIcon}>
            <Ionicons name="arrow-back" size={22} color="#333" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={18} color="#333" />
          <Text style={styles.helpText}>HELP</Text>
        </TouchableOpacity>
      </View>

      {/* Green Header Section */}
      <View style={styles.greenHeader}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="security" size={32} color="#2E7D32" />
          </View>
        </View>
        <Text style={styles.headerTitle}>Kapit-Bisig Relief</Text>
        <Text style={styles.headerSubtitle}>Official LGU Disaster Response System</Text>
      </View>

      {/* Receipt Card */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>DIGITAL RELIEF RECEIPT</Text>
            <Text style={styles.receiptSubtitle}>Please keep this digital copy secure</Text>
          </View>

          <View style={styles.dashedLine} />

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              <View style={styles.qrPlaceholder}>
                <MaterialIcons name="qr-code-2" size={150} color="#333" />
              </View>
            </View>
            <View style={styles.claimBadge}>
              <MaterialIcons name="qr-code-2" size={20} color="#2E7D32" />
              <Text style={styles.claimText}>Present to claim relief goods</Text>
            </View>
          </View>

          <View style={styles.dashedLine} />

          {/* Resident Information */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>RESIDENT INFORMATION</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>Juan Dela Cruz</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Household ID</Text>
              <View style={styles.householdIdContainer}>
                <MaterialIcons name="home" size={16} color="#2E7D32" />
                <Text style={styles.infoValue}>KBR-2023-8892</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Barangay / Address</Text>
              <Text style={styles.infoValue}>Brgy. San Jose, Zone 4</Text>
            </View>
          </View>

          <View style={styles.dashedLine} />

          {/* Relief & Claim Details */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>RELIEF & CLAIM DETAILS</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Disaster Type</Text>
              <View style={styles.disasterBadge}>
                <Text style={styles.disasterText}>Typhoon Egay</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Batch ID</Text>
              <Text style={styles.infoValue}>BATCH-04-A</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Priority Level</Text>
              <View style={styles.priorityContainer}>
                <Text style={styles.priorityIcon}>!</Text>
                <Text style={styles.priorityText}>High Priority</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date Generated</Text>
              <Text style={styles.infoValue}>Oct 24, 2023, 09:30 AM</Text>
            </View>
          </View>

          {/* Reference Section */}
          <View style={styles.referenceSection}>
            <View style={styles.referenceLeft}>
              <Text style={styles.referenceLabel}>REFERENCE NO.</Text>
              <Text style={styles.referenceNumber}>REF-99283712</Text>
            </View>
            <View style={styles.validBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
              <Text style={styles.validText}>VALID</Text>
            </View>
          </View>

          <View style={styles.disclaimerSection}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.disclaimerText}>
              This QR code is valid for one-time use only.{'\n'}
              Unauthorized reproduction is punishable by law.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.saveButton}>
          <Ionicons name="download-outline" size={20} color="#333" />
          <Text style={styles.saveButtonText}>Save to Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-social-outline" size={20} color="#FFF" />
          <Text style={styles.shareButtonText}>Share Receipt</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E7D32',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  backButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  helpText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  greenHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoContainer: {
    marginBottom: 12,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 10,
    paddingTop: 25,
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: '100%',
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 1,
  },
  receiptSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  dashedLine: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginVertical: 15,
  },
  qrSection: {
    alignItems: 'center',
  },
  qrContainer: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrPlaceholder: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  claimBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 8,
  },
  claimText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  infoSection: {
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  householdIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  disasterBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  disasterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF5252',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF5252',
  },
  referenceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F7F5',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  referenceLeft: {},
  referenceLabel: {
    fontSize: 10,
    color: '#888',
    letterSpacing: 0.5,
  },
  referenceNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  validText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  disclaimerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
    gap: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
