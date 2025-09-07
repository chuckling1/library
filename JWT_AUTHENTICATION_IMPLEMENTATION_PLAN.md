# JWT Authentication Implementation Plan

**Project**: Book Library Application  
**Date**: September 6, 2025  
**Status**: ✅ **APPROVED** - Ready for Implementation  
**Estimated Effort**: 75-95 hours  

## Executive Summary

This document provides a comprehensive implementation plan for adding JWT-based authentication to the Book Library application. The plan includes complete backend API development, frontend user interface implementation, database migrations, and security hardening.

**Key Features:**
- Secure JWT authentication with refresh tokens
- User registration with email verification
- Account security (lockout, password policies)
- Non-breaking migration for existing books
- Mobile-responsive authentication UI
- WCAG 2.1 AA accessibility compliance

## Implementation Phases

### Phase 1: Backend Authentication Infrastructure (25-30 hours)

#### 1.1 Database Schema & Migrations

**Create Authentication Tables:**

```sql
-- Users table
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    IsEmailVerified BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LastLoginAt DATETIME2 NULL,
    
    -- Security fields
    FailedLoginAttempts INT NOT NULL DEFAULT 0,
    LockoutEnd DATETIME2 NULL,
    EmailVerificationToken NVARCHAR(255) NULL,
    EmailVerificationTokenExpiry DATETIME2 NULL
);

-- RefreshTokens table
CREATE TABLE RefreshTokens (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Token NVARCHAR(500) NOT NULL UNIQUE,
    ExpiresAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedByIp NVARCHAR(45) NOT NULL,
    IsRevoked BIT NOT NULL DEFAULT 0,
    RevokedAt DATETIME2 NULL,
    RevokedByIp NVARCHAR(45) NULL,
    
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- Update Books table (add UserId relationship)
ALTER TABLE Books ADD UserId UNIQUEIDENTIFIER NULL;
ALTER TABLE Books ADD CONSTRAINT FK_Books_Users 
    FOREIGN KEY (UserId) REFERENCES Users(Id);
```

**Migration Strategy:**
1. Add nullable UserId to Books table
2. Create system user account  
3. Assign all existing books to system user
4. Provide admin interface for book reassignment

**Required Files:**
- `backend/src/LibraryApi/Data/Migrations/AddAuthentication.cs`
- `backend/src/LibraryApi/Data/Migrations/UpdateBooksWithUser.cs`
- `backend/src/LibraryApi/Models/User.cs`
- `backend/src/LibraryApi/Models/RefreshToken.cs`

#### 1.2 Authentication Models & DTOs

**Core Models:**

```csharp
// Models/User.cs
public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsEmailVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    
    // Security
    public int FailedLoginAttempts { get; set; }
    public DateTime? LockoutEnd { get; set; }
    public string? EmailVerificationToken { get; set; }
    public DateTime? EmailVerificationTokenExpiry { get; set; }
    
    // Navigation
    public ICollection<Book> Books { get; set; } = new List<Book>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    
    // Computed
    public string FullName => $"{FirstName} {LastName}".Trim();
    public bool IsLocked => LockoutEnd.HasValue && LockoutEnd > DateTime.UtcNow;
}

// Models/RefreshToken.cs  
public class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedByIp { get; set; } = string.Empty;
    public bool IsRevoked { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? RevokedByIp { get; set; }
    
    public User User { get; set; } = null!;
    
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => !IsRevoked && !IsExpired;
}
```

**Request/Response DTOs:**

```csharp
// Requests/RegisterRequest.cs
public class RegisterRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required] 
    [StringLength(100, MinimumLength = 1)]
    public string LastName { get; set; } = string.Empty;
    
    [Required]
    [StringLength(128, MinimumLength = 12)]
    [PasswordComplexity] // Custom validation attribute
    public string Password { get; set; } = string.Empty;
    
    [Required]
    [Compare(nameof(Password))]
    public string ConfirmPassword { get; set; } = string.Empty;
}

// Requests/LoginRequest.cs
public class LoginRequest  
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string Password { get; set; } = string.Empty;
    
    public bool RememberMe { get; set; }
}

// Responses/AuthResponse.cs
public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserProfileResponse User { get; set; } = null!;
}

// Responses/UserProfileResponse.cs  
public class UserProfileResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsEmailVerified { get; set; }
}
```

