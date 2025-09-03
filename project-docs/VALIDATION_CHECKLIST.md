# Mandatory Validation Gates Checklist

This checklist must be completed 100% successfully before advancing any coding phase. Any failure requires immediate halt, fix, and re-validation.

## Pre-Coding Phase Setup

- [ ] All dependencies installed and up to date
- [ ] Development environment configured correctly
- [ ] Database migrations applied (if applicable)
- [ ] Environment variables configured properly

## Backend Validation Gates

### 1. Lint & Code Analysis
```bash
dotnet build --configuration Release --verbosity minimal
```
- [ ] ✅ StyleCop analysis passes (zero warnings/errors)
- [ ] ✅ Code compilation successful 
- [ ] ✅ No TreatWarningsAsErrors violations
- [ ] ✅ All interface implementations correct

**If failed:** 
- [ ] Document specific errors in CHANGELOG.md
- [ ] Fix all StyleCop violations
- [ ] Re-run validation sequence from step 1

### 2. Unit Tests & Coverage
```bash
dotnet test --configuration Release --collect:"XPlat Code Coverage"
```
- [ ] ✅ All unit tests pass (100% success rate)
- [ ] ✅ Test coverage ≥ 80% line coverage
- [ ] ✅ All service methods tested with mocks
- [ ] ✅ All controller endpoints tested
- [ ] ✅ Error scenarios covered

**If failed:**
- [ ] Document failing tests and coverage gaps
- [ ] Write additional tests for uncovered code
- [ ] Fix failing test implementations
- [ ] Re-run validation sequence from step 1

### 3. Performance Evaluation
- [ ] ✅ All database operations use async/await with CancellationToken
- [ ] ✅ Read-only queries use .AsNoTracking()
- [ ] ✅ No .Wait() or .Result blocking calls found
- [ ] ✅ Entity Framework queries are efficient (no N+1)
- [ ] ✅ Repository pattern correctly implemented

**If failed:**
- [ ] Document performance issues found
- [ ] Refactor blocking calls to async
- [ ] Add .AsNoTracking() to read-only operations
- [ ] Re-run validation sequence from step 1

### 4. Security Evaluation
- [ ] ✅ No hardcoded connection strings or secrets
- [ ] ✅ All user input validated with FluentValidation
- [ ] ✅ SQL queries use parameterized statements only
- [ ] ✅ Exception handling doesn't expose internal details
- [ ] ✅ Logging contains no sensitive information
- [ ] ✅ Proper HTTP status codes returned

**If failed:**
- [ ] Document security violations found
- [ ] Remove hardcoded secrets, use environment variables
- [ ] Add input validation where missing
- [ ] Fix SQL injection vulnerabilities
- [ ] Re-run validation sequence from step 1

## Frontend Validation Gates

### 1. Lint & Type Checking
```bash
npm run lint && npm run type-check
```
- [ ] ✅ ESLint passes with zero warnings/errors
- [ ] ✅ TypeScript strict mode validation passes
- [ ] ✅ No `any` or `unknown` types found
- [ ] ✅ All component props properly typed

**If failed:**
- [ ] Document linting and type errors
- [ ] Fix all ESLint violations
- [ ] Add proper TypeScript types
- [ ] Re-run validation sequence from step 1

### 2. Build Validation
```bash
npm run build
```
- [ ] ✅ Production build completes successfully
- [ ] ✅ No build warnings or errors
- [ ] ✅ Bundle size within acceptable limits
- [ ] ✅ All dynamic imports work correctly

**If failed:**
- [ ] Document build failures
- [ ] Fix build errors and warnings
- [ ] Optimize bundle size if excessive
- [ ] Re-run validation sequence from step 1

### 3. Unit Tests & Coverage
```bash
npm run test:coverage
```
- [ ] ✅ All unit tests pass (100% success rate)
- [ ] ✅ Test coverage ≥ 80% line coverage
- [ ] ✅ All components tested with various props
- [ ] ✅ Custom hooks tested with different scenarios
- [ ] ✅ Error boundaries and error states tested

**If failed:**
- [ ] Document failing tests and coverage gaps
- [ ] Write additional component tests
- [ ] Fix failing test implementations
- [ ] Re-run validation sequence from step 1

### 4. Performance Evaluation
- [ ] ✅ Bundle size impact is acceptable (no >500KB increases)
- [ ] ✅ React.memo used for expensive components
- [ ] ✅ Lazy loading implemented for route components
- [ ] ✅ No unnecessary re-renders detected
- [ ] ✅ Generated API client used throughout

**If failed:**
- [ ] Document performance issues
- [ ] Implement React.memo where needed
- [ ] Add lazy loading for heavy components
- [ ] Optimize re-render patterns
- [ ] Re-run validation sequence from step 1

### 5. Security Evaluation
- [ ] ✅ No hardcoded API endpoints or secrets in code
- [ ] ✅ Generated API client used (no manual fetch)
- [ ] ✅ Error handling doesn't expose sensitive data
- [ ] ✅ Form inputs properly sanitized
- [ ] ✅ Authentication tokens handled securely

**If failed:**
- [ ] Document security violations
- [ ] Remove hardcoded endpoints/secrets
- [ ] Fix error message exposure
- [ ] Add input sanitization
- [ ] Re-run validation sequence from step 1

## Phase Completion Requirements

- [ ] ✅ ALL backend validation gates passed
- [ ] ✅ ALL frontend validation gates passed  
- [ ] ✅ Any failures documented in CHANGELOG.md with resolutions
- [ ] ✅ Complete validation sequence re-run after all fixes
- [ ] ✅ Code committed with descriptive commit message
- [ ] ✅ Phase approval obtained before proceeding

## Emergency Procedures

### If Multiple Validation Failures:
1. **STOP ALL DEVELOPMENT** immediately
2. Document all failures comprehensively
3. Prioritize fixes: Security → Build → Tests → Performance
4. Fix issues one category at a time
5. Re-run complete validation after each category fix
6. Do not proceed until ALL gates pass

### If Recurring Failures:
1. Review architectural decisions 
2. Consider refactoring approach
3. Seek additional technical guidance
4. Document lessons learned for future phases

## Sign-off

**Phase:** _______________  
**Date:** _______________  
**All Gates Passed:** [ ] YES / [ ] NO  
**Issues Found:** _______________  
**Resolutions Applied:** _______________  
**Ready for Next Phase:** [ ] YES / [ ] NO