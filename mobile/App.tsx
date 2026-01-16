import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import SplashScreen from './components/SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleGetStarted = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return (
      <>
        <SplashScreen onGetStarted={handleGetStarted} />
        <StatusBar style="dark" />
      </>
    );
  }

  return (
    <View style={styles.container}>
      <Text>Welcome to Kapit-Bisig!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
