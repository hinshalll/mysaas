import { NextResponse } from 'next/server';
import { authenticateRequest } from '../../utils/authHelper';
import { supabaseAdmin } from '../../utils/supabaseAdmin';
import { getCreemClient } from '../../utils/creemClient';
import { getTierFromProductId } from '../../utils/creemProducts';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    const user = await authenticateRequest(token);
    const creem = getCreemClient();

    let customer: any;
    try {
      customer = await creem.customers.retrieve(undefined, user.email);
    } catch (err: any) {
      await supabaseAdmin
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

      return NextResponse.json({ success: true, tier: 'free', message: 'No customer found. Reset to free tier.' });
    }

    const customerId = customer.id;

    const result = await creem.customers.listSubscriptions(customerId);
    const subsList = result.items || [];

    const activeSub = subsList.find((sub: any) =>
      ['active', 'trialing', 'scheduled_cancel'].includes(sub.status)
    );

    if (!activeSub) {
      await supabaseAdmin
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

      return NextResponse.json({ success: true, tier: 'free', message: 'No active subscription. Reset to free tier.' });
    }

    const productId = typeof activeSub.product === 'string' ? activeSub.product : activeSub.product?.id || '';
    const resolvedTier = getTierFromProductId(productId) || 'pro';

    await supabaseAdmin
      .from('profiles')
      .update({
        subscription_id: activeSub.id,
        customer_id: customerId,
        subscription_status: activeSub.status,
        tier: resolvedTier,
        current_period_start: activeSub.currentPeriodStartDate?.toISOString() || new Date().toISOString(),
        current_period_end: activeSub.currentPeriodEndDate?.toISOString() || null,
        canceled_at: activeSub.canceledAt ? (activeSub.canceledAt instanceof Date ? activeSub.canceledAt.toISOString() : null) : null,
        cancel_at_period_end: activeSub.status === 'scheduled_cancel',
      })
      .eq('id', user.id);

    return NextResponse.json({ success: true, tier: resolvedTier, message: 'Billing synchronized.' });
  } catch (err: any) {
    console.error('Billing sync error:', err);
    return NextResponse.json({ error: err.message || 'Billing sync failed' }, { status: 500 });
  }
}
