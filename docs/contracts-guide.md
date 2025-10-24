# 📜 Smart Contracts Guide - cPiggyFX

Complete guide for the cPiggyFX smart contracts deployed on Celo blockchain.

## 📋 Overview

cPiggyFX uses smart contracts written in Solidity to enable:
- **FX Diversification** - Automatic multi-currency savings
- **Fixed-Term Staking** - Guaranteed APY returns
- **Secure Fund Management** - Non-custodial, user-controlled

## 🏗️ Contract Architecture

### Main Contract: PiggyBank.sol

**Location:** `Contracts/contracts/cPiggyBank.sol`  
**Solidity Version:** 0.8.19  
**License:** MIT

#### Deployed Contracts

| Version | Address | Network | Status |
|---------|---------|---------|--------|
| v1.0 | `0x64f5167cFA3Eb18DebD49F7074AD146AaE983F97` | Celo Mainnet | Deprecated |
| v1.1 | `0x765aeb85d160eb221Ab1D94506d6471f795763EC` | Celo Mainnet | Deprecated |
| **v1.2** | `0x15a968d1efaCD5773679900D57E11799C4ac01Ce` | Celo Mainnet | ✅ **Current** |

**Block Explorer:**  
[View on Celoscan](https://celoscan.io/address/0x15a968d1efaCD5773679900D57E11799C4ac01Ce)

## 💰 Features

### 1. FX Diversification (Piggy Bank)

Allows users to diversify cCOP into multiple stablecoins with automatic swapping via Mento Protocol.

**Risk Modes:**

**Safe Mode:**
- 40% cCOP
- 30% cUSD  
- 20% cEUR
- 10% cGBP

**Standard Mode:**
- 20% cCOP
- 40% cUSD
- 30% cEUR
- 10% cGBP

**Lock Periods:** 30, 60, or 90 days

**Fees:**

- **User fee:** 0% - Users receive 100% of their returns
- **Developer fee:** 1% of profits (paid by protocol as additional transfer, not deducted from user)
- **Example:**
  - User deposits 10M, gets 10.5M back → User receives all 10.5M
  - Developer receives 5K (1% of 500K profit) separately from protocol
- Mento protocol swap fees apply during swaps

**Limits:**

- Max deposit per wallet: 10,000,000 cCOP
- Pool capacity limits per duration

### 2. Fixed-Term APY Staking

Lock cCOP for guaranteed returns with daily compound interest.

**Interest Rates:**
- **30 days:** 1.25% monthly (16.08% EA)
- **60 days:** 1.5% monthly (19.56% EA)
- **90 days:** 2% monthly (26.82% EA)

*Note: Interest compounds daily to achieve exact monthly rates. EA = Effective Annual Rate.*

**Fees:**

- **User fee:** 0% - Users receive 100% of promised interest
- **Developer fee:** 5% of earned rewards (paid by protocol as additional transfer, not deducted from user)
- **Example:**
  - User deposits 10M for 30 days
  - Interest earned: 125K cCOP
  - User receives: 10,125,000 cCOP (principal + 100% interest)
  - Developer receives: 6,250 cCOP (5% of 125K) separately from protocol
  - User always gets the promised monthly rate (1.25%, 1.5%, or 2%)

**Limits:**

- Max deposit per wallet: 10,000,000 cCOP
- Pool capacity limits per duration

## 🔧 Development Setup

### Prerequisites

```bash
Node.js >= 18.0.0
npm or pnpm
Hardhat
```

### Installation

```bash
cd Contracts

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy (testnet)
npx hardhat run scripts/deploy.ts --network celoSepolia
```

### Environment Variables

Create `.env` file in `Contracts/` directory:

```bash
# Private key for deployment
PRIVATE_KEY=your_private_key_here

# Network URLs
CELO_RPC_URL=https://forno.celo.org
CELO_SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org

# Block explorer API key (for verification)
CELOSCAN_API_KEY=your_api_key_here

# Contract addresses (after deployment)
PIGGYBANK_ADDRESS=0x...
```

## 📁 Project Structure

```
Contracts/
├── contracts/
│   ├── cPiggyBank.sol           # Main contract
│   ├── interfaces/
│   │   ├── IFXOracle.sol       # Oracle interface
│   │   └── interfaces.sol       # Common interfaces
│   ├── MentoOracleHandler.sol  # Mento integration
│   └── mocks/                   # Test mocks
│       ├── ERC20Mock.sol
│       ├── MentoBrokerMock.sol
│       └── MentoOracleHandlerMock.sol
│
├── test/
│   └── PiggyBank.test.ts       # Contract tests
│
├── scripts/
│   └── deploy.ts                # Deployment script
│
├── ignition/
│   └── modules/
│       └── Lock.ts              # Hardhat Ignition
│
├── hardhat.config.ts            # Hardhat configuration
├── package.json                 # Dependencies
└── tsconfig.json                # TypeScript config
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npx hardhat test

# Run with gas reporter
REPORT_GAS=true npx hardhat test

# Run specific test
npx hardhat test test/PiggyBank.test.ts

# Run with coverage
npx hardhat coverage
```

### Test Coverage

Current test suite covers:
- ✅ Piggy creation (FX diversification)
- ✅ Fixed-term staking
- ✅ Claiming and withdrawals
- ✅ Fee calculations
- ✅ Access control
- ✅ Edge cases

## 🚀 Deployment

### Deploy to Testnet (Celo Sepolia)

```bash
# Compile contracts
npx hardhat compile

# Deploy to Celo Sepolia testnet
npx hardhat run scripts/deploy.ts --network celoSepolia

# Verify on Celoscan
npx hardhat verify --network celoSepolia DEPLOYED_ADDRESS "Constructor" "Args"
```

### Deploy to Mainnet (Celo)

```bash
# ⚠️ IMPORTANT: Test thoroughly on testnet first!

# Deploy to Celo mainnet
npx hardhat run scripts/deploy.ts --network celo

# Verify contract
npx hardhat verify --network celo DEPLOYED_ADDRESS "Constructor" "Args"
```

## 📜 Contract ABI

### Location

Contract ABIs are exported to:
```
frontend/lib/artifacts/contracts/cPiggyBank.sol/PiggyBank.json
```

### Using in Frontend

```typescript
import PiggyBankABI from '@/lib/artifacts/contracts/cPiggyBank.sol/PiggyBank.json'

// Use with wagmi/viem
const contract = {
  address: '0x15a968d1efaCD5773679900D57E11799C4ac01Ce',
  abi: PiggyBankABI.abi,
}
```

## 🔐 Security Considerations

### Audits

⚠️ **Status:** Not yet audited

**Planned:**
- [ ] Internal security review
- [ ] External security audit
- [ ] Bug bounty program

### Best Practices Implemented

- ✅ ReentrancyGuard protection
- ✅ SafeERC20 for token transfers
- ✅ Ownable access control
- ✅ Input validation
- ✅ Safe math operations (Solidity 0.8.19)

### Known Limitations

1. **No emergency pause** - Consider adding pause functionality
2. **Fixed fee structure** - Fees are hardcoded
3. **No upgrade mechanism** - Contract is not upgradeable

## 📊 Contract Interactions

### Creating a Piggy (FX Diversification)

```solidity
// Approve cCOP tokens first
cCOP.approve(piggyBankAddress, amount)

// Create piggy
piggyBank.createPiggy(
    amount,        // Amount in cCOP
    duration,      // 30, 60, or 90 days
    riskMode       // 0 = Safe, 1 = Standard
)
```

### Creating Fixed Term

```solidity
// Approve cCOP tokens
cCOP.approve(piggyBankAddress, amount)

// Create fixed term
piggyBank.createFixedTerm(
    amount,        // Amount in cCOP
    duration       // 30, 60, or 90 days
)
```

### Claiming

```solidity
// Claim after lock period
piggyBank.claimPiggy(piggyId)
// or
piggyBank.claimFixedTerm(termId)
```

## 🔗 Integrations

### Mento Protocol

Used for stablecoin swaps:
- cCOP ↔ cUSD
- cCOP ↔ cEUR
- cCOP ↔ cGBP

**Broker Contract:** Mento Broker (on Celo)  
**Oracle:** Mento Oracle for exchange rates

### Supported Tokens (Celo Mainnet)

| Token | Symbol | Address | Decimals |
|-------|--------|---------|----------|
| Colombian Peso | cCOP | `0x8A567e2aE79CA692Bd748aB832081C45de4041eA` | 18 |
| US Dollar | cUSD | `0x765DE816845861e75A25fCA122bb6898B8B1282a` | 18 |
| Euro | cEUR | `0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73` | 18 |
| British Pound | cGBP | `0xCCF663b1fF11028f0b19058d0f7B674004a40746` | 18 |

**Mento Protocol Contracts:**

| Contract | Address |
|----------|---------|
| Mento Broker | `0x777A8255cA72412f0d706dc03C9D1987306B4CaD` |
| Exchange Provider | `0x22d9db95E6Ae61c104A7B6F6C78D7993B94ec901` |

**Exchange IDs:**

| Pair | Exchange ID |
|------|-------------|
| cCOP/cUSD | `0x1c9378bd0973ff313a599d3effc654ba759f8ccca655ab6d6ce5bd39a212943b` |
| cUSD/cEUR | `0x746455363e8f55d04e0a2cc040d1b348a6c031b336ba6af6ae91515c194929c8` |
| cUSD/cGBP | `0x6c369bfb1598b2f7718671221bc524c84874ad1ed7ba02a61121e7a06722e2ce` |

**Note:** All addresses verified from deployment script and Celo mainnet.

## 🛠️ Development Tools

### Hardhat Configuration

```typescript
// hardhat.config.ts
networks: {
  celo: {
    url: process.env.CELO_RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 42220
  },
  celoSepolia: {
    url: process.env.CELO_SEPOLIA_RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 11142220
  }
}
```

### Useful Commands

```bash
# Compile contracts
npx hardhat compile

# Clean artifacts
npx hardhat clean

# Run local node
npx hardhat node

# Console (interact with contracts)
npx hardhat console --network celo

# Flatten contract (for verification)
npx hardhat flatten contracts/cPiggyBank.sol > flattened.sol
```

## 📈 Gas Optimization

### Estimated Gas Costs

| Operation | Gas Cost (approx) | In CELO |
|-----------|-------------------|---------|
| Create Piggy | ~250,000 | ~$0.01 |
| Create Fixed Term | ~200,000 | ~$0.008 |
| Claim | ~180,000 | ~$0.007 |

*Note: Gas costs vary with network congestion*

### Optimization Strategies

- ✅ Batch operations where possible
- ✅ Efficient storage patterns
- ✅ Minimal external calls
- ✅ Optimized loops

## 🐛 Troubleshooting

### Common Issues

#### Compilation errors
```bash
# Clear cache and recompile
npx hardhat clean
npx hardhat compile
```

#### Deployment fails
- Check private key in `.env`
- Verify sufficient CELO for gas
- Confirm RPC URL is correct

#### Test failures
- Ensure local node is running
- Check mock contracts are deployed
- Verify test data is valid

## 📚 Additional Resources

### Celo Documentation
- [Celo Docs](https://docs.celo.org)
- [Mento Protocol](https://docs.mento.org)
- [Celoscan](https://celoscan.io)

### Tools
- [Hardhat](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Remix IDE](https://remix.ethereum.org)

### Community
- [Celo Discord](https://discord.gg/celo)
- [Celo Forum](https://forum.celo.org)

## ⚠️ Disclaimer

**IMPORTANT:** These smart contracts have NOT been audited. Use at your own risk.

- Do NOT use in production with large amounts without audit
- Test thoroughly on testnet first
- Consider security review before mainnet deployment
- Users should understand the risks involved

## 🔄 Upgrade Path

Current contracts are NOT upgradeable. For upgrades:

1. Deploy new contract version
2. Migrate user funds (if possible)
3. Update frontend to new address
4. Deprecate old contract

**Future:** Consider implementing proxy pattern for upgradeability.

---

**Last Updated:** October 2025  
**Contract Version:** 1.2  
**Solidity:** 0.8.19  
**Network:** Celo Mainnet
