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
