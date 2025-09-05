# Docker Setup Guide

## Overview

This project provides comprehensive Docker containerization for both development and production environments. The application consists of:

- **Backend**: .NET 9 Web API with SQLite database
- **Frontend**: React + Vite application served with Nginx
- **Reverse Proxy**: Nginx load balancer (production)
- **Database Backup**: Automated SQLite backup service (production)

## ⚡ Super Quick Start

**Want to run everything immediately? See our [Quick Start Guide](DOCKER_QUICK_START.md) for zero-to-running in 30 seconds!**

**TL;DR:**
```powershell
# Development (Windows)
.\docker-dev.ps1 start

# Production (Windows)  
.\docker-prod.ps1 start

# Unix/Linux/macOS
./docker-dev.sh start
./docker-prod.sh start
```

**That's it!** The scripts handle directory creation, health checks, and provide all service URLs.

📖 **[Complete Quick Start Guide →](DOCKER_QUICK_START.md)**

## Quick Start

### Development Environment

Start the development environment with hot reload:

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Include optional services (database browser)
docker-compose --profile debug up
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Swagger UI: http://localhost:5000/swagger
- Database Browser: http://localhost:8080 (with `--profile debug`)

### Production Environment

Deploy production-optimized containers:

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Include backup service
docker-compose -f docker-compose.prod.yml --profile backup up -d
```

**Access Points:**
- Application: http://localhost
- Backend API: http://localhost:5000
- Reverse Proxy: http://localhost:8080
- Health Checks: http://localhost/health

## Architecture

### Multi-Stage Builds

#### Backend (.NET 9 Web API)
- **Build Stage**: Uses `mcr.microsoft.com/dotnet/sdk:9.0` for compilation and testing
- **Runtime Stage**: Uses `mcr.microsoft.com/dotnet/aspnet:9.0` for minimal production image
- **Security**: Runs as non-root user `appuser`
- **Health Checks**: `/health`, `/health/ready`, `/health/live` endpoints

#### Frontend (React + Vite)
- **Build Stage**: Uses `node:22-alpine` for npm build and Vite compilation
- **Runtime Stage**: Uses `nginx:alpine` for serving static files
- **Security**: Non-root nginx user with minimal permissions
- **Configuration**: Custom nginx.conf with SPA routing and API proxy

### Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| **Hot Reload** | ✅ Volume mounts | ❌ Static builds |
| **Source Maps** | ✅ Full debugging | ❌ Minified builds |
| **Database Browser** | ✅ Optional SQLite web interface | ❌ Not included |
| **Resource Limits** | ❌ Unlimited | ✅ CPU/Memory limits |
| **Backup Service** | ❌ Not needed | ✅ Automated daily backups |
| **Reverse Proxy** | ❌ Direct access | ✅ Nginx load balancer |
| **SSL/TLS** | ❌ HTTP only | ✅ HTTPS ready |

## Configuration

### Environment Variables

#### Development (.env file)
```bash
# Frontend
VITE_API_BASE_URL=http://localhost:5000/api

# Backend
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection=Data Source=/app/data/library.db
CORS__AllowedOrigins=http://localhost:3000
```

#### Production (.env.prod file)
```bash
# Frontend
FRONTEND_URL=https://yourdomain.com

# Backend
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=Data Source=/app/data/library.db
CORS__AllowedOrigins=https://yourdomain.com

