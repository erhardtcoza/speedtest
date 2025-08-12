#!/bin/bash

# Custom Speedtest Setup Script
echo "🚀 Setting up Custom Speedtest with Cloudflare Workers..."

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js >= 16"
    exit 1
fi

if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

echo "✅ Prerequisites check complete"

# Setup main speedtest worker
echo "🔧 Setting up main speedtest worker..."
cd custom-speedtest-worker
npm install
echo "📁 Main worker dependencies installed"

# Setup TURN worker
echo "🔧 Setting up TURN worker..."
cd ../custom-turn-worker
npm install
echo "📁 TURN worker dependencies installed"

# Create development environment files
echo "⚙️ Creating development environment files..."

# Main worker .dev.vars
cd ../custom-speedtest-worker
cat > .dev.vars << EOF
CORS_ORIGINS=http://localhost:8080,http://127.0.0.1:8080,https://speedtest.vinethosting.org
MAX_FILE_SIZE=268435456
ENABLE_METRICS=false
EOF

# TURN worker .dev.vars
cd ../custom-turn-worker
cat > .dev.vars << EOF
REALTIME_TURN_TOKEN_TTL_SECONDS=86400
REALTIME_TURN_ORIGINS=http://localhost:8080,http://127.0.0.1:8080,https://speedtest.vinethosting.org
# REALTIME_TURN_TOKEN_ID=your-token-id-here
# REALTIME_TURN_TOKEN_SECRET=your-api-token-here
EOF

echo "📋 Setup complete! Next steps:"
echo ""
echo "1. Login to Cloudflare Workers:"
echo "   wrangler login"
echo ""
echo "2. (Optional) Set up Cloudflare Realtime TURN server:"
echo "   - Go to Cloudflare Dashboard → Realtime → TURN Server"
echo "   - Create a new TURN server"
echo "   - Add credentials to custom-turn-worker/.dev.vars"
echo ""
echo "3. Deploy the workers:"
echo "   cd custom-speedtest-worker && wrangler deploy"
echo "   cd ../custom-turn-worker && wrangler deploy"
echo ""
echo "4. Test locally:"
echo "   cd custom-speedtest-worker && npm run dev"
echo "   # In another terminal:"
echo "   cd custom-turn-worker && npm run dev"
echo "   # In another terminal:"
echo "   cd custom-speedtest-frontend && python -m http.server 8080"
echo ""
echo "5. Configure the frontend:"
echo "   - Open http://localhost:8080"
echo "   - Click 'Advanced Settings'"
echo "   - Set Server URL to your worker URL"
echo ""
echo "🎉 Happy testing!"