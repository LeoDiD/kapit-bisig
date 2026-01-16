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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RegisterScreen from './RegisterScreen';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onGetStarted: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
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

export default function SplashScreen({ onGetStarted, onLogin, onRegister }: SplashScreenProps) {
  const [showInitialSplash, setShowInitialSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [showRegisterScreen, setShowRegisterScreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(slideIndex);
  };

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slideIndex === slides.length - 1) {
      // User reached the last slide, show login screen after a short delay
      setTimeout(() => {
        setShowLoginScreen(true);
      }, 500);
    }
  };

  const handleGetStarted = () => {
    setShowOnboarding(true);
  };

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      onGetStarted();
    }
  };

  const handleRegister = () => {
    setShowRegisterScreen(true);
  };

  const handleRegisterBack = () => {
    setShowRegisterScreen(false);
  };

  const handleRegisterComplete = () => {
    if (onRegister) {
      onRegister();
    } else {
      onGetStarted();
    }
  };

  const handleRegisterCancel = () => {
    setShowRegisterScreen(false);
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

  // Initial Login/Registration Splash Screen
  if (showInitialSplash) {
    return (
      <View style={styles.initialSplashContainer}>
        <View style={styles.initialLogoWrapper}>
          <Image
            source={require('../assets/graphics5.png')}
            style={styles.initialGraphic}
            resizeMode="contain"
          />
          <Image
            source={require('../assets/textual.png')}
            style={styles.initialTextualLogo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.initialButtonsContainer}>
          <TouchableOpacity 
            style={styles.initialLoginButton} 
            onPress={() => {
              setShowInitialSplash(false);
              setShowOnboarding(true);
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

  // Initial Splash Screen with Logo
  if (!showOnboarding) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoLarge}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
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

  // Login/Register Screen
  if (showLoginScreen) {
    return (
      <View style={styles.container}>
        <View style={styles.loginLogoContainer}>
          <Image
            source={require('../assets/Logo1.png')}
            style={styles.loginLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            <Text style={styles.welcomeGreen}>Welcome </Text>
            <Text style={styles.welcomeYellow}>Back!</Text>
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#888" />
            </TouchableOpacity>
          </View>

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
            <TouchableOpacity>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButtonMain} onPress={handleLogin}>
            <Text style={styles.loginButtonMainText}>Login</Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerPrompt}>Dont  have an account?  </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Onboarding Slider
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
          onMomentumScrollEnd={onMomentumScrollEnd}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
  loginLogoContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  loginLogo: {
    width: width * 0.4,
    height: width * 0.4,
  },
  welcomeContainer: {
    marginBottom: 30,
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
  loginButtonMainText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
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
    marginBottom: 50,
  },
  initialGraphic: {
    width: width * 0.7,
    height: width * 0.52,
    marginBottom: -5,
  },
  initialTextualLogo: {
    width: width * 0.65,
    height: width * 0.22,
  },
  initialButtonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  initialLoginButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#2E7D32',
    width: width * 0.45,
    alignItems: 'center',
  },
  initialLoginButtonText: {
    color: '#ECC323',
    fontSize: 16,
    fontWeight: '600',
  },
  initialRegisterButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 25,
    width: width * 0.45,
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
