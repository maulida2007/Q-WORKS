# Comprehensive Test Script for Overtime Calculations in Q-WORKS
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   PENGUJIAN ATURAN KALKULASI LEMBUR Q-WORKS (ASP.NET)    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Load Assembly
$dllPath = "C:\UJIKOM\Q-WORKS\bin\Debug\net8.0\Q-WORKS.dll"
[Reflection.Assembly]::LoadFrom($dllPath) | Out-Null

$calcService = New-Object QWorks.Services.OvertimeCalculatorService

$totalTests = 0
$passedTests = 0

function Assert-Result($testName, $actual, $expected) {
    global:totalTests++
    if ($actual -eq $expected) {
        global:passedTests++
        Write-Host " [PASS] $testName : Actual = $actual" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] $testName : Expected = $expected, Got = $actual" -ForegroundColor Red
    }
}

function Assert-Condition($testName, $condition, $details) {
    global:totalTests++
    if ($condition) {
        global:passedTests++
        Write-Host " [PASS] $testName" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] $testName : $details" -ForegroundColor Red
    }
}

Write-Host "`n--- SKENARIO 1: HARI KERJA BIASA ---" -ForegroundColor Yellow
# Senin 2026-10-19
$workDateMonday = [DateTime]::Parse("2026-10-19")
Assert-Result "Hari kerja biasa terdeteksi bukan libur" $calcService.IsWeekendOrHoliday($workDateMonday) $false

# 1.1 Input 6 jam -> hasil 5 jam bersih
$res6hWork = $calcService.Calculate("Shift 2", $workDateMonday, "16:30", "22:30", $false)
Assert-Result "Hari kerja: Input 6 jam (16:30-22:30) RawMinutes" $res6hWork.RawMinutes 360
Assert-Result "Hari kerja: Input 6 jam CountedMinutes" $res6hWork.CountedMinutes 300
Assert-Result "Hari kerja: Input 6 jam JamOvertime" $res6hWork.JamOvertime 5.0
Assert-Condition "Hari kerja: Input 6 jam IsValid" $res6hWork.IsValid "Must be valid"

# 1.2 Input 10 jam -> hasil 9 jam bersih
$res10hWork = $calcService.Calculate("Shift 2", $workDateMonday, "16:30", "02:30", $false)
Assert-Result "Hari kerja: Input 10 jam (16:30-02:30) RawMinutes" $res10hWork.RawMinutes 600
Assert-Result "Hari kerja: Input 10 jam CountedMinutes" $res10hWork.CountedMinutes 540
Assert-Result "Hari kerja: Input 10 jam JamOvertime" $res10hWork.JamOvertime 9.0

# 1.3 Manual hours 6.0 jam
$res6hManual = $calcService.CalculateFromManualHours("Shift 2", $workDateMonday, 6.0, $false)
Assert-Result "Hari kerja (Manual): Input 6.0 jam JamOvertime" $res6hManual.JamOvertime 5.0

# 1.4 Manual hours 10.0 jam
$res10hManual = $calcService.CalculateFromManualHours("Shift 2", $workDateMonday, 10.0, $false)
Assert-Result "Hari kerja (Manual): Input 10.0 jam JamOvertime" $res10hManual.JamOvertime 9.0

Write-Host "`n--- SKENARIO 2: HARI MINGGU & HARI LIBUR NASIONAL ---" -ForegroundColor Yellow
# Minggu 2026-10-25
$sundayDate = [DateTime]::Parse("2026-10-25")
Assert-Result "Hari Minggu terdeteksi otomatis sebagai libur" $calcService.IsWeekendOrHoliday($sundayDate) $true
$holSunday = $calcService.CheckHoliday($sundayDate)
Assert-Result "Deskripsi Hari Minggu" $holSunday.Description "Hari Minggu"

# 2.1 Hari Minggu: Input 6 jam -> hasil 5 jam bersih
$res6hSun = $calcService.Calculate("Shift 1", $sundayDate, "07:30", "13:30", $true)
Assert-Result "Hari Minggu: Input 6 jam RawMinutes" $res6hSun.RawMinutes 360
Assert-Result "Hari Minggu: Input 6 jam CountedMinutes" $res6hSun.CountedMinutes 300
Assert-Result "Hari Minggu: Input 6 jam JamOvertime" $res6hSun.JamOvertime 5.0

