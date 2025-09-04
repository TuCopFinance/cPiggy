import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers"; // Fix for the TypeScript error
import { expect } from "chai";
import { ethers } from "hardhat";

// Helper for parsing Ether amounts
const { parseEther } = ethers;

describe("PiggyBank", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployPiggyBankFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, developer, user1, user2] = await ethers.getSigners();

    // --- Mock Contracts Deployment ---

    // Mock ERC20 Token
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    const cCOP = await ERC20Mock.deploy("cCOP Token", "cCOP");
    const cUSD = await ERC20Mock.deploy("cUSD Token", "cUSD");
    const cEUR = await ERC20Mock.deploy("cEUR Token", "cEUR");
    const cGBP = await ERC20Mock.deploy("cGBP Token", "cGBP");

    // Mock MentoOracleHandler
    const MentoOracleHandlerMock = await ethers.getContractFactory("MentoOracleHandlerMock");
    const mentoOracle = await MentoOracleHandlerMock.deploy();

    // Mock IMentoBroker
    const MentoBrokerMock = await ethers.getContractFactory("MentoBrokerMock");
    const iMentoBroker = await MentoBrokerMock.deploy();

    // Deploy the main PiggyBank contract
    const PiggyBank = await ethers.getContractFactory("PiggyBank");
    const piggyBank = await PiggyBank.deploy(
      await iMentoBroker.getAddress(),
      await mentoOracle.getAddress(),
      ethers.ZeroAddress, // exchangeProvider (not critical for these tests)
      await cCOP.getAddress(),
      await cUSD.getAddress(),
      await cEUR.getAddress(),
      await cGBP.getAddress(),
      ethers.encodeBytes32String("cCOP_cUSD"),
      ethers.encodeBytes32String("cUSD_cEUR"),
      ethers.encodeBytes32String("cUSD_cGBP"),
      developer.address
    );

    // --- Initial Token Distribution and Approvals for tests ---
    // Mint tokens for users and owner for testing purposes
    await cCOP.mint(user1.address, parseEther("10000"));
    await cCOP.mint(user2.address, parseEther("10000"));
    await cCOP.mint(owner.address, parseEther("200000000")); // For funding rewards

    // The broker needs tokens to simulate swaps
    await cUSD.mint(await iMentoBroker.getAddress(), parseEther("100000"));
    await cEUR.mint(await iMentoBroker.getAddress(), parseEther("100000"));
    await cGBP.mint(await iMentoBroker.getAddress(), parseEther("100000"));
    await cCOP.mint(await iMentoBroker.getAddress(), parseEther("100000"));

    // Approve the PiggyBank contract to spend tokens on behalf of users/owner
    await cCOP.connect(user1).approve(await piggyBank.getAddress(), ethers.MaxUint256);
    await cCOP.connect(user2).approve(await piggyBank.getAddress(), ethers.MaxUint256);
    await cCOP.connect(owner).approve(await piggyBank.getAddress(), ethers.MaxUint256);

    return {
      piggyBank,
      cCOP, cUSD, cEUR, cGBP,
      mentoOracle, iMentoBroker,
      owner, developer, user1, user2
    };
  }
  
  // We need to define the mock contracts for deployment within the test script.
  // This is a common pattern when you don't want to create separate files for simple mocks.
  before(async function() {
    // Define a simple ERC20 Mock with a mint function
    const ERC20MockSource = `
        // SPDX-License-Identifier: MIT
        pragma solidity ^0.8.19;
        import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
        contract ERC20Mock is ERC20 {
            constructor(string memory name, string memory symbol) ERC20(name, symbol) {}
            function mint(address to, uint256 amount) public { _mint(to, amount); }
        }`;
    
    // Define Mento Oracle Mock
    const MentoOracleHandlerMockSource = `
        // SPDX-License-Identifier: MIT
        pragma solidity ^0.8.19;
        contract MentoOracleHandlerMock {
            function getSuggestedAllocation(uint256 totalAmount, bool isSafeMode) external pure returns (uint256, uint256, uint256, uint256) {
                // Return a fixed 25% split for simplicity in testing
                uint256 part = totalAmount / 4;
                return (part, part, part, totalAmount - (part * 3));
            }
        }`;

    // Define Mento Broker Mock
    const MentoBrokerMockSource = `
        // SPDX-License-Identifier: MIT
        pragma solidity ^0.8.19;
        import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
        contract MentoBrokerMock {
             // To simulate profit for dev fee testing
            uint256 public swapMultiplier = 100; // 100 = 1:1 swap

            function setSwapMultiplier(uint256 _multiplier) external {
                swapMultiplier = _multiplier;
            }

            function getAmountOut(address, bytes32, address, address, uint256 amountIn) external view returns (uint256) {
                return (amountIn * swapMultiplier) / 100;
            }
            function swapIn(address, bytes32, address tokenIn, address tokenOut, uint256 amountIn, uint256) external returns (uint256) {
                uint256 amountOut = (amountIn * swapMultiplier) / 100;
                // Simulate the swap: contract -> broker, broker -> contract
                IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
                IERC20(tokenOut).transfer(msg.sender, amountOut);
                return amountOut;
            }
        }`;
        
    // This dynamically creates artifacts for our mock contracts so Hardhat can use them
    const hre = require("hardhat");
    if (!hre.config.paths.sources.includes("contracts")) {
      hre.config.paths.sources = "./contracts";
    }
    const fs = require("fs");
    if (!fs.existsSync("./contracts/mocks")) {
        fs.mkdirSync("./contracts/mocks", { recursive: true });
    }
    fs.writeFileSync("./contracts/mocks/ERC20Mock.sol", ERC20MockSource);
    fs.writeFileSync("./contracts/mocks/MentoOracleHandlerMock.sol", MentoOracleHandlerMockSource);
    fs.writeFileSync("./contracts/mocks/MentoBrokerMock.sol", MentoBrokerMockSource);

    // It's good practice to compile after creating mock files
    await hre.run('compile');
  });


  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { piggyBank, owner } = await loadFixture(deployPiggyBankFixture);
      expect(await piggyBank.owner()).to.equal(owner.address);
    });

    it("Should initialize staking pools with correct values", async function () {
      const { piggyBank } = await loadFixture(deployPiggyBankFixture);
      
      const pool30 = await piggyBank.stakingPools(30);
      expect(pool30.maxTotalStake).to.equal(parseEther("3200000000"));
      expect(pool30.duration).to.equal(30);

      const pool60 = await piggyBank.stakingPools(60);
      expect(pool60.maxTotalStake).to.equal(parseEther("1157981803"));
      expect(pool60.duration).to.equal(60);
      
      const pool90 = await piggyBank.stakingPools(90);
      expect(pool90.maxTotalStake).to.equal(parseEther("408443341"));
      expect(pool90.duration).to.equal(90);
    });
  });

  describe("Diversify Feature", function () {
    it("Should allow a user to deposit and see their funds diversified", async function() {
        const { piggyBank, user1, cCOP, cUSD, cEUR, cGBP } = await loadFixture(deployPiggyBankFixture);
        const depositAmount = parseEther("1000");

        await expect(piggyBank.connect(user1).deposit(depositAmount, 30, false))
            .to.emit(piggyBank, "PiggyCreated");
        
        const piggy = (await piggyBank.getUserPiggies(user1.address))[0];
        expect(piggy.initialAmount).to.equal(depositAmount);
        
        // Based on our 25% split mock oracle
        const part = depositAmount / 4n;
        expect(piggy.cCOPAmount).to.equal(part);
        
        const contractBalanceUSD = await cUSD.balanceOf(await piggyBank.getAddress());
        const contractBalanceEUR = await cEUR.balanceOf(await piggyBank.getAddress());
        const contractBalanceGBP = await cGBP.balanceOf(await piggyBank.getAddress());
        
        // Check that the contract now holds the diversified assets
        expect(contractBalanceUSD).to.be.gt(0);
        expect(contractBalanceEUR).to.be.gt(0);
        expect(contractBalanceGBP).to.be.gt(0);
    });

    it("Should allow a user to claim their diversified funds with no profit", async function() {
        const { piggyBank, user1, cCOP } = await loadFixture(deployPiggyBankFixture);
        const depositAmount = parseEther("1000");
        await piggyBank.connect(user1).deposit(depositAmount, 30, false);
        
        await time.increase(30 * 24 * 60 * 60 + 1); // Increase time by 30 days and 1 second

        const userBalanceBefore = await cCOP.balanceOf(user1.address);
        await piggyBank.connect(user1).claim(0);
        const userBalanceAfter = await cCOP.balanceOf(user1.address);

        // With 1:1 swaps, the return should be the same as the deposit
        expect(userBalanceAfter).to.equal(userBalanceBefore + depositAmount);
    });

    it("Should correctly calculate and send developer fee on profit", async function() {
        const { piggyBank, user1, cCOP, iMentoBroker, developer } = await loadFixture(deployPiggyBankFixture);
        
        // Set the mock broker to return 10% more on all swaps to simulate profit
        const MentoBrokerMock = await ethers.getContractAt("MentoBrokerMock", await iMentoBroker.getAddress());
        await MentoBrokerMock.setSwapMultiplier(110); // 110 = 10% profit

        const depositAmount = parseEther("1000");
        await piggyBank.connect(user1).deposit(depositAmount, 30, false);
        
        await time.increase(30 * 24 * 60 * 60 + 1);

        const devBalanceBefore = await cCOP.balanceOf(developer.address);

        // Instead of calculating the complex fee manually, we capture it from the event
        // and check if the transfer matches.
        await expect(piggyBank.connect(user1).claim(0))
            .to.emit(piggyBank, "PiggyClaimed")
            .withArgs(
                user1.address,
                0,
                (userReturn: bigint) => userReturn > 0, // Just check if return is positive
                (devFee: bigint) => {
                    expect(devFee).to.be.gt(0); // Check if a fee was generated
                    // Check if the developer's balance increased by the fee amount
                    cCOP.balanceOf(developer.address).then(balance => {
                        expect(balance).to.equal(devBalanceBefore + devFee);
                    });
                    return true;
                }
            );
    });
  });

  describe("APY Staking Feature", function () {
    describe("fundRewards", function () {
      it("Should allow the owner to fund rewards and distribute them correctly", async function () {
        const { piggyBank, owner, cCOP } = await loadFixture(deployPiggyBankFixture);
        const totalRewards = parseEther("105000000"); // 105M cCOP

        await expect(piggyBank.connect(owner).fundRewards(totalRewards))
          .to.emit(piggyBank, "RewardsFunded")
          .withArgs(owner.address, totalRewards);
        
        const pool30 = await piggyBank.stakingPools(30);
        expect(pool30.totalRewardsFunded).to.equal(totalRewards * 40n / 100n);

        const pool60 = await piggyBank.stakingPools(60);
        expect(pool60.totalRewardsFunded).to.equal(totalRewards * 35n / 100n);
        
        const pool90 = await piggyBank.stakingPools(90);
        const expected90dRewards = totalRewards - (totalRewards * 40n / 100n) - (totalRewards * 35n / 100n);
        expect(pool90.totalRewardsFunded).to.equal(expected90dRewards);

        // The contract balance should increase by totalRewards (plus any from diversify deposits if they run)
        const contractBalance = await cCOP.balanceOf(await piggyBank.getAddress());
        expect(contractBalance).to.be.gte(totalRewards);
      });

      it("Should revert if a non-owner tries to fund rewards", async function () {
        const { piggyBank, user1 } = await loadFixture(deployPiggyBankFixture);
        // FIX: Use revertedWithCustomError for OpenZeppelin 5+
        await expect(piggyBank.connect(user1).fundRewards(parseEther("100")))
            .to.be.revertedWithCustomError(piggyBank, "OwnableUnauthorizedAccount")
            .withArgs(user1.address);
      });
    });

    describe("stake", function () {
      // We need a fixture with rewards already funded for these tests
      async function fundedFixture() {
        const base = await loadFixture(deployPiggyBankFixture);
        const totalRewards = parseEther("105000000");
        await base.piggyBank.connect(base.owner).fundRewards(totalRewards);
        return base;
      }

      it("Should allow a user to stake successfully", async function () {
        const { piggyBank, user1, cCOP } = await fundedFixture();
        const stakeAmount = parseEther("1000");

        const initialUserBalance = await cCOP.balanceOf(user1.address);

        await expect(piggyBank.connect(user1).stake(stakeAmount, 30))
          .to.emit(piggyBank, "StakeCreated");
        
        const stake = (await piggyBank.getUserStakes(user1.address))[0];
        expect(stake.amount).to.equal(stakeAmount);
        expect(stake.duration).to.equal(30);
        
        // Reward for 30 days is 1.25% (125 / 10000)
        const expectedReward = stakeAmount * 125n / 10000n;
        expect(stake.reward).to.equal(expectedReward);

        const pool30 = await piggyBank.stakingPools(30);
        expect(pool30.totalStaked).to.equal(stakeAmount);
        expect(pool30.totalRewardsPromised).to.equal(expectedReward);

        expect(await cCOP.balanceOf(user1.address)).to.equal(initialUserBalance - stakeAmount);
      });

      it("Should revert if staking for an invalid duration", async function () {
        const { piggyBank, user1 } = await fundedFixture();
        await expect(
          piggyBank.connect(user1).stake(parseEther("100"), 45)
        ).to.be.revertedWith("Invalid duration");
      });

      it("Should revert if pool is full", async function () {
        const { piggyBank, owner, user2, cCOP } = await fundedFixture(); // FIX: Use user2
        
        // A whale (the owner in this test) fills up the pool almost completely
        const maxStake30d = (await piggyBank.stakingPools(30)).maxTotalStake;
        const amountToLeave = parseEther("100");
        const whaleStake = maxStake30d - amountToLeave;

        await cCOP.mint(owner.address, whaleStake);
        await cCOP.connect(owner).approve(await piggyBank.getAddress(), whaleStake);
        await piggyBank.connect(owner).stake(whaleStake, 30);
        
        // User2 tries to stake an amount that would overfill the pool
        await expect(
          piggyBank.connect(user2).stake(amountToLeave + 1n, 30)
        ).to.be.revertedWith("Pool is full");
      });

      it("Should revert if user exceeds max wallet deposit", async function () {
        const { piggyBank, user1, cCOP } = await fundedFixture();
        const maxDeposit = await piggyBank.MAX_DEPOSIT_PER_WALLET();
        
        // FIX: Mint the required tokens to the user for this specific test
        await cCOP.mint(user1.address, maxDeposit);
        
        await piggyBank.connect(user1).stake(maxDeposit, 30);

        // Trying to stake even 1 wei more should fail
        await expect(
          piggyBank.connect(user1).stake(1, 60)
        ).to.be.revertedWith("Exceeds max wallet deposit limit");
      });
      
      it("Should revert if not enough rewards are funded in the pool", async function () {
          const { piggyBank, owner, user1 } = await loadFixture(deployPiggyBankFixture);
          // Fund with a very small amount
          await piggyBank.connect(owner).fundRewards(parseEther("1"));

          // Try to stake an amount that would promise a reward > funded amount
          await expect(
            piggyBank.connect(user1).stake(parseEther("1000"), 30)
          ).to.be.revertedWith("Not enough rewards funded in pool");
      });
    });

    describe("unstake", function () {
      async function stakedFixture() {
        const base = await loadFixture(deployPiggyBankFixture);
        const totalRewards = parseEther("105000000");
        await base.piggyBank.connect(base.owner).fundRewards(totalRewards);
        const stakeAmount = parseEther("1000");
        await base.piggyBank.connect(base.user1).stake(stakeAmount, 60);
        return { ...base, stakeAmount };
      }

      it("Should revert if trying to unstake before lock period ends", async function () {
        const { piggyBank, user1 } = await stakedFixture();
        await expect(
          piggyBank.connect(user1).unstake(0)
        ).to.be.revertedWith("Lock period not ended");
      });

      it("Should allow a user to unstake correctly after lock period", async function () {
        const { piggyBank, user1, developer, cCOP, stakeAmount } = await stakedFixture();
        const stakeBefore = (await piggyBank.getUserStakes(user1.address))[0];

        // Fast-forward time
        const lockEndTime = stakeBefore.startTime + (stakeBefore.duration * 86400n);
        await time.increaseTo(lockEndTime);

        const userBalanceBefore = await cCOP.balanceOf(user1.address);
        const devBalanceBefore = await cCOP.balanceOf(developer.address);

        await expect(piggyBank.connect(user1).unstake(0))
          .to.emit(piggyBank, "StakeClaimed");

        const stakeAfter = (await piggyBank.getUserStakes(user1.address))[0];
        expect(stakeAfter.claimed).to.be.true;

        const reward = stakeBefore.reward;
        const devFee = reward * 5n / 100n;
        const userReward = reward - devFee;
        const totalUserReturn = stakeAmount + userReward;

        expect(await cCOP.balanceOf(user1.address)).to.equal(userBalanceBefore + totalUserReturn);
        expect(await cCOP.balanceOf(developer.address)).to.equal(devBalanceBefore + devFee);
      });
      
      it("Should revert if trying to claim an already claimed stake", async function () {
          const { piggyBank, user1 } = await stakedFixture();
          const stakeBefore = (await piggyBank.getUserStakes(user1.address))[0];
          const lockEndTime = stakeBefore.startTime + (stakeBefore.duration * 86400n);
          await time.increaseTo(lockEndTime);

          await piggyBank.connect(user1).unstake(0); // First claim

          await expect(
            piggyBank.connect(user1).unstake(0)
          ).to.be.revertedWith("Already claimed");
      });
    });
  });
});

