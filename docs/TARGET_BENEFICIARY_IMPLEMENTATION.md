
# Target Beneficiary Implementation

This document defines the implementation logic for Kapit Bisig's Target Beneficiary feature.

## 1. System Flow

### A. Resident proof submission
1. Resident logs in using an already-approved resident account.
2. Resident selects the current disaster event.
3. Resident submits a disaster assistance request with:
   - `residentId`
   - `disasterEventId`
   - `damageType`
   - `description`
   - `supportingInfo`
   - `dateSubmitted`
   - `photoProof`
4. If online:
   - the request is uploaded immediately
   - the server stores it as `Pending Verification`
   - eligibility is created or updated as `Not Eligible` for that event until review is complete
5. If offline:
   - the mobile app stores the request locally as `Pending Sync`
   - once connectivity returns, the app sends the item to `/api/beneficiaries/sync/proof-submissions`
   - the server stores it as `Pending Verification`

### B. Admin verification
1. Admin/LGU staff opens the proof submission review queue.
2. Admin filters by event, barangay, resident, status, or search term.
3. Admin reviews the uploaded proof and chooses `Approved` or `Rejected`.
4. If approved:
   - `ProofSubmissions.status = Approved`
   - `BeneficiaryEligibility.status = Eligible`
5. If rejected:
   - `ProofSubmissions.status = Rejected`
   - rejection reason is stored
   - `BeneficiaryEligibility.status = Not Eligible`

### C. Distribution-day scan and claim
1. Volunteer/scanner downloads the approved beneficiary list for the active event before field operations.
2. Volunteer scans the resident's permanent QR code.
3. The system resolves the QR to the resident record.
4. The system checks:
   - resident registration is `Approved`
   - resident has `Eligible` event-scoped eligibility
   - resident has not already claimed for the same event
5. Result returned:
   - `Valid - eligible to claim`
   - `Already claimed`
   - `Not eligible for this event`
   - `Invalid QR`
6. If valid, volunteer confirms release and a claim record is stored.

## 2. Backend Logic

### Core rule
A resident is a target beneficiary only when both are true:
- `Residents.status = Approved`
- `BeneficiaryEligibility.status = Eligible` for the specific `DisasterEvent`

### Event-scoped eligibility
- Eligibility is not global.
- The same resident can be:
  - `Eligible` for event A
  - `Not Eligible` for event B

### Claim rule
- One resident can only have one successful claim per disaster event.
- This is enforced by:
  - server-side validation before insert
  - unique claim constraints using the resident/event pair

### Offline sync rule
- Offline proof submissions and claims are stored on-device first.
- When synced, the server logs each item in `OfflineSyncQueue`.
- Sync results are idempotent by `actorId + queueType + clientGeneratedId`.

## 3. Database Schema

### `Residents`
Existing collection. Relevant fields:
- `residentCode`
- `status`
- `qrStatus`
- `barangay`

### `DisasterEvents`
- `name`
- `disasterType`
- `description`
- `barangays[]`
- `eventDate`
- `submissionDeadline`
- `status` (`Draft|Active|Closed`)
- `createdBy`
- `updatedBy`

### `ProofSubmissions`
- `residentId`
- `disasterEventId`
- `damageType`
- `description`
- `supportingInfo`
- `dateSubmitted`
- `photoProofUrl`
- `status` (`Pending Sync|Pending Verification|Approved|Rejected`)
- `syncSource` (`ONLINE|OFFLINE_SYNC`)
- `submissionVersion`
- `clientGeneratedId`
- `submittedViaDeviceId`
- `rejectionReason`
- `reviewedBy`
- `reviewedAt`

### `BeneficiaryEligibility`
- `residentId`
- `disasterEventId`
- `proofSubmissionId`
- `status` (`Eligible|Not Eligible`)
- `registrationStatus`
- `proofStatus`
- `rejectionReason`
- `reviewedBy`
- `reviewedAt`
- `lastQualifiedAt`

