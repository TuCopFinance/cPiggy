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

  try {
    const proof = await req.json();
    console.log("Received proof, attempting to verify...");

    // The verify method needs 4 specific arguments from the proof object.
    const isValid = await selfBackendVerifier.verify(
      proof.attestationId,
      proof, // The full proof object
      proof.pubSignals,
      proof.userContextData
    );

    if (isValid) {
      console.log("✅ Verification successful!");
      return NextResponse.json({ status: "verified" }, { status: 200 });
    } else {
      console.error("❌ Verification failed.");
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

  } catch (error) {
    console.error("An unexpected error occurred:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
