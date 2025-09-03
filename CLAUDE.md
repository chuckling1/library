# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Full-stack book library application with C# .NET Core Web API backend and React frontend using Vite. This project demonstrates structured AI-assisted development with strict code quality standards.

## 🚨 CRITICAL: Always Use Latest Stable Versions

**MANDATORY REQUIREMENT**: Before selecting any technology version, you MUST verify and use the latest stable release available at the time of implementation. This applies to:

- **Frameworks**: .NET, React, Vue, Angular, etc.
- **Build Tools**: Vite, Webpack, esbuild, etc.
- **Package Managers**: npm, yarn, pnpm versions
- **Databases**: Entity Framework, Prisma, etc.
- **Testing**: xUnit, Vitest, Jest, etc.
- **Languages**: C#, TypeScript, Node.js LTS versions

**Verification Process**:
1. Check official websites/GitHub releases for latest stable version
2. Verify LTS (Long Term Support) status where applicable
3. Ensure compatibility between major version updates
4. Update documentation to reflect actual versions used

**Examples of Current Latest (as of 2025)**:
- .NET 9.0 (latest stable)
- React 19.1 (latest stable) 
- Node.js 22+ LTS
- TypeScript 5.7+
- Vite 6+

**Why This Matters**:
- Security updates and vulnerability fixes
- Performance improvements and optimizations  
- Latest language features and capabilities
- Community support and ecosystem compatibility
- Professional development standards

## Technology Stack

**Backend:**
- .NET 9.0+ Web API (latest stable)
- Entity Framework Core (latest compatible)
- xUnit (latest) for testing
- Swagger/OpenAPI for documentation

**Frontend:**
- React 19+ with TypeScript (latest stable)
- Vite (latest) for build tooling
- Vitest (latest) for testing
- Modern state management solutions

## Development Commands

### Backend (from backend/ directory)
```bash
# Build and restore
dotnet restore
dotnet build

# Run application (LibraryApi project)
dotnet run --project src/LibraryApi

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"

# Create and apply migrations
dotnet ef migrations add <MigrationName> --project src/LibraryApi
dotnet ef database update --project src/LibraryApi

# Generate OpenAPI spec for frontend
dotnet run --project src/LibraryApi --urls http://localhost:5000
# Then access http://localhost:5000/swagger/v1/swagger.json
```

### Frontend (from frontend/ directory)
```bash
# Install dependencies
npm install

# Generate TypeScript client from OpenAPI spec
npm run generate-client

# Development server
npm run dev

# Build for production
npm run build

# Run tests with coverage
npm run test:coverage

# Type checking (strict mode)
npm run type-check

# Linting with strict rules
npm run lint
npm run lint:fix
```

## Code Quality Standards

### C# Backend Standards

**Mandatory Patterns:**
- All services MUST be interfaces with implementations
- NO abstract classes - composition over inheritance always
- Strict dependency injection - everything registered in DI container
- NO `any`, `object`, or `dynamic` types - explicit typing required
- ALL database operations must be async with proper cancellation tokens
- Repository pattern with IRepository<T> interfaces

**Naming Conventions:**
- Interfaces: `IBookService`, `IBookRepository`
- Implementations: `BookService`, `BookRepository`
- Controllers: `BooksController` (plural)
- Models: `Book`, `BookDto`, `CreateBookRequest`

**Required Attributes:**
- `[ApiController]` on all controllers
- `[Route("api/[controller]")]` for RESTful routing
- `[HttpGet]`, `[HttpPost]`, etc. on all actions
- `[Required]` and validation attributes on DTOs
- `[ProducesResponseType]` for OpenAPI documentation

**Entity Framework Patterns:**
- ALL database operations MUST be async with `CancellationToken`
- Use `.AsNoTracking()` for read-only queries
- Repository pattern: `IRepository<TEntity>` base interface
- DbContext registered as Scoped service
- Migrations named descriptively: `AddBookEntityWithIndexes`

**Error Handling:**
- Global exception handling middleware
- Structured logging with consistent JSON format
- Proper HTTP status codes (200, 201, 400, 404, 500)
- Never expose internal exception details to clients

### TypeScript Frontend Standards

**Mandatory Patterns:**
- Strict TypeScript mode enabled
- NO `any` or `unknown` types - explicit typing required
- All API calls through typed service interfaces
- Custom hooks for data fetching and state management
- Props interfaces for all components

**Component Structure:**
```typescript
interface BookListProps {
  books: Book[];
  onBookSelect: (book: Book) => void;
}

export const BookList: React.FC<BookListProps> = ({ books, onBookSelect }) => {
  // Implementation
};
```

**State Management:**
- Prefer Context API with useReducer for complex state
- Custom hooks for business logic extraction
- Proper error boundaries for error handling

### Logging Standards (Both Backend & Frontend)