**Required Files:**
- `backend/src/LibraryApi/Models/User.cs`
- `backend/src/LibraryApi/Models/RefreshToken.cs`
- `backend/src/LibraryApi/Requests/RegisterRequest.cs`
- `backend/src/LibraryApi/Requests/LoginRequest.cs`
- `backend/src/LibraryApi/Responses/AuthResponse.cs`
- `backend/src/LibraryApi/Responses/UserProfileResponse.cs`

#### 1.3 Repository Layer

**Authentication Repositories:**

```csharp
// Repositories/IUserRepository.cs
public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken);
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken);
    Task IncrementFailedLoginAttemptsAsync(Guid userId, CancellationToken cancellationToken);
    Task ResetFailedLoginAttemptsAsync(Guid userId, CancellationToken cancellationToken);
    Task SetLockoutAsync(Guid userId, DateTime lockoutEnd, CancellationToken cancellationToken);
    Task SetEmailVerificationTokenAsync(Guid userId, string token, DateTime expiry, CancellationToken cancellationToken);
    Task VerifyEmailAsync(string token, CancellationToken cancellationToken);
}

// Repositories/IRefreshTokenRepository.cs
public interface IRefreshTokenRepository : IRepository<RefreshToken>
{
    Task<RefreshToken?> GetActiveTokenAsync(string token, CancellationToken cancellationToken);
    Task RevokeTokenAsync(string token, string revokedByIp, CancellationToken cancellationToken);
    Task RevokeAllUserTokensAsync(Guid userId, string revokedByIp, CancellationToken cancellationToken);
    Task CleanupExpiredTokensAsync(CancellationToken cancellationToken);
}
```

**Required Files:**
- `backend/src/LibraryApi/Repositories/IUserRepository.cs`
- `backend/src/LibraryApi/Repositories/UserRepository.cs`
- `backend/src/LibraryApi/Repositories/IRefreshTokenRepository.cs`
- `backend/src/LibraryApi/Repositories/RefreshTokenRepository.cs`

#### 1.4 Service Layer

**Authentication Services:**

```csharp
// Services/IAuthService.cs
public interface IAuthService
{
    Task<AuthResult<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
    Task<AuthResult<AuthResponse>> LoginAsync(LoginRequest request, string ipAddress, CancellationToken cancellationToken);
    Task<AuthResult<AuthResponse>> RefreshTokenAsync(string refreshToken, string ipAddress, CancellationToken cancellationToken);
    Task<AuthResult> RevokeTokenAsync(string refreshToken, string ipAddress, CancellationToken cancellationToken);
    Task<AuthResult> LogoutAsync(Guid userId, string ipAddress, CancellationToken cancellationToken);
    Task<AuthResult> SendEmailVerificationAsync(string email, CancellationToken cancellationToken);
    Task<AuthResult> VerifyEmailAsync(string token, CancellationToken cancellationToken);
    Task<UserProfileResponse?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken);
}

// Services/ITokenService.cs
public interface ITokenService
{
    string GenerateAccessToken(User user);
    RefreshToken GenerateRefreshToken(Guid userId, string ipAddress, bool rememberMe);
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    string GenerateEmailVerificationToken();
}

// Services/IEmailService.cs
public interface IEmailService  
{
    Task SendEmailVerificationAsync(string email, string firstName, string verificationToken, CancellationToken cancellationToken);
    Task SendPasswordResetAsync(string email, string firstName, string resetToken, CancellationToken cancellationToken);
    Task SendAccountLockedAsync(string email, string firstName, DateTime lockoutEnd, CancellationToken cancellationToken);
}
```

