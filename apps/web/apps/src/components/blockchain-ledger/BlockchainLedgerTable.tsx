import React from 'react'

export interface LedgerClaim {
  id: string
  dateTime: string
  barangay: string
  packType: string
  householdHash: string
  txHash: string
  blockNumber: string
  status: 'Confirmed' | 'Pending' | 'Failed'
}

interface BlockchainLedgerTableProps {
  claims: LedgerClaim[]
  onViewClaim: (claim: LedgerClaim) => void
}

function statusClasses(status: LedgerClaim['status']) {
  switch (status) {
    case 'Confirmed':
      return 'bg-green-100 text-green-700'
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'Failed':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function shortHash(hash: string) {
  if (hash.length <= 12) return hash
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`
}

export default function BlockchainLedgerTable({ claims, onViewClaim }: BlockchainLedgerTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500">
              <th className="px-4 py-3">Date/Time</th>
              <th className="px-4 py-3">Barangay</th>
              <th className="px-4 py-3">Pack Type</th>
              <th className="px-4 py-3">Household Hash</th>
              <th className="px-4 py-3">Tx Hash</th>
              <th className="px-4 py-3">Block #</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {claims.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                  No claims found.
                </td>
              </tr>
            ) : (
              claims.map((claim) => (
                <tr key={claim.id} className="text-[13px] text-gray-700 hover:bg-gray-50/60">
                  <td className="px-4 py-3 whitespace-nowrap">{claim.dateTime}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{claim.barangay}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 bg-white">
                      {claim.packType}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-gray-600">
                    {shortHash(claim.householdHash)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-gray-600">
                    {shortHash(claim.txHash)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{claim.blockNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusClasses(
                        claim.status
                      )}`}
                    >
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => onViewClaim(claim)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600"
                      aria-label={`View claim ${claim.id}`}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}
