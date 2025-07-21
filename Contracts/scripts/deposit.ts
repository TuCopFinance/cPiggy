// scripts/deposit.ts

import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

const erc20Abi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
];

async function main() {
  // --- 1. SETUP ---
  console.log("🚀 Setting up script...");

  // Your address from CeloScan.
  const yourAddressRaw = "0x6fA26735bDCD8D598f6F1384Fc59F0180e903101";
  // **THE FIX IS HERE**: We use ethers.getAddress() to ensure the address is correctly formatted.
  const yourAddress = ethers.getAddress(yourAddressRaw);
  console.log(`   - Will impersonate YOUR account: ${yourAddress}`);

  // Use Hardhat's impersonation feature
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [yourAddress], // Pass the correctly formatted address
  });
  const signer = await ethers.getSigner(yourAddress);
  console.log(`   - Now using signer: ${signer.address}`);

  // Load deployed contract addresses
  const addressesPath = path.join(__dirname, "..", "deployedAddresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  // Get contract instances, now controlled by your impersonated account
  const piggyBank = await ethers.getContractAt("PiggyBank", addresses.PiggyBank, signer);
  const cCOP = new ethers.Contract(addresses.Tokens.cCOP, erc20Abi, signer);

  // Define deposit parameters
  const amountToDeposit = ethers.parseUnits("1", 18);
  const lockDays = 30;
  const safeMode = true;
  console.log(`\n💰 Preparing to deposit ${ethers.formatUnits(amountToDeposit, 18)} cCOP...`);

  // --- 2. APPROVE TRANSACTION ---
  console.log("\n▶️ STEP 1: Approving PiggyBank to spend cCOP...");
  try {
    const approveTx = await cCOP.approve(await piggyBank.getAddress(), amountToDeposit);
    console.log(`   - Approve transaction sent. Hash: ${approveTx.hash}`);
    await approveTx.wait();
    console.log("   - ✅ Approval successful!");
  } catch (err) {
    console.error("   - ❌ Approval failed!", err);
    return;
  }

  // --- 3. DEPOSIT TRANSACTION ---
  console.log("\n▶️ STEP 2: Calling the deposit function...");
  try {
    const depositTx = await piggyBank.deposit(amountToDeposit, lockDays, safeMode);
    console.log(`   - Deposit transaction sent. Hash: ${depositTx.hash}`);
    await depositTx.wait();
    console.log("   - ✅ Deposit successful!");
  } catch (err) {
    console.error("   - ❌ Deposit failed!", err);
    return;
  }

  console.log("\n🎉 Script finished successfully.");
}

main().catch((err) => {
  console.error("❌ A critical error occurred:", err);
  process.exit(1);
});