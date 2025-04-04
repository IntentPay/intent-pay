/**
 * 1inch API configuration for IntentPay
 */

export const INCH_API_KEY = process.env.ONEINCH_API_KEY || '';
export const FUSION_API_URL = 'https://fusion.1inch.io/v1.0';

// Supported chains for Fusion+ integration
export const SUPPORTED_CHAINS = {
  ARBITRUM: 42161,
  ETHEREUM: 1,
  BASE: 8453,
  AVALANCHE: 43114
};

// Common token addresses (for reference)
export const TOKENS = {
  // Key format: [CHAIN_ID]_[SYMBOL]
  // USDC addresses
  '42161_USDC': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum
  '1_USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum
  '8453_USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  '43114_USDC': '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Avalanche
};

// Chain names for UI display
export const CHAIN_NAMES = {
  '42161': 'Arbitrum',
  '1': 'Ethereum',
  '8453': 'Base',
  '43114': 'Avalanche'
};
