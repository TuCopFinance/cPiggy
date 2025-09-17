import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      // For forking
      forking: {
        url: "https://forno.celo.org", // <-- This is the Celo Mainnet RPC
      }
    },
    celo: {
      url: "https://forno.celo.org",
      accounts: [process.env.PRIVATE_KEY!], // Use .env to keep your key safe
      chainId: 42220,
    },
    

  },
  etherscan: {
    apiKey: process.env.CELOSCAN_API_KEY!,

    customChains: [
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io",
        },
      },
    ],
  },
};

export default config;
