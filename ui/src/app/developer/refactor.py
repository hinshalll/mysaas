import re

with open("page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. State changes
state_target = """  const [activeConsoleTab, setActiveConsoleTab] = useState<'metrics' | 'playground' | 'credentials'>('metrics');
  const [playgroundSubTab, setPlaygroundSubTab] = useState<'formatter' | 'heic'>('formatter');
  const [snippetTab, setSnippetTab] = useState<'curl' | 'js' | 'python' | 'go'>('curl');
  const [allowedOrigins, setAllowedOrigins] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ms_allowed_origins') || '*';
    }
    return '*';
  });

  // Sandbox Input / Output / Loading states
  const [sandboxInput, setSandboxInput] = useState('Clean this messy transcription up and format it nicely into a report.');
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);"""

state_replace = """  const [activeConsoleTab, setActiveConsoleTab] = useState<'metrics' | 'playground'>('metrics');
  const [playgroundSubTab, setPlaygroundSubTab] = useState<'formatter' | 'json' | 'pdf' | 'heic'>('formatter');

  // Sandbox Input / Output / Loading states
  const [sandboxInput, setSandboxInput] = useState('Clean this messy transcription up and format it nicely into a report.');
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  // JSON Sandbox
  const [jsonSandboxInput, setJsonSandboxInput] = useState('{\\n  "messy": "json",\\n  "data": 123\\n}');
  const [jsonSandboxLoading, setJsonSandboxLoading] = useState(false);
  const [jsonSandboxResult, setJsonSandboxResult] = useState<any>(null);

  // PDF Sandbox
  const [pdfSandboxInput, setPdfSandboxInput] = useState('# Hello World\\n\\nThis is a test PDF generation from Markdown.');
  const [pdfSandboxLoading, setPdfSandboxLoading] = useState(false);
  const [pdfSandboxResult, setPdfSandboxResult] = useState<any>(null);
  const [pdfSandboxResultUrl, setPdfSandboxResultUrl] = useState<string | null>(null);"""

content = content.replace(state_target, state_replace)

# 2. Add PDF cleanup
cleanup_target = """    return () => {
      if (heicSandboxResultUrl) URL.revokeObjectURL(heicSandboxResultUrl);
    };"""
cleanup_replace = """    return () => {
      if (heicSandboxResultUrl) URL.revokeObjectURL(heicSandboxResultUrl);
      if (pdfSandboxResultUrl) URL.revokeObjectURL(pdfSandboxResultUrl);
    };"""
content = content.replace(cleanup_target, cleanup_replace)

# 3. Add runJsonSandboxTest and runPdfSandboxTest after runHeicSandboxTest
heic_test_target = """    } finally {
      setHeicSandboxLoading(false);
    }
  };"""
new_tests = """    } finally {
      setHeicSandboxLoading(false);
    }
  };

  const runJsonSandboxTest = async () => {
    if (isAnonUser) {
      alert("Please sign in or create an account to run live tests in the API sandbox.");
      router.push('/account');
      return;
    }
    setJsonSandboxLoading(true);
    setJsonSandboxResult(null);

    const activeKey = apiKey || 'ms_sandbox_unassigned_key';
    try {
      const response = await fetch('/api/v1/json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: 'json',
          content: jsonSandboxInput
        })
      });
      const data = await response.json();
      setJsonSandboxResult(data);
      if (sessionUser) {
        fetchLogs(sessionUser.id);
        fetchUsageCount(sessionUser.id);
      }
    } catch (err: any) {
      console.error('JSON Sandbox test failed:', err);
      setJsonSandboxResult({ status: "error", message: err.message });
    } finally {
      setJsonSandboxLoading(false);
    }
  };

  const runPdfSandboxTest = async () => {
    if (isAnonUser) {
      alert("Please sign in or create an account to run live tests in the API sandbox.");
      router.push('/account');
      return;
    }
    setPdfSandboxLoading(true);
    setPdfSandboxResult(null);
    if (pdfSandboxResultUrl) {
      URL.revokeObjectURL(pdfSandboxResultUrl);
      setPdfSandboxResultUrl(null);
    }

    const activeKey = apiKey || 'ms_sandbox_unassigned_key';
    try {
      const response = await fetch('/api/v1/pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: 'pdf',
          html: pdfSandboxInput
        })
      });
      if (!response.ok) {
        const errJson = await response.json();
        setPdfSandboxResult(errJson);
      } else {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfSandboxResultUrl(url);
        setPdfSandboxResult({
          status: "success",
          message: "PDF generated successfully!",
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
      console.error('PDF Sandbox test failed:', err);
      setPdfSandboxResult({ status: "error", message: err.message });
    } finally {
      setPdfSandboxLoading(false);
    }
  };"""
content = content.replace(heic_test_target, new_tests)

# 4. Remove activeKeyForSnippet and codeSnippets block
snippets_target_regex = re.compile(r"  const activeKeyForSnippet = apiKey \|\| 'ms_sandbox_unassigned_key';\n  const codeSnippets = \{[\s\S]*?\n  };\n")
content = re.sub(snippets_target_regex, "", content)

# 5. Remove console tab selector credentials tab
tab_target = """            { id: 'metrics', label: 'Overview & Metrics', icon: Activity },
            { id: 'playground', label: 'Playground Sandbox', icon: Terminal },
            { id: 'credentials', label: 'Access Credentials', icon: Lock }"""
tab_replace = """            { id: 'metrics', label: 'Overview & Metrics', icon: Activity },
            { id: 'playground', label: 'Playground Sandbox', icon: Terminal }"""
content = content.replace(tab_target, tab_replace)

# 6. Add subtabs to UI
subtab_target = """              <button
                onClick={() => setPlaygroundSubTab('heic')}"""
subtab_replace = """              <button
                onClick={() => setPlaygroundSubTab('json')}
                className="reset mono"
                style={{
                  padding: '8px 16px', fontSize: 12.5, fontWeight: 600, borderRadius: 6,
                  border: playgroundSubTab === 'json' ? '1px solid oklch(0.68 0.18 265 / 0.4)' : '1px solid transparent',
                  background: playgroundSubTab === 'json' ? 'oklch(0.68 0.18 265 / 0.12)' : 'transparent',
                  color: playgroundSubTab === 'json' ? 'white' : 'oklch(0.50 0.01 250)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <Code size={12} />
                <span>JSON Formatter Sandbox</span>
              </button>
              <button
                onClick={() => setPlaygroundSubTab('pdf')}
                className="reset mono"
                style={{
                  padding: '8px 16px', fontSize: 12.5, fontWeight: 600, borderRadius: 6,
                  border: playgroundSubTab === 'pdf' ? '1px solid oklch(0.68 0.18 265 / 0.4)' : '1px solid transparent',
                  background: playgroundSubTab === 'pdf' ? 'oklch(0.68 0.18 265 / 0.12)' : 'transparent',
                  color: playgroundSubTab === 'pdf' ? 'white' : 'oklch(0.50 0.01 250)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <FileText size={12} />
                <span>PDF Generator Sandbox</span>
              </button>
              <button
                onClick={() => setPlaygroundSubTab('heic')}"""
content = content.replace(subtab_target, subtab_replace)

# 7. Add Sandbox UI for JSON and PDF
sandbox_ui_target = """            {playgroundSubTab === 'formatter' ? ("""
sandbox_ui_replace = """            {playgroundSubTab === 'json' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 28 }} className="fade-in">
                {/* JSON Input Form */}
                <div style={{ background: 'oklch(0.14 0.006 250)', border: '1px solid oklch(0.20 0.008 250)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>Sandbox Request Data</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, color: 'oklch(0.50 0.01 250)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mono">Messy JSON Input</label>
                    <textarea value={jsonSandboxInput} onChange={e => setJsonSandboxInput(e.target.value)} rows={5} style={{ width: '100%', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)', borderRadius: 8, padding: 12, color: 'white', fontSize: 13, outline: 'none', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={runJsonSandboxTest} disabled={jsonSandboxLoading} className="reset" style={{ width: '100%', padding: '12px 18px', borderRadius: 8, background: 'linear-gradient(180deg, oklch(0.68 0.18 265), oklch(0.58 0.20 265))', color: 'white', fontWeight: 600, fontSize: 13, cursor: jsonSandboxLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px oklch(0.68 0.18 265 / 0.3)' }}>
                    {jsonSandboxLoading ? <Loader size={14} className="spin" /> : <Zap size={14} />}
                    <span>{jsonSandboxLoading ? 'Formatting...' : 'Execute API call'}</span>
                  </button>
                </div>
                {/* JSON Result Output */}
                <div style={{ background: 'oklch(0.14 0.006 250)', border: '1px solid oklch(0.20 0.008 250)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>API Server Response</h3>
                  {jsonSandboxResult ? (
                    <pre style={{ background: '#07080a', border: '1px solid #16181d', borderRadius: 10, padding: 16, margin: 0, fontSize: 11.5, lineHeight: 1.5, color: jsonSandboxResult.status === 'error' ? 'oklch(0.65 0.22 20)' : '#a5b4fc', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', flex: 1, minHeight: 180 }}>
                      {JSON.stringify(jsonSandboxResult, null, 2)}
                    </pre>
                  ) : (
                    <div style={{ flex: 1, border: '1px dashed oklch(0.20 0.008 250)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10, color: 'oklch(0.50 0.01 250)', minHeight: 180 }}>
                      <Code size={28} style={{ opacity: 0.5 }} />
                      <span style={{ fontSize: 12, fontFamily: 'monospace' }}>tail -f response/output.json</span>
                    </div>
                  )}
                </div>
              </div>
            ) : playgroundSubTab === 'pdf' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 28 }} className="fade-in">
                {/* PDF Input Form */}
                <div style={{ background: 'oklch(0.14 0.006 250)', border: '1px solid oklch(0.20 0.008 250)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>Sandbox Request Data</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, color: 'oklch(0.50 0.01 250)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="mono">Markdown / HTML Input</label>
                    <textarea value={pdfSandboxInput} onChange={e => setPdfSandboxInput(e.target.value)} rows={5} style={{ width: '100%', background: '#0e0f12', border: '1px solid oklch(0.20 0.008 250)', borderRadius: 8, padding: 12, color: 'white', fontSize: 13, outline: 'none', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={runPdfSandboxTest} disabled={pdfSandboxLoading} className="reset" style={{ width: '100%', padding: '12px 18px', borderRadius: 8, background: 'linear-gradient(180deg, oklch(0.68 0.18 265), oklch(0.58 0.20 265))', color: 'white', fontWeight: 600, fontSize: 13, cursor: pdfSandboxLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px oklch(0.68 0.18 265 / 0.3)' }}>
                    {pdfSandboxLoading ? <Loader size={14} className="spin" /> : <Zap size={14} />}
                    <span>{pdfSandboxLoading ? 'Generating...' : 'Execute API call'}</span>
                  </button>
                </div>
                {/* PDF Result Output */}
                <div style={{ background: 'oklch(0.14 0.006 250)', border: '1px solid oklch(0.20 0.008 250)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>API Server Response</h3>
                  {pdfSandboxResult ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                      <pre style={{ background: '#07080a', border: '1px solid #16181d', borderRadius: 10, padding: 12, margin: 0, fontSize: 11, lineHeight: 1.4, color: pdfSandboxResult.status === 'error' ? 'oklch(0.65 0.22 20)' : '#a5b4fc', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                        {JSON.stringify({ status: pdfSandboxResult.status, message: pdfSandboxResult.message, contentType: pdfSandboxResult.contentType, sizeBytes: pdfSandboxResult.sizeBytes }, null, 2)}
                      </pre>
                      {pdfSandboxResultUrl && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <a href={pdfSandboxResultUrl} download="generated.pdf" style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 600, color: 'oklch(0.68 0.18 265)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>Download PDF File</span>
                            <ArrowRight size={11} />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ flex: 1, border: '1px dashed oklch(0.20 0.008 250)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10, color: 'oklch(0.50 0.01 250)', minHeight: 180 }}>
                      <Code size={28} style={{ opacity: 0.5 }} />
                      <span style={{ fontSize: 12, fontFamily: 'monospace' }}>tail -f response/output.json</span>
                    </div>
                  )}
                </div>
              </div>
            ) : playgroundSubTab === 'formatter' ? ("""
content = content.replace(sandbox_ui_target, sandbox_ui_replace)

# 8. Remove credentials tab from the render entirely
creds_regex = re.compile(r"        \{activeConsoleTab === 'credentials' && \([\s\S]*?        \)}\n", re.MULTILINE)
content = re.sub(creds_regex, "", content)

with open("page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("done")
