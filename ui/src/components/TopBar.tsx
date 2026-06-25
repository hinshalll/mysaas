"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSaaS } from '../context/SaaSContext';
import { Command, Grid, ChevronDown, Search, Sun, Moon, X, Menu } from 'lucide-react';

export default function TopBar() {
  const pathname = usePathname();
  const {
    activeTool,
    theme,
    toggleTheme,
    setPalette,
    setLauncher,
    scrolled,
    brandName,
    setBrandName,
    sessionUser,
    isAnonUser,
    userPlan,
    setAuthOpen,
    handleSignOut,
    handleShowPaywall,
    openTool,
    goHome
  } = useSaaS();

  const isPremium = userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin';
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname === '/') return null;

  return (
    <header className={`sticky top-0 z-30 h-14 flex items-center px-5 gap-3.5 transition-all duration-250 ${scrolled ? 'bg-[var(--bg-topbar)] border-b border-[var(--border)] backdrop-blur-[20px] saturate-[140%]' : 'bg-transparent border-b border-transparent backdrop-blur-none'}`}>
      {/* Brand Logo */}
      <div className="flex items-center gap-2.5 text-inherit">
        {isEditingBrand ? (
          <>
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[oklch(0.70_0.18_265)] to-[oklch(0.62_0.20_305)] flex items-center justify-center shadow-[0_0_0_1px_oklch(0.50_0.10_280/0.5),_0_4px_14px_oklch(0.50_0.20_280/0.4)]">
              <Command size={14} strokeWidth={2.2} className="text-white" />
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
              onChange={(e) => setBrandName(e.target.value)}
              className="bg-transparent border-none text-[var(--fg)] font-inherit text-[15.5px] font-semibold tracking-[-0.018em] outline-none cursor-text p-0 m-0"
              style={{ width: `${Math.max(brandName.length, 1)}ch` }}
              title="Enter new brand name and click away"
            />
          </>
        ) : (
          <Link 
            href="/" 
            onClick={(e) => { 
              e.preventDefault(); 
              goHome(); 
            }} 
            className="flex items-center no-underline text-inherit gap-2.5"
            title="Return to Home Screen"
          >
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[oklch(0.70_0.18_265)] to-[oklch(0.62_0.20_305)] flex items-center justify-center shadow-[0_0_0_1px_oklch(0.50_0.10_280/0.5),_0_4px_14px_oklch(0.50_0.20_280/0.4)] cursor-pointer">
              <Command size={14} strokeWidth={2.2} className="text-white" />
            </div>
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsEditingBrand(true);
              }}
              className="text-[var(--fg)] text-[15.5px] font-semibold tracking-[-0.018em] cursor-pointer select-none"
              title="Double-click to rename SaaS"
            >
              {brandName}
            </span>
          </Link>
        )}
      </div>

      {/* Tools launcher pill */}
      <div className="flex-1 flex justify-center">
        <button onClick={() => setLauncher(true)} className="reset launcher-pill flex items-center gap-2 py-[7px] pr-[14px] pl-[12px] bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-full text-[13px] font-medium text-[var(--fg)] cursor-pointer backdrop-blur-md transition-all duration-150 hover:bg-[var(--bg-hover)]">
          <Grid size={13} strokeWidth={2} className="text-[var(--fg-muted)]" />
          <span>{activeTool ? activeTool.name : 'Browse all tools'}</span>
          <ChevronDown size={12} className="text-[var(--fg-subtle)]" />
        </button>
      </div>

      {/* Right cluster */}
      <button onClick={() => setPalette(true)} className="reset search-btn hidden md:flex items-center gap-2 py-[7px] pr-[10px] pl-[12px] bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-lg text-[12.5px] text-[var(--fg-muted)] cursor-pointer min-w-[180px]">
        <Search size={13} />
        <span className="flex-1 text-left">Search tools…</span>
        <kbd className="kbd">⌘K</kbd>
      </button>

      <Link href="/pricing" className="reset top-link hidden sm:block text-[13px] text-[var(--fg-muted)] px-2 py-1.5 rounded-md no-underline cursor-pointer hover:bg-[var(--bg-hover)]">Pricing</Link>
      <Link href="/docs" className="reset top-link hidden sm:block text-[13px] text-[var(--fg-muted)] px-2 py-1.5 rounded-md no-underline cursor-pointer hover:bg-[var(--bg-hover)]">Docs</Link>
      <Link href="/api" className="reset top-link hidden sm:block text-[13px] text-[var(--fg-muted)] px-2 py-1.5 rounded-md no-underline cursor-pointer hover:bg-[var(--bg-hover)]">APIs</Link>

      {/* Auth State */}
      {sessionUser && !isAnonUser ? (
        <div className="hidden sm:flex items-center gap-2.5">
          {(() => {
            const userDisplayName = sessionUser.user_metadata?.name || sessionUser.user_metadata?.username || sessionUser.email.split('@')[0];
            return (
              <button 
                onClick={() => openTool('account')} 
                className="reset top-link inline-flex items-center gap-1.5 bg-[var(--bg-elev-1)] border border-[var(--border)] px-3 py-1.5 rounded-full text-[12px] font-medium text-[var(--fg)] hover:bg-[var(--bg-hover)]"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${userPlan === 'pro' ? 'bg-[var(--pro)]' : 'bg-[oklch(0.70_0.16_145)]'}`} />
                <span>Account ({userDisplayName})</span>
                {userPlan === 'pro' && <span className="mono text-[9px] bg-[var(--pro)] text-black px-1 py-0.5 rounded-[4px] font-bold">PRO</span>}
              </button>
            );
          })()}
          <button onClick={handleSignOut} className="reset top-link text-[13px] text-[var(--fg-muted)] px-2 py-1.5 rounded-md cursor-pointer hover:bg-[var(--bg-hover)]">Sign Out</button>
        </div>
      ) : (
        <button onClick={() => setAuthOpen(true)} className="reset top-link hidden sm:block text-[13px] text-[var(--accent)] font-semibold px-2 py-1.5 rounded-md cursor-pointer hover:bg-[var(--accent)/0.1]">Sign In / Up</button>
      )}

      {!isPremium && (
        <button onClick={() => handleShowPaywall('upgrade')} className="reset main-upgrade-btn hidden sm:block px-3 py-1.5 bg-gradient-to-br from-[oklch(0.70_0.18_265)] to-[oklch(0.62_0.20_305)] text-white font-semibold text-[12px] rounded-lg cursor-pointer border-none shadow-[0_4px_12px_oklch(0.50_0.20_280/0.3)] hover:brightness-110">
          Upgrade
        </button>
      )}

      {/* Theme Toggle Switch */}
      <button onClick={toggleTheme} className="reset theme-toggle-btn inline-flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer text-[13px] text-[var(--fg-muted)] bg-[var(--bg-elev-1)] border border-[var(--border)] transition-all duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--fg)]" title="Switch to theme">
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Mobile Menu Toggle Button */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className={`reset mobile-menu-btn sm:hidden flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer border border-[var(--border)] text-[var(--fg)] transition-all duration-200 ${mobileMenuOpen ? 'bg-[var(--bg-hover)]' : 'bg-[var(--bg-elev-1)]'}`}
        title="Toggle Menu"
      >
        {mobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
      </button>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-[oklch(0.145_0_0/0.95)] backdrop-blur-[20px] saturate-[140%] border-b border-[var(--border)] px-5 py-4 flex flex-col gap-3 z-40 shadow-[0_20px_40px_oklch(0_0_0/0.5)] animate-[slideDownMenu_0.2s_cubic-bezier(0.16,1,0.3,1)] sm:hidden">
          <style>{`
            @keyframes slideDownMenu {
              from { transform: translateY(-10px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-[var(--fg-dim)] font-semibold uppercase tracking-[0.05em] mb-1 mono">Navigation</span>
            <Link 
              href="/pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-[14px] text-[var(--fg)] px-3 py-2.5 rounded-lg no-underline bg-[var(--bg-elev-1)] border border-[var(--border)]"
            >
              Pricing
            </Link>
            <Link 
              href="/docs" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-[14px] text-[var(--fg)] px-3 py-2.5 rounded-lg no-underline bg-[var(--bg-elev-1)] border border-[var(--border)] mt-2"
            >
              Docs
            </Link>
            <Link 
              href="/api" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-[14px] text-[var(--fg)] px-3 py-2.5 rounded-lg no-underline bg-[var(--bg-elev-1)] border border-[var(--border)] mt-2"
            >
              APIs
            </Link>
          </div>

          <div className="h-px bg-[var(--border)] my-1" />

          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-[var(--fg-dim)] font-semibold uppercase tracking-[0.05em] mb-1 mono">Account Workspace</span>
            
            {sessionUser && !isAnonUser ? (
              <>
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[var(--bg-elev-1)] border border-[var(--border)]">
                  <span className={`w-2 h-2 rounded-full ${userPlan === 'pro' ? 'bg-[var(--pro)]' : 'bg-[oklch(0.70_0.16_145)]'}`} />
                  <div className="flex flex-col">
                    <span className="text-[13.5px] font-medium text-white">
                      {sessionUser.user_metadata?.name || sessionUser.user_metadata?.username || sessionUser.email.split('@')[0]}
                    </span>
                    <span className="text-[11px] text-[var(--fg-muted)]">
                      Active Plan: <span className="mono font-bold" style={{ color: userPlan === 'pro' ? 'var(--pro)' : 'oklch(0.70_0.16_145)' }}>{userPlan.toUpperCase()}</span>
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    openTool('account');
                    setMobileMenuOpen(false);
                  }}
                  className="reset text-center p-2.5 rounded-lg bg-[var(--bg-elev-2)] border border-[var(--border)] text-[13px] font-medium cursor-pointer"
                >
                  Manage Account Settings
                </button>
                <button 
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="reset text-center p-2.5 rounded-lg text-[oklch(0.65_0.16_20)] bg-[oklch(0.65_0.16_20/0.1)] border border-[oklch(0.65_0.16_20/0.2)] text-[13px] font-medium cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button 
                onClick={() => {
                  setAuthOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="reset text-center p-2.5 rounded-lg bg-gradient-to-br from-[oklch(0.70_0.18_265)] to-[oklch(0.62_0.20_305)] text-white text-[13px] font-semibold cursor-pointer"
              >
                Sign In / Sign Up
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
