import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple endpoint to log device detection from client
 * This helps debug on mobile where we can't see console.log
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userAgent = request.headers.get('user-agent') || 'unknown';

    console.log("📱 [CLIENT DEVICE DETECTION]:", {
      timestamp: new Date().toISOString(),
      clientUserAgent: userAgent,
      detection: body,
    });

    return NextResponse.json({
      success: true,
      serverUserAgent: userAgent
    });
  } catch (error) {
    console.error("❌ Failed to log detection:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
