# StyleCop Rollback Script
# Emergency rollback for StyleCop integration issues

param(
    [switch]$Force,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

function Write-Section {
    param([string]$Title)
    Write-Host "`n$("="*50)" -ForegroundColor Red
    Write-Host "  $Title" -ForegroundColor Red
    Write-Host "$("="*50)" -ForegroundColor Red
}

function Restore-BuildConfiguration {
    Write-Section "Restoring Build Configuration"
    
    try {
        # Reset Directory.Build.props to safe state
        $buildPropsContent = @'
<Project>
  <PropertyGroup>
    <TreatWarningsAsErrors>false</TreatWarningsAsErrors>
    <WarningsAsErrors />
    <WarningsNotAsErrors />
    <Nullable>enable</Nullable>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
  </PropertyGroup>
  
  <!-- Temporarily disabled StyleCop for development
  <ItemGroup>
    <PackageReference Include="StyleCop.Analyzers" Version="1.2.0-beta.556">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>analyzers</IncludeAssets>
    </PackageReference>
  </ItemGroup>
  -->
  
  <PropertyGroup Condition="'$(Configuration)' == 'Debug'">
    <WarningLevel>0</WarningLevel>
    <NoWarn>$(NoWarn);StyleCop</NoWarn>
  </PropertyGroup>
  
</Project>
'@
        
        Set-Content "Directory.Build.props" -Value $buildPropsContent
        Write-Host "✅ Directory.Build.props restored to safe state" -ForegroundColor Green
        
        # Clean and rebuild to ensure clean state
        Write-Host "Cleaning solution..." -ForegroundColor Yellow
        dotnet clean --verbosity minimal > $null
        
        Write-Host "Testing build after rollback..." -ForegroundColor Yellow
        $buildResult = dotnet build --verbosity minimal 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Build successful after rollback" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Build failed even after rollback!" -ForegroundColor Red
            Write-Host $buildResult -ForegroundColor Red
            return $false
        }
        
    } catch {
        Write-Host "❌ Error during build configuration rollback: $_" -ForegroundColor Red
        return $false
    }
}

function Reset-ProgressFile {
    Write-Section "Resetting Progress Tracking"
    
    try {
        $progressFile = "STYLECOP_PROGRESS.json"
        if (Test-Path $progressFile) {
            $progress = Get-Content $progressFile | ConvertFrom-Json
            
            # Reset integration agent status
            $progress.agents."integration-validation-agent".status = "rollback_initiated"
            $progress.agents."integration-validation-agent".current_task = "emergency_rollback"
            $progress.agents."integration-validation-agent".last_update = "2025-09-05 - Emergency rollback initiated due to critical issues"
            
            # Reset global status to safe state
            $progress.global_status.build_status = "rolled_back"
            $progress.global_status.all_tests_passing = $false
            $progress.global_status.stylecop_compliance = $false
            $progress.global_status.treat_warnings_as_errors_enabled = $false
            
            $progress | ConvertTo-Json -Depth 10 | Set-Content $progressFile
            Write-Host "✅ Progress file reset to rollback state" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️ Failed to reset progress file: $_" -ForegroundColor Yellow
    }
}

function Test-SystemRecovery {
    Write-Section "System Recovery Validation"
    
    try {
        Write-Host "Running recovery validation tests..." -ForegroundColor Yellow
        
        # Test basic build
        dotnet clean --verbosity minimal > $null
        $buildResult = dotnet build --verbosity minimal 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Basic build failed after rollback!" -ForegroundColor Red
            return $false
        }
        
        # Test existing tests still pass
        Write-Host "Validating existing tests..." -ForegroundColor Yellow
        $testResult = dotnet test --no-build --verbosity minimal 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Tests failed after rollback!" -ForegroundColor Red
            Write-Host $testResult -ForegroundColor Red
            return $false
        }
        
        Write-Host "✅ System recovery validation successful" -ForegroundColor Green
        return $true
        
    } catch {
        Write-Host "❌ Error during system recovery validation: $_" -ForegroundColor Red
        return $false
    }
}

function Generate-RollbackReport {
    param([bool]$Success)
    
    Write-Section "ROLLBACK REPORT"
    
    if ($Success) {
        Write-Host "🔄 ROLLBACK SUCCESSFUL" -ForegroundColor Green
        Write-Host "The system has been successfully rolled back to a safe state." -ForegroundColor Green
        Write-Host "`nWhat was restored:" -ForegroundColor White
        Write-Host "  ✅ Directory.Build.props - StyleCop disabled" -ForegroundColor Green
        Write-Host "  ✅ TreatWarningsAsErrors - set to false" -ForegroundColor Green  
        Write-Host "  ✅ Build system - working correctly" -ForegroundColor Green
        Write-Host "  ✅ Test suite - all tests passing" -ForegroundColor Green
        
        Write-Host "`nNext Steps:" -ForegroundColor Yellow
        Write-Host "  1. Review integration logs to identify the root cause" -ForegroundColor Yellow
        Write-Host "  2. Address the specific issues that caused the rollback" -ForegroundColor Yellow
        Write-Host "  3. Re-run integration validation with fixes" -ForegroundColor Yellow
    } else {
        Write-Host "❌ ROLLBACK FAILED" -ForegroundColor Red
        Write-Host "Critical system issues detected even after rollback!" -ForegroundColor Red
        Write-Host "`nImmediate actions required:" -ForegroundColor Red
        Write-Host "  1. Manual review of all configuration files" -ForegroundColor Red
        Write-Host "  2. Check for corrupted project files" -ForegroundColor Red
        Write-Host "  3. Consider reverting to last known good commit" -ForegroundColor Red
    }
}

# Main execution
Write-Host "StyleCop Emergency Rollback Initiated" -ForegroundColor Red
Write-Host "This will restore the system to a safe, working state." -ForegroundColor Yellow

if (-not $Force) {
    $confirmation = Read-Host "Are you sure you want to proceed with rollback? (y/N)"
    if ($confirmation -ne "y" -and $confirmation -ne "Y") {
        Write-Host "Rollback cancelled by user." -ForegroundColor Yellow
        exit 0
    }
}

$success = $true

try {
    # Restore build configuration
    if (-not (Restore-BuildConfiguration)) {
        $success = $false
    }
    
    # Reset progress tracking
    Reset-ProgressFile
    
    # Validate system recovery
    if (-not (Test-SystemRecovery)) {
        $success = $false
    }
    
    # Generate report
    Generate-RollbackReport -Success $success
    
} catch {
    Write-Host "❌ Critical error during rollback: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    $success = $false
}

# Exit with appropriate code
if ($success) {
    exit 0
} else {
    exit 1
}