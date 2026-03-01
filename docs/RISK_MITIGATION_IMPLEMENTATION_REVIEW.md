# Risk Mitigation Implementation Review (Mobile + Backend)

Date: 2026-02-25  
Scope reviewed: `mobile/`, `apps/web/apps/server/`, `backend/`  
Reference: Risks & Mitigations section from your screenshot (Risk 1, 2, 4, 5 only; Risk 3 excluded as requested)

## Executive Summary

- Risk 1 (Weak passwords): Implemented.
- Risk 2 (Information disclosure via logs): Implemented, with access controls and redaction in audit logs.
- Risk 4 (Exposure of API keys/DB credentials): Mostly implemented, with one gap in mobile SMS key handling.
- Risk 5 (Duplicate registrations): Implemented in both TS backend and Python face backend.

## Risk-by-Risk Verification

### Risk 1: Weak passwords may allow unauthorized account access
Mitigation in screenshot: enforce strong password policy (uppercase, lowercase, numbers, special chars).

Status: Implemented.

Evidence:
- Strong backend policy is enforced in shared validator:
  - `minLength: 16`, uppercase/lowercase/number/special required in [passwordValidator.ts](/d:/kapit-bisig/apps/web/apps/server/utils/passwordValidator.ts:28).
- Validation is actually applied in account flows:
  - Register route uses `validatePassword()` and `isCommonPassword()` in [authRoutes.ts](/d:/kapit-bisig/apps/web/apps/server/routes/authRoutes.ts:182).
  - User creation/reset routes enforce same checks in [userRoutes.ts](/d:/kapit-bisig/apps/web/apps/server/routes/userRoutes.ts:360).
  - Household registration also validates password server-side in [householdRegistrationService.ts](/d:/kapit-bisig/apps/web/apps/server/services/householdRegistrationService.ts:551).
- Password hashing is enforced before storage in [Resident.ts](/d:/kapit-bisig/apps/web/apps/server/models/Resident.ts:335).

Why this is defensible:
- Even if mobile UI is bypassed, backend rejects weak passwords.

Scenario checks (Risk 1):
- Normal case:
  - Input: StrongPass2026!@# during registration.
  - Expected: Account creation proceeds because all policy checks pass.
- Attack case:
  - Input: weak password like password123 sent directly via API (bypass UI).
  - Expected: Server rejects with validation error; account is not created.
- Edge case:
  - Input: password exactly at minimum length (16 chars) with required character types.
  - Expected: Accepted, confirming boundary behavior is correct.

### Risk 2: Information disclosure if logs expose sensitive data/user queries
Mitigation in screenshot: restrict log access, mask sensitive fields, store logs in secured access-controlled systems.

Status: Implemented.

Evidence:
- Audit metadata redaction exists (`password`, `token`, `jwt`, `cookie`, etc. become `[REDACTED]`) in [audit.ts](/d:/kapit-bisig/apps/web/apps/server/utils/audit.ts:21).
- Redaction is applied before writes via `metadata: sanitise(metadata)` in [audit.ts](/d:/kapit-bisig/apps/web/apps/server/utils/audit.ts:81).
- Audit collections are immutable (updates/deletes blocked):
  - [AuditLog.ts](/d:/kapit-bisig/apps/web/apps/server/models/AuditLog.ts:109)
  - [RegistrationAuditLog.ts](/d:/kapit-bisig/apps/web/apps/server/models/RegistrationAuditLog.ts:378)
- Access to token-history logs is protected by auth + admin role:
  - `authenticateToken` + `requireAdmin` in [adminTokenRoutes.ts](/d:/kapit-bisig/apps/web/apps/server/routes/adminTokenRoutes.ts:447)
  - history fetch in [adminTokenRoutes.ts](/d:/kapit-bisig/apps/web/apps/server/routes/adminTokenRoutes.ts:472)
- Sensitive resident fields are excluded in list responses in [residentRoutes.ts](/d:/kapit-bisig/apps/web/apps/server/routes/residentRoutes.ts:293).

Why this is defensible:
- Logs are not publicly readable routes; privileged endpoints are guarded, and sensitive metadata is masked.

### Risk 4: Exposure of API keys or database credentials
Mitigation in screenshot: store sensitive keys in environment variables instead of hardcoding; limit/encrypt config access.

Status: Mostly implemented (one gap to explain).

