import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RegisterScreen from './RegisterScreen';
import LoginScreen from './LoginScreen';
import { mobileAuthService, User } from '../services/auth/MobileAuthService';
import { clearResidentSession, residentLogin, saveResidentSession } from '../services/api/ResidentQrService';

const { width } = Dimensions.get('window');
const SMS_API_URL = 'https://smsapiph.onrender.com/api/v1/send/sms';
const SMS_API_KEY = process.env.EXPO_PUBLIC_SMS_API_KEY;
const SMS_TIMEOUT_MS = 15000;
const SMS_MAX_RETRIES = 2;

type SmsProviderError = {
  code?: number;
  message?: string;
  details?: string;
};

type SmsProviderResponse = {
  success?: boolean;
  message?: string;
  error?: string | SmsProviderError;
};

interface SplashScreenProps {
  onGetStarted: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
  onVolunteerLogin?: (user: User) => void;
}

const slides = [
  {
    id: '1',
    image: require('../assets/graphics1.png'),
    text: 'Register your household and upload your IDs for instant, AI-powered verification to skip the manual paperwork.',
  },
  {
    id: '2',
    image: require('../assets/graphics2.png'),
    text: 'Get a unique Family QR code to ensure a fast, contactless, and organized experience at relief distribution center.',
  },
  {
    id: '3',
    image: require('../assets/graphics3.png'),
    text: 'Receive real-time announcements from your LGU and easily track your family\'s relief claim history in one place.',
  },
];

