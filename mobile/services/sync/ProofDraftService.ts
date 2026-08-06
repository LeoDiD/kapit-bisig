/**
 * ProofDraftService
 *
 * Persists the proof submission form state to local storage so residents
 * don't lose their work if the app closes or they navigate away.
 *
 * Draft data is stored as a JSON string in expo-secure-store, keyed per
 * resident to prevent cross-contamination between accounts.
 */

import * as FileSystem from 'expo-file-system/legacy';

const DRAFT_DIR = `${FileSystem.documentDirectory || ''}proof-drafts/`;

export interface ProofDraft {
  damageType: string;
  description: string;
  supportingInfo: string;
  showSupportingInfo: boolean;
  selectedDistributionId: string | null;
  photoUris: string[];
  savedAt: string;
}

function getDraftPath(residentToken: string): string {
  // Use a hash-like suffix derived from the token to namespace drafts per resident.
  // We take the last 16 chars to keep it short but unique enough.
  const suffix = residentToken.slice(-16).replace(/[^a-zA-Z0-9]/g, 'x');
  return `${DRAFT_DIR}draft_${suffix}.json`;
}

/**
 * Save the current form state as a draft.
 */
export async function saveProofDraft(
  residentToken: string,
  draft: Omit<ProofDraft, 'savedAt'>,
): Promise<void> {
  try {
    // Ensure draft directory exists
    const dirInfo = await FileSystem.getInfoAsync(DRAFT_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DRAFT_DIR, { intermediates: true });
    }

    const path = getDraftPath(residentToken);
    const data: ProofDraft = {
      ...draft,
      savedAt: new Date().toISOString(),
    };
    await FileSystem.writeAsStringAsync(path, JSON.stringify(data), {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error) {
    console.warn('[ProofDraft] Failed to save draft:', error);
  }
}

/**
 * Load a previously saved draft, if one exists.
 */
export async function loadProofDraft(
  residentToken: string,
): Promise<ProofDraft | null> {
  try {
    const path = getDraftPath(residentToken);
    const fileInfo = await FileSystem.getInfoAsync(path);
    if (!fileInfo.exists) return null;

    const raw = await FileSystem.readAsStringAsync(path, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ProofDraft;

    // Discard drafts older than 7 days
    const savedAt = new Date(parsed.savedAt);
    const ageMs = Date.now() - savedAt.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (ageMs > sevenDaysMs) {
      await clearProofDraft(residentToken);
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('[ProofDraft] Failed to load draft:', error);
    return null;
  }
}

/**
 * Clear any saved draft for the current resident.
 */
export async function clearProofDraft(
  residentToken: string,
): Promise<void> {
  try {
    const path = getDraftPath(residentToken);
    const fileInfo = await FileSystem.getInfoAsync(path);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(path, { idempotent: true });
    }
  } catch (error) {
    console.warn('[ProofDraft] Failed to clear draft:', error);
  }
}

/**
 * Check whether a draft exists without fully parsing it.
 */
export async function hasProofDraft(
  residentToken: string,
): Promise<boolean> {
  try {
    const path = getDraftPath(residentToken);
    const fileInfo = await FileSystem.getInfoAsync(path);
    return fileInfo.exists;
  } catch {
    return false;
  }
}
