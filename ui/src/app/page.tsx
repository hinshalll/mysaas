"use client";
// @ts-nocheck
/* eslint-disable */

/**
 * mysaas — a single-file Next.js `app/page.tsx` that contains the complete
 * design: landing page, app dashboard, command palette, full-screen launcher,
 * Universal AI-to-Doc Formatter (with live WYSIWYG editor) and placeholder
 * stubs for the other tools.
 *
 * Drop this into `app/page.tsx` of any Next.js 14 (App Router) project that has
 * Tailwind set up. Tailwind is only used by the page indirectly — the design
 * uses CSS variables + inline styles for the oklch palette, so no theme
 * extension is required. Make sure these npm deps are installed:
 *
 *   npm i lucide-react
 *
 * Add this once to your global CSS (`app/globals.css`) or rely on the
 * inline <style> block this file already renders (recommended):
 *
 *   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600;700&family=JetBrains+Mono:wght@400;500&family=Source+Serif+Pro:wght@400;600;700&display=swap');
 */
import { marked } from 'marked';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { AI_SOURCES, THEMES, FORMATS, CATEGORIES, ALL_TOOLS } from './config';
import { supabase } from './supabase';
import React, {
  useState, useEffect, useRef, useMemo, useCallback,
} from 'react';

import FormatterTool from './tools/universal-ai-formatter/FormatterTool';
import JsonTool from './tools/json-formatter-validator/JsonTool';
import HeicTool from './tools/heic-to-jpg-converter/HeicTool';
import SpaceStatusDashboard from './developer/SpaceStatusDashboard';
import {
  Sparkles, MessageSquare, Mic, Link2, Diff,
  Braces, Binary, Database, Layers, Table, Terminal,
  FileSearch, Archive, HeartPulse, FileText, ScanText, Camera, Shield,
  Image as ImageIcon, Eraser, Film, Copy, QrCode, Subtitles,
  GitCompare, Printer, Layers3, BookMarked,
  ChevronDown, ChevronRight, Search, X, ArrowRight, ArrowUpRight, Plus, Star,
  Command, Download, Loader, LayoutGrid, Menu, Wand2,
  GitBranch, Zap, Check, Globe,
  List, ListOrdered, Quote, Code, Link as LucideLink,
  AlignLeft, AlignCenter, AlignRight, Undo, Redo,
  Sun, Moon, Eye, EyeOff,
  CreditCard, AlertCircle, Info,
  Lock, FileDown
} from 'lucide-react';

// Map our legacy icon names to lucide-react components.
// This keeps the body code unchanged: `<Icon.Sparkles size={14} />` still works.
const Icon: Record<string, React.ComponentType<any>> = {
  Sparkles, MessageSquare, Mic, Link2, Diff,
  Braces, Binary, Database, Layers, Table, Terminal,
  FileSearch, Archive, HeartPulse, FileText, ScanText, Camera, Shield,
  Image: ImageIcon, Eraser, Film, Copy, QrCode, Subtitles,
  GitCompare, Printer, Layers3, BookMarked,
  ChevronDown, ChevronRight, Search, X, ArrowRight, ArrowUpRight, Plus, Star,
  Command, Download, Loader, Grid: LayoutGrid, Menu, Wand: Wand2,
  Github: GitBranch, Zap, Check, Globe,
  List, ListOrdered, Quote, Code,
  LinkIcon: LucideLink, Eraser2: Eraser,
  AlignLeft, AlignCenter, AlignRight, Undo, Redo,
  Sun, Moon, Eye, EyeOff,
  CreditCard, AlertCircle, Info,
  Lock, FileDown
};


export const GLOBAL_CSS = `:root {
    --bg:           oklch(0.135 0.005 250);
    --bg-elev-1:    oklch(0.175 0.008 250);
    --bg-elev-2:    oklch(0.21  0.010 250);
    --bg-hover:     oklch(0.235 0.012 250);

    --border:       oklch(0.275 0.012 250);
    --border-strong: oklch(0.34  0.014 250);

    --fg:           oklch(0.975 0.005 250);
    --fg-muted:     oklch(0.72  0.012 250);
    --fg-subtle:    oklch(0.55  0.014 250);
    --fg-dim:       oklch(0.42  0.012 250);

    --accent:       oklch(0.68 0.18 265);
    --pro:          oklch(0.78 0.16 75);

    /* Dynamic layouts additions */
    --bg-topbar:          oklch(0.135 0.005 250 / 0.78);
    --bg-overlay:         oklch(0.10 0.005 250 / 0.96);
    --bg-overlay-sticky:  oklch(0.10 0.005 250 / 0.9);
    --bg-overlay-modal:   oklch(0.06 0.005 250 / 0.6);
    --bg-modal:           oklch(0.18 0.008 250 / 0.95);
    --bg-paper-container: radial-gradient(60% 50% at 50% 0%, oklch(0.55 0.18 265 / 0.05), transparent 70%), oklch(0.14 0.005 250);
    
    --shadow-card:        inset 0 1px 0 oklch(1 0 0 / 0.02);
    --shadow-card-hover:  0 8px 32px oklch(0 0 0 / 0.4), 0 0 0 1px var(--border);
    --shadow-modal:       0 24px 80px oklch(0 0 0 / 0.6), 0 0 0 1px oklch(0 0 0 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.05);
  }

  :root.light {
    --bg:           oklch(0.985 0.003 250);
    --bg-elev-1:    oklch(0.965 0.004 250);
    --bg-elev-2:    oklch(0.94  0.005 250);
    --bg-hover:     oklch(0.915 0.006 250);

    --border:       oklch(0.885 0.006 250);
    --border-strong: oklch(0.81  0.010 250);

    --fg:           oklch(0.165 0.006 250);
    --fg-muted:     oklch(0.36  0.010 250);
    --fg-subtle:    oklch(0.48  0.012 250);
    --fg-dim:       oklch(0.60  0.010 250);

    --accent:       oklch(0.58 0.16 265);
    --pro:          oklch(0.62 0.14 75);

    /* Dynamic layouts additions */
    --bg-topbar:          oklch(0.985 0.003 250 / 0.78);
    --bg-overlay:         oklch(0.99 0.003 250 / 0.96);
    --bg-overlay-sticky:  oklch(0.99 0.003 250 / 0.9);
    --bg-overlay-modal:   oklch(0.06 0.005 250 / 0.4);
    --bg-modal:           oklch(0.995 0.003 250 / 0.95);
    --bg-paper-container: radial-gradient(60% 50% at 50% 0%, oklch(0.55 0.18 265 / 0.05), transparent 70%), var(--bg-elev-1);

    --shadow-card:        inset 0 1px 0 oklch(1 0 0 / 0.8), 0 2px 8px oklch(0 0 0 / 0.02);
    --shadow-card-hover:  0 12px 36px oklch(0 0 0 / 0.06), 0 0 0 1px var(--border-strong);
    --shadow-modal:       0 24px 80px oklch(0 0 0 / 0.08), 0 0 0 1px var(--border), inset 0 1px 0 oklch(1 0 0 / 0.8);
  }

  :root.light .kbd, :root.light .kbd-sm, :root.light .kbd-inline {
    background: oklch(0.93 0.005 250) !important;
  }
  :root.light .pro-badge {
    background: oklch(0.92 0.08 75 / 0.6) !important;
    border-color: oklch(0.62 0.14 75 / 0.4) !important;
    color: oklch(0.52 0.12 75) !important;
  }
  .top-link:hover {
    background: var(--bg-hover) !important;
    color: var(--fg) !important;
  }

  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: var(--bg);
    color: var(--fg);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.45;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    font-feature-settings: "cv11", "ss01", "ss03";
    min-height: 100%;
  }

  /* Ambient backdrop — subtle, full-page */
  body::before {
    content: "";
    position: fixed; inset: 0;
    pointer-events: none; z-index: 0;
    background:
      radial-gradient(1000px 700px at 0% -10%, oklch(0.28 0.08 265 / 0.30), transparent 60%),
      radial-gradient(900px 700px at 100% -10%, oklch(0.26 0.07 305 / 0.22), transparent 60%),
      radial-gradient(800px 800px at 50% 110%, oklch(0.24 0.06 200 / 0.15), transparent 60%);
  }

  :root.light body::before {
    background:
      radial-gradient(1000px 700px at 0% -10%, oklch(0.85 0.08 265 / 0.14), transparent 60%),
      radial-gradient(900px 700px at 100% -10%, oklch(0.85 0.07 305 / 0.10), transparent 60%),
      radial-gradient(800px 800px at 50% 110%, oklch(0.88 0.06 200 / 0.08), transparent 60%);
  }
  /* Tiny grain texture */
  body::after {
    content: "";
    position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.025;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  }
  .app-root { position: relative; z-index: 1; }

  .glass-card {
    background: linear-gradient(180deg, oklch(0.20 0.04 265 / 0.55), oklch(0.16 0.02 265 / 0.35));
    border: 1px solid oklch(0.40 0.08 265 / 0.35);
    box-shadow: 0 20px 50px oklch(0.15 0.08 265 / 0.15), inset 0 1px 0 oklch(1 0 0 / 0.05);
    border-radius: 16px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .glass-card:hover {
    border-color: oklch(0.45 0.10 265 / 0.5);
    box-shadow: 0 24px 60px oklch(0.15 0.08 265 / 0.22);
  }

  :root.light .glass-card {
    background: linear-gradient(180deg, oklch(0.965 0.004 250 / 0.8), oklch(0.94 0.005 250 / 0.6));
    border: 1px solid oklch(0.55 0.08 265 / 0.15);
    box-shadow: 0 20px 50px oklch(250 0 0 / 0.03), inset 0 1px 0 oklch(1 0 0 / 0.8);
  }
  :root.light .glass-card:hover {
    border-color: oklch(0.55 0.08 265 / 0.25);
    box-shadow: 0 24px 60px oklch(250 0 0 / 0.06);
  }

  /* Resets / utilities */
  .reset { all: unset; }
  .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 6px;
  }

  /* Keyboard chips */
  .kbd, .kbd-sm, .kbd-inline {
    font-family: 'JetBrains Mono', monospace;
    background: oklch(0.23 0.010 250);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--fg-muted);
    line-height: 1;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .kbd        { font-size: 10.5px; padding: 3px 5px; min-width: 18px; height: 18px; }
  .kbd-sm     { font-size: 9.5px;  padding: 2px 4px; min-width: 16px; height: 14px; }
  .kbd-inline { font-size: 10.5px; padding: 1px 5px; margin: 0 2px; vertical-align: 1px; }

  /* Pro badge */
  .pro-badge {
    font-size: 9.5px; font-weight: 600; letter-spacing: 0.06em;
    padding: 2px 6px; border-radius: 999px;
    color: var(--pro);
    background: oklch(0.28 0.06 75 / 0.40);
    border: 1px solid oklch(0.45 0.10 75 / 0.5);
    text-transform: uppercase;
    line-height: 1;
    display: inline-block;
  }

  /* Hot pulse */
  .hot-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: oklch(0.78 0.16 25);
    box-shadow: 0 0 0 0 oklch(0.78 0.16 25 / 0.6);
    animation: pulse 1.8s ease-out infinite;
    display: inline-block;
    flex-shrink: 0;
  }
  @keyframes pulse {
    0%   { box-shadow: 0 0 0 0 oklch(0.78 0.16 25 / 0.55); }
    100% { box-shadow: 0 0 0 8px oklch(0.78 0.16 25 / 0); }
  }

  /* Shimmer */
  .shimmer {
    background: linear-gradient(90deg, oklch(0.28 0.010 250), oklch(0.36 0.014 250) 50%, oklch(0.28 0.010 250));
    background-size: 200% 100%;
    animation: shimmer 1.4s linear infinite;
    border-radius: 3px;
  }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

  /* Entrance animations */
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fade-in-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @keyframes scale-in { from { opacity: 0; transform: scale(0.97) translateY(-4px); } to { opacity: 1; transform: none; } }
  .fade-in      { animation: fade-in 0.20s ease both; }
  .fade-in-up   { animation: fade-in-up 0.32s cubic-bezier(.2,.7,.2,1) both; }
  .scale-in     { animation: scale-in 0.22s cubic-bezier(.2,.7,.2,1) both; }

  /* Top-bar links + buttons hovers */
  .top-link:hover { background: oklch(0.20 0.008 250); color: var(--fg); }
  .launcher-pill:hover { background: oklch(0.24 0.010 250 / 0.85); border-color: var(--border-strong); }
  .search-btn:hover { background: oklch(0.23 0.010 250 / 0.8); border-color: var(--border-strong); color: var(--fg); }
  .footer-link:hover { color: var(--fg); }
  .footer-social:hover { background: oklch(0.24 0.012 250); color: var(--fg); }

  /* WYSIWYG paper area — styled like the printed document */
  .paper h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 6px; line-height: 1.15; }
  .paper h2 { font-size: 19px; font-weight: 600; letter-spacing: -0.015em; margin: 24px 0 8px; }
  .paper h3 { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; margin: 18px 0 6px; }
  .paper p  { margin: 0 0 12px; }
  .paper ul, .paper ol { margin: 0 0 14px; padding-left: 22px; }
  .paper li { margin: 4px 0; }
  .paper blockquote {
    margin: 14px 0;
    padding: 6px 0 6px 16px;
    border-left: 3px solid oklch(0.62 0.18 265);
    color: oklch(0.32 0.008 250);
    font-style: italic;
  }
  .paper code {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.88em;
    padding: 1px 5px;
    background: oklch(0.92 0.005 250);
    border-radius: 3px;
  }
  .paper pre {
    font-family: "JetBrains Mono", monospace;
    background: oklch(0.93 0.005 250);
    padding: 12px 14px;
    border-radius: 6px;
    margin: 12px 0;
    overflow-x: auto;
    font-size: 12.5px;
    white-space: pre-wrap;
  }
  .paper a { color: oklch(0.50 0.16 265); text-decoration: underline; text-decoration-color: oklch(0.50 0.16 265 / 0.4); }
  .paper hr { border: none; border-top: 1px solid oklch(0.85 0.005 250); margin: 18px 0; }

.paper table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.95em; }
  .paper th, .paper td { border: 1px solid oklch(0.85 0.01 250); padding: 10px 14px; text-align: left; }
  .paper th { background: oklch(0.95 0.005 250); font-weight: 600; color: oklch(0.20 0.01 250); }
  .paper tr:nth-child(even) { background: oklch(0.98 0.002 250); }

  /* Academic theme tweaks */
  .paper-academic h1 { font-weight: 700; }
  .paper-academic h2 { font-style: italic; font-weight: 600; }
  .paper-academic blockquote { font-style: italic; }

  /* Minimalist theme tweaks */
  .paper-minimalist h1 { font-size: 22px; font-weight: 700; }
  .paper-minimalist h2 { font-size: 16px; }
  .paper-minimalist blockquote { border-left-style: dashed; border-left-color: oklch(0.40 0.005 250); font-style: normal; }
  .paper-minimalist code { background: oklch(0.90 0.005 250); }

  /* Empty state when editor has no content */
  .paper[contenteditable="true"]:empty::before {
    content: 'Start writing…';
    color: oklch(0.55 0.005 250);
  }
  .paper[contenteditable="true"]:focus { outline: none; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: oklch(0.30 0.012 250); border-radius: 999px;
    border: 2px solid var(--bg);
  }
  ::-webkit-scrollbar-thumb:hover { background: oklch(0.42 0.014 250); }

  /* ---------------- Responsive ---------------- */

  /* Tablet — keep launcher pill but shrink */
  @media (max-width: 1024px) {
    .hero-grid { gap: 36px !important; }
    .tool-grid { grid-template-columns: 1fr !important; }
  }

  /* Mobile — collapse hero, hide marketing top-links, switch to single column */
  @media (max-width: 768px) {
    .hero-grid { grid-template-columns: 1fr !important; }
    .hero-demo-wrap { order: -1; }
    .top-link { display: none !important; }
    .search-btn span { display: none; }
    .search-btn { min-width: 0 !important; padding: 7px 10px !important; }
    .demo-split { grid-template-columns: 1fr !important; }
    .demo-split > div:first-child { border-right: none !important; border-bottom: 1px solid var(--border); }
    .preview-grid { grid-template-columns: 1fr !important; }
    .footer-grid { grid-template-columns: 1fr 1fr !important; }
    .launcher-pill { padding: 7px 10px !important; }
    .launcher-pill span:nth-of-type(2) { display: none; }
    .landing-nav { padding: 0 20px !important; }
    .landing-nav-links { display: none !important; }
    .pricing-grid { grid-template-columns: 1fr !important; }
    .featured-grid { grid-template-columns: 1fr !important; }
    .featured-grid > div:last-child { justify-self: start; }
    .shelf-header h2 { display: none; }
    .mobile-menu-btn { display: inline-flex !important; }
    .main-upgrade-btn { display: none !important; }
  }

  @media (max-width: 480px) {
    .footer-grid { grid-template-columns: 1fr !important; }
    .launcher-pill { display: none !important; }
  }`;

// ===========================================================================
// Data + tools registry (replaces icons.jsx)
// ===========================================================================

/* ---------- Tools data ---------- */
/* Each category has its own accent hue so the gallery doesn't read as 25 identical cards. */


function fuzzyMatch(query: string, target: string) {
  if (!query) return { score: 1, matched: false };
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return { score: 100 - t.indexOf(q), matched: true };
  /* loose char-in-order match */
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  if (qi === q.length) return { score: 1, matched: true };
  return { score: 0, matched: false };
}

function searchTools(query: string) {
  if (!query.trim()) return ALL_TOOLS;
  return ALL_TOOLS
    .map(t => {
      const a = fuzzyMatch(query, t.name);
      const b = fuzzyMatch(query, t.tagline);
      const c = fuzzyMatch(query, t.categoryLabel);
      const score = Math.max(a.score, b.score * 0.7, c.score * 0.5);
      return { ...t, _score: score };
    })
    .filter(t => t._score > 0)
    .sort((a, b) => b._score - a._score);
}

// ===========================================================================
// Core (TopBar, CommandPalette, Launcher, ToolCard) — from app-core.jsx
// ===========================================================================

/* =========================================================================
   Tiny utilities
   ========================================================================= */

function useKeydown(handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}

function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [locked]);
}

/* Subtle category-tinted background swatch for icon containers */
const isLightMode = () => typeof document !== 'undefined' && document.documentElement.classList.contains('light');

const tint = (hue: number, l?: number, c?: number, alpha?: number) => {
  const light = isLightMode();
  const finalL = l !== undefined ? (light ? 1 - l * 0.7 : l) : (light ? 0.94 : 0.30);
  const finalC = c !== undefined ? (light ? c * 0.7 : c) : (light ? 0.04 : 0.06);
  const finalA = alpha !== undefined ? alpha : 0.55;
  return `oklch(${finalL} ${finalC} ${hue} / ${finalA})`;
};

const tintFg = (hue: number) => {
  return isLightMode() ? `oklch(0.50 0.18 ${hue})` : `oklch(0.82 0.13 ${hue})`;
};

const tintBorder = (hue: number) => {
  return isLightMode() ? `oklch(0.75 0.08 ${hue} / 0.35)` : `oklch(0.45 0.10 ${hue} / 0.45)`;
};

/* =========================================================================
   Top bar — sticky, blurred, optional contrast
   ========================================================================= */

interface TopBarProps {
  onOpenPalette: () => void;
  onOpenLauncher: () => void;
  onHome: () => void;
  activeTool: any;
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
  onShowPaywall: () => void;
  onOpenTool: (id: string) => void;
}

