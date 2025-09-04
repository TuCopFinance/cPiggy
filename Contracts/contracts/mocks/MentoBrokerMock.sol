
        // SPDX-License-Identifier: MIT
        pragma solidity ^0.8.19;
        import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
        contract MentoBrokerMock {
             // To simulate profit for dev fee testing
            uint256 public swapMultiplier = 100; // 100 = 1:1 swap

            function setSwapMultiplier(uint256 _multiplier) external {
                swapMultiplier = _multiplier;
            }

            function getAmountOut(address, bytes32, address, address, uint256 amountIn) external view returns (uint256) {
                return (amountIn * swapMultiplier) / 100;
            }
            function swapIn(address, bytes32, address tokenIn, address tokenOut, uint256 amountIn, uint256) external returns (uint256) {
                uint256 amountOut = (amountIn * swapMultiplier) / 100;
                // Simulate the swap: contract -> broker, broker -> contract
                IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
                IERC20(tokenOut).transfer(msg.sender, amountOut);
                return amountOut;
            }
        }