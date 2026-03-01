# KapitBisig Security Checklist Map

> **Generated:** 2026-02-18  
> **Purpose:** Rubric-aligned security documentation — maps each checklist item to its actual implementation in the codebase.

---

## 0) Quick Project Overview

- **Tech stack:** Node.js / Express 4, MongoDB via Mongoose, JWT (HS256) stored in httpOnly cookies, bcrypt (12 rounds), Zod schema validation, React (Next.js) frontend.
- **Server code:** `apps/web/apps/server/` — entry point `server/index.ts`.
- **Web app:** `apps/web/apps/` (Next.js in `src/`).
- **Mobile app:** `mobile/` (React Native / Expo).

---

## 1) Authentication

### 1.1 Strong Password Hashing (bcrypt)

**Status:** ✅ Implemented

**Where (files):**

| File | What | Identifier |
|---|---|---|
| `server/routes/authRoutes.ts` | Hash on register | `SALT_ROUNDS = 12`, `bcrypt.hash(password, SALT_ROUNDS)` |
| `server/routes/unifiedAuthRoutes.ts` | Hash OTP before storage | `SALT_ROUNDS = 12`, `bcrypt.hash()` |
| `server/routes/forgotPasswordRoutes.ts` | Hash new password on reset | `SALT_ROUNDS = 12`, `bcrypt.hash(newPassword, SALT_ROUNDS)` |
| `server/routes/adminStaffRoutes.ts` | Hash when creating / resetting staff | `SALT_ROUNDS = 12` |
| `server/models/User.ts` | Pre-save hook auto-hashes | `userSchema.pre('save', ...)`, `bcrypt.hash(password, 12)` |
| `server/models/StaffUser.ts` | Static hash helper | `bcrypt.hash(plaintext, 12)` |
| `server/models/Resident.ts` | Pre-save hook auto-hashes | `residentSchema.pre('save', ...)` |
| `server/services/householdTokenService.ts` | Tokens stored hashed | `bcrypt.hash(token, 12)` |

**Purpose / How it works:**

- All passwords are hashed with **bcrypt at cost factor 12** before storage.
- Mongoose pre-save hooks in `User` and `Resident` models ensure passwords are never stored in plaintext, even if set directly on the document.
- Login flows use `bcrypt.compare()` which is constant-time, mitigating timing attacks.
- A **dummy hash comparison** is performed even when the user is not found (see §1.3), preventing user-enumeration timing attacks.
- OTP codes (login verify, password reset) are also bcrypt-hashed before storage in `LoginVerifyOtp` and `PasswordResetOtp` models.

**How to test (Web):**

1. Register a new user account (if registration UI is available) and inspect the DB — the `password` field will be a bcrypt hash starting with `$2b$12$`.
2. Alternatively, ask the DBA to query `db.users.findOne({}, { password: 1 })` — the value must be a bcrypt hash, never plaintext.

**How to test (API / Postman):**

- **Endpoint:** `POST /api/auth/login`
- **Body:** `{ "email": "test@example.com", "password": "WrongPassword123!" }`
- **Expected:** `401` — `{ "message": "Invalid credentials." }`
- **Negative test:** Directly inspect MongoDB `users` / `staffusers` collections — no plaintext passwords should exist.

---

### 1.2 Secure Sessions with Expiry

**Status:** ✅ Implemented

**Where (files):**

| File | What | Identifier |
|---|---|---|
| `server/routes/unifiedAuthRoutes.ts` | Cookie creation & expiry | `TOKEN_EXPIRY_HOURS = 10`, `REMEMBER_ME_EXPIRY_DAYS = 30`, `setCookie()` |
| `server/middleware/authMiddleware.ts` | JWT generation | `generateToken()`, `expiresIn: process.env.JWT_EXPIRES_IN \|\| '24h'` |
| `server/services/tokenRevocationService.ts` | Revocation on logout | `revokeJWTByValue()`, `isJWTRevoked()` |
| `server/models/RevokedToken.ts` | Stores revoked JTI values | TTL index on `expiresAt` auto-cleans |

**Purpose / How it works:**

- On login, a JWT is generated with a unique `jti` (via `crypto.randomUUID()`), signed with HS256 and the server's `JWT_SECRET` (≥32 chars, validated at boot).
- The token is delivered as an **httpOnly, Secure (in prod), SameSite=Lax** cookie named `sa_token`.
- **Default expiry:** 10 hours. With "remember me": 30 days. The cookie `maxAge` matches the JWT `expiresIn`.
- On logout, the JWT's `jti` is inserted into the `RevokedToken` collection, and the cookie is cleared.
- Every authenticated request checks `isJWTRevoked(jti)` — a revoked token is rejected even if not yet expired.
- `RevokedToken` documents auto-delete via a MongoDB TTL index once the original JWT would have expired.

**How to test (Web):**

1. Log in → open DevTools → Application → Cookies → verify `sa_token` is present, `HttpOnly = true`, `Expires` matches expected duration.
2. Wait for the token to expire (or set a short `JWT_EXPIRES_IN` in `.env.local`) → refresh the page → should redirect to login.

**How to test (API / Postman):**

- **Login:** `POST /api/auth/login` with valid credentials → note `Set-Cookie: sa_token=...` header.
- **Access protected route:** `GET /api/auth/me` with the cookie → `200`.
- **Expired token test:** Decode the JWT (jwt.io), observe `exp` claim; after that timestamp, `GET /api/auth/me` → `401 TOKEN_EXPIRED`.
- **Revoked token test:** Call `POST /api/auth/logout`, then reuse the same cookie → `GET /api/auth/me` → `401 INVALID_TOKEN`.

---

### 1.3 Generic Login Errors

**Status:** ✅ Implemented

**Where (files):**

| File | What | Identifier |
|---|---|---|
| `server/routes/unifiedAuthRoutes.ts` | Login handler | Returns `"Invalid credentials."` for wrong user/password/inactive |
| `server/routes/authRoutes.ts` | Legacy login | Returns `"Invalid email or password"` |
| `server/routes/superadminAuthRoutes.ts` | SA login | Returns `"Invalid credentials."` |
| `server/routes/forgotPasswordRoutes.ts` | OTP send | Returns `"If the email exists, an OTP was sent."` regardless |

**Purpose / How it works:**

