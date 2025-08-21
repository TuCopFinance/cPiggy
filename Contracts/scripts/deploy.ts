// scripts/deploy.ts
import { ethers, run } from "hardhat";
import fs from "fs";
import path from "path";

// A minimal ABI for the ERC20 approve function
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
  const cEUR = "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73";
  const cGBP = "0xCCF663b1fF11028f0b19058d0f7B674004a40746";
  const MENTO_BROKER_ADDRESS = "0x777A8255cA72412f0d706dc03C9D1987306B4CaD";
  const MENTO_EXCHANGE_PROVIDER = "0x22d9db95E6Ae61c104A7B6F6C78D7993B94ec901";
  const DEVELOPER_ADDRESS = deployer.address; // Using deployer as the developer fee recipient

  // --- Mento Exchange IDs for Celo Mainnet ---
  const EXCHANGE_ID_cCOP_cUSD = "0x1c9378bd0973ff313a599d3effc654ba759f8ccca655ab6d6ce5bd39a212943b";
  const EXCHANGE_ID_cUSD_cEUR = "0x746455363e8f55d04e0a2cc040d1b348a6c031b336ba6af6ae91515c194929c8";
  const EXCHANGE_ID_cUSD_cGBP = "0x6c369bfb1598b2f7718671221bc524c84874ad1ed7ba02a61121e7a06722e2ce";

  // 1. Deploy MentoOracleHandler
  const MentoOracleHandler = await ethers.getContractFactory("MentoOracleHandler");
  const oracle = await MentoOracleHandler.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log(`✅ MentoOracleHandler deployed to: ${oracleAddress}`);

  // 2. Deploy PiggyBank
  const PiggyBank = await ethers.getContractFactory("PiggyBank");
  // --- UPDATED: Constructor arguments now include cGBP, its exchange ID, and the developer address ---
  const constructorArgs = [
    MENTO_BROKER_ADDRESS,
    oracleAddress,
    MENTO_EXCHANGE_PROVIDER,
    cCOP,
    cUSD,
    cEUR,
    cGBP,
    EXCHANGE_ID_cCOP_cUSD,
    EXCHANGE_ID_cUSD_cEUR,
    EXCHANGE_ID_cUSD_cGBP,
    DEVELOPER_ADDRESS, // Added developer address
  ];
  const piggy = await PiggyBank.deploy(...constructorArgs);
  await piggy.waitForDeployment();
  const piggyAddress = await piggy.getAddress();
  console.log(`✅ PiggyBank deployed to: ${piggyAddress}`);

  // --- Approve PiggyBank to spend cCOP on behalf of the deployer ---
  console.log("💰 Approving PiggyBank to spend deployer's cCOP...");
  const approvalAmount = ethers.parseEther("1000"); // Approve a large amount for testing
  const cCOPContract = new ethers.Contract(cCOP, erc20Abi, deployer);

  try {
    const approveTx = await cCOPContract.approve(piggyAddress, approvalAmount);
    await approveTx.wait();
    console.log(`✅ Approved PiggyBank to spend cCOP for ${deployer.address}`);
  } catch (e) {
    console.error("❌ Failed to approve cCOP:", e);
  }
  
  // 3. Save deployed addresses to a file
  // --- UPDATED: Added cGBP and its exchange ID to the saved file ---
  const addresses = {
    PiggyBank: piggyAddress,
    MentoOracleHandler: oracleAddress,
    MentoBroker: MENTO_BROKER_ADDRESS,
    MentoExchangeProvider: MENTO_EXCHANGE_PROVIDER,
    Tokens: { cCOP, cUSD, cEUR, cGBP },
    MentoExchangeIDs: {
        cCOP_cUSD: EXCHANGE_ID_cCOP_cUSD,
        cUSD_cEUR: EXCHANGE_ID_cUSD_cEUR,
        cUSD_cGBP: EXCHANGE_ID_cUSD_cGBP,
    },
    Developer: DEVELOPER_ADDRESS,
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