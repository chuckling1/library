# Design Specification: Book Library Application

## API Endpoint Specification

### 🚨 IMPORTANT: OpenAPI-First Development Workflow

**These TypeScript interfaces are DESIGN REFERENCE ONLY.** The actual implementation follows the OpenAPI-first approach specified in CLAUDE.md:

1. **Backend**: C# models and controllers auto-generate OpenAPI spec via Swagger
2. **Frontend**: Generated TypeScript client consumes OpenAPI spec  
3. **Contract Safety**: Breaking changes caught at compile time
4. **No Manual Types**: All API types are auto-generated

### OpenAPI-First Workflow Example

```bash
# 1. Backend developer implements C# Book model and controller
# 2. Backend auto-generates OpenAPI spec at runtime
dotnet run --project src/LibraryApi --urls http://localhost:5000
# OpenAPI spec available at: http://localhost:5000/swagger/v1/swagger.json

# 3. Frontend generates TypeScript client from OpenAPI spec
cd frontend/
npm run generate-client
# Generates: src/generated/api/

# 4. Frontend uses generated client (NOT manual types)
import { BooksApi, Book, BookCreateRequest } from '../generated/api';

const booksApi = new BooksApi();
const books: Book[] = await booksApi.getBooksApiBooks();
```

**Key Benefits**:
- ✅ Single source of truth (C# models)
- ✅ Compile-time contract validation  
- ✅ Auto-synchronized frontend/backend types
- ✅ Breaking API changes caught immediately
- ❌ NO manual type definitions in frontend code

### Design Reference Data Models

```typescript
// DESIGN REFERENCE ONLY - Actual types will be auto-generated
// Enhanced Book model based on stakeholder clarifications
interface Book {
  id: string;                    // GUID
  title: string;                 // Required, max 255 chars
  author: string;                // Required, max 255 chars
  genres: string[];              // Array of genre names
  publishedDate: string;         // ISO date string (YYYY-MM-DD)
  rating: number;                // User's rating 1-5 (integer)
  averageRating?: number;        // Calculated average (decimal)
  edition?: string;              // Optional edition info
  isbn?: string;                 // Optional ISBN-13
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}

interface BookCreateRequest {
  title: string;
  author: string;
  genres: string[];
  publishedDate: string;         // YYYY-MM-DD format
  rating: number;                // 1-5
  edition?: string;
  isbn?: string;
}

interface BookUpdateRequest extends BookCreateRequest {
  // Same as create - all fields updatable
}

interface Genre {
  name: string;                  // Primary key
  isSystemGenre: boolean;        // Base vs user-created
  bookCount: number;             // Usage statistics
  createdAt: string;
}

interface BookStats {
  totalBooks: number;
  genreDistribution: GenreCount[];
  averageRating: number;
  recentlyAdded: Book[];         // Last 5 added
}

interface GenreCount {
  genre: string;
  count: number;
  averageRating: number;
}

interface ApiError {
  message: string;
  details?: Record<string, string[]>;  // Field-level validation errors
  timestamp: string;
  traceId: string;
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
```

### RESTful Endpoints

#### Books Collection
```http
GET /api/books
Query Parameters:
  - genre?: string[]           // Filter by genres
  - rating?: number           // Filter by minimum rating
  - search?: string           // Search title/author
  - sortBy?: 'title' | 'author' | 'publishedDate' | 'rating' | 'createdAt'
  - sortDirection?: 'asc' | 'desc'
  - page?: number             // Pagination
  - pageSize?: number         // Default 20, max 100

Response: 200 OK
{
  "data": {
    "books": Book[],
    "totalCount": number,
    "page": number,
    "pageSize": number,
    "hasNextPage": boolean
  },
  "success": true
}
```

```http
GET /api/books/{id}
Response: 200 OK | 404 Not Found
{
  "data": Book,
  "success": true
}
```

```http
POST /api/books
Content-Type: application/json
Body: BookCreateRequest

Response: 201 Created | 400 Bad Request
Location: /api/books/{id}
{
  "data": Book,
  "success": true,
  "message": "Book created successfully"
}
```

```http
PUT /api/books/{id}
Content-Type: application/json
Body: BookUpdateRequest

Response: 200 OK | 400 Bad Request | 404 Not Found
{
  "data": Book,
  "success": true,
  "message": "Book updated successfully"
}
```

```http
DELETE /api/books/{id}
Response: 204 No Content | 404 Not Found
```

#### Statistics
```http
GET /api/books/stats
Response: 200 OK
{
  "data": BookStats,
  "success": true
}
```

#### Genres
```http
GET /api/genres
Query Parameters:
  - search?: string           // Autocomplete support

Response: 200 OK
{
  "data": Genre[],
  "success": true
}
```

```http
POST /api/genres
Content-Type: application/json
Body: { "name": string }

Response: 201 Created | 400 Bad Request | 409 Conflict
{
  "data": Genre,
  "success": true,
  "message": "Genre created successfully"
}
```

### HTTP Status Codes & Error Handling

**Success Responses:**
- `200 OK` - Successful GET, PUT operations
- `201 Created` - Successful POST operations
- `204 No Content` - Successful DELETE operations

**Error Responses:**
- `400 Bad Request` - Validation failures, malformed requests
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Duplicate genre creation
- `500 Internal Server Error` - Unexpected server errors

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": {
      "title": ["Title is required"],
      "rating": ["Rating must be between 1 and 5"],
      "publishedDate": ["Invalid date format"]
    },
    "timestamp": "2025-09-03T14:30:00Z",
    "traceId": "abc123"
  }
}
```

## Frontend User Flow

### Primary Navigation Flow

```
Entry Point (/)
├── Book List Page (default view)
│   ├── View Book Details → Book Detail Modal/Page
│   ├── Edit Book → Book Form (edit mode)
│   ├── Delete Book → Confirmation Dialog
│   └── Add New Book → Book Form (create mode)
├── Statistics Dashboard (/stats)
│   ├── Genre Distribution Chart
│   ├── Rating Analytics
│   └── Recent Books List
└── Book Form (/books/new, /books/{id}/edit)
    ├── Save → Success → Redirect to List
    ├── Cancel → Return to previous page
    └── Validation Errors → Stay on form
