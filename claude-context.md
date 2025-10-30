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

**Purpose:** Off-chain identity verification required to use the app

**Documentation:**
- Official Docs: https://docs.self.xyz/
- GitHub: https://github.com/selfxyz/self
- Playground Example: https://github.com/selfxyz/playground

**NPM Packages:**
- `@selfxyz/core@1.1.0-beta.7` - Backend verification (Node >=22 <23)
- `@selfxyz/qrcode@1.0.15` - Frontend QR/button component (Node >=22 <23)

**Important:** Self Protocol requires Node.js version 22.x. This is enforced via:
- `frontend/.nvmrc` - Contains `22`
- `frontend/package.json` - engines field specifies `>=22.0.0 <23.0.0`

#### Overview

Users must complete Self Protocol identity verification before creating investments. The system works across 4 different scenarios with smart device detection and appropriate UI/UX for each.

#### The 4 Verification Scenarios

**1. Desktop Browser (Standard Web)**
- **Detection:** No touch support, desktop user agent
- **UI:** QR code displayed via `SelfQRcodeWrapper`
- **Flow:** User scans QR with Self app on mobile → Verification happens → QR wrapper detects success via `onSuccess` callback → Redirect to home
- **Callback URL:** Empty string (no redirect needed, user stays on page)
- **Files:** `frontend/src/app/self/page.tsx` (lines 497-507)

**2. Mobile Browser (Safari, Chrome Mobile)**
- **Detection:** Mobile user agent, touch support, NOT in Farcaster
- **UI:** Button to open Self app
- **Flow:** User clicks button → Opens Self app via universal link → User completes verification → Returns to browser via callback URL → Polling detects verification → Redirect to home
- **Callback URL:** `${window.location.origin}/self?callback=true` (e.g., `https://cpiggy.xyz/self?callback=true`)
- **Polling:** 3-second intervals for up to 5 minutes
- **Files:** `frontend/src/app/self/page.tsx` (lines 467-496, 312-359)

**3. Farcaster Web (Desktop browser inside Farcaster)**
- **Detection:** Farcaster SDK available, desktop user agent
- **UI:** QR code displayed
- **Flow:** Same as Desktop Browser (QR code scan)
- **Callback URL:** Empty string
- **Files:** Same as Desktop Browser

**4. Farcaster Mobile App (Warpcast native app)**
- **Detection:** Farcaster SDK available + mobile user agent (includes 'warpcast')
- **UI:** Button to open Self app
- **Flow:** User clicks button → Opens Self app via universal link → User completes verification → Returns to Farcaster via miniapp callback → Polling detects verification → Redirect to home
- **Callback URL:** `https://farcaster.xyz/miniapps/NnmbCzDdddL5/cpiggy` (Farcaster miniapp deep link)
- **Polling:** 3-second intervals
- **Critical Fix:** Added 'warpcast' to user agent detection regex (line 173)
- **Files:** `frontend/src/app/self/page.tsx` (lines 172-173, 191-193, 214-216)

#### Device Detection Logic

**File:** `frontend/src/app/self/page.tsx`

**Mobile Detection (lines 58-149):**
```typescript
// Primary signals
const isMobileUserAgent = /android|iphone|ipad|ipod/i.test(userAgent);
const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const isNarrowViewport = windowWidth < 600;

// Decision logic
const isDefinitelyDesktop = !hasTouchScreen && !isMobileUserAgent;
const isTrueMobile = isMobileUserAgent || (hasTouchScreen && isNarrowViewport);
const shouldUseMobileUI = !isDefinitelyDesktop && isTrueMobile;
```

**Farcaster Detection (lines 171-206):**
```typescript
// Check for mobile devices OR warpcast (Farcaster native app)
const isMobileUserAgent = /android|iphone|ipad|ipod|warpcast/i.test(userAgent);

// Use the Farcaster detection hook
const isInFarcaster = farcasterDetection.isFarcasterMiniApp;

// Determine specific scenario
const isFarcasterNativeMobile = isInFarcaster && isMobileUserAgent;
const isFarcasterWeb = isInFarcaster && !isMobileUserAgent;
const isMobileBrowser = !isInFarcaster && isMobileUserAgent;
const isDesktop = !isInFarcaster && !isMobileUserAgent;
```

