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
