# Architecture Decisions Record (ADR)
## AI Skincare Intelligence System

**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Active

---

## ADR Index

| ID | Decision | Status | Date |
|----|----------|--------|------|
| ADR-001 | React.js for Frontend | Accepted | 2024-Q1 |
| ADR-002 | Node.js + Python Backend | Accepted | 2024-Q1 |
| ADR-003 | PostgreSQL as Primary Database | Accepted | 2024-Q1 |
| ADR-004 | JWT for Authentication | Accepted | 2024-Q1 |
| ADR-005 | TensorFlow for ML Model | Accepted | 2024-Q2 |
| ADR-006 | Railway for Deployment | Accepted | 2024-Q3 |
| ADR-007 | Redis for Caching | Accepted | 2024-Q4 |
| ADR-008 | Docker Containerization | Accepted | 2024-Q4 |

---

## ADR-001: React.js for Frontend

**Status:** Accepted  
**Date:** 2024-Q1  
**Decision Makers:** Tech Lead, Frontend Team

### Context
Need to select a frontend framework for building a responsive, component-based UI.

### Decision
Use React.js 18+ with functional components and hooks.

### Rationale
- Large ecosystem and community support
- Component reusability
- Virtual DOM for performance
- Team expertise in React
- Rich library ecosystem (React Router, Redux)

### Consequences
- **Positive:** Fast development, easy maintenance, good performance
- **Negative:** JSX learning curve for new developers

### Alternatives Considered
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Vue.js | Easy learning curve | Smaller ecosystem | Rejected |
| Angular | Enterprise features | Heavy, steep curve | Rejected |
| Svelte | Performance | Smaller community | Rejected |

---

## ADR-002: Node.js + Python Backend

**Status:** Accepted  
**Date:** 2024-Q1  
**Decision Makers:** Tech Lead, Backend Team

### Context
Need backend technology supporting REST APIs and ML model integration.

### Decision
Use Node.js (Express) for API layer, Python (FastAPI) for ML services.

### Rationale
- Node.js: Fast I/O, JavaScript fullstack
- Python: ML ecosystem (TensorFlow, NumPy)
- Microservices allow best tool for each job

### Consequences
- **Positive:** Optimized for each domain
- **Negative:** Two languages to maintain

### Architecture
```
[Client] -> [Node.js API] -> [Python ML Service]
                  |               |
            [PostgreSQL]    [Model Files]
```

---

## ADR-003: PostgreSQL as Primary Database

**Status:** Accepted  
**Date:** 2024-Q1  
**Decision Makers:** Tech Lead, Database Admin

### Context
Need reliable, scalable database for user data, products, and analysis history.

### Decision
Use PostgreSQL 14+ as primary database.

### Rationale
- ACID compliance for data integrity
- JSON support for flexible schemas
- Strong indexing for performance
- Open source, well-documented
- PostGIS for future geolocation features

### Consequences
- **Positive:** Reliable, scalable, feature-rich
- **Negative:** Requires more setup than NoSQL

### Schema Overview
- `users` - User accounts and profiles
- `analyses` - Skin analysis results
- `products` - Product catalog
- `recommendations` - Generated recommendations
- `audit_logs` - System audit trail

---

## ADR-004: JWT for Authentication

**Status:** Accepted  
**Date:** 2024-Q1  
**Decision Makers:** Security Team, Tech Lead

### Context
Need secure, stateless authentication for API access.

### Decision
Use JWT (JSON Web Tokens) with short-lived access tokens and refresh tokens.

### Rationale
- Stateless - no server-side session storage
- Scalable across multiple servers
- Contains claims for authorization
- Industry standard

### Token Configuration
| Token Type | Expiry | Storage |
|------------|--------|---------|  
| Access | 1 hour | Memory |
| Refresh | 7 days | HttpOnly Cookie |

### Security Measures
- HTTPS only
- HttpOnly cookies for refresh tokens
- Token rotation on refresh
- Blacklist for revoked tokens

---

## ADR-005: TensorFlow for ML Model

