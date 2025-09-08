# Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered during development, deployment, and usage of the Book Library application. Issues are organized by category with step-by-step resolution instructions.

## Quick Diagnostics

### Health Check Commands

```bash
# Check application health
curl http://localhost:5000/health
curl http://localhost:5000/health/ready

# Check running services
npm run dev:status          # Check dev servers
docker-compose ps           # Check Docker containers
.\docker-dev.ps1 status     # Docker status via script
```

### Log Locations

```bash
# Development logs
backend/logs/               # Backend application logs
frontend/dist/logs/         # Frontend build logs
library.db-journal          # SQLite transaction log

# Docker logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx
```

## Setup and Installation Issues

### Node.js and .NET Installation Problems

**Issue**: Setup script reports missing Node.js or .NET
```
Error: Node.js 22+ required, found: 18.x.x
Error: .NET 9+ SDK required, found: 8.x.x
```

**Solution**:
```bash
# Windows (using winget)
# Check available versions first
winget search OpenJS.NodeJS
winget search Microsoft.DotNet.SDK

# Install latest versions
winget install OpenJS.NodeJS.LTS
winget install Microsoft.DotNet.SDK.9

# macOS (using homebrew)
brew install node@22
brew install dotnet@9

# Linux (Ubuntu/Debian)
# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# .NET 9
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb  
sudo apt update && sudo apt install dotnet-sdk-9.0

# Verify installations
node --version    # Should show v22.x.x or higher
npm --version     # Should show 10.x.x or higher
dotnet --version  # Should show 9.x.x or higher
```

### Package Installation Failures

**Issue**: `npm install` or `dotnet restore` fails
```
npm ERR! peer dep missing
npm ERR! network timeout
Error: Package restore failed
```

**Solution**:
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Clear .NET package cache
dotnet nuget locals all --clear
cd backend && dotnet restore --force

# If behind corporate firewall/proxy
npm config set registry https://registry.npmjs.org/
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Alternative: Use npm ci for clean installs
npm ci
```

### Database Initialization Issues

**Issue**: Database migration or seeding fails
```
Microsoft.EntityFrameworkCore.DbUpdateException: 
An error occurred while updating the entries
```

**Solution**:
```bash
# Reset database completely
rm library.db library.db-shm library.db-wal

# Recreate database with migrations
cd backend
dotnet ef database update --project src/LibraryApi

# If migration files are corrupted
rm -rf src/LibraryApi/Migrations/
dotnet ef migrations add InitialCreate --project src/LibraryApi
dotnet ef database update --project src/LibraryApi

# Seed development data (optional)
dotnet run --project src/LibraryApi -- --seed-data
```

## Development Server Issues

### Port Already in Use

**Issue**: Cannot start development server
```
Error: listen EADDRINUSE :::3000
Error: listen EADDRINUSE :::5000
```

**Solution**:
```bash
# Windows: Find and kill process using port
netstat -ano | findstr :3000
taskkill /PID <PID> /F

netstat -ano | findstr :5000  
taskkill /PID <PID> /F

# macOS/Linux: Find and kill process
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9

# Alternative: Use different ports
# Frontend
VITE_PORT=3001 npm run dev:frontend

# Backend  
ASPNETCORE_URLS=http://localhost:5001 npm run dev:backend
```

### Hot Reload Not Working

**Issue**: Changes not reflected automatically

**Frontend Hot Reload Fix**:
```bash
# Check if Vite dev server is running correctly
npm run dev:frontend

# If issues persist, restart with clean cache
rm -rf frontend/node_modules/.vite
npm run dev:frontend

# Check firewall/antivirus blocking file watchers
# Windows: Add project folder to antivirus exclusions
# macOS: Check if directory has correct permissions
```

**Backend Hot Reload Fix**:
```bash
# Ensure dotnet watch is working
cd backend
dotnet watch run --project src/LibraryApi

# If watch fails, check file system events
# Linux: Increase inotify watch limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### API Connection Issues

**Issue**: Frontend cannot connect to backend
```
TypeError: Network request failed
CORS error: Access to XMLHttpRequest blocked
```

