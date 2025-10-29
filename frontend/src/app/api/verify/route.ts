// File: app/api/verify/route.ts

import { NextResponse, type NextRequest } from "next/server";
import {
  SelfBackendVerifier,
  AllIds,
  DefaultConfigStore,
} from '@selfxyz/core';
import { markUserAsVerified } from './status/verification-store';

// 1. DEFINE YOUR VERIFICATION REQUIREMENTS
//    This object MUST EXACTLY MATCH your frontend's `disclosures` object.
const verification_config = {
    excludedCountries: []
};

// 2. CREATE THE CONFIGURATION STORE
const configStore = new DefaultConfigStore(verification_config);

// 3. INITIALIZE THE VERIFIER
const selfBackendVerifier = new SelfBackendVerifier(
  process.env.NEXT_PUBLIC_SELF_SCOPE || "cpiggy-prod",
  process.env.NEXT_PUBLIC_SELF_ENDPOINT || "https://cpiggy.xyz/api/verify",
  false, // true = mock for testing
  AllIds,
  configStore,
  "hex"
);

console.log(`🔧 Initializing verifier with SCOPE: ${process.env.NEXT_PUBLIC_SELF_SCOPE}`);
console.log(`🔧 Initializing verifier with ENDPOINT: ${process.env.NEXT_PUBLIC_SELF_ENDPOINT}`);

// 4. CREATE THE API ROUTE HANDLER
export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`\n${"=".repeat(80)}`);
  console.log(`🔐 [${timestamp}] Self Verification Request - ID: ${requestId}`);
  console.log(`${"=".repeat(80)}`);

  // Log request headers for context detection
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const referer = req.headers.get('referer') || 'unknown';
  const origin = req.headers.get('origin') || 'unknown';
  const contentType = req.headers.get('content-type') || 'unknown';

  console.log("📱 Request Context:", {
    requestId,
    userAgent,
    referer,
    origin,
    contentType,
    isMobile: /mobile|android|iphone/i.test(userAgent),
    isFarcaster: /farcaster/i.test(userAgent)
  });

  // Try to read raw body first for debugging
  let rawBody;
  try {
    rawBody = await req.text();
    console.log(`📄 [${requestId}] Raw request body (first 500 chars):`, rawBody.substring(0, 500));
    console.log(`📏 [${requestId}] Body length:`, rawBody.length);
  } catch (error) {
    console.error(`❌ [${requestId}] Failed to read raw body:`, error);
    return NextResponse.json({ message: "Could not read request body" }, { status: 400 });
  }

  let requestBody;
  try {
    requestBody = JSON.parse(rawBody);
    // Log key parts without exposing sensitive data
    console.log(`📦 [${requestId}] Request payload received:`, {
      hasAttestationId: !!requestBody.attestationId,
      attestationId: requestBody.attestationId,
      hasProof: !!requestBody.proof,
      hasPublicSignals: !!requestBody.publicSignals,
      publicSignalsCount: requestBody.publicSignals?.length,
      userContextData: requestBody.userContextData?.substring(0, 20) + '...'
    });
  } catch (error) {
    console.error(`❌ [${requestId}] Failed to parse JSON:`, error);
    console.error(`📄 [${requestId}] Raw body that failed:`, rawBody);
    return NextResponse.json({ message: "Invalid JSON in request body" }, { status: 400 });
  }

  // Extract data from the request
  const { attestationId, proof, publicSignals, userContextData } = requestBody;

  // Verify all required fields are present
  if (!proof || !publicSignals || !attestationId || !userContextData) {
    console.error(`❌ [${requestId}] Missing required fields:`, {
      hasProof: !!proof,
      hasPublicSignals: !!publicSignals,
      hasAttestationId: !!attestationId,
      hasUserContextData: !!userContextData
    });
    return NextResponse.json({
      message: "Proof, publicSignals, attestationId and userContextData are required",
    }, { status: 400 });
  }

  // Verify the proof
  try {
    console.log(`⏳ [${requestId}] Starting verification for userId: ${userContextData}`);
    console.log(`🔍 [${requestId}] Calling selfBackendVerifier.verify()...`);

    const verifyStartTime = Date.now();
    const result = await selfBackendVerifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData
    );
    const verifyDuration = Date.now() - verifyStartTime;

    console.log(`⏱️ [${requestId}] Verification took ${verifyDuration}ms`);
    console.log(`🔍 [${requestId}] Verification result:`, {
      isValid: result.isValidDetails.isValid,
      hasDiscloseOutput: !!result.discloseOutput,
      details: result.isValidDetails
    });

    // Check if verification was successful
    if (result.isValidDetails.isValid) {
      console.log(`✅ [${requestId}] Verification SUCCESSFUL for userId: ${userContextData}`);
      console.log(`💾 [${requestId}] Marking user as verified in store...`);

      // Extract wallet address from userContextData for storage
      // userContextData format: [64 chars chainId (padded)][64 chars address (padded)][rest is message]
      // Each field is 32 bytes = 64 hex characters, padded with zeros on the left
      // Address is in the second 64-char block, but the actual address is the last 40 chars
      let walletAddress = userContextData;
      if (userContextData.length > 128) {
        // Extract the second 64-char block (characters 64-128)
        const paddedAddressHex = userContextData.substring(64, 128);
        // Take only the last 40 characters (20 bytes = ethereum address)
        const addressHex = paddedAddressHex.substring(24); // Skip first 24 chars of padding (12 bytes)
        walletAddress = '0x' + addressHex;
        console.log(`📋 [${requestId}] Extracted wallet address: ${walletAddress}`);
        console.log(`🔍 [${requestId}] Full padded block: ${paddedAddressHex}`);
      } else {
        console.log(`⚠️ [${requestId}] userContextData format unexpected, using as-is: ${userContextData}`);
      }

      // Store verification status for polling (mobile apps)
      markUserAsVerified(walletAddress);

      console.log(`✅ [${requestId}] User marked as verified. Store updated.`);
      console.log(`📤 [${requestId}] Returning success response to client`);
      console.log(`${"=".repeat(80)}\n`);

      return NextResponse.json({
        status: "success",
        result: true,
        credentialSubject: result.discloseOutput,
      });
    } else {
      // Verification failed, return the detailed reason
      console.warn(`⚠️ [${requestId}] Verification FAILED for userId: ${userContextData}`);
      console.warn(`📋 [${requestId}] Failure details:`, result.isValidDetails);
      console.log(`${"=".repeat(80)}\n`);

      return NextResponse.json({
        status: "error",
        result: false,
        message: "Verification failed",
        // Return the specific details about why it failed
        details: result.isValidDetails,
      }, { status: 400 });
    }
 } catch (error: unknown) {
    // DEBUGGING: Log the full error object for a complete stack trace
    console.error(`💥 [${requestId}] EXCEPTION during verification:`, error);
    console.error(`💥 [${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');

    // Type-safe way to get the error message
    const message = error instanceof Error ? error.message : "An unknown error occurred.";

    console.log(`${"=".repeat(80)}\n`);

    return NextResponse.json({
      status: "error",
      result: false,
      message: "An unexpected error occurred on the server.",
      // Always return error in logs (Railway shows all logs)
      error: message,
    }, { status: 500 });
  }
}