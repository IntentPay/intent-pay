/**
 * Shared utility functions for IntentPay
 */

/**
 * Format a number as a currency string
 */
export function formatCurrency(amount: number | string, currency = 'USD', decimals = 2): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numAmount);
}

/**
 * Truncate an Ethereum address for display
 */
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return '';
  if (address.length < startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Parse and format token amounts with the correct decimals
 */
export function formatTokenAmount(amount: string | number, decimals = 18): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Convert to normal human-readable format from contract format (which uses the token's decimals)
  const humanReadable = numAmount / Math.pow(10, decimals);
  
  // Format with appropriate number of decimal places based on the token
  return humanReadable.toLocaleString('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}

/**
 * Convert a human-readable amount to the token's contract format with decimals
 */
export function toTokenUnits(amount: string | number, decimals = 18): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const inTokenUnits = numAmount * Math.pow(10, decimals);
  
  // Return as a string to preserve precision for large numbers
  return inTokenUnits.toString();
}

/**
 * Check if a string is a valid Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Delay execution for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create type-safe storage functions
 */
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Error getting item from storage: ${key}`, error);
      return defaultValue;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item in storage: ${key}`, error);
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item from storage: ${key}`, error);
    }
  }
};

/**
 * Handle asynchronous operations with error handling
 */
export async function safeAsync<T>(
  promise: Promise<T>,
  errorHandler?: (error: any) => void
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    }
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}
