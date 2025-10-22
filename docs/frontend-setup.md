# 🎨 Frontend Setup Guide - cPiggyFX

Complete guide for setting up and developing the cPiggyFX frontend application.

## 📋 Overview

The cPiggyFX frontend is a Next.js 15 application with React 19, built with TypeScript and styled with Tailwind CSS. It features multi-wallet support, Farcaster Mini App integration, and internationalization.

## 🛠️ Tech Stack

### Core Framework
- **Next.js 15.3.3** - React framework with App Router
- **React 19.0.0** - Latest React with Server Components
- **TypeScript 5** - Type safety and better DX

### Blockchain Integration
- **Reown AppKit 1.7.15** - Wallet connection and UI (formerly WalletConnect)
- **Wagmi 2.12.31** - React hooks for Ethereum
- **Viem 2.31.3** - TypeScript utilities for Ethereum
- **Ethers.js 6.15.0** - Ethereum library

### Identity & Social
- **Self Protocol** - Off-chain identity verification
  - `@selfxyz/core ^1.0.7-beta.1`
  - `@selfxyz/qrcode ^1.0.10-beta.1`
- **Farcaster** - Mini App integration
  - `@farcaster/miniapp-sdk ^0.1.9`
  - `@farcaster/miniapp-wagmi-connector ^1.0.0`

### UI & Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS
- **Lucide React** - Icon library
- **Radix UI** - Headless UI components
- **next-intl 4.3.4** - Internationalization (i18n)

### State & Data
- **TanStack Query 5.59.20** - Server state management
- **React Query** - Data fetching and caching

## 🚀 Quick Start

### Prerequisites

```bash
Node.js >= 18.0.0
npm or pnpm
Git
```

### Installation

```bash
# Clone repository
git clone https://github.com/TuCopFinance/cPiggy.git
cd cPiggy/frontend

# Install dependencies
npm install
# or
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values (see below)

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

## 🔐 Environment Variables

Create `.env.local` file in the `frontend/` directory:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://cpiggy.xyz  # Production
# NEXT_PUBLIC_APP_URL=https://cpiggy-dev.up.railway.app  # Development/Staging

# Reown AppKit (WalletConnect)
NEXT_PUBLIC_PROJECT_ID=your_reown_project_id

# Self Protocol
NEXT_PUBLIC_SELF_APP_NAME=cPiggyFX
NEXT_PUBLIC_SELF_SCOPE=cpiggy-prod
NEXT_PUBLIC_SELF_ENDPOINT=https://cpiggy.xyz/api/verify

# Environment-specific URLs
# Production: NEXT_PUBLIC_APP_URL=https://cpiggy.xyz
# Staging: NEXT_PUBLIC_APP_URL=https://cpiggy-staging.up.railway.app
# Development: NEXT_PUBLIC_APP_URL=https://cpiggy-dev.up.railway.app
# Local: NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Environment-Specific Configuration

**Important:** Configure these variables differently per environment:

| Variable | Local | Development | Production |
|----------|-------|-------------|------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://cpiggy-dev.up.railway.app` | `https://cpiggy.xyz` |
| `NEXT_PUBLIC_SELF_SCOPE` | `cpiggy-dev` | `cpiggy-dev` | `cpiggy-prod` |
| `NEXT_PUBLIC_SELF_ENDPOINT` | `http://localhost:3000/api/verify` | `https://cpiggy-dev.up.railway.app/api/verify` | `https://cpiggy.xyz/api/verify` |

### Getting API Keys

