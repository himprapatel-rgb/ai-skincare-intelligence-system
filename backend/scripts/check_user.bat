@echo off
REM Check himanshu@test.com status in database
REM Set DATABASE_URL from Railway first.
cd /d "%~dp0.."
python scripts\check_user.py
pause
