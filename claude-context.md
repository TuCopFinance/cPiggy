# cPiggyFX - Project Context Document

## Project Overview

**cPiggyFX** is a decentralized savings application built on the Celo blockchain that provides exposure to foreign exchange markets. Users in Colombia can save in Colombian Peso stablecoin (cCOP) while automatically diversifying into other stablecoins (cUSD, cEUR, cGBP) or earning fixed APY through time-locked staking.

**Tagline:** "Save in cCOP, grow in the world."

## Core Features

### 1. Diversified FX Savings (Piggy Bank)
- Users deposit cCOP for a fixed lock-in period (30, 60, or 90 days)
- Two risk modes:
  - **Safe Mode**: 40% cCOP, 30% cUSD, 20% cEUR, 10% cGBP (lower FX risk)
  - **Standard Mode**: 20% cCOP, 40% cUSD, 30% cEUR, 10% cGBP (higher growth potential)
- Automatic swapping via Mento Protocol
- Real-time value tracking based on live exchange rates
- 1% developer fee on profits (additional cost to protocol)

### 2. Fixed-Term APY Staking
- Lock cCOP for guaranteed returns with daily compounding
- Three duration options with different monthly rates:
- **30 days**: 1,25% monthly (16,08% EA)
- **60 days**: 1,5% monthly (19,56% EA)
- **90 days**: 2% monthly (26,82% EA)
- Pool-based system with maximum capacity limits
- Daily compound interest calibrated to exact monthly rates
- 5% developer fee on earned rewards (additional cost to protocol)
- Max deposit per wallet: 10.000.000 cCOP

### 3. Self Protocol Integration
- Off-chain identity verification required to use the app
- Users must verify through Self Protocol before creating investments

### 4. Farcaster Mini App Support
- Optimized UI for Farcaster Mini App environment
- Automatic wallet connection for Farcaster users
- Responsive design for mobile and desktop

## Technical Architecture

### Smart Contracts (Solidity 0.8.19)

#### Main Contract: `PiggyBank.sol`
**Location:** `contracts/contracts/cPiggyBank.sol`
**Deployed Address:** `0x15a968d1efaCD5773679900D57E11799C4ac01Ce` (Celo Mainnet)

**Key Components:**

1. **State Variables:**
   - Immutable token addresses (cCOP, cUSD, cEUR, cGBP)
   - Mento protocol interfaces (Broker, Exchange Provider)
   - Exchange IDs for swapping pairs
   - Developer fee recipient address

2. **Diversify Feature Structs:**
   ```solidity
   struct Piggy {
       address owner;
       uint256 initialAmount;
       uint256 cCOPAmount;
       uint256 cUSDAmount;
       uint256 cEURAmount;
       uint256 cGBPAmount;
       uint256 startTime;
       uint256 duration;
       bool safeMode;
       bool claimed;
   }
   ```

3. **Staking Feature Structs:**
   ```solidity
   struct StakingPool {
       uint256 totalStaked;
       uint256 maxTotalStake;
       uint256 totalRewardsFunded;
       uint256 totalRewardsPromised;
       uint256 duration;
   }

   struct StakingPosition {
       uint256 amount;
       uint256 startTime;
       uint256 duration;
       uint256 reward;
       bool claimed;
   }
   ```

4. **Main Functions:**
   - `deposit(amount, lockDays, safeMode)` - Create diversified piggy
   - `claim(index)` - Claim matured piggy
   - `stake(amount, duration)` - Create fixed-term stake
   - `unstake(index)` - Claim matured stake
   - `fundRewards(amount)` - Owner function to fund staking pools
   - `getRewardsOut()` - Owner function to withdraw excess funds
   - `getUserPiggies(user)` - View user's diversified positions
   - `getUserStakes(user)` - View user's staking positions
   - `getPiggyValue(user, index)` - Get current value of piggy
   - `getPoolInfo(duration)` - Get staking pool information

5. **Internal Logic:**
   - `_executeSwap()` - Handles Mento protocol swaps
   - Multi-step swap process: cCOP → cUSD → (cEUR/cGBP)
   - Proportional allocation based on risk mode
   - Compound interest calculations for staking