Evidence implemented:
- Server env is validated at startup; app exits if critical secrets are missing:
  - `MONGODB_URI` required in [env.ts](/d:/kapit-bisig/apps/web/apps/server/config/env.ts:33)
  - `JWT_SECRET` required with minimum length 32 in [env.ts](/d:/kapit-bisig/apps/web/apps/server/config/env.ts:38)
  - fail-fast `process.exit(1)` in [env.ts](/d:/kapit-bisig/apps/web/apps/server/config/env.ts:97)
- DB config enforces secure connection requirements in production (auth in URI + TLS):
  - [database.ts](/d:/kapit-bisig/apps/web/apps/server/config/database.ts:23)
  - [database.ts](/d:/kapit-bisig/apps/web/apps/server/config/database.ts:37)
- Mobile uses secure storage for auth tokens:
  - [MobileAuthService.ts](/d:/kapit-bisig/mobile/services/auth/MobileAuthService.ts:290)

Remaining gap:
- SMS key is loaded as `EXPO_PUBLIC_SMS_API_KEY` and sent directly from mobile in [SplashScreen.tsx](/d:/kapit-bisig/mobile/components/SplashScreen.tsx:23). In Expo, `EXPO_PUBLIC_*` variables are bundled client-side, so this key is not truly secret.

How to present this honestly:
- "Server secrets are handled correctly via env validation and TLS. One mobile SMS key is currently in a public Expo env variable and should be moved behind a backend proxy endpoint."

Scenario checks (Risk 4):
- Normal case:
  - Input: Backend starts with valid MONGODB_URI and JWT_SECRET.
  - Expected: App boots normally; secure DB/JWT config is loaded.
- Attack case:
  - Input: attacker inspects mobile app bundle for EXPO_PUBLIC_SMS_API_KEY.
  - Expected: Key can be exposed (current gap), so mitigation is to move SMS sending to backend-only secret.
- Edge case:
  - Input: missing or short JWT_SECRET in server env.
  - Expected: Startup fails fast (process.exit(1)), preventing insecure run.

Professor demo steps (Risk 4):
- Normal case demo:
  - Set valid env values in server `.env`:
    - `MONGODB_URI=<valid mongo uri>`
    - `JWT_SECRET=<at least 32 chars>`
  - Start backend using your normal command.
  - Show: server starts successfully (no env validation errors).
- Attack case demo:
  - Run command:
    - `rg -n "EXPO_PUBLIC_SMS_API_KEY" d:\kapit-bisig\mobile`
  - Show result pointing to [SplashScreen.tsx](/d:/kapit-bisig/mobile/components/SplashScreen.tsx:23).
  - Say: "`EXPO_PUBLIC_*` is client-bundled, so this is not a true secret; mitigation is moving SMS send to backend-only key."
- Edge case demo:
  - In server `.env`, set an invalid short secret:
    - `JWT_SECRET=short_secret`
  - Start backend again.
  - Show expected fail-fast behavior:
    - Env validation error for `JWT_SECRET` minimum length in [env.ts](/d:/kapit-bisig/apps/web/apps/server/config/env.ts:38)
    - Immediate exit via [env.ts](/d:/kapit-bisig/apps/web/apps/server/config/env.ts:97)
  - Restore valid `.env` after demo.

### Risk 5: Duplicate registrations may allow multiple claims
Mitigation in screenshot: check new embeddings against existing records and block when threshold exceeded.

Status: Implemented.

Evidence:
- TypeScript face duplicate service compares new descriptor against existing residents and blocks if below distance threshold (`distance < DUPLICATE_THRESHOLD`) in [duplicateFaceService.ts](/d:/kapit-bisig/apps/web/apps/server/services/duplicateFaceService.ts:109).
- API returns `409` with duplicate result in [faceRoutes.ts](/d:/kapit-bisig/apps/web/apps/server/routes/faceRoutes.ts:197).
- Resident schema stores indexed `faceDescriptor` to support duplicate checks in [Resident.ts](/d:/kapit-bisig/apps/web/apps/server/models/Resident.ts:241).
- Python face backend (used by mobile registration flow) also blocks duplicates with threshold logic:
  - duplicate threshold config in [main.py](/d:/kapit-bisig/backend/main.py:63)
  - duplicate decision (`BLOCK`/`ALLOW`) in [main.py](/d:/kapit-bisig/backend/main.py:1171)

Why this is defensible:
- Duplicate prevention is enforced by service logic and explicit API failure response, not just UI.

## How To Present This To Your Professor (Demo Script)

### 1. Start with scope (30-45 sec)
Say:
- "I reviewed the implemented controls for Risk 1, 2, 4, and 5 from our document. Risk 3 is excluded because we are actively changing that flow."

Show this file and jump to Executive Summary.

