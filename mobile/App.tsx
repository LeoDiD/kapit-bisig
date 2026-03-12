import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [residentProfile, setResidentProfile] = useState<ResidentProfile | null>(null);
  const [volunteerUser, setVolunteerUser] = useState<VolunteerUser | null>(null);
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

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
    setShowSplash(false);
  };

  const handleVolunteerLoginSuccess = (user: VolunteerUser) => {
    // Ensure volunteer login is the only active session type.
    clearResidentSession().catch(() => undefined);
    setVolunteerUser(user);
    setResidentProfile(null);
    setAccountType('volunteer');
    setCurrentScreen('home');
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
    setShowSplash(true);
    setCurrentScreen('home');
  };

  const handleNavigate = (screen: Screen) => {
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

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <SplashScreen onGetStarted={handleGetStarted} onVolunteerLogin={handleVolunteerLoginSuccess} />
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
