import { NextRequest, NextResponse } from 'next/server';
import { verifySiweMessage } from '@worldcoin/minikit-js';

interface MiniAppWalletAuthSuccessPayload {
  status: 'success';
  message: string;
  signature: string;
  address: string;
  version: number;
}

interface IRequestPayload {
  payload: MiniAppWalletAuthSuccessPayload;
  nonce: string;
}

/**
 * API endpoint to verify Wallet Auth (SIWE) signatures
 * 
 * This endpoint receives the signature from World App, verifies it matches the nonce,
 * and confirms the signature is valid for the provided message.
 */
export async function POST(req: NextRequest) {
  try {
    // Extract the payload and nonce from the request
    const { payload, nonce } = await req.json() as IRequestPayload;
    
    // Get the stored nonce from cookies
    const storedNonce = req.cookies.get('siwe')?.value;
    
    // Verify that the nonce matches the one stored in cookies
    if (nonce !== storedNonce) {
      console.error('Invalid nonce provided');
      return NextResponse.json({
        status: 'error',
        isValid: false,
        message: 'Invalid nonce',
      });
    }
    
    // Verify the SIWE message signature
    try {
      const validMessage = await verifySiweMessage(payload, nonce);
      
      // Return a success result if the message is valid
      return NextResponse.json({
        status: 'success',
        isValid: validMessage.isValid,
      });
    } catch (error: any) {
      // Handle errors in validation
      console.error('SIWE validation error:', error);
      return NextResponse.json({
        status: 'error',
        isValid: false,
        message: error.message,
      });
    }
  } catch (error: any) {
    // Handle any unexpected errors
    console.error('Complete SIWE error:', error);
    return NextResponse.json({
      status: 'error',
      isValid: false,
      message: 'An unexpected error occurred',
    });
  }
}
