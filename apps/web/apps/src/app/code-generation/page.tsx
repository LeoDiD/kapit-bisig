import { DashboardLayout, Header } from '@/components/layout'
import CodeGenerationTable from '@/components/codeGeneration/CodeGenerationTable'

export default function CodeGenerationPage() {
  return (
    <DashboardLayout>
      <Header
        title="Code Generation"
        subtitle="Generate unique barangay codes"
      />
      <CodeGenerationTable />
    </DashboardLayout>
  )
}
