import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Dedicated Hugging Face Space endpoint load balancing
const COMPILER_ENDPOINTS = process.env.IMAGE_COMPILER_URLS
  ? process.env.IMAGE_COMPILER_URLS.split(',').map(url => url.trim())
  : ['https://hinshalll-hf-image-converter.hf.space/convert'];

const CONVERTER_TOKEN = process.env.IMAGE_CONVERTER_TOKEN || 'mysaas_secure_image_token_2026';

export async function POST(req: Request) {
  try {
    // 1. Authenticate API Key Bearer Token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { status: 'error', message: 'Missing or malformed Authorization header with Bearer token.' },
        { status: 401 }
      );
    }
    const token = authHeader.split('Bearer ')[1].trim();

    // 2. Initialize Supabase Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://biwglrhogjuomunnwzsc.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_V66dv60NGqpWQ80q3PyALQ_Z4w0_08U';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Query user profile by token
    let profile = null;
    let userId = null;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (!userError && user) {
        userId = user.id;
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
      // Ignored: Not a Supabase JWT session, try checking developer API key
    }

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

    if (!profile) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized. Invalid or revoked API key.' },
        { status: 401 }
      );
    }

    // 3. Enforce Daily API Limits
    const isPro = profile.tier === 'pro';
    const isApi = profile.tier === 'api';
    const isAdmin = profile.tier === 'admin';
    const isPaidOrAdmin = isPro || isApi || isAdmin;

    // Sandbox Free Tier Limit: 5 requests/day
    // Pro Plan Limit: 100 requests/day
    // Developer Plan Limit: 1,000 requests/day
    const maxLimits = isAdmin ? 999999 : (isApi ? 1000 : (isPro ? 100 : 5));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: dailyCount, error: countError } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('tool_id', 'heic-to-jpg-converter')
      .gte('created_at', today.toISOString());

    if (countError) {
      return NextResponse.json(
        { status: 'error', message: 'Database connection error checking limits.' },
        { status: 500 }
      );
    }

    const currentCount = dailyCount || 0;
    if (currentCount >= maxLimits) {
      return NextResponse.json(
        {
          status: 'error',
          message: `API daily limit exhausted (${currentCount}/${maxLimits} runs today). Please upgrade your subscription tier for higher volume.`
        },
        { status: 429 }
      );
    }

    // 4. Log Usage in Database
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const ipHash = clientIp.split(',')[0].trim();
    
    await supabase.from('usage_logs').insert({
      user_id: profile.id,
      tool_id: 'heic-to-jpg-converter',
      ip_hash: ipHash,
      tier: isApi ? 3 : (isPro ? 2 : 1)
    });

    // 5. Parse Payload (supports JSON base64 OR multipart/form-data)
    let fileBuffer: Buffer | null = null;
    let targetFormat: 'jpg' | 'png' = 'jpg';
    let quality = 0.95;
    let filename = 'image.jpg';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json({ status: 'error', message: 'Missing "file" field in multipart form-data.' }, { status: 400 });
      }
      
      const formatParam = formData.get('format') as string;
      if (formatParam === 'png') targetFormat = 'png';
      
      const qualityParam = formData.get('quality') as string;
      if (qualityParam) {
        const parsedQ = parseFloat(qualityParam);
        if (!isNaN(parsedQ) && parsedQ > 0 && parsedQ <= 1) quality = parsedQ;
      }

      const arrBuf = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrBuf);
      filename = file.name || 'image.heic';

    } else if (contentType.includes('application/json')) {
      const jsonBody = await req.json();
      const { image, format = 'jpg', quality: q } = jsonBody;

      if (!image) {
        return NextResponse.json({ status: 'error', message: 'Missing "image" base64 content in JSON body.' }, { status: 400 });
      }

      if (format === 'png') targetFormat = 'png';
      if (q) {
        const parsedQ = parseFloat(q);
        if (!isNaN(parsedQ) && parsedQ > 0 && parsedQ <= 1) quality = parsedQ;
      }

      // Decode base64
      let cleanBase64 = image;
      if (image.startsWith('data:')) {
        cleanBase64 = image.substring(image.indexOf(',') + 1);
      }
      
      fileBuffer = Buffer.from(cleanBase64, 'base64');
      filename = `image.${targetFormat}`;
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Failed to extract valid image content buffer.' }, { status: 400 });
    }

    // 6. Proxy request to Hugging Face compiler Space (with failover)
    let proxyResponse = null;
    let activeEndpoint = '';

    const endpoints = [...COMPILER_ENDPOINTS];
    // Shuffle endpoints to distribute load
    for (let i = endpoints.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [endpoints[i], endpoints[j]] = [endpoints[j], endpoints[i]];
    }

    for (const endpoint of endpoints) {
      activeEndpoint = endpoint;
      console.log(`[Proxy Image] Attempting conversion at space node: ${endpoint}`);
      try {
        // Construct form data to send to Hugging Face
        const proxyForm = new FormData();
        // Append file buffer as blob
        const fileBlob = new Blob([new Uint8Array(fileBuffer)], { type: 'image/heic' });
        proxyForm.append('file', fileBlob, filename);
        proxyForm.append('format', targetFormat);
        proxyForm.append('quality', quality.toString());

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'X-Compiler-Token': `Bearer ${CONVERTER_TOKEN}`
          },
          body: proxyForm,
          signal: AbortSignal.timeout(20000) // 20s timeout
        });

        if (response.ok) {
          proxyResponse = response;
          break;
        } else {
          const errText = await response.text();
          console.warn(`[Proxy Warning] Space node ${endpoint} failed: ${errText}`);
        }
      } catch (err) {
        console.warn(`[Proxy Warning] Space node ${endpoint} failed or timed out.`, err);
      }
    }

    let resultBuffer: ArrayBuffer | null = null;
    let convertedMime = targetFormat === 'png' ? 'image/png' : 'image/jpeg';

    if (proxyResponse) {
      resultBuffer = await proxyResponse.arrayBuffer();
    } else {
      // 7. Fallback to Local Wasm/JS `heic-convert` if HF space is offline
      console.log(`[Proxy Fallback] All space nodes are offline. Attempting server-side heic-convert fallback...`);
      try {
        const convert = require('heic-convert');
        const outputBuffer = await convert({
          buffer: fileBuffer,
          format: targetFormat === 'png' ? 'PNG' : 'JPEG',
          quality: quality
        });
        resultBuffer = outputBuffer.buffer || outputBuffer;
      } catch (fallbackErr: any) {
        console.error(`[Proxy Fallback Error] Server-side heic-convert failed:`, fallbackErr);
        return NextResponse.json(
          { status: 'error', message: 'Image conversion node offline and server-side fallback failed.' },
          { status: 502 }
        );
      }
    }

    if (!resultBuffer) {
      return NextResponse.json({ status: 'error', message: 'Could not extract converted image buffer.' }, { status: 500 });
    }

    const outputBuffer = Buffer.from(resultBuffer);

    // 8. Return response (Either raw binary or base64 JSON, depending on request Accept header)
    const acceptHeader = req.headers.get('accept') || '';
    if (acceptHeader.includes('image/*') || acceptHeader.includes('image/jpeg') || acceptHeader.includes('image/png') || !contentType.includes('application/json')) {
      // Return binary file stream
      return new Response(outputBuffer, {
        status: 200,
        headers: {
          'Content-Type': convertedMime,
          'Content-Disposition': `attachment; filename="converted_${filename.replace(/\.[^/.]+$/, "")}.${targetFormat}"`,
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    } else {
      // Return JSON base64
      const base64Data = outputBuffer.toString('base64');
      const dataUri = `data:${convertedMime};base64,${base64Data}`;
      return NextResponse.json({
        status: 'success',
        data: {
          image: dataUri,
          format: targetFormat,
          sizeBytes: outputBuffer.length,
          metadata: {
            api_requests_today: currentCount + 1,
            timestamp: new Date().toISOString()
          }
        }
      });
    }

  } catch (err: any) {
    console.error('[API HEIC Route Error]', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Internal server error occurred processing conversion.' },
      { status: 500 }
    );
  }
}
