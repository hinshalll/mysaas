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
      return NextResponse.json({ orders: [] });
    }

    const creem = getCreemClient();
    const result = await creem.customers.getOrders(profile.customer_id);
    const ordersList = result.items || [];

    // Filter only successful paid orders
    const successOrders = ordersList.filter(
      (order: any) => order.status === 'paid' || order.status === 'completed'
    );

    // Map fields cleanly for frontend
    const mappedOrders = successOrders.map((order: any) => ({
      id: order.id,
      amount: order.amount, // in cents
      currency: order.currency,
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
      status: order.status,
    }));

    return NextResponse.json({ orders: mappedOrders });
  } catch (err: any) {
    console.error('Fetch invoices error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}
