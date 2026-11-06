$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$r1 = Invoke-WebRequest -Uri 'http://localhost:5000/Auth/Login' -WebSession $session -UseBasicParsing
$token = ''
if ($r1.Content -match 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"') { $token = $Matches[1] }
$body = @{ '__RequestVerificationToken' = $token; 'AdminUsername' = 'admin'; 'AdminPassword' = 'admin123' }
$null = Invoke-WebRequest -Uri 'http://localhost:5000/Auth/LoginAdmin' -Method Post -Body $body -WebSession $session -UseBasicParsing
$dash = Invoke-WebRequest -Uri 'http://localhost:5000/Dashboard' -WebSession $session -UseBasicParsing
Write-Host "Has slicer-trigger:" ($dash.Content.Contains('slicer-trigger'))
Write-Host "Has slicer.css:" ($dash.Content.Contains('slicer.css'))
Write-Host "Has slicer.js:" ($dash.Content.Contains('slicer.js'))
Write-Host "Has BULAN slicer:" ($dash.Content.Contains('slicerDashboardMonths'))
Write-Host "Has Ketik untuk menelusuri:" ($dash.Content.Contains('Ketik untuk menelusuri'))
Write-Host "Has October:" ($dash.Content.Contains('October'))
Write-Host "Has Oktober:" ($dash.Content.Contains('Oktober'))
Write-Host "Has September:" ($dash.Content.Contains('September'))
Write-Host "Has HANYA button:" ($dash.Content.Contains('slicer-btn-only'))
Write-Host "Has HANYA text:" ($dash.Content.Contains('HANYA'))

# Find slicerDashboardMonths HTML
$start = $dash.Content.IndexOf('id="slicerDashboardMonths"')
if ($start -ge 0) {
    $sub = $dash.Content.Substring($start, 3000)
    $lines = $sub -split "`n" | Where-Object { $_ -match 'slicer-item|slicer-btn-only' }
    $lines | ForEach-Object { Write-Host "SLICER_LINE: $($_.Trim())" }
}
