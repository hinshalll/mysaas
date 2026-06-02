"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Download, Loader, LayoutGrid, Plus, CheckCircle, XCircle, RefreshCw, Trash2,
  List, HelpCircle, ChevronDown, ChevronUp, Image as ImageIcon, X, Edit2, FileDown,
  Lock as LockIcon
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
  const initialFormat = (initialSlug === 'heic-to-png') ? 'png' : 'jpg';
  
  const [targetFormat, setTargetFormat] = useState<'jpg' | 'png'>(initialFormat);
  const [customName, setCustomName] = useState('');
  const [files, setFiles] = useState<FileState[]>([]);
  const [convertingActive, setConvertingActive] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Collapsible FAQ state
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeHue = tool.hue ?? 25; // Warm orange/coral (25)

  // Enforce plan limits
  const isGuest = !sessionUser || sessionUser.is_anonymous;
  const isPaid = userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin';
  
  const maxBatchCount = isPaid ? 100 : (isGuest ? 3 : 10);
  const maxFileSizeMb = isPaid ? 100 : (isGuest ? 10 : 20);
  const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;

  const isHeicNativelySupported = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    const isSafari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android');
    const isIOS = /ipad|iphone|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return isSafari || isIOS;
  };

  useEffect(() => {
    if (initialSlug === 'heic-to-png') {
      setTargetFormat('png');
    } else {
      setTargetFormat('jpg');
    }
  }, [initialSlug]);

  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
      });
    };
  }, [files]);

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

  const getOutputFilename = (item: FileState, index: number, total: number) => {
    const extension = targetFormat;
    const base = item.name.trim() || 'unnamed';
    
    if (customName.trim()) {
      if (total === 1) {
        return `${customName.trim()}.${extension}`;
      }
      return `${customName.trim()}_${index + 1}.${extension}`;
    }
    
    return `${base}.${extension}`;
  };

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

  const decodeWasm = async (file: File, format: 'jpg' | 'png'): Promise<Blob> => {
    const { heicTo } = await import('heic-to');
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'png' ? undefined : 0.95;
    
    return await heicTo({
      blob: file,
      type: mimeType,
      quality: quality
    });
  };

  const handleConvertAll = async () => {
    const validPendingFiles = files.filter(f => f.status === 'pending');
    if (validPendingFiles.length === 0) return;

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
  
  // FIX: remainingCount counts pending + currently converting files to show correct "X left" count
  const remainingCount = files.filter(f => f.status === 'pending' || f.status === 'converting').length;

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div style={{
      maxWidth: 1240, margin: '0 auto',
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

      {/* Two Column Layout Panel - Perfectly Consistent with SaaS style */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: 24,
        alignItems: 'start',
      }} className="tools-split-layout">
        
        {/* Left Side: Upload & Configurations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Upload card */}
          <div style={{
            background: 'oklch(0.16 0.006 250 / 0.7)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '20px 24px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-dim)' }} className="mono uppercase">Upload Photos</span>
              {files.length > 0 && (
                <span className="mono" style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>
                  Total batch size: {formatSize(files.reduce((acc, f) => acc + f.originalSize, 0))}
                </span>
              )}
            </div>

            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%', height: 160, borderRadius: 10,
                border: `2px dashed ${isDragOver ? tintFg(activeHue) : 'var(--border)'}`,
                background: isDragOver ? tint(activeHue, 0.18, 0.04, 0.06) : 'oklch(0.12 0.004 250)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s',
                boxSizing: 'border-box', padding: 16, textAlign: 'center',
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
              <FileDown size={30} style={{ color: isDragOver ? tintFg(activeHue) : 'var(--fg-dim)', marginBottom: 10 }} />
              <span style={{ fontSize: 13.5, fontWeight: 500, color: 'white', display: 'block', marginBottom: 4 }}>
                {files.length > 0 ? `📄 ${files.length} Photo(s) Loaded` : 'Drag & drop HEIC / HEIF photos here'}
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>
                {files.length > 0 ? 'Click here to add more photos' : 'or click to browse local files'}
              </span>
            </div>
          </div>

          {/* Settings card */}
          <div style={{
            background: 'oklch(0.16 0.006 250 / 0.7)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '20px 24px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-dim)' }} className="mono uppercase">Configuration</span>

            {/* Target Output Format Selection */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--fg-subtle)', marginBottom: 8 }} className="mono uppercase">Target Format</label>
              <div style={{ display: 'flex', gap: 6, background: 'oklch(0.12 0.004 250)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setTargetFormat('jpg')}
                  disabled={convertingActive || isAllConverted}
                  className="reset mono"
                  style={{
                    flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                    background: targetFormat === 'jpg' ? tint(activeHue) : 'transparent',
                    color: targetFormat === 'jpg' ? tintFg(activeHue) : 'var(--fg-muted)',
                    cursor: (convertingActive || isAllConverted) ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
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
                    background: targetFormat === 'png' ? tint(activeHue) : 'transparent',
                    color: targetFormat === 'png' ? tintFg(activeHue) : 'var(--fg-muted)',
                    cursor: (convertingActive || isAllConverted) ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  Convert to PNG
                </button>
              </div>
            </div>

            {/* Batch Renaming configuration */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--fg-subtle)', marginBottom: 8 }} className="mono uppercase">Batch Rename Template (Optional)</label>
              <input
                type="text"
                placeholder="Leave blank to keep original file names..."
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                disabled={convertingActive}
                style={{
                  width: '100%', padding: '10px 14px', background: 'oklch(0.12 0.004 250)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  color: 'white', fontSize: 12.5, outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = tintFg(activeHue)}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>

          {/* Action buttons under config */}
          {pendingCount > 0 && (
            <button
              onClick={handleConvertAll}
              disabled={convertingActive}
              className="reset"
              style={{
                width: '100%', padding: '14px', borderRadius: 10,
                background: tint(activeHue),
                border: `1px solid ${tintBorder(activeHue)}`,
                color: tintFg(activeHue),
                fontWeight: 600, fontSize: 14,
                cursor: convertingActive ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => { if (!convertingActive) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { if (!convertingActive) e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {convertingActive ? (
                <>
                  <Loader size={15} className="spin" />
                  Converting ({remainingCount} left)...
                </>
              ) : (
                <>
                  <RefreshCw size={15} /> Convert Images
                </>
              )}
            </button>
          )}
        </div>

        {/* Right Side: Output Queue & Visual Listing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Main card wrapper for files output list */}
          <div style={{
            background: 'oklch(0.16 0.006 250 / 0.7)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '20px 24px',
            minHeight: 280,
            display: 'flex',
            flexDirection: 'column',
          }}>
            
            {/* Header with list layout toggle controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-dim)' }} className="mono uppercase">CONVERSION QUEUE</span>
              
              {files.length > 0 && (
                <div style={{ display: 'inline-flex', gap: 4, background: 'oklch(0.12 0.004 250)', padding: 3, borderRadius: 6, border: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className="reset"
                    style={{
                      padding: 6, borderRadius: 4,
                      background: viewMode === 'grid' ? 'var(--bg-elev-2)' : 'transparent',
                      color: viewMode === 'grid' ? 'white' : 'var(--fg-muted)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}
                    title="Grid View"
                  >
                    <LayoutGrid size={13} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className="reset"
                    style={{
                      padding: 6, borderRadius: 4,
                      background: viewMode === 'list' ? 'var(--bg-elev-2)' : 'transparent',
                      color: viewMode === 'list' ? 'white' : 'var(--fg-muted)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}
                    title="List View"
                  >
                    <List size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Empty state: prompt to upload on the left */}
            {files.length === 0 ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', color: 'var(--fg-dim)', padding: 40, border: '1.5px dashed var(--border)',
                borderRadius: 10, background: 'oklch(0.12 0.004 250 / 0.2)'
              }}>
                <ImageIcon size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-muted)', display: 'block', marginBottom: 4 }}>Queue is empty</span>
                <span style={{ fontSize: 12, color: 'var(--fg-subtle)', maxWidth: 280 }}>
                  Upload HEIC / HEIF files in the upload zone on the left to start.
                </span>
              </div>
            ) : (
              
              /* Render file list */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* 1. Render files in Grid View */}
                {viewMode === 'grid' && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 12,
                  }}>
                    {files.map((item, idx) => {
                      const savings = calculateSavings(item.originalSize, item.convertedSize);
                      return (
                        <div
                          key={item.id}
                          style={{
                            background: 'oklch(0.12 0.004 250)',
                            border: item.status === 'success' 
                              ? '1px solid oklch(0.78 0.16 145 / 0.2)' 
                              : item.status === 'size_exceeded' || item.status === 'error'
                                ? '1px solid oklch(0.80 0.10 15 / 0.2)'
                                : '1px solid var(--border)',
                            borderRadius: 10,
                            padding: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                          }}
                        >
                          {/* Close/Remove button */}
                          <button
                            onClick={() => handleRemoveFile(item.id)}
                            disabled={convertingActive}
                            style={{
                              position: 'absolute', top: 6, right: 6, zIndex: 10,
                              padding: 4, borderRadius: 4, background: 'oklch(0.06 0.002 250 / 0.65)',
                              border: '1px solid var(--border)', color: 'oklch(0.70 0.12 15)', 
                              cursor: convertingActive ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center'
                            }}
                            className="reset"
                          >
                            <X size={10} />
                          </button>

                          {/* Thumbnail */}
                          <div style={{
                            height: 100, borderRadius: 6, background: 'oklch(0.08 0.002 250 / 0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', position: 'relative', marginBottom: 8,
                            border: '1px solid var(--border)',
                          }}>
                            {item.status === 'success' && item.convertedUrl ? (
                              <img
                                src={item.convertedUrl}
                                alt="Converted preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : item.status === 'converting' ? (
                              <Loader size={16} className="spin" style={{ color: tintFg(activeHue) }} />
                            ) : item.status === 'size_exceeded' ? (
                              <LockIcon size={14} style={{ color: 'oklch(0.80 0.10 15)' }} />
                            ) : item.status === 'error' ? (
                              <XCircle size={14} style={{ color: 'oklch(0.80 0.10 15)' }} />
                            ) : (
                              <ImageIcon size={18} style={{ color: 'var(--fg-dim)' }} />
                            )}
                            
                            {/* Engine Badge */}
                            {item.status === 'success' && (
                              <span className="mono" style={{
                                position: 'absolute', bottom: 4, left: 4, fontSize: 8,
                                padding: '1px 3.5px', borderRadius: 3,
                                background: item.engine === 'native' ? 'oklch(0.70 0.16 145 / 0.85)' : 'oklch(0.68 0.18 265 / 0.85)',
                                color: 'white',
                              }}>
                                {item.engine === 'native' ? 'NATIVE' : 'WASM'}
                              </span>
                            )}
                          </div>

                          {/* Info & Inline Renaming */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                            {item.isEditingName ? (
                              <input
                                type="text"
                                value={item.name}
                                onChange={e => handleRenameFile(item.id, e.target.value)}
                                onBlur={() => toggleRenameMode(item.id, false)}
                                onKeyDown={e => { if (e.key === 'Enter') toggleRenameMode(item.id, false); }}
                                autoFocus
                                style={{
                                  width: '100%', padding: '2px 4px', background: 'var(--bg-elev-2)',
                                  border: '1px solid var(--border-strong)', borderRadius: 4,
                                  color: 'white', fontSize: 11.5, outline: 'none'
                                }}
                              />
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div 
                                  onClick={() => { if (!convertingActive) toggleRenameMode(item.id, true); }}
                                  style={{
                                    fontSize: 11.5, fontWeight: 600, color: 'white',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    flex: 1, cursor: convertingActive ? 'default' : 'pointer',
                                  }} 
                                  title="Click to rename"
                                >
                                  {item.name}
                                </div>
                                {!convertingActive && <Edit2 size={9} style={{ color: 'var(--fg-dim)', cursor: 'pointer' }} onClick={() => toggleRenameMode(item.id, true)} />}
                              </div>
                            )}
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', fontSize: 10 }}>
                              <span style={{ color: 'var(--fg-subtle)' }} className="mono">{formatSize(item.originalSize)}</span>
                              {item.status === 'success' && item.convertedSize && (
                                <span style={{ color: 'oklch(0.78 0.16 145)', fontWeight: 600 }} className="mono">➔ {formatSize(item.convertedSize)}</span>
                              )}
                            </div>
                            
                            {item.status === 'success' && savings?.isSmaller && (
                              <span style={{ fontSize: 9, color: 'oklch(0.78 0.16 145)', fontWeight: 500, alignSelf: 'flex-end' }} className="mono">
                                ({savings.savingText})
                              </span>
                            )}
                          </div>

                          {/* Save Single Button */}
                          {item.status === 'success' && (
                            <button
                              onClick={() => handleDownloadSingle(item, idx)}
                              className="reset mono"
                              style={{
                                width: '100%', padding: '5px 0', fontSize: 10.5, fontWeight: 600, borderRadius: 4,
                                background: tint(activeHue, 0.15, 0.04, 0.06), border: `1px solid ${tintBorder(activeHue)}`,
                                color: tintFg(activeHue), cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8
                              }}
                            >
                              <Download size={10} /> Save Single
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Render files in List View */}
                {viewMode === 'list' && (
                  <div style={{
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'oklch(0.14 0.005 250 / 0.5)' }}>
                          <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--fg-dim)' }} className="mono uppercase">Name</th>
                          <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--fg-dim)' }} className="mono uppercase">Original</th>
                          <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--fg-dim)' }} className="mono uppercase">Converted</th>
                          <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--fg-dim)' }} className="mono uppercase">Savings</th>
                          <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--fg-dim)', textAlign: 'right' }} className="mono uppercase">Actions</th>
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
                                background: item.status === 'converting' ? 'oklch(0.70 0.16 25 / 0.03)' : 'transparent',
                              }}
                            >
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{
                                    width: 24, height: 24, borderRadius: 4, background: 'var(--bg-elev-1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                                  }}>
                                    {item.status === 'success' && item.convertedUrl ? (
                                      <img src={item.convertedUrl} alt="Mini preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <ImageIcon size={12} style={{ color: 'var(--fg-dim)' }} />
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
                                        padding: '1px 4px', background: 'var(--bg-elev-2)',
                                        border: '1px solid var(--border-strong)', borderRadius: 4,
                                        color: 'white', fontSize: 12, outline: 'none'
                                      }}
                                    />
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <span 
                                        onClick={() => { if (!convertingActive) toggleRenameMode(item.id, true); }}
                                        style={{ color: 'white', fontWeight: 500, cursor: convertingActive ? 'default' : 'pointer' }}
                                      >
                                        {item.name}
                                      </span>
                                      {!convertingActive && <Edit2 size={10} style={{ color: 'var(--fg-dim)', cursor: 'pointer' }} onClick={() => toggleRenameMode(item.id, true)} />}
                                    </div>
                                  )}
                                </div>
                              </td>
                              
                              <td style={{ padding: '10px 14px', color: 'var(--fg-subtle)' }} className="mono">
                                {formatSize(item.originalSize)}
                              </td>
                              
                              <td style={{ padding: '10px 14px' }}>
                                {item.status === 'success' && item.convertedSize ? (
                                  <span style={{ color: 'white', fontWeight: 600 }} className="mono">{formatSize(item.convertedSize)}</span>
                                ) : item.status === 'converting' ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: tintFg(activeHue) }}>
                                    <Loader size={10} className="spin" />
                                    <span style={{ fontSize: 10 }}>Converting...</span>
                                  </div>
                                ) : item.status === 'error' ? (
                                  <span style={{ color: 'oklch(0.80 0.10 15)' }} className="mono">Failed</span>
                                ) : (
                                  <span style={{ color: 'var(--fg-dim)' }} className="mono">-</span>
                                )}
                              </td>
                              
                              <td style={{ padding: '10px 14px' }} className="mono">
                                {item.status === 'success' && savings?.isSmaller ? (
                                  <span style={{ color: 'oklch(0.78 0.16 145)' }}>{savings.savingText}</span>
                                ) : (
                                  <span style={{ color: 'var(--fg-dim)' }}>-</span>
                                )}
                              </td>
                              
                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                                  {item.status === 'success' && (
                                    <button
                                      onClick={() => handleDownloadSingle(item, idx)}
                                      className="reset"
                                      style={{
                                        padding: '3px 8px', borderRadius: 4,
                                        background: tint(activeHue, 0.15, 0.04, 0.06), border: `1px solid ${tintBorder(activeHue)}`,
                                        color: tintFg(activeHue), fontSize: 11, fontWeight: 600, cursor: 'pointer'
                                      }}
                                    >
                                      Save
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRemoveFile(item.id)}
                                    disabled={convertingActive}
                                    className="reset"
                                    style={{
                                      padding: 4, borderRadius: 4, background: 'transparent',
                                      color: 'var(--fg-dim)', cursor: convertingActive ? 'not-allowed' : 'pointer',
                                      display: 'flex', alignItems: 'center'
                                    }}
                                    title="Remove File"
                                  >
                                    <Trash2 size={12} />
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

                {/* Batch Actions & ZIP Download Status */}
                {successFiles.length > 0 && isAllConverted && (
                  <div style={{
                    marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'oklch(0.12 0.002 250 / 0.3)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: 12, flexWrap: 'wrap', gap: 12
                  }}>
                    <span style={{ fontSize: 12.5, color: 'oklch(0.78 0.16 145)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={14} /> Batch complete ({successFiles.length} photos ready)
                    </span>
                    
                    <button
                      onClick={handleDownloadAllZip}
                      disabled={zipping}
                      className="reset"
                      style={{
                        padding: '8px 18px', borderRadius: 6,
                        background: `linear-gradient(180deg, ${tint(activeHue, 0.45, 0.12, 0.9)}, ${tint(activeHue, 0.55, 0.14, 0.9)})`,
                        color: 'white', fontWeight: 600, fontSize: 12.5,
                        cursor: zipping ? 'not-allowed' : 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        boxShadow: `0 4px 12px ${tint(activeHue, 0.5, 0.15, 0.15)}`,
                      }}
                    >
                      {zipping ? (
                        <>
                          <Loader size={12} className="spin" />
                          Archiving...
                        </>
                      ) : (
                        <>
                          <Download size={12} /> Download All (ZIP)
                        </>
                      )}
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>

      </div>

      {/* FAQ Block Accordion */}
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
                  width: '100%', display: 'flex', justifySelf: 'space-between', alignItems: 'center',
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

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.3; }
          100% { transform: scale(1.05); opacity: 0.6; }
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
