import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Dynamic import of expo-notifications to prevent crash on Expo Go SDK 56
const Notifications = !isExpoGo ? require('expo-notifications') : null;

async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android' || !Notifications) {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#16A34A',
    });
  } catch {
    // Some Expo Go/dev runtimes may not expose channel providers correctly.
  }
}

export async function triggerTestNotification() {
  if (isExpoGo) {
    Alert.alert(
      'Expo Go Limitation',
      'Push notification features (including local test alerts) are disabled in Expo Go to prevent crashes. Use a development build for notifications.'
    );
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    throw new Error('Notification permission not granted.');
  }

  await ensureAndroidNotificationChannel();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Notification',
      body: 'Kapit-Bisig notifications are working on this device.',
      data: { screen: 'home', source: 'manual-test' },
    },
    trigger: null,
  });
}
