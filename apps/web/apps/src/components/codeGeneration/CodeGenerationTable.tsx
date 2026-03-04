'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { BARANGAY_OPTIONS, getScopedBarangays } from '@/lib/api'
import { showToast } from '@/lib/toast'
import { useAuth } from '@/lib/AuthContext'
import BatchHistory from './BatchHistory'
import CodeGenerationForm from './CodeGenerationForm'
import DownloadActions from './DownloadActions'
import GeneratedCodesTable from './GeneratedCodesTable'
import SecurityNotes from './SecurityNotes'
import { copyToClipboard, downloadCsv, downloadPdf } from './utils'
import type { BatchHistoryItem, CodeStatus, GeneratedCodeRow, NormalizedGenerationResult } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || '/api'
const EXPIRY_DAYS = 30
const SWEETALERT_SCRIPT_ID = 'sweetalert2-cdn-script'

type RawCode = string | { code?: string; token?: string; barangay?: string; status?: string; expiresAt?: string; expiry?: string }

type GenerateApiResponse = {
  success?: boolean
  message?: string
  data?: {
    batchId?: string
    generatedBy?: string
    generatedAt?: string
    resolveTimeMs?: number
    codes?: RawCode[]
    tokens?: RawCode[]
    created?: RawCode[]
    failedCount?: number
    errors?: string[]
  }
  batchId?: string
  generatedBy?: string
  generatedAt?: string
  resolveTimeMs?: number
  codes?: RawCode[]
  tokens?: RawCode[]
  created?: RawCode[]
  failedCount?: number
  errors?: string[]
}

type SweetAlertOptions = {
  icon: 'success' | 'error' | 'warning' | 'info' | 'question'
  title: string
  text: string
  confirmButtonText?: string
  confirmButtonColor?: string
}

type SwalLike = {
  fire: (options: SweetAlertOptions) => Promise<unknown>
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : undefined
}

async function loadSwal(): Promise<SwalLike | null> {
  if (typeof window === 'undefined') return null

  const maybeSwal = (window as Window & { Swal?: SwalLike }).Swal
  if (maybeSwal?.fire) return maybeSwal

  const existing = document.getElementById(SWEETALERT_SCRIPT_ID) as HTMLScriptElement | null
  if (existing) {
    await new Promise<void>((resolve) => {
      if ((window as Window & { Swal?: SwalLike }).Swal?.fire) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => resolve(), { once: true })
    })
    return (window as Window & { Swal?: SwalLike }).Swal || null
  }

  const script = document.createElement('script')
  script.id = SWEETALERT_SCRIPT_ID
  script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11'
  script.async = true
  document.body.appendChild(script)

  await new Promise<void>((resolve) => {
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => resolve(), { once: true })
  })

  return (window as Window & { Swal?: SwalLike }).Swal || null
}

async function showSuccessSweetAlert(text: string): Promise<void> {
  const swal = await loadSwal()
  if (!swal?.fire) {
    showToast.success(text)
    return
  }

  await swal.fire({
    icon: 'success',
    title: 'Codes Generated',
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: '#047857',
  })
}

