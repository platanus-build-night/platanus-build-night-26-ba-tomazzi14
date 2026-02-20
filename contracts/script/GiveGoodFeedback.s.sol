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

contract GiveGoodFeedback is Script {
    address constant REPUTATION_REGISTRY = 0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322;
    address constant IDENTITY_REGISTRY = 0x7177a6867296406881E20d6647232314736Dd09A;

    function _buildFeedbackAuth(
        uint256 agentId,
        address clientAddress,
        uint256 ownerPrivateKey
    ) internal view returns (bytes memory) {
        address signerAddress = vm.addr(ownerPrivateKey);
        uint64 indexLimit = 100;
        uint256 expiry = block.timestamp + 1 hours;
        uint256 chainId = block.chainid;

        // Build struct hash
        bytes32 structHash = keccak256(abi.encode(
            agentId,
            clientAddress,
            indexLimit,
            expiry,
            chainId,
            IDENTITY_REGISTRY,
            signerAddress
        ));

        // Sign with EIP-191 personal sign
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            structHash
        ));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, ethSignedHash);

        // Encode: struct (224 bytes) + signature (65 bytes) = 289 bytes
        return abi.encodePacked(
            abi.encode(
                agentId,
                clientAddress,
                indexLimit,
                expiry,
                chainId,
                IDENTITY_REGISTRY,
                signerAddress
            ),
            r, s, v
        );
    }

    function run() external {
        uint256 ownerKey = vm.envUint("PRIVATE_KEY");
        address ownerAddr = vm.addr(ownerKey);

        // Use a deterministic reviewer key (different from owner)
        uint256 reviewerKey = vm.envUint("REVIEWER_PRIVATE_KEY");
        address reviewerAddr = vm.addr(reviewerKey);

        console.log("Agent owner:", ownerAddr);
        console.log("Reviewer:", reviewerAddr);

        // Step 1: Fund reviewer from owner
        vm.startBroadcast(ownerKey);
        (bool sent,) = reviewerAddr.call{value: 0.001 ether}("");
        require(sent, "Failed to fund reviewer");
        console.log("Funded reviewer with 0.001 ETH");
        vm.stopBroadcast();

        // Step 2: Reviewer gives feedback with owner-signed auth
        vm.startBroadcast(reviewerKey);
        IReputationRegistry registry = IReputationRegistry(REPUTATION_REGISTRY);

        // Agent #197 - score 5/5
        bytes memory auth197 = _buildFeedbackAuth(197, reviewerAddr, ownerKey);
        registry.giveFeedback(197, 5, bytes32("excellent"), bytes32("reliable"), "", bytes32(0), auth197);
        console.log("Agent #197: score 5/5");

        // Agent #198 - score 5/5
        bytes memory auth198 = _buildFeedbackAuth(198, reviewerAddr, ownerKey);
        registry.giveFeedback(198, 5, bytes32("excellent"), bytes32("reliable"), "", bytes32(0), auth198);
        console.log("Agent #198: score 5/5");

        // Agent #199 - score 4/5
        bytes memory auth199 = _buildFeedbackAuth(199, reviewerAddr, ownerKey);
        registry.giveFeedback(199, 4, bytes32("good"), bytes32("reliable"), "", bytes32(0), auth199);
        console.log("Agent #199: score 4/5");

        // Agent #200 - score 1/5 (bad agent)
        bytes memory auth200 = _buildFeedbackAuth(200, reviewerAddr, ownerKey);
        registry.giveFeedback(200, 1, bytes32("poor_performance"), bytes32("unreliable"), "", bytes32(0), auth200);
        console.log("Agent #200: score 1/5");

        vm.stopBroadcast();

        console.log("All feedback submitted!");
    }
}
