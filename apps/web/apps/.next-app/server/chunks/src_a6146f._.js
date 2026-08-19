module.exports = {

"[project]/src/lib/toast.ts [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

/**
 * Centralized toast helper — wraps sonner's toast API
 * so every call site uses the same style & duration.
 *
 * Usage:
 *   import { showToast } from '@/lib/toast'
 *   showToast.success('Distribution created.')
 *   showToast.error('Login failed. Check credentials.')
 */ __turbopack_esm__({
    "default": ()=>__TURBOPACK__default__export__,
    "showToast": ()=>showToast
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/sonner/dist/index.mjs [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
const showToast = {
    /** Green check-mark toast */ success (message) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].success(message, {
            duration: 3000
        });
    },
    /** Red X toast */ error (message) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].error(message, {
            duration: 4500
        });
    },
    /** Neutral / info toast */ info (message) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"](message, {
            duration: 3000
        });
    },
    /** Shows a loading toast that can be resolved later */ loading (message) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].loading(message);
    },
    /** Dismiss a specific toast by id */ dismiss (id) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].dismiss(id);
    }
};
const __TURBOPACK__default__export__ = showToast;

})()),
"[project]/src/lib/api.ts [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

/**
 * API Service for Kapit-Bisig Web Application
 * 
 * Centralized API client with authentication support and type safety.
 */ __turbopack_esm__({
    "BARANGAY_OPTIONS": ()=>BARANGAY_OPTIONS,
    "api": ()=>api,
    "default": ()=>__TURBOPACK__default__export__,
    "forgotPasswordApi": ()=>forgotPasswordApi,
    "getScopedBarangays": ()=>getScopedBarangays,
    "notificationsApi": ()=>notificationsApi,
    "profileApi": ()=>profileApi
});
const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || '/api';
const BARANGAY_OPTIONS = [
    'Bolo',
    'Bongalon',
    'Dulig',
    'Laois',
    'Magsaysay',
    'Poblacion',
    'San Gonzalo',
    'San Jose',
    'Tobuan',
    'Uyong'
];
function getScopedBarangays(role, assignedBarangays) {
    if (role === 'SUPERADMIN' || !assignedBarangays || assignedBarangays.length === 0) {
        return [
            ...BARANGAY_OPTIONS
        ];
    }
    // Preserve canonical order from BARANGAY_OPTIONS
    return BARANGAY_OPTIONS.filter((b)=>assignedBarangays.includes(b));
}
// ========================== HELPERS ==========================
/**
 * Read a cookie value by name (browser-side).
 */ function getCookie(name) {
    if (typeof document === 'undefined') return undefined;
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : undefined;
}
/**
 * Create headers (cookie-based auth – no bearer token needed).
 * Automatically attaches X-CSRF-Token for state-changing requests.
 */ const createHeaders = (method = 'GET')=>{
    const headers = {
        'Content-Type': 'application/json'
    };
    // Attach CSRF token for state-changing methods
    const upper = method.toUpperCase();
    if (upper !== 'GET' && upper !== 'HEAD' && upper !== 'OPTIONS') {
        const csrfToken = getCookie('XSRF-TOKEN');
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }
    }
    return headers;
};
/**
 * Handle API response.
 *
 * Security: raw server text, HTTP status codes, and non-JSON responses are
 * logged to the console for developer debugging only.  Error.message uses
 * only the server's intentional JSON message or a generic fallback so that
 * downstream UI code can safely display it without leaking system details.
 */ async function handleResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const rawText = await response.text();
    let data = null;
    if (isJson && rawText) {
        try {
            data = JSON.parse(rawText);
        } catch  {
            data = null;
        }
    }
    if (!response.ok) {
        // Log raw details for developer debugging — never expose to UI
        console.error(`[API] ${response.status} ${response.url}`, isJson ? data : rawText?.slice(0, 300));
        // User-safe message: prefer server's intentional JSON message, else generic
        const userMessage = data?.message || 'Something went wrong. Please try again.';
        const error = new Error(userMessage);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error.response = data ?? {
            message: userMessage
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error.status = response.status;
        throw error;
    }
    return data ?? {};
}
const api = {
    // ==================== STAFF USER MANAGEMENT (SUPERADMIN) ====================
    /**
   * List staff users with optional filters
   */ async getStaffUsers (params) {
        const sp = new URLSearchParams();
        if (params?.search) sp.append('search', params.search);
        if (params?.status) sp.append('status', params.status);
        if (params?.barangay && params.barangay !== 'All Barangays') sp.append('barangay', params.barangay);
        const qs = sp.toString();
        const url = `${API_URL}/admin/users${qs ? `?${qs}` : ''}`;
        const response = await fetch(url, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Get staff user stats
   */ async getStaffStats () {
        const response = await fetch(`${API_URL}/admin/users/stats`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Create a new staff user
   */ async createStaffUser (data) {
        const response = await fetch(`${API_URL}/admin/users`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /**
   * Update a staff user
   */ async updateStaffUser (id, data) {
        const response = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /**
   * Reset a staff user's password
   */ async resetStaffPassword (id, newPassword) {
        const response = await fetch(`${API_URL}/admin/users/${id}/reset-password`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include',
            body: JSON.stringify({
                newPassword
            })
        });
        return handleResponse(response);
    },
    // ==================== HEALTH ====================
    /**
   * Health check
   */ async healthCheck () {
        const response = await fetch(`${API_URL}/health`);
        if (!response.ok) throw new Error('Server is not responding');
        return response.json();
    },
    // ==================== DISTRIBUTIONS ====================
    /**
   * Get all distributions
   */ async getDistributions () {
        const response = await fetch(`${API_URL}/distributions`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Create a new distribution
   */ async createDistribution (data, options) {
        const headers = createHeaders('POST');
        if (options?.idempotencyKey) {
            headers['Idempotency-Key'] = options.idempotencyKey;
        }
        const response = await fetch(`${API_URL}/distributions`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
                ...data,
                assignedBarangays: data.assignedBarangays ?? []
            })
        });
        return handleResponse(response);
    },
    /**
   * Search eligible scanner staff for a distribution scope.
   */ async getScanEligibleUsers (params) {
        const sp = new URLSearchParams();
        if (params.barangay) sp.append('barangay', params.barangay);
        if (params.hostBarangayId) sp.append('hostBarangayId', params.hostBarangayId);
        if (Array.isArray(params.assignedBarangayIds)) {
            for (const b of params.assignedBarangayIds){
                sp.append('assignedBarangayIds', b);
            }
        }
        if (params.scheduled) sp.append('scheduled', params.scheduled);
        if (params.q) sp.append('q', params.q);
        if (typeof params.cursor === 'number') sp.append('cursor', String(params.cursor));
        if (typeof params.limit === 'number') sp.append('limit', String(params.limit));
        const response = await fetch(`${API_URL}/users/scan-eligible?${sp.toString()}`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Reschedule an active distribution
   */ async rescheduleDistribution (id, data) {
        const response = await fetch(`${API_URL}/distributions/${id}/reschedule`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /**
   * Mark a distribution as claimed
   */ async claimDistribution (id) {
        const response = await fetch(`${API_URL}/distributions/${id}/claim`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Get households for a distribution (claimed / not-yet-claimed)
   */ async getDistributionHouseholds (distributionId) {
        const response = await fetch(`${API_URL}/distributions/${distributionId}/households`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    // ==================== HOUSEHOLDS ====================
    /**
   * Get registered households list.
   * Supports search, barangay, status, and pagination filters.
   */ async getHouseholds (params) {
        const sp = new URLSearchParams();
        if (params?.search) sp.append('search', params.search);
        if (params?.barangay && params.barangay !== 'All Barangays') sp.append('barangay', params.barangay);
        if (params?.status && params.status !== 'All Status') sp.append('status', params.status);
        if (typeof params?.page === 'number') sp.append('page', String(params.page));
        if (typeof params?.limit === 'number') sp.append('limit', String(params.limit));
        const qs = sp.toString();
        const url = `${API_URL}/households${qs ? `?${qs}` : ''}`;
        const response = await fetch(url, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Delete a staff user
   */ async deleteStaffUser (id) {
        const response = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'DELETE',
            headers: createHeaders('DELETE'),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    // ==================== RESIDENT REGISTRATIONS ====================
    /**
   * Get resident registrations with optional filters.
   */ async getResidents (params) {
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
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Get one resident registration detail for admin review.
   */ async getResident (id) {
        const response = await fetch(`${API_URL}/residents/${id}`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Approve or reject a resident registration.
   */ async updateResidentStatus (id, payload) {
        const response = await fetch(`${API_URL}/residents/${id}/status`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    /**
   * Get disaster events used for target beneficiary review.
   */ async getBeneficiaryEvents (params) {
        const sp = new URLSearchParams();
        if (params?.status) sp.append('status', params.status);
        if (params?.barangay && params.barangay !== 'All Barangays') sp.append('barangay', params.barangay);
        if (typeof params?.page === 'number') sp.append('page', String(params.page));
        if (typeof params?.limit === 'number') sp.append('limit', String(params.limit));
        const qs = sp.toString();
        const response = await fetch(`${API_URL}/beneficiaries/events${qs ? `?${qs}` : ''}`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Get current active disaster event for target beneficiary flow.
   */ async getActiveBeneficiaryEvent () {
        const response = await fetch(`${API_URL}/beneficiaries/events/active`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Create a new disaster event.
   */ async createBeneficiaryEvent (data) {
        const response = await fetch(`${API_URL}/beneficiaries/events`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /**
   * Get proof submissions for target beneficiary verification.
   */ async getBeneficiaryProofSubmissions (params) {
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
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Approve or reject a proof submission.
   */ async reviewBeneficiaryProofSubmission (id, payload) {
        const response = await fetch(`${API_URL}/beneficiaries/admin/proof-submissions/${id}/review`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    /**
   * Record a relief-pack claim (sends token + distribution info).
   */ async recordClaim (data) {
        const response = await fetch(`${API_URL}/claims/record-claim`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /**
   * Record multiple relief-pack claims in one request.
   */ async recordClaimBatch (data) {
        const response = await fetch(`${API_URL}/claims/record-claim-batch`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    // ==================== REPORTS ====================
    /**
   * Get report summary with aggregated distribution data.
   */ async getReportSummary (params) {
        const sp = new URLSearchParams();
        if (params?.startDate) sp.append('startDate', params.startDate);
        if (params?.endDate) sp.append('endDate', params.endDate);
        if (params?.barangay && params.barangay !== 'All') sp.append('barangay', params.barangay);
        if (params?.reportType) sp.append('reportType', params.reportType);
        const qs = sp.toString();
        const url = `${API_URL}/reports/summary${qs ? `?${qs}` : ''}`;
        const response = await fetch(url, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    // ==================== AUDIT LOGS ====================
    /**
   * Get audit logs
   */ async getAuditLogs (params) {
        const sp = new URLSearchParams();
        if (typeof params?.page === 'number') sp.append('page', String(params.page));
        if (typeof params?.limit === 'number') sp.append('limit', String(params.limit));
        if (params?.action) sp.append('action', params.action);
        if (params?.entityType) sp.append('entityType', params.entityType);
        if (params?.actorRole) sp.append('actorRole', params.actorRole);
        const qs = sp.toString();
        const url = `${API_URL}/audit-logs${qs ? `?${qs}` : ''}`;
        const response = await fetch(url, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    }
};
const __TURBOPACK__default__export__ = api;
const profileApi = {
    /** GET /api/users/me – current user profile */ async getProfile () {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /** PATCH /api/users/me – update profile fields */ async updateProfile (data) {
        const response = await fetch(`${API_URL}/users/me`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /** POST /api/users/me/avatar – upload avatar image */ async uploadAvatar (file) {
        const formData = new FormData();
        formData.append('avatar', file);
        // Don't set Content-Type header — browser sets it with boundary for FormData
        const csrfToken = getCookie('XSRF-TOKEN');
        const response = await fetch(`${API_URL}/users/me/avatar`, {
            method: 'POST',
            headers: {
                ...csrfToken ? {
                    'X-CSRF-Token': csrfToken
                } : {}
            },
            credentials: 'include',
            body: formData
        });
        return handleResponse(response);
    },
    /** POST /api/users/me/change-password/request-otp — Step 1: validate password, send OTP */ async requestPasswordChangeOtp (data) {
        const response = await fetch(`${API_URL}/users/me/change-password/request-otp`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /** POST /api/users/me/change-password/confirm — Step 2: verify OTP, change password */ async confirmPasswordChange (data) {
        const response = await fetch(`${API_URL}/users/me/change-password/confirm`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /** PATCH /api/users/me/preferences */ async updatePreferences (data) {
        const response = await fetch(`${API_URL}/users/me/preferences`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    }
};
const notificationsApi = {
    /** GET /api/notifications */ async getNotifications (params) {
        const sp = new URLSearchParams();
        if (params?.limit) sp.append('limit', String(params.limit));
        if (params?.offset) sp.append('offset', String(params.offset));
        if (params?.unreadOnly) sp.append('unreadOnly', 'true');
        const qs = sp.toString();
        const url = `${API_URL}/notifications${qs ? `?${qs}` : ''}`;
        const response = await fetch(url, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /** PATCH /api/notifications/mark-all-read */ async markAllRead () {
        const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /** PATCH /api/notifications/:id/read */ async markRead (id) {
        const response = await fetch(`${API_URL}/notifications/${id}/read`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /** DELETE /api/notifications/:id */ async deleteNotification (id) {
        const response = await fetch(`${API_URL}/notifications/${id}`, {
            method: 'DELETE',
            headers: createHeaders('DELETE'),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /** DELETE /api/notifications */ async deleteAllNotifications () {
        const response = await fetch(`${API_URL}/notifications`, {
            method: 'DELETE',
            headers: createHeaders('DELETE'),
            credentials: 'include'
        });
        return handleResponse(response);
    }
};
const forgotPasswordApi = {
    /**
   * Step 1: Request OTP for password reset
   */ async sendOtp (email) {
        const response = await fetch(`${API_URL}/auth/forgot-password/send-otp`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify({
                email
            })
        });
        return handleResponse(response);
    },
    /**
   * Step 2: Verify OTP and get a reset token
   */ async verifyOtp (email, otp) {
        const response = await fetch(`${API_URL}/auth/forgot-password/verify-otp`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify({
                email,
                otp
            })
        });
        return handleResponse(response);
    },
    /**
   * Step 3: Reset password using the reset token
   */ async resetPassword (resetToken, newPassword) {
        const response = await fetch(`${API_URL}/auth/forgot-password/reset`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify({
                resetToken,
                newPassword
            })
        });
        return handleResponse(response);
    }
};

})()),
"[project]/src/components/dashboard/RecentDistributions.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>RecentDistributions
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/api.ts [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
;
;
function RecentDistributions() {
    const [distributions, setDistributions] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]([]);
    const [loading, setLoading] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](true);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        let mounted = true;
        const load = async ()=>{
            try {
                const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].getDistributions();
                const data = Array.isArray(res.data) ? res.data : [];
                const sorted = [
                    ...data
                ].sort((a, b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                if (mounted) setDistributions(sorted.slice(0, 4));
            } catch  {
            // silently fail
            } finally{
                if (mounted) setLoading(false);
            }
        };
        load();
        return ()=>{
            mounted = false;
        };
    }, []);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "h-full flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex items-center justify-between mb-1",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                className: "text-base font-bold text-slate-900 dark:text-slate-100",
                                children: "Recent Distributions"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                lineNumber: 36,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/distribution",
                                className: "text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors",
                                children: "View all →"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                lineNumber: 37,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                        className: "text-xs text-slate-500 dark:text-slate-400 mb-3",
                        children: "Latest relief batches deployed"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this),
                    loading ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "space-y-2.5",
                        children: [
                            1,
                            2,
                            3
                        ].map((i)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 animate-pulse",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "flex items-center gap-2.5",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                                lineNumber: 51,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "space-y-1",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                        className: "h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                                        lineNumber: 53,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                        className: "h-2.5 w-16 bg-slate-100 dark:bg-slate-700/60 rounded"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                                        lineNumber: 54,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                                lineNumber: 52,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                        lineNumber: 50,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "h-5 w-14 bg-slate-200 dark:bg-slate-700 rounded-full"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                        lineNumber: 57,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, i, true, {
                                fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                lineNumber: 49,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                        lineNumber: 47,
                        columnNumber: 11
                    }, this) : distributions.length === 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex flex-col items-center justify-center py-6 text-center text-slate-400",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](BoxIcon, {
                                className: "w-8 h-8 text-slate-300 dark:text-slate-600 mb-1"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                lineNumber: 63,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                className: "text-xs",
                                children: "No distributions recorded yet"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                lineNumber: 64,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                        lineNumber: 62,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "space-y-2",
                        children: distributions.map((dist)=>{
                            const status = dist.status || 'Unclaimed';
                            const isClaimed = status === 'Claimed';
                            const dateStr = new Date(dist.scheduled || dist.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                            });
                            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/distribution",
                                className: "flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800/40 dark:border-slate-700/70 dark:hover:bg-slate-800 transition-all",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "flex items-center gap-2.5 min-w-0",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0",
                                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](DistIcon, {
                                                    className: "w-4 h-4"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                                    lineNumber: 84,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                                lineNumber: 83,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "min-w-0",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                        className: "text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight",
                                                        children: dist.barangay
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                                        lineNumber: 87,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                        className: "text-[10px] text-slate-500 dark:text-slate-400 mt-0.5",
                                                        children: [
                                                            dist.households,
                                                            " households • ",
                                                            dateStr
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                                        lineNumber: 90,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                                lineNumber: 86,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                        lineNumber: 82,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "shrink-0 flex items-center gap-1.5",
                                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                            className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${isClaimed ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40' : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'}`,
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                    className: `w-1.5 h-1.5 rounded-full ${isClaimed ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                                    lineNumber: 104,
                                                    columnNumber: 23
                                                }, this),
                                                status
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                            lineNumber: 97,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                        lineNumber: 96,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, dist._id || dist.id, true, {
                                fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                                lineNumber: 77,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                        lineNumber: 67,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                lineNumber: 34,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        children: "Verified claims log"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                        lineNumber: 121,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/distribution",
                        className: "text-emerald-600 dark:text-emerald-400 font-semibold hover:underline",
                        children: "Manage Batch →"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                        lineNumber: 122,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
                lineNumber: 120,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
        lineNumber: 33,
        columnNumber: 5
    }, this);
}
function DistIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        }, void 0, false, {
            fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
            lineNumber: 133,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
        lineNumber: 132,
        columnNumber: 5
    }, this);
}
function BoxIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        }, void 0, false, {
            fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
            lineNumber: 141,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/dashboard/RecentDistributions.tsx>",
        lineNumber: 140,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/dashboard/RecentDistributions.tsx [app-ssr] (ecmascript) {export default as RecentDistributions}": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "RecentDistributions": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$RecentDistributions$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$RecentDistributions$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/RecentDistributions.tsx [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";

})()),
"[project]/src/components/dashboard/SmartInsights.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>SmartInsights
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
function SmartInsights(props) {
    const { loading } = props;
    const insights = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        const result = [];
        const { claimRate, totalUnclaimed, barangayBreakdown, verificationMethods, totalDistributions, totalClaimed } = props;
        if (totalDistributions === 0) {
            result.push({
                type: 'info',
                title: 'Initial Setup In Progress',
                description: 'Create and dispatch your first relief distribution cycle to activate smart analytics.',
                tag: 'Getting Started'
            });
            return result;
        }
        // Claim rate insight
        if (claimRate >= 80) {
            result.push({
                type: 'success',
                title: 'High Community Turnout',
                description: `${claimRate.toFixed(1)}% of registered households have claimed relief — top tier coverage efficiency.`,
                tag: 'Efficiency'
            });
        } else if (claimRate >= 50) {
            result.push({
                type: 'info',
                title: 'Steady Claim Momentum',
                description: `${claimRate.toFixed(1)}% claim rate. Recommend SMS or barangay follow-up with ${totalUnclaimed.toLocaleString()} pending households.`,
                tag: 'Opportunity'
            });
        } else {
            result.push({
                type: 'warning',
                title: 'Turnout Lagging Threshold',
                description: `Only ${claimRate.toFixed(1)}% turnout with ${totalUnclaimed.toLocaleString()} households unserved. Check distribution site scheduling.`,
                tag: 'Action Needed'
            });
        }
        // Low-performing barangay
        const withReg = barangayBreakdown.filter((b)=>b.registeredHouseholds > 0);
        if (withReg.length > 0) {
            const lowest = [
                ...withReg
            ].sort((a, b)=>{
                const rA = a.registeredHouseholds > 0 ? a.claimedHouseholds / a.registeredHouseholds : 0;
                const rB = b.registeredHouseholds > 0 ? b.claimedHouseholds / b.registeredHouseholds : 0;
                return rA - rB;
            })[0];
            const rate = lowest.registeredHouseholds > 0 ? lowest.claimedHouseholds / lowest.registeredHouseholds * 100 : 0;
            if (rate < 60) {
                result.push({
                    type: 'warning',
                    title: `Focus Sector: ${lowest.barangay}`,
                    description: `${rate.toFixed(0)}% claim rate. ${lowest.registeredHouseholds - lowest.claimedHouseholds} households remaining to be reached.`,
                    tag: 'Sector Alert'
                });
            }
        }
        // Top performing barangay
        if (withReg.length > 1) {
            const best = [
                ...withReg
            ].sort((a, b)=>b.claimedHouseholds - a.claimedHouseholds)[0];
            result.push({
                type: 'success',
                title: `${best.barangay} Turnout Leader`,
                description: `${best.claimedHouseholds.toLocaleString()} households served — highest across all active sectors.`,
                tag: 'Top Performer'
            });
        }
        // Verification methods
        if (verificationMethods) {
            const totalVer = verificationMethods.qr + verificationMethods.face + verificationMethods.unknown;
            if (totalVer > 0 && verificationMethods.face > 0) {
                const facePct = (verificationMethods.face / totalVer * 100).toFixed(0);
                result.push({
                    type: 'ai',
                    title: 'Biometric AI Security Active',
                    description: `${facePct}% claims validated via Face Recognition, reducing fraud risk significantly.`,
                    tag: 'Verification'
                });
            }
        }
        // Total claimed milestone
        if (totalClaimed >= 100) {
            result.push({
                type: 'success',
                title: 'Key Milestone Achieved',
                description: `${totalClaimed.toLocaleString()} total families supported across ${totalDistributions} scheduled batches.`,
                tag: 'Milestone'
            });
        }
        return result.slice(0, 3);
    }, [
        props
    ]);
    if (loading) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
            className: "h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900",
            children: [
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "flex items-center justify-between mb-4",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "h-4 w-32 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                            lineNumber: 126,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "h-4 w-12 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                            lineNumber: 127,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                    lineNumber: 125,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "space-y-2.5",
                    children: [
                        1,
                        2,
                        3
                    ].map((i)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "h-16 bg-slate-100 rounded-xl animate-pulse dark:bg-slate-800"
                        }, i, false, {
                            fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                            lineNumber: 131,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                    lineNumber: 129,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
            lineNumber: 124,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "h-full flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex items-center justify-between mb-3",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: "flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs",
                                        children: "✨"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                                        lineNumber: 144,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                        className: "text-base font-bold text-slate-900 dark:text-slate-100",
                                        children: "Smart Insights"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                                        lineNumber: 147,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                                lineNumber: 143,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                                children: "AI Digest"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                                lineNumber: 149,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                        lineNumber: 142,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                        className: "text-xs text-slate-500 dark:text-slate-400 mb-3",
                        children: "Real-time pattern analysis and recommendations"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                        lineNumber: 154,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "space-y-2.5",
                        children: [
                            insights.map((insight, i)=>{
                                const isSuccess = insight.type === 'success';
                                const isWarning = insight.type === 'warning';
                                const isAI = insight.type === 'ai';
                                const badgeBg = isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40' : isWarning ? 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40' : isAI ? 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40' : 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40';
                                const iconBg = isSuccess ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300' : isWarning ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300' : isAI ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/60 dark:text-purple-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300';
                                return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700/70 dark:hover:bg-slate-800 transition-all",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "flex items-start justify-between gap-2 mb-1",
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                    className: "flex items-center gap-2 min-w-0",
                                                    children: [
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                            className: `w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${iconBg}`,
                                                            children: isSuccess ? '✓' : isWarning ? '!' : isAI ? '⚡' : 'ℹ'
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                                                            lineNumber: 188,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                            className: "text-xs font-bold text-slate-900 dark:text-slate-100 truncate",
                                                            children: insight.title
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                                                            lineNumber: 191,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                                                    lineNumber: 187,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                    className: `text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${badgeBg}`,
                                                    children: insight.tag
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                                                    lineNumber: 195,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                                            lineNumber: 186,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                            className: "text-[11px] text-slate-600 dark:text-slate-300 leading-snug pl-8",
                                            children: insight.description
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                                            lineNumber: 199,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, i, true, {
                                    fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                                    lineNumber: 182,
                                    columnNumber: 15
                                }, this);
                            }),
                            insights.length === 0 && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "text-center py-6 text-xs text-slate-400",
                                children: "No new insights at this time"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                                lineNumber: 207,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                        lineNumber: 159,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                lineNumber: 140,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        children: "Updated continuously"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                        lineNumber: 216,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "text-emerald-600 dark:text-emerald-400 font-semibold",
                        children: "Self-optimizing model"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                        lineNumber: 217,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
                lineNumber: 215,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/dashboard/SmartInsights.tsx>",
        lineNumber: 139,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/dashboard/SmartInsights.tsx [app-ssr] (ecmascript) {export default as SmartInsights}": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "SmartInsights": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$SmartInsights$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$SmartInsights$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/SmartInsights.tsx [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";

})()),
"[project]/src/components/dashboard/BarangayDistributionChart.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>BarangayDistributionChart
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
const PALETTE = [
    '#10b981',
    '#3b82f6',
    '#f59e0b',
    '#8b5cf6',
    '#06b6d4',
    '#ec4899',
    '#14b8a6',
    '#f97316',
    '#6366f1',
    '#84cc16'
];
function BarangayDistributionChart({ data, loading }) {
    const [hoveredBarangay, setHoveredBarangay] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](null);
    const [sortBy, setSortBy] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]('claims');
    const processedData = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        if (!data.length) return [];
        return data.map((d)=>{
            const rate = d.registeredHouseholds > 0 ? Math.round(d.claimedHouseholds / d.registeredHouseholds * 100) : 0;
            return {
                ...d,
                rate
            };
        });
    }, [
        data
    ]);
    const sortedList = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        if (!processedData.length) return [];
        return [
            ...processedData
        ].sort((a, b)=>{
            if (sortBy === 'rate') return b.rate - a.rate;
            return b.claimedHouseholds - a.claimedHouseholds;
        });
    }, [
        processedData,
        sortBy
    ]);
    const { segments, totalClaims, topBarangay, legendItems } = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        if (!processedData.length) return {
            segments: [],
            totalClaims: 0,
            topBarangay: null,
            legendItems: []
        };
        const totalClaims = processedData.reduce((s, d)=>s + d.claimedHouseholds, 0);
        if (totalClaims === 0) return {
            segments: [],
            totalClaims: 0,
            topBarangay: null,
            legendItems: []
        };
        const R = 54;
        const circumference = 2 * Math.PI * R;
        let cumPercent = 0;
        const segments = [];
        const legendItems = [];
        // Top 8 for donut
        const topForDonut = [
            ...processedData
        ].sort((a, b)=>b.claimedHouseholds - a.claimedHouseholds).slice(0, 7);
        const topBarangay = topForDonut[0] || null;
        topForDonut.forEach((item, i)=>{
            const pct = item.claimedHouseholds / totalClaims;
            const dashLen = circumference * pct;
            const offset = circumference * cumPercent;
            const color = PALETTE[i % PALETTE.length];
            const isHovered = hoveredBarangay === item.barangay;
            segments.push(/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                cx: "70",
                cy: "70",
                r: R,
                fill: "none",
                stroke: color,
                strokeWidth: isHovered ? 20 : 16,
                strokeDasharray: `${dashLen} ${circumference}`,
                strokeDashoffset: -offset,
                className: "transition-all duration-300 cursor-pointer",
                onMouseEnter: ()=>setHoveredBarangay(item.barangay),
                opacity: hoveredBarangay && !isHovered ? 0.35 : 1
            }, item.barangay, false, {
                fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                lineNumber: 67,
                columnNumber: 9
            }, this));
            legendItems.push({
                color,
                label: item.barangay,
                value: item.claimedHouseholds,
                rate: item.rate,
                pct: Math.round(pct * 100)
            });
            cumPercent += pct;
        });
        return {
            segments,
            totalClaims,
            topBarangay,
            legendItems
        };
    }, [
        processedData,
        hoveredBarangay
    ]);
    if (loading) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
            className: "h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900",
            children: [
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "flex items-center justify-between mb-4",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "h-4 w-44 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                            lineNumber: 100,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "h-4 w-20 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                            lineNumber: 101,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                    lineNumber: 99,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "grid grid-cols-1 md:grid-cols-12 gap-4 items-center",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "md:col-span-5 flex justify-center",
                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "w-36 h-36 bg-slate-100 rounded-full animate-pulse dark:bg-slate-800"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                lineNumber: 105,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                            lineNumber: 104,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "md:col-span-7 space-y-2",
                            children: [
                                1,
                                2,
                                3,
                                4
                            ].map((i)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "h-7 bg-slate-100 rounded-xl animate-pulse dark:bg-slate-800"
                                }, i, false, {
                                    fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                    lineNumber: 109,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                            lineNumber: 107,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                    lineNumber: 103,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
            lineNumber: 98,
            columnNumber: 7
        }, this);
    }
    const activeLegend = hoveredBarangay ? legendItems.find((l)=>l.label === hoveredBarangay) : null;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)] flex flex-col justify-between",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                className: "text-base font-bold text-slate-900 dark:text-slate-100",
                                children: "Claims by Barangay"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                lineNumber: 124,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                className: "text-xs text-slate-500 dark:text-slate-400",
                                children: "Coverage and distribution volume across assigned sectors"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                lineNumber: 125,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                        lineNumber: 123,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex items-center gap-1 rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800 text-xs font-medium self-start sm:self-auto",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                type: "button",
                                onClick: ()=>setSortBy('claims'),
                                className: `px-2 py-1 rounded-lg transition-all ${sortBy === 'claims' ? 'bg-white text-slate-900 shadow-sm font-semibold dark:bg-slate-700 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`,
                                children: "By Claims"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                lineNumber: 130,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                type: "button",
                                onClick: ()=>setSortBy('rate'),
                                className: `px-2 py-1 rounded-lg transition-all ${sortBy === 'rate' ? 'bg-white text-slate-900 shadow-sm font-semibold dark:bg-slate-700 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`,
                                children: "By Rate %"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                lineNumber: 141,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                        lineNumber: 129,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                lineNumber: 122,
                columnNumber: 7
            }, this),
            totalClaims === 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex flex-col items-center justify-center py-10 text-center text-sm text-slate-400 dark:text-slate-500",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "text-2xl mb-1",
                        children: "📍"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                        lineNumber: 157,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                        children: "No barangay claim data recorded yet"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                        lineNumber: 158,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                lineNumber: 156,
                columnNumber: 9
            }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "grid grid-cols-1 md:grid-cols-12 gap-5 items-center my-auto",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "md:col-span-5 flex flex-col items-center justify-center",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "relative w-36 h-36 shrink-0 select-none",
                            onMouseLeave: ()=>setHoveredBarangay(null),
                            children: [
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
                                    className: "w-full h-full transform -rotate-90",
                                    viewBox: "0 0 140 140",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                                            cx: "70",
                                            cy: "70",
                                            r: "54",
                                            fill: "none",
                                            stroke: "currentColor",
                                            strokeWidth: "14",
                                            className: "text-slate-100 dark:text-slate-800"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                            lineNumber: 167,
                                            columnNumber: 17
                                        }, this),
                                        segments
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                    lineNumber: 165,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                            className: "text-xl font-extrabold text-slate-900 dark:text-white tracking-tight",
                                            children: activeLegend ? activeLegend.value : totalClaims.toLocaleString()
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                            lineNumber: 171,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                            className: "text-[10px] font-semibold text-slate-400 dark:text-slate-400 truncate max-w-[90px]",
                                            children: activeLegend ? activeLegend.label : 'Total Claims'
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                            lineNumber: 174,
                                            columnNumber: 17
                                        }, this),
                                        activeLegend && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                            className: "text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5",
                                            children: [
                                                activeLegend.pct,
                                                "% of total"
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                            lineNumber: 178,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                    lineNumber: 170,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                            lineNumber: 164,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                        lineNumber: 163,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "md:col-span-7 space-y-2 max-h-[220px] overflow-y-auto pr-1",
                        children: sortedList.slice(0, 5).map((item, idx)=>{
                            const color = PALETTE[idx % PALETTE.length];
                            const isHovered = hoveredBarangay === item.barangay;
                            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
                            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                onMouseEnter: ()=>setHoveredBarangay(item.barangay),
                                onMouseLeave: ()=>setHoveredBarangay(null),
                                className: `p-2 rounded-xl border transition-all cursor-pointer ${isHovered ? 'bg-slate-50 border-slate-300 dark:bg-slate-800 dark:border-slate-700 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-800/80'}`,
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "flex items-center justify-between text-xs mb-1",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "flex items-center gap-1.5 min-w-0",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                        className: "text-xs font-semibold w-4 text-center",
                                                        children: medal
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                                        lineNumber: 206,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                        className: "w-2 h-2 rounded-full shrink-0",
                                                        style: {
                                                            backgroundColor: color
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                                        lineNumber: 207,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                        className: "font-semibold text-slate-800 dark:text-slate-200 truncate",
                                                        children: item.barangay
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                                        lineNumber: 208,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                                lineNumber: 205,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "flex items-center gap-2 shrink-0",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                        className: "font-bold text-slate-900 dark:text-slate-100",
                                                        children: [
                                                            item.claimedHouseholds,
                                                            " ",
                                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                                className: "text-[10px] font-normal text-slate-400",
                                                                children: "claims"
                                                            }, void 0, false, {
                                                                fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                                                lineNumber: 212,
                                                                columnNumber: 50
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                                        lineNumber: 211,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                        className: "text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40",
                                                        children: [
                                                            item.rate,
                                                            "%"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                                        lineNumber: 214,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                                lineNumber: 210,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                        lineNumber: 204,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden",
                                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "h-full rounded-full transition-all duration-500",
                                            style: {
                                                width: `${Math.min(item.rate, 100)}%`,
                                                backgroundColor: color
                                            }
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                            lineNumber: 222,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                        lineNumber: 221,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, item.barangay, true, {
                                fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                lineNumber: 194,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                        lineNumber: 187,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                lineNumber: 161,
                columnNumber: 9
            }, this),
            topBarangay && totalClaims > 0 && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "flex items-center gap-1",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "text-sm",
                                children: "🌟"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                lineNumber: 241,
                                columnNumber: 13
                            }, this),
                            " Top sector: ",
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("strong", {
                                className: "text-slate-800 dark:text-slate-200 font-semibold",
                                children: topBarangay.barangay
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                                lineNumber: 241,
                                columnNumber: 61
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                        lineNumber: 240,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "text-emerald-600 dark:text-emerald-400 font-semibold",
                        children: [
                            topBarangay.claimedHouseholds,
                            " served (",
                            topBarangay.rate,
                            "% coverage)"
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                        lineNumber: 243,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
                lineNumber: 239,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/dashboard/BarangayDistributionChart.tsx>",
        lineNumber: 120,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/dashboard/BarangayDistributionChart.tsx [app-ssr] (ecmascript) {export default as BarangayDistributionChart}": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "BarangayDistributionChart": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$BarangayDistributionChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$BarangayDistributionChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/BarangayDistributionChart.tsx [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";

})()),
"[project]/src/components/dashboard/WeeklyClaimChart.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>WeeklyClaimChart
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
const DAY_LABELS = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun'
];
function WeeklyClaimChart({ data, loading }) {
    const [hoverDay, setHoverDay] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](null);
    const { bars, maxY, yTicks, totalWeekly, peakDay, avgDaily } = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        const mapped = DAY_LABELS.map((label)=>{
            const found = data.find((d)=>d.day === label);
            return {
                day: label,
                count: found?.count ?? 0
            };
        });
        const totalWeekly = mapped.reduce((acc, d)=>acc + d.count, 0);
        const raw = Math.max(...mapped.map((d)=>d.count), 1);
        const maxY = Math.ceil(raw / 5) * 5 || 10;
        const yTicks = Array.from({
            length: 5
        }, (_, i)=>Math.round(maxY / 4 * i));
        // Find peak day
        const sorted = [
            ...mapped
        ].sort((a, b)=>b.count - a.count);
        const peak = sorted[0]?.count > 0 ? sorted[0] : null;
        const avgDaily = Math.round(totalWeekly / 7);
        return {
            bars: mapped,
            maxY,
            yTicks,
            totalWeekly,
            peakDay: peak,
            avgDaily
        };
    }, [
        data
    ]);
    if (loading) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
            className: "h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900",
            children: [
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "flex items-center justify-between mb-4",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "h-4 w-36 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                            lineNumber: 43,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "h-4 w-16 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                            lineNumber: 44,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                    lineNumber: 42,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "h-[180px] bg-slate-100 rounded-xl animate-pulse dark:bg-slate-800/50"
                }, void 0, false, {
                    fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                    lineNumber: 46,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
            lineNumber: 41,
            columnNumber: 7
        }, this);
    }
    const activeBar = hoverDay ? bars.find((b)=>b.day === hoverDay) : null;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "h-full flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex items-center justify-between mb-2",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                className: "text-base font-bold text-slate-900 dark:text-slate-100",
                                children: "Weekly Claim Activity"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                lineNumber: 58,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                className: "text-xs text-slate-500 dark:text-slate-400",
                                children: "Claims processed past 7 days"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                lineNumber: 59,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40",
                        children: [
                            totalWeekly,
                            " total"
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                lineNumber: 56,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "relative my-auto select-none pt-2",
                children: [
                    activeBar && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "absolute top-0 right-2 z-10 text-[11px] bg-slate-900 text-white dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium shadow-md",
                        children: [
                            activeBar.day,
                            ": ",
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "font-bold text-amber-300",
                                children: [
                                    activeBar.count,
                                    " claims"
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                lineNumber: 71,
                                columnNumber: 30
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                        lineNumber: 70,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "absolute left-0 top-3 bottom-6 w-7 flex flex-col justify-between text-[10px] font-semibold text-slate-400 dark:text-slate-500 pointer-events-none",
                        children: [
                            ...yTicks
                        ].reverse().map((t)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                children: t
                            }, t, false, {
                                fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                lineNumber: 78,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                        lineNumber: 76,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "ml-8",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
                                viewBox: "0 0 350 170",
                                className: "w-full h-[155px] overflow-visible",
                                preserveAspectRatio: "none",
                                onMouseLeave: ()=>setHoverDay(null),
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("defs", {
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("linearGradient", {
                                                id: "bar-grad-default",
                                                x1: "0",
                                                y1: "0",
                                                x2: "0",
                                                y2: "1",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("stop", {
                                                        offset: "0%",
                                                        stopColor: "#f59e0b"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                                        lineNumber: 91,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("stop", {
                                                        offset: "100%",
                                                        stopColor: "#d97706"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                                        lineNumber: 92,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                                lineNumber: 90,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("linearGradient", {
                                                id: "bar-grad-peak",
                                                x1: "0",
                                                y1: "0",
                                                x2: "0",
                                                y2: "1",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("stop", {
                                                        offset: "0%",
                                                        stopColor: "#10b981"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                                        lineNumber: 95,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("stop", {
                                                        offset: "100%",
                                                        stopColor: "#059669"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                                        lineNumber: 96,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                                lineNumber: 94,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("linearGradient", {
                                                id: "bar-grad-hover",
                                                x1: "0",
                                                y1: "0",
                                                x2: "0",
                                                y2: "1",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("stop", {
                                                        offset: "0%",
                                                        stopColor: "#fbbf24"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                                        lineNumber: 99,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("stop", {
                                                        offset: "100%",
                                                        stopColor: "#f59e0b"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                                        lineNumber: 100,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                                lineNumber: 98,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                        lineNumber: 89,
                                        columnNumber: 13
                                    }, this),
                                    yTicks.map((t)=>{
                                        const y = 145 - t / maxY * 125;
                                        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("line", {
                                            x1: "0",
                                            y1: y,
                                            x2: "350",
                                            y2: y,
                                            stroke: "currentColor",
                                            strokeWidth: "1",
                                            strokeDasharray: "3 3",
                                            className: "text-slate-200 dark:text-slate-800"
                                        }, t, false, {
                                            fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                            lineNumber: 108,
                                            columnNumber: 17
                                        }, this);
                                    }),
                                    bars.map((bar, i)=>{
                                        const barW = 28;
                                        const gap = (350 - barW * 7) / 8;
                                        const x = gap + i * (barW + gap);
                                        const h = Math.max(bar.count / maxY * 125, bar.count > 0 ? 6 : 2);
                                        const y = 145 - h;
                                        const isPeak = peakDay && bar.day === peakDay.day && bar.count > 0;
                                        const isHovered = hoverDay === bar.day;
                                        let fillGrad = 'url(#bar-grad-default)';
                                        if (isPeak) fillGrad = 'url(#bar-grad-peak)';
                                        if (isHovered) fillGrad = 'url(#bar-grad-hover)';
                                        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("g", {
                                            className: "cursor-pointer",
                                            onMouseEnter: ()=>setHoverDay(bar.day),
                                            children: [
                                                isHovered && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("rect", {
                                                    x: x - 4,
                                                    y: 10,
                                                    width: barW + 8,
                                                    height: 138,
                                                    rx: 8,
                                                    fill: "currentColor",
                                                    className: "text-slate-100 dark:text-slate-800/60 transition-all"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                                    lineNumber: 140,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("rect", {
                                                    x: x,
                                                    y: y,
                                                    width: barW,
                                                    height: h,
                                                    rx: 6,
                                                    fill: fillGrad,
                                                    opacity: bar.count > 0 ? isHovered ? 1 : 0.9 : 0.25,
                                                    className: "transition-all duration-300"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                                    lineNumber: 152,
                                                    columnNumber: 19
                                                }, this),
                                                bar.count > 0 && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("text", {
                                                    x: x + barW / 2,
                                                    y: y - 5,
                                                    textAnchor: "middle",
                                                    className: `text-[10px] font-bold ${isPeak ? 'fill-emerald-600 dark:fill-emerald-400' : isHovered ? 'fill-amber-600 dark:fill-amber-400' : 'fill-slate-600 dark:fill-slate-400'}`,
                                                    children: bar.count
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                                    lineNumber: 165,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, bar.day, true, {
                                            fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                            lineNumber: 137,
                                            columnNumber: 17
                                        }, this);
                                    })
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                lineNumber: 83,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex justify-around mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400",
                                children: DAY_LABELS.map((l)=>{
                                    const isPeak = peakDay && l === peakDay.day && peakDay.count > 0;
                                    const isHovered = hoverDay === l;
                                    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: `cursor-pointer transition-colors ${isPeak ? 'text-emerald-600 dark:text-emerald-400 font-bold' : isHovered ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}`,
                                        onMouseEnter: ()=>setHoverDay(l),
                                        children: l
                                    }, l, false, {
                                        fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                        lineNumber: 191,
                                        columnNumber: 17
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                lineNumber: 186,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                        lineNumber: 82,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                lineNumber: 67,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-center text-xs",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "bg-slate-50 dark:bg-slate-800/60 rounded-xl py-1.5 px-2",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "text-[10px] text-slate-400 block font-medium",
                                children: "Daily Average"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                lineNumber: 213,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "font-bold text-slate-800 dark:text-slate-200",
                                children: [
                                    avgDaily,
                                    " / day"
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                lineNumber: 214,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                        lineNumber: 212,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "bg-slate-50 dark:bg-slate-800/60 rounded-xl py-1.5 px-2",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "text-[10px] text-slate-400 block font-medium",
                                children: "Peak Day"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                lineNumber: 217,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "font-bold text-emerald-600 dark:text-emerald-400",
                                children: peakDay ? `${peakDay.day} (${peakDay.count})` : 'None'
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                                lineNumber: 218,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                        lineNumber: 216,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
                lineNumber: 211,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/dashboard/WeeklyClaimChart.tsx>",
        lineNumber: 54,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/dashboard/WeeklyClaimChart.tsx [app-ssr] (ecmascript) {export default as WeeklyClaimChart}": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "WeeklyClaimChart": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$WeeklyClaimChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$WeeklyClaimChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/WeeklyClaimChart.tsx [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";

})()),
"[project]/src/components/dashboard/DistributionTrendsChart.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>DistributionTrendsChart
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
function DistributionTrendsChart({ data, loading }) {
    const [timeframe, setTimeframe] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]('all');
    const [hoverIndex, setHoverIndex] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](null);
    const filteredData = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        if (!data.length) return [];
        if (timeframe === '3m') return data.slice(-3);
        if (timeframe === '6m') return data.slice(-6);
        return data;
    }, [
        data,
        timeframe
    ]);
    // Aggregate metrics for header pill
    const summaryMetrics = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        if (!filteredData.length) return {
            totalDist: 0,
            totalClaim: 0,
            avgClaimRate: 0
        };
        const totalDist = filteredData.reduce((s, d)=>s + d.distributions, 0);
        const totalClaim = filteredData.reduce((s, d)=>s + d.claimed, 0);
        const avgClaimRate = totalDist > 0 ? Math.round(totalClaim / totalDist * 100) : 0;
        return {
            totalDist,
            totalClaim,
            avgClaimRate
        };
    }, [
        filteredData
    ]);
    const chartModel = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        if (!filteredData.length) {
            return {
                distributionsPath: '',
                claimedPath: '',
                distributionsArea: '',
                claimedArea: '',
                pointsDist: [],
                pointsClaim: [],
                labels: [],
                maxY: 10,
                yTicks: [
                    0,
                    5,
                    10
                ]
            };
        }
        const vals = filteredData.flatMap((d)=>[
                d.distributions,
                d.claimed
            ]);
        const rawMax = Math.max(...vals, 1);
        const maxY = Math.ceil(rawMax / 5) * 5 || 10;
        const yTicks = Array.from({
            length: 5
        }, (_, i)=>Math.round(maxY / 4 * i));
        const W = 600;
        const H = 210;
        const padX = 20;
        const n = filteredData.length;
        const xStep = n > 1 ? (W - padX * 2) / (n - 1) : 0;
        const toY = (v)=>H - v / maxY * (H - 24) - 12;
        const pointsDist = filteredData.map((d, i)=>({
                x: padX + i * xStep,
                y: toY(d.distributions),
                val: d.distributions
            }));
        const pointsClaim = filteredData.map((d, i)=>({
                x: padX + i * xStep,
                y: toY(d.claimed),
                val: d.claimed
            }));
        const buildSmoothPath = (pts)=>{
            if (pts.length === 0) return '';
            if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
            let d = `M${pts[0].x},${pts[0].y}`;
            for(let i = 1; i < pts.length; i++){
                const cp1x = (pts[i - 1].x + pts[i].x) / 2;
                const cp1y = pts[i - 1].y;
                const cp2x = cp1x;
                const cp2y = pts[i].y;
                d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${pts[i].x},${pts[i].y}`;
            }
            return d;
        };
        const buildSmoothArea = (pts)=>{
            if (pts.length === 0) return '';
            const lineStr = buildSmoothPath(pts);
            return `${lineStr} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
        };
        return {
            distributionsPath: buildSmoothPath(pointsDist),
            claimedPath: buildSmoothPath(pointsClaim),
            distributionsArea: buildSmoothArea(pointsDist),
            claimedArea: buildSmoothArea(pointsClaim),
            pointsDist,
            pointsClaim,
            labels: filteredData.map((d)=>d.month),
            maxY,
            yTicks
        };
    }, [
        filteredData
    ]);
    if (loading) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
            className: "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900",
            children: [
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "flex items-center justify-between mb-6",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "h-5 w-48 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                            lineNumber: 116,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "h-7 w-32 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                            lineNumber: 117,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                    lineNumber: 115,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "h-[210px] bg-slate-100 rounded-xl animate-pulse dark:bg-slate-800/50"
                }, void 0, false, {
                    fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                    lineNumber: 119,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
            lineNumber: 114,
            columnNumber: 7
        }, this);
    }
    if (!data.length) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
            className: "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900",
            children: [
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                    className: "text-base font-bold text-slate-900 dark:text-slate-100",
                    children: "Monthly Distribution Trends"
                }, void 0, false, {
                    fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                    lineNumber: 127,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "flex flex-col items-center justify-center h-[200px] text-center text-sm text-slate-400",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                            className: "text-3xl mb-2",
                            children: "📊"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                            lineNumber: 129,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                            children: "No distribution trend data available yet"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                            lineNumber: 130,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                    lineNumber: 128,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
            lineNumber: 126,
            columnNumber: 7
        }, this);
    }
    const activePointDist = hoverIndex !== null ? chartModel.pointsDist[hoverIndex] : null;
    const activePointClaim = hoverIndex !== null ? chartModel.pointsClaim[hoverIndex] : null;
    const activeItem = hoverIndex !== null ? filteredData[hoverIndex] : null;
    const activeClaimRate = activeItem && activeItem.distributions > 0 ? Math.round(activeItem.claimed / activeItem.distributions * 100) : 0;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                        className: "text-base font-bold text-slate-900 dark:text-slate-100",
                                        children: "Monthly Distribution Trends"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                        lineNumber: 150,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40",
                                        children: [
                                            summaryMetrics.avgClaimRate,
                                            "% overall claim rate"
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                        lineNumber: 151,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                lineNumber: 149,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                className: "text-xs text-slate-500 dark:text-slate-400 mt-0.5",
                                children: "Track distributions planned vs actual beneficiary claims over time"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                lineNumber: 155,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                        lineNumber: 148,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: "flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                className: "inline-block w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                                lineNumber: 165,
                                                columnNumber: 15
                                            }, this),
                                            "Planned"
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                        lineNumber: 164,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: "flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                className: "inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                                lineNumber: 169,
                                                columnNumber: 15
                                            }, this),
                                            "Claimed"
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                        lineNumber: 168,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                lineNumber: 163,
                                columnNumber: 11
                            }, this),
                            data.length > 3 && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800 text-xs font-medium",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        type: "button",
                                        onClick: ()=>{
                                            setTimeframe('all');
                                            setHoverIndex(null);
                                        },
                                        className: `px-2.5 py-1 rounded-lg transition-all ${timeframe === 'all' ? 'bg-white text-slate-900 shadow-sm font-semibold dark:bg-slate-700 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`,
                                        children: "All"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                        lineNumber: 177,
                                        columnNumber: 15
                                    }, this),
                                    data.length >= 6 && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        type: "button",
                                        onClick: ()=>{
                                            setTimeframe('6m');
                                            setHoverIndex(null);
                                        },
                                        className: `px-2.5 py-1 rounded-lg transition-all ${timeframe === '6m' ? 'bg-white text-slate-900 shadow-sm font-semibold dark:bg-slate-700 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`,
                                        children: "6M"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                        lineNumber: 189,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        type: "button",
                                        onClick: ()=>{
                                            setTimeframe('3m');
                                            setHoverIndex(null);
                                        },
                                        className: `px-2.5 py-1 rounded-lg transition-all ${timeframe === '3m' ? 'bg-white text-slate-900 shadow-sm font-semibold dark:bg-slate-700 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`,
                                        children: "3M"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                        lineNumber: 201,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                lineNumber: 176,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                        lineNumber: 161,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                lineNumber: 147,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "relative select-none",
                children: [
                    activeItem && activePointDist && activePointClaim && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "absolute z-20 pointer-events-none transition-all duration-150 transform -translate-x-1/2 -translate-y-full mb-3",
                        style: {
                            left: `${activePointDist.x / 600 * 100}%`,
                            top: `${Math.min(activePointDist.y, activePointClaim.y) * 0.9}px`
                        },
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "bg-slate-900/95 text-white dark:bg-slate-800/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700/80 text-xs whitespace-nowrap min-w-[130px]",
                            children: [
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "font-bold text-slate-200 border-b border-slate-700/80 pb-1 mb-1.5 flex items-center justify-between gap-2",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                            children: activeItem.month
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                            lineNumber: 230,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                            className: "text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300",
                                            children: [
                                                activeClaimRate,
                                                "% Rate"
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                            lineNumber: 231,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                    lineNumber: 229,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "flex items-center justify-between gap-3 text-slate-300",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                            className: "flex items-center gap-1.5",
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                    className: "w-2 h-2 rounded-full bg-blue-400"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                                    lineNumber: 237,
                                                    columnNumber: 19
                                                }, this),
                                                " Planned:"
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                            lineNumber: 236,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                            className: "font-semibold text-white",
                                            children: activeItem.distributions.toLocaleString()
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                            lineNumber: 239,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                    lineNumber: 235,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "flex items-center justify-between gap-3 text-slate-300 mt-1",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                            className: "flex items-center gap-1.5",
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                    className: "w-2 h-2 rounded-full bg-emerald-400"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                                    lineNumber: 243,
                                                    columnNumber: 19
                                                }, this),
                                                " Claimed:"
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                            lineNumber: 242,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                            className: "font-semibold text-emerald-300",
                                            children: activeItem.claimed.toLocaleString()
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                            lineNumber: 245,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                    lineNumber: 241,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                            lineNumber: 228,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                        lineNumber: 221,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "absolute left-0 top-1 bottom-6 w-9 flex flex-col justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 pointer-events-none",
                        children: [
                            ...chartModel.yTicks
                        ].reverse().map((t)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                children: t.toLocaleString()
                            }, t, false, {
                                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                lineNumber: 254,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                        lineNumber: 252,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "ml-10",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
                                viewBox: "0 0 600 210",
                                className: "w-full h-[190px] overflow-visible",
                                preserveAspectRatio: "none",
                                onMouseLeave: ()=>setHoverIndex(null),
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("defs", {
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("linearGradient", {
                                                id: "grad-dist-modern",
                                                x1: "0",
                                                y1: "0",
                                                x2: "0",
                                                y2: "1",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("stop", {
                                                        offset: "0%",
                                                        stopColor: "#3b82f6",
                                                        stopOpacity: "0.35"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                                        lineNumber: 268,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("stop", {
                                                        offset: "100%",
                                                        stopColor: "#3b82f6",
                                                        stopOpacity: "0.0"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                                        lineNumber: 269,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                                lineNumber: 267,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("linearGradient", {
                                                id: "grad-claim-modern",
                                                x1: "0",
                                                y1: "0",
                                                x2: "0",
                                                y2: "1",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("stop", {
                                                        offset: "0%",
                                                        stopColor: "#10b981",
                                                        stopOpacity: "0.30"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                                        lineNumber: 272,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("stop", {
                                                        offset: "100%",
                                                        stopColor: "#10b981",
                                                        stopOpacity: "0.0"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                                        lineNumber: 273,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                                lineNumber: 271,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("filter", {
                                                id: "glow-blue",
                                                x: "-20%",
                                                y: "-20%",
                                                width: "140%",
                                                height: "140%",
                                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("feDropShadow", {
                                                    dx: "0",
                                                    dy: "2",
                                                    stdDeviation: "3",
                                                    floodColor: "#3b82f6",
                                                    floodOpacity: "0.4"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                                    lineNumber: 276,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                                lineNumber: 275,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("filter", {
                                                id: "glow-emerald",
                                                x: "-20%",
                                                y: "-20%",
                                                width: "140%",
                                                height: "140%",
                                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("feDropShadow", {
                                                    dx: "0",
                                                    dy: "2",
                                                    stdDeviation: "3",
                                                    floodColor: "#10b981",
                                                    floodOpacity: "0.4"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                                    lineNumber: 279,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                                lineNumber: 278,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                        lineNumber: 266,
                                        columnNumber: 13
                                    }, this),
                                    chartModel.yTicks.map((t)=>{
                                        const y = 210 - t / chartModel.maxY * (210 - 24) - 12;
                                        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("line", {
                                            x1: "0",
                                            y1: y,
                                            x2: "600",
                                            y2: y,
                                            stroke: "currentColor",
                                            strokeWidth: "1",
                                            strokeDasharray: "4 4",
                                            className: "text-slate-200 dark:text-slate-800"
                                        }, t, false, {
                                            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                            lineNumber: 287,
                                            columnNumber: 17
                                        }, this);
                                    }),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                                        d: chartModel.distributionsArea,
                                        fill: "url(#grad-dist-modern)"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                        lineNumber: 302,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                                        d: chartModel.claimedArea,
                                        fill: "url(#grad-claim-modern)"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                        lineNumber: 303,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                                        d: chartModel.distributionsPath,
                                        fill: "none",
                                        stroke: "#3b82f6",
                                        strokeWidth: "3",
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        filter: "url(#glow-blue)"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                        lineNumber: 306,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                                        d: chartModel.claimedPath,
                                        fill: "none",
                                        stroke: "#10b981",
                                        strokeWidth: "3",
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        filter: "url(#glow-emerald)"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                        lineNumber: 315,
                                        columnNumber: 13
                                    }, this),
                                    activePointDist && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("line", {
                                        x1: activePointDist.x,
                                        y1: 0,
                                        x2: activePointDist.x,
                                        y2: 210,
                                        stroke: "#64748b",
                                        strokeWidth: "1.5",
                                        strokeDasharray: "3 3",
                                        className: "opacity-70"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                        lineNumber: 327,
                                        columnNumber: 15
                                    }, this),
                                    chartModel.pointsDist.map((p, i)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("g", {
                                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                                                cx: p.x,
                                                cy: p.y,
                                                r: hoverIndex === i ? 6 : 4,
                                                fill: "#ffffff",
                                                stroke: "#3b82f6",
                                                strokeWidth: hoverIndex === i ? 3 : 2,
                                                className: "transition-all duration-150 cursor-pointer"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                                lineNumber: 342,
                                                columnNumber: 17
                                            }, this)
                                        }, `dist-${i}`, false, {
                                            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                            lineNumber: 341,
                                            columnNumber: 15
                                        }, this)),
                                    chartModel.pointsClaim.map((p, i)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("g", {
                                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                                                cx: p.x,
                                                cy: p.y,
                                                r: hoverIndex === i ? 6 : 4,
                                                fill: "#ffffff",
                                                stroke: "#10b981",
                                                strokeWidth: hoverIndex === i ? 3 : 2,
                                                className: "transition-all duration-150 cursor-pointer"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                                lineNumber: 356,
                                                columnNumber: 17
                                            }, this)
                                        }, `claim-${i}`, false, {
                                            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                            lineNumber: 355,
                                            columnNumber: 15
                                        }, this)),
                                    chartModel.pointsDist.map((p, i)=>{
                                        const prevX = i > 0 ? chartModel.pointsDist[i - 1].x : 0;
                                        const nextX = i < chartModel.pointsDist.length - 1 ? chartModel.pointsDist[i + 1].x : 600;
                                        const left = (prevX + p.x) / 2;
                                        const width = (nextX + p.x) / 2 - left;
                                        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("rect", {
                                            x: left,
                                            y: 0,
                                            width: width,
                                            height: 210,
                                            fill: "transparent",
                                            className: "cursor-pointer",
                                            onMouseEnter: ()=>setHoverIndex(i)
                                        }, `hit-${i}`, false, {
                                            fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                            lineNumber: 376,
                                            columnNumber: 17
                                        }, this);
                                    })
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                lineNumber: 260,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex justify-between mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2",
                                children: chartModel.labels.map((lbl, i)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: `transition-colors cursor-pointer text-center ${hoverIndex === i ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105' : 'hover:text-slate-800 dark:hover:text-slate-200'}`,
                                        onMouseEnter: ()=>setHoverIndex(i),
                                        children: lbl
                                    }, lbl, false, {
                                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                        lineNumber: 393,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                                lineNumber: 391,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                        lineNumber: 259,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
                lineNumber: 218,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/dashboard/DistributionTrendsChart.tsx>",
        lineNumber: 145,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/dashboard/DistributionTrendsChart.tsx [app-ssr] (ecmascript) {export default as DistributionTrendsChart}": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "DistributionTrendsChart": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$DistributionTrendsChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$DistributionTrendsChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/DistributionTrendsChart.tsx [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";

})()),
"[project]/src/components/dashboard/QuickActions.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>QuickActions
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/link.js [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
const actions = [
    {
        label: 'New Distribution',
        subtitle: 'Schedule & allocate',
        href: '/distribution',
        color: 'from-emerald-500 to-teal-600',
        icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](DistributionIcon, {
            className: "w-4 h-4 text-white"
        }, void 0, false, {
            fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
            lineNumber: 20,
            columnNumber: 11
        }, this)
    },
    {
        label: 'Generate Reports',
        subtitle: 'Export data & stats',
        href: '/reports',
        color: 'from-blue-500 to-indigo-600',
        icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](ReportsIcon, {
            className: "w-4 h-4 text-white"
        }, void 0, false, {
            fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
            lineNumber: 27,
            columnNumber: 11
        }, this)
    },
    {
        label: 'Beneficiaries',
        subtitle: 'Target & verify',
        href: '/target-beneficiaries',
        color: 'from-amber-500 to-orange-600',
        icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](UserAddIcon, {
            className: "w-4 h-4 text-white"
        }, void 0, false, {
            fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
            lineNumber: 34,
            columnNumber: 11
        }, this)
    },
    {
        label: 'Claim Codes',
        subtitle: 'Manage QR tokens',
        href: '/code-generation',
        color: 'from-purple-500 to-pink-600',
        icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](QrTokenIcon, {
            className: "w-4 h-4 text-white"
        }, void 0, false, {
            fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
            lineNumber: 41,
            columnNumber: 11
        }, this)
    }
];
function QuickActions() {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "h-full flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex items-center justify-between mb-1",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                className: "text-base font-bold text-slate-900 dark:text-slate-100",
                                children: "Quick Actions"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
                                lineNumber: 50,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "text-[11px] font-semibold text-slate-400",
                                children: "Shortcuts"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
                                lineNumber: 51,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                        className: "text-xs text-slate-500 dark:text-slate-400 mb-3",
                        children: "Frequently accessed administrative tasks"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
                        lineNumber: 53,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "grid grid-cols-2 gap-2.5",
                        children: actions.map((action, index)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: action.href,
                                className: "group relative p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800/40 dark:border-slate-700/70 dark:hover:bg-slate-800 transition-all duration-200 flex flex-col justify-between",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "flex items-center justify-between mb-2",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: `w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`,
                                                children: action.icon
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
                                                lineNumber: 63,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                className: "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors text-xs",
                                                children: "→"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
                                                lineNumber: 66,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
                                        lineNumber: 62,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                className: "text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight",
                                                children: action.label
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
                                                lineNumber: 71,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                className: "text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate",
                                                children: action.subtitle
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
                                                lineNumber: 74,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
                                        lineNumber: 70,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, index, true, {
                                fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
                                lineNumber: 57,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
                        lineNumber: 55,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
                lineNumber: 48,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        children: "Press anywhere to navigate"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
                        lineNumber: 85,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "font-semibold text-slate-500 dark:text-slate-400",
                        children: "⚡ Fast access"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
                        lineNumber: 86,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
                lineNumber: 84,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
        lineNumber: 47,
        columnNumber: 5
    }, this);
}
function ReportsIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        }, void 0, false, {
            fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
            lineNumber: 95,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
        lineNumber: 94,
        columnNumber: 5
    }, this);
}
function DistributionIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        }, void 0, false, {
            fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
            lineNumber: 103,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
        lineNumber: 102,
        columnNumber: 5
    }, this);
}
function UserAddIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        }, void 0, false, {
            fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
            lineNumber: 111,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
        lineNumber: 110,
        columnNumber: 5
    }, this);
}
function QrTokenIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
        }, void 0, false, {
            fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
            lineNumber: 119,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/dashboard/QuickActions.tsx>",
        lineNumber: 118,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/dashboard/QuickActions.tsx [app-ssr] (ecmascript) {export default as QuickActions}": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "QuickActions": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$QuickActions$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$QuickActions$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/QuickActions.tsx [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";

})()),
"[project]/src/components/dashboard/LowStockAlert.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>LowStockAlert
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/link.js [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
function LowStockAlert({ pendingDistributions = 0, unclaimedHouseholds = 0, loading }) {
    const alerts = [];
    if (pendingDistributions > 0) {
        alerts.push({
            id: 'pd',
            label: 'Distributions Awaiting Claims',
            detail: `${pendingDistributions} distribution cycle(s) currently open`,
            severity: 'yellow',
            actionHref: '/distribution',
            actionLabel: 'View Queue'
        });
    }
    if (unclaimedHouseholds > 0) {
        alerts.push({
            id: 'uh',
            label: 'Unclaimed Relief Packages',
            detail: `${unclaimedHouseholds} beneficiary household(s) not yet served`,
            severity: 'blue',
            actionHref: '/households',
            actionLabel: 'Check List'
        });
    }
    // System readiness score calculation
    const totalTasks = pendingDistributions + unclaimedHouseholds;
    const readinessScore = totalTasks === 0 ? 100 : Math.max(20, Math.min(95, 100 - pendingDistributions * 10 - Math.floor(unclaimedHouseholds / 5)));
    if (loading) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
            className: "h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900",
            children: [
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "flex items-center justify-between mb-4",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "h-4 w-28 bg-slate-200 rounded-lg animate-pulse dark:bg-slate-800"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                            lineNumber: 58,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "h-5 w-16 bg-slate-200 rounded-full animate-pulse dark:bg-slate-800"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                            lineNumber: 59,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                    lineNumber: 57,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "space-y-3",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "h-16 bg-slate-100 rounded-xl animate-pulse dark:bg-slate-800"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                            lineNumber: 62,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "h-16 bg-slate-100 rounded-xl animate-pulse dark:bg-slate-800"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                            lineNumber: 63,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                    lineNumber: 61,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
            lineNumber: 56,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "h-full flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex items-center justify-between mb-3",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                        className: "text-base font-bold text-slate-900 dark:text-slate-100",
                                        children: "Operational Alerts"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                        lineNumber: 75,
                                        columnNumber: 13
                                    }, this),
                                    alerts.length > 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse",
                                        children: [
                                            alerts.length,
                                            " Active"
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                        lineNumber: 77,
                                        columnNumber: 15
                                    }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white",
                                        children: "All Clear"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                        lineNumber: 81,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                lineNumber: 74,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "text-[11px] font-medium text-slate-400",
                                children: "Live Status"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                lineNumber: 86,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                        lineNumber: 73,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "mb-3.5 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/80 border border-slate-200/80 dark:from-slate-800/80 dark:to-slate-800/40 dark:border-slate-700",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center justify-between text-xs mb-1.5",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: "font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                className: "w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-ping"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                                lineNumber: 93,
                                                columnNumber: 15
                                            }, this),
                                            "Relief Pipeline Readiness"
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                        lineNumber: 92,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: `font-bold ${readinessScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`,
                                        children: [
                                            readinessScore,
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                        lineNumber: 96,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                lineNumber: 91,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden",
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: `h-full rounded-full transition-all duration-700 ${readinessScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'}`,
                                    style: {
                                        width: `${readinessScore}%`
                                    }
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                    lineNumber: 101,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                lineNumber: 100,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                        lineNumber: 90,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "space-y-2.5",
                        children: alerts.length === 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "flex flex-col items-center justify-center py-6 text-center rounded-xl bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-800/30",
                            children: [
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](CheckCircleIcon, {
                                    className: "w-8 h-8 text-emerald-500 mb-1.5"
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                    lineNumber: 116,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                    className: "text-sm font-semibold text-emerald-900 dark:text-emerald-300",
                                    children: "All Distributions Optimized"
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                    lineNumber: 117,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                    className: "text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5",
                                    children: "No immediate pending backlog or alerts."
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                    lineNumber: 118,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                            lineNumber: 115,
                            columnNumber: 13
                        }, this) : alerts.map((alert)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700/80 flex items-start justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "flex items-start gap-2.5 min-w-0",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: `w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${alert.severity === 'yellow' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'}`,
                                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](AlertTriangleIcon, {
                                                    className: "w-4 h-4"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                                    lineNumber: 130,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                                lineNumber: 127,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "min-w-0",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                        className: "text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight truncate",
                                                        children: alert.label
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                                        lineNumber: 133,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                        className: "text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug",
                                                        children: alert.detail
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                                        lineNumber: 136,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                                lineNumber: 132,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                        lineNumber: 126,
                                        columnNumber: 17
                                    }, this),
                                    alert.actionHref && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: alert.actionHref,
                                        className: "shrink-0 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
                                        children: alert.actionLabel || 'Action'
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                        lineNumber: 142,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, alert.id, true, {
                                fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                lineNumber: 122,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                        lineNumber: 113,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                lineNumber: 71,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "flex items-center gap-1.5",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "w-1.5 h-1.5 rounded-full bg-emerald-500"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                                lineNumber: 158,
                                columnNumber: 11
                            }, this),
                            " Database sync active"
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                        lineNumber: 157,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/reports",
                        className: "text-emerald-600 dark:text-emerald-400 font-semibold hover:underline",
                        children: "Analytics →"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                        lineNumber: 160,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
                lineNumber: 156,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
        lineNumber: 70,
        columnNumber: 5
    }, this);
}
function AlertTriangleIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        }, void 0, false, {
            fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
            lineNumber: 171,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
        lineNumber: 170,
        columnNumber: 5
    }, this);
}
function CheckCircleIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        }, void 0, false, {
            fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
            lineNumber: 179,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/dashboard/LowStockAlert.tsx>",
        lineNumber: 178,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/dashboard/LowStockAlert.tsx [app-ssr] (ecmascript) {export default as LowStockAlert}": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "LowStockAlert": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$LowStockAlert$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$LowStockAlert$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/LowStockAlert.tsx [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";

})()),
"[project]/src/components/dashboard/index.ts [app-ssr] (ecmascript) {locals}": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({});
;
;
;
;
;
;
;
;
;
;

})()),
"[project]/src/lib/AuthContext.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "AuthProvider": ()=>AuthProvider,
    "useAuth": ()=>useAuth
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || '/api';
const AuthContext = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"](undefined);
function AuthProvider({ children }) {
    const [user, setUser] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](null);
    const [loading, setLoading] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](true);
    const getCsrfToken = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](()=>{
        return document.cookie.split('; ').find((c)=>c.startsWith('XSRF-TOKEN='))?.split('=')[1];
    }, []);
    const initAuth = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](async ()=>{
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                credentials: 'include'
            });
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    setUser({
                        username: json.data.username,
                        email: json.data.email || json.data.username,
                        role: json.data.role,
                        id: json.data.id,
                        firstName: json.data.firstName,
                        lastName: json.data.lastName,
                        fullName: json.data.fullName,
                        assignedBarangays: json.data.assignedBarangays,
                        forcePasswordReset: !!json.data.forcePasswordReset
                    });
                    return;
                }
            }
            setUser(null);
        } catch  {
            setUser(null);
        } finally{
            setLoading(false);
        }
    }, []);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        initAuth();
    }, [
        initAuth
    ]);
    const login = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](async (email, password, rememberMe, otp)=>{
        const payload = {
            email: email.trim().toLowerCase(),
            rememberMe: !!rememberMe
        };
        if (typeof password === 'string' && password.length > 0) {
            payload.password = password;
        }
        if (typeof otp === 'string' && otp.length > 0) {
            payload.otp = otp;
        }
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
            const firstValidationError = Array.isArray(json.errors) && json.errors.length > 0 ? json.errors[0]?.message : undefined;
            throw new Error(firstValidationError || json.message || 'Login failed');
        }
        if (json.otpRequired) {
            return {
                otpRequired: true,
                otpToken: json.otpToken,
                message: json.message || 'OTP sent to your registered email.'
            };
        }
        const u = json.data.user;
        setUser({
            username: u.username,
            email: u.email || u.username,
            role: u.role,
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            fullName: u.fullName,
            assignedBarangays: u.assignedBarangays,
            forcePasswordReset: !!u.forcePasswordReset
        });
        return {
            otpRequired: false
        };
    }, []);
    const verifyLoginOtp = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](async (otpToken, otp)=>{
        const res = await fetch(`${API_URL}/auth/login/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                otpToken,
                otp
            })
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
            throw new Error(json.message || 'Verification failed');
        }
        const u = json.data.user;
        setUser({
            username: u.username,
            email: u.email || u.username,
            role: u.role,
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            fullName: u.fullName,
            assignedBarangays: u.assignedBarangays,
            forcePasswordReset: !!u.forcePasswordReset
        });
    }, []);
    const resendLoginOtp = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](async (otpToken)=>{
        const res = await fetch(`${API_URL}/auth/login/resend-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                otpToken
            })
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
            throw new Error(json.message || 'Failed to resend OTP');
        }
    }, []);
    const setInitialPassword = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](async (newPassword)=>{
        const csrfToken = getCsrfToken();
        const res = await fetch(`${API_URL}/auth/set-password`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...csrfToken ? {
                    'X-CSRF-Token': csrfToken
                } : {}
            },
            body: JSON.stringify({
                newPassword
            })
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
            throw new Error(json.message || 'Failed to set password');
        }
        setUser((prev)=>prev ? {
                ...prev,
                forcePasswordReset: false
            } : prev);
    }, [
        getCsrfToken
    ]);
    const logout = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](async ()=>{
        try {
            const csrfToken = getCsrfToken();
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: csrfToken ? {
                    'X-CSRF-Token': csrfToken
                } : {}
            });
        } finally{
            setUser(null);
        }
    }, [
        getCsrfToken
    ]);
    const isSuperadmin = user?.role === 'SUPERADMIN';
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](AuthContext.Provider, {
        value: {
            user,
            loading,
            login,
            verifyLoginOtp,
            resendLoginOtp,
            setInitialPassword,
            logout,
            isSuperadmin
        },
        children: children
    }, void 0, false, {
        fileName: "<[project]/src/lib/AuthContext.tsx>",
        lineNumber: 220,
        columnNumber: 5
    }, this);
}
function useAuth() {
    const ctx = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"](AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}

})()),
"[project]/src/components/ui/SelectDropdown.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>SelectDropdown
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
const BASE_BUTTON_CLASS = 'inline-flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 text-left text-sm shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] outline-none transition focus:ring-2 focus:ring-[#0F533A]/20 dark:focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-slate-700 disabled:text-gray-400 dark:disabled:text-gray-500';
const BASE_MENU_CLASS = 'absolute left-0 top-full z-50 mt-2 w-full max-h-64 overflow-y-auto rounded-2xl border border-[#DCDCDC] dark:border-slate-600 bg-[#ECECEC] dark:bg-slate-700 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.14)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]';
const BASE_OPTION_CLASS = 'w-full flex items-center gap-2 rounded-xl px-4 py-2.5 text-left text-sm transition-colors';
function cx(...classes) {
    return classes.filter(Boolean).join(' ');
}
function SelectDropdown({ id, value, options, onChange, placeholder = 'Select option', ariaLabel, disabled = false, className, buttonClassName, menuClassName }) {
    const [open, setOpen] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const buttonRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"](null);
    const menuRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"](null);
    const generatedId = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useId"]();
    const controlId = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>id || `select-dropdown-${generatedId.replace(/:/g, '')}`, [
        id,
        generatedId
    ]);
    const menuId = `${controlId}-menu`;
    const selectedOption = options.find((opt)=>opt.value === value);
    const selectedLabel = selectedOption?.label || placeholder;
    const hasSelection = value.trim().length > 0;
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        if (!open) return;
        const onMouseDown = (event)=>{
            const target = event.target;
            const inButton = buttonRef.current?.contains(target);
            const inMenu = menuRef.current?.contains(target);
            if (!inButton && !inMenu) setOpen(false);
        };
        const onKeyDown = (event)=>{
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKeyDown);
        return ()=>{
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [
        open
    ]);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        if (disabled) setOpen(false);
    }, [
        disabled
    ]);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: cx('relative', className),
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                id: controlId,
                ref: buttonRef,
                type: "button",
                disabled: disabled,
                "aria-haspopup": "listbox",
                "aria-expanded": open,
                "aria-controls": menuId,
                "aria-label": ariaLabel,
                onClick: ()=>setOpen((prev)=>!prev),
                className: cx(BASE_BUTTON_CLASS, buttonClassName),
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: cx('truncate', hasSelection ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'),
                        children: selectedLabel
                    }, void 0, false, {
                        fileName: "<[project]/src/components/ui/SelectDropdown.tsx>",
                        lineNumber: 104,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](ChevronDownIcon, {
                        open: open
                    }, void 0, false, {
                        fileName: "<[project]/src/components/ui/SelectDropdown.tsx>",
                        lineNumber: 107,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/ui/SelectDropdown.tsx>",
                lineNumber: 92,
                columnNumber: 7
            }, this),
            open ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                id: menuId,
                ref: menuRef,
                role: "listbox",
                "aria-labelledby": controlId,
                className: cx(BASE_MENU_CLASS, menuClassName),
                children: options.map((opt)=>{
                    const isSelected = opt.value === value;
                    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                        type: "button",
                        role: "option",
                        "aria-selected": isSelected,
                        onClick: ()=>{
                            onChange(opt.value);
                            setOpen(false);
                        },
                        className: cx(BASE_OPTION_CLASS, isSelected ? 'bg-[#EAB308] text-gray-900' : 'text-slate-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-slate-600/70'),
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "w-5 flex items-center justify-center text-gray-900",
                                children: isSelected ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](CheckIcon, {}, void 0, false, {
                                    fileName: "<[project]/src/components/ui/SelectDropdown.tsx>",
                                    lineNumber: 136,
                                    columnNumber: 33
                                }, this) : null
                            }, void 0, false, {
                                fileName: "<[project]/src/components/ui/SelectDropdown.tsx>",
                                lineNumber: 135,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "truncate",
                                children: opt.label
                            }, void 0, false, {
                                fileName: "<[project]/src/components/ui/SelectDropdown.tsx>",
                                lineNumber: 138,
                                columnNumber: 17
                            }, this)
                        ]
                    }, opt.value, true, {
                        fileName: "<[project]/src/components/ui/SelectDropdown.tsx>",
                        lineNumber: 121,
                        columnNumber: 15
                    }, this);
                })
            }, void 0, false, {
                fileName: "<[project]/src/components/ui/SelectDropdown.tsx>",
                lineNumber: 111,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/ui/SelectDropdown.tsx>",
        lineNumber: 91,
        columnNumber: 5
    }, this);
}
function ChevronDownIcon({ open }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: cx('h-4 w-4 text-gray-500 transition-transform', open ? 'rotate-180' : ''),
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        "aria-hidden": "true",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "<[project]/src/components/ui/SelectDropdown.tsx>",
            lineNumber: 157,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/ui/SelectDropdown.tsx>",
        lineNumber: 150,
        columnNumber: 5
    }, this);
}
function CheckIcon() {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: "h-4 w-4",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        "aria-hidden": "true",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 3,
            d: "M5 13l4 4L19 7"
        }, void 0, false, {
            fileName: "<[project]/src/components/ui/SelectDropdown.tsx>",
            lineNumber: 165,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/ui/SelectDropdown.tsx>",
        lineNumber: 164,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/lib/utils.ts [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "cn": ()=>cn
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
;
function cn(...inputs) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"](inputs));
}

})()),
"[project]/src/components/ui/table.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "Table": ()=>Table,
    "TableBody": ()=>TableBody,
    "TableCaption": ()=>TableCaption,
    "TableCell": ()=>TableCell,
    "TableFooter": ()=>TableFooter,
    "TableHead": ()=>TableHead,
    "TableHeader": ()=>TableHeader,
    "TableRow": ()=>TableRow
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
;
;
const Table = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "relative w-full overflow-auto",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("table", {
            ref: ref,
            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]("w-full caption-bottom text-sm", className),
            ...props
        }, void 0, false, {
            fileName: "<[project]/src/components/ui/table.tsx>",
            lineNumber: 10,
            columnNumber: 5
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/ui/table.tsx>",
        lineNumber: 9,
        columnNumber: 3
    }, this));
