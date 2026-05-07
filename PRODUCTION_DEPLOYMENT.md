# 🚀 Production Deployment Guide

This guide covers deploying the CCNA Platform to production using various methods.

---

## 📋 Prerequisites

All deployment methods require:
- [ ] Git repository initialized
- [ ] All code committed
- [ ] Environment variables prepared
- [ ] SSL certificates ready (for HTTPS)
- [ ] Backups configured
- [ ] Monitoring set up

---

## 🐳 Option 1: Docker Compose (Recommended for VPS/Self-Hosted)

**Best for:** Single server deployments, VPS, on-premises

### Step 1: Prepare Environment

```bash
# Copy the example environment file
cp .env.prod.example .env.prod

# Edit with your actual values
nano .env.prod
```

**Required variables:**
- `POSTGRES_PASSWORD` - Strong database password
- `JWT_SECRET` - Random 32+ character string
- `FRONTEND_URL` - Your domain name
- `NEXT_PUBLIC_API_URL` - API endpoint URL

Generate secure secrets:
```bash
# Generate strong passwords
openssl rand -base64 32
```

### Step 2: Prepare SSL Certificates

```bash
# Create certs directory
mkdir -p certs

# Copy your certificate files
cp /path/to/certificate.crt certs/
cp /path/to/private.key certs/
```

Or use Let's Encrypt:
```bash
# Install Certbot
apt-get install certbot

# Generate certificate
certbot certonly --standalone -d ccna.example.com

# Copy to certs directory
cp /etc/letsencrypt/live/ccna.example.com/fullchain.pem certs/certificate.crt
cp /etc/letsencrypt/live/ccna.example.com/privkey.pem certs/private.key
```

### Step 3: Build and Start

```bash
# Make scripts executable
chmod +x scripts/deploy-docker.sh

# Build images
./scripts/deploy-docker.sh build

# Start services
./scripts/deploy-docker.sh start

# Check health
./scripts/deploy-docker.sh health

# View logs
./scripts/deploy-docker.sh logs
```

### Step 4: Verify Deployment

```bash
# Check all containers running
docker-compose -f docker-compose.prod.yml ps

# Test API endpoint
curl https://ccna.example.com/api/v1/health

# Test frontend
curl https://ccna.example.com
```

### Maintenance Commands

```bash
# View logs for specific service
./scripts/deploy-docker.sh logs backend
./scripts/deploy-docker.sh logs frontend
./scripts/deploy-docker.sh logs nginx

# Restart services
./scripts/deploy-docker.sh restart

# Stop services
./scripts/deploy-docker.sh stop

# View full service status
docker-compose -f docker-compose.prod.yml ps
```

---

## ☁️ Option 2: AWS ECS (Recommended for Enterprise/Scalability)

**Best for:** Enterprise, auto-scaling, high availability

### Prerequisites

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
```

### Deployment

```bash
# Make script executable
chmod +x scripts/deploy-aws.sh

# Deploy to staging
./scripts/deploy-aws.sh staging us-east-1

# Deploy to production
./scripts/deploy-aws.sh production us-east-1
```

What this does:
1. Creates ECR repositories
2. Builds and pushes Docker images
3. Creates RDS PostgreSQL database
4. Creates ECS cluster
5. Registers task definitions

### Manual Steps After Script

1. **Create Load Balancer:**
```bash
aws elbv2 create-load-balancer \
    --name ccna-alb \
    --subnets subnet-xxx subnet-yyy \
    --security-groups sg-xxx
```

2. **Create ECS Service:**
   - Use AWS Console or CLI
   - Assign load balancer
   - Set running count to 2+
   - Configure auto-scaling

3. **Set up Route 53 DNS:**
   - Point domain to ALB

4. **Enable CloudWatch Logs:**
   ```bash
   aws logs create-log-group --log-group-name /ecs/ccna-backend
   aws logs create-log-group --log-group-name /ecs/ccna-frontend
   ```

---

## 🪁 Option 3: Fly.io (Recommended for Simplicity/Speed)

**Best for:** Startups, quick deployment, global edge deployment

### Prerequisites

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Authenticate
flyctl auth login
```

### Deployment

```bash
# Make script executable
chmod +x scripts/deploy-flyio.sh

# Deploy
./scripts/deploy-flyio.sh ccna-platform iad
```

