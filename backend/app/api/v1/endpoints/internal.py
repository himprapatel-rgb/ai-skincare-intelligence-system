from __future__ import annotations

from typing import Any
from uuid import UUID

import httpx
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel

from app.config import settings
from app.database import SessionLocal
from app.models.scan import ScanSession
from app.services.gpt_service import GPTService, get_default_service

router = APIRouter()


class SummaryRequest(BaseModel):
    prompt: str | None = None


class OpenAIHealthResponse(BaseModel):
    ok: bool
    status_code: int | None = None
    detail: str | None = None


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


@router.get("/openai/health", response_model=OpenAIHealthResponse)
def openai_health_check(x_summary_token: str | None = Header(None)) -> OpenAIHealthResponse:
    """Check OpenAI availability (internal use only)."""
    if not settings.SUMMARY_TOKEN or x_summary_token != settings.SUMMARY_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )

    if not settings.OPENAI_API_KEY:
        return OpenAIHealthResponse(ok=False, detail="OPENAI_API_KEY not configured")

    try:
        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
        with httpx.Client(timeout=10) as client:
            response = client.get(f"{settings.OPENAI_API_BASE}/models", headers=headers)
        if response.status_code == 200:
            return OpenAIHealthResponse(ok=True, status_code=200)
        return OpenAIHealthResponse(
            ok=False,
            status_code=response.status_code,
            detail="OpenAI API returned non-200 status",
        )
    except Exception as exc:
        return OpenAIHealthResponse(ok=False, detail=f"OpenAI check failed: {exc}")


@router.get("/scan/lookup")
def lookup_scan(scan_id: str, x_summary_token: str | None = Header(None)) -> Any:
    """Internal scan lookup (requires SUMMARY_TOKEN)."""
    if not settings.SUMMARY_TOKEN or x_summary_token != settings.SUMMARY_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )

    try:
        scan_uuid = UUID(scan_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid scan ID format",
        )

    db = SessionLocal()
    try:
        scan = db.query(ScanSession).filter(ScanSession.id == scan_uuid).first()
        if not scan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scan session not found",
            )

        return {
            "scan_id": str(scan.id),
            "user_id": scan.user_id,
            "status": scan.status.value if hasattr(scan.status, "value") else str(scan.status),
            "has_image_data": bool(scan.image_data),
            "image_content_type": scan.image_content_type,
            "image_filename": scan.image_filename,
            "image_url": scan.image_url,
            "created_at": scan.created_at.isoformat() if scan.created_at else None,
            "updated_at": scan.updated_at.isoformat() if scan.updated_at else None,
        }
    finally:
        db.close()


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
    
    from app.database import SessionLocal
    from app.models.scin import SCINSample
    
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
    
    from app.database import SessionLocal
    from app.models.scin import SCINSample
    
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
    
    from app.database import SessionLocal
    from app.models.scin import SCINSample
    
    db = SessionLocal()
    try:
        count = db.query(SCINSample).count()
        return {"count": count}
    finally:
        db.close()


# ========== Database & Login Troubleshooting ==========

@router.get("/db-status")
def get_db_status(
    x_summary_token: str | None = Header(None)
) -> Any:
    """Check if main database is reachable and return basic stats.
    Requires X-SUMMARY-TOKEN header. Use to verify database is working."""
    if not settings.SUMMARY_TOKEN or x_summary_token != settings.SUMMARY_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )
    from sqlalchemy import text

    from app.database import SessionLocal
    from app.models.user import User

    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        user_count = db.query(User).count()
        test_user = db.query(User).filter(User.email == "himanshu@test.com").first()
        return {
            "database": "ok",
            "user_count": user_count,
            "test_user_exists": test_user is not None,
            "test_user_verified": test_user.is_verified if test_user else False,
            "test_user_active": test_user.is_active if test_user else False,
        }
    except Exception as e:
        return {
            "database": "error",
            "error": str(e)[:200],
        }
    finally:
        db.close()


class VerifyUserRequest(BaseModel):
    email: str


@router.post("/verify-user")
def verify_user_by_email(
    body: VerifyUserRequest,
    x_summary_token: str | None = Header(None)
) -> Any:
    """Set is_verified=true and is_active=true for any user. Use when a regular
    user can't log in because verification email never arrived (SMTP issues, spam).
    Requires X-SUMMARY-TOKEN header."""
    if not settings.SUMMARY_TOKEN or x_summary_token != settings.SUMMARY_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )
    from app.database import SessionLocal
    from app.models.user import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == body.email.strip().lower()).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.is_verified = True
        user.is_active = True
        db.add(user)
        db.commit()
        db.refresh(user)
        return {"email": user.email, "message": "User verified. They can now log in."}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)[:200])
    finally:
        db.close()


@router.post("/fix-test-user")
def fix_test_user(
    x_summary_token: str | None = Header(None)
) -> Any:
    """Create or fix himanshu@test.com (verified, active, password Test1234!).
    Requires X-SUMMARY-TOKEN header. Call when login fails for test user."""
    if not settings.SUMMARY_TOKEN or x_summary_token != settings.SUMMARY_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )
    from app.database import SessionLocal
    from app.models.user import User
    from app.services.auth_service import auth_service

    db = SessionLocal()
    try:
        email = "himanshu@test.com"
        user = db.query(User).filter(User.email == email).first()
        if not user:
            hashed = auth_service.hash_password("Test1234!")
            user = User(
                email=email,
                hashed_password=hashed,
                full_name="Himanshu Patel",
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            return {"action": "created", "email": email, "message": "Test user created. Log in with Test1234!"}
        needs_update = False
        if not user.is_verified:
            user.is_verified = True
            needs_update = True
        if not user.is_active:
            user.is_active = True
            needs_update = True
        if not auth_service.verify_password(user.hashed_password, "Test1234!"):
            user.hashed_password = auth_service.hash_password("Test1234!")
            needs_update = True
        if needs_update:
            db.add(user)
            db.commit()
            db.refresh(user)
            return {"action": "updated", "email": email, "message": "Test user fixed. Log in with Test1234!"}
        return {"action": "ok", "email": email, "message": "Test user already verified and active."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)[:200])
    finally:
        db.close()
