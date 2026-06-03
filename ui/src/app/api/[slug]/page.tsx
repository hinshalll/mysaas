"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Terminal, Image as ImageIcon, FileText, Globe, 
  ArrowRight, Loader, Check, Zap, Server, Code, 
  ShieldCheck, ChevronLeft, Play, Copy, CheckCircle2,
  FileDown, UploadCloud
} from 'lucide-react';
import { supabase } from '../../supabase';

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  desc: string;
}

const capabilitiesMap: Record<string, Array<{ title: string; desc: string }>> = {
  'universal-ai-formatter': [
    { title: 'Context-Aware Structure', desc: 'Preserves original intent while structuring headers, tables, and lists.' },
    { title: 'Local WASM Fallback', desc: 'Optional local compiler compiles document themes with sub-millisecond execution.' },
    { title: 'Metadata Extraction', desc: 'Extracts formatting markers, word counts, and language statistics dynamically.' },
    { title: 'Automatic Failover', desc: 'Automatic routing to fallback LLM nodes if primary nodes experience high latency.' }
  ],
  'json-formatter-validator': [
    { title: 'Deep Syntax Auto-Repair', desc: 'Fixes missing quotes, trailing commas, unmatched brackets, and invalid comments.' },
    { title: 'Zero Cold Starts', desc: 'Runs in native runtime environment for single-digit millisecond response times.' },
    { title: 'Strict Schema Check', desc: 'Validates structure compliance against standard JSON specifications.' },
    { title: 'High-Speed Minification', desc: 'Compresses whitespaces and newlines for high-throughput network transport.' }
  ],
  'heic-to-jpg-converter': [
    { title: 'EXIF Preservation', desc: 'Keeps camera metadata, geolocation coordinates, and timestamps fully intact.' },
    { title: 'Client-Side WebAssembly', desc: 'Fallback local decoder parses HEIC structure inside the browser canvas sandbox.' },
    { title: 'Redundant Server Nodes', desc: 'Dynamic scaling workers scale to process batch image inputs with zero queues.' },
    { title: 'Rate-Control Optimization', desc: 'Intelligent compression maps optimal file weights to desired quality percentages.' }
  ],
  'html-to-print-ready-pdf': [
    { title: 'Vector PDF Rendering', desc: 'Compiles text, CSS layout structures, and system font families into clean vector paths.' },
    { title: 'Print Layout Bleeds', desc: 'Full support for custom margins, standard A4 sizes, and print page break rules.' },
    { title: 'Dynamic Header & Footer', desc: 'Custom running page headers and footers with auto-calculated page indices.' },
    { title: 'HF Sandbox Pool Pings', desc: 'Automatic failover monitoring redirects jobs to active Hugging Face spaces.' }
  ]
};

function highlightJson(json: any): React.ReactNode {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2);
  }
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;
  
  let match;
  let keyCount = 0;
  while ((match = regex.exec(json)) !== null) {
    const matchStr = match[0];
    const index = match.index;
    
    if (index > lastIndex) {
      parts.push(json.substring(lastIndex, index));
    }
    
    let style: React.CSSProperties = {};
    if (/^"/.test(matchStr)) {
      if (/:$/.test(matchStr)) {
        style = { color: 'oklch(0.70 0.15 195)' }; // Beautiful cyan
      } else {
        style = { color: 'oklch(0.78 0.16 145)' }; // Green
      }
    } else if (/true|false/.test(matchStr)) {
      style = { color: 'oklch(0.75 0.14 75)' }; // Orange
    } else if (/null/.test(matchStr)) {
      style = { color: 'oklch(0.60 0.12 15)' }; // Muted red
    } else {
      style = { color: 'oklch(0.72 0.18 25)' }; // Amber
    }
    
    parts.push(
      <span key={keyCount++} style={style}>
        {matchStr}
      </span>
    );
    
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < json.length) {
    parts.push(json.substring(lastIndex));
  }
  
  return <>{parts}</>;
}

