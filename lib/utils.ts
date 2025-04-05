import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a cryptographically secure random nonce for use in authentication flows
 * Particularly useful for Sign-In with Ethereum (SIWE) verification
 * 
 * @returns {string} A random hex string
 */
export function generateNonce(): string {
  // Generate a UUID and remove dashes for a clean hex string
  return crypto.randomUUID().replace(/-/g, '');
}

// Re-export all functions from utils/index.ts
export {
  formatCurrency,
  truncateAddress,
  formatTokenAmount,
  toTokenUnits,
  isValidEthereumAddress,
  sleep,
  storage,
  safeAsync
} from './utils/index';
