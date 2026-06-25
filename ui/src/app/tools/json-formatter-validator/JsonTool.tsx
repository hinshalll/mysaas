"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  Lock, FileDown,
  CheckCircle, AlertTriangle, XCircle
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
  Lock, FileDown,
  CheckCircle, AlertTriangle, XCircle
};

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

interface JsonToolProps {
  tool: any;
  brandName: string;
  userPlan: string;
  sessionUser: any;
  onShowPaywall: () => void;
  supabase: any;
}

export default function JsonTool({ tool, brandName, userPlan, sessionUser, onShowPaywall, supabase }: JsonToolProps) {
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
      // Call Vercel's own native serverless API endpoint directly!
      const response = await fetch('/api/tools/json', {
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
    a.download = `${brandName}_Formatted_Data.json`;
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
    <div className="max-w-[1240px] mx-auto px-6 pt-10 pb-20 fade-in">
      
      {/* Breadcrumb Header */}
      <div className="inline-flex items-center gap-2 text-[11.5px] text-fg-dim mb-3.5 mono">
        <span style={{ color: tintFg(tool.hue) }}>{tool.categoryLabel}</span>
        <span>/</span>
        <span className="text-fg-muted">{tool.id}</span>
      </div>

      {/* Tool Identity Header */}
      <div className="flex items-center gap-4 mb-8">
        <div 
          className="w-[52px] h-[52px] rounded-xl flex items-center justify-center"
          style={{
            background: tint(tool.hue),
            border: `1px solid ${tintBorder(tool.hue)}`,
            color: tintFg(tool.hue),
            boxShadow: `0 0 24px ${tint(tool.hue, 0.4, 0.1, 0.1)}`,
          }}
        >
          <Ico size={24} strokeWidth={2} />
        </div>
        <div>
          <h1 className="m-0 text-2xl font-semibold text-white tracking-[-0.02em]">{tool.name}</h1>
          <p className="mt-1 mb-0 text-[13.5px] text-fg-muted">{tool.tagline}</p>
        </div>
      </div>

      {/* Two Column Layout Panel */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(480px,1fr))] gap-6 items-start tools-split-layout">
        
        {/* Left Side: Input & Operations */}
        <div className="flex flex-col gap-4">
          <div className="bg-[oklch(0.16_0.006_250/0.7)] border border-border rounded-xl p-5 md:px-6 flex flex-col gap-4">
            
            {/* Input Selection Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-1.5 bg-[oklch(0.12_0.004_250)] p-1 rounded-lg border border-border">
                <button 
                  onClick={() => setInputMethod('paste')} 
                  className={`mono px-3 py-1.5 text-[11.5px] font-semibold rounded-md cursor-pointer ${inputMethod === 'paste' ? 'bg-[oklch(0.20_0.008_250)] text-white' : 'bg-transparent text-fg-muted'}`}
                >
                  Paste Text
                </button>
                <button 
                  onClick={() => setInputMethod('upload')} 
                  className={`mono px-3 py-1.5 text-[11.5px] font-semibold rounded-md cursor-pointer ${inputMethod === 'upload' ? 'bg-[oklch(0.20_0.008_250)] text-white' : 'bg-transparent text-fg-muted'}`}
                >
                  Upload File
                </button>
              </div>

              <div>
                <button 
                  onClick={handleClear} 
                  className="mono px-3 py-1.5 text-[11.5px] font-medium rounded-md text-[oklch(0.70_0.12_15)] border border-[oklch(0.70_0.12_15/0.2)] cursor-pointer"
                >
                  Clear Input
                </button>
              </div>
            </div>

            {/* Input Form Elements */}
            {inputMethod === 'paste' ? (
              <textarea
                placeholder="Paste raw, messy, or broken JSON payload here..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="w-full h-[320px] p-4 rounded-lg bg-[oklch(0.12_0.004_250)] border border-border text-white font-mono text-[13px] outline-none resize-none box-border leading-[1.5]"
              />
            ) : (
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-[320px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 box-border p-6 text-center"
                style={{
                  borderColor: isDragOver ? tintFg(tool.hue) : 'var(--border)',
                  background: isDragOver ? tint(tool.hue, 0.18, 0.04, 0.06) : 'oklch(0.12 0.004 250)',
                }}
              >
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={e => e.target.files?.[0] && handleFileLoad(e.target.files[0])}
                  className="hidden"
                />
                <Icon.FileDown size={36} className="mb-3.5" style={{ color: isDragOver ? tintFg(tool.hue) : 'var(--fg-dim)' }} />
                <span className="text-[14.5px] font-medium text-white block mb-1.5">
                  {inputText ? '📄 File Loaded Successfully' : 'Drag and drop your .json file here'}
                </span>
                <span className="text-[12.5px] text-fg-subtle">
                  {inputText ? `Click here to replace file (${sizeKb} KB)` : 'or click to browse local files'}
                </span>
              </div>
            )}

            {/* Input Metric readouts */}
            <div className="flex gap-4 text-[11.5px] text-fg-subtle border-t border-border pt-3.5 mono">
              <div>Chars: <span className="text-white">{charsCount}</span></div>
              <div>Lines: <span className="text-white">{linesCount}</span></div>
              <div>Size: <span className="text-white">{sizeKb} KB</span></div>
            </div>
          </div>

          {/* Action Operations Bar */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => handleAction('Format')}
              disabled={loading}
              className="w-full p-3.5 rounded-lg font-semibold text-[14px] inline-flex items-center justify-center gap-2 hover:-translate-y-px transition-transform"
              style={{
                background: tint(tool.hue),
                border: `1px solid ${tintBorder(tool.hue)}`,
                color: tintFg(tool.hue),
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Processing...' : '✨ Format & Validate'}
            </button>

            <div className="grid grid-cols-[1.2fr_1fr] gap-2.5">
              <button
                onClick={() => handleAction('Auto-Repair')}
                disabled={loading}
                className="p-3 rounded-lg bg-[oklch(0.20_0.008_75/0.25)] border border-[oklch(0.75_0.14_75/0.2)] text-[oklch(0.78_0.16_75)] font-medium text-[13px] inline-flex items-center justify-center gap-1.5"
                style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                <Icon.HeartPulse size={13} /> Repair Broken JSON
              </button>

              <button
                onClick={() => handleAction('Minify')}
                disabled={loading}
                className="p-3 rounded-lg bg-[oklch(0.18_0.008_250/0.6)] border border-border text-white font-medium text-[13px] inline-flex items-center justify-center gap-1.5"
                style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                <Icon.Archive size={13} /> Minify (Compress)
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Output & Status badging */}
        <div className="flex flex-col gap-4">
          
          {/* Status Alert Banners */}
          {status !== 'idle' && (
            <div className="fade-in">
              {/* Valid Badges */}
              {(status === 'success' || status === 'already_valid') && (
                <div className="px-5 py-3.5 rounded-lg bg-[oklch(0.20_0.010_145/0.2)] border border-[oklch(0.75_0.14_145/0.3)] text-[oklch(0.78_0.16_145)] flex items-center gap-2.5 text-[13.5px] shadow-[0_0_16px_oklch(0.78_0.16_145/0.1)]">
                  <Icon.CheckCircle size={15} strokeWidth={2.5} />
                  <span>
                    <strong>Valid JSON!</strong> Prettified payload is compiled successfully.
                    {errorDetails && <span className="block text-[12px] mt-1 opacity-80">({errorDetails})</span>}
                  </span>
                </div>
              )}

              {/* Repaired Badges */}
              {status === 'repaired' && (
                <div className="px-5 py-3.5 rounded-lg bg-[oklch(0.20_0.010_75/0.25)] border border-[oklch(0.75_0.14_75/0.3)] text-[oklch(0.78_0.16_75)] flex items-center gap-2.5 text-[13.5px]">
                  <Icon.AlertTriangle size={15} strokeWidth={2.5} />
                  <span>
                    <strong>Repaired JSON!</strong> {errorDetails}
                  </span>
                </div>
              )}

              {/* Error Badges */}
              {(status === 'error' || status === 'fatal_error') && (
                <div className="px-5 py-3.5 rounded-lg bg-[oklch(0.20_0.010_15/0.2)] border border-[oklch(0.70_0.12_15/0.3)] text-[oklch(0.80_0.10_15)] flex items-center gap-2.5 text-[13.5px] leading-[1.4]">
                  <Icon.XCircle size={16} strokeWidth={2.5} className="shrink-0" />
                  <span>
                    <strong>Validation Failed:</strong> {errorDetails}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Output Display Card */}
          <div className="bg-[oklch(0.16_0.006_250/0.7)] border border-border rounded-xl p-5 md:px-6 flex flex-col gap-4">
            
            {/* Output Toolbar */}
            <div className="flex items-center gap-3">
              <div className="text-[12.5px] font-semibold text-white mono">Formatted Output</div>
              
              {outputText && (
                <div className="ml-auto flex gap-2 fade-in">
                  <button 
                    onClick={handleCopy} 
                    className={`mono px-3 py-1.5 text-[11.5px] font-semibold rounded-md border border-border bg-[oklch(0.12_0.004_250)] cursor-pointer flex items-center gap-1.5 ${copying ? 'text-[oklch(0.78_0.16_145)]' : 'text-white'}`}
                  >
                    {copying ? <><Icon.Check size={12} /> Copied!</> : <><Icon.Copy size={12} /> Copy JSON</>}
                  </button>
                  <button 
                    onClick={handleDownload} 
                    className="mono px-3 py-1.5 text-[11.5px] font-semibold rounded-md border border-border bg-[oklch(0.12_0.004_250)] text-white cursor-pointer flex items-center gap-1.5"
                  >
                    <Icon.Download size={12} /> Download
                  </button>
                </div>
              )}
            </div>

            {/* Output code block container */}
            <div className="relative">
              <textarea
                readOnly
                placeholder="Processed validation output will render here..."
                value={outputText}
                className="w-full h-[320px] p-4 rounded-lg bg-[oklch(0.12_0.004_250/0.5)] border border-border font-mono text-[13px] outline-none resize-none box-border leading-[1.5]"
                style={{
                  color: outputText ? 'oklch(0.85 0.10 195)' : 'var(--fg-dim)', 
                }}
              />
            </div>

            {/* Output metrics details */}
            <div className="flex gap-4 text-[11.5px] text-fg-subtle border-t border-border pt-3.5 mono">
              <div>Chars: <span className="text-white">{outputText.length}</span></div>
              <div>Lines: <span className="text-white">{outputText ? outputText.split('\n').length : 0}</span></div>
              <div>Size: <span className="text-white">{outputText ? (outputText.length / 1024).toFixed(2) : '0.00'} KB</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
