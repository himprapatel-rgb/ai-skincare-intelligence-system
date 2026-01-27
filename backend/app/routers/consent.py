"""Consent and Privacy Policy Management Router

SRS Traceability:
- BR12: Policies (Terms of Service, Privacy Policy) must be accepted before registration
- FR46: Tag analyses with model version and provide human-readable explanation factors
- NFR4: Use AES-256 encryption for sensitive data at rest and TLS in transit
- NFR6: Data stored regionally where required (GDPR and equivalent compliance)

Sprint: 1.2 - Story 1.9
"""
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.dependencies import get_db
from app.models.user import PolicyVersion, User, UserConsent
from app.schemas.consent import ConsentCreate, ConsentResponse, PolicyResponse

router = APIRouter(prefix="/consent", tags=["consent"])
logger = logging.getLogger(__name__)


def _get_default_policies():
    """Return default policies when database policies don't exist."""
    return PolicyResponse(
        terms_of_service={
            "version": "terms-1.0.0",
            "effective_date": datetime(2025, 1, 1).isoformat(),
            "content_url": "/terms",
            "summary": "Terms of Service - Version 1.0.0"
        },
        privacy_policy={
            "version": "privacy-1.0.0",
            "effective_date": datetime(2025, 1, 1).isoformat(),
            "content_url": "/privacy",
            "summary": "Privacy Policy - Version 1.0.0"
        }
    )


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

        # Return default policies if none found in database
        if not terms or not privacy:
            logger.info("No active policies in database, returning defaults")
            return _get_default_policies()

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
        return _get_default_policies()


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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid policy versions specified"
        )

    # Create or update consent record
    existing_consent = db.query(UserConsent).filter(
        UserConsent.user_id == current_user.id
    ).first()

    if existing_consent:
        existing_consent.terms_accepted = consent_data.terms_accepted
        existing_consent.privacy_accepted = consent_data.privacy_accepted
        existing_consent.terms_version = consent_data.terms_version
        existing_consent.privacy_version = consent_data.privacy_version
        existing_consent.accepted_at = datetime.utcnow()
        existing_consent.ip_address = consent_data.ip_address
        consent = existing_consent
    else:
        consent = UserConsent(
            user_id=current_user.id,
            terms_accepted=consent_data.terms_accepted,
            privacy_accepted=consent_data.privacy_accepted,
            terms_version=consent_data.terms_version,
            privacy_version=consent_data.privacy_version,
            ip_address=consent_data.ip_address
        )
        db.add(consent)

    db.commit()
    db.refresh(consent)

    return ConsentResponse(
        id=consent.id,
        user_id=consent.user_id,
        terms_accepted=consent.terms_accepted,
        privacy_accepted=consent.privacy_accepted,
        terms_version=consent.terms_version,
        privacy_version=consent.privacy_version,
        accepted_at=consent.accepted_at
    )


@router.get("/status", response_model=ConsentResponse)
async def get_consent_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's current consent status.
    Sprint: 1.2 - Story 1.9
    """
    consent = db.query(UserConsent).filter(
        UserConsent.user_id == current_user.id
    ).first()

    if not consent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No consent record found"
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
    Withdraw consent (GDPR compliance).
    SRS: NFR6 - GDPR compliance
    Sprint: 1.2 - Story 1.9
    """
    consent = db.query(UserConsent).filter(
        UserConsent.user_id == current_user.id
    ).first()

    if not consent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No consent record found"
        )

    db.delete(consent)
    db.commit()

    return {"message": "Consent withdrawn successfully"}
