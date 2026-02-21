"use client"

import { useState } from "react"
import { Copy, Check, ExternalLink, Wallet, CircleDot } from "lucide-react"

const MOCK_WALLET = "0x742d35Cc6634C0532925a3b844Bc5e39"

const balances = [
  { token: "ETH", amount: "2.5 ETH", usd: "$6,250" },
  { token: "USDC", amount: "1,234 USDC", usd: "$1,234" },
]

export function ProfileCard() {
  const [connected, setConnected] = useState(true)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(MOCK_WALLET)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!connected) {
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
          <button
            onClick={() => setConnected(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-lg hover:shadow-primary/25"
          >
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[600px]">
      <div className="rounded-xl border border-border bg-card">
        {/* Wallet Section */}
        <div className="p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Connected Wallet
          </p>
          <p className="break-all font-mono text-sm text-foreground md:text-base">
            {MOCK_WALLET}
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
            <button
              onClick={() => setConnected(false)}
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
            {balances.map((b) => (
              <div
                key={b.token}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {b.token === "ETH" ? "E" : "$"}
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {b.token}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {b.amount}
                  </p>
                  <p className="text-xs text-muted-foreground">{b.usd}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Network Section */}
        <div className="p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Network
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-amber-400" />
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-400">
                Sepolia Testnet
              </span>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-4 py-2 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-secondary">
              Switch Network
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
