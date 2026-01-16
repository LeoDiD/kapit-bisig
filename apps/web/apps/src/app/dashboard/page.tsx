import React from 'react'
import { DashboardLayout, Header } from '@/components/layout'
import { 
  StatsCard, 
  AIDistributionChart, 
  RecentDistributions, 
  LowStockAlert, 
  QuickActions 
} from '@/components/dashboard'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Header 
        title="Dashboard" 
        subtitle="Overview of relief distribution activities" 
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Households"
          value="1234"
          variant="default"
          icon={<HouseholdIcon className="w-6 h-6" />}
        />
        <StatsCard
          title="Pending Distributions"
          value="67"
          variant="yellow"
          icon={<PendingIcon className="w-6 h-6" />}
        />
        <StatsCard
          title="Completed Today"
          value="67"
          variant="green"
          icon={<CompletedIcon className="w-6 h-6" />}
        />
        <StatsCard
          title="Low Stock Items"
          value="2"
          variant="red"
          icon={<AlertIcon className="w-6 h-6" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AIDistributionChart />
        <RecentDistributions />
      </div>

      {/* Bottom Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockAlert />
        <QuickActions />
      </div>
    </DashboardLayout>
  )
}

// Icon Components
function HouseholdIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function PendingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CompletedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}
