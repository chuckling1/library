#!/bin/bash
# Development Docker management script for Library application (Unix/Linux/macOS)

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
    directories=("backend/data" "backend/logs" "data" "backups" "ssl")
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
    print_color "📊 Container Status:" "$YELLOW"
    docker-compose ps
    
    print_color "\n🔗 Service URLs:" "$YELLOW"
    print_color "  Frontend: http://localhost:3000" "$GREEN"
    print_color "  Backend API: http://localhost:5000" "$GREEN"
    print_color "  Swagger UI: http://localhost:5000/swagger" "$GREEN"
    print_color "  Database Browser: http://localhost:8080 (debug profile only)" "$GREEN"
}

show_help() {
    print_color "🚀 Library Docker Development Manager" "$YELLOW"
    echo ""
    echo "Usage: ./docker-dev.sh <command> [service]"
    echo ""
    echo "Commands:"
    echo "  start   - Start all development containers"
    echo "  debug   - Start with database browser"
    echo "  stop    - Stop all containers"
    echo "  restart - Restart all containers"
    echo "  logs    - Show logs (optionally for specific service)"
    echo "  status  - Show container status and URLs"
    echo "  build   - Rebuild all containers"
    echo "  clean   - Clean up containers and volumes"
    echo "  help    - Show this help message"
}

print_color "🚀 Library Docker Development Manager" "$YELLOW"

test_docker

case $COMMAND in
    "start")
        print_color "🏗️ Starting development environment..." "$YELLOW"
        ensure_directories
        cp .env.development .env
        docker-compose up -d
        print_color "\n⏳ Waiting for services to be healthy..." "$YELLOW"
        sleep 10
        show_status
        ;;
    "debug")
        print_color "🐛 Starting development environment with debug services..." "$YELLOW"
        ensure_directories
        cp .env.development .env
        docker-compose --profile debug up -d
        print_color "\n⏳ Waiting for services to be healthy..." "$YELLOW"
        sleep 10
        show_status
        print_color "\n🔍 Debug services enabled - Database browser available at http://localhost:8080" "$GREEN"
        ;;
    "stop")
        print_color "🛑 Stopping all containers..." "$YELLOW"
        docker-compose down
        print_color "✅ All containers stopped." "$GREEN"
        ;;
    "restart")
        print_color "🔄 Restarting development environment..." "$YELLOW"
        docker-compose down
        sleep 2
        docker-compose up -d
        sleep 10
        show_status
        ;;
    "logs")
        if [[ -n "$SERVICE" ]]; then
            print_color "📋 Showing logs for $SERVICE..." "$YELLOW"
            docker-compose logs -f "$SERVICE"
        else
            print_color "📋 Showing logs for all services..." "$YELLOW"
            docker-compose logs -f
        fi
        ;;
    "status")
        show_status
        ;;
    "build")
        print_color "🔨 Rebuilding all containers..." "$YELLOW"
        docker-compose build --no-cache
        print_color "✅ Build complete." "$GREEN"
        ;;
    "clean")
        print_color "🧹 Cleaning up containers and volumes..." "$YELLOW"
        docker-compose down -v
        docker system prune -f
        print_color "✅ Cleanup complete." "$GREEN"
        ;;
    "help"|*)
        show_help
        exit 0
        ;;
esac

print_color "\n🎉 Operation complete!" "$GREEN"