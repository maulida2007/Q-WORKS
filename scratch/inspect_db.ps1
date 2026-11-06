Add-Type -Path 'bin\Debug\net8.0\Microsoft.Data.Sqlite.dll'
$conn = New-Object Microsoft.Data.Sqlite.SqliteConnection('Data Source=qworks.db')
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = 'SELECT COUNT(*), COUNT(DISTINCT Plant), COUNT(DISTINCT ShiftName), COUNT(DISTINCT Month) FROM OvertimeRequests'
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    Write-Host "Count: $($reader[0]), Distinct Plants: $($reader[1]), Distinct Shifts: $($reader[2]), Distinct Months: $($reader[3])"
}
$reader.Close()

$cmd.CommandText = 'SELECT DISTINCT Plant, Department FROM OvertimeRequests'
$reader = $cmd.ExecuteReader()
Write-Host "`nPlants & Depts in DB:"
while ($reader.Read()) {
    Write-Host "Plant: '$($reader[0])', Dept: '$($reader[1])'"
}
$reader.Close()

$cmd.CommandText = 'SELECT DISTINCT ShiftName, ShiftId FROM OvertimeRequests'
$reader = $cmd.ExecuteReader()
Write-Host "`nShifts in DB:"
while ($reader.Read()) {
    Write-Host "ShiftName: '$($reader[0])', ShiftId: '$($reader[1])'"
}
$reader.Close()

$conn.Close()
