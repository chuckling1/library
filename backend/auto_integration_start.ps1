# Auto Integration Start Script
# Automatically starts integration validation when other agents complete

param(
    [int]$CheckIntervalSeconds = 60,
    [switch]$AutoStart,
    [switch]$Verbose
)

function Test-AgentsCompleted {
    try {
        $progress = Get-Content "STYLECOP_PROGRESS.json" | ConvertFrom-Json
        $otherAgents = $progress.agents.PSObject.Properties.Name | Where-Object { $_ -ne "integration-validation-agent" }
        
        $completed = 0
        foreach ($agentName in $otherAgents) {
            if ($progress.agents.$agentName.status -eq "completed") {
                $completed++
            }
        }
        
        return @{
            Completed = $completed
            Total = $otherAgents.Count
            AllDone = ($completed -eq $otherAgents.Count)
            Progress = $progress
        }
    } catch {
        return @{ AllDone = $false; Error = $_.Exception.Message }
    }
}

function Show-WaitingStatus {
    param($Status)
    
    Write-Host "$(Get-Date -Format 'HH:mm:ss') - " -NoNewline -ForegroundColor Gray
    Write-Host "Waiting for agents: $($Status.Completed)/$($Status.Total) completed" -ForegroundColor Yellow
    
    if ($Verbose) {
        foreach ($agentName in $Status.Progress.agents.PSObject.Properties.Name) {
            if ($agentName -ne "integration-validation-agent") {
                $agent = $Status.Progress.agents.$agentName
                $statusColor = if ($agent.status -eq "completed") { "Green" } else { "Yellow" }
                Write-Host "  $agentName : $($agent.status)" -ForegroundColor $statusColor
            }
        }
    }
}

Write-Host "Auto Integration Start Monitor" -ForegroundColor Cyan
Write-Host "Checking every $CheckIntervalSeconds seconds..." -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Gray

do {
    $status = Test-AgentsCompleted
    
    if ($status.AllDone) {
        Write-Host "`n🎉 All agents completed! Starting integration validation..." -ForegroundColor Green
        
        if ($AutoStart) {
            Write-Host "Auto-starting integration validation..." -ForegroundColor Cyan
            & ".\integration_validation.ps1" -EnableStyleCop -Verbose
            break
        } else {
            Write-Host "Ready to start integration validation!" -ForegroundColor Green
            Write-Host "Run: .\integration_validation.ps1 -EnableStyleCop" -ForegroundColor Cyan
            break
        }
    } else {
        Show-WaitingStatus -Status $status
        Start-Sleep -Seconds $CheckIntervalSeconds
    }
    
} while ($true)