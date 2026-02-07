import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from './components/SplashScreen';
import HomeScreen from './components/HomeScreen';
import ProfileScreen from './components/ProfileScreen';
import QRReceiptScreen from './components/QRReceiptScreen';

type Screen = 'home' | 'qr' | 'profile';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  const handleGetStarted = () => {
    setShowSplash(false);
  };

  const handleLogout = () => {
    setShowSplash(true);
    setCurrentScreen('home');
  };

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <SplashScreen onGetStarted={handleGetStarted} />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'profile':
        return <ProfileScreen onNavigate={handleNavigate} onLogout={handleLogout} />;
      case 'qr':
        return <QRReceiptScreen onBack={() => handleNavigate('home')} onNavigate={handleNavigate} />;
      case 'home':
      default:
        return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <SafeAreaProvider>
      {renderScreen()}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
