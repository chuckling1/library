# Architecture Documentation

## System Overview

The Book Library Application follows a modern full-stack architecture with clean separation of concerns, implementing Domain-Driven Design principles with a focus on maintainability, testability, and scalability.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   React SPA     │────│  .NET Core API  │────│   SQLite DB     │
│   (Frontend)    │HTTP│   (Backend)     │EF  │   (Database)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
   ┌────▼────┐              ┌────▼────┐              ┌────▼────┐
   │ Vite    │              │ Swagger │              │ Migrations │
   │ Dev     │              │ UI      │              │ & Seeding  │
   │ Server  │              │         │              │            │
   └─────────┘              └─────────┘              └─────────────┘
```

## Backend Architecture (.NET Core)

### Layered Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Controllers   │  │   Middleware    │  │   Swagger    │ │
│  │   - BooksCtrl   │  │   - Auth        │  │   - OpenAPI  │ │
│  │   - UserCtrl    │  │   - Error       │  │   - UI       │ │
│  │   - BulkCtrl    │  │   - Logging     │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Business Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │    Services     │  │      DTOs       │  │  Validation  │ │
│  │  - BookService  │  │  - Requests     │  │  - Rules     │ │
│  │  - UserService  │  │  - Responses    │  │  - Fluent    │ │
│  │  - BulkService  │  │  - Models       │  │  - Custom    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Repositories   │  │   DbContext     │  │   Entities   │ │
│  │  - BookRepo     │  │  - Library      │  │   - Book     │ │
│  │  - UserRepo     │  │  - Config       │  │   - User     │ │
│  │  - Interfaces   │  │  - Migrations   │  │   - Genre    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Injection Container

```csharp
// Service Registration Pattern
services.AddScoped<IBookService, BookService>();
services.AddScoped<IBookRepository, BookRepository>();
services.AddScoped<IUserService, UserService>();
services.AddScoped<IUserRepository, UserRepository>();
services.AddScoped<IBulkImportService, BulkImportService>();
```

### Key Components

#### Controllers
- **BooksController**: CRUD operations, filtering, pagination
- **AuthController**: httpOnly cookie authentication, registration, user management  
- **BulkImportController**: CSV import/export operations
- **Health checks**: System status and readiness endpoints

#### Services (Business Logic)
- **BookService**: Business rules, validation, user isolation
- **UserService**: Authentication, JWT token management, httpOnly cookie handling
- **SecurityEventService**: Security event logging for authentication activities
- **BulkImportService**: CSV processing, duplicate detection
- **StatsService**: Analytics and reporting calculations

#### Repositories (Data Access)
- **BookRepository**: Database queries with user filtering
- **UserRepository**: User management and authentication queries
- **Generic Repository Pattern**: Shared CRUD operations

#### Data Models
- **Book Entity**: Core domain model with relationships
- **User Entity**: Authentication and user management
- **DTOs**: Request/Response objects for API contracts

## Frontend Architecture (React)

### Component Architecture

```
src/
├── components/              # Reusable UI Components
│   ├── BookCard.tsx         # Individual book display
│   ├── BookForm.tsx         # Book creation/editing
│   ├── GenreFilter.tsx      # Genre filtering component  
│   ├── ResultsBar.tsx       # Search results display
│   ├── LoadingSpinner.tsx   # Loading states
│   └── ErrorBoundary.tsx    # Error handling
│
├── pages/                   # Route-based page components
│   ├── BookListPage.tsx     # Main book collection view
│   ├── BookFormPage.tsx     # Book create/edit pages
│   ├── StatisticsPage.tsx   # Analytics dashboard
│   └── LoginPage.tsx        # User authentication
│
├── hooks/                   # Custom React hooks
│   ├── useBooks.ts          # Book data management
│   ├── useAuth.ts           # Authentication state
│   ├── useBulkImport.ts     # CSV operations
│   └── useGenreDistribution.ts  # Statistics data
│
├── services/                # API integration layer
│   ├── bookService.ts       # Book API calls
│   ├── userService.ts       # Authentication API
│   ├── apiClient.ts         # HTTP client configuration
│   └── generated/           # Auto-generated API client
│
├── types/                   # TypeScript definitions
│   ├── api.ts              # Generated API types
│   ├── auth.ts             # Authentication types
│   └── common.ts           # Shared type definitions
│
└── utils/                   # Utility functions
    ├── validation.ts        # Form validation
    ├── formatting.ts        # Data formatting
    └── constants.ts         # Application constants
