<#
.SYNOPSIS
    Calls Salesforce Agentforce Agent API directly from local machine to
    isolate whether the 404 we're seeing in Vercel is environment-specific
    or a true org-entitlement gap.

.DESCRIPTION
    Same request shape as /api/agent-session.ts, but issued from this
    machine using PowerShell's native Invoke-RestMethod (no curl quoting
    drama). If this also 404s with the same empty-body pattern, the
    public Agent API endpoint is genuinely not reachable for the
    Bedrock SForg DE org and we should pivot the demo.

.PARAMETER ClientId
    Connected App consumer key. Grab from Vercel: bedrock-dashboard →
    Settings → Environment Variables → SF_CLIENT_ID (reveal value).

.PARAMETER ClientSecret
    Connected App consumer secret. Same source: SF_CLIENT_SECRET.

.PARAMETER RefreshToken
    Active refresh token with chatbot_api scope. Same source:
    SF_REFRESH_TOKEN.

.PARAMETER AgentId
    Bot Id for the agent to invoke. Defaults to Bedrock_Service_Triage
    employee agent. Pass 0XxdL000003RvN3SAK to test Bedrock_Customer_Service.

.PARAMETER InstanceUrl
    Org My Domain URL. Defaults to the Bedrock SForg DE org.

.EXAMPLE
    .\tools\test-agent-api.ps1 -ClientId 'abc...' -ClientSecret 'xyz...' -RefreshToken '5Aep...'
#>
param(
    [Parameter(Mandatory = $true)][string]$ClientId,
    [Parameter(Mandatory = $true)][string]$ClientSecret,
    [Parameter(Mandatory = $true)][string]$RefreshToken,
    [string]$AgentId = '0XxdL000003RiJNSA0',
    [string]$InstanceUrl = 'https://orgfarm-ad8b45e316-dev-ed.develop.my.salesforce.com'
)

$ErrorActionPreference = 'Stop'

Write-Host "`n=== Step 1: Mint access token via refresh_token grant ===" -ForegroundColor Cyan
try {
    $tokenResp = Invoke-RestMethod `
        -Uri 'https://login.salesforce.com/services/oauth2/token' `
        -Method Post `
        -ContentType 'application/x-www-form-urlencoded' `
        -Body @{
            grant_type = 'refresh_token'
            client_id = $ClientId
            client_secret = $ClientSecret
            refresh_token = $RefreshToken
        }
    Write-Host "Access token minted. Length: $($tokenResp.access_token.Length) chars."
    Write-Host "Instance URL from token: $($tokenResp.instance_url)"
    Write-Host "Scope on token: $($tokenResp.scope)"
} catch {
    Write-Host "TOKEN MINT FAILED:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
    exit 1
}

Write-Host "`n=== Step 2: Call Agent API Create Session at api.salesforce.com ===" -ForegroundColor Cyan
$sessionKey = [guid]::NewGuid().ToString()
$payload = @{
    externalSessionKey = $sessionKey
    instanceConfig = @{ endpoint = $InstanceUrl }
    streamingCapabilities = @{ chunkTypes = @('Text') }
    bypassUser = $false
} | ConvertTo-Json -Depth 4 -Compress

$url = "https://api.salesforce.com/einstein/ai-agent/v1/agents/$AgentId/sessions"
Write-Host "URL: $url"
Write-Host "Body: $payload"

try {
    $sessionResp = Invoke-RestMethod `
        -Uri $url `
        -Method Post `
        -Headers @{ Authorization = "Bearer $($tokenResp.access_token)"; 'Content-Type' = 'application/json' } `
        -Body $payload
    Write-Host "`nSUCCESS:" -ForegroundColor Green
    $sessionResp | ConvertTo-Json -Depth 10
    Write-Host "`n>>> Agent API IS reachable from this machine. The Vercel 404 is environment-specific." -ForegroundColor Green
} catch {
    Write-Host "`nCALL FAILED. Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    Write-Host "Status description: $($_.Exception.Response.StatusDescription)"
    if ($_.ErrorDetails.Message) {
        Write-Host "Response body:"
        Write-Host $_.ErrorDetails.Message
    } else {
        Write-Host "Response body: <empty>"
    }
    Write-Host "`n>>> Same 404 here = confirmed org-entitlement gap. Pivot." -ForegroundColor Yellow
}