- **All login routes** return the **same error message** whether the user does not exist, the password is wrong, or the account is inactive/disabled.
- The forgot-password OTP endpoint always returns a success-like message, even if the email is not registered, preventing user enumeration.
- A **dummy bcrypt comparison** is performed when the user is not found to ensure response times don't leak information (`bcrypt.compare(password, DUMMY_HASH)`).
- Registration returns `"Unable to create account. Please try a different email."` if the email already exists — does not confirm existence.

**How to test (API / Postman):**

| Test Case | Endpoint | Body | Expected |
|---|---|---|---|
| Non-existent user | `POST /api/auth/login` | `{ "identifier": "nouser@x.com", "password": "Abc12345!@#$%^&*" }` | `401` `"Invalid credentials."` |
| Wrong password | `POST /api/auth/login` | `{ "identifier": "real@user.com", "password": "WrongPass123!!!!!" }` | `401` `"Invalid credentials."` |
| Forgot-password enum | `POST /api/auth/forgot-password/send-otp` | `{ "email": "nobody@x.com" }` | `200` `"If the email exists, an OTP was sent."` |

---

### 1.4 Rate Limiting for Logins

**Status:** ✅ Implemented

**Where (files):**

| File | What | Identifier |
|---|---|---|
| `server/middleware/rateLimiter.ts` | All rate limiters | `loginRateLimiter`, `registrationRateLimiter`, `loginOtpRateLimiter`, `passwordResetRateLimiter`, `generalRateLimiter`, etc. |
| `server/routes/unifiedAuthRoutes.ts` | Applied to login routes | `router.post('/login', loginRateLimiter, ...)` |
| `server/routes/authRoutes.ts` | Login + register | `loginRateLimiter`, `registrationRateLimiter` |
| `server/routes/forgotPasswordRoutes.ts` | All forgot-password | `passwordResetRateLimiter` |
| `server/routes/householdRoutes.ts` | Household auth routes | `tokenValidationRateLimiter`, `householdRegistrationRateLimiter`, `loginRateLimiter`, `mobileLookupRateLimiter` |
| `server/index.ts` | Global limiter | `app.use(generalRateLimiter)` |

**Rate limit configuration:**

| Limiter | Window | Max Requests | Applied To |
|---|---|---|---|
| `generalRateLimiter` | 15 min | 500 | All routes (global) |
| `loginRateLimiter` | 15 min | 5 | Login endpoints |
| `registrationRateLimiter` | 1 hour | 3 | User registration |
| `passwordResetRateLimiter` | 1 hour | 3 | Forgot-password endpoints |
| `loginOtpRateLimiter` | 15 min | 3 | OTP resend |
| `strictRateLimiter` | 15 min | 10 | Sensitive operations |
| `tokenValidationRateLimiter` | 15 min | 5 | Household token validation |
| `householdRegistrationRateLimiter` | 1 hour | 3 | Household registration |
| `mobileLookupRateLimiter` | 15 min | 10 | Mobile number lookup |
| `tokenGenerationRateLimiter` | 1 hour | 50 | Admin token generation |

**Additional protection:** In-memory account lockout in `authRoutes.ts` — `MAX_LOGIN_ATTEMPTS = 5`, `LOCKOUT_DURATION_MINUTES = 15`. Returns HTTP `423` with `"Account temporarily locked. Try again in X minutes."`.

**Purpose / How it works:**

- `express-rate-limit` is used; key generator uses the first IP from `X-Forwarded-For` or `req.ip`.
- Standard rate-limit headers (`RateLimit-*`) are returned; legacy `X-RateLimit-*` headers are disabled.
- Each limiter uses an in-memory store (suitable for single-instance; for multi-instance deployments, switch to `rate-limit-redis`).

**How to test (API / Postman):**

1. **Endpoint:** `POST /api/auth/login`
2. Send 5 rapid requests with wrong credentials.
3. 6th request → `429 Too Many Requests` with `"Too many login attempts, please try again after 15 minutes"`.
4. Verify `RateLimit-Remaining: 0` header is present.

---

### 1.5 Validated Tokens (JWT)

**Status:** ✅ Implemented

**Where (files):**

| File | What | Identifier |
|---|---|---|
| `server/middleware/authMiddleware.ts` | Bearer token verification | `authenticateToken()`, `authMiddleware()` |
| `server/middleware/unifiedAuth.ts` | Cookie-first verification | `requireAuth()` |
| `server/middleware/superadminAuth.ts` | Legacy SA verification | `requireAuth()` |

**Purpose / How it works:**

- JWT is verified with `jwt.verify(token, secret, { algorithms: ['HS256'] })` — only HS256 accepted, preventing algorithm-switching attacks.
- `JWT_SECRET` is validated at boot to be ≥ 32 characters (`server/config/env.ts` + `getJWTSecret()` in authMiddleware).
- Every token includes a `jti` (JWT ID) checked against the `RevokedToken` collection.
- Expired tokens return `401` with code `TOKEN_EXPIRED`; invalid/tampered tokens return `401` with code `INVALID_TOKEN`.
- No stack traces or internal details are leaked in error responses.

**How to test (API / Postman):**

| Test Case | Request | Expected |
|---|---|---|
| Valid token | `GET /api/auth/me` with valid `sa_token` cookie | `200` with user data |
| Tampered token | Modify one char in the cookie value | `401` `"Invalid token"` |
| No token | `GET /api/auth/me` without cookie or header | `401` `"Authentication required"` |
| Expired token | Use a token past its `exp` claim | `401` `"Token expired"` |

---

### 1.6 Strong Password Policy

**Status:** ✅ Implemented

**Where (files):**

| File | What | Identifier |
|---|---|---|
| `server/utils/passwordValidator.ts` | Central policy engine | `validatePassword()`, `validatePasswordStrength()`, `isPasswordValid()`, `isCommonPassword()` |
| `server/routes/authRoutes.ts` | Enforced on register | Calls `validatePassword()` |
| `server/routes/adminStaffRoutes.ts` | Enforced on staff create / reset | Calls `validatePassword()` |
| `server/routes/forgotPasswordRoutes.ts` | Enforced on password reset | Calls `validatePasswordStrength()` |
| `server/services/householdRegistrationService.ts` | Enforced on household register | Calls `validatePassword()` |

**Policy rules (`PASSWORD_POLICY`):**

