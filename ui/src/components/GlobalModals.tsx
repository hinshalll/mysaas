"use client";

import React from 'react';
import { useSaaS } from '../context/SaaSContext';
import { Info, Check, X } from 'lucide-react';
import { supabase } from '../app/supabase';

// Import sub-modals
import AuthModal from './AuthModal';
import PaywallModal from './PaywallModal';
import EnterpriseModal from './EnterpriseModal';
import CommandPalette from './CommandPalette';
import Launcher from './Launcher';

export default function GlobalModals() {
  const {
    palette, setPalette,
    launcher, setLauncher,
    enterpriseOpen, setEnterpriseOpen,
    authOpen, setAuthOpen,
    showPaywall, setShowPaywall,
    showSuccessBanner, setShowSuccessBanner,
    customAlert, setCustomAlert,
    customToast,
    brandName,
    pricingData,
    sessionUser,
    pricingCohort,
    userPlan,
    setUserPlan,
    subscriptionId,
    cancelAtPeriodEnd,
    openTool
  } = useSaaS();

  return (
    <>
      <CommandPalette open={palette} onClose={() => setPalette(false)} onPick={openTool} />
      <Launcher open={launcher} onClose={() => setLauncher(false)} onPick={openTool} />
      <EnterpriseModal open={enterpriseOpen} onClose={() => setEnterpriseOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} supabase={supabase} />
      <PaywallModal 
        open={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        brandName={brandName} 
        pricingData={pricingData} 
        sessionUser={sessionUser} 
        supabase={supabase} 
        pricingCohort={pricingCohort} 
        userPlan={userPlan}
        setUserPlan={setUserPlan}
        subscriptionId={subscriptionId}
        cancelAtPeriodEnd={cancelAtPeriodEnd}
      />

      {/* Subscription Success Toast */}
      {showSuccessBanner && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-[oklch(0.20_0.04_145/0.85)] backdrop-blur-[12px] border border-[oklch(0.70_0.15_145/0.3)] rounded-xl px-5 py-4 max-w-[380px] shadow-[0_10px_30px_oklch(0_0_0/0.3)] flex gap-3.5 items-start animate-[slideUp_0.3s_ease-out]">
          <div className="bg-[oklch(0.70_0.15_145/0.15)] border border-[oklch(0.70_0.15_145/0.3)] rounded-full w-9 h-9 flex items-center justify-center text-[oklch(0.75_0.16_145)] shrink-0">
            <Check size={20} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h4 className="m-0 mb-1 text-[14px] font-semibold text-white">Subscription Activated Successfully!</h4>
            <p className="m-0 text-[12.5px] text-[var(--fg-muted)] leading-[1.4]">
              Thank you for upgrading! Your subscription status has been verified and your new benefits are active.
            </p>
          </div>
          <button onClick={() => setShowSuccessBanner(false)} className="reset text-[var(--fg-subtle)] cursor-pointer bg-none border-none p-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Global Premium Glassmorphic Alert Modal */}
      {customAlert && (
        <div className="fixed inset-0 z-[100000] bg-[oklch(0.12_0.015_250/0.55)] backdrop-blur-[12px] flex items-center justify-center animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[oklch(0.18_0.015_250/0.85)] border border-[var(--border)] rounded-2xl p-6 max-w-[400px] w-[90%] shadow-[0_24px_60px_oklch(0_0_0/0.5),_inset_0_1px_0_oklch(1_0_0/0.05)] text-center flex flex-col gap-[18px] animate-[scaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
            <style>{`
              @keyframes scaleIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
            
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[oklch(0.70_0.18_265)] to-[oklch(0.62_0.20_305)] flex items-center justify-center self-center shadow-[0_0_12px_oklch(0.70_0.18_265/0.3)]">
              <Info size={20} className="text-white" />
            </div>

            <div>
              <h3 className="text-[18px] font-semibold text-white mb-2 tracking-[-0.015em]">{customAlert.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-[var(--fg-muted)] m-0">{customAlert.message}</p>
            </div>

            <div className="flex gap-2.5 justify-center mt-1">
              {customAlert.actionLabel && customAlert.onAction && (
                <button
                  onClick={() => {
                    customAlert.onAction?.();
                    setCustomAlert(null);
                  }}
                  className="px-4 py-2 bg-gradient-to-b from-[oklch(0.72_0.18_265)] to-[oklch(0.62_0.20_305)] text-white font-semibold text-[13px] rounded-lg border-none cursor-pointer shadow-[0_4px_12px_oklch(0.62_0.20_305/0.3)]"
                >
                  {customAlert.actionLabel}
                </button>
              )}
              <button
                onClick={() => setCustomAlert(null)}
                className="px-4 py-2 bg-[var(--bg-elev-1)] border border-[var(--border)] text-[var(--fg)] font-medium text-[13px] rounded-lg cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Premium Auto-Dismissing Toast Notification */}
      {customToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100000] bg-[oklch(0.20_0.03_260/0.85)] backdrop-blur-[12px] border border-[var(--border)] shadow-[0_8px_30px_oklch(0_0_0/0.3),_inset_0_1px_0_oklch(1_0_0/0.1)] rounded-xl px-5 py-3 flex items-center gap-2.5 text-white text-[13.5px] font-medium animate-[slideUpToast_0.3s_cubic-bezier(0.16,1,0.3,1)]">
          <style>{`
            @keyframes slideUpToast {
              from { transform: translate(-50%, 20px); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
          `}</style>
          <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-[oklch(0.70_0.18_265)] to-[oklch(0.62_0.20_305)] flex items-center justify-center text-white shrink-0">
            <Check size={11} strokeWidth={3} />
          </div>
          <span>{customToast}</span>
        </div>
      )}
    </>
  );
}