**Mandatory JSON Format:**
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "ERROR|WARN|INFO|DEBUG",
  "appLayer": "Backend-API|Frontend-UI", 
  "sourceContext": "BooksController",
  "functionName": "GetBookById",
  "message": "Human readable message",
  "payload": { "key": "value" }
}
```

## Testing Standards

### Backend Tests (xUnit)
- Arrange-Act-Assert pattern
- One class per test subject
- Descriptive test method names: `GetBookById_WhenBookExists_ReturnsBook`
- Mock all external dependencies
- Test coverage minimum 80%

### Frontend Tests (Vitest + React Testing Library)
- Test user interactions, not implementation details
- Mock external API calls
- Test error states and loading states
- Accessibility testing with screen reader queries

## Project Architecture

### Backend Structure
```
backend/
├── src/
│   ├── LibraryApi/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── Repositories/
│   │   ├── Data/
│   │   └── Program.cs
│   └── LibraryApi.Tests/
└── LibraryApi.sln
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   └── main.tsx
├── tests/
└── package.json
```

## Development Workflow

1. **Phase-based Development**: Each feature goes through Product → Design → Implementation → Validation
2. **Test-First Approach**: Write tests before or immediately after implementation
3. **Mandatory Validation Gates**: ALL gates must pass before proceeding to next phase
4. **Code Reviews**: AI-assisted validation at each phase completion
5. **Documentation**: Update CHANGELOG.md after each significant change

## Mandatory Validation Gates

**CRITICAL**: No code advancement without ALL validation gates passing. Use the automated validation scripts for efficient execution with parallel processing.

### Backend Validation Script
```powershell
# Run complete backend validation pipeline (PowerShell)
.\backend\validate.ps1

# Options:
.\backend\validate.ps1 -SkipTests      # Skip test execution (development only)
.\backend\validate.ps1 -Verbose        # Show detailed output
```

**Script performs:**
1. **Lint & Build** - StyleCop + compilation (parallel where possible)
2. **Unit Tests & Coverage** - 80% minimum requirement
3. **Performance Analysis** - Static code analysis for async patterns, blocking calls
4. **Security Analysis** - Scans for hardcoded secrets, SQL injection risks

### Frontend Validation Script
```bash
# Run complete frontend validation pipeline (Node.js)
node frontend/validate.js

# Options:
node frontend/validate.js --skip-tests  # Skip test execution (development only)  
node frontend/validate.js --verbose     # Show detailed output
```

**Script performs:**
1. **Lint & Type Check** - ESLint + TypeScript strict (parallel execution)
2. **Build** - Production build with bundle analysis
3. **Unit Tests & Coverage** - 80% minimum requirement
4. **Performance Analysis** - Bundle size, React patterns
5. **Security Analysis** - Scans for hardcoded secrets, XSS risks, information disclosure

## Validation Gate Rules

### Non-Negotiable Requirements
1. **Zero Tolerance**: Any failure in validation gates = STOP development
2. **Fix Before Proceed**: All issues must be resolved before advancing
3. **Document Failures**: Log what failed and how it was resolved in CHANGELOG.md
4. **Re-run Full Suite**: After fixes, re-run entire validation sequence
5. **Approval Required**: Get explicit approval before proceeding to next phase

### Performance Evaluation Criteria
**Backend Performance:**
- All database operations are async with CancellationToken
- No .Wait() or .Result calls on async operations
- Repository queries use .AsNoTracking() for read-only operations
- Entity Framework queries are efficient (no N+1 problems)

**Frontend Performance:**
- Bundle size under reasonable limits (report if >500kb increase)
- Components use React.memo where appropriate
- No unnecessary re-renders (validate with React DevTools if needed)
- Lazy loading implemented for route-based code splitting

### Security Evaluation Criteria
**Backend Security:**
- No hardcoded connection strings, API keys, or secrets
- All user input validated with FluentValidation
- SQL queries use parameterized statements only
- Exception handling doesn't expose internal details
- Logging doesn't contain sensitive information

**Frontend Security:**
- No sensitive data in localStorage or client-side code
- API calls properly handle authentication tokens
- Error messages don't expose internal system details
- Form inputs sanitized appropriately
- Generated API client used (no manual fetch calls)

## Security Standards

- NO hardcoded secrets or connection strings
- Environment variables for all configuration
- Input validation on all API endpoints
- HTTPS only for production
- Proper CORS configuration
- SQL injection prevention through parameterized queries

## Type Safety & Contract Management

### OpenAPI-First Approach
- Backend automatically generates OpenAPI spec via Swagger
- Frontend generates TypeScript client from OpenAPI spec
- ALL API communication uses generated, strongly-typed client
- NO manual type definitions for API contracts
- Breaking API changes caught at compile time

### Frontend Client Generation
```bash
# Generate TypeScript client from backend OpenAPI spec
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:5000/swagger/v1/swagger.json \
  -g typescript-axios \
  -o src/generated/api
```

## Code Quality Configuration

### StyleCop Rules (Backend)
```xml
<!-- Directory.Build.props -->
<Project>
  <PropertyGroup>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <WarningsAsErrors />
    <WarningsNotAsErrors />
  </PropertyGroup>
  
  <ItemGroup>
    <PackageReference Include="StyleCop.Analyzers" Version="1.1.118">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>analyzers</IncludeAssets>
    </PackageReference>
  </ItemGroup>
</Project>

<!-- stylecop.json -->
{
  "$schema": "https://raw.githubusercontent.com/DotNetAnalyzers/StyleCopAnalyzers/master/StyleCop.Analyzers/StyleCop.Analyzers/Settings/stylecop.schema.json",
  "settings": {
    "documentationRules": {
      "companyName": "Library API",
      "copyrightText": "Copyright (c) {companyName}. All rights reserved."
    },
    "orderingRules": {
      "usingDirectivesPlacement": "outsideNamespace"
    }
  }
}
```

### TypeScript Strict Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

## Performance Standards

- Async/await for all I/O operations
- React.memo for expensive components
- Lazy loading for route-based code splitting
- EF Core .AsNoTracking() for read-only queries
- Proper database indexing on frequently queried fields