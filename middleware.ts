import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Simple pass-through middleware
  return NextResponse.next();
}

// Don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
