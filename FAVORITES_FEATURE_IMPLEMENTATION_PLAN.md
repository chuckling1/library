# Favorites Feature Implementation Plan

## Overview

This document outlines the implementation of a comprehensive favorites system that transforms the book library from a personal collection manager into a social book discovery platform with community features.

## Feature Scope

### Core Features
1. **Personal Favorites** - Users can favorite/unfavorite books in their collection
2. **My Favorites Page** - Private view of user's favorited books  
3. **Popular Books Page** - Community view showing most-favorited books across all users
4. **Social Analytics** - Favorite counts and community ratings on books

### Technical Architecture
- **Many-to-Many Relationship**: Users ↔ Books via UserFavorites junction table
- **Anonymous Aggregation**: Community data without exposing individual user preferences
- **Existing Pattern Replication**: Follows proven BookGenre junction table pattern

## Implementation Breakdown

### Database Changes (15 minutes)

#### New Junction Table Model
```csharp
// Models/UserFavorite.cs - Copy BookGenre pattern exactly
[PrimaryKey(nameof(UserId), nameof(BookId))]
public class UserFavorite
{
    /// <summary>
    /// Gets or sets the user identifier.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Gets or sets the book identifier.
    /// </summary>
    public Guid BookId { get; set; }

    /// <summary>
    /// Gets or sets when the favorite was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the navigation property to the user.
    /// </summary>
    public virtual User User { get; set; } = null!;

    /// <summary>
    /// Gets or sets the navigation property to the book.
    /// </summary>
    public virtual Book Book { get; set; } = null!;
}
```

#### Entity Updates
```csharp
// Add to User.cs
public virtual ICollection<UserFavorite> FavoriteBooks { get; set; } = new List<UserFavorite>();

// Add to Book.cs  
public virtual ICollection<UserFavorite> FavoritedBy { get; set; } = new List<UserFavorite>();

// Add to LibraryDbContext.cs
public DbSet<UserFavorite> UserFavorites { get; set; } = null!;
```

#### Migration
```bash
dotnet ef migrations add AddUserFavorites --project src/LibraryApi
dotnet ef database update --project src/LibraryApi
```

### Backend Implementation (4-5 hours)

#### Service Layer
```csharp
// Services/IFavoriteService.cs
public interface IFavoriteService
{
    Task<bool> AddFavoriteAsync(Guid userId, Guid bookId, CancellationToken cancellationToken = default);
    Task<bool> RemoveFavoriteAsync(Guid userId, Guid bookId, CancellationToken cancellationToken = default);
    Task<bool> IsFavoriteAsync(Guid userId, Guid bookId, CancellationToken cancellationToken = default);
    Task<PaginatedResponse<Book>> GetUserFavoritesAsync(Guid userId, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<IEnumerable<PopularBookDto>> GetMostFavoritedBooksAsync(int limit = 20, CancellationToken cancellationToken = default);
}

// Services/FavoriteService.cs - Copy BookService DI pattern
public class FavoriteService : IFavoriteService
{
    private readonly LibraryDbContext context;
    private readonly ILogger<FavoriteService> logger;
    
    // Standard implementation using EF Core
}
```

#### Controller Endpoints  
```csharp
// Add to BooksController.cs
[HttpPost("{id}/favorite")]
public async Task<IActionResult> AddToFavorites(Guid id, CancellationToken cancellationToken = default)

[HttpDelete("{id}/favorite")]  
public async Task<IActionResult> RemoveFromFavorites(Guid id, CancellationToken cancellationToken = default)

[HttpGet("favorites")]
public async Task<ActionResult<PaginatedResponse<Book>>> GetMyFavorites(...)

[HttpGet("popular")]  
public async Task<ActionResult<IEnumerable<PopularBookDto>>> GetPopularBooks(...)
```

#### Response DTOs
```csharp
// Responses/PopularBookDto.cs
public class PopularBookDto
{
    public Book Book { get; set; } = null!;
    public int FavoriteCount { get; set; }
    public double AvgRating { get; set; }
}
```

### Frontend Implementation (3-4 hours)

#### Custom Hook
```typescript
// hooks/useFavorites.ts - Copy useBooks pattern
export const useFavorites = () => {
  const { authToken } = useAuth();
  
  const toggleFavorite = async (bookId: string, isFavorite: boolean) => {
    // API calls using generated client
  };
  
  const { data: userFavorites } = useQuery(['userFavorites'], fetchUserFavorites);
  
  return { toggleFavorite, userFavorites };
};

// hooks/usePopularBooks.ts  
export const usePopularBooks = (limit: number = 20) => {
  const { data: popularBooks } = useQuery(['popularBooks', limit], () => 
    fetchPopularBooks(limit)
  );
  
  return { popularBooks };
};
```

