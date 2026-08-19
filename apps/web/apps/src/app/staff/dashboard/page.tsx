'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { StaffLayout } from '@/components/layout'
import {
  MetricStrip,
  StructuralDivider,
  ActionQueue,
  QuickActionsTerminal,
} from '@/components/staff-dashboard'
import { showToast } from '@/lib/toast'
import api from '@/lib/api'

export default function StaffDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const [distRes, reportRes, pendingResidentsRes, pendingProofsRes] = await Promise.all([
        api.getDistributions(),
        api.getReportSummary(),
        api.getResidents({ status: 'Pending', limit: 5 }),
        api.getBeneficiaryProofSubmissions({ status: 'Pending Verification', limit: 5 })
      ]);

      const distributions = Array.isArray(distRes.data) ? distRes.data : [];
      const pendingDist = distributions.filter((d) => d.status !== 'Claimed').length;
      const completedToday = reportRes.data?.overview?.completedToday || 0;
      const totalRegistered = reportRes.data?.overview?.totalRegisteredHouseholds || 0;

      setMetrics([
        { id: '1', label: 'Pending Distributions', value: pendingDist },
        { id: '2', label: 'Claims Completed Today', value: completedToday },
        { id: '3', label: 'Total Registered Households', value: totalRegistered }
      ]);

      const residents = pendingResidentsRes.data || [];
      const proofs = pendingProofsRes.data || [];

      const residentTasks = residents.map(r => ({
        id: `res-${r.id || r._id}`,
        title: `Pending Registration: ${r.fullName}`,
        description: `Needs review for Barangay ${r.barangay}.`,
        priority: 'high' as const,
        timestamp: new Date(r.createdAt || Date.now()).toLocaleDateString()
      }));

      const proofTasks = proofs.map(p => ({
        id: `proof-${p.id || p._id}`,
        title: `Proof Verification: ${p.resident?.fullName || 'Unknown'}`,
        description: `Submitted proof for ${p.event?.name || p.damageType}.`,
        priority: 'normal' as const,
        timestamp: new Date(p.createdAt || Date.now()).toLocaleDateString()
      }));

      setTasks([...residentTasks, ...proofTasks].slice(0, 5));
    } catch (err) {
      console.error(err);
      showToast.error('Failed to load dashboard data');
      setMetrics([
        { id: '1', label: 'Pending Distributions', value: 0 },
        { id: '2', label: 'Claims Completed Today', value: 0 },
        { id: '3', label: 'Total Registered', value: 0 }
      ]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const quickActions = [
    {
      id: 'qa-1',
      label: 'Approve Users',
      primary: true,
      onClick: () => showToast.success('Navigating to user approval...')
    },
    {
      id: 'qa-2',
      label: 'Export Data',
      onClick: () => showToast.success('Preparing export generation...')
    },
    {
      id: 'qa-3',
      label: 'Log Manual Claim',
      onClick: () => showToast.success('Opening manual claim form...')
    },
    {
      id: 'qa-4',
      label: 'Broadcast SMS',
      onClick: () => showToast.success('Opening broadcast settings...')
    }
  ]

  const handleTaskAction = async (id: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.7) {
          reject('Failed to complete task')
          return
        }
        showToast.success('Action resolved successfully')
        resolve()
      }, 1000)
    })
  }

  return (
    <StaffLayout>
      <div className="w-full flex-1">
        {/* Header / Title block - Edge to Edge */}
        <div className="p-8 border-b border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40">
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-2">
            Operations Control
          </h1>
          <p className="text-slate-500 font-medium">
            Staff command center. Priority actions and overview metrics.
          </p>
        </div>

        {/* Top Metric Banner - Full Bleed */}
        <div className="w-full">
          <MetricStrip metrics={metrics} loading={loading} />
        </div>

        {/* Main 2-column structural layout - No margin, edge-to-edge grid lines */}
        <div className="flex flex-col lg:flex-row w-full h-full relative">
          
          {/* Main Working Zone */}
          <div className="w-full lg:w-2/3 border-r border-slate-300 dark:border-slate-800">
            <StructuralDivider label="Priority Action Queue" className="border-b-0">
              <ActionQueue 
                tasks={tasks} 
                onAction={handleTaskAction} 
                loading={loading}
              />
            </StructuralDivider>

            <div className="h-px w-full bg-slate-300 dark:bg-slate-800 my-6" />

            <StructuralDivider label="Recent Activity Feed">
              {loading ? (
                <div className="animate-pulse flex flex-col gap-4">
                   <div className="h-4 bg-slate-200 dark:bg-slate-700 w-1/2 mb-2 rounded" />
                   <div className="h-4 bg-slate-200 dark:bg-slate-700 w-1/3 rounded" />
                </div>
              ) : (
                <div className="flex flex-col gap-6 font-mono text-sm pl-4 border-l-2 border-emerald-500 p-2">
                  <div className="flex gap-4">
                    <span className="text-slate-400">10:45 AM</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      User <strong className="font-bold text-emerald-600 dark:text-emerald-400">@maria.d</strong> bulk approved 45 claims in Brgy 14.
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-slate-400">09:12 AM</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      System auto-generated weekly digest for Executive Branch.
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-slate-400">08:30 AM</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      User <strong className="font-bold text-emerald-600 dark:text-emerald-400">@juan.t</strong> updated distribution schedule.
                    </span>
                  </div>
                </div>
              )}
            </StructuralDivider>
          </div>

          {/* Auxiliary Zone */}
          <div className="w-full lg:w-1/3">
            <StructuralDivider label="Quick Actions">
              <QuickActionsTerminal actions={quickActions} />
            </StructuralDivider>

            <div className="h-px w-full bg-slate-300 dark:bg-slate-800 my-6" />

            <StructuralDivider label="Announcements">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-100 mb-2">Distribution Shift</h4>
                <p className="text-emerald-700 dark:text-emerald-300">
                  Please be aware that the schedule for Brgy. San Jose has moved from Thursday to Friday morning.
                </p>
              </div>
            </StructuralDivider>
          </div>
        </div>
      </div>
    </StaffLayout>
  )
}