| Rule | Value |
|---|---|
| Minimum length | **16 characters** |
| Require uppercase | Yes |
| Require lowercase | Yes |
| Require number | Yes |
| Require special character | Yes |
| Reject whitespace | Yes |
| Common password check | 25 pattern blacklist (case-insensitive substring match) |

**Strength tiers:** weak (< 16 chars), medium (16–19), strong (20+).

**How to test (API / Postman):**

- **Endpoint:** `POST /api/auth/login` → first register or use `POST /api/auth/forgot-password/reset`
- **Weak password test:** `POST /api/auth/forgot-password/reset` with `{ "token": "...", "newPassword": "short" }` → `400` with specific validation errors listing which rules failed.
- **Common password test:** Use `"password12345678!A"` → should be rejected (contains `password`).

---

### 1.7 Logout Invalidates Session

**Status:** ✅ Implemented

**Where (files):**

| File | What | Identifier |
|---|---|---|
| `server/routes/unifiedAuthRoutes.ts` | Primary logout | `POST /logout` — revokes JWT, clears `sa_token` + `XSRF-TOKEN` cookies |
| `server/routes/superadminAuthRoutes.ts` | SA logout | `POST /logout` — revokes JWT, clears cookies |
| `server/routes/authRoutes.ts` | Legacy logout | `POST /logout` — revokes JWT via Bearer header |
| `server/services/tokenRevocationService.ts` | Revocation logic | `revokeJWTByValue(token, type)` — stores `jti` in `RevokedToken` collection |
| `server/models/RevokedToken.ts` | Revoked token storage | TTL index auto-deletes after original JWT expiry |

**Purpose / How it works:**

- On logout, the JWT is decoded to extract its `jti` (unique ID).
- The `jti` is upserted into `RevokedToken` collection with the token's original `expiresAt`.
- All subsequent requests with that token are rejected at the middleware level (`isJWTRevoked()` check).
- Cookies `sa_token` and `XSRF-TOKEN` are explicitly cleared with matching path/domain/flags.
- Audit log records the `LOGOUT` action.

**How to test (API / Postman):**

1. `POST /api/auth/login` → save the `sa_token` cookie.
2. `GET /api/auth/me` → `200` (confirms session is active).
3. `POST /api/auth/logout` → `200 { "success": true }`.
4. `GET /api/auth/me` with the **same** cookie → `401` (token revoked).

---

## 2) Input Validation

### 2.1 All Inputs Validated Server-Side

**Status:** ✅ Implemented

**Where (files):**

| File | What | Identifier |
|---|---|---|
| `server/validation/validateRequest.ts` | Generic validation middleware | `validateRequest({ body?, query?, params? })` |
| `server/validation/auth.schema.ts` | Auth schemas | `loginBody`, `registerBody`, `validatePasswordBody`, `saLoginBody`, `sendOtpBody`, `verifyOtpBody`, `forgotResetPasswordBody`, `loginVerifyOtpBody`, `loginResendOtpBody` |
| `server/schemas/authSchemas.ts` | Additional auth schemas | `unifiedLoginSchema`, `superadminLoginSchema`, `householdLoginSchema`, `userRegisterSchema`, `userLoginSchema` |
| `server/validation/shared.ts` | Reusable primitives | `objectId`, `trimmedString`, `email`, `phoneNumber`, `base64Image`, `barangayEnum`, `paginationQuery` |
| `server/validation/index.ts` | Barrel export | Exports all: `adminStaff.schema`, `adminToken.schema`, `distribution.schema`, `claim.schema`, `household.schema`, `householdList.schema`, `resident.schema`, `face.schema`, `user.schema` |

**Purpose / How it works:**

- **Zod** is used for all server-side schema validation.
- `validateRequest()` middleware validates `req.body`, `req.query`, and/or `req.params` against Zod schemas before the route handler executes.
- All schemas use `.strict()` which **rejects unknown/extra keys** — prevents mass-assignment attacks.
- On failure, a structured `400` response is returned with field-level error details.
- Applied on every auth, admin, distribution, claim, household, resident, face, and user route.

**How to test (API / Postman):**

- **Missing field:** `POST /api/auth/login` with `{}` → `400` body listing required fields.
- **Extra field:** `POST /api/auth/login` with `{ "identifier": "a@b.com", "password": "x", "evil": true }` → `400` "Unrecognized key(s) in object: 'evil'" (`.strict()` rejects).
- **Wrong type:** `POST /api/auth/login` with `{ "identifier": 123, "password": true }` → `400` with type errors.

---

### 2.2 Schema Validation (Zod)

**Status:** ✅ Implemented

**Where (files):**

All schemas are in `server/validation/` and `server/schemas/`:

| Schema File | Covers |
|---|---|
| `server/validation/auth.schema.ts` | Login, register, OTP, forgot-password |
| `server/validation/adminStaff.schema.ts` | Staff CRUD |
| `server/validation/adminToken.schema.ts` | Token generation/management |
| `server/validation/distribution.schema.ts` | Distribution CRUD |
| `server/validation/claim.schema.ts` | Claim recording |
| `server/validation/household.schema.ts` | Household registration/auth |
| `server/validation/householdList.schema.ts` | Household listing queries |
| `server/validation/resident.schema.ts` | Resident registration/update |
| `server/validation/face.schema.ts` | Face detection/comparison |
| `server/validation/user.schema.ts` | User CRUD |
| `server/validation/shared.ts` | Shared primitives (ObjectId, email, phone, etc.) |

**Purpose / How it works:**

- Every API endpoint that accepts input has a corresponding Zod schema.
- Schemas enforce types, formats, min/max lengths, enums, and strip/reject unknown fields.
- `trimmedString()` auto-trims whitespace from string inputs.
- `objectId` validates MongoDB ObjectId format via regex.
- `email` uses Zod's built-in `.email()` validation.
- `phoneNumber` validates format via regex pattern.

---

### 2.3 NoSQL Injection Protection

**Status:** ✅ Implemented (double-layer)

> **Note:** SQL injection is not applicable — MongoDB is the only database. NoSQL injection is the relevant threat.

**Where (files):**

| File | What | Identifier |
|---|---|---|
| `server/middleware/securityHardening.ts` | First-pass: reject | `rejectNoSQLInjection` — recursively checks body/query/params for `$`-prefixed or `.`-containing keys; returns `400` |
| `server/validation/mongoSanitize.ts` | Second-pass: strip | `mongoSanitize` — recursively strips `$`-prefixed keys and `.`-containing keys from body/query/params; strips leading `$` from string values |
| `server/index.ts` | Both applied globally | Lines 82–85: `app.use(rejectNoSQLInjection)` then `app.use(mongoSanitize)` |
| `server/validation/mongoSanitize.ts` | Regex escaping | `escapeRegex()` — escapes regex special chars before use in `new RegExp()` |

