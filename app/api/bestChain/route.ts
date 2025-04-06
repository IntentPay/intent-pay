import { NextResponse } from 'next/server';
import axios from 'axios';
import { getQuote } from '@/lib/1inch/quote';

// Define supported chain IDs
const SUPPORTED_CHAINS = {
  ethereum: 1,
  base: 8453,
  avalanche: 43114
};

// Define API response type
interface ChainFeeResponse {
  bestChain: {
    id: number;
    name: string;
  };
  fees: {
    [chainId: string]: {
      fee: string;
      feeUSD: number;
      chainName: string;
    }
  };
  timestamp: number;
}

// Function to get token price
async function getTokenPrice(tokenAddress: string, chainId: number = 1): Promise<number> {
  const url = `https://api.1inch.dev/price/v1.1/${chainId}`;
  
  const config = {
    headers: {
      "Authorization": "Bearer bU3wtFzdNutmkzsdlSuEtYgrvC6SUKiA"
    }
  };
  
  // Build query parameters
  const params = {
    tokens: tokenAddress,
    currency: "USD"
  };

  try {
    const response = await axios.get(url, { ...config, params });
    
    // Get price from response
    if (response.data && response.data.tokens && response.data.tokens[tokenAddress]) {
      return response.data.tokens[tokenAddress].price;
    } else {
      throw new Error('Unable to get token price');
    }
  } catch (error) {
    console.error('Error getting token price:', error);
    // Return a default price to avoid the entire application failing due to API errors
    return chainId === 1 ? 3500 : 3500; // Use a reasonable ETH price as default
  }
}

// Get gas fee for a specific chain
async function getChainFee(chainId: number, amount: string = '1000000'): Promise<{fee: string, feeUSD: number}> {
  try {
    // USDC addresses
    const usdcAddress = chainId === 1 
      ? '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // Ethereum USDC
      : chainId === 8453 
        ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base USDC
        : '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'; // Avalanche USDC
    
    // ETH address (same address on all chains)
    const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    
    // Get quote
    const quote = await getQuote({
      srcChain: chainId,
      dstChain: chainId, // Transaction on the same chain
      amount: amount, // 1 USDC (6 decimal places)
      srcTokenAddress: usdcAddress,
      dstTokenAddress: ethAddress,
      walletAddress: '0x0000000000000000000000000000000000000000',
      enableEstimate: true,
      useTestData: false
    });
    
    // Extract gas fee from quote
    let fee = '0.003'; // Default value
    
    if (quote && 
        quote.recommendedPreset && 
        quote.presets && 
        quote.presets[quote.recommendedPreset] && 
        quote.presets[quote.recommendedPreset]?.costInDstToken) {
      
      const recommendedPreset = quote.recommendedPreset;
      const preset = quote.presets[recommendedPreset];
      
      if (preset && preset.costInDstToken) {
        // Convert wei to ETH
        fee = (parseFloat(preset.costInDstToken) / 1e18).toString();
      }
    }
    
    // Get ETH price
    const ethPrice = await getTokenPrice(ethAddress, chainId);
    
    // Calculate USD value
    const feeUSD = parseFloat(fee) * ethPrice;
    
    return { fee, feeUSD };
  } catch (error) {
    console.error(`Error getting gas fee for chain ${chainId}:`, error);
    // Return a default value
    return { fee: '0.003', feeUSD: 10.5 };
  }
}

// Main API handler function
export async function GET(request: Request) {
  try {
    // Get parameters from URL
    const { searchParams } = new URL(request.url);
    const amount = searchParams.get('amount') || '1000000'; // Default 1 USDC
    
    // Get gas fees for all supported chains
    const feesPromises = Object.entries(SUPPORTED_CHAINS).map(async ([chainName, chainId]) => {
      const { fee, feeUSD } = await getChainFee(chainId, amount);
      return { chainId, chainName, fee, feeUSD };
    });
    
    const feesResults = await Promise.all(feesPromises);
    
    // Find the chain with the lowest gas fee
    const bestChain = feesResults.reduce((best, current) => {
      return current.feeUSD < best.feeUSD ? current : best;
    }, feesResults[0]);
    
    // Build response
    const fees: {[chainId: string]: {fee: string, feeUSD: number, chainName: string}} = {};
    feesResults.forEach(result => {
      fees[result.chainId] = {
        fee: result.fee,
        feeUSD: result.feeUSD,
        chainName: result.chainName
      };
    });
    
    const response: ChainFeeResponse = {
      bestChain: {
        id: bestChain.chainId,
        name: bestChain.chainName
      },
      fees,
      timestamp: Date.now()
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('API error:', error);
    // Return a default response
    return NextResponse.json(
      {
        bestChain: {
          id: 1,
          name: 'ethereum'
        },
        fees: {
          '1': { fee: '0.003', feeUSD: 10.5, chainName: 'ethereum' },
          '8453': { fee: '0.002', feeUSD: 7.0, chainName: 'base' },
          '43114': { fee: '0.001', feeUSD: 3.5, chainName: 'avalanche' }
        },
        timestamp: Date.now(),
        error: (error as Error).message
      },
      { status: 200 }
    );
  }
}
