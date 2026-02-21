"use client"

import { useState } from "react"
import { Copy, Check, ExternalLink, Wallet, CircleDot } from "lucide-react"
import { useAccount, useBalance, useDisconnect } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { formatEther } from "viem"

export function ProfileCard() {
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isConnected || !address) {
    return (
      <div className="mx-auto w-full max-w-[600px]">
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-secondary">
            <Wallet className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Not Connected
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect your wallet to view your profile
          </p>
          <div className="mt-6 flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    )
  }

  const ethBalance = balance ? parseFloat(formatEther(balance.value)) : 0
  const ethUsd = (ethBalance * 3200).toFixed(0)

  return (
    <div className="mx-auto w-full max-w-[600px]">
      <div className="rounded-xl border border-border bg-card">
        {/* Wallet Section */}
        <div className="p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Connected Wallet
          </p>
          <p className="break-all font-mono text-sm text-foreground md:text-base">
            {address}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-4 py-2 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-secondary"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              {copied ? "Copied" : "Copy Address"}
            </button>
            <a
              href={`https://sepolia.etherscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-4 py-2 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-secondary"
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              View on Etherscan
            </a>
            <button
              onClick={() => disconnect()}
              className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive transition-all hover:border-destructive/60 hover:bg-destructive/20"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Balances Section */}
        <div className="p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Balances
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  E
                </div>
                <span className="text-sm font-semibold text-foreground">
                  ETH
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {ethBalance.toFixed(4)} ETH
                </p>
                <p className="text-xs text-muted-foreground">~${ethUsd}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Network Section */}
        <div className="p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Network
          </p>
          <div className="flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-amber-400" />
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-400">
              {chain?.name || "Sepolia Testnet"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