**Solution**:
```bash
# 1. Verify backend is running
curl http://localhost:5000/health

# 2. Check CORS configuration in backend
# Ensure frontend origin is allowed in appsettings.Development.json
{
  "AllowedHosts": "*",
  "CorsSettings": {
    "AllowedOrigins": ["http://localhost:3000"]
  }
}

# 3. Check frontend API base URL
# frontend/.env.development should have:
VITE_API_BASE_URL=http://localhost:5000/api

# 4. Restart both servers
npm run dev
```

## Build and Validation Issues

### StyleCop Violations (Backend)

**Issue**: Build fails with StyleCop errors
```
SA1200: Using directive should appear within a namespace declaration
SA1600: Elements should be documented  
SA1028: Code should not contain trailing whitespace
```

**Solution**:
```bash
# Auto-fix most formatting issues
cd backend
dotnet format

# Manual fixes for common violations:

# SA1200 - Move using statements inside namespace
// ❌ BAD
using System;

namespace LibraryApi.Services
{
    // class content
}

// ✅ GOOD  
namespace LibraryApi.Services
{
    using System;
    
    // class content
}

# SA1600 - Add XML documentation
/// <summary>
/// Service for managing book operations.
/// </summary>
public class BookService
{
    /// <summary>
    /// Gets a book by ID.
    /// </summary>
    /// <param name="bookId">The book ID.</param>
    /// <returns>The book.</returns>
    public async Task<Book> GetBookAsync(string bookId)
    {
        // implementation
    }
}

# SA1028 - Remove trailing whitespace
# Use editor "Show whitespace" mode to identify and remove
# No spaces or tabs at end of lines
```

### ESLint Violations (Frontend)

**Issue**: Frontend build fails with ESLint errors
```
error  Unexpected any  @typescript-eslint/no-explicit-any
error  Missing return type  @typescript-eslint/explicit-function-return-type
error  Promise returned in callback  @typescript-eslint/no-misused-promises
```

**Solution**:
```bash
# Auto-fix where possible
cd frontend
npm run lint:fix

# Manual fixes for common violations:

# no-explicit-any
// ❌ BAD
function handleData(data: any) {
    // implementation
}

// ✅ GOOD
interface DataType {
    id: string;
    name: string;
}

function handleData(data: DataType) {
    // implementation  
}

# explicit-function-return-type
// ❌ BAD
const processBook = (book) => {
    return book.title;
}

// ✅ GOOD
const processBook = (book: Book): string => {
    return book.title;
}

# no-misused-promises  
// ❌ BAD
<button onClick={async () => await handleSubmit()}>

// ✅ GOOD
const handleClick = useCallback(async (): Promise<void> => {
    await handleSubmit();
}, []);

<button onClick={handleClick}>
```

### TypeScript Compilation Errors

**Issue**: TypeScript fails to compile
```
TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'
TS2322: Type 'null' is not assignable to type 'Book'
```

**Solution**:
```typescript
// Handle undefined/null values properly

// ❌ BAD
const bookId = params.id;  // might be undefined
const result = await bookService.getBook(bookId);

// ✅ GOOD
const bookId = params.id;
if (!bookId) {
    throw new Error('Book ID is required');
}
const result = await bookService.getBook(bookId);

// ❌ BAD  
const [book, setBook] = useState<Book>(null);

// ✅ GOOD
const [book, setBook] = useState<Book | null>(null);

// Use type guards and null checks
if (book) {
    // book is guaranteed to be Book, not null
    console.log(book.title);
}
```

### Build Performance Issues

**Issue**: Slow build times or memory errors
```
JavaScript heap out of memory
EMFILE: too many open files
```

**Solution**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Windows PowerShell
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Clean build artifacts and rebuild
npm run clean
npm run build

# For file handle issues on Linux/macOS
ulimit -n 65536
npm run build

