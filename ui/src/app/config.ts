export const AI_SOURCES = [
  { value: 'universal',  label: 'Universal Style',  tag: 'auto', desc: 'Default AI styling' },
  { value: 'chatgpt',    label: 'ChatGPT Style',    tag: 'green', desc: 'Clean layout with soft green accents' },
  { value: 'claude',     label: 'Claude Style',     tag: 'warm', desc: 'Warm editorial serif layout' },
  { value: 'gemini',     label: 'Gemini Style',     tag: 'gradient', desc: 'Futuristic gradient elements' },
  { value: 'deepseek',   label: 'DeepSeek Style',   tag: 'think', desc: 'Indigo accents with structured thinking support' },
  { value: 'grok',       label: 'Grok Style',       tag: 'cyber', desc: 'High contrast black and white theme' },
  { value: 'perplexity', label: 'Perplexity Style', tag: 'citations', desc: 'Sleek informational style with citations' },
];

export const THEMES = [
  { value: 'modern',     label: 'Modern',     tag: 'default', desc: 'Editorial layout · Inter + Source Serif' },
  { value: 'academic',   label: 'Academic',   tag: 'A4',      desc: 'Two-column · numbered headings · serif body' },
  { value: 'minimalist', label: 'Minimalist', tag: 'mono',    desc: 'Pure type · ultra-tight spacing' },
];

export const FORMATS = [
  { value: 'pdf',  label: 'PDF',         tag: '.pdf',  desc: 'Vector, embedded fonts' },
  { value: 'docx', label: 'DOCX',        tag: '.docx', desc: 'Editable in Word, Pages' },
  { value: 'html', label: 'HTML',        tag: '.html', desc: 'Single-file, self-contained' },
  { value: 'md',   label: 'Markdown',    tag: '.md',   desc: 'GitHub-flavored' },
  { value: 'txt',  label: 'Plain text',  tag: '.txt',  desc: 'No formatting, UTF-8' },
];

export const CATEGORIES = [
  {
    id: 'text',
    label: 'Text & AI',
    tagline: 'Tame raw AI output. Polish transcripts. Make text readable.',
    hue: 265, /* indigo */
    tools: [
      { id: 'uaf',   name: 'Universal AI Formatter',           icon: 'Sparkles',      tagline: 'Raw AI output → premium themed documents', featured: true, hot: true },
      { id: 'conv',  name: 'Entire AI Conversation Formatter', icon: 'MessageSquare', tagline: 'Export full chats with code blocks intact' },
      { id: 'tran',  name: 'Transcript Cleaner',               icon: 'Mic',           tagline: 'Strip filler, re-punctuate, identify speakers' },
      { id: 'slug',  name: 'Smart URL Slug Maker',             icon: 'Link2',         tagline: 'Unicode-safe, SEO-friendly slugs at scale' },
      { id: 'diff',  name: 'Unlimited Text Diff',              icon: 'Diff',          tagline: 'Word-level diffs that scale to entire books' },
    ],
  },
  {
    id: 'dev',
    label: 'Developer & Code',
    tagline: 'The data-wrangling tools you keep tabbing back to.',
    hue: 195, /* cyan */
    tools: [
      { id: 'json',    name: 'JSON Formatter & Validator',  icon: 'Braces',   tagline: 'Format, validate, JSONPath, schema infer' },
      { id: 'b64',     name: 'Base64 Encoder / Decoder',    icon: 'Binary',   tagline: 'Text, files, data-URIs · streaming' },
      { id: 'sql',     name: 'SQL Beautifier',              icon: 'Database', tagline: 'Pg / MySQL / SQLite dialect-aware' },
      { id: 'flat',    name: 'JSON / YAML / CSV Flattener', icon: 'Layers',   tagline: 'Dot-paths, arrays-to-rows, lossless round-trip' },
      { id: 'xlmd',    name: 'Excel ↔ Markdown Tables',     icon: 'Table',    tagline: 'Round-trip without losing formulas' },
      { id: 'csv2sql', name: 'CSV → SQL Generator',         icon: 'Terminal', tagline: 'Inferred types, batched INSERTs, schema DDL' },
    ],
  },
  {
    id: 'files',
    label: 'Files & Data',
    tagline: 'Open the unopenable. Repair the broken. Extract the buried.',
    hue: 145, /* green */
    tools: [
      { id: 'mime',   name: 'MIME / File Type Detector',     icon: 'FileSearch', tagline: 'Magic bytes, not extensions' },
      { id: 'zip',    name: '.zip / .tar Previewer',         icon: 'Archive',    tagline: 'Browse archives in-browser, no download' },
      { id: 'csvdr',  name: 'CSV Doctor',                    icon: 'HeartPulse', tagline: 'Repair quoting, encoding, line endings' },
      { id: 'bank',   name: 'Generic PDF Bank Parser',       icon: 'FileText',   tagline: 'Statement → categorized transactions' },
      { id: 'ocr1',   name: 'PDF Scanned Text Extractor',    icon: 'ScanText',   tagline: 'Layout-aware OCR with column detection' },
      { id: 'ocr2',   name: 'Screenshot → Excel / Text',     icon: 'Camera',     tagline: 'Table OCR that respects rows and columns', hot: true },
      { id: 'redact', name: 'Auto-Redactor (PII Scrubber)',  icon: 'Shield',     tagline: 'GDPR-grade redaction, on-device' },
    ],
  },
  {
    id: 'media',
    label: 'Images & Media',
    tagline: 'Convert, scrub, sync, and grab — without uploading.',
    hue: 25, /* warm orange */
    tools: [
      { id: 'heic',  name: 'HEIC → JPG Converter',       icon: 'Image',     tagline: 'Batch convert with EXIF preserved' },
      { id: 'meta',  name: 'Metadata Scrubber',          icon: 'Eraser',    tagline: 'Strip EXIF, GPS, author from any file' },
      { id: 'thumb', name: 'Ultimate Thumbnail Grabber', icon: 'Film',      tagline: 'YouTube, Vimeo, TikTok · max-res variants' },
      { id: 'dup',   name: 'Duplicate Image Finder',     icon: 'Copy',      tagline: 'Perceptual hashing, not byte-identical' },
      { id: 'qr',    name: 'Custom QR + Logo Maker',     icon: 'QrCode',    tagline: 'Branded QR with logo, color, gradient' },
      { id: 'subs',  name: 'Subtitle Resyncer',          icon: 'Subtitles', tagline: 'Drift-correct .srt / .vtt by drag-handle' },
    ],
  },
  {
    id: 'pro',
    label: 'Pro Vault',
    tagline: 'Heavyweight tools for teams. Unlimited runs, branded exports, full history.',
    hue: 75, /* amber */
    pro: true,
    tools: [
      { id: 'pdiff', name: 'Visual PDF Diff Checker',          icon: 'GitCompare', tagline: 'Pixel + semantic diff across versions', pro: true },
      { id: 'hpdf',  name: 'HTML → Print-Ready PDF',           icon: 'Printer',    tagline: 'Bleed, crop marks, color profiles', pro: true },
      { id: 'batch', name: 'Batch Processing Engine',          icon: 'Layers3',    tagline: 'Run any tool against 500 files at once', pro: true },
      { id: 'hist',  name: 'Saved History & Branded Exports',  icon: 'BookMarked', tagline: 'Version every run, brand every output', pro: true },
    ],
  },
];

export const ALL_TOOLS = CATEGORIES.flatMap(c =>
  c.tools.map(t => ({ ...t, category: c.id, categoryLabel: c.label, hue: c.hue }))
);
