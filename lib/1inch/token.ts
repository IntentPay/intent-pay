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
