"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Terminal, Image as ImageIcon, FileText, 
  ArrowRight, Loader, Check, Zap, Code, ShieldCheck, 
  Braces, Copy, CheckCircle2, ChevronRight, Server,
  Download
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

const languages = [
  { id: 'curl', label: 'cURL' },
  { id: 'js', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'csharp', label: 'C#' },
  { id: 'java', label: 'Java' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' }
] as const;

type LangID = typeof languages[number]['id'];

function HeroTerminalWidget() {
  const [activeLang, setActiveLang] = useState<LangID>('curl');
  const [copiedCode, setCopiedCode] = useState(false);

  const snippets: Record<LangID, string> = {
    curl: `curl -X POST https://mysaastools.vercel.app/api/v1/format \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello world",
    "style": "modern"
  }'`,
    js: `fetch('https://mysaastools.vercel.app/api/v1/format', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ text: 'Hello world', style: 'modern' })
}).then(res => res.json()).then(console.log);`,
    python: `import requests

url = "https://mysaastools.vercel.app/api/v1/format"
headers = {"Authorization": "Bearer YOUR_API_KEY", "Content-Type": "application/json"}
payload = {"text": "Hello world", "style": "modern"}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"io"
)

func main() {
	url := "https://mysaastools.vercel.app/api/v1/format"
	payload := map[string]string{"text": "Hello world", "style": "modern"}
	jsonVal, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonVal))
	req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}`,
    rust: `use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let mut headers = HeaderMap::new();
    headers.insert(AUTHORIZATION, HeaderValue::from_static("Bearer YOUR_API_KEY"));
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    let payload = json!({"text": "Hello world", "style": "modern"});

    let res = client.post("https://mysaastools.vercel.app/api/v1/format")
        .headers(headers).json(&payload).send().await?.text().await?;

    println!("{}", res);
    Ok(())
}`,
    csharp: `using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        var client = new HttpClient();
        var payload = new { text = "Hello world", style = "modern" };
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        client.DefaultRequestHeaders.Add("Authorization", "Bearer YOUR_API_KEY");
        var res = await client.PostAsync("https://mysaastools.vercel.app/api/v1/format", content);
        Console.WriteLine(await res.Content.ReadAsStringAsync());
    }
}`,
    java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {
    public static void main(String[] args) throws Exception {
        String json = "{\\"text\\":\\"Hello world\\",\\"style\\":\\"modern\\"}";
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://mysaastools.vercel.app/api/v1/format"))
            .header("Authorization", "Bearer YOUR_API_KEY")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();

        HttpResponse<String> res = HttpClient.newHttpClient()
            .send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(res.body());
    }
}`,
    php: `<?php
$ch = curl_init('https://mysaastools.vercel.app/api/v1/format');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['text' => 'Hello world', 'style' => 'modern']));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json'
]);
echo curl_exec($ch);
curl_close($ch);
?>`,
    ruby: `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse("https://mysaastools.vercel.app/api/v1/format")
