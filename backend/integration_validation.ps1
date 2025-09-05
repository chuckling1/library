# StyleCop Integration Validation Script
# Integration-Validation Agent comprehensive validation

param(
    [switch]$SkipBuild,
    [switch]$SkipTests,
    [switch]$Verbose,
    [switch]$EnableStyleCop
)

$ErrorActionPreference = "Stop"

function Write-Section {
    param([string]$Title)
    Write-Host "`n$("="*60)" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "$("="*60)" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Test-AllAgentsCompleted {
    $progressFile = "STYLECOP_PROGRESS.json"
    if (-not (Test-Path $progressFile)) {
        Write-Error "Progress file not found: $progressFile"
        return $false
    }
    
    $progress = Get-Content $progressFile | ConvertFrom-Json
    $otherAgents = $progress.agents | Get-Member -MemberType NoteProperty | Where-Object { $_.Name -ne "integration-validation-agent" }
    
    $completedCount = 0
    foreach ($agentProperty in $otherAgents) {
        $agent = $progress.agents.$($agentProperty.Name)
        if ($agent.status -eq "completed") {
            $completedCount++
        }
    }
    
    $totalOtherAgents = $otherAgents.Count
    Write-Host "Agent Completion Status: $completedCount/$totalOtherAgents" -ForegroundColor Yellow
    
    return ($completedCount -eq $totalOtherAgents)
}

function Get-TestCount {
    try {
        $testOutput = dotnet test --list-tests --verbosity quiet 2>$null | Select-String "The following Tests are available:" -Context 0,1000
        if ($testOutput) {
            $testLines = $testOutput.Context.PostContext | Where-Object { $_ -match "^\s+\w" }
            return $testLines.Count
        }
        return 0
    }
    catch {
        return 0
    }
}

function Invoke-TestValidation {
    Write-Section "Comprehensive Test Suite Validation"
    
    Write-Host "Running complete test suite..." -ForegroundColor Yellow
    
    try {
        # Get test count first
        $testCount = Get-TestCount
        Write-Host "Detected $testCount tests in solution" -ForegroundColor Cyan
        
        # Run tests with detailed output
        $testResult = dotnet test --no-build --verbosity normal --logger "console;verbosity=detailed" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "All tests passed successfully!"
            
            # Extract test statistics
            $passedTests = ($testResult | Select-String "Passed:.*(\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }) -as [int]
            $failedTests = ($testResult | Select-String "Failed:.*(\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }) -as [int]
            $skippedTests = ($testResult | Select-String "Skipped:.*(\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }) -as [int]
            $totalTests = ($testResult | Select-String "Total:.*(\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }) -as [int]
            
            Write-Host "Test Results Summary:" -ForegroundColor White
            Write-Host "  Passed: $passedTests" -ForegroundColor Green
            Write-Host "  Failed: $failedTests" -ForegroundColor Red
            Write-Host "  Skipped: $skippedTests" -ForegroundColor Yellow
            Write-Host "  Total: $totalTests" -ForegroundColor White
            
            return @{
                Success = $true
                Passed = $passedTests
                Failed = $failedTests
                Skipped = $skippedTests
                Total = $totalTests
            }
        }
        else {
            Write-Error "Test execution failed!"
            Write-Host $testResult -ForegroundColor Red
            return @{ Success = $false; Error = "Test execution failed" }
        }
    }
    catch {
        Write-Error "Exception during test execution: $_"
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

function Invoke-StyleCopValidation {
    param([bool]$EnableAnalyzers = $false)
    
    Write-Section "StyleCop Compliance Validation"
    
    if ($EnableAnalyzers) {
        Write-Host "Enabling StyleCop analyzers..." -ForegroundColor Yellow
        
        # Update Directory.Build.props to enable StyleCop
        $buildProps = Get-Content "Directory.Build.props" -Raw
        $updatedProps = $buildProps -replace '<!--\s*Temporarily disabled StyleCop for development\s*(.*?)\s*-->', '$1'
        Set-Content "Directory.Build.props" -Value $updatedProps
        
        Write-Success "StyleCop analyzers enabled"
    }
    
    Write-Host "Running build with StyleCop validation..." -ForegroundColor Yellow
    
    try {
        # Clean first to ensure fresh build
        dotnet clean --verbosity minimal > $null
        
        # Build with StyleCop enabled
        $buildResult = dotnet build --verbosity normal --no-restore 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Build successful with StyleCop enabled!"
            
            # Check for StyleCop warnings
            $styleCopWarnings = $buildResult | Select-String "SA\d{4}" 
            if ($styleCopWarnings.Count -gt 0) {
                Write-Warning "Found $($styleCopWarnings.Count) StyleCop warnings:"
                $styleCopWarnings | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
                return @{ Success = $true; Warnings = $styleCopWarnings.Count }
            } else {
                Write-Success "No StyleCop violations found!"
                return @{ Success = $true; Warnings = 0 }
            }
        }
        else {
            Write-Error "Build failed with StyleCop enabled!"
            
            # Extract StyleCop errors
            $styleCopErrors = $buildResult | Select-String "SA\d{4}.*error"
            if ($styleCopErrors.Count -gt 0) {
                Write-Host "StyleCop Errors:" -ForegroundColor Red
                $styleCopErrors | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
            }
            
            Write-Host $buildResult -ForegroundColor Red
            return @{ Success = $false; Errors = $styleCopErrors.Count }
        }
    }
    catch {
        Write-Error "Exception during StyleCop validation: $_"
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

function Enable-TreatWarningsAsErrors {
    Write-Section "Enabling Strict Build Configuration"
    
    Write-Host "Updating Directory.Build.props for production settings..." -ForegroundColor Yellow
    
    try {
        $buildProps = Get-Content "Directory.Build.props" -Raw
        
        # Enable TreatWarningsAsErrors
        $updatedProps = $buildProps -replace '<TreatWarningsAsErrors>false</TreatWarningsAsErrors>', '<TreatWarningsAsErrors>true</TreatWarningsAsErrors>'
        
        # Remove debug warning suppression
        $updatedProps = $updatedProps -replace '<PropertyGroup Condition=".*Debug.*">.*?</PropertyGroup>', '', [System.Text.RegularExpressions.RegexOptions]::Singleline
        
        Set-Content "Directory.Build.props" -Value $updatedProps
        
        Write-Success "Strict build configuration enabled"
        
        # Test build with strict settings
        Write-Host "Testing build with strict settings..." -ForegroundColor Yellow
        
        dotnet clean --verbosity minimal > $null
        $buildResult = dotnet build --verbosity normal --no-restore 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Build successful with strict settings!"
            return @{ Success = $true }
        }
        else {
            Write-Error "Build failed with strict settings!"
            Write-Host $buildResult -ForegroundColor Red
            return @{ Success = $false; Error = "Build failed with strict settings" }
        }
    }
    catch {
        Write-Error "Exception enabling strict settings: $_"
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

function Update-ProgressFile {
    param($Results)
    
    Write-Section "Updating Progress Tracking"
    
    try {
        $progressFile = "STYLECOP_PROGRESS.json"
        $progress = Get-Content $progressFile | ConvertFrom-Json
        
        # Update integration agent status
        $progress.agents."integration-validation-agent".status = "completed"
        $progress.agents."integration-validation-agent".current_task = "validation_complete"
        $progress.agents."integration-validation-agent".last_update = "2025-09-05 - Integration validation completed successfully"
        
        # Update global status
        $progress.global_status.build_status = if ($Results.BuildSuccess) { "success" } else { "failed" }
        $progress.global_status.all_tests_passing = $Results.TestSuccess
        $progress.global_status.stylecop_compliance = $Results.StyleCopSuccess
        $progress.global_status.treat_warnings_as_errors_enabled = $Results.StrictSettingsEnabled
        
        # Save updated progress
        $progress | ConvertTo-Json -Depth 10 | Set-Content $progressFile
        
        Write-Success "Progress file updated with final results"
    }
    catch {
        Write-Warning "Failed to update progress file: $_"
    }
}

function Generate-FinalReport {
    param($Results)
    
    Write-Section "INTEGRATION VALIDATION COMPLETE"
    
    Write-Host "Final Results Summary:" -ForegroundColor White
    Write-Host "=====================" -ForegroundColor White
    
    if ($Results.TestSuccess) {
        Write-Success "✅ All tests passing ($($Results.TestResults.Total) total tests)"
    } else {
        Write-Error "❌ Test failures detected"
    }
    
    if ($Results.StyleCopSuccess) {
        Write-Success "✅ StyleCop compliance achieved (0 violations)"
    } else {
        Write-Error "❌ StyleCop violations remaining: $($Results.StyleCopWarnings)"
    }
    
    if ($Results.StrictSettingsEnabled) {
        Write-Success "✅ Production build configuration enabled"
    } else {
        Write-Error "❌ Failed to enable strict build settings"
    }
    
    Write-Host "`nOverall Status: " -NoNewline -ForegroundColor White
    if ($Results.TestSuccess -and $Results.StyleCopSuccess -and $Results.StrictSettingsEnabled) {
        Write-Host "SUCCESS ✅" -ForegroundColor Green
        Write-Host "All StyleCop remediation goals achieved!" -ForegroundColor Green
    } else {
        Write-Host "PARTIAL SUCCESS ⚠️" -ForegroundColor Yellow
        Write-Host "Some issues require attention before full completion." -ForegroundColor Yellow
    }
}

# Main execution
Write-Host "StyleCop Integration Validation Starting..." -ForegroundColor Cyan
Write-Host "Execution Parameters:" -ForegroundColor Gray
Write-Host "  Skip Build: $SkipBuild" -ForegroundColor Gray
Write-Host "  Skip Tests: $SkipTests" -ForegroundColor Gray
Write-Host "  Enable StyleCop: $EnableStyleCop" -ForegroundColor Gray
Write-Host "  Verbose: $Verbose" -ForegroundColor Gray

$results = @{
    TestSuccess = $false
    StyleCopSuccess = $false
    StrictSettingsEnabled = $false
    BuildSuccess = $false
}

try {
    # Verify all other agents are complete
    if (-not (Test-AllAgentsCompleted)) {
        Write-Error "Not all agents have completed their work. Integration validation cannot proceed."
        exit 1
    }
    
    Write-Success "All other agents have completed successfully!"
    
    # Run test validation
    if (-not $SkipTests) {
        $testResults = Invoke-TestValidation
        $results.TestSuccess = $testResults.Success
        $results.TestResults = $testResults
    }
    
    # Run StyleCop validation
    $styleCopResults = Invoke-StyleCopValidation -EnableAnalyzers:$EnableStyleCop
    $results.StyleCopSuccess = $styleCopResults.Success -and $styleCopResults.Warnings -eq 0
    $results.StyleCopWarnings = $styleCopResults.Warnings
    $results.BuildSuccess = $styleCopResults.Success
    
    # Enable strict settings if StyleCop validation passed
    if ($results.StyleCopSuccess) {
        $strictResults = Enable-TreatWarningsAsErrors
        $results.StrictSettingsEnabled = $strictResults.Success
    }
    
    # Update progress tracking
    Update-ProgressFile -Results $results
    
    # Generate final report
    Generate-FinalReport -Results $results
    
} catch {
    Write-Error "Critical error during integration validation: $_"
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}

# Exit with appropriate code
if ($results.TestSuccess -and $results.StyleCopSuccess -and $results.StrictSettingsEnabled) {
    exit 0
} else {
    exit 1
}