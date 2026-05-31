const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-core');
const { existsSync } = require('fs');

const app = express();
const PORT = process.env.PORT || 7860; // Hugging Face Spaces standard port is 7860
const API_TOKEN = process.env.API_TOKEN || 'mysaas_secure_pdf_token_2026'; // Optional bearer token validation

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support parsing massive documents

// Global persistent browser instance for warm tab-reuse
let cachedBrowser = null;
let idleTimeout = null;

// Standard Linux Chromium executable paths inside Docker
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium';

// Reset the idle browser shutdown timer (bypassed to keep browser permanently warm in 16GB RAM container)
function resetIdleTimeout() {
  // Browser stays permanently booted in memory to guarantee instant sub-second downloads at all times
}

// 1. Health check endpoint (for UptimeRobot to keep container warm 24/7)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'Headless Chrome PDF Compiler',
    uptime: process.uptime(),
    activeBrowser: !!(cachedBrowser && cachedBrowser.isConnected())
  });
});

// 2. Headless Chrome PDF compilation endpoint
app.post('/generate', async (req, res) => {
  try {
    const { html, filename, customHeader, customFooter, isPremium } = req.body;

    // Optional Token Verification (supporting both public spaces and private spaces)
    const customAuth = req.headers['x-compiler-token'];
    const standardAuth = req.headers.authorization;

    if (customAuth) {
      if (customAuth !== `Bearer ${API_TOKEN}`) {
        return res.status(401).json({ error: 'Unauthorized payload access via custom header' });
      }
    } else if (standardAuth) {
      // If the space is private, standardAuth holds the HF Proxy Token (which starts with Bearer hf_).
      // We bypass verification if it is the HF Proxy token, otherwise check it matches our local API_TOKEN.
      if (standardAuth !== `Bearer ${API_TOKEN}` && !standardAuth.startsWith('Bearer hf_')) {
        return res.status(401).json({ error: 'Unauthorized payload access via standard header' });
      }
    }

    if (!html) {
      return res.status(400).json({ error: 'Missing html content' });
    }

    // Cancel any pending idle shutdown timer since we have active traffic
    if (idleTimeout) {
      clearTimeout(idleTimeout);
    }

    // Warm Browser Reuse: Check if global browser is already booted and connected
    if (!cachedBrowser || !cachedBrowser.isConnected()) {
      console.log('[Compiler] Launching fresh headless Chromium instance...');
      cachedBrowser = await puppeteer.launch({
        executablePath: CHROMIUM_PATH,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-web-security'
        ]
      });
    } else {
      console.log('[Compiler] Reusing warm browser instance (0ms cold start latency)...');
    }

    // Open a lightweight tab/page (only consumes ~100MB of RAM)
    const page = await cachedBrowser.newPage();
    
    // Set standard A4 viewport dimensions
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

    // Inject a CSS rule to hide the HTML-based fixed print headers/footers to avoid double-rendering
    const injectedHtml = html.replace('</head>', '<style>body .pdf-header, body .pdf-footer { display: none !important; }</style></head>');

    // Load styled HTML into Chrome page and wait for fonts/images to resolve
    await page.setContent(injectedHtml, { waitUntil: 'networkidle0', timeout: 10000 });

    // Build native Chromium header and footer templates
    const hasHeader = !!customHeader;
    
    // Watermark/Footer: mandatory on Free tier, automatically removed on Paid tier
    let footerText = customFooter || "";
    const isPaid = isPremium === true || isPremium === 'true'; // handle boolean or string safely
    if (!isPaid) {
      if (footerText) footerText += " | ";
      footerText += "Formatted using MySaaS";
    }

    let headerTemplate = '<div></div>';
    if (hasHeader) {
      headerTemplate = `
        <div style="font-size: 8.5pt; color: #888; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; width: 100%; text-align: center; border-bottom: 1px solid #eee; padding-bottom: 6px; margin: 0 1.2in;">
          ${customHeader}
        </div>
      `;
    }

    let footerTemplate = `
      <div style="font-size: 8.5pt; color: #888; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; width: 100%; text-align: center; border-top: 1px solid #eee; padding-top: 6px; margin: 0 1.2in; display: flex; justify-content: space-between;">
        <span style="font-style: italic;">${footerText}</span>
        <div>
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      </div>
    `;

    // Compile high-fidelity vector PDF with exact margin constraints
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: headerTemplate,
      footerTemplate: footerTemplate,
      margin: {
        top: '1.0in',
        bottom: '1.0in',
        left: '1.2in',
        right: '1.2in'
      }
    });

    // Close the page tab immediately to free memory (browser stays booted)
    await page.close();

    // Start 30s idle timer
    resetIdleTimeout();

    // Stream PDF binary back to client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'document.pdf'}"`);
    return res.status(200).send(pdfBuffer);

  } catch (err) {
    console.error('[Compiler Error]', err);
    resetIdleTimeout();
    return res.status(500).json({ error: err.message || 'Chromium PDF conversion failed' });
  }
});

// Boot the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`PDF Compiler microservice is online and listening on 0.0.0.0:${PORT}`);
});
