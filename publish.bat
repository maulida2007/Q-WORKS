@echo off
TITLE Q-WORKS - Production Publisher
COLOR 0B
CLS

echo ========================================================
echo        📦 PROSES PUBLISH & BUILD PRODUKSI Q-WORKS 📦
echo ========================================================
echo.

cd /d "%~dp0"

:: Step 1: Build Frontend (Vite)
echo [1/4] Membangun bundel produksi Frontend (Vite)...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [X] Gagal melakukan build frontend. Membatalkan proses publish.
    pause
    exit /b %errorlevel%
)
echo [✔] Build Frontend berhasil! (Lokasi: ./dist)
echo.

:: Step 2: Salin dist ke wwwroot (agar .NET dapat melayani static files)
echo [2/4] Mengopi hasil build dist/ ke folder wwwroot/ ...
if not exist "wwwroot\" mkdir "wwwroot\"
xcopy /E /Y /I "dist\*" "wwwroot\" >nul
echo [✔] File dist berhasil disalin ke wwwroot!
echo.

:: Step 3: Build & Publish .NET Backend (jika .NET SDK terinstal)
where dotnet >nul 2>nul
if %errorlevel% equ 0 (
    echo [3/4] Melakukan dotnet publish (Mode Release)...
    dotnet publish -c Release -o ./publish_output
    if %errorlevel% neq 0 (
        echo.
        echo [X] Gagal melakukan dotnet publish.
        pause
        exit /b %errorlevel%
    )
    echo [✔] Dotnet Publish berhasil! (Lokasi: ./publish_output)
) else (
    echo [i] Note: .NET SDK tidak ditemukan. Hasil build frontend dapat ditemukan di folder dist/ atau wwwroot/.
)

echo.
echo ========================================================
echo  🎉 PUBLISH SELESAI & SIAP DIDEPLOY!
echo ========================================================
echo  - Output Production Web:  ./dist/ & ./wwwroot/
if exist "publish_output\" (
echo  - Output Server .NET:     ./publish_output/
)
echo ========================================================
echo.

set /p OPEN_FOLDER="Apakah Anda ingin membuka folder hasil publish? (Y/N): "
if /i "%OPEN_FOLDER%"=="Y" (
    if exist "publish_output\" (
        start explorer "%~dp0publish_output"
    ) else (
        start explorer "%~dp0dist"
    )
)

echo.
pause
