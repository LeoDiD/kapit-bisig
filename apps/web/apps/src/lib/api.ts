/**
 * API Service for Kapit-Bisig Web Application
 * 
 * Centralized API client with authentication support and type safety.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || '/api';

// ========================== TYPES ==========================

/** Barangay options (must match server) */
export const BARANGAY_OPTIONS = [
  'Bolo', 'Bongalon', 'Dulig', 'Laois', 'Magsaysay',
  'Poblacion', 'San Gonzalo', 'San Jose', 'Tobuan', 'Uyong',
] as const;
export type Barangay = typeof BARANGAY_OPTIONS[number];

/**
 * Return the barangay list scoped to the user's assigned barangays.
 * SUPERADMIN (or when assignedBarangays is empty/undefined) sees all.
 */
export function getScopedBarangays(
  role?: string,
  assignedBarangays?: string[],
): string[] {
  if (role === 'SUPERADMIN' || !assignedBarangays || assignedBarangays.length === 0) {
    return [...BARANGAY_OPTIONS];
  }
  // Preserve canonical order from BARANGAY_OPTIONS
  return BARANGAY_OPTIONS.filter((b) => assignedBarangays.includes(b));
}

/**
 * Staff user from admin API
 */
export interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  fullName?: string;
  role: 'LGU_STAFF';
  isActive: boolean;
  forcePasswordReset?: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create staff user data
 */
export interface CreateStaffData {
  firstName: string;
  lastName: string;
  email: string;
  assignedBarangays?: string[];
}

/**
 * Update staff user data
 */
