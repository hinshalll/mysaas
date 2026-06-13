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
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      height: 64,
      display: 'flex', alignItems: 'center',
      padding: '0 32px',
      gap: 18,
      background: scrolled ? 'var(--bg-topbar)' : 'transparent',
      borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
      backdropFilter: scrolled ? 'blur(20px) saturate(140%)' : 'none',
      transition: 'background 0.25s, border-color 0.25s, backdrop-filter 0.25s',
    }} className="landing-nav">
      {/* Brand Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        textDecoration: 'none', color: 'inherit'
      }}>
        {isEditingBrand ? (
          <>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px oklch(0.50 0.10 280 / 0.5), 0 4px 14px oklch(0.50 0.20 280 / 0.4)',
            }}>
              <Icon.Command size={16} strokeWidth={2.2} style={{ color: 'white' }} />
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
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--fg)',
                fontFamily: 'inherit',
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: '-0.02em',
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
              onLaunch(); 
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
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px oklch(0.50 0.10 280 / 0.5), 0 4px 14px oklch(0.50 0.20 280 / 0.4)',
              cursor: 'pointer',
            }}>
              <Icon.Command size={16} strokeWidth={2.2} style={{ color: 'white' }} />
            </div>
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsEditingBrand(true);
              }}
              style={{
                color: 'var(--fg)',
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: '-0.02em',
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

      <nav style={{ display: 'flex', gap: 2, marginLeft: 24 }} className="landing-nav-links">
        {[
          { label: 'Tools', path: '/dashboard' },
          { label: 'Pricing', path: '/pricing' },
          { label: 'Changelog', path: '/changelog' },
          { label: 'Docs', path: '/docs' },
          { label: 'APIs', path: '/api' },
        ].map(item => (
          <Link key={item.label} href={item.path} className="reset top-link" style={{
            fontSize: 13, color: 'var(--fg-muted)',
            padding: '7px 12px', borderRadius: 6,
            textDecoration: 'none', cursor: 'pointer',
          }}>{item.label}</Link>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Auth State (Same as TopBar) */}
      {sessionUser && !isAnonUser ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8 }}>
          {(() => {
            const userDisplayName = sessionUser.user_metadata?.name || sessionUser.user_metadata?.username || sessionUser.email.split('@')[0];
            return (
              <Link href="/account" className="reset top-link" style={{ 
                fontSize: 12.5, 
                color: 'var(--fg)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 6,
                background: 'var(--bg-elev-1)',
                border: '1px solid var(--border)',
                padding: '5px 12px',
                borderRadius: 20,
                textDecoration: 'none',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: userPlan === 'pro' ? 'var(--pro)' : 'oklch(0.70 0.16 145)' }} />
                <span>Account ({userDisplayName})</span>
                {userPlan === 'pro' && <span className="mono" style={{ fontSize: 9, background: 'var(--pro)', color: 'black', padding: '1px 4px', borderRadius: 4, fontWeight: 700 }}>PRO</span>}
              </Link>
            );
          })()}
          <button onClick={onSignOut} className="reset top-link" style={{ fontSize: 13, color: 'var(--fg-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>Sign Out</button>
        </div>
      ) : (
        <button onClick={onOpenAuthModal} className="reset top-link" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, padding: '8px 12px', borderRadius: 7, cursor: 'pointer', marginRight: 8 }}>Sign In / Up</button>
      )}

      {/* Theme Toggle Switch */}
      <button onClick={onToggleTheme} className="reset theme-toggle-btn" style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13, color: 'var(--fg-muted)',
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--border)',
        transition: 'background 0.15s, color 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-1)'}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
        {theme === 'dark' ? <Icon.Sun size={15} /> : <Icon.Moon size={15} />}
      </button>

      {/* Mobile Menu Toggle Button for LandingNav */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="reset mobile-menu-btn"
        style={{
          display: 'none', // Hidden on desktop, shown on mobile via CSS
          alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8,
          cursor: 'pointer',
          background: mobileMenuOpen ? 'var(--bg-hover)' : 'var(--bg-elev-1)',
          border: '1px solid var(--border)',
          color: 'var(--fg)',
          transition: 'all 0.2s',
        }}
        title="Toggle Menu"
      >
        {mobileMenuOpen ? <Icon.X size={15} /> : <Icon.Menu size={15} />}
      </button>

      {/* Mobile Menu Panel for LandingNav */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: 64, left: 0, right: 0,
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
              href="/dashboard" 
              onClick={(e) => {
                e.preventDefault();
                onLaunch();
                setMobileMenuOpen(false);
              }}
              style={{ fontSize: 14, color: 'var(--fg)', padding: '10px 12px', borderRadius: 8, textDecoration: 'none', background: 'var(--bg-elev-1)', border: '1px solid var(--border)' }}
            >
              Launch App
            </Link>
            <Link 
              href="/pricing" 
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: 14, color: 'var(--fg)', padding: '10px 12px', borderRadius: 8, textDecoration: 'none', background: 'var(--bg-elev-1)', border: '1px solid var(--border)', marginTop: 8 }}
            >
              Pricing
            </Link>
            <Link 
              href="/changelog" 
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: 14, color: 'var(--fg)', padding: '10px 12px', borderRadius: 8, textDecoration: 'none', background: 'var(--bg-elev-1)', border: '1px solid var(--border)', marginTop: 8 }}
            >
              Changelog
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
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--bg-elev-1)', border: '1px solid var(--border)'
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
                
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <Link 
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      flex: 1, padding: '10px', textAlign: 'center',
                      background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                      borderRadius: 8, color: 'white', fontWeight: 500, fontSize: 13,
                      textDecoration: 'none'
                    }}
                  >
                    Account Settings
                  </Link>
                  <button 
                    onClick={() => {
                      onSignOut();
                      setMobileMenuOpen(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      background: 'oklch(0.60 0.15 20 / 0.1)', border: '1px solid oklch(0.60 0.15 20 / 0.3)',
                      borderRadius: 8, color: 'oklch(0.75 0.15 20)', fontWeight: 500, fontSize: 13,
                      cursor: 'pointer'
                    }}
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
                style={{
                  padding: '10px',
                  background: 'linear-gradient(180deg, oklch(0.72 0.18 265), oklch(0.62 0.20 305))',
                  border: 'none', borderRadius: 8,
                  color: 'white', fontWeight: 600, fontSize: 13.5,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px oklch(0.50 0.20 280 / 0.2)'
                }}
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
    <div style={{
      borderRadius: 16,
      overflow: 'hidden',
      background: 'oklch(0.175 0.008 250 / 0.7)',
      border: '1px solid var(--border)',
      boxShadow: '0 32px 100px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(0 0 0 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.05)',
    }}>
      {/* Window chrome */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'oklch(0.19 0.008 250 / 0.7)',
      }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <span style={dot('oklch(0.62 0.18 25)')} />
          <span style={dot('oklch(0.78 0.16 90)')} />
          <span style={dot('oklch(0.70 0.16 145)')} />
        </div>
        <span className="mono" style={{ fontSize: 11, color: 'var(--fg-dim)', marginLeft: 6 }}>
          mysaas / universal-ai-formatter <span style={{ color: 'var(--fg-subtle)' }}>· live</span>
        </span>
        <div style={{ flex: 1 }} />
        <span style={{
          fontSize: 10.5,
          padding: '2px 8px',
          borderRadius: 999,
          background: 'oklch(0.30 0.12 145 / 0.35)',
          color: 'oklch(0.85 0.14 145)',
          border: '1px solid oklch(0.45 0.10 145 / 0.4)',
          display: 'flex', alignItems: 'center', gap: 5,
          fontWeight: 500,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: 'oklch(0.78 0.16 145)',
            boxShadow: '0 0 6px oklch(0.78 0.16 145)',
          }} />
          rendering
        </span>
      </div>

      {/* Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 340 }} className="demo-split">
        {/* Input */}
        <div style={{
          padding: '18px 20px',
          borderRight: '1px solid var(--border)',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11.5,
          lineHeight: 1.65,
          color: 'var(--fg-muted)',
          background: 'oklch(0.155 0.006 250 / 0.55)',
          position: 'relative',
        }}>
          <div style={{ fontSize: 10, color: 'var(--fg-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            input · markdown
          </div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            <span style={{ color: 'oklch(0.75 0.14 265)' }}># </span>
            <span style={{ color: 'var(--fg)' }}>Context Switching: The Hidden Tax</span>{'\n\n'}
            Engineers report losing <span style={{ color: 'oklch(0.80 0.14 90)' }}>**23 minutes**</span> on average to recover focus after a single interruption. Teams that batch communication into 2-3 windows per day ship features 31% faster.{'\n\n'}
            <span style={{ color: 'oklch(0.75 0.14 265)' }}>## </span>
            <span style={{ color: 'var(--fg)' }}>Three rules</span>{'\n\n'}
            <span style={{ color: 'oklch(0.78 0.14 145)' }}>1.</span> Default chat to DND outside two review windows.{'\n'}
            <span style={{ color: 'oklch(0.78 0.14 145)' }}>2.</span> Replace standups with async written updates.{'\n'}
            <span style={{ color: 'oklch(0.78 0.14 145)' }}>3.</span> Reserve mornings for deep work only.{'\n\n'}
            <span style={{ color: 'oklch(0.68 0.14 25)' }}>{'> '}</span>
            <span style={{ color: 'var(--fg-muted)', fontStyle: 'italic' }}>"The most expensive thing you can give an engineer is a 15-minute meeting."</span>
          </pre>
        </div>

        {/* Output */}
        <div style={{
          padding: 22,
          background: 'oklch(0.97 0.005 250)',
          color: 'oklch(0.18 0.008 250)',
          fontFamily: t.font,
          fontSize: 11,
          lineHeight: 1.6,
          position: 'relative',
        }}>
          <div style={{
            fontSize: t.id === 'minimalist' ? 13 : 17,
            fontWeight: t.serifTitle ? 700 : 600,
            letterSpacing: t.id === 'minimalist' ? '-0.01em' : '-0.018em',
            marginBottom: 6,
            fontFamily: t.serifTitle ? '"Source Serif Pro", Georgia, serif' : 'inherit',
          }}>Context Switching: The Hidden Tax</div>
          <div style={{ fontSize: 8.5, color: 'oklch(0.50 0.005 250)', marginBottom: 12, letterSpacing: '0.04em', textTransform: t.id === 'academic' ? 'none' : 'uppercase' }}>
            {t.id === 'academic' ? 'Submitted · May 2026' : `${t.label} theme · 2 pages`}
          </div>
          <div style={{
            height: t.id === 'minimalist' ? 0 : 1,
            background: 'oklch(0.88 0.005 250)',
            marginBottom: 10,
          }} />
          <p style={{ margin: '0 0 8px' }}>
            Engineers report losing <b>23 minutes</b> on average to recover focus after a single interruption. Teams that batch communication into 2-3 windows per day ship features 31% faster.
          </p>
          <div style={{ fontWeight: 600, fontSize: t.id === 'minimalist' ? 11 : 12, marginTop: 12, marginBottom: 6 }}>
            {t.id === 'academic' ? '1. Three rules' : 'Three rules'}
          </div>
          <ol style={{ margin: 0, paddingLeft: 16 }}>
            <li>Default chat to DND outside two review windows.</li>
            <li>Replace standups with async written updates.</li>
            <li>Reserve mornings for deep work only.</li>
          </ol>
          <blockquote style={{
            margin: '12px 0 0',
            paddingLeft: 10,
            borderLeft: t.id === 'minimalist' ? '1px solid oklch(0.40 0.005 250)' : '2px solid oklch(0.62 0.18 265)',
            color: 'oklch(0.35 0.008 250)',
            fontStyle: t.id === 'minimalist' ? 'normal' : 'italic',
            fontSize: 10,
          }}>
            "The most expensive thing you can give an engineer is a 15-minute meeting."
          </blockquote>
        </div>
      </div>

      {/* Theme switcher */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        background: 'oklch(0.16 0.006 250 / 0.6)',
      }}>
        <span style={{ fontSize: 11, color: 'var(--fg-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Theme</span>
        {themes.map(th => (
          <button key={th.id} onClick={() => setTab(th.id)} className="reset" style={{
            padding: '4px 10px',
            fontSize: 11.5, fontWeight: 500,
            borderRadius: 6, cursor: 'pointer',
            background: tab === th.id ? 'oklch(0.30 0.05 265 / 0.5)' : 'transparent',
            color: tab === th.id ? 'oklch(0.92 0.04 265)' : 'var(--fg-muted)',
            border: `1px solid ${tab === th.id ? 'oklch(0.45 0.08 265 / 0.4)' : 'transparent'}`,
          }}>{th.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-dim)' }}>
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
    <section style={{
      position: 'relative',
      padding: '88px 32px 56px',
      maxWidth: 1200,
      margin: '0 auto',
      width: '100%', boxSizing: 'border-box',
      textAlign: 'center',
    }} className="landing-hero">
      {/* Eyebrow */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 14px 6px 8px',
        borderRadius: 999,
        background: 'oklch(0.22 0.04 265 / 0.45)',
        border: '1px solid oklch(0.40 0.08 265 / 0.4)',
        fontSize: 12, fontWeight: 500,
        color: 'oklch(0.88 0.08 265)',
        marginBottom: 32,
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{
          width: 20, height: 20, borderRadius: 6,
          background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon.Sparkles size={11} strokeWidth={2.2} style={{ color: 'white' }} />
        </span>
        <span>One workspace · now in public beta</span>
      </div>

      {/* Headline — display sans + serif italic accent */}
      <h1 style={{
        margin: 0,
        fontSize: 'clamp(48px, 8vw, 96px)',
        lineHeight: 0.98,
        letterSpacing: '-0.04em',
        fontWeight: 600,
        color: 'var(--fg)',
        textWrap: 'balance',
      }}>
        Every annoying<br />
        file,{' '}
        <span style={{
          fontFamily: '"Source Serif Pro", Georgia, serif',
          fontStyle: 'italic',
          fontWeight: 400,
          letterSpacing: '-0.025em',
          background: 'linear-gradient(110deg, oklch(0.92 0.04 265), oklch(0.78 0.16 285) 45%, oklch(0.82 0.14 200))',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          backgroundSize: '200% 100%',
          animation: 'gradient-shift 8s ease-in-out infinite',
        }}>solved.</span>
      </h1>
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
      `}</style>

      <p style={{
        margin: '28px auto 0',
        maxWidth: 620,
        fontSize: 'clamp(16px, 1.8vw, 19px)',
        lineHeight: 1.5,
        color: 'var(--fg-muted)',
        textWrap: 'pretty',
      }}>
        The small utilities you keep googling — formatters, converters, OCR, redactors, diff checkers — in one keyboard-driven workspace. Built for the people who hit <kbd className="kbd-inline">⌘K</kbd> a hundred times a day.
      </p>

      <div style={{
        display: 'flex', gap: 12, marginTop: 36,
        justifyContent: 'center', flexWrap: 'wrap',
      }}>
        <button onClick={onLaunch} className="reset" style={{
          display: 'inline-flex', alignItems: 'center', gap: 9,
          padding: '14px 22px',
          background: 'linear-gradient(180deg, oklch(0.97 0.005 250), oklch(0.86 0.005 250))',
          color: 'oklch(0.14 0.008 250)',
          fontWeight: 500, fontSize: 15,
          borderRadius: 11,
          cursor: 'pointer',
          boxShadow: '0 1px 0 oklch(1 0 0 / 0.5) inset, 0 4px 14px oklch(0 0 0 / 0.4), 0 0 0 1px oklch(0 0 0 / 0.5)',
          letterSpacing: '-0.005em',
          transition: 'transform 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Launch app <Icon.ArrowRight size={15} strokeWidth={2.2}/>
        </button>
        <button onClick={(e) => {
          e.preventDefault();
          document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', '#pricing');
        }} className="reset" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '14px 18px',
          background: 'oklch(0.20 0.008 250 / 0.5)',
          border: '1px solid var(--border)',
          color: 'var(--fg)',
          fontWeight: 500, fontSize: 15,
          borderRadius: 11,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}>
          See pricing
        </button>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 22, marginTop: 36,
        justifyContent: 'center',
        fontSize: 12, color: 'var(--fg-dim)',
        flexWrap: 'wrap',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon.Check size={12} style={{ color: 'oklch(0.78 0.16 145)' }} /> Runs in-browser, on-device
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon.Check size={12} style={{ color: 'oklch(0.78 0.16 145)' }} /> Zero data leaves your machine
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
    <section id="tools" style={{
      maxWidth: 1200, margin: '0 auto',
      padding: '96px 32px 64px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={eyebrow}>The suite</div>
        <h2 style={sectionTitle}>
          Every utility you need.<br/>
          <span style={italicAccent}>One keyboard shortcut.</span>
        </h2>
        <p style={sectionSubtitle}>
          Each utility is its own focused workbench, but they all share the same launcher, history, and exports.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 14,
      }}>
        {CATEGORIES.map(cat => (
          <div key={cat.id} style={{
            padding: 22,
            background: cat.pro
              ? `linear-gradient(180deg, ${tint(cat.hue, 0.30, 0.08, 0.15)}, ${tint(cat.hue, 0.20, 0.04, 0.05)})`
              : 'oklch(0.175 0.008 250 / 0.6)',
            border: `1px solid ${cat.pro ? tintBorder(cat.hue) : 'var(--border)'}`,
            borderRadius: 14,
            transition: 'transform 0.25s, border-color 0.25s, background 0.25s',
            position: 'relative', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}
          className="suite-card"
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = tintBorder(cat.hue); }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; if (!cat.pro) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {/* Category header link */}
            <Link href={`/category/${cat.id}`} className="reset" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: tintFg(cat.hue),
                  boxShadow: `0 0 10px ${tintFg(cat.hue)}`,
                }} />
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: cat.pro ? tintFg(cat.hue) : 'var(--fg-dim)',
                  letterSpacing: '0.10em', textTransform: 'uppercase',
                }}>{cat.label}</span>
                <div style={{ flex: 1 }} />
              </div>
              <div style={{
                fontSize: 17, fontWeight: 600,
                color: 'var(--fg)', letterSpacing: '-0.015em',
                marginBottom: 8,
                lineHeight: 1.25,
                textWrap: 'pretty',
              }}>{cat.tagline}</div>
            </Link>

            {/* Crawlable list of individual tools */}
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {cat.tools.slice(0, 4).map(t => {
                const Ico = Icon[t.icon] || Icon.Sparkles;
                return (
                  <li key={t.id}>
                    <Link href={`/tools/${t.id}`} className="reset" style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '5px 0',
                      fontSize: 12.5, color: 'var(--fg-muted)',
                      textDecoration: 'none',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = tintFg(cat.hue); }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-muted)'; }}
                    >
                      <Ico size={11} strokeWidth={1.8} style={{ color: 'var(--fg-subtle)', flexShrink: 0 }}/>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    </Link>
                  </li>
                );
              })}
              {cat.tools.length > 4 && (
                <li style={{ marginTop: 4 }}>
                  <Link href={`/category/${cat.id}`} className="reset" style={{
                    fontSize: 11, color: 'var(--fg-subtle)',
                    display: 'flex', alignItems: 'center', gap: 5,
                    textDecoration: 'none',
                  }}>
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
    <section id="pricing" style={{
      maxWidth: 1080, margin: '0 auto',
      padding: '96px 32px 64px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div style={eyebrow}>Pricing</div>
        <h2 style={sectionTitle}>
          Free for everything small.<br/>
          <span style={italicAccent}>{pricingData.currency}{pricingData.monthly} a month for everything else.</span>
        </h2>
        <p style={sectionSubtitle}>
          No seats, no per-tool gating, no trial timers. Dynamic plans tailored for your region.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        alignItems: 'stretch',
      }} className="pricing-grid">
        {/* Free */}
        <div style={{
          padding: 32,
          background: 'oklch(0.175 0.008 250 / 0.55)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          display: 'flex', flexDirection: 'column', gap: 22,
        }}>
          <div>
            <div style={{
              fontSize: 11.5, fontWeight: 600,
              color: 'var(--fg-dim)', letterSpacing: '0.10em',
              textTransform: 'uppercase', marginBottom: 14,
            }}>Free</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 48, fontWeight: 600, letterSpacing: '-0.03em' }}>$0</span>
              <span style={{ color: 'var(--fg-subtle)', fontSize: 14 }}>forever</span>
            </div>
            <p style={{ margin: '12px 0 0', color: 'var(--fg-muted)', fontSize: 14, lineHeight: 1.5 }}>
              For occasional use and weekend projects.
            </p>
          </div>

          <ul style={listStyle}>
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

          <button onClick={onLaunch} className="reset" style={{
            padding: '12px 18px',
            background: 'oklch(0.21 0.010 250)',
            border: '1px solid var(--border)',
            color: 'var(--fg)',
            fontWeight: 500, fontSize: 14,
            borderRadius: 9, cursor: 'pointer',
            textAlign: 'center',
            display: 'block',
          }}>Start free →</button>
        </div>

        {/* Pro */}
        <div style={{
          padding: 32,
          background: 'linear-gradient(180deg, oklch(0.21 0.04 265 / 0.6), oklch(0.18 0.03 265 / 0.4))',
          border: '1px solid oklch(0.45 0.10 265 / 0.5)',
          borderRadius: 16,
          display: 'flex', flexDirection: 'column', gap: 22,
          position: 'relative',
          boxShadow: '0 24px 80px oklch(0.30 0.18 265 / 0.18), inset 0 1px 0 oklch(1 0 0 / 0.05)',
        }}>
          <span style={{
            position: 'absolute', top: 16, right: 16,
            fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
            padding: '4px 10px', borderRadius: 999,
            background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
            color: 'white', textTransform: 'uppercase',
          }}>Most popular</span>

          <div>
            <div style={{
              fontSize: 11.5, fontWeight: 600,
              color: 'oklch(0.85 0.10 265)', letterSpacing: '0.10em',
              textTransform: 'uppercase', marginBottom: 14,
            }}>Pro</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 48, fontWeight: 600, letterSpacing: '-0.03em' }}>{pricingData.currency}{pricingData.monthly}</span>
              <span style={{ color: 'var(--fg-subtle)', fontSize: 14 }}>{pricingData.suffix}</span>
            </div>
            <p style={{ margin: '12px 0 0', color: 'var(--fg-muted)', fontSize: 14, lineHeight: 1.5 }}>
              For people who live in their tools.
            </p>
          </div>

          <ul style={listStyle}>
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

          <button onClick={onShowPaywall} className="reset" style={{
            padding: '12px 18px',
            background: 'linear-gradient(180deg, oklch(0.97 0.005 250), oklch(0.86 0.005 250))',
            color: 'oklch(0.14 0.008 250)',
            fontWeight: 500, fontSize: 14,
            borderRadius: 9, cursor: 'pointer',
            textAlign: 'center', display: 'block',
            boxShadow: '0 1px 0 oklch(1 0 0 / 0.4) inset, 0 1px 3px oklch(0 0 0 / 0.5)',
          }}>Upgrade to Pro →</button>
        </div>

        {/* Developer API */}
        <div style={{
          padding: 32,
          background: 'oklch(0.175 0.008 250 / 0.55)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          display: 'flex', flexDirection: 'column', gap: 22,
        }}>
          <div>
            <div style={{
              fontSize: 11.5, fontWeight: 600,
              color: 'oklch(0.78 0.16 145)', letterSpacing: '0.10em',
              textTransform: 'uppercase', marginBottom: 14,
            }}>Developer API</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 48, fontWeight: 600, letterSpacing: '-0.03em' }}>{pricingData.currency}29</span>
              <span style={{ color: 'var(--fg-subtle)', fontSize: 14 }}>{pricingData.suffix}</span>
            </div>
            <p style={{ margin: '12px 0 0', color: 'var(--fg-muted)', fontSize: 14, lineHeight: 1.5 }}>
              For high-volume programmatic access.
            </p>
          </div>

          <ul style={listStyle}>
            {[
              ['Everything in Pro Plan', true, true],
              ['2,000 API requests / day', true],
              ['Direct API keys console', true],
              ['Custom webhooks & callbacks', true],
              ['Priority compute resources', true],
            ].map(([f, on, em]) => <Feature key={f as string} on={on as boolean} em={em as boolean}>{f as string}</Feature>)}
          </ul>

          <button onClick={onShowPaywall} className="reset" style={{
            padding: '12px 18px',
            background: 'var(--bg-elev-2)',
            border: '1px solid var(--border)',
            color: 'var(--fg)',
            fontWeight: 500, fontSize: 14,
            borderRadius: 9, cursor: 'pointer',
            textAlign: 'center', display: 'block',
          }}>Get API Keys →</button>
        </div>
      </div>

      <p style={{
        textAlign: 'center', marginTop: 28,
        fontSize: 12.5, color: 'var(--fg-dim)',
      }}>
        Need SOC2, SSO, or on-prem? <a href="#" onClick={(e) => { e.preventDefault(); onEnterprise(); }} style={{ color: 'var(--fg-muted)', textDecoration: 'underline', textDecorationColor: 'var(--border-strong)' }}>Talk to us about Enterprise</a>.
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
    <li style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '4px 0',
      fontSize: 13.5,
      color: on ? 'var(--fg)' : 'var(--fg-dim)',
      fontWeight: em ? 600 : 400,
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
        background: on ? 'oklch(0.32 0.10 145 / 0.4)' : 'oklch(0.22 0.010 250)',
        color: on ? 'oklch(0.85 0.16 145)' : 'var(--fg-dim)',
      }}>
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
    <section style={{
      padding: '96px 32px',
      maxWidth: 1200, margin: '0 auto',
      width: '100%', boxSizing: 'border-box',
    }}>
      <div style={{
        position: 'relative',
        padding: 'clamp(48px, 7vw, 88px) 40px',
        borderRadius: 24,
        textAlign: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, oklch(0.20 0.04 265 / 0.55), oklch(0.16 0.02 265 / 0.35))',
        border: '1px solid oklch(0.40 0.08 265 / 0.4)',
        boxShadow: '0 30px 100px oklch(0.25 0.15 265 / 0.20), inset 0 1px 0 oklch(1 0 0 / 0.04)',
      }}>
        {/* Aurora layers */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background:
            'radial-gradient(500px 250px at 20% 0%, oklch(0.55 0.18 265 / 0.35), transparent 60%),' +
            'radial-gradient(500px 250px at 80% 100%, oklch(0.55 0.18 305 / 0.30), transparent 60%)',
        }}/>

        <div style={{ position: 'relative' }}>
          <h2 style={{
            margin: 0,
            fontSize: 'clamp(34px, 5vw, 56px)',
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            fontWeight: 600,
            textWrap: 'balance',
          }}>
            Stop googling tiny tools.{' '}
            <span style={italicAccent}>Start finishing.</span>
          </h2>
          <p style={{
            margin: '20px auto 0', maxWidth: 540,
            fontSize: 16, color: 'var(--fg-muted)',
            lineHeight: 1.5,
          }}>
            Free forever for the basics. $9/mo when you outgrow it. Cancel any time, export everything.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onLaunch} className="reset" style={{
              display: 'inline-flex', alignItems: 'center', gap: 9,
              padding: '14px 22px',
              background: 'linear-gradient(180deg, oklch(0.97 0.005 250), oklch(0.86 0.005 250))',
              color: 'oklch(0.14 0.008 250)',
              fontWeight: 500, fontSize: 15,
              borderRadius: 11, cursor: 'pointer',
              boxShadow: '0 1px 0 oklch(1 0 0 / 0.5) inset, 0 4px 14px oklch(0 0 0 / 0.4), 0 0 0 1px oklch(0 0 0 / 0.5)',
            }}>
              Launch app <Icon.ArrowRight size={15} strokeWidth={2.2}/>
            </button>
            <button onClick={onBrowseTools} className="reset" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '14px 18px',
              background: 'oklch(0.20 0.008 250 / 0.5)',
              border: '1px solid var(--border)',
              color: 'var(--fg)',
              fontWeight: 500, fontSize: 15,
              borderRadius: 11, cursor: 'pointer',
            }}>
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
    <section id="developer-api" style={{
      maxWidth: 1100, margin: '0 auto',
      padding: '40px 32px 64px',
      position: 'relative',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 40,
        alignItems: 'center',
      }} className="pricing-grid">
        {/* Info Column */}
        <div>
          <span style={{
            ...eyebrow,
            color: 'oklch(0.78 0.16 195)', // Cyan text
            border: '1px solid oklch(0.78 0.16 195 / 0.3)',
            background: 'oklch(0.18 0.010 195 / 0.1)',
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: 10.5,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'inline-block',
            marginBottom: 16,
          }} className="mono">⚡ Developer API Integration</span>
          <h2 style={{ ...sectionTitle, textAlign: 'left', fontSize: 32, lineHeight: 1.15, margin: '0 0 16px' }}>
            Integrate formatters<br/>
            <span style={italicAccent}>directly into your scripts.</span>
          </h2>
          <p style={{ fontSize: 14.5, color: 'var(--fg-muted)', lineHeight: 1.6, marginBottom: 24 }}>
            Integrate {brandName}'s enterprise-grade JSON, text, and data parser engines directly into your applications, scripts, and workflows. Generate secure keys, test endpoints instantly, and scale.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/account" className="reset" style={{
              padding: '10px 18px', borderRadius: 8,
              background: 'linear-gradient(180deg, oklch(0.72 0.18 195), oklch(0.62 0.20 195))',
              color: 'white', fontWeight: 600, fontSize: 13, textDecoration: 'none', cursor: 'pointer',
              boxShadow: '0 4px 12px oklch(0.50 0.20 195 / 0.25)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <span>Get API Key</span>
              <Icon.ArrowRight size={13} strokeWidth={2.5} />
            </Link>
            <Link href="/docs" className="reset" style={{
              padding: '10px 18px', borderRadius: 8,
              background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
              color: 'var(--fg)', fontWeight: 500, fontSize: 13, textDecoration: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center',
            }}>
              Read Technical Docs
            </Link>
          </div>
        </div>

        {/* Preview Code Terminal Column */}
        <div className="glass-card" style={{ padding: 24, background: '#0e0f12', border: '1px solid #1c1d22', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: 'var(--fg-dim)', fontWeight: 600 }} className="mono">cURL REQUEST</span>
          </div>
          <pre style={{
            margin: 0, padding: 0, overflowX: 'auto',
            fontSize: 11.5, color: 'oklch(0.80 0.10 195)', lineHeight: 1.5,
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }} className="mono">
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
   Shared styles
   ========================================================================= */

const eyebrow: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 11, fontWeight: 600,
  color: 'oklch(0.78 0.12 265)',
  letterSpacing: '0.18em', textTransform: 'uppercase',
  marginBottom: 18,
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(34px, 5vw, 52px)',
  lineHeight: 1.05,
  letterSpacing: '-0.03em',
  fontWeight: 600,
  textWrap: 'balance',
};

const italicAccent: React.CSSProperties = {
  fontFamily: '"Source Serif Pro", Georgia, serif',
  fontStyle: 'italic', fontWeight: 400,
  background: 'linear-gradient(110deg, oklch(0.92 0.04 265), oklch(0.78 0.16 285))',
  WebkitBackgroundClip: 'text', backgroundClip: 'text',
  color: 'transparent',
};

const sectionSubtitle: React.CSSProperties = {
  margin: '20px auto 0', maxWidth: 560,
  fontSize: 16, color: 'var(--fg-muted)',
  lineHeight: 1.5, textWrap: 'pretty',
};

const listStyle: React.CSSProperties = {
  margin: 0, padding: 0, listStyle: 'none',
  display: 'flex', flexDirection: 'column', gap: 4,
  flex: 1,
};

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
