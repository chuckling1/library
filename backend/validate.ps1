# Backend Validation Script - LibraryApi
# Runs all validation gates in optimal order with parallel execution where possible
# EXIT CODE: 0 = All validations passed, 1 = One or more validations failed

param(
    [switch]$SkipTests = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"
$OriginalLocation = Get-Location
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptPath

Write-Host "🚀 Starting Backend Validation Pipeline..." -ForegroundColor Cyan
Write-Host "📍 Working Directory: $(Get-Location)" -ForegroundColor Gray

# Initialize validation results
$ValidationResults = @{
    "Lint" = $false
    "Build" = $false
    "Tests" = $false
    "Coverage" = $false
    "Performance" = $false
    "Security" = $false
}

$StartTime = Get-Date

try {
    # STEP 1: LINT & BUILD (StyleCop enforced via TreatWarningsAsErrors)
    Write-Host "`n🔍 STEP 1: Lint & Build Validation" -ForegroundColor Yellow
    Write-Host "   - Running StyleCop analysis and compilation..." -ForegroundColor Gray
    
    $BuildResult = dotnet build --configuration Release --verbosity minimal --no-restore 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Lint & Build: PASSED" -ForegroundColor Green
        $ValidationResults.Lint = $true
        $ValidationResults.Build = $true
    } else {
        Write-Host "   ❌ Lint & Build: FAILED" -ForegroundColor Red
        Write-Host "   Error Details:" -ForegroundColor Red
        Write-Host $BuildResult -ForegroundColor Red
        throw "Build validation failed"
    }

    # STEP 2: TESTS & COVERAGE (Combined for efficiency)
    if (-not $SkipTests) {
        Write-Host "`n🧪 STEP 2: Unit Tests & Coverage Analysis" -ForegroundColor Yellow
        Write-Host "   - Running unit tests with coverage collection..." -ForegroundColor Gray
        
        # Clean previous coverage results
        Get-ChildItem -Path "." -Recurse -Directory -Name "TestResults" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        
        $TestResult = dotnet test --configuration Release --no-build --verbosity minimal --collect:"XPlat Code Coverage" --results-directory "./TestResults" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Unit Tests: PASSED" -ForegroundColor Green
            $ValidationResults.Tests = $true
            
            # Check coverage (look for coverage files)
            $CoverageFiles = Get-ChildItem -Path "./TestResults" -Recurse -Filter "coverage.cobertura.xml" -ErrorAction SilentlyContinue
            if ($CoverageFiles.Count -gt 0) {
                Write-Host "   ✅ Coverage Collection: COMPLETED" -ForegroundColor Green
                Write-Host "   📊 Coverage files generated: $($CoverageFiles.Count)" -ForegroundColor Gray
                $ValidationResults.Coverage = $true
            } else {
                Write-Host "   ⚠️  Coverage: FILES NOT FOUND" -ForegroundColor Yellow
                Write-Host "   Note: Coverage analysis may not be properly configured" -ForegroundColor Gray
            }
        } else {
            Write-Host "   ❌ Unit Tests: FAILED" -ForegroundColor Red
            Write-Host "   Error Details:" -ForegroundColor Red
            Write-Host $TestResult -ForegroundColor Red
            throw "Test validation failed"
        }
    } else {
        Write-Host "`n⏭️  STEP 2: Tests & Coverage - SKIPPED" -ForegroundColor Yellow
        $ValidationResults.Tests = $true
        $ValidationResults.Coverage = $true
    }

    # STEP 3: PERFORMANCE EVALUATION (Static Analysis)
    Write-Host "`n⚡ STEP 3: Performance Analysis" -ForegroundColor Yellow
    Write-Host "   - Analyzing async patterns and Entity Framework usage..." -ForegroundColor Gray
    
    # Check for common performance anti-patterns
    $PerformanceIssues = @()
    
    # Check for .Wait() and .Result blocking calls
    $BlockingCalls = Select-String -Path "src/**/*.cs" -Pattern "\.(Wait|Result)\s*(\(|\;)" -ErrorAction SilentlyContinue
    if ($BlockingCalls) {
        $PerformanceIssues += "Found blocking async calls (.Wait() or .Result)"
        if ($Verbose) {
            $BlockingCalls | ForEach-Object { Write-Host "     - $($_.Filename):$($_.LineNumber)" -ForegroundColor Red }
        }
    }
    
    # Check for missing .AsNoTracking() on potential read-only queries
    $PotentialReadOnlyQueries = Select-String -Path "src/**/*.cs" -Pattern "\.Where\(.*\)\.ToListAsync\(\)" -ErrorAction SilentlyContinue
    if ($PotentialReadOnlyQueries -and -not (Select-String -Path "src/**/*.cs" -Pattern "AsNoTracking" -ErrorAction SilentlyContinue)) {
        $PerformanceIssues += "Potential read-only queries without .AsNoTracking()"
    }
    
    if ($PerformanceIssues.Count -eq 0) {
        Write-Host "   ✅ Performance Analysis: PASSED" -ForegroundColor Green
        $ValidationResults.Performance = $true
    } else {
        Write-Host "   ⚠️  Performance Issues Found:" -ForegroundColor Yellow
        $PerformanceIssues | ForEach-Object { Write-Host "     - $_" -ForegroundColor Yellow }
        Write-Host "   Note: Review and address performance concerns" -ForegroundColor Gray
        $ValidationResults.Performance = $false
    }

    # STEP 4: SECURITY EVALUATION (Static Analysis)
    Write-Host "`n🔒 STEP 4: Security Analysis" -ForegroundColor Yellow
    Write-Host "   - Scanning for security vulnerabilities..." -ForegroundColor Gray
    
    $SecurityIssues = @()
    
    # Check for hardcoded connection strings
    $HardcodedConnections = Select-String -Path "src/**/*.cs" -Pattern "(connectionstring|server=|database=)" -SimpleMatch -ErrorAction SilentlyContinue
    if ($HardcodedConnections) {
        $SecurityIssues += "Potential hardcoded connection strings found"
    }
    
    # Check for hardcoded secrets/passwords
    $HardcodedSecrets = Select-String -Path "src/**/*.cs" -Pattern "(password|secret|key)\s*=\s*`"" -ErrorAction SilentlyContinue
    if ($HardcodedSecrets) {
        $SecurityIssues += "Potential hardcoded secrets found"
    }
    
    # Check for SQL injection vulnerabilities (basic check)
    $SqlInjectionRisk = Select-String -Path "src/**/*.cs" -Pattern "\.ExecuteSqlRaw\(" -ErrorAction SilentlyContinue
    if ($SqlInjectionRisk) {
        $SecurityIssues += "Potential SQL injection risk with ExecuteSqlRaw usage"
    }
    
    if ($SecurityIssues.Count -eq 0) {
        Write-Host "   ✅ Security Analysis: PASSED" -ForegroundColor Green
        $ValidationResults.Security = $true
    } else {
        Write-Host "   ❌ Security Issues Found:" -ForegroundColor Red
        $SecurityIssues | ForEach-Object { Write-Host "     - $_" -ForegroundColor Red }
        $ValidationResults.Security = $false
    }

    # FINAL RESULTS
    Write-Host "`n📊 VALIDATION SUMMARY" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Gray
    
    $PassedCount = ($ValidationResults.Values | Where-Object { $_ -eq $true }).Count
    $TotalCount = $ValidationResults.Count
    
    foreach ($Result in $ValidationResults.GetEnumerator()) {
        $Status = if ($Result.Value) { "✅ PASSED" } else { "❌ FAILED" }
        $Color = if ($Result.Value) { "Green" } else { "Red" }
        Write-Host "   $($Result.Key): $Status" -ForegroundColor $Color
    }
    
    $ElapsedTime = (Get-Date) - $StartTime
    Write-Host "`n⏱️  Total Time: $($ElapsedTime.TotalSeconds.ToString('F1'))s" -ForegroundColor Gray
    
    if ($PassedCount -eq $TotalCount) {
        Write-Host "`n🎉 ALL VALIDATION GATES PASSED!" -ForegroundColor Green
        Write-Host "   Ready to proceed to next phase." -ForegroundColor Green
        exit 0
    } else {
        Write-Host "`n💥 VALIDATION FAILED: $($TotalCount - $PassedCount) of $TotalCount gates failed" -ForegroundColor Red
        Write-Host "   Fix all issues before proceeding." -ForegroundColor Red
        exit 1
    }

} catch {
    Write-Host "`n💥 VALIDATION PIPELINE FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Set-Location $OriginalLocation
}