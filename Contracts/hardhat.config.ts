import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: [process.env.PRIVATE_KEY!], // Use .env to keep your key safe
      chainId: 44787,
      gasPrice: 5000000000,
    },
  },
  etherscan: {
  apiKey: {
    alfajores: process.env.CELOSCAN_API_KEY!,
  },
  customChains: [
    {
      network: "alfajores",
      chainId: 44787,
      urls: {
        apiURL: "https://api-alfajores.celoscan.io/api",
        browserURL: "https://alfajores.celoscan.io",
      },
    },
  ],
},
};

export default config;
