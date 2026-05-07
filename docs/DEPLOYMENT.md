# Deployment Guide

## Overview

This guide covers deploying the CCNA practice exam platform to production on AWS, Azure, GCP, or Fly.io.

## Prerequisites

- Docker installed locally
- Docker Hub account or private registry
- Cloud provider account (AWS, Azure, GCP, or Fly.io)
- PostgreSQL database (RDS, Azure Database, Cloud SQL, or managed service)
- Environment variables configured

## Architecture

```
┌──────────────┐
│   Frontend   │ ← Next.js on Vercel or Docker on ECS
│  (Next.js)   │    Static exports + API calls to backend
└──────────────┘
        ↓ HTTPS
┌──────────────┐
│   Backend    │ ← NestJS on ECS, App Engine, or Fly.io
│  (NestJS)    │    Docker container, auto-scaling
└──────────────┘
        ↓
┌──────────────┐
│ PostgreSQL   │ ← RDS, Cloud SQL, or managed Postgres
│  Database    │    Read replicas for analytics queries
└──────────────┘
```

## Step 1: Prepare Docker Images

### Backend Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

# Runtime stage
FROM node:18-alpine
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

# Use nginx to serve static files
FROM nginx:alpine
COPY --from=builder /app/.next /usr/share/nginx/html/.next
COPY --from=builder /app/public /usr/share/nginx/html/public
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

## Step 2: Build and Push Images

```bash
# Backend
docker build -f backend/Dockerfile -t myregistry/ccna-backend:1.0.0 ./backend
docker push myregistry/ccna-backend:1.0.0

# Frontend
docker build -f frontend/Dockerfile -t myregistry/ccna-frontend:1.0.0 ./frontend
docker push myregistry/ccna-frontend:1.0.0
```

## Step 3: Deploy to AWS ECS

### 1. Create RDS PostgreSQL Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier ccna-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username ccna_admin \
  --master-user-password <generate-strong-password> \
  --allocated-storage 100 \
  --publicly-accessible false \
  --storage-encrypted true \
  --multi-az true
```

### 2. Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name ccna-prod
```

### 3. Register Task Definitions

**Backend Task Definition** (`ecs-backend-task.json`):

```json
{
  "family": "ccna-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "ccna-backend",
      "image": "myregistry/ccna-backend:1.0.0",
      "portMappings": [
        {
          "containerPort": 3001,
          "hostPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://..."
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:..."
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ccna-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 4. Create ECS Service

```bash
aws ecs create-service \
  --cluster ccna-prod \
  --service-name ccna-backend \
  --task-definition ccna-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=DISABLED}"
```

### 5. Set Up Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name ccna-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx
```

## Step 4: Deploy to Vercel (Frontend Only)

Vercel is the easiest for Next.js:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

Configure environment variables in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

## Step 5: Deploy to Fly.io (Alternative)

### Backend on Fly.io

```bash
# Install flyctl
curl https://fly.io/install.sh | sh

# Login
flyctl auth login

# Create app
flyctl apps create ccna-backend

# Deploy
flyctl deploy --dockerfile Dockerfile

# Set secrets
flyctl secrets set JWT_SECRET=xxx DATABASE_URL=postgresql://...

# Scale
flyctl scale count 3
```

### Frontend on Fly.io

```bash
flyctl apps create ccna-frontend
flyctl deploy
```

## Step 6: Database Migrations

### Run Migrations on Startup

Add to backend startup script:

```bash
# In backend/Dockerfile or Procfile
npm run db:migrate

node dist/main.js
```

Or manually:

```bash
npx prisma migrate deploy --skip-generate
```

## Step 7: Configure DNS and HTTPS

1. Point your domain to your load balancer (AWS ALB, Fly.io, Vercel)
2. Set up SSL/TLS:
   - AWS: Use ACM certificate
   - Fly.io: Auto-configured
   - Vercel: Auto-configured

## Step 8: Monitoring and Logging

### CloudWatch (AWS)

```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/ccna

# View logs
aws logs tail /ecs/ccna-backend --follow
```

### Datadog / New Relic

Add to backend:
```bash
npm install @newrelic/nodejs
```

Configure in main.ts:
```typescript
require('newrelic');
```

## Step 9: Backups and Disaster Recovery

1. **Database Backups**: Enable automated backups on RDS (7-day retention)
2. **Point-in-time Recovery**: RDS supports PITR
3. **Secrets Management**: Use AWS Secrets Manager for credentials
4. **Multi-region**: Consider deploying to multiple regions for HA

## Step 10: Cost Optimization

- Use Fargate Spot Instances (70% cheaper)
- Use RDS reserved instances
- Enable auto-scaling based on CPU/memory
- Use CloudFront CDN for frontend assets

## Monitoring Checklist

- [ ] Error rate < 1% on all endpoints
- [ ] P95 latency < 500ms
- [ ] Database connections stable
- [ ] JWT secret rotation quarterly
- [ ] Database backups verified monthly
- [ ] Security patches applied within 48 hours
- [ ] WAF rules updated monthly

## Troubleshooting

### Task won't start
```bash
aws ecs describe-tasks --cluster ccna-prod --tasks <task-arn>
```

### Database connection refused
- Check security group allows traffic from ECS security group
- Verify DATABASE_URL in environment

### High latency
- Check RDS CPU/connections
- Review CloudWatch metrics
- Consider read replicas for analytics queries

## Scaling Strategy

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU | > 70% | Scale up +1 task |
| Memory | > 80% | Increase task memory |
| RDS CPU | > 75% | Add read replica |
| Request latency | > 1s | Scale horizontally |

