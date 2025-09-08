# Deployment Guide

## Overview

This guide covers deployment options for the Book Library application, from local development to production environments using both traditional methods and Docker containerization.

## Prerequisites

### System Requirements
- **Development**: Node.js 22+ LTS, .NET 9+ SDK
- **Production**: Docker 24+ (recommended) or system dependencies above
- **Database**: SQLite (no additional setup required)
- **Memory**: Minimum 2GB RAM, recommended 4GB+
- **Disk**: Minimum 1GB free space for application and database

### Network Requirements
- **HTTP**: Port 80 (production) or custom ports
- **HTTPS**: Port 443 (production with SSL)
- **API**: Port 5000 (development) or 8080 (Docker)
- **Frontend**: Port 3000 (development) or served via reverse proxy

## Quick Start Deployments

### Development (Fastest)

```bash
# Clone and setup
git clone <repository-url>
cd library
npm run setup    # Complete environment reset & auto-starts servers

# No need to run 'npm run dev' - setup script starts servers automatically
```

Access: http://localhost:3000

### Production (Docker - Recommended)

```bash
# One-command production deployment
docker-compose -f docker-compose.prod.yml up -d
```

Access: http://localhost

## Development Deployment

### Local Development Environment

**1. Prerequisites Installation**

Windows:
```bash
# Check for latest versions first
winget search Microsoft.DotNet.SDK
winget search OpenJS.NodeJS

# Install latest versions  
winget install Microsoft.DotNet.SDK.9
winget install OpenJS.NodeJS.LTS
```

macOS:
```bash
brew install node@22
brew install dotnet@9
```

Linux (Ubuntu/Debian):
```bash
# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# .NET 9
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update && sudo apt install dotnet-sdk-9.0
```

**2. Project Setup**

```bash
# Automated complete environment setup
npm run setup    # Comprehensive fresh start with auto-server startup

# Manual setup (if you want to avoid the destructive reset)
npm install
cd backend && dotnet restore && cd ..
cd frontend && npm install && cd ..

# Build verification
npm run build
npm run validate
```

**3. Start Development Servers**

```bash
# Start both frontend and backend concurrently
npm run dev

# Or start separately
npm run dev:backend   # .NET API on :5000
npm run dev:frontend  # React app on :3000
```

**4. Development URLs**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Swagger UI**: http://localhost:5000/swagger
- **Database**: `library.db` file in project root

## Docker Deployment

### Development with Docker

**1. Prerequisites**
```bash
# Install Docker Desktop
# Windows
winget install Docker.DockerDesktop

# macOS  
brew install --cask docker

# Linux
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

**2. Development Containers**

```bash
# Start development environment with hot reload
docker-compose up -d

# With database browser for debugging  
docker-compose --profile debug up -d
```

**3. Development URLs**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api  
- **Database Browser**: http://localhost:8080 (debug mode)

### Production with Docker

**1. Production Deployment**

```bash
# Production-optimized containers
docker-compose -f docker-compose.prod.yml up -d

# With automated backups
docker-compose -f docker-compose.prod.yml --profile backup up -d
```

**2. Production URLs**
- **Application**: http://localhost
- **API**: http://localhost:5000  
- **Health Check**: http://localhost/health

**3. Production Features**
- **Nginx Reverse Proxy**: Load balancing and static file serving
- **Optimized Builds**: Multi-stage Docker builds for minimal image size
- **Auto-Restarts**: Container restart policies for reliability
- **Health Monitoring**: Built-in health checks and status reporting
- **Backup Service**: Automated SQLite database backups
- **Resource Limits**: CPU and memory constraints for stability

## Environment Configuration

### Environment Variables

**Development (.env.development)**
```bash
# API Configuration
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://+:5000
CONNECTION_STRING=Data Source=library.db

# JWT Configuration
JWT_SECRET=your-development-secret-key-here
JWT_EXPIRES_HOURS=24
JWT_ISSUER=LibraryAPI
JWT_AUDIENCE=LibraryClient

# Cors Configuration  
CORS_ORIGINS=http://localhost:3000

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_DEVTOOLS=true
```

**Production (.env.production)**
```bash
# API Configuration
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
CONNECTION_STRING=Data Source=/data/library.db

