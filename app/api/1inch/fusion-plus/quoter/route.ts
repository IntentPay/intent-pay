import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

// API base URL
const FUSION_PLUS_QUOTER_API_URL = 'https://api.1inch.dev/fusion-plus/quoter/v1.0';

// 用于测试的固定响应数据，当useTestData=true时使用
const TEST_RESPONSE = {
  quoteId: "test-quote-id",
  srcTokenAmount: "1000000000000000000",
  dstTokenAmount: "299715033940591", // 约0.0003 ETH，1 USDC = 0.0003 ETH
  presets: {
    fast: {
      auctionDuration: 180,
      startAuctionIn: 20,
      initialRateBump: 10000,
      costInDstToken: "5000000000000"
    },
    medium: {
      auctionDuration: 360,
      startAuctionIn: 20,
      initialRateBump: 10000,
      costInDstToken: "5000000000000"
    },
    slow: {
      auctionDuration: 600,
      startAuctionIn: 20,
      initialRateBump: 10000,
      costInDstToken: "5000000000000"
    }
  },
  recommendedPreset: "fast",
  prices: {
    usd: {
      srcToken: "1.0",
      dstToken: "3333.33"
    }
  },
  srcChain: "1",
  dstChain: "56",
  srcTokenAddress: "0x1111111111111111111111111111111111111111",
  dstTokenAddress: "0x2222222222222222222222222222222222222222",
  amount: "1000000000000000000",
  walletAddress: "0x3333333333333333333333333333333333333333",
  enableEstimate: "true",
  fee: "0",
  isPermit2: "false",
  permit: ""
};

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.ONEINCH_API_KEY || 'bU3wtFzdNutmkzsdlSuEtYgrvC6SUKiA';
    
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
    
    // 新增：是否使用测试数据而不是实际调用API
    const useTestData = searchParams.get('useTestData') === 'true';
    
    // 打印所有参数，以便于调试
    console.log("Quote API Request Params:", {
      srcChain, dstChain, srcTokenAddress, dstTokenAddress, 
      amount, walletAddress, enableEstimate, fee, isPermit2, permit
    });
    
    // 如果启用了测试模式，直接返回测试数据
    if (useTestData) {
      console.log("Using test data instead of calling 1inch API");
      return NextResponse.json(TEST_RESPONSE);
    }
    
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
    console.log("Calling 1inch API:", url, params);
    
    try {
      const response = await axios.get(url, {
        params,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      return NextResponse.json(response.data);
    } catch (error: any) {
      console.error('Error fetching cross-chain quote:', error);
      console.error('Error response data:', error.response?.data);
      
      return NextResponse.json(
        { 
          error: error.message || 'Failed to fetch cross-chain quote',
          details: error.response?.data,
          requestInfo: {
            url,
            params,
            headers: { Authorization: 'Bearer ***' } // 隐藏实际的API key
          }
        },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error in quoter API:', error);
    return NextResponse.json(
      { error: 'Unexpected error in API handler', message: error.message },
      { status: 500 }
    );
  }
}
