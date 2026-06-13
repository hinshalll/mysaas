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
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 10000,
          background: 'oklch(0.20 0.04 145 / 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid oklch(0.70 0.15 145 / 0.3)',
          borderRadius: 12, padding: '16px 20px', maxWidth: 380,
          boxShadow: '0 10px 30px oklch(0 0 0 / 0.3)',
          display: 'flex', gap: 14, alignItems: 'flex-start',
          animation: 'slideUp 0.3s ease-out'
        }} className="fade-in">
          <div style={{
            background: 'oklch(0.70 0.15 145 / 0.15)',
            border: '1px solid oklch(0.70 0.15 145 / 0.3)',
            borderRadius: '50%', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'oklch(0.75 0.16 145)', flexShrink: 0
          }}>
            <Check size={20} strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'white' }}>Subscription Activated Successfully!</h4>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.4 }}>
              Thank you for upgrading! Your subscription status has been verified and your new benefits are active.
            </p>
          </div>
          <button onClick={() => setShowSuccessBanner(false)} className="reset" style={{
            color: 'var(--fg-subtle)', cursor: 'pointer', background: 'none', border: 'none', padding: 0
          }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Global Premium Glassmorphic Alert Modal */}
      {customAlert && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 100000,
          background: 'oklch(0.12 0.015 250 / 0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div style={{
            background: 'oklch(0.18 0.015 250 / 0.85)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            maxWidth: 400,
            width: '90%',
            boxShadow: '0 24px 60px oklch(0 0 0 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.05)',
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', gap: 18,
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <style>{`
              @keyframes scaleIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
            
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              alignSelf: 'center',
              boxShadow: '0 0 12px oklch(0.70 0.18 265 / 0.3)',
            }}>
              <Info size={20} style={{ color: 'white' }} />
            </div>

            <div>
              <h3 style={{
                fontSize: 18, fontWeight: 600, color: 'white',
                marginBottom: 8, letterSpacing: '-0.015em'
              }}>{customAlert.title}</h3>
              <p style={{
                fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-muted)',
                margin: 0
              }}>{customAlert.message}</p>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 4 }}>
              {customAlert.actionLabel && customAlert.onAction && (
                <button
                  onClick={() => {
                    customAlert.onAction?.();
                    setCustomAlert(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(180deg, oklch(0.72 0.18 265), oklch(0.62 0.20 305))',
                    color: 'white',
                    fontWeight: 600, fontSize: 13,
                    borderRadius: 8, border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 12px oklch(0.62 0.20 305 / 0.3)',
                  }}
                >
                  {customAlert.actionLabel}
                </button>
              )}
              <button
                onClick={() => setCustomAlert(null)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--bg-elev-1)',
                  border: '1px solid var(--border)',
                  color: 'var(--fg)',
                  fontWeight: 500, fontSize: 13,
                  borderRadius: 8, cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Premium Auto-Dismissing Toast Notification */}
      {customToast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 100000,
          background: 'oklch(0.20 0.03 260 / 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 30px oklch(0 0 0 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.1)',
          borderRadius: 12, padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
          color: 'white', fontSize: 13.5, fontWeight: 500,
          animation: 'slideUpToast 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <style>{`
            @keyframes slideUpToast {
              from { transform: translate(-50%, 20px); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
          `}</style>
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', flexShrink: 0
          }}>
            <Check size={11} strokeWidth={3} />
          </div>
          <span>{customToast}</span>
        </div>
      )}
    </>
  );
}
