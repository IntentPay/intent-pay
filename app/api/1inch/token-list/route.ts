import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const apiKey = process.env.ONEINCH_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }
    
    const url = "https://api.1inch.dev/token/v1.2/multi-chain/token-list";
    const response = await axios.get(url, {
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching token list:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch token list' },
      { status: error.response?.status || 500 }
    );
  }
}
