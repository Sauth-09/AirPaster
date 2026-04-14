@echo off
setlocal enabledelayedexpansion

:: Check if .git exists, if not initialize
if not exist ".git" (
    echo [INFO] Initializing git repository...
    git init
)

:: Set remote origin
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Adding remote origin: https://github.com/Sauth-09/AirPaster.git
    git remote add origin https://github.com/Sauth-09/AirPaster.git
) else (
    echo [INFO] Updating remote origin URL...
    git remote set-url origin https://github.com/Sauth-09/AirPaster.git
)

:: Get commit message from user
set /p commit_msg="Enter commit message (Leave empty for 'Update'): "
if "!commit_msg!"=="" (
    set commit_msg=Update
)

:: Stage all changes
echo [INFO] Staging files...
git add .

:: Commit changes
echo [INFO] Committing changes...
git commit -m "!commit_msg!"

:: Ensure branch is main and push
echo [INFO] Pushing to main branch...
git branch -M main
git push -u origin main

if %errorlevel% neq 0 (
    echo [ERROR] Push failed. Please check your internet connection or GitHub permissions.
) else (
    echo [SUCCESS] Push completed successfully!
)

pause
