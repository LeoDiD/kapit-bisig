/**
 * Face Scanner Component
 * Provides face capture with AI-powered liveness detection and quality feedback
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FaceValidationResult } from '../../services/ai';

const { width, height } = Dimensions.get('window');

interface FaceScannerProps {
  visible: boolean;
  onCapture: (uri: string) => Promise<FaceValidationResult>;
  onComplete: (uri: string, result: FaceValidationResult) => void;
  onCancel: () => void;
  enableLivenessCheck?: boolean;
}

type ScanPhase = 'positioning' | 'scanning' | 'captured' | 'processing' | 'completed';

interface GuidanceMessage {
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'info' | 'warning' | 'success';
}

export default function FaceScanner({
  visible,
  onCapture,
  onComplete,
  onCancel,
  enableLivenessCheck = true,
}: FaceScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<ScanPhase>('positioning');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<FaceValidationResult | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [guidance, setGuidance] = useState<GuidanceMessage>({
    message: 'Position your face in the circle',
    icon: 'person-outline',
    type: 'info',
  });

  const cameraRef = useRef<any>(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const borderColorAnimation = useRef(new Animated.Value(0)).current;
  const scanLineAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission]);

  useEffect(() => {
    // Reset state when modal opens
    if (visible) {
      setPhase('positioning');
      setCapturedImage(null);
      setValidationResult(null);
      setScanProgress(0);
      progressAnimation.setValue(0);
      setGuidance({
        message: 'Position your face in the circle',
        icon: 'person-outline',
        type: 'info',
      });
    }
  }, [visible]);

  useEffect(() => {
    // Pulse animation for face guide
    if (phase === 'positioning') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [phase]);

  useEffect(() => {
    // Scan line animation
    if (phase === 'scanning') {
      const scanAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnimation, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      scanAnim.start();
      return () => scanAnim.stop();
    }
  }, [phase]);

  const startScan = useCallback(() => {
    setPhase('scanning');
    setGuidance({
      message: 'Hold still, scanning...',
      icon: 'scan-outline',
      type: 'info',
    });

    // Simulate scanning progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setScanProgress(progress);
      
      Animated.timing(progressAnimation, {
        toValue: progress,
        duration: 200,
        useNativeDriver: false,
      }).start();

      // Update border color based on progress
      Animated.timing(borderColorAnimation, {
        toValue: progress / 100,
        duration: 200,
        useNativeDriver: false,
      }).start();

      if (progress >= 100) {
        clearInterval(interval);
        capturePhoto();
      }
    }, 300);
  }, []);

  const capturePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      setPhase('processing');
      setGuidance({
        message: 'Processing...',
        icon: 'hourglass-outline',
        type: 'info',
      });

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      setCapturedImage(photo.uri);

      // Perform AI validation
      const result = await onCapture(photo.uri);
      setValidationResult(result);
      setPhase('completed');

      if (result.isValid) {
        setGuidance({
          message: 'Face verified successfully!',
          icon: 'checkmark-circle',
          type: 'success',
        });
      } else {
        setGuidance({
          message: result.qualityIssues[0] || 'Please try again',
          icon: 'alert-circle',
          type: 'warning',
        });
      }
    } catch (error) {
      console.error('Capture error:', error);
      setPhase('positioning');
      setGuidance({
        message: 'Capture failed. Please try again.',
        icon: 'close-circle',
        type: 'warning',
      });
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setValidationResult(null);
    setScanProgress(0);
    progressAnimation.setValue(0);
    borderColorAnimation.setValue(0);
    setPhase('positioning');
    setGuidance({
      message: 'Position your face in the circle',
      icon: 'person-outline',
      type: 'info',
    });
  };

  const handleConfirm = () => {
    if (capturedImage && validationResult) {
      onComplete(capturedImage, validationResult);
    }
  };

  const borderColor = borderColorAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#FFFFFF', '#81C784', '#2E7D32'],
  });

  const scanLineTranslate = scanLineAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const progressCircumference = 2 * Math.PI * 120;
  const progressOffset = progressAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: [progressCircumference, 0],
  });

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#2E7D32" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Please grant camera permission for face verification
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
        {/* Camera or Preview */}
        <View style={styles.cameraContainer}>
          {capturedImage ? (
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          ) : (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="front"
            />
          )}

          {/* Overlay */}
          <View style={styles.overlay}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>

            {/* Face Guide Circle */}
            <Animated.View
              style={[
                styles.faceGuide,
                { transform: [{ scale: pulseAnimation }] },
              ]}
            >
              {/* Progress Ring */}
              <View style={styles.progressRing}>
                <Animated.View
                  style={[
                    styles.progressArc,
                    { borderColor: borderColor },
                    phase === 'scanning' && { 
                      borderTopColor: '#2E7D32',
                      transform: [{ rotate: `${(scanProgress / 100) * 360}deg` }],
                    },
                  ]}
                />
              </View>

              {/* Scan Line */}
              {phase === 'scanning' && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    { transform: [{ translateY: scanLineTranslate }] },
                  ]}
                />
              )}

              {/* Center Content */}
              {phase === 'completed' && (
                <View style={styles.resultOverlay}>
                  <Ionicons
                    name={validationResult?.isValid ? 'checkmark-circle' : 'alert-circle'}
                    size={60}
                    color={validationResult?.isValid ? '#4CAF50' : '#FF9800'}
                  />
                </View>
              )}
            </Animated.View>

            {/* Guidance Message */}
            <View
              style={[
                styles.guidanceContainer,
                guidance.type === 'success' && styles.guidanceSuccess,
                guidance.type === 'warning' && styles.guidanceWarning,
              ]}
            >
              <Ionicons
                name={guidance.icon}
                size={24}
                color={
                  guidance.type === 'success'
                    ? '#4CAF50'
                    : guidance.type === 'warning'
                    ? '#FF9800'
                    : '#FFF'
                }
              />
              <Text
                style={[
                  styles.guidanceText,
                  guidance.type !== 'info' && styles.guidanceTextDark,
                ]}
              >
                {guidance.message}
              </Text>
            </View>

            {/* Progress Indicator */}
            {phase === 'scanning' && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressAnimation.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{scanProgress}%</Text>
              </View>
            )}

            {/* Liveness Instructions */}
            {enableLivenessCheck && phase === 'positioning' && (
              <View style={styles.livenessInstructions}>
                <Text style={styles.livenessTitle}>Liveness Check</Text>
                <View style={styles.livenessStep}>
                  <Ionicons name="eye-outline" size={20} color="#FFF" />
                  <Text style={styles.livenessStepText}>Keep eyes open</Text>
                </View>
                <View style={styles.livenessStep}>
                  <Ionicons name="sunny-outline" size={20} color="#FFF" />
                  <Text style={styles.livenessStepText}>Good lighting required</Text>
                </View>
                <View style={styles.livenessStep}>
                  <Ionicons name="glasses-outline" size={20} color="#FFF" />
                  <Text style={styles.livenessStepText}>Remove glasses if possible</Text>
                </View>
              </View>
            )}

            {/* Validation Result */}
            {phase === 'completed' && validationResult && (
              <View style={styles.validationResult}>
                {/* Quality Score */}
                <View style={styles.qualityRow}>
                  <Text style={styles.qualityLabel}>Face Quality</Text>
                  <View style={styles.qualityValue}>
                    <View style={styles.qualityBarBg}>
                      <View
                        style={[
                          styles.qualityBarFill,
                          {
                            width: `${validationResult.faceDetection.qualityScore * 100}%`,
                            backgroundColor:
                              validationResult.faceDetection.qualityScore > 0.7
                                ? '#4CAF50'
                                : '#FF9800',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.qualityPercent}>
                      {Math.round(validationResult.faceDetection.qualityScore * 100)}%
                    </Text>
                  </View>
                </View>

                {/* Issues */}
                {validationResult.qualityIssues.length > 0 && (
                  <View style={styles.issuesContainer}>
                    {validationResult.qualityIssues.map((issue, index) => (
                      <Text key={index} style={styles.issueText}>
                        • {issue}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Suggestions */}
                {validationResult.suggestions.length > 0 && !validationResult.isValid && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Tips:</Text>
                    {validationResult.suggestions.map((suggestion, index) => (
                      <Text key={index} style={styles.suggestionText}>
                        • {suggestion}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {phase === 'positioning' && (
                <TouchableOpacity style={styles.scanButton} onPress={startScan}>
                  <Ionicons name="scan" size={28} color="#FFF" />
                  <Text style={styles.scanButtonText}>Start Scan</Text>
                </TouchableOpacity>
              )}

              {phase === 'completed' && (
                <View style={styles.completedActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.retakeButton]}
                    onPress={handleRetake}
                  >
                    <Ionicons name="refresh" size={24} color="#666" />
                    <Text style={styles.retakeButtonText}>Retake</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.confirmButton,
                      !validationResult?.isValid && styles.warningButton,
                    ]}
                    onPress={handleConfirm}
                  >
                    <Ionicons name="checkmark" size={24} color="#FFF" />
                    <Text style={styles.confirmButtonText}>
                      {validationResult?.isValid ? 'Continue' : 'Use Anyway'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* AI Badge */}
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={14} color="#2E7D32" />
              <Text style={styles.aiBadgeText}>AI Face Recognition</Text>
            </View>
          </View>
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
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  progressRing: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressArc: {
    width: '100%',
    height: '100%',
    borderRadius: 130,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  scanLine: {
    position: 'absolute',
    width: '80%',
    height: 3,
    backgroundColor: '#2E7D32',
    opacity: 0.8,
  },
  resultOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 40,
    padding: 10,
  },
  guidanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
    gap: 10,
  },
  guidanceSuccess: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  guidanceWarning: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  guidanceText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  guidanceTextDark: {
    color: '#333',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  progressBar: {
    width: 150,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 3,
  },
  progressText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    width: 40,
  },
  livenessInstructions: {
    position: 'absolute',
    top: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  livenessTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  livenessStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  livenessStepText: {
    color: '#FFF',
    fontSize: 14,
  },
  validationResult: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  qualityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  qualityValue: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
    gap: 8,
  },
  qualityBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  qualityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  qualityPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 40,
    textAlign: 'right',
  },
  issuesContainer: {
    marginBottom: 8,
  },
  issueText: {
    fontSize: 13,
    color: '#F44336',
    marginTop: 4,
  },
  suggestionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginTop: 4,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  completedActions: {
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
  warningButton: {
    backgroundColor: '#FF9800',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  aiBadge: {
    position: 'absolute',
    top: 50,
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