```

### State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application State                        │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │      Auth       │  │      Books      │  │  UI State    │ │
│  │   - JWT Token   │  │   - Collection  │  │  - Loading   │ │
│  │   - User Info   │  │   - Filters     │  │  - Errors    │ │
│  │   - Login State │  │   - Pagination  │  │  - Modals    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│         │                       │                    │      │
│    ┌────▼────┐            ┌─────▼─────┐        ┌─────▼────┐ │
│    │ Context │            │ React     │        │ Local    │ │
│    │ API     │            │ Query     │        │ State    │ │
│    └─────────┘            └───────────┘        └──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### React Query Integration

- **Server State**: React Query manages all server-side data
- **Caching**: Automatic caching with smart invalidation
- **Background Updates**: Stale-while-revalidate strategy  
- **Error Handling**: Centralized error states and retry logic
- **Optimistic Updates**: Immediate UI updates with rollback

## Database Schema

### Entity Relationship Diagram

```sql
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      Users      │    │      Books      │    │   BookGenres    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ Id (PK)         │    │ Id (PK)         │    │ BookId (FK)     │
│ Username        │    │ UserId (FK)     │────│ Genre           │
│ Email           │    │ Title           │    └─────────────────┘
│ PasswordHash    │    │ Author          │
│ CreatedAt       │    │ PublishedDate   │
│ UpdatedAt       │    │ Rating          │
└─────────────────┘    │ Edition         │
                       │ ISBN            │
                       │ CreatedAt       │
                       │ UpdatedAt       │
                       └─────────────────┘
```

### Database Indexes

```sql
-- User isolation and performance
CREATE INDEX IX_Books_UserId ON Books (UserId);
CREATE INDEX IX_Books_UserId_Title ON Books (UserId, Title);
CREATE INDEX IX_Books_UserId_Rating ON Books (UserId, Rating);
CREATE INDEX IX_Books_UserId_PublishedDate ON Books (UserId, PublishedDate);

-- Search and filtering  
CREATE INDEX IX_Books_Title ON Books (Title);
CREATE INDEX IX_Books_Author ON Books (Author);
CREATE INDEX IX_BookGenres_Genre ON BookGenres (Genre);

-- Authentication
CREATE UNIQUE INDEX IX_Users_Username ON Users (Username);
CREATE UNIQUE INDEX IX_Users_Email ON Users (Email);
```

### Multi-Tenancy Strategy

**User Data Isolation**:
- Every book operation includes `UserId` filter
- Repository pattern ensures automatic user scoping
- JWT claims provide authenticated user context
- No cross-user data leakage possible

## Security Architecture

### Authentication Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Frontend  │    │   Backend   │    │  Database   │
│   Browser   │    │    React    │    │  .NET API   │    │   SQLite    │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
   1.  │  Login Request   │                  │                  │
       ├─────────────────▶│                  │                  │
   2.  │                  │ POST /api/Auth/login │              │
       │                  │ (credentials: include) │            │
       │                  ├─────────────────▶│                  │
   3.  │                  │                  │ Verify Password  │
       │                  │                  ├─────────────────▶│
   4.  │                  │                  │ User Data        │
       │                  │                  │◀─────────────────┤
   5.  │                  │ Response + Set   │                  │
       │                  │ httpOnly Cookie  │                  │
       │                  │◀─────────────────┤                  │
   6.  │ httpOnly Cookie  │                  │                  │
       │ Set Automatically│                  │                  │
       │◀─────────────────┤                  │                  │
   7.  │                  │ Auth Required Request │             │
       │                  │ (credentials: include) │            │
       │                  ├─────────────────▶│                  │
   8.  │                  │                  │ Extract JWT from │
       │                  │                  │ auth-token Cookie│
       │                  │                  │ Validate & Extract UserId │
   9.  │                  │                  │ Query w/ UserId  │
       │                  │                  ├─────────────────▶│
  10.  │                  │   User Data      │                  │
       │                  │◀─────────────────┤                  │
```

### Security Features

**httpOnly Cookie JWT Security**:
- HS256 signing algorithm  
- 24-hour expiration matching cookie expiration
- User claims embedded (UserId, Email)
- Secure httpOnly cookies (JavaScript cannot access)
- Automatic cookie management by backend
- CORS configured with AllowCredentials for cross-origin cookie support

**Password Security**:  
- BCrypt hashing with salt
- Minimum complexity requirements
- No password storage in plain text

**API Security**:
- CORS configuration with AllowCredentials for httpOnly cookies
- httpOnly cookie prevents XSS token theft
- Input validation and sanitization
- SQL injection prevention via EF parameterized queries
- XSS prevention via proper encoding and httpOnly cookies
- Security event logging for authentication activities

**Data Privacy**:
- Complete user data isolation
- No cross-user data access possible
- Audit trail via CreatedAt/UpdatedAt timestamps

## Performance Considerations

### Backend Optimization

**Database Performance**:
- Strategic indexing on filter columns
- Async/await pattern throughout
- EF Core `.AsNoTracking()` for read-only queries
- Efficient pagination with `Skip()` and `Take()`

**Memory Management**:
- Disposed DbContext instances
- Minimal object allocation in hot paths
- CSV streaming for large file imports

### Frontend Optimization

