# Book Library Application

A full-stack book management application demonstrating professional AI-assisted development workflows with clean architecture, strict type safety, and comprehensive testing.

## 🚀 Quick Start

**One-line setup:**
```bash
npm run setup
```

The setup script will:
- ✅ Check for Node.js 22+ and .NET 9+ SDK (8+ minimum)
- 📦 Provide installation guidance if dependencies are missing  
- 🔧 Install all project dependencies automatically
- 🏗️ Build both backend and frontend projects
- ✅ Run validation tests to ensure everything works

**Start development:**
```bash
npm run dev
```

That's it! The application will be running at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000  
- **Swagger UI**: http://localhost:5000/swagger

## 🐳 Docker Setup

**Prefer Docker?** Run the entire application with Docker - no Node.js or .NET installation required!

### Quick Start with Docker

**Development Environment:**
```powershell
# Windows PowerShell (recommended)
.\docker-dev.ps1 start

# Or using docker-compose directly
docker-compose up -d
```

**Production Environment:**
```powershell
# Windows PowerShell (recommended) 
.\docker-prod.ps1 start

# Or using docker-compose directly
docker-compose -f docker-compose.prod.yml up -d
```

### Docker Management Scripts

We've included PowerShell scripts for easy Docker management:

**Development (`docker-dev.ps1`):**
- `start` - Start all development containers with hot reload
- `debug` - Start with database browser at http://localhost:8080
- `stop` - Stop all containers
- `restart` - Restart all containers
- `logs [service]` - Show logs (optionally for specific service)
- `status` - Show container status and URLs
- `build` - Rebuild all containers
- `clean` - Clean up containers and volumes

**Production (`docker-prod.ps1`):**
- `start` - Start production-optimized containers
- `backup` - Start with automated database backups
- `stop` - Stop all production containers
- `status` - Show status and resource usage
- `logs [service]` - Show production logs
- `build` - Rebuild production containers
- `clean` - Clean up production environment

### Service URLs

**Development:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Swagger UI**: http://localhost:5000/swagger
- **Database Browser**: http://localhost:8080 (debug profile)

**Production:**
- **Application**: http://localhost
- **Backend API**: http://localhost:5000
- **Reverse Proxy**: http://localhost:8080
- **Health Checks**: http://localhost/health

### Install Docker First

**Windows:**
```bash
winget install Docker.DockerDesktop
```

**macOS:**
```bash
brew install --cask docker
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

📖 **[Complete Docker Setup Guide →](DOCKER_SETUP.md)**

### Missing Dependencies?

If you don't have the required dependencies, the setup script will guide you through installation:

**Windows:**
```bash
# Using winget (Windows Package Manager)
# Check for latest available versions first:
winget search Microsoft.DotNet.SDK
winget search OpenJS.NodeJS

# Install latest versions:
winget install Microsoft.DotNet.SDK.9
winget install OpenJS.NodeJS.LTS

# Then run setup again
npm run setup
```

**macOS:**
```bash  
# Using Homebrew
brew install node
brew install dotnet

# Then run setup again
npm run setup
```

**Linux:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install .NET (Ubuntu/Debian) - Latest version
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update && sudo apt install dotnet-sdk-9.0

# Then run setup again
npm run setup
```

## 🏗️ Architecture

### Technology Stack

**Backend (.NET 9+)**
- ASP.NET Core Web API (latest stable)
- Entity Framework Core with SQLite
- OpenAPI/Swagger for API documentation
- Interface-based architecture with dependency injection
- Comprehensive logging with Serilog

**Frontend (React 19+)**  
- React with TypeScript (ultra-strict configuration)
- Vite for fast development and building
- React Query for API state management
- React Router for client-side routing
- Recharts for data visualization
- Auto-generated API client from OpenAPI spec

### Key Features

- **📚 Book Management**: Full CRUD operations for books
- **🏷️ Genre System**: Hybrid tag system (base genres + custom)  
- **⭐ Ratings**: Integer input (1-5) with fractional averages
- **📊 Analytics**: Genre distribution charts and statistics
- **🔍 Search & Filter**: Advanced filtering by genre, rating, dates
- **📱 Responsive Design**: Works on desktop, tablet, and mobile

## 🔧 Development Workflow

### OpenAPI-First Development

1. **Backend**: C# models and controllers auto-generate OpenAPI spec
2. **Frontend**: Generates TypeScript client from OpenAPI spec
3. **Type Safety**: Breaking changes caught at compile time

```bash
# After backend changes, regenerate frontend client
npm run generate-client
```

### Validation Gates

All code must pass strict validation before proceeding:

```bash
npm run validate  # Runs both backend and frontend validation
```

**Validation includes:**
- Linting (StyleCop + ESLint)
- Type checking (strict TypeScript)
- Build verification
- Test execution (80% coverage requirement)
- Security analysis
- Performance checks

### Project Structure

