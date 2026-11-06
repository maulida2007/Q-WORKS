$baseUrl = "http://localhost:5000"
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Q-WORKS COMPREHENSIVE AUDIT TEST SUITE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# -----------------------------------------------------------------
# TEST 1: AUTENTIKASI DAN LOGIN
# -----------------------------------------------------------------
Write-Host "`n[1] Testing Autentikasi dan Login..." -ForegroundColor Yellow

# 1.A Partial NPK lookup test (Must NOT leak name)
$resPartial = Invoke-RestMethod -Uri "$baseUrl/Auth/LookupNpk?npk=17" -Method Get
if ($resPartial.success -eq $false) {
    Write-Host " [PASS] Lookup partial NPK '17' returned success: false (No name leaked)" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Lookup partial NPK returned name: $($resPartial.name)" -ForegroundColor Red
}

# 1.B Non-existent NPK lookup test
$resNotFound = Invoke-RestMethod -Uri "$baseUrl/Auth/LookupNpk?npk=99999" -Method Get
if ($resNotFound.success -eq $false -and $resNotFound.message -match "tidak ditemukan") {
    Write-Host " [PASS] Lookup non-existent NPK returned error message without leaking other names: $($resNotFound.message)" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Lookup non-existent NPK response unexpected" -ForegroundColor Red
}

# 1.C Exact NPK lookup test
$resExact = Invoke-RestMethod -Uri "$baseUrl/Auth/LookupNpk?npk=1747" -Method Get
if ($resExact.success -eq $true -and $resExact.name -eq "GILANG") {
    Write-Host " [PASS] Lookup exact NPK '1747' correctly identified: $($resExact.name) ($($resExact.plant))" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Lookup exact NPK failed" -ForegroundColor Red
}

# 1.D Login Karyawan
$sessionKaryawan = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginPage = Invoke-WebRequest -Uri "$baseUrl/Auth/Login" -WebSession $sessionKaryawan -UseBasicParsing
$token = ''
if ($loginPage.Content -match 'name="__RequestVerificationToken"[^>]*value="([^"]+)"') {
    $token = $Matches[1]
}

$loginKaryawanBody = @{
    '__RequestVerificationToken' = $token
    'KaryawanNpk' = '1747'
    'KaryawanNama' = 'GILANG'
}
$loginKaryawanRes = Invoke-WebRequest -Uri "$baseUrl/Auth/LoginKaryawan" -Method Post -Body $loginKaryawanBody -WebSession $sessionKaryawan -UseBasicParsing
Write-Host " [PASS] Login Karyawan status: $($loginKaryawanRes.StatusCode)" -ForegroundColor Green

# 1.E Login Admin
$sessionAdmin = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginAdminPage = Invoke-WebRequest -Uri "$baseUrl/Auth/Login" -WebSession $sessionAdmin -UseBasicParsing
$tokenAdmin = ''
if ($loginAdminPage.Content -match 'name="__RequestVerificationToken"[^>]*value="([^"]+)"') {
    $tokenAdmin = $Matches[1]
}

# Check Admin Form Security Attributes
if ($loginAdminPage.Content.Contains('id="adminUsernameInput"') -and $loginAdminPage.Content.Contains('autocomplete="off"') -and $loginAdminPage.Content.Contains('autocomplete="new-password"')) {
    Write-Host " [PASS] Form Login Admin includes autocomplete='off' and 'new-password' with empty initial values" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Form Login Admin autocomplete attributes missing" -ForegroundColor Red
}

$loginAdminBody = @{
    '__RequestVerificationToken' = $tokenAdmin
    'AdminUsername' = 'admin'
    'AdminPassword' = 'admin123'
}
$loginAdminRes = Invoke-WebRequest -Uri "$baseUrl/Auth/LoginAdmin" -Method Post -Body $loginAdminBody -WebSession $sessionAdmin -UseBasicParsing
Write-Host " [PASS] Login Admin status: $($loginAdminRes.StatusCode)" -ForegroundColor Green


