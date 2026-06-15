"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { supabase } from '../supabase';
import { Icon } from '../../components/LucideIcons';
import SpaceStatusDashboard from './SpaceStatusDashboard';

export default function DeveloperClient() {
  const {
    brandName,
    userPlan,
    sessionUser,
    isAnonUser,
    setAuthOpen,
    launchApp,
    handleShowPaywall
  } = useSaaS();

  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');
  const isLoggedIn = !!sessionUser && !sessionUser.is_anonymous;

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isKeyRevealed, setIsKeyRevealed] = useState(false);
  const [uuidCopied, setUuidCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Live Query Logs
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Analytics
  const [usageCount, setUsageCount] = useState(0);

  // Console Tabs State
  const [activeConsoleTab, setActiveConsoleTab] = useState<'metrics' | 'playground' | 'credentials'>('metrics');
  const [playgroundSubTab, setPlaygroundSubTab] = useState<'formatter' | 'heic'>('formatter');
  const [snippetTab, setSnippetTab] = useState<'curl' | 'js' | 'python' | 'go'>('curl');
  
  const [allowedOrigins, setAllowedOrigins] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ms_allowed_origins') || '*';
    }
    return '*';
  });

  // Sandbox Input / Output / Loading
  const [sandboxInput, setSandboxInput] = useState('Clean this messy transcription up and format it nicely into a report.');
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  // HEIC Sandbox
  const [heicSandboxFile, setHeicSandboxFile] = useState<File | null>(null);
  const [heicSandboxFormat, setHeicSandboxFormat] = useState<'jpg' | 'png'>('jpg');
  const [heicSandboxLoading, setHeicSandboxLoading] = useState(false);
  const [heicSandboxResult, setHeicSandboxResult] = useState<any>(null);
  const [heicSandboxResultUrl, setHeicSandboxResultUrl] = useState<string | null>(null);
  const fileInputSandboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (heicSandboxResultUrl) URL.revokeObjectURL(heicSandboxResultUrl);
    };
  }, [heicSandboxResultUrl]);

  // Fetch usage logs & daily count
  const fetchLogs = useCallback(async (userId: string) => {
    if (!supabase) return;
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('usage_logs')
        .select('tool_id, tier, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(6);
      if (!error && data) {
        setLogs(data);
      }
    } catch (err) {
      console.warn("Failed to fetch developer logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const fetchUsageCount = useCallback(async (userId: string) => {
    if (!supabase) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count, error } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());
      if (!error && count !== null) {
        setUsageCount(count);
      }
    } catch (err) {
      console.warn("Failed to fetch usage count:", err);
    }
  }, []);

  // Sync API Key, Logs, and Counts on mount & change
  useEffect(() => {
    async function syncKeyAndLogs() {
      if (supabase && sessionUser?.id && isLoggedIn) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('api_key')
            .eq('id', sessionUser.id)
            .single();
          if (data?.api_key) {
            setApiKey(data.api_key);
          } else {
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let randomString = '';
            for (let i = 0; i < 24; i++) {
              randomString += chars[Math.floor(Math.random() * chars.length)];
            }
            const isPaidUser = userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin';
            const keyPrefix = isPaidUser ? 'ms_live_prod_' : 'ms_sandbox_';
            const newKey = `${keyPrefix}${randomString}`;

            const { error: updateError } = await supabase
              .from('profiles')
              .update({ api_key: newKey })
              .eq('id', sessionUser.id);

            if (!updateError) {
              setApiKey(newKey);
            }
          }
          fetchLogs(sessionUser.id);
          fetchUsageCount(sessionUser.id);
        } catch (err) {
          console.error('Failed to sync API key/logs:', err);
        }
      } else {
        setApiKey(null);
        setLogs([]);
        setUsageCount(0);
      }
    }
    syncKeyAndLogs();
  }, [sessionUser, isLoggedIn, userPlan, fetchLogs, fetchUsageCount]);

  // Key rotation handler
  const handleRegenerateKey = async () => {
    if (!supabase || !sessionUser || isAnonUser) return;
    if (apiKey) {
      const confirmRotate = confirm("Are you sure you want to regenerate your API Key? All applications using this key will immediately fail authorization.");
      if (!confirmRotate) return;
    }

    setIsRegenerating(true);
    try {
      const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(20)), b => b.toString(16).padStart(2, '0')).join('');
      const isPaidUser = userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin';
      const keyPrefix = isPaidUser ? 'ms_live_prod_' : 'ms_sandbox_';
      const newKey = `${keyPrefix}${randomBytes}`;

      const { error } = await supabase
        .from('profiles')
        .update({ api_key: newKey })
        .eq('id', sessionUser.id);

      if (error) throw error;
      setApiKey(newKey);
      alert("API Key regenerated successfully!");
    } catch (err: any) {
      alert("Failed to regenerate API Key: " + err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyKey = () => {
    const keyToCopy = apiKey || 'ms_sandbox_unassigned_key';
    navigator.clipboard.writeText(keyToCopy);
    setUuidCopied(true);
    setTimeout(() => setUuidCopied(false), 2000);
  };

  const runSandboxTest = async () => {
    if (isAnonUser) {
      alert("Please sign in or create an account to run live tests in the API sandbox.");
      setAuthOpen(true);
      return;
    }
    
    setSandboxLoading(true);
    setSandboxResult(null);

    const activeKey = apiKey || 'ms_sandbox_unassigned_key';

    try {
      const response = await fetch('/api/v1/format', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: 'ai-formatter',
          content: sandboxInput,
          style: 'modern'
        })
      });
      const data = await response.json();
      setSandboxResult(data);
      if (sessionUser) {
        fetchLogs(sessionUser.id);
        fetchUsageCount(sessionUser.id);
      }
    } catch (err) {
      console.error('API Sandbox test fetch failed:', err);
      setSandboxResult({
        status: "error",
        message: "Failed to connect to API server. Check if your dev server is active or if key is valid."
      });
    } finally {
      setSandboxLoading(false);
    }
  };

  const runHeicSandboxTest = async () => {
    if (isAnonUser) {
      alert("Please sign in or create an account to run live tests in the API sandbox.");
      setAuthOpen(true);
      return;
    }
    if (!heicSandboxFile) {
      alert("Please upload a test HEIC/HEIF file first.");
      return;
    }
    
    setHeicSandboxLoading(true);
    setHeicSandboxResult(null);
    if (heicSandboxResultUrl) {
      URL.revokeObjectURL(heicSandboxResultUrl);
      setHeicSandboxResultUrl(null);
    }

    const activeKey = apiKey || 'ms_sandbox_unassigned_key';

    try {
      const formData = new FormData();
      formData.append('file', heicSandboxFile);
      formData.append('format', heicSandboxFormat);
      formData.append('quality', '0.95');

      const response = await fetch('/api/v1/convert-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeKey}`,
          'Accept': 'image/*'
        },
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.ok ? {} : await response.json();
        setHeicSandboxResult(errJson);
      } else {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setHeicSandboxResultUrl(url);
        setHeicSandboxResult({
          status: "success",
          message: `HEIC file converted successfully to ${heicSandboxFormat.toUpperCase()}!`,
          contentType: blob.type,
          sizeBytes: blob.size,
          outputUrl: url
        });
      }
      if (sessionUser) {
        fetchLogs(sessionUser.id);
        fetchUsageCount(sessionUser.id);
      }
    } catch (err: any) {
      console.error('API HEIC Sandbox test failed:', err);
      setHeicSandboxResult({
        status: "error",
        message: "Failed to connect to image conversion API server: " + err.message
      });
    } finally {
      setHeicSandboxLoading(false);
    }
  };

  const handleSaveOrigins = (origins: string) => {
    setAllowedOrigins(origins);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ms_allowed_origins', origins);
    }
  };

  const planName = userPlan === 'api' ? 'Developer API' : userPlan === 'pro' ? 'Pro Plan' : userPlan === 'admin' ? 'Administrator' : 'Free Account';
  const rateLimit = userPlan === 'api' ? '100 / min' : userPlan === 'pro' ? '20 / min' : '10 / min';
  const dailyLimit = userPlan === 'api' ? '30,000 / mo' : userPlan === 'pro' ? 'Unlimited' : '20 / day';

  const activeKeyForSnippet = apiKey || 'ms_sandbox_unassigned_key';
  const codeSnippets = {
    curl: `curl -X POST https://mysaastools.vercel.app/api/v1/format \\
  -H "Authorization: Bearer ${activeKeyForSnippet}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "ai-formatter",
    "content": "${sandboxInput.replace(/"/g, '\\"')}",
    "style": "modern"
  }'`,
    js: `fetch('https://mysaastools.vercel.app/api/v1/format', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${activeKeyForSnippet}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tool: 'ai-formatter',
    content: '${sandboxInput.replace(/'/g, "\\'")}',
    style: 'modern'
  })
})
.then(res => res.json())
.then(data => console.log(data));`,
    python: `import requests

url = "https://mysaastools.vercel.app/api/v1/format"
headers = {
    "Authorization": "Bearer ${activeKeyForSnippet}",
    "Content-Type": "application/json"
}
payload = {
    "tool": "ai-formatter",
    "content": "${sandboxInput.replace(/"/g, '\\"')}",
    "style": "modern"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    go: `package main

import (
	"bytes"
	"fmt"
	"net/http"
)

func main() {
	jsonData := []byte(\`{"tool": "ai-formatter", "content": "Clean this messy text..."}\`)
	req, _ := http.NewRequest("POST", "https://mysaastools.vercel.app/api/v1/format", bytes.NewBuffer(jsonData))
	req.Header.Set("Authorization", "Bearer ${activeKeyForSnippet}")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println("Response Status:", resp.Status)
}`
  };

  return (
    <div style={{
      maxWidth: 1100,
      margin: '40px auto 120px',
      padding: '0 32px',
      boxSizing: 'border-box',
      position: 'relative',
    }} className="fade-in">
      {/* Subpage ambient top-center glow */}
      <div style={{
        position: 'absolute',
        top: -100,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 800,
        height: 300,
        pointerEvents: 'none',
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
        opacity: isLight ? 0.08 : 0.15,
        zIndex: 0,
      }}/>

      <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
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
          marginBottom: 12
        }}>
          <Icon.Activity size={11} /> Developer Console
        </span>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.025em' }}>
          Developer Dashboard
        </h1>
        <p style={{ fontSize: 15, color: 'oklch(0.70 0.01 250)', marginTop: 6, margin: 0, maxWidth: 640, lineHeight: 1.5 }}>
          Access sandbox credentials, monitor query volumes, rotate secure access tokens, and check server nodes health matrix in real-time.
        </p>
      </div>

      {/* Guest Sandbox Lock Warn Banner */}
      {isAnonUser && (
        <div style={{
          background: 'oklch(0.72 0.18 25 / 0.1)',
          border: '1px solid oklch(0.72 0.18 25 / 0.3)',
          padding: '16px 20px',
          borderRadius: 12,
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1,
          marginBottom: 24
        }}>
          <Icon.AlertTriangle size={20} style={{ color: 'oklch(0.72 0.18 25)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 260 }}>
            <h5 style={{ margin: 0, fontSize: 14, color: 'white', fontWeight: 700 }}>Guest Sandbox Workspace</h5>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'oklch(0.70 0.01 250)', lineHeight: 1.4 }}>
              You are currently accessing credentials as a guest. All keys generated below will be standard public sandbox tokens. Sign in or create a free account to unlock a personal, dedicated API key and lift rate limits.
            </p>
          </div>
          <button onClick={() => setAuthOpen(true)} style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: 'black',
            background: 'linear-gradient(180deg, oklch(0.78 0.16 145), oklch(0.68 0.18 145))',
            padding: '8px 16px',
            borderRadius: 8,
            textDecoration: 'none',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px oklch(0.78 0.16 145 / 0.25)',
          }}>
            Register Account Free →
          </button>
        </div>
      )}

      {/* Console Tab Selector */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid oklch(0.20 0.008 250)', paddingBottom: 12, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        {[
          { id: 'metrics', label: 'Overview & Metrics', icon: Icon.Activity },
          { id: 'playground', label: 'Playground Sandbox', icon: Icon.Terminal },
          { id: 'credentials', label: 'Access Credentials', icon: Icon.Lock }
        ].map(tab => {
          const tabIcon = tab.icon;
          const tabLabel = tab.label;
          const tabId = tab.id;
          const isActive = activeConsoleTab === tabId;
          return (
            <button
              key={tabId}
              onClick={() => setActiveConsoleTab(tabId as any)}
              className=""
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                background: isActive ? 'oklch(0.68 0.18 265 / 0.15)' : 'transparent',
                border: isActive ? '1px solid oklch(0.68 0.18 265 / 0.5)' : '1px solid transparent',
                color: isActive ? 'white' : 'oklch(0.70 0.01 250)',
                transition: 'all 0.15s'
              }}
            >
              {tabIcon && React.createElement(tabIcon, { size: 14, style: { color: isActive ? 'oklch(0.68 0.18 265)' : 'oklch(0.50 0.01 250)' } })}
              <span>{tabLabel}</span>
            </button>
          );
        })}
      </div>

      <div style={{ position: 'relative', zIndex: 1, marginTop: 24 }}>
        {activeConsoleTab === 'metrics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="fade-in">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 28,
              alignItems: 'start'
            }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                <div style={{
                  background: 'oklch(0.14 0.006 250)',
                  border: '1px solid oklch(0.20 0.008 250)',
                  padding: 24,
                  borderRadius: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid oklch(0.20 0.008 250)', paddingBottom: 12 }}>
                    <Icon.Sparkles size={16} style={{ color: 'oklch(0.68 0.18 265)' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Daily Quota Status</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12.5, color: 'oklch(0.70 0.01 250)' }}>Metered Calls</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'oklch(0.68 0.18 265)' }} className="mono">
                        {userPlan === 'pro' ? 'Unlimited' : userPlan === 'api' ? 'Unlimited / 30k API Runs' : `${usageCount} / ${20}`}
                      </span>
                    </div>

                    <div style={{ height: 8, width: '100%', background: 'oklch(0.18 0.005 250)', borderRadius: 4, overflow: 'hidden', border: '1px solid oklch(0.20 0.008 250)' }}>
                      <div style={{
                        height: '100%',
                        width: (userPlan === 'pro' || userPlan === 'api') ? '100%' : `${Math.min((usageCount / 20) * 100, 100)}%`,
                        background: 'linear-gradient(90deg, oklch(0.68 0.18 265) 0%, oklch(0.78 0.16 75) 100%)',
                        transition: 'width 0.4s ease-out'
                      }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: 'oklch(0.14 0.006 250)', border: '1px solid oklch(0.20 0.008 250)', padding: 20, borderRadius: 14 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'oklch(0.50 0.01 250)', display: 'block' }} className="mono">TODAY'S API USAGE</span>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'white', marginTop: 6 }}>
                      {usageCount} <span style={{ fontSize: 13, fontWeight: 400, color: 'oklch(0.50 0.01 250)' }}>/ {dailyLimit}</span>
                    </div>
                  </div>

                  <div style={{ background: 'oklch(0.14 0.006 250)', border: '1px solid oklch(0.20 0.008 250)', padding: 20, borderRadius: 14 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'oklch(0.50 0.01 250)', display: 'block' }} className="mono">SUCCESS RATE</span>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'oklch(0.78 0.16 145)', marginTop: 6 }}>
                      100%
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                <div style={{
                  background: 'oklch(0.14 0.006 250)',
                  border: '1px solid oklch(0.20 0.008 250)',
                  borderRadius: 16,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid oklch(0.20 0.008 250)', paddingBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'oklch(0.68 0.18 265 / 0.12)',
                        border: '1px solid oklch(0.68 0.18 265 / 0.3)',
                        color: 'oklch(0.80 0.13 265)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon.Terminal size={16} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>Live Request Logs</h3>
                        <p style={{ fontSize: 11.5, color: 'oklch(0.50 0.01 250)', margin: 0 }}>Dynamic logs of the last API invocations.</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => sessionUser && fetchLogs(sessionUser.id)}
                      disabled={loadingLogs}
                      className="" 
                      style={{ color: 'oklch(0.50 0.01 250)', cursor: 'pointer', display: 'flex', padding: 4, background: 'none', border: 'none' }}
                      title="Reload Logs"
                    >
                      <Icon.RefreshCw size={13} className={loadingLogs ? 'spin' : ''} />
                    </button>
                  </div>

                  {loadingLogs ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 160, color: 'oklch(0.50 0.01 250)' }}>
                      <Icon.Loader size={16} className="spin" />
                      <span style={{ fontSize: 12.5, fontFamily: 'monospace' }}>Fetching query logs...</span>
                    </div>
                  ) : logs.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {logs.map((log, index) => {
                        const date = new Date(log.created_at);
                        const formattedTime = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        return (
                          <div key={index} style={{
                            background: 'oklch(0.12 0.005 250 / 0.4)',
                            border: '1px solid oklch(0.18 0.008 250 / 0.5)',
                            borderRadius: 10,
                            padding: '12px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <span style={{ fontSize: 9.5, background: 'oklch(0.68 0.18 265 / 0.12)', border: '1px solid oklch(0.68 0.18 265 / 0.3)', color: 'oklch(0.80 0.13 265)', padding: '2px 6px', borderRadius: 4, fontWeight: 700, fontFamily: 'monospace' }}>
                                POST
                              </span>
                              <div>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'white', fontFamily: 'monospace' }}>
                                  {log.tool_id === 'json' ? '/api/v1/format (JSON)' : log.tool_id === 'universal-ai-formatter' ? '/api/v1/format (AI)' : `/api/v1/${log.tool_id}`}
                                </div>
                                <div style={{ fontSize: 11, color: 'oklch(0.50 0.01 250)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                  <Icon.Clock size={10} />
                                  <span>{formattedTime}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'oklch(0.78 0.16 145 / 0.12)', border: '1px solid oklch(0.78 0.16 145 / 0.3)', color: 'oklch(0.78 0.16 145)', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                              <Icon.Check size={11} />
                              <span>200 OK</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 10, color: 'oklch(0.50 0.01 250)', textAlign: 'center' }}>
                      <Icon.Terminal size={24} style={{ opacity: 0.5 }} />
                      <span style={{ fontSize: 12.5, fontFamily: 'monospace', color: 'oklch(0.50 0.01 250)' }}>$ tail -n 0 logs/stream.log</span>
                      <p style={{ margin: 0, fontSize: 11, color: 'oklch(0.50 0.01 250 / 0.7)', maxWidth: 260 }}>
                        Execute sandbox queries or call live endpoints to generate real-time developer metrics.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                System Nodes Operational Matrix
              </h2>
              <SpaceStatusDashboard />
            </div>
          </div>
        )}

        {activeConsoleTab === 'playground' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="fade-in">
            <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid oklch(0.16 0.006 250)', paddingBottom: 8 }}>
              <button
                onClick={() => setPlaygroundSubTab('formatter')}
                className="mono"
                style={{
                  padding: '8px 16px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: playgroundSubTab === 'formatter' ? '1px solid oklch(0.68 0.18 265 / 0.4)' : '1px solid transparent',
                  background: playgroundSubTab === 'formatter' ? 'oklch(0.68 0.18 265 / 0.12)' : 'transparent',
                  color: playgroundSubTab === 'formatter' ? 'white' : 'oklch(0.50 0.01 250)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Icon.FileText size={12} />
                <span>Document Formatter Sandbox</span>
              </button>
              <button
                onClick={() => setPlaygroundSubTab('heic')}
                className="mono"
                style={{
                  padding: '8px 16px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: playgroundSubTab === 'heic' ? '1px solid oklch(0.68 0.18 265 / 0.4)' : '1px solid transparent',
                  background: playgroundSubTab === 'heic' ? 'oklch(0.68 0.18 265 / 0.12)' : 'transparent',
                  color: playgroundSubTab === 'heic' ? 'white' : 'oklch(0.50 0.01 250)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Icon.Image size={12} />
                <span>HEIC Converter Sandbox</span>
              </button>
            </div>

            {playgroundSubTab === 'formatter' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 28 }} className="fade-in">
                <div style={{ background: 'oklch(0.14 0.006 250)', border: '1px solid oklch(0.20 0.008 250)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>Sandbox Request Data</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, color: 'oklch(0.50 0.01 250)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mono">Text Content Input</label>
                    <textarea
                      value={sandboxInput}
                      onChange={e => setSandboxInput(e.target.value)}
                      rows={5}
                      style={{
                        width: '100%',
                        background: '#0e0f12',
                        border: '1px solid oklch(0.20 0.008 250)',
                        borderRadius: 8,
                        padding: 12,
                        color: 'white',
                        fontSize: 13,
                        outline: 'none',
                        fontFamily: 'monospace',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <button
                    onClick={runSandboxTest}
                    disabled={sandboxLoading}
                    className=""
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      borderRadius: 8,
                      background: 'linear-gradient(180deg, oklch(0.68 0.18 265), oklch(0.58 0.20 265))',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: sandboxLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px oklch(0.68 0.18 265 / 0.3)',
                      border: 'none'
                    }}
                  >
                    {sandboxLoading ? <Icon.Loader size={14} className="spin" /> : <Icon.Zap size={14} />}
                    <span>{sandboxLoading ? 'Formatting Output...' : 'Execute Format API call'}</span>
                  </button>
                </div>

                <div style={{ background: 'oklch(0.14 0.006 250)', border: '1px solid oklch(0.20 0.008 250)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>API Server Response</h3>

                  {sandboxResult ? (
                    <pre style={{
                      background: '#07080a',
                      border: '1px solid #16181d',
                      borderRadius: 10,
                      padding: 16,
                      margin: 0,
                      fontSize: 11.5,
                      lineHeight: 1.5,
                      color: sandboxResult.status === 'error' ? 'oklch(0.65 0.22 20)' : '#a5b4fc',
                      overflowX: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      fontFamily: 'monospace',
                      flex: 1,
                      minHeight: 180
                    }}>
                      {JSON.stringify(sandboxResult, null, 2)}
                    </pre>
                  ) : (
                    <div style={{ flex: 1, border: '1px dashed oklch(0.20 0.008 250)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10, color: 'oklch(0.50 0.01 250)', minHeight: 180 }}>
                      <Icon.Code size={28} style={{ opacity: 0.5 }} />
                      <span style={{ fontSize: 12, fontFamily: 'monospace' }}>tail -f response/output.json</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 28 }} className="fade-in">
                <div style={{ background: 'oklch(0.14 0.006 250)', border: '1px solid oklch(0.20 0.008 250)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>Sandbox Request Data</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 11, color: 'oklch(0.50 0.01 250)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mono">Target Output Format</label>
                    <select
                      value={heicSandboxFormat}
                      onChange={e => setHeicSandboxFormat(e.target.value as any)}
                      style={{
                        width: '100%',
                        background: '#0e0f12',
                        border: '1px solid oklch(0.20 0.008 250)',
                        borderRadius: 8,
                        padding: 10,
                        color: 'white',
                        fontSize: 13,
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="jpg">Convert to JPEG format (.jpg)</option>
                      <option value="png">Convert to PNG format (.png)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 11, color: 'oklch(0.50 0.01 250)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mono">Upload HEIC File</label>
                    <input
                      type="file"
                      accept=".heic,.heif"
                      ref={fileInputSandboxRef}
                      onChange={e => setHeicSandboxFile(e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                    />
                    <div 
                      onClick={() => fileInputSandboxRef.current?.click()}
                      style={{
                        border: '1px dashed oklch(0.20 0.008 250)',
                        borderRadius: 8,
                        background: '#0e0f12',
                        padding: '20px 12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        color: heicSandboxFile ? 'white' : 'oklch(0.50 0.01 250)',
                        fontSize: 13
                      }}
                    >
                      {heicSandboxFile ? `Uploaded: ${heicSandboxFile.name} (${(heicSandboxFile.size / 1024 / 1024).toFixed(2)} MB)` : 'Click here to pick test HEIC image file'}
                    </div>
                  </div>

                  <button
                    onClick={runHeicSandboxTest}
                    disabled={heicSandboxLoading}
                    className=""
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      borderRadius: 8,
                      background: 'linear-gradient(180deg, oklch(0.68 0.18 265), oklch(0.58 0.20 265))',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: heicSandboxLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px oklch(0.68 0.18 265 / 0.3)',
                      border: 'none'
                    }}
                  >
                    {heicSandboxLoading ? <Icon.Loader size={14} className="spin" /> : <Icon.Zap size={14} />}
                    <span>{heicSandboxLoading ? 'Converting HEIC...' : 'Execute Convert Image API call'}</span>
                  </button>
                </div>

                <div style={{ background: 'oklch(0.14 0.006 250)', border: '1px solid oklch(0.20 0.008 250)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>API Server Response</h3>

                  {heicSandboxResult ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                      <pre style={{
                        background: '#07080a',
                        border: '1px solid #16181d',
                        borderRadius: 10,
                        padding: 12,
                        margin: 0,
                        fontSize: 11,
                        lineHeight: 1.4,
                        color: heicSandboxResult.status === 'error' ? 'oklch(0.65 0.22 20)' : '#a5b4fc',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        fontFamily: 'monospace'
                      }}>
                        {JSON.stringify({
                          status: heicSandboxResult.status,
                          message: heicSandboxResult.message,
                          contentType: heicSandboxResult.contentType,
                          sizeBytes: heicSandboxResult.sizeBytes
                        }, null, 2)}
                      </pre>
                      
                      {heicSandboxResultUrl && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'oklch(0.50 0.01 250)', fontWeight: 600 }}>CONVERTED BINARY IMAGE PREVIEW</span>
                          <div style={{ border: '1px solid oklch(0.20 0.008 250)', borderRadius: 8, padding: 6, background: '#0e0f12', textAlign: 'center' }}>
                            <img 
                              src={heicSandboxResultUrl} 
                              alt="Converted HEIC Sandbox Result" 
                              style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 6, objectFit: 'contain' }} 
                            />
                          </div>
                          <a 
                            href={heicSandboxResultUrl} 
                            download={`sandbox_converted_image.${heicSandboxFormat}`}
                            style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 600, color: 'oklch(0.68 0.18 265)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <span>Download Converted File</span>
                            <Icon.ArrowRight size={11} />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ flex: 1, border: '1px dashed oklch(0.20 0.008 250)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10, color: 'oklch(0.50 0.01 250)', minHeight: 180 }}>
                      <Icon.Code size={28} style={{ opacity: 0.5 }} />
                      <span style={{ fontSize: 12, fontFamily: 'monospace' }}>tail -f response/output.json</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeConsoleTab === 'credentials' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 28 }} className="fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              
              <div style={{
                background: 'oklch(0.14 0.006 250)',
                border: '1px solid oklch(0.20 0.008 250)',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid oklch(0.20 0.008 250)', paddingBottom: 14 }}>
                  <Icon.Database size={16} style={{ color: 'oklch(0.68 0.18 265)' }} />
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>API Credentials</h3>
                    <p style={{ fontSize: 11.5, color: 'oklch(0.50 0.01 250)', margin: 0 }}>Access tokens targeting formatting and media pipelines.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid oklch(0.16 0.006 250)', paddingBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 9, color: 'oklch(0.50 0.01 250)', textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mono">Access Tier</span>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 2 }}>{planName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 9, color: 'oklch(0.50 0.01 250)', textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mono">Rate Limit</span>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 2 }}>{rateLimit}</div>
                    </div>
                  </div>

                  <div style={{
                    background: 'oklch(0.12 0.005 250 / 0.6)',
                    border: '1px solid oklch(0.18 0.008 250)',
                    borderRadius: 10,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>Default Secret Key</span>
                      <span style={{
                        fontSize: 8.5,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        background: isAnonUser ? 'oklch(0.72 0.18 25 / 0.12)' : 'oklch(0.78 0.16 145 / 0.12)',
                        border: isAnonUser ? '1px solid oklch(0.72 0.18 25 / 0.3)' : '1px solid oklch(0.78 0.16 145 / 0.3)',
                        color: isAnonUser ? 'oklch(0.72 0.18 25)' : 'oklch(0.78 0.16 145)',
                        padding: '1px 6px',
                        borderRadius: 4,
                        textTransform: 'uppercase'
                      }}>
                        {isAnonUser ? 'Sandbox' : 'Production'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#0e0f12', border: '1px solid #1c1d22', padding: '8px 12px', borderRadius: 6 }}>
                      <code style={{ flex: 1, fontFamily: 'monospace', fontSize: 11.5, color: '#a5b4fc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {apiKey ? (
                          isKeyRevealed ? apiKey : `${apiKey.slice(0, 12)}${'•'.repeat(Math.max(1, apiKey.length - 12))}`
                        ) : (
                          'No API Key generated yet'
                        )}
                      </code>
                      
                      <div style={{ display: 'flex', gap: 6 }}>
                        {apiKey && (
                          <button
                            type="button"
                            onClick={() => setIsKeyRevealed(!isKeyRevealed)}
                            className=""
                            style={{ color: 'oklch(0.50 0.01 250)', cursor: 'pointer', display: 'flex', padding: 4, background: 'none', border: 'none' }}
                            title={isKeyRevealed ? "Hide Secret Key" : "Reveal Secret Key"}
                          >
                            {isKeyRevealed ? <Icon.EyeOff size={13} /> : <Icon.Eye size={13} />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleCopyKey}
                          className=""
                          style={{ color: uuidCopied ? 'oklch(0.78 0.16 145)' : 'white', cursor: 'pointer', display: 'flex', padding: 4, background: 'none', border: 'none' }}
                          title="Copy Key to Clipboard"
                        >
                          {uuidCopied ? <Icon.Check size={13} /> : <Icon.Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'oklch(0.50 0.01 250)' }}>
                      <span>Scope: Read & Write</span>
                      <span>Created: Active Session</span>
                    </div>
                  </div>

                  {!isAnonUser && (
                    <button
                      type="button"
                      onClick={handleRegenerateKey}
                      disabled={isRegenerating}
                      className=""
                      style={{
                        padding: '10px 0',
                        border: '1px dashed oklch(0.24 0.01 250)',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'oklch(0.70 0.01 250)',
                        cursor: isRegenerating ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'all 0.2s',
                        background: 'transparent'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'white'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'oklch(0.24 0.01 250)'; e.currentTarget.style.color = 'oklch(0.70 0.01 250)'; }}
                    >
                      {isRegenerating ? <Icon.Loader size={12} className="spin" /> : (apiKey ? <Icon.RefreshCw size={11} /> : <Icon.Key size={11} />)}
                      {isRegenerating ? (apiKey ? 'Rotating Token...' : 'Generating...') : (apiKey ? 'Rotate API Key' : 'Generate API Key')}
                    </button>
                  )}
                </div>
              </div>

              <div style={{
                background: 'oklch(0.14 0.006 250)',
                border: '1px solid oklch(0.20 0.008 250)',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'white', fontWeight: 600, fontSize: 13 }}>
                  <Icon.Globe size={14} style={{ color: 'oklch(0.68 0.18 265)' }} />
                  <span>Allowed Web Origins (CORS)</span>
                </div>
                <p style={{ fontSize: 12, color: 'oklch(0.50 0.01 250)', margin: 0, lineHeight: 1.45 }}>
                  Restrict browser requests to specific domains (e.g. `https://my-domain.com`). Leave `*` to permit all.
                </p>
                <input
                  type="text"
                  value={allowedOrigins}
                  onChange={e => handleSaveOrigins(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0e0f12',
                    border: '1px solid oklch(0.20 0.008 250)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: 'white',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div style={{
                background: 'oklch(0.14 0.006 250)',
                border: '1px solid oklch(0.20 0.008 250)',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>API Integration Snippets</h3>
                  <p style={{ fontSize: 11.5, color: 'oklch(0.50 0.01 250)', margin: '4px 0 0' }}>Authenticate your programs using standard HTTP request headers.</p>
                </div>

                <div style={{ display: 'flex', gap: 8, background: '#0e0f12', border: '1px solid #1c1d22', padding: 4, borderRadius: 8 }}>
                  {(['curl', 'js', 'python', 'go'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSnippetTab(tab)}
                      className=""
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: snippetTab === tab ? 'oklch(0.20 0.01 250)' : 'transparent',
                        border: snippetTab === tab ? '1px solid oklch(0.28 0.01 250)' : '1px solid transparent',
                        color: snippetTab === tab ? 'white' : 'oklch(0.50 0.01 250)',
                        textAlign: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      {tab === 'curl' ? 'cURL' : tab === 'js' ? 'JS Fetch' : tab === 'python' ? 'Python' : 'Go'}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative' }}>
                  <pre style={{
                    background: '#07080a',
                    border: '1px solid #16181d',
                    borderRadius: 10,
                    padding: 16,
                    margin: 0,
                    fontSize: 11.5,
                    lineHeight: 1.5,
                    color: '#a5b4fc',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    textAlign: 'left',
                    maxHeight: 220
                  }}>
                    {codeSnippets[snippetTab]}
                  </pre>
                  
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(codeSnippets[snippetTab]);
                      alert("Snippet copied to clipboard!");
                    }}
                    className=""
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'oklch(0.14 0.006 250 / 0.8)',
                      border: '1px solid oklch(0.24 0.01 250)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Icon.Copy size={10} />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              <div style={{
                background: 'oklch(0.14 0.006 250)',
                border: '1px solid oklch(0.20 0.008 250)',
                padding: 24,
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 16
              }}>
                <Icon.Server size={28} style={{ color: 'oklch(0.70 0.15 195)', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'white' }}>OpenAPI Spec Specifications</h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'oklch(0.50 0.01 250)', lineHeight: 1.45 }}>
                    Download our OpenAPI 3.0 specs to instantly generate types, API clients, and mock servers.
                  </p>
                  <a href="/api/openapi.json" download="openapi.json" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'oklch(0.70 0.15 195)',
                    textDecoration: 'none',
                    marginTop: 10
                  }}>
                    Download openapi.json <Icon.ArrowRight size={11} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40, position: 'relative', zIndex: 1 }}>
        <button onClick={launchApp} className="" style={{
          padding: '11px 24px',
          borderRadius: 9,
          background: 'var(--bg-elev-2)',
          border: '1px solid var(--border)',
          color: 'var(--fg)',
          fontWeight: 500,
          fontSize: 13.5,
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
        >Return to App Console</button>
      </div>
    </div>
  );
}
