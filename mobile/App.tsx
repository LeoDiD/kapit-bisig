import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import type { EventSubscription } from 'expo-modules-core';
import type { Notification, NotificationResponse } from 'expo-notifications/build/Notifications.types';
import type { NotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { addNotificationReceivedListener, addNotificationResponseReceivedListener } from 'expo-notifications/build/NotificationsEmitter';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import SplashScreen from './components/SplashScreen';
import HomeScreen from './components/HomeScreen';
import ProfileScreen from './components/ProfileScreen';
import ResidentProofRequestScreen from './components/ResidentProofRequestScreen';
import VolunteerDashboardScreen from './components/VolunteerDashboardScreen';
import QRReceiptScreen from './components/QRReceiptScreen';
import VolunteerQRScannerScreen from './components/VolunteerQRScannerScreen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { mobileAuthService, User as VolunteerUser } from './services/auth/MobileAuthService';
import {
  clearResidentSession,
  fetchResidentProfile,
  getResidentToken,
  ResidentProfile,
} from './services/api/ResidentQrService';

type Screen = 'home' | 'qr' | 'profile' | 'proof-request';
type AccountType = 'resident' | 'volunteer' | null;
type SplashInitialView = 'landing' | 'login';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown push notification error';
  }
}

function resolveExpoProjectId(): string | null {
  const envProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  if (envProjectId) {
    return envProjectId;
  }

  const easProjectId = Constants.easConfig?.projectId?.trim();
  if (easProjectId) {
    return easProjectId;
  }

  const extraProjectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)
    ?.eas?.projectId?.trim();

  return extraProjectId || null;
}

function maskPushToken(token: string): string {
  if (token.length <= 12) {
    return token;
  }

  return `${token.slice(0, 8)}...${token.slice(-4)}`;
}

async function scheduleEmulatorTestNotification() {
  await scheduleNotificationAsync({
    content: {
      title: 'Kapit-Bisig Notifications Ready',
      body: 'Emulator mode is using a local test notification. Remote push still requires a physical device.',
      data: { screen: 'home' },
    },
    trigger: null,
  });
}

async function scheduleExpoGoTestNotification() {
  await scheduleNotificationAsync({
    content: {
      title: 'Kapit-Bisig Notifications Ready',
      body: 'Expo Go supports local notifications here. Remote push requires a development build.',
      data: { screen: 'home' },
    },
    trigger: null,
  });
}

async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await setNotificationChannelAsync('default', {
      name: 'default',
      importance: AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#16A34A',
    });
  } catch (error) {
    console.warn('Android notification channel setup skipped:', getErrorMessage(error));
  }
}

const notificationHandler: NotificationHandler = {
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
};

