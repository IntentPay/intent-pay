import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * GET handler for supported protocols
 */
export async function GET() {
  try {
    const response = await axios.get(
      'https://api.1inch.dev/portfolio/portfolio/v4/general/supported_protocols',
      {
        headers: {
          'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
          'Accept': 'application/json',
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching supported protocols:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supported protocols' },
      { status: 500 }
    );
  }
} 