```

### Visual Design: Book Card System

**Cover Image Strategy:**
- **Primary**: User-uploaded book covers (future enhancement)
- **Fallback**: Generated covers with:
  - Gradient backgrounds based on genre/title hash
  - Title and Author text overlay with readable typography
  - Consistent color palette (5-6 predefined gradients)
  - Book-like styling with subtle border/shadow

**Card Interaction States:**
- **Default**: Subtle shadow, clean presentation
- **Hover**: Elevated shadow, slight scale (1.02x), action menu fade-in
- **Focus**: Accessible outline, keyboard navigation support
- **Loading**: Skeleton placeholder with shimmer effect

**Responsive Behavior:**
- **Desktop (1200px+)**: 4-6 cards per row, 180px width per card
- **Tablet (768-1199px)**: 3-4 cards per row, 160px width per card  
- **Mobile (320-767px)**: 1-2 cards per row, 140px width per card
- **Vertical scrolling**: Natural page scroll with optional infinite scroll
- **Grid layout**: CSS Grid or Flexbox with responsive breakpoints

### User Journey: Add New Book

1. **Entry**: User clicks "Add Book" button on Book List
2. **Navigation**: Route to `/books/new`
3. **Form Display**: Empty form with validation rules
4. **Genre Selection**: Autocomplete with existing + create new option
5. **Rating Input**: 1-5 star selector
6. **Date Input**: Date picker with validation
7. **Submit**: 
   - **Success**: Redirect to book list with success message and new card highlighted
   - **Error**: Display field-level validation errors
8. **Cancel**: Return to book list without saving

### User Journey: View Statistics

1. **Entry**: User clicks "Statistics" in navigation
2. **Loading**: Show skeleton/spinner while fetching data
3. **Display**: 
   - Genre distribution chart (bar/pie)
   - Key metrics (total books, average rating)
   - Recently added books list
4. **Interaction**: 
   - Click genre in chart → filter book list by that genre
   - Click recent book → navigate to book details
5. **Refresh**: Manual refresh button + auto-refresh on data changes

### Error State Flows

**Network Error Recovery:**
1. Show error message with retry button
2. Offline indicator if applicable
3. Retry mechanism with exponential backoff
4. Cache previous data when available

**Validation Error Flow:**
1. Real-time validation on field blur
2. Form-level validation on submit
3. Server validation error display
4. Focus management to first error field

## Component Breakdown

### Component Hierarchy

```
App
├── Layout
│   ├── Header (navigation, app title)
│   ├── Sidebar (navigation menu) - optional
│   └── Main (page content)
├── Pages
│   ├── BookListPage
│   │   ├── BookList
│   │   │   ├── BookCard (repeated)
│   │   │   └── BookTableRow (alternate view)
│   │   ├── BookFilters
│   │   ├── SearchBar
│   │   └── Pagination
│   ├── BookFormPage
│   │   └── BookForm
│   │       ├── GenreSelector
│   │       ├── StarRating
│   │       └── DatePicker
│   └── StatsPage
│       ├── StatsOverview
│       ├── GenreChart
│       └── RecentBooksList
├── Components (Shared)
│   ├── LoadingSpinner
│   ├── ErrorMessage
│   ├── ConfirmationDialog
│   └── Toast/Notification
└── Hooks
    ├── useBooks
    ├── useBookStats
    ├── useGenres
    └── useNotification