**Purpose / How it works:**

- **Layer 1 — `rejectNoSQLInjection`:** Recursively scans all incoming data. If any key starts with `$` (e.g., `$gt`, `$ne`) or contains `.` (e.g., `password.$ne`), the request is **immediately rejected** with HTTP `400`.
- **Layer 2 — `mongoSanitize`:** As a defense-in-depth fallback, strips any `$` or `.` keys that might have been missed (different code path, different implementation). Also strips leading `$` from string values.
- **Regex injection:** `escapeRegex()` is used before passing user input to `new RegExp()`, preventing ReDOS attacks.
- **Mongoose `strictQuery: true`:** Set in `server/config/database.ts` — Mongoose ignores query fields not in the schema, preventing injection via unknown fields.

**How to test (API / Postman):**

- **Injection attempt:** `POST /api/auth/login` with:
  ```json
  { "identifier": { "$gt": "" }, "password": { "$gt": "" } }
  ```
  → `400` `"Potential injection detected"` (rejected by `rejectNoSQLInjection`).

- **Dot-notation attack:** `POST /api/auth/login` with:
  ```json
  { "identifier": "test@test.com", "password.hash": "inject" }
  ```
  → `400` rejected.

---

### 2.4 CSRF Tokens Enabled

**Status:** ✅ Implemented

**Where (files):**

| File | What | Identifier |
|---|---|---|
| `server/middleware/csrf.ts` | CSRF middleware | `csrfProtect`, `generateCsrfToken()`, `setCsrfCookie()` |
| `server/routes/unifiedAuthRoutes.ts` | Sets CSRF cookie on login | `setCsrfCookie(res, generateCsrfToken())` |
| `server/index.ts` | Applied globally | `app.use(csrfProtect)` |

**Purpose / How it works:**

- Uses the **Double-Submit Cookie** pattern.
- On login, the server sets an `XSRF-TOKEN` cookie (`httpOnly: false`, `sameSite: lax`, `secure` in production, 30-day max age).
- The frontend reads the `XSRF-TOKEN` cookie value and sends it in the `X-CSRF-Token` request header.
- The `csrfProtect` middleware compares the cookie value with the header value — if they don't match → `403 CSRF_INVALID`.
- **Safe methods exempted:** GET, HEAD, OPTIONS.
- **Exempt paths:** `/api/auth/login`, `/api/auth/login/verify-otp`, `/api/auth/login/resend-otp`, `/api/auth/forgot-password/*`, `/api/sa/login`, `/api/health`.
- If no auth cookie (`sa_token`) is present, CSRF check is skipped (no session to protect).
- On logout, the `XSRF-TOKEN` cookie is cleared.

**How to test (API / Postman):**

1. `POST /api/auth/login` → note both `sa_token` and `XSRF-TOKEN` cookies in the response.
2. `POST /api/auth/logout` **without** `X-CSRF-Token` header → `403` `"CSRF token missing"`.
3. `POST /api/auth/logout` **with** `X-CSRF-Token: <value from XSRF-TOKEN cookie>` → `200` success.
4. `POST /api/auth/logout` **with** `X-CSRF-Token: wrong-value` → `403` `"CSRF token invalid"`.

---

## 3) Database Security

### 3.1 Secure Credential Storage (.env)

**Status:** ✅ Implemented

**Where (files):**

| File | What | Identifier |
|---|---|---|
| `server/config/env.ts` | Env validation at boot | Zod schema validates all env vars; exits process on failure |
| `server/index.ts` | Loads `.env.local` | `dotenv.config({ path: '.env.local' })` |

**Environment variables (NAMES only):**

| Variable | Required | Security Notes |
|---|---|---|
| `MONGODB_URI` | **Yes** | Connection string (min 1 char) |
| `JWT_SECRET` | **Yes** | Min 32 characters enforced |
| `SUPERADMIN_USERNAME` | **Yes** | Env-based superadmin |
| `SUPERADMIN_PASSWORD_HASH` | **Yes** | bcrypt hash (never plaintext) |
| `PRIVATE_KEY` | No | Blockchain signer key |
| `SMTP_USER` | No | Email credentials |
| `SMTP_PASS` | No | Email credentials |
| `HASH_SALT` | No | keccak256 salt for blockchain hashes |
| `PORT` | No | Default `3001` |
| `NODE_ENV` | No | Default `development` |
| `CORS_ORIGIN` | No | Default `http://localhost:3000` |
| `GANACHE_RPC_URL` | No | Blockchain RPC |
| `CONTRACT_ADDRESS` | No | Smart contract address |
| `SMTP_HOST` | No | Email host |
| `SMTP_PORT` | No | Email port |
| `SMTP_SECURE` | No | Email TLS |
| `APP_NAME` | No | Default `KapitBisig` |

**Purpose / How it works:**

- `.env.local` is loaded via `dotenv` before anything else.
- `server/config/env.ts` uses a Zod schema to validate all required env vars immediately on import — the process **exits** if validation fails.
- `JWT_SECRET` must be ≥ 32 characters (enforced both in Zod schema and in `getJWTSecret()` at runtime).
- The superadmin password is stored as a **bcrypt hash** in `SUPERADMIN_PASSWORD_HASH` — never as plaintext.
- `.env.local` is gitignored (should be — verify `.gitignore` includes it).

**How to test:**

1. Remove `JWT_SECRET` from `.env.local` → start server → should exit immediately with a validation error.
2. Set `JWT_SECRET` to fewer than 32 characters → start server → should exit with `"JWT_SECRET must be at least 32 characters long"`.

---

### 3.2 Role-Based Access Control (RBAC)

**Status:** ✅ Implemented

**Where (files):**

| File | What | Identifier |
|---|---|---|
| `server/middleware/rbacMiddleware.ts` | Role & permission guards | `requireRole()`, `requireRoles()`, `requirePermission()`, `requireAnyPermission()`, `requireAllPermissions()`, `isAdmin()`, `canManageUser()`, `preventSelfAction()` |
| `server/middleware/unifiedAuth.ts` | Unified RBAC | `requireAuth`, `requireSuperadmin`, `requireStaffOrSuperadmin`, `scopeBarangayGuard()` |
| `server/models/User.ts` | Permission definitions | `ROLE_PERMISSIONS` map: Admin (20 perms), Staff (9 perms), Volunteer (4 perms) |

