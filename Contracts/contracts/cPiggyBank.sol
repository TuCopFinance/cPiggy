// contracts/PiggyBank.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MentoOracleHandler.sol";
import "./interfaces/interfaces.sol";

/**
 * @title PiggyBank
 * @notice A contract for time-locked savings with 3-way asset diversification.
 * @dev Allows users to deposit cCOP, which is diversified into cCOP, cUSD, and cEUR
 * based on a selected risk mode.
 */
contract PiggyBank {
    MentoOracleHandler public mentoOracle;
    IMentoBroker public iMentoBroker;

    address public immutable cCOP;
    address public immutable cUSD;
    address public immutable cEUR;
    address public immutable exchangeProvider;

    bytes32 public immutable exchangeId_cCOP_cUSD;
    bytes32 public immutable exchangeId_cUSD_cEUR;

    // Updated struct to hold the three diversified assets and the mode
    struct Piggy {
        address owner;
        uint256 cCOPAmount;
        uint256 cUSDAmount;
        uint256 cEURAmount;
        uint256 startTime;
        uint256 duration;
        bool safeMode; // Re-added safeMode
        bool claimed;
    }

    mapping(address => Piggy[]) public piggies;

    event PiggyCreated(
        address indexed user,
        uint256 totalAmount,
        uint256 duration,
        bool safeMode, // Re-added safeMode
        uint256 cCOPAmount,
        uint256 cUSDAmountReceived,
        uint256 cEURAmountReceived
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
        address _cEUR,
        bytes32 _exchangeId_cCOP_cUSD,
        bytes32 _exchangeId_cUSD_cEUR
    ) {
        iMentoBroker = IMentoBroker(_iMentoBroker);
        mentoOracle = MentoOracleHandler(_mentoOracle);
        exchangeProvider = _exchangeProvider;
        cCOP = _cCOP;
        cUSD = _cUSD;
        cEUR = _cEUR;
        exchangeId_cCOP_cUSD = _exchangeId_cCOP_cUSD;
        exchangeId_cUSD_cEUR = _exchangeId_cUSD_cEUR;
    }

    function _executeSwap(
        bytes32 exchangeId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        uint256 amountOutMin = iMentoBroker.getAmountOut(
            exchangeProvider,
            exchangeId,
            tokenIn,
            tokenOut,
            amountIn
        );
        require(amountOutMin > 0, "Mento: Insufficient output");

        IERC20(tokenIn).approve(address(iMentoBroker), amountIn);

        amountOut = iMentoBroker.swapIn(
            exchangeProvider,
            exchangeId,
            tokenIn,
            tokenOut,
            amountIn,
            amountOutMin
        );
        return amountOut;
    }

    // Re-added safeMode parameter to the deposit function
    function deposit(uint256 amount, uint256 lockDays, bool safeMode) external {
        require(amount > 0, "Amount must be positive");
        require(lockDays > 0, "Duration must be positive");

        (
            uint256 cCOPToKeep,
            uint256 cCOPForUSD,
            uint256 cCOPForEUR
        ) = mentoOracle.getSuggestedAllocation(amount, safeMode); // Pass safeMode to oracle

        IERC20(cCOP).transferFrom(msg.sender, address(this), amount);

        uint256 receivedUSD = 0;
        uint256 receivedEUR = 0;
        
        uint256 totalCCOPToSwap = cCOPForUSD + cCOPForEUR;

        if (totalCCOPToSwap > 0) {
            uint256 intermediateUSD = _executeSwap(
                exchangeId_cCOP_cUSD,
                cCOP,
                cUSD,
                totalCCOPToSwap
            );
            
            uint256 usdAmountForEURSwap = (intermediateUSD * cCOPForEUR) / totalCCOPToSwap;
            
            if (usdAmountForEURSwap > 0) {
                receivedEUR = _executeSwap(
                    exchangeId_cUSD_cEUR,
                    cUSD,
                    cEUR,
                    usdAmountForEURSwap
                );
            }
            
            receivedUSD = intermediateUSD - usdAmountForEURSwap;
        }
        
        piggies[msg.sender].push(
            Piggy({
                owner: msg.sender,
                cCOPAmount: cCOPToKeep,
                cUSDAmount: receivedUSD,
                cEURAmount: receivedEUR,
                startTime: block.timestamp,
                duration: lockDays * 1 days,
                safeMode: safeMode, // Store the selected mode
                claimed: false
            })
        );

        emit PiggyCreated(
            msg.sender,
            amount,
            lockDays,
            safeMode, // Emit the selected mode
            cCOPToKeep,
            receivedUSD,
            receivedEUR
        );
    }

    function claim(uint256 _index) external {
        require(_index < piggies[msg.sender].length, "Invalid piggy index");
        Piggy storage p = piggies[msg.sender][_index];
        require(!p.claimed, "Already claimed");
        require(block.timestamp >= p.startTime + p.duration, "Lock not ended");

        uint256 totalUSDToSwapBack = p.cUSDAmount;
        
        if (p.cEURAmount > 0) {
            uint256 usdFromEURSwap = _executeSwap(
                exchangeId_cUSD_cEUR,
                cEUR,
                cUSD,
                p.cEURAmount
            );
            totalUSDToSwapBack += usdFromEURSwap;
        }

        uint256 ccopFromSwaps = 0;
        if (totalUSDToSwapBack > 0) {
            ccopFromSwaps = _executeSwap(
                exchangeId_cCOP_cUSD,
                cUSD,
                cCOP,
                totalUSDToSwapBack
            );
        }
        
        uint256 finalReturn = p.cCOPAmount + ccopFromSwaps;
        p.claimed = true;

        IERC20(cCOP).transfer(msg.sender, finalReturn);

        emit PiggyClaimed(msg.sender, _index, finalReturn);
    }

    function getUserPiggies(address _user) external view returns (Piggy[] memory) {
        return piggies[_user];
    }

    function getPiggyValue(address _user, uint256 _index) external view returns (uint256) {
        require(_index < piggies[msg.sender].length, "Invalid piggy index");
        Piggy storage p = piggies[_user][_index];
        if (p.claimed) return 0;

        uint256 totalUSDValue = p.cUSDAmount;
        if (p.cEURAmount > 0) {
            uint256 usdFromEUR = iMentoBroker.getAmountOut(
                exchangeProvider,
                exchangeId_cUSD_cEUR,
                cEUR,
                cUSD,
                p.cEURAmount
            );
            totalUSDValue += usdFromEUR;
        }

        uint256 ccopFromSwaps = 0;
        if (totalUSDValue > 0) {
            ccopFromSwaps = iMentoBroker.getAmountOut(
                exchangeProvider,
                exchangeId_cCOP_cUSD,
                cUSD,
                cCOP,
                totalUSDValue
            );
        }

        return p.cCOPAmount + ccopFromSwaps;
    }
}
