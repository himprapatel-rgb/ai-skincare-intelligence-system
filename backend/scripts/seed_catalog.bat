@echo off
REM Seed product catalog from Open Beauty Facts
REM Set PRODUCT_DATABASE_URL or DATABASE_URL from Railway dashboard first
REM Example: set PRODUCT_DATABASE_URL=postgresql://user:pass@host:5432/dbname

echo Seeding product catalog...
python scripts/import_obf_catalog.py --source api --limit 1000
pause
