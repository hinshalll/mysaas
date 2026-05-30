import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../utils/supabaseAdmin';

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload body.' }, { status: 400 });
    }

    const { token } = body;

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

    // 3. Fetch user's subscription details from database via admin client
    const { data: profile, error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_id, subscription_status')
      .eq('id', user.id)
      .single();

    if (dbError || !profile) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    const subscriptionId = profile.subscription_id;

    if (!subscriptionId || profile.subscription_status !== 'active') {
      return NextResponse.json({ error: 'No active subscription found to cancel.' }, { status: 400 });
    }

    // 4. Securely cancel subscription at period end in Creem
    const isTestMode = process.env.CREEM_API_KEY?.startsWith('creem_test_') ?? true;
    const CREEM_BASE_URL = isTestMode ? 'https://test-api.creem.io/v1' : 'https://api.creem.io/v1';

    const creemResponse = await fetch(`${CREEM_BASE_URL}/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CREEM_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'scheduled',
        onExecute: 'cancel',
        on_execute: 'cancel',
      }),
    });

    if (!creemResponse.ok) {
      const errorText = await creemResponse.text();
      console.error('Creem subscription cancellation failed:', errorText);
      return NextResponse.json({ error: 'Failed to cancel subscription in payment gateway.' }, { status: 502 });
    }

    // 5. Update our Supabase database to reflect grace period cancellation
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        cancel_at_period_end: true,
        canceled_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update canceled status in database:', updateError);
      return NextResponse.json({ error: 'Failed to sync cancellation in local database.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Subscription successfully scheduled for cancellation.' });

  } catch (err) {
    console.error('Cancellation route error:', err);
    return NextResponse.json({ error: 'Internal server error occurred processing request.' }, { status: 500 });
  }
}
