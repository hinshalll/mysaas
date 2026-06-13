"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  supabase: any;
}

export default function AuthModal({ open, onClose, supabase }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Advanced B2B onboarding credentials
  const [signupName, setSignupName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'transparent', width: '0%' };
    if (pass.length < 6) return { score: 1, label: 'Weak (too short)', color: 'oklch(0.60 0.20 20)', width: '33%' };
    
    const hasNumbers = /\d/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    const hasMixedCase = /[a-z]/.test(pass) && /[A-Z]/.test(pass);
    
    if (pass.length >= 8 && hasNumbers && (hasSpecial || hasMixedCase)) {
      return { score: 3, label: 'Strong', color: 'oklch(0.70 0.16 140)', width: '100%' };
    }
    return { score: 2, label: 'Medium', color: 'oklch(0.70 0.16 75)', width: '66%' };
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (!usernameEdited && val.includes('@')) {
      const prefix = val.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      setSignupUsername(prefix);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open || !mounted) return null;

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/account',
        });
        if (error) throw error;
        setMessage("Password reset link sent! Please check your email inbox.");
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: signupName,
              username: signupUsername || email.split('@')[0],
              avatar_url: 'creative',
              role: 'Developer',
              company: ''
            }
          }
        });
        if (error) throw error;
        setMessage("Account created! Please check your email for confirmation or proceed to login.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (err: any) {
      setMessage(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'var(--bg-overlay-modal)',
      backdropFilter: 'blur(16px) saturate(140%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 32,
        boxShadow: 'var(--shadow-modal)',
        position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="reset" style={{
          position: 'absolute', top: 20, right: 20,
          color: 'var(--fg-subtle)', cursor: 'pointer',
          background: 'none', border: 'none', outline: 'none'
        }}>
          <X size={16} />
        </button>

        <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px', color: 'white', letterSpacing: '-0.02em' }}>
          {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--fg-muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
          {isForgotPassword
            ? 'Enter your email address below to receive a secure password reset link.'
            : isSignUp
              ? 'Register display parameters and username to unlock your developer workspace.'
              : 'Sign in to access your Pro tools, history, and workspace settings.'
          }
        </p>

        {message && (
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: 'oklch(0.20 0.010 35 / 0.3)',
            border: '1px solid oklch(0.55 0.10 35 / 0.3)',
            color: 'oklch(0.85 0.12 35)',
            fontSize: 13, marginBottom: 20, lineHeight: 1.4
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--fg-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mono">Email Address</label>
            <input required type="email" placeholder="name@email.com" value={email} onChange={e => handleEmailChange(e.target.value)} style={{
              width: '100%', padding: '12px 14px', borderRadius: 8,
              background: 'oklch(0.12 0.004 250)', border: '1px solid var(--border)',
              color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box'
            }} />
          </div>

          {isSignUp && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--fg-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mono">Full Name</label>
                <input required type="text" placeholder="Satoshi Nakamoto" value={signupName} onChange={e => setSignupName(e.target.value)} style={{
                  width: '100%', padding: '12px 14px', borderRadius: 8,
                  background: 'oklch(0.12 0.004 250)', border: '1px solid var(--border)',
                  color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box'
                }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--fg-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mono">Username</label>
                <div style={{ display: 'flex', position: 'relative', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: 12, fontSize: 13, color: 'var(--fg-dim)' }}>@</span>
                  <input required type="text" placeholder="username" value={signupUsername} onChange={e => { setSignupUsername(e.target.value); setUsernameEdited(true); }} style={{
                    width: '100%', padding: '12px 14px 12px 26px', borderRadius: 8,
                    background: 'oklch(0.12 0.004 250)', border: '1px solid var(--border)',
                    color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box'
                  }} />
                </div>
              </div>
            </>
          )}

          {!isForgotPassword && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }} className="mono">Password</label>
                {!isSignUp && (
                  <button type="button" onClick={() => { setIsForgotPassword(true); setMessage(null); }} className="reset" style={{
                    fontSize: 11.5, color: 'var(--accent)', cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontWeight: 500
                  }}>
                    Forgot Password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input required type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{
                  width: '100%', padding: '12px 38px 12px 14px', borderRadius: 8,
                  background: 'oklch(0.12 0.004 250)', border: '1px solid var(--border)',
                  color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box'
                }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="reset" style={{
                  position: 'absolute', right: 12, background: 'none', border: 'none',
                  color: 'var(--fg-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  padding: 4, margin: 0, outline: 'none'
                }} title={showPassword ? "Hide Password" : "Show Password"}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              
              {isSignUp && password && (
                <div style={{ marginTop: 8 }} className="fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--fg-dim)' }}>Password Strength:</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: getPasswordStrength(password).color }}>
                      {getPasswordStrength(password).label}
                    </span>
                  </div>
                  <div style={{ height: 4, width: '100%', background: 'oklch(0.20 0.005 250)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: getPasswordStrength(password).width,
                      background: getPasswordStrength(password).color,
                      transition: 'width 0.25s, background-color 0.25s'
                    }} />
                  </div>
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className="reset" style={{
            width: '100%', marginTop: 12, padding: '12px', borderRadius: 8,
            background: 'linear-gradient(180deg, oklch(0.96 0.005 250), oklch(0.86 0.005 250))',
            color: 'oklch(0.16 0.008 250)', fontWeight: 600, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            {loading ? 'Processing...' : isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Register Account' : 'Sign In'} <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--fg-subtle)' }}>
          {isForgotPassword ? (
            <button onClick={() => { setIsForgotPassword(false); setMessage(null); }} className="reset" style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
              Back to Sign In
            </button>
          ) : (
            <>
              {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
              <button onClick={() => { setIsSignUp(!isSignUp); setMessage(null); isForgotPassword && setIsForgotPassword(false); }} className="reset" style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                {isSignUp ? 'Sign In' : 'Create One'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