What happens automatically:
1. Creates PostgreSQL database
2. Builds Docker images
3. Deploys to Fly.io edge network
4. Assigns SSL certificate (auto with Let's Encrypt)
5. Sets up monitoring

### Post-Deployment

```bash
# View logs
flyctl logs -a ccna-platform

# Check status
flyctl status -a ccna-platform

# Scale to 3 instances
flyctl scale count 3 -a ccna-platform

# View open app
flyctl open -a ccna-platform
```

---

## 🔐 Secrets Management

### Docker Compose
```bash
# Secrets are in .env.prod
# Keep this file secure and never commit to git
chmod 600 .env.prod

# Best practice: Use secret management services
```

### AWS
```bash
# Store in AWS Secrets Manager
aws secretsmanager create-secret \
    --name ccna/prod/database \
    --secret-string '{"username":"admin","password":"xxx"}'

# Reference in task definition
```

### Fly.io
```bash
# Set secrets
flyctl secrets set JWT_SECRET=xxx --app ccna-platform

# View all secrets
flyctl secrets list --app ccna-platform

# Delete secret
flyctl secrets unset JWT_SECRET --app ccna-platform
```

---

## 📊 Monitoring & Logs

### Docker Compose

```bash
# View all logs
./scripts/deploy-docker.sh logs

# Follow backend logs
./scripts/deploy-docker.sh logs backend

# Filter logs (last 100 lines)
docker-compose -f docker-compose.prod.yml logs --tail=100

# Export logs for analysis
docker-compose -f docker-compose.prod.yml logs > logs.txt
```

### AWS CloudWatch

```bash
# View logs
aws logs tail /ecs/ccna-backend --follow

# Advanced query
aws logs start-query \
    --log-group-name /ecs/ccna-backend \
    --start-time $(date -d '1 hour ago' +%s) \
    --end-time $(date +%s) \
    --query-string 'fields @timestamp, @message | stats count() by @message'
```

### Fly.io

```bash
# Real-time logs
flyctl logs -a ccna-platform -f

# Export logs
flyctl logs -a ccna-platform > logs.txt
```

---

## 🔄 Updating Deployment

### Docker Compose

```bash
# Pull latest code
git pull origin main

# Rebuild images
./scripts/deploy-docker.sh build

# Restart with new images
./scripts/deploy-docker.sh restart

# No downtime if you use multiple replicas
```

### AWS ECS

```bash
# Rebuild and push images
docker build -t $ECR_REGISTRY/backend:latest ./backend
docker push $ECR_REGISTRY/backend:latest

# Update service (triggers new deployment)
aws ecs update-service \
    --cluster ccna-prod \
    --service backend \
    --force-new-deployment
```

### Fly.io

```bash
# Git-based auto-deploy
git push origin main  # If webhook configured

# Or manual deploy
flyctl deploy -a ccna-platform
```

---

## 💾 Database Backups

### Automated (Docker Compose)

```bash
# Backups run automatically
# Check backup location
ls -la backups/

# Restore from backup
docker exec ccna-postgres psql -U ccna_user -d ccna_prod < backups/dump_2024_01_15.sql
```

### Manual Backup

```bash
# Docker Compose
docker-compose -f docker-compose.prod.yml exec postgres pg_dump \
    -U ccna_user ccna_prod > backup_$(date +%Y%m%d).sql

# AWS RDS
aws rds create-db-snapshot \
    --db-instance-identifier ccna-postgres-prod \
    --db-snapshot-identifier ccna-backup-$(date +%Y%m%d)

# Fly.io (automatic)
# Backups are automatic, restore via dashboard
```

---

## 🧪 Testing Deployment

```bash
# Health checks
curl https://ccna.example.com/health
curl https://api.ccna.example.com/api/v1/health

# Database connectivity
curl -X GET https://api.ccna.example.com/api/v1/blueprints \
    -H "Authorization: Bearer YOUR_TOKEN"

# Frontend load
curl -I https://ccna.example.com

# Performance test
ab -n 100 -c 10 https://ccna.example.com/
```

---

## 📈 Scaling Strategies

### Docker Compose (Single Server)
- Not suitable for horizontal scaling
- Use for staging or small deployments
- Scale vertically (more CPU/RAM)

### AWS ECS (Recommended for Scale)
```bash
# Enable auto-scaling
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --resource-id service/ccna-prod/backend \
    --scalable-dimension ecs:service:DesiredCount \
    --min-capacity 2 \
    --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
    --policy-name scale-on-cpu \
    --service-namespace ecs \
    --resource-id service/ccna-prod/backend \
    --scalable-dimension ecs:service:DesiredCount \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

### Fly.io (Auto Scaling Available)
```bash
# Scale to 3 instances
flyctl scale count 3 -a ccna-platform

# Check scaling status
flyctl status -a ccna-platform
```

---

## 🚨 Troubleshooting

### Services won't start

```bash
# Check logs
./scripts/deploy-docker.sh logs

# Verify environment variables
cat .env.prod | grep -E "POSTGRES|JWT|DATABASE"

# Rebuild from scratch
./scripts/deploy-docker.sh build
./scripts/deploy-docker.sh start
```

### Database connection errors

```bash
# Verify database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check connection string
docker-compose -f docker-compose.prod.yml exec backend env | grep DATABASE

# Test direct connection
docker-compose -f docker-compose.prod.yml exec postgres psql -c "SELECT version();"
```

### High memory usage

```bash
# Check container memory
docker stats

# Increase Docker memory limit in docker-compose.prod.yml
# Or reduce number of replicas
```

### SSL certificate errors

```bash
# Verify certificate
openssl x509 -in certs/certificate.crt -text -noout

# Check expiration
openssl x509 -in certs/certificate.crt -noout -dates

# Renew before expiration
certbot renew
```

---

## ✅ Production Checklist

- [ ] Environment variables configured securely
- [ ] SSL certificates installed and valid
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Health checks passing
- [ ] Load testing completed
- [ ] Security audit performed
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Logging aggregation configured
- [ ] Disaster recovery plan documented
- [ ] Team trained on deployments

---

## 📞 Support

- Docker issues: https://docs.docker.com/
- AWS issues: https://docs.aws.amazon.com/
- Fly.io issues: https://fly.io/docs/
- Application issues: Check application logs

---

**Last Updated:** 2024
**Next Review:** Quarterly
