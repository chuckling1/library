# API Documentation

## Overview

The Book Library API is a RESTful service built with ASP.NET Core that provides complete book management functionality with JWT authentication and multi-user data isolation.

**Base URL**: `http://localhost:5000/api`

**Authentication**: Secure httpOnly cookie-based JWT authentication required for all endpoints except user registration/login.

## Authentication

### Register User
**POST** `/api/Auth/register`

Register a new user account. JWT token is automatically set in secure httpOnly cookie.

```json
// Request
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}

// Response (201 Created)
// Secure httpOnly cookie 'auth-token' is automatically set
{
  "email": "john@example.com",
  "message": "Registration successful"
}
```

### Login
**POST** `/api/Auth/login`

Authenticate user with email and password. JWT token is automatically set in secure httpOnly cookie.

```json
// Request
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

// Response (200 OK)
// Secure httpOnly cookie 'auth-token' is automatically set
{
  "email": "john@example.com",
  "message": "Login successful"
}
```

### Logout
**POST** `/api/Auth/logout`

Log out the current user by clearing the authentication cookie.

```json
// Request: No body required

// Response (200 OK)
// httpOnly cookie 'auth-token' is automatically cleared
{
  "message": "Logout successful"
}
```

### Get Current User
**GET** `/api/Auth/me`

Get the current authenticated user's information (requires authentication).

```json
// Response (200 OK)
{
  "email": "john@example.com"
}

// Response (401 Unauthorized) - if not authenticated
{
  "error": "Unauthorized",
  "message": "Invalid authentication state"
}
```

### Authentication Method
**httpOnly Cookie Authentication**: All authentication is handled via secure httpOnly cookies automatically set by the backend. No manual token management required:

- **Secure**: Cookies are httpOnly (JavaScript cannot access them)
- **Automatic**: Backend sets and clears cookies automatically
- **Cross-Origin**: Requires `credentials: 'include'` in fetch requests
- **Expiration**: 24-hour JWT expiration matches cookie expiration

## Book Management

### Get All Books
**GET** `/books`

Retrieve all books for the authenticated user with optional filtering and pagination.

**Query Parameters:**
- `search` (string): Filter by title or author
- `genre` (string): Filter by genre name
- `minRating` (integer): Filter by minimum rating (1-5)
- `maxRating` (integer): Filter by maximum rating (1-5)
- `page` (integer): Page number (default: 1)
- `pageSize` (integer): Items per page (default: 10, max: 50)
- `sortBy` (string): Sort field (`title`, `author`, `publishedDate`, `rating`)
- `sortDirection` (string): Sort direction (`asc`, `desc`)

```json
// Response (200 OK)
{
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "title": "Clean Code",
      "author": "Robert C. Martin",
      "genres": ["Programming", "Software Development"],
      "publishedDate": "2008-08-11",
      "rating": 5,
      "edition": "1st Edition",
      "isbn": "978-0132350884",
      "createdAt": "2025-09-07T10:00:00Z",
      "updatedAt": "2025-09-07T10:00:00Z"
    }
  ],
  "currentPage": 1,
  "pageSize": 10,
  "totalItems": 25,
  "totalPages": 3,
  "hasNext": true,
  "hasPrevious": false
}
```

### Get Book by ID
**GET** `/books/{id}`

Retrieve a specific book by ID (user must own the book).

```json
// Response (200 OK)
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "genres": ["Programming", "Software Development"],
  "publishedDate": "2008-08-11",
  "rating": 5,
  "edition": "1st Edition",
  "isbn": "978-0132350884",
  "createdAt": "2025-09-07T10:00:00Z",
  "updatedAt": "2025-09-07T10:00:00Z"
}
```

### Create Book
**POST** `/books`

Create a new book for the authenticated user.

```json
// Request
{
  "title": "The Pragmatic Programmer",
  "author": "Andy Hunt, Dave Thomas", 
  "genres": ["Programming", "Software Development", "Career"],
  "publishedDate": "1999-10-30",
  "rating": 5,
  "edition": "20th Anniversary Edition",
  "isbn": "978-0135957059"
}

// Response (201 Created)
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "title": "The Pragmatic Programmer",
  "author": "Andy Hunt, Dave Thomas",
  "genres": ["Programming", "Software Development", "Career"],
  "publishedDate": "1999-10-30",
  "rating": 5,
  "edition": "20th Anniversary Edition",
  "isbn": "978-0135957059",
  "createdAt": "2025-09-07T10:00:00Z",
  "updatedAt": "2025-09-07T10:00:00Z"
}
```

### Update Book
**PUT** `/books/{id}`

