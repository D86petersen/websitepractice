#!/bin/bash
# Deploy to Fly.io
# Usage: ./deploy-flyio.sh
# Prerequisites: flyctl CLI installed and authenticated

set -e

APP_NAME=${1:-ccna-platform}
REGION=${2:-iad} # IAD = Washington DC

echo "🚀 Deploying CCNA Platform to Fly.io"
echo "App Name: $APP_NAME"
echo "Region: $REGION"

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Please install it first:"
    echo "   https://fly.io/docs/getting-started/installing-flyctl/"
    exit 1
fi

# Create Fly.io configuration if it doesn't exist
if [ ! -f "fly.toml" ]; then
    echo "📝 Creating fly.toml..."
    flyctl launch --name "$APP_NAME" --region "$REGION" --no-deploy
fi

# 1. Create PostgreSQL database cluster
echo "🗄️ Setting up PostgreSQL..."
DB_APP_NAME="${APP_NAME}-db"

if flyctl apps list | grep -q "$DB_APP_NAME"; then
    echo "✓ PostgreSQL app already exists"
else
    echo "Creating PostgreSQL cluster..."
    flyctl postgres create \
        --app "$DB_APP_NAME" \
        --region "$REGION" \
        --vm-size shared-cpu-1x \
        --initial-cluster-size 1
fi

# Get database URL
DB_URL=$(flyctl postgres attach "$DB_APP_NAME" --app "$APP_NAME" 2>/dev/null || echo "")

if [ -z "$DB_URL" ]; then
    echo "⚠️  Could not get database URL. You may need to manually attach the database."
fi

# 2. Set secrets
echo "🔐 Setting secrets..."

# Generate JWT secret if not set
JWT_SECRET=$(openssl rand -base64 32)

flyctl secrets set \
    JWT_SECRET="$JWT_SECRET" \
    NODE_ENV=production \
    LOG_LEVEL=info \
    --app "$APP_NAME"

echo "✓ Secrets set"

# 3. Build and deploy
echo "🐳 Building and deploying..."
flyctl deploy --app "$APP_NAME" --remote-only

echo "✅ Fly.io Deployment Complete!"
echo ""
echo "Information:"
echo "App URL: https://${APP_NAME}.fly.dev"
echo ""
echo "Next steps:"
echo "1. flyctl open --app $APP_NAME         # Open the app"
echo "2. flyctl logs --app $APP_NAME -f      # View logs"
echo "3. flyctl status --app $APP_NAME       # Check status"
echo ""
echo "To scale:"
echo "  flyctl scale count 3 --app $APP_NAME"
echo ""
echo "To view secrets:"
echo "  flyctl secrets list --app $APP_NAME"
