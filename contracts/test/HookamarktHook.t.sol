// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test, console} from "forge-std/Test.sol";
import {HookamarktHook, IReputationRegistry} from "../src/HookamrktHook.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";

// ============ Mocks ============

contract MockReputationRegistry {
    struct FeedbackCall {
        uint256 agentId;
        uint8 score;
        bytes32 tag1;
        bytes32 tag2;
    }

    FeedbackCall[] public feedbackCalls;
    bool public shouldRevert;

    function giveFeedback(
        uint256 agentId,
        uint8 score,
        bytes32 tag1,
        bytes32 tag2,
        string calldata,
        bytes32,
        bytes calldata
    ) external {
        if (shouldRevert) revert("MockReputationRegistry: revert");
        feedbackCalls.push(FeedbackCall(agentId, score, tag1, tag2));
    }

    function setShouldRevert(bool _shouldRevert) external {
        shouldRevert = _shouldRevert;
    }

    function getFeedbackCallCount() external view returns (uint256) {
        return feedbackCalls.length;
    }

    function getLastFeedback() external view returns (FeedbackCall memory) {
        require(feedbackCalls.length > 0, "No feedback calls");
        return feedbackCalls[feedbackCalls.length - 1];
    }
}

contract MockPriceFeed {
    int256 public price;
    uint256 public updatedAt;
    bool public shouldRevert;

    constructor(int256 _price) {
        price = _price;
        updatedAt = block.timestamp;
    }

    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 _updatedAt, uint80 answeredInRound)
    {
        if (shouldRevert) revert("MockPriceFeed: revert");
        return (1, price, block.timestamp, updatedAt, 1);
    }

    function setPrice(int256 _price) external {
        price = _price;
    }

    function setUpdatedAt(uint256 _updatedAt) external {
        updatedAt = _updatedAt;
    }

    function setShouldRevert(bool _shouldRevert) external {
        shouldRevert = _shouldRevert;
    }
}

// ============ Tests ============

