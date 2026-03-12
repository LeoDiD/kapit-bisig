/**
 * Hash Helpers
 *
 * Produces bytes32-compatible keccak256 hashes used both for on-chain
 * storage and for linking off-chain MongoDB records.
 *
 * Uses ethers.solidityPackedKeccak256 so the output matches what
 * Solidity's keccak256(abi.encodePacked(...)) would produce.
 *
 * IMPORTANT: A server-side HASH_SALT is mixed in to prevent
 * rainbow-table attacks against household / event IDs.
 */

import { ethers } from 'ethers';
import { env } from '../config/env';

function getSalt(): string {
  return env.HASH_SALT;
}

/**
 * Hash a household identifier into a bytes32 value.
 * Input: any string that uniquely identifies the household (e.g. Mongo _id or householdCode).
 */
export function computeHouseholdHash(householdId: string): string {
  return ethers.solidityPackedKeccak256(
    ['string', 'string'],
    [householdId, getSalt()],
  );
}

/**
 * Hash a distribution event identifier into a bytes32 value.
 * Input: any string that uniquely identifies the distribution (e.g. Mongo _id).
 */
export function computeEventHash(distributionId: string): string {
  return ethers.solidityPackedKeccak256(
    ['string', 'string'],
    [distributionId, getSalt()],
  );
}
