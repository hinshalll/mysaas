"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Download, Loader, LayoutGrid, Plus, CheckCircle, XCircle, RefreshCw, Trash2,
  List, HelpCircle, ChevronDown, ChevronUp, Image as ImageIcon, X, Edit2, FileDown, Lock as LockIcon
} from 'lucide-react';

const tint = (hue: number, light: boolean, l?: number, c?: number, alpha?: number) => {
  const finalL = l !== undefined ? (light ? 1 - l * 0.75 : l) : (light ? 0.96 : 0.22);
  const finalC = c !== undefined ? (light ? c * 0.6 : c) : (light ? 0.03 : 0.06);
  const finalA = alpha !== undefined ? alpha : 0.55;
  return `oklch(${finalL} ${finalC} ${hue} / ${finalA})`;
};

const tintFg = (hue: number, light: boolean) => {
  return light ? `oklch(0.42 0.17 ${hue})` : `oklch(0.82 0.13 ${hue})`;
};

const tintBorder = (hue: number, light: boolean) => {
  return light ? `oklch(0.75 0.08 ${hue} / 0.35)` : `oklch(0.45 0.10 ${hue} / 0.45)`;
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
  const [isZipUploaded, setIsZipUploaded] = useState(false);
  
  // Collapsible FAQ state
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true
  });

  // Dynamic theme support
  const [lightMode, setLightMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLightMode(document.documentElement.classList.contains('light'));
    
    const observer = new MutationObserver(() => {
      setLightMode(document.documentElement.classList.contains('light'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  
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

  const handleFilesSelected = async (selectedFiles: FileList) => {
    if (!selectedFiles.length) return;

    const fileList = Array.from(selectedFiles);
    
    // Check if any file is a ZIP
    const zipFiles = fileList.filter(file => file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed');
    const directHeicFiles = fileList.filter(file => {
      const lowerName = file.name.toLowerCase();
      return lowerName.endsWith('.heic') || lowerName.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';
    });

    let incoming: File[] = [...directHeicFiles];

    if (zipFiles.length > 0) {
      setIsZipUploaded(true);
      try {
        const JSZip = (await import('jszip')).default;
        
        for (const zipFile of zipFiles) {
          const zip = new JSZip();
          const contents = await zip.loadAsync(zipFile);
          
          const zipPromises: Promise<File>[] = [];
          contents.forEach((relativePath, zipEntry) => {
            const lowerName = zipEntry.name.toLowerCase();
            if (!zipEntry.dir && (lowerName.endsWith('.heic') || lowerName.endsWith('.heif'))) {
              zipPromises.push(
                zipEntry.async('blob').then(blob => {
                  const baseName = zipEntry.name.split('/').pop() || zipEntry.name;
                  return new File([blob], baseName, { type: 'image/heic' });
                })
              );
            }
          });
          
          const extracted = await Promise.all(zipPromises);
          incoming.push(...extracted);
        }
      } catch (zipErr) {
        console.error("Failed to extract zip file:", zipErr);
        alert("Failed to read the ZIP file. Please ensure it is not corrupted.");
      }
    }

    if (incoming.length === 0) {
      alert("No HEIC or HEIF images found to convert.");
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
    setIsZipUploaded(false);
    setConvertingActive(false);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => {
      const fileToRm = prev.find(f => f.id === id);
      if (fileToRm?.convertedUrl) {
        URL.revokeObjectURL(fileToRm.convertedUrl);
      }
      const filtered = prev.filter(f => f.id !== id);
      if (filtered.length <= 1) {
        setIsZipUploaded(false);
      }
      return filtered;
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

    const usagePassed = await checkAndLogUsage('heic-to-jpg-converter', false);
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
  const remainingCount = files.filter(f => f.status === 'pending' || f.status === 'converting').length;

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div style={{
      maxWidth: 800, margin: '0 auto', // Centered 800px width for a focused, clean dashboard
      padding: '40px 24px 80px',
      position: 'relative',
      zIndex: 1,
    }} className="fade-in">
      
      {/* Background glow shadow matching tool active hue */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        height: '400px',
        background: `radial-gradient(ellipse at center, ${tint(activeHue, lightMode, 0.4, 0.15, 0.15)} 0%, transparent 70%)`,
        zIndex: -1,
        pointerEvents: 'none',
        filter: 'blur(80px)',
      }} />

      {/* Breadcrumbs */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontSize: 11.5, color: 'var(--fg-dim)',
        marginBottom: 14,
      }} className="mono">
        <span style={{ color: tintFg(activeHue, lightMode), fontWeight: 500 }}>{tool.categoryLabel}</span>
        <span style={{ opacity: 0.5 }}>/</span>
        <span style={{ color: 'var(--fg)', opacity: 0.8 }}>{tool.id}</span>
      </div>

      {/* Hero Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 14,
            background: tint(activeHue, lightMode, 0.9, 0.08, 0.9),
            border: `1px solid ${tintBorder(activeHue, lightMode)}`,
            color: tintFg(activeHue, lightMode),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 24px ${tint(activeHue, lightMode, 0.4, 0.1, 0.2)}`,
            transition: 'transform 0.3s ease',
          }}
          className="tool-icon-wrapper"
          >
            <ImageIcon size={24} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.02em' }}>{tool.name}</h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--fg-muted)' }}>{tool.tagline}</p>
          </div>
        </div>
        
        {/* Tier Indicator Tag */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-elev-1)',
          border: '1px solid var(--border)',
          padding: '6px 14px', borderRadius: 9,
          boxShadow: '0 2px 8px var(--shadow-sm)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isPaid ? 'oklch(0.65 0.22 145)' : 'oklch(0.70 0.16 145)' }} />
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>
            Tier: <strong style={{ color: 'var(--fg)' }}>{isPaid ? 'PRO' : (isGuest ? 'GUEST' : 'FREE')}</strong>
          </span>
        </div>
      </div>

      {/* Main Glass Dashboard - Focused Single Column layout */}
      <div style={{
        background: lightMode ? 'oklch(1 0 0 / 0.75)' : 'oklch(0.18 0.005 250 / 0.75)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '32px',
        display: 'flex', flexDirection: 'column', gap: 28,
        boxShadow: '0 20px 40px var(--shadow-lg)',
        backdropFilter: 'blur(20px)',
        transition: 'all 0.3s ease',
      }}>
        
        {/* Drag & Drop Uploader */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%', height: files.length > 0 ? 120 : 240, borderRadius: 14,
            border: `2px dashed ${isDragOver ? tintFg(activeHue, lightMode) : 'var(--border)'}`,
            background: isDragOver 
              ? tint(activeHue, lightMode, 0.12, 0.05, 0.08) 
              : (lightMode ? 'oklch(0.98 0.002 250 / 0.4)' : 'oklch(0.12 0.004 250 / 0.3)'),
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxSizing: 'border-box', padding: 20, textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}
          className="uploader-zone"
        >
          <input
            type="file"
            accept=".heic,.heif,.zip"
            multiple
            ref={fileInputRef}
            onChange={e => handleFilesSelected(e.target.files!)}
            style={{ display: 'none' }}
          />
          <FileDown 
            size={files.length > 0 ? 24 : 36} 
            style={{ 
              color: isDragOver ? tintFg(activeHue, lightMode) : 'var(--fg-muted)', 
              marginBottom: files.length > 0 ? 6 : 14,
              transition: 'transform 0.2s ease',
            }} 
            className="file-down-icon"
          />
          <span style={{ fontSize: files.length > 0 ? 14 : 16, fontWeight: 600, color: 'var(--fg)', display: 'block', marginBottom: files.length > 0 ? 2 : 6 }}>
            {files.length > 0 ? `Selected ${files.length} Photo${files.length > 1 ? 's' : ''}` : 'Drag & drop HEIC / HEIF / ZIP files here'}
          </span>
          <span style={{ fontSize: files.length > 0 ? 12 : 13, color: 'var(--fg-muted)', maxWidth: 480 }}>
            {files.length > 0 
              ? 'Click or drag more files to add to the batch' 
              : `100% private, on-device conversion. Photos never leave your browser. Max file size: ${maxFileSizeMb}MB.`}
          </span>
        </div>

        {/* Configurations Header Settings */}
        {files.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: (files.length > 1 || isZipUploaded) ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr',
            gap: 24,
            borderBottom: '1px solid var(--border)',
            paddingBottom: 28,
            alignItems: 'end',
          }}>
            
            {/* Target Output Format Selection */}
            <div style={{ maxWidth: (files.length > 1 || isZipUploaded) ? undefined : 320, margin: (files.length > 1 || isZipUploaded) ? undefined : '0 auto', width: '100%' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--fg-muted)', marginBottom: 10, letterSpacing: '0.08em', textAlign: (files.length > 1 || isZipUploaded) ? 'left' : 'center' }} className="mono uppercase">Target Format</label>
              <div style={{ 
                display: 'flex', 
                gap: 4, 
                background: lightMode ? 'oklch(0.96 0.002 250)' : 'oklch(0.12 0.004 250 / 0.6)', 
                padding: 4, 
                borderRadius: 10, 
                border: '1px solid var(--border)' 
              }}>
                <button
                  onClick={() => setTargetFormat('jpg')}
                  disabled={convertingActive || isAllConverted}
                  className="reset mono"
                  style={{
                    flex: 1, padding: '10px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8,
                    background: targetFormat === 'jpg' ? (lightMode ? 'white' : tint(activeHue, lightMode, 0.8, 0.08, 0.95)) : 'transparent',
                    color: targetFormat === 'jpg' ? tintFg(activeHue, lightMode) : 'var(--fg-muted)',
                    cursor: (convertingActive || isAllConverted) ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                    boxShadow: targetFormat === 'jpg' ? '0 2px 8px var(--shadow-sm)' : 'none',
                    transition: 'all 0.25s ease',
                  }}
                >
                  Convert to JPG
                </button>
                <button
                  onClick={() => setTargetFormat('png')}
                  disabled={convertingActive || isAllConverted}
                  className="reset mono"
                  style={{
                    flex: 1, padding: '10px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8,
                    background: targetFormat === 'png' ? (lightMode ? 'white' : tint(activeHue, lightMode, 0.8, 0.08, 0.95)) : 'transparent',
                    color: targetFormat === 'png' ? tintFg(activeHue, lightMode) : 'var(--fg-muted)',
                    cursor: (convertingActive || isAllConverted) ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                    boxShadow: targetFormat === 'png' ? '0 2px 8px var(--shadow-sm)' : 'none',
                    transition: 'all 0.25s ease',
                  }}
                >
                  Convert to PNG
                </button>
              </div>
            </div>

            {/* Custom Renaming configuration - only visible for multiple uploads or zip file uploads */}
            {(files.length > 1 || isZipUploaded) && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--fg-muted)', marginBottom: 10, letterSpacing: '0.08em' }} className="mono uppercase">Batch Rename Template (Optional)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Keep original filenames..."
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    disabled={convertingActive}
                    style={{
                      width: '100%', padding: '11px 14px 11px 36px', 
                      background: lightMode ? 'white' : 'oklch(0.12 0.004 250 / 0.6)',
                      border: '1px solid var(--border)', borderRadius: 10,
                      color: 'var(--fg)', fontSize: 13, outline: 'none',
                      boxSizing: 'border-box', transition: 'all 0.2s',
                    }}
                    className="rename-input"
                  />
                  <Edit2 size={13} style={{ position: 'absolute', left: 14, color: 'var(--fg-muted)', opacity: 0.7 }} />
                </div>
              </div>
            )}

          </div>
        )}

        {/* Dashboard Panels */}
        {files.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Header controls with list layout toggle controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--fg-muted)' }} className="mono">
                Selected: <span style={{ color: 'var(--fg)', fontWeight: 600 }}>{files.length}</span> / {maxBatchCount} photos
              </div>
              
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  onClick={handleClear}
                  disabled={convertingActive}
                  className="reset mono"
                  style={{
                    padding: '6px 12px', fontSize: 11, fontWeight: 500, borderRadius: 6,
                    color: 'oklch(0.70 0.12 15)', border: '1px solid oklch(0.70 0.12 15 / 0.15)',
                    cursor: convertingActive ? 'not-allowed' : 'pointer',
                    background: 'oklch(0.12 0.004 250 / 0.2)',
                  }}
                >
                  Clear All
                </button>
                <div style={{ display: 'inline-flex', gap: 4, background: lightMode ? 'oklch(0.96 0.002 250)' : 'oklch(0.12 0.004 250)', padding: 3, borderRadius: 6, border: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className="reset"
                    style={{
                      padding: 6, borderRadius: 4,
                      background: viewMode === 'grid' ? (lightMode ? 'white' : 'var(--bg-elev-2)') : 'transparent',
                      color: viewMode === 'grid' ? 'var(--fg)' : 'var(--fg-muted)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      boxShadow: (viewMode === 'grid' && lightMode) ? '0 1px 4px var(--shadow-sm)' : 'none'
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
                      background: viewMode === 'list' ? (lightMode ? 'white' : 'var(--bg-elev-2)') : 'transparent',
                      color: viewMode === 'list' ? 'var(--fg)' : 'var(--fg-muted)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      boxShadow: (viewMode === 'list' && lightMode) ? '0 1px 4px var(--shadow-sm)' : 'none'
                    }}
                    title="List View"
                  >
                    <List size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* 1. Render files in Grid View */}
            {viewMode === 'grid' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 16,
              }}>
                {files.map((item, idx) => {
                  const savings = calculateSavings(item.originalSize, item.convertedSize);
                  const isConverting = item.status === 'converting';
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: lightMode ? 'white' : 'oklch(0.12 0.004 250 / 0.6)',
                        border: item.status === 'success' 
                          ? '1px solid oklch(0.78 0.16 145 / 0.25)' 
                          : item.status === 'size_exceeded' || item.status === 'error'
                            ? '1px solid oklch(0.80 0.10 15 / 0.25)'
                            : '1px solid var(--border)',
                        borderRadius: 14,
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        transition: 'all 0.25s ease',
                        boxShadow: '0 4px 12px var(--shadow-sm)',
                        overflow: 'hidden',
                      }}
                      className="hover-card-asset"
                    >
                      {/* Close/Remove button */}
                      <button
                        onClick={() => handleRemoveFile(item.id)}
                        disabled={convertingActive}
                        style={{
                          position: 'absolute', top: 8, right: 8, zIndex: 10,
                          padding: 5, borderRadius: '50%', 
                          background: lightMode ? 'oklch(0.95 0 0)' : 'oklch(0.06 0.002 250 / 0.65)',
                          border: '1px solid var(--border)', color: 'oklch(0.70 0.12 15)', 
                          cursor: convertingActive ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center',
                          transition: 'all 0.2s',
                        }}
                        className="reset remove-btn"
                      >
                        <X size={11} />
                      </button>

                      {/* Thumbnail */}
                      <div style={{
                        height: 110, borderRadius: 8, 
                        background: lightMode ? 'oklch(0.96 0.002 250)' : 'oklch(0.08 0.002 250 / 0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', position: 'relative', marginBottom: 12,
                        border: '1px solid var(--border)',
                      }}>
                        {item.status === 'success' && item.convertedUrl ? (
                          <img
                            src={item.convertedUrl}
                            alt="Converted preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : isConverting ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <Loader size={18} className="spin" style={{ color: tintFg(activeHue, lightMode) }} />
                            <span style={{ fontSize: 9.5, color: 'var(--fg-muted)' }} className="mono">Converting...</span>
                          </div>
                        ) : item.status === 'size_exceeded' ? (
                          <LockIcon size={16} style={{ color: 'oklch(0.80 0.10 15)' }} />
                        ) : item.status === 'error' ? (
                          <XCircle size={16} style={{ color: 'oklch(0.80 0.10 15)' }} />
                        ) : (
                          <ImageIcon size={22} style={{ color: 'var(--fg-muted)', opacity: 0.6 }} />
                        )}
                        
                        {/* Engine Badge */}
                        {item.status === 'success' && (
                          <span className="mono" style={{
                            position: 'absolute', bottom: 6, left: 6, fontSize: 8,
                            padding: '2px 5px', borderRadius: 4,
                            background: item.engine === 'native' ? 'oklch(0.70 0.16 145)' : 'oklch(0.68 0.18 265)',
                            color: 'white',
                            fontWeight: 600,
                            boxShadow: '0 2px 4px oklch(0 0 0 / 0.15)',
                          }}>
                            {item.engine === 'native' ? 'NATIVE' : 'WASM'}
                          </span>
                        )}

                        {/* Linear Progress Bar for active conversions */}
                        {isConverting && (
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                            background: 'oklch(0.5 0.1 25 / 0.2)', overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%', width: '60%', 
                              background: tintFg(activeHue, lightMode),
                              animation: 'progressMove 1.5s infinite linear',
                            }} />
                          </div>
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
                              width: '100%', padding: '3px 6px', 
                              background: lightMode ? 'white' : 'var(--bg-elev-2)',
                              border: `1px solid ${tintFg(activeHue, lightMode)}`, borderRadius: 6,
                              color: 'var(--fg)', fontSize: 12, outline: 'none',
                              boxShadow: `0 0 0 2px ${tint(activeHue, lightMode, 0.4, 0.1, 0.25)}`
                            }}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div 
                              onClick={() => { if (!convertingActive) toggleRenameMode(item.id, true); }}
                              style={{
                                fontSize: 12, fontWeight: 600, color: 'var(--fg)',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                flex: 1, cursor: convertingActive ? 'default' : 'pointer',
                              }} 
                              title="Click to rename"
                            >
                              {item.name}
                            </div>
                            {!convertingActive && (
                              <Edit2 
                                size={10} 
                                style={{ color: 'var(--fg-muted)', cursor: 'pointer', opacity: 0.6 }} 
                                onClick={() => toggleRenameMode(item.id, true)} 
                              />
                            )}
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: 10.5 }}>
                          <span style={{ color: 'var(--fg-muted)' }} className="mono">{formatSize(item.originalSize)}</span>
                          {item.status === 'success' && item.convertedSize && (
                            <span style={{ color: 'var(--fg)', fontWeight: 600 }} className="mono">➔ {formatSize(item.convertedSize)}</span>
                          )}
                        </div>
                        
                        {item.status === 'success' && savings && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                            <span style={{ 
                              fontSize: 9.5, 
                              color: savings.isSmaller ? 'oklch(0.70 0.16 145)' : 'oklch(0.70 0.12 15)', 
                              fontWeight: 700,
                              background: savings.isSmaller ? 'oklch(0.70 0.16 145 / 0.12)' : 'oklch(0.70 0.12 15 / 0.12)',
                              padding: '2px 6px',
                              borderRadius: 4,
                            }} className="mono">
                              {savings.isSmaller ? `-${savings.percentage}%` : `+${Math.abs(Number(savings.percentage))}%`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Save Single Button */}
                      {item.status === 'success' && (
                        <button
                          onClick={() => handleDownloadSingle(item, idx)}
                          className="reset mono"
                          style={{
                            width: '100%', padding: '6px 0', fontSize: 11, fontWeight: 600, borderRadius: 6,
                            background: tint(activeHue, lightMode, 0.9, 0.08, 0.9), border: `1px solid ${tintBorder(activeHue, lightMode)}`,
                            color: tintFg(activeHue, lightMode), cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10,
                            transition: 'all 0.2s',
                          }}
                        >
                          <Download size={11} /> Save Image
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
                borderRadius: 14,
                overflow: 'hidden',
                background: lightMode ? 'white' : 'oklch(0.12 0.004 250 / 0.3)',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: lightMode ? 'oklch(0.97 0 0)' : 'oklch(0.14 0.005 250 / 0.5)' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--fg-muted)' }} className="mono uppercase">Name</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--fg-muted)' }} className="mono uppercase">Original</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--fg-muted)' }} className="mono uppercase">Converted</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--fg-muted)' }} className="mono uppercase">Savings</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--fg-muted)', textAlign: 'right' }} className="mono uppercase">Actions</th>
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
                            background: item.status === 'converting' ? tint(activeHue, lightMode, 0.95, 0.02, 0.04) : 'transparent',
                            transition: 'background 0.2s',
                          }}
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: 6, 
                                background: lightMode ? 'oklch(0.95 0 0)' : 'var(--bg-elev-1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                border: '1px solid var(--border)',
                              }}>
                                {item.status === 'success' && item.convertedUrl ? (
                                  <img src={item.convertedUrl} alt="Mini preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <ImageIcon size={14} style={{ color: 'var(--fg-muted)', opacity: 0.6 }} />
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
                                    padding: '2px 6px', background: lightMode ? 'white' : 'var(--bg-elev-2)',
                                    border: `1px solid ${tintFg(activeHue, lightMode)}`, borderRadius: 6,
                                    color: 'var(--fg)', fontSize: 12.5, outline: 'none'
                                  }}
                                />
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span 
                                    onClick={() => { if (!convertingActive) toggleRenameMode(item.id, true); }}
                                    style={{ color: 'var(--fg)', fontWeight: 500, cursor: convertingActive ? 'default' : 'pointer' }}
                                  >
                                    {item.name}
                                  </span>
                                  {!convertingActive && (
                                    <Edit2 
                                      size={10} 
                                      style={{ color: 'var(--fg-muted)', cursor: 'pointer', opacity: 0.6 }} 
                                      onClick={() => toggleRenameMode(item.id, true)} 
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td style={{ padding: '12px 16px', color: 'var(--fg-muted)' }} className="mono">
                            {formatSize(item.originalSize)}
                          </td>
                          
                          <td style={{ padding: '12px 16px' }}>
                            {item.status === 'success' && item.convertedSize ? (
                              <span style={{ color: 'var(--fg)', fontWeight: 600 }} className="mono">{formatSize(item.convertedSize)}</span>
                            ) : item.status === 'converting' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: tintFg(activeHue, lightMode) }}>
                                <Loader size={12} className="spin" />
                                <span style={{ fontSize: 11 }} className="mono">Converting...</span>
                              </div>
                            ) : item.status === 'error' ? (
                              <span style={{ color: 'oklch(0.80 0.10 15)' }} className="mono">Failed</span>
                            ) : (
                              <span style={{ color: 'var(--fg-muted)', opacity: 0.5 }} className="mono">-</span>
                            )}
                          </td>
                          
                          <td style={{ padding: '12px 16px' }} className="mono">
                            {item.status === 'success' && savings ? (
                              <span style={{ 
                                color: savings.isSmaller ? 'oklch(0.70 0.16 145)' : 'oklch(0.70 0.12 15)',
                                fontWeight: 600,
                                background: savings.isSmaller ? 'oklch(0.70 0.16 145 / 0.1)' : 'oklch(0.70 0.12 15 / 0.1)',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 11
                              }}>
                                {savings.isSmaller ? `-${savings.percentage}%` : `+${Math.abs(Number(savings.percentage))}%`}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--fg-muted)', opacity: 0.5 }}>-</span>
                            )}
                          </td>
                          
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                              {item.status === 'success' && (
                                <button
                                  onClick={() => handleDownloadSingle(item, idx)}
                                  className="reset"
                                  style={{
                                    padding: '4px 10px', borderRadius: 6,
                                    background: tint(activeHue, lightMode, 0.9, 0.08, 0.9), border: `1px solid ${tintBorder(activeHue, lightMode)}`,
                                    color: tintFg(activeHue, lightMode), fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                                    transition: 'all 0.2s',
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
                                  padding: 5, borderRadius: 6, background: 'transparent',
                                  color: 'oklch(0.70 0.12 15)', cursor: convertingActive ? 'not-allowed' : 'pointer',
                                  display: 'flex', alignItems: 'center', opacity: 0.7,
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
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

            {/* Conversions Bottom Action Panel */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: lightMode ? 'oklch(0.97 0 0)' : 'oklch(0.12 0.002 250 / 0.3)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '18px 24px',
              marginTop: 12,
              flexWrap: 'wrap',
              gap: 16,
              boxShadow: '0 4px 16px var(--shadow-sm)',
            }}>
              <div>
                {pendingCount > 0 ? (
                  <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
                    🚀 Ready to convert <strong style={{ color: 'var(--fg)' }}>{pendingCount}</strong> pending image{pendingCount > 1 ? 's' : ''}.
                  </span>
                ) : (
                  <span style={{ fontSize: 13, color: 'oklch(0.70 0.16 145)', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                    <CheckCircle size={15} /> All conversions complete ({successFiles.length} photos ready)
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                {pendingCount > 0 && (
                  <button
                    onClick={handleConvertAll}
                    disabled={convertingActive}
                    className="reset"
                    style={{
                      padding: '11px 24px', borderRadius: 10,
                      background: tint(activeHue, lightMode, 0.45, 0.15, 0.95),
                      border: `1px solid ${tintBorder(activeHue, lightMode)}`,
                      color: lightMode ? 'white' : tintFg(activeHue, lightMode),
                      fontWeight: 600, fontSize: 13.5,
                      cursor: convertingActive ? 'not-allowed' : 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      boxShadow: `0 4px 14px ${tint(activeHue, lightMode, 0.5, 0.15, 0.25)}`,
                      transition: 'all 0.25s ease',
                    }}
                  >
                    {convertingActive ? (
                      <>
                        <Loader size={14} className="spin" />
                        Converting ({remainingCount} left)...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} /> Convert Images
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
                      padding: '11px 24px', borderRadius: 10,
                      background: `linear-gradient(180deg, ${tint(activeHue, lightMode, 0.45, 0.15, 0.95)}, ${tint(activeHue, lightMode, 0.55, 0.17, 0.95)})`,
                      color: 'white', fontWeight: 600, fontSize: 13.5,
                      cursor: zipping ? 'not-allowed' : 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      boxShadow: `0 4px 16px ${tint(activeHue, lightMode, 0.5, 0.15, 0.25)}`,
                      transition: 'all 0.25s ease',
                    }}
                  >
                    {zipping ? (
                      <>
                        <Loader size={14} className="spin" />
                        Archiving...
                      </>
                    ) : (
                      <>
                        <Download size={14} /> Download All (ZIP)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* FAQ Block Accordion */}
      <div style={{
        marginTop: 48,
        background: 'var(--bg-elev-1)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: '28px 32px',
        boxShadow: '0 8px 24px var(--shadow-sm)',
      }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--fg)', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <HelpCircle size={19} style={{ color: tintFg(activeHue, lightMode) }} /> Frequently Asked Questions
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            {
              q: "Is it safe to upload my personal photos here?",
              a: "Absolutely. Your files never leave your device. All image conversion happens directly inside your web browser. This means your personal photos are never uploaded to our servers, keeping them 100% private."
            },
            {
              q: "Will my photos lose quality during conversion?",
              a: "No. Our converter extracts the maximum original resolution and color depth from your HEIC files. When converting to JPG, we apply a high-quality compression algorithm that keeps the image looking sharp while significantly reducing file size."
            },
            {
              q: "Should I choose JPG or PNG?",
              a: "We recommend JPG for regular photos and camera shots because it provides a much smaller file size. Choose PNG if you need lossless quality or transparency (like for logos or illustrations)."
            },
            {
              q: "Can I convert multiple images at once?",
              a: "Yes! You can select multiple files or drop a ZIP archive. Free users can batch convert up to 10 images at once, while PRO users enjoy unlimited batch processing up to 100 images per batch with larger file size support."
            }
          ].map((faq, idx) => (
            <div 
              key={idx} 
              style={{ 
                borderBottom: idx === 3 ? 'none' : '1px solid var(--border)', 
                paddingBottom: 14,
                paddingTop: idx === 0 ? 0 : 14,
              }}
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="reset"
                style={{
                  width: '100%', display: 'flex', justifySelf: 'space-between', alignItems: 'center',
                  padding: '6px 0', cursor: 'pointer', textAlign: 'left', color: 'var(--fg)', fontWeight: 600,
                  fontSize: 14.5
                }}
              >
                <span style={{ flex: 1 }}>{faq.q}</span>
                {faqOpen[idx] ? <ChevronUp size={16} style={{ color: 'var(--fg-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--fg-muted)' }} />}
              </button>
              
              {faqOpen[idx] && (
                <div style={{ 
                  marginTop: 8, fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.6,
                  animation: 'slideDownFaq 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                  <style>{`
                    @keyframes slideDownFaq {
                      from { opacity: 0; transform: translateY(-4px); }
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
        .spin {
          animation: spin 1.2s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes progressMove {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .uploader-zone:hover {
          border-color: ${tintFg(activeHue, lightMode)} !important;
          box-shadow: 0 4px 16px ${tint(activeHue, lightMode, 0.5, 0.1, 0.15)};
        }
        .uploader-zone:hover .file-down-icon {
          transform: translateY(-2px);
          color: ${tintFg(activeHue, lightMode)} !important;
        }
        .hover-card-asset:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px var(--shadow-md) !important;
          border-color: ${tintFg(activeHue, lightMode)} !important;
        }
        .rename-input:focus {
          border-color: ${tintFg(activeHue, lightMode)} !important;
          box-shadow: 0 0 0 3px ${tint(activeHue, lightMode, 0.4, 0.1, 0.2)} !important;
        }
        .remove-btn:hover {
          background: oklch(0.80 0.10 15 / 0.15) !important;
          color: oklch(0.70 0.12 15) !important;
        }
        .tool-icon-wrapper:hover {
          transform: rotate(6deg) scale(1.05);
        }
      `}</style>

    </div>
  );
}
