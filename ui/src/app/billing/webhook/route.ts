import { Webhook } from '@creem_io/nextjs';
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

export const POST = Webhook({
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET || '',

  onGrantAccess: async (event: any) => {
    try {
      const customer = event?.customer;
      const metadata = event?.metadata;
      const product = event?.product;
      const subscription = event?.subscription || event;

      let userId = metadata?.referenceId as string | undefined;

      // Fallback search by email if referenceId is somehow missing
      if (!userId && customer?.email) {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', customer.email)
          .single();
        userId = data?.id;
      }

      if (!userId) {
        console.error('onGrantAccess failed: User ID could not be resolved from metadata or email', { customer, metadata });
        return;
      }

      // Resolve internal tier based on Creem Product ID
      const resolvedTier = getTierFromProductId(product?.id || '') || 'pro';

      console.log(`Granting ${resolvedTier} access to user ID: ${userId}`, { subscription });

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_id: subscription?.id || null,
          customer_id: customer?.id || null,
          subscription_status: subscription?.status || 'active',
          tier: resolvedTier,
          current_period_start: safeDate(subscription?.current_period_start || subscription?.currentPeriodStartDate) || new Date().toISOString(),
          current_period_end: safeDate(subscription?.current_period_end || subscription?.currentPeriodEndDate) || null,
          canceled_at: safeDate(subscription?.canceled_at || subscription?.canceledAt) || null,
          cancel_at_period_end: subscription?.status === 'scheduled_cancel' || !!subscription?.cancel_at_period_end,
        })
        .eq('id', userId);

      if (error) {
        console.error(`onGrantAccess Database update error for user ${userId}:`, error);
      }
    } catch (err) {
      console.error('Error executing onGrantAccess webhook callback:', err);
    }
  },

  onRevokeAccess: async (event: any) => {
    try {
      const customer = event?.customer;
      const metadata = event?.metadata;
      let userId = metadata?.referenceId as string | undefined;

      // Fallback search by email
      if (!userId && customer?.email) {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', customer.email)
          .single();
        userId = data?.id;
      }

      if (!userId) {
        console.error('onRevokeAccess failed: User ID could not be resolved', { customer, metadata });
        return;
      }

      console.log(`Revoking subscription access for user ID: ${userId}`);

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
        console.error(`onRevokeAccess Database update error for user ${userId}:`, error);
      }
    } catch (err) {
      console.error('Error executing onRevokeAccess webhook callback:', err);
    }
  },
});
