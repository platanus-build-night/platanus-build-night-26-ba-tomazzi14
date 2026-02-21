"use client"

import { useReadContract } from "wagmi"
import { HOOK_ADDRESS, HOOKAMARKT_ABI } from "@/lib/contracts"

export interface AgentStats {
  totalSwaps: bigint
  successCount: bigint
  failCount: bigint
  successRate: bigint
}

export function useAgentStats(agentId: number) {
  const { data, isLoading, error } = useReadContract({
    address: HOOK_ADDRESS,
    abi: HOOKAMARKT_ABI,
    functionName: "getAgentStats",
    args: [BigInt(agentId)],
  })

  if (!data) {
    return {
      stats: null,
      isLoading,
      error,
    }
  }

  const [totalSwaps, successCount, failCount, successRate] = data as [bigint, bigint, bigint, bigint]

  return {
    stats: {
      totalSwaps: Number(totalSwaps),
      successCount: Number(successCount),
      failCount: Number(failCount),
      successRate: Number(successRate),
    },
    isLoading,
    error,
  }
}
