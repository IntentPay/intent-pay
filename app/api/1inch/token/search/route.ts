/**
 * API Route for searching tokens on 1inch by chain
 * Uses 1inch Token API v1.2
 */
import { NextResponse } from 'next/server';
import axios from 'axios';
import { config1inch } from '@/lib/1inch/config';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const query = searchParams.get('query') || '';
    const chainId = searchParams.get('chainId') || '1';
    const limit = searchParams.get('limit') || '10';
    const ignoreListed = searchParams.get('ignoreListed') || 'false';
    
    // Validate chainId
    if (!chainId || isNaN(Number(chainId))) {
      return NextResponse.json({ error: 'Invalid chain ID' }, { status: 400 });
    }
    
    // Construct 1inch API URL
    const url = `https://api.1inch.dev/token/v1.2/${chainId}/search`;
    
    // Make request to 1inch API
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${config1inch.apiKey}`,
        'Accept': 'application/json'
      },
      params: {
        query,
        limit,
        ignore_listed: ignoreListed
      }
    });
    
    // Return the 1inch API response
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error in 1inch token search API:', error);
    
    // Return appropriate error response
    return NextResponse.json(
      { error: error.response?.data?.message || 'Failed to search tokens' },
      { status: error.response?.status || 500 }
    );
  }
}
