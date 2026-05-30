import { NextResponse } from 'next/server';
import { authenticateRequest } from '../../utils/authHelper';
import { supabaseAdmin } from '../../utils/supabaseAdmin';
import { getCreemClient } from '../../utils/creemClient';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    const user = await authenticateRequest(token);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_id, subscription_status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found.' },
        { status: 404 }
      );
    }

    const { subscription_id: subscriptionId, subscription_status: subscriptionStatus } = profile;

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'No subscription found.' },
        { status: 400 }
      );
    }

    if (subscriptionStatus !== 'scheduled_cancel') {
      return NextResponse.json(
        { success: false, error: 'Subscription is not pending cancellation.' },
        { status: 400 }
      );
    }

    const creem = getCreemClient();
    const result = await creem.subscriptions.resume(subscriptionId);

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: result.status || 'active',
        cancel_at_period_end: false,
        canceled_at: null,
        current_period_end: result.currentPeriodEndDate?.toISOString() || null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile after resume:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update subscription status.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription resumed successfully.',
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
