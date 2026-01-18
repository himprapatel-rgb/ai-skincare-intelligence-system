# Database Setup & Integration Guide

## Quick Start Database Setup

### Prerequisites
- PostgreSQL 14+
- pgAdmin or psql CLI
- Docker & Docker Compose (recommended)
- Node.js 18+ or Python 3.9+ (for migration tools)
- Git

---

## Part 1: Local Development Setup

### Option 1: Docker Setup (Recommended)

#### Step 1: Create docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: skincare_postgres
    environment:
      POSTGRES_USER: ${DB_USER:-skincare_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secure_password_123}
      POSTGRES_DB: ${DB_NAME:-skincare_db}
      POSTGRES_INITDB_ARGS: "-c shared_buffers=256MB -c max_connections=200"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql/init-db.sql:/docker-entrypoint-initdb.d/01-init.sql
      - ./sql/schema.sql:/docker-entrypoint-initdb.d/02-schema.sql
      - ./sql/seed-data.sql:/docker-entrypoint-initdb.d/03-seed.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-skincare_user}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - skincare_network

  redis:
    image: redis:7-alpine
    container_name: skincare_redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-redis_password_123}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - skincare_network

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: skincare_pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@skincare.local}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin123}
    ports:
      - "5050:80"
    depends_on:
      - postgres
    networks:
      - skincare_network

volumes:
  postgres_data:
  redis_data:

networks:
  skincare_network:
    driver: bridge
```

#### Step 2: Create .env file
```bash
# .env
DB_HOST=localhost
DB_PORT=5432
DB_USER=skincare_user
DB_PASSWORD=secure_password_123
DB_NAME=skincare_db

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_123

PGADMIN_EMAIL=admin@skincare.local
PGADMIN_PASSWORD=admin123

NODE_ENV=development
```

#### Step 3: Start Services
```bash
# Build and start services
docker-compose up -d

# Check services status
docker-compose ps

# View logs
docker-compose logs -f postgres

# Access pgAdmin
# Open browser: http://localhost:5050
# Login with PGADMIN_EMAIL/PASSWORD
```

#### Step 4: Connect to Database
```bash
# Via psql
psql -h localhost -U skincare_user -d skincare_db

# Via Docker
docker exec -it skincare_postgres psql -U skincare_user -d skincare_db

# Via pgAdmin
# URL: http://localhost:5050
# Right-click Servers → Register → Server
# Host: postgres
# Port: 5432
# Username: skincare_user
# Password: secure_password_123
```

---

### Option 2: Manual PostgreSQL Installation

#### macOS (Homebrew)
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database
createdb -U postgres skincare_db

# Connect
psql -U postgres -d skincare_db
```

#### Ubuntu/Debian
```bash
# Update package list
sudo apt-get update

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql

# Switch to postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE skincare_db;
CREATE USER skincare_user WITH PASSWORD 'secure_password_123';
ALTER ROLE skincare_user SET client_encoding TO 'utf8';
ALTER ROLE skincare_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE skincare_user SET default_transaction_deferrable TO on;
ALTER ROLE skincare_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE skincare_db TO skincare_user;
\q
```

#### Windows
```bash
# Download PostgreSQL installer from https://www.postgresql.org/download/windows/
# Run installer, choose installation directory
# Remember the postgres password you set
# Open Command Prompt as Administrator

# Create database
createdb -U postgres skincare_db

# Connect
psql -U postgres -d skincare_db
```

---

## Part 2: Database Schema Creation

### Step 1: Create Schema File (sql/schema.sql)

Create file with all table definitions:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_image_url TEXT,
    bio TEXT,
    date_of_birth DATE,
    gender VARCHAR(50),
    country VARCHAR(100),
    phone_number VARCHAR(20),
    auth_provider VARCHAR(50) DEFAULT 'email',
    auth_provider_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    account_status VARCHAR(50) DEFAULT 'active',
    privacy_setting VARCHAR(50) DEFAULT 'private',
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_account_status ON users(account_status);

