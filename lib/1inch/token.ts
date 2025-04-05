/**
 * 1inch Token API wrapper for IntentPay (now using backend proxy)
 */
import axios from 'axios';

// Token interfaces based on the API response
export interface TokenInfoDto {
  address: string;
  chainId: number;
  decimals: number;
  extensions?: any;
  logoURI: string;
  name: string;
  symbol: string;
  tags: string[];
}

export interface TokenListResponseDto {
  keywords: string[];
  logoURI: string;
  name: string;
  tags: Record<string, any>;
  tags_order: string[];
  timestamp: string;
  tokens: TokenInfoDto[];
  version: {
    major: number;
    minor: number;
    patch: number;
  };
}

// Cached token data with timestamp
interface CachedTokenData {
  data: TokenListResponseDto;
  timestamp: number;
}

// Cache duration in milliseconds (2 hours instead of 30 minutes)
const CACHE_DURATION = 2 * 60 * 60 * 1000;

// USDC token addresses for different chains
export const USDC_ADDRESSES: Record<number, string> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum Mainnet
  10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // Optimism
  56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // Binance Smart Chain
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum One
  43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Avalanche
  // 添加更多链的USDC地址
};

/**
 * Get the USDC token address for a specific chain
 */
export function getUsdcAddressForChain(chainId: number): string | undefined {
  return USDC_ADDRESSES[chainId];
}

/**
 * Get USDC token info for a specific chain
 */
export async function getUsdcTokenInfo(chainId: number): Promise<TokenInfoDto | null> {
  const usdcAddress = getUsdcAddressForChain(chainId);
  if (!usdcAddress) return null;
  
  const tokenList = await getMultiChainTokenList();
  return tokenList.tokens.find(token => 
    token.chainId === chainId && 
    token.address.toLowerCase() === usdcAddress.toLowerCase()
  ) || null;
}

/**
 * Search tokens using the 1inch Token API's search endpoint
 */
export async function searchTokensApi(
  query: string,
  chainId: number,
  limit: number = 10
): Promise<TokenInfoDto[]> {
  try {
    const response = await axios.get('/api/1inch/token/search', {
      params: {
        query,
        chainId,
        limit
      }
    });
    
    return response.data || [];
  } catch (error) {
    console.error('Error searching tokens:', error);
    return [];
  }
}

// In-memory data cache
let memoryCache: CachedTokenData | null = null;

// Flag to prevent multiple concurrent API calls
let isTokenListFetching = false;

// Promise to track ongoing fetch operations
let currentFetchPromise: Promise<TokenListResponseDto> | null = null;

/**
 * Get all 1inch whitelisted tokens across multiple chains
 * Uses in-memory and localStorage caching to improve performance
 * Includes request deduplication to prevent API overloading
 */
export async function getMultiChainTokenList(): Promise<TokenListResponseDto> {
  // First check memory cache - this is fastest
  if (memoryCache && (Date.now() - memoryCache.timestamp < CACHE_DURATION)) {
    return memoryCache.data;
  }
  
  // Then check localStorage cache
  const cachedData = getCachedTokens();
  if (cachedData) {
    // Store in memory for faster future access
    memoryCache = {
      data: cachedData,
      timestamp: Date.now()
    };
    return cachedData;
  }
  
  // If there's already a request in progress, wait for it instead of making a new one
  if (isTokenListFetching && currentFetchPromise) {
    try {
      return await currentFetchPromise;
    } catch (error) {
      console.error('Error in ongoing token fetch:', error);
      // Continue to make a new request if the ongoing one failed
    }
  }
  
  isTokenListFetching = true;
  
  try {
    // Create a new promise for this fetch operation
    currentFetchPromise = (async () => {
      const response = await axios.get('/api/1inch/token-list');
      const data = response.data;
      
      // Validate the response data
      if (!data || !data.tokens || !Array.isArray(data.tokens)) {
        console.error('Invalid token list format received:', data);
        throw new Error('Invalid token list data format');
      }
      
      // Store in both memory and localStorage
      memoryCache = {
        data,
        timestamp: Date.now()
      };
      cacheTokenData(data);
      
      return data;
    })();
    
    // Wait for the fetch to complete and return results
    return await currentFetchPromise;
  } catch (error) {
    console.error('Error fetching token list:', error);
    
    // If memory cache exists but is expired, use it anyway in case of error
    if (memoryCache && memoryCache.data) {
      return memoryCache.data;
    }
    
    // Last resort - check localStorage again
    const lastResortCache = getCachedTokens();
    if (lastResortCache) {
      return lastResortCache;
    }
    
    throw error;
  } finally {
    // Reset flags when done (success or error)
    isTokenListFetching = false;
    currentFetchPromise = null;
  }
}

/**
 * Get tokens filtered by a specific chain ID
 */
export function getTokensByChain(chainId: number, tokenList?: TokenListResponseDto): TokenInfoDto[] {
  if (!tokenList) {
    const cachedData = getCachedTokens();
    if (!cachedData) {
      console.warn('No cached token data available');
      return [];
    }
    tokenList = cachedData;
  }
  
  // Validate tokenList structure
  if (!tokenList.tokens || !Array.isArray(tokenList.tokens)) {
    console.error('Invalid token list structure:', tokenList);
    return [];
  }
  
  const filteredTokens = tokenList.tokens.filter(token => token.chainId === chainId);
  console.log(`Found ${filteredTokens.length} tokens for chain ID ${chainId}`);
  
  return filteredTokens;
}

/**
 * Search tokens by name or symbol
 */
export function searchTokens(
  query: string, 
  chainId?: number, 
  tokenList?: TokenListResponseDto
): TokenInfoDto[] {
  if (!tokenList) {
    const cachedData = getCachedTokens();
    if (!cachedData) {
      return [];
    }
    tokenList = cachedData;
  }
  
  if (!query) {
    return chainId ? 
      tokenList.tokens.filter(token => token.chainId === chainId) : 
      tokenList.tokens;
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  
  const matched = tokenList.tokens.filter(token => {
    // Filter by chainId if provided
    if (chainId && token.chainId !== chainId) {
      return false;
    }
    
    // Match by name, symbol, or address
    return token.name.toLowerCase().includes(normalizedQuery) || 
           token.symbol.toLowerCase().includes(normalizedQuery) || 
           token.address.toLowerCase().includes(normalizedQuery);
  });
  
  return matched;
}

/**
 * Store token data in localStorage cache
 */
function cacheTokenData(data: TokenListResponseDto): void {
  try {
    const cacheData: CachedTokenData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem('inch_token_cache', JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching token data:', error);
  }
}

/**
 * Get cached token data if it's still valid
 */
function getCachedTokens(): TokenListResponseDto | null {
  try {
    // If we have in-memory cache, use it first
    if (memoryCache && (Date.now() - memoryCache.timestamp < CACHE_DURATION)) {
      return memoryCache.data;
    }
    
    const cachedData = localStorage.getItem('inch_token_cache');
    if (!cachedData) return null;
    
    const parsedCache: CachedTokenData = JSON.parse(cachedData);
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (now - parsedCache.timestamp < CACHE_DURATION) {
      // Store in memory for faster access next time
      memoryCache = parsedCache;
      return parsedCache.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving cached token data:', error);
    return null;
  }
}
