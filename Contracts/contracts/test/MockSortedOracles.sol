// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockSortedOracles {
    mapping(address => uint256) public rates;

    function setRate(address token, uint256 rate) external {
        rates[token] = rate;
    }

    function getMedianRate(address token) external view returns (uint256, uint256) {
        return (rates[token], block.timestamp);
    }
}
