@echo off
echo ================================================================================
echo   AI Skincare Database Setup
echo ================================================================================
echo.
echo This will create all missing database tables on Railway...
echo.
pause

cd /d "%~dp0backend"

echo.
echo Step 1: Creating core user tables...
echo ================================================================================
railway run python -c "from app.database import Base, engine; from app.models.user import User, UserProfile, PolicyVersion, UserConsent; User.__table__.create(bind=engine, checkfirst=True); UserProfile.__table__.create(bind=engine, checkfirst=True); PolicyVersion.__table__.create(bind=engine, checkfirst=True); UserConsent.__table__.create(bind=engine, checkfirst=True); print('✅ Core tables created!')"

echo.
echo Step 2: Creating product and scan tables...
echo ================================================================================
railway run python -c "from app.database import Base, engine; from app.models.product_models import Product; from app.models.scan import Scan; from app.models.saved_routine import SavedRoutine; from app.models.progress_photo import ProgressPhoto; from app.models.routine_product import RoutineProduct; Product.__table__.create(bind=engine, checkfirst=True); Scan.__table__.create(bind=engine, checkfirst=True); SavedRoutine.__table__.create(bind=engine, checkfirst=True); ProgressPhoto.__table__.create(bind=engine, checkfirst=True); RoutineProduct.__table__.create(bind=engine, checkfirst=True); print('✅ Additional tables created!')"

echo.
echo Step 3: Verifying all tables exist...
echo ================================================================================
railway run python -c "from app.database import engine; from sqlalchemy import inspect; inspector = inspect(engine); tables = inspector.get_table_names(); print('📋 Database Tables:'); [print(f'  ✅ {t}') for t in sorted(tables)]; print(f'\n✅ SUCCESS! Total: {len(tables)} tables created')"

echo.
echo ================================================================================
echo   Setup Complete! 
echo ================================================================================
echo.
echo Your database is ready to use!
echo.
pause
