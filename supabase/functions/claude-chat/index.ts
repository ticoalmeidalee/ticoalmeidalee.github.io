// Simple Claude Chatbot Function
import "https://deno.land/x/xhr@0.3.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get API key
    const apiKey = Deno.env.get('Claude_key');
    console.log('API Key exists:', !!apiKey);

    if (!apiKey) {
      throw new Error('No API key found');
    }

    // Get message
    const { message } = await req.json();
    console.log('Received message:', message);

    // Call Claude API
    console.log('Calling Claude API...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: message
        }]
      })
    });

    console.log('Claude API status:', response.status);

    const data = await response.json();
    console.log('Claude API response:', JSON.stringify(data).substring(0, 200));

    if (!response.ok) {
      console.error('Claude API Error:', data);
      throw new Error(`Claude API error: ${JSON.stringify(data)}`);
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error.message);
    return new Response(
      JSON.stringify({
        error: error.message,
        content: [{ text: `Error: ${error.message}` }]
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
