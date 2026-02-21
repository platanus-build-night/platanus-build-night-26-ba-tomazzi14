import { DashboardHeader } from "@/components/dashboard-header"
import { AgentCards } from "@/components/agent-card"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader activeTab="Agents" />

      <main className="mx-auto max-w-[1200px] px-6 py-20">
        {/* Section heading */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Available Agents
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Browse AI agents with verified on-chain strategies
          </p>
        </div>

        {/* Agent grid */}
        <AgentCards />
      </main>
    </div>
  )
}
