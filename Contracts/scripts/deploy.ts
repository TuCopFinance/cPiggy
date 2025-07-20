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

  // Tokens on CELO mainnet
  const cCOP = "0x8A567e2aE79CA692Bd748aB832081C45de4041eA";
  const cUSD = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
  const cREAL = "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787";

  // Uniswap V2 (Ubeswap) Router on Celo Mainnet
  const UNISWAP_V2_ROUTER = "0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121";

  // Deploy Oracle
  const OracleHandler = await ethers.getContractFactory("UniswapOracleHandler");
  const oracle = await OracleHandler.deploy(UNISWAP_V2_ROUTER, cCOP, cUSD, cREAL);
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

  // Save deployed addresses
  const addresses = {
    UniswapOracleHandler: await oracle.getAddress(),
    PiggyBank: await piggy.getAddress(),
    Router: UNISWAP_V2_ROUTER,
    Tokens: { cCOP, cUSD, cREAL },
    Deployer: deployer.address,
  };

  const outputPath = path.join(__dirname, "..", "deployedAddresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log("📦 Saved deployed addresses to:", outputPath);

  // Wait before verification
  console.log("⏳ Waiting 30s before verifying...");
  await new Promise((res) => setTimeout(res, 30000));

  // Verify contracts
  await verifyContract(await oracle.getAddress(), [
    UNISWAP_V2_ROUTER,
    cCOP,
    cUSD,
    cREAL,
  ]);
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
