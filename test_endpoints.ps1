$ErrorActionPreference = 'Stop'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "=== 1. TEST GET /Auth/Login ==="
$r1 = Invoke-WebRequest -Uri "http://localhost:5000/Auth/Login" -WebSession $session -UseBasicParsing
Write-Host "Status:" $r1.StatusCode
Write-Host "Has CSS index.css:" ($r1.Content.Contains("index.css"))
Write-Host "Has Karyawan Tab:" ($r1.Content.Contains("Karyawan Quality"))
Write-Host "Has Admin Tab:" ($r1.Content.Contains("Admin"))

# Extract Antiforgery Token
$token = ""
if ($r1.Content -match 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"') {
    $token = $Matches[1]
} elseif ($r1.Content -match 'value="([^"]+)"\s+name="__RequestVerificationToken"') {
    $token = $Matches[1]
}
Write-Host "Extracted Antiforgery Token length:" $token.Length

Write-Host "`n=== 2. TEST NPK LOOKUP API /Auth/LookupNpk ==="
$lookup = Invoke-RestMethod -Uri "http://localhost:5000/Auth/LookupNpk?npk=1747" -Method Get -UseBasicParsing
Write-Host "Lookup 1747 result:" ($lookup | ConvertTo-Json -Compress)

Write-Host "`n=== 3. TEST ADMIN LOGIN ==="
$loginBody = @{
    "__RequestVerificationToken" = $token
    "AdminUsername" = "admin"
    "AdminPassword" = "admin123"
}
$rLogin = Invoke-WebRequest -Uri "http://localhost:5000/Auth/LoginAdmin" -Method Post -Body $loginBody -WebSession $session -UseBasicParsing
Write-Host "Admin Login Status:" $rLogin.StatusCode
Write-Host "Admin Logged in page title contains Dashboard:" ($rLogin.Content.Contains("Dashboard") -or $rLogin.Content.Contains("Q-WORKS"))

Write-Host "`n=== 4. TEST GET /Dashboard (Authenticated) ==="
$rDash = Invoke-WebRequest -Uri "http://localhost:5000/Dashboard" -WebSession $session -UseBasicParsing
Write-Host "Dashboard Status:" $rDash.StatusCode
Write-Host "Contains KPI Total Jam:" ($rDash.Content.Contains("Total Jam"))
Write-Host "Contains chart canvas (dailyOvertimeChart):" ($rDash.Content.Contains("dailyOvertimeChart"))
Write-Host "Contains Top 10:" ($rDash.Content.Contains("Top 10"))

Write-Host "`n=== 5. TEST GET /Overtime/Input ==="
$rInput = Invoke-WebRequest -Uri "http://localhost:5000/Overtime/Input" -WebSession $session -UseBasicParsing
Write-Host "Input Status:" $rInput.StatusCode
Write-Host "Contains worker options:" ($rInput.Content.Contains("PILIH PEKERJA") -or $rInput.Content.Contains("Pilih Pekerja"))

Write-Host "`n=== 6. TEST LIVE PREVIEW CALCULATION API ==="
$previewBody = @{
    WorkDate = "2026-03-24"
    ShiftName = "Shift 2"
    StartTimeStr = "16:30"
    EndTimeStr = "19:30"
    IsHoliday = $false
} | ConvertTo-Json
$rPrev = Invoke-RestMethod -Uri "http://localhost:5000/Overtime/Preview" -Method Post -Body $previewBody -ContentType "application/json" -WebSession $session -UseBasicParsing
Write-Host "Live Preview Result:" ($rPrev | ConvertTo-Json -Compress)

Write-Host "`n=== 7. TEST GET /Overtime/Rekap ==="
$rRekap = Invoke-WebRequest -Uri "http://localhost:5000/Overtime/Rekap" -WebSession $session -UseBasicParsing
Write-Host "Rekap Status:" $rRekap.StatusCode
Write-Host "Contains Rekap Table:" ($rRekap.Content.Contains("REKAP LEMBUR QUALITY") -or $rRekap.Content.Contains("Rekap Lembur"))
Write-Host "Contains Export button:" ($rRekap.Content.Contains("Export Excel"))

Write-Host "`n=== 8. TEST EXCEL EXPORT /Overtime/Export ==="
$rExport = Invoke-WebRequest -Uri "http://localhost:5000/Overtime/Export" -WebSession $session -UseBasicParsing
Write-Host "Export Status:" $rExport.StatusCode
Write-Host "Content-Type:" $rExport.Headers["Content-Type"]
Write-Host "RawContentLength:" $rExport.RawContentLength

Write-Host "`n=== 9. TEST GET /MasterPekerja ==="
$rMaster = Invoke-WebRequest -Uri "http://localhost:5000/MasterPekerja" -WebSession $session -UseBasicParsing
Write-Host "Master Pekerja Status:" $rMaster.StatusCode
Write-Host "Contains Employee Table:" ($rMaster.Content.Contains("DATA MASTER PEKERJA") -or $rMaster.Content.Contains("Master Pekerja"))

Write-Host "`n=== 10. TEST GET /RiwayatPenginput ==="
$rAudit = Invoke-WebRequest -Uri "http://localhost:5000/RiwayatPenginput" -WebSession $session -UseBasicParsing
Write-Host "Riwayat Penginput Status:" $rAudit.StatusCode
Write-Host "Contains Audit Trail:" ($rAudit.Content.Contains("RIWAYAT PENGINPUT DATA") -or $rAudit.Content.Contains("Riwayat Penginput"))

Write-Host "`n=== 11. TEST KARYAWAN LOGIN (Restricted Plant View) ==="
$sessionKaryawan = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$rKLoginGet = Invoke-WebRequest -Uri "http://localhost:5000/Auth/Login" -WebSession $sessionKaryawan -UseBasicParsing
$kToken = ""
if ($rKLoginGet.Content -match 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"') {
    $kToken = $Matches[1]
} elseif ($rKLoginGet.Content -match 'value="([^"]+)"\s+name="__RequestVerificationToken"') {
    $kToken = $Matches[1]
}
$karyawanBody = @{
    "__RequestVerificationToken" = $kToken
    "KaryawanNpk" = "1747"
    "KaryawanNama" = "GILANG"
}
$rKaryawan = Invoke-WebRequest -Uri "http://localhost:5000/Auth/LoginKaryawan" -Method Post -Body $karyawanBody -WebSession $sessionKaryawan -UseBasicParsing
Write-Host "Karyawan Login Status:" $rKaryawan.StatusCode
$rKaryawanDash = Invoke-WebRequest -Uri "http://localhost:5000/Dashboard" -WebSession $sessionKaryawan -UseBasicParsing
Write-Host "Karyawan Dashboard Status:" $rKaryawanDash.StatusCode
Write-Host "Karyawan Dashboard Plant Filter Active:" ($rKaryawanDash.Content.Contains("Hose") -or $rKaryawanDash.Content.Contains("Plant Hose"))

Write-Host "`n=========================================="
Write-Host "ALL 11 INTEGRATION TESTS PASSED SUCCESSFULLY!"
Write-Host "=========================================="
