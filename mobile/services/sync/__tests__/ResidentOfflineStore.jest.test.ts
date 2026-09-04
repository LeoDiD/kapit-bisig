jest.mock('expo-file-system/legacy', () => {
  const files = new Map<string, string>();
  const directories = new Set<string>(['file:///documents/']);
  return {
    documentDirectory: 'file:///documents/',
    EncodingType: { UTF8: 'utf8', Base64: 'base64' },
    getInfoAsync: jest.fn(async (path: string) => ({ exists: files.has(path) || directories.has(path) })),
    makeDirectoryAsync: jest.fn(async (path: string) => { directories.add(path); }),
    readAsStringAsync: jest.fn(async (path: string) => {
      if (!files.has(path)) throw new Error(`Missing mock file: ${path}`);
      return files.get(path);
    }),
    writeAsStringAsync: jest.fn(async (path: string, value: string) => { files.set(path, value); }),
    copyAsync: jest.fn(async ({ from, to }: { from: string; to: string }) => {
      if (!files.has(from)) throw new Error(`Missing mock source: ${from}`);
      files.set(to, files.get(from) as string);
    }),
    moveAsync: jest.fn(async ({ from, to }: { from: string; to: string }) => {
      if (!files.has(from)) throw new Error(`Missing mock source: ${from}`);
      files.set(to, files.get(from) as string);
      files.delete(from);
    }),
    deleteAsync: jest.fn(async (path: string) => { files.delete(path); }),
    __seedFile: (path: string, value = 'mock-image') => files.set(path, value),
    __hasFile: (path: string) => files.has(path),
    __filePaths: () => [...files.keys()],
    __reset: () => files.clear(),
  };
});

jest.mock('expo-secure-store', () => {
  const values = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => values.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => { values.set(key, value); }),
    deleteItemAsync: jest.fn(async (key: string) => { values.delete(key); }),
    __reset: () => values.clear(),
  };
});

import {
  clearResidentDistributionOfflineCache,
  listOfflineProofRecords,
  loadResidentDistributionOfflineCache,
  loadResidentOfflineCache,
  loadStoredProofDraft,
  persistProofPhoto,
  putOfflineProofRecord,
  quarantineLegacyOwnerlessQueue,
  removeOfflineProofRecord,
  saveStoredProofDraft,
  saveResidentOfflineCache,
  saveResidentDistributionOfflineCache,
  type OfflineProofRecord,
} from '../ResidentOfflineStore';

const fileSystem = jest.requireMock('expo-file-system/legacy') as {
  __seedFile: (path: string, value?: string) => void;
  __hasFile: (path: string) => boolean;
  __filePaths: () => string[];
  __reset: () => void;
};
const secureStore = jest.requireMock('expo-secure-store') as { __reset: () => void };

function record(ownerResidentId: string, clientGeneratedId: string, photoUri: string): OfflineProofRecord {
  return {
    schemaVersion: 1,
    ownerResidentId,
    clientGeneratedId,
    deviceId: 'device-1',
    disasterEventId: 'event-1',
    eventSnapshot: { name: 'Flood Event', disasterType: 'Flood', submissionDeadline: null },
    damageType: 'Flood',
    description: 'Floodwater damaged household belongings.',
    supportingInfo: '',
    dateSubmitted: new Date().toISOString(),
    photos: [{ uri: photoUri, mimeType: 'image/jpeg' }],
    queuedAt: new Date().toISOString(),
    attemptCount: 0,
    status: 'PENDING_SYNC',
  };
}

