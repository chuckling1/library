# Quick StyleCop Progress Check
# Integration-Validation Agent quick status check

$progressFile = "STYLECOP_PROGRESS.json"

if (-not (Test-Path $progressFile)) {
    Write-Error "Progress file not found: $progressFile"
    exit 1
}

try {
    $progress = Get-Content $progressFile | ConvertFrom-Json
    
    Write-Host "`n=== StyleCop Progress Quick Check ===" -ForegroundColor Cyan
    Write-Host "Phase: $($progress.phase)" -ForegroundColor Yellow
    
    $completedAgents = 0
    $inProgressAgents = 0
    $totalViolationsFixed = 0
    $totalTestsCreated = 0
    
    foreach ($agentName in $progress.agents.PSObject.Properties.Name) {
        $agent = $progress.agents.$agentName
        
        if ($agentName -ne "integration-validation-agent") {
            $totalViolationsFixed += $agent.violations_fixed
            $totalTestsCreated += $agent.tests_created
            
            switch ($agent.status) {
                "completed" { 
                    $completedAgents++
                    Write-Host "✅ $agentName - COMPLETED" -ForegroundColor Green
                }
                "in_progress" { 
                    $inProgressAgents++
                    Write-Host "🔄 $agentName - IN PROGRESS ($($agent.current_task))" -ForegroundColor Yellow
                }
                default { 
                    Write-Host "⏳ $agentName - $($agent.status)" -ForegroundColor Gray
                }
            }
        }
    }
    
    $totalOtherAgents = $progress.agents.PSObject.Properties.Name.Count - 1 # Exclude integration agent
    
    Write-Host "`nOverall Progress:" -ForegroundColor White
    Write-Host "  Completed Agents: $completedAgents/$totalOtherAgents" -ForegroundColor White
    Write-Host "  In Progress: $inProgressAgents" -ForegroundColor White
    Write-Host "  Tests Created: $totalTestsCreated/$($progress.global_status.total_tests_target)" -ForegroundColor White
    Write-Host "  Violations Fixed: $totalViolationsFixed/$($progress.total_violations_target)" -ForegroundColor White
    
    # Check if integration agent can start
    if ($completedAgents -eq $totalOtherAgents) {
        Write-Host "`n🎉 All agents completed! Integration validation can begin!" -ForegroundColor Green
        Write-Host "Run: .\integration_validation.ps1 -EnableStyleCop" -ForegroundColor Cyan
    } else {
        Write-Host "`n⏳ Waiting for $($totalOtherAgents - $completedAgents) more agents to complete..." -ForegroundColor Yellow
    }
    
} catch {
    Write-Error "Failed to parse progress file: $_"
    exit 1
}