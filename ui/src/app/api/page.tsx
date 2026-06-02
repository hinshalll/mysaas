"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Terminal, Image as ImageIcon, FileText, Globe, 
  ArrowRight, Loader, Check, Zap, Server, Code, ShieldCheck 
} from 'lucide-react';
import { supabase } from '../supabase';
import SpaceStatusDashboard from '../developer/SpaceStatusDashboard';

interface Monitor {
  url: string;
  status: number | string;
  ok: boolean;
  error?: string;
}

interface KeepAliveResponse {
  status: string;
  timestamp: string;
  monitors: Monitor[];
}

export default function ApiHubPage() {
  const [statusData, setStatusData] = useState<KeepAliveResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('tier')
            .eq('id', session.user.id)
            .single();
          if (!error && data?.tier === 'admin') {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error('Failed to load user profile in API portal:', err);
      }
    }
    checkAdminStatus();

    async function fetchStatus() {
      try {
        const res = await fetch('/api/v1/keep-alive', { cache: 'no-store' });
        if (res.ok || res.status === 502) {
          const json = await res.json();
          setStatusData(json);
        }
      } catch (err) {
        console.error('Failed to load API engine statuses', err);
      } finally {
        setLoadingStatus(false);
      }
    }
    fetchStatus();
  }, []);

  const getEngineStatus = (keyword: string) => {
    if (loadingStatus) return 'checking';
    if (!statusData || !statusData.monitors) return 'unknown';
    
    const matched = statusData.monitors.find(m => m.url.toLowerCase().includes(keyword));
    if (!matched) return 'unknown';
    return matched.ok ? 'active' : 'sleeping';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'oklch(0.10 0.005 250)', // Premium terminal dark background
      color: 'oklch(0.97 0.005 250)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '60px 24px 120px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative Matrix/Code Grid Background */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: 600,
        backgroundImage: 'radial-gradient(oklch(0.68 0.18 265 / 0.07) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{
        maxWidth: 1040,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 56,
      }}>
        
        {/* Header Breadcrumbs & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: 'monospace', color: 'oklch(0.68 0.18 265)' }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>HOME</Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ color: 'white' }}>DEVELOPER API</span>
          </div>

          <Link href="/account" style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: 'white',
            background: 'oklch(0.20 0.01 250)',
            border: '1px solid oklch(0.28 0.01 250)',
            padding: '8px 16px',
            borderRadius: 8,
            textDecoration: 'none',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'oklch(0.25 0.01 250)'}
          onMouseLeave={e => e.currentTarget.style.background = 'oklch(0.20 0.01 250)'}
          >
            Manage API Keys →
          </Link>
        </div>

        {/* Hero Section */}
        <div style={{ maxWidth: 640 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'oklch(0.68 0.18 265 / 0.12)',
            border: '1px solid oklch(0.68 0.18 265 / 0.3)',
            color: 'oklch(0.80 0.13 265)',
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 20,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: 'monospace',
            marginBottom: 16,
          }}>
            <Code size={11} /> REST API Endpoints
          </span>
          <h1 style={{ fontSize: 42, fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.03em', color: 'white', lineHeight: 1.1 }}>
            Build and Scale with Developer APIs
          </h1>
          <p style={{ fontSize: 16, color: 'oklch(0.70 0.01 250)', lineHeight: 1.6, margin: 0 }}>
            Integrate our high-performance document compilers, batch formatting engines, and media encoders directly into your codebase. Local browser speeds, backed by redundant server nodes.
          </p>
        </div>

        {/* API Catalog Grid */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: '0 0 24px', letterSpacing: '-0.02em' }}>Available API Products</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
          }}>
            {[
              {
                id: 'universal-ai-formatter',
                title: 'Universal AI Document Formatter API',
                desc: 'Convert raw AI output streams or unformatted txt files into clean Markdown, HTML, and JSON representations using structured LLM formatting templates.',
                endpoint: 'POST /api/v1/format',
                icon: FileText,
                keyword: 'pdf-compiler', // keep-alive matches "pdf-compiler"
                color: 'oklch(0.68 0.18 265)'
              },
              {
                id: 'heic-to-jpg-converter',
                title: 'HEIC Image Converter API',
                desc: 'Batch process and transcode Apple HEIC or HEIF images to optimized JPG/PNG formats. Preserves Exif metadata with low latency serverless decoding.',
                endpoint: 'POST /api/v1/convert-image',
                icon: ImageIcon,
                keyword: 'image-converter', // keep-alive matches "image-converter"
                color: 'oklch(0.72 0.18 25)'
              },
              {
                id: 'html-to-print-ready-pdf',
                title: 'HTML & Markdown to PDF Generator API',
                desc: 'Render print-ready, styled PDF documents from plain HTML or Markdown payloads. Tailored layouts, custom page numbering, and header formatting.',
                endpoint: 'POST /api/v1/export-pdf',
                icon: Terminal,
                keyword: 'pdf-compilerb', // keep-alive matches "pdf-compilerb"
                color: 'oklch(0.70 0.15 195)'
              }
            ].map(api => {
              const status = getEngineStatus(api.keyword);
              const statusColor = status === 'active' 
                ? 'oklch(0.78 0.16 145)' 
                : status === 'sleeping' 
                  ? 'oklch(0.75 0.14 75)' 
                  : 'oklch(0.50 0.01 250)';
              
              return (
                <Link key={api.id} href={`/api/${api.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'oklch(0.14 0.006 250)',
                    border: '1px solid oklch(0.20 0.008 250)',
                    borderRadius: 16,
                    padding: 24,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 20px oklch(0 0 0 / 0.15)',
                    transition: 'all 0.2s ease-in-out',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = api.color;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'oklch(0.20 0.008 250)';
                    e.currentTarget.style.transform = 'none';
                  }}
                  >
                    <div>
                      {/* Top icon and Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 8,
                          background: 'oklch(0.18 0.01 250)',
                          border: '1px solid oklch(0.24 0.01 250)',
                          color: api.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <api.icon size={18} />
                        </div>

                        {/* Node operational status badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'monospace' }}>
                          {status === 'checking' ? (
                            <Loader size={10} className="spin" style={{ color: 'oklch(0.50 0.01 250)' }} />
                          ) : (
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
                          )}
                          <span style={{ color: statusColor }}>
                            {status === 'active' ? 'AWAKE' : status === 'sleeping' ? 'SLEEPING' : 'PINGING...'}
                          </span>
                        </div>
                      </div>

                      <h3 style={{ margin: '0 0 10px', fontSize: 16.5, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>{api.title}</h3>
                      <p style={{ margin: '0 0 20px', fontSize: 13, color: 'oklch(0.70 0.01 250)', lineHeight: 1.5 }}>{api.desc}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid oklch(0.20 0.008 250)', paddingTop: 14 }}>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'oklch(0.50 0.01 250)', background: 'oklch(0.11 0.005 250)', padding: '4px 8px', borderRadius: 4 }}>
                        {api.endpoint}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600, color: api.color }}>
                        API Docs <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Global Developer Sandbox Pricing */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: '0 0 24px', letterSpacing: '-0.02em' }}>Developer API Tiers & Limits</h2>
          <div style={{
            background: 'oklch(0.14 0.006 250)',
            border: '1px solid oklch(0.20 0.008 250)',
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 4px 20px oklch(0 0 0 / 0.15)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid oklch(0.20 0.008 250)', background: 'oklch(0.12 0.005 250)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'white' }}>PLAN TIER</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'white' }}>DAILY RUNS</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'white' }}>API KEY REQUIRED</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'white' }}>RATE LIMIT</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'white', textAlign: 'right' }}>PRICE</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: 'Guest Sandbox',
                    runs: '5 requests / day',
                    key: 'No key (public sandbox endpoint)',
                    limit: '5 requests / minute',
                    price: 'Free'
                  },
                  {
                    name: 'Pro Subscription',
                    runs: '100 requests / day',
                    key: 'Yes (Production API Key)',
                    limit: '20 requests / minute',
                    price: '$9.00 / mo'
                  },
                  {
                    name: 'Developer API Plan',
                    runs: '1,000 requests / day',
                    key: 'Yes (Developer API Key)',
                    limit: '100 requests / minute',
                    price: '$29.00 / mo'
                  }
                ].map((tier, idx) => (
                  <tr key={idx} style={{ borderBottom: idx === 2 ? 'none' : '1px solid oklch(0.20 0.008 250)' }}>
                    <td style={{ padding: '16px 24px', color: 'white', fontWeight: 600 }}>{tier.name}</td>
                    <td style={{ padding: '16px 24px', color: 'oklch(0.70 0.01 250)' }} className="mono">{tier.runs}</td>
                    <td style={{ padding: '16px 24px', color: 'oklch(0.70 0.01 250)' }}>{tier.key}</td>
                    <td style={{ padding: '16px 24px', color: 'oklch(0.70 0.01 250)' }} className="mono">{tier.limit}</td>
                    <td style={{ padding: '16px 24px', color: 'oklch(0.78 0.16 145)', fontWeight: 700, textAlign: 'right' }}>{tier.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Security / Privacy callout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: 'oklch(0.12 0.005 250)',
          border: '1px solid oklch(0.18 0.005 250)',
          padding: '20px 24px',
          borderRadius: 14,
        }}>
          <ShieldCheck size={28} style={{ color: 'oklch(0.78 0.16 145)', flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: 'white' }}>Secure TLS 1.3 Communication</h4>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'oklch(0.70 0.01 250)', lineHeight: 1.4 }}>
              All API requests are executed over encrypted TLS 1.3 tunnels. Uploaded documents or images are parsed completely in memory and instantly returned. Zero file retention on host storage nodes.
            </p>
          </div>
        </div>

        {/* System Admin Dashboard Section */}
        {isAdmin && (
          <div style={{
            marginTop: 16,
            paddingTop: 36,
            borderTop: '1px solid oklch(0.20 0.008 250)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>
                System Status Console (Administrator)
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'oklch(0.70 0.01 250)' }}>
                Directly monitor engine wake times, latency, response codes, and wake state triggers.
              </p>
            </div>
            <SpaceStatusDashboard />
          </div>
        )}

      </div>

      <style jsx global>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
