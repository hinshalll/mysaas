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