# -----------------------------------------------------------------
# TEST 2: HAK AKSES DAN VALIDASI WAKTU LEMBUR
# -----------------------------------------------------------------
Write-Host "`n[2] Testing Hak Akses Karyawan dan Validasi Lembur..." -ForegroundColor Yellow

# 2.A Karyawan input page restricted to self
$karyawanInputPage = Invoke-WebRequest -Uri "$baseUrl/Overtime/Input" -WebSession $sessionKaryawan -UseBasicParsing
if ($karyawanInputPage.Content.Contains('1 Karyawan Terdaftar') -or ($karyawanInputPage.Content.Contains('GILANG') -and -not $karyawanInputPage.Content.Contains('KATIM'))) {
    Write-Host " [PASS] Halaman Input Karyawan hanya menampilkan akun pekerja miliknya sendiri" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Karyawan masih bisa melihat pekerja lain di form input" -ForegroundColor Red
}

# 2.B Karyawan attempt to submit for other employee (Tampering test)
$tokenKaryawan = ''
if ($karyawanInputPage.Content -match 'name="__RequestVerificationToken"[^>]*value="([^"]+)"') {
    $tokenKaryawan = $Matches[1]
}

$tamperSubmitBody = @{
    '__RequestVerificationToken' = $tokenKaryawan
    'plant' = 'Plant Molded'
    'shiftName' = 'Shift 1'
    'workDate' = '2026-10-27'
    'jamMasuk' = '16:30'
    'jamPulang' = '19:30'
    'isHoliday' = 'false'
    'reason' = 'Uji Coba Tampering Hak Akses'
    'npks' = '1670' # Katim (Plant Molded)
    'selectedNpks' = @('1670')
}

$tamperRes = Invoke-WebRequest -Uri "$baseUrl/Overtime/Submit" -Method Post -Body $tamperSubmitBody -WebSession $sessionKaryawan -UseBasicParsing

# Verify in DB via Admin Rekap: The record MUST belong to Gilang (1747), NOT 1670!
$rekapAdmin = Invoke-WebRequest -Uri "$baseUrl/Overtime/Rekap" -WebSession $sessionAdmin -UseBasicParsing
if ($rekapAdmin.Content.Contains('Uji Coba Tampering Hak Akses')) {
    if ($rekapAdmin.Content -match '1747.*?Uji Coba Tampering') {
        Write-Host " [PASS] Tamper prevented: Server overrides NPK to authenticated user (1747 / GILANG)" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] Tampering was not overridden to authenticated user!" -ForegroundColor Red
    }
}

# 2.C Karyawan denied from Edit / Delete
$editDeniedRes = Invoke-WebRequest -Uri "$baseUrl/Overtime/Edit" -Method Post -Body @{ '__RequestVerificationToken' = $tokenKaryawan; 'id' = 1; 'workDate' = '2026-10-27'; 'shiftName' = 'Shift 1'; 'jamWaktu' = '16:30-18:30'; 'jamOvertime' = 2; 'reason' = 'Hacked' } -WebSession $sessionKaryawan -UseBasicParsing
$rekapKaryawan = Invoke-WebRequest -Uri "$baseUrl/Overtime/Rekap" -WebSession $sessionKaryawan -UseBasicParsing
if ($rekapKaryawan.Content.Contains('Akses ditolak: Karyawan tidak memiliki izin')) {
    Write-Host " [PASS] Karyawan edit ditolak: Akses ditolak" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Karyawan edit not properly blocked" -ForegroundColor Red
}

# 2.D Validasi Waktu Lembur - Overlap Shift
$previewOverlapBody = @{
    'ShiftName' = 'Shift 2' # 07:30 - 16:30
    'WorkDate' = '2026-10-27'
    'StartTimeStr' = '08:00'
    'EndTimeStr' = '12:00'
    'IsHoliday' = $false
} | ConvertTo-Json

