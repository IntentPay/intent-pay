import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * GET handler for supported chains
 */
export async function GET() {
  try {
    const response = await axios.get(
      'https://api.1inch.dev/portfolio/portfolio/v4/general/supported_chains',
      {
        headers: {
          'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
          'Accept': 'application/json',
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching supported chains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supported chains' },
      { status: 500 }
    );
  }
} 