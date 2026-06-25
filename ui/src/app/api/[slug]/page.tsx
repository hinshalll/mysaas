"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
      <div className="min-h-screen bg-[#040508] flex flex-col items-center justify-center text-white">
        <Loader className="spin text-[#6366f1]" size={32} />
        <span className="mt-3 text-[14px] font-mono">Finding API endpoints...</span>
        <button onClick={() => router.push('/api')} className="mt-6 px-5 py-2.5 bg-white text-black rounded-lg cursor-pointer border-none font-semibold transition-colors hover:bg-gray-200">
          Return to API Directory
        </button>
      </div>
    );
  }

  const generateCodeSnippet = (api: any, lang: string) => {
    const url = `https://mysaastools.vercel.app${api.endpoint}`;
    const token = 'YOUR_API_KEY';
    
    if (lang === 'curl') {
      return api.curlCode || `curl -X ${api.method} ${url} \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: ${api.headers['Content-Type'] || 'application/json'}" \\
  -d '{"example": "payload"}'`;
    } else if (lang === 'js') {
      return `const response = await fetch("${url}", {
  method: "${api.method}",
  headers: {
    "Authorization": "Bearer ${token}",
    "Content-Type": "${api.headers['Content-Type'] || 'application/json'}"
  },
  body: ${api.headers['Content-Type'] === 'multipart/form-data' ? 'formData' : 'JSON.stringify({ /* payload */ })'}
});
const data = await response.json();`;
    } else if (lang === 'python') {
      return `import requests\n\nurl = "${url}"\nheaders = {\n    "Authorization": "Bearer ${token}",\n    "Content-Type": "${api.headers['Content-Type'] || 'application/json'}"\n}\n${api.headers['Content-Type'] === 'multipart/form-data' ? "files = {'file': open('image.heic', 'rb')}\\nresponse = requests.post(url, headers=headers, files=files)" : "data = { /* payload */ }\\nresponse = requests.post(url, headers=headers, json=data)"}\n\nprint(response.json())`;
    } else if (lang === 'go') {
      return `package main\n\nimport (\n\t"fmt"\n\t"net/http"\n\t"io/ioutil"\n)\n\nfunc main() {\n\treq, _ := http.NewRequest("${api.method}", "${url}", nil)\n\treq.Header.Add("Authorization", "Bearer ${token}")\n\t\n\tres, _ := http.DefaultClient.Do(req)\n\tdefer res.Body.Close()\n\tbody, _ := ioutil.ReadAll(res.Body)\n\t\n\tfmt.Println(string(body))\n}`;
    } else if (lang === 'rust') {
      return `let client = reqwest::Client::new();\nlet res = client.post("${url}")\n    .header("Authorization", "Bearer ${token}")\n    .send()\n    .await?;\n    \nprintln!("{:?}", res.text().await?);`;
    } else if (lang === 'csharp') {
      return `var client = new HttpClient();\nclient.DefaultRequestHeaders.Add("Authorization", "Bearer ${token}");\nvar response = await client.PostAsync("${url}", content);\nvar result = await response.Content.ReadAsStringAsync();`;
    } else if (lang === 'java') {
      return `HttpRequest request = HttpRequest.newBuilder()\n    .uri(URI.create("${url}"))\n    .header("Authorization", "Bearer ${token}")\n    .method("${api.method}", HttpRequest.BodyPublishers.noBody())\n    .build();\nHttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());\nSystem.out.println(response.body());`;
    } else if (lang === 'php') {
      return `$ch = curl_init();\ncurl_setopt($ch, CURLOPT_URL, "${url}");\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);\ncurl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${api.method}");\ncurl_setopt($ch, CURLOPT_HTTPHEADER, array('Authorization: Bearer ${token}'));\n$result = curl_exec($ch);\ncurl_close($ch);`;
    } else if (lang === 'ruby') {
      return `require 'net/http'\nrequire 'uri'\n\nuri = URI.parse("${url}")\nrequest = Net::HTTP::Post.new(uri)\nrequest["Authorization"] = "Bearer ${token}"\n\nresponse = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|\n  http.request(request)\nend\nputs response.body`;
    }
    
    return `// Code example for ${lang} is currently being generated...`;
  };

  const handleCopyCode = () => {
    const code = generateCodeSnippet(api, activeLang);
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
    <div className="min-h-screen bg-[#040508] text-white font-sans pb-[100px]">
      <div className="sticky top-0 z-10 bg-[#040508]/80 backdrop-blur-md border-b border-white/5 px-8 py-4 flex items-center justify-between">
        <Link href="/api" className="flex items-center gap-1.5 text-[13px] text-[#94a3b8] no-underline font-semibold">
          <ChevronLeft size={16} /> Back to API Hub
        </Link>
        <span className="text-[13px] font-mono text-[#6366f1] font-semibold">{api.endpoint}</span>
      </div>

      <div className="max-w-[1400px] mx-auto mt-10 px-6 flex flex-wrap gap-[60px] items-start">
        
        {/* Left Column (Context & Setup) */}
        <div className="flex-[1_1_600px] flex flex-col gap-[60px] pb-[100px] min-w-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col gap-6">
          <h1 className="text-[clamp(32px,4vw,48px)] font-extrabold m-0 tracking-[-0.02em] text-white">{api.title}</h1>
          <p className="text-[18px] text-[#94a3b8] leading-[1.6] m-0 max-w-[800px]">{api.desc}</p>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg px-3 py-2">
              <span className="text-[11px] font-mono font-bold text-white px-2 py-1 rounded-md" style={{ background: api.color }}>{api.method}</span>
              <span className="text-[13px] font-mono text-white">https://mysaastools.vercel.app{api.endpoint}</span>
              <button 
                onClick={() => { navigator.clipboard.writeText(`https://mysaastools.vercel.app${api.endpoint}`); setCopiedEndpoint(true); setTimeout(() => setCopiedEndpoint(false), 2000); }}
                className={`bg-transparent border-none cursor-pointer flex ml-2 ${copiedEndpoint ? 'text-[#4ade80]' : 'text-[#94a3b8]'}`}
              >
                {copiedEndpoint ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              </button>
            </div>
            
            <Link href="/account#api-keys" className="text-[14px] font-semibold text-[#a5b4fc] no-underline flex items-center gap-1.5">
              Get your API key <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <h2 className="text-[20px] font-bold text-white m-0 mb-4 border-b border-white/5 pb-3">Authentication & Headers</h2>
          <div className="bg-white/2 border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full border-collapse text-[14px] text-left">
              <tbody>
                {Object.entries(api.headers).map(([key, val], i) => (
                  <tr key={key} className={i !== Object.keys(api.headers).length - 1 ? 'border-b border-white/5' : ''}>
                    <td className="px-5 py-4 font-mono font-semibold" style={{ color: api.color }}>{key}</td>
                    <td className="px-5 py-4 text-[13px] font-mono text-[#94a3b8]">{String(val)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <h2 className="text-[20px] font-bold text-white m-0 mb-4 border-b border-white/5 pb-3">Request Parameters</h2>
          <div className="bg-white/2 border border-white/5 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full border-collapse text-[14px] text-left">
              <thead className="bg-black/20">
                <tr>
                  <th className="px-5 py-4 text-[#cbd5e1] font-semibold text-[12px] uppercase tracking-[0.05em]">Field</th>
                  <th className="px-5 py-4 text-[#cbd5e1] font-semibold text-[12px] uppercase tracking-[0.05em]">Type</th>
                  <th className="px-5 py-4 text-[#cbd5e1] font-semibold text-[12px] uppercase tracking-[0.05em]">Required</th>
                  <th className="px-5 py-4 text-[#cbd5e1] font-semibold text-[12px] uppercase tracking-[0.05em]">Description</th>
                </tr>
              </thead>
              <tbody>
                {api.params.map((param: Parameter, i: number) => (
                  <tr key={param.name} className="border-t border-white/5">
                    <td className="px-5 py-4 font-mono text-white font-semibold">{param.name}</td>
                    <td className="px-5 py-4 font-mono text-[#94a3b8]">{param.type}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[12px] font-semibold px-2 py-1 rounded-md ${param.required ? 'bg-[#ef4444]/10 text-[#f87171]' : 'bg-white/5 text-[#94a3b8]'}`}>
                        {param.required ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#cbd5e1] leading-[1.5]">{param.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <h2 className="text-[24px] font-extrabold text-white m-0 mb-6 flex items-center gap-2.5">
            <Play size={20} color={api.color} /> Interactive Sandbox
          </h2>
          
          <div className="flex flex-col gap-6 bg-white/2 border border-white/5 rounded-2xl p-8">
            <div className={`flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-full self-start ${userKey ? 'text-[#34d399] bg-[#10b981]/10' : 'text-[#fbbf24] bg-[#fbbf24]/10'}`}>
              {userKey ? '🔑 Using your production API key' : '🔓 Public sandbox mode (3 runs/day)'}
            </div>

            {slug === 'universal-ai-formatter' && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-[#94a3b8] block mb-2">Text Payload</label>
                  <textarea rows={4} value={formatterText} onChange={e => setFormatterText(e.target.value)} className="w-full box-border bg-[#0a0b0f] border border-white/10 rounded-lg p-3 text-white text-[14px] outline-none focus:border-[#6366f1]" />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#94a3b8] block mb-2">Style</label>
                  <select value={formatterStyle} onChange={e => setFormatterStyle(e.target.value)} className="w-full box-border bg-[#0a0b0f] border border-white/10 rounded-lg p-3 text-white text-[14px] outline-none focus:border-[#6366f1]">
                    <option value="modern">Modern Editorial</option>
                    <option value="academic">Academic Serif</option>
                    <option value="minimalist">Minimalist Mono</option>
                  </select>
                </div>
              </div>
            )}

            {slug === 'json-formatter-validator' && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-[#94a3b8] block mb-2">JSON Payload</label>
                  <textarea rows={6} value={jsonSandboxText} onChange={e => setJsonSandboxText(e.target.value)} className="w-full box-border bg-[#0a0b0f] border border-white/10 rounded-lg p-3 text-white text-[14px] outline-none font-mono focus:border-[#6366f1]" />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#94a3b8] block mb-2">Action</label>
                  <select value={jsonSandboxAction} onChange={e => setJsonSandboxAction(e.target.value)} className="w-full box-border bg-[#0a0b0f] border border-white/10 rounded-lg p-3 text-white text-[14px] outline-none focus:border-[#6366f1]">
                    <option value="Format">Format & Validate</option>
                    <option value="Auto-Repair">Auto-Repair Broken JSON</option>
                    <option value="Minify">Minify</option>
                  </select>
                </div>
              </div>
            )}

            {slug === 'heic-to-jpg-converter' && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-[#94a3b8] block mb-2">Input HEIC File</label>
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 bg-[#0a0b0f] rounded-xl p-8 text-center cursor-pointer transition-colors duration-200 hover:border-white/30 flex flex-col items-center gap-3">
                    <input type="file" accept=".heic,.heif" ref={fileInputRef} onChange={e => setHeicFile(e.target.files?.[0] || null)} className="hidden" />
                    <UploadCloud size={24} color="#94a3b8" />
                    <span className="text-[14px] text-white font-semibold">{heicFile ? heicFile.name : 'Click to upload HEIC file'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-semibold text-[#94a3b8] block mb-2">Format</label>
                    <select value={heicFormat} onChange={e => setHeicFormat(e.target.value as any)} className="w-full box-border bg-[#0a0b0f] border border-white/10 rounded-lg p-3 text-white text-[14px] outline-none focus:border-[#6366f1]">
                      <option value="jpg">JPG</option>
                      <option value="png">PNG</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#94a3b8] block mb-2">Quality</label>
                    <select value={heicQuality} onChange={e => setHeicQuality(e.target.value)} className="w-full box-border bg-[#0a0b0f] border border-white/10 rounded-lg p-3 text-white text-[14px] outline-none focus:border-[#6366f1]">
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
                <label className="text-[12px] font-semibold text-[#94a3b8] block mb-2">HTML Content</label>
                <textarea rows={6} value={pdfHtml} onChange={e => setPdfHtml(e.target.value)} className="w-full box-border bg-[#0a0b0f] border border-white/10 rounded-lg p-3 text-white text-[14px] outline-none font-mono focus:border-[#6366f1]" />
              </div>
            )}

            <button onClick={executeSandbox} disabled={loading} className="w-full p-4 text-[15px] font-bold rounded-xl text-white flex items-center justify-center gap-2.5 transition-all duration-200 border-none group" style={{
              background: api.color, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: `0 8px 24px ${api.color}40`
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.transform = 'none'; }}
            >
              {loading ? <Loader className="spin" size={18} /> : <Play size={18} />}
              {loading ? 'Executing Request...' : 'Send API Request'}
            </button>

            {(resStatus !== null || loading) && (
              <div className="bg-[#040508] border border-white/10 rounded-xl overflow-hidden mt-4">
                <div className="flex justify-between items-center px-4 py-3 bg-white/2 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className={`text-[12px] font-bold font-mono ${resStatus && resStatus < 300 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                      Status: {resStatus || '...'}
                    </span>
                    {resTime && <span className="text-[12px] text-[#94a3b8] font-mono">Time: {resTime}ms</span>}
                  </div>
                  {resBody && (
                    <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(resBody, null, 2)); setCopiedResponse(true); setTimeout(() => setCopiedResponse(false), 2000); }} className={`bg-transparent border-none cursor-pointer flex items-center gap-1.5 text-[12px] font-semibold ${copiedResponse ? 'text-[#4ade80]' : 'text-[#94a3b8]'}`}>
                      {copiedResponse ? <CheckCircle2 size={14} /> : <Copy size={14} />} {copiedResponse ? 'Copied' : 'Copy Response'}
                    </button>
                  )}
                </div>
                <div className="p-4 overflow-x-auto max-h-[400px]">
                  {loading ? (
                    <div className="flex justify-center p-10"><Loader size={24} className="spin" color={api.color} /></div>
                  ) : resBody ? (
                    <>
                      <pre className="m-0 font-mono text-[13px] text-[#a5b4fc]">
                        {highlightJson(resBody)}
                      </pre>
                      {resImgUrl && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <img src={resImgUrl} alt="Output" className="max-w-full max-h-[200px] rounded-lg border border-white/10" />
                          <br />
                          <a href={resImgUrl} download={`converted.${heicFormat}`} className="inline-flex items-center gap-2 mt-3 text-white px-4 py-2 rounded-lg no-underline text-[13px] font-semibold" style={{ background: api.color }}>
                            <FileDown size={16} /> Download Image
                          </a>
                        </div>
                      )}
                      {resPdfUrl && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <a href={resPdfUrl} download="document.pdf" className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg no-underline text-[13px] font-semibold" style={{ background: api.color }}>
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
        </motion.div>
        </div> {/* End Left Column */}

        {/* Right Column */}
        <div className="flex-[1_1_500px] flex flex-col gap-10">
          <div className="sticky top-[100px] flex flex-col gap-10 pb-10">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div>
                <h2 className="text-[20px] font-bold text-white m-0 mb-4 border-b border-white/5 pb-3">Code Examples</h2>
                <div className="bg-[#0a0b0f] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="flex justify-between items-center border-b border-white/5 px-4 py-2 flex-wrap gap-3 bg-black/30">
                    <div className="flex gap-1 flex-wrap overflow-x-auto [scrollbar-width:none]">
                      {['curl', 'js', 'python', 'go', 'rust', 'csharp', 'java', 'php', 'ruby'].map(lang => (
                        <button key={lang} onClick={() => setActiveLang(lang as any)} className={`font-mono px-3 py-1.5 text-[12px] font-semibold rounded-md cursor-pointer transition-all duration-200 border-none ${activeLang === lang ? 'bg-white/10 text-white' : 'bg-transparent text-[#8b949e]'}`}>
                          {lang === 'js' ? 'JavaScript' : lang === 'csharp' ? 'C#' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleCopyCode} className={`bg-transparent border-none cursor-pointer flex items-center gap-1.5 text-[12px] font-semibold ${copiedCode ? 'text-[#4ade80]' : 'text-[#8b949e]'}`}>
                      {copiedCode ? <CheckCircle2 size={14} /> : <Copy size={14} />} {copiedCode ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <motion.pre layout className="m-0 p-6 overflow-x-auto font-mono text-[13px] leading-[1.6] text-[#a5b4fc] max-h-[400px] whitespace-pre-wrap">
                    <AnimatePresence mode="wait">
                      <motion.code 
                        key={activeLang}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="block"
                      >
                        {generateCodeSnippet(api, activeLang)}
                      </motion.code>
                    </AnimatePresence>
                  </motion.pre>
                </div>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <div>
                <h2 className="text-[20px] font-bold text-white m-0 mb-4 border-b border-white/5 pb-3">Response Schema</h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
                  <div className="bg-[#10b981]/5 border border-[#10b981]/20 rounded-xl p-5">
                    <h3 className="text-[14px] font-bold text-[#34d399] m-0 mb-3">Success (200 OK)</h3>
                    <pre className="m-0 font-mono text-[12px] text-[#a7f3d0] whitespace-pre-wrap">
                      {highlightJson(responseSchemaSuccess)}
                    </pre>
                  </div>
                  <div className="bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-xl p-5">
                    <h3 className="text-[14px] font-bold text-[#f87171] m-0 mb-3">Error (400/500)</h3>
                    <pre className="m-0 font-mono text-[12px] text-[#fecaca] whitespace-pre-wrap">
                      {highlightJson(responseSchemaError)}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
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
