# ADR-ML-003 – External Storage for Pre-Trained ML Models

## Status
Accepted – December 2025

## Context

- GitHub enforces a hard limit on individual file size (~100 MB), and storing large ML model artifacts in the repository is discouraged due to performance and repo health concerns.
- The AI Skincare Intelligence System requires one or more large pre-trained models for face and skin condition analysis for MVP, but **no** on-platform training in early phases.
- Railway's default filesystem is ephemeral; data is lost on deploy/restart unless tied to a **persistent volume**.
- Best practices for AI/ML workloads recommend either:
  - mounting persistent volumes for large models, or
  - downloading models from object storage to local disk/cache at startup.

## Decision

1. **Model Storage Location**
   - Primary: Railway **persistent volume** mounted into the backend service at a fixed path (e.g., `/mnt/models`).
   - Secondary: Approved external storage (e.g., Google Drive or cloud object storage) accessed via secure download and cached on local disk within the container.

2. **Loading Strategy**
   - Models are **not** stored in GitHub.
   - The backend loads the model **at application startup or on first request**, using a cached loader (e.g., FastAPI startup event or lazy `@lru_cache` function) to avoid repeated loading.
   - CI pipelines use a lightweight stub model configuration to avoid pulling large artifacts.

3. **Architecture**
   - A **model-agnostic inference interface** abstracts the underlying model implementation, so API responses and frontend contracts remain stable when models are swapped.
   - Each inference is tagged with `model_family` and `model_version` and logged for traceability.

4. **Scope**
   - MVP uses **pre-trained, inference-only** models.
   - Dataset ingestion and training pipelines are deferred to post-MVP, implemented as separate offline/batch workflows.

## Alternatives Considered

1. **Store Models in Git LFS within GitHub**
   - Pros: Simple developer workflow.
   - Cons: Still constrained by GitHub limits and storage costs; complicates cloning and CI; goes against repo health recommendations.
   - Status: Rejected.

2. **Bake Models into Docker Image**
   - Pros: Very fast at runtime; no runtime download.
   - Cons: Large image sizes slow deployments and rollbacks; high network overhead; difficult to swap models without rebuilding and redeploying images; not ideal for frequent model iterations.
   - Status: Rejected for MVP.

3. **Always Download from External Storage per Request**
   - Pros: Very simple implementation.
   - Cons: Unacceptable latency and bandwidth overhead; violates NFR1 and common ML deployment best practices.
   - Status: Rejected.

## Security Implications

- External model storage must be accessed over HTTPS or equivalent secure protocol.
- Credentials (API keys, signed URLs) are stored in Railway/GitHub secrets, **not** in code or Git history.
- Downloaded model files reside only on backend servers, never exposed directly to clients.
- Integrity checks (e.g., checksum verification) are recommended for downloaded artifacts.

## Operational Impact

- **Startup:** Initial container startup may be slower due to model load or first-time download, but subsequent inferences operate with low latency.
- **Scaling:** Additional instances may each download or mount models; using volumes and caching reduces repeated network overhead.
- **CI/CD:** Pipelines remain lightweight using stub models; production deployments attach volumes and/or access external storage.

## Rollback Strategy

- If runtime download or volume mounting fails:
  - Fallback to previous known-good model artifact on volume, if present.
  - Temporarily switch the system to a degraded mode (e.g., mock or minimal model) that keeps endpoints alive but clearly labels results as non-final.
- If a new model exhibits issues (latency, accuracy, or bias):
  - Switch configuration to previous `model_version` without changing frontend code.
  - Record the rollback in the Decision Log and Change Log with timestamps and model ids.
