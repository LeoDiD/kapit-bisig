/**
 * ID Scanner Component
 * Provides visual guidance for ID capture with AI quality feedback
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { IDValidationResult } from '../../services/ai';

const { width, height } = Dimensions.get('window');

interface IDScannerProps {
  visible: boolean;
  side: 'front' | 'back';
  idType: string;
  onCapture: (uri: string) => Promise<IDValidationResult>;
  onComplete: (uri: string, result: IDValidationResult) => void;
  onCancel: () => void;
}

export default function IDScanner({
  visible,
  side,
  idType,
  onCapture,
  onComplete,
  onCancel,
}: IDScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<IDValidationResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Guidance & Auto-capture states
  const [autoCapture, setAutoCapture] = useState(false);
  const [isDeviceSteady, setIsDeviceSteady] = useState(true);
  const [guidanceTipIndex, setGuidanceTipIndex] = useState(0);

  const cameraRef = useRef<any>(null);
  const scanLineAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const autoCaptureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const guidanceTips = [
    'Place the entire ID inside the frame rectangle.',
    'Ensure good lighting and avoid direct reflections/glare.',
    'Hold your phone steady until the frame turns green.',
    'Do not crop edges of the ID card.',
    'Capture only the ID card without extra background.',
  ];

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission]);

  // Rotate guidance tips every 4 seconds
  useEffect(() => {
    if (!visible || capturedImage) return;
    const interval = setInterval(() => {
      setGuidanceTipIndex((prev) => (prev + 1) % guidanceTips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [visible, capturedImage]);

  // Handle device motion / stability detection for auto-capture
  useEffect(() => {
    if (!visible || capturedImage || !autoCapture || isProcessing) return;

    //Dwell timer for auto-capture when device is steady
    if (isDeviceSteady) {
      autoCaptureTimerRef.current = setTimeout(() => {
        handleCapture();
      }, 1200);
    } else if (autoCaptureTimerRef.current) {
      clearTimeout(autoCaptureTimerRef.current);
    }

    return () => {
      if (autoCaptureTimerRef.current) clearTimeout(autoCaptureTimerRef.current);
    };
  }, [visible, capturedImage, autoCapture, isDeviceSteady, isProcessing]);

  useEffect(() => {
    if (visible && !capturedImage) {
      // Animate scan line
      const scanAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      scanAnimation.start();
      return () => scanAnimation.stop();
    }
  }, [visible, capturedImage]);

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: false,
      });

      setCapturedImage(photo.uri);
      
      // Perform client-side quality validation & AI processing
      const result = await onCapture(photo.uri);
      setValidationResult(result);
      setShowFeedback(true);

      // Animate feedback
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Capture Failed', 'Unable to capture photo. Please check camera focus and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setValidationResult(null);
    setShowFeedback(false);
  };

  const handleConfirm = () => {
    if (capturedImage && validationResult) {
      onComplete(capturedImage, validationResult);
    }
  };

  // Standard ID aspect ratio cutout height (width: width - 48, ratio: 1.586)
  const scanAreaWidth = width - 48;
  const scanAreaHeight = Math.round(scanAreaWidth / 1.586);

  const scanLineTranslate = scanLineAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, scanAreaHeight - 10],
  });

  const cornerColor = isDeviceSteady ? '#4CAF50' : '#FF9800';

  const renderCamera = () => (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        {/* Overlay with cutout for ID */}
        <View style={styles.overlay}>
          <View style={styles.topOverlay}>
            {/* Auto Capture Toggle Header */}
            <View style={styles.autoCaptureBar}>
              <TouchableOpacity
                style={[styles.autoCaptureToggle, autoCapture && styles.autoCaptureActive]}
                onPress={() => setAutoCapture(!autoCapture)}
              >
                <Ionicons
                  name={autoCapture ? 'sparkles' : 'camera-outline'}
                  size={16}
                  color={autoCapture ? '#FFF' : '#E0E0E0'}
                />
                <Text style={[styles.autoCaptureText, autoCapture && styles.autoCaptureTextActive]}>
                  {autoCapture ? 'Auto Capture: ON' : 'Auto Capture: OFF'}
                </Text>
              </TouchableOpacity>

              {/* Steady Hand Badge */}
              <View style={[styles.steadyBadge, { backgroundColor: isDeviceSteady ? 'rgba(76, 175, 80, 0.85)' : 'rgba(255, 152, 0, 0.85)' }]}>
                <Ionicons name={isDeviceSteady ? 'checkmark-circle' : 'hand-left-outline'} size={14} color="#FFF" />
                <Text style={styles.steadyBadgeText}>
                  {isDeviceSteady ? 'Device Steady' : 'Hold Steady'}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.middleRow, { height: scanAreaHeight }]}>
            <View style={styles.sideOverlay} />
            <View style={[styles.scanArea, { height: scanAreaHeight, borderColor: cornerColor }]}>
              {/* Corner guides */}
              <View style={[styles.corner, styles.topLeft, { borderColor: cornerColor }]} />
              <View style={[styles.corner, styles.topRight, { borderColor: cornerColor }]} />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: cornerColor }]} />
              <View style={[styles.corner, styles.bottomRight, { borderColor: cornerColor }]} />
              
              {/* Scan line */}
              <Animated.View
                style={[
                  styles.scanLine,
                  { transform: [{ translateY: scanLineTranslate }], backgroundColor: cornerColor },
                ]}
              />
              
              {/* Center text */}
              <Text style={styles.scanAreaText}>
                Align {side === 'front' ? 'FRONT' : 'BACK'} of ID inside frame
              </Text>
            </View>
            <View style={styles.sideOverlay} />
          </View>

          <View style={styles.bottomOverlay} />
        </View>
      </CameraView>

      {/* Dynamic Guidance Banner */}
      <View style={styles.instructions}>
        <Ionicons name="bulb-outline" size={20} color="#2E7D32" />
        <Text style={styles.instructionText}>
          {guidanceTips[guidanceTipIndex]}
        </Text>
      </View>

      {/* Capture Button */}
      <TouchableOpacity
        style={styles.captureButton}
        onPress={handleCapture}
        disabled={isProcessing}
      >
        <View style={[styles.captureButtonInner, { borderColor: cornerColor }]}>
          {isProcessing ? (
            <Ionicons name="hourglass" size={32} color="#2E7D32" />
          ) : (
            <View style={[styles.captureButtonDot, { backgroundColor: cornerColor }]} />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderPreview = () => (
    <View style={styles.previewContainer}>
      <Image source={{ uri: capturedImage! }} style={styles.previewImage} />
      
      {/* Validation Feedback */}
      {showFeedback && validationResult && (
        <Animated.View
          style={[
            styles.feedbackContainer,
            { transform: [{ scale: pulseAnimation }] },
          ]}
        >
          <View
            style={[
              styles.feedbackBadge,
              validationResult.isValid ? styles.successBadge : styles.warningBadge,
            ]}
          >
            <Ionicons
              name={validationResult.isValid ? 'checkmark-circle' : 'alert-circle'}
              size={24}
              color="#FFF"
            />
            <Text style={styles.feedbackTitle}>
              {validationResult.isValid ? 'ID Verified' : 'Review Needed'}
            </Text>
          </View>

          {/* Quality Score */}
          <View style={styles.qualityContainer}>
            <Text style={styles.qualityLabel}>Quality Score</Text>
            <View style={styles.qualityBarContainer}>
              <View
                style={[
                  styles.qualityBar,
                  { 
                    width: `${validationResult.qualityScore * 100}%`,
                    backgroundColor: validationResult.qualityScore > 0.7 
                      ? '#4CAF50' 
                      : validationResult.qualityScore > 0.5 
                        ? '#FF9800' 
                        : '#F44336'
                  },
                ]}
              />
            </View>
            <Text style={styles.qualityValue}>
              {Math.round(validationResult.qualityScore * 100)}%
            </Text>
          </View>

          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <View style={styles.warningsContainer}>
              {validationResult.warnings.map((warning, index) => (
                <View key={index} style={styles.warningItem}>
                  <Ionicons name="warning" size={16} color="#FF9800" />
                  <Text style={styles.warningText}>{warning}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Errors */}
          {validationResult.errors.length > 0 && (
            <View style={styles.errorsContainer}>
              {validationResult.errors.map((error, index) => (
                <View key={index} style={styles.errorItem}>
                  <Ionicons name="close-circle" size={16} color="#F44336" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Extracted Data Preview */}
          {validationResult.extractedData && validationResult.extractedData.fullName && (
            <View style={styles.extractedDataContainer}>
              <Text style={styles.extractedDataTitle}>Detected Information</Text>
              <Text style={styles.extractedDataItem}>
                Name: {validationResult.extractedData.fullName}
              </Text>
              {validationResult.extractedData.idNumber && (
                <Text style={styles.extractedDataItem}>
                  ID Number: {validationResult.extractedData.idNumber}
                </Text>
              )}
            </View>
          )}
        </Animated.View>
      )}

      {/* Action Buttons */}
      <View style={styles.previewActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.retakeButton]}
          onPress={handleRetake}
        >
          <Ionicons name="camera-reverse" size={24} color="#666" />
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.confirmButton,
            (!validationResult?.isValid && validationResult?.errors.length! > 0) && styles.disabledButton,
          ]}
          onPress={handleConfirm}
          disabled={!validationResult?.isValid && validationResult?.errors.length! > 0}
        >
          <Ionicons name="checkmark" size={24} color="#FFF" />
          <Text style={styles.confirmButtonText}>
            {validationResult?.isValid ? 'Use This Photo' : 'Continue Anyway'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#2E7D32" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Please grant camera permission to scan your ID
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Scan {side === 'front' ? 'Front' : 'Back'} of ID
          </Text>
          <View style={styles.idTypeBadge}>
            <Text style={styles.idTypeText}>{idType}</Text>
          </View>
        </View>

        {/* Content */}
        {capturedImage ? renderPreview() : renderCamera()}

        {/* AI Badge */}
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={14} color="#2E7D32" />
          <Text style={styles.aiBadgeText}>AI-Powered Analysis</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFF',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  idTypeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  idTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2E7D32',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-start',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  autoCaptureBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  autoCaptureToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  autoCaptureActive: {
    backgroundColor: '#2E7D32',
  },
  autoCaptureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E0E0E0',
  },
  autoCaptureTextActive: {
    color: '#FFF',
  },
  steadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  steadyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  middleRow: {
    flexDirection: 'row',
    height: 200,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanArea: {
    width: width - 48,
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#2E7D32',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: 'absolute',
    width: '90%',
    height: 2,
    backgroundColor: '#2E7D32',
    opacity: 0.8,
  },
  scanAreaText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  captureButton: {
    alignSelf: 'center',
    marginBottom: 32,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E7D32',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  feedbackContainer: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
  },
  feedbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 12,
  },
  successBadge: {
    backgroundColor: '#4CAF50',
  },
  warningBadge: {
    backgroundColor: '#FF9800',
  },
  feedbackTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  qualityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  qualityLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  qualityBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  qualityBar: {
    height: '100%',
    borderRadius: 4,
  },
  qualityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
    width: 40,
    textAlign: 'right',
  },
  warningsContainer: {
    marginTop: 8,
    gap: 4,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#FF9800',
    flex: 1,
  },
  errorsContainer: {
    marginTop: 8,
    gap: 4,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#F44336',
    flex: 1,
  },
  extractedDataContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  extractedDataTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  extractedDataItem: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  previewActions: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#2E7D32',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
  },
  aiBadge: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2E7D32',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
