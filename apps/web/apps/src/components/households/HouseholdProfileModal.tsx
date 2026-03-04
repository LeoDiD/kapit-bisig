import React from 'react'
import type { HouseholdRow } from '@/app/households/page'

interface HouseholdProfileModalProps {
  isOpen: boolean
  onClose: () => void
  data: HouseholdRow | null
}

export default function HouseholdProfileModal({ isOpen, onClose, data }: HouseholdProfileModalProps) {
  if (!isOpen || !data) return null

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="min-h-full px-4 py-10 flex items-start justify-center">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-gray-100 overflow-hidden max-h-[calc(100vh-5rem)] flex flex-col">
          {/* Header */}
          <div className="p-5 pb-3 bg-white shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{data.familyHeadName}</h2>
                <p className="text-sm text-gray-500 mt-1">Household profile</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 pb-5 space-y-4 overflow-y-auto flex-1">
            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-10">
              <div>
                <p className="text-xs text-gray-500 mb-1">Address</p>
                <p className="text-sm font-medium text-gray-900">{data.address}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Barangay</p>
                <p className="text-sm font-medium text-gray-900">{data.barangay}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Members</p>
                <p className="text-sm font-medium text-gray-900">{data.familyMembersCount} Persons</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Contact</p>
                <p className="text-sm font-medium text-gray-900">{data.contact}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Household Code</p>
                <p className="text-sm font-medium text-gray-900 font-mono">{data.householdCode}</p>
              </div>
            </div>

            {/* Claim Status */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-[#0F533A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-bold text-[#0F533A]">Claim Status</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center justify-center h-7 px-4 rounded-full text-xs font-semibold ${
                  data.claimStatus === 'Claimed' ? 'bg-green-600 text-white' : 'bg-[#EAB308] text-white'
                }`}>
                  {data.claimStatus}
                </span>
                {data.lastClaimedAt && (
                  <span className="text-xs text-gray-500">
                    Last claimed: {new Date(data.lastClaimedAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Registration Info */}
            {data.registeredAt && (
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Registered</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(data.registeredAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
