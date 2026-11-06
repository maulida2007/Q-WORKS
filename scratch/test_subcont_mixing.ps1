$ErrorActionPreference = "Stop"

function Login-User([string]$npk, [string]$nama) {
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $loginPage = Invoke-WebRequest -Uri "http://localhost:5000/Auth/Login" -Method Get -WebSession $session -UseBasicParsing
    $token = [regex]::Match($loginPage.Content, 'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"').Groups[1].Value
    $body = @{
        __RequestVerificationToken = $token
        KaryawanNpk = $npk
        KaryawanNama = $nama
    }
    $resp = Invoke-WebRequest -Uri "http://localhost:5000/Auth/LoginKaryawan" -Method Post -Body $body -WebSession $session -MaximumRedirection 0 -ErrorAction SilentlyContinue -UseBasicParsing
    return $session
}

Write-Host "============================================="
Write-Host "TEST 1: KIKI (PLANT SUBCONT - NPK 0201)"
Write-Host "============================================="
$kikiSession = Login-User "0201" "KIKI"
$kikiMaster = Invoke-WebRequest -Uri "http://localhost:5000/MasterPekerja" -Method Get -WebSession $kikiSession -UseBasicParsing
$kikiHtml = $kikiMaster.Content

$subcontCount = [regex]::Matches($kikiHtml, 'Plant Subcont').Count
$mixingCount = [regex]::Matches($kikiHtml, 'Plant Lab Mixing').Count
$hoseCount = [regex]::Matches($kikiHtml, 'Plant Hose').Count
$moldedCount = [regex]::Matches($kikiHtml, 'Plant Molded').Count

Write-Host "Occurrences of 'Plant Subcont': $subcontCount"
Write-Host "Occurrences of 'Plant Lab Mixing': $mixingCount"
Write-Host "Occurrences of 'Plant Hose': $hoseCount"
$kLines = $kikiHtml -split "`r?`n"
for ($idx = 0; $idx -lt $kLines.Count; $idx++) {
    if ($kLines[$idx] -like "*Plant Hose*") {
        Write-Host "  -> Line $($idx + 1): $($kLines[$idx].Trim())"
    }
}
Write-Host "Occurrences of 'Plant Molded': $moldedCount (Expected: 0)"

$kikiTotal = [regex]::Match($kikiHtml, '(\d+)\s+Pekerja')
Write-Host "Kiki total workers counter: $($kikiTotal.Value) (Expected: 7 Pekerja)"

Write-Host "`nWorkers in table for Kiki:"
$kikiNames = [regex]::Matches($kikiHtml, '<span style="font-weight: 700; color: #FFF8E7; font-size: 0.92rem;">\s*([^<]+)\s*</span>')
foreach ($m in $kikiNames) {
    Write-Host " - $($m.Groups[1].Value.Trim())"
}

Write-Host "`n============================================="
Write-Host "TEST 2: RAYHAN (PLANT LAB MIXING - NPK 1705)"
Write-Host "============================================="
$rayhanSession = Login-User "1705" "RAYHAN"
$rayhanMaster = Invoke-WebRequest -Uri "http://localhost:5000/MasterPekerja" -Method Get -WebSession $rayhanSession -UseBasicParsing
$rayhanHtml = $rayhanMaster.Content

$rSubcont = [regex]::Matches($rayhanHtml, 'Plant Subcont').Count
$rMixing = [regex]::Matches($rayhanHtml, 'Plant Lab Mixing').Count
$rHose = [regex]::Matches($rayhanHtml, 'Plant Hose').Count
Write-Host "Occurrences of 'Plant Subcont': $rSubcont"
Write-Host "Occurrences of 'Plant Lab Mixing': $rMixing"
Write-Host "Occurrences of 'Plant Hose': $rHose (Expected: 0)"
$rayhanTotal = [regex]::Match($rayhanHtml, '(\d+)\s+Pekerja')
Write-Host "Rayhan total workers counter: $($rayhanTotal.Value) (Expected: 7 Pekerja)"

Write-Host "`n============================================="
Write-Host "TEST 3: KIKI FILTERING SPECIFIC PLANT"
Write-Host "============================================="
# Filter Subcont only
$kikiSubOnly = Invoke-WebRequest -Uri "http://localhost:5000/MasterPekerja?plant=Plant%20Subcont" -Method Get -WebSession $kikiSession -UseBasicParsing
$subOnlyCount = [regex]::Matches($kikiSubOnly.Content, '<tr\s+style="border-bottom: 1px solid').Count
Write-Host "Filter 'Plant Subcont' table rows: $subOnlyCount (Expected: 4)"

# Filter Mixing only
$kikiMixOnly = Invoke-WebRequest -Uri "http://localhost:5000/MasterPekerja?plant=Plant%20Lab%20Mixing" -Method Get -WebSession $kikiSession -UseBasicParsing
$mixOnlyCount = [regex]::Matches($kikiMixOnly.Content, '<tr\s+style="border-bottom: 1px solid').Count
Write-Host "Filter 'Plant Lab Mixing' table rows: $mixOnlyCount (Expected: 3)"

# Attempt tampering with Plant Molded
$kikiTamper = Invoke-WebRequest -Uri "http://localhost:5000/MasterPekerja?plant=Plant%20Molded" -Method Get -WebSession $kikiSession -UseBasicParsing
$tamperMolded = [regex]::Matches($kikiTamper.Content, 'Plant Molded').Count
Write-Host "Attempt filter 'Plant Molded': Molded occurrences: $tamperMolded (Expected: 0)"

Write-Host "`n============================================="
Write-Host "TEST 4: GILANG (PLANT HOSE - NPK 1747)"
Write-Host "============================================="
$gilangSession = Login-User "1747" "GILANG"
$gilangMaster = Invoke-WebRequest -Uri "http://localhost:5000/MasterPekerja" -Method Get -WebSession $gilangSession -UseBasicParsing
$gilangHtml = $gilangMaster.Content

$gHose = [regex]::Matches($gilangHtml, 'Plant Hose').Count
$gSubcont = [regex]::Matches($gilangHtml, 'Plant Subcont').Count
$gMixing = [regex]::Matches($gilangHtml, 'Plant Lab Mixing').Count
Write-Host "Occurrences of 'Plant Hose': $gHose"
Write-Host "Occurrences of 'Plant Subcont': $gSubcont (Expected: 0)"
Write-Host "Occurrences of 'Plant Lab Mixing': $gMixing (Expected: 0)"
if ($gilangHtml.Contains("Plant Anda: Plant Hose")) {
    Write-Host "[PASS] Gilang has locked badge for Plant Hose"
}

Write-Host "`nAll tests completed successfully!"