Table.displayName = "Table";
const TableHeader = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("thead", {
        ref: ref,
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]("[&_tr]:border-b", className),
        ...props
    }, void 0, false, {
        fileName: "<[project]/src/components/ui/table.tsx>",
        lineNumber: 23,
        columnNumber: 3
    }, this));
TableHeader.displayName = "TableHeader";
const TableBody = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("tbody", {
        ref: ref,
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]("[&_tr:last-child]:border-0", className),
        ...props
    }, void 0, false, {
        fileName: "<[project]/src/components/ui/table.tsx>",
        lineNumber: 31,
        columnNumber: 3
    }, this));
TableBody.displayName = "TableBody";
const TableFooter = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("tfoot", {
        ref: ref,
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className),
        ...props
    }, void 0, false, {
        fileName: "<[project]/src/components/ui/table.tsx>",
        lineNumber: 43,
        columnNumber: 3
    }, this));
TableFooter.displayName = "TableFooter";
const TableRow = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("tr", {
        ref: ref,
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className),
        ...props
    }, void 0, false, {
        fileName: "<[project]/src/components/ui/table.tsx>",
        lineNumber: 58,
        columnNumber: 3
    }, this));
TableRow.displayName = "TableRow";
const TableHead = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
        ref: ref,
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className),
        ...props
    }, void 0, false, {
        fileName: "<[project]/src/components/ui/table.tsx>",
        lineNumber: 73,
        columnNumber: 3
    }, this));