describe('resident-scoped durable proof storage', () => {
  beforeEach(() => {
    fileSystem.__reset();
    secureStore.__reset();
  });

  it('copies a temporary image into the resident document directory', async () => {
    fileSystem.__seedFile('file:///cache/evidence.jpg');
    const photo = await persistProofPhoto('resident-a', 'file:///cache/evidence.jpg');

    expect(photo.uri).toContain('resident-proof-offline/resident-a/photos/');
    expect(fileSystem.__hasFile(photo.uri)).toBe(true);
  });

  it('persists a resident-scoped virtual ID and remains compatible with caches without one', async () => {
    const baseCache = {
      residentId: 'resident-a',
      session: {
        token: 'token-a',
        residentId: 'resident-a',
        fullName: 'Resident A',
        mobileNumber: '09171234567',
        barangay: 'San Jose',
        status: 'Approved',
      },
      profile: {
        id: 'resident-a',
        residentCode: 'RES-A',
        firstName: 'Resident',
        lastName: 'A',
        fullName: 'Resident A',
        mobileNumber: '09171234567',
        barangay: 'San Jose',
        city: 'Test City',
        streetAddress: 'Main Street',
        householdSize: 1,
        status: 'Approved',
      },
      activeEvent: null,
      activeEventFetchedAt: null,
      proofStatus: null,
      lastOnlineValidatedAt: '2026-08-11T00:00:00.000Z',
    };

    await saveResidentOfflineCache(baseCache);
    expect((await loadResidentOfflineCache())?.virtualId).toBeUndefined();

    await saveResidentOfflineCache({
      ...baseCache,
      virtualIdFetchedAt: '2026-08-11T00:00:00.000Z',
      virtualId: {
        residentId: 'resident-a',
        residentCode: 'RES-A',
        qrData: 'signed-qr-token',
        qrVersion: 1,
        issuedAt: '2026-08-01T00:00:00.000Z',
        resident: {
          fullName: 'Resident A',
          barangay: 'San Jose',
          city: 'Test City',
          streetAddress: 'Main Street',
          status: 'Approved',
          createdAt: '2026-08-01T00:00:00.000Z',
        },
      },
    });

    const restored = await loadResidentOfflineCache();
    expect(restored?.residentId).toBe('resident-a');
    expect(restored?.virtualId?.qrData).toBe('signed-qr-token');
  });

  it('stores distribution fallback data in a resident-scoped file', async () => {
    const fetchedAt = '2026-08-23T01:00:00.000Z';
    await saveResidentDistributionOfflineCache('resident-a', [{
      id: 'distribution-a',
      barangay: 'Bolo',
      scheduled: '2026-08-24T01:00:00.000Z',
      endsAt: '2026-08-24T10:00:00.000Z',
      lifecycleStatus: 'Upcoming',
    }], fetchedAt);

    const restored = await loadResidentDistributionOfflineCache('resident-a');
    expect(restored?.residentId).toBe('resident-a');
    expect(restored?.items[0]?.id).toBe('distribution-a');
    expect(restored?.fetchedAt).toBe(fetchedAt);

    await clearResidentDistributionOfflineCache('resident-a');
    expect(await loadResidentDistributionOfflineCache('resident-a')).toBeNull();
  });

  it('restores drafts and isolates queues by resident owner', async () => {
    await saveStoredProofDraft('resident-a', {
      damageType: 'Flood',
      description: 'Saved while offline',
      supportingInfo: '',
      showSupportingInfo: false,
      selectedDistributionId: null,
      photoUris: ['file:///documents/resident-proof-offline/resident-a/photos/a.jpg'],
    });
    await putOfflineProofRecord(record('resident-a', 'proof-a', 'file:///documents/a.jpg'));
    await putOfflineProofRecord(record('resident-b', 'proof-b', 'file:///documents/b.jpg'));

    expect((await loadStoredProofDraft('resident-a'))?.description).toBe('Saved while offline');
    expect((await listOfflineProofRecords('resident-a')).map((item) => item.clientGeneratedId)).toEqual(['proof-a']);
    expect((await listOfflineProofRecords('resident-b')).map((item) => item.clientGeneratedId)).toEqual(['proof-b']);
  });

  it('keeps photos while editing and deletes them only on confirmed cleanup or discard', async () => {
    const photoUri = 'file:///documents/resident-proof-offline/resident-a/photos/proof.jpg';
    fileSystem.__seedFile(photoUri);
    await putOfflineProofRecord(record('resident-a', 'proof-a', photoUri));

    await removeOfflineProofRecord('resident-a', 'proof-a', false);
    expect(fileSystem.__hasFile(photoUri)).toBe(true);

    await putOfflineProofRecord(record('resident-a', 'proof-a', photoUri));
    await removeOfflineProofRecord('resident-a', 'proof-a', true);
    expect(fileSystem.__hasFile(photoUri)).toBe(false);
  });

  it('quarantines the legacy ownerless queue instead of assigning it to a resident', async () => {
    fileSystem.__seedFile('file:///documents/resident-proof-sync-queue.json', '[{"clientGeneratedId":"legacy"}]');
    await quarantineLegacyOwnerlessQueue();

    expect(fileSystem.__hasFile('file:///documents/resident-proof-sync-queue.json')).toBe(false);
    expect(fileSystem.__filePaths().some((path) => path.includes('legacy-unowned-queue-'))).toBe(true);
    expect(await listOfflineProofRecords('resident-a')).toEqual([]);
  });
});
