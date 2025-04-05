import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

// 缓存数据的类型
interface CachedData {
  data: any;
  timestamp: number;
}

// 内存缓存对象
let tokenListCache: CachedData | null = null;

// 缓存有效期 - 2小时
const CACHE_DURATION = 2 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    // 检查是否有有效的内存缓存
    if (tokenListCache && Date.now() - tokenListCache.timestamp < CACHE_DURATION) {
      return NextResponse.json(tokenListCache.data, { status: 200 });
    }

    // 获取API密钥
    const apiKey = process.env.ONEINCH_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // 添加重试逻辑和请求限速
    let retries = 3;
    let response;
    
    while (retries > 0) {
      try {
        response = await axios.get('https://api.1inch.dev/token/v1.2/multi-chain/token-list', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        });
        
        // 请求成功，跳出循环
        break;
      } catch (error: any) {
        retries--;
        
        // 如果是429错误(Too Many Requests)，等待一秒后重试
        if (error.response && error.response.status === 429 && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else if (retries === 0) {
          // 用完所有重试次数，抛出错误
          throw error;
        } else {
          // 其他错误，等待短暂时间后重试
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    if (!response || !response.data) {
      return NextResponse.json(
        { error: 'Failed to fetch token list' },
        { status: 500 }
      );
    }

    // 更新内存缓存
    tokenListCache = {
      data: response.data,
      timestamp: Date.now()
    };

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error('Error fetching token list:', error);
    
    // 如果有旧缓存数据，即使过期也返回
    if (tokenListCache && tokenListCache.data) {
      console.log('Returning stale cache data due to error');
      return NextResponse.json(tokenListCache.data, { status: 200 });
    }
    
    return NextResponse.json(
      { error: 'An error occurred while fetching token list' },
      { status: 500 }
    );
  }
}
