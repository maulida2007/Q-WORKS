$ErrorActionPreference = 'Stop'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# 1. Login Admin
$rLoginGet = Invoke-WebRequest -Uri "http://localhost:5000/Auth/Login" -WebSession $session -UseBasicParsing
$token = ""
if ($rLoginGet.Content -match 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"') {
    $token = $Matches[1]
} elseif ($rLoginGet.Content -match 'value="([^"]+)"\s+name="__RequestVerificationToken"') {
    $token = $Matches[1]
}

$loginBody = @{
    "__RequestVerificationToken" = $token
    "AdminUsername" = "admin"
    "AdminPassword" = "admin123"
}
Invoke-WebRequest -Uri "http://localhost:5000/Auth/LoginAdmin" -Method Post -Body $loginBody -WebSession $session -UseBasicParsing | Out-Null

function Test-FilterUrl($name, $url) {
    Write-Host "`n--- Testing: $name ---"
    Write-Host "URL: $url"
    $r = Invoke-WebRequest -Uri $url -WebSession $session -UseBasicParsing
    
    # Extract KPI Total Jam Overtime
    if ($r.Content -match '<span class="kpi-main-number">([^<]+)</span>\s*<span class="kpi-main-unit">Jam</span>') {
        Write-Host "KPI Total Jam:" $Matches[1]
    } else {
        Write-Host "KPI Total Jam not found"
    }

    # Extract KPI Karyawan Aktif Lembur
    if ($r.Content -match '<span class="kpi-main-number">(\d+)</span>\s*<span class="kpi-main-unit">Orang</span>') {
        Write-Host "KPI Karyawan:" $Matches[1]
    }

    # Check dropdown selected values
    if ($r.Content -match '<select name="plants"[^>]*>([\s\S]*?)</select>') {
        $plantOpts = $Matches[1]
        $selectedPlant = if ($plantOpts -match '<option[^>]*selected[^>]*>([^<]+)</option>') { $Matches[1].Trim() } else { "None" }
        Write-Host "Selected Plant Option in HTML:" $selectedPlant
    }

    # Check top employees
    $topEmps = [regex]::Matches($r.Content, '<div class="leaderboard-worker-name"[^>]*>([^<]+)</div>')
    Write-Host "Top workers count:" $topEmps.Count
    if ($topEmps.Count -gt 0) {
        Write-Host "First worker:" $topEmps[0].Groups[1].Value.Trim()
    }
}

Test-FilterUrl "Default (No Filter)" "http://localhost:5000/Dashboard"
Test-FilterUrl "Filter Bulan: September 2026" "http://localhost:5000/Dashboard?months=September+2026"
Test-FilterUrl "Filter Tanggal: 8" "http://localhost:5000/Dashboard?days=8"
Test-FilterUrl "Filter Shift: Shift 1" "http://localhost:5000/Dashboard?shifts=Shift+1"
Test-FilterUrl "Filter Plant: Plant Hose" "http://localhost:5000/Dashboard?plants=Plant+Hose"
Test-FilterUrl "Filter Plant: Dashboard HOSE (what current view generates)" "http://localhost:5000/Dashboard?plants=Dashboard+HOSE"
Test-FilterUrl "Filter Employee: 1747" "http://localhost:5000/Dashboard?employees=1747"
Test-FilterUrl "Filter Combined: Bulan Sep + Tgl 8 + Shift 1 + Plant Hose + Emp 1747" "http://localhost:5000/Dashboard?months=September+2026&days=8&shifts=Shift+1&plants=Plant+Hose&employees=1747"
Test-FilterUrl "Filter Empty (Non-existent): Molded + Emp 1747" "http://localhost:5000/Dashboard?plants=Plant+Molded&employees=1747"
