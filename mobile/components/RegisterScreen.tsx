import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Platform,
  Modal,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width } = Dimensions.get('window');

interface RegisterScreenProps {
  onBack: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

export default function RegisterScreen({ onBack, onComplete, onCancel }: RegisterScreenProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Personal Info
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
  const barangayOptions = ['San Bakonagkulang', 'Maybago', 'Nakaraan'];

  // Step 3: Identity Verification
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [frontIdImage, setFrontIdImage] = useState<string | null>(null);
  const [backIdImage, setBackIdImage] = useState<string | null>(null);
  const [showIdTypeDropdown, setShowIdTypeDropdown] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [currentImageSide, setCurrentImageSide] = useState<'front' | 'back'>('front');
  const idTypeOptions = ['Philippine National ID', 'Driver\'s License', 'Passport', 'SSS ID', 'PhilHealth ID', 'Voter\'s ID'];

  // Step 4: Face Scan
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [faceScanComplete, setFaceScanComplete] = useState(false);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const scanAnimation = useRef(new Animated.Value(0)).current;

  // Validation
  const [showErrors, setShowErrors] = useState(false);
  const [step1Errors, setStep1Errors] = useState({
    fullName: false,
    dateOfBirth: false,
    gender: false,
    mobileNumber: false,
    password: false,
    confirmPassword: false,
    passwordMismatch: false,
    termsAccepted: false,
  });
  const [step2Errors, setStep2Errors] = useState({
    barangay: false,
    streetAddress: false,
  });
  const [step3Errors, setStep3Errors] = useState({
    idType: false,
    idNumber: false,
    frontIdImage: false,
    backIdImage: false,
  });
  const [step4Errors, setStep4Errors] = useState({
    faceScan: false,
  });

  // Refs for scrolling to errors
  const scrollViewRef = useRef<ScrollView>(null);

  const progressPercentage = (currentStep / totalSteps) * 100;

  const validateStep1 = () => {
    const errors = {
      fullName: !fullName.trim(),
      dateOfBirth: !dateOfBirth.trim(),
      gender: !gender,
      mobileNumber: !mobileNumber.trim(),
      password: !password.trim() || password.length < 8,
      confirmPassword: !confirmPassword.trim(),
      passwordMismatch: password !== confirmPassword,
      termsAccepted: !termsAccepted,
    };
    setStep1Errors(errors);
    
    // Scroll to first error
    if (errors.fullName) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else if (errors.dateOfBirth) {
      scrollViewRef.current?.scrollTo({ y: 100, animated: true });
    } else if (errors.gender) {
      scrollViewRef.current?.scrollTo({ y: 200, animated: true });
    } else if (errors.mobileNumber) {
      scrollViewRef.current?.scrollTo({ y: 300, animated: true });
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

  const validateStep2 = () => {
    const errors = {
      barangay: !barangay.trim(),
      streetAddress: !streetAddress.trim(),
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

  // Get ID format requirements based on ID type
  const getIdFormatInfo = (type: string) => {
    switch (type) {
      case 'Philippine National ID':
        return { minLength: 12, maxLength: 12, pattern: /^\d{12}$/, hint: '12 digits', keyboardType: 'numeric' as const };
      case "Driver's License":
        return { minLength: 12, maxLength: 12, pattern: /^\d{12}$/, hint: '12 digits', keyboardType: 'numeric' as const };
      case 'Passport':
        return { minLength: 9, maxLength: 10, pattern: /^[A-Za-z]\d{8,9}$/, hint: '1 letter followed by 8-9 digits', keyboardType: 'default' as const };
      case 'SSS ID':
        return { minLength: 10, maxLength: 10, pattern: /^\d{10}$/, hint: '10 digits', keyboardType: 'numeric' as const };
      case 'PhilHealth ID':
        return { minLength: 12, maxLength: 12, pattern: /^\d{12}$/, hint: '12 digits', keyboardType: 'numeric' as const };
      case "Voter's ID":
        return { minLength: 22, maxLength: 22, pattern: /^\d{22}$/, hint: '22 digits', keyboardType: 'numeric' as const };
      default:
        return { minLength: 1, maxLength: 30, pattern: /^.+$/, hint: 'Enter your ID number', keyboardType: 'default' as const };
    }
  };

  const validateIdNumber = (type: string, number: string): boolean => {
    if (!number.trim()) return false;
    const formatInfo = getIdFormatInfo(type);
    return formatInfo.pattern.test(number);
  };

  const validateStep3 = () => {
    const isIdNumberValid = validateIdNumber(idType, idNumber);
    const errors = {
      idType: !idType.trim(),
      idNumber: !idNumber.trim() || !isIdNumberValid,
      frontIdImage: !frontIdImage,
      backIdImage: !backIdImage,
    };
    setStep3Errors(errors);
    
    // Scroll to first error
    if (errors.idType) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else if (errors.idNumber) {
      scrollViewRef.current?.scrollTo({ y: 100, animated: true });
    } else if (errors.frontIdImage) {
      scrollViewRef.current?.scrollTo({ y: 200, animated: true });
    } else if (errors.backIdImage) {
      scrollViewRef.current?.scrollTo({ y: 400, animated: true });
    }
    
    return !Object.values(errors).some(Boolean);
  };

  // Image picker functions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera and photo library permissions to upload ID photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const openImagePicker = async (side: 'front' | 'back') => {
    setCurrentImageSide(side);
    const hasPermissions = await requestPermissions();
    if (hasPermissions) {
      setShowImagePickerModal(true);
    }
  };

  const pickFromGallery = async () => {
    setShowImagePickerModal(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
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
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (currentImageSide === 'front') {
        setFrontIdImage(result.assets[0].uri);
        if (showErrors) setStep3Errors(prev => ({ ...prev, frontIdImage: false }));
      } else {
        setBackIdImage(result.assets[0].uri);
        if (showErrors) setStep3Errors(prev => ({ ...prev, backIdImage: false }));
      }
    }
  };

  // Step 4: Face Scan functions
  const validateStep4 = () => {
    const errors = {
      faceScan: !faceScanComplete,
    };
    setStep4Errors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const startFaceScan = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to complete face verification.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setShowFaceScanner(true);
    setScanStatus('idle');
    setScanProgress(0);
  };

  const startScanning = () => {
    setScanStatus('scanning');
    setScanProgress(0);
    
    // Animate the scanning progress
    Animated.timing(scanAnimation, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // Simulate face detection progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    // Complete scan after 3 seconds
    setTimeout(async () => {
      clearInterval(interval);
      setScanProgress(100);
      
      // Take a photo for verification
      if (cameraRef.current) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.8,
            base64: false,
          });
          setFaceImage(photo.uri);
          setScanStatus('success');
          setFaceScanComplete(true);
          if (showErrors) setStep4Errors({ faceScan: false });
          
          // Close scanner after success
          setTimeout(() => {
            setShowFaceScanner(false);
          }, 1500);
        } catch (error) {
          setScanStatus('failed');
          Alert.alert('Error', 'Failed to capture photo. Please try again.');
        }
      }
    }, 3000);
  };

  const retakeFaceScan = () => {
    setFaceScanComplete(false);
    setFaceImage(null);
    setScanStatus('idle');
    setScanProgress(0);
    scanAnimation.setValue(0);
    setShowFaceScanner(true);
  };

  const handleNextStep = () => {
    setShowErrors(true);
    
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    if (currentStep === 2 && !validateStep2()) {
      return;
    }
    if (currentStep === 3 && !validateStep3()) {
      return;
    }
    if (currentStep === 4 && !validateStep4()) {
      return;
    }
    
    setShowErrors(false);
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
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

  const renderStep1 = () => (
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
        {/* Full Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <View style={[styles.inputContainer, showErrors && step1Errors.fullName && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder="Juan dela Cruz"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (text.trim()) clearStep1Error('fullName');
              }}
            />
            <Ionicons name="person" size={22} color="#2E7D32" style={styles.inputIconRight} />
          </View>
        </View>

        {/* Date of Birth */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Date of Birth</Text>
          <TouchableOpacity 
            style={[styles.inputContainer, showErrors && step1Errors.dateOfBirth && styles.inputError]}
            onPress={() => setShowDatePicker(true)}
          >
            <TextInput
              style={styles.input}
              placeholder="mm/dd/yyyy"
              placeholderTextColor="#999"
              value={dateOfBirth}
              onChangeText={(text) => {
                handleDateChange(text);
                if (text.trim()) clearStep1Error('dateOfBirth');
              }}
              keyboardType="numeric"
              maxLength={10}
              editable={true}
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
                if (date) clearStep1Error('dateOfBirth');
              }}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Gender */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={[styles.genderContainer, showErrors && step1Errors.gender && styles.genderError]}>
            {(['Male', 'Female', 'Other'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.genderButton,
                  gender === option && styles.genderButtonActive,
                  showErrors && step1Errors.gender && styles.genderButtonError,
                ]}
                onPress={() => {
                  setGender(option);
                  clearStep1Error('gender');
                }}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === option && styles.genderButtonTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mobile Number */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Mobile Number</Text>
          <View style={[styles.inputContainer, showErrors && step1Errors.mobileNumber && styles.inputError]}>
            <View style={styles.phonePrefix}>
              <Text style={styles.phonePrefixText}>+63</Text>
            </View>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              placeholder="912 345 6789"
              placeholderTextColor="#999"
              value={mobileNumber}
              onChangeText={(text) => {
                setMobileNumber(text);
                if (text.trim()) clearStep1Error('mobileNumber');
              }}
              keyboardType="phone-pad"
              maxLength={12}
            />
            <Ionicons name="call" size={22} color="#2E7D32" style={styles.inputIconRight} />
          </View>
        </View>

        {/* Password */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={[styles.inputContainer, showErrors && step1Errors.password && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder="Enter password (min 8 characters)"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (text.trim() && text.length >= 8) clearStep1Error('password');
              }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.inputIconRight}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#2E7D32" />
            </TouchableOpacity>
          </View>
          {showErrors && step1Errors.password && (
            <Text style={styles.errorText}>Password must be at least 8 characters</Text>
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
                setConfirmPassword(text);
                if (text.trim()) {
                  setStep1Errors(prev => ({ ...prev, confirmPassword: false, passwordMismatch: text !== password }));
                }
              }}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.inputIconRight}>
              <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color="#2E7D32" />
            </TouchableOpacity>
          </View>
          {showErrors && step1Errors.passwordMismatch && !step1Errors.confirmPassword && (
            <Text style={styles.errorText}>Passwords do not match</Text>
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
          <Text style={styles.errorTextTerms}>You must accept the terms and conditions</Text>
        )}
      </View>
    </View>
  );

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
                    setBarangay(option);
                    setShowBarangayDropdown(false);
                    if (showErrors) setStep2Errors(prev => ({ ...prev, barangay: false }));
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
            />
          </View>
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
            {[
              { id: 'senior', label: 'Senior Citizen', icon: 'walk' },
              { id: 'pwd', label: 'PWD', icon: 'accessibility' },
              { id: 'pregnant', label: 'Pregnant', icon: 'person' },
              { id: 'children', label: 'Children (0-5)', icon: 'happy' },
            ].map((item) => (
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
              autoCapitalize={idType === 'Passport' ? 'characters' : 'none'}
              onChangeText={(text) => {
                // For passport, allow letters and numbers; for others, only numbers
                let filteredText = text;
                if (idType === 'Passport') {
                  // First character can be letter, rest are numbers
                  filteredText = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                  if (filteredText.length > 1) {
                    filteredText = filteredText[0] + filteredText.slice(1).replace(/[^0-9]/g, '');
                  }
                } else if (idType) {
                  filteredText = text.replace(/[^0-9]/g, '');
                }
                setIdNumber(filteredText);
                if (validateIdNumber(idType, filteredText) && showErrors) {
                  setStep3Errors(prev => ({ ...prev, idNumber: false }));
                }
              }}
              editable={!!idType}
            />
          </View>
          {idType && (
            <Text style={styles.idFormatHint}>
              Format: {getIdFormatInfo(idType).hint} ({idNumber.length}/{getIdFormatInfo(idType).maxLength})
            </Text>
          )}
          {showErrors && step3Errors.idNumber && idNumber.trim() && (
            <Text style={styles.idFormatError}>
              Invalid format. Required: {getIdFormatInfo(idType).hint}
            </Text>
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
        </View>

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
          <Text style={styles.titleGreen}>Verification</Text>
        </Text>
        <Text style={styles.subtitle}>
          Complete your registration by verifying your identity with a quick face scan. This helps us ensure the security of your account.
        </Text>
      </View>

      <View style={styles.formFields}>
        {/* Face Scan Status Card */}
        <View style={[styles.faceScanCard, showErrors && step4Errors.faceScan && styles.inputError]}>
          {faceImage ? (
            <View style={styles.faceImageContainer}>
              <Image source={{ uri: faceImage }} style={styles.faceImage} resizeMode="cover" />
              <View style={styles.faceVerifiedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
                <Text style={styles.faceVerifiedText}>Verified</Text>
              </View>
            </View>
          ) : (
            <View style={styles.faceScanPlaceholder}>
              <View style={styles.faceScanIconContainer}>
                <Ionicons name="scan" size={60} color="#2E7D32" />
              </View>
              <Text style={styles.faceScanTitle}>Ready to Scan</Text>
              <Text style={styles.faceScanSubtitle}>
                Position your face within the frame and hold still
              </Text>
            </View>
          )}
        </View>

        {/* Scan Button */}
        <TouchableOpacity 
          style={[styles.scanButton, faceScanComplete && styles.scanButtonComplete]}
          onPress={faceScanComplete ? retakeFaceScan : startFaceScan}
        >
          <Ionicons 
            name={faceScanComplete ? "refresh" : "camera"} 
            size={24} 
            color="#FFF" 
          />
          <Text style={styles.scanButtonText}>
            {faceScanComplete ? 'Retake Scan' : 'Start Face Scan'}
          </Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="sunny-outline" size={20} color="#2E7D32" />
            </View>
            <View style={styles.instructionTextContainer}>
              <Text style={styles.instructionLabel}>Good Lighting</Text>
              <Text style={styles.instructionDesc}>Ensure your face is well-lit, avoid backlighting</Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="glasses-outline" size={20} color="#2E7D32" />
            </View>
            <View style={styles.instructionTextContainer}>
              <Text style={styles.instructionLabel}>Remove Accessories</Text>
              <Text style={styles.instructionDesc}>Take off glasses, hats, or masks</Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="phone-portrait-outline" size={20} color="#2E7D32" />
            </View>
            <View style={styles.instructionTextContainer}>
              <Text style={styles.instructionLabel}>Hold Steady</Text>
              <Text style={styles.instructionDesc}>Keep your phone steady and look directly at the camera</Text>
            </View>
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.quickTipsContainer}>
          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark" size={20} color="#2E7D32" style={{ marginRight: 8 }} />
            <Text style={styles.privacyNoteText}>
              Your facial data is securely encrypted and used only for identity verification. We do not store or share your biometric data.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <View style={styles.backButtonIcon}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentStep === 3 ? 'Identity Verification' : currentStep === 4 ? 'Face Verification' : 'Resident Signup'}
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
          <Text style={styles.percentText}>{Math.round(progressPercentage)}% Completed</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
        </View>
      </View>

      {/* Form Content */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity 
            style={[styles.backButtonBottom, currentStep === 1 && styles.cancelButtonBottom]} 
            onPress={handleBack}
          >
            <Text style={[styles.backButtonText, currentStep === 1 && styles.cancelButtonText]}>
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
            <Text style={styles.nextButtonText}>
              {currentStep === 4 ? 'Complete Registration' : currentStep === 3 ? 'Continue' : 'Next Step'}
            </Text>
            <Ionicons name={currentStep === 4 ? "checkmark" : "arrow-forward"} size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

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
            
            {[
              { id: 'senior', label: 'Senior Citizen', icon: 'walk' },
              { id: 'pwd', label: 'PWD', icon: 'accessibility' },
              { id: 'pregnant', label: 'Pregnant', icon: 'person' },
              { id: 'children', label: 'Children (0-5)', icon: 'happy' },
            ].filter(item => vulnerableMembers.includes(item.id)).map((item) => (
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

      {/* Face Scanner Modal */}
      <Modal
        visible={showFaceScanner}
        animationType="slide"
        onRequestClose={() => setShowFaceScanner(false)}
      >
        <SafeAreaView style={styles.faceScannerContainer}>
          {/* Scanner Header */}
          <View style={styles.scannerHeader}>
            <TouchableOpacity 
              onPress={() => setShowFaceScanner(false)} 
              style={styles.scannerCloseButton}
            >
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Face Verification</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Camera View */}
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="front"
            >
              {/* Face Frame Overlay */}
              <View style={styles.faceFrameOverlay}>
                <View style={styles.faceFrameTop} />
                <View style={styles.faceFrameMiddle}>
                  <View style={styles.faceFrameSide} />
                  <View style={styles.faceFrame}>
                    {/* Corner markers */}
                    <View style={[styles.cornerMarker, styles.topLeft]} />
                    <View style={[styles.cornerMarker, styles.topRight]} />
                    <View style={[styles.cornerMarker, styles.bottomLeft]} />
                    <View style={[styles.cornerMarker, styles.bottomRight]} />
                    
                    {/* Scanning animation line */}
                    {scanStatus === 'scanning' && (
                      <Animated.View 
                        style={[
                          styles.scanLine,
                          {
                            top: scanAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%'],
                            }),
                          },
                        ]} 
                      />
                    )}
                  </View>
                  <View style={styles.faceFrameSide} />
                </View>
                <View style={styles.faceFrameBottom} />
              </View>

              {/* Status Overlay */}
              {scanStatus === 'success' && (
                <View style={styles.scanSuccessOverlay}>
                  <View style={styles.scanSuccessIcon}>
                    <Ionicons name="checkmark-circle" size={80} color="#2ECC71" />
                  </View>
                  <Text style={styles.scanSuccessText}>Face Verified!</Text>
                </View>
              )}
            </CameraView>
          </View>

          {/* Scanner Bottom */}
          <View style={styles.scannerBottom}>
            {scanStatus === 'idle' && (
              <>
                <Text style={styles.scannerInstructions}>
                  Position your face within the frame
                </Text>
                <TouchableOpacity 
                  style={styles.startScanButton}
                  onPress={startScanning}
                >
                  <Text style={styles.startScanButtonText}>Start Scanning</Text>
                </TouchableOpacity>
              </>
            )}
            
            {scanStatus === 'scanning' && (
              <>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${scanProgress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{scanProgress}% Complete</Text>
                </View>
                <Text style={styles.scanningText}>Scanning... Hold still</Text>
              </>
            )}

            {scanStatus === 'success' && (
              <Text style={styles.successText}>Verification complete!</Text>
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
  );
}

const styles = StyleSheet.create({
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
  phonePrefix: {
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#E8E8E8',
    marginRight: 12,
  },
  phonePrefixText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  phoneInput: {
    paddingLeft: 0,
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
    paddingVertical: 20,
    backgroundColor: '#F5F7F5',
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
  cancelButtonText: {
    color: '#E53935',
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
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
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
    height: 280,
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
  progressText: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
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
  },
});
