/**
 * Mobile Login Screen
 *
 * Login screen for volunteers and LGU staff to access the mobile app.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mobileAuthService, User } from '../services/auth/MobileAuthService';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  onBack?: () => void;
}

export default function LoginScreen({ onLoginSuccess, onBack }: LoginScreenProps) {
  const { width: screenWidth } = useWindowDimensions();
  const otpInputRef = useRef<TextInput | null>(null);
  const otpScales = useRef(Array.from({ length: 6 }, () => new Animated.Value(1))).current;
  const prevOtpRef = useRef('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isOtpFocused, setIsOtpFocused] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const isOtpChallenge = !!otpToken;
  const isCompactScreen = screenWidth < 380;
  const otpBoxSize = Math.max(40, Math.min(52, Math.floor((screenWidth - 150) / 6)));
  const isLoginReady = isOtpChallenge
    ? email.trim().length > 0 && otp.trim().length === 6
    : email.trim().length > 0 && password.trim().length > 0;

  useEffect(() => {
    const previous = prevOtpRef.current;
    prevOtpRef.current = otp;

    // Animate only when a new OTP digit is entered.
    if (otp.length > previous.length) {
      const index = otp.length - 1;
      const scale = otpScales[index];
      if (!scale) return;

      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 110,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [otp, otpScales]);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const validateOtp = (value: string): boolean => {
    if (!/^\d{6}$/.test(value)) {
      setOtpError('Enter the 6-digit verification code');
      return false;
    }
    setOtpError(null);
    return true;
  };

  const resetOtpChallenge = () => {
    setOtpToken(null);
    setOtp('');
    setOtpError(null);
  };

  const handleLogin = async () => {
    setError(null);

    const isEmailValid = validateEmail(email);
    if (!isEmailValid) {
      return;
    }

    if (isOtpChallenge) {
      if (!validateOtp(otp)) {
        return;
      }
    } else {
      const isPasswordValid = validatePassword(password);
      if (!isPasswordValid) {
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = isOtpChallenge
        ? await mobileAuthService.verifyLoginOtp(otpToken, otp)
        : await mobileAuthService.login(email, password);

      if (response.success && response.data) {
        onLoginSuccess(response.data.user);
      } else if (response.success && response.otpRequired && response.otpToken) {
        setOtpToken(response.otpToken);
        setOtp('');
        setPassword('');
        setOtpError(null);
        Alert.alert('Verification Required', response.message || 'Enter the code sent to your Gmail address.');
      } else {
        if (response.code === 'INVALID_ROLE') {
          Alert.alert(
            'Access Denied',
            'This account is not allowed to use the mobile app.',
            [{ text: 'OK' }]
          );
        } else if (response.code === 'ACCOUNT_INACTIVE') {
          Alert.alert(
            'Account Inactive',
            response.message || 'Your account is not active. Please contact an administrator.',
            [{ text: 'OK' }]
          );
        } else if (response.code === 'OTP_SEND_FAILED') {
          setError(response.message || 'Unable to send the verification code.');
        } else {
          setError(response.message || 'Login failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpToken) return;

    setError(null);
    setIsResendingOtp(true);
    try {
      const response = await mobileAuthService.resendLoginOtp(otpToken);
      if (response.success) {
        Alert.alert('Code Sent', response.message || 'A new verification code has been sent.');
      } else {
        setError(response.message || 'Failed to resend verification code.');
      }
    } finally {
      setIsResendingOtp(false);
    }
  };

  const renderPasswordLogin = () => (
    <>
      <View style={[styles.inputContainer, emailError && styles.inputContainerError, isEmailFocused && styles.inputContainerFocused]}>
        <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#888"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) validateEmail(text);
          }}
          onFocus={() => setIsEmailFocused(true)}
          onBlur={() => setIsEmailFocused(false)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
      </View>
      {emailError && <Text style={styles.fieldError}>{emailError}</Text>}

      <View style={[styles.inputContainer, passwordError && styles.inputContainerError, isPasswordFocused && styles.inputContainerFocused]}>
        <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) validatePassword(text);
          }}
          onFocus={() => setIsPasswordFocused(true)}
          onBlur={() => setIsPasswordFocused(false)}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#888" />
        </TouchableOpacity>
      </View>
      {passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
    </>
  );

  const renderOtpChallenge = () => (
    <>
      <View style={[styles.otpSection, isCompactScreen && styles.otpSectionCompact]}>
        <Text style={styles.otpScreenTitle}>OTP Verification</Text>
        <Text style={styles.otpDescription}>Enter the 6-digit code sent to</Text>
        <Text style={styles.otpEmailText} numberOfLines={1} ellipsizeMode="middle">{email}</Text>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            setIsOtpFocused(true);
            otpInputRef.current?.focus();
          }}
          style={[
            styles.otpBoxesContainer,
            otpError && styles.otpBoxesContainerError,
          ]}
        >
          {Array.from({ length: 6 }).map((_, index) => {
            const digit = otp[index] || '';
            const isActiveBox = otp.length === index && otp.length < 6;
            return (
              <Animated.View
                key={index}
                style={[
                  styles.otpBox,
                  { width: otpBoxSize, height: Math.round(otpBoxSize * 1.2) },
                  { transform: [{ scale: otpScales[index] }] },
                  digit && styles.otpBoxFilled,
                  isActiveBox && styles.otpBoxActive,
                ]}
              >
                <Text style={styles.otpBoxText}>{digit}</Text>
              </Animated.View>
            );
          })}
        </TouchableOpacity>
        <TextInput
          ref={otpInputRef}
          style={styles.otpHiddenInput}
          value={otp}
          onChangeText={(text) => {
            const sanitized = text.replace(/\D/g, '').slice(0, 6);
            setOtp(sanitized);
            if (otpError) validateOtp(sanitized);
          }}
          onFocus={() => setIsOtpFocused(true)}
          onBlur={() => setIsOtpFocused(false)}
          keyboardType="number-pad"
          autoCapitalize="none"
          editable={!isLoading}
          maxLength={6}
          autoFocus
        />
      </View>
      {otpError && <Text style={styles.fieldErrorCentered}>{otpError}</Text>}

      <View style={styles.challengeActions}>
        <TouchableOpacity
          onPress={handleResendOtp}
          disabled={isLoading || isResendingOtp}
          style={styles.challengeLinkButton}
        >
          <Text style={styles.challengeLinkText}>
            {isResendingOtp ? 'Sending...' : 'Resend code'}
          </Text>
        </TouchableOpacity>
        <View style={styles.challengeActionDivider} />
        <TouchableOpacity
          onPress={resetOtpChallenge}
          disabled={isLoading || isResendingOtp}
          style={styles.challengeLinkButton}
        >
          <Text style={styles.challengeLinkTextMuted}>Use different email</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isOtpChallenge && styles.scrollContentOtp,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2E7D32" />
          </TouchableOpacity>
        )}

        {!isOtpChallenge && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              <Text style={styles.welcomeGreen}>Welcome </Text>
              <Text style={styles.welcomeYellow}>Back!</Text>
            </Text>
            <Text style={styles.volunteerSubtitle}>LGU Staff Portal</Text>
          </View>
        )}

        <View style={[styles.formContainer, isOtpChallenge && styles.otpFormContainer]}>
          {isOtpChallenge ? renderOtpChallenge() : renderPasswordLogin()}

          {!!error && <Text style={styles.loginErrorText}>{error}</Text>}

          <TouchableOpacity
            style={[
              styles.loginButtonMain,
              isLoginReady ? styles.loginButtonMainActive : styles.loginButtonMainInactive,
              isLoading && styles.loginButtonMainDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonMainText}>{isOtpChallenge ? 'Verify Code' : 'Sign In'}</Text>
            )}
          </TouchableOpacity>

          {!isOtpChallenge && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Don't have an account? Contact your barangay administrator.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  scrollContentOtp: {
    justifyContent: 'flex-start',
    paddingTop: 22,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'ios' ? 50 : 30,
    zIndex: 10,
    padding: 5,
  },
  welcomeContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  welcomeGreen: {
    color: '#2E7D32',
  },
  welcomeYellow: {
    color: '#ECC323',
  },
  volunteerSubtitle: {
    color: '#6B7280',
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    paddingTop: 22,
    paddingBottom: 18,
  },
  otpFormContainer: {
    alignItems: 'stretch',
    paddingTop: 28,
    paddingBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  inputContainerError: {
    borderColor: '#B00020',
  },
  inputContainerFocused: {
    borderColor: '#2E7D32',
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  otpSection: {
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  otpSectionCompact: {
    marginBottom: 12,
  },
  otpScreenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 18,
  },
  otpDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  otpEmailText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 22,
    width: '100%',
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginTop: 6,
  },
  otpBoxesContainerError: {},
  otpBox: {
    minWidth: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DCE4F8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: '#2E7D32',
    backgroundColor: '#FFFFFF',
  },
  otpBoxActive: {
    borderColor: '#2E7D32',
    borderWidth: 2,
  },
  otpBoxText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E7D32',
  },
  otpHiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  fieldError: {
    color: '#B00020',
    fontSize: 13,
    marginBottom: 10,
    marginLeft: 2,
  },
  fieldErrorCentered: {
    color: '#B00020',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  loginErrorText: {
    color: '#B00020',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  challengeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 8,
    marginBottom: 18,
  },
  challengeActionDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 10,
  },
  challengeLinkButton: {
    paddingVertical: 4,
  },
  challengeLinkText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
  challengeLinkTextMuted: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButtonMain: {
    width: '100%',
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loginButtonMainInactive: {
    backgroundColor: '#BDBDBD',
  },
  loginButtonMainActive: {
    backgroundColor: '#2E7D32',
  },
  loginButtonMainDisabled: {
    opacity: 0.7,
  },
  loginButtonMainText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 2,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 20,
  },
});
