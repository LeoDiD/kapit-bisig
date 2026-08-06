# 🚩 Kapit-Bisig Web — Project TODO & Audit

> **Generated:** July 25, 2026  
> **Scope:** Web only — Next.js Frontend + Express Server

---

## Quick Legend

| Symbol | Meaning |
|--------|---------|
| 🔴 | **Critical** — Blocks core functionality or is a security risk |
| 🟡 | **Important** — Should be done before any demo/deployment |
| 🟢 | **Nice to Have** — Polish, optimization, or future features |
| 🔗 | **Disconnected** — Code exists but isn't wired up to anything |

---

## 1. 🔴 Staff Dashboard — Entirely Mock Data

> [page.tsx](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/src/app/staff/dashboard/page.tsx) · [staff-dashboard components](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/src/components/staff-dashboard)

**The entire `/staff/dashboard` page uses hardcoded mock data.** Nothing hits the API.

| Item | Status |
|------|--------|
| Metric Strip (pending distributions, tasks, volunteers) | Hardcoded numbers |
| Priority Action Queue | Fake task objects |
| Recent Activity Feed | Static HTML |
| Quick Actions (Approve Users, Export, Log Claim, Broadcast SMS) | `showToast` stubs only |
| Announcements | Static text |

### TODO:
- [ ] 🔴 Connect `MetricStrip` to real distribution/claim stats from the server
- [ ] 🔴 Wire `ActionQueue` to actual pending tasks (review queue, unresolved claims)
- [ ] 🟡 Build a real Activity Feed — connect to `AuditLog` or `Notification` models
- [ ] 🟡 Wire Quick Actions to real navigation or API calls
- [ ] 🟡 Build an Announcements CRUD or connect to Notifications

---

## 2. 🔴 Dashboard — Hardcoded / Incomplete Values

> [dashboard/page.tsx](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/src/app/dashboard/page.tsx)

| Item | Issue |
|------|-------|
| `completedToday` | Always `0` — hardcoded on line 82 |
| `pendingWrites` | Always `0` — hardcoded on line 83 |
| Weekly claims chart | Derived from monthly data, not actual daily tracking |

### TODO:
- [ ] 🔴 Build/query a server endpoint for **completedToday** (distributions completed today)
- [ ] 🔴 Build/query a server endpoint for **pendingWrites** (pending syncs)
- [ ] 🟡 Build real **daily claim tracking** endpoint for accurate weekly chart data

---

## 3. 🔗 Models With No Frontend UI

> [models directory](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/server/models)

These Mongoose models exist and are used in backend routes, but have **no visible web UI**:

| Model | Used In Routes | Web UI | 
|-------|---------------|--------|
| [AuditLog.ts](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/server/models/AuditLog.ts) | `householdRoutes`, `adminTokenRoutes` | ❌ No audit log viewer |
| [OfflineSyncQueue.ts](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/server/models/OfflineSyncQueue.ts) | `beneficiaryRoutes` | ❌ No sync status UI |
| [DistributionClaim.ts](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/server/models/DistributionClaim.ts) | `claimRoutes`, `distributionRoutes`, `householdRoutes`, `reportRoutes` | ❌ No dedicated claim detail view |
| [ResidentQrScanLog.ts](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/server/models/ResidentQrScanLog.ts) | `householdRoutes`, `authRoutes` | ❌ No scan history viewer |
| [RegistrationAuditLog.ts](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/server/models/RegistrationAuditLog.ts) | Registration flows | ❌ No registration audit trail view |

### TODO:
- [ ] 🟡 Build **Audit Log Viewer** page for superadmins (table + filters + export)
- [ ] 🟡 Build **QR Scan History** view (who scanned what, when, where)
- [ ] 🟡 Decide: Is `OfflineSyncQueue` needed for web? If not, it can stay backend-only
- [ ] 🟢 Add **Registration Audit Trail** panel inside the resident review modal

---

## 4. 🟡 Notification System — Backend Done, Frontend Partial

