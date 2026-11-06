$ErrorActionPreference = "Stop"

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# 1. Fetch Login page to get verification token
$loginPage = Invoke-WebRequest -Uri "http://localhost:5000/Auth/Login" -Method Get -WebSession $session -UseBasicParsing
$tokenMatch = [regex]::Match($loginPage.Content, 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"')
$loginToken = $tokenMatch.Groups[1].Value

# 2. Login as Gilang (Karyawan Plant Hose, NPK: 1747)
$loginBody = @{
    __RequestVerificationToken = $loginToken
    KaryawanNpk = "1747"
    KaryawanNama = "GILANG"
}
$loginResp = Invoke-WebRequest -Uri "http://localhost:5000/Auth/LoginKaryawan" -Method Post -Body $loginBody -WebSession $session -MaximumRedirection 0 -ErrorAction SilentlyContinue -UseBasicParsing
Write-Host "Gilang Login Status: $($loginResp.StatusCode) (Redirect: $($loginResp.Headers.Location))"

# 3. Request /MasterPekerja as Gilang
$masterPage = Invoke-WebRequest -Uri "http://localhost:5000/MasterPekerja" -Method Get -WebSession $session -UseBasicParsing
$html = $masterPage.Content

Write-Host "`n=== GILANG (PLANT HOSE) VIEW ==="
if ($html.Contains("Plant Anda: Plant Hose")) {
    Write-Host "[PASS] Locked badge for Plant Hose FOUND!"
} else {
    Write-Host "[FAIL] Locked badge for Plant Hose NOT FOUND!"
}

if ($html.Contains("Semua Plant")) {
    Write-Host "[FAIL] 'Semua Plant' dropdown was visible to worker!"
} else {
    Write-Host "[PASS] 'Semua Plant' dropdown is HIDDEN from worker."
}

$hoseMatches = [regex]::Matches($html, 'Plant Hose').Count
$moldedMatches = [regex]::Matches($html, 'Plant Molded').Count
$subcontMatches = [regex]::Matches($html, 'Plant Subcont').Count
$mixingMatches = [regex]::Matches($html, 'Plant Lab Mixing').Count

Write-Host "Occurrences of 'Plant Hose': $hoseMatches"
Write-Host "Occurrences of 'Plant Molded': $moldedMatches"
Write-Host "Occurrences of 'Plant Subcont': $subcontMatches"
Write-Host "Occurrences of 'Plant Lab Mixing': $mixingMatches"

$totalRegex = [regex]::Match($html, '(\d+)\s+Pekerja')
if ($totalRegex.Success) {
    Write-Host "Counter on page: $($totalRegex.Value)"
}

# 4. Test URL Tampering (?plant=Plant Molded)
$tamperedPage = Invoke-WebRequest -Uri "http://localhost:5000/MasterPekerja?plant=Plant%20Molded" -Method Get -WebSession $session -UseBasicParsing
$tamperedHtml = $tamperedPage.Content
$tamperedMolded = [regex]::Matches($tamperedHtml, 'Plant Molded').Count
Write-Host "`n=== URL TAMPERING TEST (?plant=Plant Molded) ==="
Write-Host "Molded occurrences when attempting to bypass: $tamperedMolded (Expected: 0)"

# 5. Extract all worker names displayed to Gilang
Write-Host "`nEmployees displayed in table for Gilang:"
$nameMatches = [regex]::Matches($html, '<span style="font-weight: 700; color: #FFF8E7; font-size: 0.92rem;">\s*([^<]+)\s*</span>')
foreach ($m in $nameMatches) {
    Write-Host " - $($m.Groups[1].Value.Trim())"
}

# 6. Test Admin view
$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$adminLoginPage = Invoke-WebRequest -Uri "http://localhost:5000/Auth/Login" -Method Get -WebSession $adminSession -UseBasicParsing
$adminToken = [regex]::Match($adminLoginPage.Content, 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"').Groups[1].Value

$adminLoginBody = @{
    __RequestVerificationToken = $adminToken
    AdminUsername = "admin"
    AdminPassword = "admin123"
}
$adminLoginResp = Invoke-WebRequest -Uri "http://localhost:5000/Auth/LoginAdmin" -Method Post -Body $adminLoginBody -WebSession $adminSession -MaximumRedirection 0 -ErrorAction SilentlyContinue -UseBasicParsing
Write-Host "`n=== ADMIN VIEW ==="
Write-Host "Admin Login Status: $($adminLoginResp.StatusCode)"

$adminMasterPage = Invoke-WebRequest -Uri "http://localhost:5000/MasterPekerja" -Method Get -WebSession $adminSession -UseBasicParsing
$adminHtml = $adminMasterPage.Content

if ($adminHtml.Contains("Semua Plant")) {
    Write-Host "[PASS] Admin can view 'Semua Plant' dropdown selector."
} else {
    Write-Host "[FAIL] Admin plant selector missing."
}

$adminTotalRegex = [regex]::Match($adminHtml, '(\d+)\s+Pekerja')
if ($adminTotalRegex.Success) {
    Write-Host "Admin total counter: $($adminTotalRegex.Value)"
}
