// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./UniswapOracleHandler.sol";
import "hardhat/console.sol";


contract PiggyBank {
    UniswapOracleHandler public uniswapOracle;

    address public cCOP;
    address public cUSD;
    address public cREAL;
    uint256 index;

    struct Piggy {
        address owner;
        uint256 cCOPAmount;
        uint256 startTime;
        uint256 duration;
        bool safeMode;
        uint256 initialUSD;
        uint256 initialREAL;
        bool claimed;
    }

    mapping(address => Piggy[]) public piggies;

    event PiggyCreated(
        address indexed user,
        uint256 amount,
        uint256 duration,
        bool safeMode,
        uint256 partUSD,
        uint256 partREAL
    );
    event PiggyClaimed(
        address indexed user,
        uint256 principal,
        uint256 reward,
        uint256 fxGain
    );

    constructor(
        address _uniswapOracle,
        address _cCOP,
        address _cUSD,
        address _cREAL
    ) {
        uniswapOracle = UniswapOracleHandler(_uniswapOracle);
        cCOP = _cCOP;
        cUSD = _cUSD;
        cREAL = _cREAL;
    }

    function deposit(uint256 amount, uint256 lockDays, bool safeMode) external {
        require(amount > 0, "Amount must be positive");

        (uint256 partCCOP, uint256 partUSD, uint256 partREAL) = uniswapOracle
            .getSuggestedAllocation(amount);

        require(
            IERC20(cCOP).transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        require(
            IERC20(cCOP).approve(address(uniswapOracle), partUSD + partREAL),
            "Approve failed"
        );

        uint256 receivedUSD = uniswapOracle.swapTokens(cCOP, cUSD, partUSD, 0);
        uint256 receivedREAL = uniswapOracle.swapTokens(cCOP, cREAL, partREAL, 0);

        piggies[msg.sender].push(
            Piggy({
                owner: msg.sender,
                cCOPAmount: partCCOP,
                startTime: block.timestamp,
                duration: lockDays * 1 days,
                safeMode: safeMode,
                initialUSD: receivedUSD,
                initialREAL: receivedREAL,
                claimed: false
            })
        );

        emit PiggyCreated(
            msg.sender,
            amount,
            lockDays,
            safeMode,
            partUSD,
            partREAL
        );
    }

function claim(uint256 _index) external {
    require(_index < piggies[msg.sender].length, "Invalid piggy index");

    Piggy storage p = piggies[msg.sender][_index];
    require(!p.claimed, "Already claimed");
    require(block.timestamp >= p.startTime + p.duration, "Lock not ended");

    require(
        IERC20(cUSD).approve(address(uniswapOracle), p.initialUSD),
        "Approve USD failed"
    );
    require(
        IERC20(cREAL).approve(address(uniswapOracle), p.initialREAL),
        "Approve REAL failed"
    );

    uint256 copFromUSD = uniswapOracle.swapTokens(cUSD, cCOP, p.initialUSD, 0);
    uint256 copFromREAL = uniswapOracle.swapTokens(cREAL, cCOP, p.initialREAL, 0);

    uint256 grossReturn = p.cCOPAmount + copFromUSD + copFromREAL;
    uint256 fxGain = grossReturn > p.cCOPAmount
        ? grossReturn - p.cCOPAmount
        : 0;

    uint256 finalReturn;

    if (p.safeMode && fxGain > 0) {
        uint256 reducedGain = fxGain / 2;
        finalReturn = p.cCOPAmount + reducedGain;
        fxGain = reducedGain; // update fxGain for accurate event emission
    } else {
        finalReturn = grossReturn;
    }

    p.claimed = true;

    require(
        IERC20(cCOP).transfer(msg.sender, finalReturn),
        "Return transfer failed"
    );
    emit PiggyClaimed(msg.sender, p.cCOPAmount, finalReturn, fxGain);
}


    function estimateReturn(
        address _user,
        uint256 _index
    ) external view returns (uint256) {
        require(_index < piggies[_user].length, "Invalid piggy index");

        Piggy storage p = piggies[_user][_index];
        if (p.startTime == 0) return 0;

        uint256 copUSD = uniswapOracle.getSwapOutput(cUSD, cCOP, p.initialUSD);
        uint256 copREAL = uniswapOracle.getSwapOutput(cREAL, cCOP, p.initialREAL);
        return p.cCOPAmount + copUSD + copREAL;
    }

    function getUserPiggies(
        address user
    ) external view returns (Piggy[] memory) {
        return piggies[user];
    }

    function getLastPiggyIndex(address user) external view returns (uint256) {
        require(piggies[user].length > 0, "No piggies yet");
        return piggies[user].length - 1;
    }
}
