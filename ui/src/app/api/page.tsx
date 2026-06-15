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
    <div style={{
      background: 'linear-gradient(145deg, #090a0f, #13151f)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      fontFamily: 'monospace',
      width: '100%',
      position: 'relative'
    }}>
      {/* Glossy top highlight */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(0, 0, 0, 0.4)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56', boxShadow: '0 0 10px rgba(255, 95, 86, 0.4)' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e', boxShadow: '0 0 10px rgba(255, 189, 46, 0.4)' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f', boxShadow: '0 0 10px rgba(39, 201, 63, 0.4)' }} />
          </div>
          <button
            onClick={handleCopy}
            className=""
            style={{
              color: copiedCode ? '#4ade80' : '#8b949e',
              cursor: copiedCode ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 500,
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px 10px', borderRadius: 6,
              transition: 'all 0.2s', border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            {copiedCode ? <CheckCircle2 size={13} /> : <Copy size={13} />}
            {copiedCode ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Language Tabs Row */}
        <div style={{ display: 'flex', overflowX: 'auto', padding: '8px 12px', gap: 4, scrollbarWidth: 'none' }}>
          {languages.map(lang => (
            <button
              key={lang.id}
              onClick={() => setActiveLang(lang.id)}
              className=""
              style={{
                background: activeLang === lang.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: activeLang === lang.id ? '#ffffff' : '#8b949e',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { if (activeLang !== lang.id) e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { if (activeLang !== lang.id) e.currentTarget.style.color = '#8b949e' }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 20, overflowX: 'auto', minHeight: 280, position: 'relative' }}>
        <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#a5b4fc', textAlign: 'left' }}>
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
    <div style={{
      minHeight: '100vh',
      background: '#040508', // Deep space dark
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Next-gen Ambient Background Glows */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      
      {/* Grid Pattern Overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '100%',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        backgroundPosition: 'center center',
        pointerEvents: 'none', zIndex: 0,
        maskImage: 'linear-gradient(to bottom, black 20%, transparent 80%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 80%)'
      }} />

      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '40px 24px 120px',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 64,
      }}>
        
        {/* Minimal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 20px', borderRadius: 100, border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color='white'} onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}>Home</Link>
            <span style={{ opacity: 0.3 }}>/</span>
            <span style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}><Code size={14} /> API Hub</span>
          </div>
          
          {/* Global Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: isAllSystemsOperational ? '#4ade80' : '#fbbf24', background: isAllSystemsOperational ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 191, 36, 0.1)', padding: '6px 14px', borderRadius: 100, border: isAllSystemsOperational ? '1px solid rgba(74, 222, 128, 0.2)' : '1px solid rgba(251, 191, 36, 0.2)' }}>
            {loadingStatus ? <Loader size={12} className="spin" /> : <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 8px currentColor' }} />}
            {loadingStatus ? 'Checking systems...' : isAllSystemsOperational ? 'All Systems Operational' : 'Degraded Performance'}
          </div>
        </div>

        {/* Epic Hero Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 60,
          alignItems: 'center',
        }}>
          {/* Left Column: Copy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)', color: '#818cf8', fontSize: 12, fontWeight: 700,
              padding: '6px 14px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.05em', alignSelf: 'flex-start'
            }}>
              <Zap size={14} fill="currentColor" /> Developer APIs v1.0
            </div>
            
            <h1 style={{ 
              fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 800, margin: 0, 
              letterSpacing: '-0.03em', lineHeight: 1.05,
              background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              Build faster with intelligent APIs.
            </h1>
            
            <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.6, margin: 0, maxWidth: 500 }}>
              Integrate world-class document formatting, image transcoding, and PDF rendering directly into your products. Zero cold starts, infinite scaling.
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
              <Link href="/account#api-keys" style={{
                fontSize: 15, fontWeight: 600, color: '#ffffff',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                padding: '14px 28px', borderRadius: 12, textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(99, 102, 241, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)'; }}
              >
                Get Your API Key <ArrowRight size={18} />
              </Link>
            </div>

            {/* Quick Start Flow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Start</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>
                  <span>1. Register</span> <ChevronRight size={12} color="#475569" />
                  <span>2. Copy Key</span> <ChevronRight size={12} color="#475569" />
                  <span style={{ color: '#fff' }}>3. Execute Request</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Terminal Widget */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: -20, left: -20, right: -20, bottom: -20, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: -1 }} />
            <HeroTerminalWidget />
          </div>
        </div>

        {/* API Catalog Grid */}
        <div style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>Explore Endpoints</h2>
            <p style={{ fontSize: 16, color: '#94a3b8', margin: 0 }}>Discover robust capabilities designed for developer velocity.</p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 24,
          }}>
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
                <Link key={api.id} href={`/api/${api.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 20,
                    padding: 28,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.boxShadow = `0 20px 40px -10px ${api.bgGlow}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    {/* Top ambient glow */}
                    <div style={{ position: 'absolute', top: 0, left: '20%', width: '60%', height: 2, background: `linear-gradient(90deg, transparent, ${api.color}, transparent)`, opacity: 0.5 }} />

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 14,
                          background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, ${api.bgGlow} 100%)`,
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: api.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: `0 8px 16px ${api.bgGlow}`
                        }}>
                          <api.icon size={24} />
                        </div>
                        
                        {/* Status Pill */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, background: 'rgba(0,0,0,0.4)', padding: '4px 10px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.05)' }}>
                          {status === 'checking' ? (
                            <Loader size={10} className="spin" style={{ color: '#94a3b8' }} />
                          ) : (
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                          )}
                          <span style={{ color: '#cbd5e1' }}>{status === 'active' ? 'Awake' : status === 'sleeping' ? 'Sleeping' : 'Pinging'}</span>
                        </div>
                      </div>

                      <h3 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>{api.title}</h3>
                      <p style={{ margin: '0 0 24px', fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{api.desc}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>
                        {api.endpoint}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: 'white' }}>
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
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>Pricing & Quotas</h2>
            <p style={{ fontSize: 16, color: '#94a3b8', margin: 0 }}>Predictable scaling for indie hackers and enterprise teams.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 24,
          }}>
            {[
              { name: 'Guest Sandbox', runs: '3 / day', limit: '3 / min', key: 'Public Sandbox', price: 'Free', highlight: false },
              { name: 'Free Account', runs: '10 / day', limit: '10 / min', key: 'Personal Key', price: 'Free', highlight: false },
              { name: 'Pro', runs: '200 / day', limit: '30 / min', key: 'Production Key', price: '$9 / mo', highlight: true },
              { name: 'Developer API', runs: '2,000 / day', limit: '120 / min', key: 'Developer Key', price: '$29 / mo', highlight: false }
            ].map((tier, idx) => (
              <div key={idx} style={{
                background: tier.highlight ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: tier.highlight ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 20,
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                position: 'relative',
                boxShadow: tier.highlight ? '0 20px 40px rgba(99, 102, 241, 0.1)' : 'none'
              }}>
                {tier.highlight && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Most Popular
                  </div>
                )}
                
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: '0 0 8px' }}>{tier.name}</h3>
                  <div style={{ fontSize: 24, fontWeight: 800, color: tier.highlight ? '#a5b4fc' : '#ffffff' }}>{tier.price}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>API Quota</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'white', fontFamily: 'monospace' }}>{tier.runs}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>Rate Limit</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'white', fontFamily: 'monospace' }}>{tier.limit}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>Auth Req</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'white' }}>{tier.key}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Security / Footer */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '24px 32px',
          borderRadius: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={24} color="#34d399" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'white' }}>TLS 1.3 & Zero Retention</h4>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#94a3b8', lineHeight: 1.5, maxWidth: 600 }}>
                Encrypted in transit. Payloads parsed entirely in memory and dropped instantly. No logs, no storage.
              </p>
            </div>
          </div>
          
          <a href="/api/openapi.json" download="openapi.json" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600,
            color: '#ffffff', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '10px 20px', borderRadius: 10, textDecoration: 'none', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)' }}
          >
            <Download size={14} /> OpenAPI Specification
          </a>
        </div>

        {/* System Admin Dashboard Section */}
        {isAdmin && (
          <div style={{
            paddingTop: 40,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 24
          }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'white', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Server size={20} color="#6366f1" /> System Administration Console
              </h2>
              <p style={{ margin: '8px 0 0', fontSize: 15, color: '#94a3b8' }}>
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