**Farcaster Detection Hook:** `frontend/src/hooks/useMiniAppDetection.ts`

#### Verification Flow (Step by Step)

**1. User Navigation:**
- User connects wallet on home page
- Home page checks `localStorage.getItem('isSelfVerified')`
- If not verified, shows "Proceed to Verification" button
- Clicking redirects to `/self` page

**2. Self Page Initialization (Frontend):**
```typescript
// File: frontend/src/app/self/page.tsx

// Wait for wallet connection
const userId = address; // Wallet address from useAccount()

// Detect device scenario
const scenarioKey = detectScenario(); // Returns: 'desktop', 'mobileBrowser', 'farcasterWeb', or 'farcasterApp'

// Build callback URL based on scenario
const callbackUrl = buildCallbackUrl(scenarioKey);

// Create SelfApp instance
const app = new SelfAppBuilder({
  version: 2,
  appName: process.env.NEXT_PUBLIC_SELF_APP_NAME,
  scope: process.env.NEXT_PUBLIC_SELF_SCOPE,
  endpoint: process.env.NEXT_PUBLIC_SELF_ENDPOINT,
  userId: userId, // Wallet address in hex format
  userIdType: "hex",
  userDefinedData: verificationMessage, // Custom message with scenario
  deeplinkCallback: callbackUrl,
  // ... other config
}).build();

// Generate universal link
const universalLink = getUniversalLink(app);
```

**3. User Action:**
- **Desktop/Farcaster Web:** QR code displayed, user scans with mobile device
- **Mobile/Farcaster App:** Button displayed, user clicks to open Self app

**4. Self App Verification:**
- Self app opens (either from QR scan or button click)
- User completes identity verification (passport scan, etc.)
- Self app generates zero-knowledge proof
- Proof is sent to backend endpoint

**5. Backend Verification (Server):**
```typescript
// File: frontend/src/app/api/verify/route.ts

// Receive proof from Self app
const { attestationId, proof, publicSignals, userContextData } = requestBody;

// Verify proof using Self Protocol SDK
const result = await selfBackendVerifier.verify(
  attestationId,
  proof,
  publicSignals,
  userContextData
);

if (result.isValidDetails.isValid) {
  // Extract wallet address from userContextData
  // Format: [64 chars chainId (padded)][64 chars address (padded)][rest is message]
  const paddedAddressHex = userContextData.substring(64, 128);
  const addressHex = paddedAddressHex.substring(24); // Skip 24 chars of padding
  const walletAddress = '0x' + addressHex;

  // Store verification status
  markUserAsVerified(walletAddress);

  return { status: "success", result: true };
}
```

**Critical Fix - Wallet Address Extraction:**
The `userContextData` is a hex string with padded fields. We fixed the extraction logic to properly handle the padding:
- Previous: Extracted wrong bytes due to incorrect padding calculation
- Current: Correctly extracts last 40 chars from second 64-char block
- File: `frontend/src/app/api/verify/route.ts` (lines 130-144)

**6. Status Storage:**
```typescript
// File: frontend/src/app/api/verify/status/verification-store.ts

// In-memory Map (production should use Redis/database)
const verificationStore = new Map<string, { verified: boolean; timestamp: number }>();

export function markUserAsVerified(userId: string): void {
  const normalizedUserId = userId.toLowerCase(); // Normalize to lowercase
  verificationStore.set(normalizedUserId, {
    verified: true,
    timestamp: Date.now()
  });
}

// Auto-cleanup old entries after 1 hour
```

**7. Frontend Polling (Mobile/Farcaster scenarios):**
```typescript
// File: frontend/src/app/self/page.tsx (lines 312-359)

// Poll every 3 seconds
const checkVerificationStatus = async () => {
  const normalizedUserId = userId.toLowerCase(); // Must match backend normalization

  const response = await fetch('/api/verify/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: normalizedUserId }),
  });

  if (data.verified) {
    handleSuccessfulVerification();
  }
};

setInterval(checkVerificationStatus, 3000);
```

