#!/usr/bin/env pwsh
# Database Reset Script for Library API
# This script deletes the existing SQLite database and runs all migrations from scratch

param(
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🗄️  Library API Database Reset Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Change to backend directory
$backendPath = Join-Path $PSScriptRoot "backend"
if (-not (Test-Path $backendPath)) {
    Write-Error "Backend directory not found: $backendPath"
    exit 1
}

Set-Location $backendPath

# Define database paths
$dbPath = Join-Path $backendPath "library.db"
$dbShmPath = Join-Path $backendPath "library.db-shm"
$dbWalPath = Join-Path $backendPath "library.db-wal"

Write-Host "🔍 Checking for existing database..." -ForegroundColor Yellow

# Check if database exists
$dbExists = Test-Path $dbPath
if ($dbExists) {
    Write-Host "📋 Found existing database: library.db" -ForegroundColor Green
    
    if (-not $Force) {
        $confirmation = Read-Host "⚠️  This will permanently delete your database and all data. Continue? (y/N)"
        if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
            Write-Host "❌ Database reset cancelled" -ForegroundColor Red
            exit 0
        }
    } else {
        Write-Host "🔥 Force flag provided - skipping confirmation" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  No existing database found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🗑️  Deleting database files..." -ForegroundColor Yellow

# Remove database files if they exist
@($dbPath, $dbShmPath, $dbWalPath) | ForEach-Object {
    if (Test-Path $_) {
        try {
            Remove-Item $_ -Force
            Write-Host "   ✅ Deleted: $(Split-Path $_ -Leaf)" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Could not delete $(Split-Path $_ -Leaf): $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "      (This is usually fine - file may be locked by running processes)" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "🔧 Running Entity Framework migrations..." -ForegroundColor Yellow

# Run EF migrations to recreate the database
try {
    Write-Host "   🔄 Executing: dotnet ef database update --project src/LibraryApi" -ForegroundColor Gray
    $result = & dotnet ef database update --project src/LibraryApi 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Database migrations completed successfully" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Output:" -ForegroundColor Gray
        Write-Host $result -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "   ❌ Error running migrations: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Database reset complete!" -ForegroundColor Green
Write-Host "📊 Current migration status:" -ForegroundColor Cyan

# Show migration history
try {
    Write-Host "   🔄 Checking applied migrations..." -ForegroundColor Gray
    $migrations = & dotnet ef migrations list --project src/LibraryApi --no-build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host $migrations -ForegroundColor White
    } else {
        Write-Host "   ⚠️  Could not retrieve migration list" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Could not check migration status: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Your fresh database is ready!" -ForegroundColor Green
Write-Host "   • Database: library.db" -ForegroundColor White
Write-Host "   • Location: $dbPath" -ForegroundColor White
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Cyan
Write-Host "   • Start your development server if not already running" -ForegroundColor White
Write-Host "   • Test the API endpoints to verify everything works" -ForegroundColor White
Write-Host "   • Import any test data you need" -ForegroundColor White