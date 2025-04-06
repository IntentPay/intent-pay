import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

// API base URL for 1inch Swap API
const SWAP_API_URL = 'https://api.1inch.dev/swap/v5.2';

// 用于测试的固定响应数据，当useTestData=true时使用
const TEST_RESPONSE = {
  toTokenAmount: "299715033940591", // 约0.0003 ETH，1 USDC = 0.0003 ETH
  fromTokenAmount: "1000000",
  estimatedGas: "250000",
  protocols: [
    [
      [
        {
          name: "1INCH",
          part: 100,
          fromTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          toTokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
        }
      ]
    ]
  ],
  tx: {
    from: "0x0000000000000000000000000000000000000000",
    to: "0x1111111254EEB25477B68fb85Ed929f73A960582",
    data: "0x0",
    value: "0",
    gasPrice: "12000000000",
    gas: 250000
  }
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
    const chainId = searchParams.get('chainId');
    const fromTokenAddress = searchParams.get('fromTokenAddress');
    const toTokenAddress = searchParams.get('toTokenAddress');
    const amount = searchParams.get('amount');
    const fromAddress = searchParams.get('fromAddress');
    const slippage = searchParams.get('slippage') || '0.5';
    
    // 新增：是否使用测试数据而不是实际调用API
    const useTestData = searchParams.get('useTestData') === 'true';
    
    // 打印所有参数，以便于调试
    console.log("Swap Quote API Request Params:", {
      chainId, fromTokenAddress, toTokenAddress, amount, fromAddress, slippage
    });
    
    // 如果启用了测试模式，直接返回测试数据
    if (useTestData) {
      console.log("Using test data instead of calling 1inch API");
      return NextResponse.json(TEST_RESPONSE);
    }
    
    // Check for required parameters
    if (!chainId || !fromTokenAddress || !toTokenAddress || !amount || !fromAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Construct query parameters
    const params: Record<string, string> = {
      fromTokenAddress,
      toTokenAddress,
      amount,
      fromAddress,
      slippage
    };
    
    // Make request to 1inch API
    const url = `${SWAP_API_URL}/${chainId}/quote`;
    console.log("Calling 1inch Swap API:", url, params);
    
    try {
      const response = await axios.get(url, {
        params,
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      return NextResponse.json(response.data);
    } catch (error: any) {
      console.error('Error fetching swap quote:', error);
      console.error('Error response data:', error.response?.data);
      
      return NextResponse.json(
        { 
          error: error.message || 'Failed to fetch swap quote',
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
    console.error('Unexpected error in swap quote API:', error);
    return NextResponse.json(
      { error: 'Unexpected error in API handler', message: error.message },
      { status: 500 }
    );
  }
}