#### Supporting Contract: `MentoOracleHandler.sol`
**Location:** `contracts/contracts/MentoOracleHandler.sol`
**Deployed Address:** `0xc0fDe6b032d7a5A1446A73D38Fbe5a6b9D5B62D1`

**Purpose:** Provides allocation strategies for diversification

**Main Function:**
```solidity
function getSuggestedAllocation(uint256 totalAmount, bool isSafeMode)
    returns (uint256 cCOPToKeep, uint256 cCOPForUSD, uint256 cCOPForEUR, uint256 cCOPForGBP)
```

#### Interfaces: `interfaces.sol`
**Location:** `contracts/contracts/interfaces/interfaces.sol`

- `IMentoBroker` - Mento V2 Broker interface for swaps
- `IERC20` - Standard ERC20 token interface

### Frontend (Next.js 15 + React 19)

**Framework:** Next.js 15.3.3 with App Router
**Location:** `frontend/`

#### Key Dependencies:
- **Wallet/Web3:**
  - `@reown/appkit` (v1.7.15) - Wallet connection
  - `wagmi` (v2.12.31) - React hooks for Ethereum
  - `viem` (v2.31.3) - Ethereum utilities
  - `ethers` (v6.15.0) - Ethereum library

- **Farcaster:**
  - `@farcaster/miniapp-sdk` (v0.1.9)
  - `@farcaster/miniapp-wagmi-connector` (v1.0.0)

- **Identity:**
  - `@self.id/web` (v0.5.0)
  - `@selfxyz/core` (v1.0.7-beta.1)

- **UI:**
  - `tailwindcss` (v3.4.17)
  - `next-intl` (v4.3.4) - Internationalization
  - `lucide-react` (v0.525.0) - Icons

#### Page Structure:

1. **`/` (Home Page)** - `frontend/src/app/page.tsx`
   - Wallet connection
   - Self Protocol verification check
   - Navigation to create/dashboard
   - Farcaster Mini App detection and optimization

2. **`/create` (Create Investment)** - `frontend/src/app/create/page.tsx`
   - Investment type selection (Diversify vs Fixed-Term)
   - Amount and duration input
   - Risk mode selection (for diversify)
   - APY display (for fixed-term)
   - Two-step transaction: Approve → Deposit/Stake
   - Transaction status tracking

3. **`/dashboard` (View Investments)** - `frontend/src/app/dashboard/page.tsx`
   - Lists all user's piggies and stakes
   - Real-time value updates
   - Asset breakdown display
   - Claim/Unstake functionality
   - Time-until-maturity countdown

4. **`/self` (Verification)** - `frontend/src/app/self/page.tsx`
   - Self Protocol identity verification
   - Sets localStorage flag on success

5. **`/demo` (Language Demo)** - `frontend/src/app/demo/page.tsx`
   - Demonstrates i18n functionality

#### Key Components:

1. **`ConnectButton.tsx`**
   - Wallet connection UI
   - Address display in compact mode
   - Network switching

2. **`FarcasterConnectButton.tsx`**
   - Specialized connector for Farcaster Mini App

3. **`LanguageSwitcher.tsx`**
   - Toggle between English/Spanish

4. **`MiniAppLayout.tsx`**
   - Layout wrapper for Farcaster Mini App
   - Responsive adjustments

#### Contexts:

1. **`FarcasterContext.tsx`**
   - Detects Farcaster Mini App environment
   - Auto-connects Farcaster wallet
   - Provides SDK access for sharing/actions
   - Manages `markReady()` lifecycle

2. **`LanguageContext.tsx`**
   - Manages current locale state
   - Provides translation function `t(key)`
   - Auto-detects user language preference

#### Hooks:

1. **`useMiniAppDetection.ts`**
   - Detects if running in Farcaster Mini App
   - Multiple detection methods (SDK, user agent, referrer)

2. **`useLanguageDetection.ts`**
   - Detects user's preferred language
   - Persists selection to localStorage

3. **`useClientMount.ts`**
   - Ensures client-side only rendering

#### Configuration:

**`config/index.ts`** - Wagmi/AppKit configuration
- Network: Celo Mainnet + Celo Sepolia Testnet (chainId: 11142220)
- Connectors: Injected, WalletConnect, Farcaster Mini App
- Project ID for Reown/WalletConnect

