@echo off
echo Creating Chrome extension icons...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found. Creating placeholder icons manually...
    goto :create_placeholders
)

REM Try to create icons from logo
python create_icons.py
if errorlevel 1 (
    echo Icon generation failed. Creating placeholders...
    goto :create_placeholders
)

echo.
echo Icons created successfully!
goto :end

:create_placeholders
echo Creating placeholder icons...
echo You can replace these with your logo later.
echo.
echo To create proper icons:
echo 1. Copy frontend/public/logo.png to chrome-extension/icons/
echo 2. Resize to: 16x16, 48x48, 128x128
echo 3. Name them: icon16.png, icon48.png, icon128.png
echo.
echo Or use online tool: https://www.favicon-generator.org/

:end
pause







