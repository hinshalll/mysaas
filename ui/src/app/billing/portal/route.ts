import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Creem } from 'creem';
import { supabaseAdmin } from '../../utils/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

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

    // 3. Fetch customer ID from DB securely
    const { data: profile, error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('customer_id')
      .eq('id', user.id)
      .single();

    if (dbError || !profile) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    const customerId = profile.customer_id;

    if (!customerId) {
      return NextResponse.json({ error: 'No active billing profile found. Please subscribe first.' }, { status: 400 });
    }

    // 4. Generate customer portal link using official SDK
    const isTestMode = process.env.CREEM_API_KEY?.startsWith('creem_test_') ?? true;
    const creem = new Creem({
      apiKey: process.env.CREEM_API_KEY || '',
      serverIdx: isTestMode ? 1 : 0,
    });

    const portal = await creem.customers.generateBillingLinks({
      customerId,
    });

    if (!portal.customerPortalLink) {
      return NextResponse.json({ error: 'Failed to generate portal redirect URL.' }, { status: 502 });
    }

    // 5. Redirect browser to secure hosted portal link
    return NextResponse.redirect(portal.customerPortalLink);

  } catch (err) {
    console.error('Portal redirect route error:', err);
    return NextResponse.json({ error: 'Internal server error occurred creating portal session.' }, { status: 500 });
  }
}