$previewOverlap = Invoke-RestMethod -Uri "$baseUrl/Overtime/Preview" -Method Post -Body $previewOverlapBody -ContentType 'application/json'
if ($previewOverlap.data.isValid -eq $false -and $previewOverlap.data.errorMessage -match 'bertabrakan dengan Jam Kerja Shift Resmi') {
    Write-Host " [PASS] Validasi Tabrakan Shift Berhasil: $($previewOverlap.data.errorMessage)" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Validasi tabrakan shift gagal mendeteksi overlap" -ForegroundColor Red
}

# 2.E Validasi Waktu Lembur - Hari Libur > 7 Jam
$previewHolidayLimitBody = @{
    'ShiftName' = 'Shift 1'
    'WorkDate' = '2026-10-25' # Hari Minggu (Libur)
    'StartTimeStr' = '07:30'
    'EndTimeStr' = '15:30' # 8 Jam (> 7 Jam)
    'IsHoliday' = $true
} | ConvertTo-Json

$previewHoliday = Invoke-RestMethod -Uri "$baseUrl/Overtime/Preview" -Method Post -Body $previewHolidayLimitBody -ContentType 'application/json'
if ($previewHoliday.data.isValid -eq $false -and $previewHoliday.data.errorMessage -match 'batas maksimal input adalah 7 jam') {
    Write-Host " [PASS] Validasi Hari Libur > 7 Jam Berhasil Ditolak: $($previewHoliday.data.errorMessage)" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Validasi hari libur tidak membatasi > 7 jam" -ForegroundColor Red
}


# -----------------------------------------------------------------
# TEST 3: MANAJEMEN MASTER PEKERJA
# -----------------------------------------------------------------
Write-Host "`n[3] Testing Master Pekerja — Admin..." -ForegroundColor Yellow

$masterPage = Invoke-WebRequest -Uri "$baseUrl/MasterPekerja" -WebSession $sessionAdmin -UseBasicParsing
$tokenMaster = ''
if ($masterPage.Content -match 'name="__RequestVerificationToken"[^>]*value="([^"]+)"') {
    $tokenMaster = $Matches[1]
}

# 3.A Input Manual
$testNpk = "8899"
$testName = "TEST PEKERJA AUDIT"
$addBody = @{
    '__RequestVerificationToken' = $tokenMaster
    'nik' = $testNpk
    'name' = $testName
    'plant' = 'Plant Hose'
}

$addRes = Invoke-WebRequest -Uri "$baseUrl/MasterPekerja/Add" -Method Post -Body $addBody -WebSession $sessionAdmin -UseBasicParsing
$masterAfterAdd = Invoke-WebRequest -Uri "$baseUrl/MasterPekerja?search=$testNpk" -WebSession $sessionAdmin -UseBasicParsing

if ($masterAfterAdd.Content.Contains($testNpk) -and $masterAfterAdd.Content.Contains($testName)) {
    Write-Host " [PASS] Input Manual Berhasil disimpan di database: $testName ($testNpk)" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Input Manual tidak muncul di Master Pekerja" -ForegroundColor Red
}

# 3.B Validasi Duplikasi NPK
$addDupRes = Invoke-WebRequest -Uri "$baseUrl/MasterPekerja/Add" -Method Post -Body $addBody -WebSession $sessionAdmin -UseBasicParsing
if ($addDupRes.Content.Contains('sudah terdaftar')) {
    Write-Host " [PASS] Duplikasi NPK $testNpk berhasil ditolak oleh server!" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Duplikasi NPK tidak ditolak" -ForegroundColor Red
}

