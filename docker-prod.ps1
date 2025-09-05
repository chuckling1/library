#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Production Docker management script for Library application

.DESCRIPTION
    This script provides easy commands to manage the Library application Docker containers in production mode.
    Includes SSL setup, backup configuration, and monitoring capabilities.

.PARAMETER Command
    Action to perform: start, stop, restart, logs, status, clean, build, backup

.EXAMPLE
    .\docker-prod.ps1 start
    Start all production containers

.EXAMPLE
    .\docker-prod.ps1 backup
    Start production containers with backup service

.EXAMPLE
    .\docker-prod.ps1 logs
    Show logs for all production containers
#>

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet("start", "stop", "restart", "logs", "status", "clean", "build", "backup")]
    [string]$Command,
    
    [Parameter(Position = 1)]
    [string]$Service = ""
)

# Set error action preference
$ErrorActionPreference = "Stop"

function Write-ColorOutput {
    param($Message, $Color = 'White')
    $originalColor = [Console]::ForegroundColor
    [Console]::ForegroundColor = $Color
    Write-Host $Message
    [Console]::ForegroundColor = $originalColor
}

function Ensure-Directories {
    Write-ColorOutput "🔧 Creating required directories..." 'Yellow'
    $directories = @("data", "backups", "ssl", "logs")
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
    Write-ColorOutput "📊 Production Container Status:" 'Yellow'
    docker-compose -f docker-compose.prod.yml ps
    
    Write-ColorOutput "`n🔗 Production Service URLs:" 'Yellow'
    Write-ColorOutput "  Application: http://localhost" 'Green'
    Write-ColorOutput "  Backend API: http://localhost:5000" 'Green'
    Write-ColorOutput "  Reverse Proxy: http://localhost:8080" 'Green'
    Write-ColorOutput "  Health Check: http://localhost/health" 'Green'
    Write-ColorOutput "  Nginx Status: http://localhost:8080/nginx_status" 'Green'
}

function Check-SSL {
    if (!(Test-Path "ssl\cert.pem") -or !(Test-Path "ssl\key.pem")) {
        Write-ColorOutput "⚠️  SSL certificates not found in ssl/ directory." 'Yellow'
        Write-ColorOutput "   HTTPS will not be available. HTTP will work on port 80." 'Yellow'
        Write-ColorOutput "   To enable HTTPS, place cert.pem and key.pem in ssl/ directory." 'Yellow'
    } else {
        Write-ColorOutput "🔒 SSL certificates found - HTTPS ready." 'Green'
    }
}

# Main script logic
Write-ColorOutput "🚀 Library Production Docker Manager" 'Yellow'

if (!(Test-DockerRunning)) {
    exit 1
}

switch ($Command) {
    "start" {
        Write-ColorOutput "🏗️ Starting production environment..." 'Yellow'
        Ensure-Directories
        Check-SSL
        
        # Copy environment file
        Copy-Item ".env.production" ".env" -Force
        
        docker-compose -f docker-compose.prod.yml up -d
        
        Write-ColorOutput "`n⏳ Waiting for services to be healthy..." 'Yellow'
        Start-Sleep -Seconds 15
        Show-Status
    }
    
    "backup" {
        Write-ColorOutput "🏗️ Starting production environment with backup service..." 'Yellow'
        Ensure-Directories
        Check-SSL
        
        # Copy environment file
        Copy-Item ".env.production" ".env" -Force
        
        docker-compose -f docker-compose.prod.yml --profile backup up -d
        
        Write-ColorOutput "`n⏳ Waiting for services to be healthy..." 'Yellow'
        Start-Sleep -Seconds 15
        Show-Status
        Write-ColorOutput "`n💾 Database backup service enabled - Daily backups at 2 AM" 'Green'
    }
    
    "stop" {
        Write-ColorOutput "🛑 Stopping all production containers..." 'Yellow'
        docker-compose -f docker-compose.prod.yml down
        Write-ColorOutput "✅ All production containers stopped." 'Green'
    }
    
    "restart" {
        Write-ColorOutput "🔄 Restarting production environment..." 'Yellow'
        docker-compose -f docker-compose.prod.yml down
        Start-Sleep -Seconds 3
        docker-compose -f docker-compose.prod.yml up -d
        Start-Sleep -Seconds 15
        Show-Status
    }
    
    "logs" {
        if ($Service) {
            Write-ColorOutput "📋 Showing production logs for $Service..." 'Yellow'
            docker-compose -f docker-compose.prod.yml logs -f $Service
        } else {
            Write-ColorOutput "📋 Showing logs for all production services..." 'Yellow'
            docker-compose -f docker-compose.prod.yml logs -f
        }
    }
    
    "status" {
        Show-Status
        
        Write-ColorOutput "`n📈 Resource Usage:" 'Yellow'
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
    }
    
    "build" {
        Write-ColorOutput "🔨 Rebuilding all production containers..." 'Yellow'
        docker-compose -f docker-compose.prod.yml build --no-cache
        Write-ColorOutput "✅ Production build complete." 'Green'
    }
    
    "clean" {
        Write-ColorOutput "🧹 Cleaning up production containers and volumes..." 'Yellow'
        docker-compose -f docker-compose.prod.yml down -v
        docker system prune -f
        Write-ColorOutput "✅ Production cleanup complete." 'Green'
    }
}

Write-ColorOutput "`n🎉 Production operation complete!" 'Green'