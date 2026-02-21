// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMockUSDC {
    function mint(address to, uint256 amount) external;
}

contract MintTokens is Script {
    address constant MOCK_USDC = 0xCbEf7d5f764CbF65a2d499d206d1C7cc05978e4f;

    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);

        vm.startBroadcast(privateKey);

        // Mint 100 USDC
        IMockUSDC(MOCK_USDC).mint(deployer, 100 * 10 ** 6);

        console.log("Minted 100 USDC to:", deployer);
        console.log("USDC Balance:", IERC20(MOCK_USDC).balanceOf(deployer));

        vm.stopBroadcast();
    }
}