-- User Profiles Table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    skin_type VARCHAR(50),
    skin_tone VARCHAR(50),
    skin_age_category VARCHAR(50),
    allergies TEXT[],
    sensitivities TEXT[],
    skincare_goals TEXT[],
    dermatological_conditions TEXT[],
    medications_affecting_skin TEXT[],
    budget_range VARCHAR(50) DEFAULT 'mid_range',
    preferred_brands TEXT[],
    avoids_ingredients TEXT[],
    prefers_natural BOOLEAN DEFAULT FALSE,
    vegan_preference BOOLEAN DEFAULT FALSE,
    cruelty_free_preference BOOLEAN DEFAULT FALSE,
    last_analysis_date DATE,
    analysis_frequency INT DEFAULT 30,
    routine_type VARCHAR(50) DEFAULT 'moderate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_skin_type ON user_profiles(skin_type);

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    product_type VARCHAR(100),
    price DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    size_ml DECIMAL(7, 2),
    stock_quantity INT DEFAULT 0,
    image_url TEXT,
    rating DECIMAL(3, 2) DEFAULT 0,
    review_count INT DEFAULT 0,
    suitable_for_skin_types TEXT[],
    benefits TEXT[],
    fragrance_free BOOLEAN DEFAULT FALSE,
    hypoallergenic BOOLEAN DEFAULT FALSE,
    dermatologist_tested BOOLEAN DEFAULT FALSE,
    cruelty_free BOOLEAN DEFAULT FALSE,
    vegan BOOLEAN DEFAULT FALSE,
    sunscreen_spf INT,
    key_ingredients TEXT[],
    usage_instructions TEXT,
    product_link TEXT,
    source VARCHAR(50) DEFAULT 'manual',
    source_id VARCHAR(255),
    availability VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_rating ON products(rating DESC);
CREATE INDEX idx_products_name_trgm ON products USING GIN (product_name gin_trgm_ops);

-- Ingredients Table
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_name VARCHAR(255) UNIQUE NOT NULL,
    inci_name VARCHAR(255),
    common_names TEXT[],
    description TEXT,
    benefits TEXT[],
    concerns_treats TEXT[],
    irritant BOOLEAN DEFAULT FALSE,
    comedogenic_rating INT,
    hypoallergenic BOOLEAN DEFAULT FALSE,
    natural BOOLEAN DEFAULT FALSE,
    common_allergens TEXT[],
    contraindications TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingredients_name ON ingredients(ingredient_name);
CREATE INDEX idx_ingredients_natural ON ingredients(natural);

-- Product Ingredients Junction Table
CREATE TABLE product_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL,
    ingredient_id UUID NOT NULL,
    percentage DECIMAL(5, 2),
    position INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
    UNIQUE(product_id, ingredient_id)
);

CREATE INDEX idx_product_ingredients_product_id ON product_ingredients(product_id);

-- Analysis Results Table
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'processing',
    confidence_score DECIMAL(5, 2),
    detected_skin_type VARCHAR(100),
    detected_skin_tone VARCHAR(100),
    detected_concerns TEXT[],
    severity_level VARCHAR(50) DEFAULT 'mild',
    ai_model_version VARCHAR(50),
    processing_time_ms INT,
    metadata JSONB DEFAULT '{}',
    analysis_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX idx_analysis_results_date ON analysis_results(analysis_date DESC);

-- Recommended Products Table
CREATE TABLE recommended_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_result_id UUID NOT NULL,
    product_id UUID NOT NULL,
    recommendation_rank INT NOT NULL,
    match_score DECIMAL(5, 2),
    reason_codes TEXT[],
    matches_skin_type BOOLEAN DEFAULT FALSE,
    addresses_concerns BOOLEAN DEFAULT FALSE,
    budget_compatible BOOLEAN DEFAULT FALSE,
    ingredient_compatibility DECIMAL(5, 2),
    user_feedback VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_result_id) REFERENCES analysis_results(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_recommended_products_analysis ON recommended_products(analysis_result_id);

-- Saved Routines Table
CREATE TABLE saved_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    routine_name VARCHAR(255) NOT NULL,
    description TEXT,
    routine_type VARCHAR(50) NOT NULL,
    skin_type_target VARCHAR(100),
    concerns_target TEXT[],
    duration_minutes INT,
    is_public BOOLEAN DEFAULT FALSE,
    created_from_analysis_id UUID,
    copies_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_from_analysis_id) REFERENCES analysis_results(id) ON DELETE SET NULL
);

