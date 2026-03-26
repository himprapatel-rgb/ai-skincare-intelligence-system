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
from app.models.user import PolicyVersion, User, UserConsent, UserProfile, UserAccessLog
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


# ===== GDPR Data Portability & Erasure =====

@router.post("/export-data")
async def export_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    GDPR Article 20 - Data portability.

    Gathers all user data (profile, scans, shelf, goals, notifications)
    into a single JSON response for download.
    """
    from app.models.scan import ScanSession
    from app.models.shelf import ShelfProduct
    from app.models.goals import SkinGoal
    from app.models.notifications import Notification

    data: dict = {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
            "language": current_user.language,
        },
        "profile": None,
        "scans": [],
        "shelf_products": [],
        "goals": [],
        "notifications": [],
        "consents": [],
    }

    # Profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if profile:
        data["profile"] = {
            "first_name": profile.first_name,
            "last_name": profile.last_name,
            "date_of_birth": profile.date_of_birth.isoformat() if profile.date_of_birth else None,
            "gender": profile.gender,
            "location": profile.location,
            "skin_type": profile.skin_type,
            "skin_tone": profile.skin_tone,
            "primary_concern": profile.primary_concern,
            "secondary_concerns": profile.secondary_concerns,
            "goals": profile.goals,
            "known_allergies": profile.known_allergies,
            "preferred_ingredients": profile.preferred_ingredients,
            "ingredients_to_avoid": profile.ingredients_to_avoid,
        }

    # Scans
    scans = db.query(ScanSession).filter(ScanSession.user_id == current_user.id).all()
    for s in scans:
        data["scans"].append({
            "id": s.id,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "status": s.status if hasattr(s, "status") else None,
        })

    # Shelf
    try:
        shelf_items = db.query(ShelfProduct).filter(ShelfProduct.user_id == current_user.id).all()
        for item in shelf_items:
            data["shelf_products"].append({
                "id": item.id,
                "product_name": item.product_name if hasattr(item, "product_name") else None,
                "brand": item.brand if hasattr(item, "brand") else None,
                "added_at": item.created_at.isoformat() if hasattr(item, "created_at") and item.created_at else None,
            })
    except Exception:
        pass

    # Goals
    try:
        goals = db.query(SkinGoal).filter(SkinGoal.user_id == current_user.id).all()
        for g in goals:
            data["goals"].append({
                "id": g.id,
                "title": g.title if hasattr(g, "title") else None,
                "created_at": g.created_at.isoformat() if hasattr(g, "created_at") and g.created_at else None,
            })
    except Exception:
        pass

    # Notifications
    notifications = db.query(Notification).filter(Notification.user_id == current_user.id).all()
    for n in notifications:
        data["notifications"].append({
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "read": n.read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        })

    # Consents
    consents = db.query(UserConsent).filter(UserConsent.user_id == current_user.id).all()
    for c in consents:
        data["consents"].append({
            "id": c.id,
            "terms_accepted": c.terms_accepted,
            "privacy_accepted": c.privacy_accepted,
            "terms_version": c.terms_version,
            "privacy_version": c.privacy_version,
            "accepted_at": c.accepted_at.isoformat() if c.accepted_at else None,
        })

    logger.info("GDPR data export generated for user %d", current_user.id)
    return {"data": data}


@router.post("/delete-data")
async def delete_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    GDPR Article 17 - Right to erasure.

    Hard deletes all user data (scans, shelf, goals, notifications, chat)
    and anonymizes the user record.
    """
    from app.models.scan import ScanSession
    from app.models.shelf import ShelfProduct
    from app.models.goals import SkinGoal
    from app.models.notifications import Notification
    from app.models.ai_chat import AIChatSession, AIChatMessage

    user_id = current_user.id

    try:
        # Delete AI chat messages via sessions
        sessions = db.query(AIChatSession).filter(AIChatSession.user_id == user_id).all()
        for sess in sessions:
            db.query(AIChatMessage).filter(AIChatMessage.session_id == sess.id).delete(synchronize_session="fetch")
        db.query(AIChatSession).filter(AIChatSession.user_id == user_id).delete(synchronize_session="fetch")

        # Delete notifications
        db.query(Notification).filter(Notification.user_id == user_id).delete(synchronize_session="fetch")

        # Delete goals
        try:
            db.query(SkinGoal).filter(SkinGoal.user_id == user_id).delete(synchronize_session="fetch")
        except Exception:
            db.rollback()

        # Delete shelf products
        try:
            db.query(ShelfProduct).filter(ShelfProduct.user_id == user_id).delete(synchronize_session="fetch")
        except Exception:
            db.rollback()

        # Delete scans
        db.query(ScanSession).filter(ScanSession.user_id == user_id).delete(synchronize_session="fetch")

        # Delete profile
        db.query(UserProfile).filter(UserProfile.user_id == user_id).delete(synchronize_session="fetch")

        # Delete access logs
        db.query(UserAccessLog).filter(UserAccessLog.user_id == user_id).delete(synchronize_session="fetch")

        # Delete consents
        db.query(UserConsent).filter(UserConsent.user_id == user_id).delete(synchronize_session="fetch")

        # Anonymize user record (soft delete + scrub PII)
        current_user.email = f"deleted-{user_id}@anonymized.local"
        current_user.full_name = "Deleted User"
        current_user.hashed_password = None
        current_user.is_active = False
        current_user.deleted_at = datetime.utcnow()
        current_user.last_ip_address = None
        current_user.last_geolocation = None

        db.commit()
        logger.info("GDPR data erasure completed for user %d", user_id)
        return {"message": "All user data has been deleted and account anonymized."}

    except Exception as e:
        db.rollback()
        logger.error("GDPR data deletion failed for user %d: %s", user_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Data deletion failed. Please contact support.",
        )
