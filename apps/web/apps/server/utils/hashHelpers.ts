/**
 * Hash Helpers
 *
 * Produces deterministic 32-byte hashes used to link claim records.
 *
 * IMPORTANT: A server-side HASH_SALT is mixed in to prevent
 * rainbow-table attacks against household / event IDs.
 */

import crypto from 'crypto';
import { env } from '../config/env';

function getSalt(): string {
  return env.HASH_SALT;
}

/**
 * Hash a household identifier into a bytes32 value.
 * Input: any string that uniquely identifies the household (e.g. Mongo _id or householdCode).
 */
export function computeHouseholdHash(householdId: string): string {
  return `0x${crypto.createHash('sha256').update(`${householdId}:${getSalt()}`).digest('hex')}`;
}

/**
 * Hash a distribution event identifier into a bytes32 value.
 * Input: any string that uniquely identifies the distribution (e.g. Mongo _id).
 */
export function computeEventHash(distributionId: string): string {
  return `0x${crypto.createHash('sha256').update(`${distributionId}:${getSalt()}`).digest('hex')}`;
}
