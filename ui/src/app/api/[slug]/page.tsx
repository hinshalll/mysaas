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

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  desc: string;
}

export default function ApiDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [activeLang, setActiveLang] = useState<'curl' | 'js' | 'python'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Formatter sandbox states
  const [formatterText, setFormatterText] = useState('Clean this up and present it as a structured review.');
  const [formatterStyle, setFormatterStyle] = useState('modern');

  // JSON sandbox states
  const [jsonSandboxText, setJsonSandboxText] = useState("{\n    'name': 'John',\n    'age': 30,\n    'skills': ['React', 'Node'],\n}");
  const [jsonSandboxAction, setJsonSandboxAction] = useState('Auto-Repair');
  
  // HEIC sandbox states
  const [heicFile, setHeicFile] = useState<File | null>(null);
  const [heicFormat, setHeicFormat] = useState<'jpg' | 'png'>('jpg');
  const [heicQuality, setHeicQuality] = useState('0.95');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF sandbox states
  const [pdfHtml, setPdfHtml] = useState('<h1>Developer API Report</h1><p>This PDF was generated live via the SaaS printing node.</p>');
  
  // Global sandbox states
  const [loading, setLoading] = useState(false);
  const [resStatus, setResStatus] = useState<number | null>(null);
  const [resTime, setResTime] = useState<number | null>(null);
  const [resBody, setResBody] = useState<any>(null);
  const [resImgUrl, setResImgUrl] = useState<string | null>(null);
  const [resPdfUrl, setResPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (resImgUrl) URL.revokeObjectURL(resImgUrl);
      if (resPdfUrl) URL.revokeObjectURL(resPdfUrl);
    };
  }, [resImgUrl, resPdfUrl]);

  // Valid endpoints configuration
  const configMap: Record<string, {
    title: string;
    desc: string;
    endpoint: string;
    method: 'POST';
    headers: Record<string, string>;
    params: Parameter[];
    curlCode: string;
    jsCode: string;
    pythonCode: string;
  }> = {
    'universal-ai-formatter': {
      title: 'Universal AI Document Formatter API',
      desc: 'Integrate structure-formatting LLM intelligence into your automation pipelines. Convert noisy unformatted inputs directly into clean structural document specifications.',
      endpoint: '/api/v1/format',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      params: [
        { name: 'text', type: 'string', required: true, desc: 'The unformatted raw transcription or text payload.' },
        { name: 'style', type: 'string', required: false, desc: 'Formatting target layout theme: "modern", "academic", or "minimalist" (defaults to "modern").' },
        { name: 'customHeader', type: 'string', required: false, desc: 'Optional running header text for print/PDF output.' },
        { name: 'customFooter', type: 'string', required: false, desc: 'Optional running footer text for print/PDF output.' }
      ],
      curlCode: `curl -X POST https://mysaastools.vercel.app/api/v1/format \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "messy text here", "style": "modern"}'`,
      jsCode: `fetch('https://mysaastools.vercel.app/api/v1/format', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'messy text here',
    style: 'modern'
  })
})
.then(res => res.json())
.then(data => console.log(data));`,
      pythonCode: `import requests

url = "https://mysaastools.vercel.app/api/v1/format"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "text": "messy text here",
    "style": "modern"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`
    },
    'heic-to-jpg-converter': {
      title: 'HEIC Image Transcoder API',
      desc: 'High-speed, serverless image compression engine. Transcode HEIC files to JPG/PNG directly in memory. Perfect for mobile developer upload pipelines.',
      endpoint: '/api/v1/convert-image',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'multipart/form-data'
      },
      params: [
        { name: 'file', type: 'File binary', required: true, desc: 'The .heic or .heif file buffer.' },
        { name: 'format', type: 'string', required: false, desc: 'Output target format: "jpg" (default) or "png".' },
        { name: 'quality', type: 'number', required: false, desc: 'Compression level (0.01 to 1.0, defaults to 0.95).' }
      ],
      curlCode: `curl -X POST https://mysaastools.vercel.app/api/v1/convert-image \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@/path/to/image.heic" \\
  -F "format=jpg" \\
  -F "quality=0.95" \\
  --output converted.jpg`,
      jsCode: `const formData = new FormData();
formData.append('file', heicFile);
formData.append('format', 'jpg');
formData.append('quality', '0.95');

fetch('https://mysaastools.vercel.app/api/v1/convert-image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
})
.then(res => res.blob())
.then(blob => {
  const url = URL.createObjectURL(blob);
  // Download or preview converted image
});`,
      pythonCode: `import requests

url = "https://mysaastools.vercel.app/api/v1/convert-image"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}
files = {
    "file": ("image.heic", open("image.heic", "rb"), "image/heic")
}
data = {
    "format": "jpg",
    "quality": "0.95"
}

response = requests.post(url, files=files, data=data, headers=headers)
with open("converted.jpg", "wb") as f:
    f.write(response.content)`
    },
    'html-to-print-ready-pdf': {
      title: 'HTML & Markdown to PDF API',
      desc: 'Convert structured HTML layouts or raw Markdown into stylized, paginated PDF documents with support for crop margins and bleed guides.',
      endpoint: '/api/v1/export-pdf',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      params: [
        { name: 'html', type: 'string', required: true, desc: 'Raw HTML structure payload to format.' },
        { name: 'filename', type: 'string', required: false, desc: 'Optional target filename for download attachment.' },
        { name: 'customHeader', type: 'string', required: false, desc: 'Optional running header text for the PDF page.' },
        { name: 'customFooter', type: 'string', required: false, desc: 'Optional running footer text for the PDF page.' }
      ],
      curlCode: `curl -X POST https://mysaastools.vercel.app/api/v1/export-pdf \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"html": "<h1>My Document</h1>", "filename": "document.pdf"}' \\
  --output document.pdf`,
      jsCode: `fetch('https://mysaastools.vercel.app/api/v1/export-pdf', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    html: '<h1>My Document</h1>',
    filename: 'document.pdf'
  })
})
.then(res => res.blob())
.then(blob => {
  const url = URL.createObjectURL(blob);
  window.open(url);
});`,
      pythonCode: `import requests

url = "https://mysaastools.vercel.app/api/v1/export-pdf"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "html": "<h1>My Document</h1>",
    "filename": "document.pdf"
}

response = requests.post(url, json=payload, headers=headers)
with open("document.pdf", "wb") as f:
    f.write(response.content)`
    },
    'json-formatter-validator': {
      title: 'JSON Formatter & Validator API',
      desc: 'Parse, prettify, compress, or auto-repair messy JSON payloads. Robust schema validation, trailing comma removal, and key quoting correction.',
      endpoint: '/api/v1/format',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      params: [
        { name: 'text', type: 'string', required: true, desc: 'The messy, unformatted, or broken JSON string payload.' },
        { name: 'tool', type: 'string', required: true, desc: 'Must be set to "json" to route parsing to the JSON validator engine.' },
        { name: 'action', type: 'string', required: false, desc: 'Operation to perform: "Format" (default), "Auto-Repair", or "Minify".' }
      ],
      curlCode: `curl -X POST https://mysaastools.vercel.app/api/v1/format \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "{\\'name\\': \\'John\\',}", "tool": "json", "action": "Auto-Repair"}'`,
      jsCode: `fetch('https://mysaastools.vercel.app/api/v1/format', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: "{'name': 'John',}",
    tool: 'json',
    action: 'Auto-Repair'
  })
})
.then(res => res.json())
.then(data => console.log(data));`,
      pythonCode: `import requests

url = "https://mysaastools.vercel.app/api/v1/format"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "text": "{'name': 'John',}",
    "tool": "json",
    "action": "Auto-Repair"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`
    }
  };

  const api = configMap[slug];

  // If dynamic slug doesn't exist, render loading or redirect
  if (!api) {
    return (
      <div style={{ minHeight: '100vh', background: 'oklch(0.10 0.005 250)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <Loader className="spin" size={32} style={{ color: 'oklch(0.68 0.18 265)' }} />
        <span style={{ marginTop: 12, fontSize: 14, fontFamily: 'monospace' }}>Finding API endpoints...</span>
        <button onClick={() => router.push('/api')} style={{ marginTop: 24, padding: '8px 16px', background: 'white', color: 'black', borderRadius: 8, cursor: 'pointer', border: 'none', fontWeight: 600 }}>
          Return to API Directory
        </button>
      </div>
    );
  }

  const handleCopyCode = () => {
    const code = activeLang === 'curl' ? api.curlCode : activeLang === 'js' ? api.jsCode : api.pythonCode;
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
    const sandboxToken = 'sb_publishable_V66dv60NGqpWQ80q3PyALQ_Z4w0_08U';

    try {
      if (slug === 'universal-ai-formatter') {
        const res = await fetch(api.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sandboxToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: formatterText,
            style: formatterStyle
          })
        });
        setResStatus(res.status);
        const json = await res.json();
        setResBody(json);

      } else if (slug === 'json-formatter-validator') {
        const res = await fetch(api.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sandboxToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: jsonSandboxText,
            tool: 'json',
            action: jsonSandboxAction
          })
        });
        setResStatus(res.status);
        const json = await res.json();
        setResBody(json);

      } else if (slug === 'heic-to-jpg-converter') {
        if (!heicFile) {
          alert('Please select or upload a HEIC/HEIF image file first.');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', heicFile);
        formData.append('format', heicFormat);
        formData.append('quality', heicQuality);

        const res = await fetch(api.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sandboxToken}`
          },
          body: formData
        });
        setResStatus(res.status);

        if (res.ok) {
          const blob = await res.blob();
          const imgUrl = URL.createObjectURL(blob);
          setResImgUrl(imgUrl);
          setResBody({ status: 'success', message: 'Binary image blob stream returned successfully.' });
        } else {
          const json = await res.json();
          setResBody(json);
        }

      } else if (slug === 'html-to-print-ready-pdf') {
        const res = await fetch(api.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sandboxToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            html: pdfHtml
          })
        });
        setResStatus(res.status);

        if (res.ok) {
          const blob = await res.blob();
          const pdfUrl = URL.createObjectURL(blob);
          setResPdfUrl(pdfUrl);
          setResBody({ status: 'success', message: 'PDF document stream returned successfully.' });
        } else {
          const json = await res.json();
          setResBody(json);
        }
      }
    } catch (err: any) {
      console.error(err);
      setResBody({ error: err.message || 'Sandbox query failed.' });
      setResStatus(500);
    } finally {
      setResTime(Date.now() - startTime);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'oklch(0.10 0.005 250)', // Sleek dark mode terminal
      color: 'oklch(0.97 0.005 250)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      paddingBottom: 100,
    }}>
      {/* Top Breadcrumb Navigation */}
      <div style={{
        borderBottom: '1px solid oklch(0.20 0.008 250)',
        padding: '16px 32px',
        background: 'oklch(0.12 0.005 250 / 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/api" style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          color: 'oklch(0.70 0.01 250)', textDecoration: 'none', fontWeight: 550
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'white'}
        onMouseLeave={e => e.currentTarget.style.color = 'oklch(0.70 0.01 250)'}
        >
          <ChevronLeft size={16} /> API Directory
        </Link>
        <span style={{ fontSize: 12.5, fontFamily: 'monospace', color: 'oklch(0.50 0.01 250)' }}>
          {api.endpoint}
        </span>
      </div>

      <div style={{
        maxWidth: 1200,
        margin: '40px auto 0',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: 40,
        alignItems: 'start',
      }}>
        
        {/* Left Column: API Reference Documentation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.025em', color: 'white' }}>
              {api.title}
            </h1>
            <p style={{ fontSize: 15, color: 'oklch(0.70 0.01 250)', lineHeight: 1.6, margin: 0 }}>
              {api.desc}
            </p>
          </div>

          {/* Endpoint URL Card */}
          <div style={{
            background: 'oklch(0.14 0.006 250)',
            border: '1px solid oklch(0.20 0.008 250)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'oklch(0.50 0.01 250)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>HTTP REQUEST ROUTE</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: 'white', background: 'oklch(0.68 0.18 265)', padding: '3px 8px', borderRadius: 4 }}>
                {api.method}
              </span>
              <span style={{ fontSize: 13.5, fontFamily: 'monospace', color: 'white', fontWeight: 500 }}>
                https://mysaastools.vercel.app{api.endpoint}
              </span>
            </div>
          </div>

          {/* Header Requirements */}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Header Parameters</h3>
            <div style={{ border: '1px solid oklch(0.20 0.008 250)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'oklch(0.12 0.005 250)', borderBottom: '1px solid oklch(0.20 0.008 250)' }}>
                    <th style={{ padding: '10px 14px', color: 'white', fontWeight: 600 }}>HEADER</th>
                    <th style={{ padding: '10px 14px', color: 'white', fontWeight: 600 }}>VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(api.headers).map(([key, val]) => (
                    <tr key={key} style={{ borderBottom: '1px solid oklch(0.16 0.006 250)' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'oklch(0.68 0.18 265)' }}>{key}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'oklch(0.70 0.01 250)' }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payload schema reference */}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payload Fields</h3>
            <div style={{ border: '1px solid oklch(0.20 0.008 250)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'oklch(0.12 0.005 250)', borderBottom: '1px solid oklch(0.20 0.008 250)' }}>
                    <th style={{ padding: '10px 14px', color: 'white', fontWeight: 600 }}>FIELD</th>
                    <th style={{ padding: '10px 14px', color: 'white', fontWeight: 600 }}>TYPE</th>
                    <th style={{ padding: '10px 14px', color: 'white', fontWeight: 600 }}>REQUIRED</th>
                    <th style={{ padding: '10px 14px', color: 'white', fontWeight: 600 }}>DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {api.params.map(param => (
                    <tr key={param.name} style={{ borderBottom: '1px solid oklch(0.16 0.006 250)' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'white', fontWeight: 600 }}>{param.name}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'oklch(0.50 0.01 250)' }}>{param.type}</td>
                      <td style={{ padding: '10px 14px', color: param.required ? 'oklch(0.72 0.18 25)' : 'oklch(0.50 0.01 250)' }}>
                        {param.required ? 'true' : 'false'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'oklch(0.70 0.01 250)', lineHeight: 1.4 }}>{param.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing summary */}
          <div style={{
            background: 'oklch(0.14 0.006 250)',
            border: '1px solid oklch(0.20 0.008 250)',
            borderRadius: 14,
            padding: '24px 28px',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} style={{ color: 'oklch(0.78 0.16 145)' }} /> Sandbox vs. Production Tiers
            </h4>
            <p style={{ margin: 0, fontSize: 13.5, color: 'oklch(0.70 0.01 250)', lineHeight: 1.5 }}>
              Guests can run **3 free sandbox pings/day**. Sign up for a Free Account to increase your limit to **10 runs/day** with your own API key.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginTop: 4 }}>
              <div style={{ background: 'oklch(0.11 0.005 250)', padding: 10, borderRadius: 8, border: '1px solid oklch(0.18 0.005 250)' }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: 'oklch(0.50 0.01 250)' }}>GUEST SANDBOX</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 4 }}>3 runs / day</div>
              </div>
              <div style={{ background: 'oklch(0.11 0.005 250)', padding: 10, borderRadius: 8, border: '1px solid oklch(0.18 0.005 250)' }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: 'oklch(0.68 0.18 265)' }}>FREE ACCOUNT</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 4 }}>10 runs / day</div>
              </div>
              <div style={{ background: 'oklch(0.11 0.005 250)', padding: 10, borderRadius: 8, border: '1px solid oklch(0.18 0.005 250)' }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: 'oklch(0.72 0.18 25)' }}>PRO PLAN</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 4 }}>100 runs / day</div>
              </div>
              <div style={{ background: 'oklch(0.11 0.005 250)', padding: 10, borderRadius: 8, border: '1px solid oklch(0.18 0.005 250)' }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: 'oklch(0.70 0.15 195)' }}>DEVELOPER API</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 4 }}>1,000 runs / day</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Code snippets & Sandbox terminal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 80 }}>
          
          {/* SDK / Code block card */}
          <div style={{
            background: '#0e0f12',
            border: '1px solid #1c1d22',
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #1c1d22',
              padding: '10px 16px',
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { id: 'curl', label: 'cURL' },
                  { id: 'js', label: 'JavaScript' },
                  { id: 'python', label: 'Python' }
                ].map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setActiveLang(lang.id as any)}
                    className="reset mono"
                    style={{
                      padding: '4px 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 4,
                      background: activeLang === lang.id ? '#1c1d22' : 'transparent',
                      color: activeLang === lang.id ? 'white' : '#7e8394',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopyCode}
                className="reset"
                style={{
                  color: copiedCode ? 'oklch(0.78 0.16 145)' : '#7e8394',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 500
                }}
              >
                {copiedCode ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>

            <pre style={{
              margin: 0, padding: 16, overflowX: 'auto',
              fontFamily: 'monospace', fontSize: 11.5, lineHeight: 1.5,
              color: '#818cf8', background: '#0e0f12', maxBlockSize: 260
            }}>
              <code>
                {activeLang === 'curl' ? api.curlCode : activeLang === 'js' ? api.jsCode : api.pythonCode}
              </code>
            </pre>
          </div>

          {/* Sandbox interactive configuration */}
          <div style={{
            background: 'oklch(0.14 0.006 250)',
            border: '1px solid oklch(0.20 0.008 250)',
            borderRadius: 14,
            padding: 24,
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Play size={13} style={{ color: 'oklch(0.78 0.16 145)' }} /> Sandbox API Playground
            </h4>

            {/* Formatter sandbox body fields */}
            {slug === 'universal-ai-formatter' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>TEXT TO FORMAT</label>
                  <textarea
                    rows={3}
                    value={formatterText}
                    onChange={e => setFormatterText(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)',
                      borderRadius: 8, padding: 10, color: 'white', fontSize: 12.5, outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>FORMAT STYLE</label>
                  <select
                    value={formatterStyle}
                    onChange={e => setFormatterStyle(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)',
                      borderRadius: 8, padding: 8, color: 'white', fontSize: 12.5, outline: 'none'
                    }}
                  >
                    <option value="modern">Modern Editorial</option>
                    <option value="academic">Academic Serif</option>
                    <option value="minimalist">Minimalist Mono</option>
                  </select>
                </div>
              </div>
            )}

            {slug === 'json-formatter-validator' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>JSON PAYLOAD</label>
                  <textarea
                    rows={4}
                    value={jsonSandboxText}
                    onChange={e => setJsonSandboxText(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)',
                      borderRadius: 8, padding: 10, color: 'white', fontSize: 12.5, outline: 'none', fontFamily: 'monospace'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>ACTION</label>
                  <select
                    value={jsonSandboxAction}
                    onChange={e => setJsonSandboxAction(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)',
                      borderRadius: 8, padding: 8, color: 'white', fontSize: 12.5, outline: 'none'
                    }}
                  >
                    <option value="Format">Format & Validate</option>
                    <option value="Auto-Repair">Auto-Repair Broken JSON</option>
                    <option value="Minify">Minify (Compress)</option>
                  </select>
                </div>
              </div>
            )}

            {/* HEIC sandbox body fields */}
            {slug === 'heic-to-jpg-converter' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>INPUT HEIC FILE</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed oklch(0.24 0.01 250)', background: '#0e0f12',
                      borderRadius: 8, padding: '16px 20px', textAlign: 'center', cursor: 'pointer',
                      transition: 'border 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
                    }}
                  >
                    <input
                      type="file"
                      accept=".heic,.heif"
                      ref={fileInputRef}
                      onChange={e => setHeicFile(e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                    />
                    <UploadCloud size={20} style={{ color: 'oklch(0.50 0.01 250)' }} />
                    <span style={{ fontSize: 12, color: 'white', fontWeight: 550 }}>
                      {heicFile ? heicFile.name : 'Select HEIC Photo'}
                    </span>
                    <span style={{ fontSize: 10, color: 'oklch(0.50 0.01 250)' }}>
                      {heicFile ? `${(heicFile.size / 1024 / 1024).toFixed(2)} MB` : 'Drag and drop file here'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>TARGET FORMAT</label>
                    <select
                      value={heicFormat}
                      onChange={e => setHeicFormat(e.target.value as any)}
                      style={{
                        width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)',
                        borderRadius: 8, padding: 8, color: 'white', fontSize: 12.5, outline: 'none'
                      }}
                    >
                      <option value="jpg">Convert to JPG</option>
                      <option value="png">Convert to PNG</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>COMPRESSION QUALITY</label>
                    <select
                      value={heicQuality}
                      onChange={e => setHeicQuality(e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)',
                        borderRadius: 8, padding: 8, color: 'white', fontSize: 12.5, outline: 'none'
                      }}
                    >
                      <option value="0.95">High (95%)</option>
                      <option value="0.80">Medium (80%)</option>
                      <option value="0.50">Low (50%)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* PDF sandbox body fields */}
            {slug === 'html-to-print-ready-pdf' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-dim)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>HTML CONTENT BODY</label>
                  <textarea
                    rows={4}
                    value={pdfHtml}
                    onChange={e => setPdfHtml(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)',
                      borderRadius: 8, padding: 10, color: 'white', fontSize: 12.5, fontFamily: 'monospace', outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={executeSandbox}
              disabled={loading}
              className="reset mono"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 0', fontSize: 13, fontWeight: 700, borderRadius: 8,
                background: 'oklch(0.68 0.18 265)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px oklch(0.68 0.18 265 / 0.25)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'oklch(0.72 0.18 265)'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'oklch(0.68 0.18 265)'; }}
            >
              {loading ? <Loader className="spin" size={13} /> : <Play size={11} />}
              {loading ? 'Executing request...' : 'Test Sandbox Query'}
            </button>
          </div>

          {/* Sandbox Response Console Terminal */}
          <div style={{
            background: '#0e0f12',
            border: '1px solid #1c1d22',
            borderRadius: 14,
            padding: 20,
            display: 'flex', flexDirection: 'column', gap: 14,
            minHeight: 180,
          }}>
            {/* Headers of response */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1c1d22', paddingBottom: 10 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#7e8394', letterSpacing: '0.04em' }} className="mono">RESPONSE PAYLOAD</span>
              
              {resStatus !== null && (
                <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'monospace' }}>
                  <span style={{ color: resStatus < 300 ? 'oklch(0.78 0.16 145)' : 'oklch(0.70 0.12 15)' }}>
                    STATUS: {resStatus}
                  </span>
                  {resTime !== null && (
                    <span style={{ color: '#7e8394' }}>
                      TIME: {resTime}ms
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Sandbox Response Content body */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6366f1', margin: 'auto' }}>
                  <Loader size={16} className="spin" />
                  <span style={{ fontSize: 12.5, fontFamily: 'monospace' }}>Awaiting API stream response...</span>
                </div>
              ) : resBody ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
                  <pre style={{
                    margin: 0, overflowY: 'auto', maxHeight: 180,
                    fontFamily: 'monospace', fontSize: 11.5, color: '#a5b4fc', lineHeight: 1.5
                  }}>
                    {JSON.stringify(resBody, null, 2)}
                  </pre>
                  
                  {/* Converted Image preview */}
                  {resImgUrl && (
                    <div style={{ borderTop: '1px solid #1c1d22', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <span style={{ fontSize: 10.5, color: 'oklch(0.72 0.18 25)', fontWeight: 600 }} className="mono">Generated Image Output:</span>
                      <img src={resImgUrl} alt="Converted sandbox output" style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain', borderRadius: 6, border: '1px solid #1c1d22' }} />
                      <a href={resImgUrl} download={`sandbox_result.${heicFormat}`} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5,
                        color: 'white', textDecoration: 'none', background: 'oklch(0.18 0.01 25 / 0.5)',
                        border: '1px solid oklch(0.72 0.18 25 / 0.2)', padding: '5px 12px', borderRadius: 6,
                        alignSelf: 'flex-start'
                      }}>
                        <FileDown size={11} /> Download Result Image
                      </a>
                    </div>
                  )}

                  {/* Converted PDF preview/download link */}
                  {resPdfUrl && (
                    <div style={{ borderTop: '1px solid #1c1d22', paddingTop: 14 }}>
                      <a href={resPdfUrl} download="sandbox_document.pdf" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5,
                        color: 'white', textDecoration: 'none', background: 'oklch(0.68 0.18 265 / 0.2)',
                        border: '1px solid oklch(0.68 0.18 265 / 0.2)', padding: '6px 14px', borderRadius: 6
                      }}>
                        <FileDown size={11} /> Download Generated PDF Document
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#4b5563', margin: 'auto', textAlign: 'center' }}>
                  <Terminal size={22} style={{ opacity: 0.4 }} />
                  <span style={{ fontSize: 12, maxWidth: 220 }}>Terminal Idle. Run the sandbox query above to print response details.</span>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Matrix animation styling */}
      <style jsx global>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
