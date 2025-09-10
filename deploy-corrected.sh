#!/bin/bash

echo "🚀 Deploying FoodBridge to Railway (Fixed Database Issue)..."
echo "=========================================================="

# Create new project
echo "Creating Railway project..."
railway init

# Add PostgreSQL database
echo "Adding PostgreSQL database..."
railway add postgresql

# Wait for database to be ready
echo "Waiting for database setup..."
sleep 10

# Get the proper DATABASE_URL from Railway
echo "Getting database connection details..."
DB_URL=$(railway variables get DATABASE_URL 2>/dev/null || echo "")

if [ -z "$DB_URL" ] || [[ "$DB_URL" != postgresql://* ]]; then
    echo "Railway DATABASE_URL not ready or invalid, will use fallback..."
    echo "The app will automatically fall back to SQLite if PostgreSQL URL is invalid"
fi

# Set environment variables
echo "Configuring environment variables..."
railway variables set secret_key="foodbridge-production-secret-$(date +%s)"
railway variables set jwt_algorithm="HS256"
railway variables set access_token_exp_minutes="1440"
railway variables set cors_origins='["*"]'
railway variables set openai_api_key=""
railway variables set openai_model="gpt-4o-mini"
railway variables set openai_enabled="false"
railway variables set app_name="FoodBridge"

# Deploy
echo "Deploying application..."
railway up

# Get the deployment URL
echo "Getting deployment URL..."
sleep 15
railway domain

echo "🎉 Deployment complete!"
echo "Your FoodBridge app is now live and publicly accessible!"
echo ""
echo "📝 Important Notes:"
echo "- If database connection fails, the app will use SQLite automatically"
echo "- Add your OpenAI API key to enable AI features"
echo "- The app handles Railway's database URL format automatically"
echo ""
echo "🔗 Share this URL with anyone to access your app!"