# JWT Configuration (use strong secrets!)
JWT_SECRET=your-production-secret-key-minimum-256-bits
JWT_EXPIRES_HOURS=24
JWT_ISSUER=LibraryAPI
JWT_AUDIENCE=LibraryClient

# CORS Configuration
CORS_ORIGINS=http://localhost,https://yourdomain.com

# Frontend Configuration
VITE_API_BASE_URL=/api
VITE_ENABLE_DEVTOOLS=false

# Production Features
ENABLE_HTTPS_REDIRECT=true
ENABLE_SECURITY_HEADERS=true
ENABLE_REQUEST_LOGGING=true
```

**Docker Environment (.env.docker)**
```bash
# Container Configuration
COMPOSE_PROJECT_NAME=library-app
RESTART_POLICY=unless-stopped

# Network Configuration
FRONTEND_PORT=3000
BACKEND_PORT=5000
NGINX_PORT=80
DB_BROWSER_PORT=8080

# Volume Configuration
DATA_PATH=./data
BACKUP_PATH=./backups
SSL_PATH=./ssl

# Backup Configuration
BACKUP_RETENTION_DAYS=30
BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
```

### SSL/TLS Configuration (Production)

**1. Certificate Setup**
```bash
# Create SSL directory
mkdir -p ssl

# Self-signed certificate (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/server.key \
  -out ssl/server.crt \
  -config <(
    echo '[req]'; 
    echo 'distinguished_name=req_distinguished_name'; 
    echo 'req_extensions=v3_req'; 
    echo '[req_distinguished_name]'; 
    echo '[v3_req]'; 
    echo 'basicConstraints=CA:FALSE'; 
    echo 'keyUsage=nonRepudiation,digitalSignature,keyEncipherment'; 
    echo 'subjectAltName=@alt_names'; 
    echo '[alt_names]'; 
    echo 'DNS.1=localhost'
  )

# Let's Encrypt certificate (production)
certbot certonly --webroot -w /var/www/certbot \
  -d yourdomain.com \
  -d www.yourdomain.com
```

**2. Nginx HTTPS Configuration**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /ssl/server.crt;
    ssl_certificate_key /ssl/server.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Database Management

### Database Migrations

**Development**
```bash
# Create new migration
cd backend
dotnet ef migrations add MigrationName --project src/LibraryApi

# Apply migrations
dotnet ef database update --project src/LibraryApi

# Generate SQL scripts
dotnet ef migrations script --project src/LibraryApi
```

**Production**
```bash
# Apply migrations on startup (automatic)
# Configured in Program.cs with context.Database.MigrateAsync()

# Manual migration (if needed)
docker exec -it library-app-backend \
  dotnet ef database update --project /app/LibraryApi.dll
```

### Database Backups

**Development**
```bash
# Manual backup
cp library.db "backups/library-backup-$(date +%Y%m%d-%H%M%S).db"

# Restore backup
cp backups/library-backup-YYYYMMDD-HHMMSS.db library.db
```

**Production (Docker)**
```bash
# Automated backups (configured in docker-compose.prod.yml)
# - Daily backups at 2 AM
# - 30-day retention policy
# - Stored in ./backups volume

# Manual backup
docker-compose -f docker-compose.prod.yml --profile backup up -d

# List backups
ls backups/

# Restore backup
docker-compose -f docker-compose.prod.yml down
cp backups/library-backup-YYYYMMDD-HHMMSS.db data/library.db
docker-compose -f docker-compose.prod.yml up -d
```

### Database Seeding

**Development Data**
```bash
# Seed development data
cd backend
dotnet run --project src/LibraryApi -- --seed-data

# Or via SQL scripts
sqlite3 library.db < scripts/seed-development-data.sql
```

**Production Data**
```bash
# Import from CSV
curl -X POST http://localhost:5000/api/bulkimport/books \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@sample-books.csv"
```

## Monitoring and Health Checks

### Health Check Endpoints

```bash
# Basic health check
curl http://localhost:5000/health

# Readiness check (includes database)  
curl http://localhost:5000/health/ready

# Liveness check
curl http://localhost:5000/health/live

# Detailed health report
curl http://localhost:5000/health/details
```

### Logging Configuration

**Development Logging**
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  }
}
```

