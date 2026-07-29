@echo off
echo ========================================
echo    Sekkyaku - Build Desktop App (.exe)
echo ========================================
echo.

echo [1/3] Building Frontend...
cd client
call npm run build
cd ..
echo Frontend build selesai!
echo.

echo [2/3] Packaging Electron App...
call npx electron-packager . Sekkyaku --platform=win32 --arch=x64 --out=release --overwrite
echo.

echo ========================================
echo    Build selesai!
echo    Lokasi: release\Sekkyaku-win32-x64\
echo    Jalankan: Sekkyaku.exe
echo ========================================
pause
