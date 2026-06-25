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
    <div className="max-w-[800px] mx-auto px-6 pt-10 pb-20 relative z-[1] fade-in">
      
      {/* Background glow shadow matching tool active hue */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[400px] -z-10 pointer-events-none blur-[80px]"
        style={{
          background: `radial-gradient(ellipse at center, ${tint(activeHue, lightMode, 0.4, 0.15, 0.15)} 0%, transparent 70%)`,
        }} 
      />

      {/* Breadcrumbs */}
      <div className="inline-flex items-center gap-2 text-[11.5px] text-[var(--fg-dim)] mb-3.5 mono">
        <span className="font-medium" style={{ color: tintFg(activeHue, lightMode) }}>{tool.categoryLabel}</span>
        <span className="opacity-50">/</span>
        <span className="text-[var(--fg)] opacity-80">{tool.id}</span>
      </div>

      {/* Hero Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div 
            className="w-[54px] h-[54px] rounded-[14px] flex items-center justify-center transition-transform duration-300 tool-icon-wrapper"
            style={{
              background: tint(activeHue, lightMode, 0.9, 0.08, 0.9),
              border: `1px solid ${tintBorder(activeHue, lightMode)}`,
              color: tintFg(activeHue, lightMode),
              boxShadow: `0 8px 24px ${tint(activeHue, lightMode, 0.4, 0.1, 0.2)}`,
            }}
          >
            <ImageIcon size={24} strokeWidth={2} />
          </div>
          <div>
            <h1 className="m-0 text-[26px] font-bold text-[var(--fg)] tracking-[-0.02em]">{tool.name}</h1>
            <p className="mt-1 mb-0 mx-0 text-[14px] text-[var(--fg-muted)]">{tool.tagline}</p>
          </div>
        </div>
        
        {/* Tier Indicator Tag */}
        <div className="flex items-center gap-2 bg-[var(--bg-elev-1)] border border-[var(--border)] px-3.5 py-1.5 rounded-[9px] shadow-[0_2px_8px_var(--shadow-sm)]">
          <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-[oklch(0.65_0.22_145)]' : 'bg-[oklch(0.70_0.16_145)]'}`} />
          <span className="mono text-[11.5px] text-[var(--fg-muted)]">
            Tier: <strong className="text-[var(--fg)] font-bold">{isPaid ? 'PRO' : (isGuest ? 'GUEST' : 'FREE')}</strong>
          </span>
        </div>
      </div>

      {/* Main Glass Dashboard - Focused Single Column layout */}
      <div className={`border border-[var(--border)] rounded-[20px] p-8 flex flex-col gap-7 shadow-[0_20px_40px_var(--shadow-lg)] backdrop-blur-[20px] transition-all duration-300 ${lightMode ? 'bg-[oklch(1_0_0/0.75)]' : 'bg-[oklch(0.18_0.005_250/0.75)]'}`}>
        
        {/* Drag & Drop Uploader */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full rounded-[14px] flex flex-col items-center justify-center cursor-pointer box-border p-5 text-center relative overflow-hidden uploader-zone transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${files.length > 0 ? 'h-[120px]' : 'h-[240px]'}`}
          style={{
            border: `2px dashed ${isDragOver ? tintFg(activeHue, lightMode) : 'var(--border)'}`,
            background: isDragOver 
              ? tint(activeHue, lightMode, 0.12, 0.05, 0.08) 
              : (lightMode ? 'oklch(0.98 0.002 250 / 0.4)' : 'oklch(0.12 0.004 250 / 0.3)'),
          }}
        >
          <input
            type="file"
            accept=".heic,.heif,.zip"
            multiple
            ref={fileInputRef}
            onChange={e => handleFilesSelected(e.target.files!)}
            className="hidden"
          />
          <FileDown 
            size={files.length > 0 ? 24 : 36} 
            className="file-down-icon transition-transform duration-200"
            style={{ 
              color: isDragOver ? tintFg(activeHue, lightMode) : 'var(--fg-muted)', 
              marginBottom: files.length > 0 ? 6 : 14,
            }} 
          />
          <span className={`font-semibold text-[var(--fg)] block ${files.length > 0 ? 'text-[14px] mb-0.5' : 'text-[16px] mb-1.5'}`}>
            {files.length > 0 ? `Selected ${files.length} Photo${files.length > 1 ? 's' : ''}` : 'Drag & drop HEIC / HEIF / ZIP files here'}
          </span>
          <span className={`text-[var(--fg-muted)] max-w-[480px] ${files.length > 0 ? 'text-[12px]' : 'text-[13px]'}`}>
            {files.length > 0 
              ? 'Click or drag more files to add to the batch' 
              : `100% private, on-device conversion. Photos never leave your browser. Max file size: ${maxFileSizeMb}MB.`}
          </span>
        </div>

        {/* Configurations Header Settings */}
        {files.length > 0 && (
          <div className="border-b border-[var(--border)] pb-7 items-end" style={{
            display: 'grid',
            gridTemplateColumns: (files.length > 1 || isZipUploaded) ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr',
            gap: 24,
          }}>
            
            {/* Target Output Format Selection */}
            <div className={`w-full ${!(files.length > 1 || isZipUploaded) ? 'max-w-[320px] mx-auto' : ''}`}>
              <label className={`mono uppercase block text-[11px] font-bold text-[var(--fg-muted)] mb-2.5 tracking-[0.08em] ${(files.length > 1 || isZipUploaded) ? 'text-left' : 'text-center'}`}>Target Format</label>
              <div className={`flex gap-1 p-1 rounded-[10px] border border-[var(--border)] ${lightMode ? 'bg-[oklch(0.96_0.002_250)]' : 'bg-[oklch(0.12_0.004_250/0.6)]'}`}>
                <button
                  onClick={() => setTargetFormat('jpg')}
                  disabled={convertingActive || isAllConverted}
                  className={`mono flex-1 px-3.5 py-2.5 text-[12px] font-semibold rounded-lg text-center transition-all duration-250 ${targetFormat === 'jpg' ? 'shadow-[0_2px_8px_var(--shadow-sm)]' : ''} ${(convertingActive || isAllConverted) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{
                    background: targetFormat === 'jpg' ? (lightMode ? 'white' : tint(activeHue, lightMode, 0.8, 0.08, 0.95)) : 'transparent',
                    color: targetFormat === 'jpg' ? tintFg(activeHue, lightMode) : 'var(--fg-muted)',
                  }}
                >
                  Convert to JPG
                </button>
                <button
                  onClick={() => setTargetFormat('png')}
                  disabled={convertingActive || isAllConverted}
                  className={`mono flex-1 px-3.5 py-2.5 text-[12px] font-semibold rounded-lg text-center transition-all duration-250 ${targetFormat === 'png' ? 'shadow-[0_2px_8px_var(--shadow-sm)]' : ''} ${(convertingActive || isAllConverted) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{
                    background: targetFormat === 'png' ? (lightMode ? 'white' : tint(activeHue, lightMode, 0.8, 0.08, 0.95)) : 'transparent',
                    color: targetFormat === 'png' ? tintFg(activeHue, lightMode) : 'var(--fg-muted)',
                  }}
                >
                  Convert to PNG
                </button>
              </div>
            </div>

            {/* Custom Renaming configuration - only visible for multiple uploads or zip file uploads */}
            {(files.length > 1 || isZipUploaded) && (
              <div>
                <label className="mono uppercase block text-[11px] font-bold text-[var(--fg-muted)] mb-2.5 tracking-[0.08em]">Batch Rename Template (Optional)</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Keep original filenames..."
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    disabled={convertingActive}
                    className={`rename-input w-full py-[11px] pr-3.5 pl-[36px] border border-[var(--border)] rounded-[10px] text-[var(--fg)] text-[13px] outline-none box-border transition-all duration-200 ${lightMode ? 'bg-white' : 'bg-[oklch(0.12_0.004_250/0.6)]'}`}
                  />
                  <Edit2 size={13} className="absolute left-3.5 text-[var(--fg-muted)] opacity-70" />
                </div>
              </div>
            )}

          </div>
        )}

        {/* Dashboard Panels */}
        {files.length > 0 && (
          <div className="flex flex-col gap-4">
            
            {/* Header controls with list layout toggle controls */}
            <div className="flex justify-between items-center">
              <div className="mono text-[13px] text-[var(--fg-muted)]">
                Selected: <span className="text-[var(--fg)] font-semibold">{files.length}</span> / {maxBatchCount} photos
              </div>
              
              <div className="flex gap-2.5 items-center">
                <button
                  onClick={handleClear}
                  disabled={convertingActive}
                  className={`mono px-3 py-1.5 text-[11px] font-medium rounded-md text-[oklch(0.70_0.12_15)] border border-[oklch(0.70_0.12_15/0.15)] bg-[oklch(0.12_0.004_250/0.2)] ${convertingActive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  Clear All
                </button>
                <div className={`inline-flex gap-1 p-[3px] rounded-md border border-[var(--border)] ${lightMode ? 'bg-[oklch(0.96_0.002_250)]' : 'bg-[oklch(0.12_0.004_250)]'}`}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded text-[13px] flex items-center cursor-pointer ${viewMode === 'grid' ? (lightMode ? 'bg-white shadow-[0_1px_4px_var(--shadow-sm)] text-[var(--fg)]' : 'bg-[var(--bg-elev-2)] text-[var(--fg)]') : 'bg-transparent text-[var(--fg-muted)]'}`}
                    title="Grid View"
                  >
                    <LayoutGrid size={13} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded text-[13px] flex items-center cursor-pointer ${viewMode === 'list' ? (lightMode ? 'bg-white shadow-[0_1px_4px_var(--shadow-sm)] text-[var(--fg)]' : 'bg-[var(--bg-elev-2)] text-[var(--fg)]') : 'bg-transparent text-[var(--fg-muted)]'}`}
                    title="List View"
                  >
                    <List size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* 1. Render files in Grid View */}
            {viewMode === 'grid' && (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                {files.map((item, idx) => {
                  const savings = calculateSavings(item.originalSize, item.convertedSize);
                  const isConverting = item.status === 'converting';
                  return (
                    <div
                      key={item.id}
                      className="hover-card-asset rounded-[14px] p-3 flex flex-col relative transition-all duration-250 shadow-[0_4px_12px_var(--shadow-sm)] overflow-hidden"
                      style={{
                        background: lightMode ? 'white' : 'oklch(0.12 0.004 250 / 0.6)',
                        border: item.status === 'success' 
                          ? '1px solid oklch(0.78 0.16 145 / 0.25)' 
                          : item.status === 'size_exceeded' || item.status === 'error'
                            ? '1px solid oklch(0.80 0.10 15 / 0.25)'
                            : '1px solid var(--border)',
                      }}
                    >
                      {/* Close/Remove button */}
                      <button
                        onClick={() => handleRemoveFile(item.id)}
                        disabled={convertingActive}
                        className={`remove-btn absolute top-2 right-2 z-10 p-[5px] rounded-full border border-[var(--border)] text-[oklch(0.70_0.12_15)] flex items-center transition-all duration-200 ${convertingActive ? 'cursor-not-allowed' : 'cursor-pointer'} ${lightMode ? 'bg-[oklch(0.95_0_0)]' : 'bg-[oklch(0.06_0.002_250/0.65)]'}`}
                      >
                        <X size={11} />
                      </button>

                      {/* Thumbnail */}
                      <div className={`h-[110px] rounded-lg flex items-center justify-center overflow-hidden relative mb-3 border border-[var(--border)] ${lightMode ? 'bg-[oklch(0.96_0.002_250)]' : 'bg-[oklch(0.08_0.002_250/0.5)]'}`}>
                        {item.status === 'success' && item.convertedUrl ? (
                          <img
                            src={item.convertedUrl}
                            alt="Converted preview"
                            className="w-full h-full object-cover"
                          />
                        ) : isConverting ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader size={18} className="spin" style={{ color: tintFg(activeHue, lightMode) }} />
                            <span className="text-[9.5px] text-[var(--fg-muted)] mono">Converting...</span>
                          </div>
                        ) : item.status === 'size_exceeded' ? (
                          <LockIcon size={16} className="text-[oklch(0.80_0.10_15)]" />
                        ) : item.status === 'error' ? (
                          <XCircle size={16} className="text-[oklch(0.80_0.10_15)]" />
                        ) : (
                          <ImageIcon size={22} className="text-[var(--fg-muted)] opacity-60" />
                        )}
                        
                        {/* Engine Badge */}
                        {item.status === 'success' && (
                          <span className={`mono absolute bottom-1.5 left-1.5 text-[8px] px-[5px] py-[2px] rounded font-semibold text-white shadow-[0_2px_4px_oklch(0_0_0/0.15)] ${item.engine === 'native' ? 'bg-[oklch(0.70_0.16_145)]' : 'bg-[oklch(0.68_0.18_265)]'}`}>
                            {item.engine === 'native' ? 'NATIVE' : 'WASM'}
                          </span>
                        )}

                        {/* Linear Progress Bar for active conversions */}
                        {isConverting && (
                          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[oklch(0.5_0.1_25/0.2)] overflow-hidden">
                            <div className="h-full w-[60%] animate-[progressMove_1.5s_infinite_linear]" style={{
                              background: tintFg(activeHue, lightMode),
                            }} />
                          </div>
                        )}
                      </div>

                      {/* Info & Inline Renaming */}
                      <div className="flex flex-col gap-1 flex-1">
                        {item.isEditingName ? (
                          <input
                            type="text"
                            value={item.name}
                            onChange={e => handleRenameFile(item.id, e.target.value)}
                            onBlur={() => toggleRenameMode(item.id, false)}
                            onKeyDown={e => { if (e.key === 'Enter') toggleRenameMode(item.id, false); }}
                            autoFocus
                            className={`w-full px-1.5 py-[3px] rounded-md text-[var(--fg)] text-[12px] outline-none ${lightMode ? 'bg-white' : 'bg-[var(--bg-elev-2)]'}`}
                            style={{
                              border: `1px solid ${tintFg(activeHue, lightMode)}`,
                              boxShadow: `0 0 0 2px ${tint(activeHue, lightMode, 0.4, 0.1, 0.25)}`
                            }}
                          />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div 
                              onClick={() => { if (!convertingActive) toggleRenameMode(item.id, true); }}
                              className={`text-[12px] font-semibold text-[var(--fg)] whitespace-nowrap overflow-hidden text-ellipsis flex-1 ${convertingActive ? 'cursor-default' : 'cursor-pointer'}`}
                              title="Click to rename"
                            >
                              {item.name}
                            </div>
                            {!convertingActive && (
                              <Edit2 
                                size={10} 
                                className="text-[var(--fg-muted)] cursor-pointer opacity-60"
                                onClick={() => toggleRenameMode(item.id, true)} 
                              />
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-1 text-[10.5px]">
                          <span className="text-[var(--fg-muted)] mono">{formatSize(item.originalSize)}</span>
                          {item.status === 'success' && item.convertedSize && (
                            <span className="text-[var(--fg)] font-semibold mono">➔ {formatSize(item.convertedSize)}</span>
                          )}
                        </div>
                        
                        {item.status === 'success' && savings && (
                          <div className="flex justify-end mt-1">
                            <span className={`mono text-[9.5px] font-bold px-1.5 py-[2px] rounded ${savings.isSmaller ? 'text-[oklch(0.70_0.16_145)] bg-[oklch(0.70_0.16_145/0.12)]' : 'text-[oklch(0.70_0.12_15)] bg-[oklch(0.70_0.12_15/0.12)]'}`}>
                              {savings.isSmaller ? `-${savings.percentage}%` : `+${Math.abs(Number(savings.percentage))}%`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Save Single Button */}
                      {item.status === 'success' && (
                        <button
                          onClick={() => handleDownloadSingle(item, idx)}
                          className="mono w-full py-1.5 text-[11px] font-semibold rounded-md cursor-pointer flex items-center justify-center gap-1.5 mt-2.5 transition-all duration-200"
                          style={{
                            background: tint(activeHue, lightMode, 0.9, 0.08, 0.9), border: `1px solid ${tintBorder(activeHue, lightMode)}`,
                            color: tintFg(activeHue, lightMode),
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
              <div className={`border border-[var(--border)] rounded-[14px] overflow-hidden ${lightMode ? 'bg-white' : 'bg-[oklch(0.12_0.004_250/0.3)]'}`}>
                <table className="w-full border-collapse text-left text-[13px]">
                  <thead>
                    <tr className={`border-b border-[var(--border)] ${lightMode ? 'bg-[oklch(0.97_0_0)]' : 'bg-[oklch(0.14_0.005_250/0.5)]'}`}>
                      <th className="px-4 py-3 font-bold text-[var(--fg-muted)] mono uppercase">Name</th>
                      <th className="px-4 py-3 font-bold text-[var(--fg-muted)] mono uppercase">Original</th>
                      <th className="px-4 py-3 font-bold text-[var(--fg-muted)] mono uppercase">Converted</th>
                      <th className="px-4 py-3 font-bold text-[var(--fg-muted)] mono uppercase">Savings</th>
                      <th className="px-4 py-3 font-bold text-[var(--fg-muted)] mono uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((item, idx) => {
                      const savings = calculateSavings(item.originalSize, item.convertedSize);
                      return (
                        <tr 
                          key={item.id} 
                          className="border-b border-[var(--border)] transition-colors duration-200"
                          style={{ 
                            background: item.status === 'converting' ? tint(activeHue, lightMode, 0.95, 0.02, 0.04) : 'transparent',
                          }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-md flex items-center justify-center overflow-hidden border border-[var(--border)] ${lightMode ? 'bg-[oklch(0.95_0_0)]' : 'bg-[var(--bg-elev-1)]'}`}>
                                {item.status === 'success' && item.convertedUrl ? (
                                  <img src={item.convertedUrl} alt="Mini preview" className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon size={14} className="text-[var(--fg-muted)] opacity-60" />
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
                                  className={`px-1.5 py-0.5 rounded-md text-[var(--fg)] text-[12.5px] outline-none ${lightMode ? 'bg-white' : 'bg-[var(--bg-elev-2)]'}`}
                                  style={{
                                    border: `1px solid ${tintFg(activeHue, lightMode)}`,
                                  }}
                                />
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span 
                                    onClick={() => { if (!convertingActive) toggleRenameMode(item.id, true); }}
                                    className={`text-[var(--fg)] font-medium ${convertingActive ? 'cursor-default' : 'cursor-pointer'}`}
                                  >
                                    {item.name}
                                  </span>
                                  {!convertingActive && (
                                    <Edit2 
                                      size={10} 
                                      className="text-[var(--fg-muted)] cursor-pointer opacity-60"
                                      onClick={() => toggleRenameMode(item.id, true)} 
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-4 py-3 text-[var(--fg-muted)] mono">
                            {formatSize(item.originalSize)}
                          </td>
                          
                          <td className="px-4 py-3">
                            {item.status === 'success' && item.convertedSize ? (
                              <span className="text-[var(--fg)] font-semibold mono">{formatSize(item.convertedSize)}</span>
                            ) : item.status === 'converting' ? (
                              <div className="flex items-center gap-1.5" style={{ color: tintFg(activeHue, lightMode) }}>
                                <Loader size={12} className="spin" />
                                <span className="text-[11px] mono">Converting...</span>
                              </div>
                            ) : item.status === 'error' ? (
                              <span className="text-[oklch(0.80_0.10_15)] mono">Failed</span>
                            ) : (
                              <span className="text-[var(--fg-muted)] opacity-50 mono">-</span>
                            )}
                          </td>
                          
                          <td className="px-4 py-3 mono">
                            {item.status === 'success' && savings ? (
                              <span className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${savings.isSmaller ? 'text-[oklch(0.70_0.16_145)] bg-[oklch(0.70_0.16_145/0.1)]' : 'text-[oklch(0.70_0.12_15)] bg-[oklch(0.70_0.12_15/0.1)]'}`}>
                                {savings.isSmaller ? `-${savings.percentage}%` : `+${Math.abs(Number(savings.percentage))}%`}
                              </span>
                            ) : (
                              <span className="text-[var(--fg-muted)] opacity-50">-</span>
                            )}
                          </td>
                          
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex gap-2 items-center">
                              {item.status === 'success' && (
                                <button
                                  onClick={() => handleDownloadSingle(item, idx)}
                                  className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold cursor-pointer transition-all duration-200"
                                  style={{
                                    background: tint(activeHue, lightMode, 0.9, 0.08, 0.9), border: `1px solid ${tintBorder(activeHue, lightMode)}`,
                                    color: tintFg(activeHue, lightMode),
                                  }}
                                >
                                  Save
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveFile(item.id)}
                                disabled={convertingActive}
                                className={`p-[5px] rounded-md bg-transparent text-[oklch(0.70_0.12_15)] flex items-center opacity-70 transition-all duration-200 hover:opacity-100 ${convertingActive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
            <div className={`flex justify-between items-center border border-[var(--border)] rounded-[14px] px-6 py-[18px] mt-3 flex-wrap gap-4 shadow-[0_4px_16px_var(--shadow-sm)] ${lightMode ? 'bg-[oklch(0.97_0_0)]' : 'bg-[oklch(0.12_0.002_250/0.3)]'}`}>
              <div>
                {pendingCount > 0 ? (
                  <span className="text-[13px] text-[var(--fg-muted)]">
                    🚀 Ready to convert <strong className="text-[var(--fg)]">{pendingCount}</strong> pending image{pendingCount > 1 ? 's' : ''}.
                  </span>
                ) : (
                  <span className="text-[13px] text-[oklch(0.70_0.16_145)] inline-flex items-center gap-1.5 font-medium">
                    <CheckCircle size={15} /> All conversions complete ({successFiles.length} photos ready)
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                {pendingCount > 0 && (
                  <button
                    onClick={handleConvertAll}
                    disabled={convertingActive}
                    className={`px-6 py-[11px] rounded-[10px] font-semibold text-[13.5px] inline-flex items-center gap-2 transition-all duration-250 ${convertingActive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{
                      background: tint(activeHue, lightMode, 0.45, 0.15, 0.95),
                      border: `1px solid ${tintBorder(activeHue, lightMode)}`,
                      color: lightMode ? 'white' : tintFg(activeHue, lightMode),
                      boxShadow: `0 4px 14px ${tint(activeHue, lightMode, 0.5, 0.15, 0.25)}`,
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
                    className={`px-6 py-[11px] rounded-[10px] text-white font-semibold text-[13.5px] inline-flex items-center gap-2 transition-all duration-250 ${zipping ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{
                      background: `linear-gradient(180deg, ${tint(activeHue, lightMode, 0.45, 0.15, 0.95)}, ${tint(activeHue, lightMode, 0.55, 0.17, 0.95)})`,
                      boxShadow: `0 4px 16px ${tint(activeHue, lightMode, 0.5, 0.15, 0.25)}`,
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
      <div className="mt-12 bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-[18px] px-8 py-7 shadow-[0_8px_24px_var(--shadow-sm)]">
        <h2 className="text-[19px] font-bold text-[var(--fg)] m-0 mb-5 flex items-center gap-2.5">
          <HelpCircle size={19} style={{ color: tintFg(activeHue, lightMode) }} /> Frequently Asked Questions
        </h2>
        
        <div className="flex flex-col gap-1">
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
              className={`pb-3.5 ${idx === 3 ? 'border-none' : 'border-b border-[var(--border)]'} ${idx === 0 ? 'pt-0' : 'pt-3.5'}`}
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex justify-between items-center py-1.5 cursor-pointer text-left text-[var(--fg)] font-semibold text-[14.5px] bg-transparent border-none"
              >
                <span className="flex-1">{faq.q}</span>
                {faqOpen[idx] ? <ChevronUp size={16} className="text-[var(--fg-muted)]" /> : <ChevronDown size={16} className="text-[var(--fg-muted)]" />}
              </button>
              
              {faqOpen[idx] && (
                <div className="mt-2 text-[13.5px] text-[var(--fg-muted)] leading-[1.6] animate-[slideDownFaq_0.25s_cubic-bezier(0.16,1,0.3,1)]">
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
