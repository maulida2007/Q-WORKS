$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$r1 = Invoke-WebRequest -Uri 'http://localhost:5000/Auth/Login' -WebSession $session -UseBasicParsing
$token = ''
if ($r1.Content -match 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"') { $token = $Matches[1] }
$body = @{ '__RequestVerificationToken' = $token; 'AdminUsername' = 'admin'; 'AdminPassword' = 'admin123' }
$null = Invoke-WebRequest -Uri 'http://localhost:5000/Auth/LoginAdmin' -Method Post -Body $body -WebSession $session -UseBasicParsing

$dash = Invoke-WebRequest -Uri 'http://localhost:5000/Dashboard' -WebSession $session -UseBasicParsing

Write-Host "--- DASHBOARD PLANT SLICER ITEMS ---"
$start = $dash.Content.IndexOf('id="slicerDashboardPlants"')
if ($start -ge 0) {
    $sub = $dash.Content.Substring($start, 7000)
    $lines = $sub -split "`n" | Where-Object { $_ -match 'slicer-text-main|slicer-text-sub|slicer-btn-only' }
    $lines | ForEach-Object { Write-Host $_.Trim() }
}
