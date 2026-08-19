import {
  clearStoredProofDraft,
  loadStoredProofDraft,
  migrateLegacyTokenDraft,
  saveStoredProofDraft,
  type StoredProofDraft,
} from './ResidentOfflineStore';

export type ProofDraft = StoredProofDraft;

export async function saveProofDraft(
  residentId: string,
  draft: Omit<ProofDraft, 'savedAt'>,
): Promise<void> {
  try {
    await saveStoredProofDraft(residentId, draft);
  } catch (error) {
    console.warn('[ProofDraft] Failed to save draft:', error);
  }
}

export async function loadProofDraft(
  residentId: string,
  legacyToken?: string,
): Promise<ProofDraft | null> {
  try {
    if (legacyToken) await migrateLegacyTokenDraft(residentId, legacyToken);
    return await loadStoredProofDraft(residentId);
  } catch (error) {
    console.warn('[ProofDraft] Failed to load draft:', error);
    return null;
  }
}

export async function clearProofDraft(residentId: string): Promise<void> {
  try {
    await clearStoredProofDraft(residentId);
  } catch (error) {
    console.warn('[ProofDraft] Failed to clear draft:', error);
  }
}

export async function hasProofDraft(residentId: string): Promise<boolean> {
  return Boolean(await loadProofDraft(residentId));
}
