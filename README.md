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
| v1.1 | `0x765aeb85d160eb221Ab1D94506d6471f795763EC` | Deprecated |
| **v1.2** | `0x15a968d1efaCD5773679900D57E11799C4ac01Ce` | ✅ **Active** |

[View on Celoscan](https://celoscan.io/address/0x15a968d1efaCD5773679900D57E11799C4ac01Ce)

## 📚 Documentation

### Core Documentation
- **[claude-context.md](./claude-context.md)** - Complete project context and architecture
- **[Documentation Index](./docs/readme.md)** - All technical guides
- version 1: 0x64f5167cFA3Eb18DebD49F7074AD146AaE983F97
- version 1.1: 0x765aeb85d160eb221Ab1D94506d6471f795763EC
- version 1.2 (current): 0x15a968d1efaCD5773679900D57E11799C4ac01Ce

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
- Node.js 20.18.0+
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

**Required variables (create `.env.local` in `frontend/` directory):**

```bash
# Reown/WalletConnect Configuration
NEXT_PUBLIC_PROJECT_ID="your_reown_project_id_here"

# Self Protocol Configuration (identity verification)
NEXT_PUBLIC_SELF_APP_NAME="cPiggyFX"
NEXT_PUBLIC_SELF_SCOPE="your_unique_scope_here"
NEXT_PUBLIC_SELF_ENDPOINT="https://your-domain.com/api/verify"
```

**Getting your credentials:**

1. **Reown Project ID:**
   - Visit [https://cloud.reown.com](https://cloud.reown.com)
   - Create a new project
   - Copy the Project ID

2. **Self Protocol Configuration:**
   - Visit [https://docs.self.xyz](https://docs.self.xyz) for setup instructions
   - `SELF_SCOPE`: Create a unique identifier for your app (e.g., "myapp-prod")
   - `SELF_ENDPOINT`: Must be a publicly accessible URL (localhost won't work)
   - For local development, use a tunnel service (ngrok, Railway, etc.)

See [claude-context.md](./claude-context.md) for complete configuration details.

## 🔐 Self Protocol Identity Verification

cPiggyFX uses [Self Protocol](https://docs.self.xyz/) for secure, decentralized identity verification. Users must complete verification before creating investments.

### How It Works

The verification system automatically adapts to 4 different scenarios:

1. **Desktop Browser** - Shows QR code to scan with mobile Self app
2. **Mobile Browser** - Shows button that opens Self app directly
3. **Farcaster Web** - QR code for desktop Farcaster users
4. **Farcaster Mobile App** - Button that opens Self app and returns to miniapp

### Setup Requirements

**Node.js Version:** Self Protocol requires Node.js 22.x (enforced via `.nvmrc` and `package.json`)

**Environment Variables:**
```bash
NEXT_PUBLIC_SELF_APP_NAME="cPiggyFX"
NEXT_PUBLIC_SELF_SCOPE="your-unique-scope"
NEXT_PUBLIC_SELF_ENDPOINT="https://your-domain.com/api/verify"
```

**Important:** The endpoint MUST be publicly accessible (localhost won't work). For local development:
- Use Railway, Vercel, or similar for deployment
- Or use ngrok/localtunnel to expose localhost

### Testing Different Scenarios

**Desktop (QR Code):**
- Open app in desktop browser
- Connect wallet
- Navigate to verification page
- Scan QR with Self app on phone

**Mobile Browser (Button):**
- Open app in mobile browser (Safari/Chrome)
- Connect wallet
- Click "Open Self App to Verify" button
- Complete verification in Self app
- App automatically redirects back

**Farcaster Mobile (Miniapp Deep Link):**
- Open app in Warpcast mobile app
- Connect Farcaster wallet
- Click verification button
- Complete in Self app
- Returns to Farcaster miniapp

### Recent Fixes

1. **Warpcast Detection** - Added 'warpcast' to mobile user agent detection
2. **Wallet Address Extraction** - Fixed padding calculation in userContextData parsing
3. **Cross-Platform Deep Links** - Universal links work on both iOS and Android
4. **Mobile Debugging** - Added `/api/log-detection` endpoint for Railway logs

See `claude-context.md` for complete technical documentation of the verification flow.

## 🌐 Live Demo

- **Production:** [https://cpiggy.xyz](https://cpiggy.xyz)
- **Farcaster Mini App:** Available in Warpcast

## 🔢 Number Formatting Standard

**All monetary values use ISO international notation:**
- **Thousands:** period (`.`) - Example: 3.000 = three thousand
- **Decimals:** comma (`,`) - Example: 1.234,56 = one thousand point fifty-six

This prevents confusion and follows the standard used in Colombia and most of the world.

**Token Amount Display Rules:**

- **< 1:** 4 decimals (e.g., 0,8523)
- **< 1000:** 2 decimals (e.g., 156,75)
- **≥ 1000:** 0 decimals (e.g., 45.678)

**Important:** Formatting is for display only. All calculations maintain full precision.

## 📊 Oracle Integration

cPiggyFX uses Chainlink Price Feeds to display USD equivalents of token balances. These values are informative only and do not affect the actual token amounts stored in smart contracts.

**Why we use oracles:**

cPiggyFX is deployed on Celo and works with multiple Mento stablecoins (cCOP, cUSD, cEUR, cGBP). To provide users with informative USD equivalents of their token balances, we need real-time price data. However, not all required oracles are available on Celo:

- **cUSD** has a direct token oracle on Celo
- **COP/USD** FX rate oracle is available on Celo
- **EUR/USD and GBP/USD** FX rate oracles are NOT available on Celo

For EUR/USD and GBP/USD, we must query oracles from Base network since these feeds don't exist on Celo. Additionally, since there are no direct oracles for cCOP, cEUR, and cGBP tokens, we use their respective **FX reference rates** (COP/USD, EUR/USD, GBP/USD) as approximate price feeds.

### Oracle Configuration

**Direct Token Oracles:**

- **Celo Mainnet:**
  - **cUSD/USD** - Directly tracks cUSD token price
    - Contract: `0xe38A27BE4E7d866327e09736F3C570F256FFd048`
    - [Chainlink cUSD/USD Feed](https://data.chain.link/feeds/celo/mainnet/cusd-usd)

**FX Reference Rates** (no direct token oracles available):

- **Celo Mainnet:**
  - **COP/USD** - Used as reference for cCOP token
    - Contract: `0x97b770B0200CCe161907a9cbe0C6B177679f8F7C`
    - [Chainlink COP/USD Feed](https://data.chain.link/feeds/celo/mainnet/cop-usd)

- **Base Mainnet:**
  - **EUR/USD** - Used as reference for cEUR token
    - Contract: `0xc91D87E81faB8f93699ECf7Ee9B44D11e1D53F0F`
    - [Chainlink EUR/USD Feed](https://data.chain.link/feeds/base/mainnet/eur-usd)
  - **GBP/USD** - Used as reference for cGBP token
    - Contract: `0xCceA6576904C118037695eB71195a5425E69Fa15`
    - [Chainlink GBP/USD Feed](https://data.chain.link/feeds/base/mainnet/gbp-usd)

**Why Base for EUR/USD and GBP/USD?**

Base provides reliable, frequently updated FX reference rates with lower query costs compared to Ethereum mainnet.

**Note:** FX reference rates provide approximate USD equivalents for display purposes only.

### Implementation Details

Oracle data is fetched via custom React hooks that query Chainlink contracts:

- Hooks: `useCOPUSDRate`, `useCUSDUSDRate`, `useEURUSDRate`, `useGBPUSDRate`
- Components: `CCOPWithUSD`, `CUSDWithUSD`, `CEURWithUSD`, `CGBPWithUSD`
- Refresh interval: 60 seconds
- Stale time: 30 seconds

For complete oracle implementation details, see [claude-context.md](./claude-context.md).

## ⚠️ Disclaimer

This project is a proof-of-concept and should not be used in a production environment without a full security audit.
