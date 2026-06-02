"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Download, Loader, LayoutGrid, Plus, Star, Zap, Check,
  Eye, Lock, FileDown, CheckCircle, AlertTriangle, XCircle, RefreshCw, Trash2,
  List, HelpCircle, ChevronDown, ChevronUp, Image as ImageIcon, X, Edit2
} from 'lucide-react';

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
  engine?: 'native' | 'wasm';
  isEditingName?: boolean;
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modals / Lightbox state
  const [compareItem, setCompareItem] = useState<FileState | null>(null);
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true // Open first FAQ by default
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeHue = tool.hue ?? 25; // Images & Media is warm orange (25)

  // Enforce plan limits
  const isGuest = !sessionUser || sessionUser.is_anonymous;
  const isPaid = userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin';
  
  const maxBatchCount = isPaid ? 100 : (isGuest ? 3 : 10);
  const maxFileSizeMb = isPaid ? 100 : (isGuest ? 10 : 20);
  const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;

  // Browser support helper for native HEIC rendering (Safari / iOS)
  const isHeicNativelySupported = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    const isSafari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android');
    const isIOS = /ipad|iphone|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return isSafari || isIOS;
  };

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
      const originalBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      return {
        id: Math.random().toString(36).substring(7) + '-' + idx,
        file,
        name: originalBase,
        originalSize: file.size,
        status: isSizeExceeded ? 'size_exceeded' : 'pending',
      };
    });

    setFiles(prev => [...prev, ...newStates]);

    if (exceededCountLimit) {
      onShowPaywall('limit', 'HEIC Converter', maxBatchCount);
    }
  };

  const handleClear = () => {
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
  const getOutputFilename = (item: FileState, index: number, total: number) => {
    const extension = targetFormat;
    const base = item.name.trim() || 'unnamed';
    
    // If user specified a custom batch name override
    if (customName.trim()) {
      if (total === 1) {
        return `${customName.trim()}.${extension}`;
      }
      return `${customName.trim()}_${index + 1}.${extension}`;
    }
    
    return `${base}.${extension}`;
  };

  // Native Browser-Level canvas exporter with timeout safety failover
  const decodeNative = (file: File, format: 'jpg' | 'png'): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      const timeoutId = setTimeout(() => {
        img.onload = null;
        img.onerror = null;
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Native decoding timed out. Attempting WebAssembly decoder..."));
      }, 500);
      
      img.onload = () => {
        clearTimeout(timeoutId);
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
        const quality = format === 'png' ? undefined : 0.95;
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas serialization failed."));
          }
        }, mimeType, quality);
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Native rendering error."));
      };
      
      img.src = objectUrl;
    });
  };

  // Modern, fast WASM decoder client-side
  const decodeWasm = async (file: File, format: 'jpg' | 'png'): Promise<Blob> => {
    const { heicTo } = await import('heic-to');
    
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'png' ? undefined : 0.95;
    
    const resultBlob = await heicTo({
      blob: file,
      type: mimeType,
      quality: quality
    });
    
    return resultBlob;
  };

  // Perform conversions sequentially to prevent UI freezing
  const handleConvertAll = async () => {
    const validPendingFiles = files.filter(f => f.status === 'pending');
    if (validPendingFiles.length === 0) return;

    // Enforce limits and log usage via global daily quotas
    const usagePassed = await checkAndLogUsage('heic', false);
    if (!usagePassed) {
      return; 
    }

    setConvertingActive(true);
    const nativeSupported = isHeicNativelySupported();

    for (let i = 0; i < files.length; i++) {
      const current = files[i];
      if (current.status !== 'pending') continue;

      setFiles(prev => prev.map(f => f.id === current.id ? { ...f, status: 'converting' } : f));

      try {
        let outputBlob: Blob;
        let engine: 'native' | 'wasm' = 'wasm';
        
        if (nativeSupported) {
          try {
            outputBlob = await decodeNative(current.file, targetFormat);
            engine = 'native';
          } catch (nativeErr) {
            outputBlob = await decodeWasm(current.file, targetFormat);
            engine = 'wasm';
          }
        } else {
          outputBlob = await decodeWasm(current.file, targetFormat);
          engine = 'wasm';
        }

        const outUrl = URL.createObjectURL(outputBlob);
        setFiles(prev => prev.map(f => f.id === current.id ? {
          ...f,
          status: 'success',
          convertedBlob: outputBlob,
          convertedUrl: outUrl,
          convertedSize: outputBlob.size,
          engine
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
        const outName = getOutputFilename(item, idx, successFiles.length);
        zip.file(outName, item.convertedBlob!);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `${customName.trim() || 'converted_photos'}.zip`;
      a.click();
      URL.revokeObjectURL(zipUrl);
    } catch (e) {
      console.error("ZIP compile error:", e);
      alert("Failed to build ZIP archive.");
    } finally {
      setZipping(false);
    }
  };

  const handleDownloadSingle = (item: FileState, idx: number) => {
    if (!item.convertedUrl) return;
    const a = document.createElement('a');
    a.href = item.convertedUrl;
    a.download = getOutputFilename(item, idx, files.length);
    a.click();
  };

  const toggleRenameMode = (id: string, editing: boolean) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isEditingName: editing } : f));
  };

  const handleRenameFile = (id: string, newName: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
  };

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
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const calculateSavings = (orig: number, conv?: number) => {
    if (!conv) return null;
    const diff = orig - conv;
    const percentage = ((diff / orig) * 100).toFixed(0);
    return {
      percentage,
      isSmaller: diff > 0,
      savingText: diff > 0 ? `${percentage}% smaller` : `${Math.abs(Number(percentage))}% larger`
    };
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const isAllConverted = files.length > 0 && files.every(f => f.status === 'success' || f.status === 'error' || f.status === 'size_exceeded');
  const successFiles = files.filter(f => f.status === 'success');
  const convertingCount = files.filter(f => f.status === 'converting').length;

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div style={{
      maxWidth: 1200, margin: '0 auto',
      padding: '40px 24px 80px',
      position: 'relative',
    }} className="fade-in">
      
      {/* Breadcrumbs */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontSize: 11.5, color: 'var(--fg-dim)',
        marginBottom: 14,
      }} className="mono">
        <span style={{ color: tintFg(activeHue) }}>{tool.categoryLabel}</span>
        <span>/</span>
        <span style={{ color: 'var(--fg-muted)' }}>{tool.id}</span>
      </div>

      {/* Hero Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: tint(activeHue),
            border: `1px solid ${tintBorder(activeHue)}`,
            color: tintFg(activeHue),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 24px ${tint(activeHue, 0.4, 0.1, 0.1)}`,
          }}>
            <ImageIcon size={24} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: 'white', letterSpacing: '-0.02em' }}>{tool.name}</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--fg-muted)' }}>{tool.tagline}</p>
          </div>
        </div>
        
        {/* Tier Indicator Tag */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'oklch(0.16 0.006 250 / 0.6)',
          border: '1px solid var(--border)',
          padding: '6px 12px', borderRadius: 8,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isPaid ? 'var(--pro)' : 'oklch(0.70 0.16 145)' }} />
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>
            Tier: <strong style={{ color: isPaid ? 'var(--pro)' : 'white' }}>{isPaid ? 'PRO' : (isGuest ? 'GUEST' : 'FREE')}</strong>
          </span>
        </div>
      </div>

      {/* Main Glass Dashboard */}
      <div style={{
        background: 'oklch(0.16 0.006 250 / 0.65)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '28px 32px',
        display: 'flex', flexDirection: 'column', gap: 28,
        boxShadow: '0 20px 40px oklch(0 0 0 / 0.2)',
        backdropFilter: 'blur(16px)',
      }}>
        
        {/* Drag & Drop Uploader */}
        {files.length === 0 && (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%', height: 280, borderRadius: 12,
              border: `2px dashed ${isDragOver ? 'oklch(0.70 0.16 25)' : 'var(--border)'}`,
              background: isDragOver ? 'oklch(0.18 0.010 25 / 0.15)' : 'oklch(0.12 0.004 250 / 0.3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.25s ease',
              boxSizing: 'border-box', padding: 24, textAlign: 'center',
              position: 'relative', overflow: 'hidden',
            }}
            className="hover-scale-subtle"
          >
            {/* Ambient Pulse Glow */}
            <div style={{
              position: 'absolute', width: 220, height: 220, borderRadius: '50%',
              background: 'oklch(0.70 0.16 25 / 0.05)', filter: 'blur(40px)',
              pointerEvents: 'none', zIndex: 0,
              animation: 'pulse 3s infinite alternate'
            }}/>
            
            <input
              type="file"
              accept=".heic,.heif"
              multiple
              ref={fileInputRef}
              onChange={e => handleFilesSelected(e.target.files!)}
              style={{ display: 'none' }}
            />
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'oklch(0.18 0.010 25 / 0.2)',
              border: '1px solid oklch(0.70 0.16 25 / 0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'oklch(0.70 0.16 25)', marginBottom: 16, zIndex: 1
            }}>
              <FileDown size={28} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 500, color: 'white', display: 'block', marginBottom: 6, zIndex: 1 }}>
              Drag & drop HEIC / HEIF photos here
            </span>
            <span style={{ fontSize: 13, color: 'var(--fg-subtle)', maxWidth: 450, lineHeight: 1.45, zIndex: 1 }}>
              Process conversions completely local in your browser. No files are uploaded.<br />
              <strong style={{ color: 'white' }}>Limits:</strong> {maxBatchCount} photos / batch, up to {maxFileSizeMb}MB per photo.
            </span>
          </div>
        )}

        {/* Configurations Header Settings */}
        {files.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end',
            flexWrap: 'wrap',
            gap: 24,
            borderBottom: '1px solid var(--border)',
            paddingBottom: 24,
          }}>
            
            {/* Target Output Format Selection */}
            <div style={{ flex: '1 1 280px' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--fg-dim)', marginBottom: 10, letterSpacing: '0.08em' }} className="mono uppercase">Target Format</label>
              <div style={{ display: 'flex', gap: 6, background: 'oklch(0.12 0.004 250 / 0.6)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setTargetFormat('jpg')}
                  disabled={convertingActive || isAllConverted}
                  className="reset mono"
                  style={{
                    flex: 1, padding: '10px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                    background: targetFormat === 'jpg' ? 'oklch(0.70 0.16 25)' : 'transparent',
                    color: targetFormat === 'jpg' ? 'white' : 'var(--fg-muted)',
                    cursor: (convertingActive || isAllConverted) ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    boxShadow: targetFormat === 'jpg' ? '0 2px 8px oklch(0.60 0.15 25 / 0.3)' : 'none',
                  }}
                >
                  Convert to JPG
                </button>
                <button
                  onClick={() => setTargetFormat('png')}
                  disabled={convertingActive || isAllConverted}
                  className="reset mono"
                  style={{
                    flex: 1, padding: '10px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                    background: targetFormat === 'png' ? 'oklch(0.70 0.16 25)' : 'transparent',
                    color: targetFormat === 'png' ? 'white' : 'var(--fg-muted)',
                    cursor: (convertingActive || isAllConverted) ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    boxShadow: targetFormat === 'png' ? '0 2px 8px oklch(0.60 0.15 25 / 0.3)' : 'none',
                  }}
                >
                  Convert to PNG
                </button>
              </div>
            </div>

            {/* Custom Renaming configuration */}
            <div style={{ flex: '1 1 280px' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--fg-dim)', marginBottom: 10, letterSpacing: '0.08em' }} className="mono uppercase">Batch Rename Template (Optional)</label>
              <input
                type="text"
                placeholder="Leave blank to keep original file names..."
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                disabled={convertingActive}
                style={{
                  width: '100%', padding: '11px 14px', background: 'oklch(0.12 0.004 250 / 0.6)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  color: 'white', fontSize: 13, outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'oklch(0.70 0.16 25 / 0.5)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Layout Toggle: Grid vs List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-dim)', letterSpacing: '0.08em' }} className="mono uppercase">View Mode</span>
              <div style={{ display: 'inline-flex', gap: 4, background: 'oklch(0.12 0.004 250 / 0.6)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  className="reset"
                  style={{
                    padding: 8, borderRadius: 6,
                    background: viewMode === 'grid' ? 'var(--bg-elev-2)' : 'transparent',
                    color: viewMode === 'grid' ? 'white' : 'var(--fg-muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}
                  title="Grid View"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className="reset"
                  style={{
                    padding: 8, borderRadius: 6,
                    background: viewMode === 'list' ? 'var(--bg-elev-2)' : 'transparent',
                    color: viewMode === 'list' ? 'white' : 'var(--fg-muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}
                  title="List View"
                >
                  <List size={15} />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Dashboard Panels */}
        {files.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Header controls for multiple files */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--fg-muted)' }} className="mono">
                Selected: <span style={{ color: 'white', fontWeight: 600 }}>{files.length}</span> / {maxBatchCount} photos
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleClear}
                  disabled={convertingActive}
                  className="reset mono"
                  style={{
                    padding: '8px 14px', fontSize: 11.5, fontWeight: 500, borderRadius: 6,
                    color: 'oklch(0.70 0.12 15)', border: '1px solid oklch(0.70 0.12 15 / 0.15)',
                    cursor: convertingActive ? 'not-allowed' : 'pointer',
                    background: 'oklch(0.12 0.004 250 / 0.2)',
                  }}
                >
                  Clear All
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={convertingActive || files.length >= maxBatchCount}
                  className="reset mono"
                  style={{
                    padding: '8px 14px', fontSize: 11.5, fontWeight: 600, borderRadius: 6,
                    background: 'oklch(0.20 0.008 250 / 0.5)', border: '1px solid var(--border)',
                    color: 'white', cursor: (convertingActive || files.length >= maxBatchCount) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Plus size={12} /> Add More
                </button>
              </div>
            </div>

            {/* Layout Mode: Visual Grid View */}
            {viewMode === 'grid' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 16,
              }}>
                {files.map((item, idx) => {
                  const savings = calculateSavings(item.originalSize, item.convertedSize);
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: 'oklch(0.12 0.004 250 / 0.4)',
                        border: item.status === 'success' 
                          ? '1px solid oklch(0.78 0.16 145 / 0.25)' 
                          : item.status === 'size_exceeded' || item.status === 'error'
                            ? '1px solid oklch(0.80 0.10 15 / 0.25)'
                            : '1px solid var(--border)',
                        borderRadius: 12,
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                      }}
                      className="hover-card-asset"
                    >
                      {/* Floating remove button */}
                      <button
                        onClick={() => handleRemoveFile(item.id)}
                        disabled={convertingActive}
                        style={{
                          position: 'absolute', top: 8, right: 8, zIndex: 10,
                          padding: 5, borderRadius: 6, background: 'oklch(0.06 0.002 250 / 0.65)',
                          border: '1px solid var(--border)', color: 'oklch(0.70 0.12 15)', 
                          cursor: convertingActive ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center'
                        }}
                        className="reset"
                      >
                        <Trash2 size={11} />
                      </button>

                      {/* Image Preview Box */}
                      <div style={{
                        height: 128, borderRadius: 8, background: 'oklch(0.08 0.002 250 / 0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', position: 'relative', marginBottom: 10,
                        border: '1px solid var(--border)',
                      }}>
                        {item.status === 'success' && item.convertedUrl ? (
                          <>
                            <img
                              src={item.convertedUrl}
                              alt="Thumbnail"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div 
                              style={{
                                position: 'absolute', inset: 0, background: 'oklch(0 0 0 / 0.45)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer'
                              }}
                              className="overlay-preview-actions"
                              onClick={() => setCompareItem(item)}
                            >
                              <span style={{ fontSize: 11, fontWeight: 600, color: 'white', background: 'oklch(0 0 0 / 0.6)', padding: '4px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Eye size={11} /> Compare & View
                              </span>
                            </div>
                          </>
                        ) : item.status === 'converting' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <Loader size={20} className="spin" style={{ color: 'oklch(0.70 0.16 25)' }} />
                            <span style={{ fontSize: 10, color: 'var(--fg-dim)' }}>Converting...</span>
                          </div>
                        ) : item.status === 'size_exceeded' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: 'oklch(0.80 0.10 15)', fontSize: 11 }}>
                            <Lock size={16} />
                            <span className="mono">Max {maxFileSizeMb}MB</span>
                          </div>
                        ) : item.status === 'error' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: 'oklch(0.80 0.10 15)', fontSize: 11, padding: 8, textAlign: 'center' }}>
                            <XCircle size={16} />
                            <span style={{ fontSize: 9.5 }}>Failed to decode</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--fg-dim)' }}>
                            <ImageIcon size={22} />
                            <span className="mono" style={{ fontSize: 9.5 }}>HEIC / HEIF</span>
                          </div>
                        )}
                        
                        {/* Native/WASM engine badge */}
                        {item.status === 'success' && (
                          <span className="mono" style={{
                            position: 'absolute', bottom: 6, left: 6, fontSize: 9,
                            padding: '2px 5px', borderRadius: 4,
                            background: item.engine === 'native' ? 'oklch(0.70 0.16 145 / 0.85)' : 'oklch(0.68 0.18 265 / 0.85)',
                            color: 'white',
                          }}>
                            {item.engine === 'native' ? 'NATIVE ⚡' : 'WASM 🛠️'}
                          </span>
                        )}
                      </div>

                      {/* File Details & Rename Field */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                        {item.isEditingName ? (
                          <input
                            type="text"
                            value={item.name}
                            onChange={e => handleRenameFile(item.id, e.target.value)}
                            onBlur={() => toggleRenameMode(item.id, false)}
                            onKeyDown={e => { if (e.key === 'Enter') toggleRenameMode(item.id, false); }}
                            autoFocus
                            style={{
                              width: '100%', padding: '4px 6px', background: 'var(--bg-elev-2)',
                              border: '1px solid var(--border-strong)', borderRadius: 4,
                              color: 'white', fontSize: 12, outline: 'none'
                            }}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'space-between', gap: 4 }}>
                            <div 
                              onClick={() => { if (!convertingActive) toggleRenameMode(item.id, true); }}
                              style={{
                                fontSize: 12.5, fontWeight: 600, color: 'white',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                flex: 1, cursor: convertingActive ? 'default' : 'pointer',
                              }} 
                              title="Click to rename"
                            >
                              {item.name}
                            </div>
                            {!convertingActive && <Edit2 size={10} style={{ color: 'var(--fg-dim)', cursor: 'pointer' }} onClick={() => toggleRenameMode(item.id, true)} />}
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                          <span style={{ fontSize: 10.5, color: 'var(--fg-subtle)' }} className="mono">{formatSize(item.originalSize)}</span>
                          
                          {item.status === 'success' && item.convertedSize && (
                            <span style={{ 
                              fontSize: 10.5, 
                              color: savings?.isSmaller ? 'oklch(0.78 0.16 145)' : 'oklch(0.80 0.10 15)', 
                              fontWeight: 600 
                            }} className="mono">
                              ➔ {formatSize(item.convertedSize)}
                            </span>
                          )}
                        </div>

                        {item.status === 'success' && savings && (
                          <div style={{ 
                            fontSize: 9.5, 
                            color: savings.isSmaller ? 'oklch(0.78 0.16 145)' : 'oklch(0.80 0.10 15)', 
                            alignSelf: 'flex-end',
                            fontWeight: 500
                          }} className="mono">
                            ({savings.savingText})
                          </div>
                        )}
                      </div>

                      {/* Download button grid (visible on success) */}
                      {item.status === 'success' && (
                        <div style={{
                          display: 'flex', gap: 6, borderTop: '1px solid var(--border)',
                          paddingTop: 8, marginTop: 8,
                        }}>
                          <button
                            onClick={() => setCompareItem(item)}
                            className="reset mono"
                            style={{
                              flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 500, borderRadius: 4,
                              background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                              color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            }}
                          >
                            <Eye size={10} /> Compare
                          </button>
                          <button
                            onClick={() => handleDownloadSingle(item, idx)}
                            className="reset mono"
                            style={{
                              flex: 1.2, padding: '5px 0', fontSize: 11, fontWeight: 600, borderRadius: 4,
                              background: 'oklch(0.18 0.010 25 / 0.2)', border: '1px solid oklch(0.70 0.16 25 / 0.2)',
                              color: 'oklch(0.70 0.16 25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            }}
                          >
                            <Download size={10} /> Save
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Layout Mode: Compact Table List View */}
            {viewMode === 'list' && (
              <div style={{
                background: 'oklch(0.12 0.004 250 / 0.3)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'oklch(0.14 0.005 250 / 0.5)' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--fg-dim)' }} className="mono uppercase">Photo Name</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--fg-dim)' }} className="mono uppercase">Original</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--fg-dim)' }} className="mono uppercase">Converted</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--fg-dim)' }} className="mono uppercase">Savings</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--fg-dim)' }} className="mono uppercase">Engine</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--fg-dim)', textAlign: 'right' }} className="mono uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((item, idx) => {
                      const savings = calculateSavings(item.originalSize, item.convertedSize);
                      return (
                        <tr 
                          key={item.id} 
                          style={{ 
                            borderBottom: '1px solid var(--border)',
                            background: item.status === 'converting' ? 'oklch(0.70 0.16 25 / 0.05)' : 'transparent',
                            transition: 'background 0.2s'
                          }}
                        >
                          {/* File Name + Edit inline */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: 4, background: 'var(--bg-elev-1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                              }}>
                                {item.status === 'success' && item.convertedUrl ? (
                                  <img src={item.convertedUrl} alt="Mini preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <ImageIcon size={14} style={{ color: 'var(--fg-dim)' }} />
                                )}
                              </div>
                              
                              {item.isEditingName ? (
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={e => handleRenameFile(item.id, e.target.value)}
                                  onBlur={() => toggleRenameMode(item.id, false)}
                                  onKeyDown={e => { if (e.key === 'Enter') toggleRenameMode(item.id, false); }}
                                  autoFocus
                                  style={{
                                    padding: '2px 6px', background: 'var(--bg-elev-2)',
                                    border: '1px solid var(--border-strong)', borderRadius: 4,
                                    color: 'white', fontSize: 12.5, outline: 'none'
                                  }}
                                />
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span 
                                    onClick={() => { if (!convertingActive) toggleRenameMode(item.id, true); }}
                                    style={{ color: 'white', fontWeight: 500, cursor: convertingActive ? 'default' : 'pointer' }}
                                  >
                                    {item.name}
                                  </span>
                                  {!convertingActive && <Edit2 size={11} style={{ color: 'var(--fg-dim)', cursor: 'pointer' }} onClick={() => toggleRenameMode(item.id, true)} />}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Original Size */}
                          <td style={{ padding: '12px 16px', color: 'var(--fg-subtle)' }} className="mono">
                            {formatSize(item.originalSize)}
                          </td>

                          {/* Converted Size */}
                          <td style={{ padding: '12px 16px' }}>
                            {item.status === 'success' && item.convertedSize ? (
                              <span style={{ color: 'white', fontWeight: 600 }} className="mono">{formatSize(item.convertedSize)}</span>
                            ) : item.status === 'converting' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'oklch(0.70 0.16 25)' }}>
                                <Loader size={12} className="spin" />
                                <span style={{ fontSize: 11 }}>Converting...</span>
                              </div>
                            ) : item.status === 'size_exceeded' ? (
                              <span style={{ color: 'oklch(0.80 0.10 15)' }} className="mono">Size Exceeded</span>
                            ) : item.status === 'error' ? (
                              <span style={{ color: 'oklch(0.80 0.10 15)' }} className="mono">Failed</span>
                            ) : (
                              <span style={{ color: 'var(--fg-dim)' }} className="mono">Pending</span>
                            )}
                          </td>

                          {/* Savings Ratio */}
                          <td style={{ padding: '12px 16px' }} className="mono">
                            {item.status === 'success' && savings ? (
                              <span style={{ color: savings.isSmaller ? 'oklch(0.78 0.16 145)' : 'oklch(0.80 0.10 15)' }}>
                                {savings.savingText}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--fg-dim)' }}>-</span>
                            )}
                          </td>

                          {/* Engine badge */}
                          <td style={{ padding: '12px 16px' }}>
                            {item.status === 'success' ? (
                              <span style={{ 
                                color: item.engine === 'native' ? 'oklch(0.78 0.16 145)' : 'oklch(0.68 0.18 265)',
                                fontSize: 11 
                              }} className="mono uppercase">
                                {item.engine === 'native' ? 'Native ⚡' : 'Wasm 🛠️'}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--fg-dim)' }}>-</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 8 }}>
                              {item.status === 'success' && (
                                <>
                                  <button
                                    onClick={() => setCompareItem(item)}
                                    className="reset"
                                    style={{
                                      padding: '4px 8px', borderRadius: 4, background: 'var(--bg-elev-2)',
                                      border: '1px solid var(--border)', color: 'white', fontSize: 11, cursor: 'pointer'
                                    }}
                                  >
                                    Compare
                                  </button>
                                  <button
                                    onClick={() => handleDownloadSingle(item, idx)}
                                    className="reset"
                                    style={{
                                      padding: '4px 10px', borderRadius: 4,
                                      background: 'oklch(0.70 0.16 25 / 0.15)', border: '1px solid oklch(0.70 0.16 25 / 0.2)',
                                      color: 'oklch(0.70 0.16 25)', fontSize: 11, fontWeight: 600, cursor: 'pointer'
                                    }}
                                  >
                                    Save
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleRemoveFile(item.id)}
                                disabled={convertingActive}
                                className="reset"
                                style={{
                                  padding: 5, borderRadius: 4, background: 'transparent',
                                  color: 'var(--fg-dim)', cursor: convertingActive ? 'not-allowed' : 'pointer'
                                }}
                                title="Remove File"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Control Panel */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'oklch(0.12 0.002 250 / 0.3)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 20px',
              marginTop: 10,
              flexWrap: 'wrap',
              gap: 16,
            }}>
              <div>
                {pendingCount > 0 ? (
                  <span style={{ fontSize: 13, color: 'var(--fg-subtle)' }}>
                    🚀 Ready to convert <strong style={{ color: 'white' }}>{pendingCount}</strong> pending images.
                  </span>
                ) : (
                  <span style={{ fontSize: 13, color: 'oklch(0.78 0.16 145)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={14} /> Converted batch successfully!
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
                      padding: '10px 22px', borderRadius: 8,
                      background: 'oklch(0.70 0.16 25)', border: '1px solid oklch(0.70 0.16 25 / 0.1)',
                      color: 'white', fontWeight: 600, fontSize: 13,
                      cursor: convertingActive ? 'not-allowed' : 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      boxShadow: '0 4px 12px oklch(0.60 0.15 25 / 0.25)',
                    }}
                  >
                    {convertingActive ? (
                      <>
                        <Loader size={13} className="spin" />
                        Decoding and converting ({convertingCount} left)...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={13} /> Convert Images
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
                      padding: '10px 22px', borderRadius: 8,
                      background: 'linear-gradient(180deg, oklch(0.72 0.18 25), oklch(0.62 0.20 25))',
                      color: 'white', fontWeight: 600, fontSize: 13,
                      cursor: zipping ? 'not-allowed' : 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      boxShadow: '0 4px 14px oklch(0.60 0.15 25 / 0.3)',
                    }}
                  >
                    {zipping ? (
                      <>
                        <Loader size={13} className="spin" />
                        Archiving...
                      </>
                    ) : (
                      <>
                        <Download size={13} /> Download All (ZIP)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Interactive FAQ Block Accordion */}
      <div style={{
        marginTop: 48,
        background: 'oklch(0.16 0.006 250 / 0.4)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '24px 28px',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'white', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <HelpCircle size={18} style={{ color: tintFg(activeHue) }} /> Frequently Asked Questions
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              q: "How does the client-side WebAssembly conversion work?",
              a: "When you drag and drop HEIC photos, this page dynamically loads a high-performance WebAssembly compilation of libheif (heic-to) directly inside your web browser. This parses and decodes the image data locally on your device without transmitting any data over the internet."
            },
            {
              q: "Are my photos uploaded to any servers?",
              a: "No! All image conversions in the web tool run 100% locally inside your web browser. No private photo data ever leaves your device. This keeps your processing entirely secure and maintains a $0.00 hosting footprint for our system."
            },
            {
              q: "What is the difference between converting to JPG and PNG?",
              a: "JPG uses lossy compression (visually lossless at our 95% quality rating) which produces much smaller file sizes. PNG is a lossless format that preserves transparency and original details but results in larger file sizes. Choose JPG for typical photos and PNG for graphics or designs requiring lossless precision."
            },
            {
              q: "Do you offer a developer API for programmatic conversion?",
              a: "Yes! Developer plans include credentials to access our high-speed, load-balanced API route /api/v1/convert-image. This route runs C-compiled image processing pipelines inside secure sandboxed CPU containers to convert large volumes of images in milliseconds."
            }
          ].map((faq, idx) => (
            <div 
              key={idx} 
              style={{ 
                borderBottom: '1px solid var(--border)', 
                paddingBottom: 12 
              }}
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="reset"
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', cursor: 'pointer', textAlign: 'left', color: 'white', fontWeight: 500,
                  fontSize: 14
                }}
              >
                <span>{faq.q}</span>
                {faqOpen[idx] ? <ChevronUp size={16} style={{ color: 'var(--fg-dim)' }} /> : <ChevronDown size={16} style={{ color: 'var(--fg-dim)' }} />}
              </button>
              
              {faqOpen[idx] && (
                <div style={{ 
                  marginTop: 6, fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5,
                  animation: 'slideDownFaq 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                  <style>{`
                    @keyframes slideDownFaq {
                      from { opacity: 0; transform: translateY(-5px); }
                      to { opacity: 1; transform: translateY(0); }
                    }
                  `}</style>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Before/After Visual Comparison Modal */}
      {compareItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'oklch(0.06 0.002 250 / 0.9)', backdropFilter: 'blur(20px)',
          zIndex: 100000, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
          padding: 24,
        }} className="fade-in">
          
          {/* Header Action Bar */}
          <div style={{
            width: '100%', maxWidth: 960, display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 20, borderBottom: '1px solid oklch(1 0 0 / 0.1)',
            paddingBottom: 12,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'white', fontSize: 15, fontWeight: 600 }}>{compareItem.name}</span>
              <span style={{ color: 'var(--fg-dim)', fontSize: 11.5 }} className="mono">Interactive Comparison View</span>
            </div>
            <button
              onClick={() => setCompareItem(null)}
              className="reset"
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'oklch(1 0 0 / 0.08)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: '1px solid oklch(1 0 0 / 0.15)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'oklch(1 0 0 / 0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'oklch(1 0 0 / 0.08)'}
            >
              <X size={16} />
            </button>
          </div>

          {/* Comparison Zone */}
          <div style={{
            flex: 1, width: '100%', maxWidth: 960, maxHeight: 'calc(100% - 140px)',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20, alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            
            {/* Left Column: Original Info */}
            <div style={{
              background: 'oklch(0.12 0.004 250 / 0.4)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 16, height: '100%', justifyContent: 'center'
            }}>
              <span className="mono" style={{ fontSize: 11, color: tintFg(activeHue), background: tint(activeHue), padding: '3px 8px', borderRadius: 4 }}>
                ORIGINAL HEIC SOURCE
              </span>
              <div style={{
                width: 160, height: 160, borderRadius: 10, background: 'oklch(0.08 0.002 250 / 0.5)',
                border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--fg-muted)'
              }}>
                <ImageIcon size={44} />
                <span className="mono" style={{ fontSize: 11 }}>HEIC Format</span>
              </div>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--fg-muted)' }} className="mono uppercase">File Size</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'white' }} className="mono">{formatSize(compareItem.originalSize)}</span>
              </div>
            </div>

            {/* Right Column: Converted JPG/PNG */}
            <div style={{
              background: 'oklch(0.12 0.004 250 / 0.4)', border: '1px solid oklch(0.78 0.16 145 / 0.25)',
              borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 16, height: '100%', justifyContent: 'center'
            }}>
              <span className="mono" style={{ fontSize: 11, color: 'oklch(0.78 0.16 145)', background: 'oklch(0.78 0.16 145 / 0.1)', padding: '3px 8px', borderRadius: 4 }}>
                CONVERTED {targetFormat.toUpperCase()}
              </span>
              
              {compareItem.convertedUrl ? (
                <div style={{
                  width: 220, height: 160, borderRadius: 10, overflow: 'hidden',
                  border: '1px solid var(--border)', boxShadow: '0 8px 24px oklch(0 0 0 / 0.3)'
                }}>
                  <img
                    src={compareItem.convertedUrl}
                    alt="Converted Preview Large"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#09090b' }}
                  />
                </div>
              ) : (
                <div style={{ width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader className="spin" size={24} />
                </div>
              )}

              <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--fg-muted)' }} className="mono uppercase">File Size</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'white' }} className="mono">{formatSize(compareItem.convertedSize || 0)}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--fg-muted)' }} className="mono uppercase">Result</span>
                  <span style={{ 
                    fontSize: 15, 
                    fontWeight: 700, 
                    color: calculateSavings(compareItem.originalSize, compareItem.convertedSize)?.isSmaller ? 'oklch(0.78 0.16 145)' : 'oklch(0.80 0.10 15)' 
                  }} className="mono">
                    {calculateSavings(compareItem.originalSize, compareItem.convertedSize)?.savingText || '-'}
                  </span>
                </div>
              </div>
            </div>

          </div>
          
          {/* Footer Navigation Bar */}
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button
              onClick={() => {
                const a = document.createElement('a');
                a.href = compareItem.convertedUrl!;
                a.download = getOutputFilename(compareItem, 0, files.length);
                a.click();
              }}
              className="reset"
              style={{
                padding: '10px 24px', borderRadius: 8, background: 'white', color: 'black',
                fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 12px oklch(0 0 0 / 0.15)',
              }}
            >
              <Download size={14} /> Download Converted File
            </button>
            <button
              onClick={() => setCompareItem(null)}
              className="reset"
              style={{
                padding: '10px 20px', borderRadius: 8, background: 'oklch(1 0 0 / 0.08)',
                border: '1px solid oklch(1 0 0 / 0.15)', color: 'white',
                fontWeight: 500, fontSize: 13, cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>

        </div>
      )}

      {/* Embedded CSS Animations */}
      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.3; }
          100% { transform: scale(1.05); opacity: 0.6; }
        }
        .hover-scale-subtle:hover {
          background: oklch(0.12 0.004 250 / 0.4) !important;
          border-color: oklch(0.70 0.16 25 / 0.4) !important;
        }
        .hover-card-asset:hover {
          background: oklch(0.12 0.004 250 / 0.5) !important;
          border-color: oklch(0.70 0.16 25 / 0.3) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px oklch(0 0 0 / 0.2);
        }
        .hover-card-asset:hover .overlay-preview-actions {
          opacity: 1 !important;
        }
        .spin {
          animation: spin 1.2s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
