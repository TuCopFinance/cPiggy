// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MentoOracleHandler.sol";
import "./interfaces/interfaces.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; // Import Ownable for managing contract ownership

/**
 * @title PiggyBank
 * @notice A contract for time-locked savings with two features:
 * 1. 4-way asset diversification (cCOP, cUSD, cEUR, cGBP).
 * 2. Fixed-term APY staking in cCOP.
 * @dev The two features (Diversify and Stake) operate independently.
 */
contract PiggyBank is Ownable {
    // --- STATE VARIABLES FOR DIVERSIFY FEATURE (UNCHANGED) ---
    MentoOracleHandler public mentoOracle;
    IMentoBroker public iMentoBroker;

    address public immutable cCOP;
    address public immutable cUSD;
    address public immutable cEUR;
    address public immutable cGBP;
    address public immutable exchangeProvider;
    address public developer;

    bytes32 public immutable exchangeId_cCOP_cUSD;
    bytes32 public immutable exchangeId_cUSD_cEUR;
    bytes32 public immutable exchangeId_cUSD_cGBP;

    struct Piggy {
        address owner;
        uint256 initialAmount;
        uint256 cCOPAmount;
        uint256 cUSDAmount;
        uint256 cEURAmount;
        uint256 cGBPAmount;
        uint256 startTime;
        uint256 duration;
        bool safeMode;
        bool claimed;
    }

    mapping(address => Piggy[]) public piggies;

    // --- STATE VARIABLES FOR NEW APY STAKING FEATURE ---
    uint256 public constant MAX_DEPOSIT_PER_WALLET = 10_000_000 * 1e18;
    uint256 public constant STAKING_DEV_FEE_PERCENTAGE = 5; // 5% fee on profit
    
    // Daily rate constants (in basis points)
    uint256 public constant DAILY_RATE_30D = 417; // 0.0417% daily (1.25%/30)
    uint256 public constant DAILY_RATE_60D = 500; // 0.0500% daily (1.50%/30)
    uint256 public constant DAILY_RATE_90D = 667; // 0.0667% daily (2.00%/30)

    struct StakingPool {
        uint256 totalStaked;
        uint256 maxTotalStake;
        uint256 totalRewardsFunded;
        uint256 totalRewardsPromised; // Rewards allocated to stakers
        uint256 duration; // in days
    }

    struct StakingPosition {
        uint256 amount;
        uint256 startTime;
        uint256 duration;
        uint256 reward;
        bool claimed;
    }

    mapping(uint256 => StakingPool) public stakingPools; // Keyed by duration (30, 60, 90)
    mapping(address => StakingPosition[]) public userStakes;
    mapping(address => uint256) public totalStakedAmountByUser;

    // --- EVENTS ---

    // Diversify Events (Unchanged)
    event PiggyCreated(
        address indexed user,
        uint256 totalAmount,
        uint256 duration,
        bool safeMode,
        uint256 cCOPAmount,
        uint256 cUSDAmountReceived,
        uint256 cEURAmountReceived,
        uint256 cGBPAmountReceived
    );
    event PiggyClaimed(
        address indexed user,
        uint256 index,
        uint256 userReturnAmount,
        uint256 developerFee
    );
    
    // New Staking Events
    event StakeCreated(
        address indexed user,
        uint256 amount,
        uint256 duration,
        uint256 reward
    );
    event StakeClaimed(
        address indexed user,
        uint256 index,
        uint256 principal,
        uint256 reward,
        uint256 developerFee
    );
    event RewardsFunded(address indexed funder, uint256 totalAmount);

    // --- CONSTRUCTOR ---
    constructor(
        address _iMentoBroker,
        address _mentoOracle,
        address _exchangeProvider,
        address _cCOP,
        address _cUSD,
        address _cEUR,
        address _cGBP,
        bytes32 _exchangeId_cCOP_cUSD,
        bytes32 _exchangeId_cUSD_cEUR,
        bytes32 _exchangeId_cUSD_cGBP,
        address _developer
    ) Ownable(msg.sender) { // Set the deployer as the owner
        iMentoBroker = IMentoBroker(_iMentoBroker);
        mentoOracle = MentoOracleHandler(_mentoOracle);
        exchangeProvider = _exchangeProvider;
        cCOP = _cCOP;
        cUSD = _cUSD;
        cEUR = _cEUR;
        cGBP = _cGBP;
        exchangeId_cCOP_cUSD = _exchangeId_cCOP_cUSD;
        exchangeId_cUSD_cEUR = _exchangeId_cUSD_cEUR;
        exchangeId_cUSD_cGBP = _exchangeId_cUSD_cGBP;
        developer = _developer;

        // Initialize Staking Pools
        stakingPools[30] = StakingPool({
            totalStaked: 0,
            maxTotalStake: 3_200_000_000 * 1e18,
            totalRewardsFunded: 0,
            totalRewardsPromised: 0,
            duration: 30
        });
        stakingPools[60] = StakingPool({
            totalStaked: 0,
            maxTotalStake: 1_157_981_803 * 1e18,
            totalRewardsFunded: 0,
            totalRewardsPromised: 0,
            duration: 60
        });
        stakingPools[90] = StakingPool({
            totalStaked: 0,
            maxTotalStake: 408_443_341 * 1e18,
            totalRewardsFunded: 0,
            totalRewardsPromised: 0,
            duration: 90
        });
    }

    // --- DIVERSIFY FEATURE FUNCTIONS (UNCHANGED) ---

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
        
        uint256 totalCCOPToSwap = cCOPForUSD + cCOPForEUR + cCOPForGBP;

        if (totalCCOPToSwap > 0) {
            uint256 intermediateUSD = _executeSwap(
                exchangeId_cCOP_cUSD,
                cCOP,
                cUSD,
                totalCCOPToSwap
            );
            
            uint256 usdAmountForEURSwap = (intermediateUSD * cCOPForEUR) / totalCCOPToSwap;
            uint256 usdAmountForGBPSwap = (intermediateUSD * cCOPForGBP) / totalCCOPToSwap;
            
            if (usdAmountForEURSwap > 0) {
                receivedEUR = _executeSwap(
                    exchangeId_cUSD_cEUR,
                    cUSD,
                    cEUR,
                    usdAmountForEURSwap
                );
            }

            if (usdAmountForGBPSwap > 0) {
                receivedGBP = _executeSwap(
                    exchangeId_cUSD_cGBP,
                    cUSD,
                    cGBP,
                    usdAmountForGBPSwap
                );
            }
            
            receivedUSD = intermediateUSD - usdAmountForEURSwap - usdAmountForGBPSwap;
        }
        
        piggies[msg.sender].push(
            Piggy({
                owner: msg.sender,
                initialAmount: amount,
                cCOPAmount: cCOPToKeep,
                cUSDAmount: receivedUSD,
                cEURAmount: receivedEUR,
                cGBPAmount: receivedGBP,
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
            receivedGBP
        );
    }

    function claim(uint256 _index) external {
        require(_index < piggies[msg.sender].length, "Invalid piggy index");
        Piggy storage p = piggies[msg.sender][_index];
        require(!p.claimed, "Already claimed");
        require(block.timestamp >= p.startTime + p.duration, "Lock not ended");

        uint256 totalUSDToSwapBack = p.cUSDAmount;
        
        if (p.cEURAmount > 0) {
            totalUSDToSwapBack += _executeSwap(
                exchangeId_cUSD_cEUR,
                cEUR,
                cUSD,
                p.cEURAmount
            );
        }

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
        uint256 userAmount = finalReturn; // User gets full return

        if (finalReturn > p.initialAmount) {
            uint256 profit = finalReturn - p.initialAmount;
            developerFee = (profit * 1) / 100; // 1% of profit as additional cost to protocol
        }

        // User gets full return, protocol pays developer fee separately
        IERC20(cCOP).transfer(msg.sender, userAmount);
        if (developerFee > 0) {
            IERC20(cCOP).transfer(developer, developerFee);
        }

        emit PiggyClaimed(msg.sender, _index, userAmount, developerFee);
    }

    // --- NEW APY STAKING FEATURE FUNCTIONS ---

    /**
     * @notice Get daily rate for a specific duration
     * @param _duration The lock-in period in days (30, 60, or 90)
     * @return The daily rate in basis points
     */
    function getDailyRate(uint256 _duration) public pure returns (uint256) {
        if (_duration == 30) return DAILY_RATE_30D;
        if (_duration == 60) return DAILY_RATE_60D;
        if (_duration == 90) return DAILY_RATE_90D;
        return 0;
    }

    /**
     * @notice Calculate compound interest using daily rates
     * @param _amount The principal amount
     * @param _duration The lock-in period in days
     * @return The interest amount
     */
    function calculateCompoundInterest(uint256 _amount, uint256 _duration) public pure returns (uint256) {
        uint256 dailyRate = getDailyRate(_duration);
        if (dailyRate == 0) return 0;
        
        // A = P(1 + r)^n where r = dailyRate/10000
        // For simplicity, we'll use the pre-calculated compound multipliers
        uint256 compoundMultiplier;
        if (_duration == 30) {
            compoundMultiplier = 10125; // 1.0125 (1.25% for 30 days)
        } else if (_duration == 60) {
            compoundMultiplier = 10302; // 1.0302 (1.5% for 60 days)
        } else if (_duration == 90) {
            compoundMultiplier = 10612; // 1.0612 (2% for 90 days)
        } else {
            return 0;
        }
        
        uint256 finalAmount = (_amount * compoundMultiplier) / 10000;
        return finalAmount - _amount;
    }

    /**
     * @notice Funds the contract with cCOP to pay for staking rewards.
     * @dev To be called by the contract owner (Celo Colombia).
     * The amount is distributed to the pools based on the predefined percentages.
     * - 30 Day Pool: 40%
     * - 60 Day Pool: 35%
     * - 90 Day Pool: 25%
     * @param _amount Total amount of cCOP rewards to add.
     */
    function fundRewards(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be positive");
        IERC20(cCOP).transferFrom(msg.sender, address(this), _amount);

        // Distribute rewards based on pool capacity and interest rates
        // 30d: 1.25%, 60d: 1.5%, 90d: 2% - adjust distribution accordingly
        uint256 rewardsFor30d = (_amount * 30) / 100; // 30% for 30-day pool
        uint256 rewardsFor60d = (_amount * 35) / 100; // 35% for 60-day pool  
        uint256 rewardsFor90d = _amount - rewardsFor30d - rewardsFor60d; // 35% for 90-day pool

        stakingPools[30].totalRewardsFunded += rewardsFor30d;
        stakingPools[60].totalRewardsFunded += rewardsFor60d;
        stakingPools[90].totalRewardsFunded += rewardsFor90d;

        emit RewardsFunded(msg.sender, _amount);
    }

function getRewardsOut() external onlyOwner {
    // Get the current balance of cCOP held by the contract
    uint256 remainingcCOPValue = IERC20(cCOP).balanceOf(address(this));
    
    // Check if the balance is greater than zero
    require(remainingcCOPValue > 0, "You cannot get out any funds as it is zero");
    
    // Transfer the entire balance directly to the owner (msg.sender)
    IERC20(cCOP).transfer(msg.sender, remainingcCOPValue);
}
    /**
     * @notice Stakes a specific amount of cCOP for a fixed duration to earn APY.
     * @param _amount The amount of cCOP to stake.
     * @param _duration The lock-in period in days. Must be 30, 60, or 90.
     */
    function stake(uint256 _amount, uint256 _duration) external {
        require(_amount > 0, "Amount must be positive");
        require(
            _duration == 30 || _duration == 60 || _duration == 90,
            "Invalid duration"
        );

        StakingPool storage pool = stakingPools[_duration];

        require(
            totalStakedAmountByUser[msg.sender] + _amount <= MAX_DEPOSIT_PER_WALLET,
            "Exceeds max wallet deposit limit"
        );
        require(
            pool.totalStaked + _amount <= pool.maxTotalStake,
            "Pool is full"
        );
        
        // Daily interest rates: 30d=0.0417%, 60d=0.0500%, 90d=0.0667%
        // Pool capacity calculations based on compound interest rates
        uint256 maxRewardForPool;
        if (_duration == 30) {
            maxRewardForPool = (pool.maxTotalStake * 125) / 10000; // 1.25% compound
        } else if (_duration == 60) {
            maxRewardForPool = (pool.maxTotalStake * 302) / 10000; // 3.02% compound
        } else if (_duration == 90) {
            maxRewardForPool = (pool.maxTotalStake * 612) / 10000; // 6.12% compound
        }

        // Calculate reward using daily rates and compound interest
        uint256 reward = calculateCompoundInterest(_amount, _duration);
        
        require(
            pool.totalRewardsPromised + reward <= pool.totalRewardsFunded,
            "Not enough rewards funded in pool"
        );

        // Update state
        pool.totalStaked += _amount;
        pool.totalRewardsPromised += reward;
        totalStakedAmountByUser[msg.sender] += _amount;
        
        IERC20(cCOP).transferFrom(msg.sender, address(this), _amount);

        userStakes[msg.sender].push(
            StakingPosition({
                amount: _amount,
                startTime: block.timestamp,
                duration: _duration,
                reward: reward,
                claimed: false
            })
        );

        emit StakeCreated(msg.sender, _amount, _duration, reward);
    }

    /**
     * @notice Claims the principal and earned rewards for a completed stake.
     * @param _index The index of the stake in the user's stake list.
     */
    function unstake(uint256 _index) external {
        require(_index < userStakes[msg.sender].length, "Invalid stake index");
        StakingPosition storage s = userStakes[msg.sender][_index];
        require(!s.claimed, "Already claimed");
        require(
            block.timestamp >= s.startTime + (s.duration * 1 days),
            "Lock period not ended"
        );

        s.claimed = true;
        
        // The dev fee is 5% of the earned reward (profit) - additional cost to protocol
        uint256 developerFee = (s.reward * STAKING_DEV_FEE_PERCENTAGE) / 100;
        uint256 totalUserReturn = s.amount + s.reward; // User gets full reward
        uint256 totalProtocolCost = s.amount + s.reward + developerFee; // Total cost to protocol
        
        // Update global state
        totalStakedAmountByUser[msg.sender] -= s.amount;
        stakingPools[s.duration].totalStaked -= s.amount;

        // Transfer funds - user gets full reward, protocol pays developer fee
        IERC20(cCOP).transfer(msg.sender, totalUserReturn);
        if (developerFee > 0) {
            IERC20(cCOP).transfer(developer, developerFee);
        }

        emit StakeClaimed(msg.sender, _index, s.amount, s.reward, developerFee);
    }

    // --- VIEW FUNCTIONS ---

    // Diversify View Functions (Unchanged)
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

        if (p.cEURAmount > 0) {
            try iMentoBroker.getAmountOut(exchangeProvider, exchangeId_cUSD_cEUR, cEUR, cUSD, p.cEURAmount) returns (uint256 usdFromEUR) {
                totalUSDValue += usdFromEUR;
            } catch {}
        }

        if (p.cGBPAmount > 0) {
            try iMentoBroker.getAmountOut(exchangeProvider, exchangeId_cUSD_cGBP, cGBP, cUSD, p.cGBPAmount) returns (uint256 usdFromGBP) {
                totalUSDValue += usdFromGBP;
            } catch {}
        }

        if (totalUSDValue > 0) {
            try iMentoBroker.getAmountOut(exchangeProvider, exchangeId_cCOP_cUSD, cUSD, cCOP, totalUSDValue) returns (uint256 ccopFromSwaps) {
                totalValueInCCOP += ccopFromSwaps;
            } catch {}
        }

        return totalValueInCCOP;
    }

    // New Staking View Functions
    function getUserStakes(address _user) external view returns (StakingPosition[] memory) {
        return userStakes[_user];
    }

    function getPoolInfo(uint256 _duration) external view returns (StakingPool memory) {
        require(
            _duration == 30 || _duration == 60 || _duration == 90,
            "Invalid duration"
        );
        return stakingPools[_duration];
    }
}
