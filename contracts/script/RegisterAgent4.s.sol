// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";

interface IIdentityRegistry {
    function register(string calldata agentURI) external returns (uint256);
}

contract RegisterAgent4 is Script {
    address constant IDENTITY_REGISTRY = 0x7177a6867296406881E20d6647232314736Dd09A;

    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);

        IIdentityRegistry registry = IIdentityRegistry(IDENTITY_REGISTRY);

        // Agent #4: Unreliable Bot (for demo purposes - will get bad reputation)
        // Metadata JSON:
        // {
        //   "name": "Unreliable Bot",
        //   "description": "A test agent with poor performance for demo purposes",
        //   "strategy": "none",
        //   "status": "untrusted"
        // }
        string memory agent4URI =
            "data:application/json;base64,eyJuYW1lIjoiVW5yZWxpYWJsZSBCb3QiLCJkZXNjcmlwdGlvbiI6IkEgdGVzdCBhZ2VudCB3aXRoIHBvb3IgcGVyZm9ybWFuY2UgZm9yIGRlbW8gcHVycG9zZXMiLCJzdHJhdGVneSI6Im5vbmUiLCJzdGF0dXMiOiJ1bnRydXN0ZWQifQ==";

        uint256 agentId4 = registry.register(agent4URI);
        console.log("Agent #4 registered:", agentId4);

        vm.stopBroadcast();
    }
}
