"use client"

import { useEffect, useRef } from "react"
import { ArrowRight, Shield, Eye, Clock, Star, Loader2 } from "lucide-react"
import { useAgentStats } from "@/hooks/use-agent-stats"

interface AgentConfig {
  id: number
  name: string
  icon: "shield" | "eye" | "clock"
  strategy: string
  strategyDesc: string
  reputation: number
  accentColor: string
  accentBg: string
  accentBorder: string
  accentGlow: string
}

const agents: AgentConfig[] = [
  {
    id: 197,
    name: "Slippage Guardian",
    icon: "shield",
    strategy: "Risk Minimizer",
    strategyDesc: "Rejects swaps >1 ETH",
    reputation: 5.0,
    accentColor: "text-violet-400",
    accentBg: "bg-violet-500/10",
    accentBorder: "border-violet-500/20",
    accentGlow: "hover:shadow-violet-500/10",
  },
  {
    id: 198,
    name: "Oracle Checker",
    icon: "eye",
    strategy: "MEV Protector",
    strategyDesc: "Validates vs Chainlink oracle",
    reputation: 5.0,
    accentColor: "text-cyan-400",
    accentBg: "bg-cyan-500/10",
    accentBorder: "border-cyan-500/20",
    accentGlow: "hover:shadow-cyan-500/10",
  },
  {
    id: 199,
    name: "Time Optimizer",
    icon: "clock",
    strategy: "Dynamic Limits",
    strategyDesc: "Adjusts based on volatility hours",
    reputation: 4.0,
    accentColor: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/20",
    accentGlow: "hover:shadow-emerald-500/10",
  },
]

const iconMap = {
  shield: Shield,
  eye: Eye,
  clock: Clock,
}

function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.3
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < fullStars
              ? "fill-amber-400 text-amber-400"
              : i === fullStars && hasHalf
                ? "fill-amber-400/50 text-amber-400"
                : "fill-transparent text-muted-foreground/30"
          }`}
        />
      ))}
    </span>
  )
}

export function AgentCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent, index) => (
        <AgentCardItem key={agent.id} agent={agent} index={index} />
      ))}
    </div>
  )
}

function AgentCardItem({ agent, index }: { agent: AgentConfig; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { stats, isLoading } = useAgentStats(agent.id)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const timer = setTimeout(() => {
      el.classList.remove("opacity-0", "translate-y-4")
      el.classList.add("opacity-100", "translate-y-0")
    }, 100 + index * 120)
    return () => clearTimeout(timer)
  }, [index])

  const Icon = iconMap[agent.icon]

  const totalSwaps = stats?.totalSwaps ?? 0
  const successRate = stats?.successRate ?? 0

  return (
    <div
      ref={ref}
      className={`group relative flex flex-col rounded-xl border border-[#2a2a34] bg-[#1a1a24] p-6 opacity-0 translate-y-4 transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-xl ${agent.accentGlow}`}
    >
      {/* Top accent line */}
      <div
        className={`absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent ${
          agent.icon === "shield"
            ? "via-violet-500/50"
            : agent.icon === "eye"
              ? "via-cyan-500/50"
              : "via-emerald-500/50"
        } to-transparent`}
      />

      {/* Agent header */}
      <div className="mb-5 flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${agent.accentBg} ${agent.accentBorder} border`}>
          <Icon className={`h-5 w-5 ${agent.accentColor}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Agent #{agent.id}
          </p>
          <h3 className="text-lg font-bold text-foreground">{agent.name}</h3>
        </div>
      </div>

      {/* Strategy */}
      <div className="mb-5">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Strategy
        </p>
        <p className={`text-sm font-semibold ${agent.accentColor}`}>
          {agent.strategy}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {agent.strategyDesc}
        </p>
      </div>

      {/* Performance - On-chain data */}
      <div className="mb-6 flex-1">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          On-chain Performance
        </p>
        {isLoading ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading from Sepolia...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Swaps</span>
              <span className="font-semibold text-foreground tabular-nums">
                {totalSwaps}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Success Rate</span>
              <span className="font-semibold text-foreground tabular-nums">
                {totalSwaps > 0 ? `${successRate}%` : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Reputation</span>
              <span className="inline-flex items-center gap-1.5">
                <RatingStars rating={agent.reputation} />
                <span className="font-semibold text-foreground tabular-nums text-xs">
                  {agent.reputation}/5
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* On-chain badge */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Live on Sepolia
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <a
          href={`https://sepolia.etherscan.io/address/0xBc01DAF0b890ED562Dc325C9ee9429146eEB80C0`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-lg border border-[#2a2a34] bg-transparent px-4 py-2.5 text-sm font-semibold text-foreground text-center transition-colors hover:border-muted-foreground hover:bg-secondary"
        >
          View on Etherscan
        </a>
        <button
          className={`group/btn flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all ${
            agent.icon === "shield"
              ? "bg-violet-600 hover:bg-violet-500"
              : agent.icon === "eye"
                ? "bg-cyan-600 hover:bg-cyan-500"
                : "bg-emerald-600 hover:bg-emerald-500"
          }`}
        >
          Use Agent
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
        </button>
      </div>
    </div>
  )
}
