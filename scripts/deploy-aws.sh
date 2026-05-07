#!/bin/bash
# Deploy to AWS ECS with CloudFormation
# Usage: ./deploy-aws.sh [environment] [region]

set -e

ENVIRONMENT=${1:-staging}
AWS_REGION=${2:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_NAME="ccna-platform"

echo "🚀 Deploying CCNA Platform to AWS ECS"
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"
echo "ECR Registry: $ECR_REGISTRY"

# 1. Create ECR repositories if they don't exist
echo "📦 Creating ECR repositories..."
for service in backend frontend nginx; do
    REPO_NAME="${IMAGE_NAME}-${service}"
    if aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$AWS_REGION" 2>/dev/null; then
        echo "✓ Repository $REPO_NAME already exists"
    else
        echo "Creating repository $REPO_NAME..."
        aws ecr create-repository \
            --repository-name "$REPO_NAME" \
            --region "$AWS_REGION" \
            --image-scan-on-push \
            --encryption-configuration encryptionType=AES
    fi
done

# 2. Build and push Docker images
echo "🐳 Building Docker images..."

# Login to ECR
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

# Build backend
echo "Building backend image..."
docker build -t "${ECR_REGISTRY}/${IMAGE_NAME}-backend:latest" -t "${ECR_REGISTRY}/${IMAGE_NAME}-backend:${ENVIRONMENT}" ./backend
docker push "${ECR_REGISTRY}/${IMAGE_NAME}-backend:latest"
docker push "${ECR_REGISTRY}/${IMAGE_NAME}-backend:${ENVIRONMENT}"

# Build frontend
echo "Building frontend image..."
docker build -t "${ECR_REGISTRY}/${IMAGE_NAME}-frontend:latest" -t "${ECR_REGISTRY}/${IMAGE_NAME}-frontend:${ENVIRONMENT}" ./frontend
docker push "${ECR_REGISTRY}/${IMAGE_NAME}-frontend:latest"
docker push "${ECR_REGISTRY}/${IMAGE_NAME}-frontend:${ENVIRONMENT}"

# 3. Create RDS database if it doesn't exist
echo "🗄️ Setting up RDS..."
RDS_INSTANCE_ID="ccna-postgres-${ENVIRONMENT}"

# Check if RDS instance exists
if aws rds describe-db-instances --db-instance-identifier "$RDS_INSTANCE_ID" --region "$AWS_REGION" 2>/dev/null; then
    echo "✓ RDS instance $RDS_INSTANCE_ID already exists"
else
    echo "Creating RDS instance $RDS_INSTANCE_ID..."
    aws rds create-db-instance \
        --db-instance-identifier "$RDS_INSTANCE_ID" \
        --db-instance-class db.t3.micro \
        --engine postgres \
        --master-username admin \
        --master-user-password "$(openssl rand -base64 32)" \
        --allocated-storage 20 \
        --storage-type gp2 \
        --publicly-accessible false \
        --backup-retention-period 30 \
        --multi-az false \
        --region "$AWS_REGION"
    
    echo "⏳ Waiting for RDS to be available..."
    aws rds wait db-instance-available \
        --db-instance-identifier "$RDS_INSTANCE_ID" \
        --region "$AWS_REGION"
fi

# 4. Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "$RDS_INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo "📍 RDS Endpoint: $RDS_ENDPOINT"

# 5. Create ECS cluster if it doesn't exist
echo "🎯 Setting up ECS..."
CLUSTER_NAME="ccna-${ENVIRONMENT}"

if aws ecs describe-clusters --clusters "$CLUSTER_NAME" --region "$AWS_REGION" | grep -q "\"clusterName\": \"$CLUSTER_NAME\""; then
    echo "✓ ECS cluster $CLUSTER_NAME already exists"
else
    echo "Creating ECS cluster $CLUSTER_NAME..."
    aws ecs create-cluster \
        --cluster-name "$CLUSTER_NAME" \
        --region "$AWS_REGION" \
        --cluster-settings name=containerInsights,value=enabled
fi

# 6. Create task definitions
echo "📋 Creating task definitions..."

# Create backend task definition
aws ecs register-task-definition \
    --family "${IMAGE_NAME}-backend" \
    --network-mode awsvpc \
    --requires-compatibilities FARGATE \
    --cpu 256 \
    --memory 512 \
    --container-definitions "[
        {
            \"name\": \"backend\",
            \"image\": \"${ECR_REGISTRY}/${IMAGE_NAME}-backend:${ENVIRONMENT}\",
            \"portMappings\": [{\"containerPort\": 3001}],
            \"environment\": [
                {\"name\": \"NODE_ENV\", \"value\": \"production\"},
                {\"name\": \"DATABASE_HOST\", \"value\": \"$RDS_ENDPOINT\"}
            ],
            \"logConfiguration\": {
                \"logDriver\": \"awslogs\",
                \"options\": {
                    \"awslogs-group\": \"/ecs/ccna-backend\",
                    \"awslogs-region\": \"$AWS_REGION\",
                    \"awslogs-stream-prefix\": \"ecs\"
                }
            }
        }
    ]" \
    --region "$AWS_REGION"

echo "✅ AWS ECS Deployment Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Update security groups and VPC settings"
echo "2. Configure load balancer"
echo "3. Create service in ECS cluster"
echo "4. Set up auto-scaling policies"
echo "5. Configure CloudWatch monitoring"
