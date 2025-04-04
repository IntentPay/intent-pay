import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// API base URL
const FUSION_API_URL = 'https://fusion.1inch.io/api/v1.0';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.ONEINCH_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }
    
    // Get parameters from the URL
    const searchParams = request.nextUrl.searchParams;
    const chainId = searchParams.get('chainId');
    const walletAddress = searchParams.get('walletAddress');
    const limit = searchParams.get('limit') || '10';
    const page = searchParams.get('page') || '1';
    
    if (!chainId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters: chainId and walletAddress' },
        { status: 400 }
      );
    }
    
    // Make request to 1inch API
    const url = `${FUSION_API_URL}/${chainId}/address/${walletAddress}/orders`;
    const response = await axios.get(url, {
      params: {
        limit,
        page
      },
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch user orders',
        details: error.response?.data
      },
      { status: error.response?.status || 500 }
    );
  }
}
