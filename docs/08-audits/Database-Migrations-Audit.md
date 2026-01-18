# DATABASE MIGRATIONS AUDIT & ALEMBIC SETUP

**Created:** January 4, 2026, 8 PM GMT  
**Status:** READY FOR IMPLEMENTATION  
**Priority:** P1 - HIGH  
**Sprint:** Sprint 6 (Parallel with Frontend)

---

## Executive Summary

The project currently uses SQLAlchemy's `Base.metadata.create_all()` approach for database schema management, which is **unsafe for production** and **incompatible with migration tracking**. This document outlines the migration to **Alembic**, the industry-standard database migration tool, including:

1. ✅ Current state assessment
2. ✅ Missing migrations identification
3. ✅ Alembic setup guide
4. ✅ Migration creation & testing procedures
5. ✅ Production deployment checklist

---

## 🔍 Current State Assessment

### Problem: Using Base.metadata.create_all()

**Location:** `backend/app/main.py` (lines ~15-20)

```python
# UNSAFE - Don't use in production
Base.metadata.create_all(bind=engine)
```

**Issues:**
1. ❌ **No migration history** - Can't track schema changes over time
2. ❌ **Data loss risk** - Can't rollback failed deployments
3. ❌ **Team coordination** - Multiple developers can't work on schema simultaneously
4. ❌ **Production risk** - Can't test migrations before deploying
5. ❌ **Audit trail** - No record of who changed what and when

---

## 📋 Database Models Inventory

### Models With Migrations (✅ Complete)

| Model | File | Table Name | Migration | Status |
|-------|------|-----------|-----------|--------|
| User | `app/models/user.py` | users | ✅ Exists | Complete |
| Profile | `app/models/profile.py` | profiles | ✅ Exists | Complete |
| SkinScan | `app/models/scans.py` | skin_scans | ✅ Exists | Complete |
| Product | `app/models/products.py` | products | ✅ Exists | Complete |
| Routine | `app/models/routines.py` | routines | ✅ Exists | Complete |
| Consent | `app/models/consent.py` | consents | ✅ Exists | Complete |

### Models MISSING Migrations (❌ Critical)

| Model | File | Table Name | Status | Action |
|-------|------|-----------|--------|--------|
| IngredientReference | `app/models/ingredients.py` | ingredients_reference | ❌ MISSING | Create migration |
| IngredientSkinEffect | `app/models/ingredients.py` | ingredient_skin_effects | ❌ MISSING | Create migration |
| ProductSkinSuitability | `app/models/products.py` | product_skin_suitability | ❌ MISSING | Create migration |
| UserSkinOutcomes | `app/models/twin_models.py` | user_skin_outcomes | ❌ MISSING | Create migration |
| Experiment | `app/models/experiments.py` | experiments | ❌ MISSING | Create migration |

**Total:** 5 missing migrations (HIGH PRIORITY)

---

## 🛠️ ALEMBIC SETUP PROCEDURE

### Step 1: Initialize Alembic (if not already done)

```bash
cd backend

# Install Alembic
pip install alembic

# Initialize Alembic (creates alembic/ directory)
alembic init alembic
```

### Step 2: Configure alembic/env.py

**File:** `backend/alembic/env.py`

```python
from app.config import DATABASE_URL
from app.database import Base

# Configure SQLAlchemy URL
config.set_main_option('sqlalchemy.url', DATABASE_URL)

# Configure target metadata
target_metadata = Base.metadata
```

### Step 3: Configure alembic.ini

**File:** `backend/alembic.ini`

```ini
# Enable autogenerate
[alembic]
script_location = alembic
sqlalchemy.url = 

[loggers]
keys = root,sqlalchemy,alembic
```

---

## 📝 Creating Missing Migrations

### Migration 1: Create ingredients_reference table

**File:** `backend/alembic/versions/001_create_ingredients.py`

```bash
alembic revision --autogenerate -m "Create ingredients_reference table"
```

**Expected SQL:**

```sql
CREATE TABLE ingredients_reference (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    skin_type VARCHAR(50),
    concentration_ppm INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingredients_name ON ingredients_reference(name);
CREATE INDEX idx_ingredients_skin_type ON ingredients_reference(skin_type);
```

### Migration 2: Create ingredient_skin_effects table

```bash
alembic revision --autogenerate -m "Create ingredient_skin_effects table"
```

**Expected SQL:**

```sql
CREATE TABLE ingredient_skin_effects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID NOT NULL REFERENCES ingredients_reference(id),
    effect_type VARCHAR(100) NOT NULL,
    fitzpatrick_scale VARCHAR(10),
    efficacy_score DECIMAL(3,2),
    risk_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingredient_effects_ingredient ON ingredient_skin_effects(ingredient_id);
```

