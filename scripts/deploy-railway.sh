#!/bin/bash
# Deploy to Railway for FREE
# Railway provides $5/month free credit which covers this app
# Usage: ./deploy-railway.sh

set -e

echo "🚀 Deploying CCNA Platform to Railway (FREE)"
echo "============================================="
echo ""
echo "Railway provides $5/month free credit - enough for this app!"
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "🔐 Login to Railway..."
railway login

# Create project if it doesn't exist
echo "📝 Creating Railway project..."
railway init --name ccna-platform

# Set environment variables
echo "🔑 Setting environment variables..."
railway variables set \
    NODE_ENV=production \
    JWT_SECRET=$(openssl rand -base64 32) \
    LOG_LEVEL=info

# Create PostgreSQL service
echo "🗄️ Creating PostgreSQL database..."
railway add --plugin postgres

# Build and deploy
echo "🐳 Building and deploying..."
railway up

# Get deployment URL
echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your app is being deployed. Check status:"
echo "  railway status"
echo ""
echo "View logs:"
echo "  railway logs"
echo ""
echo "Open app:"
echo "  railway open"
echo ""
echo "📊 Your free $5/month credit covers:"
echo "  - PostgreSQL database"
echo "  - Node.js application"
echo "  - All traffic"
echo ""
echo "🎉 Completely free!"
