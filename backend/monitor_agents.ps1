# StyleCop Agent Progress Monitor
# Integration-Validation Agent monitoring script

param(
    [int]$IntervalSeconds = 30,
    [switch]$Verbose
)

function Get-AgentStatus {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        Write-Error "Progress file not found: $FilePath"
        return $null
    }
    
    try {
        $progress = Get-Content $FilePath | ConvertFrom-Json
        return $progress
    }
    catch {
        Write-Error "Failed to parse progress file: $_"
        return $null
    }
}

function Show-AgentSummary {
    param($Progress)
    
    Write-Host "`n=== StyleCop Agent Progress Summary ===" -ForegroundColor Cyan
    Write-Host "Phase: $($Progress.phase)" -ForegroundColor Yellow
    Write-Host "Target Violations: $($Progress.total_violations_target)" -ForegroundColor Yellow
    
    $completedAgents = 0
    $totalAgents = $Progress.agents.Count
    
    foreach ($agentName in $Progress.agents.PSObject.Properties.Name) {
        $agent = $Progress.agents.$agentName
        $status = $agent.status
        $color = switch ($status) {
            "completed" { "Green"; $completedAgents++ }
            "in_progress" { "Yellow" }
            "waiting_for_others" { "Cyan" }
            default { "Red" }
        }
        
        Write-Host "[$status] $agentName" -ForegroundColor $color
        
        if ($Verbose) {
            Write-Host "  Partition: $($agent.partition)" -ForegroundColor Gray
            Write-Host "  Current Task: $($agent.current_task)" -ForegroundColor Gray
            Write-Host "  Files Completed: $($agent.files_completed.Count)/$($agent.stylecop_files.Count)" -ForegroundColor Gray
            Write-Host "  Tests Created: $($agent.tests_created)/$($agent.tests_to_create.Count)" -ForegroundColor Gray
            Write-Host "  Violations Fixed: $($agent.violations_fixed)" -ForegroundColor Gray
            if ($agent.last_update) {
                Write-Host "  Last Update: $($agent.last_update)" -ForegroundColor Gray
            }
            Write-Host ""
        }
    }
    
    Write-Host "`nProgress: $completedAgents/$totalAgents agents completed" -ForegroundColor Magenta
    Write-Host "Global Stats:" -ForegroundColor White
    Write-Host "  Tests Created: $($Progress.global_status.total_tests_created)/$($Progress.global_status.total_tests_target)" -ForegroundColor White
    Write-Host "  Violations Fixed: $($Progress.global_status.total_violations_fixed)/$($Progress.total_violations_target)" -ForegroundColor White
    Write-Host "  StyleCop Compliant: $($Progress.global_status.stylecop_compliance)" -ForegroundColor White
    
    return @{
        CompletedAgents = $completedAgents
        TotalAgents = $totalAgents
        AllCompleted = ($completedAgents -eq ($totalAgents - 1)) # -1 because integration agent doesn't count toward completion
    }
}

function Wait-ForOtherAgents {
    param([string]$ProgressFile, [int]$CheckInterval)
    
    Write-Host "Integration-Validation Agent: Monitoring other agents..." -ForegroundColor Green
    
    do {
        $progress = Get-AgentStatus -FilePath $ProgressFile
        if (-not $progress) {
            Start-Sleep $CheckInterval
            continue
        }
        
        $summary = Show-AgentSummary -Progress $progress
        
        if ($summary.AllCompleted) {
            Write-Host "`n🎉 All other agents have completed! Ready for integration validation." -ForegroundColor Green
            return $true
        }
        
        Write-Host "`nWaiting $CheckInterval seconds before next check..." -ForegroundColor Gray
        Start-Sleep $CheckInterval
        
    } while ($true)
}

# Main execution
$progressFile = Join-Path $PSScriptRoot "STYLECOP_PROGRESS.json"

Write-Host "StyleCop Integration-Validation Agent Monitor" -ForegroundColor Cyan
Write-Host "Progress File: $progressFile" -ForegroundColor Gray
Write-Host "Check Interval: $IntervalSeconds seconds" -ForegroundColor Gray

# Initial status check
$initialProgress = Get-AgentStatus -FilePath $progressFile
if ($initialProgress) {
    $initialSummary = Show-AgentSummary -Progress $initialProgress
    
    if ($initialSummary.AllCompleted) {
        Write-Host "All agents already completed! Proceeding to validation..." -ForegroundColor Green
        exit 0
    }
}

# Start monitoring
Wait-ForOtherAgents -ProgressFile $progressFile -CheckInterval $IntervalSeconds