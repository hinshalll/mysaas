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
  Eye, EyeOff, CreditCard, AlertCircle, Info, Lock, FileDown,
  CheckCircle, AlertTriangle, XCircle, RefreshCw
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
  Eye, EyeOff, CreditCard, AlertCircle, Info, Lock, FileDown,
  CheckCircle, AlertTriangle, XCircle, RefreshCw
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

interface FileState {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  convertedSize?: number;
  convertedBlob?: Blob;
  convertedUrl?: string;
  status: 'pending' | 'converting' | 'success' | 'error' | 'size_exceeded';
  errorMessage?: string;
}

interface HeicToolProps {
  tool: any;
  initialSlug?: string;
  brandName: string;
  userPlan: string;
  sessionUser: any;
  onShowPaywall: (type?: "limit" | "upgrade", toolName?: string, limit?: number) => void;
  supabase: any;
  checkAndLogUsage: (toolId: string, isTier2: boolean) => Promise<boolean>;
}

export default function HeicTool({
  tool,
  initialSlug,
  brandName,
  userPlan,
  sessionUser,
  onShowPaywall,
  supabase,
  checkAndLogUsage,
}: HeicToolProps) {
  // Pill target format selector: default PNG if slug matches png, else JPG
  const initialFormat = (initialSlug === 'heic-to-png') ? 'png' : 'jpg';
  
  const [targetFormat, setTargetFormat] = useState<'jpg' | 'png'>(initialFormat);
  const [customName, setCustomName] = useState('');
  const [files, setFiles] = useState<FileState[]>([]);
  const [convertingActive, setConvertingActive] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxName, setLightboxName] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeHue = tool.hue ?? 25; // Images & Media is warm orange (25)

  // Enforce Dynamic plan limits:
  const isGuest = !sessionUser || sessionUser.is_anonymous;
  const isPaid = userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin';
  
  const maxBatchCount = isPaid ? 100 : (isGuest ? 3 : 10);
  const maxFileSizeMb = isPaid ? 100 : (isGuest ? 10 : 20);
  const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;

  // Track initialSlug change to update format dynamically
  useEffect(() => {
    if (initialSlug === 'heic-to-png') {
      setTargetFormat('png');
    } else {
      setTargetFormat('jpg');
    }
  }, [initialSlug]);

  // Clean up Object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
      });
    };
  }, [files]);

  // File loading selection handler
  const handleFilesSelected = (selectedFiles: FileList) => {
    if (!selectedFiles.length) return;

    let incoming = Array.from(selectedFiles).filter(file => {
      const lowerName = file.name.toLowerCase();
      return lowerName.endsWith('.heic') || lowerName.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';
    });

    if (incoming.length === 0) {
      alert("Only HEIC or HEIF images are supported.");
      return;
    }

    // Limit check: Truncate list if count exceeds limit and trigger paywall/auth modal
    let exceededCountLimit = false;
    if (files.length + incoming.length > maxBatchCount) {
      exceededCountLimit = true;
      incoming = incoming.slice(0, maxBatchCount - files.length);
    }

    const newStates: FileState[] = incoming.map((file, idx) => {
      const isSizeExceeded = file.size > maxFileSizeBytes;
      return {
        id: Math.random().toString(36).substring(7) + '-' + idx,
        file,
        name: file.name,
        originalSize: file.size,
        status: isSizeExceeded ? 'size_exceeded' : 'pending',
      };
    });

    setFiles(prev => [...prev, ...newStates]);

    if (exceededCountLimit) {
      // Trigger Paywall Modal or Auth warning
      if (isGuest) {
        alert(`Guests are limited to ${maxBatchCount} files per batch. Register for a free account to convert up to 10 files.`);
        onShowPaywall('limit', 'HEIC Converter', maxBatchCount);
      } else {
        alert(`Free accounts are limited to ${maxBatchCount} files per batch. Upgrade to Pro for up to 100 files.`);
        onShowPaywall('limit', 'HEIC Converter', maxBatchCount);
      }
    }
  };

  const handleClear = () => {
    // Revoke old URLs
    files.forEach(f => {
      if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
    });
    setFiles([]);
    setCustomName('');
    setConvertingActive(false);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => {
      const fileToRm = prev.find(f => f.id === id);
      if (fileToRm?.convertedUrl) {
        URL.revokeObjectURL(fileToRm.convertedUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  // Naming preview mapping helper
  const getOutputFilename = (index: number, total: number, originalName: string) => {
    const extension = targetFormat;
    const baseExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    if (!customName.trim()) {
      return `${baseExt}.${extension}`;
    }
    if (total === 1) {
      return `${customName.trim()}.${extension}`;
    }
    return `${customName.trim()}_${index + 1}.${extension}`;
  };

  // Native Browser-Level canvas exporter
  const decodeNative = (file: File, format: 'jpg' | 'png'): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Could not acquire 2D Canvas context."));
          return;
        }
        ctx.drawImage(img, 0, 0);
        
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        // Use 95% quality for high-quality JPG outputs (virtually lossless)
        const quality = format === 'png' ? undefined : 0.95;
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas toBlob serialization returned null."));
          }
        }, mimeType, quality);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Native decoding failed. File format might be unsupported natively."));
      };
      img.src = objectUrl;
    });
  };

  // WASM fallback decoder inside WebWorker / Dynamic imports
  const decodeWasm = async (file: File, format: 'jpg' | 'png'): Promise<Blob> => {
    // Dynamic import to prevent next SSR crash
    const heic2any = (await import('heic2any')).default;
    
    // heic2any converts HEIC blob to JPG/PNG blob
    const result = await heic2any({
      blob: file,
      toType: format === 'png' ? 'image/png' : 'image/jpeg',
      quality: format === 'png' ? undefined : 0.95,
    });
    
    const blob = Array.isArray(result) ? result[0] : result;
    return blob;
  };

  // Perform conversions sequentially to prevent UI freezing
  const handleConvertAll = async () => {
    const validPendingFiles = files.filter(f => f.status === 'pending');
    if (validPendingFiles.length === 0) return;

    // Enforce limits and log usage via global daily quotas
    const usagePassed = await checkAndLogUsage('heic', false);
    if (!usagePassed) {
      return; // Metered usage quota limit hit, paywall is active
    }

    setConvertingActive(true);

    for (let i = 0; i < files.length; i++) {
      const current = files[i];
      if (current.status !== 'pending') continue;

      setFiles(prev => prev.map(f => f.id === current.id ? { ...f, status: 'converting' } : f));

      try {
        let outputBlob: Blob;
        try {
          // Attempt Native Canvas pipeline (fastest iOS/Safari, 50ms)
          outputBlob = await decodeNative(current.file, targetFormat);
        } catch (nativeErr) {
          // Native failed (Chrome/Windows), fall back to Wasm chunk engine (1-2s)
          console.log(`Native decode failed, attempting WebAssembly decoder fallback for ${current.name}...`);
          outputBlob = await decodeWasm(current.file, targetFormat);
        }

        const outUrl = URL.createObjectURL(outputBlob);
        setFiles(prev => prev.map(f => f.id === current.id ? {
          ...f,
          status: 'success',
          convertedBlob: outputBlob,
          convertedUrl: outUrl,
          convertedSize: outputBlob.size
        } : f));

      } catch (err: any) {
        console.error("HEIC decode failed:", err);
        setFiles(prev => prev.map(f => f.id === current.id ? {
          ...f,
          status: 'error',
          errorMessage: err.message || "Failed to decode HEIC image."
        } : f));
      }
    }

    setConvertingActive(false);
  };

  // ZIP packaging client-side
  const handleDownloadAllZip = async () => {
    const successFiles = files.filter(f => f.status === 'success' && f.convertedBlob);
    if (successFiles.length === 0) return;

    setZipping(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      successFiles.forEach((item, idx) => {
        const outName = getOutputFilename(idx, successFiles.length, item.name);
        zip.file(outName, item.convertedBlob!);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `${customName.trim() || 'MySaaS_Converted_Images'}.zip`;
      a.click();
      URL.revokeObjectURL(zipUrl);
    } catch (e) {
      console.error("ZIP compile error:", e);
      alert("Failed to build ZIP archive. Please download images individually.");
    } finally {
      setZipping(false);
    }
  };

  const handleDownloadSingle = (item: FileState, idx: number) => {
    if (!item.convertedUrl) return;
    const a = document.createElement('a');
    a.href = item.convertedUrl;
    a.download = getOutputFilename(idx, files.length, item.name);
    a.click();
  };

  // Full-Screen Preview lightbox handler
  const handleOpenPreview = (item: FileState, idx: number) => {
    if (!item.convertedUrl) return;
    setLightboxUrl(item.convertedUrl);
    setLightboxName(getOutputFilename(idx, files.length, item.name));
  };

  // Drag and drop event bounds
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const onDragLeave = () => {
    setIsDragOver(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // UI state grouping variables
  const pendingCount = files.filter(f => f.status === 'pending').length;
  const isAllConverted = files.length > 0 && files.every(f => f.status === 'success' || f.status === 'error' || f.status === 'size_exceeded');
  const successFiles = files.filter(f => f.status === 'success');

  const Ico = Icon[tool.icon] || Icon.Image;

  return (
    <div style={{
      maxWidth: 1100, margin: '0 auto',
      padding: '40px 24px 80px',
      position: 'relative',
    }} className="fade-in">
      
      {/* Breadcrumbs */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontSize: 11.5, color: 'var(--fg-dim)',
        marginBottom: 14,
      }} className="mono">
        <span style={{ color: tintFg(tool.hue) }}>{tool.categoryLabel}</span>
        <span>/</span>
        <span style={{ color: 'var(--fg-muted)' }}>{tool.id}</span>
      </div>

      {/* Hero Header */}
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

      {/* Main Container Dashboard */}
      <div style={{
        background: 'oklch(0.16 0.006 250 / 0.7)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '24px 28px',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        
        {/* Step 1: Upload and options (Only shown when files length is 0 or all pending is empty and not converted) */}
        {files.length === 0 && (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%', height: 260, borderRadius: 10,
              border: `2px dashed ${isDragOver ? tintFg(tool.hue) : 'var(--border)'}`,
              background: isDragOver ? tint(tool.hue, 0.18, 0.04, 0.06) : 'oklch(0.12 0.004 250 / 0.5)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s',
              boxSizing: 'border-box', padding: 24, textAlign: 'center',
            }}
          >
            <input
              type="file"
              accept=".heic,.heif"
              multiple
              ref={fileInputRef}
              onChange={e => handleFilesSelected(e.target.files!)}
              style={{ display: 'none' }}
            />
            <Icon.FileDown size={42} style={{ color: isDragOver ? tintFg(tool.hue) : 'var(--fg-dim)', marginBottom: 14 }} />
            <span style={{ fontSize: 16, fontWeight: 500, color: 'white', display: 'block', marginBottom: 6 }}>
              Drag & drop HEIC / HEIF photos here
            </span>
            <span style={{ fontSize: 13, color: 'var(--fg-subtle)' }}>
              or click to browse local files (limit: {maxBatchCount} files · up to {maxFileSizeMb}MB per file)
            </span>
          </div>
        )}

        {/* Configurations Header Settings */}
        {files.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: 20,
            borderBottom: '1px solid var(--border)',
            paddingBottom: 20,
            alignItems: 'end',
          }} className="tools-split-layout">
            
            {/* Target Output Pill selector */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', marginBottom: 8 }} className="mono uppercase tracking-wider">Target Format</label>
              <div style={{ display: 'flex', gap: 6, background: 'oklch(0.12 0.004 250)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setTargetFormat('jpg')}
                  disabled={convertingActive || isAllConverted}
                  className="reset mono"
                  style={{
                    flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                    background: targetFormat === 'jpg' ? 'oklch(0.20 0.008 250)' : 'transparent',
                    color: targetFormat === 'jpg' ? 'white' : 'var(--fg-muted)',
                    cursor: (convertingActive || isAllConverted) ? 'not-allowed' : 'pointer',
                  }}
                >
                  Convert to JPG
                </button>
                <button
                  onClick={() => setTargetFormat('png')}
                  disabled={convertingActive || isAllConverted}
                  className="reset mono"
                  style={{
                    flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                    background: targetFormat === 'png' ? 'oklch(0.20 0.008 250)' : 'transparent',
                    color: targetFormat === 'png' ? 'white' : 'var(--fg-muted)',
                    cursor: (convertingActive || isAllConverted) ? 'not-allowed' : 'pointer',
                  }}
                >
                  Convert to PNG
                </button>
              </div>
            </div>

            {/* Custom Renaming option */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', marginBottom: 8 }} className="mono uppercase tracking-wider">Custom Download Name (Optional)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Leave blank to keep original file names..."
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  disabled={convertingActive}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'oklch(0.12 0.004 250)',
                    border: '1px solid var(--border)', borderRadius: 8,
                    color: 'white', fontSize: 13, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--fg-subtle)', marginTop: 6 }} className="mono">
                {files.length > 0 && (
                  <>
                    ℹ️ Output names: {getOutputFilename(0, files.length, files[0].name)}
                    {files.length > 1 && `, ${getOutputFilename(1, files.length, files[1].name)}...`}
                  </>
                )}
              </span>
            </div>

          </div>
        )}

        {/* Step 2: Render Content Grid or Table list */}
        {files.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Layout Split: Multiple Files List vs Single File Layout */}
            {files.length === 1 ? (
              
              /* Single File View - Focused, Centered layout */
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                margin: '20px auto', maxWidth: 440, width: '100%',
                background: 'oklch(0.12 0.004 250 / 0.5)',
                border: '1px solid var(--border)', borderRadius: 12, padding: 24,
                textAlign: 'center',
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 10,
                  background: tint(tool.hue, 0.20, 0.05, 0.2),
                  color: tintFg(tool.hue),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, border: `1px solid ${tintBorder(tool.hue)}`,
                }}>
                  <Icon.Image size={32} />
                </div>
                
                <h3 style={{ fontSize: 15.5, fontWeight: 600, color: 'white', margin: '0 0 4px', wordBreak: 'break-all' }}>{files[0].name}</h3>
                <p style={{ fontSize: 12.5, color: 'var(--fg-subtle)', margin: '0 0 16px' }}>Original: {formatSize(files[0].originalSize)}</p>

                {files[0].status === 'size_exceeded' && (
                  <div style={{
                    padding: '8px 12px', background: 'oklch(0.20 0.010 15 / 0.2)',
                    border: '1px solid oklch(0.70 0.12 15 / 0.3)', color: 'oklch(0.80 0.10 15)',
                    borderRadius: 8, fontSize: 12, width: '100%', boxSizing: 'border-box', marginBottom: 12,
                    display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center'
                  }}>
                    <Icon.Lock size={12} /> File size exceeds limits ({formatSize(files[0].originalSize)} &gt; {maxFileSizeMb}MB).
                  </div>
                )}

                {files[0].status === 'error' && (
                  <div style={{
                    padding: '8px 12px', background: 'oklch(0.20 0.010 15 / 0.2)',
                    border: '1px solid oklch(0.70 0.12 15 / 0.3)', color: 'oklch(0.80 0.10 15)',
                    borderRadius: 8, fontSize: 12, width: '100%', boxSizing: 'border-box', marginBottom: 12,
                  }}>
                    ❌ {files[0].errorMessage}
                  </div>
                )}

                {/* Conversion metrics info */}
                {files[0].status === 'success' && (
                  <div style={{
                    display: 'flex', gap: 16, width: '100%',
                    justifyContent: 'center', alignItems: 'center',
                    border: '1px solid var(--border)', borderRadius: 8,
                    padding: 10, background: 'var(--bg-elev-1)', marginBottom: 18,
                  }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 10, color: 'var(--fg-subtle)', textTransform: 'uppercase' }} className="mono">Export Type</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }} className="mono">{targetFormat.toUpperCase()} File</div>
                    </div>
                    <div style={{ width: 1, height: 24, background: 'var(--border)' }}></div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 10, color: 'var(--fg-subtle)', textTransform: 'uppercase' }} className="mono">Export Size</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'oklch(0.78 0.16 145)' }} className="mono">{formatSize(files[0].convertedSize || 0)}</div>
                    </div>
                  </div>
                )}

                {/* Main operational actions */}
                {files[0].status === 'pending' && (
                  <button
                    onClick={handleConvertAll}
                    disabled={convertingActive}
                    className="reset"
                    style={{
                      width: '100%', padding: '12px', borderRadius: 8,
                      background: tint(tool.hue), border: `1px solid ${tintBorder(tool.hue)}`,
                      color: tintFg(tool.hue), fontWeight: 600, fontSize: 13.5,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <Icon.RefreshCw size={14} /> Convert to {targetFormat.toUpperCase()}
                  </button>
                )}

                {files[0].status === 'converting' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-muted)', fontSize: 13.5, padding: '10px 0' }}>
                    <Icon.Loader size={16} className="spin" /> Decoding and formatting file...
                  </div>
                )}

                {files[0].status === 'success' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    <button
                      onClick={() => handleDownloadSingle(files[0], 0)}
                      className="reset"
                      style={{
                        width: '100%', padding: '12px', borderRadius: 8,
                        background: 'linear-gradient(180deg, oklch(0.72 0.18 25), oklch(0.62 0.20 25))',
                        color: 'white', fontWeight: 600, fontSize: 13.5,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: '0 2px 8px oklch(0.60 0.15 25 / 0.3)',
                      }}
                    >
                      <Icon.Download size={14} /> Download {targetFormat.toUpperCase()}
                    </button>
                    
                    <button
                      onClick={() => handleOpenPreview(files[0], 0)}
                      className="reset"
                      style={{
                        width: '100%', padding: '10px', borderRadius: 8,
                        background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                        color: 'white', fontWeight: 500, fontSize: 13,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <Icon.Eye size={13} /> Open Image Preview
                    </button>
                  </div>
                )}

                {/* Cancel/Reset file selector */}
                <button
                  onClick={handleClear}
                  disabled={convertingActive}
                  className="reset"
                  style={{
                    marginTop: 14, fontSize: 12, color: 'var(--fg-dim)', cursor: convertingActive ? 'not-allowed' : 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Select a different file
                </button>
              </div>

            ) : (

              /* Multiple Files View - Dashboard table layout */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                
                {/* List Action header panel */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ fontSize: 13, color: 'var(--fg-muted)' }} className="mono">
                    Files Selected: <span style={{ color: 'white', fontWeight: 600 }}>{files.length}</span> / {maxBatchCount}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={handleClear}
                      disabled={convertingActive}
                      className="reset mono"
                      style={{
                        padding: '6px 12px', fontSize: 11.5, fontWeight: 500, borderRadius: 6,
                        color: 'oklch(0.70 0.12 15)', border: '1px solid oklch(0.70 0.12 15 / 0.2)',
                        cursor: convertingActive ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Remove All
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={convertingActive || files.length >= maxBatchCount}
                      className="reset mono"
                      style={{
                        padding: '6px 12px', fontSize: 11.5, fontWeight: 600, borderRadius: 6,
                        background: 'oklch(0.18 0.008 250 / 0.6)', border: '1px solid var(--border)',
                        color: 'white', cursor: (convertingActive || files.length >= maxBatchCount) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <Icon.Plus size={12} /> Add Files
                    </button>
                  </div>
                </div>

                {/* Dashboard Files Table */}
                <div style={{
                  border: '1px solid var(--border)', borderRadius: 10,
                  overflow: 'hidden', background: 'oklch(0.12 0.004 250 / 0.3)',
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: 'oklch(0.10 0.002 250 / 0.5)' }} className="mono uppercase text-xxs">
                        <th style={{ padding: '12px 16px', color: 'var(--fg-dim)', fontWeight: 500 }}>File Name</th>
                        <th style={{ padding: '12px 16px', color: 'var(--fg-dim)', fontWeight: 500 }}>Original Size</th>
                        <th style={{ padding: '12px 16px', color: 'var(--fg-dim)', fontWeight: 500 }}>Target Size</th>
                        <th style={{ padding: '12px 16px', color: 'var(--fg-dim)', fontWeight: 500 }}>Status</th>
                        <th style={{ padding: '12px 16px', color: 'var(--fg-dim)', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: idx < files.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          
                          {/* File Name */}
                          <td style={{ padding: '14px 16px', color: 'white', fontWeight: 500, wordBreak: 'break-all' }}>
                            {item.name}
                          </td>
                          
                          {/* Original Size */}
                          <td style={{ padding: '14px 16px', color: 'var(--fg-muted)' }} className="mono">
                            {formatSize(item.originalSize)}
                          </td>
                          
                          {/* Converted Size */}
                          <td style={{ padding: '14px 16px', color: 'var(--fg-muted)' }} className="mono">
                            {item.status === 'success' && item.convertedSize ? (
                              <span style={{ color: 'oklch(0.78 0.16 145)' }}>{formatSize(item.convertedSize)}</span>
                            ) : (
                              '--'
                            )}
                          </td>
                          
                          {/* Status */}
                          <td style={{ padding: '14px 16px' }}>
                            {item.status === 'pending' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--fg-dim)', fontSize: 12 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--fg-dim)' }}></span>
                                Ready
                              </span>
                            )}
                            {item.status === 'converting' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'oklch(0.78 0.16 25)', fontSize: 12 }}>
                                <Icon.Loader size={12} className="spin" />
                                Converting...
                              </span>
                            )}
                            {item.status === 'success' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'oklch(0.78 0.16 145)', fontSize: 12 }}>
                                <Icon.Check size={12} strokeWidth={2.5} />
                                Completed
                              </span>
                            )}
                            {item.status === 'size_exceeded' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'oklch(0.80 0.10 15)', fontSize: 12 }} title={`Limits: Guests 10MB, Free 20MB`}>
                                <Icon.Lock size={12} />
                                Over Limit (&gt;{maxFileSizeMb}MB)
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'oklch(0.80 0.10 15)', fontSize: 12 }} title={item.errorMessage}>
                                <Icon.XCircle size={12} />
                                Error
                              </span>
                            )}
                          </td>
                          
                          {/* Individual Actions */}
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              {item.status === 'success' && (
                                <>
                                  <button
                                    onClick={() => handleOpenPreview(item, idx)}
                                    title="Quick Preview"
                                    className="reset"
                                    style={{
                                      padding: 6, borderRadius: 6, background: 'var(--bg-elev-2)',
                                      border: '1px solid var(--border)', color: 'white', cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                  >
                                    <Icon.Eye size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadSingle(item, idx)}
                                    title="Download Single Image"
                                    className="reset"
                                    style={{
                                      padding: 6, borderRadius: 6, background: 'var(--bg-elev-2)',
                                      border: '1px solid var(--border)', color: 'white', cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                  >
                                    <Icon.Download size={12} />
                                  </button>
                                </>
                              )}
                              
                              <button
                                onClick={() => handleRemoveFile(item.id)}
                                disabled={convertingActive}
                                title="Remove File"
                                className="reset"
                                style={{
                                  padding: 6, borderRadius: 6, background: 'transparent',
                                  border: '1px solid transparent', color: 'oklch(0.70 0.12 15 / 0.6)',
                                  cursor: convertingActive ? 'not-allowed' : 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'oklch(0.70 0.12 15 / 0.2)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                              >
                                <Icon.X size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Operations Control Center */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'oklch(0.12 0.002 250 / 0.4)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 16,
                  marginTop: 8,
                  flexWrap: 'wrap',
                  gap: 12,
                }}>
                  <div>
                    {pendingCount > 0 ? (
                      <span style={{ fontSize: 13, color: 'var(--fg-subtle)' }}>
                        🚀 Ready to process <strong style={{ color: 'white' }}>{pendingCount}</strong> files.
                      </span>
                    ) : (
                      <span style={{ fontSize: 13, color: 'oklch(0.78 0.16 145)' }}>
                        ✅ All files processed successfully!
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    {pendingCount > 0 && (
                      <button
                        onClick={handleConvertAll}
                        disabled={convertingActive}
                        className="reset"
                        style={{
                          padding: '10px 20px', borderRadius: 8,
                          background: tint(tool.hue), border: `1px solid ${tintBorder(tool.hue)}`,
                          color: tintFg(tool.hue), fontWeight: 600, fontSize: 13,
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        {convertingActive ? (
                          <>
                            <Icon.Loader size={13} className="spin" />
                            Converting {files.filter(f => f.status === 'converting').length + 1}/{files.filter(f => f.status === 'pending' || f.status === 'converting').length}
                          </>
                        ) : (
                          <>
                            <Icon.RefreshCw size={13} /> Convert Batch
                          </>
                        )}
                      </button>
                    )}

                    {successFiles.length > 0 && isAllConverted && (
                      <button
                        onClick={handleDownloadAllZip}
                        disabled={zipping}
                        className="reset"
                        style={{
                          padding: '10px 20px', borderRadius: 8,
                          background: 'linear-gradient(180deg, oklch(0.72 0.18 25), oklch(0.62 0.20 25))',
                          color: 'white', fontWeight: 600, fontSize: 13,
                          cursor: zipping ? 'not-allowed' : 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          boxShadow: '0 2px 8px oklch(0.60 0.15 25 / 0.3)',
                        }}
                      >
                        {zipping ? (
                          <>
                            <Icon.Loader size={13} className="spin" />
                            Zipping...
                          </>
                        ) : (
                          <>
                            <Icon.Archive size={13} /> Download All as ZIP
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>

      {/* Pop-up Full-Screen Lightbox Preview Modal */}
      {lightboxUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'oklch(0.06 0.002 250 / 0.85)', backdropFilter: 'blur(16px)',
          zIndex: 100000, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
          padding: 24,
        }} className="fade-in">
          
          {/* Header */}
          <div style={{
            width: '100%', maxWidth: 900, display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 16, borderBottom: '1px solid oklch(1 0 0 / 0.1)',
            paddingBottom: 12,
          }}>
            <span style={{ color: 'white', fontSize: 14.5, fontWeight: 500, fontFamily: 'monospace' }}>{lightboxName}</span>
            <button
              onClick={() => setLightboxUrl(null)}
              className="reset"
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'oklch(1 0 0 / 0.08)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: '1px solid oklch(1 0 0 / 0.15)',
              }}
            >
              <Icon.X size={16} />
            </button>
          </div>

          {/* Image Containment Zone */}
          <div style={{
            flex: 1, width: '100%', maxWidth: 900, maxHeight: 'calc(100% - 120px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <img
              src={lightboxUrl}
              alt="Converted Preview"
              style={{
                maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                borderRadius: 8, boxShadow: '0 8px 32px oklch(0 0 0 / 0.5)',
                border: '1px solid oklch(1 0 0 / 0.1)',
              }}
            />
          </div>
          
          {/* Footer Actions */}
          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            <button
              onClick={() => {
                const a = document.createElement('a');
                a.href = lightboxUrl;
                a.download = lightboxName;
                a.click();
              }}
              className="reset"
              style={{
                padding: '8px 20px', borderRadius: 8, background: 'white', color: 'black',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Icon.Download size={13} /> Download File
            </button>
            <button
              onClick={() => setLightboxUrl(null)}
              className="reset"
              style={{
                padding: '8px 16px', borderRadius: 8, background: 'oklch(1 0 0 / 0.08)',
                border: '1px solid oklch(1 0 0 / 0.15)', color: 'white',
                fontWeight: 500, fontSize: 13, cursor: 'pointer',
              }}
            >
              Close Preview
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
