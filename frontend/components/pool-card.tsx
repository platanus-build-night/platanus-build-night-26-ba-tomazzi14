"use client"

import { useEffect, useRef, useState } from "react"
import {
  Shield,
  Eye,
  Clock,
  Copy,
  ExternalLink,
  Check,
  Loader2,
} from "lucide-react"
import { useReadContract } from "wagmi"
import { HOOK_ADDRESS, HOOKAMARKT_ABI } from "@/lib/contracts"
import { useAgentStats } from "@/hooks/use-agent-stats"

const IDENTITY_REGISTRY = "0x7177a6867296406881E20d6647232314736Dd09A"
const REPUTATION_REGISTRY = "0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322"

const compatibleAgents = [
  {
    id: 197,
    name: "Slippage Guardian",
    icon: Shield,
    accentColor: "text-violet-400",
    accentBg: "bg-violet-500/10",
    accentBorder: "border-violet-500/20",
    reputation: 5,
  },
  {
    id: 198,
    name: "Oracle Checker",
    icon: Eye,
    accentColor: "text-cyan-400",
    accentBg: "bg-cyan-500/10",
    accentBorder: "border-cyan-500/20",
    reputation: 5,
  },
  {
    id: 199,
    name: "Time Optimizer",
    icon: Clock,
    accentColor: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/20",
    reputation: 4,
  },
]

export function PoolCard() {
  const ref = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  // Read contract config
  const { data: poolManager } = useReadContract({
    address: HOOK_ADDRESS,
    abi: HOOKAMARKT_ABI,
    functionName: "poolManager",
  })
  const { data: priceFeed } = useReadContract({
    address: HOOK_ADDRESS,
    abi: HOOKAMARKT_ABI,
    functionName: "priceFeed",
  })
  const { data: reputationReg } = useReadContract({
    address: HOOK_ADDRESS,
    abi: HOOKAMARKT_ABI,
    functionName: "reputationRegistry",
  })
  const { data: minRepScore } = useReadContract({
    address: HOOK_ADDRESS,
    abi: HOOKAMARKT_ABI,
    functionName: "MIN_REPUTATION_SCORE",
  })
  // Agent stats
  const { stats: stats197, isLoading: loading197 } = useAgentStats(197)
  const { stats: stats198, isLoading: loading198 } = useAgentStats(198)
  const { stats: stats199, isLoading: loading199 } = useAgentStats(199)
  const isLoadingStats = loading197 || loading198 || loading199

  const totalSwapsAll = (stats197?.totalSwaps ?? 0) + (stats198?.totalSwaps ?? 0) + (stats199?.totalSwaps ?? 0)
  const totalSuccess = (stats197?.successCount ?? 0) + (stats198?.successCount ?? 0) + (stats199?.successCount ?? 0)

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

  function shortenAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <span className="text-sm font-bold text-primary-foreground">H</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                HookamarktHook
              </h2>
              <p className="text-sm text-muted-foreground">Uniswap v4 Hook — Sepolia</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Deployed
          </span>
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
              Etherscan
            </a>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Address ends in <code className="text-violet-400">0xC0</code> — flag bits for <span className="text-foreground">beforeSwap</span> + <span className="text-foreground">afterSwap</span>
        </p>
      </div>

      {/* On-chain Config */}
      <div className="border-b border-[#2a2a34] px-6 py-5 md:px-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Contract Configuration
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-lg bg-[#12121a] px-4 py-3">
            <p className="text-xs text-muted-foreground">Pool Manager</p>
            <a
              href={`https://sepolia.etherscan.io/address/${poolManager || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-sm font-mono text-foreground hover:text-primary transition-colors"
            >
              {poolManager ? shortenAddress(poolManager as string) : "Loading..."}
            </a>
          </div>
          <div className="rounded-lg bg-[#12121a] px-4 py-3">
            <p className="text-xs text-muted-foreground">Chainlink Price Feed</p>
            <a
              href={`https://sepolia.etherscan.io/address/${priceFeed || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-sm font-mono text-foreground hover:text-primary transition-colors"
            >
              {priceFeed ? shortenAddress(priceFeed as string) : "Loading..."}
            </a>
          </div>
          <div className="rounded-lg bg-[#12121a] px-4 py-3">
            <p className="text-xs text-muted-foreground">Reputation Registry</p>
            <a
              href={`https://sepolia.etherscan.io/address/${reputationReg || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-sm font-mono text-foreground hover:text-primary transition-colors"
            >
              {reputationReg ? shortenAddress(reputationReg as string) : "Loading..."}
            </a>
          </div>
          <div className="rounded-lg bg-[#12121a] px-4 py-3">
            <p className="text-xs text-muted-foreground">Min Reputation Score</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {minRepScore !== undefined ? `${minRepScore}/5` : "Loading..."}
            </p>
          </div>
        </div>
      </div>


      {/* Aggregate Stats */}
      <div className="border-b border-[#2a2a34] px-6 py-5 md:px-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Aggregate Stats
        </p>
        {isLoadingStats ? (
          <div className="flex items-center gap-2 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading from Sepolia...</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-[#12121a] px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">Total Swaps</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {totalSwapsAll}
              </p>
            </div>
            <div className="rounded-lg bg-[#12121a] px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">Successful</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">
                {totalSuccess}
              </p>
            </div>
            <div className="rounded-lg bg-[#12121a] px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">Active Agents</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                3
              </p>
            </div>
          </div>
        )}
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
              <a
                key={agent.id}
                href={`https://sepolia.etherscan.io/nft/${IDENTITY_REGISTRY}/${agent.id}`}
                target="_blank"
                rel="noopener noreferrer"
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
                <span className="text-xs text-muted-foreground">
                  {agent.reputation}/5 ★
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50" />
              </a>
            )
          })}
        </div>
      </div>

    </div>
  )
}
