"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSaaS } from '../context/SaaSContext';
import { Icon, tint, tintFg, tintBorder } from '../components/LucideIcons';
import { CATEGORIES } from './config';

/* =========================================================================
   Landing nav — lighter than the app top bar; brand + marketing links + CTA
   ========================================================================= */

interface LandingNavProps {
  onLaunch: () => void;
  scrolled: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  brandName: string;
  setBrandName: (name: string) => void;
  sessionUser: any;
  isAnonUser: boolean;
  userPlan: string;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
}

function LandingNav({ onLaunch, scrolled, theme, onToggleTheme, brandName, setBrandName, sessionUser, isAnonUser, userPlan, onOpenAuthModal, onSignOut }: LandingNavProps) {
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <header className={`sticky top-0 z-30 h-16 flex items-center px-8 gap-[18px] transition-all duration-250 ${scrolled ? 'bg-bg-topbar border-b border-border backdrop-blur-md saturate-[1.4]' : 'bg-transparent border-b border-transparent backdrop-blur-none'}`}>
      {/* Brand Logo */}
      <div className="flex items-center gap-2.5 text-inherit no-underline">
        {isEditingBrand ? (
          <>
            <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-[oklch(0.70_0.18_265)] to-[oklch(0.62_0.20_305)] flex items-center justify-center shadow-[0_0_0_1px_rgba(128,64,200,0.5),0_4px_14px_rgba(128,64,200,0.4)]">
              <Icon.Command size={16} strokeWidth={2.2} className="text-white" />
            </div>
            <input
              type="text"
              autoFocus
              value={brandName}
              onClick={e => e.stopPropagation()}
              onBlur={() => setIsEditingBrand(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingBrand(false);
                }
              }}
              onChange={(e) => {
                const newVal = e.target.value;
                setBrandName(newVal);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('brandName', newVal);
                }
              }}
              className="bg-transparent border-none text-fg font-sans text-base font-semibold tracking-[-0.02em] outline-none cursor-text p-0 m-0"
              style={{
                width: `${Math.max(brandName.length, 1)}ch`,
              }}
              title="Enter new brand name and click away"
            />
          </>
        ) : (
          <Link 
            href="/" 
            onClick={(e) => { 
              e.preventDefault(); 
              onLaunch(); 
            }} 
            className="flex items-center text-inherit no-underline gap-2.5"
            title="Return to Home Screen"
          >
            <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-[oklch(0.70_0.18_265)] to-[oklch(0.62_0.20_305)] flex items-center justify-center shadow-[0_0_0_1px_rgba(128,64,200,0.5),0_4px_14px_rgba(128,64,200,0.4)] cursor-pointer">
              <Icon.Command size={16} strokeWidth={2.2} className="text-white" />
            </div>
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsEditingBrand(true);
              }}
              className="text-fg text-base font-semibold tracking-[-0.02em] cursor-pointer select-none"
              title="Double-click to rename SaaS"
            >
              {brandName}
            </span>
          </Link>
        )}
      </div>

      <nav className="flex gap-0.5 ml-6 landing-nav-links">
        {[
          { label: 'Tools', path: '/dashboard' },
          { label: 'Pricing', path: '/pricing' },
          { label: 'Changelog', path: '/changelog' },
          { label: 'Docs', path: '/docs' },
          { label: 'APIs', path: '/api' },
        ].map(item => (
          <Link key={item.label} href={item.path} className="top-link text-[13px] text-fg-muted py-[7px] px-3 rounded-md no-underline cursor-pointer transition-colors duration-150 hover:bg-bg-hover hover:text-fg">{item.label}</Link>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Auth State (Same as TopBar) */}
      {sessionUser && !isAnonUser ? (
        <div className="flex items-center gap-2.5 mr-2">
          {(() => {
            const userDisplayName = sessionUser.user_metadata?.name || sessionUser.user_metadata?.username || sessionUser.email.split('@')[0];
            return (
              <Link href="/account" className="top-link text-[12.5px] text-fg inline-flex items-center gap-1.5 bg-bg-elev-1 border border-border py-1.25 px-3 rounded-full no-underline transition-colors duration-150 hover:bg-bg-hover">
                <span className={`w-1.5 h-1.5 rounded-full ${userPlan === 'pro' ? 'bg-pro' : 'bg-[oklch(0.70_0.16_145)]'}`} />
                <span>Account ({userDisplayName})</span>
                {userPlan === 'pro' && <span className="mono text-[9px] bg-pro text-black py-0.25 px-1 rounded font-bold">PRO</span>}
              </Link>
            );
          })()}
          <button onClick={onSignOut} className="top-link text-[13px] text-fg-muted cursor-pointer bg-none border-none hover:text-fg">Sign Out</button>
        </div>
      ) : (
        <button onClick={onOpenAuthModal} className="top-link text-[13px] text-accent font-semibold py-2 px-3 rounded-[7px] cursor-pointer mr-2 hover:bg-bg-hover transition-colors duration-150">Sign In / Up</button>
      )}

      {/* Theme Toggle Switch */}
      <button onClick={onToggleTheme} className="theme-toggle-btn inline-flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer text-[13px] text-fg-muted bg-bg-elev-1 border border-border transition-all duration-150 hover:bg-bg-hover hover:text-fg hover:scale-[1.03] active:scale-[0.97]" title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
        {theme === 'dark' ? <Icon.Sun size={15} /> : <Icon.Moon size={15} />}
      </button>

      {/* Mobile Menu Toggle Button for LandingNav */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className={`mobile-menu-btn items-center justify-center w-8 h-8 rounded-lg cursor-pointer border border-border text-fg transition-all duration-200 ${mobileMenuOpen ? 'bg-bg-hover' : 'bg-bg-elev-1'}`}
        title="Toggle Menu"
      >
        {mobileMenuOpen ? <Icon.X size={15} /> : <Icon.Menu size={15} />}
      </button>

      {/* Mobile Menu Panel for LandingNav */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-[oklch(0.145_0_0_/_0.95)] backdrop-blur-md saturate-[1.4] border-b border-border p-[16px_20px] flex flex-col gap-3 z-40 shadow-[0_20px_40px_rgba(0,0,0,0.5)] animate-[slideDownMenu_0.2s_cubic-bezier(0.16,1,0.3,1)]">
          <style>{`
            @keyframes slideDownMenu {
              from { transform: translateY(-10px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-fg-dim font-semibold uppercase tracking-wider mb-1 mono">Navigation</span>
            <Link 
              href="/dashboard" 
              onClick={(e) => {
                e.preventDefault();
                onLaunch();
                setMobileMenuOpen(false);
              }}
              className="text-sm text-fg p-2.5 rounded-lg no-underline bg-bg-elev-1 border border-border transition-colors hover:bg-bg-hover"
            >
              Launch App
            </Link>
            <Link 
              href="/pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-fg p-2.5 rounded-lg no-underline bg-bg-elev-1 border border-border mt-2 transition-colors hover:bg-bg-hover"
            >
              Pricing
            </Link>
            <Link 
              href="/changelog" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-fg p-2.5 rounded-lg no-underline bg-bg-elev-1 border border-border mt-2 transition-colors hover:bg-bg-hover"
            >
              Changelog
            </Link>
            <Link 
              href="/docs" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-fg p-2.5 rounded-lg no-underline bg-bg-elev-1 border border-border mt-2 transition-colors hover:bg-bg-hover"
            >
              Docs
            </Link>
            <Link 
              href="/api" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-fg p-2.5 rounded-lg no-underline bg-bg-elev-1 border border-border mt-2 transition-colors hover:bg-bg-hover"
            >
              APIs
            </Link>
          </div>

          <div className="h-[1px] bg-border my-1" />

          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-fg-dim font-semibold uppercase tracking-wider mb-1 mono">Account Workspace</span>
            
            {sessionUser && !isAnonUser ? (
              <>
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-bg-elev-1 border border-border">
                  <span className={`w-2 h-2 rounded-full ${userPlan === 'pro' ? 'bg-pro' : 'bg-[oklch(0.70_0.16_145)]'}`} />
                  <div className="flex flex-col">
                    <span className="text-[13.5px] font-medium text-white">
                      {sessionUser.user_metadata?.name || sessionUser.user_metadata?.username || sessionUser.email.split('@')[0]}
                    </span>
                    <span className="text-[11px] text-fg-muted">
                      Active Plan: <span className="mono font-bold" style={{ color: userPlan === 'pro' ? 'var(--pro)' : 'oklch(0.70 0.16 145)' }}>{userPlan.toUpperCase()}</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2.5 mt-1">
                  <Link 
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 p-2.5 text-center bg-bg-elev-2 border border-border rounded-lg text-white font-medium text-sm no-underline transition-colors hover:bg-bg-hover"
                  >
                    Account Settings
                  </Link>
                  <button 
                    onClick={() => {
                      onSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="p-2.5 bg-[oklch(0.60_0.15_20_/_0.1)] border border-[oklch(0.60_0.15_20_/_0.3)] rounded-lg text-[oklch(0.75_0.15_20)] font-medium text-sm cursor-pointer transition-colors hover:bg-[oklch(0.60_0.15_20_/_0.2)]"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <button 
                onClick={() => {
                  onOpenAuthModal();
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 bg-gradient-to-b from-[oklch(0.72_0.18_265)] to-[oklch(0.62_0.20_305)] border-none rounded-lg text-white font-semibold text-[13.5px] cursor-pointer shadow-[0_4px_12px_rgba(128,64,200,0.2)] hover:brightness-[1.15] transition-all"
              >
                Sign In / Up
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/* =========================================================================
   Live AI Formatter demo (unused but preserved for safety)
   ========================================================================= */

function HeroDemo() {
  const [tab, setTab] = useState('modern');
  const themes = [
    { id: 'modern',     label: 'Modern',     font: 'Inter, sans-serif',         serifTitle: false },
    { id: 'academic',   label: 'Academic',   font: '"Source Serif Pro", Georgia, serif', serifTitle: true },
    { id: 'minimalist', label: 'Minimalist', font: '"JetBrains Mono", monospace', serifTitle: false },
  ];
  const t = themes.find(x => x.id === tab)!;

  return (
    <div className="rounded-2xl overflow-hidden bg-[oklch(0.175_0.008_250_/_0.7)] border border-border shadow-[0_32px_100px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
      {/* Window chrome */}
      <div className="flex items-center gap-2.5 p-[12px_16px] border-b border-border bg-[oklch(0.19_0.008_250_/_0.7)]">
        <div className="flex gap-1.25">
          <span className="w-[11px] h-[11px] rounded-full opacity-60 bg-[oklch(0.62_0.18_25)]" />
          <span className="w-[11px] h-[11px] rounded-full opacity-60 bg-[oklch(0.78_0.16_90)]" />
          <span className="w-[11px] h-[11px] rounded-full opacity-60 bg-[oklch(0.70_0.16_145)]" />
        </div>
        <span className="mono text-[11px] text-fg-dim ml-1.5">
          mysaas / universal-ai-formatter <span className="text-fg-subtle">· live</span>
        </span>
        <div className="flex-1" />
        <span className="text-[10.5px] py-0.5 px-2 rounded-full bg-[oklch(0.30_0.12_145_/_0.35)] text-[oklch(0.85_0.14_145)] border border-[oklch(0.45_0.10_145_/_0.4)] flex items-center gap-1.25 font-medium">
          <span className="w-1.25 h-1.25 rounded-full bg-[oklch(0.78_0.16_145)] shadow-[0_0_6px_oklch(0.78_0.16_145)]" />
          rendering
        </span>
      </div>

      {/* Split */}
      <div className="grid grid-cols-2 min-h-[340px] demo-split">
        {/* Input */}
        <div className="p-[18px_20px] border-r border-border font-mono text-[11.5px] leading-[1.65] text-fg-muted bg-[oklch(0.155_0.006_250_/_0.55)] relative">
          <div className="text-[10px] text-fg-dim tracking-widest uppercase mb-3">
            input · markdown
          </div>
          <pre className="m-0 whitespace-pre-wrap break-all">
            <span className="text-[oklch(0.75_0.14_265)]"># </span>
            <span className="text-fg">Context Switching: The Hidden Tax</span>{'\n\n'}
            Engineers report losing <span className="text-[oklch(0.80_0.14_90)]">**23 minutes**</span> on average to recover focus after a single interruption. Teams that batch communication into 2-3 windows per day ship features 31% faster.{'\n\n'}
            <span className="text-[oklch(0.75_0.14_265)]">## </span>
            <span className="text-fg">Three rules</span>{'\n\n'}
            <span className="text-[oklch(0.78_0.14_145)]">1.</span> Default chat to DND outside two review windows.{'\n'}
            <span className="text-[oklch(0.78_0.14_145)]">2.</span> Replace standups with async written updates.{'\n'}
            <span className="text-[oklch(0.78_0.14_145)]">3.</span> Reserve mornings for deep work only.{'\n\n'}
            <span className="text-[oklch(0.68_0.14_25)]">{'> '}</span>
            <span className="text-fg-muted italic">"The most expensive thing you can give an engineer is a 15-minute meeting."</span>
          </pre>
        </div>

        {/* Output */}
        <div 
          className="p-5.5 bg-[oklch(0.97_0.005_250)] text-[oklch(0.18_0.008_250)] text-[11px] leading-[1.6] relative"
          style={{ fontFamily: t.font }}
        >
          <div 
            className={`mb-1.5 ${t.id === 'minimalist' ? 'text-[13px] tracking-tight' : 'text-[17px] tracking-[-0.018em]'} ${t.serifTitle ? 'font-serif font-bold' : 'font-semibold'}`}
            style={{ fontFamily: t.serifTitle ? '"Source Serif Pro", Georgia, serif' : 'inherit' }}
          >
            Context Switching: The Hidden Tax
          </div>
          <div className={`text-[8.5px] text-[oklch(0.50_0.005_250)] mb-3 tracking-wider ${t.id === 'academic' ? 'normal-case' : 'uppercase'}`}>
            {t.id === 'academic' ? 'Submitted · May 2026' : `${t.label} theme · 2 pages`}
          </div>
          <div className={`bg-[oklch(0.88_0.005_250)] mb-2.5 ${t.id === 'minimalist' ? 'h-0' : 'h-[1px]'}`} />
          <p className="m-0 mb-2">
            Engineers report losing <b>23 minutes</b> on average to recover focus after a single interruption. Teams that batch communication into 2-3 windows per day ship features 31% faster.
          </p>
          <div className={`font-semibold mt-3 mb-1.5 ${t.id === 'minimalist' ? 'text-[11px]' : 'text-xs'}`}>
            {t.id === 'academic' ? '1. Three rules' : 'Three rules'}
          </div>
          <ol className="m-0 pl-4">
            <li>Default chat to DND outside two review windows.</li>
            <li>Replace standups with async written updates.</li>
            <li>Reserve mornings for deep work only.</li>
          </ol>
          <blockquote 
            className={`mt-3 pl-2.5 text-[oklch(0.35_0.008_250)] text-[10px] ${t.id === 'minimalist' ? 'border-l border-[oklch(0.40_0.005_250)] not-italic' : 'border-l-2 border-[oklch(0.62_0.18_265)] italic'}`}
          >
            "The most expensive thing you can give an engineer is a 15-minute meeting."
          </blockquote>
        </div>
      </div>

      {/* Theme switcher */}
      <div className="flex items-center gap-2 p-[12px_16px] border-t border-border bg-[oklch(0.16_0.006_250_/_0.6)]">
        <span className="text-[11px] text-fg-dim tracking-wider uppercase">Theme</span>
        {themes.map(th => (
          <button 
            key={th.id} 
            onClick={() => setTab(th.id)} 
            className={`py-1 px-2.5 text-[11.5px] font-medium rounded-md cursor-pointer border transition-colors ${tab === th.id ? 'bg-[oklch(0.30_0.05_265_/_0.5)] text-[oklch(0.92_0.04_265)] border-[oklch(0.45_0.08_265_/_0.4)]' : 'bg-transparent text-fg-muted border-transparent hover:text-fg hover:bg-bg-hover'}`}
          >
            {th.label}
          </button>
        ))}
        <div className="flex-1" />
        <span className="mono text-[10.5px] text-fg-dim">
          .pdf · 184 KB · 2 pages
        </span>
      </div>
    </div>
  );
}

const dot = (color: string) => ({
  width: 11, height: 11, borderRadius: '50%',
  background: color, opacity: 0.6,
});

/* =========================================================================
   Editorial hero
   ========================================================================= */

interface LandingHeroProps {
  onLaunch: () => void;
}

function LandingHero({ onLaunch }: LandingHeroProps) {
  return (
    <section className="landing-hero relative py-[88px] px-8 max-w-[1200px] mx-auto w-full text-center">
      {/* Eyebrow */}
      <div className="inline-flex items-center gap-2 p-[6px_14px_6px_8px] rounded-full bg-[oklch(0.22_0.04_265_/_0.45)] border border-[oklch(0.40_0.08_265_/_0.4)] text-xs font-medium text-[oklch(0.88_0.08_265)] mb-8 backdrop-blur-md">
        <span className="w-5 h-5 rounded-[6px] bg-gradient-to-br from-[oklch(0.70_0.18_265)] to-[oklch(0.62_0.20_305)] inline-flex items-center justify-center">
          <Icon.Sparkles size={11} strokeWidth={2.2} style={{ color: 'white' }} />
        </span>
        <span>One workspace · now in public beta</span>
      </div>

      {/* Headline — display sans + serif italic accent */}
      <h1 className="m-0 text-[clamp(48px,8vw,96px)] leading-[0.98] tracking-[-0.04em] font-semibold text-fg text-balance">
        Every annoying<br />
        file,{' '}
        <span className="font-serif italic font-normal tracking-[-0.025em] bg-gradient-to-r from-[oklch(0.92_0.04_265)] via-[oklch(0.78_0.16_285)] to-[oklch(0.82_0.14_200)] bg-clip-text text-transparent bg-[size:200%_100%] animate-gradient-shift">
          solved.
        </span>
      </h1>

      <p className="mt-7 mx-auto mb-0 max-w-[620px] text-[clamp(16px,1.8vw,19px)] leading-[1.5] text-fg-muted text-pretty">
        The small utilities you keep googling — formatters, converters, OCR, redactors, diff checkers — in one keyboard-driven workspace. Built for the people who hit <kbd className="kbd-inline">⌘K</kbd> a hundred times a day.
      </p>

      <div className="flex gap-3 mt-9 justify-center flex-wrap">
        <button 
          onClick={onLaunch} 
          className="inline-flex items-center gap-2 py-3.5 px-5.5 bg-gradient-to-b from-[oklch(0.97_0.005_250)] to-[oklch(0.86_0.005_250)] text-[oklch(0.14_0.008_250)] font-medium text-[15px] rounded-[11px] cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_14px_rgba(0,0,0,0.4),0_0_0_1px_rgba(0,0,0,0.5)] tracking-[-0.005em] transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
        >
          Launch app <Icon.ArrowRight size={15} strokeWidth={2.2}/>
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
            window.history.pushState(null, '', '#pricing');
          }} 
          className="inline-flex items-center gap-1.75 py-3.5 px-4.5 bg-[oklch(0.20_0.008_250_/_0.5)] border border-border text-fg font-medium text-[15px] rounded-[11px] cursor-pointer backdrop-blur-md transition-all hover:bg-bg-hover active:scale-[0.98]"
        >
          See pricing
        </button>
      </div>

      <div className="flex items-center gap-5.5 mt-9 justify-center text-xs text-fg-dim flex-wrap">
        <span className="flex items-center gap-1.5">
          <Icon.Check size={12} style={{ color: 'oklch(0.78 0.16 145)' }} /> Runs in-browser, on-device
        </span>
        <span className="flex items-center gap-1.5">
          <Icon.Check size={12} style={{ color: 'oklch(0.78 0.16 145)' }} /> Zero data leaves your machine
        </span>
        <span className="flex items-center gap-1.5">
          <Icon.Check size={12} style={{ color: 'oklch(0.78 0.16 145)' }} /> Free forever tier
        </span>
      </div>
    </section>
  );
}

/* =========================================================================
   "Browse the suite" — compact tool grid preview
   ========================================================================= */

interface SuitePreviewProps {
  onLaunch: () => void;
}

function SuitePreview({ onLaunch }: SuitePreviewProps) {
  return (
    <section id="tools" className="max-w-[1200px] mx-auto py-24 px-8 pb-16">
      <div className="text-center mb-12">
        <div className="inline-block text-[11px] font-semibold text-[oklch(0.78_0.12_265)] tracking-[0.18em] uppercase mb-[18px]">The suite</div>
        <h2 className="m-0 text-[clamp(34px,5vw,52px)] leading-[1.05] tracking-[-0.03em] font-semibold text-pretty">
          Every utility you need.<br/>
          <span className="font-serif italic font-normal tracking-[-0.025em] bg-gradient-to-r from-[oklch(0.92_0.04_265)] via-[oklch(0.78_0.16_285)] to-[oklch(0.82_0.14_200)] bg-clip-text text-transparent bg-[size:200%_100%] animate-gradient-shift">
            One keyboard shortcut.
          </span>
        </h2>
        <p className="mt-5 mx-auto mb-0 max-w-[560px] text-base text-fg-muted leading-[1.5] text-pretty">
          Each utility is its own focused workbench, but they all share the same launcher, history, and exports.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        {CATEGORIES.map(cat => (
          <div 
            key={cat.id} 
            className="p-5.5 border rounded-[14px] relative overflow-hidden flex flex-col gap-3 transition-all duration-300 hover:-translate-y-0.5 suite-card"
            style={{
              background: cat.pro
                ? `linear-gradient(180deg, ${tint(cat.hue, 0.30, 0.08, 0.15)}, ${tint(cat.hue, 0.20, 0.04, 0.05)})`
                : 'oklch(0.175 0.008 250 / 0.6)',
              borderColor: cat.pro ? tintBorder(cat.hue) : 'var(--border)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = tintBorder(cat.hue); }}
            onMouseLeave={e => { if (!cat.pro) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {/* Category header link */}
            <Link href={`/category/${cat.id}`} className="no-underline text-inherit block">
              <div className="flex items-center gap-2 mb-3">
                <span 
                  className="w-1.75 h-1.75 rounded-full shrink-0"
                  style={{
                    background: tintFg(cat.hue),
                    boxShadow: `0 0 10px ${tintFg(cat.hue)}`,
                  }} 
                />
                <span 
                  className="text-[11px] font-semibold tracking-wider uppercase"
                  style={{ color: cat.pro ? tintFg(cat.hue) : 'var(--fg-dim)' }}
                >
                  {cat.label}
                </span>
                <div className="flex-1" />
              </div>
              <div className="text-[17px] font-semibold text-fg tracking-[-0.015em] mb-2 leading-[1.25] text-pretty">
                {cat.tagline}
              </div>
            </Link>

            {/* Crawlable list of individual tools */}
            <ul className="m-0 p-0 list-none flex flex-col gap-1">
              {cat.tools.slice(0, 4).map(t => {
                const Ico = Icon[t.icon] || Icon.Sparkles;
                return (
                  <li key={t.id}>
                    <Link 
                      href={`/tools/${t.id}`} 
                      className="flex items-center gap-2 py-1.25 text-[12.5px] no-underline transition-colors duration-150"
                      style={{ color: 'var(--fg-muted)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = tintFg(cat.hue); }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-muted)'; }}
                    >
                      <Ico size={11} strokeWidth={1.8} className="text-fg-subtle shrink-0" />
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">{t.name}</span>
                    </Link>
                  </li>
                );
              })}
              {cat.tools.length > 4 && (
                <li className="mt-1">
                  <Link 
                    href={`/category/${cat.id}`} 
                    className="text-[11px] text-fg-subtle flex items-center gap-1.25 no-underline hover:text-fg transition-colors"
                  >
                    <span>and more</span>
                    <Icon.ArrowRight size={10} />
                  </Link>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================================================================
   Pricing
   ========================================================================= */

interface PricingProps {
  onLaunch: () => void;
  onEnterprise: () => void;
  brandName: string;
  pricingData: any;
  onShowPaywall: () => void;
}

function Pricing({ onLaunch, onEnterprise, brandName, pricingData, onShowPaywall }: PricingProps) {
  return (
    <section id="pricing" className="max-w-[1080px] mx-auto py-24 px-8 pb-16">
      <div className="text-center mb-14">
        <div className="inline-block text-[11px] font-semibold text-[oklch(0.78_0.12_265)] tracking-[0.18em] uppercase mb-[18px]">Pricing</div>
        <h2 className="m-0 text-[clamp(34px,5vw,52px)] leading-[1.05] tracking-[-0.03em] font-semibold text-pretty">
          Free for everything small.<br/>
          <span className="font-serif italic font-normal tracking-[-0.025em] bg-gradient-to-r from-[oklch(0.92_0.04_265)] via-[oklch(0.78_0.16_285)] to-[oklch(0.82_0.14_200)] bg-clip-text text-transparent bg-[size:200%_100%] animate-gradient-shift">
            {pricingData.currency}{pricingData.monthly} a month for everything else.
          </span>
        </h2>
        <p className="mt-5 mx-auto mb-0 max-w-[560px] text-base text-fg-muted leading-[1.5] text-pretty">
          No seats, no per-tool gating, no trial timers. Dynamic plans tailored for your region.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch pricing-grid" aria-label="Pricing Tiers">
        {/* Free */}
        <article className="p-8 bg-[oklch(0.175_0.008_250_/_0.55)] border border-border rounded-2xl flex flex-col gap-5.5 hover:scale-[1.01] transition-all duration-200">
          <div>
            <div className="text-[11.5px] font-semibold text-fg-dim tracking-wider uppercase mb-3.5 mono">Free</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[48px] font-semibold tracking-[-0.03em]">$0</span>
              <span className="text-fg-subtle text-sm">forever</span>
            </div>
            <p className="m-0 mt-3 text-fg-muted text-sm leading-[1.5]">
              For occasional use and weekend projects.
            </p>
          </div>

          <ul className="m-0 p-0 list-none flex flex-col gap-1 flex-1">
            {[
              ['All standard tools', true],
              ['10 free API requests / day', true],
              ['Files up to 10 MB', true],
              ['Modern + Minimalist themes', true],
              ['Pro Vault tools', false],
              ['Branded exports', false],
              ['Batch processing', false],
            ].map(([f, on]) => <Feature key={f as string} on={on as boolean}>{f as string}</Feature>)}
          </ul>

          <button 
            onClick={onLaunch} 
            className="py-3 px-4.5 bg-[oklch(0.21_0.010_250)] border border-border text-fg font-medium text-sm rounded-lg cursor-pointer text-center block w-full hover:bg-bg-hover active:scale-[0.98] transition-all"
          >
            Start free →
          </button>
        </article>

        {/* Pro */}
        <article className="p-8 bg-gradient-to-b from-[oklch(0.21_0.04_265_/_0.6)] to-[oklch(0.18_0.03_265_/_0.4)] border border-[oklch(0.45_0.10_265_/_0.5)] rounded-2xl flex flex-col gap-5.5 relative shadow-[0_24px_80px_rgba(108,68,265,0.18),inset_0_1px_0_rgba(255,255,255,0.05)] hover:scale-[1.01] transition-all duration-200">
          <span className="absolute top-4 right-4 text-[10px] font-semibold tracking-wider py-1 px-2.5 rounded-full bg-gradient-to-br from-[oklch(0.70_0.18_265)] to-[oklch(0.62_0.20_305)] text-white uppercase">Most popular</span>

          <div>
            <div className="text-[11.5px] font-semibold text-[oklch(0.85_0.10_265)] tracking-wider uppercase mb-3.5 mono">Pro</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[48px] font-semibold tracking-[-0.03em]">{pricingData.currency}{pricingData.monthly}</span>
              <span className="text-fg-subtle text-sm">{pricingData.suffix}</span>
            </div>
            <p className="m-0 mt-3 text-fg-muted text-sm leading-[1.5]">
              For people who live in their tools.
            </p>
          </div>

          <ul className="m-0 p-0 list-none flex flex-col gap-1 flex-1">
            {[
              ['Everything in Free, plus:', true, true],
              ['All Pro Vault tools (Diff, Print PDF, Batch, History)', true],
              ['Unlimited documents & files', true],
              ['200 API requests / day', true],
              ['Files up to 2 GB', true],
              ['All themes incl. Academic', true],
              ['Branded exports (logo, colors, footer)', true],
              ['Batch process up to 500 files at once', true],
              ['Priority support · early features', true],
            ].map(([f, on, em]) => <Feature key={f as string} on={on as boolean} em={em as boolean}>{f as string}</Feature>)}
          </ul>

          <button 
            onClick={onShowPaywall} 
            className="py-3 px-4.5 bg-gradient-to-b from-[oklch(0.97_0.005_250)] to-[oklch(0.86_0.005_250)] text-[oklch(0.14_0.008_250)] font-medium text-sm rounded-lg cursor-pointer text-center block w-full shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_1px_3px_rgba(0,0,0,0.5)] hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Upgrade to Pro →
          </button>
        </article>

        {/* Developer API */}
        <article className="p-8 bg-[oklch(0.175_0.008_250_/_0.55)] border border-border rounded-2xl flex flex-col gap-5.5 hover:scale-[1.01] transition-all duration-200">
          <div>
            <div className="text-[11.5px] font-semibold text-[oklch(0.78_0.16_145)] tracking-wider uppercase mb-3.5 mono">Developer API</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[48px] font-semibold tracking-[-0.03em]">{pricingData.currency}29</span>
              <span className="text-fg-subtle text-sm">{pricingData.suffix}</span>
            </div>
            <p className="m-0 mt-3 text-fg-muted text-sm leading-[1.5]">
              For high-volume programmatic access.
            </p>
          </div>

          <ul className="m-0 p-0 list-none flex flex-col gap-1 flex-1">
            {[
              ['Everything in Pro Plan', true, true],
              ['2,000 API requests / day', true],
              ['Direct API keys console', true],
              ['Custom webhooks & callbacks', true],
              ['Priority compute resources', true],
            ].map(([f, on, em]) => <Feature key={f as string} on={on as boolean} em={em as boolean}>{f as string}</Feature>)}
          </ul>

          <button 
            onClick={onShowPaywall} 
            className="py-3 px-4.5 bg-bg-elev-2 border border-border text-fg font-medium text-sm rounded-lg cursor-pointer text-center block w-full hover:bg-bg-hover active:scale-[0.98] transition-all"
          >
            Get API Keys →
          </button>
        </article>
      </div>

      <p className="text-center mt-7 text-[12.5px] text-fg-dim">
        Need SOC2, SSO, or on-prem?{' '}
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onEnterprise(); }} 
          className="text-fg-muted underline decoration-border-strong hover:text-fg transition-colors duration-150"
        >
          Talk to us about Enterprise
        </a>.
      </p>
    </section>
  );
}

interface FeatureProps {
  children: React.ReactNode;
  on: boolean;
  em?: boolean;
}

function Feature({ children, on, em }: FeatureProps) {
  return (
    <li className={`flex items-start gap-2.5 py-1 text-[13.5px] ${on ? 'text-fg' : 'text-fg-dim'} ${em ? 'font-semibold' : 'font-normal'}`}>
      <span className={`w-[18px] h-[18px] rounded-full inline-flex items-center justify-center shrink-0 mt-0.5 ${on ? 'bg-[oklch(0.32_0.10_145_/_0.4)] text-[oklch(0.85_0.16_145)]' : 'bg-[oklch(0.22_0.010_250)] text-fg-dim'}`}>
        {on ? <Icon.Check size={11} strokeWidth={2.5}/> : <Icon.X size={10} strokeWidth={2.2}/>}
      </span>
      <span>{children}</span>
    </li>
  );
}

/* =========================================================================
   Closing CTA band
   ========================================================================= */

interface ClosingCTAProps {
  onLaunch: () => void;
  onBrowseTools: () => void;
}

function ClosingCTA({ onLaunch, onBrowseTools }: ClosingCTAProps) {
  return (
    <section className="py-24 px-8 max-w-[1200px] mx-auto w-full">
      <div className="relative py-[clamp(48px,7vw,88px)] px-10 rounded-3xl text-center overflow-hidden bg-gradient-to-b from-[oklch(0.20_0.04_265_/_0.55)] to-[oklch(0.16_0.02_265_/_0.35)] border border-[oklch(0.40_0.08_265_/_0.4)] shadow-[0_30px_100px_rgba(108,68,265,0.20),inset_0_1px_0_rgba(255,255,255,0.04)]">
        {/* Aurora layers */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ 
            background: 'radial-gradient(500px 250px at 20% 0%, oklch(0.55 0.18 265 / 0.35), transparent 60%), radial-gradient(500px 250px at 80% 100%, oklch(0.55 0.18 305 / 0.30), transparent 60%)' 
          }}
        />

        <div className="relative">
          <h2 className="m-0 text-[clamp(34px,5vw,56px)] leading-[1.02] tracking-[-0.03em] font-semibold text-balance text-fg">
            Stop googling tiny tools.{' '}
            <span className="font-serif italic font-normal tracking-[-0.025em] bg-gradient-to-r from-[oklch(0.92_0.04_265)] via-[oklch(0.78_0.16_285)] to-[oklch(0.82_0.14_200)] bg-clip-text text-transparent bg-[size:200%_100%] animate-gradient-shift">
              Start finishing.
            </span>
          </h2>
          <p className="mt-5 mx-auto mb-0 max-w-[540px] text-base text-fg-muted leading-[1.5]">
            Free forever for the basics. $9/mo when you outgrow it. Cancel any time, export everything.
          </p>
          <div className="flex gap-3 mt-8 justify-center flex-wrap">
            <button 
              onClick={onLaunch} 
              className="inline-flex items-center gap-2 py-3.5 px-5.5 bg-gradient-to-b from-[oklch(0.97_0.005_250)] to-[oklch(0.86_0.005_250)] text-[oklch(0.14_0.008_250)] font-medium text-[15px] rounded-[11px] cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_14px_rgba(0,0,0,0.4),0_0_0_1px_rgba(0,0,0,0.5)]"
            >
              Launch app <Icon.ArrowRight size={15} strokeWidth={2.2}/>
            </button>
            <button 
              onClick={onBrowseTools} 
              className="inline-flex items-center gap-1.75 py-3.5 px-4.5 bg-[oklch(0.20_0.008_250_/_0.5)] border border-border text-fg font-medium text-[15px] rounded-[11px] cursor-pointer transition-colors hover:bg-bg-hover active:scale-[0.98]"
            >
              Browse every tool
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   ApiShowcase component
   ========================================================================= */

function ApiShowcase({ onLaunch, brandName }: { onLaunch: () => void; brandName: string }) {
  const cleanBrandDomain = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const displayDomain = cleanBrandDomain ? `${cleanBrandDomain}.com` : 'mysaas.com';

  return (
    <section id="developer-api" className="max-w-[1100px] mx-auto py-[40px] px-8 pb-16 relative">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Info Column */}
        <div>
          <span className="mono text-[10.5px] font-semibold uppercase tracking-wider inline-block mb-4 py-1 px-2.5 rounded-full text-[oklch(0.78_0.16_195)] border border-[oklch(0.78_0.16_195_/_0.3)] bg-[oklch(0.18_0.010_195_/_0.1)]">⚡ Developer API Integration</span>
          <h2 className="m-0 text-3xl font-semibold leading-[1.15] mb-4 text-left">
            Integrate formatters<br/>
            <span className="font-serif italic font-normal tracking-[-0.025em] bg-gradient-to-r from-[oklch(0.92_0.04_265)] via-[oklch(0.78_0.16_285)] to-[oklch(0.82_0.14_200)] bg-clip-text text-transparent bg-[size:200%_100%] animate-gradient-shift">
              directly into your scripts.
            </span>
          </h2>
          <p className="text-[14.5px] text-fg-muted leading-[1.6] mb-6">
            Integrate {brandName}'s enterprise-grade JSON, text, and data parser engines directly into your applications, scripts, and workflows. Generate secure keys, test endpoints instantly, and scale.
          </p>
          <div className="flex gap-3">
            <Link 
              href="/account" 
              className="py-2.5 px-4.5 rounded-lg bg-gradient-to-b from-[oklch(0.72_0.18_195)] to-[oklch(0.62_0.20_195)] text-white font-semibold text-xs no-underline cursor-pointer shadow-[0_4px_12px_rgba(108,68,265,0.25)] inline-flex items-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <span>Get API Key</span>
              <Icon.ArrowRight size={13} strokeWidth={2.5} />
            </Link>
            <Link 
              href="/docs" 
              className="py-2.5 px-4.5 rounded-lg bg-bg-elev-1 border border-border text-fg font-medium text-xs no-underline cursor-pointer inline-flex items-center hover:bg-bg-hover active:scale-[0.98] transition-all"
            >
              Read Technical Docs
            </Link>
          </div>
        </div>

        {/* Preview Code Terminal Column */}
        <div className="glass-card p-6 bg-[#0e0f12] border border-[#1c1d22] flex flex-col">
          <div className="flex items-center gap-1.5 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
            <span className="flex-1" />
            <span className="mono text-[11px] text-fg-dim font-semibold">cURL REQUEST</span>
          </div>
          <pre className="mono m-0 p-0 overflow-x-auto text-[11.5px] text-[oklch(0.80_0.10_195)] leading-[1.5] whitespace-pre-wrap break-all">
{`curl -X POST https://api.${displayDomain}/v1/format \\
  -H "Authorization: Bearer ms_live_prod_active_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "ai-formatter",
    "content": "Messy transcription text here...",
    "style": "modern"
  }'`}
          </pre>
        </div>
      </div>
    </section>
  );
}



/* =========================================================================
   Main Entry Component
   ========================================================================= */

export default function LandingClient() {
  const {
    theme,
    toggleTheme,
    brandName,
    setBrandName,
    pricingData,
    sessionUser,
    isAnonUser,
    userPlan,
    setAuthOpen,
    handleSignOut,
    handleShowPaywall,
    launchApp,
    setLauncher,
    setEnterpriseOpen
  } = useSaaS();

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fade-in">
      <LandingNav 
        onLaunch={launchApp} 
        scrolled={scrolled} 
        theme={theme} 
        onToggleTheme={toggleTheme} 
        brandName={brandName} 
        setBrandName={setBrandName} 
        sessionUser={sessionUser} 
        isAnonUser={isAnonUser} 
        userPlan={userPlan} 
        onOpenAuthModal={() => setAuthOpen(true)} 
        onSignOut={handleSignOut} 
      />
      <LandingHero onLaunch={launchApp} />
      <SuitePreview onLaunch={launchApp} />
      <ApiShowcase onLaunch={launchApp} brandName={brandName} />
      <Pricing 
        onLaunch={launchApp} 
        onEnterprise={() => setEnterpriseOpen(true)} 
        brandName={brandName} 
        pricingData={pricingData} 
        onShowPaywall={() => handleShowPaywall('upgrade')} 
      />
      <ClosingCTA onLaunch={launchApp} onBrowseTools={() => setLauncher(true)} />
    </div>
  );
}