export interface UpdateStaffData {
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

/**
 * Staff user stats
 */
export interface StaffStats {
  total: number;
  active: number;
  inactive: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

/**
 * Paginated API response wrapper
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  total?: number;
  pagination?: {
    page: number;
    limit: number;
    totalDocs: number;
    totalPages: number;
  };
}

/**
 * Distribution data from API
 */
export interface DistributionData {
  id: string;
  _id: string;
  barangay: string;
  assignedBarangays?: string[];
  assignedStaffIds?: string[];
  scheduled: string;
  households: number;
  notes?: string;
  status: 'Unclaimed' | 'Claimed';
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
  registeredHouseholds?: number;
  claimedHouseholds?: number;
}

/**
 * Claimed household entry
 */
export interface ClaimedHousehold {
  householdId: string;
  householdName: string;
  address: string;
  claimedAt: string | null;
  claimedBy: { id: string; name: string } | null;
  proofMethod: 'QR' | 'FACE' | null;
}

/**
 * Not-yet-claimed household entry
 */
export interface UnclaimedHousehold {
  householdId: string;
  householdName: string;
  address: string;
}

/**
 * Distribution households response
 */
export interface DistributionHouseholdsData {
  distributionId: string;
  barangay: string;
  assignedBarangays?: string[];
  totals: {
    registered: number;
    claimed: number;
    notYetClaimed: number;
  };
  claimed: ClaimedHousehold[];
  notYetClaimed: UnclaimedHousehold[];
}

export interface ScanEligibleUser {
  id: string;
  fullName: string;
  role: 'VOLUNTEER' | 'LGU_STAFF' | 'SUPERADMIN';
  scopesSummary: string[];
  coveredBarangays?: string[];
  inScope: boolean;
}

export interface ScanEligibleResponse {
  items: ScanEligibleUser[];
  nextCursor: number | null;
}

/**
 * Report distribution row
 */
export interface ReportDistributionRow {
  id: string;
  scheduled: string;
  barangay: string;
  assignedBarangays: string[];
  households: number;
  registeredHouseholds: number;
  claimedHouseholds: number;
  unclaimedHouseholds: number;
  claimRate: number;
  status: string;
  createdAt: string;
}

/**
 * Report summary response data
 */
export interface ReportSummaryData {
  overview: {
    totalDistributions: number;
    totalRegisteredHouseholds: number;
    totalClaimedHouseholds: number;
    totalUnclaimedHouseholds: number;
    claimRate: number;
  };
  distributions: ReportDistributionRow[];
  monthlyTrends: { month: string; distributions: number; claimed: number }[];
  barangayBreakdown: {
    barangay: string;
    distributions: number;
    registeredHouseholds: number;
    claimedHouseholds: number;
  }[];
  verificationMethods: {
    qr: number;
    face: number;
    unknown: number;
  };
}

export interface ResidentRecord {
  id?: string;
  _id?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  mobileNumber: string;
  barangay: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  createdAt?: string;
  verification?: {
    overallConfidence?: number;
    aiVerificationStatus?: 'High Match' | 'Medium Match' | 'Low Match';
    isVerified?: boolean;
  };
}

export interface DisasterEventRecord {
  id?: string;
  _id?: string;
  name: string;
  disasterType: 'Typhoon' | 'Flood' | 'Storm Surge' | 'Landslide' | 'Earthquake' | 'Fire' | 'Other';
  description?: string;
  barangays: string[];
  eventDate: string;
  submissionDeadline?: string | null;
  status: 'Draft' | 'Active' | 'Closed';
  createdAt?: string;
  updatedAt?: string;
}

export interface BeneficiaryProofSubmissionRecord {
  id?: string;
  _id?: string;
  damageType: 'Flood' | 'House Damage' | 'Storm Surge' | 'Landslide' | 'Livelihood Loss' | 'Other';
  description: string;
  supportingInfo?: string;
  dateSubmitted: string;
  photoProofUrl: string;
  photoProofUrls?: string[];
  status: 'Pending Verification' | 'Approved' | 'Rejected';
  submissionVersion: number;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  resident: {
    _id: string;
    residentCode: string;
    fullName: string;
    barangay: string;
    status: 'Pending' | 'Approved' | 'Rejected';
  };
  event: {
    _id: string;
    name: string;
    disasterType: string;
    status: 'Draft' | 'Active' | 'Closed';
  };
}

export interface BeneficiaryProofQueueSummary {
  total: number;
  pendingVerification: number;
  approved: number;
  rejected: number;
}

export interface BeneficiaryProofSubmissionListResponse extends PaginatedApiResponse<BeneficiaryProofSubmissionRecord[]> {
  summary?: BeneficiaryProofQueueSummary;
}

// ========================== HELPERS ==========================

/**
 * Read a cookie value by name (browser-side).
 */
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : undefined
}

/**
 * Create headers (cookie-based auth – no bearer token needed).
 * Automatically attaches X-CSRF-Token for state-changing requests.
 */
const createHeaders = (method: string = 'GET'): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Attach CSRF token for state-changing methods
  const upper = method.toUpperCase()
  if (upper !== 'GET' && upper !== 'HEAD' && upper !== 'OPTIONS') {
    const csrfToken = getCookie('XSRF-TOKEN')
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken
    }
  }

  return headers
};

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const rawText = await response.text();

  let data: any = null;
  if (isJson && rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const fallbackMessage =
      rawText && !isJson
        ? rawText.slice(0, 180)
        : `Request failed with status ${response.status}`;
    const error = new Error(data?.message || fallbackMessage || 'An error occurred');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).response = data ?? { message: fallbackMessage };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).status = response.status;
    throw error;
  }

  return (data ?? ({} as T)) as T;
}

// ========================== API CLIENT ==========================

