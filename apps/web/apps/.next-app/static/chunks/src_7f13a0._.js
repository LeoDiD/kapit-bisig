(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/src_7f13a0._.js", {

"[project]/src/lib/AuthContext.tsx [app-client] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, k: __turbopack_refresh__ }) => (() => {
"use strict";

__turbopack_esm__({
    "AuthProvider": ()=>AuthProvider,
    "useAuth": ()=>useAuth
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
var _s = __turbopack_refresh__.signature(), _s1 = __turbopack_refresh__.signature();
'use client';
;
const API_URL = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL?.trim() || '/api';
const AuthContext = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"](undefined);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](null);
    const [loading, setLoading] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](true);
    const getCsrfToken = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](()=>{
        return document.cookie.split('; ').find((c)=>c.startsWith('XSRF-TOKEN='))?.split('=')[1];
    }, []);
    const initAuth = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](async ()=>{
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
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        initAuth();
    }, [
        initAuth
    ]);
    const login = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](async (email, password, rememberMe, otp)=>{
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
    const verifyLoginOtp = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](async (otpToken, otp)=>{
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
    const resendLoginOtp = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](async (otpToken)=>{
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
    const setInitialPassword = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](async (newPassword)=>{
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
    const logout = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](async ()=>{
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
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](AuthContext.Provider, {
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
_s(AuthProvider, "H0B2psBG14wKALxNzaJcBaItHeg=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const ctx = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"](AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}
_s1(useAuth, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_refresh__.register(_c, "AuthProvider");

})()),
"[project]/src/lib/api.ts [app-client] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, k: __turbopack_refresh__ }) => (() => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
const API_URL = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL?.trim() || '/api';
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
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /**
   * Search eligible scanner staff for a distribution scope.
   */ async getScanEligibleUsers (params) {
        const sp = new URLSearchParams();
        sp.append('hostBarangayId', params.hostBarangayId);
        for (const barangay of params.assignedBarangayIds){
            sp.append('assignedBarangayIds', barangay);
        }
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
"[project]/src/components/reports/ReportsPageClient.tsx [app-client] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, k: __turbopack_refresh__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>ReportsPageClient
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/AuthContext.tsx [app-client] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
var _s = __turbopack_refresh__.signature(), _s1 = __turbopack_refresh__.signature(), _s2 = __turbopack_refresh__.signature();
'use client';
;
;
;
const REPORT_TYPES = [
    {
        value: 'distribution',
        label: 'Distribution Summary'
    },
    {
        value: 'barangay',
        label: 'Barangay Summary'
    }
];
// Barangay list is now dynamically scoped per-user via getScopedBarangays()
const DONUT_COLORS = [
    '#0F533A',
    '#EAB308',
    '#22C55E',
    '#9ACB3C',
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
    '#F97316',
    '#14B8A6',
    '#6366F1'
];
// ─── Helpers ────────────────────────────────────────────────
function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
function downloadCSV(rows, filename) {
    const headers = [
        'Date',
        'Barangay',
        'Assigned Barangays',
        'Registered Households',
        'Claimed',
        'Unclaimed',
        'Claim Rate (%)',
        'Status'
    ];
    const csvRows = rows.map((r)=>[
            formatDate(r.scheduled || r.createdAt),
            r.barangay,
            (r.assignedBarangays || []).join('; '),
            r.registeredHouseholds,
            r.claimedHouseholds,
            r.unclaimedHouseholds,
            r.claimRate,
            r.status
        ]);
    const csv = [
        headers.join(','),
        ...csvRows.map((row)=>row.map((cell)=>`"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([
        csv
    ], {
        type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
function Dropdown({ value, items, onChange, buttonLabel, widthClass = 'min-w-[200px]' }) {
    _s();
    const [open, setOpen] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](false);
    const btnRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"](null);
    const menuRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"](null);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        const onDown = (e)=>{
            const t = e.target;
            if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return ()=>document.removeEventListener('mousedown', onDown);
    }, []);
    const selectedLabel = items.find((i)=>i.value === value)?.label ?? buttonLabel;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: `relative ${widthClass}`,
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                ref: btnRef,
                type: "button",
                onClick: ()=>setOpen((v)=>!v),
                className: "w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:shadow-[0_2px_10px_rgba(0,0,0,0.22)]",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "text-sm",
                        children: selectedLabel
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 104,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](ChevronDownIcon, {}, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 105,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 98,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                ref: menuRef,
                className: "absolute left-0 top-full z-50 mt-2 w-full rounded-2xl border border-[#DCDCDC] bg-[#ECECEC] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.14)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
                children: items.map((opt)=>{
                    const isSelected = opt.value === value;
                    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                        type: "button",
                        onClick: ()=>{
                            onChange(opt.value);
                            setOpen(false);
                        },
                        className: [
                            'w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-left transition-colors',
                            isSelected ? 'bg-[#EAB308] text-gray-900' : 'text-slate-700 hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-700'
                        ].join(' '),
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "w-5 flex items-center justify-center",
                                children: isSelected ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](CheckIcon, {}, void 0, false, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 125,
                                    columnNumber: 33
                                }, this) : null
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 124,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "truncate",
                                children: opt.label
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 127,
                                columnNumber: 17
                            }, this)
                        ]
                    }, opt.value, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 115,
                        columnNumber: 15
                    }, this);
                })
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 108,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 97,
        columnNumber: 5
    }, this);
}
_s(Dropdown, "wnEBIAesBAxdwPVHwMnYaVc49eo=");
_c = Dropdown;
function StatCard({ icon, title, value }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.16)]",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                children: icon
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 144,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "leading-tight",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "text-lg font-bold text-gray-900 dark:text-slate-100",
                        children: value
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 148,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "text-xs text-gray-500 dark:text-slate-400",
                        children: title
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 149,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 147,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 143,
        columnNumber: 5
    }, this);
}
_c1 = StatCard;
function StatusPill({ status }) {
    const cls = status === 'Claimed' ? 'bg-green-600 text-white' : status === 'Partially Claimed' ? 'bg-[#EAB308] text-white' : 'bg-gray-400 text-white';
    const label = status === 'Claimed' ? 'Completed' : status === 'Partially Claimed' ? 'Active' : 'Scheduled';
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
        className: `inline-flex items-center justify-center h-6 px-3 rounded-full text-xs font-medium whitespace-nowrap ${cls}`,
        children: label
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 171,
        columnNumber: 5
    }, this);
}
_c2 = StatusPill;
function ClaimRateBar({ rate }) {
    const color = rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-[#EAB308]' : rate > 0 ? 'bg-orange-400' : 'bg-gray-300';
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "flex items-center gap-2",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex-1 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800",
                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: `h-full rounded-full ${color}`,
                    style: {
                        width: `${rate}%`
                    }
                }, void 0, false, {
                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                    lineNumber: 183,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 182,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                className: "w-9 text-right text-xs font-medium text-gray-600 dark:text-slate-300",
                children: [
                    rate,
                    "%"
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 185,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 181,
        columnNumber: 5
    }, this);
}
_c3 = ClaimRateBar;
function Donut({ segments }) {
    const total = segments.reduce((a, s)=>a + s.value, 0) || 1;
    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "flex items-center justify-between gap-4",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
                width: "128",
                height: "128",
                viewBox: "0 0 120 120",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                        cx: "60",
                        cy: "60",
                        r: radius,
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "12",
                        className: "text-gray-200 dark:text-slate-700"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 203,
                        columnNumber: 9
                    }, this),
                    segments.map((seg, idx)=>{
                        const dash = seg.value / total * circumference;
                        const gap = circumference - dash;
                        const dashArray = `${dash} ${gap}`;
                        const dashOffset = -offset;
                        offset += dash;
                        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                            cx: "60",
                            cy: "60",
                            r: radius,
                            fill: "none",
                            stroke: seg.stroke,
                            strokeWidth: "12",
                            strokeLinecap: "butt",
                            strokeDasharray: dashArray,
                            strokeDashoffset: dashOffset,
                            transform: "rotate(-90 60 60)"
                        }, idx, false, {
                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                            lineNumber: 211,
                            columnNumber: 13
                        }, this);
                    }),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                        cx: "60",
                        cy: "60",
                        r: "28",
                        fill: "currentColor",
                        className: "text-white dark:text-slate-900"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 219,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 202,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex flex-col gap-3",
                children: segments.map((s)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex items-center gap-2 text-xs",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "w-3 h-3 rounded-full",
                                style: {
                                    background: s.stroke
                                }
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 224,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "text-gray-600 dark:text-slate-300",
                                children: s.label
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 225,
                                columnNumber: 13
                            }, this)
                        ]
                    }, s.label, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 223,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 221,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 201,
        columnNumber: 5
    }, this);
}
_c4 = Donut;
function MiniBarChart({ labels, seriesA, seriesB, legendA, legendB }) {
    const max = Math.max(...seriesA, ...seriesB, 1);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "w-full",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mb-3 flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "flex items-center gap-1.5",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "w-3 h-3 rounded bg-[#0F533A]"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 244,
                                columnNumber: 11
                            }, this),
                            " ",
                            legendA
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 243,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "flex items-center gap-1.5",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "w-3 h-3 rounded bg-[#9ACB3C]"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 247,
                                columnNumber: 11
                            }, this),
                            " ",
                            legendB
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 246,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 242,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex items-end gap-3 h-44",
                children: labels.map((m, i)=>{
                    const a = seriesA[i] / max * 100;
                    const b = seriesB[i] / max * 100;
                    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex-1 flex flex-col items-center gap-1",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "flex items-end justify-center gap-1 w-full h-36",
                            children: [
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "w-3 rounded-t-md bg-[#0F533A] transition-all duration-300",
                                    style: {
                                        height: `${a}%`,
                                        minHeight: seriesA[i] > 0 ? '4px' : '0px'
                                    },
                                    title: `${legendA}: ${seriesA[i]}`
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 257,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "w-3 rounded-t-md bg-[#9ACB3C] transition-all duration-300",
                                    style: {
                                        height: `${b}%`,
                                        minHeight: seriesB[i] > 0 ? '4px' : '0px'
                                    },
                                    title: `${legendB}: ${seriesB[i]}`
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 262,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                            lineNumber: 256,
                            columnNumber: 15
                        }, this)
                    }, m, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 255,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 250,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mt-2 flex justify-between text-[11px] text-gray-500 dark:text-slate-400",
                children: labels.map((m)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "w-full text-center",
                        children: m
                    }, m, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 274,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 272,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 241,
        columnNumber: 5
    }, this);
}
_c5 = MiniBarChart;
function SummaryCell({ label, value, valueClass = 'text-gray-900' }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "flex items-center justify-between lg:block",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "text-xs text-gray-500 dark:text-slate-400",
                children: label
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 288,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: `text-sm font-semibold ${valueClass}`,
                children: value
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 289,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 287,
        columnNumber: 5
    }, this);
}
_c6 = SummaryCell;
function MenuItem({ icon, label, onClick }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
        type: "button",
        onClick: onClick,
        className: "flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                className: "text-gray-500 dark:text-slate-400",
                children: icon
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 304,
                columnNumber: 7
            }, this),
            label
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 300,
        columnNumber: 5
    }, this);
}
_c7 = MenuItem;
function LoadingSpinner() {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "flex items-center justify-center py-12",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
            className: "h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-[#0F533A] dark:border-slate-700 dark:border-t-[#ECC323]"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
            lineNumber: 312,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 311,
        columnNumber: 5
    }, this);
}
_c8 = LoadingSpinner;
function EmptyState({ message }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "flex flex-col items-center justify-center py-16 text-gray-400 dark:text-slate-500",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](DocIcon, {
                className: "w-12 h-12 mb-3"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 320,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                className: "text-sm",
                children: message
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 321,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 319,
        columnNumber: 5
    }, this);
}
_c9 = EmptyState;
// ─── Detail Modal ───────────────────────────────────────────
function DetailModal({ row, onClose }) {
    _s1();
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        const onKey = (e)=>{
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return ()=>document.removeEventListener('keydown', onKey);
    }, [
        onClose
    ]);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/50",
        onClick: onClose,
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
            className: "mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
            onClick: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "flex items-center justify-between border-b border-gray-100 p-5 dark:border-slate-800",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                            className: "font-semibold text-gray-900 dark:text-slate-100",
                            children: "Distribution Details"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                            lineNumber: 348,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                            onClick: onClose,
                            className: "p-1 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300",
                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
                                className: "w-5 h-5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M6 18L18 6M6 6l12 12"
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 351,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 350,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                            lineNumber: 349,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                    lineNumber: 347,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "p-5 space-y-4",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "grid grid-cols-2 gap-4",
                            children: [
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "text-xs text-gray-500 dark:text-slate-400",
                                            children: "Date"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 358,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "text-sm font-medium text-gray-900 dark:text-slate-100",
                                            children: formatDate(row.scheduled || row.createdAt)
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 359,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 357,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "text-xs text-gray-500 dark:text-slate-400",
                                            children: "Host Barangay"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 362,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "text-sm font-medium text-gray-900 dark:text-slate-100",
                                            children: row.barangay
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 363,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 361,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "text-xs text-gray-500 dark:text-slate-400",
                                            children: "Assigned Barangays"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 366,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "text-sm font-medium text-gray-900 dark:text-slate-100",
                                            children: row.assignedBarangays?.length ? row.assignedBarangays.join(', ') : '—'
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 367,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 365,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "text-xs text-gray-500",
                                            children: "Status"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 372,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "mt-0.5",
                                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](StatusPill, {
                                                status: row.status
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 373,
                                                columnNumber: 39
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 373,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 371,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                            lineNumber: 356,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "rounded-xl bg-gray-50 p-4 dark:bg-slate-800/80",
                            children: [
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "mb-3 text-xs text-gray-500 dark:text-slate-400",
                                    children: "Household Statistics"
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 378,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "grid grid-cols-3 gap-4",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                    className: "text-lg font-bold text-gray-900 dark:text-slate-100",
                                                    children: row.registeredHouseholds
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 381,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                    className: "text-xs text-gray-500 dark:text-slate-400",
                                                    children: "Registered"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 382,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 380,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                    className: "text-lg font-bold text-green-700",
                                                    children: row.claimedHouseholds
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 385,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                    className: "text-xs text-gray-500 dark:text-slate-400",
                                                    children: "Claimed"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 386,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 384,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                    className: "text-lg font-bold text-amber-600",
                                                    children: row.unclaimedHouseholds
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 389,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                    className: "text-xs text-gray-500 dark:text-slate-400",
                                                    children: "Unclaimed"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 390,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 388,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 379,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "mt-3",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "mb-1 text-xs text-gray-500 dark:text-slate-400",
                                            children: "Claim Rate"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 394,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](ClaimRateBar, {
                                            rate: row.claimRate
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 395,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 393,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                            lineNumber: 377,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                    lineNumber: 355,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
            lineNumber: 343,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 342,
        columnNumber: 5
    }, this);
}
_s1(DetailModal, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c10 = DetailModal;
function ReportsPageClient() {
    _s2();
    const { user } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]();
    const scopedBarangays = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"](()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getScopedBarangays"](user?.role, user?.assignedBarangays), [
        user?.role,
        user?.assignedBarangays
    ]);
    const [reportType, setReportType] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]('distribution');
    const [startDate, setStartDate] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]('');
    const [endDate, setEndDate] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]('');
    const [barangay, setBarangay] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]('All');
    const [data, setData] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](null);
    const [loading, setLoading] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](false);
    const [error, setError] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]('');
    const [generated, setGenerated] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](false);
    // detail modal
    const [detailRow, setDetailRow] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](null);
    // row menu
    const [activeMenu, setActiveMenu] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](null);
    const [menuOpensUp, setMenuOpensUp] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](false);
    const rowMenuWrapRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"](null);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        const onDown = (e)=>{
            if (rowMenuWrapRef.current && !rowMenuWrapRef.current.contains(e.target)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', onDown);
        return ()=>document.removeEventListener('mousedown', onDown);
    }, []);
    const fetchReport = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](async ()=>{
        setLoading(true);
        setError('');
        try {
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].getReportSummary({
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                barangay: barangay !== 'All' ? barangay : undefined,
                reportType
            });
            if (res.success && res.data) {
                setData(res.data);
                setGenerated(true);
            } else {
                setError(res.message || 'Failed to generate report');
            }
        } catch (err) {
            console.error('Failed to generate report:', err);
            setError('Failed to generate report. Please try again.');
        } finally{
            setLoading(false);
        }
    }, [
        startDate,
        endDate,
        barangay,
        reportType
    ]);
    // Auto-fetch on first load
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const overview = data?.overview;
    const distributions = data?.distributions ?? [];
    const monthlyTrends = data?.monthlyTrends ?? [];
    const barangayBreakdown = data?.barangayBreakdown ?? [];
    const verification = data?.verificationMethods;
    // Barangay summary aggregation (for barangay report type)
    const barangaySummaryRows = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        if (reportType !== 'barangay' || !distributions.length) return [];
        const map = new Map();
        for (const d of distributions){
            const existing = map.get(d.barangay) || {
                barangay: d.barangay,
                distributions: 0,
                registered: 0,
                claimed: 0,
                unclaimed: 0
            };
            existing.distributions++;
            existing.registered += d.registeredHouseholds;
            existing.claimed += d.claimedHouseholds;
            existing.unclaimed += d.unclaimedHouseholds;
            map.set(d.barangay, existing);
        }
        return Array.from(map.values()).sort((a, b)=>b.distributions - a.distributions);
    }, [
        reportType,
        distributions
    ]);
    const barangayItems = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"](()=>[
            {
                value: 'All',
                label: 'All Barangays'
            },
            ...scopedBarangays.map((b)=>({
                    value: b,
                    label: b
                }))
        ], [
        scopedBarangays
    ]);
    const onToggleMenu = (id, e)=>{
        e.stopPropagation();
        if (activeMenu === id) {
            setActiveMenu(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuOpensUp(window.innerHeight - rect.bottom < 160);
        setActiveMenu(id);
    };
    const handleExportCSV = ()=>{
        if (!distributions.length) return;
        const dateRange = startDate && endDate ? `${startDate}_to_${endDate}` : 'all';
        downloadCSV(distributions, `distribution_report_${dateRange}.csv`);
    };
    const handleExportRowCSV = (row)=>{
        downloadCSV([
            row
        ], `distribution_${row.barangay}_${row.id}.csv`);
        setActiveMenu(null);
    };
    // Date range label for the table header
    const dateRangeLabel = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        if (startDate && endDate) {
            return `${formatDate(startDate)} — ${formatDate(endDate)}`;
        }
        if (startDate) return `From ${formatDate(startDate)}`;
        if (endDate) return `Until ${formatDate(endDate)}`;
        return 'All Time';
    }, [
        startDate,
        endDate
    ]);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.16)]",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "mb-4 flex items-center gap-2 font-semibold text-gray-800 dark:text-slate-100",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](FilterIcon, {
                                className: "h-5 w-5 text-gray-700 dark:text-slate-300"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 543,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                children: "Report Filters"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 544,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 542,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "grid grid-cols-1 lg:grid-cols-4 gap-4",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "mb-2 text-xs text-gray-500 dark:text-slate-400",
                                        children: "Report Type"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 549,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](Dropdown, {
                                        value: reportType,
                                        buttonLabel: "Distribution Summary",
                                        items: REPORT_TYPES.map((t)=>({
                                                value: t.value,
                                                label: t.label
                                            })),
                                        onChange: (v)=>setReportType(v),
                                        widthClass: "w-full"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 550,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 548,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "mb-2 text-xs text-gray-500 dark:text-slate-400",
                                        children: "Start Date"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 560,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("input", {
                                        type: "date",
                                        value: startDate,
                                        onChange: (e)=>setStartDate(e.target.value),
                                        className: "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:shadow-[0_2px_10px_rgba(0,0,0,0.22)]"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 561,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 559,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "mb-2 text-xs text-gray-500 dark:text-slate-400",
                                        children: "End Date"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 570,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("input", {
                                        type: "date",
                                        value: endDate,
                                        onChange: (e)=>setEndDate(e.target.value),
                                        className: "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:shadow-[0_2px_10px_rgba(0,0,0,0.22)]"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 571,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 569,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "mb-2 text-xs text-gray-500 dark:text-slate-400",
                                        children: "Barangay"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 580,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](Dropdown, {
                                        value: barangay,
                                        buttonLabel: "All Barangays",
                                        items: barangayItems,
                                        onChange: setBarangay,
                                        widthClass: "w-full"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 581,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 579,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 547,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "mt-4 flex flex-wrap gap-3",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                type: "button",
                                onClick: fetchReport,
                                disabled: loading,
                                className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F533A] hover:bg-[#0a3f2c] disabled:opacity-60 text-white text-sm font-medium shadow-[0_2px_10px_rgba(0,0,0,0.10)] transition-colors",
                                children: [
                                    loading ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 599,
                                        columnNumber: 15
                                    }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](BoltIcon, {
                                        className: "w-4 h-4"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 601,
                                        columnNumber: 15
                                    }, this),
                                    loading ? 'Generating...' : 'Generate Report'
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 592,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                type: "button",
                                onClick: handleExportCSV,
                                disabled: !distributions.length,
                                className: "inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:shadow-[0_2px_10px_rgba(0,0,0,0.22)] dark:hover:bg-slate-800",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](DownloadIcon, {
                                        className: "h-4 w-4 text-gray-500 dark:text-slate-400"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 612,
                                        columnNumber: 13
                                    }, this),
                                    "Export CSV"
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 606,
                                columnNumber: 11
                            }, this),
                            (startDate || endDate || barangay !== 'All') && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                type: "button",
                                onClick: ()=>{
                                    setStartDate('');
                                    setEndDate('');
                                    setBarangay('All');
                                    setReportType('distribution');
                                },
                                className: "inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:shadow-[0_2px_10px_rgba(0,0,0,0.22)] dark:hover:bg-slate-800",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](ClearIcon, {
                                        className: "h-4 w-4 text-gray-500 dark:text-slate-400"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 622,
                                        columnNumber: 15
                                    }, this),
                                    "Clear Filters"
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 617,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 591,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 541,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](AlertIcon, {
                        className: "w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 632,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "font-medium text-red-800 dark:text-red-300",
                                children: "Error generating report"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 634,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "mt-1 text-sm text-red-600 dark:text-red-400",
                                children: error
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 635,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 633,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 631,
                columnNumber: 9
            }, this),
            generated && overview && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](StatCard, {
                        icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](CubeIcon, {
                            className: "w-5 h-5"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                            lineNumber: 644,
                            columnNumber: 19
                        }, void 0),
                        title: "Total Distributions",
                        value: `${overview.totalDistributions}`
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 643,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](StatCard, {
                        icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](UsersIcon, {
                            className: "w-5 h-5"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                            lineNumber: 649,
                            columnNumber: 19
                        }, void 0),
                        title: "Households Served",
                        value: `${overview.totalClaimedHouseholds}`
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 648,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](StatCard, {
                        icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](TrendIcon, {
                            className: "w-5 h-5"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                            lineNumber: 654,
                            columnNumber: 19
                        }, void 0),
                        title: "Claim Rate",
                        value: `${overview.claimRate}%`
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 653,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](StatCard, {
                        icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](UnclaimedIcon, {
                            className: "w-5 h-5"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                            lineNumber: 659,
                            columnNumber: 19
                        }, void 0),
                        title: "Unclaimed Households",
                        value: `${overview.totalUnclaimedHouseholds}`
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 658,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 642,
                columnNumber: 9
            }, this),
            loading && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](LoadingSpinner, {}, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 667,
                columnNumber: 19
            }, this),
            generated && !loading && reportType === 'distribution' && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.16)]",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "border-b border-gray-100 p-5 dark:border-slate-800",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center gap-2 font-semibold text-gray-900 dark:text-slate-100",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](DocIcon, {
                                        className: "h-5 w-5 text-gray-700 dark:text-slate-300"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 674,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        children: [
                                            "Distribution Report — ",
                                            dateRangeLabel
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 675,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 673,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "mt-1 text-sm text-gray-500 dark:text-slate-400",
                                children: "Summary of relief distributions by barangay for the selected period"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 677,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 672,
                        columnNumber: 11
                    }, this),
                    distributions.length === 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](EmptyState, {
                        message: "No distributions found for the selected filters."
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 683,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "overflow-x-auto w-full",
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("table", {
                                    className: "w-full text-left border-collapse table-fixed min-w-[900px] lg:min-w-0",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("thead", {
                                            className: "bg-gray-50 text-sm text-gray-500 dark:bg-slate-800/80 dark:text-slate-400",
                                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("tr", {
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-4 font-medium w-[12%]",
                                                        children: "Date"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 690,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-4 font-medium w-[14%]",
                                                        children: "Barangay"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 691,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-4 font-medium w-[12%]",
                                                        children: "Registered"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 692,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-4 font-medium w-[10%]",
                                                        children: "Claimed"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 693,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-4 font-medium w-[10%]",
                                                        children: "Unclaimed"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 694,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-4 font-medium w-[18%]",
                                                        children: "Claim Rate"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 695,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-4 font-medium w-[14%]",
                                                        children: "Status"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 696,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-4 font-medium w-[5%]"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 697,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 689,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 688,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("tbody", {
                                            className: "divide-y divide-gray-100 text-sm dark:divide-slate-800",
                                            children: distributions.map((r)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("tr", {
                                                    className: "hover:bg-gray-50 dark:hover:bg-slate-800/70",
                                                    children: [
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-4 text-gray-600 dark:text-slate-300",
                                                            children: formatDate(r.scheduled || r.createdAt)
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 703,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-4 font-medium text-gray-700 dark:text-slate-100",
                                                            children: r.barangay
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 704,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-4 text-gray-700 dark:text-slate-200",
                                                            children: r.registeredHouseholds
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 705,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-4 text-green-700 font-medium",
                                                            children: r.claimedHouseholds
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 706,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-4 text-amber-600 font-medium",
                                                            children: r.unclaimedHouseholds
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 707,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-4",
                                                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](ClaimRateBar, {
                                                                rate: r.claimRate
                                                            }, void 0, false, {
                                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                lineNumber: 709,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 708,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-4",
                                                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](StatusPill, {
                                                                status: r.status
                                                            }, void 0, false, {
                                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                lineNumber: 712,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 711,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-4 text-right relative",
                                                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                                className: "relative inline-block",
                                                                ref: activeMenu === r.id ? rowMenuWrapRef : undefined,
                                                                children: [
                                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                                                        onClick: (e)=>onToggleMenu(r.id, e),
                                                                        className: "rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300",
                                                                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](DotsIcon, {}, void 0, false, {
                                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                            lineNumber: 720,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                        lineNumber: 716,
                                                                        columnNumber: 29
                                                                    }, this),
                                                                    activeMenu === r.id && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                                        className: [
                                                                            'absolute right-0 z-50 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_20px_45px_rgba(0,0,0,0.35)]',
                                                                            menuOpensUp ? 'bottom-full mb-2' : 'top-full mt-2'
                                                                        ].join(' '),
                                                                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                                            className: "py-2",
                                                                            children: [
                                                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](MenuItem, {
                                                                                    icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](EyeIcon, {}, void 0, false, {
                                                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                                        lineNumber: 731,
                                                                                        columnNumber: 43
                                                                                    }, void 0),
                                                                                    label: "View Details",
                                                                                    onClick: ()=>{
                                                                                        setDetailRow(r);
                                                                                        setActiveMenu(null);
                                                                                    }
                                                                                }, void 0, false, {
                                                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                                    lineNumber: 730,
                                                                                    columnNumber: 35
                                                                                }, this),
                                                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](MenuItem, {
                                                                                    icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](DownloadIcon, {
                                                                                        className: "w-5 h-5"
                                                                                    }, void 0, false, {
                                                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                                        lineNumber: 736,
                                                                                        columnNumber: 43
                                                                                    }, void 0),
                                                                                    label: "Export Row CSV",
                                                                                    onClick: ()=>handleExportRowCSV(r)
                                                                                }, void 0, false, {
                                                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                                    lineNumber: 735,
                                                                                    columnNumber: 35
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                            lineNumber: 729,
                                                                            columnNumber: 33
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                        lineNumber: 723,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                lineNumber: 715,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 714,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, r.id, true, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 702,
                                                    columnNumber: 23
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 700,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 687,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 686,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "border-t border-gray-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900",
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/80",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "mb-2 font-semibold text-gray-800 dark:text-slate-100",
                                            children: "Report Summary"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 754,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm",
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](SummaryCell, {
                                                    label: "Total Distributions",
                                                    value: `${overview?.totalDistributions ?? 0}`
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 756,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](SummaryCell, {
                                                    label: "Registered Households",
                                                    value: `${overview?.totalRegisteredHouseholds ?? 0}`
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 757,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](SummaryCell, {
                                                    label: "Households Claimed",
                                                    value: `${overview?.totalClaimedHouseholds ?? 0}`,
                                                    valueClass: "text-green-700"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 758,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](SummaryCell, {
                                                    label: "Households Unclaimed",
                                                    value: `${overview?.totalUnclaimedHouseholds ?? 0}`,
                                                    valueClass: "text-[#D97706]"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 759,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](SummaryCell, {
                                                    label: "Claim Rate",
                                                    value: `${overview?.claimRate ?? 0}%`
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 760,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 755,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 753,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 752,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 671,
                columnNumber: 9
            }, this),
            generated && !loading && reportType === 'barangay' && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.16)]",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "border-b border-gray-100 p-5 dark:border-slate-800",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center gap-2 font-semibold text-gray-900 dark:text-slate-100",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](DocIcon, {
                                        className: "h-5 w-5 text-gray-700 dark:text-slate-300"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 774,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        children: [
                                            "Barangay Summary — ",
                                            dateRangeLabel
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 775,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 773,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "mt-1 text-sm text-gray-500 dark:text-slate-400",
                                children: "Aggregated relief distribution statistics grouped by barangay"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 777,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 772,
                        columnNumber: 11
                    }, this),
                    barangaySummaryRows.length === 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](EmptyState, {
                        message: "No data found for the selected filters."
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 783,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "overflow-x-auto w-full",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("table", {
                            className: "w-full text-left border-collapse table-fixed min-w-[700px] lg:min-w-0",
                            children: [
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("thead", {
                                    className: "bg-gray-50 text-sm text-gray-500 dark:bg-slate-800/80 dark:text-slate-400",
                                    children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("tr", {
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                className: "px-4 py-4 font-medium w-[20%]",
                                                children: "Barangay"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 789,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                className: "px-4 py-4 font-medium w-[15%]",
                                                children: "Distributions"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 790,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                className: "px-4 py-4 font-medium w-[15%]",
                                                children: "Registered"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 791,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                className: "px-4 py-4 font-medium w-[15%]",
                                                children: "Claimed"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 792,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                className: "px-4 py-4 font-medium w-[15%]",
                                                children: "Unclaimed"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 793,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                className: "px-4 py-4 font-medium w-[20%]",
                                                children: "Claim Rate"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 794,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 788,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 787,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("tbody", {
                                    className: "divide-y divide-gray-100 text-sm dark:divide-slate-800",
                                    children: barangaySummaryRows.map((r)=>{
                                        const rate = r.registered > 0 ? Math.round(r.claimed / r.registered * 100) : 0;
                                        return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("tr", {
                                            className: "hover:bg-gray-50 dark:hover:bg-slate-800/70",
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                    className: "px-4 py-4 font-medium text-gray-700 dark:text-slate-100",
                                                    children: r.barangay
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 802,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                    className: "px-4 py-4 text-gray-700 dark:text-slate-200",
                                                    children: r.distributions
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 803,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                    className: "px-4 py-4 text-gray-700 dark:text-slate-200",
                                                    children: r.registered
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 804,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                    className: "px-4 py-4 text-green-700 font-medium",
                                                    children: r.claimed
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 805,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                    className: "px-4 py-4 text-amber-600 font-medium",
                                                    children: r.unclaimed
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 806,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                    className: "px-4 py-4",
                                                    children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](ClaimRateBar, {
                                                        rate: rate
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 807,
                                                        columnNumber: 51
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 807,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, r.barangay, true, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 801,
                                            columnNumber: 23
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 797,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                            lineNumber: 786,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 785,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 771,
                columnNumber: 9
            }, this),
            generated && !loading && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "grid grid-cols-1 lg:grid-cols-2 gap-4",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.16)]",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "font-semibold text-gray-900 dark:text-slate-100",
                                children: "Distribution Trends"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 823,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "mb-4 text-sm text-gray-500 dark:text-slate-400",
                                children: "Monthly distributions vs. claims (last 6 months)"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 824,
                                columnNumber: 13
                            }, this),
                            monthlyTrends.length > 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](MiniBarChart, {
                                labels: monthlyTrends.map((t)=>t.month.split(' ')[0]),
                                seriesA: monthlyTrends.map((t)=>t.distributions),
                                seriesB: monthlyTrends.map((t)=>t.claimed),
                                legendA: "Distributions",
                                legendB: "Claims"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 826,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "py-8 text-center text-sm text-gray-400 dark:text-slate-500",
                                children: "No trend data available"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 834,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 822,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.16)]",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "font-semibold text-gray-900 dark:text-slate-100",
                                children: "Distribution by Barangay"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 840,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "mb-4 text-sm text-gray-500 dark:text-slate-400",
                                children: "Number of distributions per barangay"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 841,
                                columnNumber: 13
                            }, this),
                            barangayBreakdown.length > 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](Donut, {
                                segments: barangayBreakdown.map((b, i)=>({
                                        label: `${b.barangay}: ${b.distributions}`,
                                        value: b.distributions,
                                        stroke: DONUT_COLORS[i % DONUT_COLORS.length]
                                    }))
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 843,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "py-8 text-center text-sm text-gray-400 dark:text-slate-500",
                                children: "No barangay data available"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 851,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 839,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 820,
                columnNumber: 9
            }, this),
            generated && !loading && verification && (verification.qr > 0 || verification.face > 0) && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.16)]",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "mb-1 font-semibold text-gray-900 dark:text-slate-100",
                        children: "Verification Methods"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 860,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "mb-4 text-sm text-gray-500 dark:text-slate-400",
                        children: "How households verified their claims"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 861,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "grid grid-cols-1 md:grid-cols-3 gap-4",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center gap-3 bg-blue-50 rounded-xl p-4",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center",
                                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](QRIcon, {
                                            className: "w-5 h-5 text-blue-700"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 865,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 864,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "text-lg font-bold text-gray-900 dark:text-slate-100",
                                                children: verification.qr
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 868,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "text-xs text-gray-500 dark:text-slate-400",
                                                children: "QR Code Scans"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 869,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 867,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 863,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center gap-3 bg-purple-50 rounded-xl p-4",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center",
                                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](FaceIcon, {
                                            className: "w-5 h-5 text-purple-700"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 874,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 873,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "text-lg font-bold text-gray-900 dark:text-slate-100",
                                                children: verification.face
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 877,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "text-xs text-gray-500 dark:text-slate-400",
                                                children: "Face Recognition"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 878,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 876,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 872,
                                columnNumber: 13
                            }, this),
                            verification.unknown > 0 && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center gap-3 rounded-xl bg-gray-50 p-4 dark:bg-slate-800/80",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-700",
                                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](QuestionIcon, {
                                            className: "w-5 h-5 text-gray-600 dark:text-slate-300"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 884,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 883,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "text-lg font-bold text-gray-900 dark:text-slate-100",
                                                children: verification.unknown
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 887,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "text-xs text-gray-500 dark:text-slate-400",
                                                children: "Other / Manual"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 888,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 886,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 882,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 862,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 859,
                columnNumber: 9
            }, this),
            !generated && !loading && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "rounded-2xl border border-gray-100 bg-white p-12 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.16)]",
                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](EmptyState, {
                    message: "Click Generate Report to view distribution data."
                }, void 0, false, {
                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                    lineNumber: 899,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 898,
                columnNumber: 9
            }, this),
            detailRow && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](DetailModal, {
                row: detailRow,
                onClose: ()=>setDetailRow(null)
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 904,
                columnNumber: 21
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 539,
        columnNumber: 5
    }, this);
}
_s2(ReportsPageClient, "kYygjD5G/r/Urg9YCf+Hcr6zhoU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c11 = ReportsPageClient;
/* ═══════════════════════════════════════════════════════════
   Icons
   ═══════════════════════════════════════════════════════════ */ function ChevronDownIcon() {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: "w-4 h-4 text-gray-500",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
            lineNumber: 916,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 915,
        columnNumber: 5
    }, this);
}
_c12 = ChevronDownIcon;
function CheckIcon() {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: "w-4 h-4",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 3,
            d: "M5 13l4 4L19 7"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
            lineNumber: 923,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 922,
        columnNumber: 5
    }, this);
}
_c13 = CheckIcon;
function FilterIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 018 17v-3.586L3.293 6.707A1 1 0 013 6V4z"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
            lineNumber: 930,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 929,
        columnNumber: 5
    }, this);
}
_c14 = FilterIcon;
function BoltIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M13 10V3L4 14h7v7l9-11h-7z"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
            lineNumber: 937,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 936,
        columnNumber: 5
    }, this);
}
_c15 = BoltIcon;
function DownloadIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-4 h-4',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 944,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M7 10l5 5 5-5"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 945,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M12 15V3"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 946,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 943,
        columnNumber: 5
    }, this);
}
_c16 = DownloadIcon;
function ClearIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-4 h-4',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M6 18L18 6M6 6l12 12"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
            lineNumber: 953,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 952,
        columnNumber: 5
    }, this);
}
_c17 = ClearIcon;
function DocIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M7 7h10M7 11h10M7 15h6"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 960,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M6 3h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 961,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 959,
        columnNumber: 5
    }, this);
}
_c18 = DocIcon;
function CubeIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M21 8l-9-5-9 5 9 5 9-5z"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 968,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M3 8v8l9 5 9-5V8"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 969,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M12 13v8"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 970,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 967,
        columnNumber: 5
    }, this);
}
_c19 = CubeIcon;
function UsersIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
            lineNumber: 977,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 976,
        columnNumber: 5
    }, this);
}
_c20 = UsersIcon;
function TrendIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M3 17l6-6 4 4 8-8"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 984,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M14 7h7v7"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 985,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 983,
        columnNumber: 5
    }, this);
}
_c21 = TrendIcon;
function AlertIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M12 9v4m0 4h.01"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 992,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 993,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 991,
        columnNumber: 5
    }, this);
}
_c22 = AlertIcon;
function UnclaimedIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
            lineNumber: 1000,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 999,
        columnNumber: 5
    }, this);
}
_c23 = UnclaimedIcon;
function DotsIcon() {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: "w-6 h-6",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M5 12h.01M12 12h.01M19 12h.01"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
            lineNumber: 1007,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 1006,
        columnNumber: 5
    }, this);
}
_c24 = DotsIcon;
function EyeIcon() {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: "w-5 h-5",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 1014,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 1015,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 1013,
        columnNumber: 5
    }, this);
}
_c25 = EyeIcon;
function QRIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 1022,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M14 14h3v3h-3zM14 20h7M20 14v3"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 1023,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 1021,
        columnNumber: 5
    }, this);
}
_c26 = QRIcon;
function FaceIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                cx: "12",
                cy: "12",
                r: "10",
                strokeWidth: 2
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 1030,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M8 14s1.5 2 4 2 4-2 4-2"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 1031,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("line", {
                x1: "9",
                y1: "9",
                x2: "9.01",
                y2: "9",
                strokeWidth: 3,
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 1032,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("line", {
                x1: "15",
                y1: "9",
                x2: "15.01",
                y2: "9",
                strokeWidth: 3,
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 1033,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 1029,
        columnNumber: 5
    }, this);
}
_c27 = FaceIcon;
function QuestionIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                cx: "12",
                cy: "12",
                r: "10",
                strokeWidth: 2
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 1040,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 1041,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("line", {
                x1: "12",
                y1: "17",
                x2: "12.01",
                y2: "17",
                strokeWidth: 3,
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 1042,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 1039,
        columnNumber: 5
    }, this);
}
_c28 = QuestionIcon;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11, _c12, _c13, _c14, _c15, _c16, _c17, _c18, _c19, _c20, _c21, _c22, _c23, _c24, _c25, _c26, _c27, _c28;
__turbopack_refresh__.register(_c, "Dropdown");
__turbopack_refresh__.register(_c1, "StatCard");
__turbopack_refresh__.register(_c2, "StatusPill");
__turbopack_refresh__.register(_c3, "ClaimRateBar");
__turbopack_refresh__.register(_c4, "Donut");
__turbopack_refresh__.register(_c5, "MiniBarChart");
__turbopack_refresh__.register(_c6, "SummaryCell");
__turbopack_refresh__.register(_c7, "MenuItem");
__turbopack_refresh__.register(_c8, "LoadingSpinner");
__turbopack_refresh__.register(_c9, "EmptyState");
__turbopack_refresh__.register(_c10, "DetailModal");
__turbopack_refresh__.register(_c11, "ReportsPageClient");
__turbopack_refresh__.register(_c12, "ChevronDownIcon");
__turbopack_refresh__.register(_c13, "CheckIcon");
__turbopack_refresh__.register(_c14, "FilterIcon");
__turbopack_refresh__.register(_c15, "BoltIcon");
__turbopack_refresh__.register(_c16, "DownloadIcon");
__turbopack_refresh__.register(_c17, "ClearIcon");
__turbopack_refresh__.register(_c18, "DocIcon");
__turbopack_refresh__.register(_c19, "CubeIcon");
__turbopack_refresh__.register(_c20, "UsersIcon");
__turbopack_refresh__.register(_c21, "TrendIcon");
__turbopack_refresh__.register(_c22, "AlertIcon");
__turbopack_refresh__.register(_c23, "UnclaimedIcon");
__turbopack_refresh__.register(_c24, "DotsIcon");
__turbopack_refresh__.register(_c25, "EyeIcon");
__turbopack_refresh__.register(_c26, "QRIcon");
__turbopack_refresh__.register(_c27, "FaceIcon");
__turbopack_refresh__.register(_c28, "QuestionIcon");

})()),
}]);

//# sourceMappingURL=src_7f13a0._.js.map