# Docker Quick Start Guide

## 🚀 Zero to Running in 30 Seconds

**Want the application running immediately? Follow these steps:**

### Prerequisites
- Docker Desktop installed and running
- Git (to clone the repository)

### Step 1: Get the Code
```bash
git clone <repository-url>
cd library
```

### Step 2: Choose Your Environment

#### Option A: Development (Hot Reload) 
**Windows:**
```powershell
.\docker-dev.ps1 start
```

**macOS/Linux:**
```bash
chmod +x docker-dev.sh
./docker-dev.sh start
```

#### Option B: Production (Optimized)
**Windows:**
```powershell
.\docker-prod.ps1 start
```

**macOS/Linux:**
```bash
chmod +x docker-prod.sh
./docker-prod.sh start
```

### Step 3: Access the Application

**Development URLs:**
- 📱 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:5000
- 📚 **API Documentation**: http://localhost:5000/swagger
- 🗄️ **Database Browser**: http://localhost:8080 (debug mode only)

**Production URLs:**
- 🌐 **Application**: http://localhost
- 🔧 **Backend API**: http://localhost:5000
- 🔒 **Reverse Proxy**: http://localhost:8080
- ❤️ **Health Check**: http://localhost/health

---

## 🛠️ Management Commands

### Development Scripts

**Windows PowerShell:**
```powershell
.\docker-dev.ps1 start     # Start all containers
.\docker-dev.ps1 debug     # Start with database browser
.\docker-dev.ps1 stop      # Stop all containers
.\docker-dev.ps1 status    # Show status and URLs
.\docker-dev.ps1 logs      # Show all logs
.\docker-dev.ps1 build     # Rebuild containers
.\docker-dev.ps1 clean     # Clean up everything
```

**Unix/Linux/macOS:**
```bash
./docker-dev.sh start      # Start all containers
./docker-dev.sh debug      # Start with database browser
./docker-dev.sh stop       # Stop all containers
./docker-dev.sh status     # Show status and URLs
./docker-dev.sh logs       # Show all logs
./docker-dev.sh build      # Rebuild containers
./docker-dev.sh clean      # Clean up everything
```

### Production Scripts

**Windows PowerShell:**
```powershell
.\docker-prod.ps1 start    # Start production containers
.\docker-prod.ps1 backup   # Start with daily backups
.\docker-prod.ps1 stop     # Stop all containers
.\docker-prod.ps1 status   # Show status and resource usage
.\docker-prod.ps1 logs     # Show production logs
```

**Unix/Linux/macOS:**
```bash
./docker-prod.sh start     # Start production containers
./docker-prod.sh backup    # Start with daily backups
./docker-prod.sh stop      # Stop all containers
./docker-prod.sh status    # Show status and resource usage
./docker-prod.sh logs      # Show production logs
```

---

## 📋 Common Tasks

### View Logs for Specific Service
```powershell
# Development
.\docker-dev.ps1 logs backend
.\docker-dev.ps1 logs frontend

# Production  
.\docker-prod.ps1 logs backend
.\docker-prod.ps1 logs reverse-proxy
```

### Check Container Health
```powershell
.\docker-dev.ps1 status
.\docker-prod.ps1 status
```

### Rebuild After Code Changes
```powershell
# Development (preserves data)
.\docker-dev.ps1 restart

# Complete rebuild (loses data)
.\docker-dev.ps1 clean
.\docker-dev.ps1 build
.\docker-dev.ps1 start
```

---

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check Docker is running
docker version

# Check logs for errors
.\docker-dev.ps1 logs

# Clean rebuild
.\docker-dev.ps1 clean
.\docker-dev.ps1 build
.\docker-dev.ps1 start
```

### Port Already in Use
```bash
# Stop existing containers
.\docker-dev.ps1 stop

# Or find what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :5000
```

### Database Issues
```bash
# Reset database (loses data)
.\docker-dev.ps1 stop
Remove-Item -Recurse -Force backend\data
.\docker-dev.ps1 start
```

### Permission Issues (Linux/macOS)
```bash
# Fix script permissions
chmod +x docker-dev.sh docker-prod.sh

# Fix volume permissions
sudo chown -R $USER:$USER ./data ./logs
```

---

## 🔧 Environment Variables

The scripts automatically use the correct environment files:

**Development** (`.env.development`):
- Hot reload enabled
- Debug logging
- CORS configured for localhost:3000

**Production** (`.env.production`):
- Optimized builds
- Production logging levels
- Resource limits
- Backup configuration

You can modify these files to customize the environment.

---

## 🚀 What's Running?

### Development Environment
- **Backend**: .NET 9 Web API with hot reload
- **Frontend**: React + Vite dev server with hot reload  
- **Database**: SQLite with persistent volume
- **Optional**: SQLite web browser for debugging

### Production Environment  
- **Backend**: Optimized .NET 9 runtime
- **Frontend**: Static React build served by Nginx
- **Reverse Proxy**: Nginx with load balancing and security
- **Database**: SQLite with backup service
- **Monitoring**: Health checks and resource limits

---

## 📖 Need More Details?

- **[Complete Docker Setup Guide](DOCKER_SETUP.md)** - Comprehensive documentation
- **[Main README](README.md)** - Full project documentation
- **[WSL2 Setup Guide](WSL2_DOCKER_SETUP.md)** - Windows-specific setup

---

*This quick start gets you running in seconds. For development work, use the development environment. For testing deployment, use production environment.*