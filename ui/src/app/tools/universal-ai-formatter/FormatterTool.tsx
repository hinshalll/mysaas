"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import { createPortal } from 'react-dom';
import { AI_SOURCES, THEMES, FORMATS } from '../../config';
import { supabase } from '../../supabase';
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

const isLightMode = () => typeof document !== 'undefined' && document.documentElement.classList.contains('light');

const tintFg = (hue: number) => {
  return isLightMode() ? `oklch(0.50 0.18 ${hue})` : `oklch(0.82 0.13 ${hue})`;
};

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
        <button onClick={() => setOpen(o => !o)} className="" style={{
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
                <button key={opt.value} onClick={() => { onChange(opt); setOpen(false); }} className="" style={{
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
      className=""
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

interface FormatterToolProps {
  tool: any;
  initialSlug?: string;
  brandName: string;
  userPlan: string;
  sessionUser: any;
  onShowPaywall: () => void;
  supabase: any;
  checkAndLogUsage: (toolId: string, isTier2: boolean) => Promise<boolean>;
}

export default function FormatterTool({ tool, initialSlug, brandName, userPlan, sessionUser, onShowPaywall, supabase, checkAndLogUsage }: FormatterToolProps) {
  const isPremium = userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin';
  const isAnonUser = !sessionUser || !!sessionUser.is_anonymous || !sessionUser.email;
  // Pro Cockpit Features
  const [customHeader, setCustomHeader] = useState('');
  const [customFooter, setCustomFooter] = useState('');
  const [layoutMode, setLayoutMode] = useState<'standard' | 'compact' | 'zen'>('standard');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [truncationModal, setTruncationModal] = useState<{ open: boolean; limit: number; totalPages: number } | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  async function saveToCloudHistory(fileName: string) {
    if (!supabase || !sessionUser || sessionUser.is_anonymous) return;
    try {
      await supabase.from('saved_history').insert({
        user_id: sessionUser.id,
        tool_id: tool.id,
        file_name: fileName,
        content_preview: text.slice(0, 100),
      });
    } catch (e) {
      console.error("Failed to save history to cloud:", e);
    }
  }

  async function loadCloudHistory() {
    if (!supabase || !sessionUser || sessionUser.is_anonymous) return;
    try {
      const { data, error } = await supabase
        .from('saved_history')
        .select('*')
        .eq('user_id', sessionUser.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!error && data) {
        setHistoryLogs(data);
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  }

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

  const [text, setText] = useState("");
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
  const [pdfToast, setPdfToast] = useState<string | null>(null);
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

  async function handleGenerate() {
    if (!text.trim() || generating) return;

    const allowed = await checkAndLogUsage(tool.id, false);
    if (!allowed) return;

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

    const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    let printWin: any = null;

    try {
      const allowed = await checkAndLogUsage(tool.id, false);
      if (!allowed) {
        setDownloading(false);
        return;
      }

      // Detect if we are in text/code mode or WYSIWYG mode
      const isTextMode = format.value === 'md' || format.value === 'txt';
      
      // Grab the exact edited content straight from the active editor
      let finalContent = isTextMode ? editorRef.current?.value : editorRef.current?.innerHTML;
      if (!finalContent) finalContent = text; // fallback

      // Smart document size truncation logic: 5 pages for guests, 20 pages for signed-in free members
      let isTruncated = false;
      let estimatedTotalPages = 1;
      const limitPages = isAnonUser ? 5 : 20;

      if (isTextMode && !isPremium) {
        const maxCharBudget = limitPages * 2200;
        if (finalContent.length > maxCharBudget) {
          finalContent = finalContent.substring(0, maxCharBudget);
          isTruncated = true;
        }
        estimatedTotalPages = Math.ceil(text.length / 2200);
      }

      // Build a dynamic, brand-safe filename using websitename_first-2-3-words
      const cleanBrand = brandName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Extract the first 2-3 words of the text cleanly
      const cleanText = stripMarkdown(isTextMode ? finalContent : (editorRef.current?.innerText || text));
      const firstWords = cleanText
        .trim()
        .split(/\s+/)
        .slice(0, 3)
        .join('-')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '');
      
      const smartName = `${cleanBrand}_${firstWords || 'doc'}${format.tag}`;

      // Track this file download inside history table if they are logged in
      try {
        await saveToCloudHistory(smartName);
      } catch (err) {
        console.error("Failed to save to cloud history", err);
      }

      // running headers / footers logic
      let headerHtml = "";
      let footerHtml = "";
      
      // inject running header if provided
      if (customHeader) {
        headerHtml = `<div class="pdf-header">${customHeader}</div>`;
      }
      
      // inject watermark/footer (Mandatory on Free tier, automatically removed on Paid tier)
      let footerText = customFooter || "";
      if (!isPremium) {
        if (footerText) footerText += " | ";
        footerText += `Formatted using ${brandName}`;
      }
      
      if (footerText) {
        footerHtml = `<div class="pdf-footer">${footerText}</div>`;
      }

      // Generate the exact CSS styles based on the active theme
      let themeCss = "";
      if (theme.value === "academic") {
        themeCss = `
          body { 
            font-family: 'Source Serif Pro', 'Georgia', serif; 
            line-height: 1.7; 
            color: #27272a;
            color: oklch(0.20 0.005 250); 
            background-color: #fdfdfd;
            background-color: oklch(0.99 0.002 250);
            font-size: 11.5pt; 
            padding: 1.2in; 
          }
          h1 { font-size: 26pt; font-weight: 700; margin-bottom: 8px; color: #18181b; color: oklch(0.12 0.005 250); text-align: center; }
          h2 { font-size: 17pt; font-style: italic; font-weight: 600; border-bottom: 1px solid #e4e4e7; border-bottom-color: oklch(0.90 0.005 250); margin-top: 28px; padding-bottom: 4px; }
          h3 { font-size: 13pt; font-weight: 600; margin-top: 20px; }
          p { margin: 0 0 14px; text-align: justify; }
          blockquote { border-left: 3px solid #71717a; border-left-color: oklch(0.40 0.005 250); padding-left: 16px; font-style: italic; color: #52525b; color: oklch(0.35 0.005 250); margin: 18px 0; }
          table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 10pt; }
          th, td { border: 1px solid #a1a1aa; border-color: oklch(0.70 0.005 250); padding: 10px 14px; text-align: left; }
          th { background-color: #f4f4f5; background-color: oklch(0.96 0.005 250); font-weight: bold; color: #18181b; }
          tr:nth-child(even) { background-color: #fafafa; background-color: oklch(0.98 0.002 250); }
          pre { background-color: #f4f4f5; background-color: oklch(0.95 0.005 250); padding: 12px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; font-size: 10pt; }
          code { font-family: monospace; font-size: 0.9em; background-color: #f4f4f5; background-color: oklch(0.95 0.005 250); padding: 2px 4px; border-radius: 3px; }
        `;
      } else if (theme.value === "minimalist") {
        themeCss = `
          body { 
            font-family: 'JetBrains Mono', 'Courier New', monospace; 
            line-height: 1.5; 
            color: #000000; 
            background-color: #ffffff;
            font-size: 10.5pt; 
            padding: 1in; 
          }
          h1 { font-size: 20pt; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; }
          h2 { font-size: 15pt; font-weight: 600; margin-top: 24px; text-transform: uppercase; border-bottom: 1px dashed #000; padding-bottom: 4px; }
          h3 { font-size: 12pt; font-weight: 600; margin-top: 18px; }
          p { margin: 0 0 12px; }
          blockquote { border-left: 2px dashed #000; padding-left: 14px; margin: 16px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px dashed #000; padding: 8px 12px; text-align: left; }
          th { font-weight: bold; border-bottom: 2px solid #000; background-color: #f8f9fa; }
          tr:nth-child(even) { background-color: #fafafa; }
          pre { border: 1px dashed #000; padding: 12px; font-family: inherit; white-space: pre-wrap; font-size: 9.5pt; }
          code { background-color: #f0f0f0; padding: 1px 4px; }
        `;
      } else { // modern
        themeCss = `
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #1e293b;
            color: oklch(0.16 0.008 250); 
            background-color: #f8f9fa;
            background-color: oklch(0.97 0.005 250);
            font-size: 11pt; 
            padding: 1.2in; 
          }
          h1 { font-size: 28pt; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; color: oklch(0.12 0.015 250); margin-bottom: 12px; line-height: 1.15; }
          h2 { font-size: 18pt; font-weight: 700; letter-spacing: -0.015em; color: #1e293b; color: oklch(0.18 0.012 250); margin-top: 28px; }
          h3 { font-size: 14pt; font-weight: 600; color: #334155; margin-top: 20px; }
          p { margin: 0 0 12px; }
          blockquote { 
            border-left: 3px solid #6366f1; 
            border-left-color: oklch(0.62 0.18 265); 
            padding: 8px 16px; 
            font-style: italic; 
            background-color: #f1f5f9; 
            background-color: oklch(0.94 0.006 250); 
            color: #475569;
            color: oklch(0.35 0.010 250);
            border-radius: 0 6px 6px 0;
            margin: 16px 0;
          }
          code { 
            background-color: #e2e8f0; 
            background-color: oklch(0.92 0.005 250); 
            padding: 2px 5px; 
            border-radius: 4px; 
            font-family: 'JetBrains Mono', 'Courier New', monospace; 
            font-size: 0.9em;
            color: #0f172a;
          }
          pre { 
            background-color: #f1f5f9; 
            background-color: oklch(0.93 0.005 250); 
            color: #1e293b;
            color: oklch(0.16 0.008 250);
            padding: 14px 16px; 
            border-radius: 6px; 
            border: 1px solid #e2e8f0;
            border-color: oklch(0.90 0.005 250);
            overflow-x: auto; 
            font-family: 'JetBrains Mono', 'Courier New', monospace;
            font-size: 10pt;
            line-height: 1.5;
            white-space: pre-wrap;
            margin: 14px 0;
          }
          table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 10pt; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; border-color: oklch(0.90 0.005 250); }
          th, td { border: 1px solid #e2e8f0; border-color: oklch(0.90 0.005 250); padding: 12px 16px; text-align: left; }
          th { background-color: #f1f5f9; background-color: oklch(0.95 0.005 250); font-weight: 600; color: #0f172a; }
          tr:nth-child(even) { background-color: #f8fafc; background-color: oklch(0.98 0.002 250); }
        `;
      }

      // Add high-fidelity printing properties to ensure background colors, layout margins, and text print perfectly!
      themeCss += `
        .pdf-header, .pdf-footer {
          display: none;
        }
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          pre, blockquote {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          pre {
            background-color: #f1f5f9 !important;
            background-color: oklch(0.93 0.005 250) !important;
            color: #1e293b !important;
            border-color: oklch(0.90 0.005 250) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          code {
            background-color: #e2e8f0 !important;
            background-color: oklch(0.92 0.005 250) !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          blockquote {
            background-color: #f1f5f9 !important;
            background-color: oklch(0.94 0.006 250) !important;
            border-left-color: oklch(0.62 0.18 265) !important;
            color: #475569 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          th {
            background-color: #f1f5f9 !important;
            background-color: oklch(0.95 0.005 250) !important;
            color: #0f172a !important;
            border-color: oklch(0.90 0.005 250) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          td {
            border-color: oklch(0.90 0.005 250) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          tr:nth-child(even) {
            background-color: #f8fafc !important;
            background-color: oklch(0.98 0.002 250) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .pdf-header {
            display: block !important;
            position: fixed;
            top: -0.65in;
            left: 0;
            right: 0;
            font-size: 8pt;
            color: #888;
            text-align: center;
            border-bottom: 1px solid #eee;
            padding-bottom: 4px;
            font-family: 'Inter', -apple-system, sans-serif;
          }
          .pdf-footer {
            display: block !important;
            position: fixed;
            bottom: -0.65in;
            left: 0;
            right: 0;
            font-size: 8pt;
            color: #888;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 4px;
            font-family: 'Inter', -apple-system, sans-serif;
          }
        }
        @page {
          size: A4;
          margin-top: 1.0in;
          margin-bottom: 1.0in;
          margin-left: 1.2in;
          margin-right: 1.2in;
        }
      `;

      // Get the clean, unpolluted HTML content from the editor or parse raw text if in text/markdown mode
      let pristineHtmlBody = isTextMode 
        ? marked.parse(finalContent) 
        : (editorRef.current?.innerHTML || marked.parse(text));

      // High-precision A4 DOM Height Slicing: enforce 100% accurate guest (5 pages) vs free member (20 pages) budgets
      if (!isPremium) {
        if (typeof document !== 'undefined') {
          // Create an invisible, sandboxed A4 measuring container to get 100% computed height accuracy
          const measureContainer = document.createElement('div');
          measureContainer.style.position = 'absolute';
          measureContainer.style.visibility = 'hidden';
          measureContainer.style.width = '760px'; // Standard layout width matching editor exactly
          measureContainer.style.boxSizing = 'border-box';
          measureContainer.style.fontFamily = theme.value === 'minimalist' ? 'monospace' : theme.value === 'academic' ? 'serif' : 'sans-serif';
          measureContainer.style.fontSize = theme.value === 'minimalist' ? '13.5px' : '15px';
          measureContainer.style.lineHeight = theme.value === 'academic' ? '1.7' : '1.6';
          
          document.body.appendChild(measureContainer);

          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = pristineHtmlBody;

          let slicedHtml = '';
          // 1 standard A4 printable height budget at 96 DPI (content only, clearing 1.0in margins) is ~930px.
          // Total height budget for limitPages: limitPages * 930px
          const pageHeightBudget = limitPages * 930;

          // Estimate total untruncated pages in layout
          measureContainer.innerHTML = pristineHtmlBody;
          const untruncatedHeight = measureContainer.scrollHeight;
          estimatedTotalPages = Math.ceil(untruncatedHeight / 930) || 1;
          measureContainer.innerHTML = ''; // for slicing

          const children = Array.from(tempDiv.children);
          for (const child of children) {
            const clone = child.cloneNode(true) as HTMLElement;
            measureContainer.appendChild(clone);

            if (measureContainer.scrollHeight > pageHeightBudget) {
              isTruncated = true;
              break;
            }
            slicedHtml += child.outerHTML;
          }

          measureContainer.remove(); // Clean up from document body

          if (isTruncated) {
            pristineHtmlBody = slicedHtml;
            // PDF stays 100% clean and pristine! We do NOT append any watermark/upsell alerts inside the file.
            // Upsell alerts are rendered exclusively on the website screen upon successful compile!
          }
        }
      }

      const formattedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>${themeCss}</style>
        </head>
        <body>
          ${headerHtml}
          ${pristineHtmlBody}
          ${footerHtml}
        </body>
        </html>
      `;

      if (format.value === 'pdf') {
        const isPaid = userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin';

        const triggerLocalPrint = async () => {
          if (isMobile) {
            // --- MOBILE: CLEAN SELF-CLOSING NEW TAB PRINTING ---
            printWin = window.open('/print-preview', '_blank');
            if (printWin) {
              localStorage.setItem('print_html', formattedHtml);
            } else {
              // Fallback in case popup was blocked/closed
              alert("Unable to open print preview tab. Please ensure popups are allowed.");
            }
          } else {
            // --- DESKTOP: STEALTH IFRAME PRINT ---
            // Dynamically compute the OS-specific instruction copy to make it extremely clear for noobs & boomers
            let instructions = "In the print window, change the 'Destination' dropdown to 'Save as PDF', then click the Save button.";
            if (typeof navigator !== 'undefined') {
              const ua = navigator.userAgent;
              if (/Macintosh|MacIntel/i.test(ua)) {
                instructions = "Mac Tip: In the print window, set 'Destination' to 'Save as PDF' (in Safari, click the 'PDF' dropdown at the bottom-left and select 'Save as PDF').";
              }
            }

            // Show our beautiful boomer-friendly custom overlay hint immediately
            setPdfToast(instructions);

            // Wait 1.2 seconds so the user has a brief moment to see it, then launch the print dialouge instantly
            await new Promise((resolve) => setTimeout(resolve, 1200));

            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.style.zIndex = '-9999';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow?.document;
            if (!doc) throw new Error("Could not access document inside stealth iframe.");
            
            doc.open();
            doc.write(formattedHtml);
            doc.close();

            // Give it a tiny moment to parse/load stylesheets
            await new Promise((resolve) => setTimeout(resolve, 350));

            // Hide the toast just before the print window pops up
            setPdfToast(null);

            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();

            // Clean up the iframe after the print dialogue closes
            setTimeout(() => {
              iframe.remove();
            }, 1000);
          }
        };

        setPdfToast(isTruncated ? `Free Tier limit: compiling first ${limitPages} pages...` : "Generating premium one-click PDF download...");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout to allow first-boot Chromium launch and Vercel warmups

        try {
          // Get active session token if exists
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token || '';

          const response = await fetch('/api/v1/export-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              html: formattedHtml,
              filename: smartName,
              customHeader: customHeader,
              customFooter: customFooter,
              isPremium: isPremium
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Cloud compiler endpoint returned status ${response.status}`);
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = smartName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();

          setPdfToast(null);
          if (isTruncated) {
            setTruncationModal({ open: true, limit: limitPages, totalPages: estimatedTotalPages });
          }
        } catch (err: any) {
          clearTimeout(timeoutId);
          console.error("[PDF Failsafe Switch] Cloud compiler failed:", err);
          
          // Graceful fallback to client-side print (failsafe switch)
          setPdfToast("Connecting to backup generator...");
          await new Promise((resolve) => setTimeout(resolve, 800));
          setPdfToast(null);

          await triggerLocalPrint();
        }

      } else {
        // --- CLIENT-SIDE BLOB DOWNLOAD FOR OTHER FORMATS ---
        let blob: Blob;
        let ext = format.tag;

        if (format.value === 'html') {
          blob = new Blob([formattedHtml], { type: 'text/html;charset=utf-8' });
        } else if (format.value === 'docx') {
          // Word opens HTML formatted content as a document cleanly
          blob = new Blob([formattedHtml], { type: 'application/msword;charset=utf-8' });
          ext = '.doc';
        } else if (format.value === 'md') {
          let mdBody = finalContent;
          if (isTruncated) {
            mdBody += `\n\n--- [TRUNCATION NOTICE] This document has been truncated to 10 pages under the Free Plan. Upgrade to the Pro Plan or Developer Plan to export unlimited pages. ---`;
          }
          blob = new Blob([mdBody], { type: 'text/markdown;charset=utf-8' });
        } else { // txt
          let txtBody = finalContent;
          if (isTruncated) {
            txtBody += `\n\n--- [TRUNCATION NOTICE] This document has been truncated to 10 pages under the Free Plan. Upgrade to the Pro Plan or Developer Plan to export unlimited pages. ---`;
          }
          blob = new Blob([txtBody], { type: 'text/plain;charset=utf-8' });
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `formatted-doc-${Date.now().toString().slice(-4)}${ext}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }

    } catch (error: any) {
      if (printWin) {
        try { printWin.close(); } catch (_) {}
      }
      alert("Error generating document locally:\n" + error.message);
    } finally {
      setDownloading(false);
      setPdfToast(null);
    }
  }

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
    <div className="w-full max-w-[1280px] mx-auto px-8 pt-8 pb-20 box-border fade-in">

      {/* Header */}
      <div className="flex items-end gap-5 mb-7 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <div className="inline-flex items-center gap-2 text-[11.5px] text-fg-dim mb-3 mono">
            <span style={{ color: tintFg(activeHue) }}>{tool.categoryLabel}</span>
            <span>/</span>
            <span className="text-fg-muted">{aiSource.value === 'universal' ? 'universal-ai-formatter' : `${aiSource.value}-to-${format.value}`}</span>
          </div>
          <h1 className="m-0 text-4xl font-semibold tracking-tight leading-tight">
            {aiSource.value !== 'universal' 
              ? `${aiSource.label.replace(' Style', '')} to ${format.label} Formatter` 
              : 'Universal AI-to-Doc Formatter'}
          </h1>
          <p className="mt-2.5 mb-0 text-[15px] text-fg-muted max-w-[620px] leading-relaxed">
            {aiSource.value !== 'universal'
              ? `Paste raw output from ${aiSource.label.replace(' Style', '')}. Generate a themed document, then fine-tune it directly in the editor before exporting as a premium ${format.label}.`
              : 'Paste raw output from ChatGPT, Claude, Gemini, DeepSeek, Grok, or Perplexity. Generate a themed document, then fine-tune it directly in the editor before exporting.'}
          </p>
        </div>

        <div className="flex gap-1.5 items-center px-3 py-2 bg-[var(--bg-elev-2)] border border-[var(--border)] rounded-lg text-[11.5px] text-fg-muted">
          <kbd className="kbd">⌘</kbd><kbd className="kbd">↵</kbd>
          <span className="ml-1">to generate</span>
        </div>
      </div>

      {/* Input card */}
      <div className="bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-xl overflow-visible shadow-[0_1px_0_oklch(1_0_0/0.03)_inset]">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)] bg-[var(--bg-elev-2)]">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-fg-muted px-2 py-1 bg-[var(--bg-hover)] rounded-md">
            <span 
              className="w-1.5 h-1.5 rounded-full shrink-0" 
              style={{
                background: text ? 'oklch(0.78 0.16 145)' : 'var(--fg-dim)',
                boxShadow: text ? '0 0 8px oklch(0.78 0.16 145 / 0.7)' : 'none',
              }} 
            />
            Source · markdown
          </span>
          <div className="flex-1" />
          <button onClick={() => { setText(SAMPLE); taRef.current?.focus(); }} style={miniBtn}>Sample</button>
          <button onClick={() => {
            navigator.clipboard?.readText?.().then(t => setText(t || text)).catch(() => {});
          }} style={miniBtn}>Paste</button>
          <button onClick={() => { setText(''); taRef.current?.focus(); }} style={{ ...miniBtn, color: text ? 'var(--fg-muted)' : 'var(--fg-dim)' }}>Clear</button>
        </div>

        {/* AI Source Auto-detection Recommendation Banner */}
        {detectedAi && (
          <div className="border-b border-[var(--border)] px-4 py-2.5 text-[12.5px] flex items-center gap-2.5 text-fg-muted fade-in" style={{
            background: `oklch(0.20 0.010 ${hueOverrides[detectedAi] ?? 265} / 0.75)`,
          }}>
            <span className="inline-flex items-center" style={{ color: `oklch(0.78 0.16 ${hueOverrides[detectedAi] ?? 265})` }}>
              <Icon.Sparkles size={13} strokeWidth={2.2} />
            </span>
            <span>
              Detected **{AI_SOURCES.find(a => a.value === detectedAi)?.label.replace(' Style', '')}** formatting. Optimize layout styling?
            </span>
            <div className="flex-1" />
            <button
              onClick={() => {
                const matched = AI_SOURCES.find(a => a.value === detectedAi);
                if (matched) setAiSource(matched);
                setDetectedAi(null);
              }}
              className="px-2.5 py-1 text-white text-[11.5px] font-semibold rounded-md shadow-[0_1px_3px_oklch(0_0_0/0.15)] cursor-pointer"
              style={{
                background: `oklch(0.72 0.18 ${hueOverrides[detectedAi] ?? 265})`,
              }}
            >
              Apply Style
            </button>
            <button
              onClick={() => setDetectedAi(null)}
              className="text-[11.5px] text-fg-dim px-1.5 py-1 cursor-pointer"
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
          className="block w-full box-border min-h-[180px] px-[18px] py-[14px] bg-transparent border-none outline-none text-fg font-mono text-[13px] leading-[1.6] resize-y"
        />

        <div className="flex items-center gap-3 px-3 py-2.5 border-t border-[var(--border)] bg-[var(--bg-elev-2)] flex-wrap tool-controls-row">
          <div className="flex items-center gap-3.5 text-[11px] text-fg-dim font-mono flex-1 min-w-[180px]">
            <Stat label="chars" value={chars.toLocaleString()} />
            <Stat label="words" value={words.toLocaleString()} />
            <Stat label="lines" value={lines.toLocaleString()} />
          </div>
          <div className="w-[140px]"><Select compact value={theme} options={THEMES} onChange={setTheme} /></div>
          <div className="w-[120px]"><Select compact value={format} options={FORMATS} onChange={setFormat} /></div>
          <button
            onClick={handleGenerate}
            disabled={!text.trim() || generating}
            className="inline-flex items-center gap-2 px-3.5 py-[9px] text-white font-medium text-[13px] rounded-lg whitespace-nowrap"
            style={{
              cursor: !text.trim() || generating ? 'not-allowed' : 'pointer',
              opacity: !text.trim() ? 0.5 : 1,
              background: generating
                ? `oklch(0.55 0.12 ${activeHue})`
                : `linear-gradient(180deg, oklch(0.72 0.18 ${activeHue}), oklch(0.62 0.20 ${activeHue}))`,
              boxShadow: `0 1px 0 oklch(1 0 0 / 0.25) inset, 0 0 0 1px oklch(0.50 0.14 ${activeHue} / 0.5), 0 4px 14px oklch(0.50 0.20 ${activeHue} / 0.30)`,
            }}
          >
            {generating ? (
              <>
                <span className="inline-flex animate-spin">
                  <Icon.Loader size={14} strokeWidth={2.2}/>
                </span>
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
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{
              background: generating ? 'oklch(0.78 0.16 75)' : 'oklch(0.78 0.16 145)',
              boxShadow: '0 0 8px currentColor',
              color: generating ? 'oklch(0.78 0.16 75)' : 'oklch(0.78 0.16 145)',
            }} />
            <span className="text-[13px] font-medium">
              {generating ? 'Rendering…' : 'Editable preview · edit anything, your changes export'}
            </span>
            <span className="mono text-[11px] text-fg-dim">
              · formatted-doc-{Date.now().toString().slice(-4)}{format.tag}
            </span>
            <div className="flex-1" />
            {generated && (
              <>
                <button onClick={rerender} className="inline-flex items-center gap-1.5 px-2.5 py-[7px] bg-[var(--bg-hover)] border border-[var(--border)] rounded-md text-[12px] font-medium text-fg-muted cursor-pointer" title="Discard edits and re-render from source markdown">
                  <Icon.Loader size={11} strokeWidth={2}/> Re-render
                </button>

                <button onClick={handleCopy} disabled={copying} className="inline-flex items-center gap-1.5 px-3 py-[7px] bg-[var(--bg-hover)] border border-[var(--border)] rounded-md text-[12px] font-medium text-fg-muted" style={{ cursor: copying ? 'wait' : 'pointer' }} title="Copy formatted output to your clipboard">
                  {copying ? (
                    <><Icon.Loader size={11} strokeWidth={2} /> Copying...</>
                  ) : (
                    <>
                      <Icon.Copy size={11} strokeWidth={2} />
                      {format.value === 'md' ? 'Copy Markdown' : format.value === 'txt' ? 'Copy Plain Text' : 'Copy Rich Text'}
                    </>
                  )}
                </button>
                
                <button onClick={handleDownload} disabled={downloading} className="inline-flex items-center gap-2 px-3.5 py-[7px] bg-gradient-to-b from-[oklch(0.97_0.005_250)] to-[oklch(0.86_0.005_250)] text-[oklch(0.14_0.008_250)] font-medium text-[13px] rounded-md shadow-[0_1px_0_oklch(1_0_0/0.5)_inset,0_1px_3px_oklch(0_0_0/0.5)]" style={{ cursor: downloading ? 'wait' : 'pointer', opacity: downloading ? 0.7 : 1 }}>
                  {downloading ? (
                    <><Icon.Loader size={12} strokeWidth={2.2} /> Generating...</>
                  ) : (
                    <><Icon.Download size={12} strokeWidth={2.2}/> Download {format.label}</>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Pro Workspace Cockpit Settings */}
          {generated && (
            <div className="px-5 py-3.5 bg-[oklch(0.18_0.010_265/0.15)] border-b border-[var(--border)] flex flex-col gap-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2.5">
                <div className="flex items-center gap-2">
                  <Icon.Wand size={14} className="text-[var(--pro)]" />
                  <span className="text-[13px] font-semibold text-white">Workspace & Branding Cockpit</span>
                  {!isPremium && (
                    <span className="mono text-[9px] bg-[var(--pro)] text-black px-1.5 py-[1px] rounded font-bold">PRO UPGRADE GATED</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Layout selector */}
                  <label className="mono text-[11px] text-[var(--fg-subtle)]">Layout:</label>
                  <select value={layoutMode} onChange={e => setLayoutMode(e.target.value as any)} className="bg-[var(--bg-elev-2)] border border-[var(--border)] text-white text-[12px] px-2 py-1 rounded-md outline-none">
                    <option value="standard">Standard</option>
                    <option value="compact">Compact</option>
                    <option value="zen">Zen Focus</option>
                  </select>

                  {/* History drawer toggle */}
                  <button onClick={() => { setHistoryOpen(!historyOpen); loadCloudHistory(); }} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-elev-2)] border border-[var(--border)] rounded-md text-[12px] text-white cursor-pointer">
                    <Icon.BookMarked size={12} />
                    History
                  </button>
                </div>
              </div>

              {/* Collapsible settings block */}
              {format.value === 'pdf' && (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5 mt-1">
                  {/* 1. Custom header text input */}
                  <div 
                    onClick={() => !isPremium && onShowPaywall()}
                    className={!isPremium ? 'cursor-pointer' : 'cursor-default'}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <label className="mono text-[10px] text-fg-dim m-0">PDF Running Header</label>
                      {!isPremium && (
                        <span className="mono text-[8.5px] bg-gradient-to-r from-[oklch(0.70_0.20_30)] to-[oklch(0.85_0.15_80)] text-black px-1.5 py-[1px] rounded font-extrabold tracking-[0.05em]">PRO</span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder={isPremium ? "Header Text..." : "e.g., Company Confidential"}
                      readOnly={!isPremium}
                      value={customHeader}
                      onChange={e => setCustomHeader(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[var(--bg-elev-2)] border border-[var(--border)] rounded-md text-white text-[12px] outline-none"
                      style={{ cursor: !isPremium ? 'pointer' : 'text' }}
                    />
                  </div>

                  {/* 2. Custom footer text input */}
                  <div 
                    onClick={() => !isPremium && onShowPaywall()}
                    className={!isPremium ? 'cursor-pointer' : 'cursor-default'}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <label className="mono text-[10px] text-fg-dim m-0">PDF Running Footer</label>
                      {!isPremium && (
                        <span className="mono text-[8.5px] bg-gradient-to-r from-[oklch(0.70_0.20_30)] to-[oklch(0.85_0.15_80)] text-black px-1.5 py-[1px] rounded font-extrabold tracking-[0.05em]">PRO</span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder={isPremium ? "Footer Text..." : "e.g., Copyright © 2026"}
                      readOnly={!isPremium}
                      value={customFooter}
                      onChange={e => setCustomFooter(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[var(--bg-elev-2)] border border-[var(--border)] rounded-md text-white text-[12px] outline-none"
                      style={{ cursor: !isPremium ? 'pointer' : 'text' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
              <TBButton title="Remove formatting" onClick={() => exec('removeFormat')}><Icon.Eraser2 size={13} strokeWidth={2}/></TBButton>
              <TBDivider />
              <TBButton title="Bulleted list" active={activeMarks.ul} onClick={() => exec('insertUnorderedList')}><Icon.List size={14} strokeWidth={2}/></TBButton>
              <TBButton title="Numbered list" active={activeMarks.ol} onClick={() => exec('insertOrderedList')}><Icon.ListOrdered size={14} strokeWidth={2}/></TBButton>
              <TBButton title="Quote" active={activeMarks.block === 'blockquote'} onClick={() => setBlock('blockquote')}><Icon.Quote size={13} strokeWidth={2}/></TBButton>
              <TBButton title="Code block" onClick={() => exec('formatBlock', '<pre>')}><Icon.Code size={13} strokeWidth={2}/></TBButton>
              <TBDivider />
              <TBButton title="Link" onClick={setLink}><Icon.LinkIcon size={13} strokeWidth={2}/></TBButton>
              <TBButton title="Strikethrough" active={activeMarks.strike} onClick={() => exec('strikeThrough')}><span style={{ fontSize: 13, textDecoration: 'line-through' }}>S</span></TBButton>
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
          {/* Paper area */}
          <div className="p-[clamp(20px,4vw,48px)] bg-[var(--bg-paper-container)] min-h-[480px] flex justify-center">
            {generating ? (
              <div className="w-full max-w-[760px] bg-[oklch(0.97_0.005_250)] rounded-md px-[56px] py-[60px] flex flex-col gap-3">
                <div className="shimmer h-8 w-[60%] rounded" />
                <div className="shimmer h-3.5 w-[40%]" />
                <div className="h-4" />
                <div className="shimmer h-3.5 w-[95%]" />
                <div className="shimmer h-3.5 w-[92%]" />
              </div>
            ) : format.value === 'md' || format.value === 'txt' ? (
              <textarea
                ref={editorRef as any}
                defaultValue={text}
                spellCheck={false}
                className="w-full max-w-[760px] bg-[oklch(0.97_0.005_250)] text-[oklch(0.16_0.008_250)] rounded-md px-[clamp(36px,6vw,72px)] py-[60px] shadow-[0_2px_4px_oklch(0_0_0/0.4),0_24px_80px_oklch(0_0_0/0.5)] outline-none border-none resize-y min-h-[480px] font-mono text-[14px] leading-[1.6]"
              />
            ) : (
              <div
                ref={editorRef}
                contentEditable={generated}
                suppressContentEditableWarning spellCheck
                onKeyUp={updateActiveMarks} onMouseUp={updateActiveMarks} onFocus={updateActiveMarks}
                className={'paper paper-' + theme.value}
                style={{
                  width: '100%', maxWidth: layoutMode === 'zen' ? '100%' : '760px',
                  background: 'oklch(0.97 0.005 250)', color: 'oklch(0.16 0.008 250)',
                  borderRadius: layoutMode === 'zen' ? 0 : 6,
                  padding: layoutMode === 'compact' ? '24px' : layoutMode === 'zen' ? '32px clamp(24px, 5vw, 48px)' : '60px clamp(36px, 6vw, 72px)',
                  boxShadow: layoutMode === 'zen' ? 'none' : '0 2px 4px oklch(0 0 0 / 0.4), 0 24px 80px oklch(0 0 0 / 0.5)',
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
            <div className="px-3.5 py-2 border-t border-[var(--border)] bg-[var(--bg-elev-2)] flex items-center gap-4 text-[11px] text-[var(--fg-dim)] font-mono flex-wrap">
              <span>Auto-saved · just now</span>
              <span>·</span>
              <span>{theme.value === 'academic' ? 'Source Serif, Inter' : theme.value === 'minimalist' ? 'JetBrains Mono' : 'Inter, Source Serif'}</span>
              <span>·</span>
              <span>2 pages · 184 KB</span>
              <span className="flex-1" />
              <span>theme={theme.value} · format={format.value}</span>
            </div>
          )}
          {pdfToast && typeof window !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[999999] bg-[oklch(0.12_0.015_250/0.7)] backdrop-blur-md flex flex-col items-center justify-center gap-4 text-white animate-[fadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              `}</style>
              
              <div className="w-12 h-12 rounded-full border-[3px] border-[oklch(0.7_0.15_140/0.2)] border-t-[oklch(0.7_0.15_140)] animate-[spin_1s_linear_infinite] shadow-[0_0_16px_oklch(0.7_0.15_140/0.3)]" />
              
              <div className="max-w-[460px] text-center px-6">
                <h3 className="text-[19px] font-semibold mb-2 text-white tracking-[-0.01em] font-sans">
                  Preparing Your PDF...
                </h3>
                <p className="text-[14.5px] leading-[1.6] text-[oklch(0.9_0.01_250/0.95)] font-normal m-0 font-sans">
                  {pdfToast}
                </p>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {/* Smart Truncation Paywall Modal (100% Client-Side Screen only - clean PDF) */}
      {truncationModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[999999] animate-[fadeIn_0.25s_ease]">
          <div className="bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-2xl p-8 max-w-[460px] w-[90%] shadow-[0_24px_60px_oklch(0_0_0/0.5)] flex flex-col gap-5 relative fade-in-up">
            <button 
              onClick={() => setTruncationModal(null)} 
              className="absolute top-5 right-5 cursor-pointer text-[var(--fg-dim)] hover:text-white transition-colors border-none bg-transparent"
            >
              <Icon.X size={18} />
            </button>

            <div className="flex flex-col gap-2 text-center mt-2.5">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{
                  background: isAnonUser ? 'oklch(0.20 0.010 195 / 0.8)' : 'oklch(0.20 0.010 265 / 0.8)',
                  color: isAnonUser ? 'oklch(0.72 0.18 195)' : 'oklch(0.70 0.18 265)',
                  boxShadow: isAnonUser ? '0 0 20px oklch(0.72 0.18 195 / 0.15)' : '0 0 20px oklch(0.70 0.18 265 / 0.15)'
                }}
              >
                <Icon.Layers3 size={24} />
              </div>
              <h3 className="text-[20px] font-semibold text-white m-0 font-sans">
                {isAnonUser ? 'Guest Page Limit Reached' : 'Free Page Limit Reached'}
              </h3>
              <p className="text-[13.5px] text-[var(--fg-muted)] m-0 leading-[1.5] font-sans">
                {isAnonUser 
                  ? `You successfully compiled your first ${truncationModal.limit} pages! Guest exports are capped at 5 pages. Create a free account to instantly unlock 20 pages.`
                  : `You successfully compiled your first ${truncationModal.limit} pages! Your full document is approximately ${truncationModal.totalPages} pages. Upgrade to a premium plan to export all pages instantly.`
                }
              </p>
            </div>

            <div className="flex flex-col gap-2.5 mt-2.5">
              {isAnonUser ? (
                <>
                  <button 
                    onClick={() => {
                      setTruncationModal(null);
                      // Trigger auth modal via parent window postMessage
                      window.parent?.postMessage?.('open-auth-modal', '*');
                    }}
                    className="w-full p-3 rounded-lg bg-gradient-to-b from-[oklch(0.72_0.18_195)] to-[oklch(0.62_0.20_195)] text-white font-semibold text-[13.5px] cursor-pointer text-center border-none shadow-[0_4px_12px_oklch(0.72_0.18_195/0.2)]"
                  >
                    Create Free Account
                  </button>
                  <button 
                    onClick={() => {
                      setTruncationModal(null);
                      window.parent?.postMessage?.('show-paywall-modal', '*');
                    }}
                    className="w-full py-[11px] px-3 rounded-lg bg-transparent hover:bg-[var(--bg-hover)] border border-[var(--border)] text-white font-medium text-[13px] cursor-pointer text-center transition-colors"
                  >
                    Upgrade to Premium
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    setTruncationModal(null);
                    window.parent?.postMessage?.('show-paywall-modal', '*');
                  }}
                  className="w-full p-3 rounded-lg bg-gradient-to-b from-[oklch(0.72_0.18_265)] to-[oklch(0.62_0.20_265)] text-white font-semibold text-[13.5px] cursor-pointer text-center border-none shadow-[0_4px_12px_oklch(0.70_0.18_265/0.2)]"
                >
                  Upgrade to Export All {truncationModal.totalPages} Pages
                </button>
              )}
              
              <button 
                onClick={() => setTruncationModal(null)} 
                className="w-full p-2.5 text-[var(--fg-dim)] font-medium text-[12.5px] cursor-pointer text-center border-none bg-transparent"
              >
                Keep Truncated PDF
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Cloud History Drawer Component */}
      {historyOpen && (
        <div className="fixed top-0 right-0 bottom-0 w-[320px] z-[99999] bg-[var(--bg-elev-1)] border-l border-[var(--border)] shadow-[-10px_0_30px_oklch(0_0_0/0.4)] pt-20 px-6 pb-6 flex flex-col fade-in">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-[16px] font-semibold text-white m-0">Cloud History (30 Days)</h4>
            <button onClick={() => setHistoryOpen(false)} className="cursor-pointer text-[var(--fg-subtle)] bg-transparent border-none p-0"><Icon.X size={16} /></button>
          </div>

          {!sessionUser || sessionUser.is_anonymous ? (
            <div className="flex flex-col gap-3.5 my-auto text-center px-2.5">
              <Icon.BookMarked size={32} className="text-[var(--fg-dim)] mx-auto" />
              <div className="text-[13.5px] text-[var(--fg-muted)]">Sign up to synchronize your history securely in the cloud.</div>
            </div>
          ) : historyLogs.length === 0 ? (
            <div className="flex flex-col gap-3.5 my-auto text-center">
              <Icon.BookMarked size={32} className="text-[var(--fg-dim)] mx-auto" />
              <div className="text-[13.5px] text-[var(--fg-muted)]">No saved document history yet.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto flex-1">
              {historyLogs.map((log: any) => (
                <div 
                  key={log.id} 
                  onClick={() => {
                    if (log.content_preview) {
                      setText(log.content_preview);
                      setHistoryOpen(false);
                    }
                  }}
                  className="p-3 rounded-lg bg-[var(--bg-elev-2)] border border-[var(--border)] flex flex-col gap-1 cursor-pointer transition-colors hover:bg-[var(--bg-hover)] hover:border-[var(--accent)]"
                  title="Click to restore this document snippet into the editor"
                >
                  <div className="text-[13px] font-semibold text-white overflow-hidden text-ellipsis whitespace-nowrap">{log.file_name}</div>
                  <div className="text-[11px] text-[var(--fg-dim)]">{new Date(log.created_at).toLocaleDateString()} · {log.tool_id.toUpperCase()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
