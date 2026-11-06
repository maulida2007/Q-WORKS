$ErrorActionPreference = "Stop"

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# 1. Get Login Page for CSRF Token
$loginPage = Invoke-WebRequest -Uri "http://localhost:5000/Auth/Login" -Method Get -WebSession $session -UseBasicParsing
$tokenMatch = [regex]::Match($loginPage.Content, 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"')
$loginToken = $tokenMatch.Groups[1].Value

# 2. Login as admin
$loginBody = @{
    __RequestVerificationToken = $loginToken
    AdminUsername = "admin"
    AdminPassword = "admin123"
}
$loginRes = Invoke-WebRequest -Uri "http://localhost:5000/Auth/LoginAdmin" -Method Post -Body $loginBody -WebSession $session -MaximumRedirection 0 -ErrorAction SilentlyContinue -UseBasicParsing

Write-Host "Login Status: $($loginRes.StatusCode)"

# 3. Get Input page to extract AntiForgeryToken
$inputRes = Invoke-WebRequest -Uri "http://localhost:5000/Overtime/Input" -Method Get -WebSession $session -UseBasicParsing
$formMatch = [regex]::Match($inputRes.Content, 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"')
$token = $formMatch.Groups[1].Value

Write-Host "Token extracted: $([bool]$token)"

# 4. Submit 9 hours on a Sunday (2026-10-25, 07:30 to 16:30)
$submitBody = @{
    __RequestVerificationToken = $token
    plant = "Plant Hose"
    shiftName = "Shift 1"
    workDate = "2026-10-25"
    jamMasuk = "07:30"
    jamPulang = "16:30"
    isHoliday = "true"
    reason = "Testing Holiday Overtime Limit"
    "selectedNpks[0]" = "1747"
}

$postRes = Invoke-WebRequest -Uri "http://localhost:5000/Overtime/Submit" -Method Post -Body $submitBody -WebSession $session -MaximumRedirection 0 -ErrorAction SilentlyContinue -UseBasicParsing

Write-Host "Submit Status: $($postRes.StatusCode) (Location: $($postRes.Headers.Location))"

# 5. Follow redirect to Input page and verify Toast message
$redirectRes = Invoke-WebRequest -Uri "http://localhost:5000/Overtime/Input" -Method Get -WebSession $session -UseBasicParsing
if ($redirectRes.Content -like "*batas maksimal input adalah 7 jam*") {
    Write-Host "[PASS] Toast message confirmed: Pengajuan ditolak karena melebihi batas 7 jam kerja!" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Toast message not found in Input page response" -ForegroundColor Red
}