contract HookamarktHookTest is Test {
    HookamarktHook public hook;
    MockReputationRegistry public reputationRegistry;
    MockPriceFeed public priceFeed;
    address public poolManager;

    uint256 constant AGENT_197 = 197;
    uint256 constant AGENT_198 = 198;

    address alice = makeAddr("alice");

    function setUp() public {
        // Deploy mocks
        poolManager = makeAddr("poolManager");
        reputationRegistry = new MockReputationRegistry();
        priceFeed = new MockPriceFeed(2000e8); // ETH = $2000

        // Hook needs beforeSwap (bit 7 = 0x80) and afterSwap (bit 6 = 0x40)
        // Address must end in 0xC0
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG);
        address hookAddress = address(flags);

        // Deploy hook at the correct address using deployCodeTo
        bytes memory constructorArgs = abi.encode(
            IPoolManager(poolManager),
            address(reputationRegistry),
            address(priceFeed)
        );
        deployCodeTo("HookamrktHook.sol:HookamarktHook", constructorArgs, hookAddress);
        hook = HookamarktHook(hookAddress);
    }

    // ============ Helper ============

    function _buildPoolKey() internal view returns (PoolKey memory) {
        return PoolKey({
            currency0: Currency.wrap(address(0)),
            currency1: Currency.wrap(address(1)),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
    }

    function _buildSwapParams(int256 amount) internal pure returns (SwapParams memory) {
        return SwapParams({
            zeroForOne: true,
            amountSpecified: amount,
            sqrtPriceLimitX96: 0
        });
    }

    // ============ getHookPermissions ============

    function testGetHookPermissions() public view {
        Hooks.Permissions memory perms = hook.getHookPermissions();
        assertTrue(perms.beforeSwap);
        assertTrue(perms.afterSwap);
        assertFalse(perms.beforeInitialize);
        assertFalse(perms.afterInitialize);
        assertFalse(perms.beforeAddLiquidity);
        assertFalse(perms.afterAddLiquidity);
        assertFalse(perms.beforeRemoveLiquidity);
        assertFalse(perms.afterRemoveLiquidity);
        assertFalse(perms.beforeDonate);
        assertFalse(perms.afterDonate);
    }

    // ============ beforeSwap: Agent #197 (Slippage Guardian) ============

    function testAgent197_AllowsSmallSwap() public {
        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-0.5 ether); // exactIn 0.5 ETH
        bytes memory hookData = abi.encode(AGENT_197);

        vm.prank(poolManager);
        (bytes4 selector, , ) = hook.beforeSwap(alice, key, params, hookData);

        assertEq(selector, hook.beforeSwap.selector);
        assertEq(hook.agentSwapCount(AGENT_197), 1);
        assertEq(hook.agentFailCount(AGENT_197), 0);
    }

    function testAgent197_AllowsExactlyOneEther() public {
        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-1 ether); // exactly 1 ETH
        bytes memory hookData = abi.encode(AGENT_197);

        vm.prank(poolManager);
        (bytes4 selector, , ) = hook.beforeSwap(alice, key, params, hookData);

        assertEq(selector, hook.beforeSwap.selector);
        assertEq(hook.agentFailCount(AGENT_197), 0);
    }

    function testAgent197_RejectsLargeSwapExactIn() public {
        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-2 ether); // exactIn 2 ETH (negative)
        bytes memory hookData = abi.encode(AGENT_197);

        vm.prank(poolManager);
        vm.expectRevert(
            abi.encodeWithSelector(
                HookamarktHook.SlippageGuardianRejected.selector,
                int256(-2 ether),
                uint256(1 ether)
            )
        );
        hook.beforeSwap(alice, key, params, hookData);
    }

    function testAgent197_RejectsLargeSwapExactOut() public {
        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(2 ether); // exactOut 2 ETH (positive)
        bytes memory hookData = abi.encode(AGENT_197);

        vm.prank(poolManager);
        vm.expectRevert(
            abi.encodeWithSelector(
                HookamarktHook.SlippageGuardianRejected.selector,
                int256(2 ether),
                uint256(1 ether)
            )
        );
        hook.beforeSwap(alice, key, params, hookData);
    }

    function testAgent197_RejectEmitsEvent() public {
        // NOTE: When a tx reverts, all storage writes are rolled back.
        // So we can't assert on agentSwapCount/agentFailCount after revert.
        // Instead, we verify the rejection event is emitted before the revert.
        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-2 ether);
        bytes memory hookData = abi.encode(AGENT_197);

        vm.prank(poolManager);
        vm.expectEmit(true, false, false, true);
        emit HookamarktHook.AgentSwapRejected(AGENT_197, alice, "Swap exceeds 1 ETH limit");
        vm.expectRevert();
        hook.beforeSwap(alice, key, params, hookData);
    }

    function testAgent197_AllowsZeroAmount() public {
        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(0);
        bytes memory hookData = abi.encode(AGENT_197);

        vm.prank(poolManager);
        hook.beforeSwap(alice, key, params, hookData);

        assertEq(hook.agentFailCount(AGENT_197), 0);
    }

    // ============ beforeSwap: Agent #198 (Oracle Checker) ============

    function testAgent198_PassesWithValidOracle() public {
        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-0.5 ether);
        bytes memory hookData = abi.encode(AGENT_198);

        vm.prank(poolManager);
        (bytes4 selector, , ) = hook.beforeSwap(alice, key, params, hookData);

        assertEq(selector, hook.beforeSwap.selector);
        assertEq(hook.agentSwapCount(AGENT_198), 1);
        assertEq(hook.agentFailCount(AGENT_198), 0);
    }

    function testAgent198_RejectsZeroPrice() public {
        priceFeed.setPrice(0);

        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-0.5 ether);
        bytes memory hookData = abi.encode(AGENT_198);

        vm.prank(poolManager);
        vm.expectRevert(
            abi.encodeWithSelector(
                HookamarktHook.OracleCheckerFailed.selector,
                "Oracle returned invalid price"
            )
        );
        hook.beforeSwap(alice, key, params, hookData);
    }

    function testAgent198_RejectsNegativePrice() public {
        priceFeed.setPrice(-100);

        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-0.5 ether);
        bytes memory hookData = abi.encode(AGENT_198);

        vm.prank(poolManager);
        vm.expectRevert(
            abi.encodeWithSelector(
                HookamarktHook.OracleCheckerFailed.selector,
                "Oracle returned invalid price"
            )
        );
        hook.beforeSwap(alice, key, params, hookData);
    }

    function testAgent198_RejectsStaleData() public {
        // Warp to a realistic timestamp to avoid underflow
        vm.warp(1_700_000_000);
        // Re-deploy priceFeed with stale updatedAt (2 hours ago)
        priceFeed.setUpdatedAt(block.timestamp - 2 hours);

        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-0.5 ether);
        bytes memory hookData = abi.encode(AGENT_198);

        vm.prank(poolManager);
        vm.expectRevert(
            abi.encodeWithSelector(
                HookamarktHook.OracleCheckerFailed.selector,
                "Oracle data is stale"
            )
        );
        hook.beforeSwap(alice, key, params, hookData);
    }

    function testAgent198_RejectsWhenOracleReverts() public {
        priceFeed.setShouldRevert(true);

        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-0.5 ether);
        bytes memory hookData = abi.encode(AGENT_198);

        vm.prank(poolManager);
        vm.expectRevert(
            abi.encodeWithSelector(
                HookamarktHook.OracleCheckerFailed.selector,
                "Oracle call failed"
            )
        );
        hook.beforeSwap(alice, key, params, hookData);
    }

    // ============ beforeSwap: Edge Cases ============

    function testBeforeSwap_NoHookData_PassesThrough() public {
        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-5 ether); // Large swap, but no agent
        bytes memory hookData = "";

        vm.prank(poolManager);
        (bytes4 selector, , ) = hook.beforeSwap(alice, key, params, hookData);

        assertEq(selector, hook.beforeSwap.selector);
    }

    function testBeforeSwap_UnknownAgent_Reverts() public {
        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-0.5 ether);
        bytes memory hookData = abi.encode(uint256(999));

        vm.prank(poolManager);
        vm.expectRevert(abi.encodeWithSelector(HookamarktHook.UnknownAgent.selector, uint256(999)));
        hook.beforeSwap(alice, key, params, hookData);
    }

    function testBeforeSwap_OnlyPoolManager() public {
        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-0.5 ether);
        bytes memory hookData = abi.encode(AGENT_197);

        // Call from random address (not poolManager) should revert
        vm.prank(alice);
        vm.expectRevert();
        hook.beforeSwap(alice, key, params, hookData);
    }

    // ============ afterSwap: Stats & Reputation ============

    function testAfterSwap_UpdatesSuccessCount() public {
        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-0.5 ether);
        BalanceDelta delta = BalanceDelta.wrap(0);
        bytes memory hookData = abi.encode(AGENT_197);

        vm.prank(poolManager);
        hook.afterSwap(alice, key, params, delta, hookData);

        assertEq(hook.agentSuccessCount(AGENT_197), 1);
    }

    function testAfterSwap_CallsReputationRegistry() public {
        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-0.5 ether);
        BalanceDelta delta = BalanceDelta.wrap(0);
        bytes memory hookData = abi.encode(AGENT_197);

        vm.prank(poolManager);
        hook.afterSwap(alice, key, params, delta, hookData);

        assertEq(reputationRegistry.getFeedbackCallCount(), 1);

        MockReputationRegistry.FeedbackCall memory fb = reputationRegistry.getLastFeedback();
        assertEq(fb.agentId, AGENT_197);
        assertEq(fb.score, 5);
        assertEq(fb.tag1, bytes32("swap_success"));
        assertEq(fb.tag2, bytes32("hookamarkt"));
    }

    function testAfterSwap_ReputationFailureDoesNotRevert() public {
        reputationRegistry.setShouldRevert(true);

        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-0.5 ether);
        BalanceDelta delta = BalanceDelta.wrap(0);
        bytes memory hookData = abi.encode(AGENT_197);

        // Should NOT revert even though reputation registry reverts
        vm.prank(poolManager);
        (bytes4 selector, ) = hook.afterSwap(alice, key, params, delta, hookData);

        assertEq(selector, hook.afterSwap.selector);
        // Success count should still be incremented
        assertEq(hook.agentSuccessCount(AGENT_197), 1);
    }

    function testAfterSwap_NoHookData_SkipsUpdate() public {
        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-0.5 ether);
        BalanceDelta delta = BalanceDelta.wrap(0);
        bytes memory hookData = "";

        vm.prank(poolManager);
        hook.afterSwap(alice, key, params, delta, hookData);

        assertEq(reputationRegistry.getFeedbackCallCount(), 0);
    }

    function testAfterSwap_EmitsAgentSwapSuccess() public {
        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-0.5 ether);
        BalanceDelta delta = BalanceDelta.wrap(0);
        bytes memory hookData = abi.encode(AGENT_197);

        vm.prank(poolManager);
        vm.expectEmit(true, false, false, true);
        emit HookamarktHook.AgentSwapSuccess(AGENT_197, alice);
        hook.afterSwap(alice, key, params, delta, hookData);
    }

    // ============ getAgentStats ============

    function testGetAgentStats_AfterMultipleSwaps() public {
        // NOTE: A reverted beforeSwap does NOT persist storage changes (agentSwapCount, agentFailCount).
        // Only successful (non-reverted) calls update storage.
        // So we test 3 successful beforeSwaps + 3 afterSwaps.
        PoolKey memory key = _buildPoolKey();
        SwapParams memory smallSwap = _buildSwapParams(-0.5 ether);
        bytes memory hookData = abi.encode(AGENT_197);
        BalanceDelta delta = BalanceDelta.wrap(0);

        vm.startPrank(poolManager);
        // 3 successful full swap cycles (beforeSwap + afterSwap)
        hook.beforeSwap(alice, key, smallSwap, hookData);
        hook.afterSwap(alice, key, smallSwap, delta, hookData);

        hook.beforeSwap(alice, key, smallSwap, hookData);
        hook.afterSwap(alice, key, smallSwap, delta, hookData);

        hook.beforeSwap(alice, key, smallSwap, hookData);
        hook.afterSwap(alice, key, smallSwap, delta, hookData);
        vm.stopPrank();

        (uint256 totalSwaps, uint256 successCount, uint256 failCount, uint256 successRate) =
            hook.getAgentStats(AGENT_197);

        assertEq(totalSwaps, 3);      // 3 beforeSwap calls
        assertEq(successCount, 3);    // 3 afterSwap calls
        assertEq(failCount, 0);       // no failures
        assertEq(successRate, 100);   // 3/3 * 100
    }

    function testGetAgentStats_ZeroSwaps() public view {
        (uint256 totalSwaps, uint256 successCount, uint256 failCount, uint256 successRate) =
            hook.getAgentStats(AGENT_197);

        assertEq(totalSwaps, 0);
        assertEq(successCount, 0);
        assertEq(failCount, 0);
        assertEq(successRate, 0);
    }

    function testGetAgentStats_PerfectRecord() public {
        PoolKey memory key = _buildPoolKey();
        SwapParams memory params = _buildSwapParams(-0.5 ether);
        BalanceDelta delta = BalanceDelta.wrap(0);
        bytes memory hookData = abi.encode(AGENT_197);

        vm.startPrank(poolManager);
        // 3 successful swaps (before + after)
        for (uint256 i = 0; i < 3; i++) {
            hook.beforeSwap(alice, key, params, hookData);
            hook.afterSwap(alice, key, params, delta, hookData);
        }
        vm.stopPrank();

        (uint256 totalSwaps, uint256 successCount, uint256 failCount, uint256 successRate) =
            hook.getAgentStats(AGENT_197);

        assertEq(totalSwaps, 3);
        assertEq(successCount, 3);
        assertEq(failCount, 0);
        assertEq(successRate, 100);
    }
}
