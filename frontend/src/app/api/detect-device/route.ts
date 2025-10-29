import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to detect device type from server-side headers
 * This is more reliable than client-side detection, especially for Farcaster
 */
export async function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';

  // Detect if it's Warpcast (Farcaster native app)
  const isWarpcast = userAgent.toLowerCase().includes('warpcast');

  // Detect mobile from user agent
  const isMobileUserAgent = /android|iphone|ipad|ipod/i.test(userAgent);

  // Return detection results
  return NextResponse.json({
    userAgent,
    isWarpcast,
    isMobileUserAgent,
    detectedAt: new Date().toISOString()
  });
}
