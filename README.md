🐷 cPiggyFX: Diversified FX Piggy Bank

"Save in cCOP, grow in the world."

cPiggyFX is a decentralized savings application built on the Celo blockchain that provides an easy and accessible way for users, particularly in Colombia, to gain exposure to foreign exchange markets. By depositing their Colombian Peso stablecoin (cCOP), users can automatically diversify their savings into US Dollar stablecoins (cUSD) for a fixed period, with the potential to earn returns based on FX rate appreciation.

This project was designed to be a low-friction, user-friendly alternative to complex DeFi tools, making FX savings accessible to everyone.
🚀 How It Works

The user flow is designed to be as simple as possible:

    Connect Wallet: Users connect their Celo-compatible wallet (e.g., Celo Wallet, Valora, MetaMask).

    Self Protocol Integration: In order to use the app, users must have verified accounts on self protocol. We are using off-chain verification.

    Create a Piggy: The user decides on an amount of cCOP to save and a lock-in duration (e.g., 30, 60, or 90 days).

    Choose a Mode:

        Standard Mode: A growth-focused strategy that swaps 40% of the deposit to cUSD and 30% to cEUR.

        Safe Mode: A capital-preservation strategy that swaps only 30% of the deposit into cUSD and 20% to cEUR, reducing FX risk.

    Lock & Diversify: The smart contract automatically executes the swap on the Mento Protocol, securing the user's diversified position.

    Track Progress: Users can view their active "piggies" on a dashboard, which shows the current value of their savings in real-time based on live Mento exchange rates.

    Claim: After the lock-in period ends, the user can claim their funds. The contract automatically swaps the cUSD portion back to cCOP and transfers the total amount back to the user's wallet.

🛠️ Technical Stack

    Frontend: Next.js, React, TypeScript, Tailwind CSS

    Blockchain Interaction: Wagmi, Viem, Ethers.js

    Smart Contracts: Solidity, Hardhat

    Core Protocol: Celo, Mento Protocol, Self Protocol

    The app also includes TuCop Wallet integration for columbian users, you can find it in the All wallets part:

🏁 Getting Started: Local Setup

Follow these instructions to set up and run the project on your local machine.
Prerequisites

    Node.js (v18 or later)

    Yarn or NPM

    Git

1. Contracts Setup

First, compile and deploy the smart contracts.

# 1. Clone the repository
git clone <your-repo-url>
cd <your-repo-folder>/Contracts

# 2. Install dependencies
npm install

# 3. Create an environment file in Contracts foler
 Create a .env file and add your private key and CeloScan API key
 PRIVATE_KEY="your wallet mnemonic phrase here"
 CELOSCAN_API_KEY="your celoscan api key"

# In Frontend Folder please also create a .env file with:
 NEXT_PUBLIC_PROJECT_ID="your reown appId for wallet integration"

# 4. Compile the contracts
npx hardhat compile

# 5. Deploy to the Celo network
# This will deploy the contracts and create a `deployedAddresses.json` file in the root `Contracts` directory.
npx hardhat run scripts/deploy.ts --network celo (with this you also approve the tokens for PiggyBank). This automatically sets up the contracts for the frontend

You can also skip the deployment, if you would like to use the already deployed addresses ( they are in the main contracts Folder as deployedAddresses.json ). If you go this way, you need to manually approve your cCOP and cUSD for the PiggyContract

2. Frontend Setup

Next, set up the Next.js frontend.

# 1. Navigate to the frontend directory (assuming it's the root)
cd .. 

# 2. Install dependencies
npm install

# 3. Run the development server
npm run dev

Open http://localhost:3000 in your browser to see the application. The frontend will automatically use the contract addresses from the deployedAddresses.json file.

Note: If you use the already deployed addresses without running the deploy script yourself, you must manually approve the PiggyBank contract to spend your cCOP and cUSD tokens for the application to function correctly.
💡 Future Ideas

This  is a MVP foundation. Future versions could include:

    Multi-Currency Baskets: Re-introducing cREAL, eXOF, and other Mento stablecoins as liquidity allows.

    Yield Integration: Staking the locked funds in protocols like cCOPStaking to generate additional yield for the user.

    Gamification: Allowing users to name their piggies or earn NFT-based badges for savings milestones.

    Gas Abstraction: Sponsoring transaction fees to create an even smoother user experience.

    Testing and adding more diversification strategies, seeing what works and provide more strategy for saving money

This project is a proof-of-concept and should not be used in a production environment without a full security audit.