1. **Reown Project ID:**
   - Visit [cloud.reown.com](https://cloud.reown.com)
   - Create new project
   - Copy Project ID
   - Can use same ID for all environments or different IDs per environment

2. **Self Protocol:**
   - Contact Self Protocol for scope setup
   - Use different scopes for dev/prod environments
   - Configure verification endpoint to match your app URL

### Railway Configuration

In Railway dashboard, set environment variables for each service:

**Development Service:**
```
NEXT_PUBLIC_APP_URL=https://cpiggy-dev.up.railway.app
```

**Production Service:**
```
NEXT_PUBLIC_APP_URL=https://cpiggy.xyz
```

This ensures metadata URLs match the actual deployment URL and prevents warnings.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   │   ├── verify/     # Self verification endpoint
│   │   │   └── webhook/    # Farcaster webhook
│   │   ├── create/         # Create piggy page
│   │   ├── dashboard/      # User dashboard
│   │   ├── demo/           # Demo page
│   │   ├── self/           # Self verification page
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page
│   │   └── globals.css     # Global styles
│   │
│   ├── components/         # React components
│   │   ├── ui/            # UI primitives (buttons, etc.)
│   │   ├── CCOPWithUSD.tsx        # Exchange rate display
│   │   ├── ConnectButton.tsx      # Wallet connection
│   │   ├── FarcasterConnectButton.tsx
│   │   ├── LanguageSwitcher.tsx   # i18n selector
│   │   └── ...
│   │
│   ├── config/            # Configuration
│   │   └── index.ts       # Wagmi & wallet config
│   │
│   ├── context/           # React Context providers
│   │   ├── index.tsx              # Main context provider
│   │   ├── FarcasterContext.tsx   # Farcaster state
│   │   └── LanguageContext.tsx    # i18n state
│   │
│   ├── hooks/             # Custom React hooks
│   │   ├── useCOPUSDRate.ts          # Exchange rate fetching
│   │   ├── useMiniAppDetection.ts    # Farcaster detection
│   │   ├── useLanguageDetection.ts
│   │   └── useClientMount.ts
│   │
│   ├── i18n/              # Internationalization
│   │   ├── config.ts      # i18n configuration
│   │   └── locales/       # Translation files
│   │       ├── en.json    # English
│   │       └── es.json    # Spanish
│   │
│   ├── lib/               # Utility libraries
│   │   ├── utils.ts       # Helper functions
│   │   └── artifacts/     # Contract ABIs
│   │
│   └── types/             # TypeScript definitions
│       ├── global.d.ts
│       └── images.d.ts
│
├── public/                # Static assets
│   ├── .well-known/
│   │   └── farcaster.json # Farcaster Mini App manifest
│   ├── icon.png           # App icon
│   ├── splash.png         # Splash screen
│   └── ...
│
├── next.config.ts         # Next.js configuration
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
```

## 🔧 Development

### Available Scripts

```bash
# Development server (hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Linting
npm run lint

# Build with watch mode
npm run build:watch

# Build in background
npm run build:bg
```

### Development Workflow

1. **Start dev server:** `npm run dev`
2. **Make changes** to files in `src/`
3. **Hot reload** updates automatically
4. **Check console** for errors
5. **Test features** in browser

### Code Style

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting (if configured)
- **Component naming:** PascalCase
- **File naming:** kebab-case or PascalCase for components
- **Hooks naming:** camelCase with `use` prefix

## 🎨 Styling Guide

### Tailwind CSS

```tsx
// Example component with Tailwind
export function Button({ children }) {
  return (
    <button className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
      {children}
    </button>
  )
}
```

### Theme Configuration

Tailwind theme is configured in `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: '#e11d48',  // Pink
      secondary: '#9333ea', // Purple
      // ... more colors
    }
  }
}
```

### Custom CSS

Global styles in `src/app/globals.css`:
- Base Tailwind directives
- Custom utility classes
- CSS variables for theming

## 🌍 Internationalization (i18n)

### Supported Languages

- **English** (`en`) - Default
- **Spanish** (`es`) - Secondary

### Adding Translations

1. Add keys to `src/i18n/locales/en.json`:
```json
{
  "home": {
    "welcome": "Welcome to cPiggyFX"
  }
}
```

2. Add Spanish translation to `src/i18n/locales/es.json`:
```json
{
  "home": {
    "welcome": "Bienvenido a cPiggyFX"
  }
}
```

3. Use in components:
```tsx
import { useLanguage } from '@/context/LanguageContext'

export function Component() {
  const { t } = useLanguage()
  return <h1>{t('home.welcome')}</h1>
}
```

See [language-implementation.md](./language-implementation.md) for complete guide.

## 🔌 Wallet Integration

### Reown AppKit Setup

Configured in `src/config/index.ts`:

```tsx
export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId,
  networks: [celo, celoSepolia],
  connectors: [
    injected(),           // MetaMask, etc.
    walletConnect({...}), // WalletConnect
    miniAppConnector()    // Farcaster
  ]
})
```

### Features Enabled

- ✅ On-Ramp (buy crypto with fiat)
- ✅ Swaps (token exchange)
- ✅ Email Login
- ✅ Social Login (Google, GitHub, Apple, Discord)
- ✅ Transaction History

See [appkit-features.md](./appkit-features.md) for details.

## 🎭 Farcaster Mini App

### Detection

App automatically detects Farcaster environment:

```tsx
import { useFarcaster } from '@/context/FarcasterContext'

