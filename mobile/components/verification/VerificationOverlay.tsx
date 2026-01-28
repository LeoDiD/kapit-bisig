/**
 * AI Verification Overlay Component
 * Displays real-time feedback during ID and face verification
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerificationStep } from '../../services/ai';

const { width, height } = Dimensions.get('window');

interface VerificationOverlayProps {
  visible: boolean;
  currentStep: VerificationStep | null;
  progress: number;
  isProcessing: boolean;
  result?: {
    isSuccess: boolean;
    message: string;
  } | null;
  onComplete?: () => void;
}

const STEP_LABELS: Record<VerificationStep, string> = {
  id_front_capture: 'Analyzing Front ID',
  id_back_capture: 'Analyzing Back ID',
  id_quality_check: 'Checking Image Quality',
  id_ocr: 'Extracting ID Information',
  id_data_validation: 'Validating ID Data',
  face_capture: 'Capturing Face',
  face_quality_check: 'Checking Face Quality',
  face_liveness: 'Performing Liveness Check',
  face_matching: 'Matching Face with ID',
  final_verification: 'Finalizing Verification',
};

const STEP_ICONS: Record<VerificationStep, keyof typeof Ionicons.glyphMap> = {
  id_front_capture: 'card-outline',
  id_back_capture: 'card-outline',
  id_quality_check: 'checkmark-circle-outline',
  id_ocr: 'scan-outline',
  id_data_validation: 'document-text-outline',
  face_capture: 'camera-outline',
  face_quality_check: 'image-outline',
  face_liveness: 'eye-outline',
  face_matching: 'people-outline',
  final_verification: 'shield-checkmark-outline',
};

export default function VerificationOverlay({
  visible,
  currentStep,
  progress,
  isProcessing,
  result,
  onComplete,
}: VerificationOverlayProps) {
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    // Pulse animation for processing indicator
    if (isProcessing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isProcessing]);

  useEffect(() => {
    // Scale animation on result
    if (result) {
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onComplete) {
          setTimeout(onComplete, 1000);
        }
      });
    }
  }, [result]);

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const getStepNumber = () => {
    const steps: VerificationStep[] = [
      'id_front_capture',
      'id_back_capture',
      'id_quality_check',
      'id_ocr',
      'id_data_validation',
      'face_capture',
      'face_quality_check',
      'face_liveness',
      'face_matching',
      'final_verification',
    ];
    const index = currentStep ? steps.indexOf(currentStep) + 1 : 0;
    return `${index}/${steps.length}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Processing Indicator */}
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ scale: result ? scaleAnimation : pulseAnimation }] },
            ]}
          >
            {result ? (
              <Ionicons
                name={result.isSuccess ? 'checkmark-circle' : 'close-circle'}
                size={80}
                color={result.isSuccess ? '#4CAF50' : '#F44336'}
              />
            ) : currentStep ? (
              <View style={styles.stepIconWrapper}>
                <Ionicons
                  name={STEP_ICONS[currentStep]}
                  size={60}
                  color="#2E7D32"
                />
                {isProcessing && (
                  <ActivityIndicator
                    size="large"
                    color="#2E7D32"
                    style={styles.processingIndicator}
                  />
                )}
              </View>
            ) : (
              <ActivityIndicator size="large" color="#2E7D32" />
            )}
          </Animated.View>

          {/* Status Text */}
          <Text style={styles.statusText}>
            {result
              ? result.message
              : currentStep
              ? STEP_LABELS[currentStep]
              : 'Initializing...'}
          </Text>

          {/* Step Counter */}
          {currentStep && !result && (
            <Text style={styles.stepCounter}>Step {getStepNumber()}</Text>
          )}

          {/* Progress Bar */}
          {!result && (
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[styles.progressBar, { width: progressWidth }]}
              />
            </View>
          )}

          {/* Progress Percentage */}
          {!result && (
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          )}

          {/* AI Badge */}
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={14} color="#2E7D32" />
            <Text style={styles.aiBadgeText}>AI-Powered Verification</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: width * 0.85,
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F9F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepIconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingIndicator: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepCounter: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 16,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
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
});
