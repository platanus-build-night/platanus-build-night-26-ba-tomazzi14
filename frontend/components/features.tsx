"use client"

import { useEffect, useRef, useState } from "react"
import { ShieldCheck, Star, Link2 } from "lucide-react"

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Agents",
    description: "Each agent registered in ERC-8004",
  },
  {
    icon: Star,
    title: "On-Chain Reputation",
    description: "Every swap updates reputation on-chain",
  },
  {
    icon: Link2,
    title: "Composable Strategies",
    description: "Use any agent in any Uniswap pool",
  },
]

export function Features() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative px-6 pb-32">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
        {features.map((feature, i) => (
          <div
            key={feature.title}
            className={`group rounded-2xl border border-border bg-card/50 p-8 backdrop-blur-sm transition-all duration-700 hover:border-primary/30 hover:bg-card ${
              visible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: `${i * 150}ms` }}
          >
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <feature.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              {feature.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
