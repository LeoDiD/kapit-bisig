import { resolveApiBaseUrl } from '../config/apiSecurity';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

const API_BASE_URL = resolveApiBaseUrl(
  process.env.EXPO_PUBLIC_API_URL,
  'http://10.45.3.83:3001/api',
  'ResidentQrService',
);

const STORAGE_KEYS = {
  RESIDENT_TOKEN: 'kapitbisigresidenttoken',
  RESIDENT_SESSION: 'kapitbisigresidentsession',
} as const;
const PROOF_QUEUE_FILE = `${FileSystem.documentDirectory || ''}resident-proof-sync-queue.json`;

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
    barangay: string;
    city: string;
    streetAddress: string;
    status: string;
    qrStatus?: string;
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
  notes?: string;
  status?: string;
  createdAt?: string;
  residentClaimed?: boolean;
  residentClaimStatus?: string | null;
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
    [key: string]: unknown;
  };
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

export interface ResidentProofSubmissionPayload {
  disasterEventId: string;
  damageType: 'Flood' | 'House Damage' | 'Storm Surge' | 'Landslide' | 'Livelihood Loss' | 'Other';
  description: string;
  supportingInfo?: string;
  dateSubmitted: string;
  photoProofs: string[];
  clientGeneratedId: string;
  deviceId?: string;
}

export interface ResidentQueuedProofSubmission extends ResidentProofSubmissionPayload {
  queuedAt: string;
  syncStatus: 'Pending Sync' | 'Failed';
  lastError?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  errorCode?: string;
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

export async function fetchResidentQr(token: string): Promise<{ success: boolean; message?: string; data?: ResidentQrData }> {
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
        };
      }
      return {
        success: false,
        message: payload.message || 'Failed to load QR data.',
      };
    }

    return {
      success: true,
      data: payload.data,
    };
  } catch {
    return {
      success: false,
      message: 'Network error while fetching QR.',
    };
  }
}

export async function fetchResidentProfile(
  token: string
): Promise<{ success: boolean; message?: string; data?: ResidentProfile }> {
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

    return {
      success: true,
      data: payload.data,
    };
  } catch {
    return {
      success: false,
      message: 'Network error while fetching distributions.',
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
): Promise<{ success: boolean; message?: string; data?: ResidentDisasterEvent | null }> {
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
    };
  }
}

export async function submitResidentProofSubmission(
  token: string,
  payload: ResidentProofSubmissionPayload
): Promise<{ success: boolean; message?: string; queued?: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/beneficiaries/proof-submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const parsed = await parseApiResponse<unknown>(response);
    if (!response.ok || !parsed.success) {
      return {
        success: false,
        message: parsed.message || 'Failed to submit disaster proof.',
      };
    }

    return {
      success: true,
      queued: false,
      message: parsed.message || 'Disaster proof submitted successfully.',
    };
  } catch {
    const queue = await readProofQueue();
    queue.push({
      ...payload,
      deviceId: payload.deviceId || buildProofDeviceId(),
      queuedAt: new Date().toISOString(),
      syncStatus: 'Pending Sync',
    });
    await writeProofQueue(queue);

    return {
      success: true,
      queued: true,
      message: 'No internet connection. The request was saved and will sync automatically.',
    };
  }
}

export async function getQueuedResidentProofSubmissions(): Promise<ResidentQueuedProofSubmission[]> {
  return readProofQueue();
}

export async function syncQueuedResidentProofSubmissions(
  token: string
): Promise<{ success: boolean; syncedCount: number; failedCount: number; message?: string }> {
  const queue = await readProofQueue();
  if (queue.length === 0) {
    return { success: true, syncedCount: 0, failedCount: 0 };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/beneficiaries/sync/proof-submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId: queue[0]?.deviceId || buildProofDeviceId(),
        submissions: queue.map(({ queuedAt, syncStatus, lastError, ...item }) => item),
      }),
    });

    const parsed = await parseApiResponse<{
      synced?: Array<{ clientGeneratedId: string; syncStatus: 'Synced' | 'Failed'; error?: string }>;
    }>(response);

    if (!response.ok || !parsed.success) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: queue.length,
        message: parsed.message || 'Failed to sync queued proof submissions.',
      };
    }

    const resultMap = new Map(
      (parsed.data?.synced || []).map((item) => [item.clientGeneratedId, item]),
    );

    const remainingQueue = queue
      .map((item) => {
        const result = resultMap.get(item.clientGeneratedId);
        if (result?.syncStatus === 'Synced') {
          return null;
        }
        return {
          ...item,
          syncStatus: 'Failed' as const,
          lastError: result?.error || item.lastError || 'Sync failed.',
        };
      })
      .filter(Boolean) as ResidentQueuedProofSubmission[];

    await writeProofQueue(remainingQueue);

    return {
      success: true,
      syncedCount: queue.length - remainingQueue.length,
      failedCount: remainingQueue.length,
      message: remainingQueue.length > 0
        ? 'Some queued proof requests still need internet to sync.'
        : 'Queued proof requests synced successfully.',
    };
  } catch {
    return {
      success: false,
      syncedCount: 0,
      failedCount: queue.length,
      message: 'Still offline. Saved proof requests will sync once the connection returns.',
    };
  }
}

async function readProofQueue(): Promise<ResidentQueuedProofSubmission[]> {
  try {
    const file = await FileSystem.readAsStringAsync(PROOF_QUEUE_FILE, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const parsed = JSON.parse(file);
    return Array.isArray(parsed) ? (parsed as ResidentQueuedProofSubmission[]) : [];
  } catch {
    return [];
  }
}

async function writeProofQueue(queue: ResidentQueuedProofSubmission[]): Promise<void> {
  await FileSystem.writeAsStringAsync(PROOF_QUEUE_FILE, JSON.stringify(queue), {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

function buildProofDeviceId(): string {
  return `resident-proof-device-${Date.now()}`;
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



