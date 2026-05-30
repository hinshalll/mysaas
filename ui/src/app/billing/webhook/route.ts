import { Webhook } from '@creem_io/nextjs';
import { supabaseAdmin } from '../../utils/supabaseAdmin';
import { getTierFromProductId } from '../../utils/creemProducts';

export const POST = Webhook({
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET || '',

  onGrantAccess: async (event: any) => {
    try {
      const customer = event?.customer;
      const metadata = event?.metadata;
      const product = event?.product;
      const subscription = event?.subscription || event;

      let userId = metadata?.referenceId as string | undefined;

      if (!userId && customer?.email) {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', customer.email)
          .single();
        userId = data?.id;
      }

      if (!userId) {
        console.error('onGrantAccess: Could not resolve user ID', { customer, metadata });
        return;
      }

      const productId = typeof product === 'string' ? product : product?.id || '';
      const resolvedTier = getTierFromProductId(productId) || 'pro';

      // Normalize dates — webhook payload may use snake_case or camelCase
      const periodStart = subscription?.currentPeriodStartDate || subscription?.current_period_start_date || subscription?.current_period_start;
      const periodEnd = subscription?.currentPeriodEndDate || subscription?.current_period_end_date || subscription?.current_period_end;
      const canceledAt = subscription?.canceledAt || subscription?.canceled_at;

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_id: subscription?.id || null,
          customer_id: customer?.id || null,
          subscription_status: subscription?.status || 'active',
          tier: resolvedTier,
          current_period_start: periodStart ? new Date(periodStart).toISOString() : new Date().toISOString(),
          current_period_end: periodEnd ? new Date(periodEnd).toISOString() : null,
          canceled_at: canceledAt ? new Date(canceledAt).toISOString() : null,
          cancel_at_period_end: subscription?.status === 'scheduled_cancel',
        })
        .eq('id', userId);

      if (error) {
        console.error(`onGrantAccess DB error for ${userId}:`, error);
      }
    } catch (err) {
      console.error('onGrantAccess error:', err);
    }
  },

  onRevokeAccess: async (event: any) => {
    try {
      const customer = event?.customer;
      const metadata = event?.metadata;
      let userId = metadata?.referenceId as string | undefined;

      if (!userId && customer?.email) {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', customer.email)
          .single();
        userId = data?.id;
      }

      if (!userId) {
        console.error('onRevokeAccess: Could not resolve user ID', { customer, metadata });
        return;
      }

      const { error } = await supabaseAdmin
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
        .eq('id', userId);

      if (error) {
        console.error(`onRevokeAccess DB error for ${userId}:`, error);
      }
    } catch (err) {
      console.error('onRevokeAccess error:', err);
    }
  },
});