### Migration 3: Create product_skin_suitability table

```bash
alembic revision --autogenerate -m "Create product_skin_suitability table"
```

### Migration 4: Create user_skin_outcomes table

```bash
alembic revision --autogenerate -m "Create user_skin_outcomes table"
```

### Migration 5: Create experiments table

```bash
alembic revision --autogenerate -m "Create experiments table"
```

---

## ✅ Testing Migrations Locally

### Step 1: Set up local database

```bash
# Create local PostgreSQL database
createdb skincare_db_test

# Set DATABASE_URL to local
export DATABASE_URL="postgresql://user:password@localhost/skincare_db_test"
```

### Step 2: Run migrations

```bash
# Check current migration status
alembic current

# Run all pending migrations
alembic upgrade head

# Verify all tables created
psql skincare_db_test -c "\dt"
```

### Step 3: Test rollback

```bash
# Rollback one migration
alembic downgrade -1

# Verify table dropped
psql skincare_db_test -c "\dt"

# Re-apply migration
alembic upgrade head
```

### Step 4: Run application tests

```bash
# Run pytest with database
pytest tests/ -v --db=skincare_db_test
```

---

## 🚀 Production Deployment Checklist

- [ ] All migrations created and tested locally
- [ ] Migrations reviewed by team
- [ ] Backup of production database created
- [ ] Maintenance window scheduled (low-traffic time)
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Team on standby during deployment
- [ ] Database health check before/after migration
- [ ] Application tests pass on migrated schema
- [ ] Documentation updated

---

## 📊 Migration Deployment Process

### Pre-Deployment (1 hour before)

1. Notify team of maintenance window
2. Verify production database backup
3. Test migrations on staging environment
4. Prepare rollback plan

### Deployment (During maintenance window)

```bash
# On production server
cd backend

# Run migrations
alembic upgrade head

# Verify migration success
alembic current
psql $DATABASE_URL -c "SELECT COUNT(*) FROM alembic_version;"
```

### Post-Deployment (30 minutes after)

1. Run smoke tests
2. Monitor application logs for errors
3. Verify no migration rollbacks needed
4. Notify team deployment complete
5. Update deployment status doc

---

## 🔄 Ongoing Migration Workflow

### For Each Model Change:

1. **Modify model** in `app/models/*.py`
2. **Create migration:**
   ```bash
   alembic revision --autogenerate -m "Short description"
   ```
3. **Review migration** in `alembic/versions/`
4. **Test locally:**
   ```bash
   alembic upgrade head
   pytest tests/
   ```
5. **Commit and push:**
   ```bash
   git add alembic/versions/
   git commit -m "feat(db): Add new migration"
   git push
   ```
6. **Deploy to staging** - Railway auto-deploys
7. **Deploy to production** - Manual approval via Railway

---

## ⚠️ Migration Best Practices

### DO ✅

- Create one migration per model change
- Test migrations on local & staging first
- Use descriptive migration names
- Include data transformations in migrations
- Document any manual steps required
- Use transactions (default in Alembic)

### DON'T ❌

- Run `Base.metadata.create_all()` in production
- Skip migration testing
- Merge multiple changes into one migration
- Modify migrations after they're deployed
- Deploy migrations without backup
- Skip rollback testing

---

## 📈 Migration Timeline

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| Initialize Alembic | 30 min | Backend Lead | Pending |
| Create 5 missing migrations | 2 hours | Backend Lead | Pending |
| Test migrations locally | 1 hour | Backend Engineer | Pending |
| Test on staging | 30 min | QA | Pending |
| Deploy to production | 30 min | DevOps | Pending |
| **TOTAL** | **4 hours** | | |

---

## 🎯 Success Criteria

- ✅ All 5 missing migrations created
- ✅ Migrations tested locally (upgrade/downgrade)
- ✅ Migrations tested on staging environment
- ✅ Production deployment successful
- ✅ No data loss
- ✅ Application functional after migration
- ✅ Rollback plan verified
- ✅ Documentation updated

---

## 📚 References

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy ORM Tutorial](https://docs.sqlalchemy.org/)
- [Database Migration Best Practices](https://www.liquibase.org/)

---

## 📝 Notes

**Timeline:** Can be done in parallel with Sprint 6 frontend work. Recommend starting immediately and completing by end of week to prepare for production deployment.

**Owner:** Backend Lead + DevOps Engineer

**Next Steps:**
1. Initialize Alembic in backend directory
2. Create first migration (ingredients table)
3. Test on local database
4. Create remaining 4 migrations
5. Test full migration suite
6. Deploy to staging
7. Schedule production deployment

---

**Document Status:** READY FOR IMPLEMENTATION  
**Last Updated:** January 4, 2026  
**Next Review:** After first migration created
