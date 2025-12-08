"""TwinBuilderService - Builds Digital Twin snapshots from scan analysis.

This service implements FR1, FR2, and FR5 of EPIC 3:
- FR1: Build and update digital model after each scan
- FR2: Track per-region metrics
- FR5: Integrate environment, product usage, routine history
"""

from __future__ import annotations
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from uuid import UUID

from sqlalchemy.orm import Session, selectinload

from app.models.digital_twin import (
    EnvironmentSnapshot,
    RegionName,
    RoutineInstance,
    SkinRegionState,
    SkinStateSnapshot,
)
from app.models.user import User

logger = logging.getLogger(__name__)

class TwinBuilderError(Exception):
    """Raised when snapshot construction fails"""
    pass

class TwinBuilderService:
    """Builds SkinStateSnapshot from scan analysis JSON.
    
    Expected analysis structure:
    {
        "global_metrics": {
            "texture_score": 4.3,
            "pore_score": 5.1,
            "redness_index": 6.2,
            ...
        },
        "regions": {
            "forehead": {"texture_score": 5.1, "acne_score": 6.0},
            "left_cheek": {...},
            ...
        },
        "heatmaps": {
            "forehead": {
                "url": "https://.../forehead.png",
                "bounding_box": {"x": 0.1, "y": 0.2, "width": 0.3, "height": 0.2}
            },
            ...
        }
    }
    """
    
    def build_from_scan_id(
        self,
        db: Session,
        *,
        scan_id: UUID,
        user: Optional[User] = None,
    ) -> SkinStateSnapshot:
        """Build snapshot from a completed Scan."""
        from app.models.scan import Scan
        
        scan = (
            db.query(Scan)
            .options(selectinload("*"))
            .filter(Scan.id == scan_id)
            .one_or_none()
        )
        
        if scan is None:
            raise TwinBuilderError(f"Scan {scan_id} not found")
        
        status = getattr(scan, "status", None)
        if status != "completed":
            raise TwinBuilderError(f"Scan {scan_id} not completed (status={status!r})")
        
        analysis = (
            getattr(scan, "analysis_result", None)
            or getattr(scan, "analysis", None)
            or getattr(scan, "result", None)
        )
        
        if analysis is None:
            raise TwinBuilderError(f"Scan {scan_id} has no analysis data")
        
        if user is not None:
            user_id = user.id
        else:
            user_id = getattr(scan, "user_id", None)
            if user_id is None:
                raise TwinBuilderError("Scan has no user_id")
        
        taken_at = (
            getattr(scan, "completed_at", None)
            or getattr(scan, "processed_at", None)
            or getattr(scan, "created_at", datetime.utcnow())
        )
        
        return self.build_from_analysis(
            db=db,
            user_id=int(user_id),
            scan_id=scan_id,
            analysis=analysis,
            taken_at=taken_at,
        )
    
    def build_from_analysis(
        self,
        db: Session,
        *,
        user_id: int,
        scan_id: Optional[UUID],
        analysis: Dict[str, Any],
        taken_at: Optional[datetime] = None,
    ) -> SkinStateSnapshot:
        """Build snapshot directly from analysis JSON."""
        taken_at = taken_at or datetime.utcnow()
        
        global_metrics = self._extract_global_metrics(analysis)
        region_payload = self._extract_region_payload(analysis)
        
        env = self._find_nearby_environment_snapshot(
            db=db, user_id=user_id, time=taken_at
        )
        routine = self._find_nearby_routine_instance(
            db=db, user_id=user_id, time=taken_at
        )
        
        snapshot = SkinStateSnapshot(
            user_id=user_id,
            scan_id=scan_id,
            skin_mood="unknown",
            environment_snapshot_id=env.id if env else None,
            routine_instance_id=routine.id if routine else None,
            vector=global_metrics,
            texture_score=global_metrics.get("texture_score"),
            pore_score=global_metrics.get("pore_score"),
            redness_index=global_metrics.get("redness_index"),
            pigmentation_index=global_metrics.get("pigmentation_index"),
            oil_balance=global_metrics.get("oil_balance"),
            hydration_index=global_metrics.get("hydration_index"),
            sensitivity_index=global_metrics.get("sensitivity_index"),
            barrier_risk_score=global_metrics.get("barrier_risk_score"),
            microbiome_risk_proxy=global_metrics.get("microbiome_risk_proxy"),
            created_at=taken_at,
        )
        db.add(snapshot)
        db.flush()
        
        for region_name, region_data in region_payload.items():
            try:
                region_enum = RegionName(region_name)
            except ValueError:
                logger.warning(f"Unknown region '{region_name}', skipping")
                continue
            
            metrics = region_data.get("metrics") or {}
            heatmap_url = region_data.get("heatmap_url")
            bounding_box = region_data.get("bounding_box")
            
            db.add(
                SkinRegionState(
                    snapshot_id=snapshot.id,
                    region=region_enum,
                    metrics=metrics,
                    heatmap_url=heatmap_url,
                    bounding_box=bounding_box,
                )
            )
        
        db.commit()
        db.refresh(snapshot)
        return snapshot
    
    @staticmethod
    def _extract_global_metrics(analysis: Dict[str, Any]) -> Dict[str, float]:
        defaults = {
            "texture_score": 5.0,
            "pore_score": 5.0,
            "redness_index": 5.0,
            "pigmentation_index": 5.0,
            "oil_balance": 5.0,
            "hydration_index": 5.0,
            "sensitivity_index": 5.0,
            "barrier_risk_score": 5.0,
            "microbiome_risk_proxy": 5.0,
        }
        gm = analysis.get("global_metrics") or {}
        result = {}
        for key, default in defaults.items():
            value = gm.get(key, default)
            try:
                result[key] = float(value)
            except (TypeError, ValueError):
                logger.warning(f"Invalid metric {key}={value!r}, using default {default}")
                result[key] = default
        return result
    
    @staticmethod
    def _extract_region_payload(analysis: Dict[str, Any]) -> Dict[str, Dict]:
        regions_raw = analysis.get("regions") or {}
        heatmaps_raw = analysis.get("heatmaps") or {}
        
        if isinstance(regions_raw, list):
            by_name = {}
            for item in regions_raw:
                name = item.get("region")
                if not name:
                    continue
                by_name[name] = {"metrics": item.get("metrics") or {}}
            regions_raw = by_name
        
        region_payload = {}
        for region_name, metrics in regions_raw.items():
            region_heatmap = heatmaps_raw.get(region_name) or {}
            region_payload[region_name] = {
                "metrics": metrics,
                "heatmap_url": region_heatmap.get("url"),
                "bounding_box": region_heatmap.get("bounding_box"),
            }
        return region_payload
    
    @staticmethod
    def _find_nearby_environment_snapshot(
        db: Session,
        *,
        user_id: int,
        time: datetime,
        window_hours: int = 2,
    ) -> Optional[EnvironmentSnapshot]:
        lower = time - timedelta(hours=window_hours)
        upper = time + timedelta(hours=window_hours)
        return (
            db.query(EnvironmentSnapshot)
            .filter(
                EnvironmentSnapshot.user_id == user_id,
                EnvironmentSnapshot.captured_at >= lower,
                EnvironmentSnapshot.captured_at <= upper,
            )
            .order_by(EnvironmentSnapshot.captured_at.desc())
            .first()
        )
    
    @staticmethod
    def _find_nearby_routine_instance(
        db: Session,
        *,
        user_id: int,
        time: datetime,
        window_hours: int = 4,
    ) -> Optional[RoutineInstance]:
        lower = time - timedelta(hours=window_hours)
        upper = time + timedelta(hours=window_hours)
        return (
            db.query(RoutineInstance)
            .filter(
                RoutineInstance.user_id == user_id,
                RoutineInstance.started_at >= lower,
                RoutineInstance.started_at <= upper,
            )
            .order_by(RoutineInstance.started_at.desc())
            .first()
        )

twin_builder_service = TwinBuilderService()
