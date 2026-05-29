import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCreemProductId } from '../../utils/creemProducts';

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload body.' }, { status: 400 });
    }

    const { planId, cohort = 'global', token } = body;

    if (!planId || !['pro', 'api'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid or missing planId (must be pro or api).' }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ error: 'Missing active user session token.' }, { status: 401 });
    }

    // 1. Initialize standard Supabase client to verify JWT
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 2. Validate token and get authenticated user securely
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized session or expired token.' }, { status: 401 });
    }

    // 3. Resolve Product ID based on plan and cohort
    const creemProductId = getCreemProductId(planId, cohort);
    if (!creemProductId) {
      return NextResponse.json({ error: `No Creem Product ID configured for plan '${planId}' in cohort '${cohort}'.` }, { status: 500 });
    }

    // 4. Create Creem checkout session via API
    const isTestMode = process.env.CREEM_API_KEY?.startsWith('creem_test_') ?? true;
    const CREEM_BASE_URL = isTestMode ? 'https://test-api.creem.io/v1' : 'https://api.creem.io/v1';

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mysaastools.vercel.app'}/account?checkout=success`;

    const creemResponse = await fetch(`${CREEM_BASE_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CREEM_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: creemProductId,
        success_url: successUrl,
        customer: {
          email: user.email,
        },
        metadata: {
          referenceId: user.id,
        },
      }),
    });

    if (!creemResponse.ok) {
      const errorText = await creemResponse.text();
      console.error('Creem API session creation failed:', errorText);
      return NextResponse.json({ error: 'Failed to create checkout session with Creem.' }, { status: 502 });
    }

    const checkoutData = await creemResponse.json();

    if (!checkoutData.checkout_url) {
      return NextResponse.json({ error: 'Checkout URL not returned from payment gateway.' }, { status: 502 });
    }

    return NextResponse.json({ checkoutUrl: checkoutData.checkout_url });

  } catch (err) {
    console.error('Checkout route error:', err);
    return NextResponse.json({ error: 'Internal server error occurred creating session.' }, { status: 500 });
  }
}
