# Common PowerShell utility functions

function Invoke-WithRetry {
    param(
        [scriptblock] $Action,
        [int]         $MaxAttempts = 3,
        [int]         $DelaySeconds = 2
    )
    $attempt = 0
    while ($attempt -lt $MaxAttempts) {
        try {
            return & $Action
        }
        catch {
            $attempt++
            if ($attempt -ge $MaxAttempts) { throw }
            Start-Sleep -Seconds $DelaySeconds
            Write-Warning "Retry $attempt of $MaxAttempts..."
        }
    }
}

function Test-ValidInput {
    param([string] $Value)
    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $false
    }
    if ($Value.Length -gt 255) {
        return $false
    }
    return $true
}

function Write-LogMessage {
    param(
        [string] $Level   = 'INFO',
        [string] $Message
    )
    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Write-Host "[$ts] [$Level] $Message"
}

# File-specific: stop application service
function Stop-AppService {
    param([string] $ServiceName)
    Write-LogMessage -Message "Stopping $ServiceName"
    Stop-Service -Name $ServiceName
    Write-LogMessage -Message "$ServiceName stopped"
}
