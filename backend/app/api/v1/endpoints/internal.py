from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel
from typing import Any
import os

from app.config import settings
from app.services.gpt_service import get_default_service, GPTService

router = APIRouter()


class SummaryRequest(BaseModel):
    prompt: str | None = None


@router.post("/summary")
def generate_summary(
    request: SummaryRequest, x_summary_token: str | None = Header(None)
) -> Any:
    """Generate a project summary using the GPT service.

    This endpoint is intended for internal automation. It requires the
    `X-SUMMARY-TOKEN` header to match `settings.SUMMARY_TOKEN`.
    """
    if not settings.SUMMARY_TOKEN or x_summary_token != settings.SUMMARY_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )

    # Build a prompt from repository docs (best-effort, truncate to keep size reasonable)
    def read_safe(path: str) -> str:
        try:
            with open(path, "r", encoding="utf8") as f:
                return f.read()
        except Exception:
            return ""

    ai_workflow = read_safe("docs/AI_AGILE_WORKFLOW.md")[:4000]
    progress = read_safe("docs/PROJECT_PROGRESS_TRACKER.md")[:4000]
    sprint = read_safe("docs/SPRINT-1.1-CODE-FILES.md")[:4000]
    readme = read_safe("README.md")[:2000]

    prompt = request.prompt or (
        "You are an assistant asked to produce a short, actionable daily project summary for the AI Skincare Intelligence System repo. "
        "Produce two sections in Markdown: 1) Where we are, 2) Next steps (3-6 items). Use these files as context: \n"
        f"AI_AGILE_WORKFLOW:{ai_workflow}PROJECT_PROGRESS_TRACKER:{progress}SPRINT_FILES:{sprint}README:{readme}"
    )

    # Initialize service
    svc: GPTService | None = None
    try:
        svc = get_default_service()
    except Exception:
        # Try constructing from settings if available
        if settings.GPTGPT_API_KEY:
            svc = GPTService(api_key=settings.GPTGPT_API_KEY, base_url=settings.GPTGPT_API_BASE)  # type: ignore[arg-type]

    if svc is None:
        raise HTTPException(status_code=500, detail="GPT service not configured")

    try:
        out = svc.chat(prompt)
        return {"summary": out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM call failed: {str(e)}")


# ========== SCIN Dataset Endpoints ==========

class SCINSampleCreate(BaseModel):
    """Schema for creating SCIN sample records"""
    md5hash: str
    image_1_path: str | None = None
    image_2_path: str | None = None
    image_3_path: str | None = None
    image_1_data: str | None = None  # Base64 encoded
    image_2_data: str | None = None
    image_3_data: str | None = None
    three_partition_label: str | None = None
    fitzpatrick_scale: str | None = None
    fitzpatrick_label: str | None = None
    diagnosis: str | None = None
    diagnosis_label: str | None = None
    url: str | None = None
    iddx_1: str | None = None
    iddx_2: str | None = None
    iddx_3: str | None = None
    iddx_full: str | None = None


@router.post("/scin/upload")
def upload_scin_sample(
    sample: SCINSampleCreate,
    x_summary_token: str | None = Header(None)
) -> Any:
    """Upload a single SCIN dataset sample.
    
    This endpoint is intended for internal automation. It requires the
    `X-SUMMARY-TOKEN` header to match `settings.SUMMARY_TOKEN`.
    """
    if not settings.SUMMARY_TOKEN or x_summary_token != settings.SUMMARY_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )
    
    from app.models.scin import SCINSample
    from app.database import SessionLocal
    
    db = SessionLocal()
    try:
        # Check if sample already exists
        existing = db.query(SCINSample).filter(
            SCINSample.md5hash == sample.md5hash
        ).first()
        
        if existing:
            return {"status": "exists", "id": existing.id}
        
        # Create new sample
        db_sample = SCINSample(**sample.dict())
        db.add(db_sample)
        db.commit()
        db.refresh(db_sample)
        
        return {
            "status": "created",
            "id": db_sample.id,
            "md5hash": db_sample.md5hash
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
    finally:
        db.close()


@router.post("/scin/upload_batch")
def upload_scin_batch(
    samples: list[SCINSampleCreate],
    x_summary_token: str | None = Header(None)
) -> Any:
    """Upload multiple SCIN dataset samples in batch.
    
    This endpoint is intended for internal automation. It requires the
    `X-SUMMARY-TOKEN` header to match `settings.SUMMARY_TOKEN`.
    """
    if not settings.SUMMARY_TOKEN or x_summary_token != settings.SUMMARY_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )
    
    from app.models.scin import SCINSample
    from app.database import SessionLocal
    
    db = SessionLocal()
    created_count = 0
    existing_count = 0
    error_count = 0
    
    try:
        for sample in samples:
            try:
                # Check if sample already exists
                existing = db.query(SCINSample).filter(
                    SCINSample.md5hash == sample.md5hash
                ).first()
                
                if existing:
                    existing_count += 1
                    continue
                
                # Create new sample
                db_sample = SCINSample(**sample.dict())
                db.add(db_sample)
                created_count += 1
            except Exception:
                error_count += 1
                continue
        
        db.commit()
        
        return {
            "status": "completed",
            "created": created_count,
            "existing": existing_count,
            "errors": error_count,
            "total": len(samples)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Batch upload error: {str(e)}"
        )
    finally:
        db.close()


@router.get("/scin/count")
def get_scin_count(
    x_summary_token: str | None = Header(None)
) -> Any:
    """Get count of SCIN samples in database.
    
    This endpoint is intended for internal automation. It requires the
    `X-SUMMARY-TOKEN` header to match `settings.SUMMARY_TOKEN`.
    """
    if not settings.SUMMARY_TOKEN or x_summary_token != settings.SUMMARY_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )
    
    from app.models.scin import SCINSample
    from app.database import SessionLocal
    
    db = SessionLocal()
    try:
        count = db.query(SCINSample).count()
        return {"count": count}
    finally:
        db.close()
