"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader, AlertCircle, CreditCard, Check } from 'lucide-react';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  brandName: string;
  pricingData: any;
  sessionUser: any;
  supabase: any;
  pricingCohort: string;
  userPlan: 'free' | 'pro' | 'admin' | 'api';
  setUserPlan: (plan: 'free' | 'pro' | 'admin' | 'api') => void;
  subscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
}

export default function PaywallModal({
  open, onClose, brandName, pricingData, sessionUser, supabase, pricingCohort, userPlan, setUserPlan, subscriptionId, cancelAtPeriodEnd
}: PaywallModalProps) {
  const [checkoutSpinner, setCheckoutSpinner] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Upgrade confirmation states
  const [upgradePreview, setUpgradePreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<'pro' | 'api' | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open || !mounted) return null;

  const apiPrice = pricingCohort === 'india' 
    ? '999' 
    : pricingCohort === 'mid' 
      ? '14.99' 
      : pricingCohort === 'low' 
        ? '6.99' 
        : '29';

  const proPrice = pricingData.monthly;
  const currency = pricingData.currency;

  async function handlePlanClick(planName: 'pro' | 'api') {
    setCheckoutError(null);
    if (userPlan === planName) {
      setCheckoutError(`You are already subscribed to the ${planName === 'api' ? 'Developer Plan' : 'Pro Plan'} plan.`);
      return;
    }

    // Check if user is upgrading/downgrading from an existing plan
    const isChangingPlan = (userPlan === 'pro' || userPlan === 'api') && !!subscriptionId;

    if (isChangingPlan) {
      setLoadingPreview(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setCheckoutError("Missing active session token. Please sign in.");
          setLoadingPreview(false);
          return;
        }

        const response = await fetch('/billing/upgrade/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: planName, token, pricingCohort }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to calculate proration preview.');
        }

        setUpgradePreview(data);
        setPendingPlan(planName);
      } catch (err: any) {
        console.error("Preview calculation failed:", err);
        setCheckoutError(err.message || 'Failed to fetch plan change details.');
      } finally {
        setLoadingPreview(false);
      }
      return;
    }

    setCheckoutSpinner(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setCheckoutError("Missing active session token. Please sign in.");
        setCheckoutSpinner(false);
        return;
      }

      // If they are on a free tier, construct new checkout session
      const cohort = pricingCohort === 'india' ? 'india' : 'global';

      const response = await fetch('/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planName,
          cohort,
          token
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate secure checkout session.');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('Payment gateway did not return a valid checkout session URL.');
      }
    } catch (err: any) {
      console.error("Checkout session initiation failed:", err);
      setCheckoutError(err.message || 'Payment server connection failed. Please try again.');
      setCheckoutSpinner(false);
    }
  }

  async function handleConfirmUpgrade() {
    if (!pendingPlan) return;
    setCheckoutSpinner(true);
    setCheckoutError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setCheckoutError("Missing active session token. Please sign in.");
        setCheckoutSpinner(false);
        return;
      }

      const response = await fetch('/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: pendingPlan, token }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription tier.');
      }

      setUserPlan(pendingPlan);
      window.location.href = '/account?checkout=success';
    } catch (err: any) {
      console.error("Upgrade failed:", err);
      setCheckoutError(err.message || 'Failed to execute plan change.');
      setCheckoutSpinner(false);
    }
  }

  const listStyle: React.CSSProperties = {
    listStyleType: 'none',
    margin: 0,
    padding: 0,
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'var(--bg-overlay-modal)',
      backdropFilter: 'blur(20px) saturate(140%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 780,
        background: 'var(--bg-elev-1)',
        border: '1px solid oklch(0.45 0.10 265 / 0.3)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-modal)',
        position: 'relative',
        display: 'flex', flexDirection: 'column'
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="reset" style={{
          position: 'absolute', top: 20, right: 20,
          color: 'var(--fg-subtle)', cursor: 'pointer', zIndex: 10,
          background: 'none', border: 'none', outline: 'none'
        }}>
          <X size={16} />
        </button>

        {checkoutSpinner ? (
          <div style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 440 }} className="fade-in">
            <Loader size={48} style={{ color: 'var(--accent)', marginBottom: 24, animation: 'spin 1s linear infinite' }} />
            <h3 style={{ fontSize: 20, fontWeight: 600, color: 'white', marginBottom: 8, textAlign: 'center' }}>Connecting to Creem Secure Checkout...</h3>
            <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', textAlign: 'center', maxWidth: 365, lineHeight: 1.5 }}>
              Initializing your sandbox subscription profile. You will be redirected to the secure sandbox payment form.
            </p>
          </div>
        ) : loadingPreview ? (
          <div style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 440, width: '100%' }} className="fade-in">
            <Loader size={48} style={{ color: 'var(--accent)', marginBottom: 24, animation: 'spin 1s linear infinite' }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 8, textAlign: 'center' }}>Calculating Proration Preview...</h3>
            <p style={{ fontSize: 13, color: 'var(--fg-muted)', textAlign: 'center', maxWidth: 380, lineHeight: 1.5 }}>
              Fetching accurate remaining time credits from your current subscription to apply to the new plan.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'row', minHeight: 460 }} className="fade-in">
            {/* Left Info bar */}
            <div style={{
              flex: '1.2', background: 'oklch(0.16 0.012 265 / 0.4)',
              borderRight: '1px solid var(--border)', padding: '36px 30px',
              display: 'flex', flexDirection: 'column', gap: 28,
              boxSizing: 'border-box'
            }}>
              <div>
                <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vault Access Comparison</span>
                <h3 style={{ fontSize: 21, fontWeight: 600, color: 'white', margin: '6px 0 0', letterSpacing: '-0.02em' }}>Understand Your Benefits</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 1. Pro Plan Block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.70 0.18 265)' }} />
                    Pro Plan ($9/mo)
                  </span>
                  <ul style={{ ...listStyle, display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 12 }}>
                    <li style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'oklch(0.70 0.18 265)', fontWeight: 'bold' }}>✓</span> Unlimited browser tool computing
                    </li>
                    <li style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'oklch(0.70 0.18 265)', fontWeight: 'bold' }}>✓</span> 100 daily Production API requests
                    </li>
                    <li style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'oklch(0.70 0.18 265)', fontWeight: 'bold' }}>✓</span> PDF Diff tool & watermark removal
                    </li>
                  </ul>
                </div>

                {/* 2. Developer Plan Block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'oklch(0.78 0.16 145)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.78 0.16 145)' }} />
                    Developer Plan ($29/mo)
                  </span>
                  <ul style={{ ...listStyle, display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 12 }}>
                    <li style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'oklch(0.78 0.16 145)', fontWeight: 'bold' }}>✓</span> <strong>All Pro Plan features included</strong>
                    </li>
                    <li style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'oklch(0.78 0.16 145)', fontWeight: 'bold' }}>✓</span> <strong>1,000 daily Production API requests</strong>
                    </li>
                    <li style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'oklch(0.78 0.16 145)', fontWeight: 'bold' }}>✓</span> <strong>Direct Developer API keys console</strong>
                    </li>
                    <li style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'oklch(0.78 0.16 145)', fontWeight: 'bold' }}>✓</span> Custom webhook status callbacks
                    </li>
                  </ul>
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'oklch(0.70 0.12 145)' }}>
                  <Check size={12} strokeWidth={2.5} />
                  <span>Transparent Sandbox Proration</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--fg-dim)', margin: 0, lineHeight: 1.35 }}>
                  Upgrade instantly at any time. Card details are charged safely and prorated immediately.
                </p>
              </div>
            </div>

            {/* Right Side Rendering */}
            {upgradePreview ? (
              <div style={{ flex: '1.4', padding: 36, display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' }} className="fade-in">
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: '0 0 4px' }}>Confirm Subscription Change</h4>
                  <p style={{ fontSize: 12, color: 'var(--fg-subtle)', margin: 0 }}>Review the prorated adjustments before charging your card.</p>
                </div>

                {checkoutError && (
                  <div style={{
                    padding: '12px 14px', borderRadius: 8,
                    background: 'oklch(0.20 0.05 20 / 0.3)', border: '1px solid oklch(0.50 0.15 20 / 0.4)',
                    color: 'oklch(0.75 0.12 20)', fontSize: 12.5, display: 'flex', gap: 8, alignItems: 'flex-start'
                  }}>
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <div style={{ background: 'oklch(0.14 0.005 250)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                    <span style={{ color: 'var(--fg-dim)' }}>New Selected Plan:</span>
                    <strong style={{ color: 'white' }}>{upgradePreview.newTier === 'api' ? 'Developer Plan' : 'Pro Plan'}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--fg-dim)' }}>New Plan Monthly Price:</span>
                    <span style={{ color: 'white', fontWeight: 500 }}>{upgradePreview.currency}{upgradePreview.newPrice.toFixed(2)}/mo</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--fg-dim)' }}>Unused Time Credit (Prorated):</span>
                    <span style={{ color: 'oklch(0.78 0.16 145)', fontWeight: 600 }}>-{upgradePreview.currency}{upgradePreview.unusedCredit.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderTop: '1px dotted var(--border)', paddingTop: 12 }}>
                    <span style={{ color: 'white', fontWeight: 600 }}>Due Immediately:</span>
                    <strong style={{ color: 'var(--accent)', fontSize: 16 }}>{upgradePreview.currency}{upgradePreview.immediateCharge.toFixed(2)}</strong>
                  </div>
                </div>

                <p style={{ fontSize: 11, color: 'var(--fg-dim)', margin: 0, lineHeight: 1.45 }}>
                  * Confirming will charge your card on file <strong>{upgradePreview.currency}{upgradePreview.immediateCharge.toFixed(2)}</strong> today. A new monthly billing cycle will start immediately, renewing on <strong>{upgradePreview.nextBillingDate}</strong> for <strong>{upgradePreview.currency}{upgradePreview.newPrice.toFixed(2)}/mo</strong>.
                </p>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button onClick={() => { setUpgradePreview(null); setPendingPlan(null); }} className="reset" style={{
                    flex: 1, padding: '10px 14px', borderRadius: 8,
                    background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                    color: 'var(--fg)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', textAlign: 'center'
                  }}>Back to Plans</button>

                  <button onClick={handleConfirmUpgrade} disabled={checkoutSpinner} className="reset" style={{
                    flex: 1.5, padding: '10px 14px', borderRadius: 8,
                    background: 'linear-gradient(180deg, var(--accent) 0%, oklch(0.60 0.16 265) 100%)',
                    border: '1px solid var(--border)',
                    color: 'white', fontWeight: 600, fontSize: 12.5, cursor: checkoutSpinner ? 'not-allowed' : 'pointer',
                    textAlign: 'center'
                  }}>
                    {checkoutSpinner ? 'Processing...' : `Confirm & Pay ${upgradePreview.currency}${upgradePreview.immediateCharge.toFixed(2)}`}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ flex: '1.4', padding: 36, display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center' }}>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 4px' }}>Select Sandbox Subscription:</h4>
                  <p style={{ fontSize: 12, color: 'var(--fg-subtle)', margin: 0 }}>Safe test credit cards accepted</p>
                </div>

                {checkoutError && (
                  <div style={{
                    padding: '12px 14px', borderRadius: 8,
                    background: 'oklch(0.20 0.05 20 / 0.3)', border: '1px solid oklch(0.50 0.15 20 / 0.4)',
                    color: 'oklch(0.75 0.12 20)', fontSize: 12.5, display: 'flex', gap: 8, alignItems: 'flex-start'
                  }}>
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <button onClick={() => handlePlanClick('pro')} className="reset plan-card" style={{
                    textAlign: 'left', padding: '18px 20px', borderRadius: 12,
                    background: 'oklch(0.20 0.008 250)', border: '1px solid var(--border)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'border-color 0.15s, background 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'oklch(0.22 0.010 265 / 0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'oklch(0.20 0.008 250)'; }}
                  >
                    <div style={{ flex: 1, marginRight: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'white' }}>Pro Plan</div>
                        <span className="mono" style={{ fontSize: 9, background: 'oklch(0.35 0.15 265 / 0.3)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>MOST POPULAR</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--fg-subtle)', lineHeight: 1.35 }}>Complete cockpit access with unlimited tool computing.</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>{currency}{proPrice}</div>
                      <div style={{ fontSize: 10, color: 'var(--fg-dim)' }}>/ month</div>
                    </div>
                  </button>

                  <button onClick={() => handlePlanClick('api')} className="reset plan-card" style={{
                    textAlign: 'left', padding: '18px 20px', borderRadius: 12,
                    background: 'oklch(0.20 0.008 250)', border: '1px solid var(--border)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'border-color 0.15s, background 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'oklch(0.22 0.010 265 / 0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'oklch(0.20 0.008 250)'; }}
                  >
                    <div style={{ flex: 1, marginRight: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'white' }}>Developer Plan</div>
                        <span className="mono" style={{ fontSize: 9, background: 'oklch(0.35 0.15 145 / 0.25)', color: 'oklch(0.78 0.16 145)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>POWER TIER</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--fg-subtle)', lineHeight: 1.35 }}>Direct API keys, higher query limits & webhook callbacks.</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>{currency}{apiPrice}</div>
                      <div style={{ fontSize: 10, color: 'var(--fg-dim)' }}>/ month</div>
                    </div>
                  </button>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={14} style={{ color: 'var(--fg-subtle)' }} />
                  <span style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>Secured by Creem &bull; PCI-DSS Compliant SSL Checkout</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