**Bundle Performance**:
- Code splitting by routes
- Tree shaking of unused code
- Production build optimization via Vite
- Asset compression and caching

**Runtime Performance**:
- React.memo for expensive components
- useCallback/useMemo for expensive calculations
- Virtual scrolling for large lists (planned)
- Debounced search inputs

**Network Optimization**:
- React Query caching strategy
- Background data fetching
- Optimistic updates
- Request deduplication

## Design Patterns

### Backend Patterns

**Repository Pattern**:
```csharp
public interface IBookRepository
{
    Task<PaginatedResponse<Book>> GetBooksAsync(string userId, BookFilterRequest request);
    Task<Book?> GetBookByIdAsync(string bookId, string userId);
    Task<Book> CreateBookAsync(Book book);
    Task<Book> UpdateBookAsync(Book book);
    Task DeleteBookAsync(string bookId, string userId);
}
```

**Service Layer Pattern**:
```csharp
public interface IBookService
{
    Task<PaginatedResponse<BookDto>> GetBooksAsync(string userId, BookFilterRequest request);
    Task<BookDto> CreateBookAsync(string userId, CreateBookRequest request);
    Task<BookDto> UpdateBookAsync(string userId, string bookId, UpdateBookRequest request);
    Task DeleteBookAsync(string userId, string bookId);
}
```

**Unit of Work Pattern**:
- DbContext serves as Unit of Work
- Transaction management for complex operations
- Change tracking and batch saves

### Frontend Patterns

**Custom Hooks Pattern**:
```typescript
export const useBooks = (filters: BookFilters) => {
  return useQuery({
    queryKey: ['books', filters],
    queryFn: () => bookService.getBooks(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

**Compound Component Pattern**:
```typescript
<BookCard>
  <BookCard.Image src={book.coverUrl} />
  <BookCard.Content>
    <BookCard.Title>{book.title}</BookCard.Title>
    <BookCard.Author>{book.author}</BookCard.Author>
  </BookCard.Content>
</BookCard>
```

**Provider Pattern**:
```typescript
<AuthProvider>
  <QueryProvider>
    <Router>
      <App />
    </Router>
  </QueryProvider>
</AuthProvider>
```

## Error Handling Architecture

### Backend Error Strategy

**Global Exception Middleware**:
```csharp
public class GlobalExceptionMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }
}
```

**Structured Error Responses**:
```json
{
  "error": "ValidationFailed",
  "message": "One or more validation errors occurred",
  "details": [
    { "field": "title", "message": "Title is required" }
  ],
  "timestamp": "2025-09-07T10:00:00Z",
  "traceId": "0HMVD0J4K7QAC:00000001"
}
```

### Frontend Error Strategy

**Error Boundaries**:
- React Error Boundary for component tree errors
- Graceful fallback UI with retry options
- Development vs production error details

**API Error Handling**:
- React Query error handling with retry logic
- User-friendly error messages
- Form validation error display

## Deployment Architecture

### Development Environment
```
┌─────────────────┐    ┌─────────────────┐
│   Vite Dev      │    │   .NET Dev      │
│   Server        │    │   Server        │
│   :3000         │    │   :5000         │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
                     │
            ┌─────────────────┐
            │   SQLite        │
            │   File DB       │
            └─────────────────┘
```

### Production Environment (Docker)
```
┌─────────────────────────────────────────┐
│              Docker Host                │
│  ┌─────────────────┐ ┌─────────────────┐│
│  │   Nginx         │ │   .NET API      ││
│  │   Reverse       │ │   Container     ││
│  │   Proxy         │ │   :8080         ││
│  │   :80           │ │                 ││
│  └─────────────────┘ └─────────────────┘│
│           │                    │        │
│           └────────────────────┘        │
│                    │                    │
│         ┌─────────────────┐             │
│         │   SQLite        │             │
│         │   Volume        │             │
│         └─────────────────┘             │
└─────────────────────────────────────────┘
```

## Monitoring and Observability

### Logging Strategy

**Structured Logging (Serilog)**:
```json
{
  "timestamp": "2025-09-07T10:00:00.000Z",
  "level": "INFO",
  "appLayer": "Backend-API", 
  "sourceContext": "BooksController",
  "functionName": "GetBooks",
  "message": "Retrieved books for user",
  "payload": {
    "userId": "user123",
    "filterCount": 2,
    "resultCount": 15
  }
}
```

**Health Monitoring**:
- `/health` - Basic health check
- `/health/ready` - Application readiness
- `/health/live` - Liveness probe
- Database connectivity checks

### Performance Monitoring

**Metrics Collection**:
- Request duration and throughput
- Database query performance
- Memory usage and GC metrics
- Error rates and types

**Alerting Thresholds**:
- Response time > 2 seconds
- Error rate > 5%
- Database connection failures
- Memory usage > 80%

This architecture provides a solid foundation for maintainable, scalable, and secure application development while following industry best practices and modern design patterns.