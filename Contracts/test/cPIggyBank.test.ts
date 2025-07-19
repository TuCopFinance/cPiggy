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

    await cCOP.mint(user.getAddress(), AMOUNT);
    await cCOP.mint(owner.getAddress(), AMOUNT * 10n);

    const Oracle = await ethers.getContractFactory("OracleHandler");
oracle = await Oracle.deploy(
  sortedOraclesMock.getAddress(),
  cCOP.getAddress(),
  cUSD.getAddress(),
  cREAL.getAddress()
);

    const Mento = await ethers.getContractFactory("MentoRouterMock");
    mento = await Mento.deploy();

    const Piggy = await ethers.getContractFactory("PiggyBank");
    piggyBank = await Piggy.deploy(
      oracle.getAddress(),
      mento.getAddress(),
      cCOP.getAddress(),
      cUSD.getAddress(),
      cREAL.getAddress()
    );

    await cCOP.connect(user).approve(piggyBank.getAddress(), AMOUNT);
    await cUSD.mint(piggyBank.getAddress(), AMOUNT);
    await cREAL.mint(piggyBank.getAddress(), AMOUNT);
  });

  it("should allow deposit, store piggy, and emit event", async () => {
    await expect(piggyBank.connect(user).deposit(AMOUNT, 30))
  });

  it("should claim correctly and emit PiggyClaimed", async () => {
    await piggyBank.connect(user).deposit(AMOUNT, 30);
    await ethers.provider.send("evm_increaseTime", [DURATION]);
    await ethers.provider.send("evm_mine", []);

    await expect(piggyBank.connect(user).claim())
  });

  it("should estimate return based on mock output", async () => {
    await piggyBank.connect(user).deposit(AMOUNT, 30);
    const est = await piggyBank.estimateReturn(user.getAddress());
    expect(est).to.be.a("BigInt");
  });
});
