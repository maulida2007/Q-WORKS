$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$r1 = Invoke-WebRequest -Uri 'http://localhost:5000/Auth/Login' -WebSession $session -UseBasicParsing
$token = ''
if ($r1.Content -match 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"') { 
    $token = $Matches[1] 
}
$body = @{ 
    '__RequestVerificationToken' = $token
    'AdminUsername' = 'admin'
    'AdminPassword' = 'admin123' 
}
$null = Invoke-WebRequest -Uri 'http://localhost:5000/Auth/LoginAdmin' -Method Post -Body $body -WebSession $session -UseBasicParsing

$dash = Invoke-WebRequest -Uri 'http://localhost:5000/Dashboard' -WebSession $session -UseBasicParsing

Write-Host "--- CHECKING DASHBOARD MONTH SLICER ---"
$matches = [regex]::Matches($dash.Content, '<div class="slicer-item"[^>]*data-value="([^"]+)"[^>]*>[\s\S]*?<div class="slicer-item-main">([^<]+)</div>\s*<div class="slicer-item-sub">([^<]*)</div>')
foreach ($m in $matches) {
    Write-Host "Value: '$($m.Groups[1].Value)' | Main: '$($m.Groups[2].Value)' | Sub: '$($m.Groups[3].Value)'"
}

Write-Host "--- CHECKING ACTIVE DATE PILL ---"
if ($dash.Content -match '<div class="date-badge">[\s\S]*?<span>([^<]+)</span>') {
    Write-Host "Date badge: $($Matches[1])"
}
