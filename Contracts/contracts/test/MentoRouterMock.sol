// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MockERC20.sol"; // Or use IERC20 from OpenZeppelin if needed

contract MentoRouterMock {
    address public cUSD;
    address public cREAL;
    address public cCOP;

    constructor(address _cUSD, address _cREAL, address _cCOP) {
        cUSD = _cUSD;
        cREAL = _cREAL;
        cCOP = _cCOP;
    }

    function swap(
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 /* minAmountOut */
    ) external returns (uint256) {
        require(amountIn > 0, "Amount must be > 0");

        uint256 rate = 1e18;

        if (fromToken == cUSD && toToken == cCOP) {
            rate = 105e16; // 1.05
        } else if (fromToken == cREAL && toToken == cCOP) {
            rate = 110e16; // 1.10
        }

        uint256 outAmount = (amountIn * rate) / 1e18;

        require(MockERC20(fromToken).transferFrom(msg.sender, address(this), amountIn), "Transfer in failed");
        require(MockERC20(toToken).transfer(msg.sender, outAmount), "Transfer out failed");

        return outAmount;
    }

function getSwapOutput(
    address fromToken,
    address toToken,
    uint256 amountIn
) external view returns (uint256) {
    uint256 rate = 1e18;

    if (fromToken == cUSD && toToken == cCOP) {
        rate = 105e16; // 1.05
    } else if (fromToken == cREAL && toToken == cCOP) {
        rate = 110e16; // 1.10
    }

    return (amountIn * rate) / 1e18;
}

    fallback() external {}
}
