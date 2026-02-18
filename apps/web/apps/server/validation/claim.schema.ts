/**
 * Zod schemas for Claim routes (/api/claims)
 */

import { z } from 'zod';
import { trimmedString } from './shared';

/* POST /api/claims/record-claim */
export const recordClaimBody = z.object({
  claimToken: trimmedString(1, 100),
  distributionId: trimmedString(1, 100),
  distributionSite: trimmedString(1, 200),
}).strict();

/* GET /api/claims/ledger */
export const ledgerQuery = z.object({
  barangay: z.string().max(100).optional(),
  status: z.string().max(50).optional(),
  search: z.string().max(200).optional(),
}).strict();

/* POST /api/claims/:claimId/retry-chain */
export const retryChainParams = z.object({
  claimId: z.string().min(1).max(50),
}).strict();