CREATE INDEX idx_saved_routines_user_id ON saved_routines(user_id);

-- Routine Products Junction Table
CREATE TABLE routine_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_id UUID NOT NULL,
    product_id UUID NOT NULL,
    step_order INT NOT NULL,
    quantity_ml DECIMAL(7, 2),
    frequency VARCHAR(50),
    application_method VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (routine_id) REFERENCES saved_routines(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(routine_id, product_id)
);

-- Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    skin_type_reviewed VARCHAR(100),
    skin_concerns_at_review TEXT[],
    duration_used_days INT,
    would_repurchase BOOLEAN,
    value_for_money VARCHAR(50),
    effectiveness_rating INT,
    fragrance_rating INT,
    texture_rating INT,
    verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    unhelpful_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX idx_reviews_status ON reviews(status);

-- Progress Photos Table
CREATE TABLE progress_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    photo_url TEXT NOT NULL,
    photo_date DATE NOT NULL,
    angle VARCHAR(50) DEFAULT 'front',
    skin_condition_notes TEXT,
    routine_at_time TEXT,
    mood_rating INT CHECK (mood_rating >= 1 AND mood_rating <= 5),
    environmental_factors TEXT,
    visible_improvements TEXT[],
    areas_of_concern TEXT[],
    is_before_photo BOOLEAN DEFAULT FALSE,
    matching_after_photo_id UUID,
    visibility VARCHAR(50) DEFAULT 'private',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (matching_after_photo_id) REFERENCES progress_photos(id) ON DELETE SET NULL
);

CREATE INDEX idx_progress_photos_user_id ON progress_photos(user_id);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    delivery_method VARCHAR(50) DEFAULT 'in_app',
    scheduled_time TIMESTAMP,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Audit Log Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- System Settings Table
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);
```

### Step 2: Execute Schema
```bash
# Via Docker
docker exec -i skincare_postgres psql -U skincare_user -d skincare_db < sql/schema.sql

# Via psql (local)
psql -U skincare_user -d skincare_db -f sql/schema.sql

# Via pgAdmin
# 1. Open pgAdmin
# 2. Right-click skincare_db → Query Tool
# 3. Open sql/schema.sql
# 4. Run
```

---

## Part 3: Data Import & Seeding

### Step 1: Prepare Seed Data (sql/seed-data.sql)

```sql
-- Seed Ingredients
INSERT INTO ingredients (ingredient_name, inci_name, benefits, hypoallergenic, natural) VALUES
('Retinol', 'Retinol', ARRAY['Anti-aging', 'Collagen boost'], FALSE, FALSE),
('Hyaluronic Acid', 'Sodium Hyaluronate', ARRAY['Hydration', 'Plumping'], TRUE, FALSE),
('Salicylic Acid', 'Salicylic Acid', ARRAY['Exfoliation', 'Acne fighting'], FALSE, FALSE),
('Niacinamide', 'Niacinamide', ARRAY['Pore refinement', 'Oil control'], TRUE, FALSE),
('Vitamin C', 'Ascorbic Acid', ARRAY['Brightening', 'Antioxidant'], FALSE, FALSE),
('Aloe Vera', 'Aloe Barbadensis Leaf Extract', ARRAY['Soothing', 'Hydrating'], TRUE, TRUE),
('Green Tea Extract', 'Camellia Sinensis Leaf Extract', ARRAY['Antioxidant', 'Soothing'], TRUE, TRUE),
('Glycerin', 'Glycerin', ARRAY['Humectant', 'Hydration'], TRUE, FALSE),
('Peptides', 'Hydrolyzed Collagen', ARRAY['Firming', 'Anti-aging'], TRUE, FALSE),
('Azelaic Acid', 'Azelaic Acid', ARRAY['Anti-bacterial', 'Brightening'], FALSE, FALSE)
ON CONFLICT (ingredient_name) DO NOTHING;

