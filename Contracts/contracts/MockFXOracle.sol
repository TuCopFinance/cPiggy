// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IFXOracle.sol";

contract MockFXOracle is IFXOracle {
    mapping(bytes32 => uint256) public rates;

    function setRate(address baseToken, address quoteToken, uint256 rate) external {
        bytes32 key = keccak256(abi.encodePacked(baseToken, quoteToken));
        rates[key] = rate;
    }

    function getRate(address baseToken, address quoteToken) external view override returns (uint256) {
        bytes32 key = keccak256(abi.encodePacked(baseToken, quoteToken));
        return rates[key];
    }
}