```

### Component Contracts

```typescript
// DESIGN REFERENCE ONLY - Components will use auto-generated API types
// Import actual types from generated client: import { Book, BookCreateRequest } from '../generated/api';

// BookCard Component
interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (bookId: string) => void;
  onView: (book: Book) => void;
  showActions?: boolean;
}

// BookForm Component
interface BookFormProps {
  book?: Book;                    // undefined for create mode
  onSubmit: (data: BookCreateRequest | BookUpdateRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// GenreSelector Component
interface GenreSelectorProps {
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
  availableGenres: Genre[];
  onCreateGenre: (genreName: string) => Promise<Genre>;
  placeholder?: string;
}

// StarRating Component
interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  showValue?: boolean;
  size?: 'small' | 'medium' | 'large';
}

// GenreChart Component
interface GenreChartProps {
  data: GenreCount[];
  onGenreClick?: (genre: string) => void;
  chartType?: 'bar' | 'pie' | 'doughnut';
  height?: number;
}
```

### State Management Strategy

**Global State (Context API):**
- Books collection with CRUD operations
- Current user preferences (view mode, filters)
- Loading states for global operations
- Error/notification messages

**Local State:**
- Form inputs and validation
- Component-specific UI state (modals, dropdowns)
- Pagination and filtering state
- Chart interaction state

```typescript
// DESIGN REFERENCE ONLY - Context will use auto-generated API types
// Import: import { Book, BookCreateRequest, BookUpdateRequest } from '../generated/api';

// Books Context
interface BooksContextValue {
  books: Book[];
  isLoading: boolean;
  error: string | null;
  filters: BookFilters;
  pagination: PaginationState;
  
