// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IUniswapV2Router02 {
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
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract UniswapOracleHandler {
    IUniswapV2Router02 public router;
    address public cCOP;
    address public cUSD;
    address public cREAL;

    constructor(
        address _router,
        address _cCOP,
        address _cUSD,
        address _cREAL
    ) {
        router = IUniswapV2Router02(_router);
        cCOP = _cCOP;
        cUSD = _cUSD;
        cREAL = _cREAL;
    }

    /// @notice Estimate how much `to` token you'll get for `amountIn` of `from`
    function getSwapOutput(address from, address to, uint256 amountIn) public view returns (uint256) {
        address[] memory path;
        path[0] = from;
        path[1] = to;

        uint[] memory amounts = router.getAmountsOut(amountIn, path);
        return amounts[1];
    }

    /// @notice Perform a token swap from `from` to `to`
    function swapTokens(address from, address to, uint256 amountIn, uint256 minOut) external returns (uint256 amountOut) {
        IERC20(from).transferFrom(msg.sender, address(this), amountIn);
        IERC20(from).approve(address(router), amountIn);

        address[] memory path;
        path[0] = from;
        path[1] = to;

        uint[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            minOut,
            path,
            msg.sender,
            block.timestamp + 300
        );

        amountOut = amounts[1];
    }

    /// @notice Split total amount into basket parts
    function getSuggestedAllocation(uint256 totalAmount) external pure returns (
        uint256 cCOPPortion,
        uint256 cUSDPortion,
        uint256 cREALPortion
    ) {
        cCOPPortion = (totalAmount * 40) / 100;
        cUSDPortion = (totalAmount * 30) / 100;
        cREALPortion = (totalAmount * 30) / 100;
    }

    /// @notice Returns estimated value of a basket in cCOP
    function getBasketValueInCCOP(uint256 amountUSD, uint256 amountREAL) external view returns (uint256 totalValueInCCOP) {
        uint256 cUSD_to_cCOP = getSwapOutput(cUSD, cCOP, amountUSD);
        uint256 cREAL_to_cCOP = getSwapOutput(cREAL, cCOP, amountREAL);
        totalValueInCCOP = cUSD_to_cCOP + cREAL_to_cCOP;
    }
}
