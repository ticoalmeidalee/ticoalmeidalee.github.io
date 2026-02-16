# Claude AI Chatbot Integration

This Supabase Edge Function integrates Claude AI (Anthropic) with your portfolio chatbot to provide intelligent, context-aware responses about your work and services.

## Features

✅ **Secure API Key Management** - Uses environment variables (never exposed to frontend)
✅ **Portfolio Context** - Claude has detailed knowledge about your work, services, and projects
✅ **CORS Enabled** - Works seamlessly with your frontend
✅ **Error Handling** - Graceful fallbacks if API fails
✅ **Latest Claude Model** - Uses Claude 3.5 Sonnet for best responses

## Setup Instructions

### 1. Get Your Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create Key**
5. Copy your API key (starts with `sk-ant-`)

### 2. Set Environment Variable in Supabase

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Edge Functions**
3. Click on **Secrets**
4. Add a new secret:
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your API key from step 1
5. Click **Save**

**Option B: Via Supabase CLI**
```bash
supabase secrets set ANTHROPIC_API_KEY=your-api-key-here
```

### 3. Deploy the Function

In your terminal, navigate to your project directory and run:

```bash
cd C:\Users\ticoa\Desktop\Code\Work\Portfolio
supabase functions deploy claude-chat
```

If you haven't linked your project yet:
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy claude-chat
```

### 4. Test the Function

Test locally:
```bash
supabase functions serve claude-chat
```

Then test with curl:
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/claude-chat' \
  --header 'Content-Type: application/json' \
  --data '{"message":"What services does Tico offer?"}'
```

Test production:
```bash
curl -i --location --request POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/claude-chat' \
  --header 'Content-Type: application/json' \
  --data '{"message":"Tell me about Tico'\''s video editing work"}'
```

## Security Features

🔒 **API Key Protection**
- API key stored as environment variable
- Never exposed to frontend code
- Only accessible by Supabase Edge Function

🔒 **CORS Configuration**
- Properly configured CORS headers
- Allows frontend to make requests
- Can be restricted to specific domains if needed

🔒 **Error Handling**
- Doesn't leak sensitive error details to frontend
- Provides user-friendly fallback messages
- Logs detailed errors server-side for debugging

## Customizing the Context

To update what Claude knows about your work, edit the `PORTFOLIO_CONTEXT` variable in `index.ts`:

```typescript
const PORTFOLIO_CONTEXT = `You are Tico Almeida Lee's AI assistant...
// Add or modify information here
`;
```

After making changes, redeploy:
```bash
supabase functions deploy claude-chat
```

## Monitoring

View function logs in real-time:
```bash
supabase functions logs claude-chat
```

Or in the Supabase dashboard:
1. Go to **Edge Functions**
2. Click on **claude-chat**
3. View **Logs** tab

## Troubleshooting

**"API configuration error"**
- Check that `ANTHROPIC_API_KEY` is set in Supabase secrets
- Verify the key is valid at console.anthropic.com

**CORS errors**
- Ensure CORS headers are properly set in the function
- Check browser console for specific error messages

**Function not responding**
- Check function logs for errors
- Verify function is deployed: `supabase functions list`
- Test with curl to isolate frontend vs backend issues

## Cost Optimization

Claude API pricing is based on tokens used:
- **Claude 3.5 Sonnet**: ~$3 per million input tokens, ~$15 per million output tokens
- Average chatbot response: ~500-1000 tokens total
- Estimated cost: $0.01-0.02 per conversation

To reduce costs:
- Reduce `max_tokens` in the API call (currently 1024)
- Switch to Claude 3.5 Haiku for simpler queries (cheaper)
- Add rate limiting if needed

## Next Steps

1. **Add Rate Limiting**: Implement rate limiting to prevent abuse
2. **Add Analytics**: Track popular questions and conversation metrics
3. **Conversation History**: Store conversation context for multi-turn conversations
4. **Custom Training**: Add more specific examples of your work to the context

## Support

If you encounter issues:
1. Check function logs: `supabase functions logs claude-chat`
2. Review Anthropic API status: https://status.anthropic.com/
3. Test with curl to isolate the issue
4. Check Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