### `Claims`
Existing collection extended for event-based claims:
- `claimCategory` (`DISTRIBUTION|DISASTER_EVENT`)
- `claimStatus` (`Not Claimed|Claimed`)
- `disasterEventId`
- `residentId`
- `scannedBy`
- `scannedAt`
- `source` (`ONLINE|OFFLINE_SYNC`)
- `syncMetadata`

### `OfflineSyncQueue`
- `queueType` (`PROOF_SUBMISSION|CLAIM`)
- `syncStatus` (`Pending|Processing|Synced|Failed`)
- `actorId`
- `actorRole`
- `residentId`
- `disasterEventId`
- `proofSubmissionId`
- `claimMongoId`
- `claimId`
- `clientGeneratedId`
- `deviceId`
- `payload`
- `errorMessage`
- `syncedAt`

## 4. API Endpoints

### Disaster events
- `GET /api/beneficiaries/events`
- `GET /api/beneficiaries/events/active`
- `POST /api/beneficiaries/events`

### Resident proof submission
- `POST /api/beneficiaries/proof-submissions`

Request body:
```json
{
  "disasterEventId": "6612d0f0aa1b2c3d4e5f6789",
  "damageType": "House Damage",
  "description": "Roof was destroyed and water entered the living room.",
  "supportingInfo": "Flood level reached chest height.",
  "dateSubmitted": "2026-04-07T09:30:00+08:00",
  "photoProof": "data:image/jpeg;base64,..."
}
```

### Admin verification
- `GET /api/beneficiaries/admin/proof-submissions`
- `PATCH /api/beneficiaries/admin/proof-submissions/:id/review`

Review body:
```json
{
  "decision": "Approved"
}
```

Or:
```json
{
  "decision": "Rejected",
  "rejectionReason": "Submitted photo is unclear and does not show event damage."
}
```

### QR validation and claim
- `POST /api/beneficiaries/scan/validate`
- `POST /api/beneficiaries/scan/claim`

### Offline support
- `GET /api/beneficiaries/events/:id/offline-pack`
- `POST /api/beneficiaries/sync/proof-submissions`
- `POST /api/beneficiaries/sync/claims`

## 5. Validation Rules

### Resident proof submission
- Resident must be authenticated as `Resident`
- Resident registration must already be `Approved`
- Event must exist and be `Active`
- If `submissionDeadline` exists, it must not be passed
- `damageType` must be one of:
  - `Flood`
  - `House Damage`
  - `Storm Surge`
  - `Landslide`
  - `Livelihood Loss`
  - `Other`
- `description` minimum length: 10
- `photoProof` is required
- One proof submission record is maintained per resident per event
- Re-submission updates the same record and increments `submissionVersion`

### Admin review
- Only `SUPERADMIN` or `LGU_STAFF` can review submissions
- `LGU_STAFF` can only review submissions from their scoped barangays
- Rejection requires `rejectionReason`

### QR validation
- QR must contain a valid permanent resident token
- Resident record must exist
- Resident registration must be `Approved`
- Resident QR must not be revoked
- Event eligibility must be `Eligible`
- Existing disaster-event claim must not already exist

## 6. Offline Sync Behavior

### Resident mobile app
- First-time login requires internet because the server must issue and validate the token.
- After a successful login, the app can cache the session locally so the home screen still opens offline.
- Proof submissions created offline are saved locally with `Pending Sync`.
- When online again, the app pushes them to `/api/beneficiaries/sync/proof-submissions`.

### Volunteer scanner app
- Before field deployment, the app downloads `/api/beneficiaries/events/:id/offline-pack`.
- Cached pack includes:
  - `residentId`
  - `qrToken`
  - `fullName`
  - `barangay`
  - `eligibilityStatus`
  - `claimStatus`
- If offline during scanning:
  - the app validates against the downloaded list
  - claim attempts are stored locally
  - once online, they sync through `/api/beneficiaries/sync/claims`

