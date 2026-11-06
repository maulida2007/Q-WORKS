$ErrorActionPreference = "Stop"

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# 1. Login as admin
$loginPage = Invoke-WebRequest -Uri "http://localhost:5000/Auth/Login" -Method Get -WebSession $session -UseBasicParsing
$tokenMatch = [regex]::Match($loginPage.Content, 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"')
$loginToken = $tokenMatch.Groups[1].Value

$loginBody = @{
    __RequestVerificationToken = $loginToken
    AdminUsername = "admin"
    AdminPassword = "admin123"
}
$loginRes = Invoke-WebRequest -Uri "http://localhost:5000/Auth/LoginAdmin" -Method Post -Body $loginBody -WebSession $session -MaximumRedirection 0 -ErrorAction SilentlyContinue -UseBasicParsing

# 2. Get Input page to extract AntiForgeryToken
$inputRes = Invoke-WebRequest -Uri "http://localhost:5000/Overtime/Input" -Method Get -WebSession $session -UseBasicParsing
$formMatch = [regex]::Match($inputRes.Content, 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"')
$token = $formMatch.Groups[1].Value

# 3. Submit 6 hours on a Sunday (07:30 to 13:30) -> Valid (<= 7 hours)
$submitBody = @{
    __RequestVerificationToken = $token
    plant = "Plant Hose"
    shiftName = "Shift 1"
    workDate = "2026-10-25"
    jamMasuk = "07:30"
    jamPulang = "13:30"
    isHoliday = "true"
    reason = "Testing Valid Holiday Overtime"
    "selectedNpks[0]" = "1747"
}

$postRes = Invoke-WebRequest -Uri "http://localhost:5000/Overtime/Submit" -Method Post -Body $submitBody -WebSession $session -MaximumRedirection 0 -ErrorAction SilentlyContinue -UseBasicParsing

Write-Host "Valid Submit Status: $($postRes.StatusCode) (Location: $($postRes.Headers.Location))"

$redirectRes = Invoke-WebRequest -Uri "http://localhost:5000/Overtime/Input" -Method Get -WebSession $session -UseBasicParsing
if ($redirectRes.Content -like "*berhasil diajukan*") {
    Write-Host "[PASS] Valid holiday overtime successfully saved!" -ForegroundColor Green
} else {
    Write-Host "[INFO] Status response: $($postRes.Headers.Location)"
}
