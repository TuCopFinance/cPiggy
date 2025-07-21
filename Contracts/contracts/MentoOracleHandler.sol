// contracts/MentoOracleHandler.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MentoOracleHandler {
    /**
     * @notice Calculates the allocation for diversification based on the selected mode.
     * @param totalAmount The total amount of cCOP being deposited.
     * @param isSafeMode A boolean to determine which allocation strategy to use.
     * @return cCOPToKeep The portion of the totalAmount to remain as cCOP.
     * @return cCOPToSwap The portion of the totalAmount to be swapped for cUSD.
     */
    function getSuggestedAllocation(uint256 totalAmount, bool isSafeMode) external pure returns (
        uint256 cCOPToKeep,
        uint256 cCOPToSwap
    ) {
        if (isSafeMode) {
            // Safe Mode: 70% cCOP, 30% cUSD
            cCOPToKeep = (totalAmount * 70) / 100;
        } else {
            // Standard Mode: 40% cCOP, 60% cUSD
            cCOPToKeep = (totalAmount * 40) / 100;
        }
        
        cCOPToSwap = totalAmount - cCOPToKeep;
        return (cCOPToKeep, cCOPToSwap);
    }
}