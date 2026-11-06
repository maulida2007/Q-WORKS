Add-Type -Path 'bin\Debug\net8.0\Microsoft.Data.Sqlite.dll'
$conn = New-Object Microsoft.Data.Sqlite.SqliteConnection('Data Source=qworks.db')
$conn.Open()

$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT COUNT(*) FROM Users WHERE Role = 'karyawan'"
$totalKaryawan = $cmd.ExecuteScalar()

$cmd.CommandText = "SELECT Plant, COUNT(*) FROM Users WHERE Role = 'karyawan' GROUP BY Plant ORDER BY Plant"
$reader = $cmd.ExecuteReader()
Write-Host "=== DATA KARYAWAN PER PLANT DI DATABASE ==="
while ($reader.Read()) {
    Write-Host (" - " + $reader[0] + ": " + $reader[1] + " orang")
}
$reader.Close()

Write-Host "-------------------------------------------"
Write-Host "Total Karyawan Aktif: $totalKaryawan orang"

$cmd.CommandText = "SELECT Nik, Name, Plant, Department FROM Users WHERE Role = 'karyawan' ORDER BY Plant, Name"
$reader = $cmd.ExecuteReader()
Write-Host "`n=== DAFTAR NAMA & NPK KARYAWAN ==="
$no = 1
while ($reader.Read()) {
    Write-Host ("$no. [" + $reader[0] + "] " + $reader[1] + " (" + $reader[2] + ")")
    $no++
}
$reader.Close()

$cmd.CommandText = "SELECT COUNT(DISTINCT UserNpk), COUNT(DISTINCT UserName) FROM OvertimeRequests"
$reader = $cmd.ExecuteReader()
if ($reader.Read()) {
    Write-Host "`n=== DATA LEMBUR KARYAWAN ==="
    Write-Host "Karyawan unik yang memiliki record lembur: $($reader[0]) NPK / $($reader[1]) Nama"
}
$reader.Close()

$conn.Close()
