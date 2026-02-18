import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from './components/SplashScreen';
import HomeScreen from './components/HomeScreen';
import ProfileScreen from './components/ProfileScreen';
import QRReceiptScreen from './components/QRReceiptScreen';
import {
  clearResidentSession,
  fetchResidentProfile,
  getResidentToken,
  ResidentProfile,
} from './services/api/ResidentQrService';

type Screen = 'home' | 'qr' | 'profile';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [residentProfile, setResidentProfile] = useState<ResidentProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const loadResidentProfile = async () => {
    setIsProfileLoading(true);
    try {
      const token = await getResidentToken();
      if (!token) {
        setResidentProfile(null);
        setShowSplash(true);
        return;
      }

      const response = await fetchResidentProfile(token);
      if (!response.success || !response.data) {
        await clearResidentSession();
        setResidentProfile(null);
        setShowSplash(true);
        return;
      }

      setResidentProfile(response.data);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleGetStarted = () => {
    setShowSplash(false);
  };

  const handleLogout = () => {
    clearResidentSession().catch(() => undefined);
    setResidentProfile(null);
    setShowSplash(true);
    setCurrentScreen('home');
  };

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  useEffect(() => {
    if (!showSplash) {
      loadResidentProfile().catch(() => undefined);
    }
  }, [showSplash]);

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <SplashScreen onGetStarted={handleGetStarted} />
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
            residentProfile={residentProfile}
          />
        );
      case 'qr':
        return <QRReceiptScreen onBack={() => handleNavigate('home')} onNavigate={handleNavigate} />;
      case 'home':
      default:
        return (
          <HomeScreen
            onNavigate={handleNavigate}
            userName={residentProfile?.firstName || residentProfile?.fullName}
            barangayName={residentProfile?.barangay ? `Barangay ${residentProfile.barangay}` : undefined}
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
