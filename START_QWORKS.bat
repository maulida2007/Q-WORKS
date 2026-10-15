@echo off
TITLE Q-WORKS - Quick Starter
COLOR 0A
CLS

echo ========================================================
echo        🚀 MEMULAI Q-WORKS DASHBOARD SYSTEM 🚀
echo ========================================================
echo.

:: Pindah ke direktori script ini berada
cd /d "%~dp0"

:: Cek apakah folder node_modules ada
if not exist "node_modules\" (
    echo [!] Folder node_modules tidak ditemukan.
    echo [*] Menginstal dependensi NPM terlebih dahulu...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [X] Gagal menginstal dependensi NPM. Silakan periksa koneksi internet/Node.js Anda.
        pause
        exit /b %errorlevel%
    )
    echo [*] Instalasi NPM selesai!
    echo.
)

echo [1/2] Menjalankan Vite Development Server (Port 3000)...
start "Q-WORKS Frontend Server (Vite)" cmd /k "npm run dev"

:: Opsional: Cek jika .NET SDK terinstal untuk Backend (Port 5000)
where dotnet >nul 2>nul
if %errorlevel% equ 0 (
    if exist "Q-WORKS.csproj" (
        echo [2/2] Menjalankan .NET Backend Service (Port 5000)...
        start "Q-WORKS Backend API (.NET)" cmd /k "dotnet run"
    )
) else (
    echo [i] Note: .NET SDK tidak ditemukan, Backend API di-skip (hanya Frontend Vite).
)

echo.
echo [*] Menunggu server siap...
timeout /t 3 /nobreak >nul

echo [*] Membuka browser ke http://localhost:3000 ...
start http://localhost:3000

echo.
echo ========================================================
echo  ✅ Q-WORKS Berhasil Dijalankan!
echo  - Frontend: http://localhost:3000
echo  - Jendela command prompt server berjalan terpisah.
echo  - Anda dapat menutup jendela launcher ini kapan saja.
echo ========================================================
echo.
pause
