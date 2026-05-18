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
};


const GLOBAL_CSS = `:root {
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
  /* Tiny grain texture */
  body::after {
    content: "";
    position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.025;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  }
  .app-root { position: relative; z-index: 1; }

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
const CATEGORIES = [
  {
    id: 'ai',
    label: 'Text & AI',
    tagline: 'Tame raw AI output. Polish transcripts. Make text readable.',
    hue: 265, /* indigo */
    tools: [
      { id: 'uaf',   name: 'Universal AI Formatter',           icon: 'Sparkles',      tagline: 'Raw AI output → premium themed documents', featured: true, hot: true },
      { id: 'conv',  name: 'Entire AI Conversation Formatter', icon: 'MessageSquare', tagline: 'Export full chats with code blocks intact' },
      { id: 'tran',  name: 'Transcript Cleaner',               icon: 'Mic',           tagline: 'Strip filler, re-punctuate, identify speakers' },
      { id: 'slug',  name: 'Smart URL Slug Maker',             icon: 'Link2',         tagline: 'Unicode-safe, SEO-friendly slugs at scale' },
      { id: 'diff',  name: 'Unlimited Text Diff',              icon: 'Diff',          tagline: 'Word-level diffs that scale to entire books' },
    ],
  },
  {
    id: 'dev',
    label: 'Developer & Code',
    tagline: 'The data-wrangling tools you keep tabbing back to.',
    hue: 195, /* cyan */
    tools: [
      { id: 'json',    name: 'JSON Formatter & Validator',  icon: 'Braces',   tagline: 'Format, validate, JSONPath, schema infer' },
      { id: 'b64',     name: 'Base64 Encoder / Decoder',    icon: 'Binary',   tagline: 'Text, files, data-URIs · streaming' },
      { id: 'sql',     name: 'SQL Beautifier',              icon: 'Database', tagline: 'Pg / MySQL / SQLite dialect-aware' },
      { id: 'flat',    name: 'JSON / YAML / CSV Flattener', icon: 'Layers',   tagline: 'Dot-paths, arrays-to-rows, lossless round-trip' },
      { id: 'xlmd',    name: 'Excel ↔ Markdown Tables',     icon: 'Table',    tagline: 'Round-trip without losing formulas' },
      { id: 'csv2sql', name: 'CSV → SQL Generator',         icon: 'Terminal', tagline: 'Inferred types, batched INSERTs, schema DDL' },
    ],
  },
  {
    id: 'files',
    label: 'Files & Data',
    tagline: 'Open the unopenable. Repair the broken. Extract the buried.',
    hue: 145, /* green */
    tools: [
      { id: 'mime',   name: 'MIME / File Type Detector',     icon: 'FileSearch', tagline: 'Magic bytes, not extensions' },
      { id: 'zip',    name: '.zip / .tar Previewer',         icon: 'Archive',    tagline: 'Browse archives in-browser, no download' },
      { id: 'csvdr',  name: 'CSV Doctor',                    icon: 'HeartPulse', tagline: 'Repair quoting, encoding, line endings' },
      { id: 'bank',   name: 'Generic PDF Bank Parser',       icon: 'FileText',   tagline: 'Statement → categorized transactions' },
      { id: 'ocr1',   name: 'PDF Scanned Text Extractor',    icon: 'ScanText',   tagline: 'Layout-aware OCR with column detection' },
      { id: 'ocr2',   name: 'Screenshot → Excel / Text',     icon: 'Camera',     tagline: 'Table OCR that respects rows and columns', hot: true },
      { id: 'redact', name: 'Auto-Redactor (PII Scrubber)',  icon: 'Shield',     tagline: 'GDPR-grade redaction, on-device' },
    ],
  },
  {
    id: 'media',
    label: 'Images & Media',
    tagline: 'Convert, scrub, sync, and grab — without uploading.',
    hue: 25, /* warm orange */
    tools: [
      { id: 'heic',  name: 'HEIC → JPG Converter',       icon: 'Image',     tagline: 'Batch convert with EXIF preserved' },
      { id: 'meta',  name: 'Metadata Scrubber',          icon: 'Eraser',    tagline: 'Strip EXIF, GPS, author from any file' },
      { id: 'thumb', name: 'Ultimate Thumbnail Grabber', icon: 'Film',      tagline: 'YouTube, Vimeo, TikTok · max-res variants' },
      { id: 'dup',   name: 'Duplicate Image Finder',     icon: 'Copy',      tagline: 'Perceptual hashing, not byte-identical' },
      { id: 'qr',    name: 'Custom QR + Logo Maker',     icon: 'QrCode',    tagline: 'Branded QR with logo, color, gradient' },
      { id: 'subs',  name: 'Subtitle Resyncer',          icon: 'Subtitles', tagline: 'Drift-correct .srt / .vtt by drag-handle' },
    ],
  },
  {
    id: 'pro',
    label: 'Pro Vault',
    tagline: 'Heavyweight tools for teams. Unlimited runs, branded exports, full history.',
    hue: 75, /* amber */
    pro: true,
    tools: [
      { id: 'pdiff', name: 'Visual PDF Diff Checker',          icon: 'GitCompare', tagline: 'Pixel + semantic diff across versions', pro: true },
      { id: 'hpdf',  name: 'HTML → Print-Ready PDF',           icon: 'Printer',    tagline: 'Bleed, crop marks, color profiles', pro: true },
      { id: 'batch', name: 'Batch Processing Engine',          icon: 'Layers3',    tagline: 'Run any tool against 500 files at once', pro: true },
      { id: 'hist',  name: 'Saved History & Branded Exports',  icon: 'BookMarked', tagline: 'Version every run, brand every output', pro: true },
    ],
  },
];

/* Flat lookup for command palette */
const ALL_TOOLS = CATEGORIES.flatMap(c =>
  c.tools.map(t => ({ ...t, category: c.id, categoryLabel: c.label, hue: c.hue }))
);

function fuzzyMatch(query, target) {
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

function searchTools(query) {
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

function useKeydown(handler) {
  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}

function useBodyLock(locked) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [locked]);
}

/* Subtle category-tinted background swatch for icon containers */
const tint = (hue, l = 0.30, c = 0.06, alpha = 0.55) =>
  `oklch(${l} ${c} ${hue} / ${alpha})`;
const tintFg = (hue) => `oklch(0.82 0.13 ${hue})`;
const tintBorder = (hue) => `oklch(0.45 0.10 ${hue} / 0.45)`;

/* =========================================================================
   Top bar — sticky, blurred, optional contrast
   ========================================================================= */

function TopBar({ onOpenPalette, onOpenLauncher, onHome, activeTool, scrolled }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      height: 56,
      display: 'flex', alignItems: 'center',
      padding: '0 20px',
      gap: 14,
      background: scrolled ? 'oklch(0.14 0.005 250 / 0.78)' : 'transparent',
      borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
      backdropFilter: scrolled ? 'blur(20px) saturate(140%)' : 'none',
      transition: 'background 0.25s, border-color 0.25s, backdrop-filter 0.25s',
    }}>
      {/* Brand */}
      <button onClick={onHome} className="reset" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer',
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
      </button>

      {/* Tools launcher pill — center on desktop, hidden on mobile (use ⌘K instead) */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <button onClick={onOpenLauncher} className="reset launcher-pill" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 14px 7px 12px',
          background: 'oklch(0.20 0.008 250 / 0.7)',
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
        background: 'oklch(0.20 0.008 250 / 0.6)',
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

      <a href="#pricing" className="reset top-link" style={topLink}>Pricing</a>
      <a href="#docs" className="reset top-link" style={topLink}>Docs</a>

      <button className="reset" style={{
        padding: '8px 14px',
        background: 'linear-gradient(180deg, oklch(0.96 0.005 250), oklch(0.88 0.005 250))',
        color: 'oklch(0.18 0.008 250)',
        fontWeight: 500,
        fontSize: 13,
        borderRadius: 8,
        cursor: 'pointer',
        boxShadow: '0 1px 0 oklch(1 0 0 / 0.3) inset, 0 1px 2px oklch(0 0 0 / 0.5)',
        letterSpacing: '-0.005em',
      }}>Get started</button>
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

function CommandPalette({ open, onClose, onPick }) {
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const results = useMemo(() => searchTools(q).slice(0, 12), [q]);

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

  function onKey(e) {
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
      background: 'oklch(0.06 0.005 250 / 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: 'min(15vh, 120px)',
    }}>
      <div onClick={e => e.stopPropagation()} className="scale-in" style={{
        width: 'min(640px, calc(100vw - 32px))',
        background: 'oklch(0.18 0.008 250 / 0.95)',
        border: '1px solid var(--border-strong)',
        borderRadius: 14,
        boxShadow: '0 24px 80px oklch(0 0 0 / 0.6), 0 0 0 1px oklch(0 0 0 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.05)',
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
          <kbd className="kbd">esc</kbd>
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
          ) : results.map((t, i) => {
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
                  background: active ? 'oklch(0.26 0.025 250)' : 'transparent',
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
          background: 'oklch(0.15 0.006 250 / 0.6)',
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

function Launcher({ open, onClose, onPick }) {
  useBodyLock(open);
  useKeydown(useCallback(e => {
    if (open && e.key === 'Escape') onClose();
  }, [open, onClose]));

  if (!open) return null;

  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0, zIndex: 90,
      background: 'oklch(0.10 0.005 250 / 0.96)',
      backdropFilter: 'blur(20px)',
      overflowY: 'auto',
    }}>
      {/* Top close bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 32px',
        background: 'linear-gradient(180deg, oklch(0.10 0.005 250 / 0.9), transparent)',
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

function ToolCard({ tool, onClick, compact, large }) {
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
        background: hover ? 'oklch(0.21 0.010 250 / 0.85)' : 'oklch(0.175 0.008 250 / 0.6)',
        border: '1px solid',
        borderColor: hover ? tintBorder(tool.hue) : 'var(--border)',
        borderRadius: 12,
        position: 'relative', overflow: 'hidden',
        transition: 'background 0.18s, border-color 0.18s, transform 0.18s',
        transform: hover ? 'translateY(-1px)' : 'none',
        boxShadow: hover ? `0 8px 32px oklch(0 0 0 / 0.4), 0 0 0 1px ${tintBorder(tool.hue)}` : 'inset 0 1px 0 oklch(1 0 0 / 0.02)',
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

function Select({ value, options, onChange, label, compact }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
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

const THEMES = [
  { value: 'modern',     label: 'Modern',     tag: 'default', desc: 'Editorial layout · Inter + Source Serif' },
  { value: 'academic',   label: 'Academic',   tag: 'A4',      desc: 'Two-column · numbered headings · serif body' },
  { value: 'minimalist', label: 'Minimalist', tag: 'mono',    desc: 'Pure type · ultra-tight spacing' },
];
const FORMATS = [
  { value: 'pdf',  label: 'PDF',         tag: '.pdf',  desc: 'Vector, embedded fonts' },
  { value: 'docx', label: 'DOCX',        tag: '.docx', desc: 'Editable in Word, Pages' },
  { value: 'html', label: 'HTML',        tag: '.html', desc: 'Single-file, self-contained' },
  { value: 'md',   label: 'Markdown',    tag: '.md',   desc: 'GitHub-flavored' },
  { value: 'txt',  label: 'Plain text',  tag: '.txt',  desc: 'No formatting, UTF-8' },
];

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

function TBButton({ children, onClick, active, title }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
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
function BlockSelect({ value, onChange }) {
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

function Stat({ label, value }) {
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

function FormatterTool({ tool }) {
  const [text, setText] = useState(SAMPLE);
  const [theme, setTheme] = useState(THEMES[0]);
  const [format, setFormat] = useState(FORMATS[0]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [activeMarks, setActiveMarks] = useState({});
  const [pendingHtml, setPendingHtml] = useState(null);
  const taRef = useRef(null);
  const editorRef = useRef(null);

  const chars = text.length;
  const words = useMemo(() => text.trim() ? text.trim().split(/\s+/).length : 0, [text]);
  const lines = useMemo(() => text.split(/\n/).length, [text]);

  const [downloading, setDownloading] = useState(false);

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

      const response = await fetch('http://localhost:8000/api/format', {
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

    } catch (error) {
      alert("Error connecting to Python backend:\n" + error.message);
    } finally {
      setDownloading(false);
    }
  }

  // Apply generated HTML to the editor AFTER React has mounted it.
  // Quick helper to strip markdown into pure plain text
  function stripMarkdown(md) {
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
    function key(e) {
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

  function exec(cmd, value) {
    editorRef.current?.focus();
    try { document.execCommand(cmd, false, value); } catch (e) {}
    updateActiveMarks();
  }
  function setBlock(tag) { exec('formatBlock', '<' + tag + '>'); }
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
            <span style={{ color: tintFg(tool.hue) }}>{tool.categoryLabel}</span>
            <span>/</span>
            <span style={{ color: 'var(--fg-muted)' }}>universal-ai-formatter</span>
          </div>
          <h1 style={{
            margin: 0, fontSize: 36, fontWeight: 600,
            letterSpacing: '-0.025em', lineHeight: 1.08,
          }}>Universal AI-to-Doc Formatter</h1>
          <p style={{
            margin: '10px 0 0', fontSize: 15,
            color: 'var(--fg-muted)', maxWidth: 620, lineHeight: 1.5,
          }}>
            Paste raw output from ChatGPT, Claude, Gemini. Generate a themed document, then fine-tune it directly in the editor before exporting.
          </p>
        </div>

        <div style={{
          display: 'flex', gap: 6, alignItems: 'center',
          padding: '8px 12px',
          background: 'oklch(0.18 0.008 250 / 0.6)',
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
        background: 'oklch(0.175 0.008 250 / 0.7)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'visible',
        boxShadow: '0 1px 0 oklch(1 0 0 / 0.03) inset',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'oklch(0.19 0.008 250 / 0.6)',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11.5, fontWeight: 500, color: 'var(--fg-muted)',
            padding: '3px 9px',
            background: 'oklch(0.22 0.010 250)',
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
          background: 'oklch(0.16 0.006 250 / 0.5)',
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
          <div style={{ width: 180 }}><Select compact value={theme} options={THEMES} onChange={setTheme} /></div>
          <div style={{ width: 150 }}><Select compact value={format} options={FORMATS} onChange={setFormat} /></div>
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
                ? 'oklch(0.55 0.12 265)'
                : 'linear-gradient(180deg, oklch(0.72 0.18 265), oklch(0.62 0.20 265))',
              color: 'white',
              fontWeight: 500, fontSize: 13,
              borderRadius: 8,
              boxShadow: '0 1px 0 oklch(1 0 0 / 0.25) inset, 0 0 0 1px oklch(0.50 0.14 265 / 0.5), 0 4px 14px oklch(0.50 0.20 265 / 0.30)',
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
          background: 'oklch(0.175 0.008 250 / 0.6)',
          border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          {/* Status row */}
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
            background: 'oklch(0.19 0.008 250 / 0.5)',
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
                  background: 'oklch(0.22 0.010 250)',
                  border: '1px solid var(--border)',
                  borderRadius: 7,
                  fontSize: 12, fontWeight: 500,
                  color: 'var(--fg-muted)',
                }}
                title="Discard edits and re-render from source markdown">
                  <Icon.Loader size={11} strokeWidth={2}/> Re-render
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
              background: 'oklch(0.20 0.009 250 / 0.6)',
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
        background: 'radial-gradient(60% 50% at 50% 0%, oklch(0.55 0.18 265 / 0.05), transparent 70%), oklch(0.14 0.005 250)',
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
              background: 'oklch(0.16 0.006 250 / 0.5)',
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

function WelcomeStrip({ onOpenLauncher, onOpenPalette }) {
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
          <button onClick={onOpenLauncher} className="reset" style={quickBtn}>
            <Icon.Grid size={13} />
            <span>Browse all</span>
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

function FeaturedTool({ onPick }) {
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

function Shelf({ category, onPick }) {
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
        {category.tools.map(t => (
          <ToolCard key={t.id} tool={{ ...t, hue: category.hue }} onClick={() => onPick(t.id)} />
        ))}
      </div>
    </section>
  );
}

/* =========================================================================
   Dashboard composer
   ========================================================================= */

function Home({ onOpenTool, onOpenLauncher, onOpenPalette }) {
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

function LandingNav({ onLaunch, scrolled }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      height: 64,
      display: 'flex', alignItems: 'center',
      padding: '0 32px',
      gap: 18,
      background: scrolled ? 'oklch(0.135 0.005 250 / 0.78)' : 'transparent',
      borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
      backdropFilter: scrolled ? 'blur(20px) saturate(140%)' : 'none',
      transition: 'background 0.25s, border-color 0.25s, backdrop-filter 0.25s',
    }} className="landing-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 1px oklch(0.50 0.10 280 / 0.5), 0 4px 14px oklch(0.50 0.20 280 / 0.4)',
        }}>
          <Icon.Command size={16} strokeWidth={2.2} style={{ color: 'white' }} />
        </div>
        <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>mysaas</span>
      </div>

      <nav style={{ display: 'flex', gap: 2, marginLeft: 24 }} className="landing-nav-links">
        {['Tools', 'Pricing', 'Changelog', 'Docs'].map(l => (
          <a key={l} href={'#' + l.toLowerCase()} className="reset top-link" style={{
            fontSize: 13, color: 'var(--fg-muted)',
            padding: '7px 12px', borderRadius: 6,
            textDecoration: 'none', cursor: 'pointer',
          }}>{l}</a>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      <button className="reset top-link" style={{
        fontSize: 13, color: 'var(--fg-muted)',
        padding: '8px 12px', borderRadius: 7,
        cursor: 'pointer',
      }}>Sign in</button>

      <button onClick={onLaunch} className="reset" style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '8px 14px',
        background: 'linear-gradient(180deg, oklch(0.96 0.005 250), oklch(0.86 0.005 250))',
        color: 'oklch(0.16 0.008 250)',
        fontWeight: 500, fontSize: 13,
        borderRadius: 8,
        cursor: 'pointer',
        boxShadow: '0 1px 0 oklch(1 0 0 / 0.4) inset, 0 1px 3px oklch(0 0 0 / 0.5)',
        letterSpacing: '-0.005em',
      }}>
        Launch app <Icon.ArrowRight size={12} strokeWidth={2.2} />
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
  const t = themes.find(x => x.id === tab);

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

const dot = (color) => ({
  width: 11, height: 11, borderRadius: '50%',
  background: color, opacity: 0.6,
});

/* =========================================================================
   Editorial hero
   ========================================================================= */

function LandingHero({ onLaunch }) {
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
        <a href="#pricing" className="reset" style={{
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
        </a>
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

function SuitePreview({ onLaunch }) {
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
          <div key={cat.id} onClick={onLaunch} style={{
            padding: 22,
            background: cat.pro
              ? `linear-gradient(180deg, ${tint(cat.hue, 0.30, 0.08, 0.15)}, ${tint(cat.hue, 0.20, 0.04, 0.05)})`
              : 'oklch(0.175 0.008 250 / 0.6)',
            border: `1px solid ${cat.pro ? tintBorder(cat.hue) : 'var(--border)'}`,
            borderRadius: 14,
            cursor: 'pointer',
            transition: 'transform 0.2s, border-color 0.2s, background 0.2s',
            position: 'relative', overflow: 'hidden',
          }}
          className="suite-card"
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = tintBorder(cat.hue); }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; if (!cat.pro) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
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
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {cat.tools.slice(0, 4).map(t => {
                const Ico = Icon[t.icon];
                return (
                  <li key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 0',
                    fontSize: 12.5, color: 'var(--fg-muted)',
                  }}>
                    <Ico size={11} strokeWidth={1.8} style={{ color: 'var(--fg-subtle)', flexShrink: 0 }}/>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                  </li>
                );
              })}
              {cat.tools.length > 4 && (
                <li style={{
                  marginTop: 6, fontSize: 11, color: 'var(--fg-subtle)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span>and more</span>
                  <Icon.ArrowRight size={10} />
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

function Pricing({ onLaunch }) {
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
            ].map(([f, on]) => <Feature key={f} on={on}>{f}</Feature>)}
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
            ].map(([f, on, em]) => <Feature key={f} on={on} em={em}>{f}</Feature>)}
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
        Need SOC2, SSO, or on-prem? <a href="#" style={{ color: 'var(--fg-muted)', textDecoration: 'underline', textDecorationColor: 'var(--border-strong)' }}>Talk to us about Enterprise</a>.
      </p>
    </section>
  );
}

function Feature({ children, on, em }) {
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

function ClosingCTA({ onLaunch }) {
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
            <a href="#tools" className="reset" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '14px 18px',
              background: 'oklch(0.20 0.008 250 / 0.5)',
              border: '1px solid var(--border)',
              color: 'var(--fg)',
              fontWeight: 500, fontSize: 15,
              borderRadius: 11, cursor: 'pointer',
            }}>
              Browse every tool
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   Shared styles
   ========================================================================= */

const eyebrow = {
  display: 'inline-block',
  fontSize: 11, fontWeight: 600,
  color: 'oklch(0.78 0.12 265)',
  letterSpacing: '0.18em', textTransform: 'uppercase',
  marginBottom: 18,
};
const sectionTitle = {
  margin: 0,
  fontSize: 'clamp(34px, 5vw, 52px)',
  lineHeight: 1.05,
  letterSpacing: '-0.03em',
  fontWeight: 600,
  textWrap: 'balance',
};
const italicAccent = {
  fontFamily: '"Source Serif Pro", Georgia, serif',
  fontStyle: 'italic', fontWeight: 400,
  background: 'linear-gradient(110deg, oklch(0.92 0.04 265), oklch(0.78 0.16 285))',
  WebkitBackgroundClip: 'text', backgroundClip: 'text',
  color: 'transparent',
};
const sectionSubtitle = {
  margin: '20px auto 0', maxWidth: 560,
  fontSize: 16, color: 'var(--fg-muted)',
  lineHeight: 1.5, textWrap: 'pretty',
};
const listStyle = {
  margin: 0, padding: 0, listStyle: 'none',
  display: 'flex', flexDirection: 'column', gap: 4,
  flex: 1,
};

/* =========================================================================
   Composer
   ========================================================================= */

function Landing({ onLaunch }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fade-in">
      <LandingNav onLaunch={onLaunch} scrolled={scrolled} />
      <LandingHero onLaunch={onLaunch} />
      <SuitePreview onLaunch={onLaunch} />
      <Pricing onLaunch={onLaunch} />
      <ClosingCTA onLaunch={onLaunch} />
    </div>
  );
}

// ===========================================================================
// Placeholder tool, Footer, App router — from app-tool.jsx
// ===========================================================================

/* =========================================================================
   Generic placeholder tool view
   ========================================================================= */

function PlaceholderTool({ tool }) {
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

function Footer({ onBackToLanding }) {
  return (
    <footer style={{
      marginTop: 60,
      borderTop: '1px solid var(--border)',
      background: 'oklch(0.13 0.005 250 / 0.6)',
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

        <FooterCol title="Tools" links={['Text & AI', 'Developer & Code', 'Files & Data', 'Images & Media', 'Pro Vault']} />
        <FooterCol title="Product" links={['Pricing', 'Changelog', 'Roadmap', 'Status', 'Privacy']} />
        <FooterCol title="Company" links={['About', 'Blog', 'Careers', 'Contact', 'Press kit']} />
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

function FooterCol({ title, links }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 600,
        color: 'var(--fg)', marginBottom: 12,
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>{title}</div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {links.map(l => (
          <li key={l}><a href="#" className="footer-link" style={{
            fontSize: 12.5, color: 'var(--fg-muted)', textDecoration: 'none',
          }}>{l}</a></li>
        ))}
      </ul>
    </div>
  );
}

/* =========================================================================
   App root — orchestrates view + overlays
   ========================================================================= */

function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'home' | toolId
  const [palette, setPalette] = useState(false);
  const [launcher, setLauncher] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isLanding = view === 'landing';
  const isDashboard = view === 'home';

  const activeTool = useMemo(() => {
    if (isLanding || isDashboard) return null;
    return ALL_TOOLS.find(t => t.id === view);
  }, [view, isLanding, isDashboard]);

  /* keyboard shortcuts — only active inside the app */
  useKeydown(useCallback(e => {
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

  function launchApp() {
    setView('home');
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }
  function openTool(id) {
    setView(id);
    setPalette(false);
    setLauncher(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function goHome() {
    setView('home');
    setPalette(false);
    setLauncher(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function backToLanding() {
    setView('landing');
    setPalette(false);
    setLauncher(false);
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  /* Landing renders its own nav and footer */
  if (isLanding) {
    return (
      <div className="app-root">
        <Landing onLaunch={launchApp} />
        <Footer onBackToLanding={null} />
      </div>
    );
  }

  return (
    <div className="app-root">
      <TopBar
        onOpenPalette={() => setPalette(true)}
        onOpenLauncher={() => setLauncher(true)}
        onHome={goHome}
        activeTool={activeTool}
        scrolled={scrolled || !isDashboard}
      />

      <main>
        {isDashboard && (
          <Home
            onOpenTool={openTool}
            onOpenLauncher={() => setLauncher(true)}
            onOpenPalette={() => setPalette(true)}
          />
        )}
        {!isDashboard && activeTool && (
          activeTool.id === 'uaf'
            ? <FormatterTool tool={activeTool} />
            : <PlaceholderTool tool={activeTool} />
        )}
      </main>

      <Footer onBackToLanding={backToLanding} />

      <CommandPalette open={palette} onClose={() => setPalette(false)} onPick={openTool} />
      <Launcher open={launcher} onClose={() => setLauncher(false)} onPick={openTool} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default export — drop in app/page.tsx.
// ---------------------------------------------------------------------------
export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <App />
    </>
  );
}