export default function SplashScreen({ onGetStarted, onLogin, onRegister, onVolunteerLogin }: SplashScreenProps) {
  const [showLandingScreen, setShowLandingScreen] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showInitialSplash, setShowInitialSplash] = useState(false);
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [showVolunteerLoginScreen, setShowVolunteerLoginScreen] = useState(false);
  const [showRegisterScreen, setShowRegisterScreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isMobileInputFocused, setIsMobileInputFocused] = useState(false);
  const [isPasswordInputFocused, setIsPasswordInputFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showForgotPasswordScreen, setShowForgotPasswordScreen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'contact' | 'verification' | 'reset'>('contact');
  const [forgotContactNumber, setForgotContactNumber] = useState('');
  const [forgotVerificationCode, setForgotVerificationCode] = useState('');
  const [sentVerificationCode, setSentVerificationCode] = useState('');
  const [verificationCodeExpiresAt, setVerificationCodeExpiresAt] = useState<number | null>(null);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(slideIndex);
  };

  const handleGetStarted = () => {
    setShowLandingScreen(false);
    setShowOnboarding(true);
  };

  const handleLogin = async () => {
    setLoginError('');

    if (!mobileNumber.trim() || !password.trim()) {
      setLoginError('Enter your mobile number and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      // Ensure resident login is the only active session type.
      await mobileAuthService.logout();
      await clearResidentSession();

      const response = await residentLogin(mobileNumber.trim(), password);
      if (!response.success || !response.data) {
        setLoginError(response.message || 'Login failed. Please try again.');
        return;
      }

      await saveResidentSession(response.data);

      if (onLogin) {
        onLogin();
      } else {
        onGetStarted();
      }
    } catch (error) {
      console.error('[SplashScreen] Resident login error:', error);
      setLoginError('Unable to connect to server. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = () => {
    setShowLoginScreen(false);
    setShowInitialSplash(false);
    setShowRegisterScreen(true);
  };

  const openVolunteerLoginFromResidentLogin = () => {
    setShowLoginScreen(false);
    setShowVolunteerLoginScreen(true);
  };

  const normalizeContactNumber = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');

    if (digits.startsWith('63') && digits.length === 12) {
      return `+${digits}`;
    }
    if (digits.startsWith('09') && digits.length === 11) {
      return `+63${digits.slice(1)}`;
    }
    if (digits.startsWith('9') && digits.length === 10) {
      return `+63${digits}`;
    }

    return '';
  };

  const generateVerificationCode = (): string =>
    Math.floor(100000 + Math.random() * 900000).toString();

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const parseProviderErrorMessage = (status: number, payload: SmsProviderResponse | null): string => {
    const fallback = `SMS provider returned HTTP ${status}.`;
    if (!payload) return fallback;

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }

    if (payload.error && typeof payload.error === 'object') {
      const code = payload.error.code ? `Code ${payload.error.code}: ` : '';
      const message = payload.error.message || payload.error.details || '';
      if (message) return `${code}${message}`.trim();
    }

    if (payload.message && payload.message.trim()) {
      return payload.message.trim();
    }

    return fallback;
  };

  const sendSmsWithRetry = async (recipient: string, message: string): Promise<void> => {
    let lastError = 'Failed to send verification code.';

    for (let attempt = 0; attempt <= SMS_MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SMS_TIMEOUT_MS);

      try {
        const response = await fetch(SMS_API_URL, {
          method: 'POST',
          headers: {
            'x-api-key': SMS_API_KEY as string,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipient, message }),
          signal: controller.signal,
        });

        let data: SmsProviderResponse | null = null;
        try {
          data = (await response.json()) as SmsProviderResponse;
        } catch {
          data = null;
        }

        if (response.ok && data?.success !== false) {
          clearTimeout(timeoutId);
          return;
        }

        const parsedError = parseProviderErrorMessage(response.status, data);
        lastError = parsedError;

        // Retry only transient failures / rate limit.
        if (attempt < SMS_MAX_RETRIES && (response.status === 429 || response.status >= 500)) {
          await sleep(800 * (attempt + 1));
          continue;
        }

        clearTimeout(timeoutId);
        throw new Error(parsedError);
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
          lastError = 'SMS request timed out. Please try again.';
        } else {
          lastError = error instanceof Error ? error.message : 'Failed to send verification code.';
        }

        if (attempt < SMS_MAX_RETRIES) {
          await sleep(800 * (attempt + 1));
          continue;
        }
      }
    }

    throw new Error(lastError);
  };

  const handleSendResetCode = async () => {
    if (!forgotContactNumber.trim()) {
      Alert.alert('Missing Contact Number', 'Please enter your contact number.');
      return;
    }

    const recipient = normalizeContactNumber(forgotContactNumber);
    if (!recipient) {
      Alert.alert('Invalid Contact Number', 'Use a valid PH mobile number (ex: 09XXXXXXXXX).');
      return;
    }

    if (!SMS_API_KEY) {
      Alert.alert(
        'SMS API Key Missing',
        'Set EXPO_PUBLIC_SMS_API_KEY in mobile/.env to send verification SMS.'
      );
      return;
    }

    const code = generateVerificationCode();
    const message = `Kapit-Bisig verification code: ${code}. Expires in 10 minutes.`;

    setIsSendingSms(true);
    try {
      await sendSmsWithRetry(recipient, message);

      setSentVerificationCode(code);
      setVerificationCodeExpiresAt(Date.now() + 10 * 60 * 1000);
      setForgotVerificationCode('');
      setForgotStep('verification');
      Alert.alert('Code Sent', `Verification code sent to ${recipient}.`);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to send verification code.';
      Alert.alert('SMS Send Failed', messageText);
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleVerifyCode = () => {
    if (!forgotVerificationCode.trim()) {
      Alert.alert('Missing Code', 'Please enter the verification code.');
      return;
    }

    if (!sentVerificationCode) {
      Alert.alert('No Code Sent', 'Please send a verification code first.');
      return;
    }

    if (verificationCodeExpiresAt && Date.now() > verificationCodeExpiresAt) {
      Alert.alert('Code Expired', 'Your code has expired. Please request a new one.');
      return;
    }

    if (forgotVerificationCode.trim() !== sentVerificationCode) {
      Alert.alert('Invalid Code', 'The verification code is incorrect.');
      return;
    }

    setForgotStep('reset');
  };

  const handleChangePassword = () => {
    if (!forgotNewPassword.trim() || !forgotConfirmPassword.trim()) {
      Alert.alert('Missing Password', 'Please enter and confirm your new password.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    Alert.alert('Password Updated', 'Your password has been changed.');
    setShowForgotPasswordScreen(false);
    setForgotStep('contact');
    setSentVerificationCode('');
    setVerificationCodeExpiresAt(null);
    setForgotVerificationCode('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
  };

  const handleRegisterBack = () => {
    setShowRegisterScreen(false);
    setShowInitialSplash(true);
  };

  const handleRegisterComplete = () => {
    setShowRegisterScreen(false);
    setShowInitialSplash(true);
    if (onRegister) {
      onRegister();
    }
  };

  const handleRegisterCancel = () => {
    setShowRegisterScreen(false);
    setShowInitialSplash(true);
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => (
    <View style={styles.slide}>
      <Image
        source={item.image}
        style={styles.slideImage}
        resizeMode="contain"
      />
      <Text style={styles.slideText}>{item.text}</Text>
    </View>
  );

  // Landing Screen with Logo and Get Started button
  if (showLandingScreen) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoLarge}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Registration Screen
  if (showRegisterScreen) {
    return (
      <RegisterScreen
        onBack={handleRegisterBack}
        onComplete={handleRegisterComplete}
        onCancel={handleRegisterCancel}
      />
    );
  }

  // Volunteer Login Screen
  if (showVolunteerLoginScreen) {
    return (
      <LoginScreen
        onBack={() => {
          setShowVolunteerLoginScreen(false);
          setShowLoginScreen(true);
        }}
        onLoginSuccess={(user) => {
          if (onVolunteerLogin) {
            onVolunteerLogin(user);
          } else {
            onGetStarted();
          }
        }}
      />
    );
  }

  // Login Screen
  if (showLoginScreen) {
    if (showForgotPasswordScreen) {
      return (
        <View style={styles.container}>
          <View style={styles.forgotCard}>
            <TouchableOpacity
              style={styles.forgotBackButton}
              onPress={() => {
                if (forgotStep === 'reset') {
                  setForgotStep('verification');
                  return;
                }
                if (forgotStep === 'verification') {
                  setForgotStep('contact');
                  return;
                }
                setShowForgotPasswordScreen(false);
              }}
            >
              <Ionicons name="arrow-back" size={22} color="#226538" />
            </TouchableOpacity>

            {forgotStep === 'contact' ? (
              <>
                <Image
                  source={require('../assets/forgot.png')}
                  style={styles.forgotIllustration}
                  resizeMode="contain"
                />

                <Text style={styles.forgotTitle}>
                  <Text style={styles.welcomeGreen}>Reset </Text>
                  <Text style={styles.welcomeYellow}>Password</Text>
                </Text>

                <View style={styles.forgotInputContainer}>
                  <Ionicons name="call-outline" size={18} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Contact Number"
                    placeholderTextColor="#888"
                    value={forgotContactNumber}
                    onChangeText={setForgotContactNumber}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.forgotSendButton, isSendingSms && styles.forgotSendButtonDisabled]}
                  onPress={handleSendResetCode}
                  disabled={isSendingSms}
                >
                  <Text style={styles.forgotSendButtonText}>
                    {isSendingSms ? 'Sending...' : 'Send Verification Code'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}

            {forgotStep === 'verification' ? (
              <>
                <Image
                  source={require('../assets/forgotp.png')}
                  style={styles.forgotIllustration}
                  resizeMode="contain"
                />

                <Text style={styles.forgotTitle}>
                  <Text style={styles.welcomeGreen}>Reset </Text>
                  <Text style={styles.welcomeYellow}>Password</Text>
                </Text>

                <View style={styles.forgotInputContainer}>
                  <Ionicons name="key-outline" size={18} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Verification Code"
                    placeholderTextColor="#888"
                    value={forgotVerificationCode}
                    onChangeText={setForgotVerificationCode}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity style={styles.forgotSendButton} onPress={handleVerifyCode}>
                  <Text style={styles.forgotSendButtonText}>Verify Code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.forgotBackToLoginLink}
                  onPress={() => setShowForgotPasswordScreen(false)}
                >
                  <Text style={styles.forgotBackToLoginText}>
                    Back to <Text style={styles.forgotBackToLoginStrong}>Login</Text>
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}

            {forgotStep === 'reset' ? (
              <>
                <Image
                  source={require('../assets/forgotpa.png')}
                  style={styles.forgotIllustration}
                  resizeMode="contain"
                />

                <Text style={styles.forgotTitle}>
                  <Text style={styles.welcomeGreen}>Reset </Text>
                  <Text style={styles.welcomeYellow}>Password</Text>
                </Text>

                <View style={styles.forgotInputContainer}>
                  <Ionicons name="lock-closed-outline" size={18} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter New Password"
                    placeholderTextColor="#888"
                    value={forgotNewPassword}
                    onChangeText={setForgotNewPassword}
                    secureTextEntry={!showForgotNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowForgotNewPassword(!showForgotNewPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showForgotNewPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#888" />
                  </TouchableOpacity>
                </View>

                <View style={styles.forgotInputContainer}>
                  <Ionicons name="lock-closed-outline" size={18} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#888"
                    value={forgotConfirmPassword}
                    onChangeText={setForgotConfirmPassword}
                    secureTextEntry={!showForgotConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showForgotConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#888" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotSendButton} onPress={handleChangePassword}>
                  <Text style={styles.forgotSendButtonText}>Change Password</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.forgotBackToLoginLink}
                  onPress={() => setShowForgotPasswordScreen(false)}
                >
                  <View style={styles.forgotBackToLoginRow}>
                    <Ionicons name="time-outline" size={13} color="#6B7280" />
                    <Text style={styles.forgotBackToLoginText}>
                      {' '}Back to <Text style={styles.forgotBackToLoginStrong}>Login</Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
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
          <TouchableOpacity
            style={styles.loginBackButton}
            onPress={() => {
              setShowLoginScreen(false);
              setShowInitialSplash(true);
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#2E7D32" />
          </TouchableOpacity>

          <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            <Text style={styles.welcomeGreen}>Welcome </Text>
            <Text style={styles.welcomeYellow}>Back!</Text>
          </Text>
          <Text style={styles.brandTagline}>Community Relief Platform</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={[styles.inputContainer, isMobileInputFocused && styles.inputContainerFocused]}>
            <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              placeholderTextColor="#888"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              onFocus={() => setIsMobileInputFocused(true)}
              onBlur={() => setIsMobileInputFocused(false)}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputContainer, isPasswordInputFocused && styles.inputContainerFocused]}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setIsPasswordInputFocused(true)}
              onBlur={() => setIsPasswordInputFocused(false)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          {!!loginError && (
            <Text style={styles.loginErrorText}>{loginError}</Text>
          )}

          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.rememberContainer} 
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setForgotStep('contact');
                setSentVerificationCode('');
                setVerificationCodeExpiresAt(null);
                setForgotVerificationCode('');
                setForgotNewPassword('');
                setForgotConfirmPassword('');
                setShowForgotPasswordScreen(true);
              }}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButtonMain, isLoggingIn && styles.loginButtonMainDisabled]}
            onPress={handleLogin}
            disabled={isLoggingIn}
          >
            <Text style={styles.loginButtonMainText}>{isLoggingIn ? 'Signing In...' : 'Login'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.volunteerLoginSwitch} onPress={openVolunteerLoginFromResidentLogin}>
            <Text style={styles.volunteerLoginSwitchText}>Volunteer account? Sign in here</Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerPrompt}>Dont  have an account?  </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Initial Login/Registration Screen (shows after onboarding slides)
  if (showInitialSplash) {
    return (
      <View style={styles.initialSplashContainer}>
        <View style={styles.initialLogoWrapper}>
          <Image
            source={require('../assets/textual.png')}
            style={styles.initialTextualLogo}
            resizeMode="contain"
          />
          <Text style={styles.initialSubtitle}>Choose how you want to continue</Text>
        </View>
        <View style={styles.initialButtonsContainer}>
          <TouchableOpacity 
            style={styles.initialLoginButton} 
            onPress={() => {
              setShowInitialSplash(false);
              setShowLoginScreen(true);
            }}
          >
            <Text style={styles.initialLoginButtonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.initialRegisterButton} 
            onPress={() => {
              setShowInitialSplash(false);
              setShowRegisterScreen(true);
            }}
          >
            <Text style={styles.initialRegisterButtonText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Onboarding Slider (shows after clicking Get Started)
  if (showOnboarding) {
    const isLastSlide = currentIndex === slides.length - 1;
    
    return (
      <View style={styles.onboardingContainer}>
        {/* Image Slider */}
        <View style={styles.sliderContainer}>
          <FlatList
            ref={flatListRef}
            data={slides}
            renderItem={renderSlide}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            snapToInterval={width}
            decelerationRate="fast"
            contentContainerStyle={styles.flatListContent}
          />
          
          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentIndex === index ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Continue Button - only shows on last slide */}
        {isLastSlide && (
          <TouchableOpacity
            style={styles.onboardingContinueButton}
            onPress={() => {
              setShowOnboarding(false);
              setShowInitialSplash(true);
            }}
            accessibilityLabel="Continue onboarding"
          >
            <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Fallback
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
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
  loginContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
  },
  logoLarge: {
    width: width * 0.75,
    height: width * 0.75,
  },
  sliderContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  slideImage: {
    width: width * 0.85,
    height: width * 0.85,
    marginBottom: 30,
  },
  slideText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  flatListContent: {
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#2E7D32',
  },
  inactiveDot: {
    backgroundColor: '#C4C4C4',
  },
  getStartedContainer: {
    paddingHorizontal: 40,
    paddingBottom: 80,
    paddingTop: 30,
    width: '100%',
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    paddingHorizontal: 80,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#16A34A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 16,
  },
  onboardingContinueButton: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#16A34A',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 10,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 40,
    paddingBottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  titleGreen: {
    color: '#2E7D32',
  },
  titleYellow: {
    color: '#F9A825',
  },
  subtitle: {
    fontSize: 12,
    color: '#F9A825',
    fontWeight: '600',
    letterSpacing: 2,
  },
  button: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  brandTagline: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    letterSpacing: 0.2,
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
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 3,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  rememberText: {
    fontSize: 14,
    color: '#333',
  },
  forgotText: {
    fontSize: 14,
    color: '#2E7D32',
  },
  forgotCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    alignItems: 'center',
  },
  forgotBackButton: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  forgotIllustration: {
    width: width * 0.52,
    height: width * 0.52,
    marginBottom: 10,
  },
  forgotTitle: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 18,
  },
  forgotInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 8,
    paddingHorizontal: 12,
    width: '100%',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  forgotSendButton: {
    backgroundColor: '#226538',
    borderRadius: 10,
    width: '100%',
    paddingVertical: 13,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  forgotSendButtonDisabled: {
    opacity: 0.7,
  },
  forgotSendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  forgotBackToLoginLink: {
    marginTop: 12,
    paddingVertical: 4,
  },
  forgotBackToLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forgotBackToLoginText: {
    fontSize: 13,
    color: '#6B7280',
  },
  forgotBackToLoginStrong: {
    color: '#226538',
    fontWeight: '700',
  },
  loginErrorText: {
    color: '#B00020',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  loginButtonMain: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  volunteerLoginSwitch: {
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 20,
  },
  volunteerLoginSwitchText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerPrompt: {
    fontSize: 14,
    color: '#333',
  },
  registerLink: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  authButtonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 15,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#2E7D32',
    width: width * 0.55,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ECC323',
    fontSize: 18,
    fontWeight: '600',
  },
  textLogoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  textLogo: {
    width: width * 1.0,
    height: width * 0.85,
  },
  registerButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: width * 0.55,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  initialSplashContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  initialLogoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  initialTextualLogo: {
    width: width * 0.95,
    height: width * 0.75,
  },
  initialSubtitle: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  initialButtonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  initialLoginButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#2E7D32',
    width: '100%',
    alignItems: 'center',
  },
  initialLoginButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '700',
  },
  initialRegisterButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  initialRegisterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
