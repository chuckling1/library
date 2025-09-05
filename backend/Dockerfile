# Backend Dockerfile - Multi-stage build for .NET 9 Web API
# Stage 1: Build environment with SDK
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution file and project files for dependency resolution
COPY LibraryApi.sln .
COPY src/LibraryApi/LibraryApi.csproj src/LibraryApi/
COPY src/LibraryApi.Tests/LibraryApi.Tests.csproj src/LibraryApi.Tests/

# Restore dependencies (cached layer if project files unchanged)
RUN dotnet restore

# Copy all source code
COPY . .

# Build the application in Release mode
WORKDIR /src/src/LibraryApi
RUN dotnet restore && dotnet build -c Release

# Run tests to ensure quality in container build
WORKDIR /src
RUN dotnet test -c Release --logger:trx --results-directory /testresults/

# Publish the application
WORKDIR /src/src/LibraryApi
RUN dotnet publish -c Release -o /app/publish

# Stage 2: Runtime environment with minimal ASP.NET Core runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Create non-root user for security
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

# Copy published application from build stage
COPY --from=build /app/publish .

# Create directory for SQLite database with proper permissions
RUN mkdir -p /app/data

# Expose port (ASP.NET Core default)
EXPOSE 8080

# Environment variables for production
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Entry point
ENTRYPOINT ["dotnet", "LibraryApi.dll"]