**`lib/deployedAddresses.json`** - Contract addresses and constants
- All deployed contract addresses
- Token addresses (cCOP, cUSD, cEUR, cGBP)
- Mento Exchange IDs
- Developer address

#### Internationalization (i18n):

**Supported Languages:** English (`en`), Spanish (`es`)
**Location:** `frontend/src/i18n/locales/`

Translation structure example:
```json
{
  "home": {
    "title": "cPiggyFX",
    "subtitle": "Diversified FX Piggy Bank",
    "createPiggy": "Create Piggy",
    "viewPiggies": "View My Piggies"
  },
  "create": {
    "title": "Create Investment",
    "depositAmount": "Deposit Amount",
    "lockDuration": "Lock Duration"
  }
}
```

### Blockchain Integration

#### Celo Mainnet Addresses:

**Deployed Contracts:**
- PiggyBank: `0x15a968d1efaCD5773679900D57E11799C4ac01Ce`
- MentoOracleHandler: `0xc0fDe6b032d7a5A1446A73D38Fbe5a6b9D5B62D1`

**Mento Protocol:**
- Broker: `0x777A8255cA72412f0d706dc03C9D1987306B4CaD`
- Exchange Provider: `0x22d9db95E6Ae61c104A7B6F6C78D7993B94ec901`

**Stablecoins:**
- cCOP: `0x8A567e2aE79CA692Bd748aB832081C45de4041eA`
- cUSD: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- cEUR: `0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73`
- cGBP: `0xCCF663b1fF11028f0b19058d0f7B674004a40746`

**Exchange IDs:**
- cCOP/cUSD: `0x1c9378bd0973ff313a599d3effc654ba759f8ccca655ab6d6ce5bd39a212943b`
- cUSD/cEUR: `0x746455363e8f55d04e0a2cc040d1b348a6c031b336ba6af6ae91515c194929c8`
- cUSD/cGBP: `0x6c369bfb1598b2f7718671221bc524c84874ad1ed7ba02a61121e7a06722e2ce`

#### Transaction Flow:

**Creating a Diversified Piggy:**
1. User approves PiggyBank to spend cCOP
2. User calls `deposit(amount, lockDays, safeMode)`
3. Contract receives cCOP
4. Contract swaps portion to cUSD via Mento
5. Contract swaps portions of cUSD to cEUR and cGBP
6. Piggy struct stored with all balances
7. Event `PiggyCreated` emitted

**Claiming a Piggy:**
1. User calls `claim(index)` after lock period
2. Contract swaps cEUR → cUSD
3. Contract swaps cGBP → cUSD
4. Contract swaps all cUSD → cCOP
5. Calculate profit and 1% developer fee
6. Transfer full amount to user + fee to developer
7. Event `PiggyClaimed` emitted

**Creating a Stake:**
1. User approves PiggyBank to spend cCOP
2. User calls `stake(amount, duration)`
3. Contract calculates reward using compound interest
4. Contract checks pool capacity and funding
5. Stake position created
6. Event `StakeCreated` emitted

**Claiming a Stake:**
1. User calls `unstake(index)` after lock period
2. Calculate 5% developer fee on reward
3. Transfer principal + full reward to user
4. Transfer fee to developer
5. Update pool state
6. Event `StakeClaimed` emitted

## Development Setup

### Smart Contracts:

**Directory:** `contracts/`

**Setup:**
```bash
cd contracts
npm install
```

**Environment Variables (.env):**
```
PRIVATE_KEY=<deployer_private_key>
CELOSCAN_API_KEY=<api_key>
```

**Commands:**
- Compile: `npx hardhat compile`
- Test: `npx hardhat test`
- Deploy: `npx hardhat run scripts/deploy.ts --network celo`

**Hardhat Configuration:**
- Solidity Version: 0.8.20
- Networks: Hardhat (forking Celo), Celo Mainnet
- Etherscan: Celoscan integration

### Frontend:

**Directory:** `frontend/`

**Setup:**
```bash
cd frontend
npm install
```

**Environment Variables:**
```
NEXT_PUBLIC_PROJECT_ID=<reown_project_id>
```