export const api = {
  // ==================== STAFF USER MANAGEMENT (SUPERADMIN) ====================

  /**
   * List staff users with optional filters
   */
  async getStaffUsers(params?: {
    search?: string;
    status?: 'active' | 'pending' | 'inactive';
    barangay?: string;
  }): Promise<ApiResponse<StaffUser[]>> {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.status) sp.append('status', params.status);
    if (params?.barangay && params.barangay !== 'All Barangays')
      sp.append('barangay', params.barangay);
    
    const qs = sp.toString();
    const url = `${API_URL}/admin/users${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, {
      headers: createHeaders(),
      credentials: 'include',
    });
    return handleResponse<ApiResponse<StaffUser[]>>(response);
  },

  /**
   * Get staff user stats
   */
  async getStaffStats(): Promise<ApiResponse<StaffStats>> {
    const response = await fetch(`${API_URL}/admin/users/stats`, {
      headers: createHeaders(),
      credentials: 'include',
    });
    return handleResponse<ApiResponse<StaffStats>>(response);
  },

  /**
   * Create a new staff user
   */
  async createStaffUser(data: CreateStaffData): Promise<ApiResponse<StaffUser>> {
    const response = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: createHeaders('POST'),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<StaffUser>>(response);
  },

  /**
   * Update a staff user
   */
  async updateStaffUser(id: string, data: UpdateStaffData): Promise<ApiResponse<StaffUser>> {
    const response = await fetch(`${API_URL}/admin/users/${id}`, {
      method: 'PATCH',
      headers: createHeaders('PATCH'),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<StaffUser>>(response);
  },

  /**
   * Reset a staff user's password
   */
  async resetStaffPassword(id: string, newPassword: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/admin/users/${id}/reset-password`, {
      method: 'PATCH',
      headers: createHeaders('PATCH'),
      credentials: 'include',
      body: JSON.stringify({ newPassword }),
    });
    return handleResponse<ApiResponse<void>>(response);
  },

  // ==================== HEALTH ====================

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) throw new Error('Server is not responding');
    return response.json();
  },

  // ==================== DISTRIBUTIONS ====================

  /**
   * Get all distributions
   */
  async getDistributions(): Promise<ApiResponse<DistributionData[]>> {
    const response = await fetch(`${API_URL}/distributions`, {
      headers: createHeaders(),
      credentials: 'include',
    });
    return handleResponse<ApiResponse<DistributionData[]>>(response);
  },

  /**
   * Create a new distribution
   */
  async createDistribution(data: {
    barangay: string;
    assignedBarangays: string[];
    assignedStaffIds: string[];
    scheduled: string;
    notes?: string;
  }, options?: { idempotencyKey?: string }): Promise<ApiResponse<DistributionData>> {
    const headers = createHeaders('POST') as Record<string, string>;
    if (options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }
    const response = await fetch(`${API_URL}/distributions`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<DistributionData>>(response);
  },

  /**
   * Search eligible scanner staff for a distribution scope.
   */
  async getScanEligibleUsers(params: {
    hostBarangayId: string;
    assignedBarangayIds: string[];
    q?: string;
    cursor?: number;
    limit?: number;
  }): Promise<ApiResponse<ScanEligibleResponse>> {
    const sp = new URLSearchParams();
    sp.append('hostBarangayId', params.hostBarangayId);
    for (const barangay of params.assignedBarangayIds) {
      sp.append('assignedBarangayIds', barangay);
    }
    if (params.q) sp.append('q', params.q);
    if (typeof params.cursor === 'number') sp.append('cursor', String(params.cursor));
    if (typeof params.limit === 'number') sp.append('limit', String(params.limit));

    const response = await fetch(`${API_URL}/users/scan-eligible?${sp.toString()}`, {
      headers: createHeaders(),
      credentials: 'include',
    });
    return handleResponse<ApiResponse<ScanEligibleResponse>>(response);
  },

  /**
   * Mark a distribution as claimed
   */
  async claimDistribution(id: string): Promise<ApiResponse<DistributionData>> {
    const response = await fetch(`${API_URL}/distributions/${id}/claim`, {
      method: 'PATCH',
      headers: createHeaders('PATCH'),
      credentials: 'include',
    });
    return handleResponse<ApiResponse<DistributionData>>(response);
  },

  /**
   * Get households for a distribution (claimed / not-yet-claimed)
   */
  async getDistributionHouseholds(
    distributionId: string
  ): Promise<ApiResponse<DistributionHouseholdsData>> {
    const response = await fetch(
      `${API_URL}/distributions/${distributionId}/households`,
      {
        headers: createHeaders(),
        credentials: 'include',
      }
    );
    return handleResponse<ApiResponse<DistributionHouseholdsData>>(response);
  },

  // ==================== HOUSEHOLDS ====================

  /**
   * Get registered households list.
   * Supports search, barangay, status, and pagination filters.
   */
  async getHouseholds(params?: {
    search?: string;
    barangay?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedApiResponse<any[]>> {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.barangay && params.barangay !== 'All Barangays')
      sp.append('barangay', params.barangay);
    if (params?.status && params.status !== 'All Status')
      sp.append('status', params.status);
    if (typeof params?.page === 'number') sp.append('page', String(params.page));
    if (typeof params?.limit === 'number') sp.append('limit', String(params.limit));

    const qs = sp.toString();
    const url = `${API_URL}/households${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, {
      headers: createHeaders(),
      credentials: 'include',
    });
    return handleResponse<PaginatedApiResponse<any[]>>(response);
  },

  /**
   * Delete a staff user
   */
  async deleteStaffUser(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: createHeaders('DELETE'),
      credentials: 'include',
    });
    return handleResponse<ApiResponse<void>>(response);
  },

  // ==================== RESIDENT REGISTRATIONS ====================

  /**
   * Get resident registrations with optional filters.
   */
  async getResidents(params?: {
    search?: string;
    barangay?: string;
    status?: 'All' | 'Pending' | 'Approved' | 'Rejected';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ResidentRecord[]>> {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.barangay && params.barangay !== 'All Barangays') {
      sp.append('barangay', params.barangay);
    }
    if (params?.status && params.status !== 'All') {
      sp.append('status', params.status);
    }
    if (typeof params?.page === 'number') sp.append('page', String(params.page));
    if (typeof params?.limit === 'number') sp.append('limit', String(params.limit));

    const qs = sp.toString();
    const url = `${API_URL}/residents${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, {
      headers: createHeaders(),
      credentials: 'include',
    });
    return handleResponse<ApiResponse<ResidentRecord[]>>(response);
  },

  /**
   * Approve or reject a resident registration.
   */
  async updateResidentStatus(
    id: string,
    payload: { status: 'Approved' | 'Rejected'; rejectionReason?: string }
  ): Promise<ApiResponse<ResidentRecord>> {
    const response = await fetch(`${API_URL}/residents/${id}/status`, {
      method: 'PATCH',
      headers: createHeaders('PATCH'),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<ApiResponse<ResidentRecord>>(response);
  },

  /**
   * Get disaster events used for target beneficiary review.
   */
  async getBeneficiaryEvents(params?: {
    status?: 'Draft' | 'Active' | 'Closed';
    barangay?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedApiResponse<DisasterEventRecord[]>> {
    const sp = new URLSearchParams();
    if (params?.status) sp.append('status', params.status);
    if (params?.barangay && params.barangay !== 'All Barangays') sp.append('barangay', params.barangay);
    if (typeof params?.page === 'number') sp.append('page', String(params.page));
    if (typeof params?.limit === 'number') sp.append('limit', String(params.limit));

    const qs = sp.toString();
    const response = await fetch(`${API_URL}/beneficiaries/events${qs ? `?${qs}` : ''}`, {
      headers: createHeaders(),
      credentials: 'include',
    });
    return handleResponse<PaginatedApiResponse<DisasterEventRecord[]>>(response);
  },

  /**
   * Get current active disaster event for target beneficiary flow.
   */
  async getActiveBeneficiaryEvent(): Promise<ApiResponse<DisasterEventRecord | null>> {
    const response = await fetch(`${API_URL}/beneficiaries/events/active`, {
      headers: createHeaders(),
      credentials: 'include',
    });
    return handleResponse<ApiResponse<DisasterEventRecord | null>>(response);
  },

  /**
   * Create a new disaster event.
   */
  async createBeneficiaryEvent(data: {
    name: string;
    disasterType: DisasterEventRecord['disasterType'];
    description?: string;
    barangays: string[];
    eventDate: string;
    submissionDeadline?: string;
    status?: DisasterEventRecord['status'];
  }): Promise<ApiResponse<DisasterEventRecord>> {
    const response = await fetch(`${API_URL}/beneficiaries/events`, {
      method: 'POST',
      headers: createHeaders('POST'),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<DisasterEventRecord>>(response);
  },

  /**
   * Get proof submissions for target beneficiary verification.
   */
  async getBeneficiaryProofSubmissions(params?: {
    disasterEventId?: string;
    residentId?: string;
    status?: 'Pending Verification' | 'Approved' | 'Rejected';
    barangay?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<BeneficiaryProofSubmissionListResponse> {
    const sp = new URLSearchParams();
    if (params?.disasterEventId) sp.append('disasterEventId', params.disasterEventId);
    if (params?.residentId) sp.append('residentId', params.residentId);
    if (params?.status) sp.append('status', params.status);
    if (params?.barangay && params.barangay !== 'All Barangays') sp.append('barangay', params.barangay);
    if (params?.search) sp.append('search', params.search);
    if (typeof params?.page === 'number') sp.append('page', String(params.page));
    if (typeof params?.limit === 'number') sp.append('limit', String(params.limit));

    const qs = sp.toString();
    const response = await fetch(`${API_URL}/beneficiaries/admin/proof-submissions${qs ? `?${qs}` : ''}`, {
      headers: createHeaders(),
      credentials: 'include',
    });
    return handleResponse<BeneficiaryProofSubmissionListResponse>(response);
  },

  /**
   * Approve or reject a proof submission.
   */
  async reviewBeneficiaryProofSubmission(
    id: string,
    payload: { decision: 'Approved' | 'Rejected'; rejectionReason?: string },
  ): Promise<ApiResponse<{
    proofSubmission: BeneficiaryProofSubmissionRecord;
    eligibility: {
      id?: string;
      _id?: string;
      status: 'Eligible' | 'Not Eligible';
      registrationStatus: 'Pending' | 'Approved' | 'Rejected';
      proofStatus: 'Pending Sync' | 'Pending Verification' | 'Approved' | 'Rejected';
      rejectionReason?: string;
      reviewedAt?: string | null;
    };
  }>> {
    const response = await fetch(`${API_URL}/beneficiaries/admin/proof-submissions/${id}/review`, {
      method: 'PATCH',
      headers: createHeaders('PATCH'),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<ApiResponse<{
      proofSubmission: BeneficiaryProofSubmissionRecord;
      eligibility: {
        id?: string;
        _id?: string;
        status: 'Eligible' | 'Not Eligible';
        registrationStatus: 'Pending' | 'Approved' | 'Rejected';
        proofStatus: 'Pending Sync' | 'Pending Verification' | 'Approved' | 'Rejected';
        rejectionReason?: string;
        reviewedAt?: string | null;
      };
    }>>(response);
  },

  /**
   * Record a relief-pack claim (sends token + distribution info).
   */
  async recordClaim(data: {
    claimToken: string;
    distributionId: string;
    distributionSite: string;
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_URL}/claims/record-claim`, {
      method: 'POST',
      headers: createHeaders('POST'),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<any>>(response);
  },

  /**
   * Record multiple relief-pack claims in one request.
   */
  async recordClaimBatch(data: {
    claimTokens: string[];
    distributionId: string;
    distributionSite: string;
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_URL}/claims/record-claim-batch`, {
      method: 'POST',
      headers: createHeaders('POST'),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<any>>(response);
  },

  // ==================== REPORTS ====================

  /**
   * Get report summary with aggregated distribution data.
   */
  async getReportSummary(params?: {
    startDate?: string;
    endDate?: string;
    barangay?: string;
    reportType?: string;
  }): Promise<ApiResponse<ReportSummaryData>> {
    const sp = new URLSearchParams();
    if (params?.startDate) sp.append('startDate', params.startDate);
    if (params?.endDate) sp.append('endDate', params.endDate);
    if (params?.barangay && params.barangay !== 'All')
      sp.append('barangay', params.barangay);
    if (params?.reportType) sp.append('reportType', params.reportType);

    const qs = sp.toString();
    const url = `${API_URL}/reports/summary${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, {
      headers: createHeaders(),
      credentials: 'include',
    });
    return handleResponse<ApiResponse<ReportSummaryData>>(response);
  },
};

export default api;

// ==================== PROFILE / SETTINGS ====================

export const profileApi = {
  /** GET /api/users/me – current user profile */
  async getProfile(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: createHeaders(),
      credentials: 'include',
    });
    return handleResponse<ApiResponse<any>>(response);
  },

  /** PATCH /api/users/me – update profile fields */
  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'PATCH',
      headers: createHeaders('PATCH'),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<any>>(response);
  },

  /** POST /api/users/me/avatar – upload avatar image */
  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);
    // Don't set Content-Type header — browser sets it with boundary for FormData
    const csrfToken = getCookie('XSRF-TOKEN');
    const response = await fetch(`${API_URL}/users/me/avatar`, {
      method: 'POST',
      headers: {
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      credentials: 'include',
      body: formData,
    });
    return handleResponse<ApiResponse<{ avatarUrl: string }>>(response);
  },

  /** POST /api/users/me/change-password/request-otp — Step 1: validate password, send OTP */
  async requestPasswordChangeOtp(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/users/me/change-password/request-otp`, {
      method: 'POST',
      headers: createHeaders('POST'),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<void>>(response);
  },

  /** POST /api/users/me/change-password/confirm — Step 2: verify OTP, change password */
  async confirmPasswordChange(data: {
    currentPassword: string;
    newPassword: string;
    otp: string;
  }): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/users/me/change-password/confirm`, {
      method: 'POST',
      headers: createHeaders('POST'),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<void>>(response);
  },

  /** PATCH /api/users/me/preferences */
  async updatePreferences(data: { theme?: string; textSize?: 'small' | 'medium' | 'large' }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_URL}/users/me/preferences`, {
      method: 'PATCH',
      headers: createHeaders('PATCH'),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<ApiResponse<any>>(response);
  },
};

// ==================== NOTIFICATIONS ====================

export interface NotificationData {
  id: string;
  _id: string;
  userId: string | null;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export const notificationsApi = {
  /** GET /api/notifications */
  async getNotifications(params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<ApiResponse<{ notifications: NotificationData[]; total: number; unreadCount: number }>> {
    const sp = new URLSearchParams();
    if (params?.limit) sp.append('limit', String(params.limit));
    if (params?.offset) sp.append('offset', String(params.offset));
    if (params?.unreadOnly) sp.append('unreadOnly', 'true');

    const qs = sp.toString();
    const url = `${API_URL}/notifications${qs ? `?${qs}` : ''}`;
    const response = await fetch(url, {
      headers: createHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  /** PATCH /api/notifications/mark-all-read */
  async markAllRead(): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: createHeaders('PATCH'),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  /** PATCH /api/notifications/:id/read */
  async markRead(id: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: createHeaders('PATCH'),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  /** DELETE /api/notifications/:id */
  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: createHeaders('DELETE'),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  /** DELETE /api/notifications */
  async deleteAllNotifications(): Promise<ApiResponse<{ deletedCount: number }>> {
    const response = await fetch(`${API_URL}/notifications`, {
      method: 'DELETE',
      headers: createHeaders('DELETE'),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// ==================== FORGOT PASSWORD ====================

export const forgotPasswordApi = {
  /**
   * Step 1: Request OTP for password reset
   */
  async sendOtp(email: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/auth/forgot-password/send-otp`, {
      method: 'POST',
      headers: createHeaders('POST'),
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    return handleResponse<ApiResponse<void>>(response);
  },

  /**
   * Step 2: Verify OTP and get a reset token
   */
  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; resetToken?: string }> {
    const response = await fetch(`${API_URL}/auth/forgot-password/verify-otp`, {
      method: 'POST',
      headers: createHeaders('POST'),
      credentials: 'include',
      body: JSON.stringify({ email, otp }),
    });
    return handleResponse<{ success: boolean; resetToken?: string }>(response);
  },

  /**
   * Step 3: Reset password using the reset token
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/auth/forgot-password/reset`, {
      method: 'POST',
      headers: createHeaders('POST'),
      credentials: 'include',
      body: JSON.stringify({ resetToken, newPassword }),
    });
    return handleResponse<ApiResponse<void>>(response);
  },
};



