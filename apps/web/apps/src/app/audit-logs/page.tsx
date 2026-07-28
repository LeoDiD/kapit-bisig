'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { DashboardLayout, Header } from '@/components/layout'
import { api } from '@/lib/api'
import type { AuditLogRecord } from '@/lib/api'
import { showToast } from '@/lib/toast'
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [actionFilter, setActionFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getAuditLogs({
        page,
        limit: 50,
        action: actionFilter || undefined,
        actorRole: roleFilter || undefined
      })
      setLogs(res.data || [])
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages)
      }
    } catch (err) {
      console.error(err)
      showToast.error('Failed to load audit logs.')
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter, roleFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return (
    <DashboardLayout>
      <Header
        title="Audit Logs"
        subtitle="System activity and security events (Superadmin Only)"
      />

      <div className="mt-6 flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 max-w-sm relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select 
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">Login Success</option>
            <option value="LOGIN_FAILURE">Login Failure</option>
            <option value="DISTRIBUTION_CREATED">Distribution Created</option>
            <option value="CLAIM_RECORDED">Claim Recorded</option>
            <option value="STAFF_CREATED">Staff Created</option>
          </select>
        </div>

        <div className="flex-1 max-w-sm relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select 
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Roles</option>
            <option value="SUPERADMIN">Superadmin</option>
            <option value="LGU_STAFF">LGU Staff</option>
            <option value="Volunteer">Volunteer</option>
            <option value="Resident">Resident</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">IP / User Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <Search className="w-8 h-8 mb-2 opacity-20" />
                      No audit logs found.
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 dark:text-white font-medium">{log.actorName || log.actorId || 'System'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{log.actorRole}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600 dark:text-slate-300">{log.entityType}</div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">{log.entityId}</div>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <div className="text-slate-600 dark:text-slate-300 font-mono text-xs">{log.ip}</div>
                      <div className="text-[10px] text-slate-400 mt-1 truncate" title={log.userAgent}>{log.userAgent}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
