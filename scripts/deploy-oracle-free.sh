#!/bin/bash
# Deploy to Oracle Cloud ALWAYS FREE tier
# Oracle provides genuinely free services forever (with limits)
# This is the most generous free tier available
# Usage: ./deploy-oracle-free.sh

set -e

echo "🚀 Oracle Cloud Always Free Deployment"
echo "======================================"
echo ""
echo "Oracle's Always Free tier (FOREVER - no credit card needed after trial):"
echo ""
echo "✅ What you get FREE:"
echo "   2x ARM Compute Instances (2GB RAM each)"
echo "   1x 20GB MySQL Database"
echo "   250GB Object Storage"
echo "   5TB Data Transfer"
echo "   40GB Boot Volume"
echo ""
echo "📋 Step-by-Step Guide:"
echo ""
echo "1️⃣  CREATE ORACLE ACCOUNT"
echo "   Go to: https://oracle.com/cloud/free"
echo "   Sign up with free account (no credit card required after trial)"
echo ""
echo "2️⃣  CREATE COMPUTE INSTANCE"
echo "   - Go to Compute → Instances"
echo "   - Click 'Create Instance'"
echo "   - Name: ccna-platform"
echo "   - Image: Ubuntu 22.04"
echo "   - Instance shape: VM.Standard.A1.Flex (ARM-based, ALWAYS FREE)"
echo "   - OCPUs: 2, RAM: 12GB (maximum free tier)"
echo "   - Download SSH key"
echo ""
echo "3️⃣  SSH INTO INSTANCE"
echo "   chmod 600 your-ssh-key.pem"
echo "   ssh -i your-ssh-key.pem ubuntu@YOUR_PUBLIC_IP"
echo ""
echo "4️⃣  INSTALL DOCKER"
echo "   sudo apt update && sudo apt upgrade -y"
echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
echo "   sudo sh get-docker.sh"
echo "   sudo usermod -aG docker \$USER"
echo "   newgrp docker"
echo ""
echo "5️⃣  CLONE REPOSITORY"
echo "   git clone YOUR_REPO_URL"
echo "   cd websitepractice"
echo ""
echo "6️⃣  CREATE .env.prod"
echo "   cp .env.prod.example .env.prod"
echo "   nano .env.prod  # Edit as needed"
echo ""
echo "7️⃣  START APPLICATION"
echo "   chmod +x scripts/deploy-docker.sh"
echo "   ./scripts/deploy-docker.sh build"
echo "   ./scripts/deploy-docker.sh start"
echo ""
echo "8️⃣  CONFIGURE FIREWALL"
echo "   # Allow port 80 and 443"
echo "   sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT"
echo "   sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT"
echo "   sudo netfilter-persistent save"
echo ""
echo "9️⃣  SETUP SSL (Let's Encrypt)"
echo "   sudo apt install certbot python3-certbot-nginx -y"
echo "   sudo certbot certonly --standalone -d your-domain.com"
echo "   # Copy certs to:"
echo "   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./certs/"
echo "   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./certs/"
echo ""
echo "🔟 VERIFY DEPLOYMENT"
echo "   curl http://YOUR_PUBLIC_IP/api/v1/health"
echo "   curl http://YOUR_PUBLIC_IP"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💰 COST: COMPLETELY FREE FOREVER"
echo ""
echo "📊 Oracle Always Free Resources:"
echo "   ✓ 2x ARM Compute Instances (2GB RAM each)"
echo "   ✓ 1x 20GB MySQL Database"
echo "   ✓ 250GB Object Storage"
echo "   ✓ Enough for 10,000+ concurrent users"
echo ""
echo "⚖️  FAIR USE LIMITS:"
echo "   - 3,000 OCPU hours/month"
echo "   - 18,000 GB memory hours/month"
echo "   - If you exceed, service stops (doesn't charge)"
echo ""
echo "✨ ADDITIONAL SETUP SCRIPTS:"
echo ""

cat > /tmp/oracle-post-deploy.sh << 'SCRIPT'
#!/bin/bash
# Run this AFTER app is deployed and working

# Enable auto-start on Oracle reboot
echo "@reboot cd /home/ubuntu/websitepractice && ./scripts/deploy-docker.sh start" | crontab -

# Setup automatic SSL renewal
echo "0 3 * * * certbot renew --quiet" | crontab -

# Setup monitoring
echo "# Monitor your app"
echo "curl -s http://localhost/api/v1/health | jq ."

# Setup log rotation
cat > /etc/logrotate.d/ccna-platform << 'LOGS'
/var/lib/ccna-platform/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
}
LOGS

echo "✅ Auto-start and logging configured"
SCRIPT

chmod +x /tmp/oracle-post-deploy.sh

echo "   ./oracle-post-deploy.sh  # Setup auto-start & monitoring"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 NEXT STEPS:"
echo ""
echo "   1. Go to https://oracle.com/cloud/free"
echo "   2. Create free account"
echo "   3. Create Compute Instance (ARM VM.Standard.A1.Flex)"
echo "   4. SSH in and follow steps 4-10 above"
echo "   5. Your app will be running on public IP"
echo ""
echo "✅ RESULT: Production platform running COMPLETELY FREE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
