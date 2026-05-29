import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../utils/supabaseAdmin';
import { getCreemProductId } from '../../utils/creemProducts';

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload body.' }, { status: 400 });
    }

    const { planId, token } = body;

    if (!planId || !['pro', 'api'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid or missing target planId (must be pro or api).' }, { status: 400 });
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

    // 3. Fetch user's active subscription details from database via admin client
    const { data: profile, error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_id, subscription_status, tier')
      .eq('id', user.id)
      .single();

    if (dbError || !profile) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    const subscriptionId = profile.subscription_id;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'No active subscription found to upgrade or downgrade.' }, { status: 400 });
    }

    if (profile.tier === planId) {
      return NextResponse.json({ error: `You are already subscribed to the ${planId} plan.` }, { status: 400 });
    }

    // 4. Resolve Product ID for the target plan (force global cohort USD)
    const creemProductId = getCreemProductId(planId, 'global');
    if (!creemProductId) {
      return NextResponse.json({ error: `No Creem Product ID configured for plan '${planId}'.` }, { status: 500 });
    }

    // 5. Call Creem programmatic subscription upgrade endpoint
    const isTestMode = process.env.CREEM_API_KEY?.startsWith('creem_test_') ?? true;
    const CREEM_BASE_URL = isTestMode ? 'https://test-api.creem.io/v1' : 'https://api.creem.io/v1';

    const creemResponse = await fetch(`${CREEM_BASE_URL}/subscriptions/${subscriptionId}/upgrade`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CREEM_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: creemProductId,
      }),
    });

    if (!creemResponse.ok) {
      const errorText = await creemResponse.text();
      console.error('Creem subscription upgrade failed:', errorText);
      let errorMessage = 'Failed to update subscription in payment gateway.';
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.message) errorMessage = parsed.message;
        else if (parsed.error) errorMessage = parsed.error;
      } catch {}
      return NextResponse.json({ error: errorMessage }, { status: 502 });
    }

    const updatedSubscription = await creemResponse.json();

    // 6. Sync updated subscription tier in our database
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        tier: planId,
        subscription_status: updatedSubscription.status || 'active',
        current_period_end: updatedSubscription.current_period_end || null,
        cancel_at_period_end: updatedSubscription.cancel_at_period_end || false,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to sync updated subscription status in database:', updateError);
      return NextResponse.json({ error: 'Failed to sync tier changes in local database.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully changed plan to ${planId === 'api' ? 'Developer API Pro' : 'Pro Workspace'}. Proration applied.` 
    });

  } catch (err) {
    console.error('Upgrade route error:', err);
    return NextResponse.json({ error: 'Internal server error occurred processing subscription change.' }, { status: 500 });
  }
}
