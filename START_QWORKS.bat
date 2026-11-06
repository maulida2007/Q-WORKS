@echo off
TITLE Q-WORKS - Quick Starter (ASP.NET Core MVC)
COLOR 0A
CLS

echo ========================================================
echo        🚀 MEMULAI Q-WORKS DASHBOARD SYSTEM 🚀
echo             ASP.NET Core MVC (.NET 8)
echo ========================================================
echo.

:: Pindah ke direktori script ini berada
cd /d "%~dp0"

:: Cek apakah .NET SDK terinstal
where dotnet >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] .NET SDK tidak ditemukan!
    echo Silakan install .NET 8 SDK terlebih dahulu dari https://dotnet.microsoft.com/
    pause
    exit /b %errorlevel%
)

echo [*] Membangun dan menjalankan Q-WORKS ASP.NET Core MVC Service...
echo [*] Server Port: http://localhost:5000
echo.

:: Jalankan server ASP.NET Core di jendela background
start "Q-WORKS Web Server (ASP.NET Core MVC)" cmd /k "dotnet run"

echo [*] Menunggu server siap...
timeout /t 3 /nobreak >nul

echo [*] Membuka browser ke http://localhost:5000 ...
start http://localhost:5000

echo.
echo ========================================================
echo  ✅ Q-WORKS Berhasil Dijalankan!
echo  - Web Application: http://localhost:5000
echo  - Arsitektur: ASP.NET Core MVC + C# + Razor Views
echo  - Database: SQLite (qworks.db) dengan Entity Framework Core
echo ========================================================
echo.
pause
