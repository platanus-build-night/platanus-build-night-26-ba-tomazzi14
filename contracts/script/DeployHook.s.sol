// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {HookamarktHook} from "../src/HookamrktHook.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "../lib/uniswap-hooks/lib/v4-periphery/src/utils/HookMiner.sol";

contract DeployHook is Script {
    // Sepolia addresses
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant REPUTATION_REGISTRY = 0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322;
    address constant CHAINLINK_ETH_USD = 0x694AA1769357215DE4FAC081bf1f309aDC325306;

    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");

        console.log("Deploying HookamarktHook to Sepolia...");
        console.log("Deployer:", vm.addr(privateKey));

        // Hook flags: beforeSwap + afterSwap
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG);

        // Mine a salt that produces an address with correct flag bits
        bytes memory constructorArgs = abi.encode(
            IPoolManager(POOL_MANAGER),
            REPUTATION_REGISTRY,
            CHAINLINK_ETH_USD
        );

        console.log("Mining salt for hook address with flags: 0xC0...");
        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            type(HookamarktHook).creationCode,
            constructorArgs
        );

        console.log("Found hook address:", hookAddress);
        console.log("Salt:", vm.toString(salt));

        vm.startBroadcast(privateKey);

        HookamarktHook hook = new HookamarktHook{salt: salt}(
            IPoolManager(POOL_MANAGER),
            REPUTATION_REGISTRY,
            CHAINLINK_ETH_USD
        );

        vm.stopBroadcast();

        require(address(hook) == hookAddress, "Hook address mismatch");

        console.log("");
        console.log("==============================================");
        console.log("HookamarktHook deployed at:", address(hook));
        console.log("==============================================");
        console.log("");
        console.log("Configuration:");
        console.log("  Pool Manager:", POOL_MANAGER);
        console.log("  Reputation Registry:", REPUTATION_REGISTRY);
        console.log("  Chainlink Feed:", CHAINLINK_ETH_USD);
        console.log("");
        console.log("Agents:");
        console.log("  #197: Slippage Guardian (max 1 ETH)");
        console.log("  #198: Oracle Checker (Chainlink validation)");
        console.log("  #199: Time Optimizer (time-based limits)");
    }
}
