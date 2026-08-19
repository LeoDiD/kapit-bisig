import { resolveApiBaseUrl } from '../config/apiSecurity';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import {
  getStableProofDeviceId,
  listOfflineProofRecords,
  persistProofPhoto,
  putOfflineProofRecord,
  removeOfflineProofRecord,
  updateOfflineProofRecord,
  type OfflineProofRecord,
} from '../sync/ResidentOfflineStore';

const API_BASE_URL = resolveApiBaseUrl(
  process.env.EXPO_PUBLIC_API_URL,
  'http://192.168.1.4:3001/api',
  'ResidentQrService',
);

const STORAGE_KEYS = {
  RESIDENT_TOKEN: 'kapitbisigresidenttoken',
  RESIDENT_SESSION: 'kapitbisigresidentsession',
} as const;

export interface ResidentSession {
  token: string;
  residentId: string;
  residentCode?: string;
  fullName: string;
  mobileNumber: string;
  barangay: string;
  status: string;
}

export interface ResidentQrData {
  residentId: string;
  residentCode: string;
  qrData: string;
  qrVersion: number;
  issuedAt: string;
  resident: {
    fullName: string;
    avatarUrl?: string | null;
    barangay: string;
    city: string;
    streetAddress: string;
    status: string;
    qrStatus?: string;
    verificationStatus?: string;
    createdAt: string;
  };
}

export interface ResidentProfile {
  id: string;
  residentCode: string;
  avatarUrl?: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  barangay: string;
  city: string;
  streetAddress: string;
  householdSize: number;
  status: string;
  rejectionReason?: string;
}

export interface ResidentProfileUpdatePayload {
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  email?: string;
  streetAddress?: string;
  city?: string;
}

export interface ResidentDistributionItem {
  id: string;
  barangay: string;
  assignedBarangays?: string[];
  scheduled?: string;
  endsAt?: string;
  notes?: string;
  status?: string;
  createdAt?: string;
  residentClaimed?: boolean;
  residentClaimStatus?: string | null;
  lifecycleStatus?: 'Upcoming' | 'Active' | 'Completed' | 'Archived';
}

export interface ResidentNotificationItem {
  _id?: string;
  id?: string;
  title: string;
  message: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
  meta?: {
    distributionId?: string;
    screen?: string;
    [key: string]: unknown;
  };
}

export interface ResidentRegistrationRevisionPayload {
  idType: string;
  idNumber: string;
  frontIdImage: string;
  backIdImage: string;
  faceImage: string;
}

export interface ResidentDisasterEvent {
  id?: string;
  _id?: string;
  name: string;
  disasterType: string;
  description?: string;
  barangays: string[];
  eventDate: string;
  submissionDeadline?: string | null;
  status: 'Draft' | 'Active' | 'Closed';
}

export interface ResidentBeneficiaryDistribution {
  id: string;
  barangay: string;
  assignedBarangays?: string[];
  targetBarangays: string[];
  scheduled?: string;
  notes?: string;
  applicationRequired: boolean;
  applicationStatus: 'Not Submitted' | 'Pending Verification' | 'Approved' | 'Rejected';
  rejectionReason?: string | null;
  submissionVersion: number;
  lastSubmissionAt?: string | null;
}

type ResidentProofSubmissionScope =
  | { distributionId: string; disasterEventId?: never }
  | { disasterEventId: string; distributionId?: never };

export type ResidentProofSubmissionPayload = ResidentProofSubmissionScope & {
  damageType: 'Flood' | 'House Damage' | 'Storm Surge' | 'Landslide' | 'Livelihood Loss' | 'Other';
  description: string;
  supportingInfo?: string;
  dateSubmitted: string;
  photoProofs: string[];
  clientGeneratedId: string;
  deviceId?: string;
};

export type ResidentQueuedProofSubmission = ResidentProofSubmissionPayload & {
  queuedAt: string;
  syncStatus: 'Pending Sync' | 'Failed';
  lastError?: string;
};

export interface ResidentOfflineProofSubmissionInput {
  disasterEventId: string;
  eventSnapshot: {
    name: string;
    disasterType: string;
    submissionDeadline?: string | null;
  };
  damageType: ResidentProofSubmissionPayload['damageType'];
  description: string;
  supportingInfo?: string;
  dateSubmitted: string;
  photoUris: string[];
  clientGeneratedId: string;
}

