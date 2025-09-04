
        // SPDX-License-Identifier: MIT
        pragma solidity ^0.8.19;
        contract MentoOracleHandlerMock {
            function getSuggestedAllocation(uint256 totalAmount, bool isSafeMode) external pure returns (uint256, uint256, uint256, uint256) {
                // Return a fixed 25% split for simplicity in testing
                uint256 part = totalAmount / 4;
                return (part, part, part, totalAmount - (part * 3));
            }
        }