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

## 🚨 CRITICAL: Code Quality & Linting Standards

### TypeScript Standards
**CRITICAL: Never use `any` or `unknown` types** - These are strictly forbidden and will cause build failures:

```typescript
// ❌ NEVER do this - will cause ESLint error
const data: any = response;
const handleEvent = (event: any) => {};
const config: unknown = settings;
const result: Record<string, unknown> = data;

// ✅ ALWAYS use specific types first
interface User { id: string; name: string; }
const data: User = response;
const handleEvent = (event: React.MouseEvent<HTMLButtonElement>) => {};
const config: AppConfig = settings;

// ✅ Use specific union types when multiple types are valid
const id: string | number = getId();

// ✅ Use generics for reusable components
function processData<T>(data: T): T { return data; }

// ✅ For external APIs, use specific Record types
const firestoreData: Record<string, string | number | boolean | Date> = {};
const errorDetails: Record<string, string | number> = {};

// ✅ For state setters, use proper generic constraints
const setState: (partial: Partial<StateType>) => void = set;

// ✅ Only use unknown as last resort with proper type guards
const unknownData: unknown = JSON.parse(untrustedInput);
if (typeof unknownData === 'object' && unknownData !== null) {
  // Now safely narrow the type
}
```

### Mandatory Function Return Types
**ALL functions must have explicit return types** to prevent accidental type inference issues:

```typescript
// ❌ BAD - Missing return type
const handleSubmit = async (e: React.FormEvent) => {
  // Implementation
};

const addGenre = (genre: string) => {
  // Implementation  
};

// ✅ GOOD - Explicit return types
const handleSubmit = async (e: React.FormEvent): Promise<void> => {
  // Implementation
};

const addGenre = (genre: string): void => {
  // Implementation
};

const fetchData = async (): Promise<ApiResponse> => {
  // Implementation
};

const computeTotal = (items: Item[]): number => {
  // Implementation
};
```

### Promise Handling Standards
**All promises must be explicitly handled** - never let promises float:

```typescript
// ❌ BAD - Floating promise
searchBooks(query);
navigate('/books');

// ✅ GOOD - Explicit void for fire-and-forget
void searchBooks(query);
void navigate('/books');

// ✅ GOOD - Proper await in async context
await searchBooks(query);
await navigate('/books');

// ✅ GOOD - Explicit catch for error handling  
searchBooks(query).catch(console.error);
```

### Console Statement Standards
**Console statements require explicit ESLint disable comments**:

```typescript
// ❌ BAD - Naked console statement
console.error('Failed to load data:', error);

// ✅ GOOD - Properly annotated for linting
// eslint-disable-next-line no-console
console.error('Failed to load data:', error);

// ✅ BETTER - Use proper logging in production
logger.error('Failed to load data:', error);
```

### Nullish Coalescing Standards
**Use nullish coalescing (`??`) instead of logical OR (`||`) for null/undefined checks**:

```typescript
// ❌ BAD - Logical OR can cause issues with falsy values
const title = book.title || 'Untitled';
const isbn = book.isbn || undefined;
const author = book.author || 'Unknown';

// ✅ GOOD - Nullish coalescing handles null/undefined correctly
const title = book.title ?? 'Untitled';  
const isbn = book.isbn ?? undefined;
const author = book.author ?? 'Unknown';
```

### Optional Chaining Standards
**Use optional chaining consistently and avoid unnecessary chains**:

```typescript
// ❌ BAD - Unnecessary optional chain when type is already checked
if (array && array.length > 0) {
  for (const item of array) {
    if (item?.property) { // Unnecessary - item is guaranteed non-null in this context
      // ...
    }
  }
}

// ✅ GOOD - Proper optional chaining usage
if (data?.items?.length > 0) {
  // Use when null/undefined checks are needed
}

const firstItem = data?.items?.[0];
const property = object?.nested?.property;
```

### Dead Code Elimination
**CRITICAL: Delete unused code immediately - never use underscore prefixes or comments**:

```typescript
// ❌ BAD - Don't prefix unused parameters
function handleClick(_event: MouseEvent, data: string) {
  console.log(data);
}

// ❌ BAD - Don't comment out unused code
// const oldFunction = () => {
//   return 'unused';
// };

// ✅ GOOD - Remove unused parameters completely
function handleClick(data: string) {
  console.log(data);
}

// ✅ GOOD - Delete unused code entirely (version control handles history)
```

### CRITICAL: Never Use setTimeout for Logic Flow
**NEVER use setTimeout to fix timing issues or coordinate component behavior.** This creates non-deterministic behavior and race conditions. Instead:

```typescript
// ❌ BAD - Using setTimeout to fix timing issues
const handleSubmit = () => {
  setLoading(true);
  setTimeout(() => {
    submitData(); // This is a hack that masks the real problem
  }, 100);
};

// ✅ GOOD - Proper React state management
const handleSubmit = useCallback(async () => {
  setLoading(true);
  try {
    await submitData(); // Deterministic async handling
  } finally {
    setLoading(false);
  }
}, []);

// ✅ GOOD - Use useEffect with proper dependencies
useEffect(() => {
  if (shouldTriggerAction) {
    performAction();
  }
}, [shouldTriggerAction]);
```

