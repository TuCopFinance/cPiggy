// In-memory store for verification status (production should use database/Redis)
const verificationStore = new Map<string, { verified: boolean; timestamp: number }>();

console.log("🗄️  Verification store initialized");

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  let cleanedCount = 0;

  for (const [userId, data] of verificationStore.entries()) {
    if (now - data.timestamp > ONE_HOUR) {
      verificationStore.delete(userId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} old verification entries from store`);
  }

  console.log(`📊 Store stats: ${verificationStore.size} active verifications`);
}, 60 * 60 * 1000);

// Helper function to mark a user as verified
export function markUserAsVerified(userId: string): void {
  const normalizedUserId = userId.toLowerCase();
  const timestamp = Date.now();

  verificationStore.set(normalizedUserId, {
    verified: true,
    timestamp,
  });

  console.log(`✅ User ${normalizedUserId.substring(0, 10)}... marked as VERIFIED`);
  console.log(`💾 Store now contains ${verificationStore.size} verified users`);
  console.log(`⏰ Verification timestamp: ${new Date(timestamp).toISOString()}`);
}

// Get verification status
export function getVerificationStatus(userId: string): { verified: boolean; timestamp: number } | undefined {
  const normalizedUserId = userId.toLowerCase();
  const status = verificationStore.get(normalizedUserId);

  // Only log lookups that return something (avoid spam)
  if (status?.verified) {
    console.log(`🔍 Lookup: User ${normalizedUserId.substring(0, 10)}... is VERIFIED`);
  }

  return status;
}
