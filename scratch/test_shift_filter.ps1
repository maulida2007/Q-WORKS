$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$r1 = Invoke-WebRequest -Uri 'http://localhost:5000/Auth/Login' -WebSession $session -UseBasicParsing
$token = ''
if ($r1.Content -match 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"') { $token = $Matches[1] }
$body = @{ '__RequestVerificationToken' = $token; 'AdminUsername' = 'admin'; 'AdminPassword' = 'admin123' }
$null = Invoke-WebRequest -Uri 'http://localhost:5000/Auth/LoginAdmin' -Method Post -Body $body -WebSession $session -UseBasicParsing

$dashShift1 = Invoke-WebRequest -Uri 'http://localhost:5000/Dashboard?shifts=Shift%201' -WebSession $session -UseBasicParsing
Write-Host 'Shift 1 filter status:' $dashShift1.StatusCode
Write-Host 'Has checked input for Shift 1:' ($dashShift1.Content -match 'value="Shift 1"\s+checked')
Write-Host 'Shift 2 is NOT checked:' (-not ($dashShift1.Content -match 'value="Shift 2"\s+checked'))