> **Server:** [notificationRoutes.ts](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/server/routes/notificationRoutes.ts), [createNotification.ts](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/server/utils/createNotification.ts)  
> **Frontend:** [HeaderWidgets.tsx](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/src/components/layout/HeaderWidgets.tsx), [api.ts → notificationsApi](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/src/lib/api.ts#L938)

What exists:
- ✅ Server CRUD routes (get, mark read, mark all read, delete, delete all)
- ✅ `createNotification()` utility
- ✅ Frontend API client (`notificationsApi`)
- ✅ Header notification bell/dropdown

### TODO:
- [ ] 🟡 Verify all key actions actually **create notifications** (distribution created, claim recorded, resident approved/rejected, proof reviewed, etc.)
- [ ] 🟡 Add **real-time updates** (polling interval or WebSocket) — currently only loads on page refresh
- [ ] 🟢 Build a **full Notifications page** (not just the header dropdown)

---

## 5. ~~🟡 Blockchain~~ (Removed)

> Blockchain features have been completely removed from the project during Phase 2.

---

## 6. 🔗 Legacy / Dead Code

| Item | File | Issue |
|------|------|-------|
| `superadminAuthRoutes.ts` | [superadminAuthRoutes.ts](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/server/routes/superadminAuthRoutes.ts) | Defined but **not mounted** in `server/index.ts` — commented as "disabled to prevent bypassing unified OTP flow" |
| Duplicate user components | [UserTable.tsx](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/src/components/users/UserTable.tsx) + [UsersTable.tsx](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/src/components/users/UsersTable.tsx) | Two similar table components in the same folder |
| `/verify-residents` route | [verify-residents/page.tsx](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/src/app/verify-residents/page.tsx) | Just redirects to `/code-generation` — orphan route |
| Trailing `o` in `.env.local` | [.env.local line 47](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/.env.local) | Stray character at end of file |

### TODO:
- [ ] 🟢 Delete `superadminAuthRoutes.ts` or add clear deprecation docs
- [ ] 🟢 Consolidate `UserTable.tsx` and `UsersTable.tsx`
- [ ] 🟢 Remove `/verify-residents` redirect page if not needed
- [ ] 🟢 Remove stray `o` from `.env.local` line 47

---

## 7. 🔴 Security Concerns (`.env.local`)

> [.env.local](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/.env.local)

| Item | Line | Risk |
|------|------|------|
| Ethereum private key in plaintext | L32 | 🔴 Anyone with this key can drain the wallet |
| Gmail SMTP app password | L45 | 🔴 Can send emails from your account |
| MongoDB Atlas credentials | L8 | 🔴 Full DB access |
| JWT secret | L12 | 🔴 Can forge auth tokens |

### TODO:
- [ ] 🔴 Confirm `.env.local` is in `.gitignore` (it should be, but verify)
- [ ] 🟡 For production: move secrets to a secret manager or environment variables on the hosting platform
- [ ] 🟡 Audit `RevokedToken` cleanup — no TTL/cron found to purge expired revoked tokens

---

## 8. 🟡 Testing Gaps

> [server/test](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/server/test)

| Test | Status |
|------|--------|
| `distributionFlow.integration.ts` | ✅ Exists (11KB) |
| `distributionFlow.unit.ts` | ✅ Exists |
| `idScreening.unit.ts` | ✅ Exists |
| `idVerification.unit.ts` | ✅ Exists |
| `beneficiaryFlow.unit.ts` | ⚠️ Stub only (1KB) |
| Auth flow tests | ❌ None |
| Notification tests | ❌ None |
| Frontend component tests | ❌ None at all |

### TODO:
- [ ] 🟡 Flesh out `beneficiaryFlow.unit.ts`
- [ ] 🟡 Add auth flow tests (login, OTP, forgot password)
- [ ] 🟡 Add notification creation tests
- [ ] 🟢 Add frontend component tests for critical flows

---

## 9. 🟡 Code Quality — Oversized Files

| File | Size | Issue |
|------|------|-------|
| [householdRoutes.ts](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/server/routes/householdRoutes.ts) | 77KB | Should extract logic into service layer |
| [ReportsPageClient.tsx](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/src/components/reports/ReportsPageClient.tsx) | 49KB | Should split into sub-components |
| [authRoutes.ts](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/server/routes/authRoutes.ts) | 38KB | Mobile auth mixed with web auth |
| [NewDistributionModal.tsx](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/src/components/distribution/NewDistributionModal.tsx) | 34KB | Large modal component |
| [TargetBeneficiariesPageClient.tsx](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx) | 34KB | Could be split |
| [beneficiaryService.ts](file:///c:/Users/Shekinah/Desktop/Kapit-Bisig/apps/web/apps/server/services/beneficiaryService.ts) | 33KB | Long service file |

---

## 10. Missing Web Pages

| Page | Route | Status |
|------|-------|--------|
| Dashboard | `/dashboard` | ✅ (hardcoded values — §2) |
| Login | `/login` | ✅ |
| Forgot Password | `/forgot-password` | ✅ |
| Manage Users | `/users` | ✅ |
| Resident Registration | `/resident-registration` | ✅ |
| Verified Residents | `/verified-residents` | ✅ |
| Code Generation | `/code-generation` | ✅ |
| Relief Registry | `/households` | ✅ |
| Distribution | `/distribution` | ✅ |
| Target Beneficiaries | `/target-beneficiaries` | ✅ |
| Reports | `/reports` | ✅ |
| Settings | `/settings` | ✅ |
| Staff Dashboard | `/staff/dashboard` | 🔴 **All mock data** |
| **Audit Log Viewer** | — | 🔗 No page |
| **Full Notifications Page** | — | 🔗 No page |

---

## Recommended Priority Order

### 🔥 Phase 1 — Fix Critical Gaps (✅ COMPLETED)
1. ~~Fix dashboard hardcoded values (`completedToday`, `pendingWrites`)~~
2. ~~Wire Staff Dashboard to real API data~~
3. ~~Secure `.env.local` (confirm gitignored, audit exposed credentials)~~
4. ~~Clean up stray character in `.env.local`~~

### 🎯 Phase 2 — Connect Disconnected Features (✅ COMPLETED)
5. ~~Build Audit Log Viewer page~~
6. ~~Show blockchain tx hashes in Distribution/Claim UI~~ (Removed)
7. ~~Add real-time notification polling~~
8. ~~Verify all key actions trigger notification creation~~

### 🧪 Phase 3 — Test & Validate
9. Expand server test coverage (auth, notifications, beneficiary)
10. Run Newman/Postman security test suite
11. Audit `RevokedToken` cleanup

### 🧹 Phase 4 — Code Quality & Polish
12. Refactor oversized files (`householdRoutes`, `ReportsPageClient`, `authRoutes`)
13. Remove dead code (legacy routes, duplicate components)
14. Add report export (PDF/CSV) and print layout
15. Consolidate duplicate user table components

---

> [!TIP]
> **Phase 1** items are what would be noticed immediately in a demo. **Phase 2** connects existing backend work to visible UI. **Phase 3 & 4** are pre-deployment hardening.
