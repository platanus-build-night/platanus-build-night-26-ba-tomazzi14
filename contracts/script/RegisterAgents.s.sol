// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "forge-std/Script.sol";

interface IIdentityRegistry {
    function register(string calldata agentURI) external returns (uint256);
}

contract RegisterAgents is Script {
    address constant IDENTITY_REGISTRY = 0x7177a6867296406881E20d6647232314736Dd09A;
    
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);
        
        IIdentityRegistry registry = IIdentityRegistry(IDENTITY_REGISTRY);
        
        // Agent #1: Slippage Guardian
        string memory agent1URI = "data:application/json;base64,eyJuYW1lIjoiU2xpcHBhZ2UgR3VhcmRpYW4iLCJkZXNjcmlwdGlvbiI6IlByb3RlY3RzIGZyb20gbGFyZ2Ugc3dhcHMiLCJzdHJhdGVneSI6Im1heF9hbW91bnQiLCJtYXhBbW91bnQiOiIxIEVUSCJ9";
        
        uint256 agentId1 = registry.register(agent1URI);
        console.log("Agent #1 registered:", agentId1);
        
        // Agent #2: Oracle Checker  
        string memory agent2URI = "data:application/json;base64,eyJuYW1lIjoiT3JhY2xlIENoZWNrZXIiLCJkZXNjcmlwdGlvbiI6IlZhbGlkYXRlcyBwcmljZXMgdnMgQ2hhaW5saW5rIiwic3RyYXRlZ3kiOiJvcmFjbGVfdmFsaWRhdGlvbiIsIm9yYWNsZSI6IkVUSC9VU0QifQ==";
        
        uint256 agentId2 = registry.register(agent2URI);
        console.log("Agent #2 registered:", agentId2);
        
        vm.stopBroadcast();
    }
}