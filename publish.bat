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

echo Pilih jenis publish:
echo [1] Self-Contained (Offline Penuh - Server TIDAK perlu install .NET 8) [Default]
echo [2] Framework-Dependent (Ukuran kecil - Server WAJIB terinstall .NET 8 Runtime)
set /p PUB_MODE="Pilihan Anda (1/2, default 1): "
if "%PUB_MODE%"=="" set PUB_MODE=1

echo.
if exist "%~dp0publish_output" (
    echo Membersihkan folder publish_output lama agar output bersih...
    rmdir /s /q "%~dp0publish_output"
)

if "%PUB_MODE%"=="2" (
    echo [1/2] Melakukan dotnet publish (Framework-Dependent Release)...
    dotnet publish -c Release -o ./publish_output
) else (
    echo [1/2] Melakukan dotnet publish (Self-Contained win-x64 Full Offline)...
    dotnet publish -c Release -r win-x64 --self-contained true -o ./publish_output
)
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
