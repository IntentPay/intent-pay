import { NextRequest, NextResponse } from 'next/server';
import { initializeCircleWallet } from '@/lib/circle';

// Initialize Circle wallet client with environment variables
const circleClient = initializeCircleWallet({
  apiKey: process.env.CIRCLE_API_KEY || '',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
});

/**
 * GET /api/circle/wallet
 * Retrieve wallet details and balances for a user
 */
export async function GET(request: NextRequest) {
  try {
    // In a real implementation, you would get the user ID from the session
    // For now, we'll use a query parameter
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const walletId = searchParams.get('walletId');

    if (!userId && !walletId) {
      return NextResponse.json(
        { error: 'Missing userId or walletId parameter' },
        { status: 400 }
      );
    }

    // If we have a walletId, fetch its details
    if (walletId) {
      // This would call the actual Circle API to get wallet balances
      const balances = await circleClient.getBalances(walletId);
      return NextResponse.json({ walletId, balances });
    }

    // If we only have userId, create or fetch their wallet
    if (userId) {
      // This would call the actual Circle API to create or get the wallet
      const wallet = await circleClient.createWallet(userId);
      return NextResponse.json(wallet);
    }

  } catch (error) {
    console.error('Error processing wallet request:', error);
    return NextResponse.json(
      { error: 'Failed to process wallet request' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/circle/wallet/transfer
 * Create a USDC transfer from a user's wallet
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletId, to, amount } = body;

    if (!walletId || !to || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: walletId, to, amount' },
        { status: 400 }
      );
    }

    // This would call the actual Circle API to create a transfer
    const transfer = await circleClient.createTransfer(walletId, to, amount);

    return NextResponse.json(transfer);
  } catch (error) {
    console.error('Error processing transfer request:', error);
    return NextResponse.json(
      { error: 'Failed to process transfer request' },
      { status: 500 }
    );
  }
}
