import { NextRequest, NextResponse } from 'next/server';
import { initializeOneInch, SwapIntent } from '@/lib/oneinch';

// Initialize 1inch client with environment variables
const oneInchClient = initializeOneInch({
  apiKey: process.env.ONEINCH_API_KEY || '',
  referrerAddress: process.env.REFERRER_ADDRESS
});

/**
 * GET /api/oneinch/quote
 * Get a swap quote for a potential trade
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromToken = searchParams.get('fromToken');
    const toToken = searchParams.get('toToken');
    const amount = searchParams.get('amount');
    const fromAddress = searchParams.get('fromAddress');
    const slippage = searchParams.get('slippage');

    if (!fromToken || !toToken || !amount || !fromAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters: fromToken, toToken, amount, fromAddress' },
        { status: 400 }
      );
    }

    const swapIntent: SwapIntent = {
      fromToken,
      toToken,
      amount,
      fromAddress,
      slippage: slippage ? parseFloat(slippage) : 1.0 // Default 1% slippage
    };

    // Get a swap quote from 1inch
    const quote = await oneInchClient.getSwapQuote(swapIntent);
    
    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error fetching swap quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch swap quote' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/oneinch/swap
 * Submit a swap intent to be executed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromToken, toToken, amount, fromAddress, slippage } = body;

    if (!fromToken || !toToken || !amount || !fromAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters: fromToken, toToken, amount, fromAddress' },
        { status: 400 }
      );
    }

    const swapIntent: SwapIntent = {
      fromToken,
      toToken,
      amount,
      fromAddress,
      slippage: slippage || 1.0 // Default 1% slippage
    };

    // Submit the swap intent to 1inch
    const result = await oneInchClient.submitSwapIntent(swapIntent);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error submitting swap intent:', error);
    return NextResponse.json(
      { error: 'Failed to submit swap intent' },
      { status: 500 }
    );
  }
}
