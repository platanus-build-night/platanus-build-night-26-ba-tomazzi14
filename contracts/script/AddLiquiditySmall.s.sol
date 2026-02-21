// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPositionManager} from "../../lib/uniswap-hooks/lib/v4-periphery/src/interfaces/IPositionManager.sol";
import {Actions} from "../../lib/uniswap-hooks/lib/v4-periphery/src/libraries/Actions.sol";
import {IAllowanceTransfer} from "../../lib/uniswap-hooks/lib/v4-periphery/lib/permit2/src/interfaces/IAllowanceTransfer.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWETH {
    function deposit() external payable;
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract AddLiquiditySmall is Script {
    // Sepolia addresses
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant POSITION_MANAGER = 0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4;
    address constant HOOK = 0xBc01DAF0b890ED562Dc325C9ee9429146eEB80C0;
    address constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    // Tokens (currency0 < currency1)
    address constant USDC = 0xCbEf7d5f764CbF65a2d499d206d1C7cc05978e4f;
    address constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;

    // Small amounts: ~5 USDC + ~0.002 ETH
    uint256 constant ETH_AMOUNT = 0.005 ether; // Wrap extra to cover

    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);

        console.log("Adding small liquidity to ETH/USDC pool...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(privateKey);

        // Step 1: Wrap ETH to WETH
        console.log("Wrapping ETH to WETH...");
        IWETH(WETH).deposit{value: ETH_AMOUNT}();

        // Step 2: Approve tokens on Permit2
        console.log("Approving tokens on Permit2...");
        IERC20(USDC).approve(PERMIT2, type(uint256).max);
        IERC20(WETH).approve(PERMIT2, type(uint256).max);

        // Step 3: Approve PositionManager on Permit2
        console.log("Approving PositionManager on Permit2...");
        IAllowanceTransfer(PERMIT2).approve(USDC, POSITION_MANAGER, type(uint160).max, type(uint48).max);
        IAllowanceTransfer(PERMIT2).approve(WETH, POSITION_MANAGER, type(uint160).max, type(uint48).max);

        // Step 4: Build PoolKey
        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(USDC),
            currency1: Currency.wrap(WETH),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK)
        });

        // Step 5: Full range ticks (multiples of 60)
        // Full range = TickMath.MIN_TICK rounded up, TickMath.MAX_TICK rounded down
        int24 tickLower = -887220; // Full range lower
        int24 tickUpper = 887220;  // Full range upper

        // Step 6: Build action plan — small liquidity
        // Use a smaller liquidity amount proportional to ~5 USDC
        uint128 liquidityAmount = 1e12; // Much smaller than the 1e15 before

        bytes memory actions = new bytes(3);
        actions[0] = bytes1(uint8(Actions.MINT_POSITION));
        actions[1] = bytes1(uint8(Actions.CLOSE_CURRENCY));
        actions[2] = bytes1(uint8(Actions.CLOSE_CURRENCY));

        bytes[] memory params = new bytes[](3);
        params[0] = abi.encode(
            poolKey,
            tickLower,
            tickUpper,
            liquidityAmount,
            type(uint128).max, // amount0Max
            type(uint128).max, // amount1Max
            deployer,
            bytes("")
        );
        params[1] = abi.encode(poolKey.currency0);
        params[2] = abi.encode(poolKey.currency1);

        bytes memory encodedData = abi.encode(actions, params);

        // Step 7: Call PositionManager
        console.log("Minting small position...");
        IPositionManager(POSITION_MANAGER).modifyLiquidities(
            encodedData,
            block.timestamp + 300
        );

        vm.stopBroadcast();

        console.log("");
        console.log("===========================================");
        console.log("Small liquidity position added!");
        console.log("===========================================");
    }
}
