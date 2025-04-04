/**
 * 1inch Fusion+ API wrapper for IntentPay (using backend proxy for security)
 */
import axios from 'axios';

/**
 * Get supported tokens for Fusion on a specific chain
 * @param chainId - The blockchain network ID
 * @returns List of supported tokens
 */
export async function getSupportedTokens(chainId: number) {
  try {
    const response = await axios.get(`/api/1inch/fusion/supported-tokens?chainId=${chainId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching supported tokens:', error);
    throw error;
  }
}

/**
 * Interface for create order parameters
 */
export interface CreateOrderParams {
  chainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  walletAddress: string;
  receiver?: string;
  slippage?: string;
  allowPartialFill?: boolean;
  nonce?: string;
}

/**
 * Create a Fusion order (intent-based swap)
 * @param params - Order parameters
 * @returns Order data including order ID
 */
export async function createOrder(params: CreateOrderParams) {
  try {
    const response = await axios.post('/api/1inch/fusion/order', params);
    return response.data;
  } catch (error) {
    console.error('Error creating Fusion order:', error);
    throw error;
  }
}

/**
 * Get the status of a specific order
 * @param chainId - The blockchain network ID
 * @param orderId - The unique order identifier
 * @returns Order status and details
 */
export async function getOrderStatus(chainId: number, orderId: string) {
  try {
    const response = await axios.get(`/api/1inch/fusion/order-status?chainId=${chainId}&orderId=${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching order status:', error);
    throw error;
  }
}

/**
 * Cancel an existing order
 * @param chainId - The blockchain network ID
 * @param orderId - The unique order identifier
 * @returns Cancellation confirmation
 */
export async function cancelOrder(chainId: number, orderId: string) {
  try {
    const response = await axios.delete(`/api/1inch/fusion/order?chainId=${chainId}&orderId=${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
}

/**
 * Get quote for a token swap
 * @param chainId - The blockchain network ID
 * @param fromTokenAddress - Address of the source token
 * @param toTokenAddress - Address of the destination token
 * @param amount - Amount to swap in token decimals
 * @returns Quote information including price and gas estimates
 */
export async function getQuote(chainId: number, fromTokenAddress: string, toTokenAddress: string, amount: string) {
  try {
    const response = await axios.get(`/api/1inch/fusion/quote`, {
      params: {
        chainId,
        fromTokenAddress,
        toTokenAddress,
        amount
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting quote:', error);
    throw error;
  }
}

/**
 * Get user orders history
 * @param chainId - The blockchain network ID
 * @param walletAddress - The user's wallet address
 * @param limit - Maximum number of orders to return
 * @param page - Page number for pagination
 * @returns List of user's orders
 */
export async function getUserOrders(chainId: number, walletAddress: string, limit = 10, page = 1) {
  try {
    const response = await axios.get(`/api/1inch/fusion/user-orders`, {
      params: {
        chainId,
        walletAddress,
        limit,
        page
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
}

/**
 * Get cross-chain quote for token swap using Fusion+ Quoter API
 * @param srcChain - Source chain ID
 * @param dstChain - Destination chain ID
 * @param srcTokenAddress - Source token address
 * @param dstTokenAddress - Destination token address
 * @param amount - Amount to swap (in source token decimals)
 * @param walletAddress - User's wallet address
 * @param options - Optional parameters (enableEstimate, fee, isPermit2, permit)
 * @returns Quote information including expected output, fees, and other details
 */
export async function getCrossChainQuote(
  srcChain: number,
  dstChain: number,
  srcTokenAddress: string,
  dstTokenAddress: string,
  amount: string,
  walletAddress: string,
  options?: {
    enableEstimate?: boolean;
    fee?: number;
    isPermit2?: string;
    permit?: string;
  }
) {
  try {
    const params: Record<string, string> = {
      srcChain: srcChain.toString(),
      dstChain: dstChain.toString(),
      srcTokenAddress,
      dstTokenAddress,
      amount,
      walletAddress,
      enableEstimate: (options?.enableEstimate ?? false).toString()
    };
    
    // Add optional parameters if provided
    if (options?.fee !== undefined) params.fee = options.fee.toString();
    if (options?.isPermit2) params.isPermit2 = options.isPermit2;
    if (options?.permit) params.permit = options.permit;
    
    const response = await axios.get('/api/1inch/fusion-plus/quoter', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting cross-chain quote:', error);
    throw error;
  }
}