**Commands:**
- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm start`
- Lint: `npm run lint`

## Key Business Logic

### Fee Structure:

**IMPORTANT:** Fees are NOT deducted from user returns. The protocol pays developer fees as an additional cost.

1. **Diversified Piggies:**
   - **User fee:** 0% (users receive 100% of their returns)
   - **Developer fee:** 1% of profits (paid by protocol as additional transfer)
- **How it works:**
  - User deposits 10.000.000 cCOP
  - Final return: 10.500.000 cCOP (500.000 profit)
  - User receives: 10.500.000 cCOP (100% of return)
  - Developer receives: 5.000 cCOP (1% of 500.000 profit, paid separately by protocol)
  - Total protocol cost: 10.505.000 cCOP
   - If loss occurs, no fee is charged

2. **Fixed-Term Staking:**
   - **User fee:** 0% (users receive 100% of promised returns)
   - **Developer fee:** 5% of earned rewards (paid by protocol as additional transfer)
- **How it works:**
  - User deposits 10.000.000 cCOP in 30-day pool
  - Interest earned: 125.000 cCOP
  - User receives: 10.125.000 cCOP (principal + 100% of interest)
  - Developer receives: 6.250 cCOP (5% of 125.000 interest, paid separately by protocol)
  - Total protocol cost: 10.131.250 cCOP
   - Principal is always returned in full
   - Promised interest rate is always delivered to user

### Staking Pool Economics:

**Pool Capacities:**
- 30-day pool: 3.200.000.000 cCOP max
- 60-day pool: 1.157.981.803 cCOP max
- 90-day pool: 408.443.341 cCOP max

**Reward Distribution (when funding):**
- 30-day pool: 30% of total funding
- 60-day pool: 35% of total funding
- 90-day pool: 35% of total funding

**Interest Calculation:**
- Uses daily compound interest formula: `Final = Principal × (1 + r_daily)^days`
- Daily rates calibrated to achieve exact monthly targets:
- 30d: 1,25% monthly (16,08% EA) = 0,0414% daily compounded
- 60d: 1,5% monthly (19,56% EA) = 0,0496% daily compounded
- 90d: 2% monthly (26,82% EA) = 0,0660% daily compounded
- Interest compounds daily for precision and future early withdrawal support
- Smart contract constants (UD60x18 format):
  - 30d: 1000414169744566162 (gives exactly 1.25% in 30 days)
  - 60d: 1000496410253934644 (gives exactly 1.5% per 30 days)
  - 90d: 1000660305482286662 (gives exactly 2% per 30 days)
- Example: 10.000.000 cCOP in 90-day pool:
  - Month 1: 10.200.000 (+200.000)
  - Month 2: 10.404.000 (+204.000)
  - Month 3: 10.612.080 (+208.080)
  - Total interest: 612.080 cCOP (6,1208%)

### Risk Modes Allocation:

**Safe Mode (Lower Risk):**
- 40% stays in cCOP (home currency)
- 30% swapped to cUSD
- 20% swapped to cEUR
- 10% swapped to cGBP

**Standard Mode (Higher Growth):**
- 20% stays in cCOP
- 40% swapped to cUSD
- 30% swapped to cEUR
- 10% swapped to cGBP

## Security Considerations

1. **Contract Ownership:**
   - PiggyBank uses OpenZeppelin's Ownable
   - Owner can fund/withdraw rewards
   - Owner cannot access user funds

2. **Lock Periods:**
   - Enforced on-chain via timestamp checks
   - No early withdrawal mechanism

3. **Swap Safety:**
   - Uses Mento's `getAmountOut` for minimum amounts
   - Prevents sandwich attacks
   - Try-catch for view functions to prevent reverts

4. **Pool Limits:**
   - Per-wallet limits enforced (10M cCOP)
   - Pool capacity limits enforced
   - Rewards must be funded before stakes accepted

## Future Roadmap (from README)

- Multi-currency baskets (cREAL, eXOF)
- Yield integration (cCOPStaking)
- Gamification (NFT badges, piggy naming)
- Gas abstraction (fee sponsorship)
- Additional diversification strategies
- Enhanced testing and strategy optimization

## Version History

**Contract Versions:**
- v1.0: `0x64f5167cFA3Eb18DebD49F7074AD146AaE983F97` (Deprecated)
- v1.1: `0x765aeb85d160eb221Ab1D94506d6471f795763EC` (Deprecated)
- v1.2 (current): `0x15a968d1efaCD5773679900D57E11799C4ac01Ce`

Note: The address in deployedAddresses.json shows v1.2 deployment.

**Recent Updates (v1.2):**
- Added cGBP to diversification strategy
- Implemented 1% developer fee on profits (paid by protocol)
- Added fixed-term staking feature with compound interest APY

## Token Display and Number Formatting Standards

### Understanding Tokens vs Currencies

**CRITICAL CONCEPT:**

- **cCOP, cUSD, cEUR, cGBP are ERC20 TOKENS**, not currencies
- They are digital representations of currencies on the blockchain
- We query token balances from the blockchain (not currency amounts)
- We format token quantities for display in the UI
- We use oracles to find USD equivalents for informative display only

**Token Information:**
```
cCOP - Colombian Peso token (18 decimals)
cUSD - US Dollar token (18 decimals)
cEUR - Euro token (18 decimals)
cGBP - British Pound token (18 decimals)
```

### Number Display Format Rules

**CRITICAL - ALL TOKEN DISPLAYS MUST FOLLOW THESE RULES:**

**Display format based on token amount:**
- **< 1**: 4 decimals (e.g., 0,8523 cCOP)
- **< 1000**: 2 decimals (e.g., 156,75 cCOP)
- **>= 1000**: 0 decimals (e.g., 45.678 cCOP)

**Notation standard (ISO international):**
- **Thousands separator:** `.` (punto/period)
- **Decimal separator:** `,` (coma/comma)

**Examples:**
```
0,8523 cCOP        = less than 1 token (4 decimals)
156,75 cCOP        = one hundred fifty-six tokens (2 decimals)
3.000 cCOP         = three thousand tokens (0 decimals)
10.000.000 cCOP    = ten million tokens (0 decimals)
```

**USD equivalent displays:**
```
1.234 cCOP (≈ $3,21)
850,50 cEUR (≈ $920,14)
```

### Implementation Details

**Core utilities location:** `frontend/src/utils/formatCurrency.ts`

**Main function:**
```typescript
formatTokenAmount(amount: number): string
// Returns formatted string for UI display
// Automatically applies correct decimal places based on amount
```

**Helper functions:**
```typescript
bigIntToNumber(amount: bigint, decimals?: number): number
// Converts blockchain BigInt to number with FULL PRECISION
// Used for calculations - DO NOT format this value

