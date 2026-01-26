import React from 'react'
import { DashboardLayout, Header } from '@/components/layout'
import InventoryStats from '@/components/inventory/InventoryStats'
import InventoryTable from '@/components/inventory/InventoryTable'

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <Header 
        title="Inventory Management" 
        subtitle="Track and manage relief supplies" 
      />

      <InventoryStats />
      
      <InventoryTable />
    </DashboardLayout>
  )
}