# 2.2 Hari Minggu: Input 7 jam -> hasil 6 jam bersih
$res7hSun = $calcService.Calculate("Shift 1", $sundayDate, "07:30", "14:30", $true)
Assert-Result "Hari Minggu: Input 7 jam RawMinutes" $res7hSun.RawMinutes 420
Assert-Result "Hari Minggu: Input 7 jam CountedMinutes" $res7hSun.CountedMinutes 360
Assert-Result "Hari Minggu: Input 7 jam JamOvertime" $res7hSun.JamOvertime 6.0

# 2.3 Hari Minggu: Input 9 jam (07:30-16:30) -> DITOLAK (tidak bisa > 7 jam kerja di hari libur)
$res9hSun = $calcService.Calculate("Shift 1", $sundayDate, "07:30", "16:30", $true)
Assert-Result "Hari Minggu: Input 9 jam IsValid harus FALSE" $res9hSun.IsValid $false
Assert-Condition "Hari Minggu: Input 9 jam ErrorMessage berisi aturan max 7 jam" ($res9hSun.ErrorMessage -like "*tidak bisa memasukkan lebih dari 7 jam kerja*") "Must contain holiday limit message"

# 2.4 Libur Nasional Tetap: 17 Agustus 2026 (Hari Kemerdekaan RI)
$indepDay = [DateTime]::Parse("2026-08-17")
Assert-Result "17 Agustus terdeteksi otomatis libur nasional" $calcService.IsWeekendOrHoliday($indepDay) $true
$res9hIndep = $calcService.Calculate("Shift 1", $indepDay, "07:30", "16:30", $false) # isHoliday = false parameter, but auto detected!
Assert-Result "17 Agustus: Auto detect Holiday dan TOLAK input 9 jam (IsValid = false)" $res9hIndep.IsValid $false

# 2.4b Manual hours 8.0 jam di hari libur -> DITOLAK
$res8hManualHol = $calcService.CalculateFromManualHours("Shift 1", $sundayDate, 8.0, $true)
Assert-Result "Hari libur manual 8.0 jam IsValid harus FALSE" $res8hManualHol.IsValid $false

# 2.5 Libur Nasional Dinamis: Idul Fitri 2026 (2026-03-21)
$idulFitri = [DateTime]::Parse("2026-03-21")
Assert-Result "Idul Fitri 2026 terdeteksi libur" $calcService.IsWeekendOrHoliday($idulFitri) $true
$res7hIdul = $calcService.Calculate("Shift 1", $idulFitri, "07:30", "14:30", $false)
Assert-Result "Idul Fitri 2026: Input 7 jam -> 6 jam bersih" $res7hIdul.JamOvertime 6.0

# 2.6 Hari Sabtu (Bukan Libur Nasional)
$saturday = [DateTime]::Parse("2026-10-24")
Assert-Result "Hari Sabtu biasa bukan libur otomatis" $calcService.IsWeekendOrHoliday($saturday) $false

Write-Host "`n--- SKENARIO 3: VALIDASI INPUT <= 1 JAM ---" -ForegroundColor Yellow
# 3.1 Input 0 jam (0 menit)
$res0h = $calcService.CalculateFromManualHours("Shift 2", $workDateMonday, 0, $false)
Assert-Result "Input 0 jam IsValid" $res0h.IsValid $false

# 3.2 Input kurang dari 1 jam (misal 30 menit / 0.5 jam)
$res30m = $calcService.CalculateFromManualHours("Shift 2", $workDateMonday, 0.5, $false)
Assert-Result "Input 0.5 jam (30 menit) IsValid" $res30m.IsValid $false
Assert-Condition "Input 0.5 jam pesan error menyebut istirahat 1 jam" ($res30m.ErrorMessage.Contains("istirahat")) $res30m.ErrorMessage