export default function ApiDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [activeLang, setActiveLang] = useState<'curl' | 'js' | 'python' | 'go' | 'rust' | 'csharp' | 'java' | 'php' | 'ruby'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  
  const [userKey, setUserKey] = useState<string | null>(null);
  
  const [formatterText, setFormatterText] = useState('Clean this up and present it as a structured review.');
  const [formatterStyle, setFormatterStyle] = useState('modern');

  const [jsonSandboxText, setJsonSandboxText] = useState("{\n  \"name\": \"John\",\n  \"age\": 30,\n  \"skills\": [\n    \"React\",\n    \"Node\"\n  ]\n}");
  const [jsonSandboxAction, setJsonSandboxAction] = useState('Format');
  
  const [heicFile, setHeicFile] = useState<File | null>(null);
  const [heicFormat, setHeicFormat] = useState<'jpg' | 'png'>('jpg');
  const [heicQuality, setHeicQuality] = useState('0.95');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pdfHtml, setPdfHtml] = useState('<h1>Developer API Report</h1><p>This PDF was generated live via the SaaS printing node.</p>');
  
  const [loading, setLoading] = useState(false);
  const [resStatus, setResStatus] = useState<number | null>(null);
  const [resTime, setResTime] = useState<number | null>(null);
  const [resBody, setResBody] = useState<any>(null);
  const [resImgUrl, setResImgUrl] = useState<string | null>(null);
  const [resPdfUrl, setResPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('api_key').eq('id', session.user.id).single();
        if (data?.api_key) setUserKey(data.api_key);
      }
    };
    fetchUser();

    return () => {
      if (resImgUrl) URL.revokeObjectURL(resImgUrl);
      if (resPdfUrl) URL.revokeObjectURL(resPdfUrl);
    };
  }, [resImgUrl, resPdfUrl]);

  const configMap: any = {
    'universal-ai-formatter': {
      title: 'Universal AI Document Formatter API',
      desc: 'Integrate structure-formatting LLM intelligence into your automation pipelines. Convert noisy unformatted inputs directly into clean structural document specifications.',
      endpoint: '/api/v1/format',
      method: 'POST',
      headers: { 'Authorization': 'Bearer YOUR_API_KEY', 'Content-Type': 'application/json' },
      params: [{ name: 'text', type: 'string', required: true, desc: 'The unformatted raw transcription or text payload.' }],
      curlCode: 'curl -X POST https://mysaastools.vercel.app/api/v1/format ...',
      color: '#6366f1'
    },
    'json-formatter-validator': {
      title: 'JSON Parser & Validator',
      desc: 'Auto-repair broken JSON schemas, strip trailing commas, and prettify outputs.',
      endpoint: '/api/v1/format',
      method: 'POST',
      headers: { 'Authorization': 'Bearer YOUR_API_KEY', 'Content-Type': 'application/json' },
      params: [{ name: 'text', type: 'string', required: true, desc: 'The unformatted JSON payload.' }],
      curlCode: 'curl -X POST https://mysaastools.vercel.app/api/v1/format ...',
      color: '#38bdf8'
    },
    'heic-to-jpg-converter': {
      title: 'HEIC Image Transcoder',
      desc: 'WASM-accelerated HEIC decoding and image optimization for web-ready formats.',
      endpoint: '/api/v1/convert-image',
      method: 'POST',
      headers: { 'Authorization': 'Bearer YOUR_API_KEY', 'Content-Type': 'multipart/form-data' },
      params: [{ name: 'file', type: 'file', required: true, desc: 'The HEIC image file to convert.' }],
      curlCode: 'curl -X POST -F "file=@image.heic" https://mysaastools.vercel.app/api/v1/convert-image ...',
      color: '#fb923c'
    },
    'html-to-print-ready-pdf': {
      title: 'PDF Generation Engine',
      desc: 'Render highly-styled HTML and CSS grids into crisp, paginated vector PDFs.',
      endpoint: '/api/v1/export-pdf',
      method: 'POST',
      headers: { 'Authorization': 'Bearer YOUR_API_KEY', 'Content-Type': 'application/json' },
      params: [{ name: 'html', type: 'string', required: true, desc: 'The HTML payload to render.' }],
      curlCode: 'curl -X POST https://mysaastools.vercel.app/api/v1/export-pdf ...',
      color: '#ec4899'
    }
  };

  const api = configMap[slug];

  if (!api) {
    return (
      <div style={{ minHeight: '100vh', background: '#040508', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <Loader className="spin" size={32} style={{ color: '#6366f1' }} />
        <span style={{ marginTop: 12, fontSize: 14, fontFamily: 'monospace' }}>Finding API endpoints...</span>
        <button onClick={() => router.push('/api')} style={{ marginTop: 24, padding: '10px 20px', background: 'white', color: 'black', borderRadius: 8, cursor: 'pointer', border: 'none', fontWeight: 600 }}>
          Return to API Directory
        </button>
      </div>
    );
  }

  const handleCopyCode = () => {
    const code = api[`${activeLang === 'curl' ? 'curl' : activeLang}Code` as keyof typeof api] as string;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const executeSandbox = async () => {
    setLoading(true);
    setResStatus(null);
    setResBody(null);
    if (resImgUrl) URL.revokeObjectURL(resImgUrl);
    setResImgUrl(null);
    if (resPdfUrl) URL.revokeObjectURL(resPdfUrl);
    setResPdfUrl(null);

    const startTime = Date.now();
    const token = userKey || 'sb_publishable_V66dv60NGqpWQ80q3PyALQ_Z4w0_08U';

    try {
      if (slug === 'universal-ai-formatter') {
        const res = await fetch(api.endpoint, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: formatterText, style: formatterStyle })
        });
        setResStatus(res.status);
        setResBody(await res.json());
      } else if (slug === 'json-formatter-validator') {
        const res = await fetch(api.endpoint, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: jsonSandboxText, tool: 'json', action: jsonSandboxAction })
        });
        setResStatus(res.status);
        setResBody(await res.json());
      } else if (slug === 'heic-to-jpg-converter') {
        if (!heicFile) { alert('Please select a HEIC/HEIF image file first.'); setLoading(false); return; }
        const formData = new FormData();
        formData.append('file', heicFile);
        formData.append('format', heicFormat);
        formData.append('quality', heicQuality);
        const res = await fetch(api.endpoint, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
        });
        setResStatus(res.status);
        if (res.ok) {
          setResImgUrl(URL.createObjectURL(await res.blob()));
          setResBody({ status: 'success', message: 'Binary image blob stream returned successfully.' });
        } else setResBody(await res.json());
      } else if (slug === 'html-to-print-ready-pdf') {
        const res = await fetch(api.endpoint, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: pdfHtml })
        });
        setResStatus(res.status);
        if (res.ok) {
          setResPdfUrl(URL.createObjectURL(await res.blob()));
          setResBody({ status: 'success', message: 'PDF document stream returned successfully.' });
        } else setResBody(await res.json());
      }
    } catch (err: any) {
      setResBody({ error: err.message || 'Sandbox query failed.' });
      setResStatus(500);
    } finally {
      setResTime(Date.now() - startTime);
      setLoading(false);
    }
  };

  const responseSchemaSuccess = {
    status: "success",
    data: slug === 'json-formatter-validator' ? { formatted_json: "..." } : 
          slug === 'heic-to-jpg-converter' ? "<Binary Image Blob>" :
          slug === 'html-to-print-ready-pdf' ? "<Binary PDF Blob>" :
          { content: "...", metadata: {} }
  };

  const responseSchemaError = {
    error: "Invalid request payload or unauthorized",
    code: 400
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#040508', color: '#ffffff',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif', paddingBottom: 100,
    }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(4, 5, 8, 0.8)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)', padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/api" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>
          <ChevronLeft size={16} /> Back to API Hub
        </Link>
        <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#6366f1', fontWeight: 600 }}>{api.endpoint}</span>
      </div>

      <div style={{ maxWidth: 1000, margin: '40px auto 0', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 60 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'white' }}>{api.title}</h1>
          <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.6, margin: 0, maxWidth: 800 }}>{api.desc}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: 8, padding: '8px 12px' }}>
              <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: 'white', background: api.color, padding: '4px 8px', borderRadius: 6 }}>{api.method}</span>
              <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'white' }}>https://mysaastools.vercel.app{api.endpoint}</span>
              <button 
                onClick={() => { navigator.clipboard.writeText(`https://mysaastools.vercel.app${api.endpoint}`); setCopiedEndpoint(true); setTimeout(() => setCopiedEndpoint(false), 2000); }}
                className="reset" style={{ background: 'none', border: 'none', color: copiedEndpoint ? '#4ade80' : '#94a3b8', cursor: 'pointer', display: 'flex', marginLeft: 8 }}
              >
                {copiedEndpoint ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              </button>
            </div>
            
            <Link href="/account#api-keys" style={{ fontSize: 14, fontWeight: 600, color: '#a5b4fc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              Get your API key <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: '0 0 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>Authentication & Headers</h2>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'left' }}>
              <tbody>
                {Object.entries(api.headers).map(([key, val], i) => (
                  <tr key={key} style={{ borderBottom: i !== Object.keys(api.headers).length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', color: api.color, fontWeight: 600 }}>{key}</td>
                    <td style={{ padding: '16px 20px', fontSize: 13, fontFamily: 'monospace', color: '#94a3b8' }}>{String(val)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: '0 0 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>Request Parameters</h2>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'left' }}>
              <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                <tr>
                  <th style={{ padding: '16px 20px', color: '#cbd5e1', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Field</th>
                  <th style={{ padding: '16px 20px', color: '#cbd5e1', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                  <th style={{ padding: '16px 20px', color: '#cbd5e1', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required</th>
                  <th style={{ padding: '16px 20px', color: '#cbd5e1', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {api.params.map((param: Parameter, i: number) => (
                  <tr key={param.name} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', color: 'white', fontWeight: 600 }}>{param.name}</td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', color: '#94a3b8' }}>{param.type}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 4, background: param.required ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)', color: param.required ? '#f87171' : '#94a3b8' }}>
                        {param.required ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#cbd5e1', lineHeight: 1.5 }}>{param.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: '0 0 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>Code Examples</h2>
          <div style={{ background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 16px', flexWrap: 'wrap', gap: 12, background: 'rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {['curl', 'js', 'python', 'go', 'rust', 'csharp', 'java', 'php', 'ruby'].map(lang => (
                  <button key={lang} onClick={() => setActiveLang(lang as any)} className="reset mono" style={{
                    padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                    background: activeLang === lang ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: activeLang === lang ? 'white' : '#8b949e', cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    {lang === 'js' ? 'JavaScript' : lang === 'csharp' ? 'C#' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </button>
                ))}
              </div>
              <button onClick={handleCopyCode} className="reset" style={{ color: copiedCode ? '#4ade80' : '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                {copiedCode ? <CheckCircle2 size={14} /> : <Copy size={14} />} {copiedCode ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre style={{ margin: 0, padding: 24, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, color: '#a5b4fc', maxHeight: 400 }}>
              <code>{api[`${activeLang === 'curl' ? 'curl' : activeLang}Code` as keyof typeof api] as string}</code>
            </pre>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: '0 0 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>Response Schema</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#34d399', margin: '0 0 12px' }}>Success (200 OK)</h3>
              <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: '#a7f3d0', whiteSpace: 'pre-wrap' }}>
                {highlightJson(responseSchemaSuccess)}
              </pre>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f87171', margin: '0 0 12px' }}>Error (400/500)</h3>
              <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: '#fecaca', whiteSpace: 'pre-wrap' }}>
                {highlightJson(responseSchemaError)}
              </pre>
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Play size={20} color={api.color} /> Interactive Sandbox
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: userKey ? '#34d399' : '#fbbf24', background: userKey ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 191, 36, 0.1)', padding: '8px 16px', borderRadius: 100, alignSelf: 'flex-start' }}>
              {userKey ? '🔑 Using your production API key' : '🔓 Public sandbox mode (3 runs/day)'}
            </div>

            {slug === 'universal-ai-formatter' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Text Payload</label>
                  <textarea rows={4} value={formatterText} onChange={e => setFormatterText(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, color: 'white', fontSize: 14, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Style</label>
                  <select value={formatterStyle} onChange={e => setFormatterStyle(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, color: 'white', fontSize: 14, outline: 'none' }}>
                    <option value="modern">Modern Editorial</option>
                    <option value="academic">Academic Serif</option>
                    <option value="minimalist">Minimalist Mono</option>
                  </select>
                </div>
              </div>
            )}

            {slug === 'json-formatter-validator' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>JSON Payload</label>
                  <textarea rows={6} value={jsonSandboxText} onChange={e => setJsonSandboxText(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, color: 'white', fontSize: 14, outline: 'none', fontFamily: 'monospace' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Action</label>
                  <select value={jsonSandboxAction} onChange={e => setJsonSandboxAction(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, color: 'white', fontSize: 14, outline: 'none' }}>
                    <option value="Format">Format & Validate</option>
                    <option value="Auto-Repair">Auto-Repair Broken JSON</option>
                    <option value="Minify">Minify</option>
                  </select>
                </div>
              </div>
            )}

            {slug === 'heic-to-jpg-converter' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Input HEIC File</label>
                  <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed rgba(255,255,255,0.1)', background: '#0a0b0f', borderRadius: 12, padding: '32px', textAlign: 'center', cursor: 'pointer', transition: 'border 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <input type="file" accept=".heic,.heif" ref={fileInputRef} onChange={e => setHeicFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                    <UploadCloud size={24} color="#94a3b8" />
                    <span style={{ fontSize: 14, color: 'white', fontWeight: 600 }}>{heicFile ? heicFile.name : 'Click to upload HEIC file'}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Format</label>
                    <select value={heicFormat} onChange={e => setHeicFormat(e.target.value as any)} style={{ width: '100%', boxSizing: 'border-box', background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, color: 'white', fontSize: 14, outline: 'none' }}>
                      <option value="jpg">JPG</option>
                      <option value="png">PNG</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Quality</label>
                    <select value={heicQuality} onChange={e => setHeicQuality(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, color: 'white', fontSize: 14, outline: 'none' }}>
                      <option value="0.95">High (95%)</option>
                      <option value="0.80">Medium (80%)</option>
                      <option value="0.50">Low (50%)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {slug === 'html-to-print-ready-pdf' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>HTML Content</label>
                <textarea rows={6} value={pdfHtml} onChange={e => setPdfHtml(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, color: 'white', fontSize: 14, outline: 'none', fontFamily: 'monospace' }} />
              </div>
            )}

            <button onClick={executeSandbox} disabled={loading} className="reset" style={{
              width: '100%', padding: '16px', fontSize: 15, fontWeight: 700, borderRadius: 12,
              background: api.color, color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: `0 8px 24px ${api.color}40`, transition: 'all 0.2s', border: 'none'
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.transform = 'none'; }}
            >
              {loading ? <Loader className="spin" size={18} /> : <Play size={18} />}
              {loading ? 'Executing Request...' : 'Send API Request'}
            </button>

            {(resStatus !== null || loading) && (
              <div style={{ background: '#040508', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: resStatus && resStatus < 300 ? '#4ade80' : '#f87171' }}>
                      Status: {resStatus || '...'}
                    </span>
                    {resTime && <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>Time: {resTime}ms</span>}
                  </div>
                  {resBody && (
                    <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(resBody, null, 2)); setCopiedResponse(true); setTimeout(() => setCopiedResponse(false), 2000); }} className="reset" style={{ color: copiedResponse ? '#4ade80' : '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                      {copiedResponse ? <CheckCircle2 size={14} /> : <Copy size={14} />} {copiedResponse ? 'Copied' : 'Copy Response'}
                    </button>
                  )}
                </div>
                <div style={{ padding: 16, overflowX: 'auto', maxHeight: 400 }}>
                  {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader size={24} className="spin" color={api.color} /></div>
                  ) : resBody ? (
                    <>
                      <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 13, color: '#a5b4fc' }}>
                        {highlightJson(resBody)}
                      </pre>
                      {resImgUrl && (
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <img src={resImgUrl} alt="Output" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
                          <br />
                          <a href={resImgUrl} download={`converted.${heicFormat}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12, color: 'white', background: api.color, padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                            <FileDown size={16} /> Download Image
                          </a>
                        </div>
                      )}
                      {resPdfUrl && (
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <a href={resPdfUrl} download="document.pdf" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'white', background: api.color, padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                            <FileDown size={16} /> Download PDF Document
                          </a>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
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
