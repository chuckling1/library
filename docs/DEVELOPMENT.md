# Development Guidelines

## Overview

This document provides comprehensive development guidelines for the Book Library application, covering setup, workflow, standards, and best practices for maintaining code quality and consistency.

## Development Environment Setup

### Prerequisites

**Required Dependencies:**
- **Node.js**: 22+ LTS (latest stable recommended)
- **.NET SDK**: 9+ (latest stable recommended)  
- **Git**: Latest version
- **Code Editor**: VS Code recommended with extensions listed below

**Optional but Recommended:**
- **Docker Desktop**: For containerized development
- **SQLite Browser**: For database inspection
- **Postman/Insomnia**: For API testing

### Automated Setup

```bash
# One-command complete environment reset (recommended)
npm run setup

# Performs comprehensive fresh start: environment check, process cleanup,
# complete clean of artifacts/dependencies, database reset, fresh install,
# build validation, and auto-starts development servers
# WARNING: This is destructive - resets entire development environment
```

### Manual Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd library

# 2. Install dependencies
npm install                    # Root package scripts
cd backend && dotnet restore   # Backend dependencies  
cd ../frontend && npm install  # Frontend dependencies

# 3. Build projects
npm run build                  # Build both projects
npm run validate               # Run full validation suite
```

### IDE Configuration

**VS Code Extensions (Recommended):**
```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-dotnettools.csharp",
    "ms-dotnettools.csdevkit", 
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

