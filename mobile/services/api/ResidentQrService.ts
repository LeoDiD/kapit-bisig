import { resolveApiBaseUrl } from '../config/apiSecurity';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = resolveApiBaseUrl(
  process.env.EXPO_PUBLIC_API_URL,
  'http://192.168.1.72:3001/api',
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

interface ApiResponse<T> {
  success: boolean;
  message?: string;
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



