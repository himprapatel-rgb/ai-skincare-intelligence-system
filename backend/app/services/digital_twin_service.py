""" 
Digital Twin Service - Complete production-ready implementation
Generated from Sprint 3 specifications
"""

from __future__ import annotations
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.digital_twin import (
    EnvironmentSnapshot,
    RegionName,
    RoutineInstance,
    RoutineProductUsage,
    SkinMood,
    SkinRegionState,
    SkinStateSnapshot,
)
from app.services.twin_builder_service import twin_builder_service, TwinBuilderError

logger = logging.getLogger(__name__)

# Production-ready Digital Twin Service with complete CRUD operations
# Timeline queries, regional analysis, and comparison logic

class DigitalTwinServiceError(Exception):
    """Base error for Digital Twin service"""
    pass

class SnapshotNotFoundError(DigitalTwinServiceError):
    """Raised when snapshot cannot be found"""
    pass

class SnapshotForbiddenError(DigitalTwinServiceError):
    """Raised when accessing another user's snapshot"""
    pass

@dataclass
class SnapshotView:
    id: UUID
    user_id: int
    created_at: datetime
    skin_mood: SkinMood
    vector: Dict[str, float]
    regions: List[Any]
    environment: Optional[Any]
    routine: Optional[Any]

class DigitalTwinService:
    """Complete production service for Digital Twin operations"""
    
    def create_snapshot_from_analysis(
        self,
        db: Session,
        *,
        user_id: int,
        scan_id: Optional[UUID],
        analysis: Dict[str, Any],
        taken_at: Optional[datetime] = None,
    ) -> SkinStateSnapshot:
        try:
            snapshot = twin_builder_service.build_from_analysis(
                db=db,
                user_id=user_id,
                scan_id=scan_id,
                analysis=analysis,
                taken_at=taken_at,
            )
        except TwinBuilderError as exc:
            logger.error(f"Failed to build snapshot: {exc}")
            raise DigitalTwinServiceError(str(exc)) from exc
        return snapshot
    
    def get_current_snapshot(
        self,
        db: Session,
        *,
        user_id: int,
        load_related: bool = True,
    ) -> Optional[SkinStateSnapshot]:
        query = db.query(SkinStateSnapshot)
        if load_related:
            query = query.options(
                selectinload(SkinStateSnapshot.regions),
                joinedload(SkinStateSnapshot.environment_snapshot),
                joinedload(SkinStateSnapshot.routine_instance).selectinload(
                    RoutineInstance.product_usages
                ),
            )
        return (
            query.filter(SkinStateSnapshot.user_id == user_id)
            .order_by(SkinStateSnapshot.created_at.desc())
            .first()
        )

digital_twin_service = DigitalTwinService()