# Backup
BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
DATA_DIR=./data
BACKUP_DIR=./backups
```

### Volume Mounts

#### Development
- Source code mounted for hot reload
- Database persisted locally
- Log files accessible on host

#### Production
- Named volumes for data persistence
- Backup volumes for automated backups
- SSL certificate mounting support

## Services

### Backend API
- **Container**: `backend`
- **Port**: 5000 → 8080
- **Health**: `/health` endpoint
- **Database**: SQLite with persistent volume
- **Logs**: Structured JSON logging with Serilog

### Frontend
- **Container**: `frontend`
- **Port**: 3000 (dev) / 80 (prod)
- **Server**: Nginx with custom configuration
- **Routes**: SPA routing with API proxy
- **Static Files**: Optimized caching headers

### Reverse Proxy (Production)
- **Container**: `reverse-proxy`
- **Port**: 8080 → 80
- **Features**: Load balancing, rate limiting, security headers
- **Monitoring**: `/nginx_status` endpoint
- **SSL**: Ready for HTTPS certificates

### Database Backup (Production)
- **Container**: `db-backup`
- **Schedule**: Configurable cron job
- **Retention**: Automatic cleanup of old backups
- **Storage**: Persistent backup volume

## Health Checks

### Backend Health Endpoints
- **`/health`**: Overall application health
- **`/health/ready`**: Database connectivity check
- **`/health/live`**: Basic liveness probe

### Container Health Checks
All containers include Docker health checks:
- **Interval**: 30 seconds
- **Timeout**: 3-10 seconds
- **Retries**: 3 attempts
- **Start Period**: 15-40 seconds

## Monitoring and Logging

### Log Aggregation
- **Backend**: Structured JSON logs with Serilog
- **Frontend/Nginx**: Standard nginx access/error logs
- **Docker**: JSON file logging driver with rotation

### Log Files
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Production logs with tail
docker-compose -f docker-compose.prod.yml logs --tail=100 -f
```

### Monitoring Endpoints
- **Backend Health**: http://localhost:5000/health
- **Nginx Status**: http://localhost:8080/nginx_status (production)
- **Application Health**: http://localhost/health

## Security

### Container Security
- **Non-root users**: All containers run as non-root
- **Read-only filesystems**: Where applicable
- **Resource limits**: CPU and memory constraints (production)
- **Network isolation**: Custom bridge network

### Application Security
- **CORS**: Configured for allowed origins
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **Rate Limiting**: API and general request limits (production)
- **SSL/TLS Ready**: HTTPS configuration available

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000

# Stop conflicting services
docker-compose down
```

#### Volume Permission Issues
```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./data
sudo chown -R $USER:$USER ./logs
```

#### Build Issues
```bash
# Clean build
docker-compose down -v
docker system prune -f
docker-compose build --no-cache
```

#### Database Issues
```bash
# Reset database
docker-compose down
rm -rf ./backend/data/library.db
docker-compose up
```

### Debug Mode

#### Enable Verbose Logging
```bash
# Development
docker-compose up --verbose

# Production
ASPNETCORE_ENVIRONMENT=Development docker-compose -f docker-compose.prod.yml up
```

#### Interactive Container Access
```bash
# Access backend container
docker-compose exec backend /bin/bash

# Access frontend container
docker-compose exec frontend /bin/sh

# Check container status
docker-compose ps
```

## Performance Optimization

### Production Optimizations
- **Multi-stage builds**: Minimal runtime images
- **Gzip compression**: Enabled for all text content
- **Static file caching**: Long-term caching for assets
- **Connection pooling**: HTTP/1.1 keepalive connections
- **Resource limits**: Prevents resource exhaustion

### Development Optimizations
- **Volume caching**: Node modules cached in anonymous volume
- **File watching**: Efficient polling for hot reload
- **Build caching**: Docker layer caching for faster rebuilds

## Deployment

### Local Deployment
```bash
# Development
git clone <repository>
cd library
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment
1. **Configure environment variables** for your domain
2. **Set up SSL certificates** in `./ssl/` directory
3. **Configure backup storage** (S3, Azure Blob, etc.)
4. **Deploy using production compose file**

### CI/CD Integration
```bash
# Build and test
docker-compose build
docker-compose run --rm backend dotnet test
docker-compose run --rm frontend npm test

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## Maintenance

### Regular Tasks
- **Update base images**: Pull latest security updates
- **Monitor disk usage**: Clean up old logs and backups
- **Review security**: Update dependencies and configurations
- **Backup verification**: Test backup restoration process

### Updates
```bash
# Pull latest images
docker-compose pull

# Update application
git pull
docker-compose build
docker-compose up -d
```

This Docker setup provides a production-ready, scalable foundation for the Book Library application with comprehensive development and production environments.