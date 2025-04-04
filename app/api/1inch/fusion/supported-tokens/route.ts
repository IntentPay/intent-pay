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
    
    // Get chainId from the URL parameters
    const searchParams = request.nextUrl.searchParams;
    const chainId = searchParams.get('chainId');
    
    if (!chainId) {
      return NextResponse.json(
        { error: 'Missing required parameter: chainId' },
        { status: 400 }
      );
    }
    
    // Make request to 1inch API
    const url = `${FUSION_API_URL}/${chainId}/supported-tokens`;
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching supported tokens:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch supported tokens',
        details: error.response?.data
      },
      { status: error.response?.status || 500 }
    );
  }
}
