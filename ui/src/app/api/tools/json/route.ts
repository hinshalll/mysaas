import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { status: 'error', error_details: 'Malformed JSON request body.' },
        { status: 400 }
      );
    }

    const { content, action = 'Format' } = body;
    if (!content) {
      return NextResponse.json(
        { status: 'error', error_details: 'Input is empty. Please paste some JSON first.' },
        { status: 400 }
      );
    }

    const rawText = content.trim();

    try {
      // 1. Try to parse normally
      const parsed = JSON.parse(rawText);

      if (action === 'Format' || action === 'Auto-Repair') {
        const formatted = JSON.stringify(parsed, null, 4);
        return NextResponse.json({
          status: action === 'Auto-Repair' ? 'already_valid' : 'success',
          output: formatted,
          error_details: action === 'Auto-Repair' ? 'JSON was already valid! No repairs needed.' : null
        });
      } else if (action === 'Minify') {
        const minified = JSON.stringify(parsed);
        return NextResponse.json({
          status: 'success',
          output: minified,
          error_details: null
        });
      }

    } catch (err: any) {
      if (action !== 'Auto-Repair') {
        return NextResponse.json({
          status: 'error',
          output: '',
          error_details: `Syntax Error: ${err.message}`
        });
      }

      // Try Auto-Repair using clean, robust TypeScript equivalents of the regex rules
      try {
        let repaired = rawText
          .replace(/(?<!\\)'/g, '"') // Replace single quotes with double quotes
          .replace(/,(\s*[\]}])/g, '$1') // Strip trailing commas
          .replace(/([{,]\s*)([A-Za-z0-9_]+)(\s*:)/g, '$1"$2"$3'); // Enquote unquoted keys

        const parsedRepaired = JSON.parse(repaired);
        const formattedRepaired = JSON.stringify(parsedRepaired, null, 4);
        
        return NextResponse.json({
          status: 'repaired',
          output: formattedRepaired,
          error_details: 'Auto-Repair successful! Trailing commas or quote errors were fixed.'
        });
      } catch (repairErr: any) {
        return NextResponse.json({
          status: 'fatal_error',
          output: '',
          error_details: `JSON is severely broken. Could not auto-repair. Error: ${repairErr.message}`
        });
      }
    }

    return NextResponse.json({
      status: 'error',
      output: '',
      error_details: 'Invalid operation.'
    }, { status: 400 });

  } catch (err: any) {
    console.error('JSON tool API error:', err);
    return NextResponse.json(
      { status: 'fatal_error', output: '', error_details: 'Internal server error occurred.' },
      { status: 500 }
    );
  }
}
