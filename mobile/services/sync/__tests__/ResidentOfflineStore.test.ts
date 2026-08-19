import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isCachedEventUsable,
  isOfflineCacheWithinGrace,
  type OfflinePolicyCache,
} from '../OfflinePolicy';
import { shouldInvalidateVirtualId } from '../VirtualIdPolicy';

const NOW = new Date('2026-08-10T00:00:00.000Z').getTime();

function buildCache(overrides: Partial<OfflinePolicyCache> = {}): OfflinePolicyCache {
  return {
    activeEvent: {
      submissionDeadline: '2026-08-11T00:00:00.000Z',
      status: 'Active',
    },
    activeEventFetchedAt: '2026-08-09T00:00:00.000Z',
    lastOnlineValidatedAt: '2026-08-09T00:00:00.000Z',
    ...overrides,
  };
}

describe('resident offline policy', () => {
  it('accepts a cache inside the seven-day grace period', () => {
    assert.equal(isOfflineCacheWithinGrace(buildCache(), NOW), true);
  });

  it('rejects an expired or invalid validation timestamp', () => {
    assert.equal(isOfflineCacheWithinGrace(buildCache({
      lastOnlineValidatedAt: '2026-08-01T00:00:00.000Z',
    }), NOW), false);
    assert.equal(isOfflineCacheWithinGrace(buildCache({ lastOnlineValidatedAt: 'invalid' }), NOW), false);
  });

  it('uses a recently cached active event before its deadline', () => {
    assert.equal(isCachedEventUsable(buildCache(), NOW), true);
  });

  it('rejects closed, stale, and deadline-expired cached events', () => {
    assert.equal(isCachedEventUsable(buildCache({
      activeEvent: { ...buildCache().activeEvent!, status: 'Closed' },
    }), NOW), false);
    assert.equal(isCachedEventUsable(buildCache({ activeEventFetchedAt: '2026-08-01T00:00:00.000Z' }), NOW), false);
    assert.equal(isCachedEventUsable(buildCache({
      activeEvent: {
        ...buildCache().activeEvent!,
        submissionDeadline: '2026-08-09T23:59:59.000Z',
      },
    }), NOW), false);
  });
});

describe('virtual ID cache policy', () => {
  it('keeps the saved ID for transient failures and only invalidates authoritative responses', () => {
    assert.equal(shouldInvalidateVirtualId(403), true);
    assert.equal(shouldInvalidateVirtualId(401, 'TOKEN_REVOKED'), true);
    assert.equal(shouldInvalidateVirtualId(429), false);
    assert.equal(shouldInvalidateVirtualId(503), false);
  });
});