Update an existing book (user must own the book).

```json
// Request
{
  "title": "Clean Code: Updated",
  "author": "Robert C. Martin",
  "genres": ["Programming", "Best Practices"],
  "publishedDate": "2008-08-11",
  "rating": 5,
  "edition": "Updated Edition",
  "isbn": "978-0132350884"
}

// Response (200 OK) - Returns updated book object
```

### Delete Book
**DELETE** `/books/{id}`

Delete a book (user must own the book).

```json
// Response (204 No Content)
```

## Statistics

### Get Book Statistics
**GET** `/books/stats`

Get comprehensive statistics about the user's book collection.

```json
// Response (200 OK)
{
  "totalBooks": 25,
  "averageRating": 4.2,
  "genreDistribution": [
    {
      "genre": "Programming",
      "count": 8,
      "percentage": 32.0,
      "averageRating": 4.5
    },
    {
      "genre": "Fiction", 
      "count": 6,
      "percentage": 24.0,
      "averageRating": 4.1
    }
  ],
  "ratingDistribution": [
    { "rating": 5, "count": 10 },
    { "rating": 4, "count": 8 },
    { "rating": 3, "count": 5 },
    { "rating": 2, "count": 2 },
    { "rating": 1, "count": 0 }
  ],
  "recentBooks": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "title": "Latest Book",
      "author": "Recent Author",
      "createdAt": "2025-09-07T09:00:00Z"
    }
  ]
}
```

## Bulk Operations

### Import Books from CSV
**POST** `/bulkimport/books`

Import multiple books from a CSV file.

**Content-Type**: `multipart/form-data`

**Form Data:**
- `file`: CSV file with columns: Title, Author, Genres, PublishedDate, Rating, Edition, ISBN

```json
// Response (200 OK)
{
  "message": "Import completed successfully",
  "importedCount": 15,
  "skippedCount": 3,
  "totalProcessed": 18,
  "duplicatesSkipped": [
    {
      "title": "Existing Book",
      "author": "Known Author",
      "reason": "Already exists in collection"
    }
  ]
}
```

### Export Books to CSV
**GET** `/bulkimport/export/books`

Export all user's books to CSV format.

**Response Headers:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="books-export-20250907.csv"
```

**CSV Format:**
```csv
Title,Author,Genres,PublishedDate,Rating,Edition,ISBN
"Clean Code","Robert C. Martin","Programming,Software Development","2008-08-11",5,"1st Edition","978-0132350884"
```

## Error Responses

### Standard Error Format
```json
{
  "error": "Validation failed",
  "message": "One or more validation errors occurred.",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    },
    {
      "field": "rating", 
      "message": "Rating must be between 1 and 5"
    }
  ],
  "timestamp": "2025-09-07T10:00:00Z",
  "traceId": "0HMVD0J4K7QAC:00000001"
}
```

### HTTP Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **204 No Content**: Successful deletion
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: User doesn't own the requested resource
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate resource (during creation)
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server error

### Common Error Scenarios

**Authentication Required (401)**
```json
{
  "error": "Unauthorized",
  "message": "JWT token is required for this endpoint"
}
```

**Resource Not Found (404)**
```json
{
  "error": "Not Found", 
  "message": "Book with ID '3fa85f64-5717-4562-b3fc-2c963f66afa6' was not found"
}
```

**Validation Error (422)**
```json
{
  "error": "Validation Failed",
  "message": "The rating field is required and must be between 1 and 5",
  "details": [
    {
      "field": "rating",
      "message": "Rating must be between 1 and 5"
    }
  ]
}
```

## Rate Limiting

- **Rate Limit**: 100 requests per minute per user
- **Response Headers**: 
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: 95
  - `X-RateLimit-Reset`: 1694087400

## Data Validation Rules

### Book Validation
- **Title**: Required, max 200 characters
- **Author**: Required, max 200 characters  
- **Genres**: Array of strings, each max 50 characters
- **PublishedDate**: Valid date in format YYYY-MM-DD, not in future
- **Rating**: Integer between 1 and 5
- **Edition**: Optional, max 100 characters
- **ISBN**: Optional, valid ISBN-10 or ISBN-13 format

### User Validation
- **Email**: Required, valid email format (used for authentication)
- **Password**: Required, min 8 characters, must contain uppercase, lowercase, number, special character
- **ConfirmPassword**: Required for registration, must match password

## OpenAPI/Swagger

Interactive API documentation is available at: `http://localhost:5000/swagger`

The OpenAPI specification can be accessed at: `http://localhost:5000/swagger/v1/swagger.json`