export function Component() {
  const { isFarcasterMiniApp } = useFarcaster()
  
  if (isFarcasterMiniApp) {
    return <FarcasterUI />
  }
  
  return <StandardUI />
}
```

### Testing

1. **Development:** Add `?miniapp=true` to URL
2. **Farcaster Web:** Open in warpcast.com
3. **Farcaster Mobile:** Use Warpcast app

See [farcaster-testing.md](./farcaster-testing.md) for complete guide.

## 🔐 Self Protocol Verification

### Flow

1. User connects wallet
2. Redirected to `/self` if not verified
3. QR code displayed for Self app
4. User scans and verifies
5. Backend validates at `/api/verify`
6. User can access app features

### Configuration

```tsx
// src/app/self/page.tsx
const app = new SelfAppBuilder({
  version: 2,
  appName: process.env.NEXT_PUBLIC_SELF_APP_NAME,
  scope: process.env.NEXT_PUBLIC_SELF_SCOPE,
  endpoint: process.env.NEXT_PUBLIC_SELF_ENDPOINT,
  // ... more config
}).build()
```

## 🧪 Testing

### Manual Testing

1. **Wallet Connection:**
   - MetaMask
   - WalletConnect
   - Farcaster wallet

2. **User Flows:**
   - Create piggy (FX diversification)
   - Create fixed term
   - View dashboard
   - Claim rewards

3. **Features:**
   - Language switching
   - Exchange rate display
   - Self verification
   - Farcaster detection

### Browser Testing

- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers
- ✅ Farcaster in-app browser

## 🐛 Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

#### Wallet not connecting
- Check `NEXT_PUBLIC_PROJECT_ID` is set
- Verify network (Celo mainnet)
- Check browser console for errors

#### Self verification failing
- Verify `NEXT_PUBLIC_SELF_ENDPOINT` is correct
- Check `/api/verify` endpoint is accessible
- Review backend logs

#### Farcaster not detecting
- Check URL params (`?miniapp=true`)
- Verify manifest at `/.well-known/farcaster.json`
- Review console logs for detection results

### Debug Mode

Enable detailed logging:

```tsx
// Set in browser console
localStorage.setItem('debug', 'true')

// Check detection logs
console.log('Farcaster detected:', isFarcasterMiniApp)
```

## 📦 Building for Production

### Build Process

```bash
# Create optimized production build
npm run build

# Output in .next/ directory
# Static files exported if configured
```

### Environment

Ensure production environment variables are set:
- `NEXT_PUBLIC_PROJECT_ID` - Production Reown project
- `NEXT_PUBLIC_SELF_ENDPOINT` - Production API endpoint
- Other production URLs

### Deployment

Supports deployment to:
- **Vercel** (recommended for Next.js)
- **Railway**
- **Any Node.js hosting**

See main README for deployment guide.

## 📊 Performance

### Optimization Features

- ✅ Server Components for faster initial load
- ✅ Image optimization (Next.js)
- ✅ Code splitting (automatic)
- ✅ Bundle size optimization
- ✅ Caching strategies

### Monitoring

- Analytics enabled via Reown AppKit
- Check bundle size: `npm run build` shows stats

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Reown AppKit Docs](https://docs.reown.com/appkit)
- [Wagmi Documentation](https://wagmi.sh)
- [Tailwind CSS](https://tailwindcss.com)
- [Self Protocol](https://selfprotocol.xyz)
- [Farcaster Docs](https://docs.farcaster.xyz)

## 🆘 Getting Help

- **Issues:** Open a GitHub issue
- **Questions:** Check existing documentation
- **Bugs:** Provide console logs and reproduction steps

---

**Last Updated:** October 21, 2025  
**Frontend Version:** 0.1.0  
**Next.js:** 15.3.3