req = Net::HTTP::Post.new(uri)
req["Authorization"] = "Bearer YOUR_API_KEY"
req["Content-Type"] = "application/json"
req.body = JSON.dump({"text" => "Hello world", "style" => "modern"})

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeLang]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-[#090a0f] to-[#13151f] border border-white/10 rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] font-mono w-full relative">
      {/* Glossy top highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="flex flex-col bg-black/40 border-b border-white/5">
        <div className="flex justify-between items-center px-4 py-3 border-b border-white/5">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] shadow-[0_0_10px_rgba(255,95,86,0.4)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] shadow-[0_0_10px_rgba(255,189,46,0.4)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] shadow-[0_0_10px_rgba(39,201,63,0.4)]" />
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 text-xs font-medium bg-white/5 px-2.5 py-1 rounded-md transition-all duration-200 border border-white/5 ${copiedCode ? 'text-[#4ade80] cursor-default' : 'text-[#8b949e] cursor-pointer'}`}
          >
            {copiedCode ? <CheckCircle2 size={13} /> : <Copy size={13} />}
            {copiedCode ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Language Tabs Row */}
        <div className="flex overflow-x-auto px-3 py-2 gap-1 [scrollbar-width:none]">
          {languages.map(lang => (
            <button
              key={lang.id}
              onClick={() => setActiveLang(lang.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all duration-200 ease-in-out ${activeLang === lang.id ? 'bg-white/10 text-white' : 'bg-transparent text-[#8b949e] hover:text-white'}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 overflow-x-auto min-h-[280px] relative">
        <pre className="m-0 text-[13px] leading-[1.6] text-[#a5b4fc] text-left">
          {snippets[activeLang]}
        </pre>
      </div>
    </div>
  );
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
    if (keyword === 'local') return 'active';
    if (loadingStatus) return 'checking';
    if (!statusData || !statusData.monitors) return 'unknown';
    
    const matched = statusData.monitors.find(m => m.url.toLowerCase().includes(keyword));
    if (!matched) return 'unknown';
    return matched.ok ? 'active' : 'sleeping';
  };

  const isAllSystemsOperational = !loadingStatus && statusData?.monitors?.every(m => m.ok) !== false;

  return (
    <div className="min-h-screen bg-[#040508] text-white font-sans relative overflow-hidden">
      {/* Next-gen Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_60%)] blur-[80px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[radial-gradient(circle,rgba(236,72,153,0.06)_0%,transparent_60%)] blur-[80px] pointer-events-none z-0" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:40px_40px] bg-center pointer-events-none z-0 [mask-image:linear-gradient(to_bottom,black_20%,transparent_80%)] [-webkit-mask-image:linear-gradient(to_bottom,black_20%,transparent_80%)]" />

      <div className="max-w-[1200px] mx-auto px-6 pt-10 pb-[120px] relative z-[1] flex flex-col gap-16">
        
        {/* Minimal Header */}
        <div className="flex justify-between items-center bg-white/2 px-5 py-3 rounded-full border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3 text-[13px] font-semibold text-[#94a3b8]">
            <Link href="/" className="text-inherit no-underline transition-colors duration-200 hover:text-white">Home</Link>
            <span className="opacity-30">/</span>
            <span className="text-white flex items-center gap-1.5"><Code size={14} /> API Hub</span>
          </div>
          
          {/* Global Status Pill */}
          <div className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-full border ${isAllSystemsOperational ? 'text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/20' : 'text-[#fbbf24] bg-[#fbbf24]/10 border-[#fbbf24]/20'}`}>
            {loadingStatus ? <Loader size={12} className="spin" /> : <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />}
            {loadingStatus ? 'Checking systems...' : isAllSystemsOperational ? 'All Systems Operational' : 'Degraded Performance'}
          </div>
        </div>

        {/* Epic Hero Section */}
        <div className="grid grid-cols-2 gap-[60px] items-center">
          {/* Left Column: Copy */}
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#818cf8] text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-[0.05em] self-start">
              <Zap size={14} fill="currentColor" /> Developer APIs v1.0
            </div>
            
            <h1 className="text-[clamp(40px,5vw,64px)] font-extrabold m-0 tracking-[-0.03em] leading-[1.05] bg-gradient-to-br from-white to-[#a5b4fc] bg-clip-text text-transparent">
              Build faster with intelligent APIs.
            </h1>
            
            <p className="text-lg text-[#94a3b8] leading-[1.6] m-0 max-w-[500px]">
              Integrate world-class document formatting, image transcoding, and PDF rendering directly into your products. Zero cold starts, infinite scaling.
            </p>
            
            <div className="flex items-center gap-4 mt-3">
              <Link href="/account#api-keys" className="text-[15px] font-semibold text-white bg-gradient-to-br from-[#6366f1] to-[#4f46e5] px-7 py-3.5 rounded-xl no-underline shadow-[0_8px_24px_rgba(99,102,241,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] inline-flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(99,102,241,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                Get Your API Key <ArrowRight size={18} />
              </Link>
            </div>

            {/* Quick Start Flow */}
            <div className="flex items-center gap-3 mt-5 p-4 bg-white/2 rounded-xl border border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-[#6366f1] uppercase tracking-[0.05em]">Quick Start</span>
                <div className="flex items-center gap-2 text-[13px] text-[#cbd5e1] font-medium">
                  <span>1. Register</span> <ChevronRight size={12} color="#475569" />
                  <span>2. Copy Key</span> <ChevronRight size={12} color="#475569" />
                  <span className="text-white">3. Execute Request</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Terminal Widget */}
          <div className="relative">
            <div className="absolute -inset-5 bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)] blur-[40px] -z-10" />
            <HeroTerminalWidget />
          </div>
        </div>

        {/* API Catalog Grid */}
        <div className="mt-10">
          <div className="flex flex-col gap-2 mb-8">
            <h2 className="text-[32px] font-extrabold text-white m-0 tracking-[-0.02em]">Explore Endpoints</h2>
            <p className="text-[16px] text-[#94a3b8] m-0">Discover robust capabilities designed for developer velocity.</p>
          </div>
          
          <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-6">
            {[
              {
                id: 'universal-ai-formatter',
                title: 'AI Document Formatter',
                desc: 'Convert raw text payloads into clean Markdown/JSON via structure-aware LLM agents.',
                endpoint: 'POST /api/v1/format',
                icon: FileText,
                keyword: 'pdf-compiler',
                color: '#818cf8',
                bgGlow: 'rgba(129, 140, 248, 0.15)',
                latency: '24ms'
              },
              {
                id: 'json-formatter-validator',
                title: 'JSON Parser & Validator',
                desc: 'Auto-repair broken JSON schemas, strip trailing commas, and prettify outputs.',
                endpoint: 'POST /api/v1/format',
                icon: Braces,
                keyword: 'local',
                color: '#38bdf8',
                bgGlow: 'rgba(56, 189, 248, 0.15)',
                latency: '8ms'
              },
              {
                id: 'heic-to-jpg-converter',
                title: 'HEIC Image Transcoder',
                desc: 'WASM-accelerated HEIC decoding and image optimization for web-ready formats.',
                endpoint: 'POST /api/v1/convert-image',
                icon: ImageIcon,
                keyword: 'image-converter',
                color: '#fb923c',
                bgGlow: 'rgba(251, 146, 60, 0.15)',
                latency: '190ms'
              },
              {
                id: 'html-to-print-ready-pdf',
                title: 'PDF Generation Engine',
                desc: 'Render highly-styled HTML and CSS grids into crisp, paginated vector PDFs.',
                endpoint: 'POST /api/v1/export-pdf',
                icon: Terminal,
                keyword: 'pdf-compilerb',
                color: '#34d399',
                bgGlow: 'rgba(52, 211, 153, 0.15)',
                latency: '450ms'
              }
            ].map(api => {
              const status = getEngineStatus(api.keyword);
              const statusColor = status === 'active' ? '#4ade80' : status === 'sleeping' ? '#fbbf24' : '#94a3b8';
              
              return (
                <Link key={api.id} href={`/api/${api.id}`} className="no-underline block group">
                  <div className="bg-white/2 border border-white/5 rounded-[20px] p-7 h-full flex flex-col relative overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-y-1 group-hover:border-white/15 group-hover:bg-white/5"
                  style={{ '--hover-glow': api.bgGlow } as any}
                  >
                    <style jsx>{`
                      div:hover { box-shadow: 0 20px 40px -10px var(--hover-glow); }
                    `}</style>
                    {/* Top ambient glow */}
                    <div className="absolute top-0 left-1/5 w-[60%] h-0.5 opacity-50" style={{ background: `linear-gradient(90deg, transparent, ${api.color}, transparent)` }} />

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-5">
                        <div className="w-12 h-12 rounded-[14px] flex items-center justify-center border border-white/10" style={{
                          background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, ${api.bgGlow} 100%)`,
                          color: api.color,
                          boxShadow: `0 8px 16px ${api.bgGlow}`
                        }}>
                          <api.icon size={24} />
                        </div>
                        
                        {/* Status Pill */}
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold bg-black/40 px-2.5 py-1 rounded-full border border-white/5">
                          {status === 'checking' ? (
                            <Loader size={10} className="spin text-[#94a3b8]" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                          )}
                          <span className="text-[#cbd5e1]">{status === 'active' ? 'Awake' : status === 'sleeping' ? 'Sleeping' : 'Pinging'}</span>
                        </div>
                      </div>

                      <h3 className="m-0 mb-3 text-[20px] font-bold text-white tracking-[-0.01em]">{api.title}</h3>
                      <p className="m-0 mb-6 text-[14px] text-[#94a3b8] leading-[1.6]">{api.desc}</p>
                    </div>

                    <div className="flex justify-between items-center pt-5 border-t border-white/5">
                      <span className="text-[12px] font-mono text-[#6366f1] bg-[#6366f1]/10 px-3 py-1.5 rounded-lg font-semibold">
                        {api.endpoint}
                      </span>
                      <span className="flex items-center gap-1 text-[13px] font-semibold text-white">
                        View Docs <ChevronRight size={14} color="#94a3b8" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Pricing & Limits Grid */}
        <div className="mt-5">
          <div className="flex flex-col gap-2 mb-8">
            <h2 className="text-[32px] font-extrabold text-white m-0 tracking-[-0.02em]">Pricing & Quotas</h2>
            <p className="text-[16px] text-[#94a3b8] m-0">Predictable scaling for indie hackers and enterprise teams.</p>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
            {[
              { name: 'Guest Sandbox', runs: '3 / day', limit: '3 / min', key: 'Public Sandbox', price: 'Free', highlight: false },
              { name: 'Free Account', runs: '10 / day', limit: '10 / min', key: 'Personal Key', price: 'Free', highlight: false },
              { name: 'Pro', runs: '200 / day', limit: '30 / min', key: 'Production Key', price: '$9 / mo', highlight: true },
              { name: 'Developer API', runs: '2,000 / day', limit: '120 / min', key: 'Developer Key', price: '$29 / mo', highlight: false }
            ].map((tier, idx) => (
              <div key={idx} className={`rounded-[20px] p-8 flex flex-col gap-6 relative ${tier.highlight ? 'bg-[#6366f1]/10 border border-[#6366f1]/30 shadow-[0_20px_40px_rgba(99,102,241,0.1)]' : 'bg-white/2 border border-white/5'}`}>
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-[0.05em] uppercase">
                    Most Popular
                  </div>
                )}
                
                <div>
                  <h3 className="text-[18px] font-bold text-white m-0 mb-2">{tier.name}</h3>
                  <div className={`text-[24px] font-extrabold ${tier.highlight ? 'text-[#a5b4fc]' : 'text-white'}`}>{tier.price}</div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-[13px] text-[#94a3b8]">API Quota</span>
                    <span className="text-[14px] font-semibold text-white font-mono">{tier.runs}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-[13px] text-[#94a3b8]">Rate Limit</span>
                    <span className="text-[14px] font-semibold text-white font-mono">{tier.limit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-[#94a3b8]">Auth Req</span>
                    <span className="text-[13px] font-medium text-white">{tier.key}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Security / Footer */}
        <div className="flex flex-wrap items-center justify-between gap-6 bg-white/2 border border-white/5 p-6 px-8 rounded-[20px]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center">
              <ShieldCheck size={24} color="#34d399" />
            </div>
            <div>
              <h4 className="m-0 text-[16px] font-bold text-white">TLS 1.3 & Zero Retention</h4>
              <p className="m-0 mt-1 text-[14px] text-[#94a3b8] leading-[1.5] max-w-[600px]">
                Encrypted in transit. Payloads parsed entirely in memory and dropped instantly. No logs, no storage.
              </p>
            </div>
          </div>
          
          <a href="/api/openapi.json" download="openapi.json" className="inline-flex items-center gap-2 text-[13px] font-semibold text-white bg-white/5 border border-white/10 px-5 py-2.5 rounded-lg no-underline transition-colors duration-200 hover:bg-white/10">
            <Download size={14} /> OpenAPI Specification
          </a>
        </div>

        {/* System Admin Dashboard Section */}
        {isAdmin && (
          <div className="pt-10 border-t border-white/10 flex flex-col gap-6">
            <div>
              <h2 className="text-[24px] font-bold text-white m-0 tracking-[-0.02em] flex items-center gap-2.5">
                <Server size={20} color="#6366f1" /> System Administration Console
              </h2>
              <p className="m-0 mt-2 text-[15px] text-[#94a3b8]">
                Monitor engine node latency, wake states, and active connections.
              </p>
            </div>
            <SpaceStatusDashboard />
          </div>
        )}

      </div>

      <style jsx global>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