-- Seed Products
INSERT INTO products (
    product_name, brand, description, category, price, 
    suitable_for_skin_types, benefits, key_ingredients, rating
) VALUES
('Gentle Cleanser Pro', 'CeraVe', 'Mild foam cleanser with ceramides', 'cleanser', 
 12.99, ARRAY['oily', 'combination'], ARRAY['Gentle', 'Effective'], 
 ARRAY['Hyaluronic Acid', 'Ceramides'], 4.7),
('Hydrating Moisturizer', 'Neutrogena', 'Daily hydrating cream', 'moisturizer', 
 9.99, ARRAY['dry', 'sensitive'], ARRAY['Hydrating', 'Soothing'], 
 ARRAY['Hyaluronic Acid', 'Glycerin'], 4.5),
('Anti-Acne Serum', 'The Ordinary', 'Salicylic acid treatment', 'serum', 
 5.90, ARRAY['oily', 'acne-prone'], ARRAY['Acne-fighting', 'Exfoliating'], 
 ARRAY['Salicylic Acid'], 4.6),
('Retinol Night Cream', 'Estée Lauder', 'Premium anti-aging cream', 'moisturizer', 
 68.00, ARRAY['mature', 'all'], ARRAY['Anti-aging', 'Firming'], 
 ARRAY['Retinol', 'Peptides'], 4.8),
('Vitamin C Brightening', 'Timeless', 'Brightening serum', 'serum', 
 6.95, ARRAY['dull', 'all'], ARRAY['Brightening', 'Antioxidant'], 
 ARRAY['Vitamin C'], 4.4),
('Sunscreen SPF 50', 'La Roche-Posay', 'Broad spectrum protection', 'sunscreen', 
 14.99, ARRAY['all'], ARRAY['UV protection', 'Lightweight'], 
 ARRAY['Zinc Oxide', 'Titanium Dioxide'], 4.7),
('Green Tea Toner', 'Purito', 'Refreshing toner', 'toner', 
 8.50, ARRAY['oily', 'combination'], ARRAY['Balancing', 'Antioxidant'], 
 ARRAY['Green Tea Extract'], 4.5),
('Azelaic Acid Suspension', 'The Ordinary', 'Brightening treatment', 'serum', 
 14.20, ARRAY['hyperpigmentation', 'rosacea'], ARRAY['Brightening', 'Calming'], 
 ARRAY['Azelaic Acid'], 4.4)
ON CONFLICT DO NOTHING;

-- Link products with ingredients
INSERT INTO product_ingredients (product_id, ingredient_id, percentage, position)
SELECT p.id, i.id, 5.0, 1
FROM products p, ingredients i
WHERE p.product_name = 'Gentle Cleanser Pro' AND i.ingredient_name = 'Hyaluronic Acid'
ON CONFLICT DO NOTHING;

-- Create admin user
INSERT INTO users (email, username, password_hash, first_name, last_name, email_verified, account_status)
VALUES ('admin@skincare.app', 'admin', '$2b$10$...', 'Admin', 'User', TRUE, 'active')
ON CONFLICT (email) DO NOTHING;

-- Create test users
INSERT INTO users (email, username, password_hash, first_name, last_name, email_verified, account_status)
VALUES 
('test@skincare.app', 'testuser', '$2b$10$...', 'Test', 'User', TRUE, 'active'),
('demo@skincare.app', 'demouser', '$2b$10$...', 'Demo', 'User', TRUE, 'active')
ON CONFLICT (email) DO NOTHING;

