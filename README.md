# Hookamarkt — AI Agent Trading Marketplace for Uniswap v4

> Built at Platanus Build Night 26 — Buenos Aires, Tiendanube Office (2026)

**Hookamarkt** is a Uniswap v4 Hook that creates a **reputation-gated marketplace for AI trading agents**. Each agent has a unique strategy that gets validated on-chain before every swap. Agents build reputation through the ERC-8004 standard, and only agents with sufficient reputation can trade.

## How It Works

```
User triggers swap → Hook decodes agentId from hookData
                   → beforeSwap: checks ERC-8004 reputation
                   → beforeSwap: executes agent strategy
                   → Uniswap v4 executes the swap
                   → afterSwap: records success + gives positive feedback
```

### Agents

| ID | Name | Strategy |
|----|------|----------|
| 197 | Slippage Guardian | Rejects swaps > 1 ETH to prevent slippage attacks |
| 198 | Oracle Checker | Validates Chainlink ETH/USD price feed before trading |
| 199 | Time Optimizer | Limits swap size during volatile hours (14-18 UTC) |

### Tech Stack

- **Smart Contracts**: Solidity 0.8.26, Foundry, Uniswap v4 Hooks
- **Reputation**: ERC-8004 (on-chain agent reputation standard)
- **Oracle**: Chainlink ETH/USD price feed (Sepolia)
- **Frontend**: Next.js 15, Tailwind CSS, wagmi/viem, thirdweb
- **Network**: Ethereum Sepolia testnet

## Deployed Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| HookamarktHook | `0xBc01DAF0b890ED562Dc325C9ee9429146eEB80C0` |
| PoolManager | `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543` |
| PositionManager | `0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4` |
| SwapRouter | `0x65c9c1BF4e96f72302361aF3a8Bd87C238498BFb` |
| MockUSDC | `0xCbEf7d5f764CbF65a2d499d206d1C7cc05978e4f` |
| WETH | `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14` |

**Pool ID**: `0x115103425bcd51a9c5bce5c27ffcd0c191fc91c8473956959000ba602865d8e4`

## Project Structure

```
contracts/
  src/
    HookamrktHook.sol    # Main hook — reputation gate + 3 agent strategies
    MockUSDC.sol         # Test ERC-20 token
  script/
    DeployHook.s.sol     # Deploy hook with CREATE2 salt mining
    InitializePool.s.sol # Initialize ETH/USDC pool
    AddLiquidity.s.sol   # Add concentrated liquidity
    DemoSwap.s.sol       # Demo: Agent #198 Oracle Checker swap
    DemoSwap2.s.sol      # Demo: Agent #199 Time Optimizer swap
    DemoSwapFail.s.sol   # Demo: Agent #197 rejects oversized swap
  test/
    HookamarktHook.t.sol # Full test suite

frontend/
  app/
    dashboard/           # Agent dashboard + activity feed
    dashboard/pools/     # Pool state + liquidity visualization
  components/
    activity-feed.tsx    # Agent stats + swap history (on-chain reads)
    liquidity-card.tsx   # Pool liquidity + price range visualization
  lib/
    contracts.ts         # All addresses + ABIs
```

## Run the Demo

### Prerequisites

- [Foundry](https://book.getfoundry.sh/) installed
- Sepolia ETH in your wallet
- `.env` file in `contracts/` with `PRIVATE_KEY=your_key`

### Execute a live agent swap

```bash
cd contracts

# Agent #198 — Oracle Checker (validates Chainlink price feed)
forge script script/DemoSwap.s.sol --rpc-url sepolia --broadcast -vvvv

# Agent #199 — Time Optimizer (checks volatile hour window)
forge script script/DemoSwap2.s.sol --rpc-url sepolia --broadcast -vvvv
```

Each swap:
1. Wraps 0.001 ETH to WETH
2. Approves the SwapRouter
3. Executes swap through the hook (agent strategy validated on-chain)
4. Hook records success + updates agent reputation

The frontend auto-refreshes every ~15 seconds to show updated agent stats.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Env vars: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

## Author

**Tomas Mazzitello** — [@tomazzi14](https://github.com/tomazzi14)
