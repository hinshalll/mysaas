import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // 1. Parse API Authorization Bearer Token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { status: 'error', message: 'Missing or malformed Authorization header with Bearer token.' },
        { status: 401 }
      );
    }
    const token = authHeader.split('Bearer ')[1].trim();

    // 2. Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { status: 'error', message: 'Malformed JSON payload body.' },
        { status: 400 }
      );
    }

    const { content, style = 'modern', tool = 'ai-formatter' } = body;
    if (!content) {
      return NextResponse.json(
        { status: 'error', message: 'Missing "content" text parameter in request body.' },
        { status: 400 }
      );
    }

    // 3. Initialize Supabase Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { status: 'error', message: 'Server configuration error (missing database environment keys).' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 4. Query profile by active API key
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('api_key', token)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized. Invalid or revoked API key.' },
        { status: 401 }
      );
    }

    // 5. Enforce Daily Usage Quota Limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: dailyCount, error: countError } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .gte('created_at', today.toISOString());

    if (countError) {
      return NextResponse.json(
        { status: 'error', message: 'Database transaction error checking limits.' },
        { status: 500 }
      );
    }

    const currentCount = dailyCount || 0;
    const isProOrAdmin = profile.tier === 'pro' || profile.tier === 'admin';

    // Sandbox Free Tier Limit: 5 requests/day
    if (!isProOrAdmin && currentCount >= 5) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: `Sandbox API rate limit exhausted (${currentCount}/5 requests today). Please upgrade to Pro to unlock unlimited live B2B production API capacity.` 
        },
        { status: 429 }
      );
    }

    // Pro Tier Soft Limit: 200 requests/day to prevent scraper bots
    if (isProOrAdmin && currentCount >= 200) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: `Production API high-use soft limit activated (${currentCount}/200 requests today). If your company requires high-compute custom enterprise volumes, please contact support.` 
        },
        { status: 429 }
      );
    }

    // 6. Log Usage in Database
    const { error: logError } = await supabase
      .from('usage_logs')
      .insert({
        user_id: profile.id,
        tool_id: tool,
        tier: isProOrAdmin ? 3 : 1
      });

    if (logError) {
      console.error('Failed to log API usage:', logError);
    }

    // 7. Process / Format Text content programmatically on server
    const rawText = content.trim();
    let formattedText = rawText;

    if (style === 'academic') {
      formattedText = `==================================================\n             ACADEMIC DOCUMENT REPORT\n==================================================\n\n${rawText}\n\n--------------------------------------------------\nDocument parsed programmatically via API Service.`;
    } else if (style === 'minimalist') {
      formattedText = `${rawText}\n\n---\napi-formatted`;
    } else {
      // 'modern' style
      formattedText = `# Formatted Document Report\n\n${rawText}\n\n---\n*Formatted programmatically via Developer API.*`;
    }

    // 8. Return JSON payload response
    return NextResponse.json({
      status: 'success',
      data: {
        formatted: formattedText,
        metadata: {
          chars_processed: rawText.length,
          words_count: rawText.split(/\s+/).filter(Boolean).length,
          tier: profile.tier,
          api_requests_today: currentCount + 1,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (err) {
    console.error('Route API error:', err);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error occurred processing request.' },
      { status: 500 }
    );
  }
}
