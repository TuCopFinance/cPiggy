🐷 cPiggyFX: Diversified FX Piggy Bank

"Save in cCOP, grow in the world."

cPiggyFX is a decentralized savings application built on the Celo blockchain that provides an easy and accessible way for users, particularly in Colombia, to gain exposure to foreign exchange markets. By depositing their Colombian Peso stablecoin (cCOP), users can automatically diversify their savings into US Dollar stablecoins (cUSD) for a fixed period, with the potential to earn returns based on FX rate appreciation.

This project was designed to be a low-friction, user-friendly alternative to complex DeFi tools, making FX savings accessible to everyone.
🚀 How It Works

The user flow is designed to be as simple as possible:

    Connect Wallet: Users connect their Celo-compatible wallet (e.g., Celo Wallet, MetaMask).

    Self Protocol Integration: In order to use the app, users must have verified accounts on self protocol. We are using off-chain verification.

    Create a Piggy: The user decides on an amount of cCOP to save and a lock-in duration (e.g., 30, 60, or 90 days).

    Choose a Mode:

        Standard Mode: A growth-focused strategy that swaps 40% of the deposit to cUSD, 30% to cEUR and 10% to cGBP.

        Safe Mode: A capital-preservation strategy that swaps only 30% of the deposit into cUSD, 20% to cEUR and 10% to cGBP, reducing FX risk.

    Lock & Diversify: The smart contract automatically executes the swap on the Mento Protocol, securing the user's diversified position.

    Track Progress: Users can view their active "piggies" on a dashboard, which shows the current value of their savings in real-time based on live Mento exchange rates.

    Claim: After the lock-in period ends, the user can claim their funds. The contract automatically swaps the cUSD portion back to cCOP and transfers the total amount back to the user's wallet.


## This  is a MVP foundation. Future versions will include:

   - Multi-Currency Baskets: Re-introducing cREAL, eXOF, and other Mento stablecoins as liquidity allows.

   - Yield Integration: Staking the locked funds in protocols like cCOPStaking to generate additional yield for the user.

   - Gamification: Allowing users to name their piggies or earn NFT-based badges for savings milestones.

   - Gas Abstraction: Sponsoring transaction fees to create an even smoother user experience.

   - Testing and adding more diversification strategies, seeing what works and provide more strategy for saving money

## Proof of Ship Season 7 implementations:

- Added cGBP among the diversified tokens, swap available within app
- Added 1% developer fee, during user claiming assets back

## cPiggyBank Contract history:

- version 1: 0x64f5167cFA3Eb18DebD49F7074AD146AaE983F97
- version 1.1 (current): 0x765aeb85d160eb221Ab1D94506d6471f795763EC

## 📚 Documentation

For detailed technical documentation, please visit the [docs](./docs) folder:

- **[claude-context.md](./claude-context.md)** - Complete project context and architecture
- **[Documentation Index](./docs/readme.md)** - All technical guides and features
  - [AppKit Features](./docs/appkit-features.md) - Wallet integration features
  - [Farcaster Testing](./docs/farcaster-testing.md) - Mini App testing guide
  - [Language Implementation](./docs/language-implementation.md) - i18n guide

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Blockchain:** Celo, Ethereum (EVM)
- **Wallet:** Reown AppKit (WalletConnect v2)
- **Identity:** Self Protocol (off-chain verification)
- **Social:** Farcaster Mini App integration
- **Styling:** Tailwind CSS
- **i18n:** next-intl (English/Spanish)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- Celo wallet with cCOP

### Installation

```bash
# Clone repository
git clone https://github.com/TuCopFinance/cPiggy.git
cd cPiggy

# Install frontend dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

### Environment Variables

See [claude-context.md](./claude-context.md) for complete list of required environment variables.

## 🌐 Live Demo

- **Production:** [https://cpiggy.xyz](https://cpiggy.xyz)
- **Farcaster Mini App:** Available in Warpcast

## ⚠️ Disclaimer

This project is a proof-of-concept and should not be used in a production environment without a full security audit.
