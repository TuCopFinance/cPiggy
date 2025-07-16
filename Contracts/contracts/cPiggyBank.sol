// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract cPiggyBank is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct PiggyDeposit {
        uint256 amount; // Original cCOP deposited
        uint256 startTime; // deposit time
        uint256 unlockTime; // when user can claim tokens back
        uint256 duration; // lock period in seconds
        bool claimed; // whether it is withdrawn or not
        bool safeMode; // if used conservative allocation
    }

    IERC20 public immutable cCOP;
    IERC20 public cUSD;
    IERC20 public cREAL;

    address public swapRouter; // address of Mento swap Router
    address public oracle; // FX oracle source

    uint256 public constant DURATION_30 = 30 days;
    uint256 public constant DURATION_60 = 60 days;
    uint256 public constant DURATION_90 = 90 days;

    mapping(address => PiggyDeposit[]) public userDeposits;

    event Deposited(
        address indexed user,
        uint256 amount,
        uint256 duration,
        bool safeMode
    );
    event Withdrawn(address indexed user, uint256 amount, uint256 reward);

    constructor(
        address _cCOP,
        address _cUSD,
        address _cREAL
    ) Ownable(msg.sender) {
        require(_cCOP != address(0), "Invalid cCOP address");
        require(_cUSD != address(0), "Invalid cUSD address");
        require(_cREAL != address(0), "Invalud cReal address");

        cCOP = IERC20(_cCOP);
        cUSD = IERC20(_cUSD);
        cREAL = IERC20(_cREAL);
    }

    function deposit(
        uint256 amount,
        uint256 duration,
        bool safeMode
    ) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(
            duration == DURATION_30 ||
                duration == DURATION_60 ||
                duration == DURATION_90,
            "Invalid lock duration"
        );

        // Transfer cCOP from user to contract

        //TODO: Probably need approve somehow (maybe only in frontend)
        cCOP.safeTransferFrom(msg.sender, address(this), amount);

        uint256 unlockTime = block.timestamp + duration;

        // Store user deposit
        PiggyDeposit memory newDeposit = PiggyDeposit({
            amount: amount,
            startTime: block.timestamp,
            unlockTime: unlockTime,
            duration: duration,
            claimed: false,
            safeMode: safeMode
        });

        userDeposits[msg.sender].push(newDeposit);

        emit Deposited(msg.sender, amount, duration, safeMode);
    }

    function withdraw(uint256 index) external nonReentrant {
    require(index < userDeposits[msg.sender].length, "Invalid index");

    PiggyDeposit storage piggy = userDeposits[msg.sender][index];

    require(!piggy.claimed, "Already claimed");
    require(block.timestamp >= piggy.unlockTime, "Still locked");

    piggy.claimed = true;

    uint256 principal = piggy.amount;

    // 🔧 In future: call FX oracle or yield calculation here
    uint256 reward = calculateReward(piggy);

    // For now, user only gets back the original amount (no FX bonus)
    uint256 payout = principal + reward;

    // Transfer back in cCOP
    cCOP.safeTransfer(msg.sender, payout);

    emit Withdrawn(msg.sender, principal, reward);
}

function calculateReward(PiggyDeposit memory piggy) public view returns (uint256) {
    //  TODO: Replace with FX-based logic or yield stuff
    // Example: compare FX rate at deposit vs now using oracle
    // Optionally simulate reward growth based on duration

    return 0;
}


function getUserDeposits(address user) external view returns (PiggyDeposit[] memory) {
    return userDeposits[user];
}
}
