import { NextResponse } from 'next/server';
import { generateNonce } from '@/lib/utils';

/**
 * API endpoint for generating nonces for Sign-in with Ethereum (SIWE)
 * 
 * This generates a random, cryptographically secure nonce that will be used
 * in the SIWE flow to prevent replay attacks. The nonce is stored in a cookie
 * and also returned to the client for inclusion in the signed message.
 */
export async function GET() {
  try {
    // Generate a cryptographically secure random nonce
    const nonce = generateNonce();
    
    // Create the response with nonce
    const response = NextResponse.json({ nonce }, { status: 200 });
    
    // Set cookie in the response
    response.cookies.set('siwe', nonce, { 
      secure: true, 
      httpOnly: true, 
      sameSite: 'strict',
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Error generating nonce:', error);
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}
