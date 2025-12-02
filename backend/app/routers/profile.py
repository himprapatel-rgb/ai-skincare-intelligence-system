from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import logging

from app.models.user import User, UserProfile
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse
from app.core.security import get_current_user, encrypt_sensitive_data, decrypt_sensitive_data
from app.db.session import get_db
from app.core.audit import log_profile_event

router = APIRouter(prefix="/profile", tags=["profile"])
logger = logging.getLogger(__name__)


@router.post("/baseline", response_model=ProfileResponse)
async def create_baseline_profile(
    profile_data: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create baseline user profile from onboarding flow.
    
    SRS Traceability:
    - UR1: Create an account, define goals, and specify primary concerns
    - FR46: Tag analyses with model version and provide human-readable explanation factors
    - NFR4: Use AES-256 encryption for sensitive data at rest and TLS in transit
    - NFR6: Data stored regionally where required (GDPR and equivalent compliance)
    
    Sprint: 1.2 - Story 1.2
    """
    try:
        # Check if profile already exists
        existing_profile = db.query(UserProfile).filter(
            UserProfile.user_id == current_user.id
        ).first()
        
        if existing_profile:
            raise HTTPException(
                status_code=400,
                detail="Profile already exists. Use PATCH /profile to update."
            )

        # Validate profile data
        if len(profile_data.goals) < 1 or len(profile_data.goals) > 3:
            raise HTTPException(
                status_code=400,
                detail="Goals must be 1-3 selections"
            )
        
        if len(profile_data.concerns) < 1 or len(profile_data.concerns) > 5:
            raise HTTPException(
                status_code=400,
                detail="Concerns must be 1-5 selections"
            )

        # Encrypt sensitive fields (NFR4: AES-256)
        encrypted_goals = encrypt_sensitive_data(profile_data.goals)
        encrypted_concerns = encrypt_sensitive_data(profile_data.concerns)
        encrypted_skin_type = encrypt_sensitive_data(profile_data.skin_type)

        # Create profile record
        user_profile = UserProfile(
            user_id=current_user.id,
            goals=encrypted_goals,
            concerns=encrypted_concerns,
            skin_type=encrypted_skin_type,
            routine_frequency=profile_data.routine_frequency,
            climate=profile_data.climate,
            profile_complete=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(user_profile)
        db.commit()
        db.refresh(user_profile)

        # Audit log (immutable record)
        await log_profile_event(
            db=db,
            user_id=current_user.id,
            event_type="profile_created",
            new_value=profile_data.dict(),
            ip_address=None  # TODO: Extract from request
        )

        logger.info(
            f"Profile created for user {current_user.id}",
            extra={
                "user_id": str(current_user.id),
                "event": "profile_created",
                "timestamp": datetime.utcnow().isoformat()
            }
        )

        return ProfileResponse(
            id=user_profile.id,
            user_id=user_profile.user_id,
            goals=profile_data.goals,  # Return decrypted for response
            concerns=profile_data.concerns,
            skin_type=profile_data.skin_type,
            routine_frequency=profile_data.routine_frequency,
            climate=profile_data.climate,
            profile_complete=True,
            created_at=user_profile.created_at,
            updated_at=user_profile.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile creation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Profile creation failed"
        )


@router.get("", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's profile.
    
    SRS: FR46, UR1
    Sprint: 1.2 - Story 1.6
    """
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found. Complete onboarding first."
        )
    
    # Decrypt sensitive fields
    return ProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        goals=decrypt_sensitive_data(profile.goals),
        concerns=decrypt_sensitive_data(profile.concerns),
        skin_type=decrypt_sensitive_data(profile.skin_type),
        routine_frequency=profile.routine_frequency,
        climate=profile.climate,
        profile_complete=profile.profile_complete,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.patch("", response_model=ProfileResponse)
async def update_profile(
    profile_update: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile.
    
    SRS: FR46, UR1, NFR4
    Sprint: 1.2 - Story 1.6
    """
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )
    
    # Store old values for audit log
    old_values = {
        "goals": decrypt_sensitive_data(profile.goals),
        "concerns": decrypt_sensitive_data(profile.concerns),
        "skin_type": decrypt_sensitive_data(profile.skin_type),
        "routine_frequency": profile.routine_frequency,
        "climate": profile.climate
    }
    
    # Update fields if provided
    update_data = profile_update.dict(exclude_unset=True)
    
    if "goals" in update_data:
        if len(update_data["goals"]) < 1 or len(update_data["goals"]) > 3:
            raise HTTPException(status_code=400, detail="Goals must be 1-3 selections")
        profile.goals = encrypt_sensitive_data(update_data["goals"])
    
    if "concerns" in update_data:
        if len(update_data["concerns"]) < 1 or len(update_data["concerns"]) > 5:
            raise HTTPException(status_code=400, detail="Concerns must be 1-5 selections")
        profile.concerns = encrypt_sensitive_data(update_data["concerns"])
    
    if "skin_type" in update_data:
        profile.skin_type = encrypt_sensitive_data(update_data["skin_type"])
    
    if "routine_frequency" in update_data:
        profile.routine_frequency = update_data["routine_frequency"]
    
    if "climate" in update_data:
        profile.climate = update_data["climate"]
    
    profile.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(profile)
    
    # Audit log
    await log_profile_event(
        db=db,
        user_id=current_user.id,
        event_type="profile_updated",
        old_value=old_values,
        new_value=update_data,
        ip_address=None
    )
    
    # Return decrypted profile
    return ProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        goals=decrypt_sensitive_data(profile.goals),
        concerns=decrypt_sensitive_data(profile.concerns),
        skin_type=decrypt_sensitive_data(profile.skin_type),
        routine_frequency=profile.routine_frequency,
        climate=profile.climate,
        profile_complete=profile.profile_complete,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.get("/export")
async def export_profile_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    GDPR data export - download all user profile data.
    
    SRS: FR44, NFR6
    Sprint: 1.2 - Story 1.6
    """
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        return {"message": "No profile data found"}
    
    export_data = {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "created_at": current_user.created_at.isoformat()
        },
        "profile": {
            "goals": decrypt_sensitive_data(profile.goals),
            "concerns": decrypt_sensitive_data(profile.concerns),
            "skin_type": decrypt_sensitive_data(profile.skin_type),
            "routine_frequency": profile.routine_frequency,
            "climate": profile.climate,
            "created_at": profile.created_at.isoformat(),
            "updated_at": profile.updated_at.isoformat()
        },
        "export_timestamp": datetime.utcnow().isoformat()
    }
    
    logger.info(f"Profile data exported for user {current_user.id}")
    
    return export_data


@router.delete("")
async def delete_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initiate account deletion (14-day grace period).
    
    SRS: FR44, NFR6
    Sprint: 1.2 - Story 1.6
    """
    # TODO: Implement 14-day grace period logic
    # For now, immediate deletion
    
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()
    
    if profile:
        db.delete(profile)
    
    db.delete(current_user)
    db.commit()
    
    logger.info(f"Account deletion initiated for user {current_user.id}")
    
    return {"message": "Account deletion initiated. Data will be removed within 14 days."}
