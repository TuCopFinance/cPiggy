// File: app/api/verify/route.ts

import { NextResponse, type NextRequest } from "next/server";
import {
  SelfBackendVerifier,
  AllIds,
  DefaultConfigStore,
} from '@selfxyz/core';

// 1. DEFINE YOUR VERIFICATION REQUIREMENTS
//    This object MUST EXACTLY MATCH your frontend's `disclosures` object.
const verification_config = {
};

// 2. CREATE THE CONFIGURATION STORE
const configStore = new DefaultConfigStore(verification_config);

// 3. INITIALIZE THE VERIFIER
const selfBackendVerifier = new SelfBackendVerifier(
  process.env.NEXT_PUBLIC_SELF_SCOPE || "self-workshop",
  process.env.NEXT_PUBLIC_SELF_ENDPOINT || "",
  false, // true = mock for testing
  AllIds,
  configStore,
  "hex"
);

// 4. CREATE THE API ROUTE HANDLER
export async function POST(req: NextRequest) {
  console.log("✅ Received request at /api/verify endpoint.");

    // Extract data from the request
const { attestationId, proof, publicSignals, userContextData } = await req.json();

// Verify all required fields are present
if (!proof || !publicSignals || !attestationId || !userContextData) {
  return NextResponse.json({
    message: "Proof, publicSignals, attestationId and userContextData are required",
  }, { status: 400 });
}

// Verify the proof
const result = await selfBackendVerifier.verify(
  attestationId,    // Document type (1 = passport, 2 = EU ID card)
  proof,            // The zero-knowledge proof
  publicSignals,    // Public signals array
  userContextData   // User context data
);

// Check if verification was successful
if (result.isValidDetails.isValid) {
  // Verification successful - process the result
  return NextResponse.json({
    status: "success",
    result: true,
    credentialSubject: result.discloseOutput,
  });
} else {
  // Verification failed
  return NextResponse.json({
    status: "error",
    result: false,
    message: "Verification failed",
    details: result.isValidDetails,
  }, { status: 500 });
}
}