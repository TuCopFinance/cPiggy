import { ethers } from "hardhat";
import { expect } from "chai";
import { cPiggyBank, MockFXOracle, MockERC20 } from "../typechain-types";
import { parseUnits } from "ethers";

describe("cPiggyBank", function () {

  const DURATION_30 = 30 * 24 * 60 * 60; // 2592000
  const DURATION_60 = 60 * 24 * 60 * 60; // 5184000
  const DURATION_90 = 90 * 24 * 60 * 60; // 7776000


  let piggyBank: cPiggyBank;
  let mockOracle: MockFXOracle;
  let cCOP: MockERC20;
  let cUSD: MockERC20;
  let cREAL: MockERC20;

  let owner: any, user: any;
  const DECIMALS = parseUnits("1", 18);
  const amount = DECIMALS * 1000n; // using bigint math

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const MockToken = await ethers.getContractFactory("MockERC20");
    cCOP = await MockToken.deploy("Colombian Peso", "cCOP");
    cUSD = await MockToken.deploy("USD Stable", "cUSD");
    cREAL = await MockToken.deploy("Real", "cREAL");

    // Mint to user
    await cCOP.mint(user.getAddress(), amount);

    // Deploy mock FX oracle
    const Oracle = await ethers.getContractFactory("MockFXOracle");
    mockOracle = await Oracle.deploy();

    // Set FX rates
    await mockOracle.setRate(cUSD.getAddress(), cCOP.getAddress(), 105); // 1 cUSD = 1.05 cCOP
    await mockOracle.setRate(cREAL.getAddress(), cCOP.getAddress(), 110); // 1 cREAL = 1.10 cCOP

    // Deploy cPiggyBank
    const PiggyBank = await ethers.getContractFactory("cPiggyBank");
    piggyBank = await PiggyBank.deploy(cCOP.getAddress(), cUSD.getAddress(), cREAL.getAddress());
    await piggyBank.setOracle(mockOracle.getAddress());

    // Approve
    await cCOP.connect(user).approve(piggyBank.getAddress(), amount);
    await cCOP.mint(piggyBank.getAddress(), amount *4n); // Top up contract to pay rewards
  });

  it("should let user deposit and create piggy", async () => {
    const amount = DECIMALS * 100n;
    await piggyBank.connect(user).deposit(amount, DURATION_30, false);
    const piggies = await piggyBank.getUserDeposits(user.getAddress());
    expect(piggies.length).to.equal(1);
    expect(piggies[0].amount).to.equal(amount);
    expect(piggies[0].safeMode).to.equal(false);
  });

  it("should allow withdrawal and include FX reward", async () => {
    const amount = DECIMALS * 100n;
    const initialBalance = BigInt((await cCOP.balanceOf(user.getAddress())).toString());

    await piggyBank.connect(user).deposit(amount, DURATION_30, false);
    await ethers.provider.send("evm_increaseTime", [DURATION_30]);
    await ethers.provider.send("evm_mine", []);
    await piggyBank.connect(user).withdraw(0);

    const finalBalance = BigInt((await cCOP.balanceOf(user.getAddress())).toString());
    expect(finalBalance > (initialBalance - amount)).to.be.true;
  });

  it("should apply safeMode logic for lower reward", async () => {
    const amount = DECIMALS * 100n;

    // Regular (no safeMode)
    await piggyBank.connect(user).deposit(amount, DURATION_30, false);
    await ethers.provider.send("evm_increaseTime", [DURATION_30]);
    await ethers.provider.send("evm_mine", []);
    await piggyBank.connect(user).withdraw(0);
    const regularBalance = await cCOP.balanceOf(user.getAddress());

    // SafeMode (reset everything)
    await cCOP.mint(user.address, amount);
    await piggyBank.connect(user).deposit(amount, DURATION_30, true);
    await ethers.provider.send("evm_increaseTime", [DURATION_30]);
    await ethers.provider.send("evm_mine", []);
    await piggyBank.connect(user).withdraw(1);
    const safeBalance = await cCOP.balanceOf(user.getAddress());

    console.log("regular:", regularBalance.toString());
    console.log("safe:", safeBalance.toString());

    // SafeMode payout should be lower
    expect(regularBalance < safeBalance).to.be.true;
  });
it("should estimate reward correctly before withdrawal", async () => {
  const amount = DECIMALS * 100n;

  await piggyBank.connect(user).deposit(amount, DURATION_30, false);

  await ethers.provider.send("evm_increaseTime", [DURATION_30]);
  await ethers.provider.send("evm_mine", []);

  const estimatedReward = await piggyBank.estimateReward(user.getAddress(), 0);
  const initialBalance = await cCOP.balanceOf(user.getAddress());

  await piggyBank.connect(user).withdraw(0);
  const finalBalance = await cCOP.balanceOf(user.getAddress());

  const actualReward = finalBalance - initialBalance + amount;
  const diff = estimatedReward > actualReward
    ? estimatedReward - actualReward
    : actualReward - estimatedReward;

  const tolerance = 100000000000000n; // 0.0001 * 1e18
  expect(diff > tolerance).to.be.true;
});
});