function TopBar({
  onOpenPalette, onOpenLauncher, onHome, activeTool, scrolled, theme, onToggleTheme,
  brandName, setBrandName, sessionUser, isAnonUser, userPlan, onOpenAuthModal, onSignOut, onShowPaywall, onOpenTool
}: TopBarProps) {
  const isPremium = userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin';
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      height: 56,
      display: 'flex', alignItems: 'center',
      padding: '0 20px',
      gap: 14,
      background: scrolled ? 'var(--bg-topbar)' : 'transparent',
      borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
      backdropFilter: scrolled ? 'blur(20px) saturate(140%)' : 'none',
      transition: 'background 0.25s, border-color 0.25s, backdrop-filter 0.25s',
    }}>
      {/* Brand Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        color: 'inherit',
      }}>
        {isEditingBrand ? (
          <>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px oklch(0.50 0.10 280 / 0.5), 0 4px 14px oklch(0.50 0.20 280 / 0.4)',
            }}>
              <Icon.Command size={14} strokeWidth={2.2} style={{ color: 'white' }} />
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
              onHome(); 
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
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px oklch(0.50 0.10 280 / 0.5), 0 4px 14px oklch(0.50 0.20 280 / 0.4)',
              cursor: 'pointer',
            }}>
              <Icon.Command size={14} strokeWidth={2.2} style={{ color: 'white' }} />
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

      {/* Tools launcher pill — center on desktop, hidden on mobile (use ⌘K instead) */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <button onClick={onOpenLauncher} className="reset launcher-pill" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 14px 7px 12px',
          background: 'var(--bg-elev-1)',
          border: '1px solid var(--border)',
          borderRadius: 999,
          fontSize: 13, fontWeight: 500,
          color: 'var(--fg)',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
        }}>
          <Icon.Grid size={13} strokeWidth={2} style={{ color: 'var(--fg-muted)' }} />
          <span>{activeTool ? activeTool.name : 'Browse all tools'}</span>
          <Icon.ChevronDown size={12} style={{ color: 'var(--fg-subtle)' }} />
        </button>
      </div>

      {/* Right cluster */}
      <button onClick={onOpenPalette} className="reset search-btn" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px 7px 12px',
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        fontSize: 12.5,
        color: 'var(--fg-muted)',
        cursor: 'pointer',
        minWidth: 180,
      }}>
        <Icon.Search size={13} />
        <span style={{ flex: 1, textAlign: 'left' }}>Search tools…</span>
        <kbd className="kbd">⌘K</kbd>
      </button>

      <Link href="/pricing" className="reset top-link" style={topLink}>Pricing</Link>
      <Link href="/docs" className="reset top-link" style={topLink}>Docs</Link>
      <Link href="/api" className="reset top-link" style={topLink}>APIs</Link>
      <Link href="/developer" className="reset top-link" style={topLink}>Developer API</Link>

      {/* Auth State */}
      {sessionUser && !isAnonUser ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {(() => {
            const userDisplayName = sessionUser.user_metadata?.name || sessionUser.user_metadata?.username || sessionUser.email.split('@')[0];
            return (
              <button 
                onClick={() => onOpenTool('account')} 
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
          <button onClick={onSignOut} className="reset top-link" style={topLink}>Sign Out</button>
        </div>
      ) : (
        <button onClick={onOpenAuthModal} className="reset top-link" style={{ ...topLink, color: 'var(--accent)', fontWeight: 600 }}>Sign In / Up</button>
      )}

      {!isPremium && (
        <button onClick={onShowPaywall} className="reset main-upgrade-btn" style={{
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

      {/* Mobile Menu Toggle Button */}
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

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: 56, left: 0, right: 0,
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
            <Link 
              href="/developer" 
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: 14, color: 'var(--fg)', padding: '10px 12px', borderRadius: 8, textDecoration: 'none', background: 'var(--bg-elev-1)', border: '1px solid var(--border)', marginTop: 8 }}
            >
              Developer API
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
                  <button 
                    onClick={() => {
                      onOpenTool('account');
                      setMobileMenuOpen(false);
                    }}
                    style={{
                      flex: 1, padding: '10px',
                      background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                      borderRadius: 8, color: 'white', fontWeight: 500, fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    Account Settings
                  </button>
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

            {!isPremium && (
              <button 
                onClick={() => {
                  onShowPaywall();
                  setMobileMenuOpen(false);
                }}
                style={{
                  padding: '10px',
                  background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
                  border: 'none', borderRadius: 8,
                  color: 'white', fontWeight: 600, fontSize: 13.5,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px oklch(0.50 0.20 280 / 0.3)',
                  marginTop: 4,
                }}
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

const topLink = {
  fontSize: 13, color: 'var(--fg-muted)',
  padding: '6px 8px', borderRadius: 6,
  textDecoration: 'none', cursor: 'pointer',
};

/* =========================================================================
   Command palette (⌘K)
   ========================================================================= */

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
}

function CommandPalette({ open, onClose, onPick }: CommandPaletteProps) {
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchTools(q).slice(0, 12), [q]);

  // Global Escape key handler — works even when input is not focused
  useKeydown(useCallback((e: KeyboardEvent) => {
    if (open && e.key === 'Escape') onClose();
  }, [open, onClose]));

  useEffect(() => {
    if (open) {
      setQ('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => { setCursor(0); }, [q]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-row="${cursor}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  useBodyLock(open);

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[cursor]) onPick(results[cursor].id);
    }
  }

  if (!open) return null;

  return (
    <div className="fade-in" onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'var(--bg-overlay-modal)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: 'min(15vh, 120px)',
    }}>
      <div onClick={e => e.stopPropagation()} className="scale-in" style={{
        width: 'min(640px, calc(100vw - 32px))',
        background: 'var(--bg-modal)',
        border: '1px solid var(--border-strong)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden',
      }}>
        {/* Input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
        }}>
          <Icon.Search size={16} style={{ color: 'var(--fg-subtle)' }} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Jump to a tool, search by what it does…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--fg)', fontSize: 15,
              fontFamily: 'inherit',
            }}
          />
          {q && (
            <button onClick={() => setQ('')} className="reset" style={{
              fontSize: 11, color: 'var(--fg-muted)',
              padding: '3px 7px', borderRadius: 4,
              background: 'var(--bg-elev-2)', cursor: 'pointer',
            }}>clear</button>
          )}
          <kbd
            onClick={onClose}
            className="kbd"
            style={{
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.borderColor = 'var(--border-strong)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '';
              e.currentTarget.style.borderColor = '';
            }}
            title="Close Search (Esc)"
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{
          maxHeight: '50vh',
          overflowY: 'auto',
          padding: 6,
        }}>
          {results.length === 0 ? (
            <div style={{
              padding: '40px 20px', textAlign: 'center',
              color: 'var(--fg-subtle)', fontSize: 13,
            }}>
              No tools match <span className="mono" style={{ color: 'var(--fg-muted)' }}>"{q}"</span>
            </div>
          ) : results.map((t: any, i: number) => {
            const Ico = Icon[t.icon];
            const active = i === cursor;
            return (
              <button key={t.id} data-row={i}
                onClick={() => onPick(t.id)}
                onMouseEnter={() => setCursor(i)}
                className="reset"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: active ? 'var(--bg-hover)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 7,
                  background: tint(t.hue),
                  border: `1px solid ${tintBorder(t.hue)}`,
                  color: tintFg(t.hue),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Ico size={14} strokeWidth={1.8} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fg)' }}>{t.name}</span>
                    {t.pro && <span className="pro-badge" style={{ fontSize: 9 }}>PRO</span>}
                  </div>
                  <div style={{
                    fontSize: 11.5, color: 'var(--fg-subtle)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{t.tagline}</div>
                </div>
                <span style={{ fontSize: 10.5, color: 'var(--fg-dim)', letterSpacing: '0.04em' }} className="mono">
                  {t.categoryLabel}
                </span>
                {active && <Icon.ArrowRight size={13} style={{ color: 'var(--fg-muted)' }} />}
              </button>
            );
          })}
        </div>

        {/* Footer hints */}
        <div style={{
          padding: '8px 14px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14,
          fontSize: 11, color: 'var(--fg-dim)',
          background: 'var(--bg-elev-1)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <kbd className="kbd-sm">↑↓</kbd> navigate
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <kbd className="kbd-sm">↵</kbd> open
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <kbd className="kbd-sm">esc</kbd> close
          </span>
          <span style={{ flex: 1 }} />
          <span>{results.length} result{results.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   Launcher overlay — full-screen categorized grid
   ========================================================================= */

interface LauncherProps {
  open: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
}

function Launcher({ open, onClose, onPick }: LauncherProps) {
  useBodyLock(open);
  useKeydown(useCallback((e: KeyboardEvent) => {
    if (open && e.key === 'Escape') onClose();
  }, [open, onClose]));

  if (!open) return null;

  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0, zIndex: 90,
      background: 'var(--bg-overlay)',
      backdropFilter: 'blur(20px)',
      overflowY: 'auto',
    }}>
      {/* Top close bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 32px',
        background: 'linear-gradient(180deg, var(--bg-overlay-sticky), transparent)',
      }}>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--fg-dim)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
            Launcher
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg)', letterSpacing: '-0.02em', marginTop: 2 }}>
            All tools
          </div>
        </div>
        <button onClick={onClose} className="reset" style={{
          width: 36, height: 36, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-elev-1)',
          border: '1px solid var(--border)',
          color: 'var(--fg-muted)', cursor: 'pointer',
        }}>
          <Icon.X size={16} />
        </button>
      </div>

      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '8px 32px 80px',
      }}>
        {CATEGORIES.map(cat => (
          <section key={cat.id} className="fade-in-up" style={{ marginBottom: 56 }}>
            <header style={{
              display: 'flex', alignItems: 'baseline', gap: 14,
              marginBottom: 18,
              paddingBottom: 12,
              borderBottom: `1px solid ${cat.pro ? tintBorder(cat.hue) : 'var(--border)'}`,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: tintFg(cat.hue),
                boxShadow: `0 0 12px ${tintFg(cat.hue)}`,
              }} />
              <h2 style={{
                margin: 0, fontSize: 17, fontWeight: 600,
                color: cat.pro ? tintFg(cat.hue) : 'var(--fg)',
                letterSpacing: '-0.01em',
              }}>{cat.label}</h2>
              <span style={{ fontSize: 12.5, color: 'var(--fg-subtle)', flex: 1 }}>
                {cat.tagline}
              </span>
            </header>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}>
              {cat.tools.map(t => (
                <ToolCard key={t.id} tool={{ ...t, hue: cat.hue }} onClick={() => onPick(t.id)} compact />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   Tool card — gallery + launcher
   ========================================================================= */

interface ToolCardProps {
  tool: any;
  onClick: () => void;
  compact?: boolean;
  large?: boolean;
}

function ToolCard({ tool, onClick, compact, large }: ToolCardProps) {
  const Ico = Icon[tool.icon];
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="reset"
      style={{
        cursor: 'pointer', textAlign: 'left',
        display: 'flex', flexDirection: 'column', gap: large ? 16 : 12,
        padding: large ? '22px 22px 20px' : '16px 16px 14px',
        background: hover ? 'var(--bg-hover)' : 'var(--bg-elev-1)',
        border: '1px solid',
        borderColor: hover ? tintBorder(tool.hue) : 'var(--border)',
        borderRadius: 12,
        position: 'relative', overflow: 'hidden',
        transition: 'background 0.18s, border-color 0.18s, transform 0.18s',
        transform: hover ? 'translateY(-1px)' : 'none',
        boxShadow: hover ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
      }}>
      {/* Soft category glow on hover */}
      <span style={{
        position: 'absolute', inset: -1, pointerEvents: 'none',
        background: hover
          ? `radial-gradient(280px 140px at 20% 0%, ${tint(tool.hue, 0.45, 0.10, 0.18)}, transparent 70%)`
          : 'none',
        transition: 'opacity 0.2s',
        opacity: hover ? 1 : 0,
        borderRadius: 12,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        <div style={{
          width: large ? 40 : 34, height: large ? 40 : 34, borderRadius: 9,
          background: tint(tool.hue),
          border: `1px solid ${tintBorder(tool.hue)}`,
          color: tintFg(tool.hue),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Ico size={large ? 18 : 16} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              fontSize: large ? 16 : 14, fontWeight: 600, color: 'var(--fg)',
              letterSpacing: '-0.01em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{tool.name}</span>
            {tool.hot && <span className="hot-dot" />}
            {tool.pro && <span className="pro-badge">PRO</span>}
          </div>
          <div style={{
            fontSize: 12.5, color: 'var(--fg-subtle)',
            marginTop: 2, lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>{tool.tagline}</div>
        </div>
        <Icon.ArrowUpRight size={14} style={{
          color: hover ? tintFg(tool.hue) : 'var(--fg-dim)',
          transition: 'color 0.18s, transform 0.18s',
          transform: hover ? 'translate(2px, -2px)' : 'none',
          flexShrink: 0,
        }} />
      </div>
    </button>
  );
}

// ===========================================================================
// Universal AI Formatter + WYSIWYG editor — from app-formatter.jsx
// ===========================================================================

// FormatterTool has been refactored into components/FormatterTool.tsx

// ===========================================================================
// Dashboard view (welcome, featured, shelves) — from app-home.jsx
// ===========================================================================

/* =========================================================================
   Welcome strip — confident, app-feeling header
   ========================================================================= */

interface WelcomeStripProps {
  onOpenLauncher: () => void;
  onOpenPalette: () => void;
}

function WelcomeStrip({ onOpenLauncher, onOpenPalette }: WelcomeStripProps) {
  const [now] = useState(() => new Date());
  const hour = now.getHours();
  const greeting = hour < 5 ? 'Up late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <section style={{
      padding: '40px 32px 28px',
      maxWidth: 1280, margin: '0 auto', width: '100%',
      boxSizing: 'border-box',
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 24,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{
            fontSize: 11.5, fontWeight: 600,
            color: 'var(--fg-dim)',
            letterSpacing: '0.10em', textTransform: 'uppercase',
            marginBottom: 10,
          }}>{greeting}, Riley</div>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(28px, 4vw, 40px)',
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            fontWeight: 600,
            color: 'var(--fg)',
          }}>
            What needs <span style={{
              fontFamily: '"Source Serif Pro", Georgia, serif',
              fontStyle: 'italic', fontWeight: 400,
              background: 'linear-gradient(110deg, oklch(0.92 0.04 265), oklch(0.78 0.16 285))',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              color: 'transparent',
            }}>cleaning up</span> today?
          </h1>
          <p style={{
            margin: '10px 0 0', fontSize: 14,
            color: 'var(--fg-muted)', maxWidth: 540,
          }}>
            Every utility is loaded and ready. Hit <kbd className="kbd-inline">⌘K</kbd> to jump to any of them, or pick one from the shelves below.
          </p>
        </div>

        {/* Inline quick actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onOpenPalette} className="reset" style={quickBtn}>
            <Icon.Search size={13} />
            <span>Quick find</span>
            <kbd className="kbd" style={{ marginLeft: 4 }}>⌘K</kbd>
          </button>
        </div>
      </div>

      {/* Mini stats row */}
      <div style={{
        display: 'flex', gap: 0, marginTop: 28,
        padding: '14px 0',
        borderTop: '1px solid var(--border)',
        flexWrap: 'wrap',
      }} className="dash-stats">
        {[
          { kpi: '14', label: 'days left in trial', tint: 75 },
          { kpi: '128', label: 'runs this month', tint: 265 },
          { kpi: '47ms', label: 'median launch', tint: 145, mono: true },
          { kpi: '0 B', label: 'data uploaded', tint: 195, mono: true },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '4px 24px',
            borderLeft: i === 0 ? 'none' : '1px solid var(--border)',
            flex: '1 1 140px',
          }}>
            <div style={{
              fontSize: 20, fontWeight: 600,
              letterSpacing: '-0.02em', color: 'var(--fg)',
              fontFamily: s.mono ? '"JetBrains Mono", monospace' : 'inherit',
            }}>{s.kpi}</div>
            <div style={{
              fontSize: 11.5, color: 'var(--fg-muted)',
              marginTop: 2,
            }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

const quickBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '8px 12px',
  background: 'oklch(0.20 0.008 250 / 0.6)',
  border: '1px solid var(--border)',
  color: 'var(--fg)',
  fontSize: 13, fontWeight: 500,
  borderRadius: 8, cursor: 'pointer',
};

/* =========================================================================
   Featured tool — large card, gives the dashboard a focal point
   ========================================================================= */

interface FeaturedToolProps {
  onPick: (id: string) => void;
}

function FeaturedTool({ onPick }: FeaturedToolProps) {
  const featured = ALL_TOOLS.find(t => t.id === 'universal-ai-formatter');
  if (!featured) return null;
  const Ico = Icon[featured.icon];

  return (
    <section style={{
      maxWidth: 1280, margin: '0 auto',
      padding: '12px 32px 32px',
    }}>
      <button onClick={() => onPick(featured.id)} className="reset" style={{
        cursor: 'pointer', width: '100%',
        display: 'block', textAlign: 'left',
        padding: 'clamp(24px, 3vw, 36px)',
        background: 'linear-gradient(120deg, oklch(0.22 0.05 265 / 0.55) 0%, oklch(0.18 0.03 290 / 0.40) 100%)',
        border: '1px solid oklch(0.40 0.08 265 / 0.45)',
        borderRadius: 16,
        position: 'relative', overflow: 'hidden',
        transition: 'transform 0.2s, border-color 0.2s',
        boxShadow: '0 16px 48px oklch(0.25 0.15 265 / 0.18), inset 0 1px 0 oklch(1 0 0 / 0.04)',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(450px 220px at 90% 50%, oklch(0.60 0.18 285 / 0.20), transparent 70%)',
        }}/>
        <div style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 24, alignItems: 'center',
        }} className="featured-grid">
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '4px 10px 4px 6px',
              borderRadius: 999,
              background: 'oklch(0.30 0.08 265 / 0.4)',
              border: '1px solid oklch(0.45 0.10 265 / 0.4)',
              fontSize: 11, fontWeight: 500,
              color: 'oklch(0.88 0.10 265)',
              marginBottom: 14,
            }}>
              <span className="hot-dot"/>
              <span>Featured tool · most opened this week</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              marginBottom: 10,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: tint(featured.hue, 0.35, 0.08, 0.45),
                border: `1px solid ${tintBorder(featured.hue)}`,
                color: tintFg(featured.hue),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Ico size={19} strokeWidth={1.8}/>
              </div>
              <h2 style={{
                margin: 0, fontSize: 'clamp(20px, 2.4vw, 28px)',
                fontWeight: 600, letterSpacing: '-0.02em',
                color: 'var(--fg)',
              }}>{featured.name}</h2>
            </div>
            <p style={{
              margin: 0, fontSize: 15,
              color: 'var(--fg-muted)', lineHeight: 1.5,
              maxWidth: 560,
            }}>
              Paste raw output from ChatGPT, Claude, or Gemini and get a beautifully themed PDF, Word doc, or HTML — runs entirely on-device.
            </p>
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 18px',
            background: 'linear-gradient(180deg, oklch(0.97 0.005 250), oklch(0.86 0.005 250))',
            color: 'oklch(0.14 0.008 250)',
            fontWeight: 500, fontSize: 14,
            borderRadius: 10,
            boxShadow: '0 1px 0 oklch(1 0 0 / 0.5) inset, 0 1px 3px oklch(0 0 0 / 0.5)',
          }}>
            Open <Icon.ArrowRight size={14} strokeWidth={2.2}/>
          </div>
        </div>
      </button>
    </section>
  );
}

/* =========================================================================
   Tool shelf — categorized gallery
   ========================================================================= */

interface ShelfProps {
  category: any;
  onPick: (id: string) => void;
}

function Shelf({ category, onPick }: ShelfProps) {
  const isPro = category.pro;
  return (
    <section style={{ marginBottom: 48 }}>
      <header style={{
        display: 'flex', alignItems: 'baseline', gap: 14,
        marginBottom: 18,
      }} className="shelf-header">
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: tintFg(category.hue),
          boxShadow: `0 0 10px ${tintFg(category.hue)}`,
          marginRight: -4,
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: 11, fontWeight: 600,
          letterSpacing: '0.10em', textTransform: 'uppercase',
          color: isPro ? tintFg(category.hue) : 'var(--fg-dim)',
          flexShrink: 0,
        }}>
          {isPro && <Icon.Star size={10} strokeWidth={2} style={{ marginRight: 4, display: 'inline', verticalAlign: '-1px' }} />}
          {category.label}
        </span>
        <h2 style={{
          margin: 0, fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 600,
          letterSpacing: '-0.015em', color: 'var(--fg)',
          textWrap: 'balance',
        }}>{category.tagline}</h2>
        <div style={{ flex: 1 }} />
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 14,
        ...(isPro ? {
          padding: 18,
          background: `linear-gradient(180deg, ${tint(category.hue, 0.30, 0.06, 0.10)}, ${tint(category.hue, 0.22, 0.04, 0.04)})`,
          border: `1px solid ${tintBorder(category.hue)}`,
          borderRadius: 14,
        } : {}),
      }}>
        {category.tools.map((t: any) => (
          <ToolCard key={t.id} tool={{ ...t, hue: category.hue }} onClick={() => onPick(t.id)} />
        ))}
      </div>
    </section>
  );
}

/* =========================================================================
   Dashboard composer
   ========================================================================= */

interface HomeProps {
  onOpenTool: (id: string) => void;
  onOpenLauncher: () => void;
  onOpenPalette: () => void;
}

function Home({ onOpenTool, onOpenLauncher, onOpenPalette }: HomeProps) {
  return (
    <div className="fade-in">
      <WelcomeStrip onOpenLauncher={onOpenLauncher} onOpenPalette={onOpenPalette} />
      <FeaturedTool onPick={onOpenTool} />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px 56px' }}>
        {CATEGORIES.map(cat => (
          <Shelf key={cat.id} category={cat} onPick={onOpenTool} />
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// Landing page — from app-landing.jsx
// ===========================================================================

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
          { label: 'Developer API', path: '/developer' },
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
            <Link 
              href="/developer" 
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: 14, color: 'var(--fg)', padding: '10px 12px', borderRadius: 8, textDecoration: 'none', background: 'var(--bg-elev-1)', border: '1px solid var(--border)', marginTop: 8 }}
            >
              Developer API
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
   Live AI Formatter demo (moved from home)
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

      {/* Demo moved to its own tool page — landing focuses on positioning, not product. */}
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
        gridTemplateColumns: '1fr 1fr',
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
              ['5 free uses / day on Tier 1', true],
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
   Composer
   ========================================================================= */

interface LandingProps {
  onLaunch: () => void;
  onEnterprise: () => void;
  onBrowseTools: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  brandName: string;
  setBrandName: (name: string) => void;
  pricingData: any;
  onShowPaywall: () => void;
  sessionUser: any;
  isAnonUser: boolean;
  userPlan: string;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
}

function Landing({ onLaunch, onEnterprise, onBrowseTools, theme, onToggleTheme, brandName, setBrandName, pricingData, onShowPaywall, sessionUser, isAnonUser, userPlan, onOpenAuthModal, onSignOut }: LandingProps) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fade-in">
      <LandingNav onLaunch={onLaunch} scrolled={scrolled} theme={theme} onToggleTheme={onToggleTheme} brandName={brandName} setBrandName={setBrandName} sessionUser={sessionUser} isAnonUser={isAnonUser} userPlan={userPlan} onOpenAuthModal={onOpenAuthModal} onSignOut={onSignOut} />
      <LandingHero onLaunch={onLaunch} />
      <SuitePreview onLaunch={onLaunch} />
      <ApiShowcase onLaunch={onLaunch} brandName={brandName} />
      <Pricing onLaunch={onLaunch} onEnterprise={onEnterprise} brandName={brandName} pricingData={pricingData} onShowPaywall={onShowPaywall} />
      <ClosingCTA onLaunch={onLaunch} onBrowseTools={onBrowseTools} />
    </div>
  );
}

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
            <Link href="/developer" className="reset" style={{
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

// ===========================================================================
// Placeholder tool, Footer, App router — from app-tool.jsx
// ===========================================================================

// JsonTool has been refactored into components/JsonTool.tsx

interface PlaceholderToolProps {
  tool: any;
}

function PlaceholderTool({ tool }: PlaceholderToolProps) {
  const Ico = Icon[tool.icon];
  return (
    <div style={{
      maxWidth: 1200, margin: '0 auto',
      padding: '40px 32px 80px',
    }} className="fade-in">
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontSize: 11.5, color: 'var(--fg-dim)',
        marginBottom: 14,
      }} className="mono">
        <span style={{ color: tintFg(tool.hue) }}>{tool.categoryLabel}</span>
        <span>/</span>
        <span style={{ color: 'var(--fg-muted)' }}>{tool.id}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 12,
          background: tint(tool.hue),
          border: `1px solid ${tintBorder(tool.hue)}`,
          color: tintFg(tool.hue),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Ico size={26} strokeWidth={1.8}/>
        </div>
        <div>
          <h1 style={{
            margin: 0, fontSize: 30, fontWeight: 600,
            letterSpacing: '-0.022em',
          }}>{tool.name} {tool.pro && <span className="pro-badge" style={{ verticalAlign: 'middle', marginLeft: 6 }}>PRO</span>}</h1>
          <p style={{
            margin: '6px 0 0',
            fontSize: 14, color: 'var(--fg-muted)',
          }}>{tool.tagline}</p>
        </div>
      </div>

      <div style={{
        marginTop: 32,
        padding: '52px 32px',
        background: 'oklch(0.175 0.008 250 / 0.5)',
        border: '1px dashed var(--border-strong)',
        borderRadius: 14,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 11.5, fontWeight: 500, color: 'var(--fg-dim)',
          letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 12,
        }}>UI shell only</div>
        <p style={{
          margin: '0 auto', maxWidth: 480,
          fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.55,
        }}>
          This tool is wired into navigation but its detail interface hasn't been built yet. The <b style={{ color: 'var(--fg)' }}>Universal AI Formatter</b> is the fully designed example — open <kbd className="kbd-inline">⌘K</kbd> and search for it.
        </p>
      </div>
    </div>
  );
}

/* =========================================================================
   Footer
   ========================================================================= */

interface FooterProps {
  onBackToLanding: (() => void) | null;
  brandName: string;
}

function Footer({ onBackToLanding, brandName }: FooterProps) {
  return (
    <footer style={{
      marginTop: 60,
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-elev-1)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '36px 32px',
        display: 'grid',
        gridTemplateColumns: '1.4fr repeat(3, 1fr)',
        gap: 32,
      }} className="footer-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon.Command size={13} strokeWidth={2.2} style={{ color: 'white' }}/>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{brandName}</span>
          </div>
          <p style={{
            margin: 0, fontSize: 12.5, color: 'var(--fg-subtle)',
            maxWidth: 280, lineHeight: 1.55,
          }}>
            The small utilities you keep googling, gathered into one keyboard-driven workspace. On-device by default.
          </p>
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            <a className="reset footer-social" href="#" style={socialStyle}><Icon.Github size={13}/></a>
            <a className="reset footer-social" href="#" style={socialStyle}><Icon.Globe size={13}/></a>
          </div>
        </div>

        <FooterCol title="Tools" links={[
          { label: 'Text & AI', path: '/category/text' },
          { label: 'Developer & Code', path: '/category/dev' },
          { label: 'Files & Data', path: '/category/files' },
          { label: 'Images & Media', path: '/category/media' },
          { label: 'Pro Vault', path: '/category/pro' }
        ]} />
        <FooterCol title="Product" links={[
          { label: 'Pricing', path: '/pricing' },
          { label: 'Changelog', path: '/changelog' },
          { label: 'APIs', path: '/api' },
          { label: 'Developer API', path: '/developer' },
          { label: 'Status', path: '/dashboard' },
          { label: 'Privacy', path: '/privacy' }
        ]} />
        <FooterCol title="Company" links={[
          { label: 'About', path: '/about' },
          { label: 'Blog', path: '/blog' },
          { label: 'Docs', path: '/docs' },
          { label: 'Contact', path: '/contact' },
          { label: 'Changelog', path: '/changelog' }
        ]} />
      </div>
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '14px 32px',
        display: 'flex', alignItems: 'center', gap: 14,
        fontSize: 11.5, color: 'var(--fg-dim)',
        maxWidth: 1280, margin: '0 auto',
        flexWrap: 'wrap',
      }}>
        <span>© 2026 {brandName.toLowerCase()}, inc.</span>
        {onBackToLanding && (
          <button onClick={onBackToLanding} className="reset" style={{
            fontSize: 11.5, color: 'var(--fg-muted)',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 5,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'oklch(0.20 0.008 250)'; e.currentTarget.style.color = 'var(--fg)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fg-muted)'; }}
          >
            ← Back to marketing site
          </button>
        )}
        <span style={{ flex: 1 }} />
        <span className="mono">v0.4.2 · all systems normal</span>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'oklch(0.78 0.16 145)',
          boxShadow: '0 0 6px oklch(0.78 0.16 145)',
        }} />
      </div>
    </footer>
  );
}

