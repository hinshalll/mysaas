"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../app/supabase';
import { ALL_TOOLS } from '../app/config';

interface CustomAlert {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface SaaSContextType {
  // Navigation / View State
  view: string;
  setView: React.Dispatch<React.SetStateAction<string>>;
  activeTool: any;

  // Theme State
  theme: 'dark' | 'light';
  setTheme: React.Dispatch<React.SetStateAction<'dark' | 'light'>>;
  toggleTheme: () => void;

  // UI Overlays & Modals
  palette: boolean;
  setPalette: React.Dispatch<React.SetStateAction<boolean>>;
  launcher: boolean;
  setLauncher: React.Dispatch<React.SetStateAction<boolean>>;
  scrolled: boolean;
  setScrolled: React.Dispatch<React.SetStateAction<boolean>>;
  enterpriseOpen: boolean;
  setEnterpriseOpen: React.Dispatch<React.SetStateAction<boolean>>;
  authOpen: boolean;
  setAuthOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showPaywall: boolean;
  setShowPaywall: React.Dispatch<React.SetStateAction<boolean>>;
  showSuccessBanner: boolean;
  setShowSuccessBanner: React.Dispatch<React.SetStateAction<boolean>>;

  // Notifications
  customAlert: CustomAlert | null;
  setCustomAlert: React.Dispatch<React.SetStateAction<CustomAlert | null>>;
  customToast: string | null;
  setCustomToast: React.Dispatch<React.SetStateAction<string | null>>;

  // Brand Customization
  brandName: string;
  setBrandName: (name: string) => void;

  // Supabase Auth
  sessionUser: any;
  setSessionUser: React.Dispatch<React.SetStateAction<any>>;
  isAnonUser: boolean;
  setIsAnonUser: React.Dispatch<React.SetStateAction<boolean>>;
  userPlan: 'free' | 'pro' | 'admin' | 'api';
  setUserPlan: React.Dispatch<React.SetStateAction<'free' | 'pro' | 'admin' | 'api'>>;
  isPremium: boolean;
  handleSignOut: () => Promise<void>;
  loadUserProfile: (userId: string) => Promise<void>;

  // Creem Billing
  subscriptionStatus: string;
  setSubscriptionStatus: React.Dispatch<React.SetStateAction<string>>;
  currentPeriodEnd: string | null;
  setCurrentPeriodEnd: React.Dispatch<React.SetStateAction<string | null>>;
  cancelAtPeriodEnd: boolean;
  setCancelAtPeriodEnd: React.Dispatch<React.SetStateAction<boolean>>;
  customerId: string | null;
  setCustomerId: React.Dispatch<React.SetStateAction<string | null>>;
  subscriptionId: string | null;
  setSubscriptionId: React.Dispatch<React.SetStateAction<string | null>>;
  countryCode: string;
  pricingCohort: 'high' | 'mid' | 'low' | 'india';
  pricingData: any;

  // Usage telemetry
  checkAndLogUsage: (toolId: string, isTier2: boolean) => Promise<boolean>;
  handleShowPaywall: (reason?: 'limit' | 'upgrade', toolName?: string, currentLimit?: number) => void;