### 2. Demo Risk 1 in code (2 min)
Show:
- [passwordValidator.ts](/d:/kapit-bisig/apps/web/apps/server/utils/passwordValidator.ts:28)
- [authRoutes.ts](/d:/kapit-bisig/apps/web/apps/server/routes/authRoutes.ts:182)

Say:
- "Policy is centralized and server-enforced, so weak passwords are blocked even if frontend validation is bypassed."

### 3. Demo Risk 2 in code (2 min)
Show:
- [audit.ts](/d:/kapit-bisig/apps/web/apps/server/utils/audit.ts:21)
- [adminTokenRoutes.ts](/d:/kapit-bisig/apps/web/apps/server/routes/adminTokenRoutes.ts:447)

Say:
- "Sensitive log fields are redacted, and access to history endpoints is restricted to authenticated admin users."

### 4. Demo Risk 4 in code (2 min)
Show:
- [env.ts](/d:/kapit-bisig/apps/web/apps/server/config/env.ts:38)
- [database.ts](/d:/kapit-bisig/apps/web/apps/server/config/database.ts:37)
- [SplashScreen.tsx](/d:/kapit-bisig/mobile/components/SplashScreen.tsx:23)

Say:
- "Backend secret management is in place and validated at startup. We identified one mobile key exposure gap (`EXPO_PUBLIC_SMS_API_KEY`) and documented it as a hardening task."

### 5. Demo Risk 5 in code (2 min)
Show:
- [duplicateFaceService.ts](/d:/kapit-bisig/apps/web/apps/server/services/duplicateFaceService.ts:109)
- [faceRoutes.ts](/d:/kapit-bisig/apps/web/apps/server/routes/faceRoutes.ts:197)
- [main.py](/d:/kapit-bisig/backend/main.py:1171)

Say:
- "Duplicate detection compares embeddings/descriptors and returns a deny response when threshold indicates a match."

### 6. Close with clear status (30 sec)
Say:
- "For the requested risks excluding Risk 3: mitigations are implemented, with one transparent improvement needed for mobile SMS key secrecy."

## Suggested Next Hardening (for stronger defense answers)

1. Move SMS sending from mobile direct-call to a backend endpoint with server-only secret.
2. Rotate any SMS/API key that was previously exposed in mobile builds.
3. Keep this report updated per sprint so you can show security progress evidence.

## AI Recognition: 3 Quick Risks + Mitigations (Can Be Done in < 1 Day)

### 1) Risk: Duplicate-check API leaks resident details
- Current behavior:
  - Duplicate responses include `existingResident` data (`name`, `barangay`, `streetAddress`) in [faceRoutes.ts](/d:/kapit-bisig/apps/web/apps/server/routes/faceRoutes.ts:201).
- Why this matters:
  - An attacker can probe faces and learn whether a specific person is in your database.
- Mitigation (quick):
  - Return a generic duplicate message only (no resident identity fields).
  - Keep detailed match info server-side in admin-only logs.
- Estimated effort:
  - 1-2 hours (response payload change + frontend message update).

### 2) Risk: AI endpoints can be abused (enumeration/DoS)
- Current behavior:
  - Python backend allows all origins via `allow_origins=["*"]` in [main.py](/d:/kapit-bisig/backend/main.py:52).
  - Face routes do not show endpoint-specific rate limiting in [faceRoutes.ts](/d:/kapit-bisig/apps/web/apps/server/routes/faceRoutes.ts:182).
- Why this matters:
  - Unrestricted requests can spike compute load and allow repeated probing attempts.
- Mitigation (quick):
  - Restrict CORS to known app domains.
  - Add per-IP rate limit on `/api/face/check-duplicate` and `/api/face/verify`.
- Estimated effort:
  - 2-4 hours (config + middleware wiring + basic test).

### 3) Risk: Identity leakage from duplicate-check response
- Problem:
  - API returns too much info (ex: resident name/barangay) when a face is duplicate.
- Mitigation:
  - Return only a generic message like "Face already registered" and keep identity details in admin-only logs.
- Test cases:
  - Normal case:
    - Input: A real duplicate face is submitted during registration.
    - Expected: API returns duplicate status with generic message only; no resident identity fields in response.
  - Attack case:
    - Input: Repeated probing attempts using different faces to enumerate registered residents.
    - Expected: Responses never expose name/barangay/streetAddress; attacker cannot identify specific residents.
  - Edge case:
    - Input: Duplicate found while logging subsystem is unavailable.
    - Expected: API still returns generic duplicate response; no identity data leaks to client.