# Clear dependency caches
npm cache clean --force
rm -rf node_modules/.cache
```

## Runtime and API Issues

### Authentication Failures

**Issue**: API returns 401 Unauthorized
```
{
  "error": "Unauthorized", 
  "message": "JWT token is required for this endpoint"
}
```

**Solution**:
```bash
# 1. Check if user is logged in
# Browser DevTools > Application > Local Storage
# Should see auth token

# 2. Check token expiration
# JWT tokens expire after 24 hours
# Log out and log back in

# 3. Verify JWT secret configuration
# backend/appsettings.json should have:
{
  "JwtSettings": {
    "SecretKey": "your-secret-key-minimum-256-bits",
    "Issuer": "LibraryAPI", 
    "Audience": "LibraryClient",
    "ExpirationHours": 24
  }
}

# 4. Check Authorization header format
# Should be: Authorization: Bearer <token>
# Check network tab in browser DevTools

# 5. Restart backend server to reload JWT configuration
npm run dev:backend
```

### Database Connection Errors

**Issue**: Cannot connect to database
```
Microsoft.Data.Sqlite.SqliteException: SQLite Error 14: 'unable to open database file'
System.Data.Common.DbException: A connection was successfully established with the server
```

**Solution**:
```bash
# 1. Check if database file exists and has correct permissions
ls -la library.db
# Should show read/write permissions

# 2. Ensure database directory is writable
chmod 755 .
chmod 664 library.db

# 3. Check if database is locked by another process
lsof library.db  # macOS/Linux
# Kill any processes using the database

# 4. For Docker environments, check volume mounts
docker-compose ps
docker-compose logs backend

# 5. Reset database if corrupted
rm library.db library.db-shm library.db-wal
cd backend
dotnet ef database update --project src/LibraryApi
```

### Data Isolation Issues

**Issue**: Users seeing other users' books
```
User A can see books belonging to User B
Search returns cross-user results
```

**Solution**:
```bash
# This is a CRITICAL security issue
# Check these components:

# 1. Repository methods must include userId filter
// ❌ BAD
public async Task<Book[]> GetBooksAsync() 
{
    return await context.Books.ToArrayAsync();
}

// ✅ GOOD  
public async Task<Book[]> GetBooksAsync(string userId)
{
    return await context.Books
        .Where(b => b.UserId == userId)
        .ToArrayAsync();
}

# 2. Controller methods must extract userId from JWT
[Authorize]
public async Task<ActionResult<Book[]>> GetBooks()
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    return await bookService.GetBooksAsync(userId);
}

# 3. Verify JWT claims are correct
# Check browser DevTools > Network > Request Headers
# Authorization: Bearer <token>
# Decode JWT token at jwt.io to verify userId claim

# 4. Run user isolation tests
cd backend  
dotnet test --filter "UserIsolation"
```

### CSV Import/Export Issues

**Issue**: CSV operations fail with errors
```
500 Internal Server Error during CSV import
Invalid CSV format
File too large error
```

**Solution**:
```bash
# 1. Check CSV format matches expected headers
# Required headers: Title,Author,Genres,PublishedDate,Rating,Edition,ISBN
# Genres should be comma-separated: "Fiction,Mystery"
# Dates should be: YYYY-MM-DD
# Ratings should be: 1-5 integers

# 2. Check file size limits
# Default limit: 10MB
# To increase, update appsettings.json:
{
  "RequestSizeLimit": {
    "MaxRequestBodySize": 52428800  // 50MB
  }
}

# 3. Check file encoding
# CSV files should be UTF-8 encoded
# Convert if needed:
iconv -f ISO-8859-1 -t UTF-8 input.csv > output.csv

# 4. Verify API endpoint and authentication
curl -X POST http://localhost:5000/api/bulkimport/books \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@books.csv"

# 5. Check backend logs for specific errors
cd backend
dotnet run --project src/LibraryApi
# Monitor console output during import
```

## Docker and Container Issues

### Docker Desktop Problems

**Issue**: Docker containers won't start
```
docker: Error response from daemon: driver failed programming external connectivity
Cannot connect to the Docker daemon
```

**Solution**:
```bash
# 1. Restart Docker Desktop
# Windows: Right-click Docker icon > Restart
# macOS: Docker menu > Restart

