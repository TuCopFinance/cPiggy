// scripts/check-mento.ts
import { ethers } from "hardhat";

// The Mento Broker interface with the correct getAmountOut function
const mentoBrokerAbi = [
  "function getAmountOut(address exchangeId, address tokenIn, address tokenOut, uint256 amountIn) external view returns (uint256)"
];

async function main() {
  console.log("🚀 Querying Mento Protocol...");

  // Mento V2 Contracts on Celo Mainnet
  const MENTO_BROKER_ADDRESS = "0x777A8255cA72412f0d706dc03C9D1987306B4CaD";
  const MENTO_BIPOOL_MANAGER_ADDRESS = "0x22d9db95E6Ae61c104A7B6F6C78D7993B94ec901";

  // Tokens on CELO mainnet
  const CCOP_ADDRESS = "0x8A567e2aE79CA692Bd748aB832081C45de4041eA";
  const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a";

  const amountIn = ethers.parseUnits("1", 18); // 1 cCOP

  // exchangeId of cCOP and cUSD
  const exchangeId = "0x1c9378bd0973ff313a599d3effc654ba759f8ccca655ab6d6ce5bd39a212943b"

  // Get a provider to connect to the network
  const provider = ethers.provider;

  // Create an instance of the Mento Broker contract
  const mentoBroker = new ethers.Contract(MENTO_BROKER_ADDRESS, mentoBrokerAbi, provider);
  const biPoolManager = new ethers.Contract(MENTO_BIPOOL_MANAGER_ADDRESS, mentoBrokerAbi, provider)

  console.log(`\nChecking price for 1 cCOP -> cUSD...`);
  try {
    const amountOut = await biPoolManager.getAmountOut(
      exchangeId,
      CCOP_ADDRESS,
      CUSD_ADDRESS,
      amountIn
    );
    console.log(`✅ Mento would return: ${ethers.formatUnits(amountOut, 18)} cUSD`);
  } catch (err) {
    console.error("❌ Failed to get price quote from Mento!", err);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});