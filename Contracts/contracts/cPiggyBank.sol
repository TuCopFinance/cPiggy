// contracts/PiggyBank.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MentoOracleHandler.sol";
import "./interfaces/interfaces.sol";

contract PiggyBank {
    MentoOracleHandler public mentoOracle;
    IMentoBroker public iMentoBroker;

    address public immutable cCOP;
    address public immutable cUSD;
    address public immutable exchangeProvider;

    bytes32 public immutable exchangeId_cCOP_cUSD;

    struct Piggy {
        address owner;
        uint256 cCOPAmount;      
        uint256 startTime;
        uint256 duration;
        bool safeMode;
        uint256 initialUSDAmount;
        bool claimed;
    }

    mapping(address => Piggy[]) public piggies;

    event PiggyCreated(
        address indexed user,
        uint256 totalAmount,
        uint256 duration,
        bool safeMode,
        uint256 cUSDAmountReceived
    );
    event PiggyClaimed(
        address indexed user,
        uint256 index,
        uint256 finalCCOPReturn
    );

    constructor(
        address _iMentoBroker,
        address _mentoOracle,
        address _exchangeProvider,
        address _cCOP,
        address _cUSD,
        bytes32 _exchangeId_cCOP_cUSD
    ) {
        iMentoBroker = IMentoBroker(_iMentoBroker);
        mentoOracle = MentoOracleHandler(_mentoOracle);
        exchangeProvider = _exchangeProvider;
        cCOP = _cCOP;
        cUSD = _cUSD;
        exchangeId_cCOP_cUSD = _exchangeId_cCOP_cUSD;
    }

    // --- NEW INTERNAL HELPER FUNCTION ---
    /**
     * @dev Internal function to handle the full swap logic: get expected amount, approve, and swap.
     */
    function _executeSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        // 1. Get the expected amount out to use as a minimum, protecting against slippage.
        uint256 amountOutMin = iMentoBroker.getAmountOut(
            exchangeProvider,
            exchangeId_cCOP_cUSD,
            tokenIn,
            tokenOut,
            amountIn
        );
        require(amountOutMin > 0, "Mento: Insufficient output amount");

        // 2. Approve the broker to spend the token
        IERC20(tokenIn).approve(address(iMentoBroker), amountIn);

        // 3. Execute the swap with the required slippage protection
        amountOut = iMentoBroker.swapIn(
            exchangeProvider,
            exchangeId_cCOP_cUSD,
            tokenIn,
            tokenOut,
            amountIn,
            amountOutMin // The crucial 6th argument
        );

        return amountOut;
    }

    function deposit(uint256 amount, uint256 lockDays, bool safeMode) external {
        require(amount > 0, "Amount must be positive");
        require(lockDays > 0, "Duration must be positive");

        (uint256 partToKeepAsCCOP, uint256 partToSwapForUSD) = mentoOracle
            .getSuggestedAllocation(amount, safeMode);

        IERC20(cCOP).transferFrom(msg.sender, address(this), amount);

        uint256 receivedUSD = 0;

        if (partToSwapForUSD > 0) {
            // --- FIXED: Use the new helper function ---
            receivedUSD = _executeSwap(cCOP, cUSD, partToSwapForUSD);
        }

        piggies[msg.sender].push(
            Piggy({
                owner: msg.sender,
                cCOPAmount: partToKeepAsCCOP,
                startTime: block.timestamp,
                duration: lockDays * 1 days,
                safeMode: safeMode,
                initialUSDAmount: receivedUSD,
                claimed: false
            })
        );

        emit PiggyCreated(
            msg.sender,
            amount,
            lockDays,
            safeMode,
            receivedUSD
        );
    }

    function claim(uint256 _index) external {
        require(_index < piggies[msg.sender].length, "Invalid piggy index");

        Piggy storage p = piggies[msg.sender][_index];
        require(!p.claimed, "Already claimed");
        require(block.timestamp >= p.startTime + p.duration, "Lock not ended");
        
        uint256 returnedFromSwaps = 0;

        if (p.initialUSDAmount > 0) {
            // --- FIXED: Use the new helper function ---
            returnedFromSwaps = _executeSwap(cUSD, cCOP, p.initialUSDAmount);
        }
        
        uint256 finalReturn = p.cCOPAmount + returnedFromSwaps;

        p.claimed = true;

        IERC20(cCOP).transfer(msg.sender, finalReturn);
        
        emit PiggyClaimed(msg.sender, _index, finalReturn);
    }

    function getUserPiggies(address _user) external view returns (Piggy[] memory) {
        return piggies[_user];
    }

    function getPiggyValue(address _user, uint256 _index) external view returns (uint256) {
        require(_index < piggies[_user].length, "Invalid piggy index");
        Piggy storage p = piggies[_user][_index];

        if (p.claimed) {
            return 0;
        }

        uint256 ccopFromSwap = 0;
        if (p.initialUSDAmount > 0) {
            ccopFromSwap = iMentoBroker.getAmountOut(exchangeProvider, exchangeId_cCOP_cUSD, cUSD, cCOP, p.initialUSDAmount);
        }

        return p.cCOPAmount + ccopFromSwap;
    }
}