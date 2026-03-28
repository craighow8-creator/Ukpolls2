@echo off
title Politiscope Deploy Builder
color 0A

echo.
echo  =======================================
echo   POLITISCOPE - Build for GitHub Pages
echo  =======================================
echo.

:: Check we're in the right folder
if not exist "package.json" (
    echo  ERROR: Run this from inside the ps2 folder!
    pause
    exit /b 1
)

:: Install dependencies if node_modules missing
if not exist "node_modules" (
    echo  Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo  ERROR: npm install failed
        pause
        exit /b 1
    )
)

echo  Building...
call npm run build
if errorlevel 1 (
    echo.
    echo  ERROR: Build failed. Check errors above.
    pause
    exit /b 1
)

echo.
echo  Copying public files to dist...
if exist "public\sw.js"              copy /Y "public\sw.js"              "dist\sw.js"              >nul
if exist "public\manifest.json"      copy /Y "public\manifest.json"      "dist\manifest.json"      >nul
if exist "public\favicon.svg"        copy /Y "public\favicon.svg"        "dist\favicon.svg"        >nul
if exist "public\icons"              xcopy /E /I /Y "public\icons"       "dist\icons"              >nul
if exist "public\portraits"          xcopy /E /I /Y "public\portraits"   "dist\portraits"          >nul

:: Copy the correct app icons (Union Jack on dark navy)
echo  Copying app icons...
if exist "public\icons\icon-192.png" echo   icon-192.png OK
if exist "public\icons\icon-512.png" echo   icon-512.png OK

echo.
echo  =======================================
echo   BUILD COMPLETE
echo  =======================================
echo.
echo  Files ready in dist\ folder.
echo.
echo  Upload to GitHub (drag and drop the contents of dist\):
echo.
echo    dist\index.html
echo    dist\admin.html
echo    dist\manifest.json
echo    dist\sw.js
echo    dist\favicon.svg
echo    dist\assets\       (whole folder)
echo    dist\icons\        (whole folder)
echo    dist\portraits\    (whole folder)
echo.
echo  Go to: github.com/craighow8-creator/Ukpolls2
echo.
echo  Opening dist folder now...
explorer dist

pause
