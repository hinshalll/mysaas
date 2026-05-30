import { NextResponse } from 'next/server';
import { authenticateRequest } from '../../utils/authHelper';
import { supabaseAdmin } from '../../utils/supabaseAdmin';
import { getCreemProductId } from '../../utils/creemProducts';
import { getCreemClient } from '../../utils/creemClient';

export async function POST(req: Request) {
  try {
    const { planId, token } = await req.json();

    if (planId !== 'pro' && planId !== 'api') {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const user = await authenticateRequest(token);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_id, subscription_status, tier')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { subscription_id: subscriptionId, subscription_status, tier } = profile;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe first.' },
        { status: 400 },
      );
    }

    if (tier === planId) {
      return NextResponse.json(
        { error: `You are already on the ${planId} plan.` },
        { status: 400 },
      );
    }

    const creem = getCreemClient();

    if (subscription_status === 'scheduled_cancel') {
      await creem.subscriptions.resume(subscriptionId);
    }

    const creemProductId = getCreemProductId(planId, 'global');

    const result = await creem.subscriptions.upgrade(subscriptionId, {
      productId: creemProductId,
    });

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        tier: planId,
        subscription_id: result.id || subscriptionId,
        subscription_status: result.status || 'active',
        current_period_start:
          result.currentPeriodStartDate?.toISOString() || new Date().toISOString(),
        current_period_end: result.currentPeriodEndDate?.toISOString() || null,
        canceled_at: null,
        cancel_at_period_end: false,
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Plan changed but failed to update profile. Contact support.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Plan changed successfully. Proration applied.',
    });
  } catch (err: unknown) {
    if (err instanceof Response || (err && typeof err === 'object' && 'status' in err)) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Upgrade failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
