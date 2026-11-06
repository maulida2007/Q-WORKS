$dbPath = "c:\UJIKOM\Q-WORKS\qworks.db"
# Use sqlite3 if available or python or dotnet
$lines = [System.IO.File]::ReadAllBytes($dbPath)
Write-Host "DB file size:" $lines.Length
