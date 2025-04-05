import axios from 'axios';

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

// Chain interfaces
export interface ChainInfo {
  id: number;
  name: string;
  icon: string;
}

export interface SupportedChainsResponse {
  result: ChainInfo[];
}

// Get all supported chains
export const getSupportedChains = async (): Promise<ChainInfo[]> => {
  try {
    const url = 'https://api.1inch.dev/portfolio/portfolio/v4/general/supported_chains';
    const response = await fetchWithCache<SupportedChainsResponse>(url);
    return response.result || [];
  } catch (error) {
    console.error('Error fetching supported chains:', error);
    return [];
  }
};

// Get chain by ID
export const getChainById = async (chainId: number): Promise<ChainInfo | null> => {
  try {
    const chains = await getSupportedChains();
    return chains.find(chain => chain.id === chainId) || null;
  } catch (error) {
    console.error(`Error fetching chain with ID ${chainId}:`, error);
    return null;
  }
};
