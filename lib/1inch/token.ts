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

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

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

/**
 * Get all 1inch whitelisted tokens across multiple chains
 * Uses localStorage caching to improve performance and backend API route for security
 */
export async function getMultiChainTokenList(): Promise<TokenListResponseDto> {
  // Try to get data from cache first
  const cachedData = getCachedTokens();
  if (cachedData) {
    return cachedData;
  }

  try {
    // Call the backend API route instead of directly calling 1inch API
    const response = await axios.get('/api/1inch/token-list');
    
    // Cache the result
    cacheTokenData(response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching token list:', error);
    throw error;
  }
}

/**
 * Get tokens filtered by a specific chain ID
 */
export function getTokensByChain(chainId: number, tokenList?: TokenListResponseDto): TokenInfoDto[] {
  if (!tokenList) {
    const cachedData = getCachedTokens();
    if (!cachedData) {
      return [];
    }
    tokenList = cachedData;
  }
  
  return tokenList.tokens.filter(token => token.chainId === chainId);
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
  
  const normalizedQuery = query.toLowerCase().trim();
  
  let filteredTokens = tokenList.tokens;
  
  // Filter by chain if specified
  if (chainId !== undefined) {
    filteredTokens = filteredTokens.filter(token => token.chainId === chainId);
  }
  
  // Search by name or symbol
  return filteredTokens.filter(token => 
    token.name.toLowerCase().includes(normalizedQuery) || 
    token.symbol.toLowerCase().includes(normalizedQuery)
  );
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
    const cachedData = localStorage.getItem('inch_token_cache');
    if (!cachedData) return null;
    
    const parsedCache: CachedTokenData = JSON.parse(cachedData);
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (now - parsedCache.timestamp < CACHE_DURATION) {
      return parsedCache.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving cached token data:', error);
    return null;
  }
}
