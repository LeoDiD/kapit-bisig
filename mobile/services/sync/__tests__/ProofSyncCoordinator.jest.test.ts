jest.mock('@react-native-community/netinfo', () => {
  let listener: ((state: Record<string, unknown>) => void) | null = null;
  const state = { isConnected: true, isInternetReachable: true };
  return {
    __esModule: true,
    default: {
      fetch: jest.fn(async () => state),
      addEventListener: jest.fn((next: typeof listener) => {
        listener = next;
        return () => { listener = null; };
      }),
      __setState: (update: Record<string, unknown>) => Object.assign(state, update),
      __emit: (update: Record<string, unknown>) => {
        Object.assign(state, update);
        listener?.({ ...state });
      },
    },
  };
});

jest.mock('../../api/ResidentQrService', () => ({
  getResidentSession: jest.fn(async () => ({
    token: 'resident-token',
    residentId: 'resident-a',
  })),
  syncQueuedResidentProofSubmissions: jest.fn(async () => ({
    success: true,
    syncedCount: 1,
    failedCount: 0,
  })),
}));

jest.mock('../ResidentOfflineStore', () => ({
  listOfflineProofRecords: jest.fn(async () => []),
}));

const netInfo = jest.requireMock('@react-native-community/netinfo').default as {
  __setState: (state: Record<string, unknown>) => void;
  __emit: (state: Record<string, unknown>) => void;
};
const api = jest.requireMock('../../api/ResidentQrService') as {
  getResidentSession: jest.Mock;
  syncQueuedResidentProofSubmissions: jest.Mock;
};
const store = jest.requireMock('../ResidentOfflineStore') as {
  listOfflineProofRecords: jest.Mock;
};
import * as coordinator from '../ProofSyncCoordinator';

describe('ProofSyncCoordinator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    netInfo.__setState({ isConnected: true, isInternetReachable: true });
    api.getResidentSession.mockResolvedValue({ token: 'resident-token', residentId: 'resident-a' });
    api.syncQueuedResidentProofSubmissions.mockResolvedValue({ success: true, syncedCount: 1, failedCount: 0 });
    store.listOfflineProofRecords.mockResolvedValue([]);
  });

  it('uses one mutex-protected upload when sync triggers overlap', async () => {
    let finish: ((value: unknown) => void) | null = null;
    api.syncQueuedResidentProofSubmissions.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const first = coordinator.syncCurrentResidentProofs();
    const second = coordinator.syncCurrentResidentProofs();
    await Promise.resolve();
    await Promise.resolve();

    expect(api.syncQueuedResidentProofSubmissions).toHaveBeenCalledTimes(1);
    finish?.({ success: true, syncedCount: 1, failedCount: 0 });
    await Promise.all([first, second]);
  });

  it('syncs when connectivity changes from offline to online', async () => {
    const stop = coordinator.startProofSyncCoordinator();

    netInfo.__emit({ isConnected: false, isInternetReachable: false });
    netInfo.__emit({ isConnected: true, isInternetReachable: true });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(api.syncQueuedResidentProofSubmissions).toHaveBeenCalledTimes(1);
    stop();
  });

  it('publishes authentication-required state without deleting queued records', async () => {
    const queuedRecord = { ownerResidentId: 'resident-a', clientGeneratedId: 'proof-a', status: 'PENDING_SYNC' };
    api.syncQueuedResidentProofSubmissions.mockResolvedValue({
      success: false,
      syncedCount: 0,
      failedCount: 1,
      authRequired: true,
    });
    store.listOfflineProofRecords.mockResolvedValue([queuedRecord]);
    const snapshot = await coordinator.syncCurrentResidentProofs();

    expect(snapshot.authRequired).toBe(true);
    expect(snapshot.records).toEqual([queuedRecord]);
  });
});
