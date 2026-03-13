/**
 * Mobile Login Screen
 *
 * Login screen for volunteers and LGU staff to access the mobile app.
 */

import React, { useState } from 'react';
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
  Image,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
import { Ionicons } from '@expo/vector-icons';
import { mobileAuthService, User } from '../services/auth/MobileAuthService';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  onBack?: () => void;
}

export default function LoginScreen({ onLoginSuccess, onBack }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const isLoginReady = email.trim().length > 0 && password.trim().length > 0;

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

  const handleLogin = async () => {
    setError(null);

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await mobileAuthService.login(email, password);

      if (response.success && response.data) {
        onLoginSuccess(response.data.user);
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2E7D32" />
          </TouchableOpacity>
        )}

        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/textual.png')}
            style={styles.textualLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            <Text style={styles.welcomeGreen}>Welcome </Text>
            <Text style={styles.welcomeYellow}>Back!</Text>
          </Text>
          <Text style={styles.volunteerSubtitle}>Volunteer / LGU Staff Portal</Text>
        </View>

        <View style={styles.formContainer}>
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
              <Text style={styles.loginButtonMainText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Don't have an account? Contact your barangay administrator.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingBottom: 30,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
    padding: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 20,
  },
  textualLogo: {
    width: width * 0.95,
    height: width * 0.75,
  },
  welcomeContainer: {
    marginBottom: 15,
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
  volunteerSubtitle: {
    color: '#6B7280',
    marginTop: 6,
    fontSize: 14,
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
  fieldError: {
    color: '#B00020',
    fontSize: 13,
    marginBottom: 10,
    marginLeft: 2,
  },
  loginErrorText: {
    color: '#B00020',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  loginButtonMain: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
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
    fontSize: 18,
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
