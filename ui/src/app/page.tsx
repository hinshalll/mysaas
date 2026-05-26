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
import { AI_SOURCES, THEMES, FORMATS, CATEGORIES, ALL_TOOLS } from './config';
import React, {
  useState, useEffect, useRef, useMemo, useCallback,
} from 'react';
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
  Sun, Moon,
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
  Sun, Moon,
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
}

function TopBar({ onOpenPalette, onOpenLauncher, onHome, activeTool, scrolled, theme, onToggleTheme }: TopBarProps) {
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
      {/* Brand */}
      <a href="/" className="reset" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer', textDecoration: 'none', color: 'inherit',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 1px oklch(0.50 0.10 280 / 0.5), 0 4px 14px oklch(0.50 0.20 280 / 0.4)',
        }}>
          <Icon.Command size={15} strokeWidth={2.2} style={{ color: 'white' }} />
        </div>
        <span style={{
          fontSize: 15.5, fontWeight: 600,
          letterSpacing: '-0.018em',
          color: 'var(--fg)',
        }}>mysaas</span>
      </a>

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

      <a href="/pricing" className="reset top-link" style={topLink}>Pricing</a>
      <a href="/docs" className="reset top-link" style={topLink}>Docs</a>

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

/* =========================================================================
   Inline Select (matches the one in app-tool.jsx but lives here)
   ========================================================================= */

interface SelectProps {
  value: any;
  options: any[];
  onChange: (opt: any) => void;
  label?: string;
  compact?: boolean;
}