export type ApiFailureKind = 'AUTH' | 'NETWORK' | 'RATE_LIMIT' | 'SERVER' | 'VALIDATION';

export interface ResidentProofSubmissionStatus {
  id: string;
  status: 'Pending Sync' | 'Pending Verification' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  damageType: string;
  photoCount: number;
  dateSubmitted: string;
  reviewedAt?: string | null;
  submissionVersion: number;
  automaticallyEnrolled: boolean;
  event?: {
    id: string;
    name: string;
    disasterType: string;
    status: string;
  } | null;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  errorCode?: string;
  retryAfter?: string | number;
  data?: T;
}

function getAssetBaseUrl(): string {
  return API_BASE_URL.replace(/\/api\/?$/, '');
}

function toAbsoluteAssetUrl(value?: string | null): string | null {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${getAssetBaseUrl()}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

function normalizeMobileNumber(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';

  let sanitized = '';
  if (trimmed.startsWith('+')) {
    sanitized = `+${trimmed.slice(1).replace(/\D/g, '')}`;
  } else {
    sanitized = trimmed.replace(/\D/g, '');
  }

  if (sanitized.startsWith('+63')) return `0${sanitized.slice(3)}`;
  if (sanitized.startsWith('63')) return `0${sanitized.slice(2)}`;
  if (/^9\d{9}$/.test(sanitized)) return `0${sanitized}`;
  return sanitized;
}

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      message: 'Unable to parse server response.',
    };
  }
}

