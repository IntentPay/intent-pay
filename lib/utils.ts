import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
