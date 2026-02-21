"use client"

import { useEffect, useRef, useState } from "react"
import {
  Shield,
  Eye,
  Clock,
  Copy,
  ExternalLink,
  ArrowRight,
  Plus,
  Check,
} from "lucide-react"

const HOOK_ADDRESS = "0xBc01DAF0b890ED562Dc325C9ee9429146eEB80C0"

const compatibleAgents = [
  {
    id: 197,
    name: "Slippage Guardian",
    icon: Shield,
    accentColor: "text-violet-400",
    accentBg: "bg-violet-500/10",
    accentBorder: "border-violet-500/20",
  },
  {
    id: 198,
    name: "Oracle Checker",
    icon: Eye,
    accentColor: "text-cyan-400",
    accentBg: "bg-cyan-500/10",
    accentBorder: "border-cyan-500/20",
  },
  {
    id: 199,
    name: "Time Optimizer",
    icon: Clock,
    accentColor: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/20",
  },
]

const poolStats = [
  { label: "Total Value Locked", value: "$2.4M" },
  { label: "24h Volume", value: "$127K" },
  { label: "Fee Tier", value: "0.3%" },
  { label: "Your Liquidity", value: "$0" },
]

export function PoolCard() {
  const ref = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const timer = setTimeout(() => {
      el.classList.remove("opacity-0", "translate-y-4")
      el.classList.add("opacity-100", "translate-y-0")
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(HOOK_ADDRESS)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-[800px] translate-y-4 rounded-xl border border-[#2a2a34] bg-[#1a1a24] opacity-0 transition-all duration-500 ease-out"
    >
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* Pool Title */}
      <div className="border-b border-[#2a2a34] px-6 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#1a1a24] bg-[#627eea] text-xs font-bold text-white">
              ETH
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#1a1a24] bg-[#2775ca] text-xs font-bold text-white">
              USD
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              ETH / USDC Pool
            </h2>
            <p className="text-sm text-muted-foreground">Uniswap v4</p>
          </div>
        </div>
      </div>

      {/* Hook Address */}
      <div className="border-b border-[#2a2a34] px-6 py-5 md:px-8">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Hook Address
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="break-all rounded-md bg-[#12121a] px-3 py-1.5 font-mono text-sm text-foreground">
            {HOOK_ADDRESS}
          </code>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#2a2a34] bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
            <a
              href={`https://sepolia.etherscan.io/address/${HOOK_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#2a2a34] bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              View on Etherscan
            </a>
          </div>
        </div>
      </div>

      {/* Compatible Agents */}
      <div className="border-b border-[#2a2a34] px-6 py-5 md:px-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Compatible Agents ({compatibleAgents.length})
        </p>
        <div className="space-y-2">
          {compatibleAgents.map((agent) => {
            const Icon = agent.icon
            return (
              <div
                key={agent.id}
                className="flex items-center gap-3 rounded-lg border border-[#2a2a34] bg-[#12121a] px-4 py-3 transition-colors hover:border-[#3a3a44]"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${agent.accentBg} ${agent.accentBorder} border`}
                >
                  <Icon className={`h-4 w-4 ${agent.accentColor}`} />
                </div>
                <div className="flex-1">
                  <span className={`text-sm font-semibold ${agent.accentColor}`}>
                    Agent #{agent.id}
                  </span>
                  <span className="mx-1.5 text-muted-foreground/40">-</span>
                  <span className="text-sm text-foreground">{agent.name}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pool Stats */}
      <div className="border-b border-[#2a2a34] px-6 py-5 md:px-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pool Stats
        </p>
        <div className="grid grid-cols-2 gap-4">
          {poolStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg bg-[#12121a] px-4 py-3"
            >
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 px-6 py-5 md:px-8">
        <button className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-lg hover:shadow-primary/25">
          Trade in Pool
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#2a2a34] bg-transparent px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-muted-foreground hover:bg-secondary">
          <Plus className="h-4 w-4" />
          Add Liquidity
        </button>
      </div>
    </div>
  )
}
