@echo off
REM Create/fix himanshu@test.com with password Test1234!
REM Set DATABASE_URL from Railway (PostgreSQL) first.
cd /d "%~dp0.."
python scripts\verify_test_user.py
pause
