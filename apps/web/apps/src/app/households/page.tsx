import React from 'react'
import { DashboardLayout, Header } from '@/components/layout'
import PriorityStats from '@/components/households/PriorityStats'
import HouseholdsTable from '@/components/households/HouseholdsTable'

export default function HouseholdsPage() {
  return (
    <DashboardLayout>
      <Header 
        title="Households" 
        subtitle="View and manage AI-prioritized households" 
      />

      <PriorityStats />
      
      <HouseholdsTable />
    </DashboardLayout>
  )
}