### ESLint Configuration Enforcement
The project enforces strict linting rules:

- **`@typescript-eslint/no-explicit-any`: 'error'** - Strictly forbids `any` type usage
- **`@typescript-eslint/explicit-function-return-type`: 'error'** - Requires explicit return types
- **`@typescript-eslint/no-floating-promises`: 'error'** - Prevents unhandled promises  
- **`@typescript-eslint/prefer-nullish-coalescing`: 'error'** - Enforces `??` over `||`
- **`@typescript-eslint/prefer-optional-chain`: 'error'** - Enforces optional chaining patterns
- **`no-console`: 'warn'** - Requires explicit disable comments for console usage
- **`@typescript-eslint/no-unused-vars`: 'error'** - Prevents unused variables

**ALL linting errors must be fixed before code can be merged. Zero tolerance policy.**

### Validation Workflow
**CRITICAL: ALWAYS run full validation after making changes:**

```bash
# Frontend validation (run from frontend/ directory)
npm run lint          # Must pass with zero warnings/errors
npm run type-check     # Must pass TypeScript compilation  
npm run build         # Must build successfully
npm run test          # Must pass all tests

# Backend validation (run from backend/ directory)  
dotnet format --verify-no-changes  # Must pass formatting check
dotnet build                       # Must compile successfully
dotnet test                        # Must pass all tests
```

**If any validation step fails, STOP and fix the issues before proceeding.**

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

## 📋 CRITICAL: Change Log Management

**MANDATORY REQUIREMENT**: Maintain a comprehensive change log for all code modifications in `CHANGELOG.md`.

### Change Log Requirements
- **Location**: `CHANGELOG.md` in project root (already exists and maintained)
- **Required for all changes**: Document what was changed, why, and when
- **Format**: Use semantic versioning with clear, detailed descriptions
- **Update frequency**: After every significant code change, bug fix, or feature addition
- **Purpose**: Track code evolution to debug regressions and understand system changes

### Change Log Format
```markdown
## [Unreleased] - YYYY-MM-DD

### Added
- New features and capabilities

### Changed  
- Modifications to existing functionality

### Fixed
- Bug fixes and problem resolutions
- Include root cause analysis for critical issues
- Document process improvements (e.g., npm script enhancements)

### Enhanced
- Performance improvements and optimizations
- Development workflow improvements
- Testing enhancements
```

### Required Details for Each Entry
1. **What changed**: Specific components, files, or functionality affected
2. **Why it changed**: Root cause analysis for bugs, business requirements for features  
3. **How it was fixed**: Technical solution and approach taken
4. **Impact**: How the change affects users, developers, or system behavior
5. **Verification**: Testing approach and validation steps taken

### Example Entry
```markdown
### Fixed  
- **Case-Sensitive Search Issue**: Resolved critical search functionality problem
  - **Root Cause**: BookRepository search used exact string matching (`Contains()`)
  - **Issue Impact**: Users typing lowercase searches received no results  
  - **Solution**: Updated to case-insensitive matching with `.ToLower().Contains()`
  - **Process Issue**: McAfee antivirus locking processes prevented deployment
  - **Process Fix**: Added automatic process cleanup to npm scripts
  - **Testing**: Added 8 comprehensive unit tests covering all case scenarios
  - **Verification**: Confirmed search works with all case variations and patterns
```

### Benefits of Detailed Change Logs
- **Debugging**: Quickly identify when functionality broke and why
- **Knowledge Transfer**: New team members understand system evolution  
- **Regression Prevention**: Document known issues and their solutions
- **Process Improvement**: Track and learn from development workflow issues
- **Stakeholder Communication**: Provide clear progress and issue resolution updates

**Remember: Every significant change should update the CHANGELOG.md before code review/merge.**

## File Organization Standards

### Test Co-location Requirements
- **Tests must always be co-located** with the code they test
- Examples:
  - `src/components/BookCard.tsx` → `src/components/BookCard.test.tsx`  
  - `src/services/bookService.ts` → `src/services/__tests__/bookService.test.ts`
- All new components require corresponding tests
- Integration tests should be in `src/__tests__/integration/`
- E2E tests should be in `tests/e2e/`

### File Size Limits
- Keep files under 500 lines maximum
- Use index files for clean imports
- Group related functionality in directories  
- Follow atomic design principles for components

### Import Organization
```typescript
// ✅ GOOD - Proper import order
// 1. Node modules
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Internal utilities and types  
import { Book } from '../generated/api';
import { validateForm } from '../utils/validation';

// 3. Components (same directory, then relative)
import BookCard from './BookCard';
import { LoadingSpinner } from '../shared/LoadingSpinner';

// 4. Hooks and services
import { useBooks } from '../hooks/useBooks';
import { bookService } from '../services/bookService';
```