TableHead.displayName = "TableHead";
const TableCell = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
        ref: ref,
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className),
        ...props
    }, void 0, false, {
        fileName: "<[project]/src/components/ui/table.tsx>",
        lineNumber: 88,
        columnNumber: 3
    }, this));
TableCell.displayName = "TableCell";
const TableCaption = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("caption", {
        ref: ref,
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]("mt-4 text-sm text-muted-foreground", className),
        ...props
    }, void 0, false, {
        fileName: "<[project]/src/components/ui/table.tsx>",
        lineNumber: 103,
        columnNumber: 3
    }, this));
TableCaption.displayName = "TableCaption";
;

})()),
"[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>ApprovedUsersByBarangayTable
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$table$2f$build$2f$lib$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$locals$7d$__ = __turbopack_import__("[project]/node_modules/@tanstack/react-table/build/lib/index.mjs [app-ssr] (ecmascript) {locals}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$table$2d$core$2f$build$2f$lib$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/@tanstack/table-core/build/lib/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/ui/table.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SelectDropdown$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/ui/SelectDropdown.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/AuthContext.tsx [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
;
;
;
;
;
const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || '/api';
function maskName(fullName) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'Uxxxx';
    if (parts.length === 1) return `${parts[0][0].toUpperCase()}xxxx`;
    return `${parts[0][0].toUpperCase()}xxxx ${parts[1][0].toUpperCase()}xxxx`;
}
function ApprovedUsersByBarangayTable() {
    const { user, loading: authLoading } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"]();
    const [rows, setRows] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]([]);
    const [barangay, setBarangay] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]('All Barangays');
    const [loading, setLoading] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](true);
    const [error, setError] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](null);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        // Don't fetch if not authenticated
        if (authLoading || !user) {
            setLoading(false);
            return;
        }
        let mounted = true;
        const load = async ()=>{
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_URL}/residents?status=Approved&limit=50`, {
                    credentials: 'include'
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load approved users');
                if (mounted) setRows(Array.isArray(data.data) ? data.data : []);
            } catch (err) {
                console.error('Failed to load approved users:', err);
                if (mounted) setError('Failed to load approved users. Please try again.');
            } finally{
                if (mounted) setLoading(false);
            }
        };
        load();
        return ()=>{
            mounted = false;
        };
    }, [
        authLoading,
        user
    ]);
    const barangayOptions = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>[
            'All Barangays',
            ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getScopedBarangays"](user?.role, user?.assignedBarangays)
        ], [
        user?.role,
        user?.assignedBarangays
    ]);
    const barangayDropdownOptions = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>barangayOptions.map((option)=>({
                value: option,
                label: option
            })), [
        barangayOptions
    ]);
    const filteredRows = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        if (barangay === 'All Barangays') return rows;
        return rows.filter((r)=>r.barangay === barangay);
    }, [
        rows,
        barangay
    ]);
    const columns = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>[
            {
                accessorKey: 'fullName',
                header: 'Resident Name',
                cell: ({ row })=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "font-medium text-gray-900",
                        children: maskName(row.original.fullName)
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                        lineNumber: 89,
                        columnNumber: 11
                    }, this)
            },
            {
                accessorKey: 'barangay',
                header: 'Barangay'
            },
            {
                id: 'dateApproved',
                header: 'Date Approved',
                cell: ({ row })=>{
                    const dt = row.original.verifiedAt || row.original.createdAt;
                    return new Date(dt).toLocaleDateString();
                }
            }
        ], []);
    const table = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$table$2f$build$2f$lib$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$locals$7d$__["useReactTable"]({
        data: filteredRows,
        columns,
        getCoreRowModel: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$table$2d$core$2f$build$2f$lib$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCoreRowModel"]()
    });
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("section", {
        className: "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h2", {
                                className: "text-lg font-semibold text-gray-900",
                                children: "Approved Users by Barangay"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                                lineNumber: 120,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                className: "text-sm text-gray-500",
                                children: "Names are masked for privacy."
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                                lineNumber: 121,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                        lineNumber: 119,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "w-full sm:w-64",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("label", {
                                htmlFor: "dashboard-barangay-filter",
                                className: "mb-1 block text-xs font-medium text-gray-600",
                                children: "Filter by Barangay"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                                lineNumber: 125,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SelectDropdown$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                id: "dashboard-barangay-filter",
                                value: barangay,
                                onChange: setBarangay,
                                options: barangayDropdownOptions,
                                ariaLabel: "Filter by barangay",
                                buttonClassName: "h-10",
                                menuClassName: "max-h-72"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                                lineNumber: 128,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                        lineNumber: 124,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                lineNumber: 118,
                columnNumber: 7
            }, this),
            error ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700",
                children: error
            }, void 0, false, {
                fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                lineNumber: 141,
                columnNumber: 9
            }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "overflow-x-auto",
                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Table"], {
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TableHeader"], {
                            children: table.getHeaderGroups().map((headerGroup)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TableRow"], {
                                    children: headerGroup.headers.map((header)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TableHead"], {
                                            children: header.isPlaceholder ? null : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$table$2f$build$2f$lib$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$locals$7d$__["flexRender"](header.column.columnDef.header, header.getContext())
                                        }, header.id, false, {
                                            fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                                            lineNumber: 149,
                                            columnNumber: 21
                                        }, this))
                                }, headerGroup.id, false, {
                                    fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                                    lineNumber: 147,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                            lineNumber: 145,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TableBody"], {
                            children: loading ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TableRow"], {
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TableCell"], {
                                    colSpan: columns.length,
                                    className: "text-center text-sm text-gray-500",
                                    children: "Loading approved users..."
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                                    lineNumber: 161,
                                    columnNumber: 19
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                                lineNumber: 160,
                                columnNumber: 17
                            }, this) : table.getRowModel().rows.length === 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TableRow"], {
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TableCell"], {
                                    colSpan: columns.length,
                                    className: "text-center text-sm text-gray-500",
                                    children: "No approved users found."
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                                    lineNumber: 167,
                                    columnNumber: 19
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                                lineNumber: 166,
                                columnNumber: 17
                            }, this) : table.getRowModel().rows.map((row)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TableRow"], {
                                    children: row.getVisibleCells().map((cell)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$table$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TableCell"], {
                                            children: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$table$2f$build$2f$lib$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$locals$7d$__["flexRender"](cell.column.columnDef.cell, cell.getContext())
                                        }, cell.id, false, {
                                            fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                                            lineNumber: 175,
                                            columnNumber: 23
                                        }, this))
                                }, row.id, false, {
                                    fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                                    lineNumber: 173,
                                    columnNumber: 19
                                }, this))
                        }, void 0, false, {
                            fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                            lineNumber: 158,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                    lineNumber: 144,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
                lineNumber: 143,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx>",
        lineNumber: 117,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/dashboard/AIDistributionChart.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>AIDistributionChart
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
const priorityData = [
    {
        label: 'High Priority',
        value: 35,
        color: '#dc2626'
    },
    {
        label: 'Medium Priority',
        value: 45,
        color: '#eab308'
    },
    {
        label: 'Low Priority',
        value: 20,
        color: '#22c55e'
    }
];
function AIDistributionChart() {
    const total = priorityData.reduce((sum, item)=>sum + item.value, 0);
    // Calculate stroke dash array for donut chart
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercent = 0;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                className: "text-base font-bold text-gray-800 mb-4",
                children: "AI Priority Distribution"
            }, void 0, false, {
                fileName: "<[project]/src/components/dashboard/AIDistributionChart.tsx>",
                lineNumber: 27,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex items-center justify-between",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "relative w-36 h-36",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
                                className: "w-full h-full transform -rotate-90",
                                viewBox: "0 0 160 160",
                                children: priorityData.map((item, index)=>{
                                    const percent = item.value / total;
                                    const dashArray = circumference * percent;
                                    const dashOffset = circumference * cumulativePercent;
                                    cumulativePercent += percent;
                                    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                                        cx: "80",
                                        cy: "80",
                                        r: radius,
                                        fill: "none",
                                        stroke: item.color,
                                        strokeWidth: "20",
                                        strokeDasharray: `${dashArray} ${circumference}`,
                                        strokeDashoffset: -dashOffset,
                                        className: "transition-all duration-500"
                                    }, index, false, {
                                        fileName: "<[project]/src/components/dashboard/AIDistributionChart.tsx>",
                                        lineNumber: 40,
                                        columnNumber: 17
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/AIDistributionChart.tsx>",
                                lineNumber: 32,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "absolute inset-0 flex items-center justify-center",
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "text-center",
                                    children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                        className: "text-xl font-bold text-gray-800",
                                        children: [
                                            total,
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/dashboard/AIDistributionChart.tsx>",
                                        lineNumber: 58,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/dashboard/AIDistributionChart.tsx>",
                                    lineNumber: 57,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/dashboard/AIDistributionChart.tsx>",
                                lineNumber: 56,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/dashboard/AIDistributionChart.tsx>",
                        lineNumber: 31,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "space-y-2",
                        children: priorityData.map((item, index)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "w-3 h-3 rounded-full",
                                        style: {
                                            backgroundColor: item.color
                                        }
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/AIDistributionChart.tsx>",
                                        lineNumber: 67,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: "text-xs text-gray-600",
                                        children: item.label
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/dashboard/AIDistributionChart.tsx>",
                                        lineNumber: 71,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, index, true, {
                                fileName: "<[project]/src/components/dashboard/AIDistributionChart.tsx>",
                                lineNumber: 66,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/AIDistributionChart.tsx>",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/AIDistributionChart.tsx>",
                lineNumber: 29,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/dashboard/AIDistributionChart.tsx>",
        lineNumber: 26,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/dashboard/StatsCard.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>StatsCard
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
const iconVariantStyles = {
    default: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300',
    yellow: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
    red: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-300',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300'
};
const borderAccent = {
    default: 'border-gray-100 dark:border-slate-700',
    yellow: 'border-amber-100 dark:border-amber-900/40',
    green: 'border-emerald-100 dark:border-emerald-900/40',
    red: 'border-red-100 dark:border-red-900/40',
    blue: 'border-blue-100 dark:border-blue-900/40',
    orange: 'border-orange-100 dark:border-orange-900/40'
};
function StatsCard({ title, value, icon, variant = 'default', subtitle, trend }) {
    const trendClasses = trend === 'up' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : trend === 'down' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400';
    const trendSymbol = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—';
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: `rounded-2xl border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] transition-all hover:scale-[1.02] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] dark:bg-slate-900 ${borderAccent[variant]}`,
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mb-3 flex items-start justify-between",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: `flex h-10 w-10 items-center justify-center rounded-xl ${iconVariantStyles[variant]}`,
                        children: icon
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/StatsCard.tsx>",
                        lineNumber: 52,
                        columnNumber: 9
                    }, this),
                    trend && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: `rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${trendClasses}`,
                        children: trendSymbol
                    }, void 0, false, {
                        fileName: "<[project]/src/components/dashboard/StatsCard.tsx>",
                        lineNumber: 56,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/dashboard/StatsCard.tsx>",
                lineNumber: 51,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                className: "text-2xl font-bold leading-tight text-gray-800 dark:text-slate-100",
                children: value
            }, void 0, false, {
                fileName: "<[project]/src/components/dashboard/StatsCard.tsx>",
                lineNumber: 61,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                className: "mt-0.5 text-xs text-gray-500 dark:text-slate-400",
                children: title
            }, void 0, false, {
                fileName: "<[project]/src/components/dashboard/StatsCard.tsx>",
                lineNumber: 62,
                columnNumber: 7
            }, this),
            subtitle ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                className: "mt-1 text-[10px] text-gray-400 dark:text-slate-500",
                children: subtitle
            }, void 0, false, {
                fileName: "<[project]/src/components/dashboard/StatsCard.tsx>",
                lineNumber: 63,
                columnNumber: 19
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/dashboard/StatsCard.tsx>",
        lineNumber: 48,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/dashboard/index.ts [app-ssr] (ecmascript) {module evaluation}": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$StatsCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/StatsCard.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$AIDistributionChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/AIDistributionChart.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$RecentDistributions$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/RecentDistributions.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$LowStockAlert$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/LowStockAlert.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$QuickActions$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/QuickActions.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$ApprovedUsersByBarangayTable$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/ApprovedUsersByBarangayTable.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$DistributionTrendsChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/DistributionTrendsChart.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$WeeklyClaimChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/WeeklyClaimChart.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$BarangayDistributionChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/BarangayDistributionChart.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$SmartInsights$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/dashboard/SmartInsights.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$locals$7d$__ = __turbopack_import__("[project]/src/components/dashboard/index.ts [app-ssr] (ecmascript) {locals}");
"__TURBOPACK__ecmascript__hoisting__location__";

})()),
"[project]/src/components/layout/HeaderWidgets.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "NotificationBell": ()=>NotificationBell,
    "ProfileDropdown": ()=>ProfileDropdown
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/toast.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/api.ts [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
;
;
;
;
;
/* ================================================================== */ /*  Notification Bell + Dropdown                                      */ /* ================================================================== */ const ALL_NOTIFICATIONS_PAGE_SIZE = 25;
function NotificationBell() {
    const { user, loading: authLoading } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"]();
    const [open, setOpen] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const [showAllModal, setShowAllModal] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const [deleteTarget, setDeleteTarget] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](null);
    const [notifications, setNotifications] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]([]);
    const [allNotifications, setAllNotifications] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]([]);
    const [allTotal, setAllTotal] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](0);
    const [unreadCount, setUnreadCount] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](0);
    const [loading, setLoading] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const [allLoading, setAllLoading] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const [allLoadingMore, setAllLoadingMore] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const [deleting, setDeleting] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const rateLimitedUntilRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"](0);
    const inFlightRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"](false);
    const bellRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"](null);
    const dropdownRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"](null);
    const fetchNotifications = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](async ()=>{
        // Don't fetch if not authenticated
        if (authLoading || !user) return;
        if (Date.now() < rateLimitedUntilRef.current) return;
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        setLoading(true);
        try {
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationsApi"].getNotifications({
                limit: 10
            });
            if (res.success && res.data) {
                setNotifications(res.data.notifications);
                setUnreadCount(res.data.unreadCount);
            }
        } catch (err) {
            const e = err;
            if (e.status === 429) {
                // Back off client polling when server rate-limit is reached.
                rateLimitedUntilRef.current = Date.now() + 60_000;
            }
        } finally{
            inFlightRef.current = false;
            setLoading(false);
        }
    }, [
        authLoading,
        user
    ]);
    const fetchAllNotifications = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](async (offset = 0, append = false)=>{
        if (authLoading || !user) return;
        if (append) setAllLoadingMore(true);
        else setAllLoading(true);
        try {
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationsApi"].getNotifications({
                limit: ALL_NOTIFICATIONS_PAGE_SIZE,
                offset
            });
            if (res.success && res.data) {
                setAllNotifications((prev)=>{
                    if (!append) return res.data.notifications;
                    const existingIds = new Set(prev.map((n)=>n._id || n.id));
                    const incoming = res.data.notifications.filter((n)=>!existingIds.has(n._id || n.id));
                    return [
                        ...prev,
                        ...incoming
                    ];
                });
                setAllTotal(res.data.total);
                setUnreadCount(res.data.unreadCount);
            }
        } catch  {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].error('Failed to load notifications');
        } finally{
            if (append) setAllLoadingMore(false);
            else setAllLoading(false);
        }
    }, [
        authLoading,
        user
    ]);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        if (open) fetchNotifications();
    }, [
        open,
        fetchNotifications
    ]);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        if (showAllModal) fetchAllNotifications();
    }, [
        showAllModal,
        fetchAllNotifications
    ]);
    // Poll for unread count every 60 seconds (only when authenticated)
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        if (authLoading || !user) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return ()=>clearInterval(interval);
    }, [
        fetchNotifications,
        authLoading,
        user
    ]);
    // Close on outside click
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        if (!open) return;
        const handler = (e)=>{
            if (dropdownRef.current && !dropdownRef.current.contains(e.target) && bellRef.current && !bellRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const keyHandler = (e)=>{
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('keydown', keyHandler);
        return ()=>{
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('keydown', keyHandler);
        };
    }, [
        open
    ]);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        if (!showAllModal) return;
        const keyHandler = (e)=>{
            if (e.key === 'Escape' && !deleteTarget) setShowAllModal(false);
        };
        document.addEventListener('keydown', keyHandler);
        return ()=>document.removeEventListener('keydown', keyHandler);
    }, [
        showAllModal,
        deleteTarget
    ]);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        if (!deleteTarget) return;
        const keyHandler = (e)=>{
            if (e.key === 'Escape' && !deleting) setDeleteTarget(null);
        };
        document.addEventListener('keydown', keyHandler);
        return ()=>document.removeEventListener('keydown', keyHandler);
    }, [
        deleteTarget,
        deleting
    ]);
    const handleMarkAllRead = async ()=>{
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationsApi"].markAllRead();
            setNotifications((n)=>n.map((x)=>({
                        ...x,
                        isRead: true
                    })));
            setAllNotifications((n)=>n.map((x)=>({
                        ...x,
                        isRead: true
                    })));
            setUnreadCount(0);
        } catch  {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].error('Failed to mark all as read');
        }
    };
    const handleMarkRead = async (id)=>{
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationsApi"].markRead(id);
            setNotifications((n)=>n.map((x)=>x._id === id || x.id === id ? {
                        ...x,
                        isRead: true
                    } : x));
            setAllNotifications((n)=>n.map((x)=>x._id === id || x.id === id ? {
                        ...x,
                        isRead: true
                    } : x));
            setUnreadCount((c)=>Math.max(0, c - 1));
        } catch  {
        //
        }
    };
    const handleDeleteClick = (n)=>{
        setDeleteTarget(n);
    };
    const handleDeleteAllClick = ()=>{
        setDeleteTarget('all');
    };
    const handleConfirmDelete = async ()=>{
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            if (deleteTarget === 'all') {
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationsApi"].deleteAllNotifications();
                setNotifications([]);
                setAllNotifications([]);
                setAllTotal(0);
                setUnreadCount(0);
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].success('All notifications deleted');
            } else {
                const targetId = deleteTarget._id || deleteTarget.id;
                const wasUnread = !deleteTarget.isRead;
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationsApi"].deleteNotification(targetId);
                setNotifications((n)=>n.filter((x)=>(x._id || x.id) !== targetId));
                setAllNotifications((n)=>n.filter((x)=>(x._id || x.id) !== targetId));
                setAllTotal((t)=>Math.max(0, t - 1));
                if (wasUnread) setUnreadCount((c)=>Math.max(0, c - 1));
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].success('Notification deleted');
            }
            setDeleteTarget(null);
        } catch  {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].error('Failed to delete notification');
        } finally{
            setDeleting(false);
        }
    };
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "relative",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                ref: bellRef,
                onClick: ()=>setOpen(!open),
                className: "relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-green-500",
                "aria-label": "Notifications",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](BellIcon, {
                        className: "w-5 h-5"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                        lineNumber: 210,
                        columnNumber: 9
                    }, this),
                    unreadCount > 0 && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1",
                        children: unreadCount > 9 ? '9+' : unreadCount
                    }, void 0, false, {
                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                        lineNumber: 212,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                lineNumber: 204,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                ref: dropdownRef,
                className: "absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-[100] overflow-hidden",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                className: "text-sm font-bold text-gray-800 dark:text-gray-100",
                                children: "Notifications"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 225,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    unreadCount > 0 && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        onClick: handleMarkAllRead,
                                        className: "text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](CheckIcon, {
                                                className: "w-3.5 h-3.5"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                lineNumber: 229,
                                                columnNumber: 19
                                            }, this),
                                            " Mark all read"
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                        lineNumber: 228,
                                        columnNumber: 17
                                    }, this),
                                    notifications.length > 0 && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        onClick: handleDeleteAllClick,
                                        className: "text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](TrashIcon, {
                                                className: "w-3.5 h-3.5"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                lineNumber: 237,
                                                columnNumber: 19
                                            }, this),
                                            " Delete all"
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                        lineNumber: 233,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 226,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                        lineNumber: 224,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "max-h-80 overflow-y-auto",
                        children: loading && notifications.length === 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "p-6 text-center",
                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 247,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                            lineNumber: 246,
                            columnNumber: 15
                        }, this) : notifications.length === 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "p-8 text-center",
                            children: [
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](BellOffIcon, {
                                    className: "w-8 h-8 text-gray-300 mx-auto mb-2"
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                    lineNumber: 251,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                    className: "text-sm text-gray-400",
                                    children: "No notifications yet."
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                    lineNumber: 252,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                            lineNumber: 250,
                            columnNumber: 15
                        }, this) : notifications.map((n)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: `w-full flex items-start gap-2 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!n.isRead ? 'bg-green-50/40' : ''}`,
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        type: "button",
                                        onClick: ()=>{
                                            if (!n.isRead) handleMarkRead(n._id || n.id);
                                        },
                                        className: "flex flex-1 items-start gap-3 min-w-0 text-left",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](NotificationTypeIcon, {
                                                type: n.type
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                lineNumber: 267,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "flex-1 min-w-0",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                        className: `text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`,
                                                        children: n.title
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                        lineNumber: 269,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                        className: "text-xs text-gray-500 mt-0.5 line-clamp-2",
                                                        children: n.message
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                        lineNumber: 272,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                        className: "text-[11px] text-gray-400 mt-1",
                                                        children: timeAgo(n.createdAt)
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                        lineNumber: 273,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                lineNumber: 268,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                        lineNumber: 262,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "flex items-start gap-1.5 mt-0.5 shrink-0",
                                        children: [
                                            !n.isRead && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                className: "mt-1.5 w-2 h-2 rounded-full bg-green-500 shrink-0"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                lineNumber: 278,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                                type: "button",
                                                onClick: ()=>handleDeleteClick(n),
                                                className: "w-7 h-7 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors",
                                                "aria-label": "Delete notification",
                                                title: "Delete notification",
                                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](TrashIcon, {
                                                    className: "w-3.5 h-3.5"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                    lineNumber: 287,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                lineNumber: 280,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                        lineNumber: 276,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, n._id || n.id, true, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 256,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                        lineNumber: 244,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "border-t border-gray-100 dark:border-slate-700 px-4 py-2.5 text-center",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                            onClick: ()=>{
                                setOpen(false);
                                setShowAllModal(true);
                            },
                            className: "text-xs text-green-600 hover:text-green-700 font-medium",
                            children: "View all notifications"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                            lineNumber: 297,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                        lineNumber: 296,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                lineNumber: 219,
                columnNumber: 9
            }, this),
            showAllModal && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createPortal"](/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "fixed inset-0 z-[210] flex items-center justify-center p-4",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "absolute inset-0 bg-black/50 backdrop-blur-sm",
                        onClick: ()=>setShowAllModal(false)
                    }, void 0, false, {
                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                        lineNumber: 312,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-gray-100",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center justify-between px-5 py-4 border-b border-gray-100",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                                className: "text-base font-semibold text-gray-900",
                                                children: "All notifications"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                lineNumber: 319,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                className: "text-xs text-gray-500 mt-0.5",
                                                children: [
                                                    allTotal,
                                                    " total",
                                                    unreadCount > 0 ? ` - ${unreadCount} unread` : ''
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                lineNumber: 320,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                        lineNumber: 318,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                            unreadCount > 0 && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                                onClick: handleMarkAllRead,
                                                className: "text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](CheckIcon, {
                                                        className: "w-3.5 h-3.5"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                        lineNumber: 330,
                                                        columnNumber: 21
                                                    }, this),
                                                    " Mark all read"
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                lineNumber: 326,
                                                columnNumber: 19
                                            }, this),
                                            allTotal > 0 && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                                onClick: handleDeleteAllClick,
                                                className: "text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](TrashIcon, {
                                                        className: "w-3.5 h-3.5"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                        lineNumber: 338,
                                                        columnNumber: 21
                                                    }, this),
                                                    " Delete all"
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                lineNumber: 334,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                                onClick: ()=>setShowAllModal(false),
                                                className: "w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors",
                                                "aria-label": "Close notifications",
                                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](CloseIcon, {
                                                    className: "w-4 h-4"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                    lineNumber: 346,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                lineNumber: 341,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                        lineNumber: 324,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 317,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "max-h-[calc(85vh-120px)] overflow-y-auto",
                                children: allLoading ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "p-8 text-center",
                                    children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                        lineNumber: 354,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                    lineNumber: 353,
                                    columnNumber: 17
                                }, this) : allNotifications.length === 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "p-10 text-center",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](BellOffIcon, {
                                            className: "w-8 h-8 text-gray-300 mx-auto mb-2"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                            lineNumber: 358,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                            className: "text-sm text-gray-400",
                                            children: "No notifications yet."
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                            lineNumber: 359,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                    lineNumber: 357,
                                    columnNumber: 17
                                }, this) : allNotifications.map((n)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: `w-full flex items-start gap-2 px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!n.isRead ? 'bg-green-50/40' : ''}`,
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                                type: "button",
                                                onClick: ()=>{
                                                    if (!n.isRead) handleMarkRead(n._id || n.id);
                                                },
                                                className: "flex flex-1 items-start gap-3 min-w-0 text-left",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](NotificationTypeIcon, {
                                                        type: n.type
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                        lineNumber: 374,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                        className: "flex-1 min-w-0",
                                                        children: [
                                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                                className: `text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`,
                                                                children: n.title
                                                            }, void 0, false, {
                                                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                                lineNumber: 376,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                                className: "text-xs text-gray-500 mt-0.5 line-clamp-2",
                                                                children: n.message
                                                            }, void 0, false, {
                                                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                                lineNumber: 379,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                                className: "text-[11px] text-gray-400 mt-1",
                                                                children: timeAgo(n.createdAt)
                                                            }, void 0, false, {
                                                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                                lineNumber: 380,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                        lineNumber: 375,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                lineNumber: 369,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "flex items-start gap-1.5 mt-0.5 shrink-0",
                                                children: [
                                                    !n.isRead && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                        className: "mt-1.5 w-2 h-2 rounded-full bg-green-500 shrink-0"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                        lineNumber: 385,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                                        type: "button",
                                                        onClick: ()=>handleDeleteClick(n),
                                                        className: "w-8 h-8 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors",
                                                        "aria-label": "Delete notification",
                                                        title: "Delete notification",
                                                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](TrashIcon, {
                                                            className: "w-4 h-4"
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                            lineNumber: 394,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                        lineNumber: 387,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                lineNumber: 383,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, n._id || n.id, true, {
                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                        lineNumber: 363,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 351,
                                columnNumber: 13
                            }, this),
                            !allLoading && allNotifications.length < allTotal && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "border-t border-gray-100 px-5 py-3 text-center",
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                    onClick: ()=>fetchAllNotifications(allNotifications.length, true),
                                    disabled: allLoadingMore,
                                    className: "text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50",
                                    children: allLoadingMore ? 'Loading...' : 'Load more'
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                    lineNumber: 404,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 403,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                        lineNumber: 316,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                lineNumber: 311,
                columnNumber: 9
            }, this), document.body),
            deleteTarget && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createPortal"](/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "fixed inset-0 z-[230] flex items-center justify-center p-4",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "absolute inset-0 bg-black/55 backdrop-blur-sm",
                        onClick: ()=>{
                            if (!deleting) setDeleteTarget(null);
                        }
                    }, void 0, false, {
                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                        lineNumber: 420,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "relative bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 p-6 animate-in fade-in zoom-in duration-200",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex justify-center mb-4",
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "w-12 h-12 rounded-full bg-red-50 flex items-center justify-center",
                                    children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](TrashIcon, {
                                        className: "w-6 h-6 text-red-500"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                        lineNumber: 427,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                    lineNumber: 426,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 425,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                className: "text-lg font-semibold text-gray-900 text-center",
                                children: deleteTarget === 'all' ? 'Delete all notifications?' : 'Delete notification?'
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 430,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                className: "mt-2 text-sm text-gray-500 text-center",
                                children: deleteTarget === 'all' ? 'This will permanently remove all notifications from your list.' : 'This notification will be permanently removed from your list.'
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 433,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "mt-6 flex gap-3",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        onClick: ()=>setDeleteTarget(null),
                                        disabled: deleting,
                                        className: "flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50",
                                        children: "Cancel"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                        lineNumber: 439,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        onClick: handleConfirmDelete,
                                        disabled: deleting,
                                        className: "flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2",
                                        children: deleting ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
                                                    className: "w-4 h-4 animate-spin",
                                                    viewBox: "0 0 24 24",
                                                    fill: "none",
                                                    children: [
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                                                            className: "opacity-25",
                                                            cx: "12",
                                                            cy: "12",
                                                            r: "10",
                                                            stroke: "currentColor",
                                                            strokeWidth: "4"
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                            lineNumber: 454,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                                                            className: "opacity-75",
                                                            fill: "currentColor",
                                                            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                            lineNumber: 455,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                    lineNumber: 453,
                                                    columnNumber: 21
                                                }, this),
                                                "Deleting..."
                                            ]
                                        }, void 0, true) : 'Delete'
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                        lineNumber: 446,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 438,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                        lineNumber: 424,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                lineNumber: 419,
                columnNumber: 9
            }, this), document.body)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 203,
        columnNumber: 5
    }, this);
}
function ProfileDropdown() {
    const { user, logout } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"]();
    const router = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"]();
    const [open, setOpen] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const [loggingOut, setLoggingOut] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const [showLogoutModal, setShowLogoutModal] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const btnRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"](null);
    const menuRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"](null);
    const [profileEmail, setProfileEmail] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]('');
    const displayName = user?.fullName || user?.username || 'User';
    const roleLabel = user?.role === 'SUPERADMIN' ? 'Superadmin' : 'LGU Staff';
    const initial = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        const ch = displayName.trim()[0];
        return ch ? ch.toUpperCase() : 'U';
    }, [
        displayName
    ]);
    // Fetch email from profile on mount (only when authenticated)
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        if (!user) return;
        __turbopack_require__("[project]/src/lib/api.ts [app-ssr] (ecmascript, loader)")(__turbopack_import__).then(({ profileApi })=>{
            profileApi.getProfile().then((res)=>{
                if (res.success && res.data?.email) {
                    setProfileEmail(res.data.email);
                }
            }).catch(()=>{});
        });
    }, [
        user
    ]);
    // Close on outside click / Esc
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        if (!open) return;
        const handler = (e)=>{
            if (menuRef.current && !menuRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const keyHandler = (e)=>{
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('keydown', keyHandler);
        return ()=>{
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('keydown', keyHandler);
        };
    }, [
        open
    ]);
    const handleLogout = async ()=>{
        setLoggingOut(true);
        try {
            await logout();
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].success('Logged out successfully');
            router.replace('/login');
        } catch  {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].error('Logout failed. Please try again.');
            setLoggingOut(false);
        }
    };
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "relative",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                ref: btnRef,
                onClick: ()=>setOpen(!open),
                className: "hidden md:flex shrink-0 items-center gap-3 bg-white dark:bg-slate-800 rounded-xl px-3 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.1)] hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-green-500",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "w-9 h-9 rounded-full bg-[#0F533A] flex items-center justify-center text-white font-bold text-sm",
                        children: initial
                    }, void 0, false, {
                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                        lineNumber: 544,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "text-left max-w-[160px]",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                className: "text-sm font-semibold text-gray-800 dark:text-gray-100 truncate whitespace-nowrap",
                                children: displayName
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 548,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                className: "text-[11px] text-gray-500 dark:text-gray-400 truncate whitespace-nowrap",
                                children: roleLabel
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 549,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                        lineNumber: 547,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                lineNumber: 539,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                onClick: ()=>setOpen(!open),
                className: "md:hidden w-10 h-10 rounded-full bg-[#0F533A] flex items-center justify-center text-white font-bold text-sm outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
                children: initial
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                lineNumber: 554,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                ref: menuRef,
                className: "absolute right-0 top-12 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-[100] overflow-hidden",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "px-4 py-3 border-b border-gray-100 dark:border-slate-700",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                className: "text-sm font-semibold text-gray-800 dark:text-gray-100",
                                children: displayName
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 568,
                                columnNumber: 13
                            }, this),
                            profileEmail && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                className: "text-xs text-green-600 truncate",
                                children: profileEmail
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 569,
                                columnNumber: 30
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                        lineNumber: 567,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "py-1",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](DropdownItem, {
                                icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](UserSmIcon, {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                    lineNumber: 575,
                                    columnNumber: 21
                                }, void 0),
                                label: "View Profile",
                                onClick: ()=>{
                                    setOpen(false);
                                    router.push('/settings?tab=account');
                                }
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 574,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](DropdownItem, {
                                icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](SettingsSmIcon, {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                    lineNumber: 580,
                                    columnNumber: 21
                                }, void 0),
                                label: "Settings",
                                onClick: ()=>{
                                    setOpen(false);
                                    router.push('/settings');
                                }
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 579,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](DropdownItem, {
                                icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](HelpSmIcon, {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                    lineNumber: 585,
                                    columnNumber: 21
                                }, void 0),
                                label: "Help",
                                onClick: ()=>{
                                    setOpen(false);
                                    router.push('/settings?tab=help');
                                }
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 584,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                        lineNumber: 573,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "border-t border-gray-100 dark:border-slate-700 py-1",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                            onClick: ()=>{
                                setOpen(false);
                                setShowLogoutModal(true);
                            },
                            disabled: loggingOut,
                            className: "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50",
                            children: [
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](LogoutSmIcon, {
                                    className: "w-4 h-4"
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                    lineNumber: 597,
                                    columnNumber: 15
                                }, this),
                                "Log out"
                            ]
                        }, void 0, true, {
                            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                            lineNumber: 592,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                        lineNumber: 591,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                lineNumber: 562,
                columnNumber: 9
            }, this),
            showLogoutModal && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createPortal"](/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "fixed inset-0 z-[200] flex items-center justify-center",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "absolute inset-0 bg-black/50 backdrop-blur-sm",
                        onClick: ()=>!loggingOut && setShowLogoutModal(false)
                    }, void 0, false, {
                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                        lineNumber: 607,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in duration-200",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex justify-center mb-4",
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "w-14 h-14 rounded-full bg-red-50 flex items-center justify-center",
                                    children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
                                        className: "w-7 h-7 text-red-500",
                                        fill: "none",
                                        stroke: "currentColor",
                                        viewBox: "0 0 24 24",
                                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: 2,
                                            d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                            lineNumber: 615,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                        lineNumber: 614,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                    lineNumber: 613,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 612,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                className: "text-lg font-semibold text-gray-900 text-center",
                                children: "Confirm Logout"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 619,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                className: "mt-2 text-sm text-gray-500 text-center",
                                children: "Are you sure you want to log out? You will need to sign in again to access the system."
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 620,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "mt-6 flex gap-3",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        onClick: ()=>setShowLogoutModal(false),
                                        disabled: loggingOut,
                                        className: "flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50",
                                        children: "Cancel"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                        lineNumber: 624,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        onClick: handleLogout,
                                        disabled: loggingOut,
                                        className: "flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2",
                                        children: loggingOut ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
                                                    className: "w-4 h-4 animate-spin",
                                                    viewBox: "0 0 24 24",
                                                    fill: "none",
                                                    children: [
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                                                            className: "opacity-25",
                                                            cx: "12",
                                                            cy: "12",
                                                            r: "10",
                                                            stroke: "currentColor",
                                                            strokeWidth: "4"
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                            lineNumber: 639,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                                                            className: "opacity-75",
                                                            fill: "currentColor",
                                                            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                            lineNumber: 640,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                                    lineNumber: 638,
                                                    columnNumber: 21
                                                }, this),
                                                "Logging out…"
                                            ]
                                        }, void 0, true) : 'Logout'
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                        lineNumber: 631,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                                lineNumber: 623,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                        lineNumber: 611,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                lineNumber: 606,
                columnNumber: 9
            }, this), document.body)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 538,
        columnNumber: 5
    }, this);
}
/* ================================================================== */ /*  Time Ago Helper                                                   */ /* ================================================================== */ function timeAgo(dateStr) {
    const now = Date.now();
    const d = new Date(dateStr).getTime();
    const diffMs = now - d;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(dateStr).toLocaleDateString();
}
/* ================================================================== */ /*  Notification Type Icon                                            */ /* ================================================================== */ function NotificationTypeIcon({ type }) {
    const base = 'w-9 h-9 rounded-xl flex items-center justify-center shrink-0';
    switch(type){
        case 'dispatch':
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                className: `${base} bg-blue-50`,
                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](TruckIcon, {
                    className: "w-4 h-4 text-blue-600"
                }, void 0, false, {
                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                    lineNumber: 683,
                    columnNumber: 53
                }, this)
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                lineNumber: 683,
                columnNumber: 14
            }, this);
        case 'status_update':
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                className: `${base} bg-amber-50`,
                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](AlertIcon, {
                    className: "w-4 h-4 text-amber-600"
                }, void 0, false, {
                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                    lineNumber: 685,
                    columnNumber: 54
                }, this)
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                lineNumber: 685,
                columnNumber: 14
            }, this);
        case 'volunteer':
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                className: `${base} bg-green-50`,
                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](UsersIcon, {
                    className: "w-4 h-4 text-green-600"
                }, void 0, false, {
                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                    lineNumber: 687,
                    columnNumber: 54
                }, this)
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                lineNumber: 687,
                columnNumber: 14
            }, this);
        case 'security':
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                className: `${base} bg-red-50`,
                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](ShieldIcon, {
                    className: "w-4 h-4 text-red-500"
                }, void 0, false, {
                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                    lineNumber: 689,
                    columnNumber: 52
                }, this)
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                lineNumber: 689,
                columnNumber: 14
            }, this);
        case 'system':
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                className: `${base} bg-gray-100`,
                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](InfoIcon, {
                    className: "w-4 h-4 text-gray-600"
                }, void 0, false, {
                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                    lineNumber: 691,
                    columnNumber: 54
                }, this)
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                lineNumber: 691,
                columnNumber: 14
            }, this);
        default:
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                className: `${base} bg-gray-100`,
                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](InfoIcon, {
                    className: "w-4 h-4 text-gray-500"
                }, void 0, false, {
                    fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                    lineNumber: 693,
                    columnNumber: 54
                }, this)
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                lineNumber: 693,
                columnNumber: 14
            }, this);
    }
}
/* ================================================================== */ /*  Dropdown Item                                                     */ /* ================================================================== */ function DropdownItem({ icon, label, onClick }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
        onClick: onClick,
        className: "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors",
        children: [
            icon,
            label
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 703,
        columnNumber: 5
    }, this);
}
/* ================================================================== */ /*  Icons                                                             */ /* ================================================================== */ function BellIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        }, void 0, false, {
            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
            lineNumber: 718,
            columnNumber: 91
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 718,
        columnNumber: 10
    }, this);
}
function BellOffIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        }, void 0, false, {
            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
            lineNumber: 722,
            columnNumber: 91
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 722,
        columnNumber: 10
    }, this);
}
function CheckIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M5 13l4 4L19 7"
        }, void 0, false, {
            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
            lineNumber: 726,
            columnNumber: 91
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 726,
        columnNumber: 10
    }, this);
}
function CloseIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M6 18L18 6M6 6l12 12"
        }, void 0, false, {
            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
            lineNumber: 730,
            columnNumber: 91
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 730,
        columnNumber: 10
    }, this);
}
function TrashIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"
        }, void 0, false, {
            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
            lineNumber: 734,
            columnNumber: 91
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 734,
        columnNumber: 10
    }, this);
}
function TruckIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        }, void 0, false, {
            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
            lineNumber: 738,
            columnNumber: 91
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 738,
        columnNumber: 10
    }, this);
}
function AlertIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
        }, void 0, false, {
            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
            lineNumber: 742,
            columnNumber: 91
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 742,
        columnNumber: 10
    }, this);
}
function UsersIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        }, void 0, false, {
            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
            lineNumber: 746,
            columnNumber: 91
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 746,
        columnNumber: 10
    }, this);
}
function ShieldIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        }, void 0, false, {
            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
            lineNumber: 750,
            columnNumber: 91
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 750,
        columnNumber: 10
    }, this);
}
function InfoIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        }, void 0, false, {
            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
            lineNumber: 754,
            columnNumber: 91
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 754,
        columnNumber: 10
    }, this);
}
function UserSmIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        }, void 0, false, {
            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
            lineNumber: 758,
            columnNumber: 91
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 758,
        columnNumber: 10
    }, this);
}
function SettingsSmIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                lineNumber: 762,
                columnNumber: 91
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
                lineNumber: 762,
                columnNumber: 648
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 762,
        columnNumber: 10
    }, this);
}
function HelpSmIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        }, void 0, false, {
            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
            lineNumber: 766,
            columnNumber: 91
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 766,
        columnNumber: 10
    }, this);
}
function LogoutSmIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        }, void 0, false, {
            fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
            lineNumber: 770,
            columnNumber: 91
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/HeaderWidgets.tsx>",
        lineNumber: 770,
        columnNumber: 10
    }, this);
}

})()),
"[project]/src/components/layout/Header.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>Header
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__Menu$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/menu.js [app-ssr] (ecmascript) {export default as Menu}");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/ui/sidebar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$HeaderWidgets$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/layout/HeaderWidgets.tsx [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
;
;
;
function Header({ title, subtitle }) {
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"]();
    const { toggleMobileSidebar } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSidebar"]();
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("header", {
        className: "sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-4 -mt-4 -mx-4 px-4 pt-4 sm:-mt-6 sm:-mx-6 sm:px-8 sm:pt-6 sm:pb-5 mb-6 sm:mb-8 border-b border-gray-200/75 dark:border-slate-800 transition-all",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
            className: "flex items-center justify-between gap-3",
            children: [
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "flex items-center gap-2.5 min-w-0",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                            type: "button",
                            onClick: toggleMobileSidebar,
                            "aria-label": "Open navigation menu",
                            className: "md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-95",
                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__Menu$7d$__["Menu"], {
                                className: "h-5 w-5"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/Header.tsx>",
                                lineNumber: 30,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "<[project]/src/components/layout/Header.tsx>",
                            lineNumber: 24,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "min-w-0",
                            children: [
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h1", {
                                    className: "text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate",
                                    children: title
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/layout/Header.tsx>",
                                    lineNumber: 34,
                                    columnNumber: 13
                                }, this),
                                subtitle && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                    className: "hidden md:block text-[12px] font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase mt-0.5",
                                    children: subtitle
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/layout/Header.tsx>",
                                    lineNumber: 38,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "<[project]/src/components/layout/Header.tsx>",
                            lineNumber: 33,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/layout/Header.tsx>",
                    lineNumber: 22,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "flex items-center justify-end gap-2.5 sm:gap-3 shrink-0",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$HeaderWidgets$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NotificationBell"], {}, void 0, false, {
                            fileName: "<[project]/src/components/layout/Header.tsx>",
                            lineNumber: 48,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$HeaderWidgets$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProfileDropdown"], {}, void 0, false, {
                            fileName: "<[project]/src/components/layout/Header.tsx>",
                            lineNumber: 51,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/layout/Header.tsx>",
                    lineNumber: 46,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "<[project]/src/components/layout/Header.tsx>",
            lineNumber: 20,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/Header.tsx>",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/layout/Header.tsx [app-ssr] (ecmascript) {export default as Header}": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "Header": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/layout/Header.tsx [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";

})()),
"[project]/src/components/ui/sidebar.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "Sidebar": ()=>Sidebar,
    "SidebarInset": ()=>SidebarInset,
    "SidebarProvider": ()=>SidebarProvider,
    "SidebarTrigger": ()=>SidebarTrigger,
    "useSidebar": ()=>useSidebar
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$panel$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__PanelLeft$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/panel-left.js [app-ssr] (ecmascript) {export default as PanelLeft}");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
;
;
const SidebarContext = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.createContext(null);
function useSidebar() {
    const context = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider.');
    }
    return context;
}
function SidebarProvider({ children, defaultOpen = true }) {
    const [open, setOpen] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.useState(defaultOpen);
    const [mobileOpen, setMobileOpen] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.useState(false);
    const toggleSidebar = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.useCallback(()=>setOpen((prev)=>!prev), []);
    const toggleMobileSidebar = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.useCallback(()=>setMobileOpen((prev)=>!prev), []);
    // Close mobile sidebar on window resize to desktop
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.useEffect(()=>{
        const handleResize = ()=>{
            if (window.innerWidth >= 768) {
                setMobileOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return ()=>window.removeEventListener('resize', handleResize);
    }, []);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](SidebarContext.Provider, {
        value: {
            open,
            setOpen,
            toggleSidebar,
            mobileOpen,
            setMobileOpen,
            toggleMobileSidebar
        },
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
            className: "group/sidebar-wrapper flex min-h-screen w-full bg-background relative",
            children: children
        }, void 0, false, {
            fileName: "<[project]/src/components/ui/sidebar.tsx>",
            lineNumber: 61,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/ui/sidebar.tsx>",
        lineNumber: 51,
        columnNumber: 5
    }, this);
}
function Sidebar({ className, children }) {
    const { open, mobileOpen, setMobileOpen } = useSidebar();
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            mobileOpen && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200",
                onClick: ()=>setMobileOpen(false),
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "<[project]/src/components/ui/sidebar.tsx>",
                lineNumber: 79,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("aside", {
                "data-mobile-state": mobileOpen ? 'open' : 'closed',
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]('fixed inset-y-0 left-0 z-50 flex flex-col w-72 max-w-[85vw] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sidebar-foreground shadow-2xl transition-transform duration-300 ease-in-out md:hidden', mobileOpen ? 'translate-x-0' : '-translate-x-full', className),
                children: children
            }, void 0, false, {
                fileName: "<[project]/src/components/ui/sidebar.tsx>",
                lineNumber: 87,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("aside", {
                "data-state": open ? 'expanded' : 'collapsed',
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]('fixed inset-y-0 left-0 z-40 hidden overflow-visible border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out md:flex md:flex-col', open ? 'w-56' : 'w-16', className),
                children: children
            }, void 0, false, {
                fileName: "<[project]/src/components/ui/sidebar.tsx>",
                lineNumber: 99,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
function SidebarInset({ className, children }) {
    const { open } = useSidebar();
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("main", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]('flex flex-1 flex-col min-h-screen transition-[margin-left] duration-200 ease-in-out md:ml-16 min-w-0', open && 'md:ml-56', className),
        children: children
    }, void 0, false, {
        fileName: "<[project]/src/components/ui/sidebar.tsx>",
        lineNumber: 122,
        columnNumber: 5
    }, this);
}
function SidebarTrigger({ className, ...props }) {
    const { toggleSidebar } = useSidebar();
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
        type: "button",
        onClick: toggleSidebar,
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]('inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground', className),
        ...props,
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$panel$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__PanelLeft$7d$__["PanelLeft"], {
                className: "h-4 w-4"
            }, void 0, false, {
                fileName: "<[project]/src/components/ui/sidebar.tsx>",
                lineNumber: 149,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                className: "sr-only",
                children: "Toggle Sidebar"
            }, void 0, false, {
                fileName: "<[project]/src/components/ui/sidebar.tsx>",
                lineNumber: 150,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/ui/sidebar.tsx>",
        lineNumber: 140,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/app-sidebar.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "AppSidebar": ()=>AppSidebar
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__ChevronLeft$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-ssr] (ecmascript) {export default as ChevronLeft}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__ChevronRight$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-ssr] (ecmascript) {export default as ChevronRight}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__LayoutDashboard$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/layout-dashboard.js [app-ssr] (ecmascript) {export default as LayoutDashboard}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__Users$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-ssr] (ecmascript) {export default as Users}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__UserCheck$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/user-check.js [app-ssr] (ecmascript) {export default as UserCheck}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__ShieldCheck$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/shield-check.js [app-ssr] (ecmascript) {export default as ShieldCheck}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__UserPlus$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/user-plus.js [app-ssr] (ecmascript) {export default as UserPlus}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__House$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/house.js [app-ssr] (ecmascript) {export default as House}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__ArrowLeftRight$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left-right.js [app-ssr] (ecmascript) {export default as ArrowLeftRight}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$no$2d$axes$2d$combined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__ChartNoAxesCombined$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/chart-no-axes-combined.js [app-ssr] (ecmascript) {export default as ChartNoAxesCombined}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__FileText$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/file-text.js [app-ssr] (ecmascript) {export default as FileText}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__Settings$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-ssr] (ecmascript) {export default as Settings}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__LogOut$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/log-out.js [app-ssr] (ecmascript) {export default as LogOut}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__Activity$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/activity.js [app-ssr] (ecmascript) {export default as Activity}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__X$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-ssr] (ecmascript) {export default as X}");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/toast.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/ui/sidebar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
;
;
;
;
;
;
;
;
;
const mainNavItems = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__LayoutDashboard$7d$__["LayoutDashboard"],
        superadminOnly: false
    },
    {
        name: 'Manage Users',
        href: '/users',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__Users$7d$__["Users"],
        superadminOnly: true
    },
    {
        name: 'Resident Registration',
        href: '/resident-registration',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__UserPlus$7d$__["UserPlus"],
        superadminOnly: true
    },
    {
        name: 'Verified Residents',
        href: '/verified-residents',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__UserCheck$7d$__["UserCheck"],
        superadminOnly: true
    },
    {
        name: 'Code Generation',
        href: '/code-generation',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__ShieldCheck$7d$__["ShieldCheck"],
        superadminOnly: true
    },
    {
        name: 'Relief Registry',
        href: '/households',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__House$7d$__["House"],
        superadminOnly: false
    },
    {
        name: 'Distribution',
        href: '/distribution',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__ArrowLeftRight$7d$__["ArrowLeftRight"],
        superadminOnly: false
    },
    {
        name: 'Target Beneficiaries',
        href: '/target-beneficiaries',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__FileText$7d$__["FileText"],
        superadminOnly: false
    },
    {
        name: 'Reports',
        href: '/reports',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$no$2d$axes$2d$combined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__ChartNoAxesCombined$7d$__["ChartNoAxesCombined"],
        superadminOnly: false
    },
    {
        name: 'Audit Logs',
        href: '/audit-logs',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__Activity$7d$__["Activity"],
        superadminOnly: true
    }
];
function AppSidebar() {
    const pathname = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"]();
    const router = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"]();
    const { logout, isSuperadmin } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"]();
    const { open, toggleSidebar, mobileOpen, setMobileOpen } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSidebar"]();
    const [showLogoutModal, setShowLogoutModal] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const [loggingOut, setLoggingOut] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const handleLogout = async ()=>{
        setLoggingOut(true);
        try {
            await logout();
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].info('Signing out...');
            await new Promise((r)=>setTimeout(r, 400));
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].success('Logged out successfully.');
            router.replace('/login');
        } catch  {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].error('Logout failed. Please try again.');
            setLoggingOut(false);
        }
    };
    // On mobile drawer, content is always expanded
    const isExpanded = open || mobileOpen;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sidebar"], {
        className: "bg-white border-r border-slate-200 dark:border-slate-800 dark:bg-slate-900 z-50 transition-colors",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                type: "button",
                onClick: toggleSidebar,
                "aria-label": open ? 'Collapse sidebar' : 'Expand sidebar',
                title: open ? 'Collapse sidebar' : 'Expand sidebar',
                className: "hidden md:inline-flex absolute right-0 top-6 z-50 h-6 w-6 translate-x-[50%] cursor-pointer items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
                children: open ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__ChevronLeft$7d$__["ChevronLeft"], {
                    className: "h-3.5 w-3.5"
                }, void 0, false, {
                    fileName: "<[project]/src/components/app-sidebar.tsx>",
                    lineNumber: 78,
                    columnNumber: 17
                }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__ChevronRight$7d$__["ChevronRight"], {
                    className: "h-3.5 w-3.5"
                }, void 0, false, {
                    fileName: "<[project]/src/components/app-sidebar.tsx>",
                    lineNumber: 78,
                    columnNumber: 59
                }, this)
            }, void 0, false, {
                fileName: "<[project]/src/components/app-sidebar.tsx>",
                lineNumber: 71,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex items-center",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "flex w-8 shrink-0 items-center justify-center",
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    src: "/images/Logo1.png",
                                    alt: "Kapit Bisig Logo",
                                    width: 30,
                                    height: 30,
                                    priority: true,
                                    className: "object-contain drop-shadow-sm",
                                    style: {
                                        width: 'auto',
                                        height: 'auto'
                                    }
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/app-sidebar.tsx>",
                                    lineNumber: 85,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/app-sidebar.tsx>",
                                lineNumber: 84,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                "aria-hidden": !isExpanded,
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]('overflow-hidden whitespace-nowrap text-[16px] font-extrabold tracking-tight text-[#004A1C] dark:text-white transition-all duration-300', isExpanded ? 'max-w-[160px] opacity-100 translate-x-0 ml-3' : 'max-w-0 opacity-0 -translate-x-4 ml-0'),
                                children: "Kapit Bisig"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/app-sidebar.tsx>",
                                lineNumber: 95,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/app-sidebar.tsx>",
                        lineNumber: 83,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                        type: "button",
                        onClick: ()=>setMobileOpen(false),
                        className: "md:hidden inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors",
                        "aria-label": "Close navigation menu",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__X$7d$__["X"], {
                            className: "h-5 w-5"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/app-sidebar.tsx>",
                            lineNumber: 113,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/components/app-sidebar.tsx>",
                        lineNumber: 107,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/app-sidebar.tsx>",
                lineNumber: 82,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("nav", {
                className: "relative z-10 flex-1 space-y-6 px-3 py-4 overflow-y-auto overflow-x-hidden",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]("mb-2 px-2 text-[10px] font-bold tracking-widest text-[#004A1C]/50 dark:text-gray-400 uppercase transition-all duration-300", isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden mb-0"),
                                children: "Main Menu"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/app-sidebar.tsx>",
                                lineNumber: 120,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "space-y-1",
                                children: mainNavItems.filter((item)=>!item.superadminOnly).map((item)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](NavItem, {
                                        href: item.href,
                                        icon: item.icon,
                                        isActive: pathname === item.href,
                                        isOpen: isExpanded,
                                        onClick: ()=>setMobileOpen(false),
                                        children: item.name
                                    }, item.name, false, {
                                        fileName: "<[project]/src/components/app-sidebar.tsx>",
                                        lineNumber: 127,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "<[project]/src/components/app-sidebar.tsx>",
                                lineNumber: 123,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/app-sidebar.tsx>",
                        lineNumber: 119,
                        columnNumber: 9
                    }, this),
                    isSuperadmin && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]("mb-2 px-2 text-[10px] font-bold tracking-widest text-[#004A1C]/50 dark:text-gray-400 uppercase transition-all duration-300", isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden mb-0"),
                                children: "Administration"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/app-sidebar.tsx>",
                                lineNumber: 143,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "space-y-1",
                                children: mainNavItems.filter((item)=>item.superadminOnly).map((item)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](NavItem, {
                                        href: item.href,
                                        icon: item.icon,
                                        isActive: pathname === item.href,
                                        isOpen: isExpanded,
                                        onClick: ()=>setMobileOpen(false),
                                        children: item.name
                                    }, item.name, false, {
                                        fileName: "<[project]/src/components/app-sidebar.tsx>",
                                        lineNumber: 150,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "<[project]/src/components/app-sidebar.tsx>",
                                lineNumber: 146,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/app-sidebar.tsx>",
                        lineNumber: 142,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/app-sidebar.tsx>",
                lineNumber: 118,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "relative z-10 space-y-1 border-t border-slate-100 dark:border-slate-800 px-2 py-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](NavItem, {
                        href: "/settings",
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__Settings$7d$__["Settings"],
                        isActive: pathname === '/settings',
                        isOpen: isExpanded,
                        onClick: ()=>setMobileOpen(false),
                        children: "Settings"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/app-sidebar.tsx>",
                        lineNumber: 168,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                        onClick: ()=>{
                            setMobileOpen(false);
                            setShowLogoutModal(true);
                        },
                        title: !isExpanded ? 'Logout' : undefined,
                        className: "w-full group relative flex items-center rounded-xl py-2 pr-2 text-slate-500 dark:text-slate-400 transition-all duration-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 overflow-hidden border-l-[3px] border-transparent hover:border-red-500",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "flex w-12 shrink-0 items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110",
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__LogOut$7d$__["LogOut"], {
                                    className: "h-4 w-4"
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/app-sidebar.tsx>",
                                    lineNumber: 187,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/app-sidebar.tsx>",
                                lineNumber: 186,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                "aria-hidden": !isExpanded,
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]('overflow-hidden whitespace-nowrap text-xs transition-[max-width,opacity,transform] duration-200', isExpanded ? 'max-w-[220px] opacity-100 translate-x-0' : 'max-w-0 opacity-0 -translate-x-2'),
                                children: "Logout"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/app-sidebar.tsx>",
                                lineNumber: 189,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/app-sidebar.tsx>",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/app-sidebar.tsx>",
                lineNumber: 167,
                columnNumber: 7
            }, this),
            showLogoutModal && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$dom$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createPortal"](/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "fixed inset-0 z-[9999] flex items-center justify-center",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity",
                        onClick: ()=>!loggingOut && setShowLogoutModal(false)
                    }, void 0, false, {
                        fileName: "<[project]/src/components/app-sidebar.tsx>",
                        lineNumber: 204,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "relative mx-4 w-full max-w-sm rounded-[24px] bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "mb-4 flex justify-center",
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 shadow-inner",
                                    children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__LogOut$7d$__["LogOut"], {
                                        className: "h-7 w-7"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/app-sidebar.tsx>",
                                        lineNumber: 211,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/app-sidebar.tsx>",
                                    lineNumber: 210,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/app-sidebar.tsx>",
                                lineNumber: 209,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                className: "text-center text-xl font-bold text-slate-900 dark:text-white tracking-tight",
                                children: "Confirm Logout"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/app-sidebar.tsx>",
                                lineNumber: 214,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                className: "mt-2 text-center text-sm text-slate-500 dark:text-slate-400 leading-relaxed",
                                children: "Are you sure you want to log out? You will need to sign in again to access the system."
                            }, void 0, false, {
                                fileName: "<[project]/src/components/app-sidebar.tsx>",
                                lineNumber: 215,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "mt-8 flex gap-3",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        onClick: ()=>setShowLogoutModal(false),
                                        disabled: loggingOut,
                                        className: "flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50",
                                        children: "Cancel"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/app-sidebar.tsx>",
                                        lineNumber: 219,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        onClick: handleLogout,
                                        disabled: loggingOut,
                                        className: "flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-red-500/20 transition-all hover:bg-red-600 hover:shadow-lg hover:shadow-red-600/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0",
                                        children: loggingOut ? 'Logging out...' : 'Logout'
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/app-sidebar.tsx>",
                                        lineNumber: 226,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/app-sidebar.tsx>",
                                lineNumber: 218,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/app-sidebar.tsx>",
                        lineNumber: 208,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/app-sidebar.tsx>",
                lineNumber: 203,
                columnNumber: 11
            }, this), document.body)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/app-sidebar.tsx>",
        lineNumber: 69,
        columnNumber: 5
    }, this);
}
function NavItem({ href, icon: Icon, isActive, isOpen, onClick, children }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        href: href,
        onClick: onClick,
        title: !isOpen ? String(children) : undefined,
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]('group relative flex items-center rounded-xl py-2.5 pr-2 mb-1 transition-all duration-300 ease-out overflow-hidden', isActive ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-[#004A1C] dark:text-[#ECC323]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-[#004A1C] dark:hover:text-[#ECC323]'),
        children: [
            isActive && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "absolute left-0 top-1/2 h-3/4 w-[4px] -translate-y-1/2 rounded-full bg-[#ECC323] shadow-sm"
            }, void 0, false, {
                fileName: "<[project]/src/components/app-sidebar.tsx>",
                lineNumber: 270,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                className: "relative z-10 flex w-12 shrink-0 items-center justify-center transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:text-[#ECC323]",
                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](Icon, {
                    className: "h-4 w-4"
                }, void 0, false, {
                    fileName: "<[project]/src/components/app-sidebar.tsx>",
                    lineNumber: 273,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "<[project]/src/components/app-sidebar.tsx>",
                lineNumber: 272,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                "aria-hidden": !isOpen,
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"]('relative z-10 overflow-hidden whitespace-nowrap text-[13px] transition-[max-width,opacity,transform] duration-200', isOpen ? 'max-w-[220px] opacity-100 translate-x-0' : 'max-w-0 opacity-0 -translate-x-2'),
                children: children
            }, void 0, false, {
                fileName: "<[project]/src/components/app-sidebar.tsx>",
                lineNumber: 275,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/app-sidebar.tsx>",
        lineNumber: 258,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/ui/PasswordStrengthMeter.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>PasswordStrengthMeter,
    "getPasswordStrength": ()=>getPasswordStrength,
    "validateStrongPassword": ()=>validateStrongPassword
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
/**
 * Common weak patterns — must match backend passwordValidator.ts
 */ const COMMON_WEAK_PATTERNS = [
    'password',
    'admin',
    '123456',
    'qwerty',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'master',
    'login',
    'superadmin',
    'super',
    'abc123',
    'trustno1',
    'iloveyou',
    'sunshine',
    'princess',
    'football',
    'shadow',
    'passw0rd',
    'kapitbisig',
    'changeme',
    '12345678',
    '123456789'
];
function getPasswordStrength(password) {
    if (!password) return '';
    const lower = password.toLowerCase();
    if (COMMON_WEAK_PATTERNS.some((p)=>lower.includes(p))) return 'weak';
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{}|;':",./<>?`~\\]/.test(password)) score++;
    if (score >= 6) return 'strong';
    if (score >= 4) return 'medium';
    return 'weak';
}
function validateStrongPassword(password) {
    const errors = [];
    if (/\s/.test(password)) {
        errors.push('Password must not contain spaces or whitespace');
    }
    const lower = password.toLowerCase();
    if (COMMON_WEAK_PATTERNS.some((p)=>lower.includes(p))) {
        errors.push('Password contains a common or guessable pattern');
    }
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>\-_=+\\[\]~/`]/.test(password)) {
        errors.push('Must contain at least one special character');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
function PasswordStrengthMeter({ password }) {
    const strength = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>getPasswordStrength(password), [
        password
    ]);
    if (!password) return null;
    const colorClass = strength === 'weak' ? 'bg-red-500' : strength === 'medium' ? 'bg-yellow-500' : strength === 'strong' ? 'bg-green-500' : 'bg-gray-200';
    const widthClass = strength === 'weak' ? 'w-1/3' : strength === 'medium' ? 'w-2/3' : strength === 'strong' ? 'w-full' : 'w-0';
    const textClass = strength === 'weak' ? 'text-red-500' : strength === 'medium' ? 'text-yellow-600' : strength === 'strong' ? 'text-green-600' : 'text-gray-400';
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "mt-2",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "h-1 bg-gray-200 rounded-full overflow-hidden",
                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: `h-full ${colorClass} ${widthClass} transition-all duration-300`
                }, void 0, false, {
                    fileName: "<[project]/src/components/ui/PasswordStrengthMeter.tsx>",
                    lineNumber: 113,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "<[project]/src/components/ui/PasswordStrengthMeter.tsx>",
                lineNumber: 112,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                className: `mt-1 text-xs ${textClass}`,
                children: [
                    "Password strength: ",
                    strength || 'none',
                    strength === 'weak' && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "ml-1",
                        children: "— too weak to submit"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/ui/PasswordStrengthMeter.tsx>",
                        lineNumber: 118,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/ui/PasswordStrengthMeter.tsx>",
                lineNumber: 115,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/ui/PasswordStrengthMeter.tsx>",
        lineNumber: 111,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/layout/ProtectedRoute.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>ProtectedRoute
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/toast.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$PasswordStrengthMeter$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/ui/PasswordStrengthMeter.tsx [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
;
;
;
;
function ProtectedRoute({ children }) {
    const { user, loading, setInitialPassword } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"]();
    const router = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"]();
    const [newPassword, setNewPassword] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]('');
    const [confirmPassword, setConfirmPassword] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]('');
    const [showNew, setShowNew] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const [showConfirm, setShowConfirm] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const [saving, setSaving] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [
        loading,
        user,
        router
    ]);
    const strength = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$PasswordStrengthMeter$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPasswordStrength"](newPassword), [
        newPassword
    ]);
    const forcePasswordReset = !!user?.forcePasswordReset;
    const handleSetPassword = async ()=>{
        if (!newPassword || !confirmPassword) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].error('All password fields are required');
            return;
        }
        if (/\s/.test(newPassword)) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].error('Password must not contain whitespace');
            return;
        }
        if (newPassword !== confirmPassword) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].error('Passwords do not match');
            return;
        }
        const result = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$PasswordStrengthMeter$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateStrongPassword"](newPassword);
        if (!result.isValid) {
            result.errors.forEach((e)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].error(e));
            return;
        }
        if (strength === 'weak') {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].error('Password is too weak. Please choose a stronger password.');
            return;
        }
        setSaving(true);
        try {
            await setInitialPassword(newPassword);
            setNewPassword('');
            setConfirmPassword('');
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].success('Password set successfully');
        } catch (err) {
            console.error('Set password failed:', err);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].error('Failed to set password. Please try again.');
        } finally{
            setSaving(false);
        }
    };
    if (loading) {
        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
            className: "min-h-screen flex items-center justify-center bg-gray-100",
            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex items-center gap-3 text-gray-500",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
                        className: "animate-spin h-5 w-5",
                        fill: "none",
                        viewBox: "0 0 24 24",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                                className: "opacity-25",
                                cx: "12",
                                cy: "12",
                                r: "10",
                                stroke: "currentColor",
                                strokeWidth: "4"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                lineNumber: 81,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                                className: "opacity-75",
                                fill: "currentColor",
                                d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                lineNumber: 82,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                        lineNumber: 80,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "text-sm",
                        children: "Loading..."
                    }, void 0, false, {
                        fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                        lineNumber: 84,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                lineNumber: 79,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
            lineNumber: 78,
            columnNumber: 7
        }, this);
    }
    if (!user) return null;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            children,
            forcePasswordReset && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "fixed inset-0 z-[200] flex items-center justify-center p-4",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "absolute inset-0 bg-black/50 backdrop-blur-sm"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                        lineNumber: 98,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h2", {
                                className: "text-xl font-bold text-gray-900",
                                children: "Set Your Password"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                lineNumber: 101,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                className: "text-sm text-gray-500 mt-1",
                                children: "You must set a password before accessing the dashboard."
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                lineNumber: 102,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "mt-6 space-y-4",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("label", {
                                                className: "block text-sm font-medium text-gray-700 mb-1.5",
                                                children: [
                                                    "New Password",
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                        className: "text-gray-400 font-normal ml-1 text-xs",
                                                        children: "(Min. 8 chars, upper/lower/number/symbol)"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                                        lineNumber: 110,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                                lineNumber: 108,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "relative",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("input", {
                                                        type: showNew ? 'text' : 'password',
                                                        value: newPassword,
                                                        onChange: (e)=>setNewPassword(e.target.value.replace(/\s/g, '')),
                                                        disabled: saving,
                                                        className: "w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                                        lineNumber: 113,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                                        type: "button",
                                                        onClick: ()=>setShowNew((v)=>!v),
                                                        className: "absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600",
                                                        children: showNew ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](EyeOffIcon, {
                                                            className: "w-4 h-4"
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                                            lineNumber: 125,
                                                            columnNumber: 32
                                                        }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](EyeIcon, {
                                                            className: "w-4 h-4"
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                                            lineNumber: 125,
                                                            columnNumber: 69
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                                        lineNumber: 120,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                                lineNumber: 112,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$PasswordStrengthMeter$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                password: newPassword
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                                lineNumber: 128,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                        lineNumber: 107,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("label", {
                                                className: "block text-sm font-medium text-gray-700 mb-1.5",
                                                children: "Confirm Password"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                                lineNumber: 132,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "relative",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("input", {
                                                        type: showConfirm ? 'text' : 'password',
                                                        value: confirmPassword,
                                                        onChange: (e)=>setConfirmPassword(e.target.value.replace(/\s/g, '')),
                                                        disabled: saving,
                                                        className: "w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                                        lineNumber: 134,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                                        type: "button",
                                                        onClick: ()=>setShowConfirm((v)=>!v),
                                                        className: "absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600",
                                                        children: showConfirm ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](EyeOffIcon, {
                                                            className: "w-4 h-4"
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                                            lineNumber: 146,
                                                            columnNumber: 36
                                                        }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](EyeIcon, {
                                                            className: "w-4 h-4"
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                                            lineNumber: 146,
                                                            columnNumber: 73
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                                        lineNumber: 141,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                                lineNumber: 133,
                                                columnNumber: 17
                                            }, this),
                                            confirmPassword && confirmPassword !== newPassword && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                className: "text-sm text-red-500 mt-1",
                                                children: "Passwords do not match"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                                lineNumber: 150,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                        lineNumber: 131,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                lineNumber: 106,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex justify-end mt-6",
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                    type: "button",
                                    onClick: handleSetPassword,
                                    disabled: saving,
                                    className: "inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#0F533A] rounded-xl hover:bg-[#0a3f2c] transition-colors disabled:opacity-50",
                                    children: saving ? 'Saving...' : 'Set Password'
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                    lineNumber: 156,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                                lineNumber: 155,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                        lineNumber: 100,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                lineNumber: 97,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true);
}
function EyeIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                lineNumber: 175,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
                lineNumber: 176,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
        lineNumber: 174,
        columnNumber: 5
    }, this);
}
function EyeOffIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
        }, void 0, false, {
            fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
            lineNumber: 184,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/ProtectedRoute.tsx>",
        lineNumber: 183,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/layout/DashboardLayout.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>DashboardLayout
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$ProtectedRoute$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/layout/ProtectedRoute.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$app$2d$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/app-sidebar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/ui/sidebar.tsx [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
;
;
function DashboardLayout({ children }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$ProtectedRoute$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarProvider"], {
            children: [
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$app$2d$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AppSidebar"], {}, void 0, false, {
                    fileName: "<[project]/src/components/layout/DashboardLayout.tsx>",
                    lineNumber: 16,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SidebarInset"], {
                    className: "bg-slate-50 dark:bg-slate-900 p-4 sm:p-6",
                    children: children
                }, void 0, false, {
                    fileName: "<[project]/src/components/layout/DashboardLayout.tsx>",
                    lineNumber: 17,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "<[project]/src/components/layout/DashboardLayout.tsx>",
            lineNumber: 15,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/DashboardLayout.tsx>",
        lineNumber: 14,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/layout/DashboardLayout.tsx [app-ssr] (ecmascript) {export default as DashboardLayout}": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "DashboardLayout": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$DashboardLayout$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$DashboardLayout$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/layout/DashboardLayout.tsx [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";

})()),
"[project]/src/components/layout/index.ts [app-ssr] (ecmascript) {locals}": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({});
;
;
;
;
;

})()),
"[project]/src/components/layout/StaffLayout.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>StaffLayout
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$ProtectedRoute$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/layout/ProtectedRoute.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$grid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__LayoutGrid$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/layout-grid.js [app-ssr] (ecmascript) {export default as LayoutGrid}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__Users$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-ssr] (ecmascript) {export default as Users}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$box$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__Box$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/box.js [app-ssr] (ecmascript) {export default as Box}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__AlertTriangle$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-ssr] (ecmascript) {export default as AlertTriangle}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__Settings$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-ssr] (ecmascript) {export default as Settings}");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__LogOut$7d$__ = __turbopack_import__("[project]/node_modules/lucide-react/dist/esm/icons/log-out.js [app-ssr] (ecmascript) {export default as LogOut}");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
;
;
;
// Sub-component: The dark command control rail
const StaffNavigationRail = ()=>{
    const links = [
        {
            href: '/dashboard',
            icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$grid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__LayoutGrid$7d$__["LayoutGrid"], {
                size: 22
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                lineNumber: 11,
                columnNumber: 33
            }, this),
            label: 'Dashboard',
            active: true
        },
        {
            href: '/households',
            icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__Users$7d$__["Users"], {
                size: 22
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                lineNumber: 12,
                columnNumber: 34
            }, this),
            label: 'Households'
        },
        {
            href: '/distribution',
            icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$box$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__Box$7d$__["Box"], {
                size: 22
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                lineNumber: 13,
                columnNumber: 36
            }, this),
            label: 'Distribution'
        },
        {
            href: '/target-beneficiaries',
            icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__AlertTriangle$7d$__["AlertTriangle"], {
                size: 22
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                lineNumber: 14,
                columnNumber: 44
            }, this),
            label: 'Beneficiaries'
        }
    ];
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "w-[72px] shrink-0 bg-slate-950 dark:bg-black h-screen flex flex-col items-center py-6 border-r border-slate-800 z-20 sticky top-0 no-bg-transition",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mb-10 w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg cursor-pointer hover:bg-emerald-500 transition-colors",
                children: "KB"
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                lineNumber: 20,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("nav", {
                className: "flex flex-col gap-6 w-full items-center",
                children: links.map((link, idx)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: link.href,
                        title: link.label,
                        className: `w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-200 ${link.active ? 'bg-white/10 text-white border border-white/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`,
                        children: link.icon
                    }, idx, false, {
                        fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                        lineNumber: 27,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mt-auto flex flex-col gap-6 w-full items-center",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                        title: "Settings",
                        className: "w-12 h-12 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-xl transition-all",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__Settings$7d$__["Settings"], {
                            size: 22
                        }, void 0, false, {
                            fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                            lineNumber: 45,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                        title: "Sign Out",
                        className: "w-12 h-12 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__LogOut$7d$__["LogOut"], {
                            size: 22
                        }, void 0, false, {
                            fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                            lineNumber: 48,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                        lineNumber: 47,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                lineNumber: 43,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
        lineNumber: 18,
        columnNumber: 5
    }, this);
};
// Sub-component: Industrial Top Bar
const StaffTopBar = ()=>{
    const [time, setTime] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]('--:--:--');
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        const updateTime = ()=>{
            setTime(new Date().toLocaleTimeString('en-US', {
                hour12: false
            }));
        };
        updateTime();
        const intv = setInterval(updateTime, 1000);
        return ()=>clearInterval(intv);
    }, []);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("header", {
        className: "h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-10 sticky top-0 w-full text-slate-300 text-sm font-mono tracking-tight",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex items-center gap-4",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                                lineNumber: 72,
                                columnNumber: 11
                            }, this),
                            "SYSTEM.ONLINE"
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                        lineNumber: 71,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "text-slate-600",
                        children: "|"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                        lineNumber: 75,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        children: "AUTH: STAFF_SECURE"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                        lineNumber: 76,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                lineNumber: 70,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex items-center gap-6",
                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "flex items-center gap-2 font-bold text-slate-200",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                            className: "text-slate-500 font-normal",
                            children: "UTC"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                            lineNumber: 80,
                            columnNumber: 11
                        }, this),
                        time
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                    lineNumber: 79,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                lineNumber: 78,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
        lineNumber: 69,
        columnNumber: 5
    }, this);
};
function StaffLayout({ children }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$ProtectedRoute$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
            className: "min-h-screen w-full flex bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden",
            children: [
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](StaffNavigationRail, {}, void 0, false, {
                    fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                    lineNumber: 97,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "flex-1 flex flex-col h-screen overflow-hidden relative",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](StaffTopBar, {}, void 0, false, {
                            fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                            lineNumber: 101,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("main", {
                            className: "flex-1 overflow-y-auto w-full no-scrollbar relative debug-screens",
                            children: children
                        }, void 0, false, {
                            fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                            lineNumber: 104,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
                    lineNumber: 100,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
            lineNumber: 95,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/layout/StaffLayout.tsx>",
        lineNumber: 94,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/layout/index.ts [app-ssr] (ecmascript) {module evaluation}": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/layout/Header.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$DashboardLayout$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/layout/DashboardLayout.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$ProtectedRoute$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/layout/ProtectedRoute.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$HeaderWidgets$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/layout/HeaderWidgets.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$StaffLayout$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/layout/StaffLayout.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$locals$7d$__ = __turbopack_import__("[project]/src/components/layout/index.ts [app-ssr] (ecmascript) {locals}");
"__TURBOPACK__ecmascript__hoisting__location__";

})()),
"[project]/src/app/dashboard/page.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>DashboardPage
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$module__evaluation$7d$__ = __turbopack_import__("[project]/src/components/layout/index.ts [app-ssr] (ecmascript) {module evaluation}");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$DashboardLayout$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__DashboardLayout$7d$__ = __turbopack_import__("[project]/src/components/layout/DashboardLayout.tsx [app-ssr] (ecmascript) {export default as DashboardLayout}");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__Header$7d$__ = __turbopack_import__("[project]/src/components/layout/Header.tsx [app-ssr] (ecmascript) {export default as Header}");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$module__evaluation$7d$__ = __turbopack_import__("[project]/src/components/dashboard/index.ts [app-ssr] (ecmascript) {module evaluation}");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$LowStockAlert$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__LowStockAlert$7d$__ = __turbopack_import__("[project]/src/components/dashboard/LowStockAlert.tsx [app-ssr] (ecmascript) {export default as LowStockAlert}");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$QuickActions$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__QuickActions$7d$__ = __turbopack_import__("[project]/src/components/dashboard/QuickActions.tsx [app-ssr] (ecmascript) {export default as QuickActions}");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$DistributionTrendsChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__DistributionTrendsChart$7d$__ = __turbopack_import__("[project]/src/components/dashboard/DistributionTrendsChart.tsx [app-ssr] (ecmascript) {export default as DistributionTrendsChart}");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$WeeklyClaimChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__WeeklyClaimChart$7d$__ = __turbopack_import__("[project]/src/components/dashboard/WeeklyClaimChart.tsx [app-ssr] (ecmascript) {export default as WeeklyClaimChart}");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$BarangayDistributionChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__BarangayDistributionChart$7d$__ = __turbopack_import__("[project]/src/components/dashboard/BarangayDistributionChart.tsx [app-ssr] (ecmascript) {export default as BarangayDistributionChart}");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$SmartInsights$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__SmartInsights$7d$__ = __turbopack_import__("[project]/src/components/dashboard/SmartInsights.tsx [app-ssr] (ecmascript) {export default as SmartInsights}");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$RecentDistributions$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__RecentDistributions$7d$__ = __turbopack_import__("[project]/src/components/dashboard/RecentDistributions.tsx [app-ssr] (ecmascript) {export default as RecentDistributions}");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/toast.ts [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
;
;
;
;
const INITIAL_STATS = {
    totalHouseholds: 0,
    pendingDistributions: 0,
    completedToday: 0,
    claimRate: 0,
    totalDistributions: 0,
    totalRegistered: 0,
    totalClaimed: 0,
    totalUnclaimed: 0
};
function computeWeeklyClaims(monthlyTrends) {
    const now = new Date();
    const currentMonth = now.toLocaleDateString('en-US', {
        month: 'short'
    });
    const monthRow = monthlyTrends.find((row)=>row.month === currentMonth);
    const monthClaimed = monthRow?.claimed ?? 0;
    const basePerDay = Math.floor(monthClaimed / 7);
    const remainder = monthClaimed % 7;
    const orderedDays = [
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
        'Sun'
    ];
    return orderedDays.map((day, i)=>({
            day,
            count: basePerDay + (i < remainder ? 1 : 0)
        }));
}
function DashboardPage() {
    const [stats, setStats] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](INITIAL_STATS);
    const [reportData, setReportData] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](null);
    const [weeklyData, setWeeklyData] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]([]);
    const [loading, setLoading] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](true);
    const fetchDashboardStats = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](async ()=>{
        setLoading(true);
        try {
            const [householdsRes, distributionsRes, reportRes] = await Promise.all([
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].getHouseholds({
                    page: 1,
                    limit: 1
                }),
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].getDistributions(),
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].getReportSummary()
            ]);
            const totalHouseholds = householdsRes.pagination?.totalDocs ?? (Array.isArray(householdsRes.data) ? householdsRes.data.length : 0);
            const distributions = Array.isArray(distributionsRes.data) ? distributionsRes.data : [];
            const pendingDistributions = distributions.filter((d)=>d.status !== 'Claimed').length;
            const report = reportRes.data ?? null;
            setReportData(report);
            setWeeklyData(computeWeeklyClaims(report?.monthlyTrends ?? []));
            setStats({
                totalHouseholds,
                pendingDistributions,
                completedToday: report?.overview?.completedToday ?? 0,
                claimRate: report?.overview?.claimRate ?? 0,
                totalDistributions: report?.overview?.totalDistributions ?? 0,
                totalRegistered: report?.overview?.totalRegisteredHouseholds ?? 0,
                totalClaimed: report?.overview?.totalClaimedHouseholds ?? 0,
                totalUnclaimed: report?.overview?.totalUnclaimedHouseholds ?? 0
            });
        } catch  {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["showToast"].error('Failed to load dashboard stats.');
            setStats(INITIAL_STATS);
        } finally{
            setLoading(false);
        }
    }, []);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        fetchDashboardStats();
    }, [
        fetchDashboardStats
    ]);
    const monthlyTrends = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>reportData?.monthlyTrends ?? [], [
        reportData
    ]);
    const barangayBreakdown = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>reportData?.barangayBreakdown ?? [], [
        reportData
    ]);
    const coverageRate = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>stats.totalRegistered > 0 ? Math.round(stats.totalClaimed / stats.totalRegistered * 100) : 0, [
        stats.totalClaimed,
        stats.totalRegistered
    ]);
    const currentPeriod = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>new Date().toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        }), []);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$DashboardLayout$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__DashboardLayout$7d$__["DashboardLayout"], {
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__Header$7d$__["Header"], {
                title: "Dashboard",
                subtitle: "Overview of relief distribution activities"
            }, void 0, false, {
                fileName: "<[project]/src/app/dashboard/page.tsx>",
                lineNumber: 115,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("section", {
                className: "mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] transition-all dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80 px-5 py-3.5 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-900/90 sm:px-6",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "flex flex-wrap items-center justify-between gap-3",
                            children: [
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "flex items-center gap-2.5",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                            className: "flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/app/dashboard/page.tsx>",
                                            lineNumber: 126,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h2", {
                                                    className: "text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-base",
                                                    children: "Executive Relief Distribution Command"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/app/dashboard/page.tsx>",
                                                    lineNumber: 128,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                    className: "text-[11px] text-slate-500 dark:text-slate-400",
                                                    children: "Real-time municipal distribution monitoring & telemetry"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/app/dashboard/page.tsx>",
                                                    lineNumber: 131,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/app/dashboard/page.tsx>",
                                            lineNumber: 127,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/app/dashboard/page.tsx>",
                                    lineNumber: 125,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "flex items-center gap-3",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60",
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](CalendarIcon, {
                                                    className: "w-3.5 h-3.5 text-slate-400"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/app/dashboard/page.tsx>",
                                                    lineNumber: 139,
                                                    columnNumber: 17
                                                }, this),
                                                currentPeriod
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/app/dashboard/page.tsx>",
                                            lineNumber: 138,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                            type: "button",
                                            onClick: fetchDashboardStats,
                                            disabled: loading,
                                            className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-colors",
                                            title: "Refresh metrics",
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](RefreshIcon, {
                                                    className: `w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/app/dashboard/page.tsx>",
                                                    lineNumber: 149,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                    children: "Refresh"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/app/dashboard/page.tsx>",
                                                    lineNumber: 150,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/app/dashboard/page.tsx>",
                                            lineNumber: 142,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/app/dashboard/page.tsx>",
                                    lineNumber: 137,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "<[project]/src/app/dashboard/page.tsx>",
                            lineNumber: 124,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/app/dashboard/page.tsx>",
                        lineNumber: 123,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](DeckMetricCell, {
                                title: "Registered Households",
                                value: loading ? '...' : stats.totalHouseholds.toLocaleString(),
                                subtitle: "Verified Community Base",
                                tag: "Database",
                                tagColor: "blue",
                                icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](HouseholdIcon, {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "<[project]/src/app/dashboard/page.tsx>",
                                    lineNumber: 164,
                                    columnNumber: 19
                                }, void 0),
                                footerText: `${stats.totalRegistered.toLocaleString()} mapped in active batches`
                            }, void 0, false, {
                                fileName: "<[project]/src/app/dashboard/page.tsx>",
                                lineNumber: 158,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](DeckMetricCell, {
                                title: "Open Distributions",
                                value: loading ? '...' : stats.pendingDistributions.toLocaleString(),
                                subtitle: "Awaiting Full Claims",
                                tag: stats.pendingDistributions > 0 ? 'Active' : 'Standby',
                                tagColor: stats.pendingDistributions > 0 ? 'amber' : 'emerald',
                                icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](PendingIcon, {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "<[project]/src/app/dashboard/page.tsx>",
                                    lineNumber: 173,
                                    columnNumber: 19
                                }, void 0),
                                footerText: `${stats.totalDistributions} overall distribution events`
                            }, void 0, false, {
                                fileName: "<[project]/src/app/dashboard/page.tsx>",
                                lineNumber: 167,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](DeckMetricCell, {
                                title: "Claims Completed Today",
                                value: loading ? '...' : stats.completedToday.toLocaleString(),
                                subtitle: "Daily Beneficiary Flow",
                                tag: "Live",
                                tagColor: "emerald",
                                icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](CompletedIcon, {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "<[project]/src/app/dashboard/page.tsx>",
                                    lineNumber: 182,
                                    columnNumber: 19
                                }, void 0),
                                footerText: `${stats.totalClaimed.toLocaleString()} total families served to date`
                            }, void 0, false, {
                                fileName: "<[project]/src/app/dashboard/page.tsx>",
                                lineNumber: 176,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](DeckMetricCell, {
                                title: "Municipal Claim Rate",
                                value: loading ? '...' : `${coverageRate}%`,
                                subtitle: "Claim Success Ratio",
                                tag: `${stats.totalClaimed} / ${stats.totalRegistered}`,
                                tagColor: "purple",
                                icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](ChartIcon, {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "<[project]/src/app/dashboard/page.tsx>",
                                    lineNumber: 191,
                                    columnNumber: 19
                                }, void 0),
                                progress: coverageRate,
                                footerText: `${stats.totalUnclaimed.toLocaleString()} unserved households remaining`
                            }, void 0, false, {
                                fileName: "<[project]/src/app/dashboard/page.tsx>",
                                lineNumber: 185,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/app/dashboard/page.tsx>",
                        lineNumber: 157,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/app/dashboard/page.tsx>",
                lineNumber: 121,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mb-6 grid grid-cols-1 gap-5 lg:grid-cols-12",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "lg:col-span-8 flex flex-col",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$DistributionTrendsChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__DistributionTrendsChart$7d$__["DistributionTrendsChart"], {
                            data: monthlyTrends,
                            loading: loading
                        }, void 0, false, {
                            fileName: "<[project]/src/app/dashboard/page.tsx>",
                            lineNumber: 201,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/app/dashboard/page.tsx>",
                        lineNumber: 200,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "lg:col-span-4 flex flex-col",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$LowStockAlert$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__LowStockAlert$7d$__["LowStockAlert"], {
                            pendingDistributions: stats.pendingDistributions,
                            unclaimedHouseholds: stats.totalUnclaimed,
                            loading: loading
                        }, void 0, false, {
                            fileName: "<[project]/src/app/dashboard/page.tsx>",
                            lineNumber: 204,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/app/dashboard/page.tsx>",
                        lineNumber: 203,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/app/dashboard/page.tsx>",
                lineNumber: 199,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mb-6 grid grid-cols-1 gap-5 lg:grid-cols-12",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "lg:col-span-4 flex flex-col",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$WeeklyClaimChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__WeeklyClaimChart$7d$__["WeeklyClaimChart"], {
                            data: weeklyData,
                            loading: loading
                        }, void 0, false, {
                            fileName: "<[project]/src/app/dashboard/page.tsx>",
                            lineNumber: 215,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/app/dashboard/page.tsx>",
                        lineNumber: 214,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "lg:col-span-8 flex flex-col",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$BarangayDistributionChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__BarangayDistributionChart$7d$__["BarangayDistributionChart"], {
                            data: barangayBreakdown,
                            loading: loading
                        }, void 0, false, {
                            fileName: "<[project]/src/app/dashboard/page.tsx>",
                            lineNumber: 218,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/app/dashboard/page.tsx>",
                        lineNumber: 217,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/app/dashboard/page.tsx>",
                lineNumber: 213,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "grid grid-cols-1 gap-5 lg:grid-cols-12",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "lg:col-span-4 flex flex-col",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$SmartInsights$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__SmartInsights$7d$__["SmartInsights"], {
                            totalDistributions: stats.totalDistributions,
                            claimRate: stats.claimRate,
                            totalRegistered: stats.totalRegistered,
                            totalClaimed: stats.totalClaimed,
                            totalUnclaimed: stats.totalUnclaimed,
                            barangayBreakdown: barangayBreakdown,
                            verificationMethods: reportData?.verificationMethods,
                            loading: loading
                        }, void 0, false, {
                            fileName: "<[project]/src/app/dashboard/page.tsx>",
                            lineNumber: 225,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/app/dashboard/page.tsx>",
                        lineNumber: 224,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "lg:col-span-4 flex flex-col",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$QuickActions$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__QuickActions$7d$__["QuickActions"], {}, void 0, false, {
                            fileName: "<[project]/src/app/dashboard/page.tsx>",
                            lineNumber: 237,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/app/dashboard/page.tsx>",
                        lineNumber: 236,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "lg:col-span-4 flex flex-col",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$RecentDistributions$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$7b$export__default__as__RecentDistributions$7d$__["RecentDistributions"], {}, void 0, false, {
                            fileName: "<[project]/src/app/dashboard/page.tsx>",
                            lineNumber: 240,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/app/dashboard/page.tsx>",
                        lineNumber: 239,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/app/dashboard/page.tsx>",
                lineNumber: 223,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/app/dashboard/page.tsx>",
        lineNumber: 114,
        columnNumber: 5
    }, this);
}
function HouseholdIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        }, void 0, false, {
            fileName: "<[project]/src/app/dashboard/page.tsx>",
            lineNumber: 250,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/app/dashboard/page.tsx>",
        lineNumber: 249,
        columnNumber: 5
    }, this);
}
function PendingIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        }, void 0, false, {
            fileName: "<[project]/src/app/dashboard/page.tsx>",
            lineNumber: 258,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/app/dashboard/page.tsx>",
        lineNumber: 257,
        columnNumber: 5
    }, this);
}
function CompletedIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        }, void 0, false, {
            fileName: "<[project]/src/app/dashboard/page.tsx>",
            lineNumber: 266,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/app/dashboard/page.tsx>",
        lineNumber: 265,
        columnNumber: 5
    }, this);
}
function ChartIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        }, void 0, false, {
            fileName: "<[project]/src/app/dashboard/page.tsx>",
            lineNumber: 274,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/app/dashboard/page.tsx>",
        lineNumber: 273,
        columnNumber: 5
    }, this);
}
function CalendarIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        }, void 0, false, {
            fileName: "<[project]/src/app/dashboard/page.tsx>",
            lineNumber: 282,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/app/dashboard/page.tsx>",
        lineNumber: 281,
        columnNumber: 5
    }, this);
}
function RefreshIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        }, void 0, false, {
            fileName: "<[project]/src/app/dashboard/page.tsx>",
            lineNumber: 290,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/app/dashboard/page.tsx>",
        lineNumber: 289,
        columnNumber: 5
    }, this);
}
function DeckMetricCell({ title, value, subtitle, icon, tag, tagColor = 'blue', progress, footerText }) {
    const tagColorStyles = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50',
        amber: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50',
        purple: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/50'
    };
    const iconBgStyles = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-300 border-blue-100 dark:border-blue-900/50',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-300 border-amber-100 dark:border-amber-900/50',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-300 border-purple-100 dark:border-purple-900/50'
    };
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "flex flex-col justify-between p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex items-start justify-between gap-3 mb-2",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconBgStyles[tagColor]}`,
                                children: icon
                            }, void 0, false, {
                                fileName: "<[project]/src/app/dashboard/page.tsx>",
                                lineNumber: 332,
                                columnNumber: 11
                            }, this),
                            tag && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: `inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${tagColorStyles[tagColor]}`,
                                children: tag
                            }, void 0, false, {
                                fileName: "<[project]/src/app/dashboard/page.tsx>",
                                lineNumber: 336,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/app/dashboard/page.tsx>",
                        lineNumber: 331,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                        className: "text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400",
                        children: title
                    }, void 0, false, {
                        fileName: "<[project]/src/app/dashboard/page.tsx>",
                        lineNumber: 342,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                        className: "mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white",
                        children: value
                    }, void 0, false, {
                        fileName: "<[project]/src/app/dashboard/page.tsx>",
                        lineNumber: 345,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                        className: "text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5",
                        children: subtitle
                    }, void 0, false, {
                        fileName: "<[project]/src/app/dashboard/page.tsx>",
                        lineNumber: 348,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/app/dashboard/page.tsx>",
                lineNumber: 330,
                columnNumber: 7
            }, this),
            progress !== undefined && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mt-3",
                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden",
                    children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700",
                        style: {
                            width: `${Math.min(progress, 100)}%`
                        }
                    }, void 0, false, {
                        fileName: "<[project]/src/app/dashboard/page.tsx>",
                        lineNumber: 356,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "<[project]/src/app/dashboard/page.tsx>",
                    lineNumber: 355,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "<[project]/src/app/dashboard/page.tsx>",
                lineNumber: 354,
                columnNumber: 9
            }, this),
            footerText && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 truncate",
                children: footerText
            }, void 0, false, {
                fileName: "<[project]/src/app/dashboard/page.tsx>",
                lineNumber: 365,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/app/dashboard/page.tsx>",
        lineNumber: 329,
        columnNumber: 5
    }, this);
}

})()),

};

//# sourceMappingURL=src_a6146f._.js.map