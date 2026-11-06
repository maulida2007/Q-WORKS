$ErrorActionPreference = "Stop"
$PSDefaultParameterValues['Invoke-WebRequest:UseBasicParsing'] = $true

$baseUrl = "http://localhost:5000"
$session = $null

# 1. Fetch Login Page
$loginResp = Invoke-WebRequest -Uri "$baseUrl/Auth/Login" -SessionVariable session
$token = [regex]::Match($loginResp.Content, 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"').Groups[1].Value
Write-Host "Anti-Forgery Token: $($token.Substring(0, 15))..."

# 2. Login as Admin
$body = @{
    "__RequestVerificationToken" = $token
    "ActiveTab" = "admin"
    "AdminUsername" = "admin"
    "AdminPassword" = "admin123"
}
$loginPost = Invoke-WebRequest -Uri "$baseUrl/Auth/LoginAdmin" -Method Post -Body $body -WebSession $session
Write-Host "Login Status: $($loginPost.StatusCode)"

function Test-Filter([string]$name, [string]$path, [hashtable]$expected) {
    Write-Host "`n==============================================="
    Write-Host "TEST: $name"
    Write-Host "URL: $path"
    $resp = Invoke-WebRequest -Uri "$baseUrl$path" -WebSession $session
    $html = $resp.Content

    # Extract KPI: Total Jam Overtime
    $jamMatch = [regex]::Match($html, 'TOTAL JAM OVERTIME[\s\S]*?<span class="kpi-main-number">([^<]+)</span>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if (-not $jamMatch.Success) {
        $jamMatch = [regex]::Match($html, 'Total Jam Lembur[\s\S]*?<div style="font-size: 1.45rem;[^>]*>\s*([0-9.,]+)')
    }
    if (-not $jamMatch.Success) {
        $jamMatch = [regex]::Match($html, 'Total Jam Lembur[\s\S]*?<span class="kpi-main-number">([^<]+)</span>')
    }
    if (-not $jamMatch.Success) {
        $jamMatch = [regex]::Match($html, 'Total Jam Overtime[\s\S]*?<div style="font-size: 1.45rem;[^>]*>\s*([0-9.,]+)')
    }
    $totalJam = if ($jamMatch.Success) { $jamMatch.Groups[1].Value.Trim() } else { "NOT_FOUND" }

    # Extract KPI: Total Karyawan
    $empMatch = [regex]::Match($html, 'KARYAWAN AKTIF LEMBUR[\s\S]*?<span class="kpi-main-number">([^<]+)</span>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if (-not $empMatch.Success) {
        $empMatch = [regex]::Match($html, 'TOTAL KARYAWAN[\s\S]*?<span class="kpi-main-number">([^<]+)</span>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    }
    if (-not $empMatch.Success) {
        $empMatch = [regex]::Match($html, 'Total Karyawan[\s\S]*?<div style="font-size: 1.45rem;[^>]*>\s*([0-9]+)')
    }
    $totalEmp = if ($empMatch.Success) { $empMatch.Groups[1].Value.Trim() } else { "NOT_FOUND" }

    # Check for empty state
    $hasEmptyState = $html.Contains("Belum ada data lembur") -or $html.Contains("Tidak ada data") -or ($totalJam -eq "0.0")

    Write-Host "Actual Total Jam: $totalJam (Expected: $($expected.TotalJam))"
    Write-Host "Actual Total Emp: $totalEmp (Expected: $($expected.TotalEmp))"
    Write-Host "Empty State Present: $hasEmptyState"

    $pass = $true
    if ($expected.ContainsKey("TotalJam") -and $null -ne $expected.TotalJam -and $totalJam -ne $expected.TotalJam) {
        $pass = $false
    }
    if ($expected.ContainsKey("TotalEmp") -and $null -ne $expected.TotalEmp -and $totalEmp -ne $expected.TotalEmp) {
        $pass = $false
    }
    if ($expected.ContainsKey("EmptyState") -and $null -ne $expected.EmptyState -and $expected.EmptyState -ne $hasEmptyState) {
        $pass = $false
    }
    
    if ($pass) {
        Write-Host "RESULT: PASS [OK]" -ForegroundColor Green
    } else {
        Write-Host "RESULT: FAIL [MISMATCH]" -ForegroundColor Red
    }
    return $pass
}

$allPass = $true

# Test 1: Default
$p = Test-Filter "1. Default Filters (Semua)" "/Dashboard" @{ TotalJam = "89.5"; TotalEmp = "39"; EmptyState = $false }
$allPass = $allPass -and $p

# Test 2: Filter Bulan (September 2026 vs Oktober 2026)
$p = Test-Filter "2a. Bulan September 2026" "/Dashboard?months=September+2026" @{ TotalJam = "87.5"; TotalEmp = "39"; EmptyState = $false }
$allPass = $allPass -and $p
$p = Test-Filter "2b. Bulan Oktober 2026 (No Data)" "/Dashboard?months=Oktober+2026" @{ TotalJam = "0.0"; TotalEmp = "0"; EmptyState = $true }
$allPass = $allPass -and $p

# Test 3: Filter Tanggal (Tanggal 8)
$p = Test-Filter "3. Tanggal 8" "/Dashboard?days=8" @{ TotalJam = "56.0"; TotalEmp = "30"; EmptyState = $false }
$allPass = $allPass -and $p

# Test 4: Filter Shift (Shift 1 vs Shift 2)
$p = Test-Filter "4a. Shift 1" "/Dashboard?shifts=Shift+1" @{ TotalJam = "57.5"; TotalEmp = "26"; EmptyState = $false }
$allPass = $allPass -and $p
$p = Test-Filter "4b. Shift 2" "/Dashboard?shifts=Shift+2" @{ TotalJam = "32.0"; TotalEmp = "14"; EmptyState = $false }
$allPass = $allPass -and $p

# Test 5: Filter Plant (Plant Hose)
$p = Test-Filter "5. Plant Hose" "/Dashboard?plants=Plant+Hose" @{ TotalJam = "21.5"; TotalEmp = "9"; EmptyState = $false }
$allPass = $allPass -and $p

# Test 6: Filter Karyawan (1747 - GILANG)
$p = Test-Filter "6. Karyawan 1747 (GILANG)" "/Dashboard?employees=1747" @{ TotalJam = "6.0"; TotalEmp = "1"; EmptyState = $false }
$allPass = $allPass -and $p

# Test 7: Kombinasi Kelima Filter (Bulan Sep + Tgl 8 + Shift 1 + Plant Hose + Karyawan 1747)
$p = Test-Filter "7. Kombinasi 5 Filter (Sep + Tgl 8 + Shift 1 + Hose + 1747)" "/Dashboard?months=September+2026&days=8&shifts=Shift+1&plants=Plant+Hose&employees=1747" @{ TotalJam = "2.0"; TotalEmp = "1"; EmptyState = $false }
$allPass = $allPass -and $p

# Test 8: Ubah Plant setelah Karyawan dipilih (Hose 1747 -> Plant Molded)
$p = Test-Filter "8. Ubah Plant setelah Karyawan (Plant Molded + invalid 1747)" "/Dashboard?plants=Plant+Molded&employees=1747" @{ TotalJam = "21.0"; TotalEmp = "10"; EmptyState = $false }
$allPass = $allPass -and $p

# Test 9: Ubah Bulan setelah Tanggal (Tanggal 31 pada September yang hanya ada 30 hari)
$p = Test-Filter "9. Sanitasi Tanggal jika Bulan Berubah (Sep 2026 + Tgl 31)" "/Dashboard?months=September+2026&days=31" @{ TotalJam = "87.5"; TotalEmp = "39"; EmptyState = $false }
$allPass = $allPass -and $p

# Test 10: Kombinasi Filter Tanpa Data (Hose + Gilang 1747 + Shift 2 pada tgl 8 padahal shift 1)
$p = Test-Filter "10. Kombinasi Tanpa Data (Gilang Shift 2 di Tgl 8)" "/Dashboard?months=September+2026&days=8&shifts=Shift+2&plants=Plant+Hose&employees=1747" @{ TotalJam = "0.0"; TotalEmp = "0"; EmptyState = $true }
$allPass = $allPass -and $p

# Test 11: Switch Filter Bergantian (Subcont -> Molded -> All)
$p = Test-Filter "11a. Subcont" "/Dashboard?plants=subcont" @{ TotalJam = "10.5"; TotalEmp = "4"; EmptyState = $false }
$allPass = $allPass -and $p
$p = Test-Filter "11b. Molded" "/Dashboard?plants=molded" @{ TotalJam = "21.0"; TotalEmp = "10"; EmptyState = $false }
$allPass = $allPass -and $p

# Test 12: Reset (Kembali ke default tanpa query string)
$p = Test-Filter "12. Reset ke Default" "/Dashboard" @{ TotalJam = "89.5"; TotalEmp = "39"; EmptyState = $false }
$allPass = $allPass -and $p

# Test 13: Konsistensi Rekap Overtime & Export Excel
$p = Test-Filter "13a. Rekap Page dengan 5 Filter" "/Overtime/Rekap?months=September+2026&days=8&shifts=Shift+1&plants=Plant+Hose&employees=1747" @{ TotalJam = "2.0"; TotalEmp = "1"; EmptyState = $false }
$allPass = $allPass -and $p

$excelResp = Invoke-WebRequest -Uri "$baseUrl/Overtime/ExportExcel?months=September+2026&days=8&shifts=Shift+1&plants=Plant+Hose&employees=1747" -WebSession $session
Write-Host "`nTest 13b. Export Excel Status: $($excelResp.StatusCode), Content-Type: $($excelResp.Headers['Content-Type'])"
$excelPass = ($excelResp.StatusCode -eq 200) -and ($excelResp.Headers['Content-Type'].Contains("spreadsheetml"))
if ($excelPass) {
    Write-Host "Export Excel: PASS [OK]" -ForegroundColor Green
} else {
    Write-Host "Export Excel: FAIL" -ForegroundColor Red
}

Write-Host "`n==============================================="
if ($allPass -and $excelPass) {
    Write-Host "ALL 13 TESTS PASSED PERFECTLY!" -ForegroundColor Green
} else {
    Write-Host "SOME TESTS FAILED!" -ForegroundColor Red
}