const socialStyle = {
  width: 30, height: 30, borderRadius: 7,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'oklch(0.20 0.008 250)',
  border: '1px solid var(--border)',
  color: 'var(--fg-muted)',
  textDecoration: 'none', cursor: 'pointer',
};

interface FooterColProps {
  title: string;
  links: { label: string; path: string }[];
}

function FooterCol({ title, links }: FooterColProps) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 600,
        color: 'var(--fg)', marginBottom: 12,
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>{title}</div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {links.map(l => (
          <li key={l.label}>
            <Link href={l.path} className="footer-link" style={{
              fontSize: 12.5, color: 'var(--fg-muted)', textDecoration: 'none',
            }}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* =========================================================================
   CategoryHub Component
   ========================================================================= */
interface CategoryHubProps {
  categoryId: string;
  onOpenTool: (id: string) => void;
}

function CategoryHub({ categoryId, onOpenTool }: CategoryHubProps) {
  const category = CATEGORIES.find(c => c.id === categoryId);
  if (!category) return null;

  return (
    <div style={{
      maxWidth: 1200, margin: '40px auto 120px',
      padding: '0 32px', boxSizing: 'border-box',
    }} className="fade-in">
      <div style={{ marginBottom: 36 }}>
        <span style={{
          display: 'inline-block', fontSize: 11, fontWeight: 600,
          color: tintFg(category.hue), letterSpacing: '0.15em', textTransform: 'uppercase',
          marginBottom: 12,
        }} className="mono">
          Category Hub
        </span>
        <h1 style={{
          margin: 0, fontSize: 38, fontWeight: 600,
          letterSpacing: '-0.025em',
        }}>{category.label}</h1>
        <p style={{
          margin: '10px 0 0', fontSize: 15,
          color: 'var(--fg-muted)', maxWidth: 600, lineHeight: 1.5,
        }}>{category.tagline}</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {category.tools.map(t => (
          <ToolCard key={t.id} tool={{ ...t, hue: category.hue }} onClick={() => onOpenTool(t.id)} />
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   ComingSoonStub Component
   ========================================================================= */
interface ComingSoonStubProps {
  tool: any;
}

function ComingSoonStub({ tool }: ComingSoonStubProps) {
  const Ico = ImageIcon; // Fallback or icon lookup
  const activeHue = tool.hue ?? 265;
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  }

  return (
    <div style={{
      maxWidth: 680, margin: '60px auto 120px',
      textAlign: 'center',
    }} className="glass-card fade-in-up">
      <div style={{
        width: 64, height: 64, borderRadius: 14,
        background: `oklch(0.22 0.010 ${activeHue} / 0.8)`,
        border: `1px solid oklch(0.45 0.10 ${activeHue} / 0.4)`,
        color: `oklch(0.82 0.13 ${activeHue})`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        boxShadow: `0 0 32px oklch(0.78 0.16 ${activeHue} / 0.2)`,
      }}>
        <Sparkles size={28} strokeWidth={2} />
      </div>

      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 20,
          background: 'oklch(0.20 0.010 75 / 0.15)',
          border: '1px solid oklch(0.75 0.14 75 / 0.2)',
          fontSize: 11, fontWeight: 600, color: 'oklch(0.78 0.16 75)',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          marginBottom: 16,
        }} className="mono">
          Active Development
        </div>
      </div>

      <h1 style={{
        margin: 0, fontSize: 32, fontWeight: 600,
        letterSpacing: '-0.02em', lineHeight: 1.1,
        color: 'var(--fg)',
      }}>{tool.name}</h1>
      
      <p style={{
        margin: '12px auto 0', fontSize: 15,
        color: 'var(--fg-muted)', maxWidth: 480, lineHeight: 1.5,
      }}>
        {tool.tagline}. We are currently building the high-compute backend parser engine for this tool.
      </p>

      <div style={{
        margin: '36px auto', maxWidth: 400,
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--border)',
        borderRadius: 12, padding: '16px 20px',
        textAlign: 'left',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">
          Development Stage
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-muted)' }}>
            <span style={{ color: 'oklch(0.78 0.16 145)' }}>✓</span>
            <span>Frontend Component Structure</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-muted)' }}>
            <span style={{ color: 'oklch(0.78 0.16 145)' }}>✓</span>
            <span>Dynamic URL pSEO Indexing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg)' }}>
            <span style={{ color: `oklch(0.78 0.16 ${activeHue})` }}>⚡</span>
            <span style={{ fontWeight: 500 }}>Backend Parser Logic & Sandbox</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-dim)' }}>
            <span>○</span>
            <span>API Deployment & High-Compute Hook</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 440, margin: '0 auto' }}>
        {subscribed ? (
          <div style={{
            background: 'oklch(0.18 0.010 145 / 0.1)',
            border: '1px solid oklch(0.78 0.16 145 / 0.3)',
            borderRadius: 8, padding: '12px 18px',
            color: 'oklch(0.82 0.13 145)', fontSize: 13.5, fontWeight: 500,
          }} className="fade-in">
            🎉 You have successfully joined the beta waiting list!
          </div>
        ) : (
          <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email for beta access"
              style={{
                flex: 1, padding: '10px 14px',
                background: 'var(--bg-elev-1)',
                border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--fg)', fontSize: 13,
                outline: 'none',
              }}
            />
            <button type="submit" className="reset" style={{
              padding: '10px 16px',
              background: `linear-gradient(180deg, oklch(0.72 0.18 ${activeHue}), oklch(0.62 0.20 ${activeHue}))`,
              color: 'white', fontWeight: 500, fontSize: 13,
              borderRadius: 8, cursor: 'pointer',
              boxShadow: `0 1px 0 oklch(1 0 0 / 0.25) inset, 0 4px 12px oklch(0.50 0.20 ${activeHue} / 0.25)`,
            }}>
              Join Waitlist
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   PricingPage Component
   ========================================================================= */
interface PricingPageProps {
  onLaunch: () => void;
  onEnterprise: () => void;
}

function PricingPage({ onLaunch, onEnterprise }: PricingPageProps) {
  // Access global theme context safely from document if needed
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

  return (
    <div style={{
      maxWidth: 1200, margin: '40px auto 120px',
      padding: '0 32px', boxSizing: 'border-box',
      position: 'relative',
    }} className="fade-in">
      {/* Subpage ambient top-center glow */}
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 800, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
        opacity: isLight ? 0.08 : 0.15,
        zIndex: 0,
      }}/>

      <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
        <span style={eyebrow}>Monetization & Plans</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>Simple, transparent pricing</h1>
        <p style={sectionSubtitle}>Choose the perfect tier for your workflow. Get high-fidelity documents and parsed datasets instantly.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
        alignItems: 'stretch',
        maxWidth: 1080, margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Free Plan */}
        <div className="glass-card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">Free</div>
          <h2 style={{ fontSize: 24, fontWeight: 600, margin: '8px 0 16px', color: 'var(--fg)' }}>Free Plan</h2>
          <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, color: 'var(--fg)' }}>$0 <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--fg-dim)' }}>/ forever</span></div>
          <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', marginBottom: 24, minHeight: 40 }}>Perfect for quick daily copy-pastes and standard interactive tools.</p>
          <ul style={{ ...listStyle, marginBottom: 32 }}>
            <Feature on={true}>20 daily browser tool runs</Feature>
            <Feature on={true}>5 daily Sandbox API requests</Feature>
            <Feature on={true}>Standard document themes</Feature>
            <Feature on={true}>Mandatory brand watermarks</Feature>
            <Feature on={false}>Production API bearer keys</Feature>
          </ul>
          <button onClick={onLaunch} className="reset" style={{
            width: '100%', padding: '12px', borderRadius: 8,
            background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
            color: 'var(--fg)', fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
            textAlign: 'center', marginTop: 'auto',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
          >Get Started Free</button>
        </div>

        {/* Pro Plan */}
        <div className="glass-card" style={{
          borderColor: 'var(--accent)',
          boxShadow: isLight 
            ? '0 24px 80px oklch(0.58 0.16 265 / 0.08), inset 0 1px 0 oklch(1 0 0 / 0.8)' 
            : '0 24px 80px oklch(0.50 0.20 265 / 0.18), inset 0 1px 0 oklch(1 0 0 / 0.05)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 16, right: 16,
            background: 'var(--accent)', color: 'white',
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 12,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }} className="mono">Popular</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">Pro</div>
          <h2 style={{ fontSize: 24, fontWeight: 600, margin: '8px 0 16px', color: 'var(--fg)' }}>Pro Plan</h2>
          <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, color: 'var(--fg)' }}>$9 <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--fg-dim)' }}>/ month</span></div>
          <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', marginBottom: 24, minHeight: 40 }}>Complete interactive browser-level cockpit for heavy document workflows.</p>
          <ul style={{ ...listStyle, marginBottom: 32 }}>
            <Feature on={true} em={true}>Unlimited browser tool runs</Feature>
            <Feature on={true} em={true}>100 daily Production API requests</Feature>
            <Feature on={true} em={true}>Custom watermark removal</Feature>
            <Feature on={true} em={true}>Visual PDF Diff Checker</Feature>
            <Feature on={false}>Developer API Plan bounds</Feature>
          </ul>
          <button onClick={onLaunch} className="reset" style={{
            width: '100%', padding: '12px', borderRadius: 8,
            background: 'linear-gradient(180deg, oklch(0.72 0.18 265), oklch(0.62 0.20 265))',
            color: 'white', fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
            textAlign: 'center', marginTop: 'auto',
            boxShadow: '0 4px 14px oklch(0.50 0.20 265 / 0.3)',
          }}>Unlock Pro Vault</button>
        </div>

        {/* Developer Plan */}
        <div className="glass-card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'oklch(0.78 0.16 145)', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">Developer</div>
          <h2 style={{ fontSize: 24, fontWeight: 600, margin: '8px 0 16px', color: 'var(--fg)' }}>Developer Plan</h2>
          <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, color: 'var(--fg)' }}>$29 <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--fg-dim)' }}>/ month</span></div>
          <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', marginBottom: 24, minHeight: 40 }}>Direct programmatic integration, massive query capacity, and data webhooks.</p>
          <ul style={{ ...listStyle, marginBottom: 32 }}>
            <Feature on={true} em={true}><strong>All Pro Plan features included</strong></Feature>
            <Feature on={true} em={true}><strong>1,000 daily Production API requests</strong></Feature>
            <Feature on={true} em={true}><strong>Direct API keys console console</strong></Feature>
            <Feature on={true} em={true}>Custom webhooks and status callbacks</Feature>
            <Feature on={true} em={true}>Priority server computing resources</Feature>
          </ul>
          <button onClick={onLaunch} className="reset" style={{
            width: '100%', padding: '12px', borderRadius: 8,
            background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
            color: 'var(--fg)', fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
            textAlign: 'center', marginTop: 'auto',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
          >Get API Vault Keys</button>
        </div>
      </div>

      <p style={{
        textAlign: 'center', marginTop: 36,
        fontSize: 13, color: 'var(--fg-dim)',
        position: 'relative', zIndex: 1,
      }}>
        Need SOC2, SSO, or on-prem? <a href="#" onClick={(e) => { e.preventDefault(); onEnterprise(); }} style={{ color: 'var(--fg-muted)', textDecoration: 'underline', textDecorationColor: 'var(--border-strong)' }}>Talk to us about Enterprise</a>.
      </p>
    </div>
  );
}

/* =========================================================================
   AboutPage Component
   ========================================================================= */
interface AboutPageProps {
  onLaunch: () => void;
  brandName: string;
}

