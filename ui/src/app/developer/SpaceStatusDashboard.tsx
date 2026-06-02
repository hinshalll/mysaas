"use client";

import React, { useState, useEffect } from 'react';
import { Loader, RefreshCw, Globe, CheckCircle, AlertCircle, Zap, ShieldAlert, ExternalLink } from 'lucide-react';

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

export default function SpaceStatusDashboard() {
  const [data, setData] = useState<KeepAliveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/keep-alive', { cache: 'no-store' });
      if (!res.ok && res.status !== 502) {
        throw new Error(`Failed to fetch system status (HTTP ${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred fetching status.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getSpaceName = (url: string) => {
    try {
      const parsed = new URL(url);
      const host = parsed.host;
      // Extract sub-domain (e.g. hinshalll-hf-image-converter from hinshalll-hf-image-converter.hf.space)
      return host.split('.')[0] || host;
    } catch (e) {
      return url;
    }
  };

  const getSpaceTitle = (name: string) => {
    if (name.includes('image') || name.includes('heic')) {
      return 'HEIC Image Compiler Engine';
    }
    if (name.includes('pdf')) {
      return 'PDF Document Compiler Engine';
    }
    return 'Hugging Face Space Node';
  };

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    }}>
      {/* Dashboard Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        background: 'oklch(0.16 0.005 250 / 0.3)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '16px 24px',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={18} style={{ color: 'oklch(0.78 0.16 145)' }} /> Space Engine Status Dashboard
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--fg-muted)' }}>
            {data?.timestamp ? `Last updated: ${new Date(data.timestamp).toLocaleTimeString()}` : 'Checking HF engine status...'}
          </p>
        </div>

        <button
          onClick={() => fetchStatus(true)}
          disabled={loading || refreshing}
          className="reset mono"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            fontSize: 12.5,
            fontWeight: 600,
            borderRadius: 8,
            background: 'var(--bg-elev-2)',
            border: '1px solid var(--border)',
            color: 'var(--fg)',
            cursor: (loading || refreshing) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!loading && !refreshing) e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { if (!loading && !refreshing) e.currentTarget.style.background = 'var(--bg-elev-2)'; }}
        >
          <RefreshCw size={13} className={refreshing || loading ? "spin" : ""} style={{ marginRight: 4 }} />
          {refreshing || loading ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>

      {/* Main Status Panel */}
      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 240,
          border: '1px solid var(--border)',
          borderRadius: 16,
          background: 'oklch(0.16 0.005 250 / 0.2)',
          gap: 12,
        }}>
          <Loader size={28} className="spin" style={{ color: 'oklch(0.68 0.18 265)' }} />
          <span style={{ fontSize: 13, color: 'var(--fg-muted)', fontFamily: 'monospace' }}>Pinging engine nodes...</span>
        </div>
      ) : error ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 240,
          border: '1px solid oklch(0.70 0.12 15 / 0.2)',
          borderRadius: 16,
          background: 'oklch(0.12 0.005 15 / 0.1)',
          padding: 24,
          textAlign: 'center',
          gap: 12,
        }}>
          <ShieldAlert size={36} style={{ color: 'oklch(0.70 0.12 15)' }} />
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--fg)' }}>Status Check Offline</h4>
          <p style={{ margin: '4px 0 12px', fontSize: 13, color: 'var(--fg-muted)', maxWidth: 360 }}>
            {error}
          </p>
          <button
            onClick={() => fetchStatus(true)}
            className="reset"
            style={{
              padding: '6px 14px', borderRadius: 6,
              background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
              color: 'var(--fg)', fontSize: 12.5, cursor: 'pointer'
            }}
          >
            Retry Check
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {data?.monitors.map((monitor, idx) => {
            const spaceName = getSpaceName(monitor.url);
            const isAwake = monitor.ok;
            const isSleeping = !isAwake && (monitor.status === 'error' && monitor.error?.toLowerCase().includes('timeout'));
            
            return (
              <div 
                key={idx}
                className="hover-card-asset"
                style={{
                  background: 'oklch(0.18 0.005 250 / 0.55)',
                  border: isAwake
                    ? '1px solid oklch(0.78 0.16 145 / 0.2)'
                    : isSleeping
                      ? '1px solid oklch(0.75 0.14 75 / 0.25)'
                      : '1px solid oklch(0.70 0.12 15 / 0.2)',
                  borderRadius: 16,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: '0 4px 16px var(--shadow-sm)',
                  transition: 'all 0.25s ease',
                }}
              >
                {/* Space Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }} className="mono">
                      {spaceName.includes('pdf') ? 'PDF Engine Node' : 'Image Engine Node'}
                    </span>
                    <h4 style={{ margin: '4px 0 0', fontSize: 14.5, fontWeight: 600, color: 'var(--fg)' }}>
                      {getSpaceTitle(spaceName)}
                    </h4>
                  </div>

                  {/* Status Indicator Badge */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 10.5,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    background: isAwake
                      ? 'oklch(0.78 0.16 145 / 0.12)'
                      : isSleeping
                        ? 'oklch(0.75 0.14 75 / 0.12)'
                        : 'oklch(0.70 0.12 15 / 0.12)',
                    color: isAwake
                      ? 'oklch(0.78 0.16 145)'
                      : isSleeping
                        ? 'oklch(0.75 0.14 75)'
                        : 'oklch(0.70 0.12 15)',
                  }}>
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: isAwake
                        ? 'oklch(0.78 0.16 145)'
                        : isSleeping
                          ? 'oklch(0.75 0.14 75)'
                          : 'oklch(0.70 0.12 15)',
                      animation: isAwake ? 'pulseGlow 2s infinite ease-in-out' : 'none'
                    }} />
                    {isAwake ? 'ACTIVE' : isSleeping ? 'SLEEPING' : 'OFFLINE'}
                  </span>
                </div>

                {/* Connection Details */}
                <div style={{ 
                  flex: 1, 
                  background: 'oklch(0.12 0.005 250 / 0.4)', 
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--fg-dim)' }}>Response Code:</span>
                    <span style={{ color: 'var(--fg)', fontWeight: 600 }} className="mono">
                      {monitor.status}
                    </span>
                  </div>
                  {monitor.error && (
                    <div style={{ 
                      marginTop: 4, 
                      paddingTop: 4, 
                      borderTop: '1px solid var(--border)', 
                      color: 'oklch(0.75 0.14 75)', 
                      fontSize: 11,
                      lineHeight: 1.4,
                      wordBreak: 'break-all'
                    }}>
                      {monitor.error}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <a 
                    href={monitor.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 11.5,
                      color: 'var(--fg-muted)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--fg)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--fg-muted)'}
                  >
                    Space Link <ExternalLink size={11} />
                  </a>

                  {!isAwake && (
                    <button
                      onClick={() => fetchStatus(true)}
                      className="reset mono"
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        borderRadius: 6,
                        background: 'oklch(0.75 0.14 75 / 0.1)',
                        border: '1px solid oklch(0.75 0.14 75 / 0.25)',
                        color: 'oklch(0.75 0.14 75)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Zap size={10} style={{ marginRight: 2 }} /> Wake Node
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Global CSS for monitoring animations */}
      <style jsx global>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 oklch(0.78 0.16 145 / 0.7); }
          70% { box-shadow: 0 0 0 6px oklch(0.78 0.16 145 / 0); }
          100% { box-shadow: 0 0 0 0 oklch(0.78 0.16 145 / 0); }
        }
      `}</style>
    </div>
  );
}
