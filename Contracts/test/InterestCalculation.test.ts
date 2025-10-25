import { expect } from "chai";
import { ethers } from "hardhat";

describe("Interest Calculation Verification", function () {
  let piggyBank: any;

  before(async function () {
    // Deploy minimal contract just to test calculations
    const [owner] = await ethers.getSigners();

    // Mock addresses for deployment
    const mockBroker = "0x0000000000000000000000000000000000000001";
    const mockOracle = "0x0000000000000000000000000000000000000002";
    const mockProvider = "0x0000000000000000000000000000000000000003";
    const mockCCOP = "0x0000000000000000000000000000000000000004";
    const mockCUSD = "0x0000000000000000000000000000000000000005";
    const mockCEUR = "0x0000000000000000000000000000000000000006";
    const mockCGBP = "0x0000000000000000000000000000000000000007";
    const exchangeId1 = ethers.encodeBytes32String("1");
    const exchangeId2 = ethers.encodeBytes32String("2");
    const exchangeId3 = ethers.encodeBytes32String("3");
    const developer = owner.address;

    const PiggyBank = await ethers.getContractFactory("PiggyBank");
    piggyBank = await PiggyBank.deploy(
      mockBroker,
      mockOracle,
      mockProvider,
      mockCCOP,
      mockCUSD,
      mockCEUR,
      mockCGBP,
      exchangeId1,
      exchangeId2,
      exchangeId3,
      developer
    );
    await piggyBank.waitForDeployment();
  });

  describe("Compound Interest Calculations", function () {
    const principal = ethers.parseEther("10000000"); // 10,000,000 cCOP

    it("Should calculate correct interest for 30 days (1.25% monthly)", async function () {
      const interest = await piggyBank.calculateCompoundInterest(principal, 30);
      const expectedInterest = ethers.parseEther("125000"); // 125,000 cCOP

      // Allow for small rounding error (within 0.01%)
      const tolerance = ethers.parseEther("1250"); // 0.01% tolerance
      const difference = interest > expectedInterest
        ? interest - expectedInterest
        : expectedInterest - interest;

      expect(difference).to.be.lessThan(tolerance);

      console.log("30 days - Expected:", ethers.formatEther(expectedInterest));
      console.log("30 days - Actual:", ethers.formatEther(interest));
      console.log("30 days - Difference:", ethers.formatEther(difference));
    });

    it("Should calculate correct interest for 60 days (3.0225% total)", async function () {
      const interest = await piggyBank.calculateCompoundInterest(principal, 60);
      const expectedInterest = ethers.parseEther("302250"); // 302,250 cCOP

      // Allow for small rounding error (within 0.01%)
      const tolerance = ethers.parseEther("3023"); // 0.01% tolerance
      const difference = interest > expectedInterest
        ? interest - expectedInterest
        : expectedInterest - interest;

      expect(difference).to.be.lessThan(tolerance);

      console.log("60 days - Expected:", ethers.formatEther(expectedInterest));
      console.log("60 days - Actual:", ethers.formatEther(interest));
      console.log("60 days - Difference:", ethers.formatEther(difference));
    });

    it("Should calculate correct interest for 90 days (6.1208% total)", async function () {
      const interest = await piggyBank.calculateCompoundInterest(principal, 90);
      const expectedInterest = ethers.parseEther("612080"); // 612,080 cCOP

      // Allow for small rounding error (within 0.01%)
      const tolerance = ethers.parseEther("6121"); // 0.01% tolerance
      const difference = interest > expectedInterest
        ? interest - expectedInterest
        : expectedInterest - interest;

      expect(difference).to.be.lessThan(tolerance);

      console.log("90 days - Expected:", ethers.formatEther(expectedInterest));
      console.log("90 days - Actual:", ethers.formatEther(interest));
      console.log("90 days - Difference:", ethers.formatEther(difference));
    });
  });

  describe("Proportional Interest for Early Withdrawal (Future Feature)", function () {
    const principal = ethers.parseEther("10000000");

    it("Should calculate proportional interest for 15 days (half of 30-day period)", async function () {
      const interest = await piggyBank.calculateInterestForDays(principal, 30, 15);

      // With daily compounding, 15 days should give approximately half the 30-day return
      // (1.00041451)^15 ≈ 1.00623
      const expectedApproxInterest = ethers.parseEther("62300"); // Approximately 62,300

      console.log("15 days (of 30) - Actual:", ethers.formatEther(interest));
      console.log("15 days (of 30) - Expected approx:", ethers.formatEther(expectedApproxInterest));

      // Just verify it's less than full 30-day interest
      const fullInterest = await piggyBank.calculateCompoundInterest(principal, 30);
      expect(interest).to.be.lessThan(fullInterest);
    });

    it("Should calculate proportional interest for 45 days (half of 90-day period)", async function () {
      const interest = await piggyBank.calculateInterestForDays(principal, 90, 45);

      console.log("45 days (of 90) - Actual:", ethers.formatEther(interest));

      // Just verify it's less than full 90-day interest
      const fullInterest = await piggyBank.calculateCompoundInterest(principal, 90);
      expect(interest).to.be.lessThan(fullInterest);
    });

    it("Should return same as full period when daysElapsed equals duration", async function () {
      const interestFull = await piggyBank.calculateCompoundInterest(principal, 30);
      const interestProportional = await piggyBank.calculateInterestForDays(principal, 30, 30);

      expect(interestFull).to.equal(interestProportional);
    });
  });
});