**Required Files:**
- `backend/src/LibraryApi/Services/IAuthService.cs`
- `backend/src/LibraryApi/Services/AuthService.cs`
- `backend/src/LibraryApi/Services/ITokenService.cs`
- `backend/src/LibraryApi/Services/TokenService.cs`
- `backend/src/LibraryApi/Services/IEmailService.cs`
- `backend/src/LibraryApi/Services/EmailService.cs`

#### 1.5 Controllers

**Authentication Controller:**

```csharp
// Controllers/AuthController.cs
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService authService;
    private readonly ILogger<AuthController> logger;
    
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        // Implementation
    }
    
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status423Locked)]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        // Implementation
    }
    
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> RefreshToken(CancellationToken cancellationToken)
    {
        // Implementation
    }
    
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        // Implementation  
    }
    
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserProfileResponse>> GetCurrentUser(CancellationToken cancellationToken)
    {
        // Implementation
    }
    
    [HttpPost("verify-email")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token, CancellationToken cancellationToken)
    {
        // Implementation
    }
}
```

**Update Books Controller:**

```csharp
// Add [Authorize] attribute to BooksController class
[Authorize] // Require authentication for all book operations
public class BooksController : ControllerBase
{
    // Update all methods to use current user context
    // Add userId parameter to service calls
    // Filter books by user ownership
}
```

**Required Files:**
- `backend/src/LibraryApi/Controllers/AuthController.cs`
- Update `backend/src/LibraryApi/Controllers/BooksController.cs`

#### 1.6 Security Configuration

**JWT Configuration:**

```csharp
// Configuration/JwtSettings.cs
public class JwtSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int AccessTokenExpiryMinutes { get; set; } = 15;
    public int RefreshTokenExpiryDays { get; set; } = 7;
    public int RefreshTokenExpiryHours { get; set; } = 24; // When rememberMe = false
}

// Configuration/SecuritySettings.cs
public class SecuritySettings
{
    public int MaxLoginAttempts { get; set; } = 5;
    public int LockoutDurationMinutes { get; set; } = 15;
    public int EmailVerificationTokenExpiryHours { get; set; } = 24;
    public bool RequireEmailVerification { get; set; } = true;
}
```

**Program.cs Updates:**

```csharp
// Add authentication services
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<SecuritySettings>(builder.Configuration.GetSection("Security"));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        // JWT configuration
    });

builder.Services.AddAuthorization();

// Add custom services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Add middleware
app.UseAuthentication();
app.UseAuthorization();
```

**Required Files:**
- `backend/src/LibraryApi/Configuration/JwtSettings.cs`
- `backend/src/LibraryApi/Configuration/SecuritySettings.cs`
- Update `backend/src/LibraryApi/Program.cs`

### Phase 2: Frontend Authentication Implementation (20-25 hours)

#### 2.1 Authentication Context & State Management

**Authentication Context:**

```typescript
// contexts/AuthContext.tsx
interface AuthContextValue {
  // State
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Actions  
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  
  // Utility
  isTokenExpiringSoon: () => boolean;
  clearAllSessions: () => Promise<void>;
}

// Token Management
interface TokenManager {
  getAccessToken: () => string | null;
  setAccessToken: (token: string) => void;
  clearAccessToken: () => void;
  scheduleTokenRefresh: (expiresAt: Date) => void;
  clearRefreshSchedule: () => void;
}
```

**Required Files:**
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/hooks/useAuth.ts` 
- `frontend/src/utils/tokenManager.ts`
- `frontend/src/utils/authStorage.ts`

#### 2.2 Authentication API Client

**API Client Integration:**

```typescript
// services/authApi.ts
export class AuthApiClient {
  private apiClient: AxiosInstance;
  
