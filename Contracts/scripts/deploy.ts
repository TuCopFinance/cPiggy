// scripts/deploy.ts
import { ethers, run } from "hardhat";
import fs from "fs";
import path from "path";

async function verifyContract(address: string, constructorArgs: any[] = []) {
  console.log(`🔍 Verifying: ${address}`);
  try {
    await run("verify:verify", {
      address,
      constructorArguments: constructorArgs,
    });
    console.log(`✅ Verified: ${address}`);
  } catch (err: any) {
    if (err.message?.includes("Already Verified")) {
      console.log(`ℹ️ Already verified: ${address}`);
    } else {
      console.error(`❌ Verification failed for ${address}:`, err.message);
    }
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying with:", deployer.address);

  // ERC-20 addresses (Alfajores testnet)
  const cCOP = "0xe6A57340f0df6E020c1c0a80bC6E13048601f0d4";
  const cUSD = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
  const cREAL = "0xE4D517785D091D3c54818832dB6094bcc2744545";

  // Router for swaps (Ubeswap on Alfajores)
  const UBESWAP_ROUTER = "0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121";

  // Deploy UniswapOracleHandler
  const OracleHandler = await ethers.getContractFactory("UniswapOracleHandler");
  const oracle = await OracleHandler.deploy(UBESWAP_ROUTER, cCOP, cUSD, cREAL);
  await oracle.waitForDeployment();

  // Deploy PiggyBank
  const PiggyBank = await ethers.getContractFactory("PiggyBank");
  const piggy = await PiggyBank.deploy(
    await oracle.getAddress(),
    cCOP,
    cUSD,
    cREAL
  );
  await piggy.waitForDeployment();

  // Save addresses
  const addresses = {
    UniswapOracleHandler: await oracle.getAddress(),
    PiggyBank: await piggy.getAddress(),
    Router: UBESWAP_ROUTER,
    Tokens: { cCOP, cUSD, cREAL },
    Deployer: deployer.address,
  };

  const outputPath = path.join(__dirname, "..", "deployedAddresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log("📦 Saved deployed addresses to:", outputPath);

  // Delay before verification
  console.log("⏳ Waiting 30s before verifying...");
  await new Promise((res) => setTimeout(res, 30000));

  // Verify contracts
  await verifyContract(await oracle.getAddress(), [UBESWAP_ROUTER, cCOP, cUSD, cREAL]);
  await verifyContract(await piggy.getAddress(), [
    await oracle.getAddress(),
    cCOP,
    cUSD,
    cREAL,
  ]);

  console.log("✅ Deployment & verification complete.");
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
