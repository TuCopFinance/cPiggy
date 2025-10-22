🐷 cPiggyFX: Diversified FX Piggy Bank

"Save in cCOP, grow in the world."

cPiggyFX is a decentralized savings application built on the Celo blockchain that provides an easy and accessible way for users, particularly in Colombia, to gain exposure to foreign exchange markets. By depositing their Colombian Peso stablecoin (cCOP), users can automatically diversify their savings into US Dollar stablecoins (cUSD) for a fixed period, with the potential to earn returns based on FX rate appreciation.

This project was designed to be a low-friction, user-friendly alternative to complex DeFi tools, making FX savings accessible to everyone.

## 🚀 How It Works

### 1. **Connect Wallet**
Users connect their Celo-compatible wallet (MetaMask, WalletConnect, or Farcaster wallet). New users can also sign up with email or social login.

### 2. **Verify Identity**
Users verify their identity through Self Protocol's secure off-chain verification system by scanning a QR code.

### 3. **Create a Piggy**
Users decide on an amount of cCOP to save and a lock-in duration (30, 60, or 90 days).

### 4. **Choose a Strategy**

**Standard Mode (Growth-focused):**
- 20% cCOP, 40% cUSD, 30% cEUR, 10% cGBP
- Higher potential returns through FX exposure

**Safe Mode (Capital-preservation):**
- 40% cCOP, 30% cUSD, 20% cEUR, 10% cGBP
- Lower FX risk with more cCOP retained

### 5. **Lock & Diversify**
The smart contract automatically executes swaps on the Mento Protocol, securing the diversified position.

### 6. **Track Progress**
View active "piggies" on the dashboard with real-time value tracking based on live exchange rates.

### 7. **Claim Rewards**
After the lock-in period ends, claim funds. The contract automatically swaps foreign currencies back to cCOP and transfers to the user's wallet.


## 🔮 Future Roadmap

This is an MVP foundation. Future versions will include:

### Phase 2 Features
- **Multi-Currency Baskets** - cREAL, eXOF, and other Mento stablecoins
- **Yield Integration** - Stake locked funds for additional returns
- **Enhanced Diversification** - More strategy options based on user feedback

### Phase 3 Features
- **Gamification** - Named piggies and NFT badges for milestones
- **Gas Sponsorship** - Sponsored transactions for seamless UX
- **Social Features** - Savings goals sharing and challenges

### Phase 4 Features
- **Advanced Analytics** - Portfolio insights and projections
- **Automated Rebalancing** - Smart contract automation
- **Cross-chain Support** - Expand beyond Celo ecosystem

## 📜 Smart Contract Versions

| Version | Address | Status |
|---------|---------|--------|
| v1.0 | `0x64f5167cFA3Eb18DebD49F7074AD146AaE983F97` | Deprecated |
| **v1.1** | `0x765aeb85d160eb221Ab1D94506d6471f795763EC` | ✅ **Active** |

[View on Celoscan](https://celoscan.io/address/0x765aeb85d160eb221Ab1D94506d6471f795763EC)

## 📚 Documentation

### Core Documentation
- **[claude-context.md](./claude-context.md)** - Complete project context and architecture
- **[Documentation Index](./docs/readme.md)** - All technical guides

### Setup Guides
- **[Frontend Setup](./docs/frontend-setup.md)** - Frontend development guide
- **[Contracts Guide](./docs/contracts-guide.md)** - Smart contracts guide

### Features
- **[AppKit Features](./docs/appkit-features.md)** - Wallet & payment features
- **[Farcaster Testing](./docs/farcaster-testing.md)** - Mini App testing
- **[Language Support](./docs/language-implementation.md)** - i18n guide

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
