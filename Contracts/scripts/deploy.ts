import { ethers, run } from "hardhat";
import fs from "fs";
import path from "path";

// A minimal ABI for ERC20 approve function
const erc20Abi = [
  "function approve(address spender, uint256 amount) public returns (bool)",
];

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

  // --- Addresses for Celo Mainnet ---
  const cCOP = "0x8A567e2aE79CA692Bd748aB832081C45de4041eA";
  const cUSD = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
  const MENTO_BROKER_ADDRESS = "0x777A8255cA72412f0d706dc03C9D1987306B4CaD";
  const MENTO_EXCHANGE_PROVIDER = "0x22d9db95E6Ae61c104A7B6F6C78D7993B94ec901";

  // --- Mento Exchange ID for the cCOP/cUSD pool on Celo Mainnet ---
  const EXCHANGE_ID_cCOP_cUSD = "0x1c9378bd0973ff313a599d3effc654ba759f8ccca655ab6d6ce5bd39a212943b";

  // 1. Deploy MentoOracleHandler
  const MentoOracleHandler = await ethers.getContractFactory("MentoOracleHandler");
  const oracle = await MentoOracleHandler.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log(`✅ MentoOracleHandler deployed to: ${oracleAddress}`);

  // 2. Deploy PiggyBank
  const PiggyBank = await ethers.getContractFactory("PiggyBank");
  const constructorArgs = [
    MENTO_BROKER_ADDRESS,
    oracleAddress,
    MENTO_EXCHANGE_PROVIDER,
    cCOP,
    cUSD,
    EXCHANGE_ID_cCOP_cUSD,
  ];
  const piggy = await PiggyBank.deploy(...constructorArgs);
  await piggy.waitForDeployment();
  const piggyAddress = await piggy.getAddress();
  console.log(`✅ PiggyBank deployed to: ${piggyAddress}`);

  // --- NEW: Approve PiggyBank to spend tokens on behalf of the deployer ---
  console.log("💰 Approving PiggyBank to spend tokens...");
  const approvalAmount = ethers.parseEther("10"); // Approving 10 tokens

  // Get token contract instances
  const cCOPContract = new ethers.Contract(cCOP, erc20Abi, deployer);
  const cUSDContract = new ethers.Contract(cUSD, erc20Abi, deployer);

  // Approve cCOP
  try {
    const approveTxCCOP = await cCOPContract.approve(piggyAddress, approvalAmount);
    await approveTxCCOP.wait();
    console.log(`✅ Approved PiggyBank to spend 10 cCOP`);
  } catch (e) {
    console.error("❌ Failed to approve cCOP:", e);
  }

  // Approve cUSD
  try {
    const approveTxCUSD = await cUSDContract.approve(piggyAddress, approvalAmount);
    await approveTxCUSD.wait();
    console.log(`✅ Approved PiggyBank to spend 10 cUSD`);
  } catch (e) {
    console.error("❌ Failed to approve cUSD:", e);
  }
  // --- End of new approval section ---


  // 3. Save deployed addresses to a file
  const addresses = {
    PiggyBank: piggyAddress,
    MentoOracleHandler: oracleAddress,
    MentoBroker: MENTO_BROKER_ADDRESS,
    MentoExchangeProvider: MENTO_EXCHANGE_PROVIDER,
    Tokens: { cCOP, cUSD },
    Deployer: deployer.address,
  };

  const outputPath = path.join(__dirname, "..", "deployedAddresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log("📦 Saved deployed addresses to:", outputPath);

  // 4. Wait before verification
  console.log("⏳ Waiting 10s before verifying...");
  await new Promise((res) => setTimeout(res, 10000));

  // 5. Verify contracts on the block explorer
  await verifyContract(oracleAddress, []);
  await verifyContract(piggyAddress, constructorArgs);

  console.log("✅ Deployment & verification complete.");
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});