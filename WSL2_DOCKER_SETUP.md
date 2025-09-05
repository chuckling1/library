# WSL2 & Docker Desktop Setup Guide

## Current Status - Updated 2025-09-05
- WSL2 installation is currently in progress (user is waiting for completion)
- System restart will be required after WSL2 installation completes
- Docker Desktop is already installed but needs WSL2 to function properly
- Once restart is complete, need to continue with Docker Desktop WSL2 configuration

## Post-Restart Setup Steps

### Step 1: Verify WSL2 Installation
```bash
# Check WSL2 status and installed distributions
wsl --status
wsl --list --verbose

# Should show WSL2 as default version and Ubuntu installed
```

### Step 2: First-Time Ubuntu Setup
```bash
# Launch Ubuntu (will prompt for username/password on first run)
wsl

# Once inside Ubuntu, update packages
sudo apt update && sudo apt upgrade -y

# Exit Ubuntu
exit
```

### Step 3: Configure Docker Desktop for WSL2
1. **Start Docker Desktop** from Start menu (wait 2-3 minutes to fully load)
2. **Open Docker Desktop Settings** (gear icon)
3. **General Tab**: 
   - Ensure "Use WSL 2 based engine" is **checked**
4. **Resources → WSL Integration Tab**:
   - Enable "Enable integration with my default WSL distro"
   - Enable integration with **Ubuntu-22.04** (or whatever version was installed)
5. **Click "Apply & Restart"** and wait for Docker to restart

### Step 4: Test Docker Functionality
```bash
# Test Docker client connection
docker version

# Should show both Client and Server versions without errors

# Test with simple container
docker run hello-world

# Check no containers are running
docker ps
```

### Step 5: Run Your Library Application
```bash
# Navigate to project directory
cd C:\Users\chuck\Code\Repos\library

# Start containers in detached mode
docker-compose up -d

# Check containers are running
docker ps

# Should see 3 containers:
# - library-backend (port 5000:8080)
# - library-frontend (port 3000:3000) 
# - library-db-browser (port 8080:8080, if using debug profile)
```

### Step 6: Verify Application is Working
```bash
# Test backend health endpoint
curl http://localhost:5000/health

# Test frontend (should return HTML)
curl http://localhost:3000

# Or open in browser:
# - Frontend: http://localhost:3000
# - Backend API docs: http://localhost:5000/swagger
# - Database browser: http://localhost:8080 (if using --profile debug)
```

### Step 7: Monitor and Debug (If Needed)
```bash
# Check container logs if there are issues
docker-compose logs backend
docker-compose logs frontend

# Check container status and health
docker ps
docker-compose ps

# Stop containers when done
docker-compose down
```

## Troubleshooting Common Issues

### If Docker Desktop won't start:
- Wait 3-5 minutes after restart for services to initialize
- Check Windows Services: Docker Desktop Service should be running
- Restart Docker Desktop manually if needed

### If WSL2 integration doesn't work:
- Open Docker Desktop Settings → Resources → WSL Integration
- Toggle Ubuntu integration off and on
- Click "Apply & Restart"

### If containers fail to start:
- Check if ports 3000, 5000, or 8080 are already in use
- Review docker-compose.yml for any syntax issues
- Check Dockerfiles exist in backend/ and frontend/ directories

### If API calls fail:
- Verify backend container is healthy: `docker ps` (should show "healthy")
- Check backend logs: `docker-compose logs backend`
- Ensure CORS configuration allows frontend origin

## Files Modified During Setup
- `docker-compose.yml` - Removed obsolete version declaration
- This setup guide created for reference

## Next Steps After Setup
1. Verify application loads at http://localhost:3000
2. Test API endpoints via Swagger at http://localhost:5000/swagger
3. Run application tests to ensure everything works correctly
4. Update CHANGELOG.md with setup completion

---

*Created during Docker Desktop troubleshooting session*
*Last updated: 2025-09-05*