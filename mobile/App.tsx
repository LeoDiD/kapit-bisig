import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import SplashScreen from './components/SplashScreen';
import HomeScreen from './components/HomeScreen';
import ProfileScreen from './components/ProfileScreen';
import VolunteerDashboardScreen from './components/VolunteerDashboardScreen';
import QRReceiptScreen from './components/QRReceiptScreen';
import VolunteerQRScannerScreen from './components/VolunteerQRScannerScreen';
import { mobileAuthService, User as VolunteerUser } from './services/auth/MobileAuthService';
import {
  clearResidentSession,
  fetchResidentProfile,
  getResidentToken,
  ResidentProfile,
} from './services/api/ResidentQrService';

type Screen = 'home' | 'qr' | 'profile';
type AccountType = 'resident' | 'volunteer' | null;
type SplashInitialView = 'landing' | 'login';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashInitialView, setSplashInitialView] = useState<SplashInitialView>('landing');
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [residentProfile, setResidentProfile] = useState<ResidentProfile | null>(null);
  const [volunteerUser, setVolunteerUser] = useState<VolunteerUser | null>(null);
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const notificationReceivedListener = useRef<Notifications.EventSubscription | null>(null);
  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null);
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
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#16A34A',
          });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.warn('Push notification permission not granted.');
          return;
        }
      } catch (error) {
        console.error('Push registration error:', error);
      }
    };

    registerForPushNotificationsAsync().catch(() => undefined);

    notificationReceivedListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Push notification received:', notification.request.identifier);
    });

    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
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
