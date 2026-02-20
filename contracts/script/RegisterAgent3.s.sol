// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";

interface IIdentityRegistry {
    function register(string calldata agentURI) external returns (uint256);
}

contract RegisterAgent3 is Script {
    address constant IDENTITY_REGISTRY = 0x7177a6867296406881E20d6647232314736Dd09A;

    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);

        IIdentityRegistry registry = IIdentityRegistry(IDENTITY_REGISTRY);

        // Agent #3: Time Optimizer
        // Metadata JSON:
        // {
        //   "name": "Time Optimizer",
        //   "description": "Adjusts limits based on time of day. Stricter during volatile hours (14:00-18:00 UTC)",
        //   "strategy": "time-based",
        //   "volatileHours": "14:00-18:00 UTC",
        //   "normalMaxAmount": "5 ETH",
        //   "volatileMaxAmount": "0.1 ETH"
        // }
        string memory agent3URI =
            "data:application/json;base64,eyJuYW1lIjoiVGltZSBPcHRpbWl6ZXIiLCJkZXNjcmlwdGlvbiI6IkFkanVzdHMgbGltaXRzIGJhc2VkIG9uIHRpbWUgb2YgZGF5LiBTdHJpY3RlciBkdXJpbmcgdm9sYXRpbGUgaG91cnMgKDE0OjAwLTE4OjAwIFVUQykiLCJzdHJhdGVneSI6InRpbWUtYmFzZWQiLCJ2b2xhdGlsZUhvdXJzIjoiMTQ6MDAtMTg6MDAgVVRDIiwibm9ybWFsTWF4QW1vdW50IjoiNSBFVEgiLCJ2b2xhdGlsZU1heEFtb3VudCI6IjAuMSBFVEgifQ==";

        uint256 agentId3 = registry.register(agent3URI);
        console.log("Agent #3 registered:", agentId3);

        vm.stopBroadcast();
    }
}
