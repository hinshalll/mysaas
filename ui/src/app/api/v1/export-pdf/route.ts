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

    const { html, filename, customHeader, customFooter, isPremium } = body;
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
    const isPro = profile && profile.tier === 'pro';
    const isApi = profile && profile.tier === 'api';
    const isAdmin = profile && profile.tier === 'admin';
    const isPaidOrAdmin = isPro || isApi || isAdmin;
    const rateLimitMax = isAdmin ? 999999 : (isApi ? 1000 : (isPro ? 100 : 5));

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

    if (dailyCount >= rateLimitMax && !isAdmin) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: `Cloud PDF generation limit reached (${dailyCount}/${rateLimitMax} compiles today). Please upgrade to the Pro Plan or Developer Plan for higher capacity.` 
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

    // 7. Proxy request securely to Hugging Face with Automatic Failover Retry
    const proxyHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Compiler-Token': `Bearer ${COMPILER_TOKEN}`
    };

    if (HF_TOKEN) {
      proxyHeaders['Authorization'] = `Bearer ${HF_TOKEN}`;
    } else {
      proxyHeaders['Authorization'] = `Bearer ${COMPILER_TOKEN}`;
    }

    const endpoints = [...COMPILER_ENDPOINTS];
    // Shuffle the endpoints list to randomize load distribution
    for (let i = endpoints.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [endpoints[i], endpoints[j]] = [endpoints[j], endpoints[i]];
    }

    let proxyResponse = null;
    let activeEndpoint = '';

    // Loop through endpoints with automatic 4-second timeouts. If one fails or is cold-starting, instantly retry the next!
    for (const endpoint of endpoints) {
      activeEndpoint = endpoint;
      console.log(`[Proxy] Attempting PDF compilation at node: ${endpoint}`);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: proxyHeaders,
          body: JSON.stringify({ 
            html, 
            filename,
            customHeader,
            customFooter,
            isPremium
          }),
          signal: AbortSignal.timeout(20000) // 20-second timeout per space node to allow compiling massive documents
        });

        if (response.ok) {
          proxyResponse = response;
          break; // Success! Break out of the failover loop
        } else {
          const errText = await response.text();
          console.warn(`[Proxy Warning] Space node ${endpoint} failed with status ${response.status}:`, errText);
        }
      } catch (err) {
        console.warn(`[Proxy Warning] Space node ${endpoint} timed out or experienced a network error. Retrying next node...`, err);
      }
    }

    if (!proxyResponse) {
      console.error(`[Proxy Error] All configured Hugging Face Spaces failed or timed out.`);
      return NextResponse.json(
        { status: 'error', message: 'All cloud PDF compilation nodes are currently offline or timed out.' },
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
