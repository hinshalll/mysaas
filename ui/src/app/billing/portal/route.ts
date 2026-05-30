import { NextResponse } from 'next/server';
import { authenticateRequest } from '../../utils/authHelper';
import { supabaseAdmin } from '../../utils/supabaseAdmin';
import { getCreemClient } from '../../utils/creemClient';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const user = await authenticateRequest(token);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.customer_id) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    const creem = getCreemClient();
    const result = await creem.customers.generateBillingLinks({ customerId: profile.customer_id });

    return NextResponse.redirect(result.customerPortalLink);
  } catch (err: any) {
    console.error('Billing portal error:', err);
    return NextResponse.json({ error: err.message || 'Failed to open billing portal' }, { status: 500 });
  }
}
