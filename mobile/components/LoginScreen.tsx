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
  Alert,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mobileAuthService, User } from '../services/auth/MobileAuthService';
import { theme } from '../theme';
import StaffForgotPasswordScreen from './StaffForgotPasswordScreen';

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
  const [showRecovery, setShowRecovery] = useState(false);

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
        } else if (response.code === 'ACCOUNT_LOCKED') {
          setError(response.message || 'Too many failed attempts. Please wait before trying again, or reset your password.');
        } else if (response.code === 'FIRST_LOGIN_REQUIRED') {
          setError(response.message || 'This account is awaiting activation. Ask an administrator to resend your activation code.');
        } else if (response.code === 'INVALID_CREDENTIALS') {
          setError('The email or password is incorrect. You can reset your password below.');
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

  if (showRecovery) {
    return (
      <StaffForgotPasswordScreen
        initialEmail={email}
        onBack={() => setShowRecovery(false)}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.loginKeyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.loginScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.loginBackButton}>
            <Ionicons name="arrow-back" size={24} color="#2E7D32" />
          </TouchableOpacity>
        )}

        {!isOtpChallenge && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              <Text style={styles.welcomeGreen}>Welcome </Text>
              <Text style={styles.welcomeYellow}>Back!</Text>
            </Text>
            <Text style={styles.brandTagline}>LGU Staff Portal</Text>
          </View>
        )}

        <View style={[styles.formContainer, isOtpChallenge && styles.otpFormContainer]}>
          {isOtpChallenge ? renderOtpChallenge() : renderPasswordLogin()}

          {!!error && <Text style={styles.loginErrorText}>{error}</Text>}

          {!isOtpChallenge && (
            <View style={styles.optionsContainer}>
              <View />
              <TouchableOpacity
                onPress={() => {
                  setError(null);
                  setShowRecovery(true);
                }}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.loginButtonMain, isLoading && styles.loginButtonMainDisabled]}
            onPress={handleLogin}
            disabled={!isLoginReady || isLoading}
          >
            <Text style={styles.loginButtonMainText}>
              {isLoading ? (isOtpChallenge ? 'Verifying...' : 'Signing In...') : (isOtpChallenge ? 'Verify Code' : 'Login')}
            </Text>
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
  loginKeyboardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loginScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 30,
  },
  loginBackButton: {
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
  },
  welcomeGreen: {
    color: '#2E7D32',
  },
  welcomeYellow: {
    color: '#ECC323',
  },
  brandTagline: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    paddingTop: 22,
    paddingBottom: 18,
  },
  otpFormContainer: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  inputContainerError: {
    borderColor: theme.colors.error,
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
    padding: theme.spacing.xs,
  },
  otpSection: {
    width: '100%',
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  otpSectionCompact: {
    marginBottom: theme.spacing.sm,
  },
  otpScreenTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  otpDescription: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  otpEmailText: {
    fontSize: theme.typography.size.sm,
    fontWeight: '700',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    width: '100%',
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    width: '100%',
    marginTop: theme.spacing.xs,
  },
  otpBoxesContainerError: {},
  otpBox: {
    minWidth: 40,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  otpBoxActive: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  otpBoxText: {
    fontSize: theme.typography.size.xl,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  otpHiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  fieldError: {
    color: theme.colors.error,
    fontSize: 13,
    marginBottom: theme.spacing.sm,
    marginLeft: 2,
  },
  fieldErrorCentered: {
    color: theme.colors.error,
    fontSize: 13,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  loginErrorText: {
    color: theme.colors.error,
    fontSize: 13,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 25,
  },
  forgotText: {
    fontSize: 14,
    color: '#2E7D32',
  },
  loginButtonMain: {
    width: '100%',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loginButtonMainDisabled: {
    opacity: 0.7,
  },
  loginButtonMainText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  challengeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 8,
    marginBottom: theme.spacing.md,
  },
  challengeActionDivider: {
    width: 1,
    height: 14,
    backgroundColor: theme.colors.divider,
    marginHorizontal: theme.spacing.sm,
  },
  challengeLinkButton: {
    paddingVertical: 4,
  },
  challengeLinkText: {
    color: theme.colors.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: '600',
  },
  challengeLinkTextMuted: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
    fontWeight: '600',
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
