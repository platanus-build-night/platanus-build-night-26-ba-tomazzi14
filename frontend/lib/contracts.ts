export const HOOK_ADDRESS = "0xBc01DAF0b890ED562Dc325C9ee9429146eEB80C0" as const
export const REPUTATION_REGISTRY = "0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322" as const
export const CHAINLINK_ETH_USD = "0x694AA1769357215DE4FAC081bf1f309aDC325306" as const
export const POOL_MANAGER = "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543" as const

export const HOOKAMARKT_ABI = [
  {
    type: "function",
    name: "getAgentStats",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [
      { name: "totalSwaps", type: "uint256" },
      { name: "successCount", type: "uint256" },
      { name: "failCount", type: "uint256" },
      { name: "successRate", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "agentSwapCount",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "agentSuccessCount",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "agentFailCount",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "AGENT_SLIPPAGE_GUARDIAN",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "AGENT_ORACLE_CHECKER",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "AGENT_TIME_OPTIMIZER",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_SWAP_AMOUNT",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MIN_REPUTATION_SCORE",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "NORMAL_MAX_AMOUNT",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "VOLATILE_MAX_AMOUNT",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "VOLATILE_HOUR_START",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "VOLATILE_HOUR_END",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "reputationRegistry",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "priceFeed",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "poolManager",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AgentSwapAttempted",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AgentSwapSuccess",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AgentSwapRejected",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: false },
      { name: "reason", type: "string", indexed: false },
    ],
  },
] as const
