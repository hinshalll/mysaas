"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSaaS } from '../context/SaaSContext';
import { Command, Grid, ChevronDown, Search, Sun, Moon, X, Menu } from 'lucide-react';

const topLink = {
  fontSize: 13,
  color: 'var(--fg-muted)',
  padding: '6px 8px',
  borderRadius: 6,
  textDecoration: 'none',
  cursor: 'pointer',
};

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
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 30,
      height: 56,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 14,
      background: scrolled ? 'var(--bg-topbar)' : 'transparent',
      borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
      backdropFilter: scrolled ? 'blur(20px) saturate(140%)' : 'none',
      transition: 'background 0.25s, border-color 0.25s, backdrop-filter 0.25s',
    }}>
      {/* Brand Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: 'inherit',
      }}>
        {isEditingBrand ? (
          <>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 1px oklch(0.50 0.10 280 / 0.5), 0 4px 14px oklch(0.50 0.20 280 / 0.4)',
            }}>
              <Command size={14} strokeWidth={2.2} style={{ color: 'white' }} />
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
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--fg)',
                fontFamily: 'inherit',
                fontSize: 15.5,
                fontWeight: 600,
                letterSpacing: '-0.018em',
                width: `${Math.max(brandName.length, 1)}ch`,
                outline: 'none',
                cursor: 'text',
                padding: 0,
                margin: 0,
              }}
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
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none', 
              color: 'inherit',
              gap: 10
            }}
            title="Return to Home Screen"
          >
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 1px oklch(0.50 0.10 280 / 0.5), 0 4px 14px oklch(0.50 0.20 280 / 0.4)',
              cursor: 'pointer',
            }}>
              <Command size={14} strokeWidth={2.2} style={{ color: 'white' }} />
            </div>
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsEditingBrand(true);
              }}
              style={{
                color: 'var(--fg)',
                fontSize: 15.5,
                fontWeight: 600,
                letterSpacing: '-0.018em',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              title="Double-click to rename SaaS"
            >
              {brandName}
            </span>
          </Link>
        )}
      </div>

      {/* Tools launcher pill */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <button onClick={() => setLauncher(true)} className="reset launcher-pill" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 14px 7px 12px',
          background: 'var(--bg-elev-1)',
          border: '1px solid var(--border)',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--fg)',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
        }}>
          <Grid size={13} strokeWidth={2} style={{ color: 'var(--fg-muted)' }} />
          <span>{activeTool ? activeTool.name : 'Browse all tools'}</span>
          <ChevronDown size={12} style={{ color: 'var(--fg-subtle)' }} />
        </button>
      </div>

      {/* Right cluster */}
      <button onClick={() => setPalette(true)} className="reset search-btn" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px 7px 12px',
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        fontSize: 12.5,
        color: 'var(--fg-muted)',
        cursor: 'pointer',
        minWidth: 180,
      }}>
        <Search size={13} />
        <span style={{ flex: 1, textAlign: 'left' }}>Search tools…</span>
        <kbd className="kbd">⌘K</kbd>
      </button>

      <Link href="/pricing" className="reset top-link" style={topLink}>Pricing</Link>
      <Link href="/docs" className="reset top-link" style={topLink}>Docs</Link>
      <Link href="/api" className="reset top-link" style={topLink}>APIs</Link>

      {/* Auth State */}
      {sessionUser && !isAnonUser ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {(() => {
            const userDisplayName = sessionUser.user_metadata?.name || sessionUser.user_metadata?.username || sessionUser.email.split('@')[0];
            return (
              <button 
                onClick={() => openTool('account')} 
                className="reset top-link" 
                style={{ 
                  ...topLink, 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 6,
                  background: 'var(--bg-elev-1)',
                  border: '1px solid var(--border)',
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--fg)',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: userPlan === 'pro' ? 'var(--pro)' : 'oklch(0.70 0.16 145)' }} />
                <span>Account ({userDisplayName})</span>
                {userPlan === 'pro' && <span className="mono" style={{ fontSize: 9, background: 'var(--pro)', color: 'black', padding: '1px 4px', borderRadius: 4, fontWeight: 700 }}>PRO</span>}
              </button>
            );
          })()}
          <button onClick={handleSignOut} className="reset top-link" style={topLink}>Sign Out</button>
        </div>
      ) : (
        <button onClick={() => setAuthOpen(true)} className="reset top-link" style={{ ...topLink, color: 'var(--accent)', fontWeight: 600 }}>Sign In / Up</button>
      )}

      {!isPremium && (
        <button onClick={() => handleShowPaywall('upgrade')} className="reset main-upgrade-btn" style={{
          padding: '6px 12px',
          background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
          color: 'white',
          fontWeight: 600,
          fontSize: 12,
          borderRadius: 8,
          cursor: 'pointer',
          border: 'none',
          boxShadow: '0 4px 12px oklch(0.50 0.20 280 / 0.3)'
        }}>Upgrade</button>
      )}

      {/* Theme Toggle Switch */}
      <button onClick={toggleTheme} className="reset theme-toggle-btn" style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13,
        color: 'var(--fg-muted)',
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--border)',
        transition: 'background 0.15s, color 0.15s, transform 0.15s',
      }}
      title={`Switch to theme`}>
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Mobile Menu Toggle Button */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="reset mobile-menu-btn"
        style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 8,
          cursor: 'pointer',
          background: mobileMenuOpen ? 'var(--bg-hover)' : 'var(--bg-elev-1)',
          border: '1px solid var(--border)',
          color: 'var(--fg)',
          transition: 'all 0.2s',
        }}
        title="Toggle Menu"
      >
        {mobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
      </button>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: 56,
          left: 0,
          right: 0,
          background: 'oklch(0.145 0 0 / 0.95)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          zIndex: 40,
          boxShadow: '0 20px 40px oklch(0 0 0 / 0.5)',
          animation: 'slideDownMenu 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <style>{`
            @keyframes slideDownMenu {
              from { transform: translateY(-10px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }} className="mono">Navigation</span>
            <Link 
              href="/pricing" 
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: 14, color: 'var(--fg)', padding: '10px 12px', borderRadius: 8, textDecoration: 'none', background: 'var(--bg-elev-1)', border: '1px solid var(--border)' }}
            >
              Pricing
            </Link>
            <Link 
              href="/docs" 
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: 14, color: 'var(--fg)', padding: '10px 12px', borderRadius: 8, textDecoration: 'none', background: 'var(--bg-elev-1)', border: '1px solid var(--border)', marginTop: 8 }}
            >
              Docs
            </Link>
            <Link 
              href="/api" 
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: 14, color: 'var(--fg)', padding: '10px 12px', borderRadius: 8, textDecoration: 'none', background: 'var(--bg-elev-1)', border: '1px solid var(--border)', marginTop: 8 }}
            >
              APIs
            </Link>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }} className="mono">Account Workspace</span>
            
            {sessionUser && !isAnonUser ? (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'var(--bg-elev-1)',
                  border: '1px solid var(--border)'
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: userPlan === 'pro' ? 'var(--pro)' : 'oklch(0.70 0.16 145)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: 'white' }}>
                      {sessionUser.user_metadata?.name || sessionUser.user_metadata?.username || sessionUser.email.split('@')[0]}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                      Active Plan: <span className="mono" style={{ color: userPlan === 'pro' ? 'var(--pro)' : 'oklch(0.70 0.16 145)', fontWeight: 700 }}>{userPlan.toUpperCase()}</span>
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    openTool('account');
                    setMobileMenuOpen(false);
                  }}
                  className="reset" 
                  style={{
                    textAlign: 'center',
                    padding: '10px',
                    borderRadius: 8,
                    background: 'var(--bg-elev-2)',
                    border: '1px solid var(--border)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Manage Account Settings
                </button>
                <button 
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="reset" 
                  style={{
                    textAlign: 'center',
                    padding: '10px',
                    borderRadius: 8,
                    color: 'oklch(0.65 0.16 20)',
                    background: 'oklch(0.65 0.16 20 / 0.1)',
                    border: '1px solid oklch(0.65 0.16 20 / 0.2)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
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
                className="reset" 
                style={{
                  textAlign: 'center',
                  padding: '10px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
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