setNotificationHandler(notificationHandler);

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [showSplash, setShowSplash] = useState(true);
  const [splashInitialView, setSplashInitialView] = useState<SplashInitialView>('landing');
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [residentProfile, setResidentProfile] = useState<ResidentProfile | null>(null);
  const [volunteerUser, setVolunteerUser] = useState<VolunteerUser | null>(null);
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const notificationReceivedListener = useRef<EventSubscription | null>(null);
  const notificationResponseListener = useRef<EventSubscription | null>(null);
  const pushTokenRef = useRef<string | null>(null);
  const isResidentPending = accountType === 'resident' && residentProfile?.status === 'Pending';

  const loadResidentProfile = async (): Promise<boolean> => {
    try {
      const token = await getResidentToken();
      if (!token) {
        setResidentProfile(null);
        return false;
      }

      const response = await fetchResidentProfile(token);
      if (!response.success || !response.data) {
        await clearResidentSession();
        setResidentProfile(null);
        return false;
      }

      setResidentProfile(response.data);
      setAccountType('resident');
      return true;
    } catch {
      return false;
    } finally {
    }
  };

  const handleGetStarted = () => {
    setSplashInitialView('landing');
    setShowSplash(false);
  };

  const handleVolunteerLoginSuccess = (user: VolunteerUser) => {
    // Ensure volunteer login is the only active session type.
    clearResidentSession().catch(() => undefined);
    setVolunteerUser(user);
    setResidentProfile(null);
    setAccountType('volunteer');
    setCurrentScreen('home');
    setSplashInitialView('landing');
    setShowSplash(false);
  };

  const handleLogout = () => {
    if (accountType === 'volunteer') {
      mobileAuthService.logout().catch(() => undefined);
      setVolunteerUser(null);
    }

    clearResidentSession().catch(() => undefined);

    setResidentProfile(null);
    setAccountType(null);
    setSplashInitialView('login');
    setShowSplash(true);
    setCurrentScreen('home');
  };

  const handleNavigate = (screen: Screen) => {
    if (isResidentPending && screen === 'qr') {
      Alert.alert(
        'Pending Approval',
        'QR access is disabled while your account is pending admin review.',
      );
      return;
    }
    setCurrentScreen(screen);
  };

  useEffect(() => {
    if (!showSplash) {
      const initializeSession = async () => {
        setIsProfileLoading(true);

        try {
          const volunteerSessionActive = await mobileAuthService.initialize();
          if (volunteerSessionActive) {
            setVolunteerUser(mobileAuthService.getCurrentUser());
            setResidentProfile(null);
            setAccountType('volunteer');
            return;
          }

          const residentSessionActive = await loadResidentProfile();
          if (!residentSessionActive) {
            setShowSplash(true);
            setAccountType(null);
          }
        } finally {
          setIsProfileLoading(false);
        }
      };

      initializeSession().catch(() => undefined);
    }
  }, [showSplash]);

  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      try {
        if (Platform.OS === 'web') {
          console.log('Push notifications are skipped on web.');
          return;
        }

        if (Platform.OS === 'android') {
          await ensureAndroidNotificationChannel();
        }

        const executionEnvironment = Constants.executionEnvironment;
        const { status: existingStatus } = await getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.warn('Push notification permission not granted.');
          return;
        }

        console.log('Push notification permission granted.');

        if (executionEnvironment === 'storeClient') {
          console.log('Running in Expo Go. Remote push token registration is disabled; local notifications remain available.');

          if (__DEV__) {
            await scheduleExpoGoTestNotification();
          }

          return;
        }

        if (!Device.isDevice) {
          console.log('Running on simulator/emulator. Remote push token registration is skipped, but local notifications remain enabled for testing.');

          if (__DEV__) {
            await scheduleEmulatorTestNotification();
          }

          return;
        }

        const projectId = resolveExpoProjectId();
        if (!projectId) {
          console.warn(
            'Push token registration skipped: missing Expo project ID. Set EXPO_PUBLIC_EAS_PROJECT_ID or configure eas.projectId.',
          );
          return;
        }

        console.log(
          `Push token registration is available only in a development build or standalone app. Project ID detected: ${projectId}.`,
        );
        pushTokenRef.current = null;
      } catch (error) {
        console.error('Push registration error:', getErrorMessage(error), error);
      }
    };

    registerForPushNotificationsAsync().catch(() => undefined);

    notificationReceivedListener.current = addNotificationReceivedListener((notification: Notification) => {
      console.log('Push notification received:', notification.request.identifier);
    });

    notificationResponseListener.current = addNotificationResponseReceivedListener((response: NotificationResponse) => {
      const data = (response.notification.request.content.data || {}) as { screen?: Screen };
      const targetScreen = data.screen;

      if (targetScreen === 'home' || targetScreen === 'qr' || targetScreen === 'profile') {
        handleNavigate(targetScreen);
      } else {
        handleNavigate('home');
      }
    });

    return () => {
      notificationReceivedListener.current?.remove();
      notificationResponseListener.current?.remove();
    };
  }, [isResidentPending]);

  if (!fontsLoaded) return null;

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <SplashScreen
          onGetStarted={handleGetStarted}
          onVolunteerLogin={handleVolunteerLoginSuccess}
          initialView={splashInitialView}
        />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  if (isProfileLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'profile':
        return (
          <ProfileScreen
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            accountType={accountType || undefined}
            residentStatus={residentProfile?.status}
            residentProfile={residentProfile}
            volunteerUser={volunteerUser}
            onResidentProfileUpdated={setResidentProfile}
            onVolunteerProfileUpdated={setVolunteerUser}
          />
        );
      case 'proof-request':
        return <ResidentProofRequestScreen onBack={() => handleNavigate('home')} />;
      case 'qr':
        if (accountType === 'volunteer') {
          return <VolunteerQRScannerScreen onBack={() => handleNavigate('home')} onNavigate={handleNavigate} />;
        }

        return <QRReceiptScreen onBack={() => handleNavigate('home')} onNavigate={handleNavigate} />;
      case 'home':
      default:
        // Show VolunteerDashboardScreen for volunteers, HomeScreen for residents
        if (accountType === 'volunteer') {
          return (
            <VolunteerDashboardScreen
              volunteerUser={volunteerUser}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          );
        }
        return (
          <HomeScreen
            onNavigate={handleNavigate}
            accountType={accountType || undefined}
            residentStatus={residentProfile?.status}
            userName={residentProfile?.firstName || residentProfile?.fullName}
            barangayName={
              residentProfile?.barangay
                ? `Barangay ${residentProfile.barangay}`
                : undefined
            }
            isVerified={residentProfile?.status === 'Approved'}
            claimStatus="not-claimed"
            residentCode={residentProfile?.residentCode}
            streetAddress={residentProfile?.streetAddress}
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
      {renderScreen()}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
  },
});