**VS Code Settings:**
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[csharp]": {
    "editor.defaultFormatter": "ms-dotnettools.csharp"
  },
  "files.exclude": {
    "**/bin": true,
    "**/obj": true,
    "**/node_modules": true,
    "**/dist": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Development Workflow

### Daily Development Process

**1. Start Development Servers**
```bash
# Start both frontend and backend
npm run dev

# Or start separately for debugging
npm run dev:frontend  # React dev server (http://localhost:3000)
npm run dev:backend   # .NET API server (http://localhost:5000)
```

**2. Development URLs**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Swagger UI**: http://localhost:5000/swagger
- **Database File**: `./library.db`

**3. Make Changes**
- Frontend changes: Hot reload automatically
- Backend changes: Automatic restart with dotnet watch
- Database changes: Create migrations as needed

**4. Validation Before Commit**
```bash
# CRITICAL: Always run validation before committing
npm run validate

# This runs:
# - Backend: Format check, build, tests, StyleCop compliance
# - Frontend: Lint, type check, build, tests  
# - ZERO warnings policy enforced
```

### Git Workflow

**Branch Strategy:**
- `main`: Production-ready code only
- Feature branches: `feature/description` 
- Bug fixes: `bugfix/description`
- Hotfixes: `hotfix/description`

**Commit Process:**
```bash
# 1. Create feature branch
git checkout -b feature/book-favorites

# 2. Make changes and validate
npm run validate  # MUST pass with zero warnings

# 3. Commit with descriptive message
git add .
git commit -m "feat: add favorites functionality to book management

- Add favorite toggle button to BookCard component
- Implement favorites API endpoints with user isolation  
- Add favorites filter to book list page
- Include comprehensive test coverage for new functionality"

# 4. Push and create pull request (if applicable)
git push origin feature/book-favorites
```

### Code Generation Workflow

**API Client Regeneration:**
```bash
# After backend API changes
cd frontend
npm run generate-client

# This regenerates TypeScript client from OpenAPI spec
# Commit the generated files along with your changes
```

**Database Migrations:**
```bash
# After entity model changes
cd backend
dotnet ef migrations add DescriptiveMigrationName --project src/LibraryApi
dotnet ef database update --project src/LibraryApi

# Commit migration files to version control
```

## Coding Standards

### Backend C# Standards

**Mandatory Patterns:**
```csharp
// ✅ GOOD - All services must be interfaces
public interface IBookService 
{
    Task<BookDto> GetBookAsync(string userId, string bookId, CancellationToken cancellationToken = default);
}

public class BookService : IBookService
{
    private readonly IBookRepository bookRepository;
    
    public BookService(IBookRepository bookRepository) 
    {
        this.bookRepository = bookRepository;
    }

    public async Task<BookDto> GetBookAsync(string userId, string bookId, CancellationToken cancellationToken = default)
    {
        // Implementation with proper user isolation
        var book = await this.bookRepository.GetBookByIdAsync(bookId, userId, cancellationToken);
        return this.MapToDto(book);
    }
}
```

**StyleCop Compliance (CRITICAL):**
```csharp
// ✅ REQUIRED patterns for zero warnings
using System;                    // Using directives inside namespace
using System.Threading.Tasks;

namespace LibraryApi.Services     // Namespace declaration
{
    /// <summary>
    /// Service for managing book operations.
    /// </summary>
    public class BookService : IBookService  // XML documentation required
    {
        private readonly IBookRepository bookRepository;  // this. prefix required
        
        /// <summary>
        /// Initializes a new instance of the <see cref="BookService"/> class.
        /// </summary>
        /// <param name="bookRepository">The book repository.</param>
        public BookService(IBookRepository bookRepository)
        {
            this.bookRepository = bookRepository;  // this. prefix required
        }
        
        /// <summary>
        /// Gets a book by ID for the specified user.
        /// </summary>
        /// <param name="userId">The user ID.</param>
        /// <param name="bookId">The book ID.</param>
        /// <param name="cancellationToken">The cancellation token.</param>
        /// <returns>The book DTO.</returns>
        public async Task<BookDto> GetBookAsync(
            string userId, 
            string bookId, 
            CancellationToken cancellationToken = default)
        {
            var book = await this.bookRepository.GetBookByIdAsync(
                bookId, 
                userId, 
                cancellationToken);
            return this.MapToDto(book);
        }
    }
}
```

**Entity Framework Patterns:**
```csharp
// ✅ GOOD - Repository with user isolation
public async Task<Book?> GetBookByIdAsync(string bookId, string userId, CancellationToken cancellationToken = default)
{
    return await this.context.Books
        .AsNoTracking()  // Read-only queries
        .Where(b => b.Id == bookId && b.UserId == userId)  // User isolation CRITICAL
        .FirstOrDefaultAsync(cancellationToken);
}

// ✅ GOOD - Efficient pagination
public async Task<PaginatedResponse<Book>> GetBooksAsync(
    string userId,
    BookFilterRequest request, 
    CancellationToken cancellationToken = default)
{
    var query = this.context.Books
        .AsNoTracking()
        .Where(b => b.UserId == userId);  // User isolation

    if (!string.IsNullOrEmpty(request.Search))
    {
        query = query.Where(b => b.Title.Contains(request.Search) || b.Author.Contains(request.Search));
    }

    var totalItems = await query.CountAsync(cancellationToken);
    var items = await query
        .Skip((request.Page - 1) * request.PageSize)
        .Take(request.PageSize)
        .ToListAsync(cancellationToken);

    return new PaginatedResponse<Book>(items, request.Page, request.PageSize, totalItems);
}
```

### Frontend TypeScript Standards

**Ultra-Strict TypeScript (MANDATORY):**
```typescript
// ✅ GOOD - Explicit typing everywhere
interface BookListProps {
  books: Book[];
  onBookSelect: (book: Book) => void;
  loading?: boolean;
}

export const BookList: React.FC<BookListProps> = ({ 
  books, 
  onBookSelect, 
  loading = false 
}): JSX.Element => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleBookClick = useCallback((book: Book): void => {
    setSelectedId(book.id);
    onBookSelect(book);
  }, [onBookSelect]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="book-list">
      {books.map((book: Book) => (
        <BookCard 
          key={book.id} 
          book={book} 
          onClick={() => handleBookClick(book)}
          selected={selectedId === book.id}
        />
      ))}
    </div>
  );
};
```

**Custom Hooks Pattern:**
```typescript
// ✅ GOOD - Typed custom hook with error handling
export const useBooks = (filters: BookFilters) => {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['books', filters],
    queryFn: (): Promise<PaginatedResponse<Book>> => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return bookService.getBooks(filters, token);
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount: number, error: Error): boolean => {
      if (error.message.includes('401')) {
        return false; // Don't retry auth errors
      }
      return failureCount < 3;
    },
  });
};
```

**ESLint Compliance (CRITICAL):**
```typescript
// ❌ BAD - Violations that cause build failures
function handleSubmit(data: any) {  // no-explicit-any violation
  console.log(data);  // no-console violation (needs comment)
  fetchData(userId);  // no-floating-promises violation
}

// ✅ GOOD - ESLint compliant
const handleSubmit = useCallback(async (data: CreateBookRequest): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log('Submitting book creation:', data);
  
  try {
    await bookService.createBook(data);  // Proper promise handling
  } catch (error) {
    // Error handling
  }
}, []);
```

## Testing Standards

### Backend Testing (xUnit)

**Unit Test Structure:**
```csharp
// BookServiceTests.cs
public class BookServiceTests
{
    private readonly Mock<IBookRepository> mockRepository;
    private readonly BookService bookService;
    private readonly string testUserId = "test-user-123";

    public BookServiceTests()
    {
        this.mockRepository = new Mock<IBookRepository>();
        this.bookService = new BookService(this.mockRepository.Object);
    }

    [Fact]
    public async Task GetBookAsync_WhenBookExists_ReturnsBookDto()
    {
        // Arrange
        var bookId = "book-123";
        var expectedBook = new Book 
        { 
            Id = bookId, 
            UserId = this.testUserId,
            Title = "Test Book",
            Author = "Test Author"
        };
        
        this.mockRepository
            .Setup(r => r.GetBookByIdAsync(bookId, this.testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedBook);

        // Act  
        var result = await this.bookService.GetBookAsync(this.testUserId, bookId);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Test Book");
        result.Author.Should().Be("Test Author");
    }

    [Fact]
    public async Task GetBookAsync_WhenBookNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var bookId = "nonexistent-book";
        
        this.mockRepository
            .Setup(r => r.GetBookByIdAsync(bookId, this.testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Book?)null);

        // Act & Assert
        await this.bookService
            .Invoking(s => s.GetBookAsync(this.testUserId, bookId))
            .Should()
            .ThrowAsync<NotFoundException>()
            .WithMessage("*not found*");
    }
}
```

### Frontend Testing (Vitest + React Testing Library)

**Component Test Structure:**
```typescript
// BookCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BookCard } from './BookCard';
import type { Book } from '../types/api';

const mockBook: Book = {
  id: '1',
  title: 'Test Book',
  author: 'Test Author', 
  genres: ['Fiction', 'Mystery'],
  publishedDate: '2023-01-01',
  rating: 4,
  edition: '1st Edition',
  isbn: '978-1234567890',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

describe('BookCard', () => {
  const mockOnClick = vi.fn();
  
  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('should render book information correctly', () => {
    render(<BookCard book={mockBook} onClick={mockOnClick} />);
    
    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('by Test Author')).toBeInTheDocument();
    expect(screen.getByText('Fiction')).toBeInTheDocument();
    expect(screen.getByText('Mystery')).toBeInTheDocument();
  });

  it('should call onClick when card is clicked', () => {
    render(<BookCard book={mockBook} onClick={mockOnClick} />);
    
    const card = screen.getByRole('article');
    fireEvent.click(card);
    
    expect(mockOnClick).toHaveBeenCalledWith(mockBook);
  });

  it('should display rating stars correctly', () => {
    render(<BookCard book={mockBook} onClick={mockOnClick} />);
    
    const starElements = screen.getAllByText('★');
    expect(starElements).toHaveLength(4); // 4-star rating
  });
});
```

**API Hook Testing:**
```typescript
// useBooks.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBooks } from './useBooks';
import { bookService } from '../services/bookService';

vi.mock('../services/bookService');

const createWrapper = (): React.FC<{ children: React.ReactNode }> => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useBooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch books successfully', async () => {
    const mockBooks = {
      items: [mockBook],
      totalItems: 1,
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false
    };

    vi.mocked(bookService.getBooks).mockResolvedValue(mockBooks);

    const { result } = renderHook(() => useBooks({}), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockBooks);
    expect(bookService.getBooks).toHaveBeenCalledWith({});
  });
});
```

## Quality Assurance

### Validation Gates (MANDATORY)

**All validation gates must pass before any code advancement:**

```bash
# Complete validation (ZERO warnings allowed)
npm run validate

# Individual validation steps
npm run validate:backend   # C# formatting, build, tests, StyleCop
npm run validate:frontend  # ESLint, TypeScript, build, tests
```

**Backend Validation Requirements:**
- ✅ **dotnet format**: Perfect code formatting
- ✅ **dotnet build --warningsaserrors**: Zero warnings build
- ✅ **dotnet test**: All tests pass with >80% coverage  
- ✅ **StyleCop compliance**: All SA rules satisfied

**Frontend Validation Requirements:**
- ✅ **ESLint --max-warnings 0**: Zero warnings linting
- ✅ **TypeScript strict**: Zero type errors
- ✅ **npm run build**: Successful production build
- ✅ **Vitest**: All tests pass with >80% coverage

### Code Review Checklist

**Backend Review:**
- [ ] All services implement interfaces
- [ ] User isolation applied to all data operations
- [ ] Proper async/await with CancellationToken
- [ ] XML documentation on public members
- [ ] Exception handling with structured logging
- [ ] Repository pattern followed
- [ ] No hardcoded secrets or connection strings

**Frontend Review:**
- [ ] No `any` or `unknown` types used
- [ ] Explicit function return types
- [ ] Proper error boundaries and loading states
- [ ] Custom hooks for business logic
- [ ] Component props interfaces defined
- [ ] Accessibility attributes included
- [ ] Performance optimizations (React.memo, useCallback)

### Performance Standards

**Backend Performance:**
- API response time < 2 seconds
- Database queries use proper indexes
- No N+1 query problems
- Async operations throughout
- Proper pagination for large datasets

**Frontend Performance:**
- Bundle size increases < 500KB
- Time to interactive < 3 seconds  
- No unnecessary re-renders
- Lazy loading for routes
- Optimized image loading

## Debugging and Development Tools

### Backend Debugging

**Visual Studio / VS Code:**
```json
// launch.json for backend debugging
{
  "name": ".NET Core Launch (web)",
  "type": "coreclr",
  "request": "launch",
  "preLaunchTask": "build",
  "program": "${workspaceFolder}/backend/src/LibraryApi/bin/Debug/net9.0/LibraryApi.dll",
  "args": [],
  "cwd": "${workspaceFolder}/backend/src/LibraryApi",
  "stopAtEntry": false,
  "serverReadyAction": {
    "action": "openExternally",
    "pattern": "\\bNow listening on:\\s+(https?://\\S+)"
  },
  "env": {
    "ASPNETCORE_ENVIRONMENT": "Development"
  }
}
```

**Database Debugging:**
```bash
# SQLite command line access
sqlite3 library.db

# Useful queries
.tables
.schema books
SELECT * FROM books WHERE userId = 'your-user-id';

# Or use SQLite Browser GUI for visual inspection
```

### Frontend Debugging

**React DevTools Configuration:**
```typescript
// Only enable in development
if (process.env.NODE_ENV === 'development') {
  // React Query DevTools
  import('@tanstack/react-query-devtools').then(({ ReactQueryDevtools }) => {
    // DevTools setup
  });
}
```

**Network Debugging:**
```typescript
// API client with request/response logging
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

if (import.meta.env.DEV) {
  apiClient.interceptors.request.use((config) => {
    console.log('🚀 API Request:', config);
    return config;
  });

  apiClient.interceptors.response.use(
    (response) => {
      console.log('✅ API Response:', response);
      return response;
    },
    (error) => {
      console.error('❌ API Error:', error);
      return Promise.reject(error);
    }
  );
}
```

### Common Development Commands

```bash
# Development server management
npm run dev              # Start both servers
npm run dev:frontend     # Frontend only (:3000)
npm run dev:backend      # Backend only (:5000)

# Building and validation
npm run build           # Build both projects
npm run validate        # Full validation suite
npm run clean           # Clean build artifacts

# Database operations  
npm run db:migrate      # Apply pending migrations
npm run db:seed         # Seed development data
npm run db:reset        # Reset database to clean state

# Testing
npm run test            # Run all tests
npm run test:backend    # Backend tests only
npm run test:frontend   # Frontend tests only  
npm run test:coverage   # Generate coverage reports

# Code generation
npm run generate-client # Regenerate API client
```

## Environment-Specific Considerations

### Development Environment

**Features Enabled:**
- Hot reload for both frontend and backend
- Detailed error messages and stack traces
- React Query DevTools
- Swagger UI available
- Verbose logging enabled
- Database seeding available

**Performance Optimizations Disabled:**
- No code minification
- Source maps enabled
- No caching layers
- Development server optimizations

### Production Environment  

**Features Enabled:**
- Code minification and optimization
- Caching and compression
- Error reporting and monitoring
- Health check endpoints
- Structured logging with retention

**Security Hardening:**
- HTTPS enforcement
- Security headers
- Rate limiting
- Input sanitization
- No debug information exposure

This development guide ensures consistent, high-quality development practices across the entire codebase while maintaining the zero-warning policy that's critical to the project's success.