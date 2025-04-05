# IntentPay: Seamless DeFi Transactions Through World App
**IntentPay** is a revolutionary mini app in the **World App** ecosystem that enables seamless cross-chain transactions without requiring users to create or manage additional crypto wallets. By combining World ID verification, Circle's payment infrastructure, and 1inch's advanced trading platform, we've created a frictionless crypto experience accessible to everyone.

## Our Solution: Direct Token Swaps in World App
IntentPay allows users who have completed World ID verification to directly request token swaps through their World App, without creating any additional wallets. Here's how it works:
- **World ID Verification**: Users are already verified as unique humans through the World App ecosystem
- **Simple Payment**: Pay with WLD or USDC.e directly through your existing World App wallet
- **Flexible Destination**: Enter any recipient address manually or scan a QR code
- **Multi-Chain Support**: Select any destination chain and token
- **Transparent Pricing**: View estimated amounts and fees before confirming
- **Seamless Execution**: Our backend Circle wallet executes the 1inch swap using paymaster technology
Users can acquire any token on any supported chain without understanding blockchain complexities, gas fees, or managing additional wallets. It's as simple as selecting what you want and paying through World App.

## Technical Architecture
### World App Integration
- **World ID Verification**: Sybil-resistant verification ensures every user is a unique human
- **MiniKit Integration**: Seamless integration within the World App ecosystem
- **Direct Payment Processing**: Process WLD and USDC.e payments within the familiar World App interface
- **No Additional Wallet Creation**: Users leverage their existing World App wallet for all operations

### Circle Integration
- **Backend Wallet Infrastructure**: Powers all backend transactions after receiving payment from users
- **Transaction Execution**: Handle cross-chain operations without requiring user-managed gas
- **CCTP v2 Utilization**: Cross-Chain Transfer Protocol for secure USDC movement across chains
- **Paymaster Integration**: Enables gas-free transactions paid in USDC on supported networks

### 1inch Integration
- **Fusion Protocol**: Gasless trading with MEV protection
- **Cross-Chain Swaps**: Execute trades across multiple blockchain networks
- **Deep Liquidity Access**: Optimal price execution through aggregated liquidity sources

### Cross-Chain Liquidity Management
- **Multi-Chain Treasury**: Backend wallets maintained on Ethereum, Base, and other supported chains
- **Dynamic Route Selection**: When a swap is initiated, multiple chains are queried for the best rates
- **Optimal Execution Path**: Transactions are executed on the chain offering the lowest fees and best rates
- **Automated Rebalancing**: Smart rebalancing system maintains optimal USDC reserves across all chains

## User Journey
1. Open IntentPay mini app within World App
2. Select destination chain and token
3. Enter recipient address (manually or via QR code)
4. View estimated amounts and fees
5. Pay with WLD or USDC.e through World App
6. Behind the scenes: Our system identifies the optimal source chain
7. Behind the scenes: Swap is executed from our Circle wallet with gas fees paid via Paymaster
8. Receive confirmation when swap is complete

## The IntentPay Vision
Our mission is to remove the technical barriers that prevent mainstream adoption of decentralized finance. By leveraging World App's existing wallet infrastructure and combining it with Circle's payment solutions and 1inch's trading platform, we've created a system where users can:
- **Buy any token on any chain with WLD/USDC.e without creating additional wallets**
- **Send tokens to any address without worrying about gas fees or blockchain complexity**
IntentPay transforms the complexity of cross-chain DeFi into a simple, accessible experience that leverages the existing World App ecosystem.