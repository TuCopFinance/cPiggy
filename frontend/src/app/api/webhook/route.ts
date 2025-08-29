import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify the webhook signature (implement your verification logic)
    // const signature = request.headers.get('x-farcaster-signature');
    
    // Handle different notification types
    switch (body.type) {
      case 'app_installed':
        console.log('User installed cPiggyFX:', body.data);
        break;
        
      case 'app_launched':
        console.log('User launched cPiggyFX:', body.data);
        break;
        
      default:
        console.log('Unknown webhook type:', body.type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' }, 
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('hub.challenge');
  
  if (challenge) {
    return new NextResponse(challenge);
  }
  
  return NextResponse.json({ status: 'Webhook endpoint active' });
}