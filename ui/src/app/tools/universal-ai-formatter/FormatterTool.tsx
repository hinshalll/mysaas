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
  // Pro Cockpit Features
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [customHeader, setCustomHeader] = useState('');
  const [customFooter, setCustomFooter] = useState('');
  const [layoutMode, setLayoutMode] = useState<'standard' | 'compact' | 'zen'>('standard');
  const [historyOpen, setHistoryOpen] = useState(false);
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

    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isPdf = format.value === 'pdf';
    let printWindow: Window | null = null;
    
    if (isPdf && isMobile) {
      printWindow = window.open('/print-preview', '_blank');
    }

    try {
      const allowed = await checkAndLogUsage(tool.id, false);
      if (!allowed) {
        if (printWindow) printWindow.close();
        setDownloading(false);
        return;
      }

      // Detect if we are in text/code mode or WYSIWYG mode
      const isTextMode = format.value === 'md' || format.value === 'txt';
      
      // Grab the exact edited content straight from the active editor
      let finalContent = isTextMode ? editorRef.current?.value : editorRef.current?.innerHTML;
      if (!finalContent) finalContent = text; // fallback

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
      
      // inject watermark/footer
      let footerText = customFooter || "";
      if (!removeWatermark) {
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
          body { font-family: 'Georgia', serif; line-height: 1.7; color: #333; font-size: 11pt; padding: 1in; }
          h1 { font-size: 24pt; font-weight: bold; margin-bottom: 6px; }
          h2 { font-size: 16pt; font-style: italic; border-bottom: 1px solid #ccc; margin-top: 24px; }
          blockquote { border-left: 3px solid #666; padding-left: 12px; font-style: italic; color: #555; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10pt; }
          th, td { border: 1px solid #444; padding: 10px; text-align: left; }
          th { background-color: #f4f4f4; font-weight: bold; }
        `;
      } else if (theme.value === "minimalist") {
        themeCss = `
          body { font-family: 'Courier New', monospace; line-height: 1.5; color: #000; font-size: 10pt; padding: 1in; }
          h1 { font-size: 18pt; text-transform: uppercase; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          h2 { font-size: 14pt; margin-top: 20px; }
          blockquote { border-left: 1px dashed #000; padding-left: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px dashed #000; padding: 8px; text-align: left; }
          th { font-weight: bold; border-bottom: 2px solid #000; }
        `;
      } else { // modern
        themeCss = `
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #222; font-size: 11pt; padding: 1in; }
          h1 { font-size: 28pt; font-weight: 700; letter-spacing: -0.02em; color: #111; margin-bottom: 10px; }
          h2 { font-size: 18pt; font-weight: 600; color: #333; margin-top: 24px; }
          blockquote { border-left: 4px solid #6366f1; padding-left: 16px; font-style: italic; background: #f8fafc; padding: 10px 16px; }
          code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
          pre { background: #1e293b; color: #fff; padding: 16px; border-radius: 8px; overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 10.5pt; border-radius: 8px; overflow: hidden; }
          th, td { border: 1px solid #e2e8f0; padding: 12px 16px; text-align: left; }
          th { background-color: #f8fafc; font-weight: 600; color: #0f172a; }
          tr:nth-child(even) { background-color: #fbfcfd; }
        `;
      }

      // Add high-fidelity printing properties to ensure background colors, layout margins, and text print perfectly!
      themeCss += `
        .pdf-header, .pdf-footer {
          display: none;
        }
        @media print {
          body {
            margin: 0;
            padding: 1.2in;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          pre {
            background: #1e293b !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          code {
            background: #f1f5f9 !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .pdf-header {
            display: block !important;
            position: fixed;
            top: 0.4in;
            left: 1.2in;
            right: 1.2in;
            font-size: 8pt;
            color: #888;
            text-align: right;
            border-bottom: 1px solid #eee;
            padding-bottom: 4px;
            font-family: sans-serif;
          }
          .pdf-footer {
            display: block !important;
            position: fixed;
            bottom: 0.4in;
            left: 1.2in;
            right: 1.2in;
            font-size: 8pt;
            color: #888;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 4px;
            font-family: sans-serif;
          }
        }
        @page {
          size: A4;
          margin: 0;
        }
      `;

      // Get the clean, unpolluted HTML content from the editor or parse raw text if in text/markdown mode
      const pristineHtmlBody = isTextMode 
        ? marked.parse(finalContent) 
        : (editorRef.current?.innerHTML || marked.parse(text));

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
            if (printWindow) {
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

        // Try direct premium 1-click cloud generation for both free and paid users
        if (printWindow && isPaid) {
          // If they are a paid user, close the mobile popup immediately since they don't need print dialogues
          try { printWindow.close(); } catch (_) {}
        }

        setPdfToast("Generating premium one-click PDF download...");

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
              filename: smartName
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
        } catch (err: any) {
          clearTimeout(timeoutId);
          console.error("[PDF Failsafe Switch] Cloud compiler failed:", err);
          
          // Graceful fallback to client-side print (failsafe switch)
          setPdfToast("Connecting to backup generator...");
          await new Promise((resolve) => setTimeout(resolve, 800));
          setPdfToast(null);

          // Re-open mobile preview window if it was closed
          if (isMobile && isPaid && !printWindow) {
            try {
              printWindow = window.open('/print-preview', '_blank');
            } catch (_) {}
          }

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
          blob = new Blob([finalContent], { type: 'text/markdown;charset=utf-8' });
        } else { // txt
          blob = new Blob([finalContent], { type: 'text/plain;charset=utf-8' });
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
      if (printWindow) {
        try { printWindow.close(); } catch (_) {}
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

          {/* Pro Workspace Cockpit Settings */}
          {generated && (
            <div style={{
              padding: '14px 20px',
              background: 'oklch(0.18 0.010 265 / 0.15)',
              borderBottom: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon.Wand size={14} style={{ color: 'var(--pro)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Workspace & Branding Cockpit</span>
                  {!isPremium && (
                    <span className="mono" style={{ fontSize: 9, background: 'var(--pro)', color: 'black', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>PRO UPGRADE GATED</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Layout selector */}
                  <label className="mono" style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>Layout:</label>
                  <select value={layoutMode} onChange={e => setLayoutMode(e.target.value as any)} style={{
                    background: 'var(--bg-elev-2)', border: '1px solid var(--border)', color: 'white',
                    fontSize: 12, padding: '4px 8px', borderRadius: 6, outline: 'none'
                  }}>
                    <option value="standard">Standard</option>
                    <option value="compact">Compact</option>
                    <option value="zen">Zen Focus</option>
                  </select>

                  {/* History drawer toggle */}
                  <button onClick={() => { setHistoryOpen(!historyOpen); loadCloudHistory(); }} className="reset" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                    background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 6,
                    fontSize: 12, color: 'white', cursor: 'pointer'
                  }}>
                    <Icon.BookMarked size={12} />
                    History
                  </button>
                </div>
              </div>

              {/* Collapsible settings block */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginTop: 4 }}>
                {/* 1. White-label check */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5, color: 'var(--fg-muted)' }}>
                  <input
                    type="checkbox"
                    checked={removeWatermark}
                    onChange={e => {
                      if (!isPremium) {
                        onShowPaywall();
                      } else {
                        setRemoveWatermark(e.target.checked);
                      }
                    }}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>White-label (Remove watermark)</span>
                </label>

                {/* 2. Custom header text input */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', marginBottom: 4 }} className="mono">PDF Running Header</label>
                  <input
                    type="text"
                    placeholder={isPremium ? "Header Text..." : "Locked for Pro"}
                    disabled={!isPremium}
                    value={customHeader}
                    onChange={e => setCustomHeader(e.target.value)}
                    style={{
                      width: '100%', padding: '6px 10px', background: 'var(--bg-elev-2)',
                      border: '1px solid var(--border)', borderRadius: 6, color: 'white', fontSize: 12, outline: 'none'
                    }}
                  />
                </div>

                {/* 3. Custom footer text input */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', marginBottom: 4 }} className="mono">PDF Running Footer</label>
                  <input
                    type="text"
                    placeholder={isPremium ? "Footer Text..." : "Locked for Pro"}
                    disabled={!isPremium}
                    value={customFooter}
                    onChange={e => setCustomFooter(e.target.value)}
                    style={{
                      width: '100%', padding: '6px 10px', background: 'var(--bg-elev-2)',
                      border: '1px solid var(--border)', borderRadius: 6, color: 'white', fontSize: 12, outline: 'none'
                    }}
                  />
                </div>
              </div>
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
          {pdfToast && typeof window !== 'undefined' && createPortal(
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 999999,
              background: 'oklch(0.12 0.015 250 / 0.7)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              color: '#fff',
              animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              `}</style>
              
              <div style={{
                width: 48, height: 48,
                borderRadius: '50%',
                border: '3px solid oklch(0.7 0.15 140 / 0.2)',
                borderTopColor: 'oklch(0.7 0.15 140)',
                animation: 'spin 1s linear infinite',
                boxShadow: '0 0 16px oklch(0.7 0.15 140 / 0.3)',
              }} />
              
              <div style={{
                maxWidth: 460,
                textAlign: 'center',
                padding: '0 24px',
              }}>
                <h3 style={{
                  fontSize: 19,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: '#fff',
                  letterSpacing: '-0.01em',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}>
                  Preparing Your PDF...
                </h3>
                <p style={{
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  color: 'oklch(0.9 0.01 250 / 0.95)',
                  fontWeight: 400,
                  margin: 0,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}>
                  {pdfToast}
                </p>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {/* Cloud History Drawer Component */}
      {historyOpen && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 320, zIndex: 1000,
          background: 'var(--bg-elev-1)', borderLeft: '1px solid var(--border)',
          boxShadow: '-10px 0 30px oklch(0 0 0 / 0.4)', padding: 24, display: 'flex', flexDirection: 'column'
        }} className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: 'white', margin: 0 }}>Cloud History (30 Days)</h4>
            <button onClick={() => setHistoryOpen(false)} className="reset" style={{ cursor: 'pointer', color: 'var(--fg-subtle)' }}><Icon.X size={16} /></button>
          </div>

          {!sessionUser || sessionUser.is_anonymous ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: 'auto 0', textAlign: 'center', padding: '0 10px' }}>
              <Icon.BookMarked size={32} style={{ color: 'var(--fg-dim)', margin: '0 auto' }} />
              <div style={{ fontSize: 13.5, color: 'var(--fg-muted)' }}>Sign up to synchronize your history securely in the cloud.</div>
            </div>
          ) : historyLogs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: 'auto 0', textAlign: 'center' }}>
              <Icon.BookMarked size={32} style={{ color: 'var(--fg-dim)', margin: '0 auto' }} />
              <div style={{ fontSize: 13.5, color: 'var(--fg-muted)' }}>No saved document history yet.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1 }}>
              {historyLogs.map((log: any) => (
                <div 
                  key={log.id} 
                  onClick={() => {
                    if (log.content_preview) {
                      setText(log.content_preview);
                      setHistoryOpen(false);
                    }
                  }}
                  style={{
                    padding: 12, borderRadius: 8, background: 'var(--bg-elev-2)',
                    border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4,
                    cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--bg-elev-2)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                  title="Click to restore this document snippet into the editor"
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.file_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-dim)' }}>{new Date(log.created_at).toLocaleDateString()} · {log.tool_id.toUpperCase()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
