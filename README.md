# Crowdfunding Platform - Stellar Yellow Belt dApp 

> **Level 2 Challenge** - Build a Stellar dApp that deploys & interacts with a Soroban smart contract, supports multiple wallets, and handles real-time events.

## Overview

A decentralized crowdfunding platform built on Stellar's Soroban smart contracts. Users can create campaigns, donate tokens, and claim funds - all on the Stellar testnet.

## Features

- **Soroban Smart Contract** - Crowdfunding contract with `initialize`, `donate`, `claim`, `get_campaign`, `get_donation`
- **Multi-Wallet Support** - Connect via Freighter, Albedo, or xBull using StellarWalletsKit
- **Real-Time Events** - Live donation feed & campaign progress via Soroban event streaming
- **3+ Error Types** - Wallet not found, rejected transaction, insufficient balance, campaign ended, goal not reached
- **Campaign Dashboard** - Progress bar, donor list, status tracker, claim button

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Smart Contract | Rust + Soroban SDK 20.3.1 |
| Wallet | @creit.tech/stellar-wallets-kit |
| Stellar SDK | @stellar/stellar-sdk ^11.3.0 |
| Icons | react-icons (Feather + Simple) |
| Network | Stellar Testnet |

## Project Structure

```
stellar-yellow-belt-dapp/
├── contracts/
│   └── crowdfund/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs          # Soroban crowdfund contract
│           └── test.rs         # Contract unit tests
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Main app layout
│   ├── index.css               # Styles (green theme + grid)
│   ├── components/
│   │   ├── WalletConnect.tsx   # Multi-wallet connection
│   │   ├── CampaignCard.tsx    # Campaign info + progress bar
│   │   ├── DonateForm.tsx      # Donation form
│   │   ├── ClaimButton.tsx     # Owner claim button
│   │   └── EventFeed.tsx       # Real-time donation events
│   ├── hooks/
│   │   ├── useWallet.tsx       # Multi-wallet context
│   │   ├── useCampaign.ts      # Campaign data hook
│   │   ├── useDonate.ts        # Donate interaction hook
│   │   └── useEvents.ts        # Soroban event listener hook
│   ├── services/
│   │   ├── soroban.ts          # Soroban RPC client
│   │   ├── contract.ts         # Contract call helpers
│   │   └── events.ts           # Event streaming service
│   ├── config/
│   │   └── network.ts          # Testnet config + contract ID
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   └── wallet/
│       ├── kit.ts              # StellarWalletsKit setup
│       └── types.ts            # Wallet types
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json
└── README.md
```

## Prerequisites

- Node.js 18+
- Rust & Cargo (for smart contract)
- Soroban CLI (`cargo install soroban-cli`)
- Freighter, Albedo, or xBull browser extension

## Quick Start

### 1. Install frontend dependencies

```bash
cd stellar-yellow-belt-dapp
npm install
```

### 2. Build & deploy the smart contract

```bash
cd contracts/crowdfund
cargo build --target wasm32-unknown-unknown --release

# Deploy to testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/crowdfund.wasm \
  --network testnet \
  --source <YOUR_SECRET_KEY>
```

Copy the returned contract ID and paste it in `src/config/network.ts`.

### 3. Initialize the campaign

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source <YOUR_SECRET_KEY> \
  -- initialize \
  --owner <YOUR_PUBLIC_KEY> \
  --token <TOKEN_ADDRESS> \
  --goal 10000000 \
  --deadline 1735689600
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Smart Contract API

| Function | Description | Auth |
|----------|-------------|------|
| `initialize(owner, token, goal, deadline)` | Create a new campaign | Owner |
| `donate(donor, amount)` | Donate tokens to campaign | Donor |
| `claim()` | Claim funds after goal met | Owner |
| `get_campaign()` | View campaign info | None |
| `get_donation(donor)` | View donation for address | None |

### Events Emitted

- `("crowdfund", "init")` - Campaign initialized
- `("crowdfund", "donate")` - New donation received
- `("crowdfund", "claim")` - Funds claimed by owner

## Error Handling

The app handles 3+ distinct error types:

1. **Wallet Not Found** - No compatible wallet extension detected
2. **Transaction Rejected** - User denied the transaction signature
3. **Insufficient Balance** - Not enough tokens to complete donation
4. **Campaign Ended** - Donation attempted after deadline
5. **Goal Not Reached** - Claim attempted before goal is met

## Submission Checklist

- [x] Deployed Soroban contract address: `CCNXRR5JYDC4EIPMPK2YV4U6JH6RLPASXAQBYN3Q4Y5DYDUB3TU6YR7U`
- [x] Contract deploy tx hash: `5d18bf94aa0e7cf8465fa3d98a07ab847f6f53bebf89bcc4513085c197b167f9`
- [x] Contract init tx hash: `d7d7863d61afcb05b204f260eac0ddeee21140a1958e9047fc6d26dc4d8a8368`
- [x] Multi-wallet support (Freighter + Albedo + xBull)
- [x] Real-time event handling
- [x] 3+ error types handled
- [ ] Screenshots in `screenshot_of_application/`
- [ ] Live demo URL: `__________________`

## Screenshots

![main_page_before_connect](screenshot_of_application/main_page_before_connect.png)
![after_connect_wallet](screenshot_of_application/after_connect_wallet.png)
![campaign_dashboard](screenshot_of_application/campaign_dashboard.png)
![donation_flow](screenshot_of_application/donation_flow.png)

## Network

- **Horizon**: `https://horizon-testnet.stellar.org`
- **Soroban RPC**: `https://soroban-testnet.stellar.org`
- **Friendbot**: `https://friendbot.stellar.org`
- **Explorer**: [stellar.expert/explorer/testnet](https://stellar.expert/explorer/testnet)

## License

MIT