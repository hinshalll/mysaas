import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';

function compileThemeHtml(rawText: string, theme: string): string {
  const htmlBody = marked.parse(rawText);
  let themeCss = "";
  if (theme === 'academic') {
    themeCss = `
      body { 
        font-family: 'Source Serif Pro', 'Georgia', serif; 
        line-height: 1.7; 
        color: oklch(0.20 0.005 250); 
        background-color: oklch(0.99 0.002 250);
        font-size: 11.5pt; 
        padding: 1.2in; 
      }
      h1 { font-size: 26pt; font-weight: 700; margin-bottom: 8px; color: oklch(0.12 0.005 250); text-align: center; }
      h2 { font-size: 17pt; font-style: italic; font-weight: 600; border-bottom: 1px solid oklch(0.90 0.005 250); margin-top: 28px; padding-bottom: 4px; }
      h3 { font-size: 13pt; font-weight: 600; margin-top: 20px; }
      p { margin: 0 0 14px; text-align: justify; }
      blockquote { border-left: 3px solid oklch(0.40 0.005 250); padding-left: 16px; font-style: italic; color: oklch(0.35 0.005 250); margin: 18px 0; }
      table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 10pt; }
      th, td { border: 1px solid oklch(0.70 0.005 250); padding: 10px 14px; text-align: left; }
      th { background-color: oklch(0.96 0.005 250); font-weight: bold; color: #18181b; }
      tr:nth-child(even) { background-color: oklch(0.98 0.002 250); }
      pre { background-color: oklch(0.95 0.005 250); padding: 12px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; font-size: 10pt; }
      code { font-family: monospace; font-size: 0.9em; background-color: oklch(0.95 0.005 250); padding: 2px 4px; border-radius: 3px; }
    `;
  } else if (theme === 'minimalist') {
    themeCss = `
      body { 
        font-family: 'JetBrains Mono', 'Courier New', monospace; 
        line-height: 1.5; 
        color: #000000; 
        background-color: #ffffff;
        font-size: 10.5pt; 
        padding: 1in; 
      }
      h1 { font-size: 20pt; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; }
      h2 { font-size: 15pt; font-weight: 600; margin-top: 24px; text-transform: uppercase; border-bottom: 1px dashed #000; padding-bottom: 4px; }
      h3 { font-size: 12pt; font-weight: 600; margin-top: 18px; }
      p { margin: 0 0 12px; }
      blockquote { border-left: 2px dashed #000; padding-left: 14px; margin: 16px 0; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { border: 1px dashed #000; padding: 8px 12px; text-align: left; }
      th { font-weight: bold; border-bottom: 2px solid #000; background-color: #f8f9fa; }
      tr:nth-child(even) { background-color: #fafafa; }
      pre { border: 1px dashed #000; padding: 12px; font-family: inherit; white-space: pre-wrap; font-size: 9.5pt; }
      code { background-color: #f0f0f0; padding: 1px 4px; }
    `;
  } else { // modern
    themeCss = `
      body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        line-height: 1.6; 
        color: oklch(0.16 0.008 250); 
        background-color: oklch(0.97 0.005 250);
        font-size: 11pt; 
        padding: 1.2in; 
      }
      h1 { font-size: 28pt; font-weight: 800; letter-spacing: -0.02em; color: oklch(0.12 0.015 250); margin-bottom: 12px; line-height: 1.15; }
      h2 { font-size: 18pt; font-weight: 700; letter-spacing: -0.015em; color: oklch(0.18 0.012 250); margin-top: 28px; }
      h3 { font-size: 14pt; font-weight: 600; color: #334155; margin-top: 20px; }
      p { margin: 0 0 12px; }
      blockquote { 
        border-left: 3px solid oklch(0.62 0.18 265); 
        padding: 8px 16px; 
        font-style: italic; 
        background-color: oklch(0.94 0.006 250); 
        color: oklch(0.35 0.010 250);
        border-radius: 0 6px 6px 0;
        margin: 16px 0;
      }
      code { 
        background-color: oklch(0.92 0.005 250); 
        padding: 2px 5px; 
        border-radius: 4px; 
        font-family: 'JetBrains Mono', 'Courier New', monospace; 
        font-size: 0.9em;
        color: #0f172a;
      }
      pre { 
        background-color: oklch(0.93 0.005 250); 
        color: oklch(0.16 0.008 250);
        padding: 14px 16px; 
        border-radius: 6px; 
        border: 1px solid oklch(0.90 0.005 250);
        overflow-x: auto; 
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        font-size: 10pt;
        line-height: 1.5;
        white-space: pre-wrap;
        margin: 14px 0;
      }
      table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 10pt; border-radius: 8px; overflow: hidden; border: 1px solid oklch(0.90 0.005 250); }
      th, td { border: 1px solid oklch(0.90 0.005 250); padding: 12px 16px; text-align: left; }
      th { background-color: oklch(0.95 0.005 250); font-weight: 600; color: #0f172a; }
      tr:nth-child(even) { background-color: oklch(0.98 0.002 250); }
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${themeCss}
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;
}

function stripMarkdown(md: string) {
  return md
    .replace(/[#_*~`>]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^- /gm, '• ')
    .trim();
}


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

    const content = body.content || body.text;
    const style = body.style || 'modern';
    const tool = body.tool || 'ai-formatter';
    if (!content) {
      return NextResponse.json(
        { status: 'error', message: 'Missing "text" (or "content") parameter in request body.' },
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



    // 4. Query profile by active API key or fallback to guest sandbox
    const sandboxToken = 'sb_publishable_V66dv60NGqpWQ80q3PyALQ_Z4w0_08U';
    let profile = null;
    let isSandboxGuest = false;

    if (token === sandboxToken) {
      isSandboxGuest = true;
      profile = {
        id: 'sandbox_guest',
        tier: 'free'
      };
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('api_key', token)
        .single();
      if (!error && data) {
        profile = data;
      }
    }

    if (!profile) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized. Invalid or revoked API key.' },
        { status: 401 }
      );
    }

    // 5. Enforce Daily Usage Quota Limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const ipHash = clientIp.split(',')[0].trim();

    let dailyCount = 0;

    if (isSandboxGuest) {
      const { count } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .eq('tool_id', tool)
        .gte('created_at', today.toISOString());
      dailyCount = count || 0;
    } else {
      const { count, error: countError } = await supabase
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
      dailyCount = count || 0;
    }

    const currentCount = dailyCount || 0;
    const isPro = profile.tier === 'pro';
    const isApi = profile.tier === 'api';
    const isAdmin = profile.tier === 'admin';
    const isPaidOrAdmin = isPro || isApi || isAdmin;

    // Unsigned Guest Sandbox Limit: 3 requests/day
    if (isSandboxGuest && currentCount >= 3) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: `Unsigned Guest Sandbox daily limit exhausted (${currentCount}/3 requests today). Please sign up for a free account to increase your limit to 10 runs/day, or subscribe to a Paid tier.` 
        },
        { status: 429 }
      );
    }

    // Signed-in Free Account Sandbox Limit: 10 requests/day
    if (!isSandboxGuest && !isPaidOrAdmin && currentCount >= 10) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: `Free Account daily API limit exhausted (${currentCount}/10 requests today). Please upgrade to a Pro or Developer Plan to unlock higher production volumes.` 
        },
        { status: 429 }
      );
    }

    // Pro Plan Limit: 100 requests/day
    if (isPro && currentCount >= 100) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: `Pro Plan API daily limit reached (${currentCount}/100 requests today). Please upgrade to the Developer Plan to unlock higher volumes (1,000/day).` 
        },
        { status: 429 }
      );
    }

    // Developer Plan Limit: 1,000 requests/day
    if (isApi && currentCount >= 1000) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: `Developer Plan API daily limit reached (${currentCount}/1,000 requests today). If your systems require custom high-compute enterprise volume, please contact support.` 
        },
        { status: 429 }
      );
    }

    // 6. Log Usage in Database
    const { error: logError } = await supabase
      .from('usage_logs')
      .insert({
        user_id: isSandboxGuest ? null : profile.id,
        tool_id: tool,
        ip_hash: ipHash,
        tier: isApi ? 3 : (isPro ? 2 : 1)
      });

    if (logError) {
      console.error('Failed to log API usage:', logError);
    }

    // 7. Process / Format Text content programmatically on server
    const rawText = content.trim();

    if (tool === 'json' || tool === 'json-formatter') {
      try {
        const parsed = JSON.parse(rawText);
        const formatted = JSON.stringify(parsed, null, 2);
        return NextResponse.json({
          status: 'success',
          data: {
            formatted: formatted,
            metadata: {
              chars_processed: rawText.length,
              isValid: true,
              repaired: false,
              tier: profile.tier,
              api_requests_today: currentCount + 1,
              timestamp: new Date().toISOString()
            }
          }
        });
      } catch (e: any) {
        // Try a simple auto-repair for common issues (like single quotes or trailing commas)
        try {
          let repairedContent = rawText
            .replace(/'/g, '"') // Replace single quotes with double quotes
            .replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas
          const parsed = JSON.parse(repairedContent);
          const formatted = JSON.stringify(parsed, null, 2);
          return NextResponse.json({
            status: 'repaired',
            data: {
              formatted: formatted,
              metadata: {
                chars_processed: rawText.length,
                isValid: true,
                repaired: true,
                tier: profile.tier,
                api_requests_today: currentCount + 1,
                timestamp: new Date().toISOString()
              }
            }
          });
        } catch {
          return NextResponse.json({
            status: 'error',
            message: `Invalid JSON payload. Parse error: ${e.message}`
          }, { status: 400 });
        }
      }
    }

    // Default: AI / Document formatting tool
    const formattedMarkdown = `# Formatted Document Report\n\n${rawText}\n\n---\n*Formatted programmatically via Developer API.*`;
    const formattedHtml = compileThemeHtml(formattedMarkdown, style);
    const formattedText = stripMarkdown(formattedMarkdown);

    // 8. Return JSON payload response
    return NextResponse.json({
      status: 'success',
      data: {
        formatted: formattedHtml,
        html: formattedHtml,
        markdown: formattedMarkdown,
        text: formattedText,
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