**Role hierarchy:**

| Role | Level | Permissions |
|---|---|---|
| Admin | 3 | Full CRUD: users, residents, distribution, reports, inventory, settings |
| Staff | 2 | Read/create/update: residents, distribution; read: reports, inventory |
| Volunteer | 1 | Read: residents, distribution; verify distribution; create verification |
| SUPERADMIN | — | Env-based; full access (unified auth) |
| LGU_STAFF | — | DB-based; scoped to `assignedBarangays` (unified auth) |

**Route protection matrix:**

| Route Prefix | Guard |
|---|---|
| `/api/admin/users` | `requireAuth`, `requireSuperadmin` |
| `/api/admin/tokens` | `authenticateToken`, `requireAdmin` |
| `/api/distributions` | `requireAuth`, `requireStaffOrSuperadmin` (mount-level) |
| `/api/claims` | `requireAuth`, `requireStaffOrSuperadmin` (mount-level) |
| `/api/households` | `requireAuth`, `requireStaffOrSuperadmin` (mount-level) |
| `/api/users` | `authMiddleware` + per-route `requireRoles` / `requirePermission` |
| `/api/residents` | Per-route auth (register is public; list/verify require staff/superadmin) |

**Barangay scoping:** `scopeBarangayGuard(field)` restricts `LGU_STAFF` to only see data for their `assignedBarangays`. SUPERADMIN is exempt. Applied on distribution, claim, resident, and household list routes.

**How to test (API / Postman):**

1. Log in as an LGU_STAFF user.
2. `GET /api/admin/users` → `403` (only SUPERADMIN allowed).
3. `GET /api/distributions` → `200` but only returns distributions for the staff's assigned barangays.
4. Log in as SUPERADMIN → `GET /api/admin/users` → `200`.

---

### 3.3 Audit Logging Enabled

**Status:** ✅ Implemented

**Where (files):**

| File | What | Identifier |
|---|---|---|
| `server/models/AuditLog.ts` | Main audit model | Immutable collection (update/delete hooks throw error) |
| `server/utils/audit.ts` | Logging helper | `logAudit(req, action, entityType, entityId, metadata)` |
| `server/models/RegistrationAuditLog.ts` | Registration audit | Tracks token lifecycle, brute-force detection |

**Audit actions logged:**

| Category | Actions |
|---|---|
| Authentication | `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT` |
| Staff Management | `STAFF_CREATED`, `STAFF_UPDATED`, `STAFF_DISABLED`, `STAFF_PASSWORD_RESET` |
| Distribution | `DISTRIBUTION_CREATED`, `DISTRIBUTION_CLAIMED` |
| Claims | `CLAIM_RECORDED`, `CLAIM_RETRY` |
| Households | `HOUSEHOLD_UPDATED` |
| Verification | `RESIDENT_VERIFIED` |
| Security | `ACCESS_DENIED` |
| Password Reset | `FORGOT_PASSWORD_OTP_REQUESTED`, `FORGOT_PASSWORD_VERIFIED_SUCCESS/FAILED`, `FORGOT_PASSWORD_RESET_SUCCESS` |
| Login OTP | `LOGIN_OTP_SENT`, `LOGIN_OTP_VERIFY_SUCCESS/FAILED`, `LOGIN_OTP_RESEND` |
| Registration | `TOKEN_GENERATED/VALIDATED/INVALID/LOCKED/UNLOCKED/USED/EXPIRED`, `RATE_LIMITED`, `BRUTE_FORCE_DETECTED`, `REGISTRATION_STARTED/COMPLETED/FAILED` |

**Fields captured:** `actorId`, `actorRole`, `actorName`, `action`, `entityType`, `entityId`, `metadata`, `ip`, `userAgent`, `createdAt`.

**Security features:**

- **Immutable:** Mongoose pre-hooks on `updateOne`, `updateMany`, `deleteOne`, `deleteMany`, `findOneAndUpdate`, `findOneAndDelete` throw `"AuditLog records are immutable"`.
- **Secret sanitization:** `logAudit()` redacts keys matching `password`, `passwordHash`, `token`, `secret`, `authorization`, `cookie`, `jwt`, `hash`, `claimToken` → `[REDACTED]`.
- **TTL:** Auto-delete after 2 years (`730 days` TTL index).
- **Best-effort:** `logAudit()` never throws — errors are silently caught to avoid disrupting business logic.
- **Brute-force detection:** `RegistrationAuditLog.detectBruteForce(ip)` checks for suspicious patterns.

**How to test (API / Postman):**

1. `POST /api/auth/login` with valid credentials → query MongoDB `auditlogs` collection → new `LOGIN_SUCCESS` document with IP, user agent, actor details.
2. `POST /api/auth/login` with wrong password → `auditlogs` → `LOGIN_FAILURE` entry (no password value stored).
3. Verify that `password`, `token`, etc. fields in metadata show `[REDACTED]`.

---

### 3.4 TLS Database Connections

**Status:** 🟡 Partial

**Where (files):**

| File | What | Identifier |
|---|---|---|
| `server/config/database.ts` | Connection options | `tls: true` (conditional), `tlsAllowInvalidCertificates: false` |

**Purpose / How it works:**

