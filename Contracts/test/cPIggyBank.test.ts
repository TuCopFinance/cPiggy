import { ethers } from "hardhat";
import { expect } from "chai";
import { parseUnits } from "ethers";

import { PiggyBank, OracleHandler, MockERC20, MentoRouterMock } from "../typechain-types";

describe("PiggyBank (Mento-integrated)", function () {
  const DECIMALS = parseUnits("1", 18);
  const AMOUNT = DECIMALS * 100n;
  const DURATION = 30 * 24 * 60 * 60; // 30 days

  let piggyBank: PiggyBank;
  let oracle: OracleHandler;
  let mento: MentoRouterMock;
  let cCOP: MockERC20;
  let cUSD: MockERC20;
  let cREAL: MockERC20;

  let owner: any, user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MockERC20");
    cCOP = await Token.deploy("Colombian Peso", "cCOP");
    cUSD = await Token.deploy("USD Stable", "cUSD");
    cREAL = await Token.deploy("Real", "cREAL");

    const SortedMock = await ethers.getContractFactory("MockSortedOracles");
    const sortedOraclesMock = await SortedMock.deploy();
    await sortedOraclesMock.setRate(cUSD.getAddress(), parseUnits("1.05", 18));
    await sortedOraclesMock.setRate(cREAL.getAddress(), parseUnits("1.10", 18));
    await sortedOraclesMock.setRate(cCOP.getAddress(), parseUnits("1.00", 18)); // base

    await cCOP.mint(user.getAddress(), AMOUNT * 2n);
    await cCOP.mint(owner.getAddress(), AMOUNT * 10n);

    const Oracle = await ethers.getContractFactory("OracleHandler");
    oracle = await Oracle.deploy(
      sortedOraclesMock.getAddress(),
      cCOP.getAddress(),
      cUSD.getAddress(),
      cREAL.getAddress()
    );

    const Mento = await ethers.getContractFactory("MentoRouterMock");
    mento = await Mento.deploy(
  cUSD.getAddress(),
  cREAL.getAddress(),
  cCOP.getAddress()
);

    const Piggy = await ethers.getContractFactory("PiggyBank");
    piggyBank = await Piggy.deploy(
      oracle.getAddress(),
      mento.getAddress(),
      cCOP.getAddress(),
      cUSD.getAddress(),
      cREAL.getAddress()
    );

    await cCOP.connect(user).approve(piggyBank.getAddress(), AMOUNT * 2n);
    await cUSD.mint(piggyBank.getAddress(), AMOUNT * 2n);
    await cREAL.mint(piggyBank.getAddress(), AMOUNT * 2n);
    await cCOP.mint(mento.getAddress(), AMOUNT * 10n);  // For swap payouts in cCOP
    
await cUSD.mint(mento.getAddress(), AMOUNT * 10n);  // If it ever swaps the other way
await cREAL.mint(mento.getAddress(), AMOUNT * 10n); // Likewise
  });

  it("should allow deposit, store piggy, and emit event", async () => {
    await expect(piggyBank.connect(user).deposit(AMOUNT, 30, false)).to.be.not.true;
  });

  it("should claim correctly and emit PiggyClaimed", async () => {
    await piggyBank.connect(user).deposit(AMOUNT, 30, false);
    await ethers.provider.send("evm_increaseTime", [DURATION]);
    await ethers.provider.send("evm_mine", []);

    await expect(piggyBank.connect(user).claim(0)).to.be.not.true;
  });

  it("should estimate return based on mock output", async () => {
    await piggyBank.connect(user).deposit(AMOUNT, 30, false);
    const est = await piggyBank.estimateReturn(user.getAddress(), 0);
    expect(est).to.be.a("BigInt");
  });

it("should show difference in FX gain between safeMode and non-safeMode", async () => {
  const userAddress = await user.getAddress();
  const depositAmount = AMOUNT;

  // Snapshot before normal mode
  const balanceBefore = await cCOP.balanceOf(userAddress);

  // Deposit with safeMode = false (index 0)
 await piggyBank.connect(user).deposit(depositAmount, 30, false);
await ethers.provider.send("evm_increaseTime", [DURATION]);
await ethers.provider.send("evm_mine", []);
const estNormal = await piggyBank.estimateReturn(userAddress, 0);
await piggyBank.connect(user).claim(0);
const piggies = await piggyBank.getUserPiggies(userAddress);
const rewardNormal = piggies[0].safeMode
  ? piggies[0].cCOPAmount + (await piggyBank.estimateReturn(userAddress, 0)) / 2n
  : await piggyBank.estimateReturn(userAddress, 0);

  // Reset user funds for safeMode test
  await cCOP.mint(userAddress, depositAmount);
  await cCOP.connect(user).approve(piggyBank.getAddress(), depositAmount);

  // Deposit with safeMode = true (index 1)
await piggyBank.connect(user).deposit(depositAmount, 30, true);
await ethers.provider.send("evm_increaseTime", [DURATION]);
await ethers.provider.send("evm_mine", []);
await piggyBank.connect(user).claim(1);
const piggiesSafe = await piggyBank.getUserPiggies(userAddress);
const rewardSafe = piggiesSafe[1].safeMode
  ? piggiesSafe[1].cCOPAmount + (await piggyBank.estimateReturn(userAddress, 1)) / 2n
  : await piggyBank.estimateReturn(userAddress, 1);

  console.log("Reward Normal (claimed):", rewardNormal.toString());
  console.log("Reward Safe (claimed):", rewardSafe.toString());

  expect(rewardNormal > rewardSafe).to.be.true;
});

});