**8. Success Handling:**
```typescript
const handleSuccessfulVerification = () => {
  // Store verification status in localStorage
  localStorage.setItem('isSelfVerified', 'true');
  localStorage.setItem('self_verification_context', context);

  // Clear session storage
  sessionStorage.removeItem('self_verification_userId');
  sessionStorage.removeItem('self_verification_timestamp');

  // Redirect to home
  router.push('/');
};
```

#### Callback URLs for Each Scenario

**Desktop Browser:**
- Callback URL: `""` (empty string)
- Reason: User stays on page, QR wrapper handles success

**Mobile Browser:**
- Callback URL: `https://cpiggy.xyz/self?callback=true`
- Reason: Returns user to same page after Self app verification

**Farcaster Web:**
- Callback URL: `""` (empty string)
- Reason: Same as desktop, QR code workflow

**Farcaster Mobile App:**
- Callback URL: `https://farcaster.xyz/miniapps/NnmbCzDdddL5/cpiggy`
- Reason: Returns user to Farcaster miniapp context
- Note: This is a Farcaster deep link, not a web URL

#### Universal Links

Self Protocol uses universal links that work across all platforms. No iOS/Android specific links needed.

**Format:** `https://get.self.app/verify/...encoded-data...`

**Generation:**
```typescript
import { getUniversalLink } from "@selfxyz/core";
const universalLink = getUniversalLink(selfApp);
```

**Cross-Platform Compatibility:**
- iOS: Opens Self app if installed, otherwise App Store
- Android: Opens Self app if installed, otherwise Play Store
- Works identically for all 4 scenarios

#### Environment Variables

**Required for Self Protocol:**
```bash
# .env.local or Railway environment variables
NEXT_PUBLIC_SELF_APP_NAME="cPiggyFX"
NEXT_PUBLIC_SELF_SCOPE="cpiggy-prod"
NEXT_PUBLIC_SELF_ENDPOINT="https://cpiggy.xyz/api/verify"
```

**Configuration:**
- Scope: Unique identifier for your Self Protocol app
- Endpoint: MUST be publicly accessible URL (required by Self app)
- App Name: Display name shown in Self app

#### Logging and Debugging

**Client-side Logging:**
The verification page includes extensive console logging for debugging. Key log emojis:
- 🚀 Initialization
- 📱 Mobile detection
- 🔍 Device detection details
- 🔗 Universal link generation
- 🔄 Polling status
- ✅ Success
- ❌ Errors

**Server-side Logging (Railway):**
```typescript
// File: frontend/src/app/api/verify/route.ts

// All requests logged with:
🔐 Verification request start
📱 Request context (UA, referer, origin)
📄 Raw request body
📦 Parsed request payload
✅ Verification successful
💾 User marked as verified
❌ Errors with full details
```

**Mobile Debugging Endpoint:**
```typescript
// File: frontend/src/app/api/log-detection/route.ts

// Client sends detection info to server
POST /api/log-detection
{
  scenarioKey: 'farcasterApp',
  isMobile: true,
  userAgent: '...',
  callbackUrl: '...'
}
```

This allows viewing client-side detection results in Railway logs, which is crucial for debugging mobile scenarios where browser console is not accessible.

#### Recent Fixes

**1. Farcaster Mobile App Detection (Critical Fix)**
- **Problem:** Warpcast app not detected as mobile, showed QR code instead of button
- **Solution:** Added 'warpcast' to mobile user agent regex
- **File:** `frontend/src/app/self/page.tsx` (line 173)
- **Before:** `/android|iphone|ipad|ipod/i.test(userAgent)`
- **After:** `/android|iphone|ipad|ipod|warpcast/i.test(userAgent)`

**2. Wallet Address Extraction**
- **Problem:** Extracting wrong bytes from padded userContextData
- **Solution:** Fixed to extract last 40 chars from second 64-char block
- **File:** `frontend/src/app/api/verify/route.ts` (lines 130-144)
- **Impact:** Verification status now correctly stored with user's wallet address

