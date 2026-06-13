"use client";

import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Check } from 'lucide-react';

interface EnterpriseModalProps {
  open: boolean;
  onClose: () => void;
}

export default function EnterpriseModal({ open, onClose }: EnterpriseModalProps) {
  const [email, setEmail] = useState('');
  const [size, setSize] = useState('10-50');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open || !mounted) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 800);
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      boxSizing: 'border-box',
    }} className="fade-in">
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute',
        inset: 0,
        background: 'oklch(0.08 0.005 250 / 0.75)',
        backdropFilter: 'blur(16px)',
      }} />

      {/* Modal Card */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 460,
        background: 'oklch(0.16 0.006 250 / 0.85)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '36px 32px',
        boxShadow: '0 32px 64px oklch(0 0 0 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.03)',
        boxSizing: 'border-box',
      }} className="fade-in-up">
        {/* Close Button */}
        <button onClick={onClose} className="reset" style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 32,
          height: 32,
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'oklch(0.20 0.008 250 / 0.5)',
          color: 'var(--fg-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <X size={15} />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'oklch(0.22 0.010 195 / 0.15)', border: '1px solid oklch(0.75 0.14 195 / 0.2)', fontSize: 11, fontWeight: 600, color: 'oklch(0.82 0.13 195)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }} className="mono">
              Enterprise Solutions
            </div>
            
            <h2 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px', color: 'white', letterSpacing: '-0.020em' }}>Request Credentials</h2>
            <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
              Talk to us about custom high-compute capacity, dedicated parser nodes, SOC2 compliance, and SAML/SSO.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--fg-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mono">Work Email</label>
                <input required type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} style={{
                  width: '100%', padding: '12px 14px', borderRadius: 8,
                  background: 'oklch(0.12 0.004 250)', border: '1px solid var(--border)',
                  color: 'white', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box',
                }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--fg-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mono">Company Size</label>
                <select value={size} onChange={e => setSize(e.target.value)} style={{
                  width: '100%', padding: '12px 14px', borderRadius: 8,
                  background: 'oklch(0.12 0.004 250)', border: '1px solid var(--border)',
                  color: 'white', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box',
                }}>
                  <option value="10-50">10 to 50 employees</option>
                  <option value="50-200">50 to 200 employees</option>
                  <option value="200+">More than 200 employees</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--fg-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mono">Custom Requirements</label>
                <textarea rows={3} placeholder="Tell us about your estimated daily API volume or PII scrubber compliance needs..." value={notes} onChange={e => setNotes(e.target.value)} style={{
                  width: '100%', padding: '12px 14px', borderRadius: 8,
                  background: 'oklch(0.12 0.004 250)', border: '1px solid var(--border)',
                  color: 'white', fontSize: 14, outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box',
                }} />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="reset" style={{
              width: '100%', marginTop: 24, padding: '14px', borderRadius: 9,
              background: 'linear-gradient(180deg, oklch(0.96 0.005 250), oklch(0.86 0.005 250))',
              color: 'oklch(0.16 0.008 250)', fontWeight: 600, fontSize: 14,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 16px oklch(0.82 0.13 250 / 0.15)',
            }}>
              {submitting ? 'Transmitting Request...' : 'Send Request'} <ArrowRight size={13} strokeWidth={2.5} />
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }} className="fade-in">
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'oklch(0.22 0.010 145 / 0.2)',
              border: '1px solid oklch(0.75 0.14 145 / 0.4)',
              color: 'oklch(0.78 0.16 145)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              boxShadow: '0 0 20px oklch(0.78 0.16 145 / 0.25)',
            }}>
              <Check size={28} strokeWidth={2.5} />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 600, color: 'white', margin: '0 0 10px', letterSpacing: '-0.020em' }}>Request Transmitted!</h2>
            <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
              Thank you! An Enterprise Solutions architect will reach out to you at <span className="mono" style={{ color: 'white' }}>{email}</span> within 2 business hours.
            </p>

            <button onClick={onClose} className="reset" style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: 'oklch(0.20 0.008 250)',
              border: '1px solid var(--border)',
              color: 'white',
              fontSize: 13.5,
              fontWeight: 500,
              cursor: 'pointer',
            }}>Close Window</button>
          </div>
        )}
      </div>
    </div>
  );
}