function toReadableDate(input: Date | string): string {
  const date = typeof input === 'string' ? new Date(input) : input
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizeStatus(value: string | undefined): CodeStatus {
  const upper = (value || 'UNUSED').toUpperCase()
  if (upper === 'USED' || upper === 'EXPIRED' || upper === 'LOCKED') return upper
  return 'UNUSED'
}

function extractRows(rawCodes: RawCode[] | undefined, barangay: string, fallbackExpiry: string): GeneratedCodeRow[] {
  if (!rawCodes?.length) return []

  return rawCodes
    .map((entry) => {
      if (typeof entry === 'string') {
        return {
          code: entry,
          barangay,
          status: 'UNUSED' as const,
          expiry: fallbackExpiry,
        }
      }

      const codeValue = (entry.code || entry.token || '').trim()
      if (!codeValue) return null

      const expiry = entry.expiresAt || entry.expiry
      return {
        code: codeValue,
        barangay: entry.barangay || barangay,
        status: normalizeStatus(entry.status),
        expiry: expiry ? toReadableDate(expiry) : fallbackExpiry,
      }
    })
    .filter((item): item is GeneratedCodeRow => Boolean(item))
}

function normalizeGenerationResponse(
  response: GenerateApiResponse,
  barangay: string,
  defaultExpiry: string,
  quantity: number
): NormalizedGenerationResult {
  const payload = response.data || response
  const fullCodes = payload.codes || payload.tokens
  const partialCodes = payload.created
  const rows = extractRows(fullCodes || partialCodes, barangay, defaultExpiry)
  const failedCount = typeof payload.failedCount === 'number' ? payload.failedCount : Math.max(0, quantity - rows.length)

  return {
    batchId: payload.batchId || `batch-${Date.now()}`,
    rows,
    summary: {
      generatedCount: rows.length,
      failedCount,
      resolveTimeMs: payload.resolveTimeMs,
    },
    generatedBy: payload.generatedBy || 'Current User',
    date: toReadableDate(payload.generatedAt || new Date()),
    errors: payload.errors || response.errors || [],
  }
}

function filterRows(rows: GeneratedCodeRow[], search: string, statusFilter: 'ALL' | CodeStatus): GeneratedCodeRow[] {
  return rows.filter((row) => {
    const matchesSearch = !search || row.code.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || row.status === statusFilter
    return matchesSearch && matchesStatus
  })
}

// Placeholder for future GET history endpoint integration.
async function loadBatchHistoryFromApi(): Promise<BatchHistoryItem[]> {
  return []
}

export default function CodeGenerationTable() {
  const { user } = useAuth()
  const scopedBarangays = useMemo(
    () => getScopedBarangays(user?.role, user?.assignedBarangays),
    [user?.role, user?.assignedBarangays],
  )

  const [barangay, setBarangay] = useState('')
  const [quantity, setQuantity] = useState('10')
  const [isLoading, setIsLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [activeUnusedLabel, setActiveUnusedLabel] = useState('Select a barangay to view active unused codes')

  const [rows, setRows] = useState<GeneratedCodeRow[]>([])
  const [summary, setSummary] = useState<{ generatedCount: number; failedCount: number; resolveTimeMs?: number } | null>(null)
  const [errorBanner, setErrorBanner] = useState('')

  const [history, setHistory] = useState<BatchHistoryItem[]>([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | CodeStatus>('ALL')

  const quantityNumber = Number(quantity)
  const quantityError = useMemo(() => {
    if (!quantity.trim()) return 'Quantity is required.'
    if (!Number.isInteger(quantityNumber)) return 'Quantity must be a whole number.'
    if (quantityNumber < 1 || quantityNumber > 100) return 'Quantity must be between 1 and 100.'
    return ''
  }, [quantity, quantityNumber])

  const expirationDate = useMemo(() => {
    const date = new Date(now)
    date.setDate(date.getDate() + EXPIRY_DAYS)
    return date
  }, [now])

  const expirationLabel = useMemo(() => toReadableDate(expirationDate), [expirationDate])
  const canSubmit = Boolean(barangay) && !quantityError && !isLoading

  const filteredRows = useMemo(() => filterRows(rows, search, statusFilter), [rows, search, statusFilter])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date())
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    let mounted = true

    const run = async () => {
      const initial = await loadBatchHistoryFromApi()
      if (mounted && initial.length) {
        setHistory(initial)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const fetchStats = async () => {
      if (!barangay) {
        setActiveUnusedLabel('Select a barangay to view active unused codes')
        return
      }

      try {
        const response = await fetch(`${API_URL}/residents/codes/stats?barangayId=${encodeURIComponent(barangay)}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Stats endpoint unavailable')
        }

        const json = await response.json()
        const activeUnused = typeof json?.activeUnused === 'number' ? json.activeUnused : null
        if (mounted) {
          setActiveUnusedLabel(
            activeUnused === null
              ? 'Active unused codes: unavailable'
              : `Active unused codes in this barangay: ${activeUnused}`
          )
        }
      } catch {
        if (mounted) {
          setActiveUnusedLabel('Active unused codes: unavailable')
        }
      }
    }

    fetchStats()

    return () => {
      mounted = false
    }
  }, [barangay])

  const submitGeneration = async () => {
    if (!canSubmit || isLoading) return

    try {
      setIsLoading(true)
      setErrorBanner('')
      const csrfToken = getCookie('XSRF-TOKEN')

      const response = await fetch(`${API_URL}/residents/codes/generate-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          barangay,
          quantity: quantityNumber,
        }),
      })

      const json = (await response.json()) as GenerateApiResponse
      const normalized = normalizeGenerationResponse(json, barangay, expirationLabel, quantityNumber)
      const successFlag = json.success

      if ((!response.ok || successFlag === false) && normalized.rows.length === 0) {
        setSummary({ generatedCount: 0, failedCount: quantityNumber })
        setErrorBanner(json.message || 'Failed to generate codes.')
        return
      }

      if ((!response.ok || successFlag === false) && normalized.rows.length > 0) {
        setErrorBanner(json.message || 'Request partially failed. Some codes were still created.')
      } else if (normalized.errors.length) {
        setErrorBanner(normalized.errors.join(', '))
      }

      setRows(normalized.rows)
      setSummary(normalized.summary)
      setSearch('')
      setStatusFilter('ALL')

      const historyItem: BatchHistoryItem = {
        batchId: normalized.batchId,
        barangay,
        quantity: quantityNumber,
        generatedBy: normalized.generatedBy,
        date: normalized.date,
        rows: normalized.rows,
        summary: normalized.summary,
      }

      setHistory((prev) => [historyItem, ...prev])

      if (normalized.rows.length > 0) {
        await showSuccessSweetAlert(
          `${normalized.rows.length} code${normalized.rows.length > 1 ? 's' : ''} generated successfully.`
        )
      }

      if (normalized.summary.failedCount > 0 && normalized.rows.length === 0) {
        showToast.error('No codes were created.')
      }
    } catch {
      setErrorBanner('Failed to connect to the server.')
      setSummary({ generatedCount: 0, failedCount: quantityNumber })
    } finally {
      setIsLoading(false)
      setConfirmOpen(false)
    }
  }

  const onCopyRow = async (code: string) => {
    try {
      await copyToClipboard(code)
      showToast.success('Code copied to clipboard.')
    } catch {
      showToast.error('Unable to copy code.')
    }
  }

  const onCopyAll = async () => {
    if (!filteredRows.length) return

    try {
      const text = filteredRows.map((row) => row.code).join('\n')
      await copyToClipboard(text)
      showToast.success('All codes copied.')
    } catch {
      showToast.error('Unable to copy all codes.')
    }
  }

  const onDownloadCsv = () => {
    if (!filteredRows.length) return
    downloadCsv(filteredRows, `kapit-bisig-codes-${Date.now()}`)
  }

  const onDownloadPdf = () => {
    if (!filteredRows.length) return
    downloadPdf(filteredRows, `kapit-bisig-codes-${Date.now()}`, 'Kapit-Bisig Generated Codes')
  }

  const onViewBatch = (batchId: string) => {
    const selected = history.find((item) => item.batchId === batchId)
    if (!selected) return
    setRows(selected.rows)
    setSummary(selected.summary)
    setBarangay(selected.barangay)
    setQuantity(String(selected.quantity))
    setSearch('')
    setStatusFilter('ALL')
    setErrorBanner('')
  }

  return (
    <div className="space-y-6 bg-slate-50 p-1">
      <CodeGenerationForm
        barangay={barangay}
        setBarangay={setBarangay}
        quantity={quantity}
        setQuantity={setQuantity}
        expirationLabel={expirationLabel}
        activeUnusedLabel={activeUnusedLabel}
        quantityError={quantityError}
        canSubmit={canSubmit}
        isLoading={isLoading}
        hasGeneratedBatch={rows.length > 0}
        onOpenConfirm={() => setConfirmOpen(true)}
        confirmOpen={confirmOpen}
        onCloseConfirm={() => setConfirmOpen(false)}
        onConfirmGenerate={submitGeneration}
        barangayOptions={scopedBarangays}
      />

      <GeneratedCodesTable
        rows={filteredRows}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onCopyRow={onCopyRow}
        summary={summary}
        errorBanner={errorBanner}
        downloadActions={
          <DownloadActions
            disabled={!filteredRows.length}
            onDownloadCsv={onDownloadCsv}
            onDownloadPdf={onDownloadPdf}
            onCopyAll={onCopyAll}
          />
        }
      />

      <BatchHistory history={history} onView={onViewBatch} />

      <SecurityNotes />
    </div>
  )
}




