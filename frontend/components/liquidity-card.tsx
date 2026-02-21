"use client"

import { useEffect, useRef } from "react"
import {
  Droplets,
  TrendingUp,
  ExternalLink,
  Loader2,
  ArrowUpDown,
  Coins,
  BarChart3,
} from "lucide-react"
import { useReadContract, useAccount } from "wagmi"
import {
  POOL_MANAGER,
  POOL_MANAGER_ABI,
  POSITION_MANAGER,
  POSITION_MANAGER_ABI,
  POOL_ID,
  USDC_ADDRESS,
  WETH_ADDRESS,
  ERC20_ABI,
} from "@/lib/contracts"

// Position NFT minted during AddLiquidity
const POSITION_TOKEN_ID = 23704n
const TICK_LOWER = 197280
const TICK_UPPER = 198900
const TICK_SPACING = 60
const FEE = 3000

function formatLiquidity(val: bigint): string {
  const num = Number(val)
  if (num >= 1e18) return `${(num / 1e18).toFixed(2)}e18`
  if (num >= 1e15) return `${(num / 1e15).toFixed(2)}e15`
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}e12`
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  return num.toLocaleString()
}

function tickToPrice(tick: number): number {
  // price = 1.0001^tick
  // For USDC(6)/WETH(18): price in USDC per WETH = 1.0001^tick * 10^(18-6)
  return Math.pow(1.0001, tick) * 1e12
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(0)
  if (price >= 1) return price.toFixed(2)
  return price.toFixed(6)
}

export function LiquidityCard() {
  const ref = useRef<HTMLDivElement>(null)
  const { address: userAddress } = useAccount()

  // Pool state from PoolManager
  const { data: slot0, isLoading: loadingSlot0 } = useReadContract({
    address: POOL_MANAGER,
    abi: POOL_MANAGER_ABI,
    functionName: "getSlot0",
    args: [POOL_ID],
  })

  const { data: poolLiquidity, isLoading: loadingPoolLiq } = useReadContract({
    address: POOL_MANAGER,
    abi: POOL_MANAGER_ABI,
    functionName: "getLiquidity",
    args: [POOL_ID],
  })

  // Position data
  const { data: positionLiquidity, isLoading: loadingPosLiq } = useReadContract({
    address: POSITION_MANAGER,
    abi: POSITION_MANAGER_ABI,
    functionName: "getPositionLiquidity",
    args: [POSITION_TOKEN_ID],
  })

  const { data: positionOwner } = useReadContract({
    address: POSITION_MANAGER,
    abi: POSITION_MANAGER_ABI,
    functionName: "ownerOf",
    args: [POSITION_TOKEN_ID],
  })

  // Token balances in PoolManager (TVL proxy)
  const { data: usdcInPool } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [POOL_MANAGER],
  })

  const { data: wethInPool } = useReadContract({
    address: WETH_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [POOL_MANAGER],
  })

  const isLoading = loadingSlot0 || loadingPoolLiq || loadingPosLiq

  // Parse slot0
  const currentTick = slot0 ? Number((slot0 as [bigint, number, number, number])[1]) : null
  const lpFee = slot0 ? Number((slot0 as [bigint, number, number, number])[3]) : null

  // Prices
  const currentPrice = currentTick !== null ? tickToPrice(currentTick) : null
  const lowerPrice = tickToPrice(TICK_LOWER)
  const upperPrice = tickToPrice(TICK_UPPER)

  // Position in range?
  const inRange = currentTick !== null && currentTick >= TICK_LOWER && currentTick <= TICK_UPPER

  // TVL in PoolManager
  const usdcTvl = usdcInPool ? Number(usdcInPool) / 1e6 : null
  const wethTvl = wethInPool ? Number(wethInPool) / 1e18 : null

  // Price range visualization (percentage position of current tick within range)
  const rangePercent =
    currentTick !== null
      ? Math.min(100, Math.max(0, ((currentTick - TICK_LOWER) / (TICK_UPPER - TICK_LOWER)) * 100))
      : 50

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const timer = setTimeout(() => {
      el.classList.remove("opacity-0", "translate-y-4")
      el.classList.add("opacity-100", "translate-y-0")
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  function shortenAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-[800px] translate-y-4 rounded-xl border border-[#2a2a34] bg-[#1a1a24] opacity-0 transition-all duration-500 ease-out"
    >
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      {/* Header */}
      <div className="border-b border-[#2a2a34] px-6 py-5 md:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                USDC / WETH
              </h2>
              <p className="text-sm text-muted-foreground">
                {FEE / 10000}% fee — tick spacing {TICK_SPACING}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {inRange !== null && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  inRange
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    inRange ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                {inRange ? "In Range" : "Out of Range"}
              </span>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 px-6 py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading pool data from Sepolia...</span>
        </div>
      ) : (
        <>
          {/* Current Price */}
          <div className="border-b border-[#2a2a34] px-6 py-5 md:px-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Current Price
            </p>
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-bold tabular-nums text-foreground">
                {currentPrice ? formatPrice(currentPrice) : "—"}
              </p>
              <p className="text-sm text-muted-foreground">USDC per WETH</p>
            </div>
            {currentTick !== null && (
              <p className="mt-1 text-xs text-muted-foreground">
                Current tick: <code className="text-cyan-400">{currentTick}</code>
                {lpFee !== null && (
                  <span className="ml-3">LP fee: <code className="text-violet-400">{lpFee / 10000}%</code></span>
                )}
              </p>
            )}
          </div>

          {/* Price Range Visualization */}
          <div className="border-b border-[#2a2a34] px-6 py-5 md:px-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Position Range
            </p>
            {/* Range bar */}
            <div className="relative mb-4">
              <div className="h-3 w-full rounded-full bg-[#12121a] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500/40 via-cyan-500 to-violet-500/40"
                  style={{ width: "100%" }}
                />
              </div>
              {/* Current tick marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${rangePercent}%` }}
              >
                <div className="flex flex-col items-center">
                  <div className="h-5 w-0.5 bg-white rounded-full shadow-lg shadow-white/50" />
                </div>
              </div>
            </div>
            {/* Range labels */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Min Price</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {formatPrice(lowerPrice)} <span className="text-xs text-muted-foreground">USDC</span>
                </p>
                <p className="text-[10px] text-muted-foreground">tick {TICK_LOWER}</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-md bg-[#12121a] px-3 py-1.5">
                <ArrowUpDown className="h-3 w-3 text-cyan-400" />
                <span className="text-xs font-medium text-foreground">
                  {((upperPrice - lowerPrice) / lowerPrice * 100).toFixed(1)}% width
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Max Price</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {formatPrice(upperPrice)} <span className="text-xs text-muted-foreground">USDC</span>
                </p>
                <p className="text-[10px] text-muted-foreground">tick {TICK_UPPER}</p>
              </div>
            </div>
          </div>

          {/* Pool Liquidity & TVL */}
          <div className="border-b border-[#2a2a34] px-6 py-5 md:px-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Pool Liquidity
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-[#12121a] px-4 py-3 text-center">
                <div className="mb-1 flex items-center justify-center gap-1">
                  <BarChart3 className="h-3 w-3 text-cyan-400" />
                  <p className="text-xs text-muted-foreground">Total Liquidity</p>
                </div>
                <p className="text-lg font-bold tabular-nums text-foreground">
                  {poolLiquidity ? formatLiquidity(poolLiquidity as bigint) : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-[#12121a] px-4 py-3 text-center">
                <div className="mb-1 flex items-center justify-center gap-1">
                  <Coins className="h-3 w-3 text-blue-400" />
                  <p className="text-xs text-muted-foreground">USDC in Pool</p>
                </div>
                <p className="text-lg font-bold tabular-nums text-foreground">
                  {usdcTvl !== null ? `${usdcTvl.toFixed(2)}` : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-[#12121a] px-4 py-3 text-center">
                <div className="mb-1 flex items-center justify-center gap-1">
                  <Coins className="h-3 w-3 text-violet-400" />
                  <p className="text-xs text-muted-foreground">WETH in Pool</p>
                </div>
                <p className="text-lg font-bold tabular-nums text-foreground">
                  {wethTvl !== null ? `${wethTvl.toFixed(4)}` : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-[#12121a] px-4 py-3 text-center">
                <div className="mb-1 flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <p className="text-xs text-muted-foreground">Fee Tier</p>
                </div>
                <p className="text-lg font-bold tabular-nums text-foreground">
                  {FEE / 10000}%
                </p>
              </div>
            </div>
          </div>

          {/* Position #23704 */}
          <div className="border-b border-[#2a2a34] px-6 py-5 md:px-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Liquidity Position #{Number(POSITION_TOKEN_ID)}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-[#12121a] px-4 py-3">
                <span className="text-sm text-muted-foreground">Position Liquidity</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {positionLiquidity ? formatLiquidity(positionLiquidity as bigint) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#12121a] px-4 py-3">
                <span className="text-sm text-muted-foreground">Owner</span>
                <span className="font-mono text-sm text-foreground">
                  {positionOwner ? (
                    <a
                      href={`https://sepolia.etherscan.io/address/${positionOwner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      {shortenAddress(positionOwner as string)}
                      {userAddress && (positionOwner as string).toLowerCase() === userAddress.toLowerCase() && (
                        <span className="ml-2 text-xs text-cyan-400">(you)</span>
                      )}
                    </a>
                  ) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#12121a] px-4 py-3">
                <span className="text-sm text-muted-foreground">Tick Range</span>
                <span className="font-mono text-sm text-foreground">
                  {TICK_LOWER} <span className="text-muted-foreground mx-1">to</span> {TICK_UPPER}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#12121a] px-4 py-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                    inRange ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      inRange ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                    }`}
                  />
                  {inRange ? "Earning Fees" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Explorer Links */}
          <div className="px-6 py-4 md:px-8">
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://sepolia.etherscan.io/address/${POOL_MANAGER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#2a2a34] bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                Pool Manager
              </a>
              <a
                href={`https://sepolia.etherscan.io/nft/${POSITION_MANAGER}/${Number(POSITION_TOKEN_ID)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#2a2a34] bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                Position NFT #{Number(POSITION_TOKEN_ID)}
              </a>
              <a
                href={`https://sepolia.etherscan.io/address/${USDC_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#2a2a34] bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                USDC Token
              </a>
              <a
                href={`https://sepolia.etherscan.io/address/${WETH_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#2a2a34] bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                WETH Token
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
