// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MentoRouterMock {
    function swap(
        address from,
        address to,
        uint256 amount,
        uint256 minReturn
    ) external view returns (uint256) {
        return amount;
    }

    function getSwapOutput(
        address from,
        address to,
        uint256 amount
    ) external view returns (uint256) {
        return amount; // simulate 1:1 FX rate for testing
    }

    fallback() external {}
}
