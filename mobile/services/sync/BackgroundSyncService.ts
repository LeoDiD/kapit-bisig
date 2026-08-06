/**
 * BackgroundSyncService
 *
 * Registers a periodic background task that syncs any queued offline proof
 * submissions. When connectivity returns and the OS triggers the task, it
 * reads the local JSON queue, calls the batch-sync endpoint, and fires a
 * local notification on success.
 *
 * Safe to call in Expo Go — registration is silently skipped.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Lazy-load to avoid Expo Go crashes
const TaskManager = !isExpoGo ? require('expo-task-manager') : null;
const BackgroundFetch = !isExpoGo ? require('expo-background-fetch') : null;
const Notifications = !isExpoGo ? require('expo-notifications') : null;

const PROOF_SYNC_TASK_NAME = 'KAPIT_BISIG_PROOF_SYNC';

/**
 * The actual sync logic executed inside the background task.
 */
async function executeProofSync(): Promise<boolean> {
  try {
    // Dynamic import to avoid circular dependency issues at module init time
    const {
      getResidentToken,
      getQueuedResidentProofSubmissions,
      syncQueuedResidentProofSubmissions,
    } = require('../api/ResidentQrService');

    const token = await getResidentToken();
    if (!token) {
      return false;
    }

    const queue = await getQueuedResidentProofSubmissions();
    if (queue.length === 0) {
      return false;
    }

    const result = await syncQueuedResidentProofSubmissions(token);

    if (result.success && result.syncedCount > 0) {
      await fireLocalSyncNotification(result.syncedCount);
      return true;
    }

    return false;
  } catch (error) {
    console.warn('[BackgroundSync] Sync attempt failed:', error);
    return false;
  }
}

/**
 * Fire a local notification telling the resident that queued proofs were synced.
 */
async function fireLocalSyncNotification(syncedCount: number): Promise<void> {
  if (!Notifications) return;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('proof-sync', {
        name: 'Proof Sync',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 200],
        lightColor: '#16A34A',
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Proof uploaded successfully',
        body:
          syncedCount === 1
            ? 'Your saved proof submission was uploaded and is now pending review.'
            : `${syncedCount} saved proof submissions were uploaded and are now pending review.`,
        data: { screen: 'proof-request', source: 'background-sync' },
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('[BackgroundSync] Failed to fire local notification:', error);
  }
}

// Define the task in the global scope so it registers when the module is imported in the background
if (TaskManager) {
  try {
    TaskManager.defineTask(PROOF_SYNC_TASK_NAME, async () => {
      try {
        const didSync = await executeProofSync();
        return didSync
          ? BackgroundFetch.BackgroundFetchResult.NewData
          : BackgroundFetch.BackgroundFetchResult.NoData;
      } catch {
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  } catch (error) {
    console.warn('[BackgroundSync] Global task definition failed:', error);
  }
}

/**
 * Register the background sync task.
 * Should be called once after the resident is logged in.
 */
export async function registerBackgroundProofSync(): Promise<void> {
  if (isExpoGo || !TaskManager || !BackgroundFetch) {
    console.log('[BackgroundSync] Skipping registration (Expo Go or missing modules).');
    return;
  }

  try {
    await BackgroundFetch.registerTaskAsync(PROOF_SYNC_TASK_NAME, {
      minimumInterval: 15 * 60, // 15 minutes (iOS enforced minimum)
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('[BackgroundSync] Background proof sync task registered.');
  } catch (error) {
    console.warn('[BackgroundSync] Registration failed:', error);
  }
}

/**
 * Unregister the background sync task.
 * Should be called on logout.
 */
export async function unregisterBackgroundProofSync(): Promise<void> {
  if (isExpoGo || !TaskManager || !BackgroundFetch) {
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(PROOF_SYNC_TASK_NAME);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(PROOF_SYNC_TASK_NAME);
      console.log('[BackgroundSync] Background proof sync task unregistered.');
    }
  } catch (error) {
    console.warn('[BackgroundSync] Unregistration failed:', error);
  }
}

/**
 * Manually trigger a sync attempt (e.g. when the app comes to the foreground).
 * This is a best-effort convenience — the background task handles the real scheduling.
 */
export async function triggerManualProofSync(): Promise<{ synced: boolean; count: number }> {
  try {
    const didSync = await executeProofSync();
    return { synced: didSync, count: didSync ? 1 : 0 };
  } catch {
    return { synced: false, count: 0 };
  }
}
