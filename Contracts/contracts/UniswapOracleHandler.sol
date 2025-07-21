// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.19;

// import "./interfaces/interfaces.sol";


// contract UniswapOracleHandler {
//     IUniswapV2Router public router;
//     address public cCOP;
//     address public cUSD;
//     address public cREAL;

//     constructor(address _router, address _cCOP, address _cUSD, address _cREAL) {
//         router = IUniswapV2Router(_router);
//         cCOP = _cCOP;
//         cUSD = _cUSD;
//         cREAL = _cREAL;
//     }

//     // This function is a view function and is safe to keep.
//     function getSwapOutput(address from, address to, uint256 amountIn) public view returns (uint256) {
//         address[] memory path = new address[](2);
//         path[0] = from;
//         path[1] = to;

//         uint[] memory amounts = router.getAmountsOut(amountIn, path);
//         return amounts[1];
//     }

//     // The swapTokens function has been REMOVED. It was architecturally incorrect
//     // and was the source of the bug. PiggyBank now calls the router directly.

//     // This function is pure and is safe to keep.
//     function getSuggestedAllocation(uint256 totalAmount) external pure returns (
//         uint256 cCOPPortion,
//         uint256 cUSDPortion,
//         uint256 cREALPortion
//     ) {
//         cCOPPortion = (totalAmount * 40) / 100;
//         cUSDPortion = (totalAmount * 30) / 100;
//         cREALPortion = (totalAmount * 30) / 100;
//     }

//     // This function is a view function and is safe to keep.
//     function getBasketValueInCCOP(uint256 amountUSD, uint256 amountREAL) external view returns (uint256 totalValueInCCOP) {
//         uint256 usdValue = getSwapOutput(cUSD, cCOP, amountUSD);
//         uint256 realValue = getSwapOutput(cREAL, cCOP, amountREAL);
//         return usdValue + realValue;
//     }
// }