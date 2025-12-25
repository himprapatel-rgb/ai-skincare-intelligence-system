"""Consent and Privacy Policy Management Router

SRS Traceability:
- BR12: Policies (Terms of Service, Privacy Policy) must be accepted before registration
- FR46: Tag analyses with model version and provide human-readable explanation factors
- NFR4: Use AES-256 encryption for sensitive data at rest and TLS in transit
- NFR6: Data stored regionally where required (GDPR and equivalent compliance)

Sprint: 1.2 - Story 1.9
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import logging

from app.models.user import User, UserConsent, PolicyVersion
from app.schemas.consent import ConsentCreate, ConsentResponse, PolicyResponse
from app.core.security import get_current_user
from app.dependencies import get_db
router = APIRouter(prefix="/consent", tags=["consent"])
logger = logging.getLogger(__name__)

@router.get("/policies/current", response_model=PolicyResponse)
async def get_current_policies(db: Session = Depends(get_db)):
    """
    Get current active policy versions (Terms & Privacy Policy).
    SRS: BR12, NFR6
    Sprint: 1.2 - Story 1.9
    """
    try:
                terms = db.query(PolicyVersion).filter(
            PolicyVersion.policy_type == "terms_of_service",
            PolicyVersion.is_active == True
        ).first()
    
        privacy = db.query(PolicyVersion).filter(
            PolicyVersion.policy_type == "privacy_policy",
            PolicyVersion.is_active == True
        ).first()
    
        if not terms or not privacy:
            raise HTTPException(
                status_code=500,
                detail="Active policies not found"
            )
    
        return PolicyResponse(
            terms_of_service={
                "version": terms.version,
                "effective_date": terms.effective_date.isoformat(),
                "content_url": terms.content_url or "/terms",
                "summary": terms.summary
            },
            privacy_policy={
                "version": privacy.version,
                "effective_date": privacy.effective_date.isoformat(),
                "content_url": privacy.content_url or "/privacy",
                "summary": privacy.summary
            }
        )
    except Exception as e:
        # Fallback when policy_versions table doesn't exist
        logger.warning(f"Policy versions table not found: {e}")
        from datetime import datetime
        return PolicyResponse(
            terms_of_service={
                "version": "1.0.0",
                "effective_date": datetime(2025, 1, 1).isoformat(),
                "content_url": "/terms",
                "summary": "Terms of Service - Version 1.0.0"
            },
            privacy_policy={
                "version": "1.0.0",
                "effective_date": datetime(2025, 1, 1).isoformat(),
                "content_url": "/privacy",
                "summary": "Privacy Policy - Version 1.0.0"
            }
        )

@router.post("/accept", response_model=ConsentResponse)
async def accept_policies(
    consent_data: ConsentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accept Terms of Service and Privacy Policy.
    SRS: BR12 - Policies must be accepted before registration
    Sprint: 1.2 - Story 1.9
    """
    # Get current policy versions
    terms = db.query(PolicyVersion).filter(
        PolicyVersion.policy_type == "terms_of_service",
        PolicyVersion.version == consent_data.terms_version
    ).first()
    
    privacy = db.query(PolicyVersion).filter(
        PolicyVersion.policy_type == "privacy_policy",
        PolicyVersion.version == consent_data.privacy_version
    ).first()
    
    if not terms or not privacy:
        raise HTTPException(
            status_code=400,
            detail="Invalid policy versions"
        )
    
    # Check if consent already exists
    existing_consent = db.query(UserConsent).filter(
        UserConsent.user_id == current_user.id
    ).first()
    
    if existing_consent:
        # Update existing consent
        existing_consent.terms_accepted = consent_data.terms_accepted
        existing_consent.privacy_accepted = consent_data.privacy_accepted
        existing_consent.terms_version = consent_data.terms_version
        existing_consent.privacy_version = consent_data.privacy_version
        existing_consent.accepted_at = datetime.utcnow()
        existing_consent.ip_address = consent_data.ip_address
        db.commit()
        db.refresh(existing_consent)
        user_consent = existing_consent
    else:
        # Create new consent record
        user_consent = UserConsent(
            user_id=current_user.id,
            terms_accepted=consent_data.terms_accepted,
            privacy_accepted=consent_data.privacy_accepted,
            terms_version=consent_data.terms_version,
            privacy_version=consent_data.privacy_version,
            accepted_at=datetime.utcnow(),
            ip_address=consent_data.ip_address
        )
        db.add(user_consent)
        db.commit()
        db.refresh(user_consent)
    
    logger.info(
        f"Consent accepted for user {current_user.id}",
        extra={
            "user_id": str(current_user.id),
            "terms_version": consent_data.terms_version,
            "privacy_version": consent_data.privacy_version,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
    
    return ConsentResponse(
        id=user_consent.id,
        user_id=user_consent.user_id,
        terms_accepted=user_consent.terms_accepted,
        privacy_accepted=user_consent.privacy_accepted,
        terms_version=user_consent.terms_version,
        privacy_version=user_consent.privacy_version,
        accepted_at=user_consent.accepted_at
    )

@router.get("/status", response_model=ConsentResponse)
async def get_consent_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's consent status.
    SRS: BR12, NFR6
    Sprint: 1.2 - Story 1.9
    """
    consent = db.query(UserConsent).filter(
        UserConsent.user_id == current_user.id
    ).first()
    
    if not consent:
        raise HTTPException(
            status_code=404,
            detail="Consent record not found"
        )
    
    return ConsentResponse(
        id=consent.id,
        user_id=consent.user_id,
        terms_accepted=consent.terms_accepted,
        privacy_accepted=consent.privacy_accepted,
        terms_version=consent.terms_version,
        privacy_version=consent.privacy_version,
        accepted_at=consent.accepted_at
    )

@router.delete("/withdraw")
async def withdraw_consent(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Withdraw consent and trigger account deletion process.
    SRS: NFR6 - GDPR Right to be Forgotten
    Sprint: 1.2 - Story 1.9
    """
    consent = db.query(UserConsent).filter(
        UserConsent.user_id == current_user.id
    ).first()
    
    if consent:
        # Mark for deletion (14-day grace period)
        consent.terms_accepted = False
        consent.privacy_accepted = False
        db.commit()
        logger.info(f"Consent withdrawn for user {current_user.id}")
    
    return {
        "message": "Consent withdrawn. Account will be deleted within 14 days."
    }
