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
      <div className="max-w-[640px] mx-auto my-[80px] px-8 text-center">
        <Icon.Shield size={48} className="text-[var(--fg-dim)] mb-5 inline-block" />
        <h2 className="text-[22px] font-semibold text-[var(--fg)] m-0 mb-2.5">Account Settings Locked</h2>
        <p className="text-[14px] text-[var(--fg-muted)] m-0 mb-6 leading-relaxed">
          You are currently visiting as a guest. Sign in or create a free account to customize workspace layout settings, manage subscriptions, and configure profile parameters.
        </p>
        <button onClick={() => setAuthOpen(true)} className="px-7 py-3 rounded-[9px] bg-gradient-to-b from-[oklch(0.72_0.18_265)] to-[oklch(0.62_0.20_265)] text-white font-semibold text-[14px] shadow-[0_4px_14px_oklch(0.50_0.20_265/0.3)] hover:opacity-90 transition-opacity">Sign In / Sign Up</button>
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
    <div className="max-w-[1040px] mx-auto mt-10 mb-[120px] px-6 box-border relative fade-in">
      <div 
        className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
          opacity: isLight ? 0.08 : 0.15,
        }}
      />

      <div className="text-center mb-10 relative z-10">
        <span className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-[0.1em]">Personal Profile</span>
        <h1 className="text-[28px] font-bold tracking-[-0.020em] mt-2 mb-0 text-[var(--fg)]">My Account Settings</h1>
        <p className="text-[14px] text-[var(--fg-dim)] mt-1.5 mb-0">Configure your display name, regional localizations, layout preferences, and manage secure SaaS billing.</p>
      </div>

      <div className="flex flex-row gap-8 flex-wrap relative z-10 items-start">
        
        {/* Sidebar Tabs */}
        <div className="w-[220px] shrink-0 flex flex-col gap-1.5 sticky top-[100px] self-start">
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
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[13px] cursor-pointer text-left transition-all duration-150 border ${isActive ? 'font-semibold bg-[var(--bg-elev-2)] border-[var(--border)]' : 'font-medium bg-transparent border-transparent text-[var(--fg-dim)]'}`}
                style={{ color: isActive ? (tab.color || 'white') : undefined }}
              >
                {tab.icon && React.createElement(tab.icon, { size: 14, style: { color: isActive ? (tab.color || 'var(--accent)') : 'var(--fg-subtle)' } })}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div className="flex-1 min-w-[280px] flex flex-col gap-7">

          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="glass-card fade-in p-[30px] flex flex-col gap-5">
              <div className="flex items-center gap-2.5 border-b border-[var(--border)] pb-3.5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[oklch(0.18_0.010_265/0.15)] border border-[oklch(0.70_0.18_265/0.3)] text-[oklch(0.70_0.18_265)]">
                  <Icon.Braces size={16} />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-white m-0">Profile Details</h3>
                  <p className="text-[12px] text-[var(--fg-dim)] m-0">Update your registered public user handle and full display name.</p>
                </div>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                <div>
                  <label className="block text-[10px] text-[var(--fg-dim)] font-semibold uppercase tracking-[0.05em] mb-1.5 mono">Registered Email</label>
                  <input type="text" readOnly value={sessionUser?.email || ''} className="w-full px-3 py-2.5 rounded-lg bg-[oklch(0.10_0.002_250)] border border-[var(--border)] text-[var(--fg-muted)] text-[13px] outline-none cursor-not-allowed box-border" />
                </div>

                <div>
                  <label className="block text-[10px] text-[var(--fg-dim)] font-semibold uppercase tracking-[0.05em] mb-1.5 mono">Full Display Name</label>
                  <input type="text" placeholder="Your full name" value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-[oklch(0.14_0.005_250)] border border-[var(--border)] text-white text-[13px] outline-none box-border" />
                </div>

                <div>
                  <label className="block text-[10px] text-[var(--fg-dim)] font-semibold uppercase tracking-[0.05em] mb-1.5 mono">Username Handle</label>
                  <div className="flex relative items-center">
                    <span className="absolute left-3 text-[13px] text-[var(--fg-dim)]">@</span>
                    <input type="text" placeholder="username" value={profileUsername} onChange={e => setProfileUsername(e.target.value)} className="w-full pl-[26px] pr-3 py-2.5 rounded-lg bg-[oklch(0.14_0.005_250)] border border-[var(--border)] text-white text-[13px] outline-none box-border" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-self-stretch justify-between border-t border-[var(--border)] pt-4 mt-2">
                <span className={`text-[12px] ${profileError ? 'text-[oklch(0.60_0.20_20)]' : 'text-[oklch(0.78_0.16_145)]'}`}>
                  {profileSuccess && "✓ Profile details updated successfully!"}
                  {profileError && profileError}
                </span>
                <button type="submit" disabled={isSavingProfile} className="px-5 py-2.5 rounded-lg bg-gradient-to-b from-[oklch(0.96_0.005_250)] to-[oklch(0.86_0.005_250)] text-[oklch(0.16_0.008_250)] font-semibold text-[13px] cursor-pointer flex items-center gap-1.5 shadow-[0_2px_8px_oklch(0.96_0.005_250/0.15)]">
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
            <div className="flex flex-col gap-7 fade-in">
              {/* Section 3: Layout Configuration */}
              <div className="glass-card p-[30px] flex flex-col gap-5">
                <div className="flex items-center gap-2.5 border-b border-[var(--border)] pb-3.5">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[oklch(0.18_0.010_210/0.15)] border border-[oklch(0.70_0.18_210/0.3)] text-[oklch(0.70_0.18_210)]">
                    <Icon.Grid size={16} />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white m-0">Layout Settings</h3>
                    <p className="text-[12px] text-[var(--fg-dim)] m-0">Choose the active alignment display of the document editing cockpit.</p>
                  </div>
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                  <button onClick={() => handleLayoutChange('standard')} className={`layout-card text-left px-5 py-4 rounded-xl cursor-pointer flex flex-col gap-1.5 transition-all duration-150 border ${editorLayout === 'standard' ? 'bg-[oklch(0.18_0.010_265/0.15)] border-[var(--accent)]' : 'bg-[oklch(0.14_0.005_250)] border-[var(--border)]'}`}>
                    <span className="text-[13px] font-semibold text-white">Standard Layout</span>
                    <span className="text-[11px] text-[var(--fg-subtle)] leading-[1.4]">Dual comparison pane: Markdown text editor on the left and visual document outputs on the right.</span>
                  </button>

                  <button onClick={() => handleLayoutChange('reversed')} className={`layout-card text-left px-5 py-4 rounded-xl cursor-pointer flex flex-col gap-1.5 transition-all duration-150 border ${editorLayout === 'reversed' ? 'bg-[oklch(0.18_0.010_265/0.15)] border-[var(--accent)]' : 'bg-[oklch(0.14_0.005_250)] border-[var(--border)]'}`}>
                    <span className="text-[13px] font-semibold text-white">Reversed Layout</span>
                    <span className="text-[11px] text-[var(--fg-subtle)] leading-[1.4]">Mirror layout: Visual live outputs rendered on the left, editing Markdown content on the right.</span>
                  </button>
                </div>
              </div>

              {/* Section 4: Localization Preferences */}
              <form onSubmit={handleSaveLocalization} className="glass-card p-[30px] flex flex-col gap-5">
                <div className="flex items-center gap-2.5 border-b border-[var(--border)] pb-3.5">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[oklch(0.18_0.010_120/0.15)] border border-[oklch(0.70_0.16_120/0.3)] text-[oklch(0.70_0.16_120)]">
                    <Icon.Globe size={16} />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white m-0">Localization Preferences</h3>
                    <p className="text-[12px] text-[var(--fg-dim)] m-0">Configure regional timezones and display languages.</p>
                  </div>
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                  <div>
                    <label className="block text-[10px] text-[var(--fg-dim)] font-semibold uppercase tracking-[0.05em] mb-1.5 mono">Display Language</label>
                    <select value={profileLanguage} onChange={e => setProfileLanguage(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-[oklch(0.14_0.005_250)] border border-[var(--border)] text-white text-[13px] outline-none cursor-pointer box-border">
                      <option value="en_US">English (United States)</option>
                      <option value="en_GB">English (United Kingdom)</option>
                      <option value="es_ES">Español (España)</option>
                      <option value="fr_FR">Français (France)</option>
                      <option value="de_DE">Deutsch (Deutschland)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[var(--fg-dim)] font-semibold uppercase tracking-[0.05em] mb-1.5 mono">System Timezone</label>
                    <select value={profileTimezone} onChange={e => setProfileTimezone(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-[oklch(0.14_0.005_250)] border border-[var(--border)] text-white text-[13px] outline-none cursor-pointer box-border">
                      <option value="UTC">Coordinated Universal Time (UTC)</option>
                      <option value="America/New_York">Eastern Standard Time (New York, -5)</option>
                      <option value="Europe/London">Greenwich Mean Time (London, +0)</option>
                      <option value="Europe/Berlin">Central European Time (Berlin, +1)</option>
                      <option value="Asia/Kolkata">Indian Standard Time (New Delhi, +5:30)</option>
                      <option value="Asia/Tokyo">Japan Standard Time (Tokyo, +9)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 mt-2">
                  <span className="text-[12px] text-[oklch(0.78_0.16_145)]">
                    {locSuccess && "✓ Localization saved successfully!"}
                  </span>
                  <button type="submit" disabled={isSavingLoc} className="px-4 py-2 rounded-lg bg-gradient-to-b from-[oklch(0.96_0.005_250)] to-[oklch(0.86_0.005_250)] text-[oklch(0.16_0.008_250)] font-semibold text-[12.5px] cursor-pointer">
                    {isSavingLoc ? 'Saving...' : 'Save Localization'}
                  </button>
                </div>
              </form>

              {/* Section 5: Daily limits visual meter */}
              <div className="glass-card p-[30px] flex flex-col gap-5">
                <div className="flex items-center gap-2.5 border-b border-[var(--border)] pb-3.5">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[oklch(0.18_0.010_75/0.15)] border border-[oklch(0.70_0.16_75/0.3)] text-[oklch(0.70_0.16_75)]">
                    <Icon.Sparkles size={16} />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white m-0">Daily Workspace Limit Meter</h3>
                    <p className="text-[12px] text-[var(--fg-dim)] m-0">Real-time count of active data runs and metered bounds.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-white font-[550]">Daily Metered Runs</span>
                    <span className="text-[12.5px] font-bold text-[var(--accent)] mono">
                      {userPlan === 'pro' ? 'Unlimited / Unlimited' : userPlan === 'api' ? 'Unlimited / 30,000 API Runs/mo' : `${dailyUsageCount} / 20 used today`}
                    </span>
                  </div>

                  <div className="h-2.5 w-full bg-[oklch(0.18_0.005_250)] rounded-[5px] overflow-hidden border border-[var(--border)]">
                    <div 
                      className="h-full shadow-[0_0_10px_var(--accent)30] transition-all duration-500 ease-out"
                      style={{
                        width: (userPlan === 'pro' || userPlan === 'api') ? '100%' : `${Math.min((dailyUsageCount / 20) * 100, 100)}%`,
                        background: (userPlan === 'pro' || userPlan === 'api')
                          ? 'linear-gradient(90deg, oklch(0.70 0.18 265) 0%, oklch(0.70 0.16 195) 50%, oklch(0.70 0.16 145) 100%)'
                          : 'linear-gradient(90deg, oklch(0.70 0.16 145) 0%, oklch(0.70 0.16 75) 60%, oklch(0.65 0.20 20) 100%)',
                      }} 
                    />
                  </div>
                  {userPlan !== 'pro' && userPlan !== 'api' && (
                    <p className="text-[11.5px] text-[var(--fg-dim)] m-0 leading-[1.4]">
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
                <div className="flex flex-col gap-5">
                  <div>
                    <span className="text-[10.5px] text-[var(--fg-dim)] font-semibold uppercase tracking-[0.05em] block mb-1.5 mono">Active Plan</span>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[22px] font-bold text-white">{planName}</span>
                      {userPlan !== 'free' && (
                        <span className="text-[15px] font-semibold text-[var(--accent)]">
                          {planPrice} <span className="text-[12px] font-normal text-[var(--fg-dim)]">/ {planPeriod}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center gap-1.5">
                        {isCanceling ? (
                          <>
                            <span className="inline-block w-2 h-2 rounded-full bg-[oklch(0.65_0.20_50)] shadow-[0_0_8px_oklch(0.65_0.20_50)]" />
                            <span className="text-[12px] text-[oklch(0.65_0.20_50)] font-semibold">
                              Canceling
                            </span>
                          </>
                        ) : (userPlan === 'pro' || userPlan === 'api') ? (
                          <>
                            <span className="inline-block w-2 h-2 rounded-full bg-[oklch(0.78_0.16_145)] shadow-[0_0_8px_oklch(0.78_0.16_145)]" />
                            <span className="text-[12px] text-[oklch(0.78_0.16_145)] font-semibold">
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="inline-block w-2 h-2 rounded-full bg-[var(--fg-dim)]" />
                            <span className="text-[12px] text-[var(--fg-dim)] font-medium">
                              No Active Subscription
                            </span>
                          </>
                        )}
                      </div>
                      {isCanceling && (
                        <p className="text-[12px] text-[oklch(0.65_0.20_50/0.9)] m-0 leading-[1.45]">
                          Your plan remains active until <strong>{nextStr}</strong>. After that, your account will revert to the Free tier.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[var(--border)] pt-3.5">
                    <span className="text-[10.5px] text-[var(--fg-dim)] font-semibold uppercase tracking-[0.05em] block mb-1 mono">Quotas & Usage Limits</span>
                    <p className="text-[12.5px] text-[var(--fg-muted)] m-0 leading-[1.45]">
                      {planLimits}
                    </p>
                  </div>

                  {(userPlan === 'pro' || userPlan === 'api') && (
                    <div className="border-t border-[var(--border)] pt-3.5 flex justify-between items-center">
                      <div>
                        <span className="text-[10.5px] text-[var(--fg-dim)] font-semibold uppercase tracking-[0.05em] block mb-0.5 text-right mono">
                          {isCanceling ? 'Access Expires' : 'Next Billing Date'}
                        </span>
                        <span className="text-[13px] text-white font-medium">{nextStr}</span>
                      </div>
                      {!isCanceling && (
                        <div>
                          <span className="text-[10.5px] text-[var(--fg-dim)] font-semibold uppercase tracking-[0.05em] block mb-0.5 text-right mono">Payment Partner</span>
                          <div className="flex items-center gap-1.5 text-[12.5px] text-[var(--fg-muted)]">
                            <Icon.CreditCard size={14} className="text-[var(--accent)]" />
                            <span>Creem Payment Hub</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-3 mt-auto">
                    {userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin' ? (
                      <div className="flex flex-col gap-2.5 w-full">
                        {!isCanceling && (
                          <button onClick={() => handleShowPaywall()} className="w-full px-3.5 py-2.5 rounded-lg bg-gradient-to-b from-[var(--accent)] to-[oklch(0.60_0.16_265)] border border-[var(--border)] text-white font-semibold text-[12.5px] cursor-pointer text-center inline-flex items-center justify-center gap-1.5">
                            <Icon.Sparkles size={14} className="text-white" />
                            <span>Change Plan</span>
                          </button>
                        )}
                        <div className="flex gap-2.5 w-full">
                          <button onClick={handleManageBilling} className="flex-1 px-3.5 py-2.5 rounded-lg bg-[var(--bg-elev-2)] border border-[var(--border)] text-[var(--fg)] font-semibold text-[12.5px] cursor-pointer text-center inline-flex items-center justify-center gap-1.5">
                            <Icon.Grid size={14} />
                            <span>Manage Billing</span>
                          </button>
                          {isCanceling ? (
                            <button onClick={handleResumeSubscription} disabled={isResumingSub} className={`flex-1 px-3.5 py-2.5 rounded-lg bg-[oklch(0.18_0.010_145/0.15)] border border-[oklch(0.70_0.16_145/0.3)] text-[oklch(0.78_0.16_145)] font-semibold text-[12.5px] ${isResumingSub ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                              {isResumingSub ? 'Resuming...' : 'Resume Subscription'}
                            </button>
                          ) : (
                            <button onClick={() => setCancelModalOpen(true)} className="flex-1 px-3.5 py-2.5 rounded-lg bg-[oklch(0.18_0.010_15/0.15)] border border-[oklch(0.50_0.15_15/0.3)] text-[oklch(0.78_0.16_15)] font-semibold text-[12.5px] cursor-pointer">
                              Cancel Subscription
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5 w-full">
                        <button onClick={() => handleShowPaywall()} className="w-full px-3.5 py-2.5 rounded-lg bg-gradient-to-b from-[var(--accent)] to-[oklch(0.60_0.16_265)] border border-[var(--border)] text-white font-semibold text-[12.5px] cursor-pointer text-center inline-flex items-center justify-center gap-1.5">
                          <Icon.Sparkles size={14} className="text-white" />
                          <span>Upgrade to Premium</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Invoice History */}
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-[10.5px] text-[var(--fg-dim)] font-semibold uppercase tracking-[0.05em] block mb-1.5 mono">Invoice History</span>
                    <p className="text-[12px] text-[var(--fg-muted)] m-0 mb-3">View your payment history here. Download legally valid tax invoices directly in your secure Creem Portal.</p>
                  </div>

                  {userPlan === 'free' ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 bg-[var(--bg-elev-1)] border border-dashed border-[var(--border)] rounded-xl text-center gap-2">
                      <Icon.FileText size={24} className="text-[var(--fg-dim)]" />
                      <span className="text-[12.5px] font-[555] text-[var(--fg-subtle)]">No Invoices Yet</span>
                      <span className="text-[11px] text-[var(--fg-dim)] max-w-[220px]">Upgrade to a paid tier to generate invoice history.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {loadingInvoices ? (
                        <div className="flex items-center justify-center gap-2 px-5 py-6 bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-[10px]">
                          <Icon.Loader size={16} className="spin text-[var(--accent)]" />
                          <span className="text-[12px] text-[var(--fg-muted)]">Retrieving Creem billing history...</span>
                        </div>
                      ) : invoices.length > 0 ? (
                        invoices.map((order) => {
                          const orderDate = new Date(order.createdAt);
                          const formattedOrderDate = formatter.format(orderDate);
                          const displayAmount = `$${(order.amount / 100).toFixed(2)}`;
                          const invId = `INV-${order.id.substring(0, 8).toUpperCase()}`;

                          return (
                            <div key={order.id} className="flex items-center justify-between px-[14px] py-[12px] bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-[10px]">
                              <div>
                                <div className="text-[12.5px] font-semibold text-white">
                                  {formattedOrderDate}
                                </div>
                                <div className="text-[11px] text-[var(--fg-dim)]">
                                  {invId} • {planName}
                                </div>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span className="text-[12.5px] font-semibold text-white">{displayAmount}</span>
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[oklch(0.70_0.16_145/0.12)] border border-[oklch(0.70_0.16_145/0.3)] text-[oklch(0.78_0.16_145)] text-[11px] font-[555]">
                                  <Icon.Check size={11} />
                                  <span>Paid</span>
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        /* Fallback to computed dynamic billing row if empty */
                        <div className="flex items-center justify-between px-[14px] py-[12px] bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-[10px]">
                          <div>
                            <div className="text-[12.5px] font-semibold text-white">
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
            <div className="flex flex-col gap-7 fade-in">
              
              {/* Credentials Console Card */}
              <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex items-center gap-2.5 border-b border-[oklch(0.20_0.008_250)] pb-3.5">
                  <Icon.Database size={16} className="text-[oklch(0.68_0.18_265)]" />
                  <div>
                    <h3 className="text-[15px] font-bold text-white m-0">API Credentials</h3>
                    <p className="text-[11.5px] text-[oklch(0.50_0.01_250)] m-0">Access tokens targeting formatting and media pipelines.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Account Details Row */}
                  <div className="flex justify-between border-b border-[oklch(0.16_0.006_250)] pb-3">
                    <div>
                      <span className="text-[9px] text-[oklch(0.50_0.01_250)] uppercase tracking-[0.04em] mono">Access Tier</span>
                      <div className="text-[13px] font-bold text-white mt-0.5">{planName}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-[oklch(0.50_0.01_250)] uppercase tracking-[0.04em] mono">Rate Limit</span>
                      <div className="text-[13px] font-bold text-white mt-0.5">
                        {userPlan === 'api' ? '120 / min' : userPlan === 'pro' ? '30 / min' : isAnonUser ? '3 / min' : '10 / min'}
                      </div>
                    </div>
                  </div>

                  {/* Key block */}
                  <div className="bg-[oklch(0.12_0.005_250/0.6)] border border-[oklch(0.18_0.008_250)] rounded-[10px] p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-semibold text-white">Default Secret Key</span>
                      <span className={`text-[8.5px] font-bold font-mono px-1.5 py-[1px] rounded uppercase ${isAnonUser ? 'bg-[oklch(0.72_0.18_25/0.12)] border border-[oklch(0.72_0.18_25/0.3)] text-[oklch(0.72_0.18_25)]' : 'bg-[oklch(0.78_0.16_145/0.12)] border border-[oklch(0.78_0.16_145/0.3)] text-[oklch(0.78_0.16_145)]'}`}>
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
                            className="text-[oklch(0.50_0.01_250)] cursor-pointer flex p-1"
                            title={isKeyRevealed ? "Hide Secret Key" : "Reveal Secret Key"}
                          >
                            {isKeyRevealed ? <Icon.EyeOff size={13} /> : <Icon.Eye size={13} />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleCopyUUID}
                          className={`cursor-pointer flex p-1 ${uuidCopied ? 'text-[oklch(0.78_0.16_145)]' : 'text-white'}`}
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

                  {/* Regenerate Key trigger */}
                  {!isAnonUser && (
                    <button
                      type="button"
                      onClick={handleRegenerateKey}
                      disabled={isRegenerating}
                      className={`py-2.5 border border-dashed border-[oklch(0.24_0.01_250)] rounded-lg text-[12px] font-semibold text-[oklch(0.70_0.01_250)] flex items-center justify-center gap-1.5 transition-all duration-200 bg-transparent hover:border-white hover:text-white ${isRegenerating ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {isRegenerating ? <Icon.Loader size={12} className="spin" /> : (apiKey ? <Icon.RefreshCw size={11} /> : <Icon.Key size={11} />)}
                      {isRegenerating ? (apiKey ? 'Rotating Token...' : 'Generating...') : (apiKey ? 'Rotate API Key' : 'Generate API Key')}
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced CORS Settings Card */}
              <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] rounded-2xl p-6 flex flex-col gap-3">
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
                  className="w-full bg-[#0e0f12] border border-[oklch(0.20_0.008_250)] rounded-lg px-3 py-2 text-white text-[13px] outline-none box-border"
                />
              </div>

              {/* Quota details meter */}
              <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-[oklch(0.20_0.008_250)] pb-3">
                  <Icon.Sparkles size={16} className="text-[oklch(0.68_0.18_265)]" />
                  <span className="text-[13px] font-bold text-white">Monthly Quota details</span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[12.5px] text-[oklch(0.70_0.01_250)]">Metered Calls</span>
                    <span className="text-[12.5px] font-bold text-[oklch(0.68_0.18_265)] mono">
                      {`${dailyUsageCount} / ${dailyLimitMax} used today`}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[oklch(0.18_0.005_250)] rounded overflow-hidden border border-[oklch(0.20_0.008_250)]">
                    <div 
                      className="h-full bg-gradient-to-r from-[oklch(0.68_0.18_265)] to-[oklch(0.78_0.16_75)] transition-all duration-400 ease-out"
                      style={{ width: `${Math.min((dailyUsageCount / dailyLimitMax) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Integration Snippets Card */}
              <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] rounded-2xl p-6 flex flex-col gap-4">
                <div>
                  <h3 className="text-[15px] font-bold text-white m-0">API Integration Snippets</h3>
                  <p className="text-[11.5px] text-[oklch(0.50_0.01_250)] mt-1 mb-0">Authenticate your programs using standard HTTP request headers.</p>
                </div>

                <div className="flex gap-1.5 bg-[#0e0f12] border border-[#1c1d22] p-1.5 rounded-[10px] overflow-x-auto scrollbar-none">
                  {(['curl', 'js', 'python', 'go', 'rust', 'csharp', 'java', 'php', 'ruby'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSnippetTab(tab as any)}
                      className={`mono px-3 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer text-center transition-all duration-150 border ${snippetTab === tab ? 'bg-[oklch(0.20_0.01_250)] border-[oklch(0.28_0.01_250)] text-white' : 'bg-transparent border-transparent text-[oklch(0.50_0.01_250)]'}`}
                    >
                      {tab === 'curl' ? 'cURL' : tab === 'js' ? 'JS Fetch' : tab === 'csharp' ? 'C#' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <pre className="bg-[#07080a] border border-[#16181d] rounded-[10px] p-4 m-0 text-[11.5px] leading-relaxed text-[#a5b4fc] overflow-x-auto whitespace-pre font-mono text-left max-h-[220px]">
                    {codeSnippets[snippetTab]}
                  </pre>
                  
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(codeSnippets[snippetTab]);
                      alert("Snippet copied to clipboard!");
                    }}
                    className="absolute top-2.5 right-2.5 bg-[oklch(0.14_0.006_250/0.8)] border border-[oklch(0.24_0.01_250)] text-white px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Icon.Copy size={10} />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {/* OpenAPI spec sheet download */}
              <div className="bg-[oklch(0.14_0.006_250)] border border-[oklch(0.20_0.008_250)] p-6 rounded-2xl flex items-center gap-4">
                <Icon.Server size={28} className="text-[oklch(0.70_0.15_195)] shrink-0" />
                <div>
                  <h4 className="m-0 text-[14px] font-bold text-white">OpenAPI Spec Specifications</h4>
                  <p className="mt-1 mb-0 text-[12px] text-[oklch(0.50_0.01_250)] leading-[1.45]">
                    Download our OpenAPI 3.0 specs to instantly generate types, API clients, and mock servers.
                  </p>
                  <a href="/api/openapi.json" download="openapi.json" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[oklch(0.70_0.15_195)] no-underline mt-2.5">
                    Download openapi.json <Icon.ArrowRight size={11} />
                  </a>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'danger' && (
            <div className="glass-card fade-in p-[30px] flex flex-col gap-5 border border-[oklch(0.60_0.20_20/0.25)]">
              <div className="flex items-center gap-2.5 border-b border-[oklch(0.60_0.20_20/0.2)] pb-3.5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[oklch(0.18_0.010_20/0.15)] border border-[oklch(0.60_0.20_20/0.3)] text-[oklch(0.65_0.22_20)]">
                  <Icon.Shield size={16} />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-[oklch(0.65_0.22_20)] m-0">Danger Zone</h3>
                  <p className="text-[12px] text-[var(--fg-dim)] m-0">Deactivate your workspace account permanently.</p>
                </div>
              </div>

              {!showDeactivateFields ? (
                <div className="flex items-center justify-self-stretch justify-between py-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-[550] text-[oklch(0.65_0.22_20)]">Deactivate Workspace Account</span>
                    <span className="text-[11.5px] text-[var(--fg-subtle)]">Initiate permanent deletion protocol. Grace window applies.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeactivateFields(true)}
                    className="px-4 py-2 rounded-lg bg-[oklch(0.18_0.010_20/0.15)] border border-[oklch(0.60_0.20_20/0.3)] text-[oklch(0.65_0.22_20)] font-semibold text-[12.5px] cursor-pointer"
                  >
                    Deactivate Account...
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 fade-in">
                  <div className="bg-[oklch(0.18_0.010_20/0.1)] border border-[oklch(0.60_0.20_20/0.3)] px-4.5 py-3.5 rounded-[10px] flex flex-col gap-2.5">
                    <div className="text-[13px] text-[oklch(0.65_0.22_20)] font-semibold flex items-center gap-1.5">
                      <Icon.Shield size={14} />
                      <span>Immediate Deactivation Warning</span>
                    </div>
                    <p className="text-[12px] text-[var(--fg-muted)] m-0 leading-relaxed">
                      Deactivating your account will freeze your Pro API keys and restrict workspace access immediately. As per global privacy compliance, all associated data is queued for absolute purging.
                    </p>
                    <p className="text-[12px] text-[var(--fg-muted)] m-0 leading-relaxed font-medium">
                      <strong>20-Day Restoration Grace Window</strong>: Your account metadata and database records will remain in a soft-deleted state in our backend for exactly 20 days. If you return and log back in within 20 days, all configurations will be automatically restored. If you do not return, it will be permanently deleted.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[var(--fg-dim)] font-semibold uppercase tracking-[0.05em] mb-2 mono">
                      To confirm deactivation, please type "SAYONARA" below:
                    </label>
                    <input
                      type="text"
                      placeholder="Type SAYONARA to confirm"
                      value={deleteConfirmation}
                      onChange={e => setDeleteConfirmation(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-[oklch(0.14_0.005_250)] border border-[var(--border)] text-white text-[13px] outline-none box-border"
                    />
                  </div>

                  {deactivateError && (
                    <div className="text-[12px] text-[oklch(0.65_0.22_20)] font-medium">
                      {deactivateError}
                    </div>
                  )}
                  {deactivateSuccess && (
                    <div className="text-[12px] text-[oklch(0.78_0.16_145)] font-[555]">
                      ✓ SAYONARA! Deactivation successful. Redirecting to landing page...
                    </div>
                  )}

                  <div className="flex items-center justify-self-stretch justify-between border-t border-[var(--border)] pt-4 mt-2">
                    <button
                      type="button"
                      onClick={() => { setShowDeactivateFields(false); setDeleteConfirmation(''); setDeactivateError(null); }}
                      className="text-[12.5px] text-[var(--fg-dim)] cursor-pointer bg-transparent border-transparent"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={deleteConfirmation !== 'SAYONARA' || isDeleting}
                      onClick={handleDeleteAccount}
                      className={`px-5 py-2.5 rounded-lg font-semibold text-[13px] ${deleteConfirmation === 'SAYONARA' ? 'bg-[oklch(0.65_0.22_20)] border-transparent text-white' : 'bg-[oklch(0.18_0.010_20/0.1)] border border-[var(--border)] text-[var(--fg-dim)]'} ${deleteConfirmation === 'SAYONARA' && !isDeleting ? 'cursor-pointer' : 'cursor-not-allowed'}`}
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

      <div className="flex justify-center mt-10">
        <button onClick={launchApp} className="px-6 py-2.5 rounded-[9px] bg-[var(--bg-elev-2)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--fg)] font-medium text-[13.5px] cursor-pointer transition-colors duration-150">Return to App Console</button>
      </div>

      {/* Subscription Cancellation Confirmation Dialog Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-[oklch(0.12_0.005_250/0.75)] backdrop-blur-md flex items-center justify-center p-5" onClick={() => setCancelModalOpen(false)}>
          <div className="w-full max-w-[460px] bg-[var(--bg-elev-1)] border border-[oklch(0.60_0.20_20/0.3)] rounded-2xl p-7 shadow-[0_20px_40px_oklch(0_0_0/0.4)] flex flex-col gap-5 animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[oklch(0.18_0.010_20/0.15)] border border-[oklch(0.60_0.20_20/0.3)] text-[oklch(0.65_0.22_20)]">
                <Icon.AlertCircle size={20} />
              </span>
              <div>
                <h3 className="text-[16px] font-semibold text-white m-0">Cancel Subscription?</h3>
                <p className="text-[12px] text-[var(--fg-dim)] m-0">Confirm subscription cancellation request</p>
              </div>
            </div>

            <p className="text-[13px] text-[var(--fg-muted)] m-0 leading-relaxed">
              Are you sure you want to cancel your premium subscription? You will still retain active access to all **{planName}** features until **{nextStr}**, after which your account will return to the Free Tier.
            </p>

            <div className="flex gap-3 border-t border-[var(--border)] pt-4.5">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-[var(--bg-elev-2)] border border-[var(--border)] text-[var(--fg)] font-semibold text-[12.5px] cursor-pointer text-center"
              >
                No, Keep Premium
              </button>
              <button
                type="button"
                disabled={isCancelingSub}
                onClick={handleCancelSubscription}
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-[oklch(0.65_0.22_20)] text-white font-semibold text-[12.5px] cursor-pointer text-center"
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
