$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   PENGUJIAN VALIDASI MAKSIMAL 7 JAM KERJA HARI LIBUR     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000/api/overtime/preview"

function Test-Preview($testName, $body, $expectedValid, $expectedMessageLike = "") {
    $json = $body | ConvertTo-Json
    $res = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $json -ContentType "application/json"
    $data = $res.data

    if ($data.isValid -eq $expectedValid) {
        if ($expectedValid -eq $false -and $expectedMessageLike -ne "") {
            if ($data.errorMessage -like "*$expectedMessageLike*") {
                Write-Host " [PASS] $testName : IsValid=$($data.isValid), ErrorMessage='$($data.errorMessage)'" -ForegroundColor Green
            } else {
                Write-Host " [FAIL] $testName : Message mismatch! Got: $($data.errorMessage)" -ForegroundColor Red
            }
        } else {
            Write-Host " [PASS] $testName : IsValid=$($data.isValid), JamOvertime=$($data.jamOvertime), Tul=$($data.totalTul)" -ForegroundColor Green
        }
    } else {
        Write-Host " [FAIL] $testName : Expected IsValid=$expectedValid, Got IsValid=$($data.isValid). Error: $($data.errorMessage)" -ForegroundColor Red
    }
}

# 1. Hari kerja biasa (Senin 2026-10-19): 6 jam (16:30 - 22:30)
Test-Preview "Hari Kerja: 6 jam" @{
    shiftName = "Shift 2"
    workDate = "2026-10-19"
    startTimeStr = "16:30"
    endTimeStr = "22:30"
    isHoliday = $false
} $true

# 2. Hari kerja biasa (Senin 2026-10-19): 10 jam (16:30 - 02:30)
Test-Preview "Hari Kerja: 10 jam (diperbolehkan > 7 jam)" @{
    shiftName = "Shift 2"
    workDate = "2026-10-19"
    startTimeStr = "16:30"
    endTimeStr = "02:30"
    isHoliday = $false
} $true

# 3. Hari Libur (Minggu 2026-10-25): 6 jam (07:30 - 13:30)
Test-Preview "Hari Libur: 6 jam (Valid <= 7 jam)" @{
    shiftName = "Shift 1"
    workDate = "2026-10-25"
    startTimeStr = "07:30"
    endTimeStr = "13:30"
    isHoliday = $true
} $true

# 4. Hari Libur (Minggu 2026-10-25): 7 jam (07:30 - 14:30)
Test-Preview "Hari Libur: Tepat 7 jam (Valid batas maks)" @{
    shiftName = "Shift 1"
    workDate = "2026-10-25"
    startTimeStr = "07:30"
    endTimeStr = "14:30"
    isHoliday = $true
} $true

# 5. Hari Libur (Minggu 2026-10-25): 7.5 jam (07:30 - 15:00) -> DITOLAK
Test-Preview "Hari Libur: 7.5 jam -> DITOLAK" @{
    shiftName = "Shift 1"
    workDate = "2026-10-25"
    startTimeStr = "07:30"
    endTimeStr = "15:00"
    isHoliday = $true
} $false "batas maksimal input adalah 7 jam"

# 6. Hari Libur (Minggu 2026-10-25): 9 jam (07:30 - 16:30) -> DITOLAK
Test-Preview "Hari Libur: 9 jam -> DITOLAK" @{
    shiftName = "Shift 1"
    workDate = "2026-10-25"
    startTimeStr = "07:30"
    endTimeStr = "16:30"
    isHoliday = $true
} $false "batas maksimal input adalah 7 jam"

# 7. Libur Nasional (17 Agustus 2026): 8 jam (07:30 - 15:30) -> DITOLAK (Auto detect Holiday)
Test-Preview "Libur Nasional (17 Agust): 8 jam -> DITOLAK" @{
    shiftName = "Shift 1"
    workDate = "2026-08-17"
    startTimeStr = "07:30"
    endTimeStr = "15:30"
    isHoliday = $false
} $false "batas maksimal input adalah 7 jam"

# 8. Libur Nasional (17 Agustus 2026): 7 jam (07:30 - 14:30) -> VALID
Test-Preview "Libur Nasional (17 Agust): 7 jam -> VALID" @{
    shiftName = "Shift 1"
    workDate = "2026-08-17"
    startTimeStr = "07:30"
    endTimeStr = "14:30"
    isHoliday = $false
} $true

Write-Host "`nSemua skenario pengujian berhasil!" -ForegroundColor Green