# 2. Check Docker daemon status
docker version
docker info

# 3. For Windows, check Hyper-V/WSL2 backend
# Enable Hyper-V or WSL2 in Windows Features
# Restart computer after enabling

# 4. Check port conflicts
netstat -ano | findstr :80
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# 5. Reset Docker if needed
docker system prune -a --volumes
```

### Container Build Failures

**Issue**: Docker build fails
```
ERROR: failed to solve: process "/bin/sh -c npm install" didn't complete successfully
ERROR: failed to solve: process "/bin/sh -c dotnet restore" didn't complete successfully
```

**Solution**:
```bash
# 1. Check .dockerignore files are correct
# backend/.dockerignore should exclude:
node_modules
obj/
bin/
*.db

# frontend/.dockerignore should exclude:
node_modules
dist/
.vite/

# 2. Build with verbose output
docker-compose build --no-cache --progress=plain

# 3. Check base image availability
docker pull node:22-alpine
docker pull mcr.microsoft.com/dotnet/sdk:9.0

# 4. Build individual services
docker-compose build backend
docker-compose build frontend

# 5. Clean Docker cache
docker builder prune -a
```

### Network Connectivity Issues

**Issue**: Services can't communicate within Docker
```
frontend service cannot reach backend
nginx proxy returning 502 Bad Gateway
```

**Solution**:
```bash
# 1. Check service names in docker-compose.yml
# Services should reference each other by name:
# frontend -> backend:8080 
# nginx -> backend:8080, frontend:3000

# 2. Verify Docker network
docker network ls
docker network inspect library_default

# 3. Check service health
docker-compose ps
docker-compose logs backend
docker-compose logs frontend

# 4. Test connectivity between containers
docker-compose exec frontend ping backend
docker-compose exec frontend curl http://backend:8080/health

# 5. Check proxy configuration
# nginx/nginx.conf should have:
location /api/ {
    proxy_pass http://backend:8080/api/;
}
```

## Performance Issues

### Slow API Responses

**Issue**: API endpoints responding slowly (>2 seconds)
```
GET /api/books taking 5+ seconds
Database queries timing out
```

**Solution**:
```bash
# 1. Check database indexes
sqlite3 library.db
.indices books
.explain query plan SELECT * FROM books WHERE userId = ?;

# If missing indexes, create migrations:
cd backend
dotnet ef migrations add AddPerformanceIndexes --project src/LibraryApi