-- Create sample user profiles
INSERT INTO user_profiles (user_id, skin_type, skin_tone, skincare_goals, budget_range)
SELECT u.id, 'oily', 'light', ARRAY['Clear skin', 'Reduce acne'], 'mid_range'
FROM users u WHERE u.email = 'test@skincare.app'
ON CONFLICT DO NOTHING;
```

### Step 2: Execute Seed Data
```bash
# Via Docker
docker exec -i skincare_postgres psql -U skincare_user -d skincare_db < sql/seed-data.sql

# Verify data
docker exec -it skincare_postgres psql -U skincare_user -d skincare_db
# Then run: SELECT COUNT(*) FROM products; SELECT COUNT(*) FROM ingredients;
```

---

## Part 4: Production Database Configuration

### Step 1: Environment Variables for Production

Create `.env.production`:
```bash
# Database (AWS RDS Example)
DB_HOST=skincare-prod.123456789.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=skincare_admin
DB_PASSWORD=super_secure_password_min_20_chars
DB_NAME=skincare_production
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false

# Connection Pool
DB_POOL_MAX=30
DB_POOL_MIN=5
DB_POOL_IDLE_TIMEOUT=30000

# Redis (Managed by AWS ElastiCache)
REDIS_HOST=skincare-redis.abc123.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_password
REDIS_SSL=true

# Backup Settings
BACKUP_RETENTION_DAYS=30
BACKUP_SCHEDULE="0 2 * * *" # 2 AM daily

# Monitoring
DATADOG_API_KEY=xxx
NEW_RELIC_LICENSE_KEY=xxx
SENTRY_DSN=xxx
```

### Step 2: Connection String Format
```javascript
// Node.js with pg
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  max: parseInt(process.env.DB_POOL_MAX) || 20,
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false,
  statement_timeout: 30000,
  query_timeout: 30000
});

module.exports = pool;
```

### Step 3: AWS RDS Setup (if using cloud database)

```bash
# Install AWS CLI
# https://aws.amazon.com/cli/

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier skincare-prod-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --allocated-storage 100 \
  --storage-type gp3 \
  --master-username skincare_admin \
  --master-user-password 'your_secure_password' \
  --db-name skincare_production \
  --backup-retention-period 30 \
  --multi-az \
  --storage-encrypted \
  --region us-east-1

# Wait for RDS to be available (5-10 minutes)
aws rds wait db-instance-available --db-instance-identifier skincare-prod-db

# Get endpoint
aws rds describe-db-instances --db-instance-identifier skincare-prod-db \
  --query 'DBInstances[0].Endpoint.Address' --output text
```

---

## Part 5: Monitoring & Maintenance

### Step 1: Database Health Checks

```sql
-- Check database size
SELECT 
    datname AS database,
    pg_size_pretty(pg_database_size(datname)) AS size
FROM pg_database
WHERE datname = 'skincare_db';

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check active connections
SELECT 
    datname,
    count(*) AS connection_count
FROM pg_stat_activity
GROUP BY datname;

-- Check slow queries
SELECT 
    query,
    calls,
    mean_exec_time,
    total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Step 2: Automated Backup Script

Create `backup.sh`:
```bash
#!/bin/bash

BACKUP_DIR="/backups/postgres"
DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-skincare_user}
DB_NAME=${DB_NAME:-skincare_db}
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Create backup
PGPASSWORD=${DB_PASSWORD} pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | \
gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "[$(date)] Backup successful: backup_$DATE.sql.gz" >> $BACKUP_DIR/backup.log
    
    # Upload to S3
    aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz \
        s3://skincare-backups/postgres/
else
    echo "[$(date)] Backup FAILED!" >> $BACKUP_DIR/backup.log
    exit 1
fi

# Delete old backups (keep 30 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
```

### Step 3: Set as Cron Job
```bash
# Add to crontab (run daily at 2 AM)
0 2 * * * /opt/scripts/backup.sh

# Edit crontab
crontab -e

# View crontab
crontab -l
```

### Step 4: Create Monitoring Dashboard

