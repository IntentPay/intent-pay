# IntentPay: Universal DeFi Access Without a Wallet

**IntentPay** is a revolutionary platform built on the **World App** ecosystem that enables seamless cross-chain transactions without requiring users to create or manage their own crypto wallets. By combining World ID verification, Circle's Modular wallet technology, and 1inch's advanced trading infrastructure, we've created a frictionless crypto experience accessible to everyone.

## Our Two-Pronged Approach

### 1. Intent Pay - Walletless Token Swaps

Intent Pay allows users who have completed World App's Orb verification to directly swap tokens without creating or funding a wallet first. Here's how it works:

- **Instant Access**: After World ID verification, users can immediately start trading
- **Simple Payment**: Pay with WLD or USDC.e directly through World App
- **Flexible Destination**: Enter recipient address manually or scan a QR code
- **Multi-Chain Support**: Select any destination chain and token
- **Transparent Pricing**: View estimated amounts and fees before confirming
- **Hassle-Free Execution**: Our platform-owned Circle wallet executes the 1inch swap after payment

Users can acquire any token on any supported chain without understanding blockchain complexities, gas fees, or wallet management. It's as simple as selecting what you want and paying through World App.

### 2. Intent Wallet - Your Personal DeFi Gateway

Intent Wallet leverages World App's Wallet Auth (Sign in with Ethereum) to create personal non-custodial wallets for users who want more capabilities:

- **Seamless Creation**: User's World App wallet address serves as the unique identifier for their Circle Modular wallet
- **Passwordless Authentication**: No need to create or remember new credentials - just authenticate with World App
- **Full Functionality**: Transfer, swap, receive funds, and participate in DeFi protocols
- **USDC-Focused**: Fund your wallet with USDC via transfers or World App payments
- **Gas-Free Operations**: No need to hold specific gas tokens for different chains

Intent Wallet provides all the functionality of a traditional crypto wallet with significantly improved user experience, requiring only USDC to participate in the entire DeFi ecosystem.

## Technical Architecture

### World App Integration

- **World ID Verification**: Sybil-resistant verification ensures every user is a unique human
- **Wallet Auth Integration**: Secure authentication using Sign in with Ethereum (SIWE) protocol
- **MiniKit Integration**: Seamless integration within the World App ecosystem
- **Direct Payment Processing**: Process WLD and USDC.e payments within the familiar World App interface

### Circle Integration

- **Modular Wallet Infrastructure**: Powers both platform wallets (for Intent Pay) and user wallets (for Intent Wallet)
- **Wallet Address Authentication**: Secure wallet access using the user's World App wallet address
- **Transaction Execution**: Handle cross-chain operations without requiring user-managed gas
- **CCTP v2 Utilization**: Cross-Chain Transfer Protocol for secure USDC movement across chains
- **Paymaster Integration**: Enables gas-free transactions paid in USDC on Base and Arbitrum networks

### 1inch Integration

- **Fusion Protocol**: Gasless trading with MEV protection
- **Cross-Chain Swaps**: Execute trades across multiple blockchain networks
- **Deep Liquidity Access**: Optimal price execution through aggregated liquidity sources

### Cross-Chain Liquidity Management

- **Multi-Chain Treasury**: Platform wallets maintained on Ethereum, Base, and Avalanche
- **Dynamic Route Selection**: When a swap is initiated, all three chains are queried for the best rates
- **Base Chain Prioritization**: Due to Paymaster support, Base chain is prioritized for transaction execution
- **USDC-Only Transactions**: Circle Paymaster enables all swap transactions to be paid in USDC without requiring gas tokens
- **Optimal Execution Path**: Transactions are executed on the chain offering the lowest fees and best rates
- **Automated Rebalancing**: Smart rebalancing system maintains optimal USDC reserves across all chains
- **Secure Fund Movement**: Utilizes Circle's CCTP v2 for fast, secure, and cost-efficient cross-chain USDC transfers

## User Journeys

### Intent Pay Journey

1. Complete World ID Orb verification
2. Select destination chain and token
3. Enter recipient address (manually or via QR code)
4. View estimated amounts and fees
5. Pay with WLD or USDC.e through World App
6. Behind the scenes: System identifies optimal source chain (primarily Base chain due to Paymaster support)
7. Behind the scenes: Swap is executed from the selected chain with gas fees paid in USDC via Circle Paymaster
8. Receive confirmation when swap is complete

### Intent Wallet Journey

1. Complete Wallet Auth through World App
2. Wallet is automatically created using the user's World App wallet address
3. Fund wallet with USDC (via transfer or World App)
4. Use wallet for transfers, swaps, and DeFi participation
5. Manage all assets without worrying about gas tokens (paid in USDC via Circle Paymaster)

## The IntentPay Vision

Our mission is to remove the technical barriers that prevent mainstream adoption of decentralized finance. By combining World App's human verification, Circle's wallet infrastructure, and 1inch's trading solutions, we've created an ecosystem where users can:

- **Buy any token on any chain with WLD/USDC.e without creating a wallet**
- **Access any DeFi protocol using only USDC, without worrying about gas tokens**

IntentPay transforms the complexity of cross-chain DeFi into a simple, accessible experience for everyone.