  constructor(private tokenManager: TokenManager) {
    this.apiClient = axios.create({
      baseURL: getApiBaseUrl(),
    });
    
    // Request interceptor - add auth header
    this.apiClient.interceptors.request.use((config) => {
      const token = this.tokenManager.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    
    // Response interceptor - handle token refresh
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry original request
            return this.apiClient.request(error.config);
          }
        }
        return Promise.reject(error);
      }
    );
  }
  
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  }
  
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  }
  
  async refreshToken(): Promise<AuthResponse> {
    const response = await this.apiClient.post<AuthResponse>('/auth/refresh');
    return response.data;
  }
  
  async logout(): Promise<void> {
    await this.apiClient.post('/auth/logout');
  }
  
  async getCurrentUser(): Promise<UserProfileResponse> {
    const response = await this.apiClient.get<UserProfileResponse>('/auth/me');
    return response.data;
  }
}
```

**Required Files:**
- `frontend/src/services/authApi.ts`
- `frontend/src/hooks/useAuthApi.ts`
- Update `frontend/src/services/apiClient.ts`

#### 2.3 Authentication Pages

**Login Page:**

```typescript
// pages/LoginPage.tsx
interface LoginPageState {
  email: string;
  password: string;
  rememberMe: boolean;
  isLoading: boolean;
  error: string | null;
}

const LoginPage: React.FC = () => {
  // Form state management
  // Validation logic  
  // Submit handling
  // Error display
  // Remember me functionality
  // Navigation to register
  
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>📚 Welcome Back</h1>
          <p>Sign in to your book library</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label htmlFor="email">Email Address</label>
            <input 
              id="email"
              type="email" 
              value={email}
              onChange={handleEmailChange}
              className={`form-input ${errors.email ? 'form-input--error' : ''}`}
              required
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password"
              value={password} 
              onChange={handlePasswordChange}
              className={`form-input ${errors.password ? 'form-input--error' : ''}`}
              required
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>
          
          <div className="form-checkbox">
            <input 
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={handleRememberMeChange}
            />
            <label htmlFor="rememberMe">Keep me signed in</label>
          </div>
          
          {error && (
            <div className="form-error-banner" role="alert">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Create one</Link></p>
        </div>
      </div>
    </div>
  );
};
```

**Register Page:**

```typescript
// pages/RegisterPage.tsx  
interface RegisterPageState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  errors: Record<string, string>;
}

// Similar structure to LoginPage with additional fields
// Password strength validation  
// Confirm password matching
// Real-time validation feedback
```

**Required Files:**
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- `frontend/src/pages/EmailVerificationPage.tsx`
- `frontend/src/components/PasswordStrengthIndicator.tsx`

#### 2.4 Protected Routes & Navigation

**Route Protection:**

```typescript
// components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback,
  requireVerification = false 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="loading-spinner">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireVerification && user && !user.isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }
  
  return <>{children}</>;
};
```

**Enhanced Layout with User Menu:**

```typescript
// components/Layout.tsx - Updated
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <img src={logo} alt="Library Logo" className="header-logo" />
            <h1>My Book Library</h1>
          </div>
          
          <nav className="nav">
            <Link to="/books" className={isActive('/books') ? 'active' : ''}>
              Books  
            </Link>
            <Link to="/stats" className={isActive('/stats') ? 'active' : ''}>
              Statistics
            </Link>
          </nav>
          
          <div className="user-menu">
            <button 
              className="user-menu-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-haspopup="true"
              aria-expanded={showUserMenu}
            >
              👤 {user?.firstName}
            </button>
            
            {showUserMenu && (
              <div className="user-menu-dropdown">
                <div className="user-menu-header">
                  <strong>{user?.fullName}</strong>
                  <span>{user?.email}</span>
                </div>
                <div className="user-menu-actions">
                  <button onClick={logout}>Sign Out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="main-content">{children}</main>
      
      <footer className="footer">
        <div className="footer-content">
          <p className="attribution">
            Book data provided by{' '}
            <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer">
              Open Library
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};
```

**Required Files:**
- `frontend/src/components/ProtectedRoute.tsx`
- Update `frontend/src/components/Layout.tsx`
- Update `frontend/src/App.tsx` (add auth routes)

#### 2.5 Authentication Styling

**Authentication Styles:**

```scss
// pages/AuthPage.scss
@use '../styles/variables' as vars;

.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: vars.$spacing-lg;
  background-color: vars.$bg-primary;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: vars.$spacing-xxl vars.$spacing-xl;
  background-color: vars.$bg-surface;
  border-radius: vars.$border-radius-lg;
  box-shadow: vars.$box-shadow-md;
}

