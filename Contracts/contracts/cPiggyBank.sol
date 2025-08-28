// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MentoOracleHandler.sol";
import "./interfaces/interfaces.sol";

/**
 * @title PiggyBank
 * @notice A contract for time-locked savings with 4-way asset diversification.
 * @dev Allows users to deposit cCOP, which is diversified into cCOP, cUSD, cEUR, and cGBP.
 */
contract PiggyBank {
    MentoOracleHandler public mentoOracle;
    IMentoBroker public iMentoBroker;

    address public immutable cCOP;
    address public immutable cUSD;
    address public immutable cEUR;
    address public immutable cGBP; // Added cGBP token address
    address public immutable exchangeProvider;
    address public developer;

    bytes32 public immutable exchangeId_cCOP_cUSD;
    bytes32 public immutable exchangeId_cUSD_cEUR;
    bytes32 public immutable exchangeId_cUSD_cGBP; // Added exchange ID for cUSD -> cGBP

    // Updated struct to hold the four diversified assets
    struct Piggy {
        address owner;
        uint256 initialAmount;
        uint256 cCOPAmount;
        uint256 cUSDAmount;
        uint256 cEURAmount;
        uint256 cGBPAmount; // Added cGBP amount
        uint256 startTime;
        uint256 duration;
        bool safeMode;
        bool claimed;
    }

    mapping(address => Piggy[]) public piggies;

    event PiggyCreated(
        address indexed user,
        uint256 totalAmount,
        uint256 duration,
        bool safeMode,
        uint256 cCOPAmount,
        uint256 cUSDAmountReceived,
        uint256 cEURAmountReceived,
        uint256 cGBPAmountReceived // Added cGBP to event
    );
    event PiggyClaimed(
        address indexed user,
        uint256 index,
        uint256 userReturnAmount,
        uint256 developerFee
    );

    constructor(
        address _iMentoBroker,
        address _mentoOracle,
        address _exchangeProvider,
        address _cCOP,
        address _cUSD,
        address _cEUR,
        address _cGBP, // Added cGBP address
        bytes32 _exchangeId_cCOP_cUSD,
        bytes32 _exchangeId_cUSD_cEUR,
        bytes32 _exchangeId_cUSD_cGBP, // Added cUSD -> cGBP exchange ID
        address _developer
    ) {
        iMentoBroker = IMentoBroker(_iMentoBroker);
        mentoOracle = MentoOracleHandler(_mentoOracle);
        exchangeProvider = _exchangeProvider;
        cCOP = _cCOP;
        cUSD = _cUSD;
        cEUR = _cEUR;
        cGBP = _cGBP; // Set cGBP address
        exchangeId_cCOP_cUSD = _exchangeId_cCOP_cUSD;
        exchangeId_cUSD_cEUR = _exchangeId_cUSD_cEUR;
        exchangeId_cUSD_cGBP = _exchangeId_cUSD_cGBP; // Set exchange ID
        developer = _developer;
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

    function deposit(uint256 amount, uint256 lockDays, bool safeMode) external {
        require(amount > 0, "Amount must be positive");
        require(lockDays > 0, "Duration must be positive");

        // Now receives four values from the oracle
        (
            uint256 cCOPToKeep,
            uint256 cCOPForUSD,
            uint256 cCOPForEUR,
            uint256 cCOPForGBP
        ) = mentoOracle.getSuggestedAllocation(amount, safeMode);

        IERC20(cCOP).transferFrom(msg.sender, address(this), amount);

        uint256 receivedUSD = 0;
        uint256 receivedEUR = 0;
        uint256 receivedGBP = 0;
        
        // Total cCOP to be swapped for other currencies
        uint256 totalCCOPToSwap = cCOPForUSD + cCOPForEUR + cCOPForGBP;

        if (totalCCOPToSwap > 0) {
            // First, perform the single swap from cCOP to cUSD for the total amount needed
            uint256 intermediateUSD = _executeSwap(
                exchangeId_cCOP_cUSD,
                cCOP,
                cUSD,
                totalCCOPToSwap
            );
            
            // Calculate how much of the intermediate cUSD is for EUR and GBP
            uint256 usdAmountForEURSwap = (intermediateUSD * cCOPForEUR) / totalCCOPToSwap;
            uint256 usdAmountForGBPSwap = (intermediateUSD * cCOPForGBP) / totalCCOPToSwap;
            
            // Swap for EUR
            if (usdAmountForEURSwap > 0) {
                receivedEUR = _executeSwap(
                    exchangeId_cUSD_cEUR,
                    cUSD,
                    cEUR,
                    usdAmountForEURSwap
                );
            }

            // Swap for GBP
            if (usdAmountForGBPSwap > 0) {
                receivedGBP = _executeSwap(
                    exchangeId_cUSD_cGBP,
                    cUSD,
                    cGBP,
                    usdAmountForGBPSwap
                );
            }
            
            // The remaining cUSD is the final received amount for USD
            receivedUSD = intermediateUSD - usdAmountForEURSwap - usdAmountForGBPSwap;
        }
        
        piggies[msg.sender].push(
            Piggy({
                owner: msg.sender,
                initialAmount: amount,
                cCOPAmount: cCOPToKeep,
                cUSDAmount: receivedUSD,
                cEURAmount: receivedEUR,
                cGBPAmount: receivedGBP, // Store received GBP
                startTime: block.timestamp,
                duration: lockDays * 1 days,
                safeMode: safeMode,
                claimed: false
            })
        );

        emit PiggyCreated(
            msg.sender,
            amount,
            lockDays,
            safeMode,
            cCOPToKeep,
            receivedUSD,
            receivedEUR,
            receivedGBP // Emit received GBP
        );
    }

    function claim(uint256 _index) external {
        require(_index < piggies[msg.sender].length, "Invalid piggy index");
        Piggy storage p = piggies[msg.sender][_index];
        require(!p.claimed, "Already claimed");
        require(block.timestamp >= p.startTime + p.duration, "Lock not ended");

        uint256 totalUSDToSwapBack = p.cUSDAmount;
        
        // Swap EUR back to USD
        if (p.cEURAmount > 0) {
            totalUSDToSwapBack += _executeSwap(
                exchangeId_cUSD_cEUR,
                cEUR,
                cUSD,
                p.cEURAmount
            );
        }

        // Swap GBP back to USD
        if (p.cGBPAmount > 0) {
            totalUSDToSwapBack += _executeSwap(
                exchangeId_cUSD_cGBP,
                cGBP,
                cUSD,
                p.cGBPAmount
            );
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

        uint256 developerFee = 0;
        uint256 userAmount = finalReturn;

        if (finalReturn > p.initialAmount) {
            uint256 profit = finalReturn - p.initialAmount;
            developerFee = (profit * 1) / 100;
            userAmount = finalReturn - developerFee;
            
            if (developerFee > 0) {
                IERC20(cCOP).transfer(developer, developerFee);
            }
        }

        IERC20(cCOP).transfer(msg.sender, userAmount);

        emit PiggyClaimed(msg.sender, _index, userAmount, developerFee);
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

        uint256 totalValueInCCOP = p.cCOPAmount;
        uint256 totalUSDValue = p.cUSDAmount;

        // Simulate EUR -> USD
        if (p.cEURAmount > 0) {
            try iMentoBroker.getAmountOut(exchangeProvider, exchangeId_cUSD_cEUR, cEUR, cUSD, p.cEURAmount) returns (uint256 usdFromEUR) {
                totalUSDValue += usdFromEUR;
            } catch {}
        }

        // Simulate GBP -> USD
        if (p.cGBPAmount > 0) {
            try iMentoBroker.getAmountOut(exchangeProvider, exchangeId_cUSD_cGBP, cGBP, cUSD, p.cGBPAmount) returns (uint256 usdFromGBP) {
                totalUSDValue += usdFromGBP;
            } catch {}
        }

        // Simulate total USD -> cCOP
        if (totalUSDValue > 0) {
            try iMentoBroker.getAmountOut(exchangeProvider, exchangeId_cCOP_cUSD, cUSD, cCOP, totalUSDValue) returns (uint256 ccopFromSwaps) {
                totalValueInCCOP += ccopFromSwaps;
            } catch {}
        }

        return totalValueInCCOP;
    }
}