import { NextResponse } from 'next/server';
import { authenticateRequest } from '../../utils/authHelper';
import { getCreemProductId } from '../../utils/creemProducts';
import { getCreemClient } from '../../utils/creemClient';

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
    }

    const { planId, cohort = 'global', token } = body;

    if (!planId || (planId !== 'pro' && planId !== 'api')) {
      return NextResponse.json({ error: 'Invalid or missing plan selection.' }, { status: 400 });
    }

    const user = await authenticateRequest(token);

    const creemProductId = getCreemProductId(planId, cohort);
    if (!creemProductId) {
      return NextResponse.json({ error: `No product configured for plan '${planId}'.` }, { status: 500 });
    }

    const successUrl = `${new URL(req.url).origin}/account?checkout=success`;
    const creem = getCreemClient();

    const result = await creem.checkouts.create({
      productId: creemProductId,
      successUrl,
      customer: { email: user.email || '' },
      metadata: { referenceId: user.id },
    });

    if (!result.checkoutUrl) {
      return NextResponse.json({ error: 'Checkout URL not returned from payment gateway.' }, { status: 502 });
    }

    return NextResponse.json({ checkoutUrl: result.checkoutUrl });
  } catch (err: any) {
    console.error('Checkout error:', err);
    const message = err.message || 'Failed to create checkout session.';
    const status = err.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}
