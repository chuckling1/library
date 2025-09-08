# Book Library Application

A full-stack book management application with secure httpOnly cookie JWT authentication, multi-user data isolation, comprehensive CSV import/export, and advanced analytics. Built with clean architecture, strict type safety, and comprehensive testing.

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

**First Time Users:**
1. Navigate to http://localhost:3000
2. Click "Sign Up" to create your account
3. Log in with your credentials
4. Start building your personal book library

## 🐳 Docker Setup

**Prefer Docker?** Run the entire application with Docker - no Node.js or .NET installation required!

### Quick Start with Docker

```powershell
# Windows PowerShell (recommended)
.\docker-dev.ps1 start

# Or using docker-compose directly
docker-compose up -d
```


### Docker Management Commands

We've included a PowerShell script for easy Docker management:

**`docker-dev.ps1` commands:**
- `start` - Start all development containers with hot reload
- `debug` - Start with database browser at http://localhost:8080
- `stop` - Stop all containers
- `restart` - Restart all containers
- `logs [service]` - Show logs (optionally for specific service)
- `status` - Show container status and URLs
- `build` - Rebuild all containers
- `clean` - Clean up containers and volumes

### Service URLs

**Development:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Swagger UI**: http://localhost:5000/swagger
- **Database Browser**: http://localhost:8080 (debug profile)

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
- httpOnly Cookie JWT Authentication with BCrypt password hashing
- Multi-user data isolation with automatic user scoping
- OpenAPI/Swagger for API documentation
- Interface-based architecture with dependency injection
- Comprehensive structured logging with Serilog

**Frontend (React 19+)**  
- React with TypeScript (ultra-strict configuration)
- Vite for fast development and building
- React Query for server state management with caching
- React Router for client-side routing
- Recharts for interactive data visualizations
- Context API for authentication state management
- Auto-generated API client from OpenAPI spec

### Key Features

- **🔐 Multi-User Authentication**: Secure httpOnly cookie JWT authentication with complete data isolation
- **📚 Book Management**: Full CRUD operations with user-specific collections
- **📊 Bulk Operations**: CSV import/export with duplicate detection and validation
- **🏷️ Advanced Genre System**: Dynamic genre creation with intelligent filtering and sorting
- **⭐ Smart Analytics**: Genre distribution charts, rating statistics, and collection insights
- **🔍 Powerful Search & Filter**: Real-time search with advanced filtering by genre, rating, and dates
- **📱 Responsive Design**: Clean UI with accessibility features and dark theme

## 🔧 Development Workflow

### OpenAPI-First Development

1. **Backend**: C# models and controllers auto-generate OpenAPI spec with httpOnly cookie JWT authentication
2. **Frontend**: Generates TypeScript client from OpenAPI spec with auth headers
3. **Type Safety**: Breaking changes caught at compile time across authentication boundaries
4. **Multi-User Support**: All endpoints automatically scoped to authenticated user

```bash
# After backend changes, regenerate frontend client
npm run generate-client
```

### Authentication-First Architecture

- **Secure by Default**: All book operations require httpOnly cookie authentication
- **User Data Isolation**: Complete separation between user accounts
- **httpOnly Cookie Management**: Automatic cookie-based JWT handling with no JavaScript access
- **Permission Boundaries**: No cross-user data access possible

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

### Fresh Start Script (Complete Environment Reset)

**Need a completely clean development environment?** The fresh-start script provides a one-command solution to reset everything and start fresh.

```bash
# Full fresh start (recommended)
node fresh-start.js

# With options
node fresh-start.js --skip-deps --skip-db    # Keep dependencies and database
node fresh-start.js --skip-start             # Don't start dev servers after setup
node fresh-start.js --verbose                # Show detailed output
node fresh-start.js --help                   # Show all options
```

**What the fresh-start script does:**
1. **🔍 Environment Check** - Verifies Node.js, npm, and .NET SDK are installed
2. **🧹 Clean Everything** - Removes all build artifacts, caches, and temp files
3. **🗄️ Database Reset** - Deletes SQLite database files for clean start
4. **📦 Fresh Dependencies** - Removes and reinstalls all node_modules
5. **🔨 Build & Validate** - Builds both projects and runs database migrations
6. **🎯 Final Setup** - Creates required directories and environment files
7. **🚀 Start Servers** - Launches both backend and frontend development servers

**When to use fresh-start:**
- ✅ After major dependency updates
- ✅ When encountering mysterious build issues
- ✅ Before important development sessions
- ✅ When switching between major features
- ✅ For onboarding new developers
- ✅ After system updates or environment changes

**Cross-platform compatibility:**
- ✅ Windows, macOS, and Linux
- ✅ PowerShell and Bash terminals
- ✅ Works with all Node.js versions 18+

The script is intelligent - it uses colored output, provides clear progress indicators, and handles interruptions gracefully. Perfect for ensuring a clean, working development environment every time.

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


## 🔒 Security & Performance

**Security Features:**
- httpOnly Cookie JWT authentication with 24-hour expiration
- Complete multi-user data isolation at database level
- Comprehensive input validation on all endpoints
- SQL injection prevention with parameterized queries
- Environment variables for all configuration (no hardcoded secrets)

**Performance Features:**
- Async/await operations throughout
- Optimized database queries with strategic indexing
- React optimization with memo, useCallback, and lazy loading
- Bundle optimization with code splitting and tree shaking
- Intelligent caching with React Query

## 🧪 Testing Strategy

- **Backend**: xUnit with Moq for mocking, 80% coverage requirement
- **Frontend**: Vitest + React Testing Library, component and integration tests
- **API Testing**: Comprehensive endpoint testing with various scenarios
- **Accessibility**: axe-core integration for WCAG 2.1 compliance

## 📝 Code Quality Standards

- **Ultra-strict TypeScript**: No `any` types, explicit typing everywhere
- **Interface-first design**: All services and repositories have interfaces
- **SOLID principles**: Single responsibility, dependency injection throughout
- **Comprehensive logging**: Structured JSON logs for debugging
- **Error-first design**: Every interaction has defined error states

## 📖 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[📘 API Documentation](docs/API.md)**: Complete REST API reference with authentication
- **[🏗️ Architecture Guide](docs/ARCHITECTURE.md)**: System design, patterns, and technical decisions
- **[🚀 Deployment Guide](docs/DEPLOYMENT.md)**: Development, Docker, and production deployment
- **[👩‍💻 Development Guide](docs/DEVELOPMENT.md)**: Setup, workflow, coding standards, and validation
- **[📖 User Guide](docs/USER_GUIDE.md)**: Complete user manual for all application features
- **[🔧 Troubleshooting Guide](docs/TROUBLESHOOTING.md)**: Solutions for common issues and debugging

**Additional Resources:**
- **Auto-generated Swagger UI**: http://localhost:5000/swagger
- **Architecture Decisions**: Documented in `project-docs/`
- **Development Process**: Complete AI-assisted workflow documentation


## 📄 License

MIT License - see LICENSE file for details.

---

*This project showcases full-stack development emphasizing clean architecture, type safety, and comprehensive testing.*