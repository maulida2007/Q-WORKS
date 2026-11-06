$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$r1 = Invoke-WebRequest -Uri 'http://localhost:5000/Auth/Login' -WebSession $session -UseBasicParsing
$token = ''
if ($r1.Content -match 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"') { $token = $Matches[1] }
$body = @{ '__RequestVerificationToken' = $token; 'AdminUsername' = 'admin'; 'AdminPassword' = 'admin123' }
$null = Invoke-WebRequest -Uri 'http://localhost:5000/Auth/LoginAdmin' -Method Post -Body $body -WebSession $session -UseBasicParsing

$rekap = Invoke-WebRequest -Uri 'http://localhost:5000/Overtime/Rekap' -WebSession $session -UseBasicParsing

Write-Host "--- REKAP MONTH SLICER ITEMS ---"
$matches = [regex]::Matches($rekap.Content, 'name="months"[^>]*value="([^"]+)"')
foreach ($m in $matches) {
    Write-Host "Month Value: '$($m.Groups[1].Value)'"
}
