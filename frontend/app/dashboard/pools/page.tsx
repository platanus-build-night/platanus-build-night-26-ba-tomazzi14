import { DashboardHeader } from "@/components/dashboard-header"
import { PoolCard } from "@/components/pool-card"
import { LiquidityCard } from "@/components/liquidity-card"

export default function PoolsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader activeTab="Pools" />

      <main className="mx-auto max-w-[1200px] px-6 py-20">
        {/* Section heading */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Active Pools
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Uniswap v4 pools powered by Hookamarkt agents
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-8">
          <PoolCard />
          <LiquidityCard />
        </div>
      </main>
    </div>
  )
}
