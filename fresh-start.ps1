#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Fresh Start Script - Book Library Application

.DESCRIPTION
    This script provides a complete "fresh start" setup that:
    1. Resets the entire development environment 
    2. Cleans all build artifacts and dependencies
    3. Reinstalls everything from scratch
    4. Resets the database completely
    5. Runs validation and starts dev servers

.PARAMETER SkipDeps
    Skip dependency reinstallation (faster, use existing node_modules)

.PARAMETER SkipDb
    Skip database reset (keep existing data)

.PARAMETER SkipBuild
    Skip build validation step

.PARAMETER SkipStart
    Skip starting development servers

.PARAMETER Verbose
    Show detailed output from all commands

.EXAMPLE
    .\fresh-start.ps1
    Full fresh start with all steps

.EXAMPLE
    .\fresh-start.ps1 -SkipDeps -SkipDb
    Fresh start keeping dependencies and database
#>

param(
    [switch]$SkipDeps,
    [switch]$SkipDb, 
    [switch]$SkipBuild,
    [switch]$SkipStart,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$StartTime = Get-Date

Write-Host ""
Write-Host "🚀 Book Library Fresh Start Script" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host "📍 Working Directory: $PWD"
Write-Host "⏰ Started at: $(Get-Date -Format 'HH:mm:ss')"
Write-Host ""

if ($SkipDeps) { Write-Host "⏭️  Skipping dependency reinstallation" -ForegroundColor Yellow }
if ($SkipDb) { Write-Host "⏭️  Skipping database reset" -ForegroundColor Yellow }
if ($SkipBuild) { Write-Host "⏭️  Skipping build validation" -ForegroundColor Yellow }
if ($SkipStart) { Write-Host "⏭️  Skipping development server startup" -ForegroundColor Yellow }

function Invoke-CommandWithLogging {
    param(
        [string]$Command,
        [string]$Description,
        [string]$WorkingDirectory = $PWD,
        [switch]$IgnoreErrors
    )
    
    try {
        Write-Host ""
        Write-Host "📋 $Description..." -ForegroundColor Cyan
        if ($Verbose) {
            Write-Host "   Command: $Command" -ForegroundColor DarkGray
        }
        
        $output = if ($Verbose) {
            Invoke-Expression "& $Command" 2>&1 | Tee-Object -Variable output
        } else {
            Invoke-Expression "& $Command" 2>&1
        }
        
        Write-Host "✅ Success" -ForegroundColor Green
        return @{ Success = $true; Output = $output }
    }
    catch {
        if ($IgnoreErrors) {
            Write-Host "⚠️  Command failed (ignored)" -ForegroundColor Yellow
            return @{ Success = $false; Error = $_.Exception.Message }
        }
        
        Write-Host "❌ Failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

function Remove-DirectoryIfExists {
    param(
        [string]$Path,
        [string]$Description
    )
    
    if (Test-Path $Path) {
        Write-Host ""
        Write-Host "🗑️  Removing $Description..." -ForegroundColor Yellow
        Remove-Item -Path $Path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Removed" -ForegroundColor Green
    }
}

function Test-CommandExists {
    param([string]$Command)
    
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Start-DevelopmentServers {
    Write-Host ""
    Write-Host "🚀 Starting Development Servers..." -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Starting both backend and frontend servers..."
    Write-Host "📍 Backend: http://localhost:5000"  
    Write-Host "📍 Frontend: http://localhost:3000"
    Write-Host "📍 Swagger: http://localhost:5000/swagger"
    Write-Host ""
    Write-Host "💡 Press Ctrl+C to stop servers" -ForegroundColor Yellow
    
    # Start the dev servers using npm run dev
    try {
        npm run dev
    }
    catch {
        Write-Host "⏹️  Development servers stopped" -ForegroundColor Yellow
    }
}

try {
    # STEP 1: Environment Check
    Write-Host ""
    Write-Host "🔍 STEP 1: Environment Prerequisites Check" -ForegroundColor Magenta
    Write-Host "==========================================" -ForegroundColor Magenta
    
    $prerequisites = @(
        @{ Command = "node"; Name = "Node.js"; VersionCommand = "node --version" },
        @{ Command = "npm"; Name = "npm"; VersionCommand = "npm --version" },
        @{ Command = "dotnet"; Name = ".NET SDK"; VersionCommand = "dotnet --version" }
    )
    
    foreach ($prereq in $prerequisites) {
        if (Test-CommandExists $prereq.Command) {
            $version = & $prereq.VersionCommand
            Write-Host "✅ $($prereq.Name): $version" -ForegroundColor Green
        } else {
            Write-Host "❌ $($prereq.Name): Not found" -ForegroundColor Red
            Write-Host "   Please install $($prereq.Name) before running this script" -ForegroundColor Red
            exit 1
        }
    }
    
    # STEP 2: Clean Development Environment
    Write-Host ""
    Write-Host "🧹 STEP 2: Clean Development Environment" -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
    
    # Stop any running development servers
    Write-Host ""
    Write-Host "🛑 Stopping any running development servers..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*run*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Clean build artifacts
    Remove-DirectoryIfExists "frontend\dist" "frontend build artifacts"
    Remove-DirectoryIfExists "frontend\.vite" "frontend Vite cache"
    Remove-DirectoryIfExists "backend\src\LibraryApi\bin" "backend build artifacts"
    Remove-DirectoryIfExists "backend\src\LibraryApi\obj" "backend object files"
    Remove-DirectoryIfExists "backend\src\LibraryApi.Tests\bin" "backend test build artifacts"
    Remove-DirectoryIfExists "backend\src\LibraryApi.Tests\obj" "backend test object files"
    
    # Clean logs
    Remove-DirectoryIfExists "backend\src\LibraryApi\logs" "application logs"
    
    if (-not $SkipDeps) {
        # Clean dependency folders
        Remove-DirectoryIfExists "node_modules" "root node_modules"
        Remove-DirectoryIfExists "frontend\node_modules" "frontend node_modules"
        
        # Clean package locks (will be regenerated)
        $lockFiles = @("package-lock.json", "frontend\package-lock.json")
        
        foreach ($lockFile in $lockFiles) {
            if (Test-Path $lockFile) {
                Remove-Item $lockFile -Force
                Write-Host "🗑️  Removed $lockFile"
            }
        }
    }
    
    # STEP 3: Database Reset
    if (-not $SkipDb) {
        Write-Host ""
        Write-Host "🗄️  STEP 3: Database Reset" -ForegroundColor Magenta
        Write-Host "==========================" -ForegroundColor Magenta
        
        $dbFiles = @(
            "backend\src\LibraryApi\library.db",
            "backend\src\LibraryApi\library.db-shm", 
            "backend\src\LibraryApi\library.db-wal"
        )
        
        foreach ($dbFile in $dbFiles) {
            if (Test-Path $dbFile) {
                Remove-Item $dbFile -Force
                Write-Host "🗑️  Removed $dbFile"
            }
        }
        
        Write-Host "✅ Database reset complete" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⏭️  STEP 3: Database Reset - SKIPPED" -ForegroundColor Yellow
    }
    
    # STEP 4: Install Dependencies
    if (-not $SkipDeps) {
        Write-Host ""
        Write-Host "📦 STEP 4: Install Dependencies" -ForegroundColor Magenta
        Write-Host "===============================" -ForegroundColor Magenta
        
        # Install root dependencies
        Invoke-CommandWithLogging "npm install" "Installing root project dependencies"
        
        # Install frontend dependencies
        Push-Location "frontend"
        try {
            Invoke-CommandWithLogging "npm install" "Installing frontend dependencies"
        } finally {
            Pop-Location
        }
        
        # Restore backend dependencies
        Push-Location "backend"
        try {
            Invoke-CommandWithLogging "dotnet restore" "Restoring .NET packages"
        } finally {
            Pop-Location
        }
    } else {
        Write-Host ""
        Write-Host "⏭️  STEP 4: Install Dependencies - SKIPPED" -ForegroundColor Yellow
    }
    
    # STEP 5: Build and Validate
    if (-not $SkipBuild) {
        Write-Host ""
        Write-Host "🔨 STEP 5: Build and Validate" -ForegroundColor Magenta
        Write-Host "=============================" -ForegroundColor Magenta
        
        # Build backend
        Push-Location "backend"
        try {
            Invoke-CommandWithLogging "dotnet build --configuration Release" "Building backend project"
            Invoke-CommandWithLogging "dotnet ef database update --project src/LibraryApi" "Setting up database schema"
        } finally {
            Pop-Location
        }
        
        # TypeScript check and build frontend
        Push-Location "frontend"
        try {
            Invoke-CommandWithLogging "npm run type-check" "Running TypeScript type check"
            Invoke-CommandWithLogging "npm run build" "Building frontend for production"
        } finally {
            Pop-Location
        }
        
        Write-Host "✅ All builds successful" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⏭️  STEP 5: Build and Validate - SKIPPED" -ForegroundColor Yellow
    }
    
    # STEP 6: Final Setup
    Write-Host ""
    Write-Host "🎯 STEP 6: Final Setup" -ForegroundColor Magenta
    Write-Host "======================" -ForegroundColor Magenta
    
    # Create any missing directories
    $requiredDirs = @(
        "backend\src\LibraryApi\logs",
        "frontend\coverage"
    )
    
    foreach ($dir in $requiredDirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "📁 Created directory: $dir"
        }
    }
    
    # Create .env files if they don't exist
    $frontendEnvPath = "frontend\.env.development"
    if (-not (Test-Path $frontendEnvPath)) {
        $envContent = @"
# Frontend Development Environment
VITE_API_BASE_URL=http://localhost:5000
VITE_ENVIRONMENT=development
"@
        Set-Content -Path $frontendEnvPath -Value $envContent
        Write-Host "📄 Created frontend\.env.development"
    }
    
    # Success Summary
    $elapsedTime = [math]::Round(((Get-Date) - $StartTime).TotalSeconds, 1)
    Write-Host ""
    Write-Host "🎉 FRESH START COMPLETE!" -ForegroundColor Green
    Write-Host "========================" -ForegroundColor Green
    Write-Host "⏱️  Total Time: ${elapsedTime}s"
    Write-Host "✅ Environment cleaned and reset" -ForegroundColor Green
    Write-Host "✅ Dependencies installed" -ForegroundColor Green  
    Write-Host "✅ Database schema created" -ForegroundColor Green
    Write-Host "✅ All projects built successfully" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🔗 Available URLs:" -ForegroundColor Cyan
    Write-Host "   • Frontend: http://localhost:3000"
    Write-Host "   • Backend API: http://localhost:5000" 
    Write-Host "   • Swagger UI: http://localhost:5000/swagger"
    
    Write-Host ""
    Write-Host "📋 Quick Commands:" -ForegroundColor Cyan
    Write-Host "   • Start development: npm run dev"
    Write-Host "   • Run all tests: npm run test"
    Write-Host "   • Run validation: npm run validate"
    Write-Host "   • Fresh start again: .\fresh-start.ps1"
    
    # STEP 7: Start Development Servers
    if (-not $SkipStart) {
        Write-Host ""
        Write-Host "🚀 Starting development servers in 3 seconds..." -ForegroundColor Green
        Write-Host "   Press Ctrl+C to cancel startup" -ForegroundColor Yellow
        
        # Give user 3 seconds to cancel
        for ($i = 3; $i -gt 0; $i--) {
            Write-Host -NoNewline "`r   Starting in $i..."
            Start-Sleep -Seconds 1
        }
        Write-Host "`r   Starting now!        "
        Write-Host ""
        
        Start-DevelopmentServers
    } else {
        Write-Host ""
        Write-Host "⏭️  Development servers not started (--skip-start)" -ForegroundColor Yellow
        Write-Host "   Run 'npm run dev' to start servers manually"
    }
    
} catch {
    Write-Host ""
    Write-Host "💥 FRESH START FAILED" -ForegroundColor Red
    Write-Host "=====================" -ForegroundColor Red
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Ensure Node.js 18+ and .NET 8+ are installed"
    Write-Host "   2. Close any running development servers"
    Write-Host "   3. Check file permissions"
    Write-Host "   4. Try running with -Verbose for more details"
    
    exit 1
}

# Handle script interruption gracefully
trap {
    Write-Host ""
    Write-Host "Fresh start interrupted by user" -ForegroundColor Yellow
    exit 0
}