#### UI Components
```typescript
// Update BookCard.tsx - Add heart button
const FavoriteButton: React.FC<{ book: Book }> = ({ book }) => {
  const { toggleFavorite } = useFavorites();
  
  return (
    <button 
      onClick={() => toggleFavorite(book.id, book.isFavorite)}
      className="favorite-btn"
    >
      {book.isFavorite ? '❤️' : '🤍'}
    </button>
  );
};

// pages/FavoritesPage.tsx - Copy BookListPage structure
// pages/PopularBooksPage.tsx - New community view
```

#### Routing Updates
```typescript
// Add routes to App.tsx
<Route path="/favorites" element={<FavoritesPage />} />
<Route path="/popular" element={<PopularBooksPage />} />
```

### Testing Strategy (2-3 hours)

#### Backend Tests
```csharp
// FavoriteServiceTests.cs - Copy BookServiceTests pattern
// Test all CRUD operations, edge cases, user isolation
```

#### Frontend Tests  
```typescript
// useFavorites.test.tsx - Copy useBooks test structure
// FavoritesPage.test.tsx - Copy BookListPage test structure  
// PopularBooksPage.test.tsx - Test community view
```

## Key SQL Queries

### User Favorites
```sql
SELECT b.* FROM Books b
JOIN UserFavorites uf ON b.Id = uf.BookId  
WHERE uf.UserId = @userId
ORDER BY uf.CreatedAt DESC
```

### Popular Books (Community Aggregation)
```sql
SELECT 
    b.Id, b.Title, b.Author, b.Rating,
    COUNT(uf.UserId) as FavoriteCount,
    AVG(CAST(b.Rating as FLOAT)) as AvgRating
FROM Books b
JOIN UserFavorites uf ON b.Id = uf.BookId
GROUP BY b.Id, b.Title, b.Author, b.Rating
ORDER BY FavoriteCount DESC, AvgRating DESC
LIMIT @limit
```

### Check if Book is Favorited
```sql
SELECT COUNT(*) > 0 FROM UserFavorites 
WHERE UserId = @userId AND BookId = @bookId
```

## Navigation Structure

```
Current:
- My Books (personal collection)
- Statistics (personal stats)

Enhanced:
- My Books (personal collection)  
- My Favorites (personal favorites)
- Popular Books (community favorites) 
- Statistics (enhanced with community data)
```

## Value Proposition

This implementation transforms the application from:
**"Personal Book Manager"** → **"Social Book Discovery Platform"**

### Demonstrates Advanced Skills
- Many-to-many relationship modeling
- Data aggregation and analytics
- Social features without privacy concerns
- Community-driven content discovery
- Scalable architecture patterns

### Minimal Risk, Maximum Impact
- Uses proven patterns from existing BookGenre implementation
- Low complexity due to established architecture
- High visual and functional impact
- Differentiates from typical CRUD applications

## Time Investment

| Task | Estimated Time |
|------|---------------|
| Database schema + migration | 15 minutes |
| Backend services + controllers | 2-3 hours |
| Frontend hooks + components | 2-3 hours |
| UI integration + routing | 1 hour |
| Comprehensive testing | 2-3 hours |
| **Total** | **7-10 hours (1-1.5 days)** |

## Startup Prompt for Implementation

```
I want to implement the favorites feature as outlined in FAVORITES_FEATURE_IMPLEMENTATION_PLAN.md. 

This should add:
1. Personal favorites system (users can favorite books)
2. My Favorites page (private user view)  
3. Popular Books page (community aggregated data)
4. Heart icons on book cards for favoriting

Please implement this following the existing patterns:
- Copy the BookGenre junction table pattern for UserFavorite
- Copy the BookService structure for FavoriteService  
- Copy the useBooks hook pattern for useFavorites
- Copy the BookListPage structure for new pages
- Follow all existing code quality standards (interfaces, async/await, comprehensive logging)

Start with the database schema changes and work through backend → frontend → testing.

Ensure all code passes the existing validation gates and maintains the current zero-warning policy.
```

## Future Enhancements (Out of Current Scope)

- Real-time favorite count updates
- Favorite-based book recommendations  
- User favorite comparison ("Users who favorited this also liked...")
- Favorite categories/tags
- Social feeds based on favorites
- Export favorites to reading lists

## Notes

- This maintains complete user privacy (no individual favorite data exposed)
- Leverages existing architecture patterns for rapid implementation
- Creates foundation for future social/recommendation features
- Minimal database changes due to existing many-to-many expertise
- High evaluation impact for take-home challenge differentiation