#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Development Docker management script for Library application

.DESCRIPTION
    This script provides easy commands to manage the Library application Docker containers in development mode.
    Includes automatic directory creation, health checks, and log monitoring.

.PARAMETER Command
    Action to perform: start, stop, restart, logs, status, clean, build

.EXAMPLE
    .\docker-dev.ps1 start
    Start all development containers

.EXAMPLE
    .\docker-dev.ps1 logs backend
    Show backend container logs

.EXAMPLE
    .\docker-dev.ps1 status
    Show status of all containers
#>

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet("start", "stop", "restart", "logs", "status", "clean", "build", "debug")]
    [string]$Command,
    
    [Parameter(Position = 1)]
    [string]$Service = ""
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Green = [Console]::ForegroundColor = 'Green'
$Yellow = [Console]::ForegroundColor = 'Yellow' 
$Red = [Console]::ForegroundColor = 'Red'
$Reset = [Console]::ResetColor()

function Write-ColorOutput {
    param($Message, $Color = 'White')
    $originalColor = [Console]::ForegroundColor
    [Console]::ForegroundColor = $Color
    Write-Host $Message
    [Console]::ForegroundColor = $originalColor
}

function Ensure-Directories {
    Write-ColorOutput "🔧 Creating required directories..." 'Yellow'
    $directories = @("backend\data", "backend\logs", "data", "backups", "ssl")
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-ColorOutput "  ✅ Created: $dir" 'Green'
        }
    }
}

function Test-DockerRunning {
    try {
        docker version | Out-Null
        return $true
    }
    catch {
        Write-ColorOutput "❌ Docker is not running. Please start Docker Desktop." 'Red'
        return $false
    }
}

function Show-Status {
    Write-ColorOutput "📊 Container Status:" 'Yellow'
    docker-compose ps
    
    Write-ColorOutput "`n🔗 Service URLs:" 'Yellow'
    Write-ColorOutput "  Frontend: http://localhost:3000" 'Green'
    Write-ColorOutput "  Backend API: http://localhost:5000" 'Green'
    Write-ColorOutput "  Swagger UI: http://localhost:5000/swagger" 'Green'
    Write-ColorOutput "  Database Browser: http://localhost:8080 (debug profile only)" 'Green'
}

# Main script logic
Write-ColorOutput "🚀 Library Docker Development Manager" 'Yellow'

if (!(Test-DockerRunning)) {
    exit 1
}

switch ($Command) {
    "start" {
        Write-ColorOutput "🏗️ Starting development environment..." 'Yellow'
        Ensure-Directories
        
        # Copy environment file
        Copy-Item ".env.development" ".env" -Force
        
        docker-compose up -d
        
        Write-ColorOutput "`n⏳ Waiting for services to be healthy..." 'Yellow'
        Start-Sleep -Seconds 10
        Show-Status
    }
    
    "debug" {
        Write-ColorOutput "🐛 Starting development environment with debug services..." 'Yellow'
        Ensure-Directories
        
        # Copy environment file
        Copy-Item ".env.development" ".env" -Force
        
        docker-compose --profile debug up -d
        
        Write-ColorOutput "`n⏳ Waiting for services to be healthy..." 'Yellow'
        Start-Sleep -Seconds 10
        Show-Status
        Write-ColorOutput "`n🔍 Debug services enabled - Database browser available at http://localhost:8080" 'Green'
    }
    
    "stop" {
        Write-ColorOutput "🛑 Stopping all containers..." 'Yellow'
        docker-compose down
        Write-ColorOutput "✅ All containers stopped." 'Green'
    }
    
    "restart" {
        Write-ColorOutput "🔄 Restarting development environment..." 'Yellow'
        docker-compose down
        Start-Sleep -Seconds 2
        docker-compose up -d
        Start-Sleep -Seconds 10
        Show-Status
    }
    
    "logs" {
        if ($Service) {
            Write-ColorOutput "📋 Showing logs for $Service..." 'Yellow'
            docker-compose logs -f $Service
        } else {
            Write-ColorOutput "📋 Showing logs for all services..." 'Yellow'
            docker-compose logs -f
        }
    }
    
    "status" {
        Show-Status
    }
    
    "build" {
        Write-ColorOutput "🔨 Rebuilding all containers..." 'Yellow'
        docker-compose build --no-cache
        Write-ColorOutput "✅ Build complete." 'Green'
    }
    
    "clean" {
        Write-ColorOutput "🧹 Cleaning up containers and volumes..." 'Yellow'
        docker-compose down -v
        docker system prune -f
        Write-ColorOutput "✅ Cleanup complete." 'Green'
    }
}

Write-ColorOutput "`n🎉 Operation complete!" 'Green'