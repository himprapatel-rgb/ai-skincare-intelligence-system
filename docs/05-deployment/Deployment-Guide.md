# Deployment & Operations Guide
## AI Skincare Intelligence System

**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Active

---

## 1. Deployment Overview

### 1.1 Architecture
```
                    [Users]
                       |
                  [CloudFlare CDN]
                       |
              [Load Balancer/Nginx]
              /        |        \
    [Frontend]    [API Server]   [ML Service]
         |            |              |
         +---------[PostgreSQL]------+
                      |
                   [Redis]
```

### 1.2 Environments
| Environment | URL | Branch | Auto-Deploy |
|-------------|-----|--------|-------------|
| Development | dev.skincare.app | develop | Yes |
| Staging | staging.skincare.app | staging | Yes |
| Production | app.skincare.app | main | Manual |

---

## 2. Prerequisites

### 2.1 Required Tools
```bash
# Check versions
node -v          # v18.x+
npm -v           # v9.x+
python --version # 3.10+
docker -v        # 24.x+
docker-compose -v
git --version
```

### 2.2 Required Accounts
- GitHub (source control)
- Railway / AWS / Azure (hosting)
- SendGrid (email service)
- CloudFlare (CDN, optional)

---

## 3. Local Development Setup

### 3.1 Clone Repository
```bash
git clone https://github.com/himprapatel-rgb/ai-skincare-intelligence-system.git
cd ai-skincare-intelligence-system
```

### 3.2 Environment Configuration
```bash
# Copy environment templates
cp .env.example .env
cp frontend/.env.example frontend/.env
cp api/.env.example api/.env
cp ml-service/.env.example ml-service/.env
```

### 3.3 Install Dependencies
```bash
# Frontend
cd frontend && npm install

# API
cd ../api && npm install

# ML Service
cd ../ml-service && pip install -r requirements.txt
```

### 3.4 Database Setup
```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres redis

# Run migrations
cd api && npm run db:migrate
npm run db:seed
```

### 3.5 Start Development Servers
```bash
# Terminal 1 - Frontend
cd frontend && npm start

# Terminal 2 - API
cd api && npm run dev

# Terminal 3 - ML Service
cd ml-service && python main.py
```

---

## 4. Docker Deployment

### 4.1 Docker Compose (Local)
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://api:4000

  api:
    build: ./api
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/skincare
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  ml-service:
    build: ./ml-service
    ports:
      - "5000:5000"

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: skincare
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 4.2 Build and Run
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 5. Railway Deployment

### 5.1 Project Setup
1. Connect GitHub repository to Railway
2. Create new project from repo
3. Add services: Frontend, API, ML Service
4. Add PostgreSQL and Redis plugins

### 5.2 Environment Variables
```bash
# API Service
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<generate-secure-secret>
NODE_ENV=production
ML_SERVICE_URL=${{ml-service.RAILWAY_PRIVATE_DOMAIN}}

# Frontend Service
REACT_APP_API_URL=${{api.RAILWAY_PUBLIC_DOMAIN}}

# ML Service
MODEL_PATH=/app/models
```

### 5.3 Build Commands
```bash
# Frontend
build: npm run build
start: npx serve -s build

# API
build: npm run build
start: npm start

# ML Service
build: pip install -r requirements.txt
start: gunicorn main:app
```

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: railwayapp/railway-action@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: staging

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      - uses: railwayapp/railway-action@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: production
```

---

## 7. Monitoring & Logging

### 7.1 Health Checks
```bash
# API health endpoint
GET /api/health
Response: { "status": "ok", "version": "1.0.0", "uptime": 123456 }

# ML Service health
GET /health
Response: { "status": "ok", "model_loaded": true }
```

### 7.2 Logging Configuration
```javascript
// api/src/config/logger.js
const winston = require('winston');

module.exports = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});
```

### 7.3 Metrics to Monitor
- Response times (p50, p95, p99)
- Error rates
- Database connections
- ML model inference time
- Memory/CPU usage

---

## 8. Backup & Recovery

### 8.1 Database Backups
```bash
# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Automated backups (Railway handles this)
# Or configure cron job for custom backup
```

### 8.2 Recovery Procedure
```bash
# Restore from backup
psql $DATABASE_URL < backup_20260114.sql

# Verify data integrity
cd api && npm run db:verify
```

---

## 9. Troubleshooting

### 9.1 Common Issues

| Issue | Solution |
|-------|----------|
| DB connection failed | Check DATABASE_URL, verify PostgreSQL is running |
| ML model timeout | Increase timeout, check model file size |
| CORS errors | Verify allowed origins in API config |
| Auth token invalid | Check JWT_SECRET matches across services |

### 9.2 Debug Commands
```bash
# Check service status
docker-compose ps

# View recent logs
docker-compose logs --tail=100 api

# Connect to database
docker-compose exec postgres psql -U user -d skincare

# Check Redis
docker-compose exec redis redis-cli ping
```

---

## 10. Security Checklist

- [ ] SSL/TLS enabled for all endpoints
- [ ] Environment variables secured (not in code)
- [ ] Database credentials rotated quarterly
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Regular dependency updates
- [ ] Backup encryption enabled

---

**End of Document**
