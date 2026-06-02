import { NextResponse } from 'next/server';

export const maxDuration = 10; // Set Vercel execution timeout to max allowed for Hobby tier (10 seconds)

export async function GET(req: Request) {
  try {
    const hfToken = process.env.HF_ACCESS_TOKEN || '';
    
    // 1. Gather all Hugging Face space endpoints from environments
    const endpoints: string[] = [];
    
    if (process.env.IMAGE_COMPILER_URLS) {
      process.env.IMAGE_COMPILER_URLS.split(',').forEach(url => {
        const clean = url.trim();
        if (clean) endpoints.push(clean);
      });
    } else {
      endpoints.push('https://hinshalll-hf-image-converter.hf.space/convert');
    }
    
    if (process.env.PDF_COMPILER_URLS) {
      process.env.PDF_COMPILER_URLS.split(',').forEach(url => {
        const clean = url.trim();
        if (clean) endpoints.push(clean);
      });
    } else {
      endpoints.push('https://hinshalll-hf-pdf-compiler.hf.space/generate');
    }
    
    // 2. Parse origins (we want to check the base URL / root of each Space)
    const origins = Array.from(new Set(endpoints.map(url => {
      try {
        const parsed = new URL(url);
        return `${parsed.protocol}//${parsed.host}`;
      } catch (e) {
        return url;
      }
    })));
    
    // 3. Ping all origins concurrently
    const results = await Promise.all(origins.map(async (origin) => {
      try {
        const headers: Record<string, string> = {};
        if (hfToken) {
          headers['Authorization'] = `Bearer ${hfToken}`;
        }
        
        const res = await fetch(origin, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(8000), // 8s timeout to fit within Vercel's 10s serverless function limit
          cache: 'no-store'
        });
        
        // A status of 200, 401 (unauthorized), or 405 (method not allowed) means
        // the server responded and is therefore awake and operational!
        const isAwake = res.ok || res.status === 401 || res.status === 405;
        
        return {
          url: origin,
          status: res.status,
          ok: isAwake
        };
      } catch (err: any) {
        return {
          url: origin,
          status: 'error',
          error: err.message || 'Timeout/Network error',
          ok: false
        };
      }
    }));
    
    const allOk = results.every(r => r.ok);
    
    return NextResponse.json(
      {
        status: allOk ? 'success' : 'partial_failure',
        timestamp: new Date().toISOString(),
        monitors: results
      },
      {
        status: allOk ? 200 : 502 // Return 502 (Bad Gateway) if any space fails to respond so UptimeRobot alerts
      }
    );
    
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err.message || 'Internal keep-alive error occurred.' },
      { status: 500 }
    );
  }
}
