import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { refreshProofSyncSnapshot, syncCurrentResidentProofs } from './ProofSyncCoordinator';

const isExpoGo = Boolean(Constants.expoGoConfig);
const TaskManager = !isExpoGo ? require('expo-task-manager') : null;
const BackgroundTask = !isExpoGo ? require('expo-background-task') : null;
const Notifications = !isExpoGo ? require('expo-notifications') : null;
const PROOF_SYNC_TASK_NAME = 'KAPIT_BISIG_PROOF_SYNC';

async function fireLocalSyncNotification(syncedCount: number): Promise<void> {
  if (!Notifications || syncedCount < 1) return;
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
        body: syncedCount === 1
          ? 'Your saved proof is now pending admin review.'
          : `${syncedCount} saved proofs are now pending admin review.`,
        data: { screen: 'proof-request', source: 'background-sync' },
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('[BackgroundSync] Local notification failed:', error);
  }
}

if (TaskManager && BackgroundTask) {
  try {
    TaskManager.defineTask(PROOF_SYNC_TASK_NAME, async () => {
      try {
        const before = (await refreshProofSyncSnapshot()).records.length;
        const afterSnapshot = await syncCurrentResidentProofs();
        const syncedCount = Math.max(0, before - afterSnapshot.records.length);
        await fireLocalSyncNotification(syncedCount);
        return BackgroundTask.BackgroundTaskResult.Success;
      } catch (error) {
        console.warn('[BackgroundSync] Background proof sync failed:', error);
        return BackgroundTask.BackgroundTaskResult.Failed;
      }
    });
  } catch (error) {
    console.warn('[BackgroundSync] Task definition failed:', error);
  }
}

export async function registerBackgroundProofSync(): Promise<void> {
  if (isExpoGo || !TaskManager || !BackgroundTask) return;
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) return;
    const registered = await TaskManager.isTaskRegisteredAsync(PROOF_SYNC_TASK_NAME);
    if (!registered) {
      await BackgroundTask.registerTaskAsync(PROOF_SYNC_TASK_NAME, { minimumInterval: 15 });
    }
  } catch (error) {
    console.warn('[BackgroundSync] Registration failed:', error);
  }
}

export async function unregisterBackgroundProofSync(): Promise<void> {
  if (isExpoGo || !TaskManager || !BackgroundTask) return;
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(PROOF_SYNC_TASK_NAME);
    if (registered) await BackgroundTask.unregisterTaskAsync(PROOF_SYNC_TASK_NAME);
  } catch (error) {
    console.warn('[BackgroundSync] Unregistration failed:', error);
  }
}

export async function triggerManualProofSync(): Promise<{ synced: boolean; count: number }> {
  const before = (await refreshProofSyncSnapshot()).records.length;
  const after = await syncCurrentResidentProofs();
  const count = Math.max(0, before - after.records.length);
  return { synced: count > 0, count };
}
