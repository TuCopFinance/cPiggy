// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IFXOracle.sol";

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
    IFXOracle public fxOracle;

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

        //  In future: call FX oracle or yield calculation here
        uint256 reward = calculateReward(piggy);

        // For now, user only gets back the original amount (no FX bonus)
        uint256 payout = principal + reward;

        // Transfer back in cCOP
        cCOP.safeTransfer(msg.sender, payout);

        emit Withdrawn(msg.sender, principal, reward);
    }

    function calculateReward(
        PiggyDeposit memory piggy
    ) public view returns (uint256) {
        uint256 baseAmount = piggy.amount;

        // Fetch FX rates from oracle (in cCOP per token, scaled by 100)
        uint256 cUSDrate = fxOracle.getRate(address(cUSD), address(cCOP)); // e.g., 105
        uint256 cREALrate = fxOracle.getRate(address(cREAL), address(cCOP)); // e.g., 110

        // Apply allocation
        uint256 cUSDportion = piggy.safeMode
            ? (baseAmount * 25) / 100
            : (baseAmount * 50) / 100;
        uint256 cREALportion = piggy.safeMode
            ? (baseAmount * 25) / 100
            : (baseAmount * 50) / 100;

        // Calculate growth
        uint256 cUSDvalue = (cUSDportion * cUSDrate) / 100;
        uint256 cREALvalue = (cREALportion * cREALrate) / 100;

        uint256 totalFinal = cUSDvalue + cREALvalue;

        // Reward is excess over original
        uint256 reward = totalFinal > baseAmount ? totalFinal - baseAmount : 0;
        return reward;
    }

    // --- Admin Functions ---

    function setSwapRouter(address _router) external onlyOwner {
        require(_router != address(0), "Invalid router address");
        swapRouter = _router;
    }

    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle address");
        fxOracle = IFXOracle(_oracle);
    }

    function getUserDeposits(
        address user
    ) external view returns (PiggyDeposit[] memory) {
        return userDeposits[user];
    }

    function estimateReward(
        address user,
        uint256 index
    ) external view returns (uint256 reward) {
        require(index < userDeposits[user].length, "Invalid index");
        PiggyDeposit memory piggy = userDeposits[user][index];
        require(!piggy.claimed, "Already claimed");

        return calculateReward(piggy);
    }

    function getPendingRewards(
        address user
    ) external view returns (uint256 totalReward) {
        PiggyDeposit[] memory piggies = userDeposits[user];
        for (uint256 i = 0; i < piggies.length; i++) {
            if (!piggies[i].claimed) {
                totalReward += calculateReward(piggies[i]);
            }
        }
    }
}
