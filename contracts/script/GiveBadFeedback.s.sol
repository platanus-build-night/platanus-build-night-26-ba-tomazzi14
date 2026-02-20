// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";

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

contract GiveBadFeedback is Script {
    address constant REPUTATION_REGISTRY = 0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322;

    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        uint256 agentId = vm.envOr("AGENT_ID", uint256(200));

        vm.startBroadcast(privateKey);

        IReputationRegistry registry = IReputationRegistry(REPUTATION_REGISTRY);

        // Give bad score (1/5) to unreliable agent
        registry.giveFeedback(
            agentId,
            1, // poor score
            bytes32("poor_performance"),
            bytes32("unreliable"),
            "",
            bytes32(0),
            ""
        );

        console.log("Bad feedback given to Agent #", agentId);
        console.log("Score: 1/5");

        vm.stopBroadcast();
    }
}