```sql
-- Create monitoring view
CREATE OR REPLACE VIEW v_database_health AS
SELECT 
    'Database Size' AS metric,
    pg_size_pretty(pg_database_size('skincare_db')) AS value,
    now() AS checked_at
UNION ALL
SELECT 
    'Active Connections',
    count(*) || ' connections',
    now()
FROM pg_stat_activity
WHERE datname = 'skincare_db'
UNION ALL
SELECT 
    'Cache Hit Ratio',
    round(sum(heap_blks_hit)::numeric / 
    (sum(heap_blks_hit) + sum(heap_blks_read)) * 100, 2) || '%',
    now()
FROM pg_statio_user_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
```

---

## Part 6: Integration with Application

### Node.js Integration

```javascript
// db/connection.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  max: parseInt(process.env.DB_POOL_MAX) || 20,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
```

```javascript
// services/userService.js
const pool = require('../db/connection');

class UserService {
  async createUser(userData) {
    const query = `
      INSERT INTO users (email, username, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, username, created_at
    `;
    
    try {
      const result = await pool.query(query, [
        userData.email,
        userData.username,
        userData.passwordHash,
        userData.firstName,
        userData.lastName
      ]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Email or username already exists');
      }
      throw error;
    }
  }

  async getUserById(userId) {
    const query = `
      SELECT u.*, up.skin_type, up.allergies
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1 AND u.deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }
}

module.exports = new UserService();
```

### Python Integration

```python
# db/connection.py
import psycopg2
from psycopg2.pool import SimpleConnectionPool
import os

class DatabaseConnection:
    def __init__(self):
        self.connection_pool = SimpleConnectionPool(
            1,
            20,
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            database=os.getenv('DB_NAME', 'skincare_db'),
            user=os.getenv('DB_USER', 'skincare_user'),
            password=os.getenv('DB_PASSWORD', 'password'),
            sslmode='require' if os.getenv('DB_SSL') == 'true' else 'disable'
        )
    
    def get_connection(self):
        return self.connection_pool.getconn()
    
    def release_connection(self, conn):
        self.connection_pool.putconn(conn)

db = DatabaseConnection()
```

```python
# services/user_service.py
from db.connection import db
import json

class UserService:
    @staticmethod
    def create_user(user_data):
        conn = db.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO users 
                (email, username, password_hash, first_name, last_name)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, email, username, created_at
            """, (
                user_data['email'],
                user_data['username'],
                user_data['password_hash'],
                user_data.get('first_name'),
                user_data.get('last_name')
            ))
            
            result = cursor.fetchone()
            conn.commit()
            return result
            
        except psycopg2.IntegrityError:
            conn.rollback()
            raise Exception("Email or username already exists")
        finally:
            cursor.close()
            db.release_connection(conn)
```

---

## Part 7: Troubleshooting

### Common Issues & Solutions

#### Issue 1: Connection Refused
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS
docker ps | grep postgres  # Docker

# Check port
netstat -tuln | grep 5432
sudo lsof -i :5432
```

#### Issue 2: "Database does not exist"
```bash
# List databases
psql -U postgres -l

# Create database
createdb -U postgres skincare_db
```

#### Issue 3: "Permission denied"
```bash
# Grant permissions
psql -U postgres -d skincare_db
GRANT ALL PRIVILEGES ON DATABASE skincare_db TO skincare_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO skincare_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO skincare_user;
```

#### Issue 4: "Connection pool exhausted"
```sql
-- Check active connections
SELECT * FROM pg_stat_activity WHERE datname = 'skincare_db';

-- Terminate idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE datname = 'skincare_db' AND state = 'idle';
```

---

## Quick Reference Commands

```bash
# Docker commands
docker-compose up -d                    # Start services
docker-compose down                     # Stop services
docker-compose logs -f postgres         # View logs
docker-compose exec postgres psql -U skincare_user -d skincare_db

# psql commands
\dt                                     # List tables
\d+ users                              # Describe table
SELECT * FROM users LIMIT 5;           # Query data
\df                                    # List functions
\h                                     # SQL help
\q                                     # Quit

# Backup/Restore
pg_dump -U skincare_user skincare_db > backup.sql
psql -U skincare_user skincare_db < backup.sql
```

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Status**: Production Ready
