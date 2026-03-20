import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
  Modal,
  Image,
  Alert,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { VerificationResult } from '../services/ai';
import { resolveApiBaseUrl } from '../services/config/apiSecurity';

const { width } = Dimensions.get('window');

// API Configuration
const API_URL = resolveApiBaseUrl(
  process.env.EXPO_PUBLIC_API_URL,
  'http://10.45.3.83:3001/api',
  'RegisterScreen API',
);
const FACE_API_URL = resolveApiBaseUrl(
  process.env.EXPO_PUBLIC_FACE_API_URL,
  'http://10.45.3.83:8000',
  'RegisterScreen Face API',
);
const FACE_CAPTURE_ATTEMPT_LIMIT = 10;
const FACE_CAPTURE_COOLDOWN_MS = 3000;
const FILE_ENCODING = {
  Base64: 'base64' as const,
};

const VULNERABLE_MEMBER_OPTIONS = [
  { id: 'senior', label: 'Senior Citizen', icon: 'walk-outline' },
  { id: 'pwd', label: 'PWD', icon: 'accessibility-outline' },
  { id: 'pregnant', label: 'Pregnant', icon: 'woman-outline' },
  { id: 'children', label: 'Children (0-5)', icon: 'people-outline' },
] as const;

const inferImageMimeType = (uri: string): string => {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

interface RegisterScreenProps {
  onBack: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

export default function RegisterScreen({ onBack, onComplete, onCancel }: RegisterScreenProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5; // Added Step 5: Verification Result
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Step 5: Verification Result
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [submissionErrorMessage, setSubmissionErrorMessage] = useState<string | null>(null);

  // NEW: Duplicate Check Results for Face Verification
  interface DuplicateCheckResult {
    success: boolean;
    face_detected: boolean;
    decision: 'ALLOW' | 'BLOCK' | 'ERROR';
    best_match_id: string | null;
    best_match_name: string | null;
    similarity: number;
    threshold: number;
    processing_time_ms: number;
    message: string;
    resident_id: string | null;
  }
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<DuplicateCheckResult | null>(null);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationStep, setVerificationStep] = useState<string>('');

  // Keep detailed progress in terminal logs, not on-screen.
  useEffect(() => {
    if (isSubmitting && verificationStep) {
      console.log(`[Registration Verification] ${verificationStep} (${verificationProgress}%)`);
    }
  }, [isSubmitting, verificationStep, verificationProgress]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height || 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Step 1: Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [isMobileNumberFocused, setIsMobileNumberFocused] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordServerError, setPasswordServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalContent, setTermsModalContent] = useState<'terms' | 'privacy'>('terms');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Step 2: Household Information
  const [city, setCity] = useState('');
  const [barangay, setBarangay] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [householdSize, setHouseholdSize] = useState(1);
  const [vulnerableMembers, setVulnerableMembers] = useState<string[]>([]);
  const [vulnerableCounts, setVulnerableCounts] = useState<{[key: string]: number}>({});
  const [showVulnerableDetailsModal, setShowVulnerableDetailsModal] = useState(false);

  // Barangay dropdown
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);
  const barangayOptions = [
    'Bolo',
    'Bongalon',
    'Dulig',
    'Laois',
    'Magsaysay',
    'Poblacion',
    'San Gonzalo',
    'San Jose',
    'Tobuan',
    'Uyong'
  ];

  // Household Token (Step 2 - after barangay selection)
  const [householdToken, setHouseholdToken] = useState('');
  const [tokenValidating, setTokenValidating] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenHouseholdInfo, setTokenHouseholdInfo] = useState<{
    headOfHousehold: string;
    address: string;
    barangay: string;
    expectedMembers: number;
  } | null>(null);

  // Step 3: Identity Verification
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [frontIdImage, setFrontIdImage] = useState<string | null>(null);
  const [backIdImage, setBackIdImage] = useState<string | null>(null);
  const [showIdTypeDropdown, setShowIdTypeDropdown] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [currentImageSide, setCurrentImageSide] = useState<'front' | 'back'>('front');
  const idTypeOptions = ['PhilSys ID', 'Driver\'s License', 'Passport', 'SSS ID', 'PhilHealth ID', 'Voter\'s ID'];

  // Step 4: Face Photo - Simplified snap & analyze
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [faceScanComplete, setFaceScanComplete] = useState(false);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'capturing' | 'success' | 'failed'>('idle');
  const [faceInstructions, setFaceInstructions] = useState('Position your face and tap to snap');
  const [faceCaptureAttempts, setFaceCaptureAttempts] = useState(0);
  const [faceCaptureCooldownUntil, setFaceCaptureCooldownUntil] = useState(0);
  const [faceCaptureCooldownRemaining, setFaceCaptureCooldownRemaining] = useState(0);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (faceCaptureCooldownUntil <= Date.now()) {
      setFaceCaptureCooldownRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((faceCaptureCooldownUntil - Date.now()) / 1000));
      setFaceCaptureCooldownRemaining(remaining);
    };

    updateRemaining();
    const timer = setInterval(updateRemaining, 250);
    return () => clearInterval(timer);
  }, [faceCaptureCooldownUntil]);

  // Validation
  const [showErrors, setShowErrors] = useState(false);
  const [step1Errors, setStep1Errors] = useState({
    firstName: false,
    lastName: false,
    dateOfBirth: false,
    ageRestriction: false,
    gender: false,
    mobileNumber: false,
    mobileNumberFormat: false,
    mobileNumberDuplicate: false,
    password: false,
    confirmPassword: false,
    passwordMismatch: false,
    termsAccepted: false,
  });

  // Mobile number checking
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);
  const [mobileChecked, setMobileChecked] = useState(false);
  const [mobileAvailabilityStatus, setMobileAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const mobileCheckRequestIdRef = useRef(0);

  const checkMobileAvailability = async (
    mobileNumber: string,
    options?: { markDuplicateError?: boolean; requestId?: number }
  ): Promise<boolean> => {
    const markDuplicateError = options?.markDuplicateError ?? true;
    const requestId = options?.requestId;
    const isLatestRequest = () =>
      requestId === undefined || requestId === mobileCheckRequestIdRef.current;

    if (!mobileNumber || mobileNumber.length < 11) {
      if (isLatestRequest()) {
        setMobileChecked(false);
        setMobileAvailabilityStatus('idle');
      }
      return false;
    }

    if (isLatestRequest()) {
      setIsCheckingMobile(true);
      setMobileAvailabilityStatus('checking');
    }

    try {
      const response = await fetch(`${API_URL}/household/check-mobile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.available) {
        if (isLatestRequest()) {
          setMobileChecked(true);
          setMobileAvailabilityStatus('available');
          if (markDuplicateError) {
            setStep1Errors(prev => ({
              ...prev,
              mobileNumberDuplicate: false,
            }));
          }
        }
        return true;
      } else {
        if (isLatestRequest()) {
          setMobileChecked(false);
          setMobileAvailabilityStatus('taken');
          if (markDuplicateError) {
            setStep1Errors(prev => ({
              ...prev,
              mobileNumberDuplicate: true,
            }));
          }
        }
        return false;
      }
    } catch (error) {
      console.error('Mobile check error:', error);
      if (isLatestRequest()) {
        setMobileChecked(false);
        setMobileAvailabilityStatus('error');
      }
      return false;
    } finally {
      if (isLatestRequest()) {
        setIsCheckingMobile(false);
      }
    }
  };

  useEffect(() => {
    const normalizedMobile = normalizeMobileForLookup(mobileNumber);
    const isValidMobile = /^09\d{9}$/.test(normalizedMobile);

    if (!mobileNumber.trim() || !isValidMobile) {
      mobileCheckRequestIdRef.current += 1;
      setIsCheckingMobile(false);
      setMobileChecked(false);
      setMobileAvailabilityStatus('idle');
      return;
    }

    const requestId = mobileCheckRequestIdRef.current + 1;
    mobileCheckRequestIdRef.current = requestId;
    setIsCheckingMobile(true);
    setMobileAvailabilityStatus('checking');

    const debounceTimer = setTimeout(() => {
      checkMobileAvailability(normalizedMobile, {
        markDuplicateError: false,
        requestId,
      }).catch(() => undefined);
    }, 500);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [mobileNumber]);
  const [step2Errors, setStep2Errors] = useState({
    barangay: false,
    streetAddress: false,
    householdToken: false,
  });
  const [step3Errors, setStep3Errors] = useState({
    idType: false,
    idNumber: false,
    frontIdImage: false,
    backIdImage: false,
  });
  const [step3ValidationMessage, setStep3ValidationMessage] = useState<string | null>(null);
  const [step3ValidationWarnings, setStep3ValidationWarnings] = useState<string[]>([]);
  const [isStep3Validating, setIsStep3Validating] = useState(false);
  const [step3ValidationStatus, setStep3ValidationStatus] = useState<'neutral' | 'success' | 'error'>('neutral');
  const [step4Errors, setStep4Errors] = useState({
    faceScan: false,
  });

  // Refs for scrolling to errors
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollFocusedInputIntoView = (target?: number | null) => {
    if (!target) return;

    setTimeout(() => {
      const scrollResponder =
        (scrollViewRef.current as any)?.getScrollResponder?.() ?? (scrollViewRef.current as any);
      const baseOffset = Platform.OS === 'android' ? 260 : 150;
      const stepOffset = currentStep === 1 ? 80 : 0;
      const keyboardOffset = keyboardHeight > 0 ? 30 : 0;
      const extraOffset = baseOffset + stepOffset + keyboardOffset;
      scrollResponder?.scrollResponderScrollNativeHandleToKeyboard?.(target, extraOffset, true);
    }, 120);
  };

  const handleInputFocus = (target?: number | null) => {
    scrollFocusedInputIntoView(target);
  };

  const handleStep1PasswordFocus = (target?: number | null) => {
    handleInputFocus(target);

    // Fallback for devices where native handle-to-keyboard scroll is inconsistent.
    if (currentStep === 1) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 220);
    }
  };

  const handleInputBlur = () => {
    // Keep hook for inputs that already pass onBlur.
  };

  // Keep every step top-aligned, especially on small devices.
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, 0);

    return () => clearTimeout(timer);
  }, [currentStep]);

  const progressPercentage = (currentStep / totalSteps) * 100;

  // Calculate age from date of birth
  const calculateAge = (dob: string): number => {
    if (!dob || dob.length !== 10) return 0;
    const [month, day, year] = dob.split('/').map(Number);
    if (!month || !day || !year) return 0;
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const PASSWORD_SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{}|;':",./<>?`~\\]/;
  const COMMON_WEAK_PATTERNS = [
    'password',
    'admin',
    '123456',
    'qwerty',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'master',
    'login',
    'superadmin',
    'super',
    'abc123',
    'trustno1',
    'iloveyou',
    'sunshine',
    'princess',
    'football',
    'shadow',
    'passw0rd',
    'kapitbisig',
    'changeme',
    '12345678',
    '123456789',
  ];

  const containsCommonWeakPattern = (value: string): boolean => {
    const lowered = value.toLowerCase();
    return COMMON_WEAK_PATTERNS.some((pattern) => lowered.includes(pattern));
  };

  const getPasswordError = (value: string): string | null => {
    if (!value || !value.trim()) return 'Password is required';
    if (/\s/.test(value)) return 'Password must not contain spaces';
    if (containsCommonWeakPattern(value)) {
      return 'This password is too common. Please choose a stronger password.';
    }
    const hasComplexity =
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /[0-9]/.test(value) &&
      PASSWORD_SPECIAL_CHAR_REGEX.test(value);
    if (value.length < 8 || !hasComplexity) {
      return 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
    }
    return null;
  };

  const getNameError = (value: string, label: 'First' | 'Last'): string | null => {
    const trimmed = value.trim();
    const namePattern = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
    if (!trimmed || trimmed.length < 2 || trimmed.length > 50 || !namePattern.test(trimmed)) {
      return `${label} name must be 2–50 characters and contain letters only.`;
    }
    return null;
  };

  const normalizeMobileForLookup = (value: string): string => {
    return value.trim();
  };

  const getPasswordStrength = (value: string): { label: 'Weak' | 'Medium' | 'Strong' | 'Very Strong'; color: string; progress: number } | null => {
    if (!value) return null;

    if (getPasswordError(value)) {
      return { label: 'Weak', color: '#E53935', progress: 25 };
    }

    let score = 0;
    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (value.length >= 16) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[a-z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (PASSWORD_SPECIAL_CHAR_REGEX.test(value)) score += 1;

    if (score <= 2) return { label: 'Weak', color: '#E53935', progress: 25 };
    if (score <= 4) return { label: 'Medium', color: '#FB8C00', progress: 50 };
    if (score <= 6) return { label: 'Strong', color: '#7CB342', progress: 75 };
    return { label: 'Very Strong', color: '#2E7D32', progress: 100 };
  };

  const getMobileNumberError = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return 'Mobile number is required';
    if (!/^09\d{9}$/.test(trimmed)) {
      return 'Please enter a valid Philippine mobile number (09XXXXXXXXX).';
    }
    return null;
  };

  const validatePasswordWithServer = async (value: string): Promise<string | null> => {
    try {
      const response = await fetch(`${API_URL}/auth/validate-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: value }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        return null;
      }

      if (data?.data?.isValid) {
        return null;
      }

      const firstError = Array.isArray(data?.data?.errors) ? data.data.errors[0] : null;
      return firstError || 'Password is invalid';
    } catch (error) {
      console.warn('Password validation API unavailable:', error);
      return null;
    }
  };

  const getConfirmPasswordError = (value: string, original: string): string | null => {
    if (!value || !value.trim()) return 'Please confirm your password';
    if (/\s/.test(value)) return 'Confirm password must not contain spaces';
    if (value !== original) return 'Passwords do not match';
    return null;
  };

  const validateStep1 = async () => {
    const firstNameError = getNameError(firstName, 'First');
    const lastNameError = getNameError(lastName, 'Last');
    const mobileNumberError = getMobileNumberError(mobileNumber);
    const localPasswordError = getPasswordError(password);
    const serverPasswordError = !localPasswordError ? await validatePasswordWithServer(password) : null;
    const passwordError = localPasswordError || serverPasswordError;
    const confirmPasswordError = getConfirmPasswordError(confirmPassword, password);
    const age = calculateAge(dateOfBirth);
    let isDuplicateMobile = false;
    setPasswordServerError(serverPasswordError);

    if (!mobileNumberError) {
      isDuplicateMobile = !(await checkMobileAvailability(normalizeMobileForLookup(mobileNumber)));
    } else {
      setMobileChecked(false);
    }

    const errors = {
      firstName: !!firstNameError,
      lastName: !!lastNameError,
      dateOfBirth: !dateOfBirth.trim() || dateOfBirth.length !== 10,
      ageRestriction: dateOfBirth.length === 10 && age < 18,
      gender: !gender,
      mobileNumber: mobileNumberError === 'Mobile number is required',
      mobileNumberFormat: !!mobileNumberError && mobileNumberError !== 'Mobile number is required',
      mobileNumberDuplicate: !mobileNumberError && isDuplicateMobile,
      password: !!passwordError,
      confirmPassword: !!confirmPasswordError,
      passwordMismatch: confirmPasswordError === 'Passwords do not match',
      termsAccepted: !termsAccepted,
    };
    setStep1Errors(errors);
    
    // Scroll to first error
    if (errors.firstName) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else if (errors.lastName) {
      scrollViewRef.current?.scrollTo({ y: 80, animated: true });
    } else if (errors.dateOfBirth || errors.ageRestriction) {
      scrollViewRef.current?.scrollTo({ y: 160, animated: true });
    } else if (errors.gender) {
      scrollViewRef.current?.scrollTo({ y: 240, animated: true });
    } else if (errors.mobileNumber || errors.mobileNumberFormat || errors.mobileNumberDuplicate) {
      scrollViewRef.current?.scrollTo({ y: 320, animated: true });
    } else if (errors.password || errors.confirmPassword || errors.passwordMismatch) {
      scrollViewRef.current?.scrollTo({ y: 400, animated: true });
    } else if (errors.termsAccepted) {
      scrollViewRef.current?.scrollTo({ y: 600, animated: true });
    }
    
    return !Object.values(errors).some(Boolean);
  };

  // Clear individual step 1 errors when user fills the field
  const clearStep1Error = (field: keyof typeof step1Errors) => {
    if (showErrors && step1Errors[field]) {
      setStep1Errors(prev => ({ ...prev, [field]: false }));
    }
  };

  // Clear age restriction error when date changes
  const clearAgeError = () => {
    if (showErrors) {
      setStep1Errors(prev => ({ ...prev, dateOfBirth: false, ageRestriction: false }));
    }
  };

  // Format household token as user types (XXXX-XXXX-XXXX)
  const formatHouseholdToken = (value: string): string => {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    // Add dashes every 4 characters
    const parts = [];
    for (let i = 0; i < cleaned.length && i < 12; i += 4) {
      parts.push(cleaned.slice(i, i + 4));
    }
    return parts.join('-');
  };

  // Validate household token with the server
  const validateHouseholdToken = async () => {
    if (!householdToken.trim() || householdToken.length !== 14) {
      setTokenError('Please enter a valid token (XXXX-XXXX-XXXX)');
      return;
    }

    // Check if barangay is selected
    if (!barangay.trim()) {
      setTokenError('Please select your barangay first');
      return;
    }

    setTokenValidating(true);
    setTokenError(null);
    setTokenValidated(false);
    setTokenHouseholdInfo(null);

    try {
      const response = await fetch(`${API_URL}/household/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: householdToken,
          barangay: barangay  // Send selected barangay for validation
        }),
      });

      const data = await response.json();

      if (data.success && data.valid) {
        // Check if token barangay matches selected barangay
        if (data.householdInfo && data.householdInfo.barangay !== barangay) {
          setTokenValidated(false);
          setTokenError(`This token is for ${data.householdInfo.barangay}, not ${barangay}. Please use a token issued for your barangay.`);
          return;
        }
        
        setTokenValidated(true);
        setTokenHouseholdInfo(data.householdInfo || null);
        setTokenError(null);
        
        // Clear error if showing
        if (showErrors) {
          setStep2Errors(prev => ({ ...prev, householdToken: false }));
        }
      } else {
        setTokenValidated(false);
        if (data.errorCode === 'TOKEN_ALREADY_USED') {
          setTokenError('This household token has already been used for registration. Please contact your barangay office for a new token.');
        } else if (data.errorCode === 'TOKEN_EXPIRED') {
          setTokenError('This token has expired. Please contact your barangay office for a new token.');
        } else {
          setTokenError(data.message || 'Invalid token');
        }
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setTokenError('Unable to validate token. Please check your connection.');
      setTokenValidated(false);
    } finally {
      setTokenValidating(false);
    }
  };

  // Handle token input change
  const handleTokenChange = (value: string) => {
    const formatted = formatHouseholdToken(value);
    setHouseholdToken(formatted);
    // Reset validation state when token changes
    setTokenValidated(false);
    setTokenError(null);
    setTokenHouseholdInfo(null);
  };

  const validateStep2 = () => {
    const errors = {
      barangay: !barangay.trim(),
      streetAddress: !streetAddress.trim(),
      householdToken: !tokenValidated,  // Token must be validated
    };
    setStep2Errors(errors);
    
    // Scroll to first error
    if (errors.barangay) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else if (errors.streetAddress) {
      scrollViewRef.current?.scrollTo({ y: 100, animated: true });
    }
    
    return !Object.values(errors).some(Boolean);
  };

  // ID number validation is intentionally permissive to avoid blocking registration.
  const getIdFormatInfo = (_type: string) => {
    return {
      minLength: 1,
      maxLength: 30,
      pattern: /^.+$/,
      hint: 'No strict format check',
      keyboardType: 'default' as const,
    };
  };

  const sanitizeIdInput = (_type: string, rawValue: string): string => {
    const value = rawValue.toUpperCase();
    return value.replace(/[^A-Z0-9\-\s]/g, '');
  };

  const validateStep3 = async () => {
    setStep3ValidationMessage(null);
    setStep3ValidationWarnings([]);
    setStep3ValidationStatus('neutral');

    const errors = {
      idType: !idType.trim(),
      idNumber: !idNumber.trim(),
      frontIdImage: !frontIdImage,
      backIdImage: !backIdImage,
    };
    setStep3Errors(errors);

    if (errors.idType) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else if (errors.idNumber) {
      scrollViewRef.current?.scrollTo({ y: 100, animated: true });
    } else if (errors.frontIdImage) {
      scrollViewRef.current?.scrollTo({ y: 200, animated: true });
    } else if (errors.backIdImage) {
      scrollViewRef.current?.scrollTo({ y: 400, animated: true });
    }

    if (Object.values(errors).some(Boolean)) {
      return false;
    }

    if (!frontIdImage || !backIdImage) {
      return false;
    }

    return true;
  };

  const routeSubmissionErrorToStep = (
    errorCode?: string,
    message?: string,
    validationErrors?: Array<{ field?: string; code?: string; message?: string }>
  ): boolean => {
    const normalized = `${errorCode || ''} ${message || ''}`.toLowerCase();

    const goToStep = (step: number, scrollY: number) => {
      setShowErrors(true);
      setSubmissionErrorMessage(null);
      setCurrentStep(step);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollY, animated: true });
      }, 0);
    };

    if (
      errorCode === 'DUPLICATE_MOBILE' ||
      normalized.includes('mobile number is already registered')
    ) {
      setStep1Errors(prev => ({ ...prev, mobileNumberDuplicate: true }));
      goToStep(1, 320);
      return true;
    }

    if (
      errorCode === 'DUPLICATE_ID' ||
      normalized.includes('id number is already registered')
    ) {
      setStep3Errors(prev => ({ ...prev, idNumber: true }));
      setStep3ValidationMessage('This ID number is already registered.');
      goToStep(3, 100);
      return true;
    }

    if (
      errorCode === 'TOKEN_REVIEW_REQUIRED' ||
      normalized.includes('temporarily blocked for review')
    ) {
      setTokenValidated(false);
      setTokenError('This token is temporarily blocked for review due to repeated duplicate detections. Please contact your barangay office.');
      setStep2Errors(prev => ({ ...prev, householdToken: true }));
      goToStep(2, 180);
      return true;
    }

    if (
      normalized.includes('password is too common') ||
      normalized.includes('this password is too common')
    ) {
      setStep1Errors(prev => ({ ...prev, password: true }));
      setPasswordServerError('This password is too common. Please choose a stronger password.');
      goToStep(1, 400);
      return true;
    }

    if (errorCode !== 'VALIDATION_FAILED' && !normalized.includes('validation failed')) {
      return false;
    }

    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
      const byField = new Map<string, string>();
      for (const item of validationErrors) {
        const field = String(item?.field || '').trim();
        const msg = String(item?.message || '').trim();
        if (field && msg && !byField.has(field)) {
          byField.set(field, msg);
        }
      }

      if (byField.has('mobileNumber')) {
        setStep1Errors(prev => ({
          ...prev,
          mobileNumber: byField.get('mobileNumber')?.toLowerCase().includes('required') || false,
          mobileNumberFormat: !byField.get('mobileNumber')?.toLowerCase().includes('required'),
        }));
        goToStep(1, 320);
        return true;
      }

      if (byField.has('householdToken')) {
        setStep2Errors(prev => ({ ...prev, householdToken: true }));
        setTokenError(byField.get('householdToken') || 'Invalid household token');
        goToStep(2, 180);
        return true;
      }

      if (byField.has('idType') || byField.has('idNumber') || byField.has('frontIdImage') || byField.has('backIdImage')) {
        setStep3Errors(prev => ({
          ...prev,
          idType: byField.has('idType'),
          idNumber: byField.has('idNumber'),
          frontIdImage: byField.has('frontIdImage'),
          backIdImage: byField.has('backIdImage'),
        }));
        setStep3ValidationMessage(
          byField.get('idNumber') ||
          byField.get('frontIdImage') ||
          byField.get('backIdImage') ||
          byField.get('idType') ||
          'Please correct your ID verification details.'
        );
        goToStep(3, byField.has('idNumber') ? 100 : byField.has('frontIdImage') ? 200 : byField.has('backIdImage') ? 400 : 0);
        return true;
      }

      if (byField.has('faceImage')) {
        setStep4Errors({ faceScan: true });
        goToStep(4, 0);
        return true;
      }
    }

    const step1 = {
      firstName: normalized.includes('first name is required'),
      lastName: normalized.includes('last name is required'),
      dateOfBirth: normalized.includes('date of birth is required'),
      ageRestriction: false,
      gender: normalized.includes('gender is required'),
      mobileNumber: normalized.includes('mobile number is required'),
      mobileNumberFormat: normalized.includes('invalid mobile number format'),
      mobileNumberDuplicate: false,
      password: normalized.includes('password is required') || normalized.includes('password must'),
      confirmPassword: false,
      passwordMismatch: false,
      termsAccepted: false,
    };

    const step2 = {
      barangay: normalized.includes('barangay is required'),
      streetAddress: normalized.includes('street address is required'),
      householdToken:
        normalized.includes('household token is required') || normalized.includes('invalid token format'),
    };

    const step3 = {
      idType: normalized.includes('id type is required'),
      idNumber: normalized.includes('id number is required'),
      frontIdImage: normalized.includes('front id image is required'),
      backIdImage: normalized.includes('back id image is required'),
    };

    const step4 = {
      faceScan: normalized.includes('face image is required'),
    };

    if (step1.password && normalized.includes('too common')) {
      setPasswordServerError('This password is too common. Please choose a stronger password.');
    }

    if (Object.values(step1).some(Boolean)) {
      setStep1Errors(prev => ({ ...prev, ...step1 }));
      goToStep(1, step1.password ? 400 : step1.mobileNumber || step1.mobileNumberFormat ? 320 : 0);
      return true;
    }

    if (Object.values(step2).some(Boolean)) {
      setStep2Errors(prev => ({ ...prev, ...step2 }));
      goToStep(2, step2.streetAddress ? 100 : 0);
      return true;
    }

    if (Object.values(step3).some(Boolean)) {
      setStep3Errors(prev => ({ ...prev, ...step3 }));
      goToStep(3, step3.idNumber ? 100 : step3.frontIdImage ? 200 : step3.backIdImage ? 400 : 0);
      return true;
    }

    if (step4.faceScan) {
      setStep4Errors({ faceScan: true });
      goToStep(4, 0);
      return true;
    }

    return false;
  };

  // Image picker functions
  const openImagePicker = async (side: 'front' | 'back') => {
    setCurrentImageSide(side);
    setShowImagePickerModal(true);
  };

  const pickFromGallery = async () => {
    setShowImagePickerModal(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant photo library permission to upload an ID image.',
        [{ text: 'OK' }]
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setStep3ValidationMessage(null);
      setStep3ValidationWarnings([]);
      setStep3ValidationStatus('neutral');
      if (currentImageSide === 'front') {
        setFrontIdImage(result.assets[0].uri);
        if (showErrors) setStep3Errors(prev => ({ ...prev, frontIdImage: false }));
      } else {
        setBackIdImage(result.assets[0].uri);
        if (showErrors) setStep3Errors(prev => ({ ...prev, backIdImage: false }));
      }
    }
  };

  const takePhoto = async () => {
    setShowImagePickerModal(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera permission to capture an ID image.',
        [{ text: 'OK' }]
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setStep3ValidationMessage(null);
      setStep3ValidationWarnings([]);
      setStep3ValidationStatus('neutral');
      if (currentImageSide === 'front') {
        setFrontIdImage(result.assets[0].uri);
        if (showErrors) setStep3Errors(prev => ({ ...prev, frontIdImage: false }));
      } else {
        setBackIdImage(result.assets[0].uri);
        if (showErrors) setStep3Errors(prev => ({ ...prev, backIdImage: false }));
      }
    }
  };

  const imageUriToDataUrl = async (uri: string): Promise<string> => {
    if (!uri) return '';
    if (uri.startsWith('data:image')) {
      return uri;
    }
    if (uri.startsWith('/uploads/')) {
      return uri;
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FILE_ENCODING.Base64,
    });
    const mime = inferImageMimeType(uri);
    return `data:${mime};base64,${base64}`;
  };

  // Step 4: Face Scan functions - DISABLED for testing
  const validateStep4 = () => {
    const errors = {
      faceScan: !faceScanComplete,
    };
    setStep4Errors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const startFaceScan = async () => {
    if (faceCaptureAttempts >= FACE_CAPTURE_ATTEMPT_LIMIT) {
      Alert.alert(
        'Attempt Limit Reached',
        `You have reached the maximum of ${FACE_CAPTURE_ATTEMPT_LIMIT} photo attempts for this registration. Please restart registration later.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to take your photo.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    // Reset state and show camera
    setShowFaceScanner(true);
    setScanStatus('idle');
    setFaceInstructions('Position your face and tap to snap');
  };

  // Simplified snap photo function - takes photo and sends to AI
  const snapPhoto = async () => {
    if (!cameraRef.current) return;

    if (faceCaptureAttempts >= FACE_CAPTURE_ATTEMPT_LIMIT) {
      setScanStatus('failed');
      setFaceInstructions(`Attempt limit reached (${FACE_CAPTURE_ATTEMPT_LIMIT}). Please restart registration later.`);
      return;
    }

    if (faceCaptureCooldownUntil > Date.now()) {
      const remaining = Math.max(1, Math.ceil((faceCaptureCooldownUntil - Date.now()) / 1000));
      setScanStatus('failed');
      setFaceInstructions(`Please wait ${remaining}s before taking another photo.`);
      return;
    }
    
    try {
      setFaceCaptureAttempts((prev) => prev + 1);
      setFaceCaptureCooldownUntil(Date.now() + FACE_CAPTURE_COOLDOWN_MS);

      // Take photo first
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      
      if (!photo || !photo.base64) {
        throw new Error('Failed to capture photo');
      }
      
      // Store the captured photo URI immediately - this hides the camera
      setCapturedPhotoUri(photo.uri);
      setScanStatus('capturing');
      setFaceInstructions('AI is analyzing your photo...');
      // Close the scanner immediately and continue analysis in the background
      setShowFaceScanner(false);
      
      // Send to AI for analysis
      const detectResponse = await fetch(`${FACE_API_URL}/api/face/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: photo.base64,
          session_key: householdToken || mobileNumber || 'registration',
        }),
      });
      
      if (!detectResponse.ok) {
        const errorData = await detectResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Face analysis failed');
      }
      
      const result = await detectResponse.json();
      
      // Check AI validation results
      if (!result.has_face) {
        setScanStatus('failed');
        setFaceInstructions('No face detected. Make sure your face is visible.');
        return;
      }
      
      if (result.face_count > 1) {
        setScanStatus('failed');
        setFaceInstructions('Multiple faces detected. Only your face should be visible.');
        return;
      }
      
      if (result.image_quality === 'blurry') {
        setScanStatus('failed');
        setFaceInstructions('Photo is blurry. Hold steady and try again.');
        return;
      }
      
      if (result.image_quality === 'too_dark') {
        setScanStatus('failed');
        setFaceInstructions('Photo is too dark. Move to a brighter area.');
        return;
      }
      
      if (result.image_quality === 'too_bright') {
        setScanStatus('failed');
        setFaceInstructions('Photo is too bright. Avoid direct light.');
        return;
      }
      
      if (!result.is_real_image) {
        setScanStatus('failed');
        setFaceInstructions('Please use your real face, not a photo.');
        return;
      }
      
      if (!result.is_valid) {
        setScanStatus('failed');
        setFaceInstructions(result.message || 'Validation failed. Please try again.');
        return;
      }
      
      // Success!
      setFaceImage(photo.uri);
      setScanStatus('success');
      setFaceScanComplete(true);
      setFaceInstructions('Photo verified successfully!');
      if (showErrors) setStep4Errors({ faceScan: false });
    } catch (error: any) {
      console.error('Snap photo error:', error);
      setScanStatus('failed');
      setFaceInstructions(error.message || 'Failed to analyze. Please try again.');
    }
  };

  const retakeFaceScan = () => {
    setFaceScanComplete(false);
    setFaceImage(null);
    setCapturedPhotoUri(null);
    setScanStatus('idle');
    setFaceInstructions('Position your face and tap to snap');
    setShowFaceScanner(true);
  };

  const closeFaceScanner = () => {
    setShowFaceScanner(false);
    setScanStatus('idle');
    setCapturedPhotoUri(null);
  };

  // Submit registration to server with DUPLICATE FACE CHECK
  const performVerificationAndSubmit = async () => {
    setIsSubmitting(true);
    setVerificationProgress(0);
    setVerificationStep('Initializing...');
    setDuplicateCheckResult(null);
    setSubmissionComplete(false);
    setSubmissionErrorMessage(null);
    
    try {
      // Step 1: Prepare face image (10%)
      setVerificationProgress(10);
      setVerificationStep('Preparing face image...');
      
      let faceBase64 = '';
      if (faceImage) {
        try {
          const faceBase64Response = await fetch(faceImage);
          const faceBlob = await faceBase64Response.blob();
          const reader = new FileReader();
          faceBase64 = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(faceBlob);
          });
        } catch (error) {
          console.log('[Verification] Failed to convert face image:', error);
          throw new Error('Failed to process face image');
        }
      } else {
        throw new Error('No face image captured. Please go back and take a photo.');
      }
      
      // Step 2: Check for duplicate face (30%)
      setVerificationProgress(30);
      setVerificationStep('Detecting face...');
      
      const residentData = {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        mobileNumber,
        barangay,
        streetAddress,
        householdToken,
      };
      
      // Call the duplicate check endpoint
      const duplicateResponse = await fetch(`${FACE_API_URL}/api/face/check-duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: faceBase64,
          resident_data: residentData 
        }),
      });
      
      if (!duplicateResponse.ok) {
        const errorData = await duplicateResponse.json().catch(() => ({}));
        const userFriendlyMsg = errorData.detail?.includes('face') 
          ? 'Could not detect your face. Please ensure good lighting and face the camera directly.'
          : errorData.detail?.includes('connection') || errorData.detail?.includes('network')
          ? 'Network connection error. Please check your internet and try again.'
          : errorData.detail || 'Verification failed. Please try again.';
        throw new Error(userFriendlyMsg);
      }
      
      // Step 3: Processing results (60%)
      setVerificationProgress(60);
      setVerificationStep('Analyzing face embedding...');
      
      const duplicateResult = await duplicateResponse.json();
      
      // Store the duplicate check result for display
      setDuplicateCheckResult(duplicateResult);
      
      // Step 4: Processing decision (80%)
      setVerificationProgress(80);
      setVerificationStep(`Decision: ${duplicateResult.decision}`);
      
      // Handle BLOCK decision - duplicate detected
      if (duplicateResult.decision === 'BLOCK') {
        setVerificationProgress(100);
        setVerificationStep('Duplicate Detected - Registration Blocked');

        let duplicateAttemptMessage = '';
        if (householdToken) {
          try {
            const duplicateAttemptResponse = await fetch(`${API_URL}/household/record-duplicate-block`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: householdToken,
                barangay,
                similarity: typeof duplicateResult.similarity === 'number' ? duplicateResult.similarity : undefined,
              }),
            });
            const duplicateAttemptData = await duplicateAttemptResponse.json().catch(() => null);

            if (duplicateAttemptData?.success) {
              if (duplicateAttemptData.blocked) {
                duplicateAttemptMessage =
                  ' This token is now temporarily blocked for review. Please contact your barangay office.';
              } else if (
                typeof duplicateAttemptData.attempts === 'number' &&
                typeof duplicateAttemptData.maxAttempts === 'number'
              ) {
                duplicateAttemptMessage = ` Attempt ${duplicateAttemptData.attempts}/${duplicateAttemptData.maxAttempts}.`;
              }
            }
          } catch (recordError) {
            console.warn('[Verification] Failed to record duplicate-block attempt:', recordError);
          }
        }
        
        // Create a "failed" verification result for display
        const failedResult: VerificationResult = {
          isVerified: false,
          overallConfidence: duplicateResult.similarity,
          idVerification: {
            isValid: !!frontIdImage,
            confidence: frontIdImage ? 0.90 : 0.50,
            extractedData: null,
            warnings: [],
          },
          faceVerification: {
            isValid: false,
            matchConfidence: duplicateResult.similarity,
            livenessConfidence: 0.90,
            warnings: ["Duplicate face detected - already registered"],
          },
          dataMatchVerification: {
            isMatch: false,
            matchScore: duplicateResult.similarity,
            discrepancies: ['Face already registered in system'],
          },
          riskScore: 1.0,
          riskFactors: ['Duplicate registration attempt'],
          recommendations: ['Contact barangay office if you believe this is an error'],
        };
        setVerificationResult(failedResult);
        
        // Show alert but don't submit to main database
        Alert.alert(
          'Registration Blocked',
          `This face is already registered.\n\nDuplicate registrations are not allowed.${duplicateAttemptMessage}`,
          [{ text: 'OK' }]
        );
        
        setIsSubmitting(false);
        return; // Stop here - don't submit to main registration
      }
      
      // Step 5: ALLOW - proceed with registration (90%)
      setVerificationProgress(90);
      setVerificationStep('Saving registration...');
      
      // Create successful verification result
      const successResult: VerificationResult = {
        isVerified: true,
        overallConfidence: 1 - (duplicateResult.similarity || 0), // Uniqueness score
        idVerification: {
          isValid: !!frontIdImage,
          confidence: frontIdImage ? 0.90 : 0.50,
          extractedData: null,
          warnings: frontIdImage ? [] : ['ID not provided'],
        },
        faceVerification: {
          isValid: true,
          matchConfidence: 1 - (duplicateResult.similarity || 0),
          livenessConfidence: 0.90,
          warnings: [],
        },
        dataMatchVerification: {
          isMatch: true,
          matchScore: 1.0,
          discrepancies: [],
        },
        riskScore: duplicateResult.similarity || 0,
        riskFactors: [],
        recommendations: ['Registration approved - no duplicates found'],
      };
      setVerificationResult(successResult);
      
      // Submit to main registration system
      const fullName = `${firstName} ${lastName}`.trim();
      const [frontIdImagePayload, backIdImagePayload, faceImagePayload] = await Promise.all([
        frontIdImage ? imageUriToDataUrl(frontIdImage) : Promise.resolve(''),
        backIdImage ? imageUriToDataUrl(backIdImage) : Promise.resolve(''),
        faceImage ? imageUriToDataUrl(faceImage) : Promise.resolve(''),
      ]);

      const registrationData = {
        firstName,
        lastName,
        fullName,
        dateOfBirth,
        gender,
        mobileNumber,
        password,
        city,
        barangay,
        streetAddress,
        householdSize,
        vulnerableMembers,
        vulnerableCounts,
        idType,
        idNumber,
        frontIdImage: frontIdImagePayload,
        backIdImage: backIdImagePayload,
        faceImage: faceImagePayload,
        verification: {
          overallConfidence: 100,
          idConfidence: frontIdImage ? 90 : 50,
          faceMatchConfidence: 100,
          livenessConfidence: 90,
          dataMatchScore: 100,
          riskScore: Math.round((duplicateResult.similarity || 0) * 100),
          isVerified: true,
          aiVerificationStatus: 'High Match',
          duplicateCheck: {
            decision: duplicateResult.decision,
            similarity: duplicateResult.similarity,
            threshold: duplicateResult.threshold,
            processingTime: duplicateResult.processing_time_ms,
            bestMatch: 'Hidden',
          },
          warnings: [],
          riskFactors: [],
        },
        householdToken,
        // Include the face embedding resident ID from the duplicate check
        faceResidentId: duplicateResult.resident_id,
      };

      const response = await fetch(`${API_URL}/household/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();
      
      // Step 6: Complete (100%)
      setVerificationProgress(100);

      if (data.success) {
        setVerificationStep('Registration Complete!');
        setSubmissionComplete(true);
      } else {
        if (routeSubmissionErrorToStep(data.errorCode, data.message, data.validationErrors)) {
          setDuplicateCheckResult(null);
          setVerificationResult(null);
          return;
        }

        setVerificationStep('Registration Failed');
        setSubmissionErrorMessage(data.message || 'Failed to submit registration');
        // Handle specific error codes
        if (data.errorCode === 'LOCK_CONFLICT') {
          Alert.alert(
            'Registration In Progress',
            'Another family member is currently completing registration. Please wait and try again.',
            [{ text: 'OK' }]
          );
        } else if (data.errorCode === 'TOKEN_NOT_FOUND') {
          Alert.alert('Invalid Token', 'Your registration token has expired or is invalid.', [{ text: 'OK' }]);
          setTokenValidated(false);
          setTokenError(data.message);
        } else if (data.errorCode === 'DUPLICATE_MOBILE') {
          Alert.alert('Already Registered', 'This mobile number is already registered.', [{ text: 'OK' }]);
        } else {
          Alert.alert('Registration Error', data.message || 'Failed to submit registration');
        }
      }
    } catch (error: any) {
      console.error('Verification/Submission error:', error);
      setVerificationProgress(100);
      setVerificationStep('Error');
      
      let errorMessage = 'An error occurred during registration.';
      if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (routeSubmissionErrorToStep(undefined, errorMessage)) {
        setDuplicateCheckResult(null);
        setVerificationResult(null);
        return;
      }

      setSubmissionErrorMessage(errorMessage);
      
      Alert.alert('Registration Failed', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get verification confidence percentage
  const getConfidencePercentage = (): number => {
    if (!verificationResult) return 0;
    return Math.round(verificationResult.overallConfidence * 100);
  };

  // Get verification status label
  const getVerificationStatus = (): { label: string; color: string } => {
    // Use duplicate check result if available
    if (duplicateCheckResult) {
      if (duplicateCheckResult.decision === 'BLOCK') {
        return { label: 'BLOCKED - Duplicate', color: '#E74C3C' };
      } else if (duplicateCheckResult.decision === 'ALLOW') {
        return { label: 'ALLOWED - Unique', color: '#2ECC71' };
      } else {
        return { label: 'ERROR', color: '#F39C12' };
      }
    }
    
    const confidence = getConfidencePercentage();
    if (confidence >= 80) return { label: 'High Match', color: '#2ECC71' };
    if (confidence >= 50) return { label: 'Medium Match', color: '#F39C12' };
    return { label: 'Low Match', color: '#E74C3C' };
  };

  const handleNextStep = async () => {
    setShowErrors(true);
    
    if (currentStep === 1 && !(await validateStep1())) {
      return;
    }
    if (currentStep === 2 && !validateStep2()) {
      return;
    }
    if (currentStep === 3 && !(await validateStep3())) {
      return;
    }
    if (currentStep === 4 && !validateStep4()) {
      return;
    }
    
    setShowErrors(false);
    
    // After Step 4 (Face Scan), perform verification
    if (currentStep === 4) {
      setCurrentStep(5);
      await performVerificationAndSubmit();
      return;
    }
    
    // Step 5 is the final step
    if (currentStep === 5) {
      onComplete();
      return;
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 5) {
      if (submissionComplete || duplicateCheckResult?.decision === 'BLOCK' || !!submissionErrorMessage) {
        onCancel();
        return;
      }
      // Allow going back from Step 5 if verification flow is not completed yet.
      if (duplicateCheckResult?.decision === 'ERROR' || !submissionComplete) {
        // Reset verification state and go back to face capture
        setDuplicateCheckResult(null);
        setVerificationResult(null);
        setIsSubmitting(false);
        setVerificationProgress(0);
        setCurrentStep(4);
        return;
      }
      // If submission is complete, don't allow going back
      return;
    }
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const formatDateInput = (text: string) => {
    // Remove non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as mm/dd/yyyy
    let formatted = '';
    if (cleaned.length > 0) {
      formatted = cleaned.substring(0, 2);
      if (cleaned.length > 2) {
        formatted += '/' + cleaned.substring(2, 4);
      }
      if (cleaned.length > 4) {
        formatted += '/' + cleaned.substring(4, 8);
      }
    }
    return formatted;
  };

  const handleDateChange = (text: string) => {
    setDateOfBirth(formatDateInput(text));
  };

  const onDatePickerChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      setDateOfBirth(`${month}/${day}/${year}`);
    }
  };

  const toggleVulnerableMember = (member: string) => {
    setVulnerableMembers(prev => 
      prev.includes(member) 
        ? prev.filter(m => m !== member)
        : [...prev, member]
    );
  };

  const renderStep1 = () => {
    const mobileNumberErrorMessage = getMobileNumberError(mobileNumber);
    const firstNameErrorMessage = getNameError(firstName, 'First');
    const lastNameErrorMessage = getNameError(lastName, 'Last');
    const passwordErrorMessage = getPasswordError(password);
    const passwordStrength = getPasswordStrength(password);
    const confirmPasswordErrorMessage = getConfirmPasswordError(confirmPassword, password);

    return (
    <View style={styles.formContent}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>
          <Text style={styles.titleBlack}>Let's get you </Text>
          <Text style={styles.titleGreen}>registered</Text>
        </Text>
        <Text style={styles.subtitle}>
          Please enter your details exactly as they appear on your valid ID to ensure smooth relief distribution.
        </Text>
      </View>

      <View style={styles.formFields}>
        {/* First Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>First Name</Text>
          <View style={[styles.inputContainer, showErrors && step1Errors.firstName && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder="Juan"
              placeholderTextColor="#999"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                clearStep1Error('firstName');
              }}
              onFocus={(event) => handleInputFocus(event.target as number)}
              onBlur={handleInputBlur}
            />
            <Ionicons name="person" size={22} color="#2E7D32" style={styles.inputIconRight} />
          </View>
          {showErrors && step1Errors.firstName && (
            <Text style={styles.errorText}>
              {firstNameErrorMessage || 'First name must be 2–50 characters and contain letters only.'}
            </Text>
          )}
        </View>

        {/* Last Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Last Name</Text>
          <View style={[styles.inputContainer, showErrors && step1Errors.lastName && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder="dela Cruz"
              placeholderTextColor="#999"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                clearStep1Error('lastName');
              }}
              onFocus={(event) => handleInputFocus(event.target as number)}
              onBlur={handleInputBlur}
            />
            <Ionicons name="person" size={22} color="#2E7D32" style={styles.inputIconRight} />
          </View>
          {showErrors && step1Errors.lastName && (
            <Text style={styles.errorText}>
              {lastNameErrorMessage || 'Last name must be 2–50 characters and contain letters only.'}
            </Text>
          )}
        </View>

        {/* Date of Birth */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Date of Birth</Text>
          <TouchableOpacity 
            style={[styles.inputContainer, showErrors && (step1Errors.dateOfBirth || step1Errors.ageRestriction) && styles.inputError]}
            onPress={() => setShowDatePicker(true)}
          >
            <TextInput
              style={styles.input}
              placeholder="mm/dd/yyyy"
              placeholderTextColor="#999"
              value={dateOfBirth}
              onChangeText={(text) => {
                handleDateChange(text);
                clearAgeError();
              }}
              keyboardType="numeric"
              maxLength={10}
              editable={true}
              onFocus={(event) => handleInputFocus(event.target as number)}
              onBlur={handleInputBlur}
            />
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.calendarIcons}>
              <Ionicons name="calendar" size={22} color="#2E7D32" />
            </TouchableOpacity>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                onDatePickerChange(event, date);
                clearAgeError();
              }}
              maximumDate={new Date()}
            />
          )}
          {showErrors && step1Errors.ageRestriction && (
            <Text style={styles.errorText}>You must be at least 18 years old to register</Text>
          )}
        </View>

        {/* Gender - Radio Buttons */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={[styles.genderRadioContainer, showErrors && step1Errors.gender && styles.genderError]}>
            {(['Male', 'Female'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.genderRadioOption}
                onPress={() => {
                  setGender(option);
                  clearStep1Error('gender');
                }}
              >
                <View style={[
                  styles.radioOuter,
                  gender === option && styles.radioOuterActive,
                  showErrors && step1Errors.gender && styles.radioOuterError,
                ]}>
                  {gender === option && <View style={styles.radioInner} />}
                </View>
                <Text style={[
                  styles.genderRadioText,
                  gender === option && styles.genderRadioTextActive,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.credentialsSection}>
          <Text style={styles.credentialsSectionTitle}>Create your login credentials</Text>
          <View style={styles.credentialsInfoBox}>
            <Ionicons name="information-circle" size={18} color="#2E7D32" />
            <Text style={styles.credentialsInfoText}>
              You will use this mobile number and password to log in next time.
            </Text>
          </View>
        </View>

        {/* Mobile Number */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Mobile Number (Login ID)</Text>
          <View
            style={[
              styles.inputContainer,
              isMobileNumberFocused && styles.inputFocused,
              showErrors && (step1Errors.mobileNumber || step1Errors.mobileNumberFormat || step1Errors.mobileNumberDuplicate) && styles.inputError,
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="09XXXXXXXXX"
              placeholderTextColor="#999"
              value={mobileNumber}
              onChangeText={(text) => {
                const sanitized = text.replace(/\D/g, '').slice(0, 11);
                setMobileNumber(sanitized);
                if (sanitized.trim()) {
                  clearStep1Error('mobileNumber');
                }
                setStep1Errors(prev => ({ ...prev, mobileNumberFormat: false, mobileNumberDuplicate: false }));
                if (!/^09\d{9}$/.test(sanitized)) {
                  setMobileChecked(false);
                  setMobileAvailabilityStatus('idle');
                }
              }}
              keyboardType="phone-pad"
              maxLength={11}
              onFocus={(event) => {
                setIsMobileNumberFocused(true);
                handleInputFocus(event.target as number);
              }}
              onBlur={() => {
                setIsMobileNumberFocused(false);
                handleInputBlur();
              }}
            />
            {isCheckingMobile ? (
              <ActivityIndicator size="small" color="#2E7D32" style={styles.inputIconRight} />
            ) : mobileChecked ? (
              <Ionicons name="checkmark-circle" size={22} color="#2E7D32" style={styles.inputIconRight} />
            ) : (
              <Ionicons name="call" size={22} color="#2E7D32" style={styles.inputIconRight} />
            )}
          </View>
          <Text style={styles.fieldHelperText}>Use 09XXXXXXXXX.</Text>
          {mobileAvailabilityStatus === 'checking' && (
            <Text style={styles.mobileInfoText}>Checking mobile number...</Text>
          )}
          {mobileAvailabilityStatus === 'available' && (
            <Text style={styles.mobileSuccessText}>Mobile number is available.</Text>
          )}
          {mobileAvailabilityStatus === 'taken' && (
            <Text style={styles.mobileWarningText}>This account already exists. Please sign in instead.</Text>
          )}
          {mobileAvailabilityStatus === 'error' && (
            <Text style={styles.mobileWarningText}>Unable to check right now. You can still continue.</Text>
          )}
          {showErrors && step1Errors.mobileNumber && (
            <Text style={styles.errorText}>Mobile number is required</Text>
          )}
          {showErrors && step1Errors.mobileNumberFormat && (
            <Text style={styles.errorText}>{mobileNumberErrorMessage || 'Enter a valid mobile number'}</Text>
          )}
          {showErrors && step1Errors.mobileNumberDuplicate && (
            <Text style={styles.errorText}>This account already exists. Please sign in instead.</Text>
          )}
        </View>

        {/* Password */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={[styles.inputContainer, showErrors && step1Errors.password && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder="Create password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(text) => {
                // Strip whitespace as user types
                const sanitizedText = text.replace(/\s/g, '');
                setPassword(sanitizedText);
                setPasswordServerError(null);
                if (!getPasswordError(sanitizedText)) clearStep1Error('password');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={(event) => handleStep1PasswordFocus(event.target as number)}
              onBlur={handleInputBlur}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.inputIconRight}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#2E7D32" />
            </TouchableOpacity>
          </View>
          <Text style={styles.fieldHelperText}>Use at least 8 characters with uppercase, lowercase, number, and special character.</Text>
          {passwordStrength && (
            <View style={styles.passwordStrengthContainer}>
              <View style={styles.passwordStrengthTrack}>
                <View
                  style={[
                    styles.passwordStrengthFill,
                    { width: `${passwordStrength.progress}%`, backgroundColor: passwordStrength.color },
                  ]}
                />
              </View>
              <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                Password strength: {passwordStrength.label}
              </Text>
            </View>
          )}
          {showErrors && step1Errors.password && (
            <Text style={styles.errorText}>
              {passwordServerError || passwordErrorMessage || 'Invalid password'}
            </Text>
          )}
        </View>

        {/* Confirm Password */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Confirm Password</Text>
          <View style={[styles.inputContainer, (showErrors && (step1Errors.confirmPassword || step1Errors.passwordMismatch)) && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={(text) => {
                // Strip whitespace as user types
                const sanitizedText = text.replace(/\s/g, '');
                setConfirmPassword(sanitizedText);
                if (sanitizedText.trim()) {
                  const confirmError = getConfirmPasswordError(sanitizedText, password);
                  setStep1Errors(prev => ({
                    ...prev,
                    confirmPassword: !!confirmError,
                    passwordMismatch: confirmError === 'Passwords do not match',
                  }));
                }
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={(event) => handleStep1PasswordFocus(event.target as number)}
              onBlur={handleInputBlur}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.inputIconRight}>
              <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color="#2E7D32" />
            </TouchableOpacity>
          </View>
          {showErrors && step1Errors.confirmPassword && (
            <Text style={styles.errorText}>{confirmPasswordErrorMessage || 'Please confirm your password'}</Text>
          )}
        </View>

        {/* Terms and Conditions Checkbox */}
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={[styles.checkbox, showErrors && step1Errors.termsAccepted && styles.checkboxError]}
            onPress={() => {
              setTermsAccepted(!termsAccepted);
              if (!termsAccepted) {
                setStep1Errors(prev => ({ ...prev, termsAccepted: false }));
              }
            }}
          >
            {termsAccepted && (
              <Ionicons name="checkmark" size={16} color="#2E7D32" />
            )}
          </TouchableOpacity>
          <View style={styles.termsTextContainer}>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink} onPress={() => { setTermsModalContent('terms'); setShowTermsModal(true); }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink} onPress={() => { setTermsModalContent('privacy'); setShowTermsModal(true); }}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
        {showErrors && step1Errors.termsAccepted && (
          <Text style={styles.errorTextTerms}>You must agree to the Terms and Privacy Policy to continue.</Text>
        )}
      </View>
    </View>
    );
  };

  const renderStep2 = () => (
    <View style={styles.formContent}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>
          <Text style={styles.titleBlack}>Household </Text>
          <Text style={styles.titleGreen}>Information</Text>
        </Text>
        <Text style={styles.subtitle}>
          Help us understand your family's needs to prioritize relief goods distribution effectively.
        </Text>
      </View>

      <View style={styles.formFields}>
        {/* Current Address Section */}
        <Text style={styles.sectionLabel}>CURRENT ADDRESS</Text>

        {/* Barangay */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Barangay</Text>
          <TouchableOpacity 
            style={[styles.inputContainer, styles.selectContainer, showErrors && step2Errors.barangay && styles.inputError]}
            onPress={() => setShowBarangayDropdown(!showBarangayDropdown)}
          >
            <Text style={barangay ? styles.selectText : styles.selectPlaceholder}>
              {barangay || 'Select Barangay'}
            </Text>
            <Ionicons name={showBarangayDropdown ? "chevron-up" : "chevron-down"} size={22} color="#2E7D32" />
          </TouchableOpacity>
          {showBarangayDropdown && (
            <View style={styles.dropdownContainer}>
              {barangayOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownItem,
                    barangay === option && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    const previousBarangay = barangay;
                    setBarangay(option);
                    setShowBarangayDropdown(false);
                    if (showErrors) setStep2Errors(prev => ({ ...prev, barangay: false }));
                    
                    // Reset token validation if barangay changes
                    if (previousBarangay !== option && tokenValidated) {
                      setTokenValidated(false);
                      setTokenError(null);
                      setTokenHouseholdInfo(null);
                      setHouseholdToken('');
                    }
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    barangay === option && styles.dropdownItemTextActive,
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* House No. / Street Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>House No. / Street Name</Text>
          <View style={[styles.inputContainer, showErrors && step2Errors.streetAddress && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 123 Mahogany St."
              placeholderTextColor="#999"
              value={streetAddress}
              onChangeText={(text) => {
                setStreetAddress(text);
                if (text.trim() && showErrors) setStep2Errors(prev => ({ ...prev, streetAddress: false }));
              }}
              onFocus={(event) => handleInputFocus(event.target as number)}
              onBlur={handleInputBlur}
            />
          </View>
        </View>

        {/* Household Registration Token */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>REGISTRATION TOKEN</Text>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Household Code</Text>
          <Text style={styles.fieldHint}>Enter the code provided by your barangay office for {barangay || 'your barangay'}</Text>
          <View style={styles.tokenInputRow}>
            <View style={[
              styles.inputContainer, 
              styles.tokenInput,
              showErrors && step2Errors.householdToken && !tokenValidated && styles.inputError,
              tokenValidated && styles.inputSuccess
            ]}>
              <TextInput
                style={styles.input}
                placeholder="XXXX-XXXX-XXXX"
                value={householdToken}
                onChangeText={handleTokenChange}
                placeholderTextColor="#9E9E9E"
                autoCapitalize="characters"
                maxLength={14}
                editable={!tokenValidating && !!barangay}
                onFocus={(event) => handleInputFocus(event.target as number)}
                onBlur={handleInputBlur}
              />
              {tokenValidated && (
                <Ionicons name="checkmark-circle" size={22} color="#2E7D32" style={styles.tokenIcon} />
              )}
              {tokenError && !tokenValidating && (
                <Ionicons name="alert-circle" size={22} color="#D32F2F" style={styles.tokenIcon} />
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.validateButton,
                (tokenValidating || !barangay) && styles.validateButtonDisabled,
                tokenValidated && styles.validateButtonSuccess
              ]}
              onPress={validateHouseholdToken}
              disabled={tokenValidating || tokenValidated || householdToken.length !== 14 || !barangay}
            >
              {tokenValidating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : tokenValidated ? (
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              ) : (
                <Text style={styles.validateButtonText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Barangay selection required hint */}
          {!barangay && (
            <View style={styles.tokenHintContainer}>
              <Ionicons name="information-circle" size={16} color="#1976D2" />
              <Text style={styles.tokenHintText}>Please select your barangay first</Text>
            </View>
          )}
          
          {/* Token validation feedback */}
          {tokenError && (
            <View style={styles.tokenErrorContainer}>
              <Ionicons name="warning" size={16} color="#D32F2F" />
              <Text style={styles.tokenErrorText}>{tokenError}</Text>
            </View>
          )}
          
          {/* Token validated - show confirmation */}
          {tokenValidated && tokenHouseholdInfo && (
            <View style={styles.tokenSuccessContainer}>
              <View style={styles.tokenSuccessHeader}>
                <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                <Text style={styles.tokenSuccessTitle}>Token Verified for {tokenHouseholdInfo.barangay}</Text>
              </View>
            </View>
          )}
          
          {showErrors && step2Errors.householdToken && !tokenValidated && !tokenError && (
            <Text style={styles.errorText}>Please verify your household registration token</Text>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Household Size */}
        <View style={styles.householdSizeContainer}>
          <View style={styles.householdSizeLabel}>
            <Text style={styles.householdSizeTitle}>Household Size</Text>
            <Text style={styles.householdSizeSubtitle}>Including yourself</Text>
          </View>
          <View style={styles.householdSizeControls}>
            <TouchableOpacity 
              style={styles.sizeButton}
              onPress={() => setHouseholdSize(prev => Math.max(1, prev - 1))}
            >
              <Ionicons name="remove" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.sizeValue}>{householdSize}</Text>
            <TouchableOpacity 
              style={[styles.sizeButton, styles.sizeButtonPlus]}
              onPress={() => setHouseholdSize(prev => prev + 1)}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vulnerable Members */}
        <View style={styles.vulnerableSection}>
          <Text style={styles.vulnerableTitle}>Vulnerable Members</Text>
          <Text style={styles.vulnerableSubtitle}>
            Select all groups present in your household to help us prioritize special needs.
          </Text>
          
          <View style={styles.vulnerableGrid}>
            {VULNERABLE_MEMBER_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.vulnerableCard,
                  vulnerableMembers.includes(item.id) && styles.vulnerableCardActive,
                ]}
                onPress={() => toggleVulnerableMember(item.id)}
              >
                <Ionicons 
                  name={item.icon as any} 
                  size={28} 
                  color={vulnerableMembers.includes(item.id) ? '#2E7D32' : '#666'} 
                />
                <Text style={[
                  styles.vulnerableCardText,
                  vulnerableMembers.includes(item.id) && styles.vulnerableCardTextActive,
                ]}>
                  {item.label}
                </Text>
                {vulnerableMembers.includes(item.id) && vulnerableCounts[item.id] > 1 && (
                  <View style={styles.vulnerableCountBadge}>
                    <Text style={styles.vulnerableCountText}>{vulnerableCounts[item.id]}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Specify Count Button - shows when any vulnerable category is selected */}
          {vulnerableMembers.length >= 1 && (
            <TouchableOpacity
              style={styles.specifyCountButton}
              onPress={() => setShowVulnerableDetailsModal(true)}
            >
              <Ionicons name="people" size={20} color="#2E7D32" />
              <Text style={styles.specifyCountButtonText}>
                {vulnerableMembers.length === 1 
                  ? 'More than 1 person? Tap to specify' 
                  : 'Specify count per category'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#2E7D32" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.formContent}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>
          <Text style={styles.titleBlack}>Verify your </Text>
          <Text style={styles.titleGreen}>identity</Text>
        </Text>
        <Text style={styles.subtitle}>
          To continue with your registration, please select the type of valid ID you will submit and upload clear photos of your ID.
        </Text>
      </View>

      <View style={styles.formFields}>
        <View style={styles.captureGuideCard}>
          <View style={styles.captureGuideHeader}>
            <Ionicons name="camera-outline" size={18} color="#2E7D32" />
            <Text style={styles.captureGuideTitle}>Before You Upload</Text>
          </View>
          <Text style={styles.captureGuideItem}>• Use bright, even lighting (no shadows)</Text>
          <Text style={styles.captureGuideItem}>• Keep all 4 ID corners visible</Text>
          <Text style={styles.captureGuideItem}>• Hold camera steady to avoid blur</Text>
          <Text style={styles.captureGuideItem}>• Select the same ID type as your uploaded card</Text>
        </View>

        {/* Select ID Type */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Select ID Type</Text>
          <TouchableOpacity 
            style={[styles.inputContainer, styles.selectContainer, showErrors && step3Errors.idType && styles.inputError]}
            onPress={() => setShowIdTypeDropdown(!showIdTypeDropdown)}
          >
            <Text style={idType ? styles.selectText : styles.selectPlaceholder}>
              {idType || 'Select an ID type'}
            </Text>
            <Ionicons name={showIdTypeDropdown ? "chevron-up" : "chevron-down"} size={22} color="#2E7D32" />
          </TouchableOpacity>
          {showIdTypeDropdown && (
            <View style={styles.dropdownContainer}>
              {idTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownItem,
                    idType === option && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setIdType(option);
                    setIdNumber(''); // Clear ID number when type changes
                    setShowIdTypeDropdown(false);
                    setStep3ValidationMessage(null);
                    setStep3ValidationWarnings([]);
                    setStep3ValidationStatus('neutral');
                    if (showErrors) setStep3Errors(prev => ({ ...prev, idType: false, idNumber: false }));
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    idType === option && styles.dropdownItemTextActive,
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ID Number */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>ID Number</Text>
          <View style={[styles.inputContainer, showErrors && step3Errors.idNumber && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder={idType ? `Enter your ${idType} number` : 'Select ID type first'}
              placeholderTextColor="#999"
              value={idNumber}
              maxLength={getIdFormatInfo(idType).maxLength}
              keyboardType={getIdFormatInfo(idType).keyboardType}
              autoCapitalize="none"
              onChangeText={(text) => {
                const filteredText = idType ? sanitizeIdInput(idType, text) : text;
                setIdNumber(filteredText);
                setStep3ValidationMessage(null);
                setStep3ValidationWarnings([]);
                setStep3ValidationStatus('neutral');
                if (filteredText.trim() && showErrors) {
                  setStep3Errors(prev => ({ ...prev, idNumber: false }));
                }
              }}
              editable={!!idType}
              onFocus={(event) => handleInputFocus(event.target as number)}
              onBlur={handleInputBlur}
            />
          </View>
          {showErrors && step3Errors.idType && (
            <Text style={styles.errorText}>Please select an ID type before entering your ID number.</Text>
          )}
          {idType && (
            <Text style={styles.idFormatHint}>
              Format: {getIdFormatInfo(idType).hint} ({idNumber.length}/{getIdFormatInfo(idType).maxLength})
            </Text>
          )}
          {showErrors && step3Errors.idNumber && !idNumber.trim() && (
            <Text style={styles.errorText}>ID number is required.</Text>
          )}
        </View>

        {/* Front of ID */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Front of ID</Text>
          <TouchableOpacity 
            style={[styles.idUploadBox, showErrors && step3Errors.frontIdImage && styles.inputError]}
            onPress={() => openImagePicker('front')}
          >
            {frontIdImage ? (
              <Image source={{ uri: frontIdImage }} style={styles.idImage} resizeMode="cover" />
            ) : (
              <View style={styles.idUploadPlaceholder}>
                <View style={styles.idUploadIconContainer}>
                  <Ionicons name="image-outline" size={32} color="#2E7D32" />
                  <View style={styles.tapToUploadBadge}>
                    <Ionicons name="add" size={14} color="#FFF" />
                  </View>
                </View>
                <Text style={styles.idUploadText}>Tap to upload</Text>
              </View>
            )}
          </TouchableOpacity>
          {showErrors && step3Errors.frontIdImage && (
            <Text style={styles.errorText}>Please upload a clear photo of the front side of your ID.</Text>
          )}
        </View>

        {/* Back of ID */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Back of ID</Text>
          <TouchableOpacity 
            style={[styles.idUploadBox, showErrors && step3Errors.backIdImage && styles.inputError]}
            onPress={() => openImagePicker('back')}
          >
            {backIdImage ? (
              <Image source={{ uri: backIdImage }} style={styles.idImage} resizeMode="cover" />
            ) : (
              <View style={styles.idUploadPlaceholder}>
                <View style={styles.idUploadIconContainer}>
                  <Ionicons name="image-outline" size={32} color="#2E7D32" />
                  <View style={styles.tapToUploadBadge}>
                    <Ionicons name="add" size={14} color="#FFF" />
                  </View>
                </View>
                <Text style={styles.idUploadText}>Tap to upload</Text>
              </View>
            )}
          </TouchableOpacity>
          {showErrors && step3Errors.backIdImage && (
            <Text style={styles.errorText}>Please upload a clear photo of the back side of your ID.</Text>
          )}
        </View>

        {isStep3Validating && (
          <View style={styles.step3StatusCard}>
            <ActivityIndicator size="small" color="#2E7D32" />
            <Text style={styles.step3StatusText}>Analyzing ID photos. Please wait...</Text>
          </View>
        )}

        {!!step3ValidationMessage && (
          <View
            style={[
              styles.step3ValidationBox,
              step3ValidationStatus === 'success' && styles.step3ValidationBoxSuccess,
              step3ValidationStatus === 'error' && styles.step3ValidationBoxError,
            ]}
          >
            <Text
              style={[
                styles.step3ValidationText,
                step3ValidationStatus === 'success' && styles.step3ValidationTextSuccess,
                step3ValidationStatus === 'error' && styles.step3ValidationTextError,
              ]}
            >
              {step3ValidationMessage}
            </Text>
            {step3ValidationWarnings.slice(0, 2).map((warning, index) => (
              <Text key={`${warning}-${index}`} style={styles.step3WarningText}>
                • {warning}
              </Text>
            ))}
            {step3ValidationStatus === 'error' && (
              <>
                <Text style={styles.step3FixTip}>• Make sure all 4 corners of the ID are visible</Text>
                <Text style={styles.step3FixTip}>• Avoid glare and blurry shots</Text>
                <Text style={styles.step3FixTip}>• Upload the actual {idType || 'selected'} government ID</Text>
              </>
            )}
          </View>
        )}

        {/* Quick Tips */}
        <View style={styles.quickTipsContainer}>
          <View style={styles.quickTipsHeader}>
            <Ionicons name="bulb-outline" size={20} color="#2E7D32" />
            <Text style={styles.quickTipsTitle}>Quick Tips</Text>
          </View>
          <View style={styles.quickTipsList}>
            <Text style={styles.quickTipItem}>• Ensure all 4 corners are visible</Text>
            <Text style={styles.quickTipItem}>• Avoid glare and blurry shots</Text>
            <Text style={styles.quickTipItem}>• Format: JPG, PNG (Max 5MB)</Text>
          </View>
          <View style={styles.privacyNote}>
            <Text style={styles.privacyNoteText}>
              Your information is used only for verification purposes under LGU relief guidelines and is protected by 256-bit encryption.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.formContent}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>
          <Text style={styles.titleBlack}>Face </Text>
          <Text style={styles.titleGreen}>Photo</Text>
        </Text>
        <Text style={styles.subtitle}>
          Take a clear photo of your face for identity verification.
        </Text>
      </View>

      <View style={styles.formFields}>
        {/* Face Photo Card */}
        <View style={[styles.faceScanCard, showErrors && step4Errors.faceScan && styles.inputError]}>
          {faceImage ? (
            <View style={styles.faceImageContainer}>
              <Image source={{ uri: faceImage }} style={styles.faceImage} resizeMode="cover" />
              <View style={styles.faceVerifiedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
                <Text style={styles.faceVerifiedText}>Photo Captured</Text>
              </View>
            </View>
          ) : capturedPhotoUri ? (
            <View style={styles.faceImageContainer}>
              <Image source={{ uri: capturedPhotoUri }} style={styles.faceImage} resizeMode="cover" />
              <View
                style={[
                  styles.faceStatusBadge,
                  scanStatus === 'failed' && styles.faceStatusBadgeError,
                ]}
              >
                {scanStatus === 'capturing' ? (
                  <ActivityIndicator size="small" color="#2E7D32" />
                ) : (
                  <Ionicons name="alert-circle" size={20} color="#D32F2F" />
                )}
                <Text
                  style={[
                    styles.faceStatusText,
                    scanStatus === 'failed' && styles.faceStatusTextError,
                  ]}
                >
                  {scanStatus === 'capturing' ? 'Analyzing photo...' : 'Please retake'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.faceScanPlaceholder}>
              <View style={styles.faceScanIconContainer}>
                <Ionicons name="camera" size={60} color="#2E7D32" />
              </View>
              <Text style={styles.faceScanTitle}>Take Your Photo</Text>
              <Text style={styles.faceScanSubtitle}>
                Tap the button below to snap a photo
              </Text>
            </View>
          )}
        </View>

        {/* Snap Photo Button */}
        <TouchableOpacity 
          style={[
            styles.scanButton,
            faceScanComplete && styles.scanButtonComplete,
            (scanStatus === 'capturing' ||
              faceCaptureCooldownRemaining > 0 ||
              faceCaptureAttempts >= FACE_CAPTURE_ATTEMPT_LIMIT) && styles.scanButtonDisabled,
          ]}
          onPress={faceScanComplete ? retakeFaceScan : startFaceScan}
          disabled={
            scanStatus === 'capturing' ||
            faceCaptureCooldownRemaining > 0 ||
            faceCaptureAttempts >= FACE_CAPTURE_ATTEMPT_LIMIT
          }
        >
          <Ionicons 
            name={faceScanComplete ? "refresh" : "camera"} 
            size={24} 
            color="#FFF" 
          />
          <Text style={styles.scanButtonText}>
            {faceCaptureAttempts >= FACE_CAPTURE_ATTEMPT_LIMIT
              ? `Limit Reached (${FACE_CAPTURE_ATTEMPT_LIMIT})`
              : faceCaptureCooldownRemaining > 0
              ? `Wait ${faceCaptureCooldownRemaining}s`
              : faceScanComplete
              ? 'Retake Photo'
              : 'Snap a Photo'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.fieldHelperText}>
          Attempts: {faceCaptureAttempts}/{FACE_CAPTURE_ATTEMPT_LIMIT}
        </Text>

        {scanStatus !== 'idle' && !faceScanComplete && (
          <View style={styles.scanStatusRow}>
            {scanStatus === 'capturing' && (
              <ActivityIndicator size="small" color="#2E7D32" />
            )}
            <Text
              style={[
                styles.scanStatusText,
                scanStatus === 'failed' && styles.scanStatusTextError,
              ]}
            >
              {faceInstructions}
            </Text>
          </View>
        )}
        {showErrors && step4Errors.faceScan && (
          <Text style={styles.errorText}>Please capture a clear face photo to continue</Text>
        )}

        {/* Simple Tips */}
        <View style={styles.quickTipsContainer}>
          <Text style={styles.quickTipsTitle}>Quick Tips:</Text>
          <Text style={styles.quickTipItem}>• Face the camera directly</Text>
          <Text style={styles.quickTipItem}>• Ensure good lighting</Text>
          <Text style={styles.quickTipItem}>• Remove glasses or hats</Text>
          <Text style={styles.quickTipItem}>• Keep a neutral expression</Text>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark" size={20} color="#2E7D32" style={{ marginRight: 8 }} />
          <Text style={styles.privacyNoteText}>
            Your photo is securely processed by AI for verification only.
          </Text>
        </View>
      </View>
    </View>
  );

  // Step 5: Verification Result with Duplicate Check Display
  const renderStep5 = () => {
    const status = getVerificationStatus();
    
    // Show loading state while verifying
    if (isSubmitting) {
      return (
        <View style={styles.formContent}>
          <View style={styles.verificationLoadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.verificationLoadingTitle}>AI Face Verification</Text>
            <Text style={styles.verificationLoadingSubtitle}>Please wait...</Text>
            
            {/* Progress bar */}
            <View style={styles.verificationProgressContainer}>
              <View style={styles.verificationProgressBar}>
                <View 
                  style={[
                    styles.verificationProgressFill, 
                    { width: `${verificationProgress}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>
      );
    }

    // Show duplicate check result
    return (
      <View style={styles.formContent}>
        <View style={styles.verificationResultContainer}>
          {/* Result Icon */}
          <View style={[styles.verificationResultIcon, { backgroundColor: (submissionErrorMessage ? '#F39C12' : status.color) + '20' }]}>
            <Ionicons 
              name={submissionErrorMessage
                ? "warning"
                : duplicateCheckResult?.decision === 'ALLOW' ? "shield-checkmark" : 
                    duplicateCheckResult?.decision === 'BLOCK' ? "close-circle" : "warning"} 
              size={60} 
              color={submissionErrorMessage ? '#F39C12' : status.color} 
            />
          </View>

          {/* Decision Badge */}
          <View style={styles.confidenceScoreContainer}>
            <Text style={styles.confidenceScoreLabel}>Duplicate Check Result</Text>
            <View style={[styles.statusBadge, { backgroundColor: (submissionErrorMessage ? '#F39C12' : status.color) + '20', paddingHorizontal: 20, paddingVertical: 10 }]}>
              <Text style={[styles.statusBadgeText, { color: submissionErrorMessage ? '#F39C12' : status.color, fontSize: 20, fontWeight: 'bold' }]}>
                {duplicateCheckResult?.decision || 'PENDING'}
              </Text>
            </View>
          </View>

          {/* Status Message */}
          <View style={[styles.statusMessageContainer, { marginTop: 20 }]}>
            {duplicateCheckResult?.decision === 'BLOCK' ? (
              <>
                <Ionicons name="alert-circle" size={24} color="#E74C3C" />
                <Text style={[styles.statusMessageText, { color: '#E74C3C' }]}>
                  Registration blocked. This face is already registered.
                </Text>
              </>
            ) : submissionErrorMessage ? (
              <>
                <Ionicons name="warning" size={24} color="#F39C12" />
                <Text style={[styles.statusMessageText, { color: '#F39C12' }]}>
                  {submissionErrorMessage}
                </Text>
              </>
            ) : duplicateCheckResult?.decision === 'ERROR' ? (
              <>
                <Ionicons name="warning" size={24} color="#F39C12" />
                <Text style={[styles.statusMessageText, { color: '#F39C12' }]}>
                  {duplicateCheckResult.message || 'An error occurred during verification. Please try again.'}
                </Text>
              </>
            ) : submissionComplete ? (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#2ECC71" />
                <Text style={styles.statusMessageText}>
                  ALLOW. Registration complete. You can now log in using your mobile number and password.
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="time" size={24} color="#F39C12" />
                <Text style={styles.statusMessageText}>
                  Finalizing registration...
                </Text>
              </>
            )}
          </View>

          {/* Complete, Retry, or Go Back Button */}
          {(submissionComplete || !!submissionErrorMessage || duplicateCheckResult?.decision === 'BLOCK' || duplicateCheckResult?.decision === 'ERROR') && (
            <TouchableOpacity 
              style={[
                styles.completeButton, 
                duplicateCheckResult?.decision === 'BLOCK' && { backgroundColor: '#E74C3C' },
                duplicateCheckResult?.decision === 'ERROR' && { backgroundColor: '#F39C12' }
              ]} 
              onPress={() => {
                if (duplicateCheckResult?.decision === 'BLOCK') {
                  onCancel();
                } else if (submissionErrorMessage) {
                  onCancel();
                } else if (duplicateCheckResult?.decision === 'ERROR') {
                  // Retry - go back to face capture
                  setDuplicateCheckResult(null);
                  setVerificationResult(null);
                  setIsSubmitting(false);
                  setVerificationProgress(0);
                  setCurrentStep(4);
                } else {
                  onCancel();
                }
              }}
            >
              <Text style={styles.completeButtonText}>
                {duplicateCheckResult?.decision === 'ERROR'
                  ? 'Retry Photo'
                  : 'Back to Splash'}
              </Text>
              <Ionicons 
                name={duplicateCheckResult?.decision === 'ERROR' ? "refresh" : "home"} 
                size={22} 
                color="#FFF" 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <View style={styles.backButtonIcon}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentStep === 3 ? 'Identity Verification' : currentStep === 4 ? 'Face Photo' : 'Resident Signup'}
        </Text>
        <View style={styles.headerRight}>
          {(currentStep === 3 || currentStep === 4) && (
            <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
          )}
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressTextContainer}>
          <Text style={styles.stepText}>Step {currentStep} of {totalSteps}</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
        </View>
      </View>

      {/* Form Content */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          currentStep !== 5 && styles.scrollContentWithBottomActions,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </ScrollView>

      {/* Bottom Actions - Hide on Step 5 when submitting */}
      {currentStep !== 5 && !(currentStep === 1 && keyboardHeight > 0) && (
        <View
          style={[
            styles.bottomActions,
            styles.bottomActionsFloating,
            {
              bottom: Platform.OS === 'ios' && keyboardHeight > 0
                ? Math.max(keyboardHeight - insets.bottom, 0)
                : 0,
              paddingBottom: keyboardHeight > 0 ? 10 : Math.max(insets.bottom + 8, 14),
            },
          ]}
        >
          <View style={styles.bottomButtonsRow}>
            <TouchableOpacity 
              style={[
                styles.backButtonBottom,
                currentStep === 1 && styles.cancelButtonBottom,
              ]}
              onPress={handleBack}
            >
              <Text style={[styles.backButtonText, currentStep === 1 && styles.cancelButtonText]}>
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.nextButton,
                (isStep3Validating || (currentStep === 3 && step3ValidationStatus === 'error')) && styles.nextButtonDisabled,
              ]}
              onPress={handleNextStep}
              disabled={isStep3Validating || (currentStep === 3 && step3ValidationStatus === 'error')}
            >
              <Text style={styles.nextButtonText}>
                {isStep3Validating
                  ? 'Checking ID...'
                  : currentStep === 3 && step3ValidationStatus === 'error'
                    ? 'Fix ID Upload'
                  : currentStep === 4
                    ? 'Verify & Submit'
                    : currentStep === 3
                      ? 'Continue'
                      : 'Next Step'}
              </Text>
              <Ionicons name={currentStep === 4 ? "shield-checkmark" : "arrow-forward"} size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Vulnerable Details Modal */}
      <Modal
        visible={showVulnerableDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVulnerableDetailsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVulnerableDetailsModal(false)}
        >
          <View style={styles.vulnerableDetailsModalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Specify Vulnerable Members</Text>
            <Text style={styles.vulnerableModalSubtitle}>
              How many people are in each category?
            </Text>
            
            {VULNERABLE_MEMBER_OPTIONS.filter(item => vulnerableMembers.includes(item.id)).map((item) => (
              <View key={item.id} style={styles.vulnerableCountRow}>
                <View style={styles.vulnerableCountInfo}>
                  <Ionicons name={item.icon as any} size={22} color="#2E7D32" />
                  <Text style={styles.vulnerableCountLabel}>{item.label}</Text>
                </View>
                <View style={styles.vulnerableCountControls}>
                  <TouchableOpacity 
                    style={styles.countButton}
                    onPress={() => setVulnerableCounts(prev => ({
                      ...prev,
                      [item.id]: Math.max(1, (prev[item.id] || 1) - 1)
                    }))}
                  >
                    <Ionicons name="remove" size={18} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.countValue}>{vulnerableCounts[item.id] || 1}</Text>
                  <TouchableOpacity 
                    style={[styles.countButton, styles.countButtonPlus]}
                    onPress={() => setVulnerableCounts(prev => ({
                      ...prev,
                      [item.id]: (prev[item.id] || 1) + 1
                    }))}
                  >
                    <Ionicons name="add" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity 
              style={styles.vulnerableModalDoneButton}
              onPress={() => setShowVulnerableDetailsModal(false)}
            >
              <Text style={styles.vulnerableModalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImagePickerModal(false)}
        >
          <View style={styles.imagePickerModalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Upload {currentImageSide === 'front' ? 'Front' : 'Back'} of ID</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
              <View style={styles.modalOptionIcon}>
                <Ionicons name="camera" size={24} color="#2E7D32" />
              </View>
              <Text style={styles.modalOptionText}>Take a Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={pickFromGallery}>
              <View style={styles.modalOptionIcon}>
                <Ionicons name="images" size={24} color="#2E7D32" />
              </View>
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={() => setShowImagePickerModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Face Scanner Modal - Simplified Snap Photo */}
      <Modal
        visible={showFaceScanner}
        animationType="slide"
        onRequestClose={closeFaceScanner}
      >
        <SafeAreaView style={styles.faceScannerContainer}>
          {/* Scanner Header */}
          <View style={styles.scannerHeader}>
            <TouchableOpacity 
              onPress={closeFaceScanner} 
              style={styles.scannerCloseButton}
              disabled={scanStatus === 'capturing'}
            >
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Take Your Photo</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Camera View or Captured Image */}
          <View style={styles.cameraContainer}>
            {/* Show camera only when idle, show captured image otherwise */}
            {scanStatus === 'idle' ? (
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="front"
              />
            ) : (
              capturedPhotoUri && (
                <Image
                  source={{ uri: capturedPhotoUri }}
                  style={styles.camera}
                  resizeMode="cover"
                />
              )
            )}
            
            {/* Face Frame Overlay */}
            <View style={[styles.faceFrameOverlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]} pointerEvents="none">
              <View style={styles.faceFrameTop} />
              <View style={styles.faceFrameMiddle}>
                <View style={styles.faceFrameSide} />
                <View style={[
                  styles.faceFrameOval,
                  scanStatus === 'success' && styles.faceFrameOvalDetected,
                  scanStatus === 'failed' && styles.faceFrameOvalNoFace,
                ]}>
                  {/* Analyzing Indicator */}
                  {scanStatus === 'capturing' && (
                    <View style={styles.faceDetectionIndicator}>
                      <ActivityIndicator size="large" color="#FFF" />
                      <Text style={styles.faceDetectionText}>Analyzing...</Text>
                    </View>
                  )}
                  
                  {/* Error */}
                  {scanStatus === 'failed' && (
                    <View style={styles.noFaceWarning}>
                      <Ionicons name="close-circle" size={40} color="#FF5252" />
                      <Text style={styles.noFaceText}>{faceInstructions}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.faceFrameSide} />
              </View>
              <View style={styles.faceFrameBottom} />
            </View>

            {/* Success Overlay */}
            {scanStatus === 'success' && (
              <View style={[styles.scanSuccessOverlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
                <View style={styles.scanSuccessIcon}>
                  <Ionicons name="checkmark-circle" size={80} color="#2ECC71" />
                </View>
                <Text style={styles.scanSuccessText}>Photo Verified!</Text>
              </View>
            )}
          </View>

          {/* Scanner Bottom */}
          <View style={styles.scannerBottom}>
            {/* Instructions */}
            <Text style={[
              styles.scannerInstructions,
              scanStatus === 'failed' && styles.scannerInstructionsWarning,
              scanStatus === 'success' && styles.scannerInstructionsSuccess,
            ]}>
              {scanStatus === 'idle' && 'Position your face and tap to snap'}
              {scanStatus === 'capturing' && 'AI is analyzing your photo...'}
              {scanStatus === 'success' && 'Photo captured successfully!'}
              {scanStatus === 'failed' && faceInstructions}
            </Text>
            
            {/* Snap Photo Button - Only when idle */}
            {scanStatus === 'idle' && (
              <TouchableOpacity 
                style={[
                  styles.startScanButton,
                  (faceCaptureCooldownRemaining > 0 || faceCaptureAttempts >= FACE_CAPTURE_ATTEMPT_LIMIT) &&
                    styles.startScanButtonDisabled,
                ]}
                onPress={snapPhoto}
                disabled={faceCaptureCooldownRemaining > 0 || faceCaptureAttempts >= FACE_CAPTURE_ATTEMPT_LIMIT}
              >
                <Ionicons name="camera" size={28} color="#FFF" />
                <Text style={styles.startScanButtonText}>
                  {faceCaptureAttempts >= FACE_CAPTURE_ATTEMPT_LIMIT
                    ? `Limit Reached (${FACE_CAPTURE_ATTEMPT_LIMIT})`
                    : faceCaptureCooldownRemaining > 0
                    ? `Wait ${faceCaptureCooldownRemaining}s`
                    : 'Snap Photo'}
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Retry Button - When failed */}
            {scanStatus === 'failed' && (
              <TouchableOpacity 
                style={[styles.startScanButton, styles.retryButton]}
                onPress={() => {
                  setCapturedPhotoUri(null);
                  setScanStatus('idle');
                  setFaceInstructions('Position your face and tap to snap');
                }}
              >
                <Ionicons name="refresh" size={24} color="#FFF" />
                <Text style={styles.startScanButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}

            {/* Success State */}
            {scanStatus === 'success' && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={32} color="#2ECC71" />
                <Text style={styles.successText}>Closing in 2 seconds...</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Terms and Privacy Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <SafeAreaView style={styles.termsModalContainer}>
          <View style={styles.termsModalHeader}>
            <TouchableOpacity 
              onPress={() => setShowTermsModal(false)} 
              style={styles.termsModalCloseButton}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.termsModalTitle}>
              {termsModalContent === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </Text>
            <View style={{ width: 28 }} />
          </View>
          
          <ScrollView style={styles.termsModalContent} showsVerticalScrollIndicator={false}>
            {termsModalContent === 'terms' ? (
              <View style={styles.termsModalTextContainer}>
                <Text style={styles.termsModalHeading}>Terms of Service</Text>
                <Text style={styles.termsModalDate}>Last Updated: January 2026</Text>
                
                <Text style={styles.termsModalSubheading}>1. Acceptance of Terms</Text>
                <Text style={styles.termsModalParagraph}>
                  By accessing and using the Kapit-Bisig Relief Distribution System mobile application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use this application.
                </Text>
                
                <Text style={styles.termsModalSubheading}>2. Description of Service</Text>
                <Text style={styles.termsModalParagraph}>
                  Kapit-Bisig is a digital platform designed to streamline the distribution of relief goods to residents during calamities and emergencies. The service includes resident registration, identity verification, QR code generation for relief claiming, and real-time notifications from local government units (LGUs).
                </Text>
                
                <Text style={styles.termsModalSubheading}>3. User Registration</Text>
                <Text style={styles.termsModalParagraph}>
                  To use this service, you must register with accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide truthful information about your identity and household composition.
                </Text>
                
                <Text style={styles.termsModalSubheading}>4. User Responsibilities</Text>
                <Text style={styles.termsModalParagraph}>
                  • Provide accurate personal and household information{'\n'}
                  • Upload valid government-issued identification documents{'\n'}
                  • Not misrepresent your identity or household status{'\n'}
                  • Not claim relief goods fraudulently{'\n'}
                  • Keep your account credentials secure
                </Text>
                
                <Text style={styles.termsModalSubheading}>5. Prohibited Activities</Text>
                <Text style={styles.termsModalParagraph}>
                  Users are prohibited from:{'\n'}
                  • Creating multiple accounts for the same household{'\n'}
                  • Sharing QR codes with non-household members{'\n'}
                  • Attempting to manipulate the verification system{'\n'}
                  • Using the service for any unlawful purpose
                </Text>
                
                <Text style={styles.termsModalSubheading}>6. Limitation of Liability</Text>
                <Text style={styles.termsModalParagraph}>
                  The Kapit-Bisig system and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service. Relief distribution is subject to availability and LGU policies.
                </Text>
                
                <Text style={styles.termsModalSubheading}>7. Modifications</Text>
                <Text style={styles.termsModalParagraph}>
                  We reserve the right to modify these terms at any time. Continued use of the service after modifications constitutes acceptance of the updated terms.
                </Text>
              </View>
            ) : (
              <View style={styles.termsModalTextContainer}>
                <Text style={styles.termsModalHeading}>Privacy Policy</Text>
                <Text style={styles.termsModalDate}>Last Updated: January 2026</Text>
                
                <Text style={styles.termsModalSubheading}>1. Information We Collect</Text>
                <Text style={styles.termsModalParagraph}>
                  We collect the following types of information:{'\n'}
                  • Personal Information: Full name, date of birth, gender, mobile number{'\n'}
                  • Address Information: Barangay, street address{'\n'}
                  • Household Information: Number of members, vulnerable member categories{'\n'}
                  • Identity Documents: Government ID type, ID number, ID photos{'\n'}
                  • Biometric Data: Facial scan for identity verification
                </Text>
                
                <Text style={styles.termsModalSubheading}>2. How We Use Your Information</Text>
                <Text style={styles.termsModalParagraph}>
                  Your information is used to:{'\n'}
                  • Verify your identity and eligibility for relief assistance{'\n'}
                  • Generate your unique Family QR code{'\n'}
                  • Process relief goods distribution{'\n'}
                  • Send important announcements and notifications{'\n'}
                  • Maintain distribution records and prevent fraud
                </Text>
                
                <Text style={styles.termsModalSubheading}>3. Data Storage and Security</Text>
                <Text style={styles.termsModalParagraph}>
                  Your data is stored securely using industry-standard encryption. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, or destruction.
                </Text>
                
                <Text style={styles.termsModalSubheading}>4. Data Sharing</Text>
                <Text style={styles.termsModalParagraph}>
                  We may share your information with:{'\n'}
                  • Local Government Units (LGUs) for relief distribution purposes{'\n'}
                  • Government agencies as required by law{'\n'}
                  • Authorized relief distribution centers
                </Text>
                
                <Text style={styles.termsModalSubheading}>5. Your Rights</Text>
                <Text style={styles.termsModalParagraph}>
                  You have the right to:{'\n'}
                  • Access your personal data{'\n'}
                  • Request correction of inaccurate information{'\n'}
                  • Request deletion of your account{'\n'}
                  • Withdraw consent for data processing
                </Text>
                
                <Text style={styles.termsModalSubheading}>6. Data Retention</Text>
                <Text style={styles.termsModalParagraph}>
                  We retain your personal data for as long as your account is active and as required by law. Distribution records may be retained for auditing and reporting purposes.
                </Text>
                
                <Text style={styles.termsModalSubheading}>7. Contact Us</Text>
                <Text style={styles.termsModalParagraph}>
                  If you have questions about this Privacy Policy or your personal data, please contact your local barangay office or LGU.
                </Text>
              </View>
            )}
          </ScrollView>
          
          <View style={styles.termsModalFooter}>
            <TouchableOpacity 
              style={styles.termsModalAcceptButton}
              onPress={() => setShowTermsModal(false)}
            >
              <Text style={styles.termsModalAcceptText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 5,
  },
  backButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 34,
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  percentText: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  scrollContentWithBottomActions: {
    paddingBottom: 120,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerSection: {
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  titleBlack: {
    color: '#333',
  },
  titleGreen: {
    color: '#2E7D32',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  formFields: {
    gap: 20,
  },
  fieldContainer: {
    marginBottom: 5,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  inputIconRight: {
    marginLeft: 10,
  },
  calendarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarIcon: {
    marginRight: 5,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  genderButtonActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  genderButtonText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  // Gender Radio Button styles
  genderRadioContainer: {
    flexDirection: 'row',
    gap: 32,
    paddingVertical: 8,
  },
  genderRadioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: '#2E7D32',
  },
  radioOuterError: {
    borderColor: '#E53935',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
  },
  genderRadioText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  genderRadioTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  credentialsSection: {
    marginTop: 4,
    marginBottom: 2,
  },
  credentialsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 10,
  },
  credentialsInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  credentialsInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
  },
  fieldHelperText: {
    fontSize: 12,
    color: '#5F6B62',
    marginTop: 6,
    marginLeft: 5,
  },
  mobileInfoText: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 5,
    marginLeft: 5,
  },
  mobileSuccessText: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 5,
    marginLeft: 5,
  },
  mobileWarningText: {
    fontSize: 12,
    color: '#D97706',
    marginTop: 5,
    marginLeft: 5,
  },
  passwordStrengthContainer: {
    marginTop: 8,
    marginLeft: 5,
    marginRight: 5,
  },
  passwordStrengthTrack: {
    height: 6,
    backgroundColor: '#E6EDE7',
    borderRadius: 999,
    overflow: 'hidden',
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 999,
  },
  passwordStrengthText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  // Password and Terms styles
  errorText: {
    fontSize: 12,
    color: '#E53935',
    marginTop: 5,
    marginLeft: 5,
  },
  errorTextTerms: {
    fontSize: 12,
    color: '#E53935',
    marginTop: -10,
    marginLeft: 35,
    marginBottom: 10,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2E7D32',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxError: {
    borderColor: '#E53935',
  },
  termsTextContainer: {
    flex: 1,
    paddingTop: 2,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  termsLink: {
    color: '#2E7D32',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Terms Modal styles
  termsModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  termsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  termsModalCloseButton: {
    padding: 5,
  },
  termsModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  termsModalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  termsModalTextContainer: {
    paddingVertical: 20,
  },
  termsModalHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  termsModalDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 25,
  },
  termsModalSubheading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  termsModalParagraph: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  termsModalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  termsModalAcceptButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  termsModalAcceptText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#F5F7F5',
    borderTopWidth: 1,
    borderTopColor: '#E3E9E5',
  },
  bottomActionsFloating: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  nextButton: {
    flex: 0.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2ECC71',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  // Validation error styles
  inputError: {
    borderColor: '#E53935',
    borderWidth: 2,
  },
  inputFocused: {
    borderColor: '#2E7D32',
    borderWidth: 2,
  },
  inputSuccess: {
    borderColor: '#2E7D32',
    borderWidth: 2,
  },
  // Token input styles
  tokenInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tokenInput: {
    flex: 1,
  },
  tokenIcon: {
    marginLeft: 8,
  },
  validateButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  validateButtonSuccess: {
    backgroundColor: '#2E7D32',
  },
  validateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  tokenErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  tokenErrorText: {
    color: '#D32F2F',
    fontSize: 13,
    flex: 1,
  },
  tokenHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
  },
  tokenHintText: {
    color: '#1976D2',
    fontSize: 13,
    flex: 1,
  },
  tokenSuccessContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  tokenSuccessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  tokenSuccessTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  tokenInfoRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  tokenInfoLabel: {
    fontSize: 13,
    color: '#666',
    width: 110,
  },
  tokenInfoValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  fieldHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    marginTop: -6,
  },
  captureGuideCard: {
    backgroundColor: '#EEF8F0',
    borderWidth: 1,
    borderColor: '#CFE8D4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  captureGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  captureGuideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },
  captureGuideItem: {
    fontSize: 12,
    color: '#2A4A31',
    lineHeight: 18,
  },
  genderError: {
    borderRadius: 12,
  },
  genderButtonError: {
    borderColor: '#E53935',
  },
  idFormatHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    marginLeft: 4,
  },
  idFormatError: {
    fontSize: 12,
    color: '#E53935',
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  step3StatusCard: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCEBD9',
    backgroundColor: '#F3FBF4',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  step3StatusText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  step3ValidationBox: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  step3ValidationBoxSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  step3ValidationBoxError: {
    backgroundColor: '#FDECEA',
    borderColor: '#F4C7C3',
  },
  step3ValidationText: {
    fontSize: 13,
    color: '#6D4C41',
    fontWeight: '600',
  },
  step3ValidationTextSuccess: {
    color: '#1B5E20',
  },
  step3ValidationTextError: {
    color: '#B71C1C',
  },
  step3WarningText: {
    marginTop: 4,
    fontSize: 12,
    color: '#795548',
  },
  step3FixTip: {
    marginTop: 4,
    fontSize: 12,
    color: '#8A1C1C',
  },
  // Bottom buttons
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButtonBottom: {
    flex: 0.4,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonBottom: {
    borderColor: '#E53935',
    backgroundColor: '#FFF5F5',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  // Step 2 styles
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 1,
    marginBottom: 15,
  },
  selectContainer: {
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  selectText: {
    fontSize: 16,
    color: '#333',
  },
  selectPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  householdSizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  householdSizeLabel: {
    flex: 1,
  },
  householdSizeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  householdSizeSubtitle: {
    fontSize: 14,
    color: '#2E7D32',
  },
  householdSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  sizeButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeButtonPlus: {
    backgroundColor: '#2ECC71',
  },
  sizeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  vulnerableSection: {
    marginTop: 10,
  },
  vulnerableTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  vulnerableSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  vulnerableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vulnerableCard: {
    width: '47%',
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  vulnerableCardActive: {
    borderColor: '#2E7D32',
    borderWidth: 2,
    backgroundColor: '#F0FFF0',
  },
  vulnerableCardText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  vulnerableCardTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  vulnerableCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  vulnerableCountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  specifyCountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FFF0',
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  specifyCountButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  vulnerableDetailsModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 15,
  },
  vulnerableModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  vulnerableCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  vulnerableCountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vulnerableCountLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  vulnerableCountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countButtonPlus: {
    backgroundColor: '#2ECC71',
  },
  countValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    minWidth: 24,
    textAlign: 'center',
  },
  vulnerableModalDoneButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  vulnerableModalDoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  // Dropdown styles
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginTop: 5,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemActive: {
    backgroundColor: '#F0FFF0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownItemTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  // Step 3 - Identity Verification styles
  idUploadBox: {
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  idUploadPlaceholder: {
    alignItems: 'center',
  },
  idUploadIconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  tapToUploadBadge: {
    position: 'absolute',
    bottom: -2,
    right: -8,
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idUploadText: {
    fontSize: 14,
    color: '#666',
  },
  idImage: {
    width: '100%',
    height: '100%',
  },
  quickTipsContainer: {
    backgroundColor: '#F0FFF0',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  quickTipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickTipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginLeft: 8,
  },
  quickTipsList: {
    marginBottom: 12,
  },
  quickTipItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    paddingLeft: 5,
  },
  privacyNote: {
    borderTopWidth: 1,
    borderTopColor: '#D0E8D0',
    paddingTop: 12,
  },
  privacyNoteText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  // Image Picker Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  imagePickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 15,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 25,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0FFF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalCancelButton: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  // Step 4 - Face Verification styles
  faceScanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    minHeight: 250,
    justifyContent: 'center',
  },
  faceScanPlaceholder: {
    alignItems: 'center',
  },
  faceScanIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FFF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  faceScanTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  faceScanSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  faceImageContainer: {
    alignItems: 'center',
    width: '100%',
  },
  faceImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 15,
  },
  faceVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  faceVerifiedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 6,
  },
  faceStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  faceStatusBadgeError: {
    backgroundColor: '#FFEBEE',
  },
  faceStatusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
  },
  faceStatusTextError: {
    color: '#D32F2F',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 20,
    gap: 10,
  },
  scanButtonComplete: {
    backgroundColor: '#666',
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  scanStatusRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanStatusText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
    textAlign: 'center',
  },
  scanStatusTextError: {
    color: '#D32F2F',
  },
  instructionsContainer: {
    marginTop: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  instructionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FFF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionTextContainer: {
    flex: 1,
  },
  instructionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  instructionDesc: {
    fontSize: 13,
    color: '#666',
  },
  // Face Scanner Modal styles
  faceScannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  scannerCloseButton: {
    padding: 5,
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  faceFrameOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  faceFrameTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  faceFrameMiddle: {
    flexDirection: 'row',
    height: 320,
  },
  faceFrameSide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  faceFrame: {
    width: 250,
    height: 280,
    borderRadius: 140,
    borderWidth: 3,
    borderColor: '#2ECC71',
    position: 'relative',
    overflow: 'hidden',
  },
  cornerMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#2ECC71',
    borderWidth: 4,
  },
  topLeft: {
    top: 20,
    left: 20,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 20,
    right: 20,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 10,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#2ECC71',
  },
  faceFrameBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanSuccessOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanSuccessIcon: {
    marginBottom: 15,
  },
  scanSuccessText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2ECC71',
  },
  scannerBottom: {
    paddingHorizontal: 30,
    paddingVertical: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
  },
  scannerInstructions: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  startScanButton: {
    backgroundColor: '#2ECC71',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startScanButtonDisabled: {
    opacity: 0.6,
  },
  retryButton: {
    backgroundColor: '#F39C12',
  },
  startScanButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 15,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: 4,
  },
  progressBarPaused: {
    backgroundColor: '#F39C12',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#FFF',
  },
  progressPausedText: {
    fontSize: 12,
    color: '#F39C12',
    fontWeight: '500',
  },
  scanningText: {
    fontSize: 16,
    color: '#2ECC71',
    fontWeight: '500',
  },
  successText: {
    fontSize: 18,
    color: '#2ECC71',
    fontWeight: '600',
    marginLeft: 10,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Enhanced Face Scanner Styles
  faceFrameOval: {
    width: 250,
    height: 320,
    borderRadius: 125,
    borderWidth: 4,
    borderColor: '#FFF',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceFrameOvalDetected: {
    borderColor: '#2ECC71',
    borderWidth: 4,
  },
  faceFrameOvalNoFace: {
    borderColor: '#F39C12',
    borderWidth: 4,
  },
  faceDetectionIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceDetectionText: {
    fontSize: 14,
    color: '#FFF',
    marginTop: 10,
    textAlign: 'center',
  },
  noFaceWarning: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noFaceText: {
    fontSize: 14,
    color: '#F39C12',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  scannerInstructionsWarning: {
    color: '#F39C12',
  },
  scannerInstructionsSuccess: {
    color: '#2ECC71',
  },
  // Challenge Indicators
  challengeIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  challengeItem: {
    alignItems: 'center',
  },
  challengeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#555',
    marginBottom: 6,
  },
  challengeIconActive: {
    backgroundColor: '#FFF',
    borderColor: '#2E7D32',
  },
  challengeIconComplete: {
    backgroundColor: '#2ECC71',
    borderColor: '#2ECC71',
  },
  challengeLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  challengeLabelActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  challengeConnector: {
    width: 30,
    height: 2,
    backgroundColor: '#555',
    marginHorizontal: 10,
    marginBottom: 20,
  },
  
  // Step 5: Verification Result Styles
  verificationLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  verificationLoadingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E7D32',
    marginTop: 20,
    marginBottom: 8,
  },
  verificationLoadingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  verificationProgressContainer: {
    width: '80%',
    alignItems: 'center',
  },
  verificationProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  verificationProgressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 4,
  },
  verificationProgressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  verificationResultContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  verificationResultIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  confidenceScoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  confidenceScoreLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  confidenceScoreValue: {
    fontSize: 56,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  statusBadgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressRingContainer: {
    width: '90%',
    marginBottom: 24,
  },
  progressRingBackground: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressRingFill: {
    height: '100%',
    borderRadius: 6,
  },
  verificationDetailsContainer: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  verificationDetailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  verificationDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  verificationDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  verificationDetailValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  statusMessageText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    lineHeight: 20,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});



