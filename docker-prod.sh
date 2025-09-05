#!/bin/bash
# Production Docker management script for Library application (Unix/Linux/macOS)

set -e

COMMAND=${1:-"help"}
SERVICE=${2:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_color() {
    echo -e "${2}${1}${NC}"
}

ensure_directories() {
    print_color "🔧 Creating required directories..." "$YELLOW"
    directories=("data" "backups" "ssl" "logs")
    for dir in "${directories[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            print_color "  ✅ Created: $dir" "$GREEN"
        fi
    done
}

test_docker() {
    if ! docker version >/dev/null 2>&1; then
        print_color "❌ Docker is not running. Please start Docker." "$RED"
        exit 1
    fi
    return 0
}

show_status() {
    print_color "📊 Production Container Status:" "$YELLOW"
    docker-compose -f docker-compose.prod.yml ps
    
    print_color "\n🔗 Production Service URLs:" "$YELLOW"
    print_color "  Application: http://localhost" "$GREEN"
    print_color "  Backend API: http://localhost:5000" "$GREEN"
    print_color "  Reverse Proxy: http://localhost:8080" "$GREEN"
    print_color "  Health Check: http://localhost/health" "$GREEN"
    print_color "  Nginx Status: http://localhost:8080/nginx_status" "$GREEN"
}

check_ssl() {
    if [[ ! -f "ssl/cert.pem" ]] || [[ ! -f "ssl/key.pem" ]]; then
        print_color "⚠️  SSL certificates not found in ssl/ directory." "$YELLOW"
        print_color "   HTTPS will not be available. HTTP will work on port 80." "$YELLOW"
        print_color "   To enable HTTPS, place cert.pem and key.pem in ssl/ directory." "$YELLOW"
    else
        print_color "🔒 SSL certificates found - HTTPS ready." "$GREEN"
    fi
}

show_help() {
    print_color "🚀 Library Production Docker Manager" "$YELLOW"
    echo ""
    echo "Usage: ./docker-prod.sh <command> [service]"
    echo ""
    echo "Commands:"
    echo "  start   - Start all production containers"
    echo "  backup  - Start with backup service"
    echo "  stop    - Stop all containers"
    echo "  restart - Restart all containers"
    echo "  logs    - Show logs (optionally for specific service)"
    echo "  status  - Show container status and resource usage"
    echo "  build   - Rebuild all containers"
    echo "  clean   - Clean up containers and volumes"
    echo "  help    - Show this help message"
}

print_color "🚀 Library Production Docker Manager" "$YELLOW"

test_docker

case $COMMAND in
    "start")
        print_color "🏗️ Starting production environment..." "$YELLOW"
        ensure_directories
        check_ssl
        cp .env.production .env
        docker-compose -f docker-compose.prod.yml up -d
        print_color "\n⏳ Waiting for services to be healthy..." "$YELLOW"
        sleep 15
        show_status
        ;;
    "backup")
        print_color "🏗️ Starting production environment with backup service..." "$YELLOW"
        ensure_directories
        check_ssl
        cp .env.production .env
        docker-compose -f docker-compose.prod.yml --profile backup up -d
        print_color "\n⏳ Waiting for services to be healthy..." "$YELLOW"
        sleep 15
        show_status
        print_color "\n💾 Database backup service enabled - Daily backups at 2 AM" "$GREEN"
        ;;
    "stop")
        print_color "🛑 Stopping all production containers..." "$YELLOW"
        docker-compose -f docker-compose.prod.yml down
        print_color "✅ All production containers stopped." "$GREEN"
        ;;
    "restart")
        print_color "🔄 Restarting production environment..." "$YELLOW"
        docker-compose -f docker-compose.prod.yml down
        sleep 3
        docker-compose -f docker-compose.prod.yml up -d
        sleep 15
        show_status
        ;;
    "logs")
        if [[ -n "$SERVICE" ]]; then
            print_color "📋 Showing production logs for $SERVICE..." "$YELLOW"
            docker-compose -f docker-compose.prod.yml logs -f "$SERVICE"
        else
            print_color "📋 Showing logs for all production services..." "$YELLOW"
            docker-compose -f docker-compose.prod.yml logs -f
        fi
        ;;
    "status")
        show_status
        print_color "\n📈 Resource Usage:" "$YELLOW"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
        ;;
    "build")
        print_color "🔨 Rebuilding all production containers..." "$YELLOW"
        docker-compose -f docker-compose.prod.yml build --no-cache
        print_color "✅ Production build complete." "$GREEN"
        ;;
    "clean")
        print_color "🧹 Cleaning up production containers and volumes..." "$YELLOW"
        docker-compose -f docker-compose.prod.yml down -v
        docker system prune -f
        print_color "✅ Production cleanup complete." "$GREEN"
        ;;
    "help"|*)
        show_help
        exit 0
        ;;
esac

print_color "\n🎉 Production operation complete!" "$GREEN"