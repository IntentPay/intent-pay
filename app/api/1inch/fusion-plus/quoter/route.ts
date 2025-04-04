import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// API base URL
const FUSION_PLUS_QUOTER_API_URL = 'https://api.1inch.dev/fusion-plus/quoter/v1.0';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.ONEINCH_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }
    
    // Get all parameters from the URL
    const searchParams = request.nextUrl.searchParams;
    const srcChain = searchParams.get('srcChain');
    const dstChain = searchParams.get('dstChain');
    const srcTokenAddress = searchParams.get('srcTokenAddress');
    const dstTokenAddress = searchParams.get('dstTokenAddress');
    const amount = searchParams.get('amount');
    const walletAddress = searchParams.get('walletAddress');
    const enableEstimate = searchParams.get('enableEstimate') || 'false';
    const fee = searchParams.get('fee');
    const isPermit2 = searchParams.get('isPermit2');
    const permit = searchParams.get('permit');
    
    // Check for required parameters
    if (!srcChain || !dstChain || !srcTokenAddress || !dstTokenAddress || !amount || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Construct query parameters
    const params: Record<string, string> = {
      srcChain,
      dstChain,
      srcTokenAddress,
      dstTokenAddress,
      amount,
      walletAddress,
      enableEstimate
    };
    
    // Add optional parameters if they exist
    if (fee) params.fee = fee;
    if (isPermit2) params.isPermit2 = isPermit2;
    if (permit) params.permit = permit;
    
    // Make request to 1inch API
    const url = `${FUSION_PLUS_QUOTER_API_URL}/quote/receive`;
    const response = await axios.get(url, {
      params,
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching cross-chain quote:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch cross-chain quote',
        details: error.response?.data
      },
      { status: error.response?.status || 500 }
    );
  }
}
