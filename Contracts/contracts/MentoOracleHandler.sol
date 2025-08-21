// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MentoOracleHandler
 * @notice This contract provides allocation strategies for the PiggyBank.
 * @dev It calculates how a total amount of a token should be split for diversification
 * based on a selected risk mode, now including cGBP.
 */
contract MentoOracleHandler {
    /**
     * @notice Calculates the allocation for diversification based on the selected mode.
     * @param totalAmount The total amount of cCOP being deposited.
     * @param isSafeMode A boolean to determine which allocation strategy to use.
     * @return cCOPToKeep The portion to remain as cCOP.
     * @return cCOPForUSD The portion of cCOP value to be held in cUSD.
     * @return cCOPForEUR The portion of cCOP value to be held in cEUR.
     * @return cCOPForGBP The portion of cCOP value to be held in cGBP.
     */
    function getSuggestedAllocation(
        uint256 totalAmount,
        bool isSafeMode
    )
        external
        pure
        returns (
            uint256 cCOPToKeep,
            uint256 cCOPForUSD,
            uint256 cCOPForEUR,
            uint256 cCOPForGBP
        )
    {
        require(totalAmount > 0, "Total amount must be positive");

        if (isSafeMode) {
            // Safe Mode: 40% cCOP, 30% cUSD, 20% cEUR, 10% cGBP
            cCOPToKeep = (totalAmount * 40) / 100;
            cCOPForUSD = (totalAmount * 30) / 100;
            cCOPForEUR = (totalAmount * 20) / 100;
        } else {
            // Standard Mode: 20% cCOP, 40% cUSD, 30% cEUR, 10% cGBP
            cCOPToKeep = (totalAmount * 20) / 100;
            cCOPForUSD = (totalAmount * 40) / 100;
            cCOPForEUR = (totalAmount * 30) / 100;
        }

        // The remaining part is for cGBP. This avoids potential rounding errors.
        uint256 swappedPart = cCOPToKeep + cCOPForUSD + cCOPForEUR;
        cCOPForGBP = totalAmount - swappedPart;

        return (cCOPToKeep, cCOPForUSD, cCOPForEUR, cCOPForGBP);
    }
}