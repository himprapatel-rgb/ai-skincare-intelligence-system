@echo off
REM Promote a user to admin - sets is_admin=true in the database
REM
REM 1. Set DATABASE_URL from Railway dashboard (PostgreSQL -> Variables -> Copy URL)
REM 2. Run: promote_admin.bat you@example.com
REM
REM Example:
REM   set DATABASE_URL=postgresql://user:pass@host.railway.app:port/railway
REM   promote_admin.bat you@gmail.com

if "%1"=="" (
  echo Usage: promote_admin.bat you@example.com
  echo.
  echo Set DATABASE_URL first (from Railway dashboard).
  exit /b 1
)

cd /d "%~dp0.."
python scripts\promote_admin.py %*
