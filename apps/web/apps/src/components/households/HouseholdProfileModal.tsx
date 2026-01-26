import React from 'react'

type ClaimItem = {
  date: string
  items: string
  verifiedBy: string
  status: 'Claimed'
}

interface HouseholdData {
  id: number
  head: string
  address: string
  barangay: string
  members: number
  score: number
  priority: string
  status: string
  contact?: string
  riskFactors?: string[]
  claimHistory?: ClaimItem[]
}

interface HouseholdProfileModalProps {
  isOpen: boolean
  onClose: () => void
  data: HouseholdData | null
}

export default function HouseholdProfileModal({ isOpen, onClose, data }: HouseholdProfileModalProps) {
  if (!isOpen || !data) return null

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-red-500' }
    if (score >= 50) return { bg: 'bg-[#EAB308]' }
    return { bg: 'bg-green-600' }
  }

  const scoreStyle = getScoreColor(data.score)
  const claims = data.claimHistory ?? []
  const hasClaims = claims.length > 0

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="min-h-full px-4 py-10 flex items-start justify-center">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-gray-100 overflow-hidden max-h-[calc(100vh-5rem)] flex flex-col">
          {/* Header */}
          <div className="p-6 pb-4 bg-white shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{data.head}</h2>
                <p className="text-gray-500 mt-1">Household profile and AI priority analysis</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 pb-6 space-y-5 overflow-y-auto flex-1">
            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-y-5 gap-x-12">
              <div>
                <p className="text-sm text-gray-500 mb-1">Address</p>
                <p className="font-medium text-gray-900">{data.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Barangay</p>
                <p className="font-medium text-gray-900">{data.barangay}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Members</p>
                <p className="font-medium text-gray-900">{data.members} Persons</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Contact</p>
                <p className="font-medium text-gray-900">{data.contact || '09123456789'}</p>
              </div>
            </div>

            {/* AI Priority Analysis */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-[#0F533A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="font-bold text-[#0F533A]">AI Priority Analysis</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-[#0F533A]">{data.score}</span>
                <div className="flex-1">
                  <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${scoreStyle.bg}`} style={{ width: `${data.score}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Priority Score</p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Risk Factors:</p>
                <div className="flex flex-wrap gap-2">
                  {(data.riskFactors || ['Informal settler']).map((risk, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600"
                    >
                      {risk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Claim History */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-[#0F533A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22a10 10 0 110-20 10 10 0 010 20z" />
                </svg>
                <span className="font-bold text-[#0F533A]">Claim History</span>
              </div>

              {!hasClaims ? (
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 flex flex-col items-center justify-center text-center min-h-[140px]">
                  <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-sm text-gray-400">No claims recorded yet</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3">
                  <div className="max-h-[220px] overflow-y-auto pr-1 space-y-3">
                    {claims.map((c, idx) => (
                      <div key={idx} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 11h14M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
                            </svg>
                            {c.date}
                          </div>
                          <div className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">{c.items}</div>
                          <div className="text-[11px] text-gray-400 mt-2">Verified by: {c.verifiedBy}</div>
                        </div>

                        <span className="shrink-0 inline-flex items-center justify-center h-6 px-3 rounded-full text-xs font-medium bg-green-600 text-white">
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* QR Code Section */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">QR Code</p>
                <p className="font-mono font-medium text-gray-900">QR-00{data.id}-TAN</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM6 6h2v2H6V6zm0 10h2v2H6v-2zm10-10h2v2h-2V6zM6 12h2v2H6v-2zm10 2h2v2h-2v-2zM4 4h16v16H4V4z" />
                </svg>
                Generate QR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
