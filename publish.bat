@echo off
TITLE Q-WORKS - Production Publisher
COLOR 0B
CLS

echo ========================================================
echo        📦 PROSES PUBLISH PRODUKSI Q-WORKS 📦
echo             ASP.NET Core MVC (.NET 8)
echo ========================================================
echo.

cd /d "%~dp0"

where dotnet >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] .NET SDK tidak ditemukan!
    pause
    exit /b %errorlevel%
)

echo [1/2] Melakukan dotnet publish (Mode Release)...
dotnet publish -c Release -o ./publish_output
if %errorlevel% neq 0 (
    echo.
    echo [X] Gagal melakukan dotnet publish.
    pause
    exit /b %errorlevel%
)
echo [✔] Dotnet Publish berhasil! (Lokasi: ./publish_output)
echo.

echo ========================================================
echo  🎉 PUBLISH SELESAI & SIAP DIDEPLOY!
echo ========================================================
echo  - Output Server & Web: ./publish_output/
echo  - Jalankan dengan:     cd publish_output && dotnet Q-WORKS.dll
echo ========================================================
echo.

set /p OPEN_FOLDER="Apakah Anda ingin membuka folder hasil publish? (Y/N): "
if /i "%OPEN_FOLDER%"=="Y" (
    start explorer "%~dp0publish_output"
)

echo.
pause
