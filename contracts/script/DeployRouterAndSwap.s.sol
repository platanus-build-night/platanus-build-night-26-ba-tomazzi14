// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWETH {
    function deposit() external payable;
    function approve(address spender, uint256 amount) external returns (bool);
}

contract DeployRouterAndSwap is Script {
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant HOOK = 0xBc01DAF0b890ED562Dc325C9ee9429146eEB80C0;
    address constant USDC = 0xCbEf7d5f764CbF65a2d499d206d1C7cc05978e4f;
    address constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;

    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);

        console.log("Deployer:", deployer);

        vm.startBroadcast(privateKey);

        // ===== STEP 1: Deploy PoolSwapTest router =====
        console.log("Deploying PoolSwapTest router...");
        PoolSwapTest swapRouter = new PoolSwapTest(IPoolManager(POOL_MANAGER));
        console.log("SwapRouter deployed at:");
        console.log(address(swapRouter));

        // ===== STEP 2: Prepare tokens =====
        console.log("Wrapping 0.01 ETH to WETH...");
        IWETH(WETH).deposit{value: 0.01 ether}();

        // Approve router to spend tokens
        IERC20(USDC).approve(address(swapRouter), type(uint256).max);
        IERC20(WETH).approve(address(swapRouter), type(uint256).max);

        // ===== STEP 3: Build PoolKey =====
        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(USDC),
            currency1: Currency.wrap(WETH),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK)
        });

        PoolSwapTest.TestSettings memory testSettings = PoolSwapTest.TestSettings({
            takeClaims: false,
            settleUsingBurn: false
        });

        // ===== STEP 4: Swap #1 — Agent 197 (Slippage Guardian) =====
        console.log("Swap #1: Agent 197 (Slippage Guardian) - Selling 0.001 WETH for USDC...");
        swapRouter.swap(
            poolKey,
            SwapParams({
                zeroForOne: false,              // WETH -> USDC
                amountSpecified: -0.001 ether,  // exact input 0.001 WETH
                sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1
            }),
            testSettings,
            abi.encode(uint256(197))  // Agent 197
        );
        console.log("Swap #1 SUCCESS");

        // ===== STEP 5: Swap #2 — Agent 198 (Oracle Checker) =====
        console.log("Swap #2: Agent 198 (Oracle Checker) - Selling 0.001 WETH for USDC...");
        swapRouter.swap(
            poolKey,
            SwapParams({
                zeroForOne: false,
                amountSpecified: -0.001 ether,
                sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1
            }),
            testSettings,
            abi.encode(uint256(198))
        );
        console.log("Swap #2 SUCCESS");

        // ===== STEP 6: Swap #3 — Agent 199 (Time Optimizer) =====
        console.log("Swap #3: Agent 199 (Time Optimizer) - Selling 0.001 WETH for USDC...");
        swapRouter.swap(
            poolKey,
            SwapParams({
                zeroForOne: false,
                amountSpecified: -0.001 ether,
                sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1
            }),
            testSettings,
            abi.encode(uint256(199))
        );
        console.log("Swap #3 SUCCESS");

        vm.stopBroadcast();

        console.log("");
        console.log("===========================================");
        console.log("All 3 agent swaps executed successfully!");
        console.log("SwapRouter:", address(swapRouter));
        console.log("===========================================");
    }
}