# 3.3 Input tepat 1 jam (60 menit)
$res60m = $calcService.Calculate("Shift 2", $workDateMonday, "16:30", "17:30", $false)
Assert-Result "Input tepat 1 jam (60 menit) IsValid" $res60m.IsValid $false
Assert-Condition "Input 60m ditolak karena durasi bersih <= 0" ($res60m.ErrorMessage.Contains("60 menit") -or $res60m.ErrorMessage.Contains("istirahat")) $res60m.ErrorMessage

# 3.4 Input 1.5 jam (90 menit) -> valid, durasi bersih 0.5 jam (30 menit)
$res90m = $calcService.Calculate("Shift 2", $workDateMonday, "16:30", "18:00", $false)
Assert-Result "Input 1.5 jam (90 menit) IsValid" $res90m.IsValid $true
Assert-Result "Input 1.5 jam CountedMinutes" $res90m.CountedMinutes 30
Assert-Result "Input 1.5 jam JamOvertime" $res90m.JamOvertime 0.5

Write-Host "`n--- SKENARIO 4: INPUT JAM & MENIT / DESIMAL ---" -ForegroundColor Yellow
# 4.1 Input 2.5 jam (150 menit) hari kerja -> 1.5 jam bersih (90 menit)
$res2_5h = $calcService.CalculateFromManualHours("Shift 2", $workDateMonday, 2.5, $false)
Assert-Result "Input 2.5 jam hari kerja CountedMinutes" $res2_5h.CountedMinutes 90
Assert-Result "Input 2.5 jam hari kerja JamOvertime" $res2_5h.JamOvertime 1.5

# 4.2 Input 6.5 jam (390 menit) hari libur -> 5.5 jam bersih (330 menit)
$res6_5h = $calcService.CalculateFromManualHours("Shift 1", $sundayDate, 6.5, $true)
Assert-Result "Input 6.5 jam hari libur CountedMinutes" $res6_5h.CountedMinutes 330
Assert-Result "Input 6.5 jam hari libur JamOvertime" $res6_5h.JamOvertime 5.5

# 4.3 Input 7.5 jam (450 menit) hari libur -> dibatasi 7 jam -> 6 jam bersih
$res7_5h = $calcService.CalculateFromManualHours("Shift 1", $sundayDate, 7.5, $true)
Assert-Result "Input 7.5 jam hari libur JamOvertime (cap 7h - 1h = 6h)" $res7_5h.JamOvertime 6.0

Write-Host "`n--- SKENARIO 5: TUL FORMULA VERIFICATION ---" -ForegroundColor Yellow
# TUL Hari Kerja:
# 1 jam bersih = 1.0 * 1.5 = 1.5 TUL
Assert-Result "TUL Kerja 1 jam" ($calcService.CalculateTul(1.0, $false)) 1.5
# 5 jam bersih = 1.5 + 4 * 2.0 = 9.5 TUL
Assert-Result "TUL Kerja 5 jam (dari input 6 jam)" ($calcService.CalculateTul(5.0, $false)) 9.5
# 9 jam bersih = 1.5 + 8 * 2.0 = 17.5 TUL
Assert-Result "TUL Kerja 9 jam (dari input 10 jam)" ($calcService.CalculateTul(9.0, $false)) 17.5

# TUL Hari Libur:
# 5 jam bersih = 5 * 2.0 = 10.0 TUL
Assert-Result "TUL Libur 5 jam (dari input 6 jam)" ($calcService.CalculateTul(5.0, $true)) 10.0
# 6 jam bersih = 6 * 2.0 = 12.0 TUL
Assert-Result "TUL Libur 6 jam (dari input 7 jam)" ($calcService.CalculateTul(6.0, $true)) 12.0
# 6 jam bersih = 6 * 2.0 = 12.0 TUL (dari input 9 jam yang dicap)
Assert-Result "TUL Libur 6 jam (dari input 9 jam yang dicap)" ($calcService.CalculateTul(6.0, $true)) 12.0

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "   HASIL PENGUJIAN: $passedTests / $totalTests BERHASIL   " -ForegroundColor $(if ($passedTests -eq $totalTests) { "Green" } else { "Red" })
Write-Host "==========================================================" -ForegroundColor Cyan
