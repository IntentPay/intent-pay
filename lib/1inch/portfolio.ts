/**
 * 1inch Portfolio API wrapper for IntentPay (using backend proxy for security)
 */
import axios from 'axios';

/**
 * Get list of supported chains for Portfolio
 * @returns List of supported blockchain networks
 */
export async function getSupportedChains() {
  try {
    const response = await axios.get('/api/1inch/portfolio/supported-chains');
    return response.data;
  } catch (error) {
    console.error('Error fetching supported chains:', error);
    throw error;
  }
}

/**
 * Get list of supported protocols for Portfolio
 * @returns List of supported DeFi protocols
 */
export async function getSupportedProtocols() {
  try {
    const response = await axios.get('/api/1inch/portfolio/supported-protocols');
    return response.data;
  } catch (error) {
    console.error('Error fetching supported protocols:', error);
    throw error;
  }
}

// Protocols Overview APIs

/**
 * Get current value overview for protocols
 * @param address - Wallet address to get overview for
 * @returns Current value data for protocols
 */
export async function getProtocolsCurrentValue(address: string) {
  try {
    const response = await axios.get('/api/1inch/portfolio/protocols/current-value', {
      params: { address }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching protocols current value:', error);
    throw error;
  }
}

/**
 * Get profit and loss overview for protocols
 * @param address - Wallet address to get overview for
 * @returns Profit and loss data for protocols
 */
export async function getProtocolsProfitAndLoss(address: string, chainId: number) {
  try {
    const response = await axios.get('/api/1inch/portfolio/protocols/profit-and-loss', {
      params: { address, chainId, useCache: true }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching protocols profit and loss:', error);
    throw error;
  }
}

/**
 * Get detailed overview for protocols
 * @param address - Wallet address to get details for
 * @returns Detailed protocol data
 */
export async function getProtocolsDetails(address: string, chainId: number) {
  try {
    const response = await axios.get('/api/1inch/portfolio/protocols/details', {
      params: { address, chainId, useCache: true }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching protocols details:', error);
    throw error;
  }
}

// ERC20 Tokens Overview APIs

/**
 * Get current value overview for ERC20 tokens
 * @param address - Wallet address to get overview for
 * @returns Current value data for ERC20 tokens
 */
export async function getERC20CurrentValue(address: string, chainId: number) {
  try {
    const response = await axios.get('/api/1inch/portfolio/erc20/current-value', {
      params: { address, chainId, useCache: true }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching ERC20 current value:', error);
    throw error;
  }
}

/**
 * Get profit and loss overview for ERC20 tokens
 * @param address - Wallet address to get overview for
 * @returns Profit and loss data for ERC20 tokens
 */
export async function getERC20ProfitAndLoss(address: string, chainId: number) {
  try {
    const response = await axios.get('/api/1inch/portfolio/erc20/profit-and-loss', {
      params: { address, chainId, useCache: true }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching ERC20 profit and loss:', error);
    throw error;
  }
}

/**
 * Get detailed overview for ERC20 tokens
 * @param address - Wallet address to get details for
 * @returns Detailed ERC20 token data
 */
export async function getERC20Details(address: string, chainId: number) {
  try {
    const response = await axios.get('/api/1inch/portfolio/erc20/details', {
      params: { address, chainId, useCache: true }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching ERC20 details:', error);
    throw error;
  }
}
