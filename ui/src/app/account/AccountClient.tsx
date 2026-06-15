"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { Icon } from '../../components/LucideIcons';
import { supabase } from '../supabase';

export default function AccountClient() {
  const {
    brandName,
    userPlan,
    sessionUser,
    isAnonUser,
    handleShowPaywall,
    setAuthOpen,
    handleSignOut,
    theme,
    toggleTheme,
    pricingCohort,
    subscriptionStatus,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    customerId,
    subscriptionId,
    loadUserProfile,
    launchApp,
  } = useSaaS();

  const isLight = theme === 'light';
  const isLoggedIn = !!sessionUser && !sessionUser.is_anonymous;

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [snippetTab, setSnippetTab] = useState<'curl' | 'js' | 'python' | 'go' | 'rust' | 'csharp' | 'java' | 'php' | 'ruby'>('curl');
  const [allowedOrigins, setAllowedOrigins] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ms_allowed_origins') || '*';
    }
    return '*';
  });

  const onRefreshProfile = useCallback(() => {
    if (sessionUser?.id) {
      loadUserProfile(sessionUser.id);
    }
  }, [sessionUser, loadUserProfile]);

  // Sync hash changes to switch sidebar tabs
  useEffect(() => {
    const handleHashCheck = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace('#', '');
        if (['profile', 'security', 'preferences', 'billing', 'api-keys', 'danger'].includes(hash)) {
          setActiveTab(hash);
        }
      }
    };

    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    return () => {
      window.removeEventListener('hashchange', handleHashCheck);
    };
  }, []);

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `#${tab}`);
    }
  };

  const handleRegenerateKey = async () => {
    if (!supabase || !sessionUser || isAnonUser) return;
    if (apiKey) {
      const confirmRotate = confirm("Are you sure you want to regenerate your API Key? All current applications using this key will immediately receive a 401 Unauthorized status.");
      if (!confirmRotate) return;
    }

    setIsRegenerating(true);
    try {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let randomString = '';
      for (let i = 0; i < 24; i++) {
        randomString += chars[Math.floor(Math.random() * chars.length)];
      }
      const isPaidUser = userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin';
      const keyPrefix = isPaidUser ? 'ms_live_prod_' : 'ms_sandbox_';
      const generatedKey = `${keyPrefix}${randomString}`;

      const { error } = await supabase
        .from('profiles')
        .update({ api_key: generatedKey })
        .eq('id', sessionUser.id);

      if (error) throw error;
      setApiKey(generatedKey);
      alert("API Key rotated successfully!");
    } catch (err: any) {
      alert("Failed to rotate API Key: " + err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSaveOrigins = (origins: string) => {
    setAllowedOrigins(origins);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ms_allowed_origins', origins);
    }
  };

  useEffect(() => {
    async function loadKey() {
      if (supabase && sessionUser?.id && isLoggedIn) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('api_key')
            .eq('id', sessionUser.id)
            .single();
          if (data?.api_key) {
            setApiKey(data.api_key);
          }
        } catch (err) {
          console.error('Failed to load key inside AccountPage:', err);
        }
      }
    }
    loadKey();
  }, [sessionUser, isLoggedIn]);

  // Profile Information States (B2C Focus - strictly stripped B2B)
  const [profileName, setProfileName] = useState(() => {
    return sessionUser?.user_metadata?.name || '';
  });
  const [profileUsername, setProfileUsername] = useState(() => {
    return sessionUser?.user_metadata?.username || sessionUser?.email?.split('@')[0] || '';
  });
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(false);
    setProfileError(null);
    try {
      // 1. Sync to Supabase Auth user metadata (B2C: remove company/role)
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          name: profileName, 
          username: profileUsername
        }
      });
      if (authError) throw authError;

      // 2. Sync to public profiles table row in the database
      if (sessionUser?.id) {
        const { error: dbError } = await supabase
          .from('profiles')
          .update({
            name: profileName,
            username: profileUsername
          })
          .eq('id', sessionUser.id);
        if (dbError) throw dbError;
      }
      
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to save profile changes.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password & Security States
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      setPasswordSuccess(false);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage("Password must be at least 6 characters.");
      setPasswordSuccess(false);
      return;
    }
    setIsUpdatingPassword(true);
    setPasswordMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      setPasswordSuccess(true);
      setPasswordMessage("✓ Password updated successfully!");
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordMessage(null);
        setShowPasswordFields(false);
        setPasswordSuccess(false);
      }, 3000);
    } catch (err: any) {
      setPasswordSuccess(false);
      setPasswordMessage("Failed to update password: " + err.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Localization settings
  const [profileLanguage, setProfileLanguage] = useState(() => {
    return sessionUser?.user_metadata?.language || 'en_US';
  });
  const [profileTimezone, setProfileTimezone] = useState(() => {
    return sessionUser?.user_metadata?.timezone || 'UTC';
  });
  const [isSavingLoc, setIsSavingLoc] = useState(false);
  const [locSuccess, setLocSuccess] = useState(false);

  const handleSaveLocalization = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLoc(true);
    setLocSuccess(false);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          language: profileLanguage,
          timezone: profileTimezone
        }
      });
      if (error) throw error;
      setLocSuccess(true);
      setTimeout(() => setLocSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingLoc(false);
    }
  };

  // Layout preference
  const [editorLayout, setEditorLayout] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('uaf_layout') || 'standard';
    }
    return 'standard';
  });

  const handleLayoutChange = (layout: string) => {
    setEditorLayout(layout);
    if (typeof window !== 'undefined') {
      localStorage.setItem('uaf_layout', layout);
      window.dispatchEvent(new Event('storage'));
    }
  };

  // UI state-managed modal overlays & toasts
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelingSub, setIsCancelingSub] = useState(false);
  const [isResumingSub, setIsResumingSub] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [billingSuccess, setBillingSuccess] = useState(false);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [showDeactivateFields, setShowDeactivateFields] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [deactivateSuccess, setDeactivateSuccess] = useState(false);

  const [uuidCopied, setUuidCopied] = useState(false);
  const [dailyUsageCount, setDailyUsageCount] = useState(0);

  // Computed: subscription is being canceled but still active until period end
  const isCanceling = cancelAtPeriodEnd || subscriptionStatus === 'scheduled_cancel';

  // Secure customer portal dynamic redirection
  const handleManageBilling = async () => {
    try {
      setBillingMessage(null);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setBillingMessage("Error: Missing user session token. Try re-logging.");
        setBillingSuccess(false);
        return;
      }
      
      window.open(`/billing/portal?token=${token}`, '_blank');
    } catch (err: any) {
      setBillingMessage("Failed to open portal: " + err.message);
      setBillingSuccess(false);
    }
  };

  const fetchRealInvoices = useCallback(async () => {
    if (!supabase || !sessionUser || isAnonUser || userPlan === 'free') {
      setInvoices([]);
      return;
    }
    setLoadingInvoices(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setLoadingInvoices(false);
        return;
      }
      const response = await fetch(`/billing/invoices?token=${token}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch invoices');
      setInvoices(data.orders || []);
    } catch (e) {
      console.warn("Failed to load Creem invoices:", e);
    } finally {
      setLoadingInvoices(false);
    }
  }, [sessionUser, isAnonUser, userPlan]);

  useEffect(() => {
    fetchRealInvoices();
  }, [fetchRealInvoices]);

  // Programmatic cancellation handler — schedules cancel at period end
  const handleCancelSubscription = async () => {
    setIsCancelingSub(true);
    setBillingMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setBillingMessage("Authentication session expired.");
        setBillingSuccess(false);
        return;
      }

      const response = await fetch('/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to cancel subscription.');

      setBillingSuccess(true);
      setBillingMessage("✓ Your subscription has been canceled. You'll retain access until the end of your current billing period.");
      onRefreshProfile();
    } catch (err: any) {
      setBillingSuccess(false);
      setBillingMessage("Cancellation failed: " + err.message);
    } finally {
      setIsCancelingSub(false);
      setCancelModalOpen(false);
    }
  };

  // Resume a scheduled_cancel subscription
  const handleResumeSubscription = async () => {
    setIsResumingSub(true);
    setBillingMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setBillingMessage("Authentication session expired.");
        setBillingSuccess(false);
        return;
      }

      const response = await fetch('/billing/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to resume subscription.');

      setBillingSuccess(true);
      setBillingMessage("✓ Subscription resumed! Your plan will continue as normal.");
      onRefreshProfile();
    } catch (err: any) {
      setBillingSuccess(false);
      setBillingMessage("Resume failed: " + err.message);
    } finally {
      setIsResumingSub(false);
    }
  };

  const handleCopyUUID = () => {
    navigator.clipboard.writeText(apiKey || '');
    setUuidCopied(true);
    setTimeout(() => setUuidCopied(false), 3000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SAYONARA') {
      setDeactivateError("Please type 'SAYONARA' to confirm account deactivation.");
      return;
    }
    setIsDeleting(true);
    setDeactivateError(null);
    try {
      if (supabase && sessionUser?.id) {
        await supabase.from('profiles').delete().eq('id', sessionUser.id);
      }
      await supabase.auth.signOut();
      setDeactivateSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 3500);
    } catch (err: any) {
      setDeactivateError("Failed to deactivate account: " + err.message);
      setIsDeleting(false);
    }
  };

  // Load database profile data on mount to ensure auto-syncing
  useEffect(() => {
    if (!supabase || !sessionUser || isAnonUser) return;
    async function fetchDbProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, username')
          .eq('id', sessionUser.id)
          .single();
        if (!error && data) {
          if (data.name !== null && data.name !== undefined) setProfileName(data.name);
          if (data.username !== null && data.username !== undefined) setProfileUsername(data.username);
        }
      } catch (err) {
        console.warn("DB profile load bypassed:", err);
      }
    }
    fetchDbProfile();
  }, [sessionUser, isAnonUser]);

  const [isKeyRevealed, setIsKeyRevealed] = useState(false);

  // Fetch actual daily usage count for progress bar
  useEffect(() => {
    if (!supabase || !sessionUser) return;
    const fetchUsage = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count, error } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', sessionUser.id)
        .gte('created_at', today.toISOString());
      if (!error && count !== null) {
        setDailyUsageCount(count);
      }
    };
    fetchUsage();
  }, [sessionUser]);

  // Autoscroll to hash section (like #api-keys)
  useEffect(() => {
    const handleScrollToHash = () => {
      if (typeof window !== 'undefined' && window.location.hash === '#api-keys') {
        const element = document.getElementById('api-keys');
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Apply a temporary premium highlight styling
            element.style.outline = '2px solid var(--accent)';
            element.style.boxShadow = '0 0 24px var(--accent)50';
            element.style.transition = 'all 0.3s ease';
            setTimeout(() => {
              element.style.outline = 'none';
              element.style.boxShadow = 'none';
            }, 2500);
          }, 300);
        }
      }
    };

    handleScrollToHash();
    window.addEventListener('hashchange', handleScrollToHash);
    return () => {
      window.removeEventListener('hashchange', handleScrollToHash);
    };
  }, []);

  // Auto-sync billing status on mount to ensure database self-heals silently
  useEffect(() => {
    if (!supabase || !sessionUser || isAnonUser) return;
    
    let active = true;
    
    async function autoSyncBilling() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token || !active) return;

        const response = await fetch('/billing/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok && active) {
          onRefreshProfile();
        }
      } catch (err) {
        console.warn("Silent billing auto-sync bypassed:", err);
      }
    }

    autoSyncBilling();

    return () => {
      active = false;
    };
  }, [sessionUser, isAnonUser, onRefreshProfile]);

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 640, margin: '80px auto', padding: '0 32px', textAlign: 'center' }}>
        <Icon.Shield size={48} style={{ color: 'var(--fg-dim)', marginBottom: 20 }} />
        <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg)', margin: '0 0 10px' }}>Account Settings Locked</h2>
        <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
          You are currently visiting as a guest. Sign in or create a free account to customize workspace layout settings, manage subscriptions, and configure profile parameters.
        </p>
        <button onClick={() => setAuthOpen(true)} className="" style={{
          padding: '12px 28px', borderRadius: 9,
          background: 'linear-gradient(180deg, oklch(0.72 0.18 265), oklch(0.62 0.20 265))',
          color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          boxShadow: '0 4px 14px oklch(0.50 0.20 265 / 0.3)',
        }}>Sign In / Sign Up</button>
      </div>
    );
  }

  // Format active plan localized strings
  const today = new Date();
  const nextDate = currentPeriodEnd ? new Date(currentPeriodEnd) : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const nextStr = formatter.format(nextDate);

  const planName = userPlan === 'api' ? 'Developer API' : userPlan === 'pro' ? 'Pro Plan' : userPlan === 'admin' ? 'System Administrator' : 'Free Plan';
  const planPrice = userPlan === 'api' ? '$29.00' : userPlan === 'pro' ? '$9.00' : '$0.00';
  const planPeriod = userPlan === 'free' ? 'forever' : 'month';
  const planLimits = userPlan === 'api' 
    ? '2,000 daily API bearer token runs (120/min)' 
    : userPlan === 'pro' 
      ? '200 daily API runs (30/min)' 
      : '10 daily runs (10/min)';

  const activeKeyForSnippet = apiKey || 'sb_publishable_V66dv60NGqpWQ80q3PyALQ_Z4w0_08U';
  const codeSnippets: Record<string, string> = {
    curl: `curl -X POST https://mysaastools.vercel.app/api/v1/format \\\n  -H "Authorization: Bearer ${activeKeyForSnippet}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "text": "messy text here",\n    "style": "modern"\n  }'`,
    js: `fetch('https://mysaastools.vercel.app/api/v1/format', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer ${activeKeyForSnippet}',\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    text: 'messy text here',\n    style: 'modern'\n  })\n})\n.then(res => res.json())\n.then(data => console.log(data));`,
    python: `import requests\n\nurl = "https://mysaastools.vercel.app/api/v1/format"\nheaders = {\n    "Authorization": "Bearer ${activeKeyForSnippet}",\n    "Content-Type": "application/json"\n}\npayload = {\n    "text": "messy text here",\n    "style": "modern"\n}\n\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())`,
    go: `package main\n\nimport (\n\t"bytes"\n\t"encoding/json"\n\t"fmt"\n\t"net/http"\n\t"io"\n)\n\nfunc main() {\n\turl := "https://mysaastools.vercel.app/api/v1/format"\n\tpayload := map[string]string{"text": "messy text here", "style": "modern"}\n\tjsonVal, _ := json.Marshal(payload)\n\n\treq, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonVal))\n\treq.Header.Set("Authorization", "Bearer ${activeKeyForSnippet}")\n\treq.Header.Set("Content-Type", "application/json")\n\n\tclient := &http.Client{}\n\tresp, _ := client.Do(req)\n\tdefer resp.Body.Close()\n\n\tbody, _ := io.ReadAll(resp.Body)\n\tfmt.Println(string(body))\n}`,
    rust: `use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};\nuse serde_json::json;\n\n#[tokio::main]\nasync fn main() -> Result<(), Box<dyn std::error::Error>> {\n    let mut headers = HeaderMap::new();\n    headers.insert(AUTHORIZATION, HeaderValue::from_static("Bearer ${activeKeyForSnippet}"));\n    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));\n\n    let payload = json!({"text": "messy text here", "style": "modern"});\n    let res = reqwest::Client::new()\n        .post("https://mysaastools.vercel.app/api/v1/format")\n        .headers(headers).json(&payload).send().await?.text().await?;\n\n    println!("{}", res);\n    Ok(())\n}`,
    csharp: `using System;\nusing System.Net.Http;\nusing System.Text;\nusing System.Text.Json;\nusing System.Threading.Tasks;\n\nclass Program\n{\n    static async Task Main()\n    {\n        var client = new HttpClient();\n        var payload = new { text = "messy text here", style = "modern" };\n        var json = JsonSerializer.Serialize(payload);\n        var content = new StringContent(json, Encoding.UTF8, "application/json");\n        \n        client.DefaultRequestHeaders.Add("Authorization", "Bearer ${activeKeyForSnippet}");\n        var response = await client.PostAsync("https://mysaastools.vercel.app/api/v1/format", content);\n        Console.WriteLine(await response.Content.ReadAsStringAsync());\n    }\n}`,
    java: `import java.net.URI;\nimport java.net.http.HttpClient;\nimport java.net.http.HttpRequest;\nimport java.net.http.HttpResponse;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        String json = "{\\"text\\":\\"messy text here\\",\\"style\\":\\"modern\\"}";\n        HttpRequest request = HttpRequest.newBuilder()\n                .uri(URI.create("https://mysaastools.vercel.app/api/v1/format"))\n                .header("Authorization", "Bearer ${activeKeyForSnippet}")\n                .header("Content-Type", "application/json")\n                .POST(HttpRequest.BodyPublishers.ofString(json))\n                .build();\n        HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());\n        System.out.println(response.body());\n    }\n}`,
    php: `<?php\n$data = ['text' => 'messy text here', 'style' => 'modern'];\n$ch = curl_init('https://mysaastools.vercel.app/api/v1/format');\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ${activeKeyForSnippet}', 'Content-Type: application/json']);\n$response = curl_exec($ch);\ncurl_close($ch);\necho $response;\n?>`,
    ruby: `require 'net/http'\nrequire 'uri'\nrequire 'json'\n\nuri = URI.parse("https://mysaastools.vercel.app/api/v1/format")\nrequest = Net::HTTP::Post.new(uri)\nrequest["Authorization"] = "Bearer ${activeKeyForSnippet}"\nrequest["Content-Type"] = "application/json"\nrequest.body = JSON.dump({"text" => "messy text here", "style" => "modern"})\n\nreq_options = { use_ssl: uri.scheme == "https" }\nresponse = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|\n  http.request(request)\nend\nputs response.body`
  };

  const dailyLimitMax = userPlan === 'api' ? 2000 : userPlan === 'pro' ? 200 : isAnonUser ? 3 : 10;

  return (
    <div style={{
      maxWidth: 1040, margin: '40px auto 120px',
      padding: '0 24px', boxSizing: 'border-box',
      position: 'relative',
    }} className="fade-in">
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 800, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
        opacity: isLight ? 0.08 : 0.15,
        zIndex: 0,
      }}/>

      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Personal Profile</span>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.020em', margin: '8px 0 0', color: 'var(--fg)' }}>My Account Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--fg-dim)', margin: '6px 0 0' }}>Configure your display name, regional localizations, layout preferences, and manage secure SaaS billing.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: 32, flexWrap: 'wrap', position: 'relative', zIndex: 1, alignItems: 'start' }}>
        
        {/* Sidebar Tabs */}
        <div style={{
          width: 220,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          position: 'sticky',
          top: 100,
          alignSelf: 'start',
        }}>
          {[
            { id: 'profile', label: 'Profile Settings', icon: Icon.User },
            { id: 'security', label: 'Security & Access', icon: Icon.Lock },
            { id: 'preferences', label: 'Preferences', icon: Icon.Sliders },
            { id: 'billing', label: 'Billing & Plans', icon: Icon.CreditCard },
            { id: 'api-keys', label: 'API Keys & Secrets', icon: Icon.Key },
            { id: 'danger', label: 'Danger Zone', icon: Icon.AlertTriangle, color: 'oklch(0.65 0.22 20)' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className=""
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 450,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: isActive ? 'var(--bg-elev-2)' : 'transparent',
                  border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                  color: isActive ? (tab.color || 'white') : 'var(--fg-dim)',
                  transition: 'all 0.15s'
                }}
              >
                {tab.icon && React.createElement(tab.icon, { size: 14, style: { color: isActive ? (tab.color || 'var(--accent)') : 'var(--fg-subtle)' } })}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div style={{
          flex: 1,
          minWidth: 280,
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}>

          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="glass-card fade-in" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 8,
                  background: 'oklch(0.18 0.010 265 / 0.15)',
                  border: '1px solid oklch(0.70 0.18 265 / 0.3)',
                  color: 'oklch(0.70 0.18 265)',
                }}>
                  <Icon.Braces size={16} />
                </span>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: 0 }}>Profile Details</h3>
                  <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Update your registered public user handle and full display name.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }} className="mono">Registered Email</label>
                  <input type="text" readOnly value={sessionUser?.email || ''} style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    background: 'oklch(0.10 0.002 250)', border: '1px solid var(--border)',
                    color: 'var(--fg-muted)', fontSize: 13, outline: 'none', cursor: 'not-allowed', boxSizing: 'border-box'
                  }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }} className="mono">Full Display Name</label>
                  <input type="text" placeholder="Your full name" value={profileName} onChange={e => setProfileName(e.target.value)} style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    background: 'oklch(0.14 0.005 250)', border: '1px solid var(--border)',
                    color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box'
                  }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }} className="mono">Username Handle</label>
                  <div style={{ display: 'flex', position: 'relative', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, fontSize: 13, color: 'var(--fg-dim)' }}>@</span>
                    <input type="text" placeholder="username" value={profileUsername} onChange={e => setProfileUsername(e.target.value)} style={{
                      width: '100%', padding: '10px 12px 10px 26px', borderRadius: 8,
                      background: 'oklch(0.14 0.005 250)', border: '1px solid var(--border)',
                      color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box'
                    }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: profileError ? 'oklch(0.60 0.20 20)' : 'oklch(0.78 0.16 145)' }}>
                  {profileSuccess && "✓ Profile details updated successfully!"}
                  {profileError && profileError}
                </span>
                <button type="submit" disabled={isSavingProfile} className="" style={{
                  padding: '10px 20px', borderRadius: 8,
                  background: 'linear-gradient(180deg, oklch(0.96 0.005 250), oklch(0.86 0.005 250))',
                  color: 'oklch(0.16 0.008 250)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px oklch(0.96 0.005 250 / 0.15)'
                }}>
                  {isSavingProfile ? 'Saving...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleUpdatePassword} className="glass-card fade-in" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 8,
                  background: 'oklch(0.18 0.010 15 / 0.15)',
                  border: '1px solid oklch(0.70 0.18 15 / 0.3)',
                  color: 'oklch(0.70 0.18 15)',
                }}>
                  <Icon.Lock size={16} />
                </span>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: 0 }}>Security Settings</h3>
                  <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Update your account password. Secure crypt-hash applies.</p>
                </div>
              </div>

              {!showPasswordFields ? (
                <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', padding: '8px 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 550, color: 'white' }}>Account Password Protection</span>
                    <span style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>Last updated details saved. Minimum length constraints apply.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswordFields(true)}
                    className=""
                    style={{
                      padding: '8px 16px', borderRadius: 8,
                      background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                      color: 'var(--fg)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer'
                    }}
                  >
                    Change Password...
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="fade-in">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }} className="mono">New Password</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          required
                          type={showNewPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          style={{
                            width: '100%', padding: '10px 38px 10px 12px', borderRadius: 8,
                            background: 'oklch(0.14 0.005 250)', border: '1px solid var(--border)',
                            color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box'
                          }}
                        />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="" style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: 'var(--fg-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
                          {showNewPassword ? <Icon.EyeOff size={14} /> : <Icon.Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }} className="mono">Confirm New Password</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          required
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          style={{
                            width: '100%', padding: '10px 38px 10px 12px', borderRadius: 8,
                            background: 'oklch(0.14 0.005 250)', border: '1px solid var(--border)',
                            color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box'
                          }}
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="" style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: 'var(--fg-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
                          {showConfirmPassword ? <Icon.EyeOff size={14} /> : <Icon.Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: passwordSuccess ? 'oklch(0.78 0.16 145)' : 'oklch(0.60 0.20 20)' }}>
                      {passwordMessage && passwordMessage}
                    </span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => { setShowPasswordFields(false); setNewPassword(''); setConfirmPassword(''); setPasswordMessage(null); }}
                        className=""
                        style={{ fontSize: 12.5, color: 'var(--fg-dim)', cursor: 'pointer', background: 'none', border: 'none' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className=""
                        style={{
                          padding: '8px 16px', borderRadius: 8,
                          background: 'linear-gradient(180deg, oklch(0.96 0.005 250), oklch(0.86 0.005 250))',
                          color: 'oklch(0.16 0.008 250)', fontWeight: 600, fontSize: 12.5,
                          cursor: isUpdatingPassword ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}

          {activeTab === 'preferences' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="fade-in">
              {/* Section 3: Layout Configuration */}
              <div className="glass-card" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: 8,
                    background: 'oklch(0.18 0.010 210 / 0.15)',
                    border: '1px solid oklch(0.70 0.18 210 / 0.3)',
                    color: 'oklch(0.70 0.18 210)',
                  }}>
                    <Icon.Grid size={16} />
                  </span>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: 0 }}>Layout Settings</h3>
                    <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Choose the active alignment display of the document editing cockpit.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <button onClick={() => handleLayoutChange('standard')} className="layout-card" style={{
                    textAlign: 'left', padding: '16px 20px', borderRadius: 12,
                    background: editorLayout === 'standard' ? 'oklch(0.18 0.010 265 / 0.15)' : 'oklch(0.14 0.005 250)',
                    border: editorLayout === 'standard' ? '1px solid var(--accent)' : '1px solid var(--border)',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, transition: 'all 0.15s ease'
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Standard Layout</span>
                    <span style={{ fontSize: 11, color: 'var(--fg-subtle)', lineHeight: 1.4 }}>Dual comparison pane: Markdown text editor on the left and visual document outputs on the right.</span>
                  </button>

                  <button onClick={() => handleLayoutChange('reversed')} className="layout-card" style={{
                    textAlign: 'left', padding: '16px 20px', borderRadius: 12,
                    background: editorLayout === 'reversed' ? 'oklch(0.18 0.010 265 / 0.15)' : 'oklch(0.14 0.005 250)',
                    border: editorLayout === 'reversed' ? '1px solid var(--accent)' : '1px solid var(--border)',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, transition: 'all 0.15s ease'
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Reversed Layout</span>
                    <span style={{ fontSize: 11, color: 'var(--fg-subtle)', lineHeight: 1.4 }}>Mirror layout: Visual live outputs rendered on the left, editing Markdown content on the right.</span>
                  </button>
                </div>
              </div>

              {/* Section 4: Localization Preferences */}
              <form onSubmit={handleSaveLocalization} className="glass-card" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: 8,
                    background: 'oklch(0.18 0.010 120 / 0.15)',
                    border: '1px solid oklch(0.70 0.16 120 / 0.3)',
                    color: 'oklch(0.70 0.16 120)',
                  }}>
                    <Icon.Globe size={16} />
                  </span>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: 0 }}>Localization Preferences</h3>
                    <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Configure regional timezones and display languages.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }} className="mono">Display Language</label>
                    <select value={profileLanguage} onChange={e => setProfileLanguage(e.target.value)} style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      background: 'oklch(0.14 0.005 250)', border: '1px solid var(--border)',
                      color: 'white', fontSize: 13, outline: 'none', cursor: 'pointer', boxSizing: 'border-box'
                    }}>
                      <option value="en_US">English (United States)</option>
                      <option value="en_GB">English (United Kingdom)</option>
                      <option value="es_ES">Español (España)</option>
                      <option value="fr_FR">Français (France)</option>
                      <option value="de_DE">Deutsch (Deutschland)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }} className="mono">System Timezone</label>
                    <select value={profileTimezone} onChange={e => setProfileTimezone(e.target.value)} style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      background: 'oklch(0.14 0.005 250)', border: '1px solid var(--border)',
                      color: 'white', fontSize: 13, outline: 'none', cursor: 'pointer', boxSizing: 'border-box'
                    }}>
                      <option value="UTC">Coordinated Universal Time (UTC)</option>
                      <option value="America/New_York">Eastern Standard Time (New York, -5)</option>
                      <option value="Europe/London">Greenwich Mean Time (London, +0)</option>
                      <option value="Europe/Berlin">Central European Time (Berlin, +1)</option>
                      <option value="Asia/Kolkata">Indian Standard Time (New Delhi, +5:30)</option>
                      <option value="Asia/Tokyo">Japan Standard Time (Tokyo, +9)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'oklch(0.78 0.16 145)' }}>
                    {locSuccess && "✓ Localization saved successfully!"}
                  </span>
                  <button type="submit" disabled={isSavingLoc} className="" style={{
                    padding: '8px 16px', borderRadius: 8,
                    background: 'linear-gradient(180deg, oklch(0.96 0.005 250), oklch(0.86 0.005 250))',
                    color: 'oklch(0.16 0.008 250)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer'
                  }}>
                    {isSavingLoc ? 'Saving...' : 'Save Localization'}
                  </button>
                </div>
              </form>

              {/* Section 5: Daily limits visual meter */}
              <div className="glass-card" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: 8,
                    background: 'oklch(0.18 0.010 75 / 0.15)',
                    border: '1px solid oklch(0.70 0.16 75 / 0.3)',
                    color: 'oklch(0.70 0.16 75)',
                  }}>
                    <Icon.Sparkles size={16} />
                  </span>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: 0 }}>Daily Workspace Limit Meter</h3>
                    <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Real-time count of active data runs and metered bounds.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'white', fontWeight: 550 }}>Daily Metered Runs</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent)' }} className="mono">
                      {userPlan === 'pro' ? 'Unlimited / Unlimited' : userPlan === 'api' ? 'Unlimited / 30,000 API Runs/mo' : `${dailyUsageCount} / 20 used today`}
                    </span>
                  </div>

                  <div style={{ height: 10, width: '100%', background: 'oklch(0.18 0.005 250)', borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <div style={{
                      height: '100%',
                      width: (userPlan === 'pro' || userPlan === 'api') ? '100%' : `${Math.min((dailyUsageCount / 20) * 100, 100)}%`,
                      background: (userPlan === 'pro' || userPlan === 'api')
                        ? 'linear-gradient(90deg, oklch(0.70 0.18 265) 0%, oklch(0.70 0.16 195) 50%, oklch(0.70 0.16 145) 100%)'
                        : 'linear-gradient(90deg, oklch(0.70 0.16 145) 0%, oklch(0.70 0.16 75) 60%, oklch(0.65 0.20 20) 100%)',
                      boxShadow: '0 0 10px var(--accent)30',
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>
                  {userPlan !== 'pro' && userPlan !== 'api' && (
                    <p style={{ fontSize: 11.5, color: 'var(--fg-dim)', margin: 0, lineHeight: 1.4 }}>
                      Free registered accounts have a metered bound of 20 runs. Upgrade to Pro or API Tier to strip watermarks automatically and unlock unlimited daily loops!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="glass-card fade-in" style={{ padding: '32px 30px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 8,
                  background: 'oklch(0.18 0.010 145 / 0.15)',
                  border: '1px solid oklch(0.70 0.16 145 / 0.3)',
                  color: 'oklch(0.70 0.16 145)',
                }}>
                  <Icon.CreditCard size={16} />
                </span>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: 0 }}>Billing, Subscription & Invoices</h3>
                  <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Manage your active payment billing tier, view usage limits, and download invoices.</p>
                </div>
              </div>

              {billingMessage && (
                <div className="fade-in" style={{
                  padding: '12px 16px', borderRadius: 8,
                  background: billingMessage.startsWith('✓') ? 'oklch(0.22 0.010 145 / 0.15)' : 'oklch(0.18 0.010 15 / 0.15)',
                  border: billingMessage.startsWith('✓') ? '1px solid oklch(0.78 0.16 145 / 0.3)' : '1px solid oklch(0.78 0.16 15 / 0.3)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: 12.5
                }}>
                  <span>{billingMessage}</span>
                  <button onClick={() => setBillingMessage(null)} className="" style={{
                    color: 'var(--fg-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    padding: 4, background: 'none', border: 'none'
                  }}>
                    <Icon.X size={14} />
                  </button>
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 32,
              }}>
                {/* Left Side: Subscription Plan Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <span style={{ fontSize: 10.5, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }} className="mono">Active Plan</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>{planName}</span>
                      {userPlan !== 'free' && (
                        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>
                          {planPrice} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--fg-dim)' }}>/ {planPeriod}</span>
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isCanceling ? (
                          <>
                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.65 0.20 50)', boxShadow: '0 0 8px oklch(0.65 0.20 50)' }} />
                            <span style={{ fontSize: 12, color: 'oklch(0.65 0.20 50)', fontWeight: 600 }}>
                              Canceling
                            </span>
                          </>
                        ) : (userPlan === 'pro' || userPlan === 'api') ? (
                          <>
                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.78 0.16 145)', boxShadow: '0 0 8px oklch(0.78 0.16 145)' }} />
                            <span style={{ fontSize: 12, color: 'oklch(0.78 0.16 145)', fontWeight: 600 }}>
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--fg-dim)' }} />
                            <span style={{ fontSize: 12, color: 'var(--fg-dim)', fontWeight: 500 }}>
                              No Active Subscription
                            </span>
                          </>
                        )}
                      </div>
                      {isCanceling && (
                        <p style={{ fontSize: 12, color: 'oklch(0.65 0.20 50 / 0.9)', margin: 0, lineHeight: 1.45 }}>
                          Your plan remains active until <strong>{nextStr}</strong>. After that, your account will revert to the Free tier.
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <span style={{ fontSize: 10.5, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }} className="mono">Quotas & Usage Limits</span>
                    <p style={{ fontSize: 12.5, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.45 }}>
                      {planLimits}
                    </p>
                  </div>

                  {(userPlan === 'pro' || userPlan === 'api') && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 10.5, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 2, textAlign: 'right' }} className="mono">
                          {isCanceling ? 'Access Expires' : 'Next Billing Date'}
                        </span>
                        <span style={{ fontSize: 13, color: 'white', fontWeight: 500 }}>{nextStr}</span>
                      </div>
                      {!isCanceling && (
                        <div>
                          <span style={{ fontSize: 10.5, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 2, textAlign: 'right' }} className="mono">Payment Partner</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--fg-muted)' }}>
                            <Icon.CreditCard size={14} style={{ color: 'var(--accent)' }} />
                            <span>Creem Payment Hub</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
                    {userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                        {!isCanceling && (
                          <button onClick={() => handleShowPaywall()} className="" style={{
                            width: '100%', padding: '10px 14px', borderRadius: 8,
                            background: 'linear-gradient(180deg, var(--accent) 0%, oklch(0.60 0.16 265) 100%)',
                            border: '1px solid var(--border)',
                            color: 'white', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                            textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6
                          }}>
                            <Icon.Sparkles size={14} style={{ color: 'white' }} />
                            <span>Change Plan</span>
                          </button>
                        )}
                        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                          <button onClick={handleManageBilling} className="" style={{
                            flex: 1, padding: '10px 14px', borderRadius: 8,
                            background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                            color: 'var(--fg)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                            textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6
                          }}>
                            <Icon.Grid size={14} />
                            <span>Manage Billing</span>
                          </button>
                          {isCanceling ? (
                            <button onClick={handleResumeSubscription} disabled={isResumingSub} className="" style={{
                              flex: 1, padding: '10px 14px', borderRadius: 8,
                              background: 'oklch(0.18 0.010 145 / 0.15)', border: '1px solid oklch(0.70 0.16 145 / 0.3)',
                              color: 'oklch(0.78 0.16 145)', fontWeight: 600, fontSize: 12.5, cursor: isResumingSub ? 'not-allowed' : 'pointer',
                            }}>{isResumingSub ? 'Resuming...' : 'Resume Subscription'}</button>
                          ) : (
                            <button onClick={() => setCancelModalOpen(true)} className="" style={{
                              flex: 1, padding: '10px 14px', borderRadius: 8,
                              background: 'oklch(0.18 0.010 15 / 0.15)', border: '1px solid oklch(0.50 0.15 15 / 0.3)',
                              color: 'oklch(0.78 0.16 15)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                            }}>Cancel Subscription</button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                        <button onClick={() => handleShowPaywall()} className="" style={{
                          width: '100%', padding: '10px 14px', borderRadius: 8,
                          background: 'linear-gradient(180deg, var(--accent) 0%, oklch(0.60 0.16 265) 100%)',
                          border: '1px solid var(--border)',
                          color: 'white', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                          textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6
                        }}>
                          <Icon.Sparkles size={14} style={{ color: 'white' }} />
                          <span>Upgrade to Premium</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Invoice History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 10.5, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }} className="mono">Invoice History</span>
                    <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '0 0 12px' }}>View your payment history here. Download legally valid tax invoices directly in your secure Creem Portal.</p>
                  </div>

                  {userPlan === 'free' ? (
                    <div style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '24px 20px', background: 'var(--bg-elev-1)', border: '1px dashed var(--border)',
                      borderRadius: 12, textAlign: 'center', gap: 8
                    }}>
                      <Icon.FileText size={24} style={{ color: 'var(--fg-dim)' }} />
                      <span style={{ fontSize: 12.5, fontWeight: 555, color: 'var(--fg-subtle)' }}>No Invoices Yet</span>
                      <span style={{ fontSize: 11, color: 'var(--fg-dim)', maxWidth: 220 }}>Upgrade to a paid tier to generate invoice history.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {loadingInvoices ? (
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          padding: '24px 20px', background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
                          borderRadius: 10
                        }}>
                          <Icon.Loader size={16} className="spin" style={{ color: 'var(--accent)' }} />
                          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Retrieving Creem billing history...</span>
                        </div>
                      ) : invoices.length > 0 ? (
                        invoices.map((order) => {
                          const orderDate = new Date(order.createdAt);
                          const formattedOrderDate = formatter.format(orderDate);
                          const displayAmount = `$${(order.amount / 100).toFixed(2)}`;
                          const invId = `INV-${order.id.substring(0, 8).toUpperCase()}`;

                          return (
                            <div key={order.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '12px 14px', background: 'var(--bg-elev-1)',
                              border: '1px solid var(--border)', borderRadius: 10,
                            }}>
                              <div>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'white' }}>
                                  {formattedOrderDate}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--fg-dim)' }}>
                                  {invId} • {planName}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'white' }}>{displayAmount}</span>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  padding: '4px 8px', borderRadius: 6,
                                  background: 'oklch(0.70 0.16 145 / 0.12)', border: '1px solid oklch(0.70 0.16 145 / 0.3)',
                                  color: 'oklch(0.78 0.16 145)', fontSize: 11, fontWeight: 555
                                }}>
                                  <Icon.Check size={11} />
                                  <span>Paid</span>
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        /* Fallback to computed dynamic billing row if empty */
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 14px', background: 'var(--bg-elev-1)',
                          border: '1px solid var(--border)', borderRadius: 10,
                        }}>
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'white' }}>
                              {(() => {
                                const invoiceDate = currentPeriodEnd 
                                  ? new Date(new Date(currentPeriodEnd).getTime() - 30 * 24 * 60 * 60 * 1000)
                                  : new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
                                return formatter.format(invoiceDate);
                              })()}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--fg-dim)' }}>
                              {subscriptionId ? `INV-${subscriptionId.substring(0, 8).toUpperCase()}` : `INV-SANDBOX-${customerId?.substring(0, 6).toUpperCase() || 'NEW'}`} • {planName}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'white' }}>{planPrice}</span>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '4px 8px', borderRadius: 6,
                              background: 'oklch(0.70 0.16 145 / 0.12)', border: '1px solid oklch(0.70 0.16 145 / 0.3)',
                              color: 'oklch(0.78 0.16 145)', fontSize: 11, fontWeight: 555
                            }}>
                              <Icon.Check size={11} />
                              <span>Paid</span>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Portal Integration Button */}
                      <button 
                        onClick={handleManageBilling}
                        className=""
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          padding: '10px 14px', borderRadius: 10,
                          background: 'oklch(0.70 0.18 265 / 0.08)',
                          border: '1px dashed oklch(0.70 0.18 265 / 0.3)',
                          color: 'oklch(0.80 0.15 265)',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          transition: 'all 0.15s',
                          marginTop: 4
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'oklch(0.70 0.18 265 / 0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'oklch(0.70 0.18 265 / 0.08)'}
                      >
                        <Icon.Globe size={12} />
                        <span>View & Download Official Tax Invoices in Creem Portal →</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="fade-in">
              
              {/* Credentials Console Card */}
              <div style={{
                background: 'oklch(0.14 0.006 250)',
                border: '1px solid oklch(0.20 0.008 250)',
                borderRadius: 16,
                padding: 24,
                display: 'flex', flexDirection: 'column', gap: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid oklch(0.20 0.008 250)', paddingBottom: 14 }}>
                  <Icon.Database size={16} style={{ color: 'oklch(0.68 0.18 265)' }} />
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>API Credentials</h3>
                    <p style={{ fontSize: 11.5, color: 'oklch(0.50 0.01 250)', margin: 0 }}>Access tokens targeting formatting and media pipelines.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Account Details Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid oklch(0.16 0.006 250)', paddingBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 9, color: 'oklch(0.50 0.01 250)', textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mono">Access Tier</span>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 2 }}>{planName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 9, color: 'oklch(0.50 0.01 250)', textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mono">Rate Limit</span>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 2 }}>
                        {userPlan === 'api' ? '120 / min' : userPlan === 'pro' ? '30 / min' : isAnonUser ? '3 / min' : '10 / min'}
                      </div>
                    </div>
                  </div>

                  {/* Key block */}
                  <div style={{
                    background: 'oklch(0.12 0.005 250 / 0.6)', border: '1px solid oklch(0.18 0.008 250)',
                    borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>Default Secret Key</span>
                      <span style={{
                        fontSize: 8.5, fontWeight: 700, fontFamily: 'monospace',
                        background: isAnonUser ? 'oklch(0.72 0.18 25 / 0.12)' : 'oklch(0.78 0.16 145 / 0.12)',
                        border: isAnonUser ? '1px solid oklch(0.72 0.18 25 / 0.3)' : '1px solid oklch(0.78 0.16 145 / 0.3)',
                        color: isAnonUser ? 'oklch(0.72 0.18 25)' : 'oklch(0.78 0.16 145)',
                        padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase'
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
                            style={{ color: 'oklch(0.50 0.01 250)', cursor: 'pointer', display: 'flex', padding: 4 }}
                            title={isKeyRevealed ? "Hide Secret Key" : "Reveal Secret Key"}
                          >
                            {isKeyRevealed ? <Icon.EyeOff size={13} /> : <Icon.Eye size={13} />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleCopyUUID}
                          className=""
                          style={{ color: uuidCopied ? 'oklch(0.78 0.16 145)' : 'white', cursor: 'pointer', display: 'flex', padding: 4 }}
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

                  {/* Regenerate Key trigger */}
                  {!isAnonUser && (
                    <button
                      type="button"
                      onClick={handleRegenerateKey}
                      disabled={isRegenerating}
                      className=""
                      style={{
                        padding: '10px 0', border: '1px dashed oklch(0.24 0.01 250)', borderRadius: 8,
                        fontSize: 12, fontWeight: 600, color: 'oklch(0.70 0.01 250)', cursor: isRegenerating ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
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

              {/* Advanced CORS Settings Card */}
              <div style={{
                background: 'oklch(0.14 0.006 250)', border: '1px solid oklch(0.20 0.008 250)',
                borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12
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
                    width: '100%', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)',
                    borderRadius: 8, padding: '8px 12px', color: 'white', fontSize: 13, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Quota details meter */}
              <div style={{
                background: 'oklch(0.14 0.006 250)', border: '1px solid oklch(0.20 0.008 250)',
                padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid oklch(0.20 0.008 250)', paddingBottom: 12 }}>
                  <Icon.Sparkles size={16} style={{ color: 'oklch(0.68 0.18 265)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Monthly Quota details</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12.5, color: 'oklch(0.70 0.01 250)' }}>Metered Calls</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'oklch(0.68 0.18 265)' }} className="mono">
                      {`${dailyUsageCount} / ${dailyLimitMax} used today`}
                    </span>
                  </div>
                  <div style={{ height: 8, width: '100%', background: 'oklch(0.18 0.005 250)', borderRadius: 4, overflow: 'hidden', border: '1px solid oklch(0.20 0.008 250)' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min((dailyUsageCount / dailyLimitMax) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, oklch(0.68 0.18 265) 0%, oklch(0.78 0.16 75) 100%)',
                      transition: 'width 0.4s ease-out'
                    }} />
                  </div>
                </div>
              </div>

              {/* Integration Snippets Card */}
              <div style={{
                background: 'oklch(0.14 0.006 250)',
                border: '1px solid oklch(0.20 0.008 250)',
                borderRadius: 16,
                padding: 24,
                display: 'flex', flexDirection: 'column', gap: 16
              }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>API Integration Snippets</h3>
                  <p style={{ fontSize: 11.5, color: 'oklch(0.50 0.01 250)', margin: '4px 0 0' }}>Authenticate your programs using standard HTTP request headers.</p>
                </div>

                <div style={{ display: 'flex', gap: 6, background: '#0e0f12', border: '1px solid #1c1d22', padding: '6px', borderRadius: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {(['curl', 'js', 'python', 'go', 'rust', 'csharp', 'java', 'php', 'ruby'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSnippetTab(tab as any)}
                      className="mono"
                      style={{
                        padding: '6px 12px', borderRadius: 6,
                        fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        background: snippetTab === tab ? 'oklch(0.20 0.01 250)' : 'transparent',
                        border: snippetTab === tab ? '1px solid oklch(0.28 0.01 250)' : '1px solid transparent',
                        color: snippetTab === tab ? 'white' : 'oklch(0.50 0.01 250)',
                        textAlign: 'center', transition: 'all 0.15s'
                      }}
                    >
                      {tab === 'curl' ? 'cURL' : tab === 'js' ? 'JS Fetch' : tab === 'csharp' ? 'C#' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative' }}>
                  <pre style={{
                    background: '#07080a', border: '1px solid #16181d', borderRadius: 10,
                    padding: 16, margin: 0, fontSize: 11.5, lineHeight: 1.5,
                    color: '#a5b4fc', overflowX: 'auto', whiteSpace: 'pre',
                    fontFamily: 'monospace', textAlign: 'left', maxHeight: 220
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
                      position: 'absolute', top: 10, right: 10,
                      background: 'oklch(0.14 0.006 250 / 0.8)', border: '1px solid oklch(0.24 0.01 250)',
                      color: 'white', padding: '4px 8px', borderRadius: 6,
                      fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <Icon.Copy size={10} />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {/* OpenAPI spec sheet download */}
              <div style={{
                background: 'oklch(0.14 0.006 250)', border: '1px solid oklch(0.20 0.008 250)',
                padding: 24, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16
              }}>
                <Icon.Server size={28} style={{ color: 'oklch(0.70 0.15 195)', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'white' }}>OpenAPI Spec Specifications</h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'oklch(0.50 0.01 250)', lineHeight: 1.45 }}>
                    Download our OpenAPI 3.0 specs to instantly generate types, API clients, and mock servers.
                  </p>
                  <a href="/api/openapi.json" download="openapi.json" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                    color: 'oklch(0.70 0.15 195)', textDecoration: 'none', marginTop: 10
                  }}>
                    Download openapi.json <Icon.ArrowRight size={11} />
                  </a>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'danger' && (
            <div className="glass-card fade-in" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 20, border: '1px solid oklch(0.60 0.20 20 / 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid oklch(0.60 0.20 20 / 0.2)', paddingBottom: 14 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 8,
                  background: 'oklch(0.18 0.010 20 / 0.15)',
                  border: '1px solid oklch(0.60 0.20 20 / 0.3)',
                  color: 'oklch(0.65 0.22 20)',
                }}>
                  <Icon.Shield size={16} />
                </span>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'oklch(0.65 0.22 20)', margin: 0 }}>Danger Zone</h3>
                  <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Deactivate your workspace account permanently.</p>
                </div>
              </div>

              {!showDeactivateFields ? (
                <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', padding: '8px 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 550, color: 'oklch(0.65 0.22 20)' }}>Deactivate Workspace Account</span>
                    <span style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>Initiate permanent deletion protocol. Grace window applies.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeactivateFields(true)}
                    className=""
                    style={{
                      padding: '8px 16px', borderRadius: 8,
                      background: 'oklch(0.18 0.010 20 / 0.15)', border: '1px solid oklch(0.60 0.20 20 / 0.3)',
                      color: 'oklch(0.65 0.22 20)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer'
                    }}
                  >
                    Deactivate Account...
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="fade-in">
                  <div style={{
                    background: 'oklch(0.18 0.010 20 / 0.1)', border: '1px solid oklch(0.60 0.20 20 / 0.3)',
                    padding: '14px 18px', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10
                  }}>
                    <div style={{ fontSize: 13, color: 'oklch(0.65 0.22 20)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon.Shield size={14} />
                      <span>Immediate Deactivation Warning</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.5 }}>
                      Deactivating your account will freeze your Pro API keys and restrict workspace access immediately. As per global privacy compliance, all associated data is queued for absolute purging.
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                      <strong>20-Day Restoration Grace Window</strong>: Your account metadata and database records will remain in a soft-deleted state in our backend for exactly 20 days. If you return and log back in within 20 days, all configurations will be automatically restored. If you do not return, it will be permanently deleted.
                    </p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 10, color: 'var(--fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }} className="mono">
                      To confirm deactivation, please type "SAYONARA" below:
                    </label>
                    <input
                      type="text"
                      placeholder="Type SAYONARA to confirm"
                      value={deleteConfirmation}
                      onChange={e => setDeleteConfirmation(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8,
                        background: 'oklch(0.14 0.005 250)', border: '1px solid var(--border)',
                        color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {deactivateError && (
                    <div style={{ fontSize: 12, color: 'oklch(0.65 0.22 20)', fontWeight: 500 }}>
                      {deactivateError}
                    </div>
                  )}
                  {deactivateSuccess && (
                    <div style={{ fontSize: 12, color: 'oklch(0.78 0.16 145)', fontWeight: 555 }}>
                      ✓ SAYONARA! Deactivation successful. Redirecting to landing page...
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => { setShowDeactivateFields(false); setDeleteConfirmation(''); setDeactivateError(null); }}
                      className=""
                      style={{ fontSize: 12.5, color: 'var(--fg-dim)', cursor: 'pointer', background: 'none', border: 'none' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={deleteConfirmation !== 'SAYONARA' || isDeleting}
                      onClick={handleDeleteAccount}
                      className=""
                      style={{
                        padding: '10px 20px', borderRadius: 8,
                        background: deleteConfirmation === 'SAYONARA' ? 'oklch(0.65 0.22 20)' : 'oklch(0.18 0.010 20 / 0.1)',
                        border: deleteConfirmation === 'SAYONARA' ? 'none' : '1px solid var(--border)',
                        color: deleteConfirmation === 'SAYONARA' ? 'white' : 'var(--fg-dim)',
                        fontWeight: 600, fontSize: 13,
                        cursor: deleteConfirmation === 'SAYONARA' && !isDeleting ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {isDeleting ? 'Deactivating...' : 'Confirm Workspace Deactivation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <button onClick={launchApp} className="" style={{
          padding: '11px 24px', borderRadius: 9,
          background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
          color: 'var(--fg)', fontWeight: 500, fontSize: 13.5, cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
        >Return to App Console</button>
      </div>

      {/* Subscription Cancellation Confirmation Dialog Modal */}
      {cancelModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'oklch(0.12 0.005 250 / 0.75)',
          backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }} onClick={() => setCancelModalOpen(false)}>
          <div style={{
            width: '100%', maxWidth: 460,
            background: 'var(--bg-elev-1)',
            border: '1px solid oklch(0.60 0.20 20 / 0.3)',
            borderRadius: 16,
            padding: 28,
            boxShadow: '0 20px 40px oklch(0 0 0 / 0.4)',
            display: 'flex', flexDirection: 'column', gap: 20,
            animation: 'fadeIn 0.2s ease-out',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, borderRadius: '50%',
                background: 'oklch(0.18 0.010 20 / 0.15)',
                border: '1px solid oklch(0.60 0.20 20 / 0.3)',
                color: 'oklch(0.65 0.22 20)',
              }}>
                <Icon.AlertCircle size={20} />
              </span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'white', margin: 0 }}>Cancel Subscription?</h3>
                <p style={{ fontSize: 12, color: 'var(--fg-dim)', margin: 0 }}>Confirm subscription cancellation request</p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to cancel your premium subscription? You will still retain active access to all **{planName}** features until **{nextStr}**, after which your account will return to the Free Tier.
            </p>

            <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className=""
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8,
                  background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                  color: 'var(--fg)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                No, Keep Premium
              </button>
              <button
                type="button"
                disabled={isCancelingSub}
                onClick={handleCancelSubscription}
                className=""
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8,
                  background: 'oklch(0.65 0.22 20)',
                  color: 'white', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                  textAlign: 'center'
                }}
                >
                {isCancelingSub ? 'Canceling...' : 'Yes, Cancel Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
