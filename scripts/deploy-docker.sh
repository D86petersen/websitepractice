#!/bin/bash
# Production deployment using Docker Compose locally or on a server
# Usage: ./deploy-docker.sh [command]

set -e

COMMANDS="start|stop|restart|logs|build|health"

if [ $# -eq 0 ]; then
    echo "Usage: $0 [$COMMANDS]"
    echo ""
    echo "Commands:"
    echo "  start   - Start all services"
    echo "  stop    - Stop all services"
    echo "  restart - Restart all services"
    echo "  logs    - View logs"
    echo "  build   - Build all images"
    echo "  health  - Check health of services"
    exit 1
fi

COMMAND=$1
COMPOSE_FILE="docker-compose.prod.yml"

# Verify environment file exists
if [ ! -f ".env.prod" ]; then
    echo "❌ .env.prod file not found!"
    echo ""
    echo "Please create .env.prod with the following variables:"
    echo "  POSTGRES_DB=ccna_prod"
    echo "  POSTGRES_USER=ccna_user"
    echo "  POSTGRES_PASSWORD=random_secure_password"
    echo "  JWT_SECRET=random_jwt_secret"
    echo "  FRONTEND_URL=https://ccna.example.com"
    echo "  NEXT_PUBLIC_API_URL=https://api.ccna.example.com/api/v1"
    exit 1
fi

case $COMMAND in
    build)
        echo "🐳 Building Docker images..."
        docker-compose -f "$COMPOSE_FILE" build --no-cache
        echo "✅ Build complete!"
        ;;
    start)
        echo "🚀 Starting services..."
        docker-compose -f "$COMPOSE_FILE" up -d
        echo "⏳ Waiting for services to be healthy..."
        sleep 5
        
        # Check health
        for service in postgres redis backend frontend nginx; do
            if docker-compose -f "$COMPOSE_FILE" ps | grep -q "$service"; then
                echo "✓ $service running"
            else
                echo "✗ $service failed to start"
            fi
        done
        
        echo "✅ All services started!"
        echo ""
        echo "Services available at:"
        echo "  Frontend: http://localhost:80"
        echo "  API: http://localhost:3001/api/v1"
        echo "  Health: http://localhost:80/health"
        ;;
    stop)
        echo "🛑 Stopping services..."
        docker-compose -f "$COMPOSE_FILE" down
        echo "✅ Services stopped!"
        ;;
    restart)
        echo "🔄 Restarting services..."
        docker-compose -f "$COMPOSE_FILE" restart
        echo "⏳ Waiting for services..."
        sleep 3
        echo "✅ Services restarted!"
        ;;
    logs)
        SERVICE=${2:-""}
        if [ -z "$SERVICE" ]; then
            docker-compose -f "$COMPOSE_FILE" logs -f
        else
            docker-compose -f "$COMPOSE_FILE" logs -f "$SERVICE"
        fi
        ;;
    health)
        echo "🏥 Checking service health..."
        echo ""
        
        echo "Checking database..."
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U $(grep POSTGRES_USER .env.prod | cut -d '=' -f 2)
        
        echo "Checking Redis..."
        docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping
        
        echo "Checking backend..."
        docker-compose -f "$COMPOSE_FILE" exec -T backend curl -s http://localhost:3001/health | jq .
        
        echo "Checking frontend..."
        docker-compose -f "$COMPOSE_FILE" exec -T frontend curl -s http://localhost:3000 | head -20
        
        echo ""
        echo "✅ Health check complete!"
        ;;
    *)
        echo "Unknown command: $COMMAND"
        echo "Valid commands: $COMMANDS"
        exit 1
        ;;
esac
