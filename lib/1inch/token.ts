/**
 * 1inch Token API wrapper for IntentPay (now using backend proxy)
 */
import axios from 'axios';

// Token interfaces based on the API response
export interface TokenInfoDto {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  tags: string[];
  chainId?: number; // Make chainId optional to maintain compatibility
}

export interface ProtocolTokenDto {
  tokens: Record<string, TokenInfoDto>;
}

export interface TokenListResponseDto {
  tokens: TokenInfoDto[];
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
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // BASE
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum One
  43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Avalanche
  // 添加更多链的USDC地址
};

// Cache for API responses
interface CacheEntry {
  data: any;
  timestamp: number;
}

const API_CACHE: Record<string, CacheEntry> = {};
const CACHE_TTL = 60000; // 60 seconds cache lifetime
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

// The API key - in production this should be in an environment variable
const API_KEY = "bU3wtFzdNutmkzsdlSuEtYgrvC6SUKiA";

// Base API configuration
const apiConfig = {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
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
    const response = await axios.get<T>(url, { ...apiConfig, params });
    
    // Cache the response
    API_CACHE[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
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
    interface SearchResponse {
      data: TokenInfoDto[];
    }
    
    const response = await fetchWithCache<SearchResponse>('/api/1inch/token/search', {
      params: {
        query,
        chainId,
        limit
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching tokens:', error);
    return [];
  }
}

/**
 * Fetch the full multi-chain token list from the 1inch API via our backend
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
      // Use TokenListResponseDto here
      const response = await fetchWithCache<TokenListResponseDto | TokenInfoDto[]>('/api/1inch/token-list');
      
      // Log the raw response for debugging
      console.log("Raw response from /api/1inch/token-list:", response);

      // Determine where the token array is located
      let tokensArray: TokenInfoDto[] | undefined;
      if (Array.isArray(response)) {
        // Case 1: The response itself is the array
        tokensArray = response;
      } else if (response && Array.isArray((response as TokenListResponseDto).tokens)) {
        // Case 2: The response has a 'tokens' property which is the array
        tokensArray = (response as TokenListResponseDto).tokens;
      }
      
      // Validate the response data
      if (tokensArray) {
        const tokenListResponse = { tokens: tokensArray };
        // Store in both memory and localStorage
        memoryCache = {
          data: tokenListResponse,
          timestamp: Date.now()
        };
        cacheTokenData(tokenListResponse);
        
        return tokenListResponse;
      }
      
      console.error('Invalid token list format received:', response);
      throw new Error('Invalid token list data format');
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

// In-memory data cache
let memoryCache: CachedTokenData | null = null;

// Flag to prevent multiple concurrent API calls
let isTokenListFetching = false;

// Promise to track ongoing fetch operations
let currentFetchPromise: Promise<TokenListResponseDto> | null = null;

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