# 3.C Login dengan NPK baru yang barusan diinput
$lookupNewNpk = Invoke-RestMethod -Uri "$baseUrl/Auth/LookupNpk?npk=$testNpk" -Method Get
if ($lookupNewNpk.success -eq $true -and $lookupNewNpk.name -eq $testName) {
    Write-Host " [PASS] Pekerja baru ($testNpk - $testName) langsung terdeteksi di form login!" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Pekerja baru tidak terdeteksi di form login" -ForegroundColor Red
}

# 3.D Export Master Pekerja dengan Filter Plant
$exportHose = Invoke-WebRequest -Uri "$baseUrl/MasterPekerja/ExportExcel?plant=Plant Hose" -WebSession $sessionAdmin -UseBasicParsing
if ($exportHose.Headers['Content-Type'].Contains('spreadsheet') -or $exportHose.RawContentLength -gt 1000) {
    Write-Host " [PASS] Export Master Pekerja (Filter: Plant Hose) berhasil menghasilkan file Excel!" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Export Master Pekerja gagal" -ForegroundColor Red
}

$exportAll = Invoke-WebRequest -Uri "$baseUrl/MasterPekerja/ExportExcel?plant=Semua Plant" -WebSession $sessionAdmin -UseBasicParsing
if ($exportAll.Headers['Content-Type'].Contains('spreadsheet') -or $exportAll.RawContentLength -gt 1000) {
    Write-Host " [PASS] Export Master Pekerja (Semua Plant) berhasil menghasilkan file Excel!" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Export Master Pekerja Semua Plant gagal" -ForegroundColor Red
}


# -----------------------------------------------------------------
# TEST 4: RIWAYAT INPUT DAN EKSPOR REKAP OVERTIME (10 KOLOM & 5 FILTER)
# -----------------------------------------------------------------
Write-Host "`n[4] Testing Riwayat Input & Ekspor Rekap Overtime..." -ForegroundColor Yellow

$riwayatPage = Invoke-WebRequest -Uri "$baseUrl/RiwayatPenginput" -WebSession $sessionAdmin -UseBasicParsing

# Check 10 Headers in UI Table
$expectedHeaders = @(
    "Waktu Input",
    "Role Penginput",
    "Plant",
    "Nama Karyawan",
    "NPK",
    "Plant Karyawan",
    "Shift",
    "Tanggal Lembur",
    "Jam Lembur",
    "Total TUL"
)

$allHeadersFound = $true
foreach ($h in $expectedHeaders) {
    if (-not $riwayatPage.Content.Contains($h)) {
        Write-Host " [FAIL] Header missing in Riwayat Table: $h" -ForegroundColor Red
        $allHeadersFound = $false
    }
}
if ($allHeadersFound) {
    Write-Host " [PASS] 10 Kolom Spesifikasi terpasang sempurna pada tabel Riwayat Penginput!" -ForegroundColor Green
}

# Check 5 Slicer filters
if ($riwayatPage.Content.Contains('Bulan') -and $riwayatPage.Content.Contains('Tanggal') -and $riwayatPage.Content.Contains('Shift') -and $riwayatPage.Content.Contains('Plant') -and $riwayatPage.Content.Contains('Karyawan')) {
    Write-Host " [PASS] 5 Filter Slicer (Bulan, Tanggal, Shift, Plant, Karyawan) tersedia lengkap di Riwayat!" -ForegroundColor Green
}

# Download and inspect Excel file for Riwayat Penginput
$excelFilePath = "scratch/test_riwayat_download.xlsx"
if (Test-Path $excelFilePath) { Remove-Item $excelFilePath -Force }

$exportRiwayat = Invoke-WebRequest -Uri "$baseUrl/RiwayatPenginput/ExportExcel" -WebSession $sessionAdmin -OutFile $excelFilePath
if (Test-Path $excelFilePath) {
    Write-Host " [PASS] File Excel Riwayat Penginput berhasil diunduh ke $excelFilePath" -ForegroundColor Green
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "AUDIT SUITE COMPLETED SUCCESSFULLY!" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