numberToBigInt(amount: number, decimals?: number): bigint
// Converts number back to BigInt for blockchain transactions
```

**CRITICAL RULES:**

1. **Calculations always use full precision:**
   ```typescript
   // ✅ CORRECT
   const balance = bigIntToNumber(balanceFromContract); // 1234.567891234567
   const doubled = balance * 2; // Calculate with full precision
   const display = formatTokenAmount(doubled); // Format only for display

   // ❌ WRONG
   const display = formatTokenAmount(balance); // "1.234"
   const doubled = parseFloat(display) * 2; // Lost precision!
   ```

2. **Formatting is ONLY for UI display:**
   - Never use formatted strings in calculations
   - Always keep raw numbers/BigInts for math
   - Format at the last possible moment (in JSX)

3. **Token components with USD equivalents:**
   - `<CCOPWithUSD ccopAmount={number} />` - Shows cCOP + USD via COP/USD oracle
   - `<CEURWithUSD ceurAmount={number} />` - Shows cEUR + USD via EUR/USD oracle
   - `<CGBPWithUSD cgbpAmount={number} />` - Shows cGBP + USD via GBP/USD oracle
   - For cUSD: Use 1:1 conversion (1 cUSD = $1 USD)

4. **Locale configuration:**
   ```typescript
   // ✅ ALWAYS USE
   amount.toLocaleString('de-DE', { ... })

   // ❌ NEVER USE
   amount.toLocaleString('en-US', { ... }) // Wrong separators!
   amount.toLocaleString('es-CO', { ... }) // Be consistent, use de-DE
   ```

### Oracle Integration

**Purpose:** Show USD equivalents for informative display using real-time Chainlink price feeds

**Why we use oracles:**

cPiggyFX is deployed on Celo and works with multiple Mento stablecoins (cCOP, cUSD, cEUR, cGBP). To provide users with informative USD equivalents of their token balances, we need real-time price data. However, not all required oracles are available on Celo:

- **cUSD** has a direct token oracle on Celo
- **COP/USD** FX rate oracle is available on Celo
- **EUR/USD and GBP/USD** FX rate oracles are NOT available on Celo

For EUR/USD and GBP/USD, we must query oracles from Base network since these feeds don't exist on Celo. Additionally, since there are no direct oracles for cCOP, cEUR, and cGBP tokens, we use their respective **FX reference rates** (COP/USD, EUR/USD, GBP/USD) as approximate price feeds.

**Chainlink Oracles Configuration:**

**Direct Token Oracles:**

- **Celo Mainnet:**
  - **cUSD/USD** - Directly tracks cUSD token price
    - Contract: `0x022F9dCC73C5Fb43F2b4eF2EF9ad3eDD1D853946`
    - [Chainlink cUSD/USD Feed](https://data.chain.link/feeds/celo/mainnet/cusd-usd)

**FX Reference Rates** (no direct token oracles available):

- **Celo Mainnet:**
  - **COP/USD** - Used as reference for cCOP token
    - Contract: `0x023c18f4b9b75a0D18219126C2c5ad75235EE320`
    - [Chainlink COP/USD Feed](https://data.chain.link/feeds/celo/mainnet/cop-usd)

- **Base Mainnet:**
  - **EUR/USD** - Used as reference for cEUR token
    - Contract: `0xc5C8E77B397E531B8EC06BFb0048328B30E9eCfB`
    - [Chainlink EUR/USD Feed](https://data.chain.link/feeds/base/mainnet/eur-usd)
  - **GBP/USD** - Used as reference for cGBP token
    - Contract: `0x91FAB41F5f3bE955963a986366edAcff1aaeaa83`
    - [Chainlink GBP/USD Feed](https://data.chain.link/feeds/base/mainnet/gbp-usd)

**Implementation Details:**

- **Hooks Location:** `frontend/src/hooks/use[TOKEN]USDRate.ts`
  - `useCOPUSDRate.ts` - Fetches COP/USD rate from Celo
  - `useCUSDUSDRate.ts` - Fetches cUSD/USD rate from Celo
  - `useEURUSDRate.ts` - Fetches EUR/USD rate from Base
  - `useGBPUSDRate.ts` - Fetches GBP/USD rate from Base

- **Components Location:** `frontend/src/components/[TOKEN]WithUSD.tsx`
  - `CCOPWithUSD.tsx` - Displays cCOP with USD equivalent
  - `CUSDWithUSD.tsx` - Displays cUSD with USD equivalent
  - `CEURWithUSD.tsx` - Displays cEUR with USD equivalent
  - `CGBPWithUSD.tsx` - Displays cGBP with USD equivalent

**Oracle Query Settings:**
- Refresh interval: 60 seconds (1 minute)
- Stale time: 30 seconds
- Decimals: Fetched once per oracle (cached indefinitely)

**Usage in components:**
- Token amounts are calculated with full precision
- Oracle rates are fetched from Chainlink via `useReadContract` from wagmi
- USD equivalents are calculated: `tokenAmount * oracleRate`
- Both values are formatted for display using `formatTokenAmount()` and `formatUSD()`

**Why different networks?**

**Direct Token Oracles:**

- **Celo:**
  - cUSD/USD - Directly tracks cUSD token price

**FX Reference Rates** (no direct token oracles available):

- **Celo:**
  - COP/USD - Used as reference for cCOP token

- **Base:**
  - EUR/USD - Used as reference for cEUR token
  - GBP/USD - Used as reference for cGBP token

**Why Base for EUR/USD and GBP/USD?**

Base provides reliable, frequently updated FX reference rates with lower query costs compared to Ethereum mainnet.

**Note:** FX reference rates provide approximate USD equivalents for display purposes only. The actual token amounts remain precise and unaffected by oracle values.

**Example flow:**
```typescript
// 1. Get token balance from blockchain (BigInt with 18 decimals)
const balanceBigInt = 1500000000000000000n; // 1.5 tokens

