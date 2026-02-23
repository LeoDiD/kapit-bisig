export type CodeStatus = 'UNUSED' | 'USED' | 'EXPIRED' | 'LOCKED'

export type GeneratedCodeRow = {
  code: string
  barangay: string
  status: CodeStatus
  expiry: string
}

export type BatchSummary = {
  generatedCount: number
  failedCount: number
  resolveTimeMs?: number
}

export type BatchHistoryItem = {
  batchId: string
  barangay: string
  quantity: number
  generatedBy: string
  date: string
  rows: GeneratedCodeRow[]
  summary: BatchSummary
}

export type NormalizedGenerationResult = {
  batchId: string
  rows: GeneratedCodeRow[]
  summary: BatchSummary
  generatedBy: string
  date: string
  errors: string[]
}