.auth-header {
  text-align: center;
  margin-bottom: vars.$spacing-xl;
  
  h1 {
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: vars.$spacing-sm;
    color: vars.$text-primary;
  }
  
  p {
    color: vars.$text-secondary;
    font-size: 0.9rem;
  }
}

.auth-form {
  .form-field {
    margin-bottom: vars.$spacing-lg;
    
    label {
      display: block;
      margin-bottom: vars.$spacing-sm;
      font-weight: 500;
      color: vars.$text-primary;
    }
    
    .form-input {
      width: 100%;
      padding: vars.$spacing-md;
      border: 1px solid vars.$border-color;
      border-radius: vars.$border-radius-md;
      background-color: vars.$bg-primary;
      color: vars.$text-primary;
      font-size: 1rem;
      
      &:focus {
        outline: none;
        border-color: vars.$accent-primary;
        box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
      }
      
      &--error {
        border-color: vars.$accent-error;
      }
    }
    
    .form-error {
      display: block;
      margin-top: vars.$spacing-xs;
      color: vars.$accent-error;
      font-size: 0.85rem;
    }
  }
  
  .form-checkbox {
    display: flex;
    align-items: center;
    margin-bottom: vars.$spacing-lg;
    
    input[type="checkbox"] {
      margin-right: vars.$spacing-sm;
    }
    
    label {
      color: vars.$text-secondary;
      font-size: 0.9rem;
    }
  }
  
  .form-error-banner {
    padding: vars.$spacing-md;
    margin-bottom: vars.$spacing-lg;
    background-color: rgba(244, 63, 94, 0.1);
    border: 1px solid vars.$accent-error;
    border-radius: vars.$border-radius-md;
    color: vars.$accent-error;
    font-size: 0.9rem;
  }
}

