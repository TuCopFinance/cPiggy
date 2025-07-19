// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./OracleHandler.sol";

interface IMentoRouter {
    function swap(address fromToken, address toToken, uint256 amountIn, uint256 minAmountOut) external returns (uint256);
    function getSwapOutput(address fromToken, address toToken, uint256 amountIn) external view returns (uint256);
}


interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}


contract PiggyBank {
    OracleHandler public oracle;
    IMentoRouter public mentoRouter;

    address public cCOP;
    address public cUSD;
    address public cREAL;

    struct Piggy {
        address owner;
        uint256 cCOPAmount;
        uint256 startTime;
        uint256 duration;
        uint256 initialUSD;
        uint256 initialREAL;
        bool claimed;
    }

    mapping(address => Piggy) public piggies;

    event PiggyCreated(address indexed user, uint256 amount, uint256 lockDays);
    event PiggyClaimed(address indexed user, uint256 totalReturned);

    constructor(address _oracle, address _mentoRouter, address _cCOP, address _cUSD, address _cREAL) {
        oracle = OracleHandler(_oracle);
        mentoRouter = IMentoRouter(_mentoRouter);
        cCOP = _cCOP;
        cUSD = _cUSD;
        cREAL = _cREAL;
    }

    function deposit(uint256 amount, uint256 lockDays) external {
        require(piggies[msg.sender].startTime == 0, "Piggy already exists");
        require(amount > 0, "Amount must be positive");

        // Get allocation amounts
        (uint256 partCCOP, uint256 partUSD, uint256 partREAL) = oracle.getSuggestedAllocation(amount);

        // Transfer in full cCOP from user
        require(IERC20(cCOP).transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Perform swaps into cUSD and cREAL
        require(IERC20(cCOP).approve(address(mentoRouter), partUSD + partREAL), "Approve failed");
        uint256 receivedUSD = mentoRouter.swap(cCOP, cUSD, partUSD, 0);
        uint256 receivedREAL = mentoRouter.swap(cCOP, cREAL, partREAL, 0);

        // Record piggy
        piggies[msg.sender] = Piggy({
            owner: msg.sender,
            cCOPAmount: partCCOP,
            startTime: block.timestamp,
            duration: lockDays * 1 days,
            initialUSD: receivedUSD,
            initialREAL: receivedREAL,
            claimed: false
        });

        emit PiggyCreated(msg.sender, amount, lockDays);
    }

    function claim() external {
        Piggy storage p = piggies[msg.sender];
        require(!p.claimed, "Already claimed");
        require(block.timestamp >= p.startTime + p.duration, "Lock not ended");

        // Swap cUSD and cREAL back to cCOP
        require(IERC20(cUSD).approve(address(mentoRouter), p.initialUSD), "Approve USD failed");
        require(IERC20(cREAL).approve(address(mentoRouter), p.initialREAL), "Approve REAL failed");
        uint256 copFromUSD = mentoRouter.swap(cUSD, cCOP, p.initialUSD, 0);
        uint256 copFromREAL = mentoRouter.swap(cREAL, cCOP, p.initialREAL, 0);

        uint256 totalReturn = p.cCOPAmount + copFromUSD + copFromREAL;
        p.claimed = true;

        require(IERC20(cCOP).transfer(msg.sender, totalReturn), "Return transfer failed");

        emit PiggyClaimed(msg.sender, totalReturn);
    }

    function estimateReturn(address user) external view returns (uint256) {
        Piggy storage p = piggies[user];
        if (p.startTime == 0) return 0;
        uint256 copUSD = mentoRouter.getSwapOutput(cUSD, cCOP, p.initialUSD);
        uint256 copREAL = mentoRouter.getSwapOutput(cREAL, cCOP, p.initialREAL);
        return p.cCOPAmount + copUSD + copREAL;
    }
}
