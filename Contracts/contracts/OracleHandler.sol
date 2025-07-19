// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ISortedOracles {
    function getMedianRate(address token) external view returns (uint256 rate, uint256 timestamp);
}

// Alfajores: 0x5d6C3D25cE9258d5905e4Aa191cBC24581F7d6a7

// Mainnet: 0x3aBaB70Fd2e12507Eb7f70e1e00A601021F92f37

contract OracleHandler {
    ISortedOracles public sortedOracles;

    // Token addresses (should be set according to Celo network deployments)
    address public cCOP;
    address public cUSD;
    address public cREAL;

    constructor(
        address _sortedOracles,
        address _cCOP,
        address _cUSD,
        address _cREAL
    ) {
        sortedOracles = ISortedOracles(_sortedOracles);
        cCOP = _cCOP;
        cUSD = _cUSD;
        cREAL = _cREAL;
    }

    // Returns how many units of 'toToken' are worth 1 unit of 'fromToken'
    function getFXRate(address fromToken, address toToken) public view returns (uint256) {
        (uint256 fromRate, ) = sortedOracles.getMedianRate(fromToken); // token/CELO
        (uint256 toRate, ) = sortedOracles.getMedianRate(toToken);     // token/CELO

        require(toRate > 0, "Invalid rate");

        return (fromRate * 1e18) / toRate; // result is scaled by 1e18
    }

    // Returns the value in cCOP terms of a diversified basket
    function getBasketValueInCCOP(uint256 amountUSD, uint256 amountREAL) external view returns (uint256 totalValueInCCOP) {
        uint256 cUSD_to_cCOP = getFXRate(cUSD, cCOP); // how much cCOP is 1 cUSD
        uint256 cREAL_to_cCOP = getFXRate(cREAL, cCOP); // how much cCOP is 1 cREAL

        uint256 valueUSD = (amountUSD * cUSD_to_cCOP) / 1e18;
        uint256 valueREAL = (amountREAL * cREAL_to_cCOP) / 1e18;

        totalValueInCCOP = valueUSD + valueREAL;
    }

    // Returns the suggested allocation (e.g., 40% cCOP, 30% cUSD, 30% cREAL)
    function getSuggestedAllocation(uint256 totalAmount) external pure returns (
        uint256 cCOPPortion,
        uint256 cUSDPortion,
        uint256 cREALPortion
    ) {
        cCOPPortion = (totalAmount * 40) / 100;
        cUSDPortion = (totalAmount * 30) / 100;
        cREALPortion = (totalAmount * 30) / 100;
    }
function getRate(address from, address to) public view returns (uint256) {
    return getFXRate(from, to);
}
}
