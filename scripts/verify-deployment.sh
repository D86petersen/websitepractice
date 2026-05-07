#!/bin/bash
# Pre-deployment verification script
# Runs through all checks before deployment

set -e

echo "🔍 CCNA Platform - Pre-Deployment Verification"
echo "=============================================="
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. File structure checks
echo "📁 Checking project structure..."
[ -d "backend" ] && check_pass "Backend directory exists" || check_fail "Backend directory missing"
[ -d "frontend" ] && check_pass "Frontend directory exists" || check_fail "Frontend directory missing"
[ -d "docs" ] && check_pass "Docs directory exists" || check_fail "Docs directory missing"
[ -f "docker-compose.prod.yml" ] && check_pass "Production docker-compose exists" || check_fail "Production docker-compose missing"
[ -f ".env.prod.example" ] && check_pass ".env.prod.example exists" || check_fail ".env.prod.example missing"
echo ""

# 2. Code quality checks
echo "🔬 Checking code quality..."
if [ -f "backend/package.json" ]; then
    check_pass "Backend package.json exists"
else
    check_fail "Backend package.json missing"
fi

if [ -f "frontend/package.json" ]; then
    check_pass "Frontend package.json exists"
else
    check_fail "Frontend package.json missing"
fi
echo ""

# 3. Configuration checks
echo "⚙️  Checking configurations..."
[ -f "backend/.env.example" ] && check_pass "Backend .env.example exists" || check_fail "Backend .env.example missing"
[ -f "frontend/.env.production" ] && check_pass "Frontend .env.production exists" || check_fail "Frontend .env.production missing"
[ -f "backend/prisma/schema.prisma" ] && check_pass "Prisma schema exists" || check_fail "Prisma schema missing"
[ -f "backend/Dockerfile" ] && check_pass "Backend Dockerfile exists" || check_fail "Backend Dockerfile missing"
[ -f "frontend/Dockerfile" ] && check_pass "Frontend Dockerfile exists" || check_fail "Frontend Dockerfile missing"
[ -f "nginx/nginx.conf" ] && check_pass "Nginx config exists" || check_fail "Nginx config missing"
echo ""

# 4. Documentation checks
echo "📚 Checking documentation..."
[ -f "README.md" ] && check_pass "README exists" || check_fail "README missing"
[ -f "ARCHITECTURE.md" ] && check_pass "ARCHITECTURE.md exists" || check_fail "ARCHITECTURE.md missing"
[ -f "PRODUCTION_DEPLOYMENT.md" ] && check_pass "PRODUCTION_DEPLOYMENT.md exists" || check_fail "PRODUCTION_DEPLOYMENT.md missing"
[ -f "docs/API.md" ] && check_pass "API.md exists" || check_fail "API.md missing"
echo ""

# 5. Deployment scripts
echo "🚀 Checking deployment scripts..."
[ -f "scripts/deploy-docker.sh" ] && check_pass "Docker deployment script exists" || check_fail "Docker deployment script missing"
[ -f "scripts/deploy-aws.sh" ] && check_pass "AWS deployment script exists" || check_fail "AWS deployment script missing"
[ -f "scripts/deploy-flyio.sh" ] && check_pass "Fly.io deployment script exists" || check_fail "Fly.io deployment script missing"
echo ""

# 6. Environment setup
echo "🔑 Checking environment setup..."
if [ -f ".env.prod" ]; then
    check_pass ".env.prod exists"
    # Check if important variables are set
    if grep -q "POSTGRES_PASSWORD=" .env.prod && grep -q "JWT_SECRET=" .env.prod; then
        check_pass "Critical secrets appear to be configured"
    else
        check_warn "Some critical secrets may not be configured"
    fi
else
    check_warn ".env.prod not found (use .env.prod.example as template)"
fi
echo ""

# 7. Docker checks
echo "🐳 Checking Docker installation..."
if command -v docker &> /dev/null; then
    check_pass "Docker is installed: $(docker --version)"
else
    check_fail "Docker is not installed"
fi

if command -v docker-compose &> /dev/null; then
    check_pass "Docker Compose is installed: $(docker-compose --version)"
else
    check_fail "Docker Compose is not installed"
fi
echo ""

# 8. Git checks
echo "📦 Checking Git..."
if [ -d ".git" ]; then
    check_pass "Git repository initialized"
    if [ -f ".gitignore" ]; then
        check_pass ".gitignore file exists"
    else
        check_warn ".gitignore file missing (recommended for security)"
    fi
else
    check_warn "Git repository not initialized"
fi
echo ""

# 9. Security checks
echo "🔒 Checking security..."
if [ -f ".env.prod" ]; then
    if grep -q "change-this\|change-me\|xxx\|yyy" .env.prod; then
        check_warn ".env.prod contains placeholder values (SECURITY RISK)"
    else
        check_pass ".env.prod values appear configured"
    fi
else
    check_warn ".env.prod not found"
fi

if [ -d "certs" ]; then
    if [ -f "certs/certificate.crt" ] && [ -f "certs/private.key" ]; then
        check_pass "SSL certificates exist"
    else
        check_warn "SSL certificates directory exists but missing cert or key"
    fi
else
    check_warn "SSL certificates directory not found (needed for HTTPS)"
fi
echo ""

# 10. Optional tools
echo "🛠️  Checking optional tools..."
if command -v git &> /dev/null; then
    check_pass "Git installed"
else
    check_warn "Git not installed"
fi

if command -v flyctl &> /dev/null; then
    check_pass "Fly.io CLI installed"
else
    check_warn "Fly.io CLI not installed (for Fly.io deployment)"
fi

if command -v aws &> /dev/null; then
    check_pass "AWS CLI installed"
else
    check_warn "AWS CLI not installed (for AWS deployment)"
fi
echo ""

# Final summary
echo "=============================================="
echo "Verification Summary"
echo "✓ Passed: $CHECKS_PASSED"
echo "✗ Failed: $CHECKS_FAILED"
echo "=============================================="
echo ""

if [ $CHECKS_FAILED -gt 0 ]; then
    echo -e "${RED}⚠️  Some checks failed. Please address them before deploying.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All critical checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review and customize .env.prod"
    echo "2. Check .gitignore to ensure secrets aren't committed"
    echo "3. Choose deployment method:"
    echo "   - Docker Compose: ./scripts/deploy-docker.sh build"
    echo "   - Fly.io: ./scripts/deploy-flyio.sh"
    echo "   - AWS: ./scripts/deploy-aws.sh"
    exit 0
fi
