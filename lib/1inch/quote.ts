/**
 * 1inch Fusion+ Quoter API for IntentPay
 */
import axios from 'axios';
import { USDC_ADDRESSES } from './token';

// The API key should be in an environment variable in production
const API_KEY = "bU3wtFzdNutmkzsdlSuEtYgrvC6SUKiA";

// Interface for the quote request parameters
export interface QuoteRequestParams {
  srcChain: number;
  dstChain: number;
  srcTokenAddress: string;
  dstTokenAddress: string;
  amount: string;
  walletAddress: string;
  enableEstimate?: boolean;
  fee?: number;
  isPermit2?: string;
  permit?: string;
}

// Point interface for auction points
interface AuctionPoint {
  delay: number;
  coefficient: number;
}

// Gas cost configuration interface
interface GasCostConfig {
  gasBumpEstimate: number;
  gasPriceEstimate: string;
  secretsCount: number;
}

// Preset interface for auction presets
interface Preset {
  auctionDuration: number;
  startAuctionIn: number;
  initialRateBump: number;
  auctionStartAmount: string;
  startAmount: string;
  auctionEndAmount: string;
  exclusiveResolver: Record<string, any>;
  costInDstToken: string;
  points: AuctionPoint[];
  allowPartialFills: boolean;
  allowMultipleFills: boolean;
  gasCost: GasCostConfig;
}

// Time locks interface
interface TimeLocks {
  srcWithdrawal: number;
  srcPublicWithdrawal: number;
  srcCancellation: number;
  srcPublicCancellation: number;
  dstWithdrawal: number;
  dstPublicWithdrawal: number;
  dstCancellation: number;
  srcSafetyDeposit: string;
  dstSafetyDeposit: string;
}

// Token pair interface
interface TokenPair {
  srcToken: string;
  dstToken: string;
}

// Currency pair interface
interface PairCurrency {
  usd: TokenPair;
}

// Quote presets interface
interface QuotePresets {
  fast: Preset;
  medium: Preset;
  slow: Preset;
  custom?: Preset;
}

// Quote output interface
export interface QuoteOutput {
  quoteId: Record<string, any>;
  srcTokenAmount: string;
  dstTokenAmount: string;
  presets: QuotePresets;
  srcEscrowFactory: string;
  dstEscrowFactory: string;
  whitelist: string[];
  timeLocks: TimeLocks;
  recommendedPreset: 'fast' | 'slow' | 'medium' | 'custom';
  prices: PairCurrency;
  volume: PairCurrency;
}

/**
 * Get a quote from the 1inch Fusion+ Quoter API
 * @param params The quote request parameters
 * @returns The quote output
 */
export const getQuote = async (params: QuoteRequestParams): Promise<QuoteOutput> => {
  try {
    const url = "https://api.1inch.dev/fusion-plus/quoter/v1.0/quote/receive";
    
    const config = {
      headers: {
        "Authorization": `Bearer ${API_KEY}`
      },
      params: params
    };
    
    const response = await axios.get(url, config);
    return response.data;
  } catch (error) {
    console.error("Error fetching 1inch quote:", error);
    throw error;
  }
};

/**
 * Get a default quote request configuration for sending USDC from one chain to another
 * @param srcChain The source chain ID
 * @param dstChain The destination chain ID
 * @param amount The amount to send in smallest unit
 * @param walletAddress The sender's wallet address
 * @returns The quote request parameters
 */
export const getDefaultQuoteParams = (
  srcChain: number,
  dstChain: number,
  amount: string,
  walletAddress: string
): QuoteRequestParams => {
  const srcTokenAddress = USDC_ADDRESSES[srcChain] || '';
  const dstTokenAddress = USDC_ADDRESSES[dstChain] || '';
  
  if (!srcTokenAddress || !dstTokenAddress) {
    throw new Error(`USDC address not found for chain ${!srcTokenAddress ? srcChain : dstChain}`);
  }
  
  return {
    srcChain,
    dstChain,
    srcTokenAddress,
    dstTokenAddress,
    amount,
    walletAddress,
    enableEstimate: true,
    fee: 0  // No fee for now, can be adjusted later
  };
};

/**
 * Convert a decimal amount to token units based on decimals
 * @param amount The decimal amount as a string
 * @param decimals The number of decimals for the token
 * @returns The amount in token units as a string
 */
export const convertToTokenUnits = (amount: string, decimals: number): string => {
  // Parse amount as a float
  const parsedAmount = parseFloat(amount);
  
  if (isNaN(parsedAmount)) {
    return '0';
  }
  
  // Convert to smallest unit with proper decimal handling
  return (parsedAmount * Math.pow(10, decimals)).toString();
};
