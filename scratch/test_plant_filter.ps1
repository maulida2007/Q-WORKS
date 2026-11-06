$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$r1 = Invoke-WebRequest -Uri 'http://localhost:5000/Auth/Login' -WebSession $session -UseBasicParsing
$token = ''
if ($r1.Content -match 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"') { $token = $Matches[1] }
$body = @{ '__RequestVerificationToken' = $token; 'AdminUsername' = 'admin'; 'AdminPassword' = 'admin123' }
$null = Invoke-WebRequest -Uri 'http://localhost:5000/Auth/LoginAdmin' -Method Post -Body $body -WebSession $session -UseBasicParsing

$dashMolded = Invoke-WebRequest -Uri 'http://localhost:5000/Dashboard?plants=Plant%20Molded' -WebSession $session -UseBasicParsing
Write-Host 'Status:' $dashMolded.StatusCode
Write-Host 'Plant Molded is checked:' ($dashMolded.Content -match 'value="Plant Molded"[^>]*checked')
Write-Host 'Plant Hose is NOT checked:' (-not ($dashMolded.Content -match 'value="Plant Hose"[^>]*checked'))
