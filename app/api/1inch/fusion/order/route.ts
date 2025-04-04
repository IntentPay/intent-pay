import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// API base URL
const FUSION_API_URL = 'https://fusion.1inch.io/api/v1.0';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ONEINCH_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }
    
    // Parse request body
    const params = await request.json();
    const { chainId, fromTokenAddress, toTokenAddress, amount, walletAddress, receiver, slippage, allowPartialFill, nonce } = params;
    
    if (!chainId || !fromTokenAddress || !toTokenAddress || !amount || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Construct request payload
    const payload = {
      fromTokenAddress,
      toTokenAddress,
      amount, 
      walletAddress,
      receiver: receiver || walletAddress,
      slippage: slippage || '1',
      allowPartialFill: allowPartialFill || false,
      nonce
    };
    
    // Make request to 1inch API
    const url = `${FUSION_API_URL}/${chainId}/order`;
    const response = await axios.post(url, payload, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create order',
        details: error.response?.data
      },
      { status: error.response?.status || 500 }
    );
  }
}