**3. Reown/WalletConnect Configuration Cleanup**
- **Problem:** Duplicate connector configs + local features config being ignored
- **Root Cause:** WagmiAdapter automatically includes injected() and walletConnect(), manual config caused conflicts
- **Solution:**
  - Removed manual `injected()` and `walletConnect()` from connectors array
  - Removed local `features` config from createAppKit (now controlled via Reown dashboard)
  - Only kept custom `miniAppConnector()` for Farcaster
- **Files:**
  - `frontend/src/config/index.ts` (lines 53-63) - Simplified connectors array
  - `frontend/src/context/index.tsx` (lines 34-45) - Removed features config
- **Benefits:**
  - Fixes WalletConnect QR code not showing (Issue #4680 in reown-com/appkit)
  - Removes deployment warning about ignored local config
  - Centralized feature control via dashboard.reown.com
- **Reown Dashboard Config:**
  - Project ID: `5aa426208ed21c5b9a93b4a0eec73d97`
  - Enabled features: Social & Email, Onramp, Swaps, Activity, Event Tracking

**4. Mobile Logging Endpoint**
- **Added:** `/api/log-detection` endpoint for mobile debugging
- **Purpose:** Logs device detection to Railway where it's visible
- **File:** `frontend/src/app/api/log-detection/route.ts`

#### Known Working Configurations

**Tested and verified working in:**
1. Desktop Chrome/Firefox/Safari (QR code)
2. Mobile Safari iOS (button + redirect)
3. Mobile Chrome Android (button + redirect)
4. Farcaster Web on Desktop (QR code)
5. Warpcast iOS app (button + miniapp deep link)
6. Warpcast Android app (button + miniapp deep link)

**Universal Link Compatibility:**
- No separate iOS/Android deep links needed
- Single universal link works across all platforms
- Automatically handles app install state

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

## Railway Deployment Configuration

**IMPORTANT:** Railway is configured to deploy from the `frontend/` directory, NOT from the project root.

### Deployment Directory
- **Root Directory in Railway:** `frontend/`
- All configuration files must be in `frontend/` directory
- Railway runs commands from `frontend/` context

### Node.js Version Requirements
- **Required Version:** Node 22.x (for Self Protocol compatibility)
- **Configuration Files:**
  - `frontend/.nvmrc` - Contains `22`
  - `frontend/package.json` - Has `engines` field specifying Node >=22.0.0 <23.0.0
- Railway automatically detects and uses Node 22 from these files

### Build & Start Commands
- **Build:** `npm run build` (executes `next build`)
- **Start:** `npm start` (executes `next start`)
- Railway automatically detects these from package.json scripts

### Environment Variables (Railway)
Required environment variables must be set in Railway dashboard:
- `NEXT_PUBLIC_SELF_SCOPE` - Your Self Protocol app scope
- `NEXT_PUBLIC_SELF_ENDPOINT` - Verification endpoint URL (e.g., https://cpiggy.xyz/api/verify)
- `NEXT_PUBLIC_PROJECT_ID` - Reown/WalletConnect project ID
- Other Next.js and wallet-related variables as needed

### Monitoring Railway Logs
To debug Self Protocol verification in Railway:
1. Go to Railway dashboard → Select frontend service → Logs tab
2. Look for emoji-prefixed logs:
   - 🔐 Verification request start
   - 📱 Request context (UA, referer, origin, content-type)
   - 📄 Raw request body
   - 📦 Parsed request payload
   - ✅ Verification successful
   - 💾 User marked as verified
   - ❌ Errors with details
3. Use request IDs to trace complete verification flows

### Common Railway Deployment Issues

**"Invalid JSON in request body":**
- Check raw body in Railway logs
- Verify Content-Type header is application/json
- Ensure Node 22 is being used (check build logs)
- Confirm Self package versions are compatible

**Node version mismatch:**
- Verify `.nvmrc` exists in `frontend/` directory
- Check `engines` field in `frontend/package.json`
- Railway build logs should show "Using Node v22.x"

**Build failures:**
- Ensure all dependencies are in `frontend/package.json`
- Check Railway build logs for specific errors
- Verify environment variables are set correctly

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
