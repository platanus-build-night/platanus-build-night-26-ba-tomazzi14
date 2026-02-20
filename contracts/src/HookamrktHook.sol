// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {BaseHook} from "uniswap-hooks/base/BaseHook.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

// ============ Interfaces ============

interface IReputationRegistry {
    function giveFeedback(
        uint256 agentId,
        uint8 score,
        bytes32 tag1,
        bytes32 tag2,
        string calldata fileURI,
        bytes32 fileHash,
        bytes calldata feedbackAuth
    ) external;
}

// ============ Contract ============

contract HookamarktHook is BaseHook {

    // ============ Constants ============

    uint256 public constant AGENT_SLIPPAGE_GUARDIAN = 197;
    uint256 public constant AGENT_ORACLE_CHECKER = 198;
    uint256 public constant MAX_SWAP_AMOUNT = 1 ether;

    // ============ Immutables ============

    IReputationRegistry public immutable reputationRegistry;
    AggregatorV3Interface public immutable priceFeed;

    // ============ Storage ============

    mapping(uint256 => uint256) public agentSwapCount;
    mapping(uint256 => uint256) public agentSuccessCount;
    mapping(uint256 => uint256) public agentFailCount;

    // ============ Events ============

    event AgentSwapAttempted(uint256 indexed agentId, address user);
    event AgentSwapSuccess(uint256 indexed agentId, address user);
    event AgentSwapRejected(uint256 indexed agentId, address user, string reason);

    // ============ Errors ============

    error UnknownAgent(uint256 agentId);
    error SlippageGuardianRejected(int256 amount, uint256 maxAmount);
    error OracleCheckerFailed(string reason);

    // ============ Constructor ============

    constructor(
        IPoolManager _manager,
        address _reputationRegistry,
        address _priceFeed
    ) BaseHook(_manager) {
        reputationRegistry = IReputationRegistry(_reputationRegistry);
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    // ============ Hook Permissions ============

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    // ============ Hook Implementations ============

    function _beforeSwap(
        address sender,
        PoolKey calldata,
        SwapParams calldata params,
        bytes calldata hookData
    ) internal override returns (bytes4, BeforeSwapDelta, uint24) {
        // Decode agentId from hookData (if provided)
        if (hookData.length == 0) {
            return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
        }

        uint256 agentId = abi.decode(hookData, (uint256));

        emit AgentSwapAttempted(agentId, sender);
        agentSwapCount[agentId]++;

        // Execute agent strategy
        if (agentId == AGENT_SLIPPAGE_GUARDIAN) {
            _executeSlippageGuardian(sender, params, agentId);
        } else if (agentId == AGENT_ORACLE_CHECKER) {
            _executeOracleChecker(sender, agentId);
        } else {
            revert UnknownAgent(agentId);
        }

        return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function _afterSwap(
        address sender,
        PoolKey calldata,
        SwapParams calldata,
        BalanceDelta,
        bytes calldata hookData
    ) internal override returns (bytes4, int128) {
        // Update reputation for successful swap
        if (hookData.length > 0) {
            uint256 agentId = abi.decode(hookData, (uint256));

            agentSuccessCount[agentId]++;

            // Give positive feedback (score = 5) to the agent's reputation
            try reputationRegistry.giveFeedback(
                agentId,
                5, // max score
                bytes32("swap_success"),
                bytes32("hookamarkt"),
                "",
                bytes32(0),
                ""
            ) {} catch {
                // Reputation update failure should not revert the swap
            }

            emit AgentSwapSuccess(agentId, sender);
        }

        return (this.afterSwap.selector, 0);
    }

    // ============ Agent Strategies ============

    /// @notice Agent #197: Slippage Guardian - Rejects swaps larger than MAX_SWAP_AMOUNT
    function _executeSlippageGuardian(
        address sender,
        SwapParams calldata params,
        uint256 agentId
    ) internal {
        // amountSpecified is negative for exactIn, positive for exactOut
        int256 absAmount = params.amountSpecified < 0
            ? -params.amountSpecified
            : params.amountSpecified;

        if (uint256(absAmount) > MAX_SWAP_AMOUNT) {
            agentFailCount[agentId]++;
            emit AgentSwapRejected(agentId, sender, "Swap exceeds 1 ETH limit");
            revert SlippageGuardianRejected(params.amountSpecified, MAX_SWAP_AMOUNT);
        }
    }

    /// @notice Agent #198: Oracle Checker - Verifies Chainlink oracle is returning valid prices
    function _executeOracleChecker(
        address sender,
        uint256 agentId
    ) internal {
        try priceFeed.latestRoundData() returns (
            uint80,
            int256 answer,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            // Verify price is positive
            if (answer <= 0) {
                agentFailCount[agentId]++;
                emit AgentSwapRejected(agentId, sender, "Oracle returned invalid price");
                revert OracleCheckerFailed("Oracle returned invalid price");
            }

            // Verify data is not stale (1 hour threshold)
            if (block.timestamp - updatedAt > 1 hours) {
                agentFailCount[agentId]++;
                emit AgentSwapRejected(agentId, sender, "Oracle data is stale");
                revert OracleCheckerFailed("Oracle data is stale");
            }
        } catch {
            agentFailCount[agentId]++;
            emit AgentSwapRejected(agentId, sender, "Oracle call failed");
            revert OracleCheckerFailed("Oracle call failed");
        }
    }

    // ============ View Functions ============

    function getAgentStats(uint256 agentId)
        external
        view
        returns (
            uint256 totalSwaps,
            uint256 successCount,
            uint256 failCount,
            uint256 successRate
        )
    {
        totalSwaps = agentSwapCount[agentId];
        successCount = agentSuccessCount[agentId];
        failCount = agentFailCount[agentId];
        successRate = totalSwaps > 0 ? (successCount * 100) / totalSwaps : 0;
    }
}
