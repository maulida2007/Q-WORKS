$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$r1 = Invoke-WebRequest -Uri 'http://localhost:5000/Auth/Login' -WebSession $session -UseBasicParsing
$token = ''
if ($r1.Content -match 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"') { $token = $Matches[1] }
$body = @{ '__RequestVerificationToken' = $token; 'AdminUsername' = 'admin'; 'AdminPassword' = 'admin123' }
$null = Invoke-WebRequest -Uri 'http://localhost:5000/Auth/LoginAdmin' -Method Post -Body $body -WebSession $session -UseBasicParsing

$dashSep = Invoke-WebRequest -Uri 'http://localhost:5000/Dashboard?months=September%202026' -WebSession $session -UseBasicParsing
Write-Host "Filtered September 2026 Status:" $dashSep.StatusCode
Write-Host "Contains 'September 2026':" ($dashSep.Content.Contains('September 2026'))
Write-Host "Checked item has checked class:" ($dashSep.Content -match '<div class="slicer-item-checkbox checked">')

$dashOkt = Invoke-WebRequest -Uri 'http://localhost:5000/Dashboard?months=Oktober%202026' -WebSession $session -UseBasicParsing
Write-Host "Filtered Oktober 2026 Status:" $dashOkt.StatusCode
Write-Host "Contains 'Oktober 2026':" ($dashOkt.Content.Contains('Oktober 2026'))
