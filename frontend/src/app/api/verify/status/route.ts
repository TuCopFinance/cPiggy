// File: app/api/verify/status/route.ts
// This endpoint checks if a user has completed verification (for polling from mobile apps)

import { NextResponse, type NextRequest } from "next/server";

// In-memory store for verification status (production should use database/Redis)
const verificationStore = new Map<string, { verified: boolean; timestamp: number }>();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  for (const [userId, data] of verificationStore.entries()) {
    if (now - data.timestamp > ONE_HOUR) {
      verificationStore.delete(userId);
    }
  }
}, 60 * 60 * 1000);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "userId is required" },
        { status: 400 }
      );
    }

    // Normalize address to lowercase for consistent lookups
    const normalizedUserId = userId.toLowerCase();
    const status = verificationStore.get(normalizedUserId);

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

// Helper function to mark a user as verified (called from main verify endpoint)
export function markUserAsVerified(userId: string): void {
  const normalizedUserId = userId.toLowerCase();
  verificationStore.set(normalizedUserId, {
    verified: true,
    timestamp: Date.now(),
  });
  console.log(`✅ User ${normalizedUserId} marked as verified in store`);
}

// Export the store for use in other routes
export { verificationStore };
