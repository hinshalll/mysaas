import { NextResponse } from 'next/server';
import { authenticateRequest } from '../../../utils/authHelper';
import { supabaseAdmin } from '../../../utils/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { planId, token, pricingCohort = 'global' } = await req.json();

    if (planId !== 'pro' && planId !== 'api') {
      return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });
    }

    const user = await authenticateRequest(token);

    // Fetch the user's current subscription details from the database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('tier, current_period_start, current_period_end, subscription_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    const currentTier = profile.tier || 'free';
    const currentPeriodStart = profile.current_period_start ? new Date(profile.current_period_start) : null;
    const currentPeriodEnd = profile.current_period_end ? new Date(profile.current_period_end) : null;

    // Define price matrix based on the pricing cohort
    const pricingMatrix: Record<string, { pro: number; api: number; currency: string }> = {
      india: { pro: 299, api: 999, currency: '₹' },
      mid: { pro: 3.99, api: 14.99, currency: '$' },
      low: { pro: 1.99, api: 6.99, currency: '$' },
      global: { pro: 9.00, api: 29.00, currency: '$' },
      high: { pro: 9.00, api: 29.00, currency: '$' }
    };

    const cohortData = pricingMatrix[pricingCohort] || pricingMatrix['global'];
    const currentPrice = currentTier === 'free' ? 0 : (cohortData[currentTier as 'pro' | 'api'] || 0);
    const newPrice = cohortData[planId as 'pro' | 'api'] || 0;

    let unusedCredit = 0;
    let immediateCharge = newPrice;

    if (currentTier !== 'free' && currentPeriodStart && currentPeriodEnd) {
      const now = new Date();
      const totalDuration = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
      const remainingDuration = currentPeriodEnd.getTime() - now.getTime();

      if (totalDuration > 0 && remainingDuration > 0) {
        const prorationRatio = remainingDuration / totalDuration;
        unusedCredit = currentPrice * prorationRatio;
        immediateCharge = newPrice - unusedCredit;
      }
    }

    // Clamp values to non-negative and round to 2 decimal places
    unusedCredit = Math.max(0, Math.round(unusedCredit * 100) / 100);
    immediateCharge = Math.max(0, Math.round(immediateCharge * 100) / 100);

    const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);

    return NextResponse.json({
      success: true,
      currentTier,
      newTier: planId,
      currentPrice,
      newPrice,
      unusedCredit,
      immediateCharge,
      currency: cohortData.currency,
      nextBillingDate: formatter.format(nextDate)
    });
  } catch (err: any) {
    console.error('Upgrade preview error:', err);
    return NextResponse.json({ error: err.message || 'Failed to calculate proration preview.' }, { status: 500 });
  }
}
