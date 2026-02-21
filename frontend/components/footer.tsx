import { Github, Globe } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 md:flex-row">
        <p className="text-sm text-muted-foreground">
          Built with Uniswap v4 Hooks + ERC-8004
        </p>
        <div className="flex items-center gap-6">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Globe className="h-4 w-4" />
            Sepolia Testnet
          </a>
        </div>
      </div>
    </footer>
  )
}