function Select({ value, options, onChange, label, compact }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: 11, fontWeight: 500,
          color: 'var(--fg-dim)',
          marginBottom: 7,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>{label}</label>
      )}
      <div ref={ref} style={{ position: 'relative' }}>
        <button onClick={() => setOpen(o => !o)} className="reset" style={{
          width: '100%', boxSizing: 'border-box', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: compact ? '8px 12px' : '10px 12px',
          background: 'oklch(0.22 0.010 250 / 0.7)',
          border: '1px solid ' + (open ? 'oklch(0.48 0.10 265 / 0.7)' : 'var(--border)'),
          borderRadius: 8,
          fontSize: 13, color: 'var(--fg)',
          transition: 'border-color 0.12s, box-shadow 0.12s',
          boxShadow: open ? '0 0 0 3px oklch(0.50 0.15 265 / 0.20)' : 'none',
        }}>
          <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>{value.label}</span>
          {value.tag && (
            <span className="mono" style={{
              fontSize: 10.5, padding: '2px 6px', borderRadius: 4,
              background: 'oklch(0.16 0.006 250)', color: 'var(--fg-muted)',
            }}>{value.tag}</span>
          )}
          <Icon.ChevronDown size={13} style={{
            color: 'var(--fg-subtle)',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.16s',
          }}/>
        </button>

        {open && (
          <div className="fade-in-up" style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'oklch(0.21 0.010 250)',
            border: '1px solid var(--border-strong)',
            borderRadius: 8, padding: 4, zIndex: 20,
            boxShadow: '0 16px 40px oklch(0 0 0 / 0.5)',
            minWidth: 240,
          }}>
            {options.map(opt => {
              const active = opt.value === value.value;
              return (
                <button key={opt.value} onClick={() => { onChange(opt); setOpen(false); }} className="reset" style={{
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  width: '100%', boxSizing: 'border-box',
                  padding: '8px 10px',
                  borderRadius: 6, fontSize: 13,
                  textAlign: 'left',
                  background: active ? 'oklch(0.30 0.06 265 / 0.5)' : 'transparent',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'oklch(0.24 0.012 250)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 500, color: 'var(--fg)' }}>{opt.label}</span>
                      {opt.tag && (
                        <span className="mono" style={{
                          fontSize: 9.5, padding: '1px 5px', borderRadius: 4,
                          background: 'oklch(0.16 0.006 250)', color: 'var(--fg-muted)',
                        }}>{opt.tag}</span>
                      )}
                    </div>
                    {opt.desc && <span style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>{opt.desc}</span>}
                  </div>
                  {active && <span style={{ color: 'oklch(0.78 0.16 265)' }}>●</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   Tool data + sample
   ========================================================================= */



const SAMPLE = '# The Cost of Context Switching in Software Teams\n\n' +
'Most engineering productivity losses are invisible. They don\'t show up in burndown charts or commit histories — they hide in the gap between when an engineer is interrupted and when they return to flow.\n\n' +
'## Key findings\n\n' +
'- Engineers report losing **23 minutes** on average to recover focus after a single interruption.\n' +
'- Synchronous tools (Slack, meetings) account for **~62%** of context switches in teams over 30 people.\n' +
'- Teams that batch communication into 2-3 windows per day ship features **31% faster**.\n\n' +
'## What to do about it\n\n' +
'1. Default Slack to "do not disturb" outside of two daily review windows.\n' +
'2. Replace standups with async written updates in shared documents.\n' +
'3. Reserve mornings (the highest-quality focus block for most ICs) for deep work only.\n\n' +
'> "The most expensive thing you can give an engineer is a 15-minute meeting."';

/* =========================================================================
   Markdown → HTML (minimal, prototype-grade)
   ========================================================================= */



/* =========================================================================
   Toolbar primitives
   ========================================================================= */

interface TBButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}

function TBButton({ children, onClick, active, title }: TBButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
      onClick={onClick}
      className="reset"
      style={{
        cursor: 'pointer',
        width: 30, height: 30, borderRadius: 6,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'oklch(0.30 0.06 265 / 0.55)' : 'transparent',
        color: active ? 'oklch(0.92 0.06 265)' : 'var(--fg-muted)',
        border: '1px solid ' + (active ? 'oklch(0.45 0.08 265 / 0.4)' : 'transparent'),
        transition: 'background 0.12s, color 0.12s',
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'oklch(0.24 0.012 250)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}
function TBDivider() {
  return <span style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }}/>;
}

interface BlockSelectProps {
  value: string;
  onChange: (val: string) => void;
}

function BlockSelect({ value, onChange }: BlockSelectProps) {
  const opts = [
    { v: 'p',  l: 'Paragraph' },
    { v: 'h1', l: 'Heading 1' },
    { v: 'h2', l: 'Heading 2' },
    { v: 'h3', l: 'Heading 3' },
  ];
  const current = opts.find(o => o.v === value) || opts[0];
  return (
    <select
      value={current.v}
      onChange={e => onChange(e.target.value)}
      onMouseDown={e => e.stopPropagation()}
      style={{
        height: 30,
        background: 'oklch(0.22 0.010 250)',
        border: '1px solid var(--border)',
        color: 'var(--fg)',
        fontSize: 12, fontWeight: 500,
        padding: '0 22px 0 10px',
        borderRadius: 6,
        cursor: 'pointer', outline: 'none',
        fontFamily: 'inherit',
        appearance: 'none',
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a0a0a0' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 4px center',
        backgroundSize: '14px 14px',
      }}
    >
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

/* =========================================================================
   Helpers
   ========================================================================= */

interface StatProps {
  label: string;
  value: string | number;
}

function Stat({ label, value }: StatProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
      <span style={{ color: 'var(--fg-muted)', fontWeight: 500 }}>{value}</span>
      <span>{label}</span>
    </div>
  );
}

const miniBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '5px 10px',
  fontSize: 11.5, fontWeight: 500,
  color: 'var(--fg-muted)',
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: 5,
  cursor: 'pointer',
};

/* =========================================================================
   FormatterTool
   ========================================================================= */

interface FormatterToolProps {
  tool: any;
  initialSlug?: string;
}

function FormatterTool({ tool, initialSlug }: FormatterToolProps) {
  // Determine starting AI and Format presets based on slug
  let defaultAi = AI_SOURCES[0];
  let defaultFormat = FORMATS[0];

  if (initialSlug) {
    const parts = initialSlug.split('-to-');
    if (parts.length === 2) {
      const matchedAi = AI_SOURCES.find(a => a.value === parts[0]);
      const matchedFmt = FORMATS.find(f => f.value === parts[1]);
      if (matchedAi) defaultAi = matchedAi;
      if (matchedFmt) defaultFormat = matchedFmt;
    }
  }

  const [text, setText] = useState(SAMPLE);
  const [aiSource, setAiSource] = useState(defaultAi);
  const [theme, setTheme] = useState(THEMES[0]);
  const [format, setFormat] = useState(defaultFormat);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [activeMarks, setActiveMarks] = useState<any>({});
  const [pendingHtml, setPendingHtml] = useState<any>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<any>(null);

  const chars = text.length;
  const words = useMemo(() => text.trim() ? text.trim().split(/\s+/).length : 0, [text]);
  const lines = useMemo(() => text.split(/\n/).length, [text]);

  const [downloading, setDownloading] = useState(false);
  const [detectedAi, setDetectedAi] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  // Dynamic accent hue depending on the AI brand style
  const hueOverrides: Record<string, number> = {
    chatgpt: 145, // ChatGPT soft green
    claude: 35, // Claude warm copper
    gemini: 250, // Gemini gradient indigo
    deepseek: 265, // DeepSeek royal indigo
    grok: 0, // Grok monochromatic cyber
    perplexity: 195, // Perplexity bright teal
  };
  const activeHue = aiSource.value !== 'universal' ? (hueOverrides[aiSource.value] ?? tool.hue) : tool.hue;

  // Auto-detection triggers whenever pasted text changes
  useEffect(() => {
    if (!text.trim()) {
      setDetectedAi(null);
      return;
    }

    if (text.includes('<think>') || text.includes('</think>')) {
      if (aiSource.value !== 'deepseek') setDetectedAi('deepseek');
      else setDetectedAi(null);
    } else if (text.includes('<antThinking>') || text.includes('Assistant:') || text.includes('<claude_chat>')) {
      if (aiSource.value !== 'claude') setDetectedAi('claude');
      else setDetectedAi(null);
    } else if (text.includes('**ChatGPT:**') || text.includes('### ChatGPT')) {
      if (aiSource.value !== 'chatgpt') setDetectedAi('chatgpt');
      else setDetectedAi(null);
    } else if (/\[\d+\]/.test(text) && (text.includes('perplexity') || text.includes('Sources') || text.includes('View Sources'))) {
      if (aiSource.value !== 'perplexity') setDetectedAi('perplexity');
      else setDetectedAi(null);
    } else if (text.includes('Gemini:') || text.includes('**Gemini**')) {
      if (aiSource.value !== 'gemini') setDetectedAi('gemini');
      else setDetectedAi(null);
    } else if (text.includes('Grok:') || text.includes('**Grok**')) {
      if (aiSource.value !== 'grok') setDetectedAi('grok');
      else setDetectedAi(null);
    } else {
      setDetectedAi(null);
    }
  }, [text, aiSource.value]);

  // Premium context-aware clipboard copy handler
  async function handleCopy() {
    if (copying) return;
    setCopying(true);
    try {
      const isTextMode = format.value === 'md' || format.value === 'txt';
      let finalContent = isTextMode ? editorRef.current?.value : editorRef.current?.innerHTML;
      if (!finalContent) finalContent = text; // fallback

      if (format.value === 'md') {
        await navigator.clipboard.writeText(finalContent);
      } else if (format.value === 'txt') {
        const plainText = stripMarkdown(finalContent);
        await navigator.clipboard.writeText(plainText);
      } else {
        // Formatted Rich Text visual copy
        const htmlContent = pendingHtml || marked.parse(text);
        const plainText = stripMarkdown(text);
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const textBlob = new Blob([plainText], { type: 'text/plain' });
        
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blob,
            'text/plain': textBlob,
          })
        ]);
      }
      alert('Copied successfully!');
    } catch (e: any) {
      // Fallback to text copy
      try {
        const plain = editorRef.current?.innerText || stripMarkdown(text);
        await navigator.clipboard.writeText(plain);
        alert('Copied text successfully!');
      } catch (err: any) {
        alert('Failed to copy to clipboard: ' + err.message);
      }
    } finally {
      setCopying(false);
    }
  }

  function handleGenerate() {
    if (!text.trim() || generating) return;
    setGenerating(true);
    // Just generate the local preview for the editor
    setTimeout(() => {
      setPendingHtml(marked.parse(text));
      setGenerated(true);
      setGenerating(false);
    }, 600); 
  }

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);

    try {
      // Detect if we are in text/code mode or WYSIWYG mode
      const isTextMode = format.value === 'md' || format.value === 'txt';
      
      // Grab the exact edited content straight from the active editor
      let finalContent = isTextMode ? editorRef.current?.value : editorRef.current?.innerHTML;
      if (!finalContent) finalContent = text; // fallback

      const response = await fetch('https://my-saas-mezp.onrender.com/api/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: finalContent, 
          is_html: !isTextMode,
          theme: theme.value,
          export_format: format.value
        }),
      });

      if (!response.ok) throw new Error('Failed to generate document from server.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Use .doc for Word fallback MVP
      const ext = format.value === 'docx' ? '.doc' : format.tag;
      a.download = `formatted-doc-${Date.now().toString().slice(-4)}${ext}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

    } catch (error: any) {
      alert("Error connecting to Python backend:\n" + error.message);
    } finally {
      setDownloading(false);
    }
  }

  // Apply generated HTML to the editor AFTER React has mounted it.
  // Quick helper to strip markdown into pure plain text
  function stripMarkdown(md: string) {
    return md
      .replace(/[#_*~`>]/g, '') // removes formatting marks
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // turns links into normal text
      .replace(/^- /gm, '• ') // formats bullet points cleanly
      .trim();
  }

  // Apply generated HTML to the editor AFTER React has mounted it.
  useEffect(() => {
    if (!generated || !editorRef.current) return;

    if (format.value === 'md') {
      editorRef.current.value = text; // Show raw markdown
    } else if (format.value === 'txt') {
      editorRef.current.value = stripMarkdown(text); // Show clean plain text
    } else {
      if (pendingHtml != null) {
        editorRef.current.innerHTML = pendingHtml;
        setPendingHtml(null);
        setTimeout(() => editorRef.current?.focus(), 30);
      } 
      else if (!editorRef.current.innerHTML) {
        editorRef.current.innerHTML = marked.parse(text);
      }
    }
  }, [pendingHtml, generated, format.value, text]);

  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault(); handleGenerate();
      }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  function updateActiveMarks() {
    try {
      setActiveMarks({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
        ul: document.queryCommandState('insertUnorderedList'),
        ol: document.queryCommandState('insertOrderedList'),
        block: (document.queryCommandValue('formatBlock') || '').toLowerCase(),
      });
    } catch (e) {}
  }

  function exec(cmd: string, value?: string) {
    editorRef.current?.focus();
    try { document.execCommand(cmd, false, value); } catch (e) {}
    updateActiveMarks();
  }
  function setBlock(tag: string) { exec('formatBlock', '<' + tag + '>'); }
  function setLink() {
    const url = window.prompt('Link URL', 'https://');
    if (url) exec('createLink', url);
  }
  function rerender() {
    setPendingHtml(marked.parse(text));
  }

  return (
    <div style={{
      maxWidth: 1280, margin: '0 auto',
      padding: '32px 32px 80px',
      width: '100%', boxSizing: 'border-box',
    }} className="fade-in">

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 20,
        marginBottom: 28, flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 11.5, color: 'var(--fg-dim)',
            marginBottom: 12,
          }} className="mono">
            <span style={{ color: tintFg(activeHue) }}>{tool.categoryLabel}</span>
            <span>/</span>
            <span style={{ color: 'var(--fg-muted)' }}>{aiSource.value === 'universal' ? 'universal-ai-formatter' : `${aiSource.value}-to-${format.value}`}</span>
          </div>
          <h1 style={{
            margin: 0, fontSize: 36, fontWeight: 600,
            letterSpacing: '-0.025em', lineHeight: 1.08,
          }}>
            {aiSource.value !== 'universal' 
              ? `${aiSource.label.replace(' Style', '')} to ${format.label} Formatter` 
              : 'Universal AI-to-Doc Formatter'}
          </h1>
          <p style={{
            margin: '10px 0 0', fontSize: 15,
            color: 'var(--fg-muted)', maxWidth: 620, lineHeight: 1.5,
          }}>
            {aiSource.value !== 'universal'
              ? `Paste raw output from ${aiSource.label.replace(' Style', '')}. Generate a themed document, then fine-tune it directly in the editor before exporting as a premium ${format.label}.`
              : 'Paste raw output from ChatGPT, Claude, Gemini, DeepSeek, Grok, or Perplexity. Generate a themed document, then fine-tune it directly in the editor before exporting.'}
          </p>
        </div>

        <div style={{
          display: 'flex', gap: 6, alignItems: 'center',
          padding: '8px 12px',
          background: 'var(--bg-elev-2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          fontSize: 11.5, color: 'var(--fg-muted)',
        }}>
          <kbd className="kbd">⌘</kbd><kbd className="kbd">↵</kbd>
          <span style={{ marginLeft: 4 }}>to generate</span>
        </div>
      </div>

      {/* Input card */}
      <div style={{
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'visible',
        boxShadow: '0 1px 0 oklch(1 0 0 / 0.03) inset',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elev-2)',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11.5, fontWeight: 500, color: 'var(--fg-muted)',
            padding: '3px 9px',
            background: 'var(--bg-hover)',
            borderRadius: 5,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: text ? 'oklch(0.78 0.16 145)' : 'var(--fg-dim)',
              boxShadow: text ? '0 0 8px oklch(0.78 0.16 145 / 0.7)' : 'none',
            }} />
            Source · markdown
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={() => { setText(SAMPLE); taRef.current?.focus(); }} className="reset" style={miniBtn}>Sample</button>
          <button onClick={() => {
            navigator.clipboard?.readText?.().then(t => setText(t || text)).catch(() => {});
          }} className="reset" style={miniBtn}>Paste</button>
          <button onClick={() => { setText(''); taRef.current?.focus(); }} className="reset" style={{ ...miniBtn, color: text ? 'var(--fg-muted)' : 'var(--fg-dim)' }}>Clear</button>
        </div>

        {/* AI Source Auto-detection Recommendation Banner */}
        {detectedAi && (
          <div style={{
            background: `oklch(0.20 0.010 ${hueOverrides[detectedAi] ?? 265} / 0.75)`,
            borderBottom: '1px solid var(--border)',
            padding: '10px 16px',
            fontSize: 12.5,
            display: 'flex', alignItems: 'center', gap: 10,
            color: 'var(--fg-muted)',
          }} className="fade-in">
            <span style={{ display: 'inline-flex', alignItems: 'center', color: `oklch(0.78 0.16 ${hueOverrides[detectedAi] ?? 265})` }}>
              <Icon.Sparkles size={13} strokeWidth={2.2} />
            </span>
            <span>
              Detected **{AI_SOURCES.find(a => a.value === detectedAi)?.label.replace(' Style', '')}** formatting. Optimize layout styling?
            </span>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => {
                const matched = AI_SOURCES.find(a => a.value === detectedAi);
                if (matched) setAiSource(matched);
                setDetectedAi(null);
              }}
              className="reset"
              style={{
                cursor: 'pointer',
                padding: '4px 10px',
                background: `oklch(0.72 0.18 ${hueOverrides[detectedAi] ?? 265})`,
                color: 'white',
                fontSize: 11.5, fontWeight: 600,
                borderRadius: 5,
                boxShadow: '0 1px 3px oklch(0 0 0 / 0.15)',
              }}
            >
              Apply Style
            </button>
            <button
              onClick={() => setDetectedAi(null)}
              className="reset"
              style={{
                cursor: 'pointer',
                fontSize: 11.5, color: 'var(--fg-dim)',
                padding: '4px 6px',
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        <textarea
          ref={taRef}
          value={text}
          onChange={e => setText(e.target.value)}
          spellCheck={false}
          placeholder="Paste your raw AI output here…"
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            minHeight: 180,
            padding: '14px 18px',
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--fg)',
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 13, lineHeight: 1.6,
            resize: 'vertical',
          }}
        />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-elev-2)',
          flexWrap: 'wrap',
        }} className="tool-controls-row">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            fontSize: 11, color: 'var(--fg-dim)',
            fontFamily: '"JetBrains Mono", monospace',
            flex: 1, minWidth: 180,
          }}>
            <Stat label="chars" value={chars.toLocaleString()} />
            <Stat label="words" value={words.toLocaleString()} />
            <Stat label="lines" value={lines.toLocaleString()} />
          </div>
          <div style={{ width: 140 }}><Select compact value={theme} options={THEMES} onChange={setTheme} /></div>
          <div style={{ width: 120 }}><Select compact value={format} options={FORMATS} onChange={setFormat} /></div>
          <button
            onClick={handleGenerate}
            disabled={!text.trim() || generating}
            className="reset"
            style={{
              cursor: !text.trim() || generating ? 'not-allowed' : 'pointer',
              opacity: !text.trim() ? 0.5 : 1,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 14px',
              background: generating
                ? `oklch(0.55 0.12 ${activeHue})`
                : `linear-gradient(180deg, oklch(0.72 0.18 ${activeHue}), oklch(0.62 0.20 ${activeHue}))`,
              color: 'white',
              fontWeight: 500, fontSize: 13,
              borderRadius: 8,
              boxShadow: `0 1px 0 oklch(1 0 0 / 0.25) inset, 0 0 0 1px oklch(0.50 0.14 ${activeHue} / 0.5), 0 4px 14px oklch(0.50 0.20 ${activeHue} / 0.30)`,
              whiteSpace: 'nowrap',
            }}
          >
            {generating ? (
              <>
                <span style={{ display: 'inline-flex', animation: 'spin 0.9s linear infinite' }}>
                  <Icon.Loader size={14} strokeWidth={2.2}/>
                </span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                Generating…
              </>
            ) : (
              <>
                <Icon.Sparkles size={13} strokeWidth={2.2}/>
                Generate {format.label}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor */}
      {(generating || generated) && (
        <div className="fade-in-up" style={{
          marginTop: 24,
          background: 'var(--bg-elev-1)',
          border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          {/* Status row */}
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-elev-2)',
            display: 'flex', alignItems: 'center', gap: 10,
            flexWrap: 'wrap',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: generating ? 'oklch(0.78 0.16 75)' : 'oklch(0.78 0.16 145)',
              boxShadow: '0 0 8px currentColor',
              color: generating ? 'oklch(0.78 0.16 75)' : 'oklch(0.78 0.16 145)',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {generating ? 'Rendering…' : 'Editable preview · edit anything, your changes export'}
            </span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-dim)' }}>
              · formatted-doc-{Date.now().toString().slice(-4)}{format.tag}
            </span>
            <div style={{ flex: 1 }} />
            {generated && (
              <>
                <button onClick={rerender} className="reset" style={{
                  cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 10px',
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: 7,
                  fontSize: 12, fontWeight: 500,
                  color: 'var(--fg-muted)',
                }}
                title="Discard edits and re-render from source markdown">
                  <Icon.Loader size={11} strokeWidth={2}/> Re-render
                </button>

                <button onClick={handleCopy} disabled={copying} className="reset" style={{
                  cursor: copying ? 'wait' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px',
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: 7,
                  fontSize: 12, fontWeight: 500,
                  color: 'var(--fg-muted)',
                }}
                title="Copy formatted output to your clipboard">
                  {copying ? (
                    <><Icon.Loader size={11} strokeWidth={2} /> Copying...</>
                  ) : (
                    <>
                      <Icon.Copy size={11} strokeWidth={2} />
                      {format.value === 'md' ? 'Copy Markdown' : format.value === 'txt' ? 'Copy Plain Text' : 'Copy Rich Text'}
                    </>
                  )}
                </button>
                
                <button onClick={handleDownload} disabled={downloading} className="reset" style={{
                  cursor: downloading ? 'wait' : 'pointer',
                  opacity: downloading ? 0.7 : 1,
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '7px 14px',
                  background: 'linear-gradient(180deg, oklch(0.97 0.005 250), oklch(0.86 0.005 250))',
                  color: 'oklch(0.14 0.008 250)',
                  fontWeight: 500, fontSize: 13,
                  borderRadius: 7,
                  boxShadow: '0 1px 0 oklch(1 0 0 / 0.5) inset, 0 1px 3px oklch(0 0 0 / 0.5)',
                }}>
                  {downloading ? (
                    <><Icon.Loader size={12} strokeWidth={2.2} /> Generating...</>
                  ) : (
                    <><Icon.Download size={12} strokeWidth={2.2}/> Download {format.label}</>
                  )}
                </button>
              </>
            )}
          </div>

          {/* WYSIWYG toolbar */}
          {generated && format.value !== 'md' && format.value !== 'txt' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '8px 12px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-elev-2)',
              flexWrap: 'wrap',
            }} className="wysiwyg-toolbar">
              <BlockSelect value={activeMarks.block} onChange={setBlock} />
              <TBDivider />
              <TBButton title="Bold (⌘B)" active={activeMarks.bold} onClick={() => exec('bold')}><strong style={{ fontSize: 13 }}>B</strong></TBButton>
              <TBButton title="Italic (⌘I)" active={activeMarks.italic} onClick={() => exec('italic')}><em style={{ fontSize: 13, fontFamily: 'serif' }}>I</em></TBButton>
              <TBButton title="Underline (⌘U)" active={activeMarks.underline} onClick={() => exec('underline')}><span style={{ fontSize: 13, textDecoration: 'underline' }}>U</span></TBButton>
              <TBButton title="Strikethrough" active={activeMarks.strike} onClick={() => exec('strikeThrough')}><span style={{ fontSize: 13, textDecoration: 'line-through' }}>S</span></TBButton>
              <TBDivider />
              <TBButton title="Bulleted list" active={activeMarks.ul} onClick={() => exec('insertUnorderedList')}><Icon.List size={14} strokeWidth={2}/></TBButton>
              <TBButton title="Numbered list" active={activeMarks.ol} onClick={() => exec('insertOrderedList')}><Icon.ListOrdered size={14} strokeWidth={2}/></TBButton>
              <TBButton title="Quote" active={activeMarks.block === 'blockquote'} onClick={() => setBlock('blockquote')}><Icon.Quote size={13} strokeWidth={2}/></TBButton>
              <TBButton title="Code block" onClick={() => exec('formatBlock', '<pre>')}><Icon.Code size={13} strokeWidth={2}/></TBButton>
              <TBDivider />
              <TBButton title="Link" onClick={setLink}><Icon.LinkIcon size={13} strokeWidth={2}/></TBButton>
              <TBButton title="Remove formatting" onClick={() => exec('removeFormat')}><Icon.Eraser2 size={13} strokeWidth={2}/></TBButton>
              <TBDivider />
              <TBButton title="Align left" onClick={() => exec('justifyLeft')}><Icon.AlignLeft size={13} strokeWidth={2}/></TBButton>
              <TBButton title="Align center" onClick={() => exec('justifyCenter')}><Icon.AlignCenter size={13} strokeWidth={2}/></TBButton>
              <TBButton title="Align right" onClick={() => exec('justifyRight')}><Icon.AlignRight size={13} strokeWidth={2}/></TBButton>
              <TBDivider />
              <TBButton title="Undo (⌘Z)" onClick={() => exec('undo')}><Icon.Undo size={13} strokeWidth={2}/></TBButton>
              <TBButton title="Redo (⇧⌘Z)" onClick={() => exec('redo')}><Icon.Redo size={13} strokeWidth={2}/></TBButton>
              <div style={{ flex: 1, minWidth: 8 }} />
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-dim)' }}>
                {theme.label} · {format.tag}
              </span>
            </div>
          )}

          {/* Paper area */}
      <div style={{
        padding: 'clamp(20px, 4vw, 48px)',
        background: 'var(--bg-paper-container)',
        minHeight: 480,
        display: 'flex', justifyContent: 'center',
      }}>
        {generating ? (
          <div style={{ width: '100%', maxWidth: 760, background: 'oklch(0.97 0.005 250)', borderRadius: 6, padding: '60px 56px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="shimmer" style={{ height: 32, width: '60%', borderRadius: 4 }}/>
            <div className="shimmer" style={{ height: 14, width: '40%' }}/>
            <div style={{ height: 16 }}/>
            <div className="shimmer" style={{ height: 14, width: '95%' }}/>
            <div className="shimmer" style={{ height: 14, width: '92%' }}/>
          </div>
        ) : format.value === 'md' || format.value === 'txt' ? (
          <textarea
            ref={editorRef as any}
            defaultValue={text}
            spellCheck={false}
            style={{
              width: '100%', maxWidth: 760,
              background: 'oklch(0.97 0.005 250)', color: 'oklch(0.16 0.008 250)',
              borderRadius: 6, padding: '60px clamp(36px, 6vw, 72px)',
              boxShadow: '0 2px 4px oklch(0 0 0 / 0.4), 0 24px 80px oklch(0 0 0 / 0.5)',
              outline: 'none', border: 'none', resize: 'vertical', minHeight: 480,
              fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 14, lineHeight: 1.6
            }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable={generated}
            suppressContentEditableWarning spellCheck
            onKeyUp={updateActiveMarks} onMouseUp={updateActiveMarks} onFocus={updateActiveMarks}
            className={'paper paper-' + theme.value}
            style={{
              width: '100%', maxWidth: 760,
              background: 'oklch(0.97 0.005 250)', color: 'oklch(0.16 0.008 250)',
              borderRadius: 6, padding: '60px clamp(36px, 6vw, 72px)',
              boxShadow: '0 2px 4px oklch(0 0 0 / 0.4), 0 24px 80px oklch(0 0 0 / 0.5)',
              outline: 'none', minHeight: 480,
              fontFamily: theme.value === 'minimalist' ? '"JetBrains Mono", ui-monospace, monospace' : theme.value === 'academic' ? '"Source Serif Pro", Georgia, serif' : 'Inter, system-ui, sans-serif',
              fontSize: theme.value === 'minimalist' ? 13.5 : 15,
              lineHeight: theme.value === 'academic' ? 1.7 : 1.6,
            }}
          />
        )}
      </div>

          {/* Bottom meta */}
          {generated && (
            <div style={{
              padding: '8px 14px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-elev-2)',
              display: 'flex', alignItems: 'center', gap: 16,
              fontSize: 11, color: 'var(--fg-dim)',
              fontFamily: '"JetBrains Mono", monospace',
              flexWrap: 'wrap',
            }}>
              <span>Auto-saved · just now</span>
              <span>·</span>
              <span>{theme.value === 'academic' ? 'Source Serif, Inter' : theme.value === 'minimalist' ? 'JetBrains Mono' : 'Inter, Source Serif'}</span>
              <span>·</span>
              <span>2 pages · 184 KB</span>
              <span style={{ flex: 1 }} />
              <span>theme={theme.value} · format={format.value}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
  const featured = ALL_TOOLS.find(t => t.id === 'uaf');
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
}

function LandingNav({ onLaunch, scrolled, theme, onToggleTheme }: LandingNavProps) {
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
      {/* Brand Logo - Clickable link taking user back to marketing root / */}
      <a href="/" className="reset" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        textDecoration: 'none', color: 'inherit', cursor: 'pointer'
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 1px oklch(0.50 0.10 280 / 0.5), 0 4px 14px oklch(0.50 0.20 280 / 0.4)',
        }}>
          <Icon.Command size={16} strokeWidth={2.2} style={{ color: 'white' }} />
        </div>
        <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>mysaas</span>
      </a>

      <nav style={{ display: 'flex', gap: 2, marginLeft: 24 }} className="landing-nav-links">
        {[
          { label: 'Tools', path: '/dashboard' },
          { label: 'Pricing', path: '/pricing' },
          { label: 'Changelog', path: '/changelog' },
          { label: 'Docs', path: '/docs' },
        ].map(item => (
          <a key={item.label} href={item.path} className="reset top-link" style={{
            fontSize: 13, color: 'var(--fg-muted)',
            padding: '7px 12px', borderRadius: 6,
            textDecoration: 'none', cursor: 'pointer',
          }}>{item.label}</a>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      <button className="reset top-link" style={{
        fontSize: 13, color: 'var(--fg-muted)',
        padding: '8px 12px', borderRadius: 7,
        cursor: 'pointer',
      }}>Sign in</button>

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
            <a href={`/category/${cat.id}`} className="reset" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
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
            </a>

            {/* Crawlable list of individual tools */}
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {cat.tools.slice(0, 4).map(t => {
                const Ico = Icon[t.icon] || Icon.Sparkles;
                return (
                  <li key={t.id}>
                    <a href={`/tools/${t.id}`} className="reset" style={{
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
                    </a>
                  </li>
                );
              })}
              {cat.tools.length > 4 && (
                <li style={{ marginTop: 4 }}>
                  <a href={`/category/${cat.id}`} className="reset" style={{
                    fontSize: 11, color: 'var(--fg-subtle)',
                    display: 'flex', alignItems: 'center', gap: 5,
                    textDecoration: 'none',
                  }}>
                    <span>and more</span>
                    <Icon.ArrowRight size={10} />
                  </a>
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
}

function Pricing({ onLaunch, onEnterprise }: PricingProps) {
  return (
    <section id="pricing" style={{
      maxWidth: 1080, margin: '0 auto',
      padding: '96px 32px 64px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div style={eyebrow}>Pricing</div>
        <h2 style={sectionTitle}>
          Free for everything small.<br/>
          <span style={italicAccent}>$9 a month for everything else.</span>
        </h2>
        <p style={sectionSubtitle}>
          No seats, no per-tool gating, no trial timers. Two plans that just work.
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
              ['50 documents / month', true],
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
              <span style={{ fontSize: 48, fontWeight: 600, letterSpacing: '-0.03em' }}>$9</span>
              <span style={{ color: 'var(--fg-subtle)', fontSize: 14 }}>/ month, billed annually</span>
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

          <button onClick={onLaunch} className="reset" style={{
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
}

function Landing({ onLaunch, onEnterprise, onBrowseTools, theme, onToggleTheme }: LandingProps) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fade-in">
      <LandingNav onLaunch={onLaunch} scrolled={scrolled} theme={theme} onToggleTheme={onToggleTheme} />
      <LandingHero onLaunch={onLaunch} />
      <SuitePreview onLaunch={onLaunch} />
      <Pricing onLaunch={onLaunch} onEnterprise={onEnterprise} />
      <ClosingCTA onLaunch={onLaunch} onBrowseTools={onBrowseTools} />
    </div>
  );
}

// ===========================================================================
// Placeholder tool, Footer, App router — from app-tool.jsx
// ===========================================================================

/* =========================================================================
   Generic placeholder tool view
   ========================================================================= */

interface JsonToolProps {
  tool: any;
}

function JsonTool({ tool }: JsonToolProps) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [inputMethod, setInputMethod] = useState<'paste' | 'upload'>('paste');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'repaired' | 'already_valid' | 'error' | 'fatal_error'>('idle');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeHue = tool.hue ?? 195; // Developer & Code is Cyan (195)

  // Real-time details
  const charsCount = inputText.length;
  const linesCount = inputText ? inputText.split('\n').length : 0;
  const sizeKb = charsCount ? (charsCount / 1024).toFixed(2) : '0.00';

  const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://my-saas-mezp.onrender.com';

  async function handleAction(action: 'Format' | 'Auto-Repair' | 'Minify') {
    if (!inputText.trim()) {
      setStatus('error');
      setErrorDetails('Input is empty. Please paste or upload some JSON first.');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setErrorDetails(null);

    try {
      const response = await fetch(`${API_BASE}/api/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: inputText,
          action: action,
        }),
      });

      if (!response.ok) {
        throw new Error('API server returned an error.');
      }

      const res = await response.json();
      setStatus(res.status);
      
      if (res.status === 'success' || res.status === 'already_valid' || res.status === 'repaired') {
        setOutputText(res.output);
        if (res.status === 'repaired' || res.status === 'already_valid') {
          setErrorDetails(res.error_details);
        }
      } else {
        setOutputText('');
        setErrorDetails(res.error_details);
      }
    } catch (e: any) {
      setStatus('fatal_error');
      setErrorDetails(`Connection failed: Could not reach the backend high-compute parser. ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setInputText('');
    setOutputText('');
    setStatus('idle');
    setErrorDetails(null);
  }

  async function handleCopy() {
    if (copying || !outputText) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(outputText);
    } catch (err) {}
    setTimeout(() => setCopying(false), 2000);
  }

  function handleDownload() {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MySaaS_Formatted_Data.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // File loading
  function handleFileLoad(file: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setInputText(e.target.result as string);
        setStatus('idle');
        setErrorDetails(null);
      }
    };
    reader.readAsText(file);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }
  function onDragLeave() {
    setIsDragOver(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileLoad(e.dataTransfer.files[0]);
    }
  }

  const Ico = Icon[tool.icon] || Icon.Braces;

  return (
    <div style={{
      maxWidth: 1240, margin: '0 auto',
      padding: '40px 24px 80px',
    }} className="fade-in">
      
      {/* Breadcrumb Header */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontSize: 11.5, color: 'var(--fg-dim)',
        marginBottom: 14,
      }} className="mono">
        <span style={{ color: tintFg(tool.hue) }}>{tool.categoryLabel}</span>
        <span>/</span>
        <span style={{ color: 'var(--fg-muted)' }}>{tool.id}</span>
      </div>

      {/* Tool Identity Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12,
          background: tint(tool.hue),
          border: `1px solid ${tintBorder(tool.hue)}`,
          color: tintFg(tool.hue),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 24px ${tint(tool.hue, 0.4, 0.1, 0.1)}`,
        }}>
          <Ico size={24} strokeWidth={2} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: 'white', letterSpacing: '-0.02em' }}>{tool.name}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--fg-muted)' }}>{tool.tagline}</p>
        </div>
      </div>

      {/* Two Column Layout Panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: 24,
        alignItems: 'start',
      }} className="tools-split-layout">
        
        {/* Left Side: Input & Operations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: 'oklch(0.16 0.006 250 / 0.7)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '20px 24px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            
            {/* Input Selection Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 6, background: 'oklch(0.12 0.004 250)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
                <button onClick={() => setInputMethod('paste')} className="reset mono" style={{
                  padding: '6px 12px', fontSize: 11.5, fontWeight: 600, borderRadius: 6,
                  background: inputMethod === 'paste' ? 'oklch(0.20 0.008 250)' : 'transparent',
                  color: inputMethod === 'paste' ? 'white' : 'var(--fg-muted)',
                  cursor: 'pointer',
                }}>Paste Text</button>
                <button onClick={() => setInputMethod('upload')} className="reset mono" style={{
                  padding: '6px 12px', fontSize: 11.5, fontWeight: 600, borderRadius: 6,
                  background: inputMethod === 'upload' ? 'oklch(0.20 0.008 250)' : 'transparent',
                  color: inputMethod === 'upload' ? 'white' : 'var(--fg-muted)',
                  cursor: 'pointer',
                }}>Upload File</button>
              </div>

              <div>
                <button onClick={handleClear} className="reset mono" style={{
                  padding: '6px 12px', fontSize: 11.5, fontWeight: 500, borderRadius: 6,
                  color: 'oklch(0.70 0.12 15)', border: '1px solid oklch(0.70 0.12 15 / 0.2)',
                  cursor: 'pointer',
                }}>Clear Input</button>
              </div>
            </div>

            {/* Input Form Elements */}
            {inputMethod === 'paste' ? (
              <textarea
                placeholder="Paste raw, messy, or broken JSON payload here..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                style={{
                  width: '100%', height: 320, padding: 16, borderRadius: 10,
                  background: 'oklch(0.12 0.004 250)', border: '1px solid var(--border)',
                  color: 'white', fontFamily: '"Fira Code", monospace', fontSize: 13,
                  outline: 'none', resize: 'none', boxSizing: 'border-box',
                  lineHeight: 1.5,
                }}
              />
            ) : (
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%', height: 320, borderRadius: 10,
                  border: `2px dashed ${isDragOver ? tintFg(tool.hue) : 'var(--border)'}`,
                  background: isDragOver ? tint(tool.hue, 0.18, 0.04, 0.06) : 'oklch(0.12 0.004 250)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s',
                  boxSizing: 'border-box', padding: 24, textAlign: 'center',
                }}
              >
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={e => e.target.files?.[0] && handleFileLoad(e.target.files[0])}
                  style={{ display: 'none' }}
                />
                <Icon.FileDown size={36} style={{ color: isDragOver ? tintFg(tool.hue) : 'var(--fg-dim)', marginBottom: 14 }} />
                <span style={{ fontSize: 14.5, fontWeight: 500, color: 'white', display: 'block', marginBottom: 6 }}>
                  {inputText ? '📄 File Loaded Successfully' : 'Drag and drop your .json file here'}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--fg-subtle)' }}>
                  {inputText ? `Click here to replace file (${sizeKb} KB)` : 'or click to browse local files'}
                </span>
              </div>
            )}

            {/* Input Metric readouts */}
            <div style={{
              display: 'flex', gap: 16, fontSize: 11.5, color: 'var(--fg-subtle)',
              borderTop: '1px solid var(--border)', paddingTop: 14,
            }} className="mono">
              <div>Chars: <span style={{ color: 'white' }}>{charsCount}</span></div>
              <div>Lines: <span style={{ color: 'white' }}>{linesCount}</span></div>
              <div>Size: <span style={{ color: 'white' }}>{sizeKb} KB</span></div>
            </div>
          </div>

          {/* Action Operations Bar */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <button
              onClick={() => handleAction('Format')}
              disabled={loading}
              className="reset"
              style={{
                width: '100%', padding: '14px', borderRadius: 10,
                background: tint(tool.hue),
                border: `1px solid ${tintBorder(tool.hue)}`,
                color: tintFg(tool.hue),
                fontWeight: 600, fontSize: 14,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {loading ? 'Processing...' : '✨ Format & Validate'}
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
              <button
                onClick={() => handleAction('Auto-Repair')}
                disabled={loading}
                className="reset"
                style={{
                  padding: '12px', borderRadius: 10,
                  background: 'oklch(0.20 0.008 75 / 0.25)',
                  border: '1px solid oklch(0.75 0.14 75 / 0.2)',
                  color: 'oklch(0.78 0.16 75)',
                  fontWeight: 500, fontSize: 13,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Icon.HeartPulse size={13} /> Repair Broken JSON
              </button>

              <button
                onClick={() => handleAction('Minify')}
                disabled={loading}
                className="reset"
                style={{
                  padding: '12px', borderRadius: 10,
                  background: 'oklch(0.18 0.008 250 / 0.6)',
                  border: '1px solid var(--border)',
                  color: 'white',
                  fontWeight: 500, fontSize: 13,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Icon.Archive size={13} /> Minify (Compress)
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Output & Status badging */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Status Alert Banners */}
          {status !== 'idle' && (
            <div className="fade-in">
              {/* Valid Badges */}
              {(status === 'success' || status === 'already_valid') && (
                <div style={{
                  padding: '14px 20px', borderRadius: 10,
                  background: 'oklch(0.20 0.010 145 / 0.2)',
                  border: '1px solid oklch(0.75 0.14 145 / 0.3)',
                  color: 'oklch(0.78 0.16 145)',
                  display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5,
                  boxShadow: '0 0 16px oklch(0.78 0.16 145 / 0.1)',
                }}>
                  <Icon.CheckCircle size={15} strokeWidth={2.5} />
                  <span>
                    <strong>Valid JSON!</strong> Prettified payload is compiled successfully.
                    {errorDetails && <span style={{ display: 'block', fontSize: 12, marginTop: 4, opacity: 0.8 }}>({errorDetails})</span>}
                  </span>
                </div>
              )}

              {/* Repaired Badges */}
              {status === 'repaired' && (
                <div style={{
                  padding: '14px 20px', borderRadius: 10,
                  background: 'oklch(0.20 0.010 75 / 0.25)',
                  border: '1px solid oklch(0.75 0.14 75 / 0.3)',
                  color: 'oklch(0.78 0.16 75)',
                  display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5,
                }}>
                  <Icon.AlertTriangle size={15} strokeWidth={2.5} />
                  <span>
                    <strong>Repaired JSON!</strong> {errorDetails}
                  </span>
                </div>
              )}

              {/* Error Badges */}
              {(status === 'error' || status === 'fatal_error') && (
                <div style={{
                  padding: '14px 20px', borderRadius: 10,
                  background: 'oklch(0.20 0.010 15 / 0.2)',
                  border: '1px solid oklch(0.70 0.12 15 / 0.3)',
                  color: 'oklch(0.80 0.10 15)',
                  display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5,
                  lineHeight: 1.4,
                }}>
                  <Icon.XCircle size={16} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Validation Failed:</strong> {errorDetails}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Output Display Card */}
          <div style={{
            background: 'oklch(0.16 0.006 250 / 0.7)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '20px 24px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            
            {/* Output Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'white' }} className="mono">Formatted Output</div>
              
              {outputText && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }} className="fade-in">
                  <button onClick={handleCopy} className="reset mono" style={{
                    padding: '6px 12px', fontSize: 11.5, fontWeight: 600, borderRadius: 6,
                    border: '1px solid var(--border)', background: 'oklch(0.12 0.004 250)',
                    color: copying ? 'oklch(0.78 0.16 145)' : 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {copying ? <><Icon.Check size={12} /> Copied!</> : <><Icon.Copy size={12} /> Copy JSON</>}
                  </button>
                  <button onClick={handleDownload} className="reset mono" style={{
                    padding: '6px 12px', fontSize: 11.5, fontWeight: 600, borderRadius: 6,
                    border: '1px solid var(--border)', background: 'oklch(0.12 0.004 250)',
                    color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <Icon.Download size={12} /> Download
                  </button>
                </div>
              )}
            </div>

            {/* Output code block container */}
            <div style={{ position: 'relative' }}>
              <textarea
                readOnly
                placeholder="Processed validation output will render here..."
                value={outputText}
                style={{
                  width: '100%', height: 320, padding: 16, borderRadius: 10,
                  background: 'oklch(0.12 0.004 250 / 0.5)', border: '1px solid var(--border)',
                  color: outputText ? 'oklch(0.85 0.10 195)' : 'var(--fg-dim)', 
                  fontFamily: '"Fira Code", monospace', fontSize: 13,
                  outline: 'none', resize: 'none', boxSizing: 'border-box',
                  lineHeight: 1.5,
                }}
              />
            </div>

            {/* Output metrics details */}
            <div style={{
              display: 'flex', gap: 16, fontSize: 11.5, color: 'var(--fg-subtle)',
              borderTop: '1px solid var(--border)', paddingTop: 14,
            }} className="mono">
              <div>Chars: <span style={{ color: 'white' }}>{outputText.length}</span></div>
              <div>Lines: <span style={{ color: 'white' }}>{outputText ? outputText.split('\n').length : 0}</span></div>
              <div>Size: <span style={{ color: 'white' }}>{outputText ? (outputText.length / 1024).toFixed(2) : '0.00'} KB</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

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
}

function Footer({ onBackToLanding }: FooterProps) {
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
            <span style={{ fontSize: 14, fontWeight: 600 }}>mysaas</span>
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
          { label: 'Roadmap', path: '/roadmap' },
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
        <span>© 2026 mysaas, inc.</span>
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
            <a href={l.path} className="footer-link" style={{
              fontSize: 12.5, color: 'var(--fg-muted)', textDecoration: 'none',
            }}>{l.label}</a>
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
        {/* Tier 1 */}
        <div className="glass-card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">Tier 1: Free</div>
          <h2 style={{ fontSize: 24, fontWeight: 600, margin: '8px 0 16px', color: 'var(--fg)' }}>Zero-Compute</h2>
          <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, color: 'var(--fg)' }}>$0 <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--fg-dim)' }}>/ forever</span></div>
          <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', marginBottom: 24, minHeight: 40 }}>Perfect for quick daily copy-pastes and text utilities.</p>
          <ul style={{ ...listStyle, marginBottom: 32 }}>
            <Feature on={true}>Unlimited daily usage on Free Tools</Feature>
            <Feature on={true}>Universal AI Formatter (Tool 1)</Feature>
            <Feature on={true}>JSON Formatter & Validator</Feature>
            <Feature on={false}>Bulk & batch statements processing</Feature>
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
          >Get Started</button>
        </div>

        {/* Tier 2 */}
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
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">Tier 2: Metered</div>
          <h2 style={{ fontSize: 24, fontWeight: 600, margin: '8px 0 16px', color: 'var(--fg)' }}>Moderate-Compute</h2>
          <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, color: 'var(--fg)' }}>2 <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--fg-dim)' }}>free runs / day</span></div>
          <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', marginBottom: 24, minHeight: 40 }}>Full access to locked parsers, OCR, bank statements, and subtitle resyncer tools.</p>
          <ul style={{ ...listStyle, marginBottom: 32 }}>
            <Feature on={true}>2 free runs/day on Tier 2 Tools</Feature>
            <Feature on={true}>Screenshot to Excel & PDF Extractor</Feature>
            <Feature on={true}>Generic PDF Bank Parser</Feature>
            <Feature on={true}>Auto-Redactor & Subtitle Syncer</Feature>
          </ul>
          <button onClick={onLaunch} className="reset" style={{
            width: '100%', padding: '12px', borderRadius: 8,
            background: 'linear-gradient(180deg, oklch(0.72 0.18 265), oklch(0.62 0.20 265))',
            color: 'white', fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
            textAlign: 'center', marginTop: 'auto',
            boxShadow: '0 4px 14px oklch(0.50 0.20 265 / 0.3)',
          }}>Try Metered Free</button>
        </div>

        {/* Tier 3 */}
        <div className="glass-card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">Tier 3: Pro</div>
          <h2 style={{ fontSize: 24, fontWeight: 600, margin: '8px 0 16px', color: 'var(--fg)' }}>Pro Workspace</h2>
          <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, color: 'var(--fg)' }}>$9 <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--fg-dim)' }}>/ month</span></div>
          <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', marginBottom: 24, minHeight: 40 }}>For heavy workflows, B2B parsing, teams, and high-volume parsing.</p>
          <ul style={{ ...listStyle, marginBottom: 32 }}>
            <Feature on={true} em={true}>Unlimited daily runs on all tools</Feature>
            <Feature on={true} em={true}>Visual PDF Diff Checker</Feature>
            <Feature on={true} em={true}>Bulk & Batch process 500 files</Feature>
            <Feature on={true} em={true}>Custom branded exports & watermarks</Feature>
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
          >Unlock Pro Vault</button>
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
}

function AboutPage({ onLaunch }: AboutPageProps) {
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
            Welcome to <strong style={{ color: 'var(--fg)' }}>MySaaS</strong>—a collection of lightweight, blazing-fast, serverless-grade utility tools built directly for developers, creators, and professionals.
          </p>
          
          <h2 style={{ fontSize: 20, color: 'var(--fg)', fontWeight: 600, margin: '24px 0 8px', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Our Mission: Extreme Speed, Total Privacy</h2>
          <p>
            Most modern websites have become bloated, filled with megabytes of tracking pixels, advertising banners, and slow server-side loops. We believe that simple, daily file operations—like scrubbing metadata, formatting JSON, synching subtitles, or converting HEIC images—should run in milliseconds right inside your browser without leaking any private details.
          </p>

          <h2 style={{ fontSize: 20, color: 'var(--fg)', fontWeight: 600, margin: '24px 0 8px', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Monetization Model: Metered Freemium & PPP</h2>
          <p>
            To make this tool accessible worldwide, we leverage **Purchasing Power Parity (PPP)** pricing:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li style={{ paddingLeft: 16, borderLeft: '3px solid var(--accent)' }}>
              <strong style={{ color: 'var(--fg)' }}>Tier 1 (Free)</strong>: Unlimited daily usage on low-compute developer tools. 100% free forever, supported by clean ad networks.
            </li>
            <li style={{ paddingLeft: 16, borderLeft: '3px solid var(--accent)' }}>
              <strong style={{ color: 'var(--fg)' }}>Tier 2 (Metered)</strong>: 2 free daily runs on heavier operations (OCR, PDF bank statements, scanned extraction).
            </li>
            <li style={{ paddingLeft: 16, borderLeft: '3px solid var(--accent)' }}>
              <strong style={{ color: 'var(--fg)' }}>Tier 3 (Pro)</strong>: High-fidelity B2B utilities, saved history database, and batch processing up to 500 files at once for $9/month globally or ₹199/month in India/Domestic.
            </li>
          </ul>

          <h2 style={{ fontSize: 20, color: 'var(--fg)', fontWeight: 600, margin: '24px 0 8px', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Secure Infrastructure: The Digital Bouncer</h2>
          <p>
            Our backend engine utilizes a custom-built **Digital Bouncer (threading.Lock)** protecting Render's 512MB memory limits. This ensures that heavy serverless tasks queue safely without blowing out server costs or causing memory leakage crashes, keeping the hosting extremely light, cheap, and robust.
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
}

function BlogPage({ onLaunch }: BlogPageProps) {
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

  const posts = [
    {
      title: 'Why We Built MySaaS: The Case for On-Device Utilities',
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
  // Determine starting view based on presets
  let initialView = 'landing';
  if (initialSlug) {
    if (initialSlug === 'pricing' || initialSlug === 'about' || initialSlug === 'docs' || initialSlug === 'changelog' || initialSlug === 'roadmap' || initialSlug === 'contact' || initialSlug === 'privacy' || initialSlug === 'blog') {
      initialView = initialSlug;
    } else if (initialSlug === 'dashboard' || initialSlug === 'home') {
      initialView = 'home';
    } else if (initialSlug.startsWith('category_')) {
      initialView = initialSlug;
    } else {
      const parts = initialSlug.split('-to-');
      if (parts.length === 2) {
        initialView = 'uaf';
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

  // Dynamic browser title resolver
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    let title = 'MySaaS - Premium Online Utilities Hub';
    if (view === 'landing') {
      title = 'MySaaS - Stop Googling Tiny Tools. Start Finishing.';
    } else if (view === 'home') {
      title = 'Dashboard & Workspace - Premium SaaS Tools Hub';
    } else if (view === 'pricing') {
      title = 'Simple & Fair Pricing - Premium SaaS Tools Hub';
    } else if (view === 'about') {
      title = 'Our Vision & Core Philosophy - Premium SaaS Tools Hub';
    } else if (view === 'docs') {
      title = 'Developer Documentation & Technical Guide - Premium SaaS Tools Hub';
    } else if (view === 'changelog') {
      title = 'Changelog & Product Updates - Premium SaaS Tools Hub';
    } else if (view === 'roadmap') {
      title = 'Product Roadmap - MySaaS Tools Hub';
    } else if (view === 'contact') {
      title = 'Contact Us - MySaaS Tools Hub';
    } else if (view === 'privacy') {
      title = 'Privacy Policy - MySaaS Tools Hub';
    } else if (view === 'blog') {
      title = 'Blog - MySaaS Tools Hub';
    } else if (view.startsWith('category_')) {
      const catId = view.replace('category_', '');
      const cat = CATEGORIES.find(c => c.id === catId);
      title = `${cat ? cat.label : 'Category'} Tools Catalog - Premium Utilities Hub`;
    } else {
      const tool = ALL_TOOLS.find(t => t.id === view);
      if (tool) {
        title = `${tool.name} - Premium Online Utility Tool`;
      }
    }
    
    document.title = title;
  }, [view]);

  // Dynamic Scroll Restoration - instantly jump to top on view change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasHash = window.location.hash;
      if (!hasHash) {
        window.scrollTo(0, 0);
      }
    }
  }, [view]);

  const isLanding = view === 'landing';
  const isDashboard = view === 'home';

  const activeTool = useMemo(() => {
    if (isLanding || isDashboard || view === 'pricing' || view === 'about' || view === 'docs' || view === 'changelog' || view === 'roadmap' || view === 'contact' || view === 'privacy' || view === 'blog' || view.startsWith('category_')) return null;
    return ALL_TOOLS.find(t => t.id === view);
  }, [view, isLanding, isDashboard]);

  // Native navigation handlers
  function launchApp() {
    window.location.href = '/dashboard';
  }
  
  function openTool(id: string) {
    let path = `/tools/${id}`;
    if (id === 'home' || id === 'dashboard') {
      path = '/dashboard';
    } else if (id === 'landing') {
      path = '/';
    } else if (['pricing', 'about', 'docs', 'changelog', 'roadmap', 'contact', 'privacy', 'blog'].includes(id)) {
      path = `/${id}`;
    } else if (id.includes('-to-')) {
      path = `/tools/format/${id}`;
    } else if (id.startsWith('category_')) {
      path = `/category/${id.replace('category_', '')}`;
    }
    window.location.href = path;
  }
  
  function goHome() {
    window.location.href = '/dashboard';
  }
  
  function backToLanding() {
    window.location.href = '/';
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
          <Landing onLaunch={launchApp} onEnterprise={() => setEnterpriseOpen(true)} onBrowseTools={() => setLauncher(true)} theme={theme} onToggleTheme={toggleTheme} />
          <Footer onBackToLanding={null} />
        </div>
        <Launcher open={launcher} onClose={() => setLauncher(false)} onPick={openTool} />
        <EnterpriseModal open={enterpriseOpen} onClose={() => setEnterpriseOpen(false)} />
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
          {view === 'about' && <AboutPage onLaunch={launchApp} />}
          {view === 'docs' && <DocsPage onLaunch={launchApp} />}
          {view === 'changelog' && <ChangelogPage onLaunch={launchApp} />}
          {view === 'roadmap' && <RoadmapPage onLaunch={launchApp} />}
          {view === 'contact' && <ContactPage onLaunch={launchApp} />}
          {view === 'privacy' && <PrivacyPage onLaunch={launchApp} />}
          {view === 'blog' && <BlogPage onLaunch={launchApp} />}
          {view.startsWith('category_') && (
            <CategoryHub categoryId={view.replace('category_', '')} onOpenTool={openTool} />
          )}
          {!isDashboard && activeTool && (
            activeTool.id === 'uaf'
              ? <FormatterTool tool={activeTool} initialSlug={initialSlug} />
              : activeTool.id === 'json'
                ? <JsonTool tool={activeTool} />
                : <ComingSoonStub tool={activeTool} />
          )}
        </main>

        <Footer onBackToLanding={backToLanding} />

        <CommandPalette open={palette} onClose={() => setPalette(false)} onPick={openTool} />
        <Launcher open={launcher} onClose={() => setLauncher(false)} onPick={openTool} />
      </div>
      <EnterpriseModal open={enterpriseOpen} onClose={() => setEnterpriseOpen(false)} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Default export — drop in app/page.tsx.
// ---------------------------------------------------------------------------
export default function Page() {
  return <App />;}