```
library/
├── backend/                 # .NET Web API
│   ├── src/LibraryApi/     # Main API project
│   │   ├── Controllers/    # API endpoints
│   │   ├── Services/       # Business logic (interfaces)
│   │   ├── Repositories/   # Data access (interfaces)
│   │   ├── Models/         # Entity models
│   │   ├── Requests/       # API request DTOs
│   │   ├── Responses/      # API response DTOs
│   │   └── Data/           # EF DbContext
│   └── validate.ps1        # Backend validation script
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-based page components
│   │   ├── services/       # API integration layer
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript type definitions
│   │   └── generated/      # Auto-generated API client
│   └── validate.js         # Frontend validation script
└── project-docs/           # AI development process docs
```

## 📋 Available Commands

### Root Level Commands
```bash
npm run setup        # One-time project setup
npm run dev          # Start both backend and frontend
npm run build        # Build both projects for production
npm run test         # Run all tests
npm run validate     # Run comprehensive validation gates
```

### Backend Commands (from backend/)
```bash
dotnet run --project src/LibraryApi    # Start API server
dotnet build --configuration Release   # Build project
dotnet test                            # Run tests
./validate.ps1                        # Run validation gates
```

### Frontend Commands (from frontend/)
```bash
npm run dev              # Start dev server
npm run build           # Build for production  
npm run test            # Run tests with Vitest
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript compiler
npm run generate-client # Generate API client from OpenAPI
```

## 🎯 AI-Assisted Development

This project demonstrates a structured AI-assisted development methodology:

1. **Product Management**: Requirements analysis and feature scoping
2. **UX/UI Design**: API design and component architecture  
3. **Principal Architecture**: Technical foundation and patterns
4. **Lead Engineering**: Feature implementation with validation gates
5. **Quality Assurance**: Comprehensive testing and review
6. **Security Analysis**: Vulnerability assessment and best practices
7. **Technical Writing**: Documentation and process recording

Each phase has specific deliverables, success criteria, and validation requirements.

## 🔒 Security & Performance

**Security Features:**
- Input validation on all API endpoints
- SQL injection prevention via parameterized queries
- XSS prevention with proper React sanitization
- No hardcoded secrets (environment variables only)
- Comprehensive error handling without information leakage

**Performance Features:**
- Async/await patterns throughout
- Database query optimization with Entity Framework
- React.memo for expensive components
- Lazy loading and code splitting
- Efficient bundle size management

## 🧪 Testing Strategy

- **Backend**: xUnit with Moq for mocking, 80% coverage requirement
- **Frontend**: Vitest + React Testing Library, component and integration tests
- **API Testing**: Comprehensive endpoint testing with various scenarios
- **Accessibility**: axe-core integration for WCAG 2.1 compliance

## 📝 Code Quality Standards

- **Ultra-strict TypeScript**: No `any` types, explicit typing everywhere
- **Interface-first design**: All services and repositories have interfaces
- **SOLID principles**: Single responsibility, dependency injection throughout
- **Comprehensive logging**: Structured JSON logs for AI-assisted debugging
- **Error-first design**: Every interaction has defined error states

## 🚢 Deployment

### Current: Manual Setup
Currently requires Node.js 18+ and .NET 8+ SDK installation as described in Quick Start.

### ✅ Complete Docker Containerization

**Available Now**: Complete Docker containerization for zero-dependency setup!

```bash
# One-command development setup
.\docker-dev.ps1 start
# or
docker-compose up -d
```

**Benefits of Docker setup:**
- ✅ **Zero Dependencies**: Only Docker required on host machine
- ✅ **Instant Setup**: No Node.js or .NET SDK installation needed  
- ✅ **Consistent Environment**: Same setup across Windows/macOS/Linux
- ✅ **Isolated Development**: No conflicts with existing installations
- ✅ **Production-Ready**: Optimized containers for deployment
- ✅ **Hot Reload**: Development containers support live code changes
- ✅ **Health Monitoring**: Built-in health checks and status monitoring
- ✅ **Easy Management**: PowerShell scripts for common operations

**Docker Architecture:**
- **Development**: Hot reload containers with volume mounts
- **Production**: Multi-stage builds with nginx reverse proxy
- **Database**: SQLite with persistent volumes and backup service
- **Security**: Non-root users, health checks, rate limiting
- **Monitoring**: Structured logging, metrics endpoints, resource limits

**Quick Start (Docker):**
```bash
# Install Docker Desktop first
# Then choose your environment:

# Development with hot reload
.\docker-dev.ps1 start

# Production optimized
.\docker-prod.ps1 start

# Debug mode (includes database browser)
.\docker-dev.ps1 debug
```

This provides a universal setup experience that eliminates all dependency management for both development and production environments.

## 📖 Documentation

- **API Documentation**: Auto-generated Swagger UI at `/swagger`
- **Frontend Components**: JSDoc comments on all interfaces
- **Architecture Decisions**: Documented in `project-docs/`
- **Development Process**: Complete AI-assisted workflow documentation

## 🤝 Contributing

1. Follow the established validation gates
2. Maintain 80%+ test coverage
3. Use the AI-assisted development personas for structured development
4. All code must pass `npm run validate` before submission

## 📄 License

MIT License - see LICENSE file for details.

---

*This project showcases professional-grade full-stack development with AI assistance, emphasizing code quality, type safety, and comprehensive testing.*