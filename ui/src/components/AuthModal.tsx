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
    <div className="fixed inset-0 z-[1000] bg-[var(--bg-overlay-modal)] backdrop-blur-[16px] saturate-[140%] flex items-center justify-center p-5" onClick={onClose}>
      <div className="w-full max-w-[400px] bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-2xl p-8 shadow-[var(--shadow-modal)] relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="reset absolute top-5 right-5 text-[var(--fg-subtle)] cursor-pointer bg-none border-none outline-none hover:text-[var(--fg)] transition-colors">
          <X size={16} />
        </button>

        <h2 className="text-[22px] font-semibold m-0 mb-2 text-white tracking-[-0.02em]">
          {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-[13px] text-[var(--fg-muted)] m-0 mb-6 leading-relaxed">
          {isForgotPassword
            ? 'Enter your email address below to receive a secure password reset link.'
            : isSignUp
              ? 'Register display parameters and username to unlock your developer workspace.'
              : 'Sign in to access your Pro tools, history, and workspace settings.'
          }
        </p>

        {message && (
          <div className="px-3.5 py-2.5 rounded-lg bg-[oklch(0.20_0.010_35/0.3)] border border-[oklch(0.55_0.10_35/0.3)] text-[oklch(0.85_0.12_35)] text-[13px] mb-5 leading-snug">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--fg-dim)] mb-1.5 uppercase tracking-[0.04em] mono">Email Address</label>
            <input required type="email" placeholder="name@email.com" value={email} onChange={e => handleEmailChange(e.target.value)} className="w-full px-3.5 py-3 rounded-lg bg-[oklch(0.12_0.004_250)] border border-[var(--border)] text-white text-[14px] outline-none box-border focus:border-[var(--accent)] transition-colors" />
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--fg-dim)] mb-1.5 uppercase tracking-[0.04em] mono">Full Name</label>
                <input required type="text" placeholder="Satoshi Nakamoto" value={signupName} onChange={e => setSignupName(e.target.value)} className="w-full px-3.5 py-3 rounded-lg bg-[oklch(0.12_0.004_250)] border border-[var(--border)] text-white text-[14px] outline-none box-border focus:border-[var(--accent)] transition-colors" />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--fg-dim)] mb-1.5 uppercase tracking-[0.04em] mono">Username</label>
                <div className="flex relative items-center">
                  <span className="absolute left-3 text-[13px] text-[var(--fg-dim)]">@</span>
                  <input required type="text" placeholder="username" value={signupUsername} onChange={e => { setSignupUsername(e.target.value); setUsernameEdited(true); }} className="w-full py-3 pr-3.5 pl-[26px] rounded-lg bg-[oklch(0.12_0.004_250)] border border-[var(--border)] text-white text-[14px] outline-none box-border focus:border-[var(--accent)] transition-colors" />
                </div>
              </div>
            </>
          )}

          {!isForgotPassword && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-semibold text-[var(--fg-dim)] uppercase tracking-[0.04em] m-0 mono">Password</label>
                {!isSignUp && (
                  <button type="button" onClick={() => { setIsForgotPassword(true); setMessage(null); }} className="reset text-[11.5px] text-[var(--accent)] cursor-pointer bg-none border-none p-0 font-medium hover:underline">
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <input required type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full py-3 pr-[38px] pl-3.5 rounded-lg bg-[oklch(0.12_0.004_250)] border border-[var(--border)] text-white text-[14px] outline-none box-border focus:border-[var(--accent)] transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="reset absolute right-3 bg-none border-none text-[var(--fg-dim)] cursor-pointer flex items-center p-1 m-0 outline-none hover:text-[var(--fg)] transition-colors" title={showPassword ? "Hide Password" : "Show Password"}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              
              {isSignUp && password && (
                <div className="mt-2 animate-[fadeIn_0.2s_ease-out]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-[var(--fg-dim)]">Password Strength:</span>
                    <span className="text-[10px] font-semibold" style={{ color: getPasswordStrength(password).color }}>
                      {getPasswordStrength(password).label}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-[oklch(0.20_0.005_250)] rounded-[2px] overflow-hidden">
                    <div className="h-full transition-all duration-250 ease-out" style={{
                      width: getPasswordStrength(password).width,
                      backgroundColor: getPasswordStrength(password).color,
                    }} />
                  </div>
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className="reset w-full mt-3 p-3 rounded-lg bg-gradient-to-b from-[oklch(0.96_0.005_250)] to-[oklch(0.86_0.005_250)] text-[oklch(0.16_0.008_250)] font-semibold text-[14px] flex items-center justify-center gap-2 border-none hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[0_2px_10px_oklch(0.86_0.005_250/0.2)]">
            {loading ? 'Processing...' : isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Register Account' : 'Sign In'} <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </form>

        <div className="mt-6 text-center text-[13px] text-[var(--fg-subtle)]">
          {isForgotPassword ? (
            <button onClick={() => { setIsForgotPassword(false); setMessage(null); }} className="reset text-[var(--accent)] font-semibold cursor-pointer hover:underline bg-none border-none p-0">
              Back to Sign In
            </button>
          ) : (
            <>
              {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
              <button onClick={() => { setIsSignUp(!isSignUp); setMessage(null); isForgotPassword && setIsForgotPassword(false); }} className="reset text-[var(--accent)] font-semibold cursor-pointer hover:underline bg-none border-none p-0">
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
