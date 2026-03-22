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

/* POST /api/claims/record-claim-batch */
export const recordClaimBatchBody = z.object({
  claimTokens: z.array(trimmedString(1, 100)).min(1).max(100),
  distributionId: trimmedString(1, 100),
  distributionSite: trimmedString(1, 200),
}).strict();