**Production Logging**
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning", 
      "Application": "Information",
      "Microsoft.AspNetCore": "Error"
    }
  },
  "Serilog": {
    "MinimumLevel": "Information",
    "WriteTo": [
      {
        "Name": "File",
        "Args": {
          "path": "/logs/library-api-.log",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 30
        }
      }
    ]
  }
}
```

### Performance Monitoring

**Key Metrics to Monitor**:
- **Response Time**: < 2 seconds average
- **Error Rate**: < 5% of requests  
- **Memory Usage**: < 80% of allocated memory
- **CPU Usage**: < 70% sustained
- **Database Connections**: Monitor pool usage
- **Disk Space**: Database growth monitoring

**Monitoring Commands**:
```bash
# Docker resource usage
docker stats

# Application health
docker-compose -f docker-compose.prod.yml ps

# Log monitoring
docker-compose logs -f backend
```

## Scaling Considerations

### Horizontal Scaling

**Load Balancer Configuration** (Nginx):
```nginx
upstream backend_servers {
    server backend-1:8080;
    server backend-2:8080;
    server backend-3:8080;
}

server {
    location /api/ {
        proxy_pass http://backend_servers;
    }
}
```

**Database Scaling**:
- SQLite limitations for high concurrency
- Consider PostgreSQL/SQL Server for production scaling
- Read replicas for analytics queries

### Vertical Scaling

**Resource Allocation**:
```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'  
          memory: 1G
```

## Cloud Deployment

### Azure Container Apps

```bash
# Create resource group
az group create --name library-app --location eastus

# Deploy container app
az containerapp up \
  --name library-app \
  --resource-group library-app \
  --location eastus \
  --environment 'library-env' \
  --image your-registry/library-app:latest \
  --target-port 80 \
  --ingress external
```

### AWS ECS

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name library-app

# Create task definition
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json

# Deploy service
aws ecs create-service \
  --cluster library-app \
  --service-name library-service \
  --task-definition library-app:1 \
  --desired-count 2
```

### Google Cloud Run

```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT_ID/library-app

# Deploy to Cloud Run
gcloud run deploy library-app \
  --image gcr.io/PROJECT_ID/library-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Security Hardening

### Production Security Checklist

- [ ] **HTTPS Only**: Force HTTPS redirects, HSTS headers
- [ ] **Strong JWT Secrets**: Minimum 256-bit random keys
- [ ] **Environment Variables**: No secrets in code or containers
- [ ] **CORS Restrictions**: Specific origins, no wildcards
- [ ] **Rate Limiting**: API rate limits by user/IP
- [ ] **Input Validation**: Server-side validation for all inputs
- [ ] **SQL Injection Prevention**: Parameterized queries only
- [ ] **XSS Prevention**: Output encoding, CSP headers
- [ ] **Security Headers**: X-Frame-Options, X-Content-Type-Options
- [ ] **File Upload Security**: Type validation, size limits
- [ ] **Error Handling**: No sensitive data in error messages
- [ ] **Audit Logging**: Security events and access logs

### Nginx Security Configuration

```nginx
# Security headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
add_header Content-Security-Policy "default-src 'self'";

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
location /api/ {
    limit_req zone=api burst=20 nodelay;
}

# Hide server information
server_tokens off;
```

## Backup and Recovery

### Backup Strategy

**Development**:
- Manual backups before major changes
- Git repository for code versioning
- Database backups in `./backups` directory

**Production**:
- Automated daily database backups
- 30-day retention policy  
- Off-site backup storage (cloud)
- Database transaction log backups (if applicable)

### Disaster Recovery

**Recovery Time Objective (RTO)**: < 4 hours
**Recovery Point Objective (RPO)**: < 24 hours

**Recovery Procedures**:

1. **Database Corruption**:
   ```bash
   # Stop application
   docker-compose down
   
   # Restore latest backup
   cp backups/library-backup-YYYYMMDD.db data/library.db
   
   # Start application
   docker-compose up -d
   ```

2. **Complete System Failure**:
   ```bash
   # Redeploy from clean state
   git clone <repository-url>
   cp /backup-location/library.db ./data/
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Data Center Failure**:
   - Deploy to alternate cloud region
   - Restore from off-site backups
   - Update DNS to point to new deployment

This deployment guide provides comprehensive instructions for deploying the Book Library application across different environments and scenarios, from local development to production cloud deployments.