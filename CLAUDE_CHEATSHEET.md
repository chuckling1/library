# 🚨 CLAUDE DEVELOPMENT CHEATSHEET 🚨

## MANDATORY BEFORE ANY COMMIT
- [ ] **Run validation scripts**: `.\backend\validate.ps1` AND `node frontend/validate.js`
- [ ] **ALL validation gates must pass** (lint, build, test, coverage 80%+)
- [ ] **Update CHANGELOG.md** after every significant change
- [ ] **Zero tolerance**: ANY failure = STOP development immediately

## OpenAPI-FIRST APPROACH (CRITICAL)
- [ ] **Backend auto-generates OpenAPI** via Swagger in Development mode
- [ ] **Frontend MUST use generated client** (`npm run generate-client`)
- [ ] **NO manual type definitions** - only generated types allowed
- [ ] **Breaking changes caught at compile time**

## TESTING REQUIREMENTS
- [ ] **80% minimum test coverage** (both backend + frontend)
- [ ] **xUnit** for backend, **Vitest + React Testing Library** for frontend
- [ ] **Write tests immediately after implementation**
- [ ] **Run tests with coverage**: `dotnet test --collect:"XPlat Code Coverage"`

## CODE STANDARDS (NON-NEGOTIABLE)
### Backend:
- [ ] **Interfaces for everything**: IBookService, IBookRepository
- [ ] **NO abstract classes** - composition over inheritance
- [ ] **Async/await with CancellationToken** for all I/O
- [ ] **Repository pattern** with dependency injection

### Frontend:
- [ ] **Strict TypeScript** - NO `any` types allowed
- [ ] **Generated API client only** - no manual fetch calls
- [ ] **React Query** for API state management
- [ ] **Custom hooks** for business logic

## VALIDATION GATE SEQUENCE
1. **Lint + Type Check** (parallel execution)
2. **Build** (production build)
3. **Tests + Coverage** (80% minimum)
4. **Performance Analysis** (async patterns, bundle size)
5. **Security Analysis** (no hardcoded secrets, XSS prevention)

## LATEST VERSIONS REQUIRED
- ✅ .NET 9.0, React 19.1, TypeScript 5.7+, Vite 6+
- ✅ Always verify latest stable before implementation

## IMMEDIATE ACTION ITEMS
- [ ] Fix frontend test setup (jsdom, TypeScript config)
- [ ] Write tests for BookCard, BookListPage, useBooks hook
- [ ] Run validation scripts before proceeding