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

    function getSummary(
        uint256 agentId,
        address[] calldata clientAddresses,
        bytes32 tag1,
        bytes32 tag2
    ) external view returns (uint64 count, uint8 averageScore);
}

// ============ Contract ============

contract HookamarktHook is BaseHook {

    // ============ Constants ============

    uint256 public constant AGENT_SLIPPAGE_GUARDIAN = 197;
    uint256 public constant AGENT_ORACLE_CHECKER = 198;
    uint256 public constant AGENT_TIME_OPTIMIZER = 199;
    uint256 public constant MAX_SWAP_AMOUNT = 1 ether;
    uint256 public constant NORMAL_MAX_AMOUNT = 5 ether;
    uint256 public constant VOLATILE_MAX_AMOUNT = 0.1 ether;
    uint256 public constant VOLATILE_HOUR_START = 14; // 14:00 UTC
    uint256 public constant VOLATILE_HOUR_END = 18;   // 18:00 UTC
    uint8 public constant MIN_REPUTATION_SCORE = 3;   // Minimum score (out of 5) to trade

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
    error TimeOptimizerRejected(int256 amount, uint256 maxAmount, bool isVolatileHour);
    error AgentReputationTooLow(uint256 agentId, uint64 feedbackCount, uint8 averageScore);

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

        // Check agent reputation before executing strategy
        _checkReputation(agentId, sender);

        // Execute agent strategy
        if (agentId == AGENT_SLIPPAGE_GUARDIAN) {
            _executeSlippageGuardian(sender, params, agentId);
        } else if (agentId == AGENT_ORACLE_CHECKER) {
            _executeOracleChecker(sender, agentId);
        } else if (agentId == AGENT_TIME_OPTIMIZER) {
            _executeTimeOptimizer(sender, params, agentId);
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

    // ============ Reputation Check ============

    /// @notice Verifies agent has sufficient on-chain reputation (ERC-8004)
    /// @dev Requires at least 1 feedback AND averageScore >= MIN_REPUTATION_SCORE
    function _checkReputation(uint256 agentId, address) internal view {
        address[] memory emptyFilter = new address[](0);

        try reputationRegistry.getSummary(
            agentId,
            emptyFilter,
            bytes32(0),
            bytes32(0)
        ) returns (uint64 feedbackCount, uint8 averageScore) {
            if (feedbackCount == 0 || averageScore < MIN_REPUTATION_SCORE) {
                revert AgentReputationTooLow(agentId, feedbackCount, averageScore);
            }
        } catch {
            // If reputation registry is unreachable, reject the swap for safety
            revert AgentReputationTooLow(agentId, 0, 0);
        }
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

    /// @notice Agent #199: Time Optimizer - Adjusts limits based on time of day
    /// @dev During volatile hours (14:00-18:00 UTC): max 0.1 ETH
    ///      During normal hours: max 5 ETH
    function _executeTimeOptimizer(
        address sender,
        SwapParams calldata params,
        uint256 agentId
    ) internal {
        int256 absAmount = params.amountSpecified < 0
            ? -params.amountSpecified
            : params.amountSpecified;

        uint256 hourUTC = (block.timestamp % 1 days) / 1 hours;
        bool isVolatile = hourUTC >= VOLATILE_HOUR_START && hourUTC < VOLATILE_HOUR_END;
        uint256 currentMax = isVolatile ? VOLATILE_MAX_AMOUNT : NORMAL_MAX_AMOUNT;

        if (uint256(absAmount) > currentMax) {
            agentFailCount[agentId]++;
            string memory reason = isVolatile
                ? "Swap exceeds 0.1 ETH volatile hour limit"
                : "Swap exceeds 5 ETH normal hour limit";
            emit AgentSwapRejected(agentId, sender, reason);
            revert TimeOptimizerRejected(params.amountSpecified, currentMax, isVolatile);
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
