import { ethers, run } from "hardhat";

async function verifyContract(address: string, constructorArgs: any[] = []) {
  console.log(`Verifying: ${address}...`);
  try {
    await run("verify:verify", {
      address,
      constructorArguments: constructorArgs,
    });
    console.log(`✅ Verified: ${address}`);
  } catch (err: any) {
    if (err.message.includes("Already Verified")) {
      console.log(`ℹ️ Already verified: ${address}`);
    } else {
      console.error(`❌ Verification failed for ${address}:`, err.message);
    }
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy mock tokens
  const Token = await ethers.getContractFactory("MockERC20");
  const cCOP = await Token.deploy("Colombian Peso", "cCOP");
  await cCOP.waitForDeployment();

  const cUSD = await Token.deploy("USD Stable", "cUSD");
  await cUSD.waitForDeployment();

  const cREAL = await Token.deploy("Real", "cREAL");
  await cREAL.waitForDeployment();

  // Deploy Oracle
  const Oracle = await ethers.getContractFactory("MockFXOracle");
  const oracle = await Oracle.deploy();
  await oracle.waitForDeployment();

  // Deploy PiggyBank
  const PiggyBank = await ethers.getContractFactory("cPiggyBank");
  const piggy = await PiggyBank.deploy(
    await cCOP.getAddress(),
    await cUSD.getAddress(),
    await cREAL.getAddress()
  );
  await piggy.waitForDeployment();

  // Set Oracle
  await piggy.setOracle(await oracle.getAddress());

  // Output
  console.log("✅ Contracts deployed:");
  console.log("cCOP:   ", await cCOP.getAddress());
  console.log("cUSD:   ", await cUSD.getAddress());
  console.log("cREAL:  ", await cREAL.getAddress());
  console.log("Oracle: ", await oracle.getAddress());
  console.log("Piggy:  ", await piggy.getAddress());

  // Wait for contracts to be indexable
  console.log("⏳ Waiting for verifications...");
  await new Promise((res) => setTimeout(res, 30000));

  // Verify contracts
  await verifyContract(await cCOP.getAddress(), ["Colombian Peso", "cCOP"]);
  await verifyContract(await cUSD.getAddress(), ["USD Stable", "cUSD"]);
  await verifyContract(await cREAL.getAddress(), ["Real", "cREAL"]);
  await verifyContract(await oracle.getAddress());
  await verifyContract(await piggy.getAddress(), [
    await cCOP.getAddress(),
    await cUSD.getAddress(),
    await cREAL.getAddress(),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