  // Router functions
  openTool: (id: string) => void;
  launchApp: () => void;
  goHome: () => void;
  backToLanding: () => void;
}

const SaaSContext = createContext<SaaSContextType | undefined>(undefined);

export function SaaSProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Navigation / Routing Views
  const [view, setView] = useState('landing');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [palette, setPalette] = useState(false);
  const [launcher, setLauncher] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);

  // Dynamic Branding
  const [brandName, _setBrandName] = useState('MySaaS');

  // Handle setting brand name both state-wise and in localStorage
  const setBrandName = useCallback((name: string) => {
    _setBrandName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('brandName', name);
    }
  }, []);

  // Supabase Auth and Profile
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isAnonUser, setIsAnonUser] = useState(false);
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'admin' | 'api'>('free');
  const [authOpen, setAuthOpen] = useState(false);

  // Subscription Details
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('none');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean>(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Geo Pricing variables
  const [countryCode, setCountryCode] = useState('US');
  const [pricingCohort, setPricingCohort] = useState<'high' | 'mid' | 'low' | 'india'>('high');

  // Paywall Modal Trigger
  const [showPaywall, setShowPaywall] = useState(false);

  // Custom UI Notifications
  const [customAlert, setCustomAlert] = useState<CustomAlert | null>(null);
  const [customToast, setCustomToast] = useState<string | null>(null);

  const isPremium = useMemo(() => {
    return userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin';
  }, [userPlan]);

  const activeTool = useMemo(() => {
    const isSpecialView = ['landing', 'home', 'pricing', 'about', 'docs', 'developer', 'account', 'changelog', 'roadmap', 'contact', 'privacy', 'blog'].includes(view) || view.startsWith('category_');
    if (isSpecialView) return null;
    return ALL_TOOLS.find(t => t.id === view);
  }, [view]);

  // Auto-dismiss custom toasts
  useEffect(() => {
    if (customToast) {
      const timer = setTimeout(() => {
        setCustomToast(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [customToast]);

  // Global window.alert override
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.alert = (message: string) => {
        const msgLower = message.toLowerCase();
        
        if (msgLower.includes("copied") || msgLower.includes("success") || message.length < 35) {
          setCustomToast(message);
          return;
        }
        
        if (msgLower.includes("sign in") || msgLower.includes("account") || msgLower.includes("limit")) {
          setCustomAlert({
            title: "Authentication Required",
            message: message,
            actionLabel: "Sign In / Up",
            onAction: () => setAuthOpen(true)
          });
        } else if (msgLower.includes("error") || msgLower.includes("failed")) {
          setCustomAlert({
            title: "System Notification",
            message: message
          });
        } else {
          setCustomAlert({
            title: "Notification Alert",
            message: message
          });
        }
      };
    }
  }, []);

  const handleShowPaywall = useCallback((reason?: 'limit' | 'upgrade', toolName?: string, currentLimit?: number) => {
    const isGuest = !sessionUser || isAnonUser;

    if (reason === 'limit') {
      const displayTool = toolName || 'our SaaS tools';
      const displayLimit = currentLimit || (isGuest ? 5 : 20);

      if (isGuest) {
        setCustomAlert({
          title: `Limit Reached for ${displayTool}`,
          message: `You've reached the free guest limit of ${displayLimit} daily runs for ${displayTool}. Please sign in or create a free account to increase your limit to 20 daily runs, or upgrade to a Pro workspace for unlimited high-speed exports!`,
          actionLabel: "Sign In / Up",
          onAction: () => setAuthOpen(true)
        });
      } else {
        setCustomAlert({
          title: `Limit Reached for ${displayTool}`,
          message: `You've reached your free limit of ${displayLimit} daily runs for ${displayTool}. Upgrade to a Pro workspace to get unlimited high-speed exports, premium formatting themes, and API access!`,
          actionLabel: "Upgrade to Pro",
          onAction: () => setShowPaywall(true)
        });
      }
    } else {
      if (isGuest) {
        setCustomAlert({
          title: "Authentication Required",
          message: "Please sign in or create an account to upgrade to a Pro workspace and unlock premium features!",
          actionLabel: "Sign In / Up",
          onAction: () => setAuthOpen(true)
        });
      } else {
        setShowPaywall(true);
      }
    }
  }, [sessionUser, isAnonUser]);

  // Geo Fetching for PPP pricing
  useEffect(() => {
    async function fetchCountry() {
      let cc = 'US';
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (data && data.country_code) {
            cc = data.country_code.toUpperCase();
          }
        } else {
          throw new Error("Primary geo-fetch failed");
        }
      } catch (err) {
        try {
          const resFallback = await fetch('https://freeipapi.com/api/json');
          if (resFallback.ok) {
            const dataFallback = await resFallback.json();
            if (dataFallback && dataFallback.countryCode) {
              cc = dataFallback.countryCode.toUpperCase();
            }
          }
        } catch (fallbackErr) {
          // Fail silently
        }
      }

      setCountryCode(cc);
      setPricingCohort('high'); // Default global cohort
    }
    fetchCountry();
  }, []);

  const pricingData = useMemo(() => {
    if (pricingCohort === 'india') {
      return {
        currency: '₹',
        monthly: '299',
        weekly: '149',
        daily: '49',
        suffix: '/ month, cancel anytime',
        weeklySuffix: 'for a 7-day pass',
        dailySuffix: 'for a 24-hour pass',
      };
    } else if (pricingCohort === 'mid') {
      return {
        currency: '$',
        monthly: '3.99',
        weekly: '1.99',
        daily: '0.49',
        suffix: '/ month, cancel anytime',
        weeklySuffix: 'for a 7-day pass',
        dailySuffix: 'for a 24-hour pass',
      };
    } else if (pricingCohort === 'low') {
      return {
        currency: '$',
        monthly: '1.99',
        weekly: '0.99',
        daily: '0.25',
        suffix: '/ month, cancel anytime',
        weeklySuffix: 'for a 7-day pass',
        dailySuffix: 'for a 24-hour pass',
      };
    } else {
      return {
        currency: '$',
        monthly: '9',
        weekly: '2.99',
        daily: '0.99',
        suffix: '/ month, cancel anytime',
        weeklySuffix: 'for a 7-day pass',
        dailySuffix: 'for a 24-hour pass',
      };
    }
  }, [pricingCohort]);

  // Load User Profile
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('tier, subscription_status, current_period_end, cancel_at_period_end, customer_id, subscription_id')
        .eq('id', userId)
        .single();
      
      if (error) {
        const emailVal = sessionUser?.email || `anonymous_${userId.slice(0, 8)}@mysaas.internal`;
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId, email: emailVal, tier: 'free', subscription_status: 'none' });
        
        if (!insertError) {
          setUserPlan('free');
          setSubscriptionStatus('none');
          setCurrentPeriodEnd(null);
          setCancelAtPeriodEnd(false);
          setCustomerId(null);
          setSubscriptionId(null);
        }
      } else if (data) {
        setUserPlan((data.tier as any) || 'free');
        setSubscriptionStatus(data.subscription_status || 'none');
        setCurrentPeriodEnd(data.current_period_end || null);
        setCancelAtPeriodEnd(!!data.cancel_at_period_end);
        setCustomerId(data.customer_id || null);
        setSubscriptionId(data.subscription_id || null);
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    }
  }, [sessionUser]);

  // Initialize Auth & Profile
  useEffect(() => {
    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionUser(session.user);
        setIsAnonUser(session.user.is_anonymous || false);
        loadUserProfile(session.user.id);
      } else {
        try {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (data?.user) {
            setSessionUser(data.user);
            setIsAnonUser(true);
            loadUserProfile(data.user.id);
          }
        } catch (e) {
          console.error("Anonymous authentication failed:", e);
        }
      }
    }
    
    initAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setSessionUser(session.user);
        setIsAnonUser(session.user.is_anonymous || false);
        loadUserProfile(session.user.id);
      } else {
        setSessionUser(null);
        setIsAnonUser(false);
        setUserPlan('free');
        setSubscriptionStatus('none');
        setCurrentPeriodEnd(null);
        setCancelAtPeriodEnd(false);
        setCustomerId(null);
        setSubscriptionId(null);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  // Listen for iframe events
  useEffect(() => {
    function handleIframeMessage(e: MessageEvent) {
      if (e.data === 'open-auth-modal') {
        setAuthOpen(true);
      } else if (e.data === 'show-paywall-modal') {
        handleShowPaywall();
      }
    }
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [handleShowPaywall]);

  // Success Banner check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('checkout') === 'success') {
        setShowSuccessBanner(true);
        url.searchParams.delete('checkout');
        window.history.replaceState({}, '', url.pathname + url.search);
        
        const getSessionAndLoad = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await loadUserProfile(session.user.id);
          }
        };
        getSessionAndLoad();
      }
    }
  }, [sessionUser, loadUserProfile]);

  // Theme Syncing (safely mounted on client)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
      const savedBrand = localStorage.getItem('brandName');
      if (savedBrand) {
        _setBrandName(savedBrand);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'light') {
        root.classList.add('light');
      } else {
        root.classList.remove('light');
      }
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      await supabase.auth.signInAnonymously();
    } catch (e) {
      console.error("Sign out failed:", e);
    }
  };

  const checkAndLogUsage = useCallback(async (toolId: string, isTier2: boolean) => {
    if (userPlan === 'pro' || userPlan === 'api' || userPlan === 'admin') return true;

    const today = new Date();
    today.setHours(0,0,0,0);
    const isoStart = today.toISOString();

    let count = 0;
    if (sessionUser) {
      const { count: dbCount, error } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', sessionUser.id)
        .gte('created_at', isoStart);
      if (!error && dbCount !== null) {
        count = dbCount;
      }
    } else {
      const localUsage = localStorage.getItem(`usage_count_${today.toDateString()}`);
      count = localUsage ? parseInt(localUsage, 10) : 0;
    }

    const isGuest = !sessionUser || isAnonUser;
    const limitTier1 = isGuest ? 5 : 20;
    const limitTier2 = isGuest ? (isAnonUser ? 1 : 0) : 5;

    const currentLimit = isTier2 ? limitTier2 : limitTier1;

    if (count >= currentLimit) {
      const tool = ALL_TOOLS.find(t => t.id === toolId);
      const toolName = tool ? tool.name : 'this tool';
      handleShowPaywall('limit', toolName, currentLimit);
      return false;
    }

    if (sessionUser) {
      await supabase.from('usage_logs').insert({
        user_id: sessionUser.id,
        tool_id: toolId,
        tier: isTier2 ? 2 : 1,
      });
    } else {
      const newCount = count + 1;
      localStorage.setItem(`usage_count_${today.toDateString()}`, newCount.toString());
    }

    return true;
  }, [sessionUser, isAnonUser, userPlan, handleShowPaywall]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (view === 'landing') return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(p => !p);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [view]);

  // Scroll handler for TopBar
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Router helpers
  const openTool = useCallback((id: string) => {
    setView(id);
    let path = `/tools/${id}`;
    if (id === 'home' || id === 'dashboard') {
      path = '/dashboard';
    } else if (id === 'landing') {
      path = '/';
    } else if (['pricing', 'about', 'docs', 'api', 'account', 'changelog', 'roadmap', 'contact', 'privacy', 'blog'].includes(id)) {
      path = id === 'roadmap' ? '/api' : `/${id}`;
    } else if (id.includes('-to-')) {
      path = `/tools/format/${id}`;
    } else if (id.startsWith('category_')) {
      path = `/category/${id.replace('category_', '')}`;
    }
    router.push(path);
  }, [router]);

  const launchApp = useCallback(() => {
    setView('home');
    router.push('/dashboard');
  }, [router]);

  const goHome = useCallback(() => {
    setView('home');
    router.push('/dashboard');
  }, [router]);

  const backToLanding = useCallback(() => {
    setView('landing');
    router.push('/');
  }, [router]);

  const value = useMemo(() => ({
    view, setView, activeTool,
    theme, setTheme, toggleTheme,
    palette, setPalette,
    launcher, setLauncher,
    scrolled, setScrolled,
    enterpriseOpen, setEnterpriseOpen,
    authOpen, setAuthOpen,
    showPaywall, setShowPaywall,
    showSuccessBanner, setShowSuccessBanner,
    customAlert, setCustomAlert,
    customToast, setCustomToast,
    brandName, setBrandName,
    sessionUser, setSessionUser,
    isAnonUser, setIsAnonUser,
    userPlan, setUserPlan,
    isPremium, handleSignOut, loadUserProfile,
    subscriptionStatus, setSubscriptionStatus,
    currentPeriodEnd, setCurrentPeriodEnd,
    cancelAtPeriodEnd, setCancelAtPeriodEnd,
    customerId, setCustomerId,
    subscriptionId, setSubscriptionId,
    countryCode, pricingCohort, pricingData,
    checkAndLogUsage, handleShowPaywall,
    openTool, launchApp, goHome, backToLanding
  }), [
    view, activeTool, theme, toggleTheme, palette, launcher, scrolled, enterpriseOpen,
    authOpen, showPaywall, showSuccessBanner, customAlert, customToast, brandName, setBrandName,
    sessionUser, isAnonUser, userPlan, isPremium, loadUserProfile, subscriptionStatus,
    currentPeriodEnd, cancelAtPeriodEnd, customerId, subscriptionId, countryCode,
    pricingCohort, pricingData, checkAndLogUsage, handleShowPaywall, openTool, launchApp,
    goHome, backToLanding
  ]);

  return (
    <SaaSContext.Provider value={value}>
      {children}
    </SaaSContext.Provider>
  );
}

export function useSaaS() {
  const context = useContext(SaaSContext);
  if (context === undefined) {
    throw new Error('useSaaS must be used within a SaaSProvider');
  }
  return context;
}