# 2. Enable query logging to identify slow queries
# appsettings.Development.json:
{
  "Logging": {
    "LogLevel": {
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}

# 3. Check for N+1 query problems
# Use .Include() for related data:
context.Books
    .Include(b => b.Genres)  
    .Where(b => b.UserId == userId)

# 4. Monitor system resources
# Windows: Task Manager > Performance  
# macOS: Activity Monitor
# Linux: top, htop
docker stats  # For containers
```

### High Memory Usage

**Issue**: Application consuming excessive memory
```
OutOfMemoryException
Docker containers being killed (OOMKilled)
```

**Solution**:
```bash
# 1. Identify memory leaks
# Use dotnet-dump for .NET applications
dotnet tool install -g dotnet-dump
dotnet-dump collect -p <process-id>

# 2. Check Entity Framework context disposal
# Ensure using statements or proper disposal:
using var context = new LibraryDbContext();
// operations

# 3. Review large data operations
# Use pagination for large datasets
# Stream large files instead of loading into memory

# 4. Configure Docker memory limits
# docker-compose.prod.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G

# 5. Enable garbage collection logging
# appsettings.json:
{
  "Logging": {
    "LogLevel": {
      "Microsoft.Hosting.Lifetime": "Information"
    }
  }
}
```

## Browser and Frontend Issues

### React Error Boundaries

**Issue**: Frontend crashes with unhandled errors
```
Something went wrong.
Cannot read property 'map' of undefined
Uncaught TypeError in React component
```

**Solution**:
```typescript
// Check error boundary implementation
// Should catch and display user-friendly errors

// Common causes and fixes:

// 1. Undefined data access
// ❌ BAD
{books.map(book => <BookCard book={book} />)}

// ✅ GOOD  
{(books || []).map(book => <BookCard key={book.id} book={book} />)}

// 2. Missing null checks
// ❌ BAD
<span>{user.name}</span>

// ✅ GOOD
<span>{user?.name ?? 'Unknown User'}</span>

// 3. Async data handling
const { data: books, isLoading, error } = useBooks();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!books?.items?.length) return <EmptyState />;

return <BookList books={books.items} />;
```

### Browser Console Errors

**Issue**: JavaScript errors in browser console
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
Uncaught ReferenceError: process is not defined
```

**Solution**:
```bash
# 1. Check browser console (F12 > Console)
# Look for red error messages

# 2. Network errors usually indicate API connectivity issues
# Check if backend is running: curl http://localhost:5000/health

# 3. For "process is not defined" in Vite:
# Add to vite.config.ts:
export default defineConfig({
  define: {
    'process.env': process.env
  }
});

# 4. Clear browser cache and storage
# F12 > Application > Storage > Clear site data
# Or use incognito/private browsing mode

# 5. Check for conflicting browser extensions
# Disable ad blockers, privacy tools temporarily
```

## Environment-Specific Issues

### Production Deployment Issues

**Issue**: Application works in development but fails in production
```
500 Internal Server Error in production
Environment variables not loading
Static files not serving correctly
```

**Solution**:
```bash
# 1. Check environment configuration
# .env.production should have correct values
# No development-specific settings

# 2. Verify environment variables in containers
docker-compose exec backend env | grep -E "(ASPNETCORE|JWT|CONNECTION)"

# 3. Check static file serving in production
# nginx.conf should serve frontend static files:
location / {
    try_files $uri $uri/ /index.html;
}

# 4. Enable production logging temporarily
# Change log level to Information to debug issues
# Remember to change back to Warning after debugging

# 5. Check health endpoints in production
curl https://yourdomain.com/health
curl https://yourdomain.com/api/health
```

### SSL/TLS Certificate Issues

**Issue**: HTTPS not working or certificate errors
```
SSL_ERROR_BAD_CERT_DOMAIN
Your connection is not private
Certificate has expired
```

**Solution**:
```bash
# 1. Check certificate validity
openssl x509 -in ssl/server.crt -text -noout
# Verify expiration date and domain names

# 2. For Let's Encrypt certificates
certbot renew --dry-run
certbot renew  # Renew if needed

# 3. Check nginx SSL configuration
nginx -t  # Test configuration
docker-compose exec nginx nginx -s reload

# 4. Verify certificate chain
# Use online SSL checker: ssllabs.com/ssltest/

# 5. For development, accept self-signed certificates
# Browser > Advanced > Proceed to localhost (unsafe)
```

## Emergency Procedures

### Complete System Reset

**When everything else fails:**

```bash
# 1. Stop all services
npm run stop  # If available
docker-compose down --volumes

# 2. Clean all caches and build artifacts
npm run clean
rm -rf node_modules
rm -rf backend/bin backend/obj
rm -rf frontend/dist frontend/node_modules

# 3. Reset database
rm library.db library.db-shm library.db-wal

# 4. Reinstall dependencies
npm install
cd backend && dotnet restore
cd ../frontend && npm install

# 5. Rebuild everything
npm run build
npm run validate

# 6. Restart development
npm run dev
```

### Data Recovery

**If database is corrupted:**

```bash
# 1. Check if backup exists
ls -la backups/

# 2. Restore from backup
cp backups/library-backup-YYYYMMDD.db library.db

# 3. If no backup, try SQLite recovery
sqlite3 library.db ".recover" > recovered.sql
sqlite3 new-library.db < recovered.sql

# 4. Re-export user data if possible  
# Use API export endpoint before system reset
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/bulkimport/export/books \
  > backup-books.csv
```

This troubleshooting guide covers the most common issues. For issues not covered here, check the application logs, enable verbose logging, and review the specific error messages for additional clues.