- **Atlas (SRV):** TLS is automatic when `MONGODB_URI` uses `mongodb+srv://` — Atlas enforces TLS by default.
- **Non-SRV in production:** `tls: true` is explicitly set in connection options.
- **Development:** TLS is **not** enforced (local MongoDB typically doesn't have TLS).
- `tlsAllowInvalidCertificates: false` — invalid/self-signed certificates are always rejected.

**What's missing:**

- No explicit `tlsCAFile` option for custom CA certificates (acceptable for Atlas; may need configuration for self-hosted production MongoDB).
- No certificate pinning.

**How to test:**

1. Check `MONGODB_URI` in `.env.local` — if it starts with `mongodb+srv://`, TLS is enforced by Atlas.
2. In production, set `NODE_ENV=production` and use a non-SRV URI → verify `tls: true` is included in the Mongoose connection options (add a `console.log(options)` temporarily).
3. Try connecting with `tlsAllowInvalidCertificates: true` → should be rejected by code review (value is hardcoded to `false`).

---

### 3.5 Database Hardening

**Status:** 🟡 Partial

**Where (files):**

| File | What | Identifier |
|---|---|---|
| `server/config/database.ts` | Connection options | Pool sizing, timeouts, strict query |

**Implemented hardening measures:**

| Measure | Setting | File |
|---|---|---|
| Connection pool limits | `maxPoolSize: 15`, `minPoolSize: 2` | `database.ts` |
| Server selection timeout | `5,000 ms` | `database.ts` |
| Connect timeout | `10,000 ms` | `database.ts` |
| Socket timeout | `45,000 ms` | `database.ts` |
| Strict query mode | `mongoose.set('strictQuery', true)` | `database.ts` |
| Auto-indexing disabled in prod | `autoIndex: !isProd` | `database.ts` |
| Retry writes | `retryWrites: true` | `database.ts` |
| Debug logging in dev only | `mongoose.set('debug', !isProd)` | `database.ts` |
| TTL indexes | `RevokedToken`, `AuditLog`, `Notification`, `LoginVerifyOtp`, `PasswordResetOtp` | Various models |
| Unique indexes | `RevokedToken.jti`, `HouseholdToken.tokenHash`, `User.email`, `StaffUser.email` | Various models |
| Immutable collections | `AuditLog`, `RegistrationAuditLog` | Model pre-hooks |
| Password field exclusion | `select: false` on password fields | `User.ts`, `StaffUser.ts`, `Resident.ts` |

**What could be improved:**

- **Pagination caps:** Not documented whether a global max `limit` is enforced on list endpoints (check `paginationQuery` in `shared.ts` for max value).
- **Least privilege:** No documentation of MongoDB user roles (app should connect with a user that has only `readWrite` on its database, not `dbAdmin` or `root`).
- **Field-level encryption:** Not implemented (would protect PII at rest).

---

## 4) API Testing Index

### Authentication Endpoints

| # | Method | URL | Auth Required | Role | Rate Limiter |
|---|---|---|---|---|---|
| 1 | `POST` | `/api/auth/login` | No | — | `loginRateLimiter` (5/15min) |
| 2 | `POST` | `/api/auth/login/verify-otp` | No | — | `loginRateLimiter` |
| 3 | `POST` | `/api/auth/login/resend-otp` | No | — | `loginOtpRateLimiter` (3/15min) |
| 4 | `POST` | `/api/auth/logout` | Cookie (sa_token) | Any | CSRF required |
| 5 | `GET` | `/api/auth/me` | Cookie (sa_token) | Any | — |
| 6 | `POST` | `/api/auth/forgot-password/send-otp` | No | — | `passwordResetRateLimiter` (3/1hr) |
| 7 | `POST` | `/api/auth/forgot-password/verify-otp` | No | — | `passwordResetRateLimiter` |
| 8 | `POST` | `/api/auth/forgot-password/reset` | No | — | `passwordResetRateLimiter` |
| 9 | `POST` | `/api/sa/login` | No | — | `loginRateLimiter` |
| 10 | `POST` | `/api/sa/logout` | Cookie (sa_token) | SUPERADMIN | — |
| 11 | `GET` | `/api/sa/me` | Cookie (sa_token) | SUPERADMIN | — |

#### Sample Payloads

**1. Login (Unified)**
```
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "admin@kapitbisig.gov.ph",
  "password": "YourStr0ngP@ssword!!"
}
```
**Success (200):** `{ "success": true, "requiresOtp": false, "user": { "id": "...", "role": "SUPERADMIN", ... } }`  
*or* `{ "success": true, "requiresOtp": true, "otpPendingToken": "..." }` (for LGU_STAFF with OTP enabled)  
**Failure (401):** `{ "message": "Invalid credentials." }`  
**Rate limited (429):** `{ "message": "Too many login attempts, please try again after 15 minutes" }`

**2. Verify Login OTP**
```
POST /api/auth/login/verify-otp
Content-Type: application/json

{
  "otpPendingToken": "<token from login response>",
  "otp": "123456",
  "rememberMe": false
}
```
**Success (200):** `{ "success": true, "user": { ... } }` + `Set-Cookie: sa_token=...`  
**Failure (401):** `{ "message": "Invalid or expired code." }`

**3. Resend Login OTP**
```
POST /api/auth/login/resend-otp
Content-Type: application/json

{
  "otpPendingToken": "<token from login response>"
}
```
**Success (200):** `{ "success": true, "message": "A new OTP has been sent..." }`

**4. Logout**
```
POST /api/auth/logout
Cookie: sa_token=<jwt>
X-CSRF-Token: <value from XSRF-TOKEN cookie>
```
**Success (200):** `{ "success": true, "message": "Logged out successfully." }`

**5. Get Current User**
```
GET /api/auth/me
Cookie: sa_token=<jwt>
```
**Success (200):** `{ "success": true, "user": { "id": "...", "role": "...", ... } }`  
**Failure (401):** `{ "message": "Authentication required" }`

**6. Forgot Password — Send OTP**
```
POST /api/auth/forgot-password/send-otp
Content-Type: application/json

{
  "email": "staff@kapitbisig.gov.ph"
}
```
**Success (200):** `{ "success": true, "message": "If the email exists, an OTP was sent." }`

**7. Forgot Password — Verify OTP**
```
POST /api/auth/forgot-password/verify-otp
Content-Type: application/json

{
  "email": "staff@kapitbisig.gov.ph",
  "otp": "654321"
}
```
**Success (200):** `{ "success": true, "resetToken": "..." }`  
**Failure (401):** `{ "message": "Invalid or expired OTP." }`

**8. Forgot Password — Reset**
```
POST /api/auth/forgot-password/reset
Content-Type: application/json

{
  "token": "<resetToken from verify response>",
  "newPassword": "MyNewStr0ng!Pass2026x"
}
```
**Success (200):** `{ "success": true, "message": "Password reset successfully." }`  
**Failure (400):** `{ "message": "Password does not meet strength requirements", "errors": [...] }`

**9. Superadmin Login (Legacy)**
```
POST /api/sa/login
Content-Type: application/json

{
  "username": "superadmin",
  "password": "YourStr0ngP@ssword!!"
}
```
**Success (200):** `{ "success": true, "user": { "role": "SUPERADMIN", ... } }` + `Set-Cookie: sa_token=...`

---

### Admin Staff Management

| # | Method | URL | Auth | Role |
|---|---|---|---|---|
| 12 | `POST` | `/api/admin/users` | Cookie | SUPERADMIN |
| 13 | `GET` | `/api/admin/users` | Cookie | SUPERADMIN |
| 14 | `GET` | `/api/admin/users/stats` | Cookie | SUPERADMIN |
| 15 | `PATCH` | `/api/admin/users/:id` | Cookie | SUPERADMIN |
| 16 | `PATCH` | `/api/admin/users/:id/reset-password` | Cookie | SUPERADMIN |

#### Sample Payloads

**12. Create Staff**
```
POST /api/admin/users
Cookie: sa_token=<superadmin jwt>
X-CSRF-Token: <csrf>
Content-Type: application/json

{
  "firstName": "Juan",
  "lastName": "Dela Cruz",
  "email": "juan@kapitbisig.gov.ph",
  "password": "Str0ngP@ssw0rd!!2026",
  "role": "LGU_STAFF",
  "assignedBarangays": ["Poblacion"]
}
```
**Success (201):** `{ "success": true, "user": { ... } }`

**16. Reset Staff Password**
```
PATCH /api/admin/users/:id/reset-password
Cookie: sa_token=<superadmin jwt>
X-CSRF-Token: <csrf>
Content-Type: application/json

{
  "newPassword": "N3wStr0ngP@ssword!!!"
}
```

---

### User Management (Legacy)

| # | Method | URL | Auth | Role |
|---|---|---|---|---|
| 17 | `GET` | `/api/users/roles/available` | Bearer | Admin |
| 18 | `GET` | `/api/users/stats` | Bearer | Admin |
| 19 | `GET` | `/api/users` | Bearer | Admin/Staff |
| 20 | `GET` | `/api/users/:id` | Bearer | Admin/Staff |
| 21 | `POST` | `/api/users` | Bearer | Admin |
| 22 | `PUT` | `/api/users/:id` | Bearer | Admin |
| 23 | `PATCH` | `/api/users/:id/status` | Bearer | Admin |
| 24 | `DELETE` | `/api/users/:id` | Bearer | Admin |

---

### Distribution & Claims

| # | Method | URL | Auth | Role |
|---|---|---|---|---|
| 25 | `POST` | `/api/distributions` | Cookie | Staff/Superadmin |
| 26 | `GET` | `/api/distributions` | Cookie | Staff/Superadmin |
| 27 | `PATCH` | `/api/distributions/:id/claim` | Cookie | Staff/Superadmin |
| 28 | `GET` | `/api/distributions/:id/households` | Cookie | Staff/Superadmin |
| 29 | `POST` | `/api/claims/record-claim` | Cookie | Staff/Superadmin |
| 30 | `GET` | `/api/claims/ledger` | Cookie | Staff/Superadmin |
| 31 | `POST` | `/api/claims/:claimId/retry-chain` | Cookie | Staff/Superadmin |

---

### Household & Resident

| # | Method | URL | Auth | Role | Rate Limiter |
|---|---|---|---|---|---|
| 32 | `POST` | `/api/household/validate-token` | No | — | `tokenValidationRateLimiter` |
| 33 | `POST` | `/api/household/register` | No | — | `householdRegistrationRateLimiter` |
| 34 | `POST` | `/api/household/auth/login` | No | — | `loginRateLimiter` |
| 35 | `POST` | `/api/household/auth/logout` | Cookie | Resident | — |
| 36 | `GET` | `/api/household/auth/me` | Cookie | Resident | — |
| 37 | `POST` | `/api/household/qr/scan` | Cookie | Resident | — |
| 38 | `POST` | `/api/household/check-mobile` | No | — | `mobileLookupRateLimiter` |
| 39 | `POST` | `/api/residents/register` | No | — | — |
| 40 | `GET` | `/api/residents` | Cookie | Staff/Superadmin | — |
| 41 | `GET` | `/api/residents/:id` | Cookie | Staff/Superadmin | — |
| 42 | `PATCH` | `/api/residents/:id/verify` | Cookie | Staff/Superadmin | — |
| 43 | `GET` | `/api/residents/stats/summary` | Cookie | Staff/Superadmin | — |

---

### Admin Tokens

| # | Method | URL | Auth | Role |
|---|---|---|---|---|
| 44 | `POST` | `/api/admin/tokens/generate` | Bearer | Admin |
| 45 | `POST` | `/api/admin/tokens/bulk-generate` | Bearer | Admin |
| 46 | `GET` | `/api/admin/tokens/list` | Bearer | Admin |
| 47 | `GET` | `/api/admin/tokens/stats` | Bearer | Admin |
| 48 | `GET` | `/api/admin/tokens/:id` | Bearer | Admin |
| 49 | `GET` | `/api/admin/tokens/:id/history` | Bearer | Admin |
| 50 | `DELETE` | `/api/admin/tokens/:id` | Bearer | Admin |

---

### Household List

| # | Method | URL | Auth | Role |
|---|---|---|---|---|
| 51 | `GET` | `/api/households` | Cookie | Staff/Superadmin |

---

### Face Recognition

| # | Method | URL | Auth | Role |
|---|---|---|---|---|
| 52 | `POST` | `/api/face/detect` | — | — |
| 53 | `POST` | `/api/face/compare` | — | — |
| 54 | `POST` | `/api/face/descriptor` | — | — |
| 55 | `POST` | `/api/face/verify` | — | — |
| 56 | `GET` | `/api/face/health` | — | — |
| 57 | `POST` | `/api/face/check-duplicate` | — | — |

---

### Health Check

| # | Method | URL | Auth |
|---|---|---|---|
| 58 | `GET` | `/api/health` | None |

---

## 5) Postman Collection Notes

### Environment Variables

| Variable | Value | Notes |
|---|---|---|
| `BASE_URL` | `http://localhost:3001` | Local dev server |
| `SA_TOKEN` | *(auto-set from login response cookie)* | httpOnly cookie — Postman handles automatically |
| `CSRF_TOKEN` | *(copy from XSRF-TOKEN cookie after login)* | Set as `X-CSRF-Token` header on mutating requests |

### Cookie Handling

1. In Postman Settings, ensure **"Automatically follow redirects"** is enabled.
2. Cookies are managed automatically — after login, Postman stores the `sa_token` and `XSRF-TOKEN` cookies.
3. For mutating requests (POST/PATCH/PUT/DELETE), manually add header:  
   `X-CSRF-Token: {{CSRF_TOKEN}}` (copy the value from the `XSRF-TOKEN` cookie in Postman's cookie manager).

### Recommended Test Order

1. **Health check:** `GET /api/health` → verify server is running.
2. **Login:** `POST /api/auth/login` → stores cookies automatically.
3. **Get profile:** `GET /api/auth/me` → verify authentication works.
4. **Protected endpoints:** Use `sa_token` cookie + `X-CSRF-Token` header.
5. **RBAC tests:**
   - Log in as SUPERADMIN → access `/api/admin/users` → should succeed.
   - Log in as LGU_STAFF → access `/api/admin/users` → should get `403`.
6. **Rate-limit test:** Send 6 rapid `POST /api/auth/login` with wrong passwords → 6th should get `429`.
7. **Logout:** `POST /api/auth/logout` with CSRF header → confirm cookie is cleared.
8. **Post-logout test:** `GET /api/auth/me` → should get `401` (token revoked).

### Existing Postman Collection

A Postman collection is available at `docs/postman/KapitBisig_Auth_Security.postman_collection.json` with a local environment file at `docs/postman/KapitBisig_Local.postman_environment.json`. See `docs/postman/NEWMAN_RUNNER.md` for CLI execution instructions.

---

## Appendix: Middleware Application Order

The following middleware is applied **globally** in `server/index.ts` (in order):

| Order | Middleware | Purpose |
|---|---|---|
| 1 | `helmet()` | Security headers (HSTS in prod) |
| 2 | `trust proxy = 1` | Trust first proxy for correct IP |
| 3 | `cookieParser()` | Parse cookies |
| 4 | `enforceHTTPSInProduction` | Reject HTTP in production |
| 5 | `cors()` | Origin whitelist, credentials, allowed headers |
| 6 | `express.json({ limit: '50mb' })` | Parse JSON bodies |
| 7 | `express.urlencoded({ limit: '50mb' })` | Parse URL-encoded bodies |
| 8 | `rejectNoSQLInjection` | First-pass: reject `$`/`.` keys |
| 9 | `mongoSanitize` | Second-pass: strip `$`/`.` keys |
| 10 | `generalRateLimiter` | 500 req / 15 min global |
| 11 | `csrfProtect` | Double-submit cookie CSRF |

**Error handling** (applied after routes):

| Order | Middleware | Purpose |
|---|---|---|
| 12 | `notFoundHandler` | 404 — `"Endpoint not found"` (no path leak) |
| 13 | `errorHandler` | 500 — `"Internal server error"` (no stack trace) |

---

## Files Scanned

| Directory / File | Purpose |
|---|---|
| `server/index.ts` | Entry point, middleware order, route mounts |
| `server/config/database.ts` | Mongoose connection, TLS, pool, timeouts |
| `server/config/env.ts` | Environment variable validation (Zod) |
| `server/middleware/authMiddleware.ts` | JWT verify, Bearer token, `generateToken()` |
| `server/middleware/unifiedAuth.ts` | Cookie-first auth, RBAC (SUPERADMIN/LGU_STAFF), barangay scoping |
| `server/middleware/superadminAuth.ts` | Legacy SA auth |
| `server/middleware/rbacMiddleware.ts` | Role/permission guards, `preventSelfAction` |
| `server/middleware/rateLimiter.ts` | All rate limiters (10 configs) |
| `server/middleware/csrf.ts` | Double-submit cookie CSRF |
| `server/middleware/securityHardening.ts` | NoSQL injection rejection, HTTPS enforcement |
| `server/middleware/errorHandler.ts` | 404/500 handlers (no stack trace leak) |
| `server/validation/validateRequest.ts` | Generic Zod validation middleware |
| `server/validation/auth.schema.ts` | Auth endpoint schemas |
| `server/validation/mongoSanitize.ts` | NoSQL sanitizer + `escapeRegex()` |
| `server/validation/shared.ts` | Reusable Zod primitives |
| `server/validation/index.ts` | Barrel export |
| `server/schemas/authSchemas.ts` | Additional auth schemas |
| `server/routes/unifiedAuthRoutes.ts` | Primary login/logout/me + OTP |
| `server/routes/authRoutes.ts` | Legacy auth routes |
| `server/routes/superadminAuthRoutes.ts` | Legacy SA login |
| `server/routes/forgotPasswordRoutes.ts` | Password reset OTP flow |
| `server/routes/adminStaffRoutes.ts` | Staff CRUD (SUPERADMIN only) |
| `server/routes/userRoutes.ts` | User management (legacy) |
| `server/routes/residentRoutes.ts` | Resident CRUD |
| `server/routes/householdRoutes.ts` | Household token/register/auth |
| `server/routes/adminTokenRoutes.ts` | Token generation/management |
| `server/routes/distributionRoutes.ts` | Distribution CRUD |
| `server/routes/claimRoutes.ts` | Claim recording |
| `server/routes/householdListRoutes.ts` | Household listing |
| `server/routes/faceRoutes.ts` | Face recognition |
| `server/models/User.ts` | User model with permissions, pre-save hash |
| `server/models/StaffUser.ts` | Staff model, password hash |
| `server/models/Resident.ts` | Resident model, pre-save hash |
| `server/models/AuditLog.ts` | Immutable audit log |
| `server/models/RegistrationAuditLog.ts` | Registration audit + brute-force detection |
| `server/models/RevokedToken.ts` | JWT revocation store |
| `server/models/HouseholdToken.ts` | Hashed tokens, atomic locking |
| `server/models/LoginVerifyOtp.ts` | OTP storage (hashed) |
| `server/models/PasswordResetOtp.ts` | OTP storage (hashed) |
| `server/services/tokenRevocationService.ts` | JWT revoke/check |
| `server/services/householdTokenService.ts` | Token generation, hashing, validation |
| `server/services/householdRegistrationService.ts` | Registration orchestration |
| `server/utils/passwordValidator.ts` | Password policy (16-char min, complexity, common-password list) |
| `server/utils/audit.ts` | `logAudit()` helper with secret redaction |
| `server/utils/hashHelpers.ts` | Blockchain hash helpers |
| `server/utils/mailer.ts` | Email transport (OTP delivery) |
