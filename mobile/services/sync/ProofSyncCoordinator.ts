import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import {
  getResidentSession,
  syncQueuedResidentProofSubmissions,
} from '../api/ResidentQrService';
import { listOfflineProofRecords, type OfflineProofRecord } from './ResidentOfflineStore';

export interface ProofSyncSnapshot {
  online: boolean;
  syncing: boolean;
  authRequired: boolean;
  records: OfflineProofRecord[];
  lastSyncedAt?: string;
}

type Listener = (snapshot: ProofSyncSnapshot) => void;

let snapshot: ProofSyncSnapshot = {
  online: true,
  syncing: false,
  authRequired: false,
  records: [],
};
let syncPromise: Promise<ProofSyncSnapshot> | null = null;
const listeners = new Set<Listener>();
let unsubscribeNetInfo: (() => void) | null = null;

function isOnline(state: NetInfoState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

function publish(update: Partial<ProofSyncSnapshot>): ProofSyncSnapshot {
  snapshot = { ...snapshot, ...update };
  listeners.forEach((listener) => listener(snapshot));
  return snapshot;
}

export function getProofSyncSnapshot(): ProofSyncSnapshot {
  return snapshot;
}

export function subscribeToProofSync(listener: Listener): () => void {
  listeners.add(listener);
  listener(snapshot);
  return () => listeners.delete(listener);
}

export async function refreshProofSyncSnapshot(): Promise<ProofSyncSnapshot> {
  const [session, network] = await Promise.all([getResidentSession(), NetInfo.fetch()]);
  const records = session ? await listOfflineProofRecords(session.residentId) : [];
  return publish({ online: isOnline(network), records });
}

export async function syncCurrentResidentProofs(): Promise<ProofSyncSnapshot> {
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    const session = await getResidentSession();
    if (!session) return publish({ syncing: false, records: [] });

    const network = await NetInfo.fetch();
    if (!isOnline(network)) {
      const records = await listOfflineProofRecords(session.residentId);
      return publish({ online: false, syncing: false, records });
    }

    publish({ online: true, syncing: true });
    const result = await syncQueuedResidentProofSubmissions(session.token, session.residentId);
    const records = await listOfflineProofRecords(session.residentId);
    return publish({
      online: true,
      syncing: false,
      authRequired: Boolean(result.authRequired),
      records,
      lastSyncedAt: result.syncedCount > 0 ? new Date().toISOString() : snapshot.lastSyncedAt,
    });
  })().finally(() => {
    syncPromise = null;
  });

  return syncPromise;
}

export function startProofSyncCoordinator(): () => void {
  if (!unsubscribeNetInfo) {
    let wasOnline: boolean | null = null;
    unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      const online = isOnline(state);
      publish({ online });
      if (online && wasOnline === false) {
        syncCurrentResidentProofs().catch(() => undefined);
      }
      wasOnline = online;
    });
  }

  refreshProofSyncSnapshot().catch(() => undefined);
  return () => {
    unsubscribeNetInfo?.();
    unsubscribeNetInfo = null;
  };
}

