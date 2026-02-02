@echo off
REM Verify all web app database tables exist and show row counts.
REM Set DATABASE_URL from Railway (PostgreSQL -> Variables -> Copy)
REM Optional: PRODUCT_DATABASE_URL if using separate product DB

cd /d "%~dp0.."
if "%DATABASE_URL%"=="" (
  echo ERROR: Set DATABASE_URL
  echo Example: set DATABASE_URL=postgresql://user:pass@host:port/dbname
  exit /b 1
)
python scripts/verify_database_tables.py
exit /b %ERRORLEVEL%