export async function residentLogin(
  mobileNumber: string,
  password: string
): Promise<{ success: boolean; message?: string; data?: ResidentSession }> {
  try {
    const normalizedMobile = normalizeMobileNumber(mobileNumber);
    const response = await fetch(`${API_BASE_URL}/household/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber: normalizedMobile, password }),
    });

    const payload = await parseApiResponse<{
      user: {
        id: string;
        residentCode?: string;
        fullName: string;
        mobileNumber: string;
        barangay: string;
        status: string;
      };
      token: string;
    }>(response);

    if (!response.ok || !payload.success || !payload.data) {
      return {
        success: false,
        message: payload.message || 'Login failed.',
      };
    }

    return {
      success: true,
      data: {
        token: payload.data.token,
        residentId: payload.data.user.id,
        residentCode: payload.data.user.residentCode,
        fullName: payload.data.user.fullName,
        mobileNumber: payload.data.user.mobileNumber,
        barangay: payload.data.user.barangay,
        status: payload.data.user.status,
      },
    };
  } catch {
    return {
      success: false,
      message: 'Network error. Please check connection.',
    };
  }
}

export async function saveResidentSession(session: ResidentSession): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.RESIDENT_TOKEN, session.token),
    SecureStore.setItemAsync(STORAGE_KEYS.RESIDENT_SESSION, JSON.stringify(session)),
  ]);
}

export async function getResidentToken(): Promise<string | null> {
  return SecureStore.getItemAsync(STORAGE_KEYS.RESIDENT_TOKEN);
}

export async function getResidentSession(): Promise<ResidentSession | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEYS.RESIDENT_SESSION);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ResidentSession;
  } catch {
    return null;
  }
}

export async function clearResidentSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.RESIDENT_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.RESIDENT_SESSION),
  ]);
}

export async function fetchResidentQr(token: string): Promise<{
  success: boolean;
  message?: string;
  data?: ResidentQrData;
  status?: number;
  code?: string;
  failureKind?: ApiFailureKind;
  retryAfter?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/household/qr/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await parseApiResponse<ResidentQrData>(response);

    if (!response.ok || !payload.success || !payload.data) {
      const responseCode = payload.code || payload.errorCode;
      if (responseCode === 'PENDING_APPROVAL' || responseCode === 'REGISTRATION_NOT_APPROVED') {
        return {
          success: false,
          message: 'Your registration is pending approval. QR generation is disabled until approved.',
          status: response.status,
          code: responseCode,
          failureKind: 'VALIDATION',
        };
      }
      return {
        success: false,
        message: payload.message || 'Failed to load QR data.',
        status: response.status,
        code: responseCode,
        failureKind: response.status === 401
          ? 'AUTH'
          : response.status === 429
            ? 'RATE_LIMIT'
            : response.status >= 500
              ? 'SERVER'
              : 'VALIDATION',
        retryAfter: String(payload.retryAfter || response.headers.get('Retry-After') || '') || undefined,
      };
    }

    return {
      success: true,
      data: {
        ...payload.data,
        resident: {
          ...payload.data.resident,
          avatarUrl: toAbsoluteAssetUrl(payload.data.resident.avatarUrl),
        },
      },
    };
  } catch {
    return {
      success: false,
      message: 'Network error while fetching QR.',
      failureKind: 'NETWORK',
    };
  }
}

export async function fetchResidentProfile(
  token: string
): Promise<{
  success: boolean;
  message?: string;
  data?: ResidentProfile;
  status?: number;
  code?: string;
  failureKind?: ApiFailureKind;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/household/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await parseApiResponse<ResidentProfile>(response);
    if (!response.ok || !payload.success || !payload.data) {
      return {
        success: false,
        message: payload.message || 'Failed to fetch resident profile.',
        status: response.status,
        code: payload.code || payload.errorCode,
        failureKind: response.status === 401
          ? 'AUTH'
          : response.status >= 500
            ? 'SERVER'
            : 'VALIDATION',
      };
    }

    return {
      success: true,
      data: {
        ...payload.data,
        avatarUrl: toAbsoluteAssetUrl(payload.data.avatarUrl),
      },
    };
  } catch {
    return {
      success: false,
      message: 'Network error while fetching profile.',
      failureKind: 'NETWORK',
    };
  }
}

export async function updateResidentProfile(
  token: string,
  payload: ResidentProfileUpdatePayload
): Promise<{ success: boolean; message?: string; data?: ResidentProfile }> {
  try {
    const response = await fetch(`${API_BASE_URL}/household/auth/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const parsed = await parseApiResponse<ResidentProfile>(response);
    if (!response.ok || !parsed.success || !parsed.data) {
      return {
        success: false,
        message: parsed.message || 'Failed to update profile.',
      };
    }

    const session = await getResidentSession();
    if (session) {
      await saveResidentSession({
        ...session,
        fullName: parsed.data.fullName,
        mobileNumber: parsed.data.mobileNumber,
        barangay: parsed.data.barangay,
        residentCode: parsed.data.residentCode,
        status: parsed.data.status,
      });
    }

    return {
      success: true,
      data: {
        ...parsed.data,
        avatarUrl: toAbsoluteAssetUrl(parsed.data.avatarUrl),
      },
    };
  } catch {
    return {
      success: false,
      message: 'Network error while updating profile.',
    };
  }
}

export async function uploadResidentAvatar(
  token: string,
  imageUri: string
): Promise<{ success: boolean; message?: string; avatarUrl?: string }> {
  try {
    const formData = new FormData();
    formData.append(
      'avatar',
      {
        uri: imageUri,
        name: 'resident-avatar.jpg',
        type: 'image/jpeg',
      } as any
    );

    const response = await fetch(`${API_BASE_URL}/household/auth/me/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const payload = await parseApiResponse<{ avatarUrl?: string }>(response);
    if (!response.ok || !payload.success || !payload.data?.avatarUrl) {
      return {
        success: false,
        message: payload.message || 'Failed to upload profile photo.',
      };
    }

    return {
      success: true,
      avatarUrl: toAbsoluteAssetUrl(payload.data.avatarUrl) || undefined,
    };
  } catch {
    return {
      success: false,
      message: 'Network error while uploading profile photo.',
    };
  }
}

export async function fetchResidentDistributions(
  token: string
): Promise<{ success: boolean; message?: string; data?: ResidentDistributionItem[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/household/distributions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await parseApiResponse<ResidentDistributionItem[]>(response);
    if (!response.ok || !payload.success || !payload.data) {
      return {
        success: false,
        message: payload.message || 'Failed to fetch distributions.',
      };
    }

    const now = Date.now();
    const visible = payload.data
      .filter((item) => {
        if (item.lifecycleStatus === 'Archived' || item.lifecycleStatus === 'Completed') return false;
        if (item.endsAt) {
          const end = new Date(item.endsAt).getTime();
          return !Number.isNaN(end) && end >= now;
        }
        if (!item.scheduled) return false;
        const start = new Date(item.scheduled);
        if (Number.isNaN(start.getTime())) return false;
        const legacyEnd = new Date(start);
        legacyEnd.setHours(20, 0, 0, 0);
        return legacyEnd.getTime() >= now;
      })
      .sort((left, right) => {
        const leftActive = left.lifecycleStatus === 'Active' ? 0 : 1;
        const rightActive = right.lifecycleStatus === 'Active' ? 0 : 1;
        if (leftActive !== rightActive) return leftActive - rightActive;
        return new Date(left.scheduled || 0).getTime() - new Date(right.scheduled || 0).getTime();
      });

    return {
      success: true,
      data: visible,
    };
  } catch {
    return {
      success: false,
      message: 'Network error while fetching distributions.',
    };
  }
}

export async function submitResidentRegistrationRevision(
  token: string,
  payload: ResidentRegistrationRevisionPayload,
): Promise<{ success: boolean; message?: string; data?: ResidentProfile }> {
  try {
    const response = await fetch(`${API_BASE_URL}/household/auth/me/revision-submit`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const parsed = await parseApiResponse<ResidentProfile>(response);
    if (!response.ok || !parsed.success || !parsed.data) {
      return {
        success: false,
        message: parsed.message || 'Failed to submit corrected registration files.',
      };
    }

    const session = await getResidentSession();
    if (session) {
      await saveResidentSession({
        ...session,
        fullName: parsed.data.fullName,
        mobileNumber: parsed.data.mobileNumber,
        barangay: parsed.data.barangay,
        residentCode: parsed.data.residentCode,
        status: parsed.data.status,
      });
    }

    return {
      success: true,
      message: parsed.message,
      data: {
        ...parsed.data,
        avatarUrl: toAbsoluteAssetUrl(parsed.data.avatarUrl),
      },
    };
  } catch {
    return {
      success: false,
      message: 'Network error while submitting corrected registration files.',
    };
  }
}

export async function fetchResidentNotifications(
  token: string
): Promise<{ success: boolean; message?: string; data?: { notifications: ResidentNotificationItem[]; unreadCount: number } }> {
  try {
    const response = await fetch(`${API_BASE_URL}/household/notifications?limit=30`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await parseApiResponse<{ notifications: ResidentNotificationItem[]; unreadCount: number }>(response);
    if (!response.ok || !payload.success || !payload.data) {
      return {
        success: false,
        message: payload.message || 'Failed to fetch notifications.',
      };
    }

    return {
      success: true,
      data: payload.data,
    };
  } catch {
    return {
      success: false,
      message: 'Network error while fetching notifications.',
    };
  }
}

export async function markResidentNotificationRead(
  token: string,
  notificationId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/household/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await parseApiResponse<unknown>(response);
    if (!response.ok || !payload.success) {
      return {
        success: false,
        message: payload.message || 'Failed to update notification.',
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      message: 'Network error while updating notification.',
    };
  }
}

export async function fetchActiveBeneficiaryEvent(
  token: string
): Promise<{
  success: boolean;
  message?: string;
  data?: ResidentDisasterEvent | null;
  status?: number;
  code?: string;
  failureKind?: ApiFailureKind;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/beneficiaries/events/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await parseApiResponse<ResidentDisasterEvent | null>(response);
    if (!response.ok || !payload.success) {
      return {
        success: false,
        message: payload.message || 'Failed to load the active disaster event.',
        status: response.status,
        code: payload.code || payload.errorCode,
        failureKind: response.status === 401
          ? 'AUTH'
          : response.status >= 500
            ? 'SERVER'
            : 'VALIDATION',
      };
    }

    return {
      success: true,
      data: payload.data ?? null,
    };
  } catch {
    return {
      success: false,
      message: 'Network error while loading the active disaster event.',
      failureKind: 'NETWORK',
    };
  }
}

export async function fetchResidentProofSubmissionStatus(
  token: string,
  disasterEventId: string,
): Promise<{
  success: boolean;
  message?: string;
  data?: ResidentProofSubmissionStatus | null;
  status?: number;
  code?: string;
  failureKind?: ApiFailureKind;
}> {
  try {
    const query = encodeURIComponent(disasterEventId);
    const response = await fetch(`${API_BASE_URL}/beneficiaries/proof-submissions/me?disasterEventId=${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = await parseApiResponse<ResidentProofSubmissionStatus | null>(response);
    if (!response.ok || !payload.success) {
      return {
        success: false,
        message: payload.message || 'Failed to load proof status.',
        status: response.status,
        code: payload.code || payload.errorCode,
        failureKind: response.status === 401
          ? 'AUTH'
          : response.status >= 500
            ? 'SERVER'
            : 'VALIDATION',
      };
    }
    return { success: true, data: payload.data ?? null };
  } catch {
    return { success: false, message: 'Network error while loading proof status.', failureKind: 'NETWORK' };
  }
}

export async function fetchOpenBeneficiaryDistributions(
  token: string
): Promise<{ success: boolean; message?: string; data?: ResidentBeneficiaryDistribution[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/beneficiaries/distributions/open`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await parseApiResponse<ResidentBeneficiaryDistribution[]>(response);
    if (!response.ok || !payload.success || !payload.data) {
      return {
        success: false,
        message: payload.message || 'Failed to load open beneficiary distributions.',
      };
    }

    return {
      success: true,
      data: payload.data,
    };
  } catch {
    return {
      success: false,
      message: 'Network error while loading open beneficiary distributions.',
    };
  }
}

async function proofPhotoToDataUrl(uri: string, mimeType: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return `data:${mimeType};base64,${base64}`;
}

export async function submitResidentProofSubmission(
  token: string,
  residentId: string,
  input: ResidentOfflineProofSubmissionInput,
): Promise<{ success: boolean; message?: string; queued: boolean; needsAttention?: boolean }> {
  const deviceId = await getStableProofDeviceId();
  const photos = await Promise.all(input.photoUris.map((uri) => persistProofPhoto(residentId, uri)));
  const record: OfflineProofRecord = {
    schemaVersion: 1,
    ownerResidentId: residentId,
    clientGeneratedId: input.clientGeneratedId,
    deviceId,
    disasterEventId: input.disasterEventId,
    eventSnapshot: input.eventSnapshot,
    damageType: input.damageType,
    description: input.description,
    supportingInfo: input.supportingInfo,
    dateSubmitted: input.dateSubmitted,
    photos,
    queuedAt: new Date().toISOString(),
    attemptCount: 0,
    status: 'PENDING_SYNC',
  };

  // Durable first: a process interruption or lost server response cannot lose the proof.
  await putOfflineProofRecord(record);
  const result = await syncQueuedResidentProofSubmissions(token, residentId);
  const remaining = await listOfflineProofRecords(residentId);
  const saved = remaining.find((item) => item.clientGeneratedId === input.clientGeneratedId);

  if (!saved) {
    return { success: true, queued: false, message: 'Disaster proof submitted successfully.' };
  }

  return {
    success: true,
    queued: true,
    needsAttention: saved.status === 'NEEDS_ATTENTION',
    message: saved.status === 'NEEDS_ATTENTION'
      ? saved.lastError || 'The proof was saved, but it needs your attention before it can sync.'
      : result.authRequired
        ? 'Your proof is safe on this device. Sign in again to sync it.'
        : 'The proof was saved on this device and will sync when a connection is available.',
  };
}

export async function getQueuedResidentProofSubmissions(residentId: string): Promise<OfflineProofRecord[]> {
  return listOfflineProofRecords(residentId);
}

export async function discardQueuedResidentProofSubmission(
  residentId: string,
  clientGeneratedId: string,
): Promise<void> {
  await removeOfflineProofRecord(residentId, clientGeneratedId, true);
}

export async function takeQueuedResidentProofSubmissionForEditing(
  residentId: string,
  clientGeneratedId: string,
): Promise<void> {
  await removeOfflineProofRecord(residentId, clientGeneratedId, false);
}

export async function retryQueuedResidentProofSubmission(
  residentId: string,
  clientGeneratedId: string,
): Promise<void> {
  await updateOfflineProofRecord(residentId, clientGeneratedId, {
    status: 'PENDING_SYNC',
    lastError: undefined,
    errorCode: undefined,
  });
}

export async function syncQueuedResidentProofSubmissions(
  token: string,
  residentId: string,
): Promise<{
  success: boolean;
  syncedCount: number;
  failedCount: number;
  authRequired?: boolean;
  message?: string;
}> {
  const queue = await listOfflineProofRecords(residentId);
  if (queue.length === 0) return { success: true, syncedCount: 0, failedCount: 0 };

  let syncedCount = 0;
  let failedCount = 0;
  let authRequired = false;

  for (const item of queue) {
    if (item.ownerResidentId !== residentId || item.status === 'NEEDS_ATTENTION') continue;

    const attemptAt = new Date().toISOString();
    await updateOfflineProofRecord(residentId, item.clientGeneratedId, {
      status: 'SYNCING',
      lastAttemptAt: attemptAt,
      attemptCount: item.attemptCount + 1,
    });

    try {
      const photoProofs = await Promise.all(
        item.photos.map((photo) => proofPhotoToDataUrl(photo.uri, photo.mimeType)),
      );
      const response = await fetch(`${API_BASE_URL}/beneficiaries/sync/proof-submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deviceId: item.deviceId,
          submissions: [{
            clientGeneratedId: item.clientGeneratedId,
            disasterEventId: item.disasterEventId,
            damageType: item.damageType,
            description: item.description,
            supportingInfo: item.supportingInfo,
            dateSubmitted: item.dateSubmitted,
            photoProofs,
          }],
        }),
      });
      const parsed = await parseApiResponse<{
        synced?: Array<{
          clientGeneratedId: string;
          syncStatus: 'Synced' | 'Failed';
          error?: string;
          errorCode?: string;
          retryable?: boolean;
        }>;
      }>(response);

      if (response.status === 401) {
        authRequired = true;
        failedCount++;
        await updateOfflineProofRecord(residentId, item.clientGeneratedId, {
          status: 'PENDING_SYNC',
          lastError: parsed.message || 'Sign in again to sync this proof.',
          errorCode: parsed.code || 'AUTH_REQUIRED',
        });
        continue;
      }

      const syncResult = parsed.data?.synced?.[0];
      if (response.ok && parsed.success && syncResult?.syncStatus === 'Synced') {
        await removeOfflineProofRecord(residentId, item.clientGeneratedId, true);
        syncedCount++;
        continue;
      }

      const retryableHttp = response.status === 408 || response.status === 429 || response.status >= 500;
      const retryable = syncResult?.retryable ?? retryableHttp;
      failedCount++;
      await updateOfflineProofRecord(residentId, item.clientGeneratedId, {
        status: retryable ? 'PENDING_SYNC' : 'NEEDS_ATTENTION',
        lastError: syncResult?.error || parsed.message || 'Unable to sync this proof.',
        errorCode: syncResult?.errorCode || parsed.code || `HTTP_${response.status}`,
      });
    } catch (error) {
      failedCount++;
      await updateOfflineProofRecord(residentId, item.clientGeneratedId, {
        status: 'PENDING_SYNC',
        lastError: error instanceof Error ? error.message : 'Network connection failed.',
        errorCode: 'NETWORK_ERROR',
      });
    }
  }

  return {
    success: !authRequired,
    syncedCount,
    failedCount,
    authRequired,
    message: syncedCount > 0
      ? `${syncedCount} saved proof request${syncedCount === 1 ? '' : 's'} synced.`
      : failedCount > 0
        ? 'Saved proof requests remain safely on this device.'
        : undefined,
  };
}

