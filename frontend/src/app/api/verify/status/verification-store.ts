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

// Helper function to mark a user as verified
export function markUserAsVerified(userId: string): void {
  const normalizedUserId = userId.toLowerCase();
  verificationStore.set(normalizedUserId, {
    verified: true,
    timestamp: Date.now(),
  });
  console.log(`✅ User ${normalizedUserId} marked as verified in store`);
}

// Get verification status
export function getVerificationStatus(userId: string): { verified: boolean; timestamp: number } | undefined {
  const normalizedUserId = userId.toLowerCase();
  return verificationStore.get(normalizedUserId);
}
