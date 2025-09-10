# OpenAI Integration Setup

## Quick Setup

1. **Get OpenAI API Key:**
   - Visit https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key (starts with `sk-...`)

2. **Create Environment File:**
   ```bash
   cd backend
   touch .env
   ```

3. **Add Configuration to `.env`:**
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=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
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_ENABLED=true
   
   # Other settings
   DATABASE_URL=sqlite:///./database.db
   SECRET_KEY=your-secret-key-here
   ```

4. **Restart Backend:**
   ```bash
   uvicorn app.main:app --reload
   ```

## Features Enabled

With OpenAI integration, the Analytics page will provide:

- **Intelligent Insights:** AI analyzes your data patterns and trends
- **Actionable Recommendations:** Specific suggestions for improving platform efficiency
- **Context-Aware Analysis:** Understands food rescue domain and provides relevant advice
- **Trend Analysis:** Identifies patterns in donor/recipient behavior
- **Risk Assessment:** Smart prioritization of high-risk items

## Cost Information

- **gpt-4o-mini:** ~$0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Typical insight generation:** ~500 tokens = $0.0003 per request
- **Expected monthly cost:** $1-5 for typical usage

## Fallback Behavior

If OpenAI is disabled or fails:
- System automatically falls back to rule-based insights
- No functionality is lost
- Users see "AI_POWERED: false" indicator

## Security Notes

- API key is stored securely in environment variables
- No sensitive data is sent to OpenAI (only aggregated statistics)
- All requests are logged for monitoring