export async function residentForgotPasswordSendOtp(
  email: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const response = await fetch(`${API_BASE_URL}/household/auth/forgot-password/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    const payload = await parseApiResponse<never>(response);
    if (!response.ok || !payload.success) {
      return {
        success: false,
        message: payload.message || 'Failed to send verification code.',
      };
    }

    return {
      success: true,
      message: payload.message || 'If the email exists, an OTP was sent.',
    };
  } catch {
    return {
      success: false,
      message: 'Network error while sending verification code.',
    };
  }
}

export async function residentForgotPasswordVerifyOtp(
  email: string,
  otp: string
): Promise<{ success: boolean; message?: string; resetToken?: string }> {
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const response = await fetch(`${API_BASE_URL}/household/auth/forgot-password/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, otp }),
    });

    const payload = await parseApiResponse<never>(response);
    const resetToken = (payload as unknown as { resetToken?: string }).resetToken;
    if (!response.ok || !payload.success || !resetToken) {
      return {
        success: false,
        message: payload.message || 'Invalid or expired code.',
      };
    }

    return {
      success: true,
      resetToken,
    };
  } catch {
    return {
      success: false,
      message: 'Network error while verifying code.',
    };
  }
}

export async function residentForgotPasswordReset(
  resetToken: string,
  newPassword: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/household/auth/forgot-password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword }),
    });

    const payload = await parseApiResponse<never>(response);
    if (!response.ok || !payload.success) {
      return {
        success: false,
        message: payload.message || 'Failed to reset password.',
      };
    }

    return {
      success: true,
      message: payload.message || 'Password has been reset successfully.',
    };
  } catch {
    return {
      success: false,
      message: 'Network error while resetting password.',
    };
  }
}
