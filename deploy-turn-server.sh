#!/bin/bash

# Vinet Hosting TURN Server Deployment Script
echo "🔧 Setting up Cloudflare Realtime TURN server secrets..."

# Navigate to TURN worker directory
cd custom-turn-worker

echo "📋 Configuring TURN server secrets for production..."

# Set the TURN Token ID
echo "Setting REALTIME_TURN_TOKEN_ID..."
echo "ea3219ecd43a7f5eebb8da4064d0c531" | wrangler secret put REALTIME_TURN_TOKEN_ID

# Set the API Token
echo "Setting REALTIME_TURN_TOKEN_SECRET..."
echo "2cc033e78fe10b32a7496224b793f20c34f597512442ed6c7d332e15d84585b9" | wrangler secret put REALTIME_TURN_TOKEN_SECRET

echo "✅ TURN server secrets configured successfully!"
echo ""
echo "🚀 Now deploying TURN worker..."
wrangler deploy

echo ""
echo "🎉 TURN server deployment complete!"
echo ""
echo "Your TURN server is now available at:"
echo "- Development: http://localhost:8787/turn-credentials"
echo "- Production: https://turn-api.vinethosting.org/turn-credentials"
echo ""
echo "⚠️  Note: The production worker will only accept requests from:"
echo "   https://speedtest.vinethosting.org"
echo ""
echo "🧪 Test your TURN server with:"
echo "curl \"https://turn-api.vinethosting.org/turn-credentials\" \\"
echo "  -H \"Referer: https://speedtest.vinethosting.org\""