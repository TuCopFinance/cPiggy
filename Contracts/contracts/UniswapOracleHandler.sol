// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IUniswapV2Router {
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);

}

contract UniswapOracleHandler {
    IUniswapV2Router public router;
    address public cCOP;
    address public cUSD;
    address public cREAL;

    constructor(address _router, address _cCOP, address _cUSD, address _cREAL) {
        router = IUniswapV2Router(_router);
        cCOP = _cCOP;
        cUSD = _cUSD;
        cREAL = _cREAL;
    }

    function getSwapOutput(address from, address to, uint256 amountIn) public view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = from;
        path[1] = to;

        uint[] memory amounts = router.getAmountsOut(amountIn, path);
        return amounts[1];
    }

    function swapTokens(address from, address to, uint256 amountIn, uint256 minOut) external returns (uint256) {
        IERC20(from).transferFrom(msg.sender, address(this), amountIn);
        IERC20(from).approve(address(router), amountIn);

        address[] memory path = new address[](2);
        path[0] = from;
        path[1] = to;

        uint[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            minOut,
            path,
            msg.sender,
            block.timestamp + 300
        );

        return amounts[1];
    }

    function getSuggestedAllocation(uint256 totalAmount) external pure returns (
        uint256 cCOPPortion,
        uint256 cUSDPortion,
        uint256 cREALPortion
    ) {
        cCOPPortion = (totalAmount * 40) / 100;
        cUSDPortion = (totalAmount * 30) / 100;
        cREALPortion = (totalAmount * 30) / 100;
    }

    function getBasketValueInCCOP(uint256 amountUSD, uint256 amountREAL) external view returns (uint256 totalValueInCCOP) {
        uint256 usdValue = getSwapOutput(cUSD, cCOP, amountUSD);
        uint256 realValue = getSwapOutput(cREAL, cCOP, amountREAL);
        return usdValue + realValue;
    }
}
