# Target Beneficiary Implementation

This document describes the current target-beneficiary implementation for Kapit Bisig.

## 1. Primary Rule

Target-beneficiary approval is now **distribution-scoped**.

That means:

1. A resident must be an approved resident account.
2. A resident must submit proof for a **specific distribution**.
3. Admin must approve that proof for that **same distribution**.
4. The resident can only claim in that approved distribution.
5. If a **new distribution** is created, the same resident must submit again for that new distribution.

This is the enforced rule in the claim path.

## 2. Flow

### A. Distribution creation

When a new distribution is created:

- `Distribution.requiresBeneficiaryApproval = true`
- the distribution starts with `0` approved beneficiaries
- residents in covered barangays are notified that approval is required before claiming

### B. Resident application

Resident opens the list of open beneficiary distributions:

- `GET /api/beneficiaries/distributions/open`

Resident submits proof for one specific distribution:

- `POST /api/beneficiaries/proof-submissions`

Required scope field:

- `distributionId`

Legacy compatibility:

- `disasterEventId` is still supported for older event-based flows
- new target-beneficiary work should use `distributionId`

### C. Admin review

Admin reviews proof submissions from:

- `GET /api/beneficiaries/admin/proof-submissions`

Admin approves or rejects:

- `PATCH /api/beneficiaries/admin/proof-submissions/:id/review`

If approved:

- `ProofSubmission.status = Approved`
- `BeneficiaryEligibility.status = Eligible`
- eligibility is stored for `(residentId, distributionId)`

If rejected:

- `ProofSubmission.status = Rejected`
- `BeneficiaryEligibility.status = Not Eligible`

### D. Claim

The main enforced claim route is:

- `POST /api/claims/record-claim`
- `POST /api/claims/record-claim-batch`

For targeted distributions, claim now requires all of the following:

1. valid claim token
2. approved resident record
3. resident barangay covered by the distribution
4. distribution not already completed
5. token not bound to a different distribution
6. resident has approved `BeneficiaryEligibility` for that exact distribution
7. resident has not already claimed for that distribution

If the resident has approval for Distribution A only:

- they can claim Distribution A
- they cannot claim Distribution B until a new approved application exists for Distribution B

## 3. Data Model

### `Distribution`

Added:

- `requiresBeneficiaryApproval: boolean`

New distributions are created with:

- `requiresBeneficiaryApproval = true`

### `ProofSubmission`

Supports both scopes:

- `distributionId`
- `disasterEventId`

Current target-beneficiary use:

- one proof submission per `residentId + distributionId`

### `BeneficiaryEligibility`

Supports both scopes:

- `distributionId`
- `disasterEventId`

Current target-beneficiary use:

- one eligibility snapshot per `residentId + distributionId`

### `OfflineSyncQueue`

Added:

- `distributionId`

### `Claim`

Security hardening:

- distribution claims use a unique logical scope
- disaster-event claims use a separate unique logical scope

This avoids cross-scope collisions between:

- `DISTRIBUTION`
- `DISASTER_EVENT`

## 4. Endpoints

### Resident

- `GET /api/beneficiaries/distributions/open`
- `POST /api/beneficiaries/proof-submissions`
- `POST /api/beneficiaries/sync/proof-submissions`

Resident-authenticated proof uploads now enforce:

- `3` to `5` proof photos per submission
- JPEG, PNG, or WebP image payloads only
- maximum `2 MB` per image
- maximum `10 MB` combined payload across all proof photos
- images are persisted under `/uploads/resident-verification/`
- `ProofSubmission.photoProofUrl` and `photoProofUrls` store URL references, not raw base64 payloads

### Admin

- `GET /api/beneficiaries/admin/proof-submissions`
- `PATCH /api/beneficiaries/admin/proof-submissions/:id/review`

### Claims

- `POST /api/claims/record-claim`
- `POST /api/claims/record-claim-batch`

## 5. Security Improvements Implemented

### A. Real claim-path enforcement

Before:

- target-beneficiary approval existed in a separate event path
- the normal distribution claim route could still allow claims by covered approved residents

Now:

- the actual distribution claim route checks approved beneficiary eligibility for targeted distributions

### B. Single and batch claim parity

Before:

- batch and single claim handling did not share every validation step

Now:

- both paths use the same guarded preparation logic
- the same resident/distribution/approval checks apply to both

### C. Distribution-bound approval

Approval is now checked against:

- `residentId + distributionId`

This prevents carry-over approval from older distributions.

### D. Safer counts and status sync

Before:

- distribution totals were based on all approved residents in covered barangays

Now:

- targeted distributions count only approved eligible residents
- distribution household views also show only claimable approved beneficiaries

### E. Resident authentication upload requirements

Related resident registration and authentication-adjacent verification flows already use the same verification-image storage path:

- `/api/residents/register`
- `/api/household/register`
- `/api/household/auth/me/revision-submit`

Current requirements across those resident-authenticated flows:

- front ID, back ID, and face images are validated server-side before storage
- each image is limited to `2 MB`
- `/api/residents/register` also rejects total payloads above `8 MB`
- verification files are written to `/uploads/resident-verification/`
- resident records store file references in `frontIdImage`, `backIdImage`, and `faceImage`

## 6. Bottlenecks Found and Fixed

### Fixed bottlenecks

1. **Claim enforcement gap**
   - target-beneficiary approval did not affect the real `/api/claims` flow

2. **Batch-claim validation drift**
   - batch claims did not fully mirror single-claim protections

3. **Incorrect household totals**
   - distributions counted all approved residents, not approved beneficiaries

4. **Incorrect not-yet-claimed lists**
   - household modal showed everyone in covered barangays instead of only approved beneficiaries for targeted distributions

### Remaining watch items

1. **Legacy event-based beneficiary routes still exist**
   - kept for backward compatibility
   - new work should use distribution scope

2. **Index migration in existing production databases**
   - schema/index changes may require a controlled migration if old indexes already exist

3. **Resident-facing beneficiary UI**
   - backend support is now present
   - mobile/web screens should consume `GET /api/beneficiaries/distributions/open`

## 7. Current Business Rule Summary

If Resident X:

- applies for Distribution 1
- admin approves Distribution 1

then:

- Resident X can claim Distribution 1

If Distribution 2 is later created:

- Resident X cannot claim Distribution 2 automatically
- Resident X must submit again for Distribution 2
- Admin must approve again for Distribution 2

This is the logic currently implemented.