function AboutPage({ onLaunch, brandName }: AboutPageProps) {
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

  return (
    <div style={{
      maxWidth: 880, margin: '40px auto 120px',
      padding: '0 32px', boxSizing: 'border-box',
      position: 'relative',
    }} className="fade-in">
      {/* Subpage ambient top-center glow */}
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 800, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
        opacity: isLight ? 0.08 : 0.15,
        zIndex: 0,
      }}/>

      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <span style={eyebrow}>Monetization & Philosophy</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>The Global Utility SaaS</h1>
      </div>

      <div className="glass-card" style={{ position: 'relative', zIndex: 1, padding: '40px clamp(24px, 5vw, 48px)' }}>
        <div style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--fg-muted)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 16 }}>
            Welcome to <strong style={{ color: 'var(--fg)' }}>{brandName}</strong>—a collection of lightweight, blazing-fast, serverless-grade utility tools built directly for developers, creators, and professionals.
          </p>
          
          <h2 style={{ fontSize: 20, color: 'var(--fg)', fontWeight: 600, margin: '24px 0 8px', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Our Mission: Extreme Speed, Total Privacy</h2>
          <p>
            Most modern websites have become bloated, filled with megabytes of tracking pixels, advertising banners, and slow server-side loops. We believe that simple, daily file operations—like scrubbing metadata, formatting JSON, synching subtitles, or converting HEIC images—should run in milliseconds right inside your browser without leaking any private details.
          </p>

          <h2 style={{ fontSize: 20, color: 'var(--fg)', fontWeight: 600, margin: '24px 0 8px', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Pricing Plans & Access Levels</h2>
          <p>
            Our billing is designed to be simple, predictable, and highly transparent:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li style={{ paddingLeft: 16, borderLeft: '3px solid var(--accent)' }}>
              <strong style={{ color: 'var(--fg)' }}>Free Plan</strong>: Standard daily usage on all essential browser utility tools. 100% free, no credit card required. Includes 5 daily sandbox API key test runs.
            </li>
            <li style={{ paddingLeft: 16, borderLeft: '3px solid var(--accent)' }}>
              <strong style={{ color: 'var(--fg)' }}>Pro Plan</strong>: Advanced rendering features, custom watermark removal, unlimited daily interactive browser execution, and 100 daily production API requests for $9/month.
            </li>
            <li style={{ paddingLeft: 16, borderLeft: '3px solid var(--accent)' }}>
              <strong style={{ color: 'var(--fg)' }}>Developer Plan</strong>: Premium high-volume programmatic API access with dedicated console endpoints, custom webhooks, and 1,000 daily production key requests for $29/month.
            </li>
          </ul>

          <h2 style={{ fontSize: 20, color: 'var(--fg)', fontWeight: 600, margin: '24px 0 8px', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>High-Performance Serverless Architecture</h2>
          <p>
            Our backend services are built for secure, low-latency, and highly concurrent execution. We employ safe sandboxing, automated resource allocation, and advanced memory queues to ensure complex operations—such as multi-page PDF generation or large dataset parsing—are processed reliably with high uptime and optimal speed.
          </p>
          
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <button onClick={onLaunch} className="reset" style={{
              padding: '12px 28px', borderRadius: 9,
              background: 'linear-gradient(180deg, oklch(0.72 0.18 265), oklch(0.62 0.20 265))',
              color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 4px 14px oklch(0.50 0.20 265 / 0.3)',
            }}>Launch Dashboard</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   DocsPage Component
   ========================================================================= */
interface DocsPageProps {
  onLaunch: () => void;
}

function DocsPage({ onLaunch }: DocsPageProps) {
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

  return (
    <div style={{
      maxWidth: 880, margin: '40px auto 120px',
      padding: '0 32px', boxSizing: 'border-box',
      position: 'relative',
    }} className="fade-in">
      {/* Subpage ambient top-center glow */}
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 800, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
        opacity: isLight ? 0.08 : 0.15,
        zIndex: 0,
      }}/>

      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <span style={eyebrow}>Technical Docs</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>Developer Documentation</h1>
      </div>

      <div className="glass-card" style={{ position: 'relative', zIndex: 1, padding: '40px clamp(24px, 5vw, 48px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <h2 style={{ fontSize: 18, color: 'var(--fg)', fontWeight: 600, marginBottom: 8 }}>1. Single-Message AI Formatter API</h2>
            <p style={{ fontSize: 14.5, color: 'var(--fg-muted)', lineHeight: 1.6, marginBottom: 12 }}>
              You can programmatically format raw AI text by posting to the unified Python/FastAPI endpoint:
            </p>
            <pre style={{
              background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '14px 18px', overflowX: 'auto',
              fontSize: 12.5, color: isLight ? 'oklch(0.55 0.15 265)' : 'oklch(0.80 0.10 195)', lineHeight: 1.5,
            }} className="mono">
  {`POST /api/format
Headers: { "Content-Type": "application/json" }
Body:
{
  "content": "raw_markdown_text",
  "is_html": true,
  "theme": "modern",       // 'modern' | 'academic' | 'minimalist'
  "export_format": "pdf"  // 'pdf' | 'docx' | 'html' | 'txt' | 'md'
}`}
            </pre>
          </div>

          <div>
            <h2 style={{ fontSize: 18, color: 'var(--fg)', fontWeight: 600, marginBottom: 8 }}>2. Rate Limits & Fair-Use</h2>
            <p style={{ fontSize: 14.5, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
              Our Free Tier operates on on-device scripts running locally in the browser, meaning zero rate limits. Server-side API formatting endpoints operate a Fair-Use protector to ensure service availability for all users.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: 18, color: 'var(--fg)', fontWeight: 600, marginBottom: 8 }}>3. Security & Compliance</h2>
            <p style={{ fontSize: 14.5, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
              Any files uploaded or text processed through the tools catalog is analyzed and streamed directly. We do not store, scan, or log document contents inside database instances, protecting data integrity.
            </p>
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <button onClick={onLaunch} className="reset" style={{
              padding: '12px 24px', borderRadius: 9,
              background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
              color: 'var(--fg)', fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
            >Go to App</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   DeveloperPage Component
   ========================================================================= */
interface DeveloperPageProps {
  onLaunch: () => void;
  brandName: string;
  userPlan: string;
  sessionUser: any;
  onShowPaywall: () => void;
  onOpenAuthModal: () => void;
}

function DeveloperPage({ onLaunch, brandName, userPlan, sessionUser, onShowPaywall, onOpenAuthModal }: DeveloperPageProps) {
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');
  
  const storageKey = `${brandName.toLowerCase().replace(/\s+/g, '')}_prod_api_key`;
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey) || '';
    }
    return '';
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [showProdKey, setShowProdKey] = useState(false);
  
  // API Console selection
  const [devTab, setDevTab] = useState<'format' | 'heic-to-jpg-converter' | 'status'>('format');

  // Document Sandbox Interactive states
  const [sandboxInput, setSandboxInput] = useState('Clean this messy transcription up and format it nicely into a report.');
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  // HEIC Sandbox Interactive states
  const [heicSandboxFile, setHeicSandboxFile] = useState<File | null>(null);
  const [heicSandboxFormat, setHeicSandboxFormat] = useState<'jpg' | 'png'>('jpg');
  const [heicSandboxLoading, setHeicSandboxLoading] = useState(false);
  const [heicSandboxResult, setHeicSandboxResult] = useState<any>(null);
  const [heicSandboxResultUrl, setHeicSandboxResultUrl] = useState<string | null>(null);
  const fileInputSandboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (heicSandboxResultUrl) URL.revokeObjectURL(heicSandboxResultUrl);
    };
  }, [heicSandboxResultUrl]);

  const cleanBrandDomain = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const displayDomain = cleanBrandDomain ? `${cleanBrandDomain}.com` : 'mysaas.com';

  const isPaidOrAdmin = userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin';
  const isLoggedIn = !!sessionUser && !sessionUser.is_anonymous;

  // Active Key selection
  const activeKey = apiKey || (isLoggedIn ? 'ms_sandbox_unassigned_key' : 'ms_guest_unauthorized_locked');

  const curlCommand = devTab === 'format'
    ? `curl -X POST https://api.${displayDomain}/v1/format \\
  -H "Authorization: Bearer ${activeKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "ai-formatter",
    "content": "${sandboxInput.replace(/"/g, '\\"')}",
    "style": "modern"
  }'`
    : `curl -X POST https://api.${displayDomain}/v1/convert-image \\
  -H "Authorization: Bearer ${activeKey}" \\
  -F "file=@/path/to/photo.heic" \\
  -F "format=${heicSandboxFormat}" \\
  -F "quality=0.95" \\
  --output converted_photo.${heicSandboxFormat}`;

  // Sync API key directly from profiles table inside Supabase online cloud database!
  useEffect(() => {
    async function syncKey() {
      if (supabase && sessionUser?.id && isLoggedIn) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('api_key')
            .eq('id', sessionUser.id)
            .single();
          if (data) {
            if (data.api_key) {
              setApiKey(data.api_key);
              if (typeof window !== 'undefined') {
                localStorage.setItem(storageKey, data.api_key);
              }
            } else {
              // Auto-generate their key right away (Sandbox for Free, Production for Pro/Developer) so they have one instantly!
              const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
              let randomString = '';
              for (let i = 0; i < 24; i++) {
                randomString += chars[Math.floor(Math.random() * chars.length)];
              }
              const isPaidUser = userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin';
              const keyPrefix = isPaidUser ? 'ms_live_prod_' : 'ms_sandbox_';
              const newKey = `${keyPrefix}${randomString}`;

              const { error: updateError } = await supabase
                .from('profiles')
                .update({ api_key: newKey })
                .eq('id', sessionUser.id);

              if (!updateError) {
                setApiKey(newKey);
                if (typeof window !== 'undefined') {
                  localStorage.setItem(storageKey, newKey);
                }
              }
            }
          }
        } catch (err) {
          console.error('Failed to sync API key from DB:', err);
        }
      }
    }
    syncKey();
  }, [sessionUser, isLoggedIn, userPlan]);

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < 24; i++) {
      randomString += chars[Math.floor(Math.random() * chars.length)];
    }
    const isPaidUser = userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin';
    const keyPrefix = isPaidUser ? 'ms_live_prod_' : 'ms_sandbox_';
    const newKey = `${keyPrefix}${randomString}`;

    // Write real API key into online Postgres profiles database row!
    if (supabase && sessionUser?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ api_key: newKey })
          .eq('id', sessionUser.id);
        if (error) {
          console.error("Database key update error:", error);
          alert("Failed to save API key to online database. Please check your network and try again.");
          setIsGenerating(false);
          return;
        }
      } catch (err) {
        console.error(err);
        alert("Failed to connect to database transaction.");
        setIsGenerating(false);
        return;
      }
    }

    setApiKey(newKey);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newKey);
    }
    setIsGenerating(false);
  };

  const handleRevokeKey = async () => {
    if (confirm("Are you sure you want to revoke your production API key? Any applications currently using this key will immediately receive a 401 Unauthorized status.")) {
      // Clear real API key from online Postgres profiles database row!
      if (supabase && sessionUser?.id) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ api_key: null })
            .eq('id', sessionUser.id);
          if (error) {
            console.error("Database key revoke error:", error);
            alert("Failed to revoke API key in online database.");
            return;
          }
        } catch (err) {
          console.error(err);
          alert("Database connection timeout.");
          return;
        }
      }

      setApiKey('');
      if (typeof window !== 'undefined') {
        localStorage.removeItem(storageKey);
      }
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(activeKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  // REAL network request executing format routes against our serverless Next.js endpoint!
  const runSandboxTest = async () => {
    if (!isLoggedIn) {
      alert("Please sign in or create an account to run live tests in the API sandbox.");
      onOpenAuthModal();
      return;
    }
    
    setSandboxLoading(true);
    setSandboxResult(null);

    try {
      const response = await fetch('/api/v1/format', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: 'ai-formatter',
          content: sandboxInput,
          style: 'modern'
        })
      });
      const data = await response.json();
      setSandboxResult(data);
    } catch (err) {
      console.error('API Sandbox test fetch failed:', err);
      setSandboxResult({
        status: "error",
        message: "Failed to connect to API server. Check if your dev server is active or if key is valid."
      });
    } finally {
      setSandboxLoading(false);
    }
  };

  const runHeicSandboxTest = async () => {
    if (!isLoggedIn) {
      alert("Please sign in or create an account to run live tests in the API sandbox.");
      onOpenAuthModal();
      return;
    }
    if (!heicSandboxFile) {
      alert("Please upload a test HEIC/HEIF file first.");
      return;
    }
    
    setHeicSandboxLoading(true);
    setHeicSandboxResult(null);
    if (heicSandboxResultUrl) {
      URL.revokeObjectURL(heicSandboxResultUrl);
      setHeicSandboxResultUrl(null);
    }

    try {
      const formData = new FormData();
      formData.append('file', heicSandboxFile);
      formData.append('format', heicSandboxFormat);
      formData.append('quality', '0.95');

      const response = await fetch('/api/v1/convert-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeKey}`,
          'Accept': 'image/*' // Request binary output
        },
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json();
        setHeicSandboxResult(errJson);
      } else {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setHeicSandboxResultUrl(url);
        setHeicSandboxResult({
          status: "success",
          message: `HEIC file converted successfully to ${heicSandboxFormat.toUpperCase()}!`,
          contentType: blob.type,
          sizeBytes: blob.size,
          outputUrl: url
        });
      }
    } catch (err: any) {
      console.error('API HEIC Sandbox test failed:', err);
      setHeicSandboxResult({
        status: "error",
        message: "Failed to connect to image conversion API server: " + err.message
      });
    } finally {
      setHeicSandboxLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 1100, margin: '40px auto 120px',
      padding: '0 32px', boxSizing: 'border-box',
      position: 'relative',
    }} className="fade-in">
      {/* Subpage ambient top-center glow */}
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 800, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
        opacity: isLight ? 0.08 : 0.15,
        zIndex: 0,
      }}/>

      <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
        <span style={{
          ...eyebrow,
          color: 'oklch(0.78 0.16 195)', // Cyan text
          border: '1px solid oklch(0.78 0.16 195 / 0.3)',
          background: 'oklch(0.18 0.010 195 / 0.1)',
        }}>Developer Hub & Sandbox</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>Developer API Dashboard</h1>
        <p style={sectionSubtitle}>Integrate the professional-grade formatting engines of {brandName} programmatically inside your workflows and scripts.</p>
      </div>

      {/* Dynamic API Tab Selector */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32,
        position: 'relative', zIndex: 1, flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setDevTab('format')}
          className="reset mono"
          style={{
            padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8,
            border: devTab === 'format' ? '1px solid oklch(0.78 0.16 195 / 0.3)' : '1px solid var(--border)',
            background: devTab === 'format' ? 'oklch(0.18 0.010 195 / 0.2)' : 'oklch(0.12 0.004 250 / 0.5)',
            color: devTab === 'format' ? 'white' : 'var(--fg-muted)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.15s',
          }}
        >
          <Icon.Terminal size={14} style={{ color: devTab === 'format' ? 'oklch(0.78 0.16 195)' : 'var(--fg-dim)' }} />
          Document Formatter API
        </button>
        <button
          onClick={() => setDevTab('heic-to-jpg-converter')}
          className="reset mono"
          style={{
            padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8,
            border: devTab === 'heic-to-jpg-converter' ? '1px solid oklch(0.78 0.16 25 / 0.3)' : '1px solid var(--border)',
            background: devTab === 'heic-to-jpg-converter' ? 'oklch(0.18 0.010 25 / 0.2)' : 'oklch(0.12 0.004 250 / 0.5)',
            color: devTab === 'heic-to-jpg-converter' ? 'white' : 'var(--fg-muted)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.15s',
          }}
        >
          <Icon.Image size={14} style={{ color: devTab === 'heic-to-jpg-converter' ? 'oklch(0.78 0.16 25)' : 'var(--fg-dim)' }} />
          HEIC to JPG/PNG Converter API
        </button>
        {userPlan === 'admin' && (
          <button
            onClick={() => setDevTab('status')}
            className="reset mono"
            style={{
              padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              border: devTab === 'status' ? '1px solid oklch(0.78 0.16 145 / 0.3)' : '1px solid var(--border)',
              background: devTab === 'status' ? 'oklch(0.18 0.010 145 / 0.2)' : 'oklch(0.12 0.004 250 / 0.5)',
              color: devTab === 'status' ? 'white' : 'var(--fg-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.15s',
            }}
          >
            <Icon.Globe size={14} style={{ color: devTab === 'status' ? 'oklch(0.78 0.16 145)' : 'var(--fg-dim)' }} />
            Space Engines Monitor
          </button>
        )}
      </div>

      {devTab === 'status' && userPlan === 'admin' ? (
        <SpaceStatusDashboard />
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 24,
            alignItems: 'stretch',
            position: 'relative',
            zIndex: 1,
          }}>
        {/* API Keys Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: 'oklch(0.18 0.010 195 / 0.15)',
              border: '1px solid oklch(0.78 0.16 195 / 0.3)',
              color: 'oklch(0.78 0.16 195)',
            }}>
              <Icon.Terminal size={16} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">API Authorization Keys</span>
          </div>

          <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.5, marginBottom: 20 }}>
            Authenticate your HTTP requests by passing your bearer token in the headers list.
          </p>

          {!isLoggedIn ? (
            /* Guest UI - locked */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: '1px dashed var(--border)', borderRadius: 12, padding: '36px 20px',
              textAlign: 'center', flex: 1, background: 'var(--bg-elev-1)',
            }}>
              <div style={{ color: 'var(--fg-dim)', marginBottom: 12 }}>
                <Icon.Shield size={36} style={{ opacity: 0.5 }} />
              </div>
              <h3 style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--fg)', margin: '0 0 6px' }}>API Keys Locked</h3>
              <p style={{ fontSize: 12, color: 'var(--fg-subtle)', maxWidth: 240, margin: '0 0 20px', lineHeight: 1.4 }}>
                Sign in or register an account to unlock sandbox credentials and test endpoints.
              </p>
              <button onClick={onOpenAuthModal} className="reset" style={{
                padding: '8px 18px', borderRadius: 8,
                background: 'linear-gradient(180deg, oklch(0.72 0.18 195), oklch(0.62 0.20 195))',
                color: 'white', fontWeight: 500, fontSize: 13, cursor: 'pointer',
                boxShadow: '0 2px 8px oklch(0.50 0.20 195 / 0.2)',
              }}>Sign In / Sign Up</button>
            </div>
          ) : !isPaidOrAdmin ? (
            /* Free User UI - sandbox key available, prod key locked */
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-dim)' }}>SANDBOX KEY (RATE LIMITED)</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'oklch(0.78 0.16 75)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.78 0.16 75)' }}></span>
                    FREE PLAN
                  </span>
                </div>
                {apiKey ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      readOnly
                      value={apiKey}
                      style={{
                        flex: 1, padding: '10px 12px', background: 'var(--bg-elev-1)',
                        border: '1px solid var(--border)', borderRadius: 8,
                        color: 'var(--fg)', fontSize: 12, outline: 'none', fontFamily: 'monospace',
                      }}
                    />
                    <button onClick={handleCopyKey} className="reset" style={{
                      padding: '8px 12px', borderRadius: 8,
                      background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                      color: 'var(--fg)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    }}>
                      {copiedKey ? <Icon.Check size={14} style={{ color: 'oklch(0.78 0.16 145)' }} /> : <Icon.Copy size={14} />}
                    </button>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: '1px dashed var(--border)', borderRadius: 12, padding: '30px 20px',
                    textAlign: 'center', background: 'var(--bg-elev-1)',
                  }}>
                    {isGenerating ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <Icon.Loader size={24} className="spinning" style={{ color: 'var(--accent)' }} />
                        <div style={{ fontSize: 12, color: 'var(--fg-dim)' }} className="mono">Generating Sandbox Key...</div>
                      </div>
                    ) : (
                      <>
                        <p style={{ fontSize: 12.5, color: 'var(--fg-muted)', margin: '0 0 16px', lineHeight: 1.4 }}>
                          You don't have an active API key yet. Generate your unique sandbox key to start integrating.
                        </p>
                        <button onClick={handleGenerateKey} className="reset" style={{
                          padding: '8px 16px', borderRadius: 8,
                          background: 'linear-gradient(180deg, oklch(0.72 0.18 195), oklch(0.62 0.20 195))',
                          color: 'white', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                          boxShadow: '0 2px 8px oklch(0.50 0.20 195 / 0.2)',
                        }}>Generate Sandbox Key</button>
                      </>
                    )}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--fg-dim)', marginTop: 6 }}>
                  Free sandbox keys are metered to 5 daily runs.
                </div>
              </div>

              <div style={{
                background: 'oklch(0.18 0.005 250 / 0.4)',
                border: '1px solid var(--border)',
                borderRadius: 12, padding: '18px 20px',
                marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'oklch(0.72 0.18 265)' }}>
                  <Icon.Shield size={14} />
                  <span style={{ fontSize: 12.5, fontWeight: 600 }} className="mono">PRODUCTION API ACCESS</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.45 }}>
                  Upgrade to the **Pro Plan** or **Developer Plan** to immediately generate production keys with higher requests limits.
                </p>
                <button onClick={onShowPaywall} className="reset" style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  background: 'linear-gradient(180deg, oklch(0.72 0.18 265), oklch(0.62 0.20 265))',
                  color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  boxShadow: '0 4px 12px oklch(0.50 0.20 265 / 0.25)',
                  marginTop: 4,
                }}>Upgrade to Production API</button>
              </div>
            </div>
          ) : (
            /* Paid User UI - production keys fully operational */
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {apiKey ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-dim)' }}>PRODUCTION KEY</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'oklch(0.78 0.16 145)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.78 0.16 145)' }}></span>
                        {userPlan === 'admin' ? 'SYSTEM ADMIN' : userPlan === 'api' ? 'DEVELOPER PLAN' : 'PRO PLAN'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type={showProdKey ? "text" : "password"}
                        readOnly
                        value={apiKey}
                        style={{
                          flex: 1, padding: '10px 12px', background: 'var(--bg-elev-1)',
                          border: '1px solid var(--border)', borderRadius: 8,
                          color: 'var(--fg)', fontSize: 12.5, outline: 'none', fontFamily: 'monospace',
                          letterSpacing: showProdKey ? 'normal' : '0.12em',
                        }}
                      />
                      <button onClick={() => setShowProdKey(!showProdKey)} className="reset" style={{
                        padding: '8px 12px', borderRadius: 8,
                        background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                        color: 'var(--fg)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      }} title={showProdKey ? "Hide API Key" : "Show API Key"}>
                        {showProdKey ? <Icon.EyeOff size={14} /> : <Icon.Eye size={14} />}
                      </button>
                      <button onClick={handleCopyKey} className="reset" style={{
                        padding: '8px 12px', borderRadius: 8,
                        background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                        color: 'var(--fg)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      }}>
                        {copiedKey ? <Icon.Check size={14} style={{ color: 'oklch(0.78 0.16 145)' }} /> : <Icon.Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleRevokeKey} className="reset" style={{
                      flex: 1, padding: '9px', borderRadius: 8,
                      background: 'oklch(0.18 0.010 15 / 0.15)', border: '1px solid oklch(0.50 0.15 15 / 0.4)',
                      color: 'oklch(0.78 0.16 15)', fontWeight: 500, fontSize: 12.5, cursor: 'pointer',
                      textAlign: 'center', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'oklch(0.18 0.010 15 / 0.3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'oklch(0.18 0.010 15 / 0.15)'}
                    >Revoke API Key</button>
                    <button onClick={handleCopyKey} className="reset" style={{
                      flex: 1, padding: '9px', borderRadius: 8,
                      background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                      color: 'var(--fg)', fontWeight: 500, fontSize: 12.5, cursor: 'pointer',
                      textAlign: 'center',
                    }}>Copy Bearer Token</button>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  border: '1px dashed var(--border)', borderRadius: 12, padding: '40px 20px',
                  textAlign: 'center', flex: 1, background: 'var(--bg-elev-1)',
                }}>
                  {isGenerating ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <Icon.Loader size={32} className="spinning" style={{ color: 'var(--accent)' }} />
                      <div style={{ fontSize: 13, color: 'var(--fg-dim)', fontWeight: 500 }} className="mono">Generating Cryptographic Key...</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ color: 'var(--fg-dim)', marginBottom: 12 }}>
                        <Icon.Database size={32} style={{ color: 'oklch(0.78 0.16 195)' }} />
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', margin: '0 0 6px' }}>No Active API Keys</h3>
                      <p style={{ fontSize: 12, color: 'var(--fg-subtle)', maxWidth: 260, margin: '0 0 20px', lineHeight: 1.4 }}>
                        You are on a paid account. Click the button below to generate a production API key.
                      </p>
                      <button onClick={handleGenerateKey} className="reset" style={{
                        padding: '10px 20px', borderRadius: 8,
                        background: 'linear-gradient(180deg, oklch(0.72 0.18 195), oklch(0.62 0.20 195))',
                        color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                        boxShadow: '0 4px 12px oklch(0.50 0.20 195 / 0.3)',
                      }}>Generate Live Key</button>
                    </>
                  )}
                </div>
              )}

              {/* Bottom Card depending on plan */}
              {userPlan === 'pro' ? (
                <div style={{
                  background: 'oklch(0.18 0.005 250 / 0.4)',
                  border: '1px solid var(--border)',
                  borderRadius: 12, padding: '18px 20px',
                  marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'oklch(0.72 0.18 265)' }}>
                    <Icon.Shield size={14} />
                    <span style={{ fontSize: 12.5, fontWeight: 600 }} className="mono">HIGH-VOLUME API ACCESS</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.45 }}>
                    You currently have **100 daily production runs**. Upgrade to the **Developer Plan** for priority compute resources, status webhooks, and 1,000 daily requests.
                  </p>
                  <button onClick={onShowPaywall} className="reset" style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    background: 'linear-gradient(180deg, oklch(0.72 0.18 265), oklch(0.62 0.20 265))',
                    color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    boxShadow: '0 4px 12px oklch(0.50 0.20 265 / 0.25)',
                    marginTop: 4,
                  }}>Upgrade to Developer Plan</button>
                </div>
              ) : (
                <div style={{
                  background: 'oklch(0.18 0.005 250 / 0.4)',
                  border: '1px solid var(--border)',
                  borderRadius: 12, padding: '18px 20px',
                  marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'oklch(0.78 0.16 145)' }}>
                    <Icon.Check size={14} />
                    <span style={{ fontSize: 12.5, fontWeight: 600 }} className="mono">DEVELOPER SERVICE ACTIVE</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.45 }}>
                    Your Developer Plan key is active with up to **1,000 daily production requests** secured. Enjoy custom status webhooks and prioritized queue computation.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* cURL Command Panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'space-between', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 8,
                background: devTab === 'format' ? 'oklch(0.18 0.010 195 / 0.15)' : 'oklch(0.18 0.010 25 / 0.15)',
                border: devTab === 'format' ? '1px solid oklch(0.78 0.16 195 / 0.3)' : '1px solid oklch(0.78 0.16 25 / 0.3)',
                color: devTab === 'format' ? 'oklch(0.78 0.16 195)' : 'oklch(0.78 0.16 25)',
              }}>
                {devTab === 'format' ? <Icon.Code size={16} /> : <Icon.Image size={16} />}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">Integration Example</span>
            </div>
            <button onClick={handleCopyCurl} className="reset" style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 6,
              background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
              color: 'var(--fg-muted)', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            }}>
              {copiedCurl ? (
                <>
                  <Icon.Check size={11} style={{ color: 'oklch(0.78 0.16 145)' }} />
                  Copied!
                </>
              ) : (
                <>
                  <Icon.Copy size={11} />
                  Copy cURL
                </>
              )}
            </button>
          </div>

          <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.5, marginBottom: 16 }}>
            {devTab === 'format' 
              ? "Run this standard POST script to execute document parsing instantly."
              : "Upload a HEIC file using multipart form-data to receive the converted image instantly."}
          </p>

          <pre style={{
            background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '14px 16px', overflowX: 'auto',
            fontSize: 11.5, 
            color: isLight 
              ? (devTab === 'format' ? 'oklch(0.55 0.15 265)' : 'oklch(0.55 0.15 25)') 
              : (devTab === 'format' ? 'oklch(0.80 0.10 195)' : 'oklch(0.80 0.10 25)'), 
            lineHeight: 1.5,
            flex: 1, display: 'block', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }} className="mono">
            {curlCommand}
          </pre>
        </div>
      </div>

      {/* Interactive Sandbox & Terminal section */}
      <div className="glass-card" style={{ marginTop: 24, padding: '32px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8,
            background: devTab === 'format' ? 'oklch(0.18 0.010 195 / 0.15)' : 'oklch(0.18 0.010 25 / 0.15)',
            border: devTab === 'format' ? '1px solid oklch(0.78 0.16 195 / 0.3)' : '1px solid oklch(0.78 0.16 25 / 0.3)',
            color: devTab === 'format' ? 'oklch(0.78 0.16 195)' : 'oklch(0.78 0.16 25)',
          }}>
            <Icon.Sparkles size={16} />
          </span>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg)', margin: 0 }}>Interactive API Sandbox Playground</h2>
        </div>

        <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.5, marginTop: -8, marginBottom: 24 }}>
          Send live test requests and monitor raw response returns right inside the developer terminal.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Sandbox Request Settings */}
          {devTab === 'format' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>REQUEST DATA BODY</label>
                <textarea
                  rows={4}
                  value={sandboxInput}
                  onChange={e => setSandboxInput(e.target.value)}
                  placeholder="Type anything to test the parser..."
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 8,
                    background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
                    color: 'var(--fg)', fontSize: 13, outline: 'none',
                    resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                />
              </div>

              <button
                onClick={runSandboxTest}
                disabled={sandboxLoading}
                className="reset"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 8,
                  background: sandboxLoading 
                    ? 'var(--bg-elev-2)' 
                    : 'linear-gradient(180deg, oklch(0.72 0.18 195), oklch(0.62 0.20 195))',
                  border: sandboxLoading ? '1px solid var(--border)' : 'none',
                  color: sandboxLoading ? 'var(--fg-dim)' : 'white',
                  fontWeight: 600, fontSize: 13, cursor: sandboxLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: sandboxLoading ? 'none' : '0 4px 12px oklch(0.50 0.20 195 / 0.25)',
                }}
              >
                {sandboxLoading ? (
                  <>
                    <Icon.Loader size={14} className="spinning" />
                    Streaming Response...
                  </>
                ) : (
                  <>
                    ⚡
                    <span>Test API Endpoint</span>
                  </>
                )}
              </button>

              {/* Simulated Live Analytics */}
              <div style={{
                background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 16,
                justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto',
              }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600 }}>API STATUS</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'oklch(0.78 0.16 145)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.78 0.16 145)' }} />
                    OPERATIONAL
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600 }}>AVERAGE LATENCY</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>42ms</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600 }}>GLOBAL UPTIME</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>100%</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>UPLOAD TEST HEIC FILE</label>
                <div
                  onClick={() => fileInputSandboxRef.current?.click()}
                  style={{
                    border: '1px dashed var(--border)', borderRadius: 8,
                    padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
                    background: 'oklch(0.12 0.004 250 / 0.3)', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'oklch(0.12 0.004 250 / 0.5)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'oklch(0.12 0.004 250 / 0.3)'}
                >
                  <input
                    type="file"
                    accept=".heic,.heif"
                    ref={fileInputSandboxRef}
                    onChange={e => e.target.files?.[0] && setHeicSandboxFile(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                  <Icon.FileDown size={24} style={{ color: 'var(--fg-dim)', marginBottom: 6 }} />
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'white' }}>
                    {heicSandboxFile ? `📄 ${heicSandboxFile.name} (${(heicSandboxFile.size / (1024 * 1024)).toFixed(2)} MB)` : "Click to select a HEIC photo"}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--fg-subtle)', marginTop: 4 }}>
                    Converts client-side or proxies to active Space node.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-dim)', textTransform: 'uppercase' }}>TARGET FORMAT</label>
                <div style={{ display: 'flex', gap: 4, background: 'oklch(0.12 0.004 250)', padding: 3, borderRadius: 6, border: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setHeicSandboxFormat('jpg')}
                    className="reset mono"
                    style={{
                      padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4,
                      background: heicSandboxFormat === 'jpg' ? 'oklch(0.20 0.008 250)' : 'transparent',
                      color: heicSandboxFormat === 'jpg' ? 'white' : 'var(--fg-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    JPG
                  </button>
                  <button
                    onClick={() => setHeicSandboxFormat('png')}
                    className="reset mono"
                    style={{
                      padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4,
                      background: heicSandboxFormat === 'png' ? 'oklch(0.20 0.008 250)' : 'transparent',
                      color: heicSandboxFormat === 'png' ? 'white' : 'var(--fg-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    PNG
                  </button>
                </div>
              </div>

              <button
                onClick={runHeicSandboxTest}
                disabled={heicSandboxLoading}
                className="reset"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 8,
                  background: heicSandboxLoading 
                    ? 'var(--bg-elev-2)' 
                    : 'linear-gradient(180deg, oklch(0.72 0.18 25), oklch(0.62 0.20 25))',
                  border: heicSandboxLoading ? '1px solid var(--border)' : 'none',
                  color: heicSandboxLoading ? 'var(--fg-dim)' : 'white',
                  fontWeight: 600, fontSize: 13, cursor: heicSandboxLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: heicSandboxLoading ? 'none' : '0 4px 12px oklch(0.50 0.20 25 / 0.25)',
                }}
              >
                {heicSandboxLoading ? (
                  <>
                    <Icon.Loader size={14} className="spinning" />
                    Converting Image...
                  </>
                ) : (
                  <>
                    ⚡
                    <span>Test Image Conversion API</span>
                  </>
                )}
              </button>

              {/* Simulated Live Analytics */}
              <div style={{
                background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 16,
                justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto',
              }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600 }}>API STATUS</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'oklch(0.78 0.16 145)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.78 0.16 145)' }} />
                    OPERATIONAL
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600 }}>AVERAGE LATENCY</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>148ms</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600 }}>GLOBAL UPTIME</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>100%</div>
                </div>
              </div>
            </div>
          )}

          {/* Sandbox Response Terminal */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>RESPONSE HEADERS & BODY</div>
            <div style={{
              flex: 1, background: '#0e0f12', border: '1px solid #1c1d22',
              borderRadius: 8, padding: '14px 16px', overflowY: 'auto',
              fontFamily: 'monospace', fontSize: 12, color: '#a5b4fc', lineHeight: 1.5,
              minHeight: 200, display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
            }}>
              {devTab === 'format' ? (
                sandboxLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6366f1', margin: 'auto' }}>
                    <Icon.Loader size={18} className="spinning" />
                    <span>Waiting for API data streams...</span>
                  </div>
                ) : sandboxResult ? (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(sandboxResult, null, 2)}
                  </pre>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--fg-dim)', margin: 'auto', textAlign: 'center' }}>
                    <Icon.Terminal size={24} style={{ opacity: 0.5 }} />
                    <span style={{ fontSize: 12, maxWidth: 200 }}>Terminal idle. Click "Test API Endpoint" to execute.</span>
                  </div>
                )
              ) : (
                heicSandboxLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'oklch(0.78 0.16 25)', margin: 'auto' }}>
                    <Icon.Loader size={18} className="spinning" />
                    <span>Processing binary image conversion...</span>
                  </div>
                ) : heicSandboxResult ? (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {JSON.stringify(heicSandboxResult, null, 2)}
                    </pre>
                    {heicSandboxResultUrl && (
                      <div style={{
                        marginTop: 14, paddingTop: 14, borderTop: '1px solid #1c1d22',
                        display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center'
                      }}>
                        <div style={{ fontSize: 10.5, color: 'oklch(0.78 0.16 25)', fontWeight: 600, width: '100%', textAlign: 'left' }} className="mono">Visual Sandbox Output Preview:</div>
                        <img
                          src={heicSandboxResultUrl}
                          alt="Sandbox API Converted Preview"
                          style={{ maxWidth: '100%', maxHeight: 110, objectFit: 'contain', borderRadius: 6, border: '1px solid #1c1d22' }}
                        />
                        <a
                          href={heicSandboxResultUrl}
                          download={`sandbox_converted.${heicSandboxFormat}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5,
                            color: 'white', textDecoration: 'none', background: 'oklch(0.18 0.010 25 / 0.5)',
                            border: '1px solid oklch(0.78 0.16 25 / 0.2)', padding: '5px 12px', borderRadius: 6,
                            marginTop: 4, transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'oklch(0.18 0.010 25 / 0.8)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'oklch(0.18 0.010 25 / 0.5)'}
                        >
                          <Icon.Download size={11} /> Download Converted Sandbox Image
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--fg-dim)', margin: 'auto', textAlign: 'center' }}>
                    <Icon.Terminal size={24} style={{ opacity: 0.5 }} />
                    <span style={{ fontSize: 12, maxWidth: 200 }}>Terminal idle. Upload HEIC and click "Test Image Conversion API" to execute.</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <button onClick={onLaunch} className="reset" style={{
          padding: '11px 24px', borderRadius: 9,
          background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
          color: 'var(--fg)', fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
        >Return to App Console</button>
      </div>
    </div>
  );
}

interface AccountPageProps {
  onLaunch: () => void;
  brandName: string;
  userPlan: 'free' | 'pro' | 'admin' | 'api';
  sessionUser: any;
  isAnonUser: boolean;
  onShowPaywall: () => void;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  pricingCohort: 'global' | 'india';
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  customerId: string | null;
  subscriptionId: string | null;
  onRefreshProfile: () => void;
}

function AccountPage({
  onLaunch, brandName, userPlan, sessionUser, isAnonUser,
  onShowPaywall, onOpenAuthModal, onSignOut, theme, onToggleTheme,
  pricingCohort = 'global', subscriptionStatus, currentPeriodEnd,
  cancelAtPeriodEnd, customerId, subscriptionId, onRefreshProfile
}: AccountPageProps) {
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');
  const isLoggedIn = !!sessionUser && !sessionUser.is_anonymous;

  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    async function loadKey() {
      if (supabase && sessionUser?.id && isLoggedIn) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('api_key')
            .eq('id', sessionUser.id)
            .single();
          if (data?.api_key) {
            setApiKey(data.api_key);
          }
        } catch (err) {
          console.error('Failed to load key inside AccountPage:', err);
        }
      }
    }
    loadKey();
  }, [sessionUser, isLoggedIn]);

  // Profile Information States (B2C Focus - strictly stripped B2B)
  const [profileName, setProfileName] = useState(() => {
    return sessionUser?.user_metadata?.name || '';
  });
  const [profileUsername, setProfileUsername] = useState(() => {
    return sessionUser?.user_metadata?.username || sessionUser?.email?.split('@')[0] || '';
  });
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(false);
    setProfileError(null);
    try {
      // 1. Sync to Supabase Auth user metadata (B2C: remove company/role)
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          name: profileName, 
          username: profileUsername
        }
      });
      if (authError) throw authError;

      // 2. Sync to public profiles table row in the database
      if (sessionUser?.id) {
        const { error: dbError } = await supabase
          .from('profiles')
          .update({
            name: profileName,
            username: profileUsername
          })
          .eq('id', sessionUser.id);
        if (dbError) throw dbError;
      }
      
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to save profile changes.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password & Security States
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      setPasswordSuccess(false);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage("Password must be at least 6 characters.");
      setPasswordSuccess(false);
      return;
    }
    setIsUpdatingPassword(true);
    setPasswordMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      setPasswordSuccess(true);
      setPasswordMessage("✓ Password updated successfully!");
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordMessage(null);
        setShowPasswordFields(false);
        setPasswordSuccess(false);
      }, 3000);
    } catch (err: any) {
      setPasswordSuccess(false);
      setPasswordMessage("Failed to update password: " + err.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Localization settings
  const [profileLanguage, setProfileLanguage] = useState(() => {
    return sessionUser?.user_metadata?.language || 'en_US';
  });
  const [profileTimezone, setProfileTimezone] = useState(() => {
    return sessionUser?.user_metadata?.timezone || 'UTC';
  });
  const [isSavingLoc, setIsSavingLoc] = useState(false);
  const [locSuccess, setLocSuccess] = useState(false);

  const handleSaveLocalization = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLoc(true);
    setLocSuccess(false);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          language: profileLanguage,
          timezone: profileTimezone
        }
      });
      if (error) throw error;
      setLocSuccess(true);
      setTimeout(() => setLocSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingLoc(false);
    }
  };

  // Layout preference
  const [editorLayout, setEditorLayout] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('uaf_layout') || 'standard';
    }
    return 'standard';
  });

  const handleLayoutChange = (layout: string) => {
    setEditorLayout(layout);
    if (typeof window !== 'undefined') {
      localStorage.setItem('uaf_layout', layout);
      window.dispatchEvent(new Event('storage'));
    }
  };

  // UI state-managed modal overlays & toasts
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelingSub, setIsCancelingSub] = useState(false);
  const [isResumingSub, setIsResumingSub] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [billingSuccess, setBillingSuccess] = useState(false);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [showDeactivateFields, setShowDeactivateFields] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [deactivateSuccess, setDeactivateSuccess] = useState(false);

  const [uuidCopied, setUuidCopied] = useState(false);
  const [dailyUsageCount, setDailyUsageCount] = useState(0);

  // Computed: subscription is being canceled but still active until period end
  const isCanceling = cancelAtPeriodEnd || subscriptionStatus === 'scheduled_cancel';

  // Secure customer portal dynamic redirection
  const handleManageBilling = async () => {
    try {
      setBillingMessage(null);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setBillingMessage("Error: Missing user session token. Try re-logging.");
        setBillingSuccess(false);
        return;
      }
      
      window.open(`/billing/portal?token=${token}`, '_blank');
    } catch (err: any) {
      setBillingMessage("Failed to open portal: " + err.message);
      setBillingSuccess(false);
    }
  };

  const fetchRealInvoices = useCallback(async () => {
    if (!supabase || !sessionUser || isAnonUser || userPlan === 'free') {
      setInvoices([]);
      return;
    }
    setLoadingInvoices(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setLoadingInvoices(false);
        return;
      }
      const response = await fetch(`/billing/invoices?token=${token}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch invoices');
      setInvoices(data.orders || []);
    } catch (e) {
      console.warn("Failed to load Creem invoices:", e);
    } finally {
      setLoadingInvoices(false);
    }
  }, [sessionUser, isAnonUser, userPlan]);

  useEffect(() => {
    fetchRealInvoices();
  }, [fetchRealInvoices]);


  // Programmatic cancellation handler — schedules cancel at period end
  const handleCancelSubscription = async () => {
    setIsCancelingSub(true);
    setBillingMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setBillingMessage("Authentication session expired.");
        setBillingSuccess(false);
        return;
      }

      const response = await fetch('/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to cancel subscription.');

      setBillingSuccess(true);
      setBillingMessage("✓ Your subscription has been canceled. You'll retain access until the end of your current billing period.");
      onRefreshProfile();
    } catch (err: any) {
      setBillingSuccess(false);
      setBillingMessage("Cancellation failed: " + err.message);
    } finally {
      setIsCancelingSub(false);
      setCancelModalOpen(false);
    }
  };

  // Resume a scheduled_cancel subscription
  const handleResumeSubscription = async () => {
    setIsResumingSub(true);
    setBillingMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setBillingMessage("Authentication session expired.");
        setBillingSuccess(false);
        return;
      }

      const response = await fetch('/billing/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to resume subscription.');

      setBillingSuccess(true);
      setBillingMessage("✓ Subscription resumed! Your plan will continue as normal.");
      onRefreshProfile();
    } catch (err: any) {
      setBillingSuccess(false);
      setBillingMessage("Resume failed: " + err.message);
    } finally {
      setIsResumingSub(false);
    }
  };

  const handleCopyUUID = () => {
    navigator.clipboard.writeText(apiKey || '');
    setUuidCopied(true);
    setTimeout(() => setUuidCopied(false), 3000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SAYONARA') {
      setDeactivateError("Please type 'SAYONARA' to confirm account deactivation.");
      return;
    }
    setIsDeleting(true);
    setDeactivateError(null);
    try {
      if (supabase && sessionUser?.id) {
        await supabase.from('profiles').delete().eq('id', sessionUser.id);
      }
      await supabase.auth.signOut();
      setDeactivateSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 3500);
    } catch (err: any) {
      setDeactivateError("Failed to deactivate account: " + err.message);
      setIsDeleting(false);
    }
  };

  // Load database profile data on mount to ensure auto-syncing
  useEffect(() => {
    if (!supabase || !sessionUser || isAnonUser) return;
    async function fetchDbProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, username')
          .eq('id', sessionUser.id)
          .single();
        if (!error && data) {
          if (data.name !== null && data.name !== undefined) setProfileName(data.name);
          if (data.username !== null && data.username !== undefined) setProfileUsername(data.username);
        }
      } catch (err) {
        console.warn("DB profile load bypassed:", err);
      }
    }
    fetchDbProfile();
  }, [sessionUser, isAnonUser]);

  // Fetch actual daily usage count for progress bar
  useEffect(() => {
    if (!supabase || !sessionUser) return;
    const fetchUsage = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count, error } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', sessionUser.id)
        .gte('created_at', today.toISOString());
      if (!error && count !== null) {
        setDailyUsageCount(count);
      }
    };
    fetchUsage();
  }, [sessionUser]);

  // Auto-sync billing status on mount to ensure database self-heals silently
  useEffect(() => {
    if (!supabase || !sessionUser || isAnonUser) return;
    
    let active = true;
    
    async function autoSyncBilling() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token || !active) return;

        const response = await fetch('/billing/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok && active) {
          onRefreshProfile();
        }
      } catch (err) {
        console.warn("Silent billing auto-sync bypassed:", err);
      }
    }

    autoSyncBilling();

    return () => {
      active = false;
    };
  }, [sessionUser, isAnonUser]);

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 640, margin: '80px auto', padding: '0 32px', textAlign: 'center' }}>
        <Icon.Shield size={48} style={{ color: 'var(--fg-dim)', marginBottom: 20 }} />
        <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg)', margin: '0 0 10px' }}>Account Settings Locked</h2>
        <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
          You are currently visiting as a guest. Sign in or create a free account to customize workspace layout settings, manage subscriptions, and configure profile parameters.
        </p>
        <button onClick={onOpenAuthModal} className="reset" style={{
          padding: '12px 28px', borderRadius: 9,
          background: 'linear-gradient(180deg, oklch(0.72 0.18 265), oklch(0.62 0.20 265))',
          color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          boxShadow: '0 4px 14px oklch(0.50 0.20 265 / 0.3)',
        }}>Sign In / Sign Up</button>
      </div>
    );
  }

  // Format active plan localized strings
  const today = new Date();
  const nextDate = currentPeriodEnd ? new Date(currentPeriodEnd) : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const nextStr = formatter.format(nextDate);

  const planName = userPlan === 'api' ? 'Developer API' : userPlan === 'pro' ? 'Pro Plan' : userPlan === 'admin' ? 'System Administrator' : 'Free Plan';
  const planPrice = userPlan === 'api' ? '$29.00' : userPlan === 'pro' ? '$9.00' : '$0.00';
  const planPeriod = userPlan === 'free' ? 'forever' : 'month';
  const planLimits = userPlan === 'api' 
    ? 'Unlimited browser usage + 30,000 monthly API bearer token runs' 
    : userPlan === 'pro' 
      ? 'Unlimited browser usage + 1,000 high-precision document scans/mo' 
      : '20 daily runs on Free tools + 2 daily scans on Tier 2 heavy tools';

  return (
    <div style={{
      maxWidth: 850, margin: '40px auto 120px',
      padding: '0 24px', boxSizing: 'border-box',
      position: 'relative',
    }} className="fade-in">
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 800, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
        opacity: isLight ? 0.08 : 0.15,
        zIndex: 0,
      }}/>

      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Personal Profile</span>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.020em', margin: '8px 0 0', color: 'var(--fg)' }}>My Account Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--fg-dim)', margin: '6px 0 0' }}>Configure your display name, regional localizations, layout preferences, and manage secure SaaS billing.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, position: 'relative', zIndex: 1 }}>
        
        {/* Section 1: Profile Information (B2C Focus) */}
        <form onSubmit={handleSaveProfile} className="glass-card" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: 'oklch(0.18 0.010 265 / 0.15)',
              border: '1px solid oklch(0.70 0.18 265 / 0.3)',
              color: 'oklch(0.70 0.18 265)',
            }}>
              <Icon.Braces size={16} />
            </span>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: 0 }}>Profile Details</h3>
              <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Update your registered public user handle and full display name.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }} className="mono">Registered Email</label>
              <input type="text" readOnly value={sessionUser?.email || ''} style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                background: 'oklch(0.10 0.002 250)', border: '1px solid var(--border)',
                color: 'var(--fg-muted)', fontSize: 13, outline: 'none', cursor: 'not-allowed', boxSizing: 'border-box'
              }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }} className="mono">Full Display Name</label>
              <input type="text" placeholder="Your full name" value={profileName} onChange={e => setProfileName(e.target.value)} style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                background: 'oklch(0.14 0.005 250)', border: '1px solid var(--border)',
                color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box'
              }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }} className="mono">Username Handle</label>
              <div style={{ display: 'flex', position: 'relative', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 12, fontSize: 13, color: 'var(--fg-dim)' }}>@</span>
                <input type="text" placeholder="username" value={profileUsername} onChange={e => setProfileUsername(e.target.value)} style={{
                  width: '100%', padding: '10px 12px 10px 26px', borderRadius: 8,
                  background: 'oklch(0.14 0.005 250)', border: '1px solid var(--border)',
                  color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box'
                }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
            <span style={{ fontSize: 12, color: profileError ? 'oklch(0.60 0.20 20)' : 'oklch(0.78 0.16 145)' }}>
              {profileSuccess && "✓ Profile details updated successfully!"}
              {profileError && profileError}
            </span>
            <button type="submit" disabled={isSavingProfile} className="reset" style={{
              padding: '10px 20px', borderRadius: 8,
              background: 'linear-gradient(180deg, oklch(0.96 0.005 250), oklch(0.86 0.005 250))',
              color: 'oklch(0.16 0.008 250)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px oklch(0.96 0.005 250 / 0.15)'
            }}>
              {isSavingProfile ? 'Saving...' : 'Save Profile Details'}
            </button>
          </div>
        </form>

        {/* Section 2: Security Credentials */}
        <form onSubmit={handleUpdatePassword} className="glass-card" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: 'oklch(0.18 0.010 15 / 0.15)',
              border: '1px solid oklch(0.70 0.18 15 / 0.3)',
              color: 'oklch(0.70 0.18 15)',
            }}>
              <Icon.Lock size={16} />
            </span>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: 0 }}>Security Settings</h3>
              <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Update your account password. Secure crypt-hash applies.</p>
            </div>
          </div>

          {!showPasswordFields ? (
            <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', padding: '8px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 550, color: 'white' }}>Account Password Protection</span>
                <span style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>Last updated details saved. Minimum length constraints apply.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordFields(true)}
                className="reset"
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                  color: 'var(--fg)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer'
                }}
              >
                Change Password...
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }} className="mono">New Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      required
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 38px 10px 12px', borderRadius: 8,
                        background: 'oklch(0.14 0.005 250)', border: '1px solid var(--border)',
                        color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="reset" style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: 'var(--fg-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
                      {showNewPassword ? <Icon.EyeOff size={14} /> : <Icon.Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }} className="mono">Confirm New Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 38px 10px 12px', borderRadius: 8,
                        background: 'oklch(0.14 0.005 250)', border: '1px solid var(--border)',
                        color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="reset" style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: 'var(--fg-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
                      {showConfirmPassword ? <Icon.EyeOff size={14} /> : <Icon.Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: passwordSuccess ? 'oklch(0.78 0.16 145)' : 'oklch(0.60 0.20 20)' }}>
                  {passwordMessage && passwordMessage}
                </span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => { setShowPasswordFields(false); setNewPassword(''); setConfirmPassword(''); setPasswordMessage(null); }}
                    className="reset"
                    style={{ fontSize: 12.5, color: 'var(--fg-dim)', cursor: 'pointer', background: 'none', border: 'none' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="reset"
                    style={{
                      padding: '8px 16px', borderRadius: 8,
                      background: 'linear-gradient(180deg, oklch(0.96 0.005 250), oklch(0.86 0.005 250))',
                      color: 'oklch(0.16 0.008 250)', fontWeight: 600, fontSize: 12.5,
                      cursor: isUpdatingPassword ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Section 3: Layout Configuration */}
        <div className="glass-card" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: 'oklch(0.18 0.010 210 / 0.15)',
              border: '1px solid oklch(0.70 0.18 210 / 0.3)',
              color: 'oklch(0.70 0.18 210)',
            }}>
              <Icon.Grid size={16} />
            </span>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: 0 }}>Layout Settings</h3>
              <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Choose the active alignment display of the document editing cockpit.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <button onClick={() => handleLayoutChange('standard')} className="reset layout-card" style={{
              textAlign: 'left', padding: '16px 20px', borderRadius: 12,
              background: editorLayout === 'standard' ? 'oklch(0.18 0.010 265 / 0.15)' : 'oklch(0.14 0.005 250)',
              border: editorLayout === 'standard' ? '1px solid var(--accent)' : '1px solid var(--border)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, transition: 'all 0.15s ease'
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Standard Layout</span>
              <span style={{ fontSize: 11, color: 'var(--fg-subtle)', lineHeight: 1.4 }}>Dual comparison pane: Markdown text editor on the left and visual document outputs on the right.</span>
            </button>

            <button onClick={() => handleLayoutChange('reversed')} className="reset layout-card" style={{
              textAlign: 'left', padding: '16px 20px', borderRadius: 12,
              background: editorLayout === 'reversed' ? 'oklch(0.18 0.010 265 / 0.15)' : 'oklch(0.14 0.005 250)',
              border: editorLayout === 'reversed' ? '1px solid var(--accent)' : '1px solid var(--border)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, transition: 'all 0.15s ease'
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Reversed Layout</span>
              <span style={{ fontSize: 11, color: 'var(--fg-subtle)', lineHeight: 1.4 }}>Mirror layout: Visual live outputs rendered on the left, editing Markdown content on the right.</span>
            </button>
          </div>
        </div>

        {/* Section 4: Localization Preferences */}
        <form onSubmit={handleSaveLocalization} className="glass-card" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: 'oklch(0.18 0.010 120 / 0.15)',
              border: '1px solid oklch(0.70 0.16 120 / 0.3)',
              color: 'oklch(0.70 0.16 120)',
            }}>
              <Icon.Globe size={16} />
            </span>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: 0 }}>Localization Preferences</h3>
              <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Configure regional timezones and display languages.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }} className="mono">Display Language</label>
              <select value={profileLanguage} onChange={e => setProfileLanguage(e.target.value)} style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                background: 'oklch(0.14 0.005 250)', border: '1px solid var(--border)',
                color: 'white', fontSize: 13, outline: 'none', cursor: 'pointer', boxSizing: 'border-box'
              }}>
                <option value="en_US">English (United States)</option>
                <option value="en_GB">English (United Kingdom)</option>
                <option value="es_ES">Español (España)</option>
                <option value="fr_FR">Français (France)</option>
                <option value="de_DE">Deutsch (Deutschland)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }} className="mono">System Timezone</label>
              <select value={profileTimezone} onChange={e => setProfileTimezone(e.target.value)} style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                background: 'oklch(0.14 0.005 250)', border: '1px solid var(--border)',
                color: 'white', fontSize: 13, outline: 'none', cursor: 'pointer', boxSizing: 'border-box'
              }}>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
                <option value="America/New_York">Eastern Standard Time (New York, -5)</option>
                <option value="Europe/London">Greenwich Mean Time (London, +0)</option>
                <option value="Europe/Berlin">Central European Time (Berlin, +1)</option>
                <option value="Asia/Kolkata">Indian Standard Time (New Delhi, +5:30)</option>
                <option value="Asia/Tokyo">Japan Standard Time (Tokyo, +9)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
            <span style={{ fontSize: 12, color: 'oklch(0.78 0.16 145)' }}>
              {locSuccess && "✓ Localization saved successfully!"}
            </span>
            <button type="submit" disabled={isSavingLoc} className="reset" style={{
              padding: '8px 16px', borderRadius: 8,
              background: 'linear-gradient(180deg, oklch(0.96 0.005 250), oklch(0.86 0.005 250))',
              color: 'oklch(0.16 0.008 250)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer'
            }}>
              {isSavingLoc ? 'Saving...' : 'Save Localization'}
            </button>
          </div>
        </form>

        {/* Section 5: Daily limits visual meter */}
        <div className="glass-card" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: 'oklch(0.18 0.010 75 / 0.15)',
              border: '1px solid oklch(0.70 0.16 75 / 0.3)',
              color: 'oklch(0.70 0.16 75)',
            }}>
              <Icon.Sparkles size={16} />
            </span>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: 0 }}>Daily Workspace Limit Meter</h3>
              <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Real-time count of active data runs and metered bounds.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'white', fontWeight: 550 }}>Daily Metered Runs</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent)' }} className="mono">
                {userPlan === 'pro' ? 'Unlimited / Unlimited' : userPlan === 'api' ? 'Unlimited / 30,000 API Runs/mo' : `${dailyUsageCount} / 20 used today`}
              </span>
            </div>

            <div style={{ height: 10, width: '100%', background: 'oklch(0.18 0.005 250)', borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{
                height: '100%',
                width: (userPlan === 'pro' || userPlan === 'api') ? '100%' : `${Math.min((dailyUsageCount / 20) * 100, 100)}%`,
                background: (userPlan === 'pro' || userPlan === 'api')
                  ? 'linear-gradient(90deg, oklch(0.70 0.18 265) 0%, oklch(0.70 0.16 195) 50%, oklch(0.70 0.16 145) 100%)'
                  : 'linear-gradient(90deg, oklch(0.70 0.16 145) 0%, oklch(0.70 0.16 75) 60%, oklch(0.65 0.20 20) 100%)',
                boxShadow: '0 0 10px var(--accent)30',
                transition: 'width 0.5s ease-out'
              }} />
            </div>
            {userPlan !== 'pro' && userPlan !== 'api' && (
              <p style={{ fontSize: 11.5, color: 'var(--fg-dim)', margin: 0, lineHeight: 1.4 }}>
                Free registered accounts have a metered bound of 20 runs. Upgrade to Pro or API Tier to strip watermarks automatically and unlock unlimited daily loops!
              </p>
            )}
          </div>
        </div>

        {/* Section 6: Subscription, Billing & Invoice History Details */}
        <div className="glass-card" style={{ padding: '32px 30px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: 'oklch(0.18 0.010 145 / 0.15)',
              border: '1px solid oklch(0.70 0.16 145 / 0.3)',
              color: 'oklch(0.70 0.16 145)',
            }}>
              <Icon.Database size={16} />
            </span>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: 0 }}>Billing, Subscription & Invoices</h3>
              <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Manage your active payment billing tier, view usage limits, and download invoices.</p>
            </div>
          </div>

          {billingMessage && (
            <div className="fade-in" style={{
              padding: '12px 16px', borderRadius: 8,
              background: billingMessage.startsWith('✓') ? 'oklch(0.22 0.010 145 / 0.15)' : 'oklch(0.18 0.010 15 / 0.15)',
              border: billingMessage.startsWith('✓') ? '1px solid oklch(0.78 0.16 145 / 0.3)' : '1px solid oklch(0.78 0.16 15 / 0.3)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 12.5
            }}>
              <span>{billingMessage}</span>
              <button onClick={() => setBillingMessage(null)} className="reset" style={{
                color: 'var(--fg-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                padding: 4, background: 'none', border: 'none'
              }}>
                <Icon.X size={14} />
              </button>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 32,
          }}>
            {/* Left Side: Subscription Plan Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <span style={{ fontSize: 10.5, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }} className="mono">Active Plan</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>{planName}</span>
                  {userPlan !== 'free' && (
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>
                      {planPrice} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--fg-dim)' }}>/ {planPeriod}</span>
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isCanceling ? (
                      <>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.65 0.20 50)', boxShadow: '0 0 8px oklch(0.65 0.20 50)' }} />
                        <span style={{ fontSize: 12, color: 'oklch(0.65 0.20 50)', fontWeight: 600 }}>
                          Canceling
                        </span>
                      </>
                    ) : (userPlan === 'pro' || userPlan === 'api') ? (
                      <>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.78 0.16 145)', boxShadow: '0 0 8px oklch(0.78 0.16 145)' }} />
                        <span style={{ fontSize: 12, color: 'oklch(0.78 0.16 145)', fontWeight: 600 }}>
                          Active
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--fg-dim)' }} />
                        <span style={{ fontSize: 12, color: 'var(--fg-dim)', fontWeight: 500 }}>
                          No Active Subscription
                        </span>
                      </>
                    )}
                  </div>
                  {isCanceling && (
                    <p style={{ fontSize: 12, color: 'oklch(0.65 0.20 50 / 0.9)', margin: 0, lineHeight: 1.4 }}>
                      Your plan remains active until <strong>{nextStr}</strong>. After that, your account will revert to the Free tier.
                    </p>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <span style={{ fontSize: 10.5, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }} className="mono">Quotas & Usage Limits</span>
                <p style={{ fontSize: 12.5, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.45 }}>
                  {planLimits}
                </p>
              </div>

              {(userPlan === 'pro' || userPlan === 'api') && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 10.5, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 2, textAlign: 'right' }} className="mono">
                      {isCanceling ? 'Access Expires' : 'Next Billing Date'}
                    </span>
                    <span style={{ fontSize: 13, color: 'white', fontWeight: 500 }}>{nextStr}</span>
                  </div>
                  {!isCanceling && (
                    <div>
                      <span style={{ fontSize: 10.5, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 2, textAlign: 'right' }} className="mono">Payment Partner</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--fg-muted)' }}>
                        <Icon.CreditCard size={14} style={{ color: 'var(--accent)' }} />
                        <span>Creem Payment Hub</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
                {userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                    {!isCanceling && (
                      <button onClick={onShowPaywall} className="reset" style={{
                        width: '100%', padding: '10px 14px', borderRadius: 8,
                        background: 'linear-gradient(180deg, var(--accent) 0%, oklch(0.60 0.16 265) 100%)',
                        border: '1px solid var(--border)',
                        color: 'white', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                        textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6
                      }}>
                        <Icon.Sparkles size={14} style={{ color: 'white' }} />
                        <span>Change Plan</span>
                      </button>
                    )}
                    <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                      <button onClick={handleManageBilling} className="reset" style={{
                        flex: 1, padding: '10px 14px', borderRadius: 8,
                        background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                        color: 'var(--fg)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                        textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6
                      }}>
                        <Icon.Grid size={14} />
                        <span>Manage Billing</span>
                      </button>
                      {isCanceling ? (
                        <button onClick={handleResumeSubscription} disabled={isResumingSub} className="reset" style={{
                          flex: 1, padding: '10px 14px', borderRadius: 8,
                          background: 'oklch(0.18 0.010 145 / 0.15)', border: '1px solid oklch(0.70 0.16 145 / 0.3)',
                          color: 'oklch(0.78 0.16 145)', fontWeight: 600, fontSize: 12.5, cursor: isResumingSub ? 'not-allowed' : 'pointer',
                        }}>{isResumingSub ? 'Resuming...' : 'Resume Subscription'}</button>
                      ) : (
                        <button onClick={() => setCancelModalOpen(true)} className="reset" style={{
                          flex: 1, padding: '10px 14px', borderRadius: 8,
                          background: 'oklch(0.18 0.010 15 / 0.15)', border: '1px solid oklch(0.50 0.15 15 / 0.3)',
                          color: 'oklch(0.78 0.16 15)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                        }}>Cancel Subscription</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                    <button onClick={onShowPaywall} className="reset" style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      background: 'linear-gradient(180deg, var(--accent) 0%, oklch(0.60 0.16 265) 100%)',
                      border: '1px solid var(--border)',
                      color: 'white', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                      textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}>
                      <Icon.Sparkles size={14} style={{ color: 'white' }} />
                      <span>Upgrade to Premium</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Invoice History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <span style={{ fontSize: 10.5, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }} className="mono">Invoice History</span>
                <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '0 0 12px' }}>View your payment history here. Download legally valid tax invoices directly in your secure Creem Portal.</p>
              </div>

              {userPlan === 'free' ? (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '24px 20px', background: 'var(--bg-elev-1)', border: '1px dashed var(--border)',
                  borderRadius: 12, textAlign: 'center', gap: 8
                }}>
                  <Icon.FileText size={24} style={{ color: 'var(--fg-dim)' }} />
                  <span style={{ fontSize: 12.5, fontWeight: 550, color: 'var(--fg-subtle)' }}>No Invoices Yet</span>
                  <span style={{ fontSize: 11, color: 'var(--fg-dim)', maxWidth: 220 }}>Upgrade to a paid tier to generate invoice history.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {loadingInvoices ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '24px 20px', background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
                      borderRadius: 10
                    }}>
                      <Icon.Loader size={16} className="spin" style={{ color: 'var(--accent)' }} />
                      <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Retrieving Creem billing history...</span>
                    </div>
                  ) : invoices.length > 0 ? (
                    invoices.map((order) => {
                      const orderDate = new Date(order.createdAt);
                      const formattedOrderDate = formatter.format(orderDate);
                      const displayAmount = `$${(order.amount / 100).toFixed(2)}`;
                      const invId = `INV-${order.id.substring(0, 8).toUpperCase()}`;

                      return (
                        <div key={order.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 14px', background: 'var(--bg-elev-1)',
                          border: '1px solid var(--border)', borderRadius: 10,
                        }}>
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'white' }}>
                              {formattedOrderDate}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--fg-dim)' }}>
                              {invId} • {planName}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'white' }}>{displayAmount}</span>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '4px 8px', borderRadius: 6,
                              background: 'oklch(0.70 0.16 145 / 0.12)', border: '1px solid oklch(0.70 0.16 145 / 0.3)',
                              color: 'oklch(0.78 0.16 145)', fontSize: 11, fontWeight: 555
                            }}>
                              <Icon.Check size={11} />
                              <span>Paid</span>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    /* Fallback to computed dynamic billing row if empty */
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', background: 'var(--bg-elev-1)',
                      border: '1px solid var(--border)', borderRadius: 10,
                    }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'white' }}>
                          {(() => {
                            const invoiceDate = currentPeriodEnd 
                              ? new Date(new Date(currentPeriodEnd).getTime() - 30 * 24 * 60 * 60 * 1000)
                              : new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
                            return formatter.format(invoiceDate);
                          })()}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--fg-dim)' }}>
                          {subscriptionId ? `INV-${subscriptionId.substring(0, 8).toUpperCase()}` : `INV-SANDBOX-${customerId?.substring(0, 6).toUpperCase() || 'NEW'}`} • {planName}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'white' }}>{planPrice}</span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 8px', borderRadius: 6,
                          background: 'oklch(0.70 0.16 145 / 0.12)', border: '1px solid oklch(0.70 0.16 145 / 0.3)',
                          color: 'oklch(0.78 0.16 145)', fontSize: 11, fontWeight: 555
                        }}>
                          <Icon.Check size={11} />
                          <span>Paid</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Portal Integration Button */}
                  <button 
                    onClick={handleManageBilling}
                    className="reset"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '10px 14px', borderRadius: 10,
                      background: 'oklch(0.70 0.18 265 / 0.08)',
                      border: '1px dashed oklch(0.70 0.18 265 / 0.3)',
                      color: 'oklch(0.80 0.15 265)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s',
                      marginTop: 4
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'oklch(0.70 0.18 265 / 0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'oklch(0.70 0.18 265 / 0.08)'}
                  >
                    <Icon.Globe size={12} />
                    <span>View & Download Official Tax Invoices in Creem Portal →</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 7: Developer Sandbox Integration details */}
        <div className="glass-card" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: 'oklch(0.18 0.010 195 / 0.15)',
              border: '1px solid oklch(0.70 0.16 195 / 0.3)',
              color: 'oklch(0.70 0.16 195)',
            }}>
              <Icon.Database size={16} />
            </span>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: 0 }}>API Sandbox Details</h3>
              <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Access credentials for the developer API playground.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }} className="mono">Account Access Tier</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: userPlan === 'pro' || userPlan === 'api' ? 'var(--pro)' : 'oklch(0.70 0.16 145)' }} />
                  <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 12.5, color: 'white' }}>
                    {planName}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }} className="mono">
                  {userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin' ? 'Developer Production Key' : 'Developer Sandbox Key'}
                </div>
                <code style={{ fontSize: 11, background: 'var(--bg-elev-1)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: 6, display: 'inline-block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {apiKey || 'No key generated'}
                </code>
              </div>
              <button type="button" onClick={handleCopyUUID} className="reset" style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', background: 'var(--bg-elev-2)' }}>
                {uuidCopied ? <Icon.Check size={13} style={{ color: 'oklch(0.78 0.16 145)' }} /> : <Icon.Copy size={13} style={{ color: 'white' }} />}
              </button>
            </div>
          </div>
        </div>

        {/* Section 8: Danger Zone (Step 4 Collapsible deactivation) */}
        <div className="glass-card" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 20, border: '1px solid oklch(0.60 0.20 20 / 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid oklch(0.60 0.20 20 / 0.2)', paddingBottom: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: 'oklch(0.18 0.010 20 / 0.15)',
              border: '1px solid oklch(0.60 0.20 20 / 0.3)',
              color: 'oklch(0.65 0.22 20)',
            }}>
              <Icon.Shield size={16} />
            </span>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'oklch(0.65 0.22 20)', margin: 0 }}>Danger Zone</h3>
              <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Deactivate your workspace account permanently.</p>
            </div>
          </div>

          {!showDeactivateFields ? (
            <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', padding: '8px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 550, color: 'oklch(0.65 0.22 20)' }}>Deactivate Workspace Account</span>
                <span style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>Initiate permanent deletion protocol. Grace window applies.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeactivateFields(true)}
                className="reset"
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: 'oklch(0.18 0.010 20 / 0.15)', border: '1px solid oklch(0.60 0.20 20 / 0.3)',
                  color: 'oklch(0.65 0.22 20)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer'
                }}
              >
                Deactivate Account...
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="fade-in">
              <div style={{
                background: 'oklch(0.18 0.010 20 / 0.1)', border: '1px solid oklch(0.60 0.20 20 / 0.3)',
                padding: '14px 18px', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10
              }}>
                <div style={{ fontSize: 13, color: 'oklch(0.65 0.22 20)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon.Shield size={14} />
                  <span>Immediate Deactivation Warning</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.5 }}>
                  Deactivating your account will freeze your Pro API keys and restrict workspace access immediately. As per global privacy compliance, all associated data is queued for absolute purging.
                </p>
                <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                  <strong>20-Day Restoration Grace Window</strong>: Your account metadata and database records will remain in a soft-deleted state in our backend for exactly 20 days. If you return and log back in within 20 days, all configurations will be automatically restored. If you do not return, it will be permanently deleted.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }} className="mono">
                  To confirm deactivation, please type "SAYONARA" below:
                </label>
                <input
                  type="text"
                  placeholder="Type SAYONARA to confirm"
                  value={deleteConfirmation}
                  onChange={e => setDeleteConfirmation(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    background: 'oklch(0.14 0.005 250)', border: '1px solid var(--border)',
                    color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              {deactivateError && (
                <div style={{ fontSize: 12, color: 'oklch(0.65 0.22 20)', fontWeight: 500 }}>
                  {deactivateError}
                </div>
              )}
              {deactivateSuccess && (
                <div style={{ fontSize: 12, color: 'oklch(0.78 0.16 145)', fontWeight: 555 }}>
                  ✓ SAYONARA! Deactivation successful. Redirecting to landing page...
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => { setShowDeactivateFields(false); setDeleteConfirmation(''); setDeactivateError(null); }}
                  className="reset"
                  style={{ fontSize: 12.5, color: 'var(--fg-dim)', cursor: 'pointer', background: 'none', border: 'none' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmation !== 'SAYONARA' || isDeleting}
                  onClick={handleDeleteAccount}
                  className="reset"
                  style={{
                    padding: '10px 20px', borderRadius: 8,
                    background: deleteConfirmation === 'SAYONARA' ? 'oklch(0.65 0.22 20)' : 'oklch(0.18 0.010 20 / 0.1)',
                    border: deleteConfirmation === 'SAYONARA' ? 'none' : '1px solid var(--border)',
                    color: deleteConfirmation === 'SAYONARA' ? 'white' : 'var(--fg-dim)',
                    fontWeight: 600, fontSize: 13,
                    cursor: deleteConfirmation === 'SAYONARA' && !isDeleting ? 'pointer' : 'not-allowed'
                  }}
                >
                  {isDeleting ? 'Deactivating...' : 'Confirm Workspace Deactivation'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <button onClick={onLaunch} className="reset" style={{
          padding: '11px 24px', borderRadius: 9,
          background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
          color: 'var(--fg)', fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
        >Return to App Console</button>
      </div>

      {/* Subscription Cancellation Confirmation Dialog Modal */}
      {cancelModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'oklch(0.12 0.005 250 / 0.75)',
          backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }} onClick={() => setCancelModalOpen(false)}>
          <div style={{
            width: '100%', maxWidth: 460,
            background: 'var(--bg-elev-1)',
            border: '1px solid oklch(0.60 0.20 20 / 0.3)',
            borderRadius: 16,
            padding: 28,
            boxShadow: '0 20px 40px oklch(0 0 0 / 0.4)',
            display: 'flex', flexDirection: 'column', gap: 20,
            animation: 'fadeIn 0.2s ease-out',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, borderRadius: '50%',
                background: 'oklch(0.18 0.010 20 / 0.15)',
                border: '1px solid oklch(0.60 0.20 20 / 0.3)',
                color: 'oklch(0.65 0.22 20)',
              }}>
                <Icon.AlertCircle size={20} />
              </span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'white', margin: 0 }}>Cancel Subscription?</h3>
                <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Confirm subscription cancellation request</p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to cancel your premium subscription? You will still retain active access to all **{planName}** features until **{nextStr}**, after which your account will return to the Free Tier.
            </p>

            <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="reset"
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8,
                  background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                  color: 'var(--fg)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                No, Keep Premium
              </button>
              <button
                type="button"
                disabled={isCancelingSub}
                onClick={handleCancelSubscription}
                className="reset"
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8,
                  background: 'oklch(0.65 0.22 20)',
                  color: 'white', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {isCancelingSub ? 'Canceling...' : 'Yes, Cancel Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ChangelogPageProps {
  onLaunch: () => void;
}

function ChangelogPage({ onLaunch }: ChangelogPageProps) {
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

  const releases = [
    {
      version: 'v1.1.0',
      date: 'May 27, 2026',
      badge: 'Major Release',
      hue: 195, /* Cyan */
      title: 'JSON Formatter, Validator & Global Navigation Upgrades',
      items: [
        'Tool 2 Integration: Full end-to-end launch of the JSON Formatter, Validator, and Auto-Repair tool featuring split-pane comparison view, drag-and-drop file uploads, real-time KB/line metrics, and automatic repair routines.',
        'Global Navigation Polish: Upgraded all header, footer, and catalog links to true, crawlable relative root paths (/pricing, /docs, /changelog, /dashboard) to enable high-speed client-side soft routing and search engine indexing.',
        'Dashboard Workspace Refactoring: Renamed the internal workspace paths from /home to /dashboard, providing a premium SaaS application atmosphere.',
        'Enterprise Intake Flow: Integrated a gorgeous, custom glassmorphic request overlay modal for large teams asking about SSO/SAML, custom compute pipelines, or SOC2.',
      ],
    },
    {
      version: 'v1.0.0',
      date: 'May 26, 2026',
      badge: 'Launch',
      hue: 265, /* Purple */
      title: 'Universal AI-to-Doc Formatter Launch',
      items: [
        'Universal AI Formatter: Polish raw transcripts and AI-generated outputs instantly into 3 beautiful styles (Modern, Academic, Minimalist) across 5 high-fidelity formats (PDF, DOCX, HTML, TXT, MD).',
        'Digital Bouncer Architecture: Fully sandboxed thread-level locking mechanisms in the FastAPI backend protect system memory from heavy multi-user PDF compile crashes.',
        'Visual Style Tokens: Integrated standard oklch color palettes, sleek dark themes, and high-performance interactive controls.'
      ],
    },
  ];

  return (
    <div style={{
      maxWidth: 880, margin: '40px auto 120px',
      padding: '0 32px', boxSizing: 'border-box',
      position: 'relative',
    }} className="fade-in">
      {/* Subpage ambient top-center glow */}
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 800, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
        opacity: isLight ? 0.08 : 0.15,
        zIndex: 0,
      }}/>

      <div style={{ marginBottom: 48, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <span style={eyebrow}>Software Releases</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>Changelog & Updates</h1>
        <p style={sectionSubtitle}>Follow our daily product iterations as we roll out premium utilities for your data and file workflows.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 40, position: 'relative', zIndex: 1 }}>
        {/* Vertical Timeline bar */}
        <div style={{
          position: 'absolute', left: 16, top: 24, bottom: 24, width: 1,
          background: 'var(--border)',
        }} />

        {releases.map((rel) => (
          <div key={rel.version} style={{ display: 'flex', gap: 24, position: 'relative' }}>
            {/* Timeline Dot */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg-elev-1)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, zIndex: 2,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: `oklch(0.75 0.14 ${rel.hue})`,
                boxShadow: isLight ? 'none' : `0 0 10px oklch(0.75 0.14 ${rel.hue} / 0.8)`,
              }} />
            </div>

            {/* Content card */}
            <div className="glass-card" style={{
              flex: 1, padding: '24px 28px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg)' }} className="mono">{rel.version}</span>
                <span style={{ fontSize: 13, color: 'var(--fg-subtle)' }}>({rel.date})</span>
                <span style={{
                  padding: '3px 8px', borderRadius: 20,
                  fontSize: 10.5, fontWeight: 600,
                  background: tint(rel.hue, 0.18, 0.08, 0.15),
                  border: `1px solid ${tintBorder(rel.hue)}`,
                  color: tintFg(rel.hue),
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }} className="mono">{rel.badge}</span>
              </div>

              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg)', margin: '0 0 16px' }}>{rel.title}</h2>

              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--fg-muted)', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 10, lineHeight: 1.55 }}>
                {rel.items.map((item, idx) => (
                  <li key={idx} style={{ listStyleType: 'square' }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 48, position: 'relative', zIndex: 1 }}>
        <button onClick={onLaunch} className="reset" style={{
          padding: '12px 24px', borderRadius: 9,
          background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
          color: 'var(--fg)', fontWeight: 500, fontSize: 14, cursor: 'pointer',
          boxShadow: '0 4px 12px oklch(0 0 0 / 0.15)',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
        >Explore the Dashboard</button>
      </div>
    </div>
  );
}

/* =========================================================================
   RoadmapPage Component
   ========================================================================= */
interface RoadmapPageProps {
  onLaunch: () => void;
}

function RoadmapPage({ onLaunch }: RoadmapPageProps) {
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

  const milestones = [
    {
      quarter: 'Q2 2026',
      hue: 265,
      items: [
        { title: 'Screenshot → Excel (OCR)', status: 'in-progress' },
        { title: 'PDF Bank Statement Parser', status: 'in-progress' },
        { title: 'Subtitle Re-syncer', status: 'planned' },
        { title: 'HEIC / WebP Batch Converter', status: 'planned' },
      ],
    },
    {
      quarter: 'Q3 2026',
      hue: 195,
      items: [
        { title: 'Auto-Redactor (PII Scrubber)', status: 'planned' },
        { title: 'Visual PDF Diff Checker', status: 'planned' },
        { title: 'QR Code Generator & Reader', status: 'planned' },
        { title: 'Team Workspaces & Sharing', status: 'planned' },
      ],
    },
    {
      quarter: 'Q4 2026',
      hue: 75,
      items: [
        { title: 'API Access & Webhooks', status: 'planned' },
        { title: 'Custom Branded Exports', status: 'planned' },
        { title: 'Batch Processing (500 files)', status: 'planned' },
        { title: 'SOC2 Compliance & SSO', status: 'planned' },
      ],
    },
  ];

  const statusColors: Record<string, { bg: string; fg: string; label: string }> = {
    'in-progress': {
      bg: isLight ? 'oklch(0.92 0.04 195)' : 'oklch(0.22 0.06 195 / 0.3)',
      fg: isLight ? 'oklch(0.48 0.12 195)' : 'oklch(0.78 0.14 195)',
      label: 'In Progress',
    },
    'planned': {
      bg: isLight ? 'oklch(0.94 0.03 265)' : 'oklch(0.22 0.04 265 / 0.2)',
      fg: isLight ? 'oklch(0.52 0.10 265)' : 'oklch(0.65 0.10 265)',
      label: 'Planned',
    },
  };

  return (
    <div style={{
      maxWidth: 880, margin: '40px auto 120px',
      padding: '0 32px', boxSizing: 'border-box',
      position: 'relative',
    }} className="fade-in">
      {/* Subpage ambient top-center glow */}
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 800, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
        opacity: isLight ? 0.08 : 0.15,
        zIndex: 0,
      }}/>

      <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
        <span style={eyebrow}>Product Vision</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>Roadmap</h1>
        <p style={sectionSubtitle}>What we're building next. Priorities shift based on user demand—tell us what matters most.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, position: 'relative', zIndex: 1 }}>
        {milestones.map((ms) => (
          <div key={ms.quarter} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: `oklch(0.75 0.14 ${ms.hue})`,
                boxShadow: isLight ? 'none' : `0 0 10px oklch(0.75 0.14 ${ms.hue} / 0.8)`,
              }} />
              <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg)' }} className="mono">{ms.quarter}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ms.items.map((item) => {
                const st = statusColors[item.status];
                return (
                  <div key={item.title} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'var(--bg-elev-1)',
                    border: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: 14, color: 'var(--fg-muted)', fontWeight: 500 }}>{item.title}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      padding: '3px 8px', borderRadius: 12,
                      background: st.bg, color: st.fg,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }} className="mono">{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   ContactPage Component
   ========================================================================= */
interface ContactPageProps {
  onLaunch: () => void;
}

function ContactPage({ onLaunch }: ContactPageProps) {
  const [sent, setSent] = useState(false);
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

  return (
    <div style={{
      maxWidth: 720, margin: '40px auto 120px',
      padding: '0 32px', boxSizing: 'border-box',
      position: 'relative',
    }} className="fade-in">
      {/* Subpage ambient top-center glow */}
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 800, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
        opacity: isLight ? 0.08 : 0.15,
        zIndex: 0,
      }}/>

      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <span style={eyebrow}>Get In Touch</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>Contact Us</h1>
        <p style={sectionSubtitle}>Have a question, feature request, or partnership opportunity? We'd love to hear from you.</p>
      </div>

      {!sent ? (
        <div className="glass-card" style={{ position: 'relative', zIndex: 1, padding: '36px clamp(20px, 5vw, 40px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
              <input type="email" placeholder="you@example.com" style={{
                width: '100%', padding: '11px 14px', borderRadius: 8,
                background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
                color: 'var(--fg)', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-elev-2)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elev-1)'; }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subject</label>
              <input type="text" placeholder="Feature request, bug report, partnership…" style={{
                width: '100%', padding: '11px 14px', borderRadius: 8,
                background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
                color: 'var(--fg)', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-elev-2)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elev-1)'; }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message</label>
              <textarea rows={5} placeholder="Tell us what's on your mind…" style={{
                width: '100%', padding: '11px 14px', borderRadius: 8,
                background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
                color: 'var(--fg)', fontSize: 14, outline: 'none',
                resize: 'vertical', fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-elev-2)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elev-1)'; }}
              />
            </div>
            <button onClick={() => setSent(true)} className="reset" style={{
              width: '100%', padding: '12px', borderRadius: 8,
              background: 'linear-gradient(180deg, oklch(0.72 0.18 265), oklch(0.62 0.20 265))',
              color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 4px 14px oklch(0.50 0.20 265 / 0.3)',
            }}>Send Message</button>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 32px', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'oklch(0.22 0.010 145 / 0.2)',
            border: '1px solid oklch(0.75 0.14 145 / 0.4)',
            color: 'oklch(0.78 0.16 145)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
            boxShadow: isLight ? 'none' : '0 0 20px oklch(0.78 0.16 145 / 0.25)',
          }}>
            <Icon.Check size={28} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg)', margin: '0 0 10px' }}>Message Sent!</h2>
          <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.5 }}>
            Thank you for reaching out. We'll get back to you within 24 hours.
          </p>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   PrivacyPage Component
   ========================================================================= */
interface PrivacyPageProps {
  onLaunch: () => void;
}

function PrivacyPage({ onLaunch }: PrivacyPageProps) {
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

  const sections = [
    {
      title: '1. Data We Collect',
      content: 'We collect minimal usage analytics (page views, tool usage counts) via privacy-first analytics. We do not collect, store, or transmit any document contents, file data, or personally identifiable information through our tool processing pipeline. Files processed through on-device tools never leave your browser.',
    },
    {
      title: '2. On-Device Processing',
      content: 'The majority of our tools execute entirely within your browser using WebAssembly and JavaScript. Your files are processed locally on your device and are never uploaded to our servers unless you explicitly use a server-side tool (clearly labeled).',
    },
    {
      title: '3. Server-Side Processing',
      content: 'For tools that require server-side compute (PDF generation, OCR, bank statement parsing), files are streamed directly to memory, processed, and the result is returned immediately. We do not persist, cache, or log any uploaded content. Processing buffers are cleared after each request.',
    },
    {
      title: '4. Cookies & Tracking',
      content: 'We use only essential cookies for session management and user preferences (theme, last-used tool). We do not use third-party tracking pixels, advertising cookies, or fingerprinting technologies.',
    },
    {
      title: '5. Third-Party Services',
      content: 'We use Vercel for hosting and Render for backend compute during our prototype phase. Both services comply with GDPR and SOC2 standards. We do not share any user data with third parties for marketing or advertising purposes.',
    },
    {
      title: '6. Your Rights',
      content: 'You can request deletion of your account and all associated data at any time by contacting us. Since we store minimal data, most users have effectively zero stored personal information beyond their email address (if registered).',
    },
  ];

  return (
    <div style={{
      maxWidth: 880, margin: '40px auto 120px',
      padding: '0 32px', boxSizing: 'border-box',
      position: 'relative',
    }} className="fade-in">
      {/* Subpage ambient top-center glow */}
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 800, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
        opacity: isLight ? 0.08 : 0.15,
        zIndex: 0,
      }}/>

      <div style={{ marginBottom: 40, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <span style={eyebrow}>Legal</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: 'var(--fg-dim)', marginTop: 8 }}>Last updated: May 27, 2026</p>
      </div>

      <div className="glass-card" style={{ position: 'relative', zIndex: 1, padding: '40px clamp(24px, 5vw, 48px)', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {sections.map((s) => (
            <div key={s.title}>
              <h2 style={{ fontSize: 17, color: 'var(--fg)', fontWeight: 600, margin: '0 0 10px', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>{s.title}</h2>
              <p style={{ fontSize: 14.5, color: 'var(--fg-muted)', lineHeight: 1.65, margin: 0 }}>{s.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{
        marginTop: 32, padding: '24px 28px',
        textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.5 }}>
          Questions about our privacy practices? <a href="/contact" style={{ color: 'var(--accent)', textDecoration: 'underline', textDecorationColor: 'var(--accent)' }}>Contact us</a> and we'll respond within 24 hours.
        </p>
      </div>
    </div>
  );
}

/* =========================================================================
   BlogPage Component
   ========================================================================= */
interface BlogPageProps {
  onLaunch: () => void;
  brandName: string;
}

function BlogPage({ onLaunch, brandName }: BlogPageProps) {
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

  const posts = [
    {
      title: `Why We Built ${brandName}: The Case for On-Device Utilities`,
      date: 'May 27, 2026',
      excerpt: 'Most file-processing websites upload your data to a server, process it, and send it back. We asked: what if the processing never left your browser?',
      hue: 265,
      readTime: '4 min read',
    },
    {
      title: 'Introducing the Universal AI Formatter',
      date: 'May 26, 2026',
      excerpt: 'Copy-paste from ChatGPT, Gemini, or Claude and get a beautifully formatted PDF, DOCX, or HTML document in seconds. Here\'s how it works under the hood.',
      hue: 195,
      readTime: '6 min read',
    },
    {
      title: 'Our Pricing Philosophy: Metered Freemium with PPP',
      date: 'May 25, 2026',
      excerpt: 'How we designed a pricing model that keeps core tools free forever while sustainably funding compute-heavy operations like OCR and PDF parsing.',
      hue: 75,
      readTime: '3 min read',
    },
  ];

  return (
    <div style={{
      maxWidth: 880, margin: '40px auto 120px',
      padding: '0 32px', boxSizing: 'border-box',
      position: 'relative',
    }} className="fade-in">
      {/* Subpage ambient top-center glow */}
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 800, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
        opacity: isLight ? 0.08 : 0.15,
        zIndex: 0,
      }}/>

      <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
        <span style={eyebrow}>Engineering & Product</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>Blog</h1>
        <p style={sectionSubtitle}>Behind-the-scenes engineering, product decisions, and the thinking that shapes our tools.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', zIndex: 1 }}>
        {posts.map((post) => (
          <article key={post.title} className="glass-card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: `oklch(0.75 0.14 ${post.hue})`,
              }} />
              <span style={{ fontSize: 12, color: 'var(--fg-dim)' }}>{post.date}</span>
              <span style={{ fontSize: 11, color: 'var(--fg-dim)', marginLeft: 'auto' }} className="mono">{post.readTime}</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg)', margin: '0 0 10px', lineHeight: 1.3 }}>{post.title}</h2>
            <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.55 }}>{post.excerpt}</p>
            <div style={{ marginTop: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                Read more <Icon.ArrowRight size={12} />
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  supabase: any;
}

function AuthModal({ open, onClose, supabase }: AuthModalProps) {
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

  if (!open) return null;

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
        const { data, error } = await supabase.auth.signUp({
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
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
          <Icon.X size={16} />
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
                  {showPassword ? <Icon.EyeOff size={15} /> : <Icon.Eye size={15} />}
                </button>
              </div>
              
              {/* Password Strength Indicator (Sign Up only) */}
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
            {loading ? 'Processing...' : isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Register Account' : 'Sign In'} <Icon.ArrowRight size={13} strokeWidth={2.5} />
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

function PaywallModal({ open, onClose, brandName, pricingData, sessionUser, supabase, pricingCohort, userPlan, setUserPlan, subscriptionId, cancelAtPeriodEnd }: PaywallModalProps) {
  const [checkoutSpinner, setCheckoutSpinner] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Upgrade confirmation states
  const [upgradePreview, setUpgradePreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<'pro' | 'api' | null>(null);

  if (!open) return null;

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

  const listStyle: React.CSSProperties = {
    listStyleType: 'none',
    margin: 0,
    padding: 0,
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'var(--bg-overlay-modal)',
      backdropFilter: 'blur(20px) saturate(140%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 780,
        background: 'var(--bg-elev-1)',
        border: '1px solid oklch(0.45 0.10 265 / 0.3)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-modal)',
        position: 'relative',
        display: 'flex', flexDirection: 'column'
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="reset" style={{
          position: 'absolute', top: 20, right: 20,
          color: 'var(--fg-subtle)', cursor: 'pointer', zIndex: 10,
          background: 'none', border: 'none', outline: 'none'
        }}>
          <Icon.X size={16} />
        </button>

        {checkoutSpinner ? (
          <div style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 440 }} className="fade-in">
            <Icon.Loader size={48} style={{ color: 'var(--accent)', marginBottom: 24, animation: 'spin 1s linear infinite' }} />
            <h3 style={{ fontSize: 20, fontWeight: 600, color: 'white', marginBottom: 8, textAlign: 'center' }}>Connecting to Creem Secure Checkout...</h3>
            <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', textAlign: 'center', maxWidth: 365, lineHeight: 1.5 }}>
              Initializing your sandbox subscription profile. You will be redirected to the secure sandbox payment form.
            </p>
          </div>
        ) : loadingPreview ? (
          <div style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 440, width: '100%' }} className="fade-in">
            <Icon.Loader size={48} style={{ color: 'var(--accent)', marginBottom: 24, animation: 'spin 1s linear infinite' }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 8, textAlign: 'center' }}>Calculating Proration Preview...</h3>
            <p style={{ fontSize: 13, color: 'var(--fg-muted)', textAlign: 'center', maxWidth: 380, lineHeight: 1.5 }}>
              Fetching accurate remaining time credits from your current subscription to apply to the new plan.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'row', minHeight: 460 }} className="fade-in">
            {/* Left Info bar */}
            <div style={{
              flex: '1.2', background: 'oklch(0.16 0.012 265 / 0.4)',
              borderRight: '1px solid var(--border)', padding: '36px 30px',
              display: 'flex', flexDirection: 'column', gap: 28,
              boxSizing: 'border-box'
            }}>
              <div>
                <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vault Access Comparison</span>
                <h3 style={{ fontSize: 21, fontWeight: 600, color: 'white', margin: '6px 0 0', letterSpacing: '-0.02em' }}>Understand Your Benefits</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 1. Pro Plan Block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.70 0.18 265)' }} />
                    Pro Plan ($9/mo)
                  </span>
                  <ul style={{ ...listStyle, display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 12 }}>
                    <li style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'oklch(0.70 0.18 265)', fontWeight: 'bold' }}>✓</span> Unlimited browser tool computing
                    </li>
                    <li style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'oklch(0.70 0.18 265)', fontWeight: 'bold' }}>✓</span> 100 daily Production API requests
                    </li>
                    <li style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'oklch(0.70 0.18 265)', fontWeight: 'bold' }}>✓</span> PDF Diff tool & watermark removal
                    </li>
                  </ul>
                </div>

                {/* 2. Developer Plan Block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'oklch(0.78 0.16 145)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.78 0.16 145)' }} />
                    Developer Plan ($29/mo)
                  </span>
                  <ul style={{ ...listStyle, display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 12 }}>
                    <li style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'oklch(0.78 0.16 145)', fontWeight: 'bold' }}>✓</span> <strong>All Pro Plan features included</strong>
                    </li>
                    <li style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'oklch(0.78 0.16 145)', fontWeight: 'bold' }}>✓</span> <strong>1,000 daily Production API requests</strong>
                    </li>
                    <li style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'oklch(0.78 0.16 145)', fontWeight: 'bold' }}>✓</span> <strong>Direct Developer API keys console</strong>
                    </li>
                    <li style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'oklch(0.78 0.16 145)', fontWeight: 'bold' }}>✓</span> Custom webhook status callbacks
                    </li>
                  </ul>
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'oklch(0.70 0.12 145)' }}>
                  <Icon.Check size={12} strokeWidth={2.5} />
                  <span>Transparent Sandbox Proration</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--fg-dim)', margin: 0, lineHeight: 1.35 }}>
                  Upgrade instantly at any time. Card details are charged safely and prorated immediately.
                </p>
              </div>
            </div>

            {/* Right Side Rendering */}
            {upgradePreview ? (
              /* Right Plan Confirmation Grid */
              <div style={{ flex: '1.4', padding: 36, display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' }} className="fade-in">
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: '0 0 4px' }}>Confirm Subscription Change</h4>
                  <p style={{ fontSize: 12, color: 'var(--fg-subtle)', margin: 0 }}>Review the prorated adjustments before charging your card.</p>
                </div>

                {checkoutError && (
                  <div style={{
                    padding: '12px 14px', borderRadius: 8,
                    background: 'oklch(0.20 0.05 20 / 0.3)', border: '1px solid oklch(0.50 0.15 20 / 0.4)',
                    color: 'oklch(0.75 0.12 20)', fontSize: 12.5, display: 'flex', gap: 8, alignItems: 'flex-start'
                  }}>
                    <Icon.AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <div style={{ background: 'oklch(0.14 0.005 250)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                    <span style={{ color: 'var(--fg-dim)' }}>New Selected Plan:</span>
                    <strong style={{ color: 'white' }}>{upgradePreview.newTier === 'api' ? 'Developer Plan' : 'Pro Plan'}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--fg-dim)' }}>New Plan Monthly Price:</span>
                    <span style={{ color: 'white', fontWeight: 500 }}>{upgradePreview.currency}{upgradePreview.newPrice.toFixed(2)}/mo</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--fg-dim)' }}>Unused Time Credit (Prorated):</span>
                    <span style={{ color: 'oklch(0.78 0.16 145)', fontWeight: 600 }}>-{upgradePreview.currency}{upgradePreview.unusedCredit.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderTop: '1px dotted var(--border)', paddingTop: 12 }}>
                    <span style={{ color: 'white', fontWeight: 600 }}>Due Immediately:</span>
                    <strong style={{ color: 'var(--accent)', fontSize: 16 }}>{upgradePreview.currency}{upgradePreview.immediateCharge.toFixed(2)}</strong>
                  </div>
                </div>

                <p style={{ fontSize: 11, color: 'var(--fg-dim)', margin: 0, lineHeight: 1.45 }}>
                  * Confirming will charge your card on file <strong>{upgradePreview.currency}{upgradePreview.immediateCharge.toFixed(2)}</strong> today. A new monthly billing cycle will start immediately, renewing on <strong>{upgradePreview.nextBillingDate}</strong> for <strong>{upgradePreview.currency}{upgradePreview.newPrice.toFixed(2)}/mo</strong>.
                </p>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button onClick={() => { setUpgradePreview(null); setPendingPlan(null); }} className="reset" style={{
                    flex: 1, padding: '10px 14px', borderRadius: 8,
                    background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                    color: 'var(--fg)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', textAlign: 'center'
                  }}>Back to Plans</button>

                  <button onClick={handleConfirmUpgrade} disabled={checkoutSpinner} className="reset" style={{
                    flex: 1.5, padding: '10px 14px', borderRadius: 8,
                    background: 'linear-gradient(180deg, var(--accent) 0%, oklch(0.60 0.16 265) 100%)',
                    border: '1px solid var(--border)',
                    color: 'white', fontWeight: 600, fontSize: 12.5, cursor: checkoutSpinner ? 'not-allowed' : 'pointer',
                    textAlign: 'center'
                  }}>
                    {checkoutSpinner ? 'Processing...' : `Confirm & Pay ${upgradePreview.currency}${upgradePreview.immediateCharge.toFixed(2)}`}
                  </button>
                </div>
              </div>
            ) : (
              /* Right Plan grid */
              <div style={{ flex: '1.4', padding: 36, display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center' }}>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 4px' }}>Select Sandbox Subscription:</h4>
                  <p style={{ fontSize: 12, color: 'var(--fg-subtle)', margin: 0 }}>Safe test credit cards accepted</p>
                </div>

                {checkoutError && (
                  <div style={{
                    padding: '12px 14px', borderRadius: 8,
                    background: 'oklch(0.20 0.05 20 / 0.3)', border: '1px solid oklch(0.50 0.15 20 / 0.4)',
                    color: 'oklch(0.75 0.12 20)', fontSize: 12.5, display: 'flex', gap: 8, alignItems: 'flex-start'
                  }}>
                    <Icon.AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* 1. Pro Subscription */}
                  <button onClick={() => handlePlanClick('pro')} className="reset plan-card" style={{
                    textAlign: 'left', padding: '18px 20px', borderRadius: 12,
                    background: 'oklch(0.20 0.008 250)', border: '1px solid var(--border)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'border-color 0.15s, background 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'oklch(0.22 0.010 265 / 0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'oklch(0.20 0.008 250)'; }}
                  >
                    <div style={{ flex: 1, marginRight: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'white' }}>Pro Plan</div>
                        <span className="mono" style={{ fontSize: 9, background: 'oklch(0.35 0.15 265 / 0.3)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>MOST POPULAR</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--fg-subtle)', lineHeight: 1.35 }}>Complete cockpit access with unlimited tool computing.</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>{currency}{proPrice}</div>
                      <div style={{ fontSize: 10, color: 'var(--fg-dim)' }}>/ month</div>
                    </div>
                  </button>

                  {/* 2. API Pro Subscription */}
                  <button onClick={() => handlePlanClick('api')} className="reset plan-card" style={{
                    textAlign: 'left', padding: '18px 20px', borderRadius: 12,
                    background: 'oklch(0.20 0.008 250)', border: '1px solid var(--border)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'border-color 0.15s, background 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'oklch(0.22 0.010 265 / 0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'oklch(0.20 0.008 250)'; }}
                  >
                    <div style={{ flex: 1, marginRight: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'white' }}>Developer Plan</div>
                        <span className="mono" style={{ fontSize: 9, background: 'oklch(0.35 0.15 145 / 0.25)', color: 'oklch(0.78 0.16 145)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>POWER TIER</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--fg-subtle)', lineHeight: 1.35 }}>Direct API keys, higher query limits & webhook callbacks.</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>{currency}{apiPrice}</div>
                      <div style={{ fontSize: 10, color: 'var(--fg-dim)' }}>/ month</div>
                    </div>
                  </button>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon.CreditCard size={14} style={{ color: 'var(--fg-subtle)' }} />
                  <span style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>Secured by Creem &bull; PCI-DSS Compliant SSL Checkout</span>
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

interface EnterpriseModalProps {
  open: boolean;
  onClose: () => void;
}

function EnterpriseModal({ open, onClose }: EnterpriseModalProps) {
  const [email, setEmail] = useState('');
  const [size, setSize] = useState('10-50');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

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
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, boxSizing: 'border-box',
    }} className="fade-in">
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'oklch(0.08 0.005 250 / 0.75)',
        backdropFilter: 'blur(16px)',
      }} />

      {/* Modal Card */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 460,
        background: 'oklch(0.16 0.006 250 / 0.85)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '36px 32px',
        boxShadow: '0 32px 64px oklch(0 0 0 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.03)',
        boxSizing: 'border-box',
      }} className="fade-in-up">
        {/* Close Button */}
        <button onClick={onClose} className="reset" style={{
          position: 'absolute', top: 20, right: 20,
          width: 32, height: 32, borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'oklch(0.20 0.008 250 / 0.5)',
          color: 'var(--fg-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <Icon.X size={15} />
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
              {submitting ? 'Transmitting Request...' : 'Send Request'} <Icon.ArrowRight size={13} strokeWidth={2.5} />
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }} className="fade-in">
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'oklch(0.22 0.010 145 / 0.2)',
              border: '1px solid oklch(0.75 0.14 145 / 0.4)',
              color: 'oklch(0.78 0.16 145)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
              boxShadow: '0 0 20px oklch(0.78 0.16 145 / 0.25)',
            }}>
              <Icon.Check size={28} strokeWidth={2.5} />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 600, color: 'white', margin: '0 0 10px', letterSpacing: '-0.020em' }}>Request Transmitted!</h2>
            <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
              Thank you! An Enterprise Solutions architect will reach out to you at <span className="mono" style={{ color: 'white' }}>{email}</span> within 2 business hours.
            </p>

            <button onClick={onClose} className="reset" style={{
              padding: '10px 20px', borderRadius: 8,
              background: 'oklch(0.20 0.008 250)', border: '1px solid var(--border)',
              color: 'white', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
            }}>Close Window</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   App root — orchestrates view + overlays
   ========================================================================= */

export function App({ initialSlug }: { initialSlug?: string }) {
  const router = useRouter();
  // Determine starting view based on presets
  let initialView = 'landing';
  if (initialSlug) {
    if (initialSlug === 'pricing' || initialSlug === 'about' || initialSlug === 'docs' || initialSlug === 'developer' || initialSlug === 'account' || initialSlug === 'changelog' || initialSlug === 'roadmap' || initialSlug === 'contact' || initialSlug === 'privacy' || initialSlug === 'blog') {
      initialView = initialSlug;
    } else if (initialSlug === 'dashboard' || initialSlug === 'home') {
      initialView = 'home';
    } else if (initialSlug.startsWith('category_')) {
      initialView = initialSlug;
    } else {
      const parts = initialSlug.split('-to-');
      if (parts.length === 2) {
        if (parts[0] === 'heic') {
          initialView = 'heic-to-jpg-converter';
        } else {
          initialView = 'universal-ai-formatter';
        }
      } else if (initialSlug === 'heic-to-jpg-converter' || initialSlug === 'heic') {
        initialView = 'heic-to-jpg-converter';
      } else {
        const matched = ALL_TOOLS.find(t => t.id === initialSlug);
        if (matched) initialView = initialSlug;
      }
    }
  }

  const [view, setView] = useState(initialView);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [palette, setPalette] = useState(false);
  const [launcher, setLauncher] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);

  // Dynamic SaaS Branding
  const [brandName, setBrandName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('brandName') || 'MySaaS';
    }
    return 'MySaaS';
  });

  // Supabase Auth and Limits State
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isAnonUser, setIsAnonUser] = useState(false);
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'admin' | 'api'>('free');
  const [authOpen, setAuthOpen] = useState(false);

  // Creem Subscription States
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('none');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean>(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  
  // PPP Pricing & Location
  const [countryCode, setCountryCode] = useState('US');
  const [pricingCohort, setPricingCohort] = useState<'high' | 'mid' | 'low' | 'india'>('high');

  // Paywall states
  const [showPaywall, setShowPaywall] = useState(false);

  // Premium Custom UI Notifications states
  const [customAlert, setCustomAlert] = useState<{
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const [customToast, setCustomToast] = useState<string | null>(null);

  // Auto-dismiss custom success toasts
  useEffect(() => {
    if (customToast) {
      const timer = setTimeout(() => {
        setCustomToast(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [customToast]);

  // Global window.alert override with premium custom modal/toast layouts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.alert = (message: string) => {
        const msgLower = message.toLowerCase();
        
        // For quick success/copy indicators, show a premium floating auto-dismissing toast
        if (msgLower.includes("copied") || msgLower.includes("success") || message.length < 35) {
          setCustomToast(message);
          return;
        }
        
        // For warnings, locks, and system alerts, show the gorgeous modal
        if (msgLower.includes("sign in") || msgLower.includes("account") || msgLower.includes("limit")) {
          setCustomAlert({
            title: "Authentication Required",
            message: message,
            actionLabel: "Sign In / Up",
            onAction: () => setAuthOpen(true)
          });
        } else if (msgLower.includes("error") || msgLower.includes("failed")) {
          setCustomAlert({
            title: "System Notification",
            message: message
          });
        } else {
          setCustomAlert({
            title: "Notification Alert",
            message: message
          });
        }
      };
    }
  }, []);

  const handleShowPaywall = useCallback((reason?: 'limit' | 'upgrade', toolName?: string, currentLimit?: number) => {
    const isGuest = !sessionUser || isAnonUser;

    if (reason === 'limit') {
      const displayTool = toolName || 'our SaaS tools';
      const displayLimit = currentLimit || (isGuest ? 5 : 20);

      if (isGuest) {
        setCustomAlert({
          title: `Limit Reached for ${displayTool}`,
          message: `You've reached the free guest limit of ${displayLimit} daily runs for ${displayTool}. Please sign in or create a free account to increase your limit to 20 daily runs, or upgrade to a Pro workspace for unlimited high-speed exports!`,
          actionLabel: "Sign In / Up",
          onAction: () => setAuthOpen(true)
        });
      } else {
        setCustomAlert({
          title: `Limit Reached for ${displayTool}`,
          message: `You've reached your free limit of ${displayLimit} daily runs for ${displayTool}. Upgrade to a Pro workspace to get unlimited high-speed exports, premium formatting themes, and API access!`,
          actionLabel: "Upgrade to Pro",
          onAction: () => setShowPaywall(true)
        });
      }
    } else {
      // Default: upgrade trigger
      if (isGuest) {
        setCustomAlert({
          title: "Authentication Required",
          message: "Please sign in or create an account to upgrade to a Pro workspace and unlock premium features!",
          actionLabel: "Sign In / Up",
          onAction: () => setAuthOpen(true)
        });
      } else {
        setShowPaywall(true);
      }
    }
  }, [sessionUser, isAnonUser]);

  // Geo-fetch for Purchasing Power Parity (PPP) with failover chain
  useEffect(() => {
    async function fetchCountry() {
      let cc = 'US';
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (data && data.country_code) {
            cc = data.country_code.toUpperCase();
          }
        } else {
          throw new Error("Primary geo-fetch failed");
        }
      } catch (err) {
        // Silently try fallback unblocked geo-api
        try {
          const resFallback = await fetch('https://freeipapi.com/api/json');
          if (resFallback.ok) {
            const dataFallback = await resFallback.json();
            if (dataFallback && dataFallback.countryCode) {
              cc = dataFallback.countryCode.toUpperCase();
            }
          }
        } catch (fallbackErr) {
          // Both failed silently without console.error logs
        }
      }

      setCountryCode(cc);
      setPricingCohort('high');
    }
    fetchCountry();
  }, []);

  const pricingData = useMemo(() => {
    if (pricingCohort === 'india') {
      return {
        currency: '₹',
        monthly: '299',
        weekly: '149',
        daily: '49',
        suffix: '/ month, cancel anytime',
        weeklySuffix: 'for a 7-day pass',
        dailySuffix: 'for a 24-hour pass',
      };
    } else if (pricingCohort === 'mid') {
      return {
        currency: '$',
        monthly: '3.99',
        weekly: '1.99',
        daily: '0.49',
        suffix: '/ month, cancel anytime',
        weeklySuffix: 'for a 7-day pass',
        dailySuffix: 'for a 24-hour pass',
      };
    } else if (pricingCohort === 'low') {
      return {
        currency: '$',
        monthly: '1.99',
        weekly: '0.99',
        daily: '0.25',
        suffix: '/ month, cancel anytime',
        weeklySuffix: 'for a 7-day pass',
        dailySuffix: 'for a 24-hour pass',
      };
    } else { // high (US/global default)
      return {
        currency: '$',
        monthly: '9',
        weekly: '2.99',
        daily: '0.99',
        suffix: '/ month, cancel anytime',
        weeklySuffix: 'for a 7-day pass',
        dailySuffix: 'for a 24-hour pass',
      };
    }
  }, [pricingCohort]);

  async function loadUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('tier, subscription_status, current_period_end, cancel_at_period_end, customer_id, subscription_id')
        .eq('id', userId)
        .single();
      
      if (error) {
        const emailVal = sessionUser?.email || `anonymous_${userId.slice(0, 8)}@mysaas.internal`;
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId, email: emailVal, tier: 'free', subscription_status: 'none' });
        
        if (!insertError) {
          setUserPlan('free');
          setSubscriptionStatus('none');
          setCurrentPeriodEnd(null);
          setCancelAtPeriodEnd(false);
          setCustomerId(null);
          setSubscriptionId(null);
        }
      } else if (data) {
        setUserPlan((data.tier as any) || 'free');
        setSubscriptionStatus(data.subscription_status || 'none');
        setCurrentPeriodEnd(data.current_period_end || null);
        setCancelAtPeriodEnd(!!data.cancel_at_period_end);
        setCustomerId(data.customer_id || null);
        setSubscriptionId(data.subscription_id || null);
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    }
  }

  // Silent anonymous sign-in on mount
  useEffect(() => {
    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionUser(session.user);
        setIsAnonUser(session.user.is_anonymous || false);
        loadUserProfile(session.user.id);
      } else {
        try {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (data?.user) {
            setSessionUser(data.user);
            setIsAnonUser(true);
            loadUserProfile(data.user.id);
          }
        } catch (e) {
          console.error("Anonymous authentication failed:", e);
        }
      }
    }
    
    initAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setSessionUser(session.user);
        setIsAnonUser(session.user.is_anonymous || false);
        loadUserProfile(session.user.id);
      } else {
        setSessionUser(null);
        setIsAnonUser(false);
        setUserPlan('free');
        setSubscriptionStatus('none');
        setCurrentPeriodEnd(null);
        setCancelAtPeriodEnd(false);
        setCustomerId(null);
        setSubscriptionId(null);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Listen for custom postMessage events sent from nested print preview iframes to trigger auth or paywall modals
  useEffect(() => {
    function handleIframeMessage(e: MessageEvent) {
      if (e.data === 'open-auth-modal') {
        setAuthOpen(true);
      } else if (e.data === 'show-paywall-modal') {
        handleShowPaywall();
      }
    }
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('checkout') === 'success') {
        setShowSuccessBanner(true);
        // Clean up the URL query parameter so it doesn't stay forever
        url.searchParams.delete('checkout');
        window.history.replaceState({}, '', url.pathname + url.search);
        
        // Re-fetch the user profile to instantly load the new Pro plan
        const getSessionAndLoad = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await loadUserProfile(session.user.id);
          }
        };
        getSessionAndLoad();
      }
    }
  }, [sessionUser]);

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      await supabase.auth.signInAnonymously();
    } catch (e) {
      console.error("Sign out failed:", e);
    }
  }

  const checkAndLogUsage = useCallback(async (toolId: string, isTier2: boolean) => {
    if (userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin') return true;

    // Track daily usage count inside Supabase `usage_logs`
    const today = new Date();
    today.setHours(0,0,0,0);
    const isoStart = today.toISOString();

    let count = 0;
    if (sessionUser) {
      const { count: dbCount, error } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', sessionUser.id)
        .gte('created_at', isoStart);
      if (!error && dbCount !== null) {
        count = dbCount;
      }
    } else {
      const localUsage = localStorage.getItem(`usage_count_${today.toDateString()}`);
      count = localUsage ? parseInt(localUsage, 10) : 0;
    }

    const isGuest = !sessionUser || isAnonUser;
    const limitTier1 = isGuest ? 5 : 20;
    const limitTier2 = isGuest ? (isAnonUser ? 1 : 0) : 5;

    const currentLimit = isTier2 ? limitTier2 : limitTier1;

    if (count >= currentLimit) {
      const tool = ALL_TOOLS.find(t => t.id === toolId);
      const toolName = tool ? tool.name : 'this tool';
      handleShowPaywall('limit', toolName, currentLimit);
      return false;
    }

    if (sessionUser) {
      await supabase.from('usage_logs').insert({
        user_id: sessionUser.id,
        tool_id: toolId,
        tier: isTier2 ? 2 : 1,
      });
    } else {
      const newCount = count + 1;
      localStorage.setItem(`usage_count_${today.toDateString()}`, newCount.toString());
    }

    return true;
  }, [sessionUser, isAnonUser, userPlan, handleShowPaywall]);

  // Initialize theme from localStorage on client side mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    }
  }, []);

  // Update theme changes to DOM and localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'light') {
        root.classList.add('light');
      } else {
        root.classList.remove('light');
      }
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  const isLanding = view === 'landing';
  const isDashboard = view === 'home';

  const activeTool = useMemo(() => {
    if (isLanding || isDashboard || view === 'pricing' || view === 'about' || view === 'docs' || view === 'developer' || view === 'account' || view === 'changelog' || view === 'roadmap' || view === 'contact' || view === 'privacy' || view === 'blog' || view.startsWith('category_')) return null;
    return ALL_TOOLS.find(t => t.id === view);
  }, [view, isLanding, isDashboard]);

  // Native Next.js client navigation handlers
  function launchApp() {
    router.push('/dashboard');
  }
  
  function openTool(id: string) {
    let path = `/tools/${id}`;
    if (id === 'home' || id === 'dashboard') {
      path = '/dashboard';
    } else if (id === 'landing') {
      path = '/';
    } else if (['pricing', 'about', 'docs', 'developer', 'account', 'changelog', 'roadmap', 'contact', 'privacy', 'blog'].includes(id)) {
      path = id === 'roadmap' ? '/developer' : `/${id}`;
    } else if (id.includes('-to-')) {
      path = `/tools/format/${id}`;
    } else if (id.startsWith('category_')) {
      path = `/category/${id.replace('category_', '')}`;
    }
    router.push(path);
  }
  
  function goHome() {
    router.push('/dashboard');
  }
  
  function backToLanding() {
    router.push('/');
  }

  /* keyboard shortcuts — only active inside the app */
  useKeydown(useCallback((e: KeyboardEvent) => {
    if (isLanding) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setPalette(p => !p);
    }
  }, [isLanding]));

  /* scroll for top-bar contrast */
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isLanding) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
        <div className="app-root">
          <Landing
            onLaunch={launchApp}
            onEnterprise={() => setEnterpriseOpen(true)}
            onBrowseTools={() => setLauncher(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
            brandName={brandName}
            setBrandName={setBrandName}
            pricingData={pricingData}
            onShowPaywall={handleShowPaywall}
            sessionUser={sessionUser}
            isAnonUser={isAnonUser}
            userPlan={userPlan}
            onOpenAuthModal={() => setAuthOpen(true)}
            onSignOut={handleSignOut}
          />
          <Footer onBackToLanding={null} brandName={brandName} />
        </div>
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
              <Icon.Check size={20} strokeWidth={2.5} />
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
              <Icon.X size={14} />
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <div className="app-root">
        <TopBar
          onOpenPalette={() => setPalette(true)}
          onOpenLauncher={() => setLauncher(true)}
          onHome={goHome}
          activeTool={activeTool}
          scrolled={scrolled || !isDashboard}
          theme={theme}
          onToggleTheme={toggleTheme}
          brandName={brandName}
          setBrandName={setBrandName}
          sessionUser={sessionUser}
          isAnonUser={isAnonUser}
          userPlan={userPlan}
          onOpenAuthModal={() => setAuthOpen(true)}
          onSignOut={handleSignOut}
          onShowPaywall={handleShowPaywall}
          onOpenTool={openTool}
        />

        <main>
          {isDashboard && (
            <Home
              onOpenTool={openTool}
              onOpenLauncher={() => setLauncher(true)}
              onOpenPalette={() => setPalette(true)}
            />
          )}
          {view === 'pricing' && <PricingPage onLaunch={launchApp} onEnterprise={() => setEnterpriseOpen(true)} />}
          {view === 'about' && <AboutPage onLaunch={launchApp} brandName={brandName} />}
          {view === 'docs' && <DocsPage onLaunch={launchApp} />}
          {view === 'developer' && (
            <DeveloperPage
              onLaunch={launchApp}
              brandName={brandName}
              userPlan={userPlan}
              sessionUser={sessionUser}
              onShowPaywall={handleShowPaywall}
              onOpenAuthModal={() => setAuthOpen(true)}
            />
          )}
          {view === 'account' && (
            <AccountPage
              onLaunch={launchApp}
              brandName={brandName}
              userPlan={userPlan}
              sessionUser={sessionUser}
              isAnonUser={isAnonUser}
              onShowPaywall={handleShowPaywall}
              onOpenAuthModal={() => setAuthOpen(true)}
              onSignOut={handleSignOut}
              theme={theme}
              onToggleTheme={toggleTheme}
              pricingCohort={pricingCohort === 'india' ? 'india' : 'global'}
              subscriptionStatus={subscriptionStatus}
              currentPeriodEnd={currentPeriodEnd}
              cancelAtPeriodEnd={cancelAtPeriodEnd}
              customerId={customerId}
              subscriptionId={subscriptionId}
              onRefreshProfile={() => sessionUser && loadUserProfile(sessionUser.id)}
            />
          )}
          {view === 'changelog' && <ChangelogPage onLaunch={launchApp} />}
          {view === 'roadmap' && (
            <DeveloperPage
              onLaunch={launchApp}
              brandName={brandName}
              userPlan={userPlan}
              sessionUser={sessionUser}
              onShowPaywall={() => setShowPaywall(true)}
              onOpenAuthModal={() => setAuthOpen(true)}
            />
          )}
          {view === 'contact' && <ContactPage onLaunch={launchApp} />}
          {view === 'privacy' && <PrivacyPage onLaunch={launchApp} />}
          {view === 'blog' && <BlogPage onLaunch={launchApp} brandName={brandName} />}
          {view.startsWith('category_') && (
            <CategoryHub categoryId={view.replace('category_', '')} onOpenTool={openTool} />
          )}
          {!isDashboard && activeTool && (
            activeTool.id === 'universal-ai-formatter'
              ? <FormatterTool
                  tool={activeTool}
                  initialSlug={initialSlug}
                  brandName={brandName}
                  userPlan={userPlan}
                  sessionUser={sessionUser}
                  onShowPaywall={handleShowPaywall}
                  supabase={supabase}
                  checkAndLogUsage={checkAndLogUsage}
                />
              : activeTool.id === 'json'
                ? <JsonTool
                    tool={activeTool}
                    brandName={brandName}
                    userPlan={userPlan}
                    sessionUser={sessionUser}
                    onShowPaywall={handleShowPaywall}
                    supabase={supabase}
                  />
                : activeTool.id === 'heic-to-jpg-converter'
                  ? <HeicTool
                      tool={activeTool}
                      initialSlug={initialSlug}
                      brandName={brandName}
                      userPlan={userPlan}
                      sessionUser={sessionUser}
                      onShowPaywall={handleShowPaywall}
                      supabase={supabase}
                      checkAndLogUsage={checkAndLogUsage}
                    />
                  : <ComingSoonStub tool={activeTool} />
          )}
        </main>

        <Footer onBackToLanding={backToLanding} brandName={brandName} />

        <CommandPalette open={palette} onClose={() => setPalette(false)} onPick={openTool} />
        <Launcher open={launcher} onClose={() => setLauncher(false)} onPick={openTool} />
      </div>
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
            <Icon.Check size={20} strokeWidth={2.5} />
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
            <Icon.X size={14} />
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
              <Icon.Info size={20} style={{ color: 'white' }} />
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
            <Icon.Check size={11} strokeWidth={3} />
          </div>
          <span>{customToast}</span>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Default export — drop in app/page.tsx.
// ---------------------------------------------------------------------------
export default function Page() {
  return <App />;}
