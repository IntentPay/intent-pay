/**
 * 1inch Fusion+ Quoter API for IntentPay
 */
import axios from 'axios';
import { USDC_ADDRESSES } from './token';

// Cache for API responses
interface CacheEntry {
  data: any;
  timestamp: number;
}

const API_CACHE: Record<string, CacheEntry> = {};
const CACHE_TTL = 30000; // 30 seconds cache lifetime
const API_RATE_LIMIT = 1000; // 1 second between requests

// Keep track of last API call timestamp
let lastApiCallTimestamp = 0;

// Function to wait for rate limit
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeElapsed = now - lastApiCallTimestamp;
  
  if (timeElapsed < API_RATE_LIMIT && lastApiCallTimestamp !== 0) {
    const waitTime = API_RATE_LIMIT - timeElapsed;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastApiCallTimestamp = Date.now();
};

// Base API configuration
const apiConfig = {
  headers: {
    'Authorization': 'Bearer bU3wtFzdNutmkzsdlSuEtYgrvC6SUKiA',
    'Content-Type': 'application/json',
  },
};

// Create the full API URL
const createApiUrl = (endpoint: string) => {
  return `https://api.1inch.dev/fusion-plus/quoter/v1.0${endpoint}`;
};

// Generic API request function with caching
const fetchWithCache = async <T>(url: string, params: any = {}): Promise<T> => {
  const cacheKey = `${url}:${JSON.stringify(params)}`;
  
  // Check if we have a valid cached response
  if (API_CACHE[cacheKey] && (Date.now() - API_CACHE[cacheKey].timestamp) < CACHE_TTL) {
    console.log('Using cached response for:', url);
    return API_CACHE[cacheKey].data as T;
  }
  
  // Wait for rate limit to be respected
  await waitForRateLimit();
  
  try {
    const response = await axios.get(url, { ...apiConfig, params });
    
    // Cache the response
    API_CACHE[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

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
  useTestData?: boolean;
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
export interface Preset {
  auctionDuration: number;
  startAuctionIn: number;
  initialRateBump: number;
  auctionStartAmount: string;
  startAmount: string;
  auctionEndAmount: string;
  exclusiveResolver: Record<string, any> | null;
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
  quoteId: string | Record<string, any>;
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
  priceImpactPercent?: number;
}

/**
 * Get a quote from the 1inch Fusion+ Quoter API
 * @param params The parameters for the quote request
 * @returns The quote response
 */
export const getQuote = async (params: QuoteRequestParams): Promise<QuoteOutput> => {
  try {
    // 使用内部API代理来保护API密钥
    const queryParams = new URLSearchParams();
    
    // 添加所有参数到查询字符串
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    // 如果useTestData为true，则使用测试数据
    if (params.useTestData) {
      console.log("Using test data in getQuote function");
      // 返回一个模拟的响应，根据用户选择的代币提供不同的兑换率
      const srcAmount = params.amount;
      let dstAmount = srcAmount; // 默认1:1兑换
      
      // 检查源和目标代币地址，应用不同的兑换率
      if (params.srcTokenAddress.toLowerCase().includes('usdc') && 
          params.dstTokenAddress.toLowerCase().includes('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')) {
        // USDC 到 ETH 的兑换率 (1 USDC = 0.0003 ETH)
        dstAmount = (BigInt(srcAmount) * BigInt(3) / BigInt(10000)).toString();
      } else if (params.srcTokenAddress.toLowerCase().includes('usdc') && 
                params.dstTokenAddress.toLowerCase().includes('wbtc')) {
        // USDC 到 WBTC 的兑换率 (1 USDC = 0.00002 WBTC)
        dstAmount = (BigInt(srcAmount) * BigInt(2) / BigInt(100000)).toString();
      }
      
      // 模拟网络费用 (0.3%)
      const fee = (BigInt(srcAmount) * BigInt(3) / BigInt(1000)).toString();
      
      return {
        quoteId: "test-quote-id-" + Date.now(),
        srcTokenAmount: srcAmount,
        dstTokenAmount: dstAmount,
        presets: {
          fast: {
            auctionDuration: 180,
            startAuctionIn: 20,
            initialRateBump: 10000,
            auctionStartAmount: dstAmount,
            startAmount: dstAmount,
            auctionEndAmount: (BigInt(dstAmount) - BigInt(fee)).toString(),
            exclusiveResolver: null,
            costInDstToken: fee,
            points: [{ delay: 120, coefficient: 6608 }],
            allowPartialFills: false,
            allowMultipleFills: false,
            gasCost: {
              gasBumpEstimate: 0,
              gasPriceEstimate: "0",
              secretsCount: 1
            }
          },
          medium: {
            auctionDuration: 360,
            startAuctionIn: 20,
            initialRateBump: 10000,
            auctionStartAmount: dstAmount,
            startAmount: dstAmount,
            auctionEndAmount: (BigInt(dstAmount) - BigInt(fee)).toString(),
            exclusiveResolver: null,
            costInDstToken: fee,
            points: [{ delay: 120, coefficient: 6608 }],
            allowPartialFills: false,
            allowMultipleFills: false,
            gasCost: {
              gasBumpEstimate: 0,
              gasPriceEstimate: "0",
              secretsCount: 1
            }
          },
          slow: {
            auctionDuration: 600,
            startAuctionIn: 20,
            initialRateBump: 10000,
            auctionStartAmount: dstAmount,
            startAmount: dstAmount,
            auctionEndAmount: (BigInt(dstAmount) - BigInt(fee)).toString(),
            exclusiveResolver: null,
            costInDstToken: fee,
            points: [{ delay: 120, coefficient: 6608 }],
            allowPartialFills: false,
            allowMultipleFills: false,
            gasCost: {
              gasBumpEstimate: 0,
              gasPriceEstimate: "0",
              secretsCount: 1
            }
          }
        },
        recommendedPreset: "fast",
        prices: {
          usd: {
            srcToken: "1.0",
            dstToken: params.dstTokenAddress.toLowerCase().includes('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') ? "3333.33" : "60000.0"
          }
        },
        volume: {
          usd: {
            srcToken: "1.0",
            dstToken: params.dstTokenAddress.toLowerCase().includes('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') ? "3333.33" : "60000.0"
          }
        },
        srcEscrowFactory: "0x1234567890123456789012345678901234567890",
        dstEscrowFactory: "0x0987654321098765432109876543210987654321",
        timeLocks: {
          srcWithdrawal: 60,
          srcPublicWithdrawal: 396,
          srcCancellation: 552,
          srcPublicCancellation: 672,
          dstWithdrawal: 36,
          dstPublicWithdrawal: 336,
          dstCancellation: 456,
          srcSafetyDeposit: "1000000",
          dstSafetyDeposit: "1000000"
        },
        whitelist: [
          "0x33b41fe18d3a39046ad672f8a0c8c415454f629c",
          "0x1654477dc06e26d3b459ad3848cae077215b2a1e"
        ],
        priceImpactPercent: 0.1
      } as QuoteOutput;
    }
    
    // 使用我们的内部API代理来保护API密钥
    const url = `/api/1inch/fusion-plus/quoter?${queryParams.toString()}`;
    
    // 使用fetch调用内部API
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    return data as QuoteOutput;
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
