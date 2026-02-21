"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Wallet } from "lucide-react"

const tabs = [
  { name: "Agents", href: "/dashboard" },
  { name: "Pools", href: "/dashboard/pools" },
  { name: "Profile", href: "/dashboard/profile" },
]

export function DashboardHeader({ activeTab = "Agents" }: { activeTab?: string }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-border"
          : "bg-[#0a0a0f] border-b border-border"
      }`}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <span className="text-sm font-bold text-primary-foreground">H</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Hookamarkt
          </span>
        </Link>

        {/* Tabs */}
        <nav className="hidden items-center gap-1 sm:flex">
          {tabs.map((tab) => {
            const isActive = tab.name === activeTab
            if (tab.disabled) {
              return (
                <span
                  key={tab.name}
                  className="relative cursor-not-allowed px-4 py-2 text-sm font-medium text-muted-foreground/50"
                >
                  {tab.name}
                </span>
              )
            }
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.name}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-accent" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Connect Wallet */}
        <button className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-secondary">
          <Wallet className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="sm:hidden">Connect</span>
        </button>
      </div>
    </header>
  )
}