**Status:** Accepted  
**Date:** 2024-Q2  
**Decision Makers:** ML Team, Tech Lead

### Context
Need ML framework for skin condition detection and analysis.

### Decision
Use TensorFlow 2.x with custom trained models.

### Rationale
- Production-ready with TensorFlow Serving
- Transfer learning from pre-trained models
- Model optimization (TFLite) for deployment
- Strong community and documentation

### Model Architecture
- Base: EfficientNet-B4 (transfer learning)
- Output: Multi-label classification
- Labels: Acne, Wrinkles, Dark Spots, Redness, Dryness
- Confidence: 0-100 score per condition

### Performance Metrics
| Metric | Target | Actual |
|--------|--------|--------|
| Accuracy | >85% | 89% |
| Inference | <5s | 3.2s |
| F1 Score | >0.80 | 0.84 |

---

## ADR-006: Railway for Deployment

**Status:** Accepted  
**Date:** 2024-Q3  
**Decision Makers:** DevOps, Tech Lead

### Context
Need cloud platform for deployment with easy CI/CD.

### Decision
Use Railway for initial deployment with migration path to AWS.

### Rationale
- Simple deployment from GitHub
- Automatic SSL certificates
- Built-in PostgreSQL
- Cost-effective for MVP
- Easy scaling

### Deployment Architecture
```
[GitHub] -> [Railway CI/CD] -> [Production]
                                    |
                          [Frontend] [API] [ML]
                                    |
                              [PostgreSQL]
```

### Future Migration
- Phase 2: AWS ECS for containerized workloads
- Phase 3: AWS Lambda for serverless functions

---

## ADR-007: Redis for Caching

**Status:** Accepted  
**Date:** 2024-Q4  
**Decision Makers:** Backend Team, DevOps

### Context
Need caching layer for frequently accessed data and session management.

### Decision
Use Redis 7.x for caching and rate limiting.

### Rationale
- In-memory performance
- Data structures (strings, hashes, sets)
- TTL support for cache expiration
- Pub/sub for real-time features (future)

### Cache Strategy
| Data Type | TTL | Strategy |
|-----------|-----|----------|
| Product catalog | 1 hour | Write-through |
| User sessions | 24 hours | Write-behind |
| Rate limits | 1 minute | Time-window |
| API responses | 5 minutes | Cache-aside |

---

## ADR-008: Docker Containerization

**Status:** Accepted  
**Date:** 2024-Q4  
**Decision Makers:** DevOps, Tech Lead

### Context
Need consistent deployment environment across development and production.

### Decision
Containerize all services using Docker with docker-compose for local development.

### Rationale
- Environment consistency
- Easy local setup
- Production-ready containers
- Simplified dependency management

### Container Structure
```
ai-skincare-system/
├── docker-compose.yml
├── frontend/
│   └── Dockerfile
├── api/
│   └── Dockerfile
├── ml-service/
│   └── Dockerfile
└── nginx/
    └── Dockerfile
```

### Resource Limits
| Service | CPU | Memory |
|---------|-----|--------|
| Frontend | 0.5 | 512MB |
| API | 1.0 | 1GB |
| ML Service | 2.0 | 4GB |
| PostgreSQL | 1.0 | 2GB |
| Redis | 0.5 | 512MB |

---

## Pending Decisions

| ID | Topic | Status | Target Date |
|----|-------|--------|-------------|
| ADR-009 | Payment Gateway | Proposed | 2026-Q2 |
| ADR-010 | CDN Selection | Proposed | 2026-Q2 |
| ADR-011 | Mobile App Framework | Proposed | 2026-Q3 |

---

## Change Log

| Date | Version | Changes |
|------|---------|--------|
| 2024-Q1 | 0.1 | Initial decisions (ADR-001 to ADR-004) |
| 2024-Q2 | 0.2 | Added ADR-005 (TensorFlow) |
| 2024-Q4 | 0.3 | Added ADR-006 to ADR-008 |
| 2026-01 | 1.0 | Consolidated document |

---

**End of Document**
