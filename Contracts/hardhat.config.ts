import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    celo: {
      url: "https://forno.celo.org",
      accounts: [process.env.PRIVATE_KEY!], // Use .env to keep your key safe
      chainId: 42220,
    },
  },
  etherscan: {
  apiKey: {
    celo: process.env.CELOSCAN_API_KEY!,
  },
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
