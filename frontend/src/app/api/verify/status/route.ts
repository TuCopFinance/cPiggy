// File: app/api/verify/status/route.ts
// This endpoint checks if a user has completed verification (for polling from mobile apps)

import { NextResponse, type NextRequest } from "next/server";
import { getVerificationStatus } from './verification-store';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "userId is required" },
        { status: 400 }
      );
    }

    const status = getVerificationStatus(userId);

    return NextResponse.json({
      verified: status?.verified || false,
      timestamp: status?.timestamp || null,
    });
  } catch (error) {
    console.error("❌ Error checking verification status:", error);
    return NextResponse.json(
      { message: "Error checking verification status" },
      { status: 500 }
    );
  }
}
