// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IFXOracle {
    function getRate(address baseToken, address quoteToken) external view returns (uint256);
}
