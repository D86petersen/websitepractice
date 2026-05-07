#!/bin/bash
# Deploy to Render FREE
# Render offers free tier with PostgreSQL
# Note: May be slower but completely free
# Usage: ./deploy-render.sh

set -e

echo "🚀 Deploying CCNA Platform to Render (FREE)"
echo "==========================================="
echo ""
echo "Render's free tier includes:"
echo "  - Web service (stops after 15 min inactivity, restarts on request)"
echo "  - PostgreSQL database"
echo "  - Free SSL certificates"
echo ""
echo "To deploy manually:"
echo ""
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Configure:"
echo "   - Name: ccna-platform"
echo "   - Runtime: Node"
echo "   - Build: npm install && npm run build"
echo "   - Start: npm start"
echo "5. Add environment variables:"
echo "   - NODE_ENV=production"
echo "   - JWT_SECRET=$(openssl rand -base64 32)"
echo "6. Create PostgreSQL database"
echo ""
echo "Or use render.yaml for infrastructure as code:"
echo ""

cat > render.yaml << 'EOF'
services:
  - type: web
    name: ccna-platform
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        scope: build,runtime
      - key: DATABASE_URL
        scope: build,runtime
        fromDatabase:
          name: ccna-postgres
          property: connectionString

databases:
  - name: ccna-postgres
    plan: free
EOF

echo "✅ render.yaml created"
echo ""
echo "Deploy with:"
echo "  1. Push to GitHub"
echo "  2. Go to https://dashboard.render.com"
echo "  3. Connect repository"
echo "  4. Select render.yaml"
echo "  5. Deploy!"
echo ""
echo "📊 Completely FREE with:"
echo "  ✓ Node.js app (shared resources)"
echo "  ✓ PostgreSQL database (100MB limit, free tier)"
echo "  ✓ 750 compute hours/month (enough for small app)"
echo "  ✓ 5GB bandwidth/month"
echo ""
echo "⚠️  Limitations of free tier:"
echo "  - App spins down after 15 minutes of inactivity"
echo "  - Slower performance"
echo "  - 100MB database limit (not enough for lots of questions)"
echo ""
echo "📈 Upgrade to Pro ($7/month) to remove these limitations"
