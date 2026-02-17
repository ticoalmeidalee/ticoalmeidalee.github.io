// Tony — Tico's Virtual Assistant (Claude-powered)

// --- Configuration ---
const ALLOWED_ORIGINS = [
  'https://ticoalmeidalee.github.io',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const MAX_MESSAGE_LENGTH = 500;

const SYSTEM_PROMPT = `You are Tony, Tico Almeida Lee's virtual assistant on his portfolio website. You are friendly, helpful, and concise.

About Tico:
- Media Arts student passionate about video editing, web development, and AI solutions
- Video editor for ThePharaohNerd (YouTube)
- Builds custom websites, AI chatbots, and e-commerce platforms
- Skilled in Adobe Premiere Pro, After Effects, Photoshop, Illustrator
- Web development with HTML, CSS, JavaScript, React
- AI integration with Claude, GPT, and Gemini models
- Contact: ticoalmeidalee@gmail.com

Your personality:
- Warm and approachable, keep responses short (2-3 sentences max unless detail is needed)
- Help visitors learn about Tico's work, services, and skills
- If asked about pricing or specific project details, suggest they email Tico directly
- Never pretend to be Tico — you are Tony, his virtual assistant
- If asked something unrelated to Tico's work, politely redirect the conversation`;

// --- Rate Limiting (in-memory, cleaned inline per request) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Clean stale entries inline (no setInterval needed)
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// --- Request Handler ---
Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const referer = req.headers.get('referer') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin)
    || ALLOWED_ORIGINS.some(o => referer.startsWith(o))
    || origin === '';

  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Block non-allowed origins
  if (origin !== '' && !ALLOWED_ORIGINS.includes(origin) && !ALLOWED_ORIGINS.some(o => referer.startsWith(o))) {
    return new Response(
      JSON.stringify({ content: [{ text: 'Request not allowed.' }] }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ content: [{ text: 'Method not allowed.' }] }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Rate limiting by IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || 'unknown';

    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({
          content: [{ text: "You're sending messages too quickly. Please wait a moment and try again." }]
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key
    const apiKey = Deno.env.get('Claude_key');
    if (!apiKey) {
      console.error('Missing Claude_key secret');
      return new Response(
        JSON.stringify({ content: [{ text: "I'm currently offline. Please email ticoalmeidalee@gmail.com" }] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate message
    const body = await req.json();
    const message = body?.message;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ content: [{ text: "Please type a message first!" }] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ content: [{ text: "That message is a bit long. Could you keep it under 500 characters?" }] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: message.trim()
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Claude API error:', response.status, JSON.stringify(data).substring(0, 300));
      return new Response(
        JSON.stringify({ content: [{ text: "I'm having a brief issue. Please try again in a moment!" }] }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        content: [{ text: "I'm having trouble right now. Please try again or email ticoalmeidalee@gmail.com" }]
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
