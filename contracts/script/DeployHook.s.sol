// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "forge-std/Script.sol";
import {HookamarktHook} from "../src/HookamrktHook.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";

contract DeployHook is Script {
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant REPUTATION_REGISTRY = 0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322;
    address constant CHAINLINK_ETH_USD = 0x694AA1769357215DE4FAC081bf1f309aDC325306;
    
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);
        
        HookamarktHook hook = new HookamarktHook(
            IPoolManager(POOL_MANAGER),
            REPUTATION_REGISTRY,
            CHAINLINK_ETH_USD
        );
        
        console.log("Hook deployed:", address(hook));
        
        vm.stopBroadcast();
    }
}
