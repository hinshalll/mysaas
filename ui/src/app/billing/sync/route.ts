import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../utils/supabaseAdmin';
import { getTierFromProductId } from '../../utils/creemProducts';

const safeDate = (val: any) => {
  if (!val) return null;
  if (typeof val === 'number') {
    const date = new Date(val < 9999999999 ? val * 1000 : val);
    return date.toISOString();
  }
  if (typeof val === 'string') {
    try {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch {}
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  return null;
};

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

    // 3. Setup Creem REST URL
    const isTestMode = process.env.CREEM_API_KEY?.startsWith('creem_test_') ?? true;
    const CREEM_BASE_URL = isTestMode ? 'https://test-api.creem.io/v1' : 'https://api.creem.io/v1';

    // 4. Retrieve Customer from Creem by Email
    const customerResponse = await fetch(`${CREEM_BASE_URL}/customers?email=${encodeURIComponent(user.email || '')}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.CREEM_API_KEY || '',
      },
    });

    if (!customerResponse.ok) {
      console.error('Failed to retrieve customer from Creem by email:', await customerResponse.text());
      return NextResponse.json({ error: 'Could not find a registered billing customer in payment gateway.' }, { status: 404 });
    }

    const customerData = await customerResponse.json();
    
    // Creem can return either a single customer object or an array of customer items. Let's handle both dynamically.
    let customer = null;
    if (Array.isArray(customerData)) {
      customer = customerData[0];
    } else if (customerData && typeof customerData === 'object') {
      // Check if it's a paginated list with a 'data' array
      if (Array.isArray(customerData.data)) {
        customer = customerData.data[0];
      } else {
        customer = customerData;
      }
    }

    if (!customer || !customer.id) {
      // Fallback: If no customer is registered on Creem, their tier should be free
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          tier: 'free',
          subscription_id: null,
          subscription_status: 'none',
          current_period_start: null,
          current_period_end: null,
          canceled_at: null,
          cancel_at_period_end: false,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to reset manually overridden profile tier:', updateError);
      }

      return NextResponse.json({ 
        success: true, 
        tier: 'free', 
        message: 'No billing profile found. Synced to Free tier successfully.' 
      });
    }

    const customerId = customer.id;

    // 5. List all active subscriptions for this customer from Creem
    const subsResponse = await fetch(`${CREEM_BASE_URL}/customers/${customerId}/subscriptions`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.CREEM_API_KEY || '',
      },
    });

    if (!subsResponse.ok) {
      console.error('Failed to list subscriptions for customer:', customerId, await subsResponse.text());
      return NextResponse.json({ error: 'Failed to retrieve subscriptions from gateway.' }, { status: 502 });
    }

    const subsData = await subsResponse.json();
    let subsList = [];
    if (Array.isArray(subsData)) {
      subsList = subsData;
    } else if (subsData && typeof subsData === 'object') {
      if (Array.isArray(subsData.items)) {
        subsList = subsData.items;
      } else if (Array.isArray(subsData.data)) {
        subsList = subsData.data;
      } else {
        subsList = [subsData];
      }
    }

    // Filter for active, trialing, or grace-period active subscriptions
    const activeSub = subsList.find((sub: any) => 
      ['active', 'trialing', 'past_due', 'cancelling', 'scheduled_cancel'].includes(sub.status || '')
    );

    if (!activeSub) {
      // Sync to free if no active premium subscriptions exist
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          tier: 'free',
          subscription_id: null,
          subscription_status: 'none',
          current_period_start: null,
          current_period_end: null,
          canceled_at: null,
          cancel_at_period_end: false,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to reset manually overridden profile tier:', updateError);
      }

      return NextResponse.json({ 
        success: true, 
        tier: 'free', 
        message: 'No active subscription found. Synced to Free tier successfully.' 
      });
    }

    // 6. Resolve tier using target Product ID
    const targetProductId = activeSub.product_id || activeSub.product?.id || '';
    const resolvedTier = getTierFromProductId(targetProductId) || 'pro';

    console.log(`Self-healing billing status sync for user ${user.id}: setting tier to ${resolvedTier}`, { activeSub });

    // Fetch existing profile to prevent overwriting active canceled statuses due to gateway propagation delays
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('cancel_at_period_end, canceled_at')
      .eq('id', user.id)
      .single();

    const isCanceledLocal = existingProfile?.cancel_at_period_end || false;

    // 7. Update profile details securely in Supabase profiles database
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_id: activeSub.id || null,
        customer_id: customerId,
        subscription_status: activeSub.status || 'active',
        tier: resolvedTier,
        current_period_start: safeDate(activeSub.currentPeriodStartDate || activeSub.current_period_start || activeSub.current_period_start_date) || new Date().toISOString(),
        current_period_end: safeDate(activeSub.currentPeriodEndDate || activeSub.current_period_end || activeSub.current_period_end_date) || null,
        canceled_at: safeDate(activeSub.canceledAt || activeSub.canceled_at || existingProfile?.canceled_at) || null,
        cancel_at_period_end: activeSub.status === 'scheduled_cancel' || !!activeSub.cancel_at_period_end || isCanceledLocal,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to save synchronized profile data to database:', updateError);
      return NextResponse.json({ 
        error: `Failed to save synced tier status in database: ${updateError.message || JSON.stringify(updateError)}` 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      tier: resolvedTier, 
      message: `Billing status synchronized successfully! Synced tier: ${resolvedTier === 'api' ? 'Developer API Pro' : 'Pro Workspace'}.` 
    });

  } catch (err) {
    console.error('Sync route error:', err);
    return NextResponse.json({ error: 'Internal server error occurred synchronizing subscription.' }, { status: 500 });
  }
}
