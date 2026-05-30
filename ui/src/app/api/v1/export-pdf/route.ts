import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Load balance across multiple Hugging Face Space endpoints (or standard fallback)
const COMPILER_ENDPOINTS = process.env.PDF_COMPILER_URLS 
  ? process.env.PDF_COMPILER_URLS.split(',').map(url => url.trim())
  : ['https://hinshalll-hf-pdf-compiler.hf.space/generate'];

// In Docker microservice package, we set an optional secure bearer token
const COMPILER_TOKEN = process.env.PDF_COMPILER_TOKEN || 'mysaas_secure_pdf_token_2026';

// Read optional Hugging Face Access Token for private spaces
const HF_TOKEN = process.env.HF_ACCESS_TOKEN || '';

export async function POST(req: Request) {
  try {
    // 1. Authenticate Request (Bearer token is optional for free guests, but required for Pro/API accounts)
    const authHeader = req.headers.get('authorization');
    const token = (authHeader && authHeader.startsWith('Bearer ')) 
      ? authHeader.split('Bearer ')[1].trim() 
      : null;

    // 2. Parse payload
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { status: 'error', message: 'Malformed JSON payload body.' },
        { status: 400 }
      );
    }

    const { html, filename } = body;
    if (!html) {
      return NextResponse.json(
        { status: 'error', message: 'Missing "html" content parameter.' },
        { status: 400 }
      );
    }

    // 3. Initialize Supabase Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://biwglrhogjuomunnwzsc.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_V66dv60NGqpWQ80q3PyALQ_Z4w0_08U';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let profile = null;
    let userId = null;

    if (token) {
      // Check if the bearer token is a Supabase JWT (comes from our frontend)
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (!userError && user) {
          userId = user.id;
          // Query profile for this user ID
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          if (userProfile) {
            profile = userProfile;
          }
        }
      } catch (e) {
        console.log('Token is not a valid Supabase JWT, falling back to treating as developer api_key.');
      }

      // If not a JWT, look up the profile by developer api_key
      if (!profile) {
        const { data: apiKeyProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('api_key', token)
          .single();
        if (apiKeyProfile) {
          profile = apiKeyProfile;
          userId = apiKeyProfile.id;
        }
      }
    }

    // 4. Verify Authorization Tier & Usage Limits
    const isPaidOrAdmin = profile && (profile.tier === 'pro' || profile.tier === 'api' || profile.tier === 'admin');
    const rateLimitMax = isPaidOrAdmin ? 200 : 5;

    // 5. Enforce Daily Usage Quota Limits to prevent API rate limit abuse
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const ipHash = clientIp.split(',')[0].trim();

    let dailyCount = 0;
    if (userId) {
      const { count } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('tool_id', 'universal-pdf-exporter')
        .gte('created_at', today.toISOString());
      dailyCount = count || 0;
    } else {
      const { count } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .eq('tool_id', 'universal-pdf-exporter')
        .gte('created_at', today.toISOString());
      dailyCount = count || 0;
    }

    if (dailyCount >= rateLimitMax && (!profile || profile.tier !== 'admin')) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: `Cloud PDF generation limit exhausted (${dailyCount}/${rateLimitMax} compiles today). Upgrade to Pro for unlimited high-speed downloads, or use standard local system printing.` 
        },
        { status: 429 }
      );
    }

    // 6. Log Usage in Database
    await supabase
      .from('usage_logs')
      .insert({
        user_id: userId,
        tool_id: 'universal-pdf-exporter',
        ip_hash: ipHash,
        tier: isPaidOrAdmin ? 3 : 1
      });

    // 7. Select Compiler Endpoint using Random Load Balancing
    const endpoint = COMPILER_ENDPOINTS[Math.floor(Math.random() * COMPILER_ENDPOINTS.length)];
    console.log(`[Proxy] Forwarding PDF compilation request to Hugging Face: ${endpoint}`);

    // 8. Proxy request securely to Hugging Face
    const proxyHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Compiler-Token': `Bearer ${COMPILER_TOKEN}`
    };

    // If HF Token is provided, use it to authorize the private space proxy request
    if (HF_TOKEN) {
      proxyHeaders['Authorization'] = `Bearer ${HF_TOKEN}`;
    } else {
      // Fallback for public spaces
      proxyHeaders['Authorization'] = `Bearer ${COMPILER_TOKEN}`;
    }

    const proxyResponse = await fetch(endpoint, {
      method: 'POST',
      headers: proxyHeaders,
      body: JSON.stringify({ html, filename }),
    });

    if (!proxyResponse.ok) {
      const errText = await proxyResponse.text();
      console.error(`[Proxy Error] Compiler microservice returned status ${proxyResponse.status}:`, errText);
      return NextResponse.json(
        { status: 'error', message: 'Failed to compile high-fidelity PDF via cloud microservice.' },
        { status: 502 }
      );
    }

    // 9. Read the compiled PDF buffer stream
    const pdfBuffer = await proxyResponse.arrayBuffer();

    // 10. Return compiled PDF binary directly as a download attachment
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename || 'document.pdf'}"`,
        'Cache-Control': 'no-store, max-age=0'
      }
    });

  } catch (err: any) {
    console.error('[Export PDF Route Error]', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Internal server error occurred compiling PDF.' },
      { status: 500 }
    );
  }
}