// 2. Convert to number (keep full precision for calculations)
const balanceNumber = bigIntToNumber(balanceBigInt); // 1.5

// 3. Calculate USD equivalent using oracle
const copUsdRate = 0.00026; // from oracle
const usdValue = balanceNumber * copUsdRate; // 0.00039

// 4. Format both values for display
const displayCOP = formatTokenAmount(balanceNumber); // "1,50"
const displayUSD = formatUSD(usdValue); // "$0.00"
```

### Why This Matters

1. **Prevents confusion:** 3.000 clearly means three thousand (not 3 with decimals)
2. **International standard:** Used in Europe, Latin America, and most of the world
3. **Professional appearance:** Financial apps should use proper notation
4. **User expectations:** Colombian users expect this format
5. **Calculation accuracy:** Full precision maintained until final display
6. **Token clarity:** Users understand they're dealing with blockchain tokens

### Files Using These Standards

**Utilities:**
- `frontend/src/utils/formatCurrency.ts` - Core formatting functions

**Components:**
- `frontend/src/components/CCOPWithUSD.tsx` - cCOP token display
- `frontend/src/components/CEURWithUSD.tsx` - cEUR token display
- `frontend/src/components/CGBPWithUSD.tsx` - cGBP token display
- `frontend/src/components/ConnectButton.tsx` - Wallet balance display

**Pages:**
- `frontend/src/app/create/page.tsx` - Investment creation
- `frontend/src/app/dashboard/page.tsx` - Portfolio view

**All these files:**
- Use `formatTokenAmount()` for display
- Keep full precision in calculations
- Show USD equivalents via oracle components
- Follow ISO international notation

## Important Notes

⚠️ **This is a proof-of-concept MVP** - Should not be used in production without full security audit.

## Contract ABI Locations

- PiggyBank ABI: `frontend/lib/artifacts/contracts/cPiggyBank.sol/PiggyBank.json`
- MentoOracleHandler ABI: Available in artifacts

## Common Development Patterns

### Reading Contract Data:
```typescript
const { data: piggies } = useReadContract({
  address: piggyBankAddress,
  abi: PiggyBankABI.abi,
  functionName: 'getUserPiggies',
  args: [userAddress],
});
```

### Writing to Contract:
```typescript
const { writeContractAsync } = useWriteContract();
await writeContractAsync({
  address: piggyBankAddress,
  abi: PiggyBankABI.abi,
  functionName: 'deposit',
  args: [amount, duration, safeMode],
});
```

### Watching Transactions:
```typescript
const { isSuccess } = useWaitForTransactionReceipt({
  hash: txHash,
});
```

## Testing Strategy

- Unit tests for smart contracts in `contracts/test/`
- Forking Celo mainnet for realistic testing
- Mock contracts for Mento protocol (`contracts/mocks/`)
- Frontend testing via manual QA in development

## Deployment Process

1. Configure environment variables
2. Run `deploy.ts` script
3. Script automatically:
   - Deploys MentoOracleHandler
   - Deploys PiggyBank with all parameters
   - Approves initial cCOP allowance
   - Saves addresses to JSON
   - Verifies contracts on Celoscan

## Key Technical Decisions

1. **Why two separate features?**
   - Diversify: For FX exposure and potential appreciation
   - Staking: For guaranteed fixed returns
   - Different user risk appetites

2. **Why Mento Protocol?**
   - Native Celo stablecoin DEX
   - Deep liquidity
   - Low slippage
   - Trusted by Celo ecosystem

3. **Why Self Protocol?**
   - Required for regulatory compliance
   - Off-chain verification
   - Privacy-preserving

4. **Why Farcaster support?**
   - Growing Web3 social platform
   - Mobile-first user base
   - Colombian crypto community presence

5. **Why Next.js 15?**
   - App Router for better performance
   - Server components support
   - Built-in optimization

This context document should provide comprehensive understanding of the cPiggyFX project for development, debugging, and feature additions.
