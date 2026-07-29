@echo off
echo ========================================
echo    Sekkyaku - Build Desktop App
echo ========================================
echo.

echo [1/4] Building Frontend...
cd client
call npm run build
cd ..
echo Frontend build selesai!
echo.

echo [2/4] Installing Server Dependencies...
cd server
call npm install --production
cd ..
echo Server dependencies selesai!
echo.

echo [3/4] Generating Prisma Client...
cd server
call npx prisma generate
cd ..
echo Prisma client selesai!
echo.

echo [4/4] Building Electron App...
call npx electron-builder --win
echo.

echo ========================================
echo    Build selesai! 
echo    Cek folder: release\
echo ========================================
pause