.auth-footer {
  text-align: center;
  margin-top: vars.$spacing-xl;
  padding-top: vars.$spacing-lg;
  border-top: 1px solid vars.$border-color;
  
  p {
    color: vars.$text-secondary;
    font-size: 0.9rem;
    
    a {
      color: vars.$accent-primary;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

// User menu styles
.user-menu {
  position: relative;
  
  .user-menu-trigger {
    display: flex;
    align-items: center;
    padding: vars.$spacing-sm vars.$spacing-md;
    background: transparent;
    border: 1px solid vars.$border-color;
    border-radius: vars.$border-radius-md;
    color: vars.$text-primary;
    cursor: pointer;
    
    &:hover {
      background-color: vars.$bg-surface;
    }
  }
  
  .user-menu-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: vars.$spacing-xs;
    min-width: 200px;
    background-color: vars.$bg-surface;
    border: 1px solid vars.$border-color;
    border-radius: vars.$border-radius-md;
    box-shadow: vars.$box-shadow-md;
    z-index: 1000;
    
    .user-menu-header {
      padding: vars.$spacing-md;
      border-bottom: 1px solid vars.$border-color;
      
      strong {
        display: block;
        color: vars.$text-primary;
        font-size: 0.9rem;
      }
      
      span {
        color: vars.$text-secondary;
        font-size: 0.8rem;
      }
    }
    
    .user-menu-actions {
      padding: vars.$spacing-xs;
      
      button {
        width: 100%;
        padding: vars.$spacing-sm vars.$spacing-md;
        background: transparent;
        border: none;
        border-radius: vars.$border-radius-sm;
        color: vars.$text-primary;
        text-align: left;
        cursor: pointer;
        
        &:hover {
          background-color: vars.$bg-primary;
        }
      }
    }
  }
}

// Mobile responsive
@media (max-width: 768px) {
  .auth-page {
    padding: vars.$spacing-md;
  }
  
  .auth-card {
    padding: vars.$spacing-xl vars.$spacing-lg;
  }
  
  .user-menu-dropdown {
    right: auto;
    left: 0;
  }
}
```

**Password Strength Indicator:**

```scss
// components/PasswordStrengthIndicator.scss
.password-strength {
  margin-top: vars.$spacing-sm;
  
  .strength-meter {
    display: flex;
    gap: vars.$spacing-xs;
    margin-bottom: vars.$spacing-sm;
    
    .strength-bar {
      flex: 1;
      height: 4px;
      background-color: vars.$border-color;
      border-radius: 2px;
      
      &--weak { background-color: vars.$accent-error; }
      &--fair { background-color: #f59e0b; }
      &--good { background-color: #22c55e; }
      &--strong { background-color: #059669; }
    }
  }
  
  .strength-requirements {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      display: flex;
      align-items: center;
      font-size: 0.8rem;
      color: vars.$text-secondary;
      margin-bottom: vars.$spacing-xs;
      
      &.met {
        color: #22c55e;
        
        &::before {
          content: '✓';
          margin-right: vars.$spacing-xs;
        }
      }
      
      &:not(.met)::before {
        content: '○';
        margin-right: vars.$spacing-xs;
      }
    }
  }
}
```

**Required Files:**
- `frontend/src/pages/AuthPage.scss`
- `frontend/src/components/PasswordStrengthIndicator.scss`
- Update existing SCSS files for user menu

### Phase 3: Testing & Validation (15-20 hours)

#### 3.1 Backend Testing

**Unit Tests:**

```csharp
// Tests/Services/AuthServiceTests.cs
public class AuthServiceTests
{
    [Fact]
    public async Task RegisterAsync_WithValidData_ShouldCreateUser()
    {
        // Arrange
        var request = new RegisterRequest 
        { 
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe", 
            Password = "SecurePassword123!",
            ConfirmPassword = "SecurePassword123!"
        };
        
        // Act
        var result = await authService.RegisterAsync(request, CancellationToken.None);
        
        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal(request.Email, result.Data.User.Email);
    }
    
    [Fact]
    public async Task LoginAsync_WithInvalidCredentials_ShouldReturnUnauthorized()
    {
        // Test implementation
    }
    
    [Fact] 
    public async Task LoginAsync_ExceedsMaxAttempts_ShouldLockAccount()
    {
        // Test implementation
    }
}

// Tests/Controllers/AuthControllerTests.cs
public class AuthControllerTests
{
    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnOkWithToken()
    {
        // Test implementation
    }
    
    [Fact]
    public async Task Register_WithExistingEmail_ShouldReturnConflict()
    {
        // Test implementation
    }
}
```

**Integration Tests:**

```csharp
// Tests/Integration/AuthenticationIntegrationTests.cs
public class AuthenticationIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task AuthenticationFlow_EndToEnd_ShouldWork()
    {
        // Register -> Verify Email -> Login -> Access Protected Resource
    }
    
    [Fact]
    public async Task TokenRefresh_WithValidRefreshToken_ShouldReturnNewTokens()
    {
        // Test token refresh flow
    }
}
```

**Required Files:**
- `backend/src/LibraryApi.Tests/Services/AuthServiceTests.cs`
- `backend/src/LibraryApi.Tests/Services/TokenServiceTests.cs`  
- `backend/src/LibraryApi.Tests/Controllers/AuthControllerTests.cs`
- `backend/src/LibraryApi.Tests/Integration/AuthenticationIntegrationTests.cs`

#### 3.2 Frontend Testing

**Component Tests:**

```typescript
// src/pages/LoginPage.test.tsx
describe('LoginPage', () => {
  it('should render login form correctly', () => {
    render(<LoginPage />);
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
  
  it('should show validation errors for invalid input', async () => {
    render(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });
  
  it('should call login API on form submission', async () => {
    const mockLogin = vi.fn().mockResolvedValue({});
    vi.mocked(useAuth).mockReturnValue({
      login: mockLogin,
      // ... other properties
    });
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false
      });
    });
  });
});

// src/contexts/AuthContext.test.tsx
describe('AuthContext', () => {
  it('should provide authentication state', () => {
    // Test authentication context functionality
  });
  
  it('should handle token refresh automatically', async () => {
    // Test automatic token refresh
  });
  
  it('should redirect to login on token expiry', async () => {
    // Test token expiry handling
  });
});
```

**Hook Tests:**

```typescript
// src/hooks/useAuth.test.ts
describe('useAuth', () => {
  it('should return authentication state', () => {
    // Test hook functionality
  });
  
  it('should handle login flow correctly', async () => {
    // Test login process
  });
  
  it('should handle logout and cleanup', async () => {
    // Test logout process
  });
});
```

**Required Files:**
- `frontend/src/pages/LoginPage.test.tsx`
- `frontend/src/pages/RegisterPage.test.tsx`
- `frontend/src/components/ProtectedRoute.test.tsx`
- `frontend/src/contexts/AuthContext.test.tsx`
- `frontend/src/hooks/useAuth.test.ts`
- `frontend/src/utils/tokenManager.test.ts`

#### 3.3 Security Testing

**Security Test Cases:**

1. **JWT Token Security:**
   - Token tampering detection
   - Token expiry enforcement
   - Refresh token rotation
   - Token revocation

2. **Authentication Security:**
   - Brute force protection
   - Account lockout mechanisms
   - Password strength enforcement
   - Email verification bypass attempts

3. **Authorization Testing:**
   - Protected route access
   - API endpoint authorization
   - User data isolation
   - Role-based access (future)

4. **Session Management:**
   - Concurrent session handling  
   - Session timeout enforcement
   - Cross-tab synchronization
   - Logout cleanup

### Phase 4: Documentation & Deployment (10-15 hours)

#### 4.1 API Documentation

**OpenAPI Specification Updates:**

```yaml
# Add authentication endpoints to swagger.json
paths:
  /api/auth/register:
    post:
      tags: [Authentication]
      summary: Register a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterRequest'
      responses:
        '201':
          description: User registered successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      
  schemas:
    RegisterRequest:
      type: object
      required: [email, firstName, lastName, password, confirmPassword]
      properties:
        email:
          type: string
          format: email
        firstName:
          type: string
          minLength: 1
          maxLength: 100
        # ... other properties
```

#### 4.2 Configuration Documentation

**Environment Variables:**

```bash
# Required Environment Variables

# JWT Configuration
JWT_SECRET_KEY=your-256-bit-secret-key-here
JWT_ISSUER=LibraryApi
JWT_AUDIENCE=LibraryApp
JWT_ACCESS_TOKEN_EXPIRY_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRY_DAYS=7

# Security Configuration  
SECURITY_MAX_LOGIN_ATTEMPTS=5
SECURITY_LOCKOUT_DURATION_MINUTES=15
SECURITY_REQUIRE_EMAIL_VERIFICATION=true

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=noreply@yourdomain.com
SMTP_PASSWORD=smtp-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=My Book Library

# Database Connection
CONNECTION_STRING=Data Source=library.db

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### 4.3 Deployment Updates

**Docker Configuration Updates:**

```dockerfile
# backend/Dockerfile - Add environment variables
ENV JWT_SECRET_KEY=""
ENV SMTP_HOST=""
ENV SMTP_PORT=587
# ... other environment variables

# frontend/Dockerfile - No changes needed
```

**Docker Compose Updates:**

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USERNAME=${SMTP_USERNAME}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      # ... other variables
      
  frontend:
    # No changes needed - API calls go through backend
```

#### 4.4 Migration Documentation

**Database Migration Guide:**

```markdown
# Authentication Migration Guide

## Overview
This migration adds user authentication to the existing Book Library application.

## Migration Steps

### 1. Backup Database
```bash
cp library.db library.db.backup
```

### 2. Run Migrations
```bash
cd backend/src/LibraryApi
dotnet ef database update
```

### 3. Create System User (Optional)
The migration will automatically create a system user for existing books.

### 4. Configure Environment Variables
Update appsettings.json or environment variables with JWT and SMTP settings.

### 5. Test Authentication
1. Start the application
2. Navigate to /register
3. Create a new user account
4. Verify email functionality
5. Test login and protected routes

## Rollback Plan
If issues occur, restore from backup:
```bash
cp library.db.backup library.db
```

## Verification Checklist
- [ ] Database migrations applied successfully
- [ ] System user created for existing books  
- [ ] JWT tokens generated and validated
- [ ] Email verification working
- [ ] Protected routes require authentication
- [ ] User can register, login, and logout
- [ ] Book operations restricted to authenticated users
```

## Implementation Timeline & Resource Allocation

### **Phase 1: Backend Infrastructure (25-30 hours)**
- **Week 1**: Database schema, models, repositories (12-15 hours)
- **Week 2**: Services, controllers, JWT configuration (13-15 hours)

### **Phase 2: Frontend Implementation (20-25 hours)** 
- **Week 3**: Authentication context, API client, token management (10-12 hours)
- **Week 4**: Login/register pages, protected routes, UI styling (10-13 hours)

### **Phase 3: Testing & Validation (15-20 hours)**
- **Week 5**: Unit tests, integration tests, security testing (15-20 hours)

### **Phase 4: Documentation & Deployment (10-15 hours)**
- **Week 6**: Documentation, migration guides, deployment updates (10-15 hours)

## Risk Assessment & Mitigation

### **High-Risk Areas:**

1. **Database Migration Complexity**
   - **Risk**: Existing books lose relationship data
   - **Mitigation**: Non-breaking migration with system user fallback

2. **JWT Token Security**
   - **Risk**: Token compromise or manipulation
   - **Mitigation**: Secure secret generation, token rotation, HttpOnly cookies

3. **Email Delivery Reliability**
   - **Risk**: Email verification failures
   - **Mitigation**: Multiple SMTP providers, retry logic, manual verification option

4. **User Experience Disruption**
   - **Risk**: Breaking existing user workflows
   - **Mitigation**: Maintain existing URLs, graceful authentication prompts

### **Medium-Risk Areas:**

1. **Performance Impact**
   - **Risk**: Authentication overhead on API calls
   - **Mitigation**: JWT caching, efficient database queries

2. **Cross-Browser Compatibility**
   - **Risk**: Token storage issues in different browsers
   - **Mitigation**: Progressive enhancement, fallback strategies

3. **Testing Coverage**
   - **Risk**: Security vulnerabilities in edge cases
   - **Mitigation**: Comprehensive security testing, penetration testing

## Success Metrics

### **Technical Metrics:**
- [ ] 100% authentication test coverage
- [ ] Zero security vulnerabilities in security scan
- [ ] < 200ms authentication overhead per API call
- [ ] 99.9% email delivery success rate

### **User Experience Metrics:**
- [ ] < 30 seconds average registration completion time
- [ ] < 5 seconds average login completion time  
- [ ] Zero user complaints about authentication flow
- [ ] Maintain existing page load performance

### **Security Metrics:**
- [ ] Zero successful brute force attacks in testing
- [ ] 100% protection of user data isolation
- [ ] Zero token-based security incidents
- [ ] Complete audit trail of authentication events

## Dependencies & Prerequisites

### **External Dependencies:**
- SMTP service for email delivery (SendGrid, AWS SES, or similar)
- SSL certificate for production deployment
- Secure random key generation for JWT secrets

### **Internal Prerequisites:**
- Backup strategy for production database
- Monitoring and alerting for authentication failures
- Documentation for support team on user account issues

## Conclusion

This comprehensive JWT authentication implementation plan addresses all security, usability, and technical requirements identified by both the UX/UI Designer and Lead Software Engineer personas. The phased approach minimizes risk while ensuring a production-ready authentication system.

The plan follows all established code quality standards from CLAUDE.md and CLAUDE_CHEATSHEET.md, including:
- Zero-warning validation requirements
- Modern technology stack usage
- Comprehensive testing strategies
- Interface-based architecture patterns
- Structured logging for AI-assisted debugging

**Total Estimated Effort**: 75-95 hours  
**Implementation Timeline**: 6 weeks  
**Team Requirements**: 1 Full-Stack Developer  

**Approval Status**: ✅ **READY FOR IMPLEMENTATION**