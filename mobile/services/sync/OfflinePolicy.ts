const OFFLINE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

export interface OfflinePolicyCache {
  lastOnlineValidatedAt: string;
  activeEventFetchedAt: string | null;
  activeEvent: {
    status: string;
    submissionDeadline?: string | null;
  } | null;
}

export function isOfflineCacheWithinGrace(cache: OfflinePolicyCache, now = Date.now()): boolean {
  const validatedAt = new Date(cache.lastOnlineValidatedAt).getTime();
  return Number.isFinite(validatedAt) && now - validatedAt <= OFFLINE_GRACE_MS;
}

export function isCachedEventUsable(cache: OfflinePolicyCache, now = Date.now()): boolean {
  if (!cache.activeEvent || !cache.activeEventFetchedAt || cache.activeEvent.status !== 'Active') return false;
  const fetchedAt = new Date(cache.activeEventFetchedAt).getTime();
  if (!Number.isFinite(fetchedAt) || now - fetchedAt > OFFLINE_GRACE_MS) return false;
  const deadline = cache.activeEvent.submissionDeadline
    ? new Date(cache.activeEvent.submissionDeadline).getTime()
    : null;
  return deadline === null || !Number.isFinite(deadline) || deadline >= now;
}