### Server reconciliation
- Each synced item writes to `OfflineSyncQueue`
- `clientGeneratedId` prevents duplicate server processing
- Successful sync updates queue status to `Synced`
- Failed sync stores `errorMessage`

## 7. QR Scan Verification Logic

### Input
- `qrData`
- optional `disasterEventId`

### Algorithm
1. Resolve active event, or use provided event ID.
2. Decode resident QR payload.
3. Find resident by permanent `residentCode`.
4. If QR is malformed or resident is not found: `Invalid QR`
5. If resident registration is not approved or QR is revoked: `Not eligible for this event`
6. Check `BeneficiaryEligibility` for `(residentId, disasterEventId)`
7. If no eligible record exists: `Not eligible for this event`
8. Check `Claims` for an existing `DISASTER_EVENT` claim for the same resident/event
9. If found: `Already claimed`
10. Otherwise: `Valid - eligible to claim`

## 8. Sample Pseudocode

### Beneficiary approval
```text
function reviewProofSubmission(submissionId, decision, reviewerId, rejectionReason):
  submission = findProofSubmission(submissionId)
  resident = findResident(submission.residentId)

  if submission not found:
    return error("Proof submission not found")

  submission.status = decision
  submission.reviewedBy = reviewerId
  submission.reviewedAt = now()

  if decision == "Rejected":
    submission.rejectionReason = rejectionReason
    eligibilityStatus = "Not Eligible"
  else if resident.status == "Approved":
    eligibilityStatus = "Eligible"
  else:
    eligibilityStatus = "Not Eligible"

  save(submission)

  upsert BeneficiaryEligibility where residentId + disasterEventId:
    proofSubmissionId = submission.id
    registrationStatus = resident.status
    proofStatus = submission.status
    status = eligibilityStatus
    rejectionReason = submission.rejectionReason
    reviewedBy = reviewerId
    reviewedAt = now()

  return submission, eligibilityStatus
```

### Claim validation
```text
function validateClaim(qrData, disasterEventId):
  residentCode = decodePermanentQr(qrData)
  if residentCode is invalid:
    return "Invalid QR"

  resident = findResidentByCode(residentCode)
  if resident not found:
    return "Invalid QR"

  if resident.status != "Approved" or resident.qrStatus == "REVOKED":
    return "Not eligible for this event"

  eligibility = findBeneficiaryEligibility(resident.id, disasterEventId)
  if not eligibility or eligibility.status != "Eligible":
    return "Not eligible for this event"

  existingClaim = findClaim(
    claimCategory = "DISASTER_EVENT",
    residentId = resident.id,
    disasterEventId = disasterEventId,
    claimStatus = "Claimed"
  )

  if existingClaim exists:
    return "Already claimed"

  return "Valid - eligible to claim"
```

## 9. Files Added or Updated

Backend implementation:
- `apps/web/apps/server/models/DisasterEvent.ts`
- `apps/web/apps/server/models/ProofSubmission.ts`
- `apps/web/apps/server/models/BeneficiaryEligibility.ts`
- `apps/web/apps/server/models/OfflineSyncQueue.ts`
- `apps/web/apps/server/services/beneficiaryService.ts`
- `apps/web/apps/server/routes/beneficiaryRoutes.ts`
- `apps/web/apps/server/validation/beneficiary.schema.ts`

Existing backend integrations:
- `apps/web/apps/server/index.ts`
- `apps/web/apps/server/models/Claim.ts`
- `apps/web/apps/server/models/AuditLog.ts`
- `apps/web/apps/server/routes/claimRoutes.ts`
- `apps/web/apps/server/routes/householdRoutes.ts`
- `apps/web/apps/server/routes/householdListRoutes.ts`
- `apps/web/apps/server/routes/authRoutes.ts`

Tests:
- `apps/web/apps/server/test/beneficiaryFlow.unit.ts`
- `apps/web/apps/server/test/runBeneficiaryFlowTests.ts`