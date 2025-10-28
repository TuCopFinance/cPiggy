// File: app/api/verify/status/route.ts
// This endpoint checks if a user has completed verification (for polling from mobile apps)

import { NextResponse, type NextRequest } from "next/server";
import { getVerificationStatus } from './verification-store';

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const pollId = Math.random().toString(36).substring(7);

  try {
    const { userId } = await req.json();

    if (!userId) {
      console.warn(`⚠️ [${pollId}] Status check missing userId`);
      return NextResponse.json(
        { message: "userId is required" },
        { status: 400 }
      );
    }

    // Log every 5th poll to avoid spam, or always log if verified
    const shouldLog = Math.random() < 0.2; // 20% of polls

    if (shouldLog) {
      console.log(`🔄 [${timestamp}] Polling status for userId: ${userId.substring(0, 10)}...`);
    }

    const status = getVerificationStatus(userId);

    if (status?.verified) {
      console.log(`✅ [${pollId}] USER VERIFIED! userId: ${userId.substring(0, 10)}..., timestamp: ${new Date(status.timestamp).toISOString()}`);
    } else if (shouldLog) {
      console.log(`⏳ [${pollId}] Not verified yet: ${userId.substring(0, 10)}...`);
    }

    return NextResponse.json({
      verified: status?.verified || false,
      timestamp: status?.timestamp || null,
    });
  } catch (error) {
    console.error(`❌ [${pollId}] Error checking verification status:`, error);
    return NextResponse.json(
      { message: "Error checking verification status" },
      { status: 500 }
    );
  }
}