  // Actions
  fetchBooks: () => Promise<void>;
  createBook: (book: BookCreateRequest) => Promise<void>;
  updateBook: (id: string, book: BookUpdateRequest) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  setFilters: (filters: Partial<BookFilters>) => void;
}

// Custom Hooks
const useBooks = () => useContext(BooksContext);
const useBookForm = (book?: Book) => {
  // Form state management, validation, submit logic
};
const useGenres = () => {
  // Genre fetching, creation, autocomplete logic
};
```

## High-Level Wireframe Description

### Book List Page Layout

**Header Section:**
- Application title "My Book Library" (left aligned)
- Add New Book button (primary CTA, right aligned)
- Navigation tabs: "Books" | "Statistics" (center)

**Filters & Search Section:**
- Search bar (full width, placeholder: "Search books by title or author...")
- Filter row:
  - Genre multi-select dropdown (left)
  - Rating filter (minimum stars selector, center)
  - Sort dropdown (right): "Sort by: Title ↑"
- Active filters display as removable chips below

**Books Display Area:**
- **Primary View**: Responsive card grid layout (4-6 cards per row)
- **Card Design**: 
  - Aspect ratio: ~3:4 (book-like proportions)
  - Prominent cover image (generated or placeholder with title/author overlay)
  - Card shadows and subtle hover animations
  - Size: ~180px width × 240px height (desktop)
- **Card Content**:
  - **Cover Area** (70% of card height):
    - Book cover image or generated colored background
    - Overlay text if no image: Title + Author (readable typography)
  - **Info Area** (30% of card height):
    - Title (bold, 2 lines max with ellipsis)
    - Author (secondary text, 1 line with ellipsis)
    - Star rating (compact, bottom left)
    - Action menu (3-dot, bottom right, visible on hover)
- **Layout Behavior**:
  - **Desktop**: 4-6 cards per row (responsive based on screen width)
  - **Tablet**: 3-4 cards per row  
  - **Mobile**: 1-2 cards per row
  - **Vertical scrolling** with infinite scroll or pagination
  - Grid gaps for clean spacing between cards
- **Alternative List View** (toggle option):
  - Compact table format for power users
  - Columns: Cover | Title | Author | Genres | Published | Rating | Actions

**Footer Section:**
- Pagination controls
- Results count: "Showing 1-20 of 156 books"

**Empty States:**
- No books: Large illustration + "Add your first book" CTA
- No search results: "No books found for '{query}'" + clear filters option

### Book Form Page Layout

**Header:**
- Page title: "Add New Book" / "Edit Book"
- Breadcrumb: Books > Add New Book
- Cancel link (top right)

**Form Layout (Single column, max-width container):**
- **Basic Information Section:**
  - Title input (required indicator)
  - Author input (required indicator)
  - Edition input (optional)
  - ISBN input (optional, with format hint)

- **Categorization Section:**
  - Genre selector (multiselect with autocomplete)
    - Dropdown shows existing genres
    - "Create new genre" option at bottom
    - Selected genres show as removable chips
  - Rating selector (1-5 stars, required)

- **Publication Section:**
  - Published Date (date picker, required)
    - Default to today, allow past dates
    - Format hint: MM/DD/YYYY

**Form Footer:**
- Save button (primary, disabled during loading)
- Cancel button (secondary)
- Loading spinner overlay when submitting

**Validation Display:**
- Real-time validation on blur
- Error messages below each field
- Form-level error summary at top if needed
- Success message after save

### Statistics Page Layout

**Header:**
- Page title: "Library Statistics"
- Last updated timestamp
- Refresh button

**Overview Cards (Top row):**
- Total Books (large number + icon)
- Average Rating (star display + decimal)
- Favorite Genre (most frequent)
- Recently Added (count this month)

**Charts Section:**
- **Genre Distribution Chart:**
  - Bar chart or pie chart (user preference)
  - Interactive: click to filter books
  - Show count and percentage
  - Top 10 genres, "Others" grouping

- **Rating Distribution:**
  - Bar chart showing 1-5 star counts
  - Average rating line overlay
  - Click to filter books by rating

**Recent Activity:**
- "Recently Added Books" section
- Last 5 books in card format
- "View All Books" link

**Responsive Behavior:**
- Desktop: 2x2 overview cards, side-by-side charts
- Tablet: 2x2 overview, stacked charts
- Mobile: Single column, simplified charts

### Accessibility Considerations

**Keyboard Navigation:**
- Tab order follows logical flow
- All interactive elements keyboard accessible
- Skip links for screen readers
- Focus indicators clearly visible

**Screen Reader Support:**
- Semantic HTML structure
- ARIA labels and descriptions
- Table headers properly associated
- Form labels explicitly connected

**Visual Accessibility:**
- High contrast colors (4.5:1 minimum)
- Scalable text (up to 200% without horizontal scroll)
- Color not sole indicator of information
- Loading states announced to screen readers

**Error Handling Accessibility:**
- Errors announced by screen readers
- Error messages associated with form fields
- Focus management on error states
- Clear recovery instructions

## OpenAPI Integration Details

### Frontend Package.json Scripts
```json
{
  "scripts": {
    "generate-client": "openapi-generator-cli generate -i http://localhost:5000/swagger/v1/swagger.json -g typescript-axios -o src/generated/api --additional-properties=supportsES6=true,withInterfaces=true,typescriptThreePlus=true"
  }
}
```

### Development Workflow Integration
1. **Backend Development**: Implement C# models with data annotations for validation
2. **OpenAPI Generation**: Swagger automatically generates spec from C# code
3. **Frontend Sync**: Run `npm run generate-client` after backend changes
4. **Type Safety**: TypeScript compiler catches contract mismatches
5. **Validation**: Both client and server use same validation rules

### Contract Change Management
```typescript
// Example: If backend adds a new required field to Book model
// Old frontend code will get TypeScript compilation errors
const createBook = (data: BookCreateRequest) => {
  // TypeScript error if 'newRequiredField' is missing
  return booksApi.postBooksApiBooks(data);
};

// This forces frontend to handle new contract requirements
```

### API Client Usage Patterns
```typescript
// ✅ Correct: Use generated client
import { BooksApi, Book, ApiException } from '../generated/api';

const api = new BooksApi();
try {
  const books: Book[] = await api.getBooksApiBooks();
} catch (error) {
  if (error instanceof ApiException) {
    // Handle API errors with proper typing
    console.error(error.status, error.message);
  }
}

// ❌ Incorrect: Manual fetch calls
fetch('/api/books') // No type safety, manual error handling
```

## Implementation Notes

### Performance Considerations
- Implement virtual scrolling for large book lists
- Lazy load book cover images
- Debounce search input (300ms)
- Cache genre list and stats data
- Optimize chart rendering for large datasets

### Security Considerations  
- Sanitize all user inputs
- Implement CSRF protection
- Rate limiting on search endpoints
- Input validation both client and server-side
- Secure headers and CORS configuration

### Testing Strategy
- Unit tests for all components with props variations
- Integration tests for user flows
- API endpoint testing with various scenarios
- Accessibility testing with axe-core
- Cross-browser compatibility testing

### Documentation & Setup Automation Requirements

**Multi-Level README Structure:**
- **Root README.md**: Project overview, one-liner setup, architecture summary
- **backend/README.md**: API documentation, development workflow, testing
- **frontend/README.md**: Component documentation, build process, deployment
- **project-docs/README.md**: AI development process showcase

**One-Liner Setup Automation:**
```bash
# Goal: Single command project setup
npm run setup
# Should handle: prerequisites check, backend/frontend setup, database, seeding, validation
```

**Setup Script Requirements:**
1. Prerequisites validation (.NET 8+, Node.js 18+)
2. Backend setup (restore, migrations, build)
3. Frontend setup (install, generate-client, build)
4. Database seeding with demonstration data
5. Environment configuration and validation
6. Smoke tests and next-step instructions

This design specification provides comprehensive guidance for implementing the Book Library application with professional-grade user experience and technical architecture.