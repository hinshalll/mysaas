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

  return createPortal(
    <div className="fixed inset-0 z-[1000] bg-[var(--bg-overlay-modal)] backdrop-blur-[20px] saturate-[140%] flex items-center justify-center p-5" onClick={onClose}>
      <div className="w-full max-w-[780px] bg-[var(--bg-elev-1)] border border-[oklch(0.45_0.10_265/0.3)] rounded-2xl overflow-hidden shadow-[var(--shadow-modal)] relative flex flex-col" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="reset absolute top-5 right-5 text-[var(--fg-subtle)] cursor-pointer z-10 bg-none border-none outline-none hover:text-[var(--fg)] transition-colors">
          <X size={16} />
        </button>

        {checkoutSpinner ? (
          <div className="px-10 py-20 flex flex-col items-center justify-center min-h-[440px] animate-[fadeIn_0.2s_ease-out]">
            <Loader size={48} className="text-[var(--accent)] mb-6 animate-spin" />
            <h3 className="text-[20px] font-semibold text-white mb-2 text-center">Connecting to Creem Secure Checkout...</h3>
            <p className="text-[13.5px] text-[var(--fg-muted)] text-center max-w-[365px] leading-relaxed m-0">
              Initializing your sandbox subscription profile. You will be redirected to the secure sandbox payment form.
            </p>
          </div>
        ) : loadingPreview ? (
          <div className="px-10 py-20 flex flex-col items-center justify-center min-h-[440px] w-full animate-[fadeIn_0.2s_ease-out]">
            <Loader size={48} className="text-[var(--accent)] mb-6 animate-spin" />
            <h3 className="text-[18px] font-semibold text-white mb-2 text-center">Calculating Proration Preview...</h3>
            <p className="text-[13px] text-[var(--fg-muted)] text-center max-w-[380px] leading-relaxed m-0">
              Fetching accurate remaining time credits from your current subscription to apply to the new plan.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row min-h-[460px] animate-[fadeIn_0.2s_ease-out]">
            {/* Left Info bar */}
            <div className="flex-[1.2] bg-[oklch(0.16_0.012_265/0.4)] sm:border-r sm:border-b-0 border-b border-[var(--border)] px-[30px] py-[36px] flex flex-col gap-7 box-border">
              <div>
                <span className="mono text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.06em]">Vault Access Comparison</span>
                <h3 className="text-[21px] font-semibold text-white mt-1.5 mb-0 tracking-[-0.02em]">Understand Your Benefits</h3>
              </div>
              
              <div className="flex flex-col gap-5">
                {/* 1. Pro Plan Block */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11.5px] font-bold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.70_0.18_265)]" />
                    Pro Plan ($9/mo)
                  </span>
                  <ul className="list-none m-0 p-0 pl-3 flex flex-col gap-1.5">
                    <li className="text-[12px] text-[var(--fg-subtle)] flex items-center gap-1.5">
                      <span className="text-[oklch(0.70_0.18_265)] font-bold">✓</span> Unlimited browser tool computing
                    </li>
                    <li className="text-[12px] text-[var(--fg-subtle)] flex items-center gap-1.5">
                      <span className="text-[oklch(0.70_0.18_265)] font-bold">✓</span> 100 daily Production API requests
                    </li>
                    <li className="text-[12px] text-[var(--fg-subtle)] flex items-center gap-1.5">
                      <span className="text-[oklch(0.70_0.18_265)] font-bold">✓</span> PDF Diff tool & watermark removal
                    </li>
                  </ul>
                </div>

                {/* 2. Developer Plan Block */}
                <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-4">
                  <span className="text-[11.5px] font-bold text-[oklch(0.78_0.16_145)] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.78_0.16_145)]" />
                    Developer Plan ($29/mo)
                  </span>
                  <ul className="list-none m-0 p-0 pl-3 flex flex-col gap-1.5">
                    <li className="text-[12px] text-[var(--fg-subtle)] flex items-center gap-1.5">
                      <span className="text-[oklch(0.78_0.16_145)] font-bold">✓</span> <strong>All Pro Plan features included</strong>
                    </li>
                    <li className="text-[12px] text-[var(--fg-subtle)] flex items-center gap-1.5">
                      <span className="text-[oklch(0.78_0.16_145)] font-bold">✓</span> <strong>1,000 daily Production API requests</strong>
                    </li>
                    <li className="text-[12px] text-[var(--fg-subtle)] flex items-center gap-1.5">
                      <span className="text-[oklch(0.78_0.16_145)] font-bold">✓</span> <strong>Direct Developer API keys console</strong>
                    </li>
                    <li className="text-[12px] text-[var(--fg-subtle)] flex items-center gap-1.5">
                      <span className="text-[oklch(0.78_0.16_145)] font-bold">✓</span> Custom webhook status callbacks
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-1.5 pt-4">
                <div className="flex items-center gap-1.5 text-[11.5px] text-[oklch(0.70_0.12_145)]">
                  <Check size={12} strokeWidth={2.5} />
                  <span>Transparent Sandbox Proration</span>
                </div>
                <p className="text-[11px] text-[var(--fg-dim)] m-0 leading-[1.35]">
                  Upgrade instantly at any time. Card details are charged safely and prorated immediately.
                </p>
              </div>
            </div>

            {/* Right Side Rendering */}
            {upgradePreview ? (
              <div className="flex-[1.4] p-9 flex flex-col gap-5 justify-center animate-[fadeIn_0.2s_ease-out]">
                <div>
                  <h4 className="text-[15px] font-semibold text-white m-0 mb-1">Confirm Subscription Change</h4>
                  <p className="text-[12px] text-[var(--fg-subtle)] m-0">Review the prorated adjustments before charging your card.</p>
                </div>

                {checkoutError && (
                  <div className="px-3.5 py-3 rounded-lg bg-[oklch(0.20_0.05_20/0.3)] border border-[oklch(0.50_0.15_20/0.4)] text-[oklch(0.75_0.12_20)] text-[12.5px] flex gap-2 items-start">
                    <AlertCircle size={15} className="shrink-0 mt-[1px]" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <div className="bg-[oklch(0.14_0.005_250)] border border-[var(--border)] rounded-xl p-4.5 flex flex-col gap-3.5">
                  <div className="flex justify-between text-[13px] border-b border-[var(--border)] pb-2.5">
                    <span className="text-[var(--fg-dim)]">New Selected Plan:</span>
                    <strong className="text-white">{upgradePreview.newTier === 'api' ? 'Developer Plan' : 'Pro Plan'}</strong>
                  </div>

                  <div className="flex justify-between text-[13px]">
                    <span className="text-[var(--fg-dim)]">New Plan Monthly Price:</span>
                    <span className="text-white font-medium">{upgradePreview.currency}{upgradePreview.newPrice.toFixed(2)}/mo</span>
                  </div>

                  <div className="flex justify-between text-[13px]">
                    <span className="text-[var(--fg-dim)]">Unused Time Credit (Prorated):</span>
                    <span className="text-[oklch(0.78_0.16_145)] font-semibold">-{upgradePreview.currency}{upgradePreview.unusedCredit.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-[14px] border-t border-dotted border-[var(--border)] pt-3">
                    <span className="text-white font-semibold">Due Immediately:</span>
                    <strong className="text-[var(--accent)] text-[16px]">{upgradePreview.currency}{upgradePreview.immediateCharge.toFixed(2)}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--fg-dim)] m-0 leading-relaxed">
                  * Confirming will charge your card on file <strong className="text-white">{upgradePreview.currency}{upgradePreview.immediateCharge.toFixed(2)}</strong> today. A new monthly billing cycle will start immediately, renewing on <strong className="text-white">{upgradePreview.nextBillingDate}</strong> for <strong className="text-white">{upgradePreview.currency}{upgradePreview.newPrice.toFixed(2)}/mo</strong>.
                </p>

                <div className="flex gap-3 mt-2">
                  <button onClick={() => { setUpgradePreview(null); setPendingPlan(null); }} className="reset flex-1 px-3.5 py-2.5 rounded-lg bg-[var(--bg-elev-2)] border border-[var(--border)] text-[var(--fg)] font-semibold text-[12.5px] cursor-pointer text-center hover:bg-[var(--bg-hover)] transition-colors">Back to Plans</button>

                  <button onClick={handleConfirmUpgrade} disabled={checkoutSpinner} className="reset flex-[1.5] px-3.5 py-2.5 rounded-lg bg-gradient-to-b from-[var(--accent)] to-[oklch(0.60_0.16_265)] border border-[var(--border)] text-white font-semibold text-[12.5px] text-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:brightness-110 transition-all">
                    {checkoutSpinner ? 'Processing...' : `Confirm & Pay ${upgradePreview.currency}${upgradePreview.immediateCharge.toFixed(2)}`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-[1.4] p-9 flex flex-col gap-4.5 justify-center">
                <div>
                  <h4 className="text-[14px] font-semibold text-white m-0 mb-1">Select Sandbox Subscription:</h4>
                  <p className="text-[12px] text-[var(--fg-subtle)] m-0">Safe test credit cards accepted</p>
                </div>

                {checkoutError && (
                  <div className="px-3.5 py-3 rounded-lg bg-[oklch(0.20_0.05_20/0.3)] border border-[oklch(0.50_0.15_20/0.4)] text-[oklch(0.75_0.12_20)] text-[12.5px] flex gap-2 items-start">
                    <AlertCircle size={15} className="shrink-0 mt-[1px]" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <div className="flex flex-col gap-3.5">
                  <button onClick={() => handlePlanClick('pro')} className="reset plan-card text-left px-5 py-4.5 rounded-xl bg-[oklch(0.20_0.008_250)] border border-[var(--border)] cursor-pointer flex items-center justify-between transition-all hover:border-[var(--accent)] hover:bg-[oklch(0.22_0.010_265/0.1)] group">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="text-[14.5px] font-semibold text-white">Pro Plan</div>
                        <span className="mono text-[9px] bg-[oklch(0.35_0.15_265/0.3)] text-[var(--accent)] px-1.5 py-0.5 rounded-[4px] font-semibold">MOST POPULAR</span>
                      </div>
                      <div className="text-[12px] text-[var(--fg-subtle)] leading-[1.35]">Complete cockpit access with unlimited tool computing.</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[20px] font-bold text-white">{currency}{proPrice}</div>
                      <div className="text-[10px] text-[var(--fg-dim)]">/ month</div>
                    </div>
                  </button>

                  <button onClick={() => handlePlanClick('api')} className="reset plan-card text-left px-5 py-4.5 rounded-xl bg-[oklch(0.20_0.008_250)] border border-[var(--border)] cursor-pointer flex items-center justify-between transition-all hover:border-[var(--accent)] hover:bg-[oklch(0.22_0.010_265/0.1)] group">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="text-[14.5px] font-semibold text-white">Developer Plan</div>
                        <span className="mono text-[9px] bg-[oklch(0.35_0.15_145/0.25)] text-[oklch(0.78_0.16_145)] px-1.5 py-0.5 rounded-[4px] font-semibold">POWER TIER</span>
                      </div>
                      <div className="text-[12px] text-[var(--fg-subtle)] leading-[1.35]">Direct API keys, higher query limits & webhook callbacks.</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[20px] font-bold text-white">{currency}{apiPrice}</div>
                      <div className="text-[10px] text-[var(--fg-dim)]">/ month</div>
                    </div>
                  </button>
                </div>

                <div className="border-t border-[var(--border)] pt-3.5 flex items-center gap-2 mt-2">
                  <CreditCard size={14} className="text-[var(--fg-subtle)]" />
                  <span className="text-[11.5px] text-[var(--fg-subtle)]">Secured by Creem &bull; PCI-DSS Compliant SSL Checkout</span>
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
