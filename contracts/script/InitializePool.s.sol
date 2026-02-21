// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";

contract InitializePool is Script {
    using PoolIdLibrary for PoolKey;

    // Sepolia addresses
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant HOOK = 0xBc01DAF0b890ED562Dc325C9ee9429146eEB80C0;

    // Tokens (currency0 < currency1 required)
    address constant USDC = 0xCbEf7d5f764CbF65a2d499d206d1C7cc05978e4f; // currency0 (lower address)
    address constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14; // currency1 (higher address)

    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");

        console.log("Initializing ETH/USDC Pool on Uniswap v4...");
        console.log("Deployer:", vm.addr(privateKey));

        // Verify currency ordering
        require(USDC < WETH, "Currency ordering wrong");

        // Create PoolKey
        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(USDC),
            currency1: Currency.wrap(WETH),
            fee: 3000,       // 0.3% fee tier
            tickSpacing: 60, // Standard for 0.3%
            hooks: IHooks(HOOK)
        });

        // sqrtPriceX96 for 1 ETH = 2500 USDC
        // currency0 = USDC (6 dec), currency1 = WETH (18 dec)
        // price (raw) = 10^18 / (2500 * 10^6) = 4 * 10^8
        // sqrt(4 * 10^8) = 20000
        // sqrtPriceX96 = 20000 * 2^96
        uint160 sqrtPriceX96 = 1584563250285286751870879006720000;

        console.log("Currency0 (USDC):", USDC);
        console.log("Currency1 (WETH):", WETH);
        console.log("Fee:", poolKey.fee);
        console.log("Hook:", address(poolKey.hooks));

        vm.startBroadcast(privateKey);

        IPoolManager(POOL_MANAGER).initialize(poolKey, sqrtPriceX96);

        vm.stopBroadcast();

        PoolId poolId = poolKey.toId();
        console.log("");
        console.log("===========================================");
        console.log("Pool initialized successfully!");
        console.log("Pool ID:", vm.toString(PoolId.unwrap(poolId)));
        console.log("===========================================");
    }
}
