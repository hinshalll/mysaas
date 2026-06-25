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
    <div className="max-w-[1100px] mx-auto mt-10 mb-[120px] px-8 box-border relative fade-in">
      {/* Subpage ambient top-center glow */}
      <div className={`absolute top-[-100px] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] pointer-events-none z-0 ${isLight ? 'opacity-[0.08]' : 'opacity-[0.15]'}`} style={{
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
      }}/>

      <div className="text-center mb-12 relative z-[1]">
        <span className="inline-flex items-center gap-1.5 bg-[oklch(0.68_0.18_265/0.12)] border border-[oklch(0.68_0.18_265/0.3)] text-[oklch(0.80_0.13_265)] text-[11px] font-bold px-2.5 py-1 rounded-full tracking-[0.08em] uppercase font-mono mb-3">
          <Icon.Activity size={11} /> Developer Console
        </span>
        <h1 className="text-[32px] font-extrabold text-white m-0 tracking-[-0.025em]">
          Developer Dashboard
        </h1>
        <p className="text-[15px] text-[oklch(0.70_0.01_250)] mt-1.5 mb-0 mx-auto max-w-[640px] leading-relaxed">
          Access sandbox credentials, monitor query volumes, rotate secure access tokens, and check server nodes health matrix in real-time.
        </p>
      </div>

      {/* Guest Sandbox Lock Warn Banner */}
      {isAnonUser && (
        <div className="bg-[oklch(0.72_0.18_25/0.1)] border border-[oklch(0.72_0.18_25/0.3)] p-4 sm:px-5 rounded-xl flex gap-3.5 items-center flex-wrap relative z-[1] mb-6">
          <Icon.AlertTriangle size={20} className="text-[oklch(0.72_0.18_25)] shrink-0" />
          <div className="flex-1 min-w-[260px]">
            <h5 className="m-0 text-[14px] text-white font-bold">Guest Sandbox Workspace</h5>
            <p className="m-0 mt-1 text-[12.5px] text-[oklch(0.70_0.01_250)] leading-[1.4]">
              You are currently accessing credentials as a guest. All keys generated below will be standard public sandbox tokens. Sign in or create a free account to unlock a personal, dedicated API key and lift rate limits.
            </p>
          </div>
          <button onClick={() => setAuthOpen(true)} className="text-[12.5px] font-semibold text-black bg-gradient-to-b from-[oklch(0.78_0.16_145)] to-[oklch(0.68_0.18_145)] px-4 py-2 rounded-lg no-underline border-none cursor-pointer shadow-[0_2px_8px_oklch(0.78_0.16_145/0.25)] hover:brightness-110 transition-all">
            Register Account Free →
          </button>
        </div>
      )}

      {/* Console Tab Selector */}
      <div className="flex gap-3 border-b border-[oklch(0.20_0.008_250)] pb-3 flex-wrap relative z-[1]">
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
              className={`reset flex items-center gap-2 px-[18px] py-[10px] rounded-lg text-[13px] cursor-pointer transition-all duration-150 ${isActive ? 'font-bold bg-[oklch(0.68_0.18_265/0.15)] border border-[oklch(0.68_0.18_265/0.5)] text-white' : 'font-medium bg-transparent border border-transparent text-[oklch(0.70_0.01_250)] hover:bg-[var(--bg-hover)]'}`}
            >
              {tabIcon && React.createElement(tabIcon, { size: 14, className: isActive ? 'text-[oklch(0.68_0.18_265)]' : 'text-[oklch(0.50_0.01_250)]' })}
              <span>{tabLabel}</span>
            </button>
          );
        })}
      </div>

      <div className="relative z-[1] mt-6">
        {activeConsoleTab === 'metrics' && (
          <div className="flex flex-col gap-7 fade-in">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-7 items-start">
              
              <div className="flex flex-col gap-7">
                <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] p-6 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-[oklch(0.20_0.008_250)] pb-3">
                    <Icon.Sparkles size={16} className="text-[oklch(0.68_0.18_265)]" />
                    <span className="text-[13px] font-bold text-white">Daily Quota Status</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[12.5px] text-[oklch(0.70_0.01_250)]">Metered Calls</span>
                      <span className="text-[12.5px] font-bold text-[oklch(0.68_0.18_265)] mono">
                        {userPlan === 'pro' ? 'Unlimited' : userPlan === 'api' ? 'Unlimited / 30k API Runs' : `${usageCount} / ${20}`}
                      </span>
                    </div>

                    <div className="h-2 w-full bg-[oklch(0.18_0.005_250)] rounded-full overflow-hidden border border-[oklch(0.20_0.008_250)]">
                      <div className="h-full bg-gradient-to-r from-[oklch(0.68_0.18_265)] to-[oklch(0.78_0.16_75)] transition-all duration-[400ms] ease-out" style={{
                        width: (userPlan === 'pro' || userPlan === 'api') ? '100%' : `${Math.min((usageCount / 20) * 100, 100)}%`,
                      }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] p-5 rounded-[14px]">
                    <span className="text-[10px] font-bold text-[oklch(0.50_0.01_250)] block mono">TODAY'S API USAGE</span>
                    <div className="text-[24px] font-extrabold text-white mt-1.5">
                      {usageCount} <span className="text-[13px] font-normal text-[oklch(0.50_0.01_250)]">/ {dailyLimit}</span>
                    </div>
                  </div>

                  <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] p-5 rounded-[14px]">
                    <span className="text-[10px] font-bold text-[oklch(0.50_0.01_250)] block mono">SUCCESS RATE</span>
                    <div className="text-[24px] font-extrabold text-[oklch(0.78_0.16_145)] mt-1.5">
                      100%
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-7">
                <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] rounded-2xl p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-[oklch(0.20_0.008_250)] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[oklch(0.68_0.18_265/0.12)] border border-[oklch(0.68_0.18_265/0.3)] text-[oklch(0.80_0.13_265)] flex items-center justify-center">
                        <Icon.Terminal size={16} />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-white m-0">Live Request Logs</h3>
                        <p className="text-[11.5px] text-[oklch(0.50_0.01_250)] m-0">Dynamic logs of the last API invocations.</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => sessionUser && fetchLogs(sessionUser.id)}
                      disabled={loadingLogs}
                      className="reset text-[oklch(0.50_0.01_250)] cursor-pointer flex p-1 bg-transparent border-none hover:text-white transition-colors disabled:opacity-50" 
                      title="Reload Logs"
                    >
                      <Icon.RefreshCw size={13} className={loadingLogs ? 'spin' : ''} />
                    </button>
                  </div>

                  {loadingLogs ? (
                    <div className="flex items-center justify-center gap-2 h-[160px] text-[oklch(0.50_0.01_250)]">
                      <Icon.Loader size={16} className="spin" />
                      <span className="text-[12.5px] font-mono">Fetching query logs...</span>
                    </div>
                  ) : logs.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {logs.map((log, index) => {
                        const date = new Date(log.created_at);
                        const formattedTime = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        return (
                          <div key={index} className="bg-[oklch(0.12_0.005_250/0.4)] border border-[oklch(0.18_0.008_250/0.5)] rounded-[10px] py-3 px-3.5 flex justify-between items-center">
                            <div className="flex gap-2.5 items-center">
                              <span className="text-[9.5px] bg-[oklch(0.68_0.18_265/0.12)] border border-[oklch(0.68_0.18_265/0.3)] text-[oklch(0.80_0.13_265)] px-1.5 py-0.5 rounded font-bold font-mono">
                                POST
                              </span>
                              <div>
                                <div className="text-[12.5px] font-semibold text-white font-mono">
                                  {log.tool_id === 'json' ? '/api/v1/format (JSON)' : log.tool_id === 'universal-ai-formatter' ? '/api/v1/format (AI)' : `/api/v1/${log.tool_id}`}
                                </div>
                                <div className="text-[11px] text-[oklch(0.50_0.01_250)] flex items-center gap-1 mt-0.5">
                                  <Icon.Clock size={10} />
                                  <span>{formattedTime}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="inline-flex items-center gap-1 bg-[oklch(0.78_0.16_145/0.12)] border border-[oklch(0.78_0.16_145/0.3)] text-[oklch(0.78_0.16_145)] px-2 py-0.5 rounded-md text-[11px] font-semibold">
                              <Icon.Check size={11} />
                              <span>200 OK</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[160px] gap-2.5 text-[oklch(0.50_0.01_250)] text-center">
                      <Icon.Terminal size={24} className="opacity-50" />
                      <span className="text-[12.5px] font-mono text-[oklch(0.50_0.01_250)]">$ tail -n 0 logs/stream.log</span>
                      <p className="m-0 text-[11px] text-[oklch(0.50_0.01_250/0.7)] max-w-[260px]">
                        Execute sandbox queries or call live endpoints to generate real-time developer metrics.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-[18px] font-bold text-white m-0 mb-4 tracking-[-0.02em]">
                System Nodes Operational Matrix
              </h2>
              <SpaceStatusDashboard />
            </div>
          </div>
        )}

        {activeConsoleTab === 'playground' && (
          <div className="flex flex-col gap-7 fade-in">
            <div className="flex gap-2.5 border-b border-[oklch(0.16_0.006_250)] pb-2">
              <button
                onClick={() => setPlaygroundSubTab('formatter')}
                className={`reset mono px-4 py-2 text-[12.5px] font-semibold rounded-md cursor-pointer flex items-center gap-1.5 transition-colors ${playgroundSubTab === 'formatter' ? 'border border-[oklch(0.68_0.18_265/0.4)] bg-[oklch(0.68_0.18_265/0.12)] text-white' : 'border border-transparent bg-transparent text-[oklch(0.50_0.01_250)] hover:text-white'}`}
              >
                <Icon.FileText size={12} />
                <span>Document Formatter Sandbox</span>
              </button>
              <button
                onClick={() => setPlaygroundSubTab('heic')}
                className={`reset mono px-4 py-2 text-[12.5px] font-semibold rounded-md cursor-pointer flex items-center gap-1.5 transition-colors ${playgroundSubTab === 'heic' ? 'border border-[oklch(0.68_0.18_265/0.4)] bg-[oklch(0.68_0.18_265/0.12)] text-white' : 'border border-transparent bg-transparent text-[oklch(0.50_0.01_250)] hover:text-white'}`}
              >
                <Icon.Image size={12} />
                <span>HEIC Converter Sandbox</span>
              </button>
            </div>

            {playgroundSubTab === 'formatter' ? (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-7 fade-in">
                <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] rounded-2xl p-6 flex flex-col gap-5">
                  <h3 className="text-[15px] font-bold text-white m-0">Sandbox Request Data</h3>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-[oklch(0.50_0.01_250)] font-semibold uppercase tracking-[0.04em] mono">Text Content Input</label>
                    <textarea
                      value={sandboxInput}
                      onChange={e => setSandboxInput(e.target.value)}
                      rows={5}
                      className="w-full bg-[#0e0f12] border border-[oklch(0.20_0.008_250)] rounded-lg p-3 text-white text-[13px] outline-none font-mono resize-y box-border focus:border-[var(--accent)] transition-colors"
                    />
                  </div>

                  <button
                    onClick={runSandboxTest}
                    disabled={sandboxLoading}
                    className="w-full px-4.5 py-3 rounded-lg bg-gradient-to-b from-[oklch(0.68_0.18_265)] to-[oklch(0.58_0.20_265)] text-white font-semibold text-[13px] flex items-center justify-center gap-2 shadow-[0_4px_12px_oklch(0.68_0.18_265/0.3)] border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                  >
                    {sandboxLoading ? <Icon.Loader size={14} className="spin" /> : <Icon.Zap size={14} />}
                    <span>{sandboxLoading ? 'Formatting Output...' : 'Execute Format API call'}</span>
                  </button>
                </div>

                <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] rounded-2xl p-6 flex flex-col gap-5">
                  <h3 className="text-[15px] font-bold text-white m-0">API Server Response</h3>

                  {sandboxResult ? (
                    <pre className={`bg-[#07080a] border border-[#16181d] rounded-[10px] p-4 m-0 text-[11.5px] leading-relaxed overflow-x-auto whitespace-pre-wrap break-all font-mono flex-1 min-h-[180px] ${sandboxResult.status === 'error' ? 'text-[oklch(0.65_0.22_20)]' : 'text-[#a5b4fc]'}`}>
                      {JSON.stringify(sandboxResult, null, 2)}
                    </pre>
                  ) : (
                    <div className="flex-1 border border-dashed border-[oklch(0.20_0.008_250)] rounded-xl flex flex-col items-center justify-center p-10 gap-2.5 text-[oklch(0.50_0.01_250)] min-h-[180px]">
                      <Icon.Code size={28} className="opacity-50" />
                      <span className="text-[12px] font-mono">tail -f response/output.json</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-7 fade-in">
                <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] rounded-2xl p-6 flex flex-col gap-5">
                  <h3 className="text-[15px] font-bold text-white m-0">Sandbox Request Data</h3>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] text-[oklch(0.50_0.01_250)] font-semibold uppercase tracking-[0.04em] mono">Target Output Format</label>
                    <select
                      value={heicSandboxFormat}
                      onChange={e => setHeicSandboxFormat(e.target.value as any)}
                      className="w-full bg-[#0e0f12] border border-[oklch(0.20_0.008_250)] rounded-lg p-2.5 text-white text-[13px] outline-none cursor-pointer focus:border-[var(--accent)] transition-colors"
                    >
                      <option value="jpg">Convert to JPEG format (.jpg)</option>
                      <option value="png">Convert to PNG format (.png)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] text-[oklch(0.50_0.01_250)] font-semibold uppercase tracking-[0.04em] mono">Upload HEIC File</label>
                    <input
                      type="file"
                      accept=".heic,.heif"
                      ref={fileInputSandboxRef}
                      onChange={e => setHeicSandboxFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <div 
                      onClick={() => fileInputSandboxRef.current?.click()}
                      className={`border border-dashed border-[oklch(0.20_0.008_250)] rounded-lg bg-[#0e0f12] py-5 px-3 text-center cursor-pointer text-[13px] hover:border-[var(--accent)] transition-colors ${heicSandboxFile ? 'text-white' : 'text-[oklch(0.50_0.01_250)]'}`}
                    >
                      {heicSandboxFile ? `Uploaded: ${heicSandboxFile.name} (${(heicSandboxFile.size / 1024 / 1024).toFixed(2)} MB)` : 'Click here to pick test HEIC image file'}
                    </div>
                  </div>

                  <button
                    onClick={runHeicSandboxTest}
                    disabled={heicSandboxLoading}
                    className="w-full px-4.5 py-3 rounded-lg bg-gradient-to-b from-[oklch(0.68_0.18_265)] to-[oklch(0.58_0.20_265)] text-white font-semibold text-[13px] flex items-center justify-center gap-2 shadow-[0_4px_12px_oklch(0.68_0.18_265/0.3)] border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                  >
                    {heicSandboxLoading ? <Icon.Loader size={14} className="spin" /> : <Icon.Zap size={14} />}
                    <span>{heicSandboxLoading ? 'Converting HEIC...' : 'Execute Convert Image API call'}</span>
                  </button>
                </div>

                <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] rounded-2xl p-6 flex flex-col gap-5">
                  <h3 className="text-[15px] font-bold text-white m-0">API Server Response</h3>

                  {heicSandboxResult ? (
                    <div className="flex flex-col gap-3.5 flex-1">
                      <pre className={`bg-[#07080a] border border-[#16181d] rounded-[10px] p-3 m-0 text-[11px] leading-[1.4] overflow-x-auto whitespace-pre-wrap break-all font-mono ${heicSandboxResult.status === 'error' ? 'text-[oklch(0.65_0.22_20)]' : 'text-[#a5b4fc]'}`}>
                        {JSON.stringify({
                          status: heicSandboxResult.status,
                          message: heicSandboxResult.message,
                          contentType: heicSandboxResult.contentType,
                          sizeBytes: heicSandboxResult.sizeBytes
                        }, null, 2)}
                      </pre>
                      
                      {heicSandboxResultUrl && (
                        <div className="flex flex-col gap-2">
                          <span className="text-[11px] text-[oklch(0.50_0.01_250)] font-semibold uppercase">CONVERTED BINARY IMAGE PREVIEW</span>
                          <div className="border border-[oklch(0.20_0.008_250)] rounded-lg p-1.5 bg-[#0e0f12] text-center">
                            <img 
                              src={heicSandboxResultUrl} 
                              alt="Converted HEIC Sandbox Result" 
                              className="max-w-full max-h-[180px] rounded-md object-contain"
                            />
                          </div>
                          <a 
                            href={heicSandboxResultUrl} 
                            download={`sandbox_converted_image.${heicSandboxFormat}`}
                            className="self-start text-[12px] font-semibold text-[oklch(0.68_0.18_265)] no-underline flex items-center gap-1 hover:underline"
                          >
                            <span>Download Converted File</span>
                            <Icon.ArrowRight size={11} />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 border border-dashed border-[oklch(0.20_0.008_250)] rounded-xl flex flex-col items-center justify-center p-10 gap-2.5 text-[oklch(0.50_0.01_250)] min-h-[180px]">
                      <Icon.Code size={28} className="opacity-50" />
                      <span className="text-[12px] font-mono">tail -f response/output.json</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeConsoleTab === 'credentials' && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-7 fade-in">
            <div className="flex flex-col gap-7">
              
              <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex items-center gap-2.5 border-b border-[oklch(0.20_0.008_250)] pb-3.5">
                  <Icon.Database size={16} className="text-[oklch(0.68_0.18_265)]" />
                  <div>
                    <h3 className="text-[15px] font-bold text-white m-0">API Credentials</h3>
                    <p className="text-[11.5px] text-[oklch(0.50_0.01_250)] m-0">Access tokens targeting formatting and media pipelines.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between border-b border-[oklch(0.16_0.006_250)] pb-3">
                    <div>
                      <span className="text-[9px] text-[oklch(0.50_0.01_250)] uppercase tracking-[0.04em] mono">Access Tier</span>
                      <div className="text-[13px] font-bold text-white mt-0.5">{planName}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-[oklch(0.50_0.01_250)] uppercase tracking-[0.04em] mono">Rate Limit</span>
                      <div className="text-[13px] font-bold text-white mt-0.5">{rateLimit}</div>
                    </div>
                  </div>

                  <div className="bg-[oklch(0.12_0.005_250/0.6)] border border-[oklch(0.18_0.008_250)] rounded-[10px] p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-semibold text-white">Default Secret Key</span>
                      <span className={`text-[8.5px] font-bold font-mono px-1.5 py-[1px] rounded uppercase ${isAnonUser ? 'bg-[oklch(0.72_0.18_25/0.12)] border-[oklch(0.72_0.18_25/0.3)] text-[oklch(0.72_0.18_25)] border' : 'bg-[oklch(0.78_0.16_145/0.12)] border-[oklch(0.78_0.16_145/0.3)] text-[oklch(0.78_0.16_145)] border'}`}>
                        {isAnonUser ? 'Sandbox' : 'Production'}
                      </span>
                    </div>

                    <div className="flex gap-2 items-center bg-[#0e0f12] border border-[#1c1d22] px-3 py-2 rounded-md">
                      <code className="flex-1 font-mono text-[11.5px] text-[#a5b4fc] overflow-hidden text-ellipsis whitespace-nowrap">
                        {apiKey ? (
                          isKeyRevealed ? apiKey : `${apiKey.slice(0, 12)}${'•'.repeat(Math.max(1, apiKey.length - 12))}`
                        ) : (
                          'No API Key generated yet'
                        )}
                      </code>
                      
                      <div className="flex gap-1.5">
                        {apiKey && (
                          <button
                            type="button"
                            onClick={() => setIsKeyRevealed(!isKeyRevealed)}
                            className="reset text-[oklch(0.50_0.01_250)] cursor-pointer flex p-1 bg-transparent border-none hover:text-white transition-colors"
                            title={isKeyRevealed ? "Hide Secret Key" : "Reveal Secret Key"}
                          >
                            {isKeyRevealed ? <Icon.EyeOff size={13} /> : <Icon.Eye size={13} />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleCopyKey}
                          className="reset cursor-pointer flex p-1 bg-transparent border-none hover:opacity-80 transition-opacity"
                          style={{ color: uuidCopied ? 'oklch(0.78 0.16 145)' : 'white' }}
                          title="Copy Key to Clipboard"
                        >
                          {uuidCopied ? <Icon.Check size={13} /> : <Icon.Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between text-[10.5px] text-[oklch(0.50_0.01_250)]">
                      <span>Scope: Read & Write</span>
                      <span>Created: Active Session</span>
                    </div>
                  </div>

                  {!isAnonUser && (
                    <button
                      type="button"
                      onClick={handleRegenerateKey}
                      disabled={isRegenerating}
                      className="reset py-2.5 border border-dashed border-[oklch(0.24_0.01_250)] rounded-lg text-[12px] font-semibold text-[oklch(0.70_0.01_250)] cursor-pointer flex items-center justify-center gap-1.5 transition-all bg-transparent hover:border-white hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRegenerating ? <Icon.Loader size={12} className="spin" /> : (apiKey ? <Icon.RefreshCw size={11} /> : <Icon.Key size={11} />)}
                      {isRegenerating ? (apiKey ? 'Rotating Token...' : 'Generating...') : (apiKey ? 'Rotate API Key' : 'Generate API Key')}
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] p-6 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center gap-1.5 text-white font-semibold text-[13px]">
                  <Icon.Globe size={14} className="text-[oklch(0.68_0.18_265)]" />
                  <span>Allowed Web Origins (CORS)</span>
                </div>
                <p className="text-[12px] text-[oklch(0.50_0.01_250)] m-0 leading-[1.45]">
                  Restrict browser requests to specific domains (e.g. `https://my-domain.com`). Leave `*` to permit all.
                </p>
                <input
                  type="text"
                  value={allowedOrigins}
                  onChange={e => handleSaveOrigins(e.target.value)}
                  className="w-full bg-[#0e0f12] border border-[oklch(0.20_0.008_250)] rounded-lg px-3 py-2 text-white text-[13px] outline-none box-border focus:border-[var(--accent)] transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-7">
              <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] rounded-2xl p-6 flex flex-col gap-4">
                <div>
                  <h3 className="text-[15px] font-bold text-white m-0">API Integration Snippets</h3>
                  <p className="text-[11.5px] text-[oklch(0.50_0.01_250)] m-0 mt-1">Authenticate your programs using standard HTTP request headers.</p>
                </div>

                <div className="flex gap-2 bg-[#0e0f12] border border-[#1c1d22] p-1 rounded-lg">
                  {(['curl', 'js', 'python', 'go'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSnippetTab(tab)}
                      className={`reset flex-1 px-2 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer text-center transition-all duration-150 ${snippetTab === tab ? 'bg-[oklch(0.20_0.01_250)] border border-[oklch(0.28_0.01_250)] text-white' : 'bg-transparent border border-transparent text-[oklch(0.50_0.01_250)] hover:text-white'}`}
                    >
                      {tab === 'curl' ? 'cURL' : tab === 'js' ? 'JS Fetch' : tab === 'python' ? 'Python' : 'Go'}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <pre className="bg-[#07080a] border border-[#16181d] rounded-[10px] p-4 m-0 text-[11.5px] leading-relaxed text-[#a5b4fc] overflow-x-auto whitespace-pre-wrap break-all font-mono text-left max-h-[220px]">
                    {codeSnippets[snippetTab]}
                  </pre>
                  
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(codeSnippets[snippetTab]);
                      alert("Snippet copied to clipboard!");
                    }}
                    className="reset absolute top-2.5 right-2.5 bg-[oklch(0.14_0.006_250/0.8)] border border-[oklch(0.24_0.01_250)] text-white px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer flex items-center gap-1 hover:bg-[oklch(0.20_0.008_250)] transition-colors"
                  >
                    <Icon.Copy size={10} />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] p-6 rounded-2xl flex items-center gap-4">
                <Icon.Server size={28} className="text-[oklch(0.70_0.15_195)] shrink-0" />
                <div>
                  <h4 className="m-0 text-[14px] font-bold text-white">OpenAPI Spec Specifications</h4>
                  <p className="m-0 mt-1 text-[12px] text-[oklch(0.50_0.01_250)] leading-[1.45]">
                    Download our OpenAPI 3.0 specs to instantly generate types, API clients, and mock servers.
                  </p>
                  <a href="/api/openapi.json" download="openapi.json" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[oklch(0.70_0.15_195)] no-underline mt-2.5 hover:underline">
                    Download openapi.json <Icon.ArrowRight size={11} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center mt-10 relative z-[1]">
        <button onClick={launchApp} className="px-6 py-3 rounded-[9px] bg-[var(--bg-elev-2)] border border-[var(--border)] text-[var(--fg)] font-medium text-[13.5px] cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-hover)]">Return to App Console</button>
      </div>
    </div>
  );
}
