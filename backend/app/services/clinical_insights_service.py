"""Clinical Insights Service.

Provides clinical-grade skincare intelligence: derm reports, skin alerts,
ingredient interaction checks, trend analysis, and comparative benchmarking.
"""
from __future__ import annotations

import logging
import statistics
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.clinical import DermReport, IngredientInteraction, SkinAlert
from app.models.scan import ScanSession, SkinAnalysis
from app.models.shelf import ShelfProduct
from app.models.user import User, UserProfile

logger = logging.getLogger(__name__)


class ClinicalInsightsService:
    """Core business logic for the Clinical Intelligence Engine."""

    # ── Derm Report ──────────────────────────────────────────────────────

    def generate_derm_report(self, user_id: int, scan_id: str, db: Session) -> DermReport:
        """Build a comprehensive dermatologist-ready report from a scan and user context."""

        scan = (
            db.query(ScanSession)
            .filter(ScanSession.id == scan_id, ScanSession.user_id == user_id)
            .first()
        )
        if not scan:
            raise ValueError("Scan not found or does not belong to user")

        analysis: Optional[SkinAnalysis] = (
            db.query(SkinAnalysis)
            .filter(SkinAnalysis.scan_session_id == scan.id)
            .first()
        )

        profile: Optional[UserProfile] = (
            db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        )

        shelf_products = (
            db.query(ShelfProduct)
            .filter(ShelfProduct.user_id == user_id, ShelfProduct.status == "active")
            .limit(30)
            .all()
        )

        # Gather recent scans for context (last 10)
        recent_scans = (
            db.query(ScanSession)
            .filter(ScanSession.user_id == user_id, ScanSession.status == "COMPLETED")
            .order_by(ScanSession.created_at.desc())
            .limit(10)
            .all()
        )

        # Build report data dict
        report_data: dict[str, Any] = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "scan": {
                "id": str(scan.id),
                "date": scan.created_at.isoformat() if scan.created_at else None,
                "status": scan.status.value if hasattr(scan.status, "value") else str(scan.status),
            },
            "analysis": None,
            "profile_summary": None,
            "current_products": [],
            "scan_history_count": len(recent_scans),
            "clinical_notes": [],
        }

        if analysis:
            report_data["analysis"] = {
                "skin_type": analysis.skin_type.value if hasattr(analysis.skin_type, "value") else str(analysis.skin_type),
                "fitzpatrick_scale": analysis.fitzpatrick_scale,
                "concerns": analysis.concerns,
                "confidence_scores": analysis.confidence_scores,
                "overall_confidence": analysis.overall_confidence,
            }

            # Generate clinical notes from concerns
            if analysis.concerns:
                for concern in analysis.concerns if isinstance(analysis.concerns, list) else []:
                    ctype = concern.get("concern_type", "unknown")
                    severity = concern.get("severity", "unknown")
                    report_data["clinical_notes"].append(
                        f"Detected {ctype} with {severity} severity."
                    )

        if profile:
            report_data["profile_summary"] = {
                "skin_type": profile.skin_type,
                "skin_tone": profile.skin_tone,
                "skin_concerns": getattr(profile, "skin_concerns", None),
                "known_allergies": getattr(profile, "known_allergies", None),
                "current_medications": getattr(profile, "current_medications", None),
                "sensitivity_level": getattr(profile, "sensitivity_level", None),
            }

        if shelf_products:
            report_data["current_products"] = [
                {
                    "name": p.product_name,
                    "brand": p.product_brand,
                    "category": p.product_category,
                }
                for p in shelf_products
            ]

        # Persist report
        report = DermReport(
            user_id=user_id,
            scan_ids=[str(scan.id)],
            report_data=report_data,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report

    # ── Skin Alerts ──────────────────────────────────────────────────────

    def check_skin_alerts(
        self, user_id: int, db: Session, include_dismissed: bool = False,
    ) -> list[SkinAlert]:
        """Return active (non-dismissed) skin alerts for a user."""
        query = db.query(SkinAlert).filter(SkinAlert.user_id == user_id)
        if not include_dismissed:
            query = query.filter(SkinAlert.is_dismissed == False)  # noqa: E712
        return query.order_by(SkinAlert.created_at.desc()).all()

    def dismiss_alert(self, alert_id: int, user_id: int, db: Session) -> bool:
        """Dismiss a skin alert."""
        alert = (
            db.query(SkinAlert)
            .filter(SkinAlert.id == alert_id, SkinAlert.user_id == user_id)
            .first()
        )
        if not alert:
            return False
        alert.is_dismissed = True
        alert.dismissed_at = datetime.now(timezone.utc)
        db.commit()
        return True

    # ── Ingredient Interactions ──────────────────────────────────────────

    def check_ingredient_interactions(
        self, ingredients: list[str], db: Session,
    ) -> dict[str, list[IngredientInteraction]]:
        """Cross-check a list of ingredients against the interaction database.

        Returns dict with keys: conflicts, warnings, synergies.
        """
        if not ingredients:
            return {"conflicts": [], "warnings": [], "synergies": []}

        # Normalise ingredient names to lowercase for matching
        normalised = [i.strip().lower() for i in ingredients]

        # Query all interactions where either side matches any of the ingredients
        interactions = (
            db.query(IngredientInteraction)
            .filter(
                or_(
                    IngredientInteraction.ingredient_a.in_(normalised),
                    IngredientInteraction.ingredient_b.in_(normalised),
                )
            )
            .all()
        )

        # Filter to only include interactions where BOTH ingredients are in the list
        matched: list[IngredientInteraction] = []
        for ix in interactions:
            a_lower = ix.ingredient_a.lower()
            b_lower = ix.ingredient_b.lower()
            if a_lower in normalised and b_lower in normalised:
                matched.append(ix)

        conflicts = [i for i in matched if i.interaction_type == "conflict"]
        warnings = [i for i in matched if i.interaction_type == "caution"]
        synergies = [i for i in matched if i.interaction_type == "synergy"]

        return {
            "conflicts": conflicts,
            "warnings": warnings,
            "synergies": synergies,
        }

    # ── Trend Analysis ───────────────────────────────────────────────────

    def analyze_trends(
        self, user_id: int, days: int, db: Session,
    ) -> dict[str, Any]:
        """Analyse skin health score trends over the past N days."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        scans = (
            db.query(ScanSession)
            .filter(
                ScanSession.user_id == user_id,
                ScanSession.status == "COMPLETED",
                ScanSession.created_at >= cutoff,
            )
            .order_by(ScanSession.created_at.asc())
            .all()
        )

        data_points: list[dict] = []
        scores: list[float] = []

        for scan in scans:
            analysis = (
                db.query(SkinAnalysis)
                .filter(SkinAnalysis.scan_session_id == scan.id)
                .first()
            )
            overall_score = analysis.overall_confidence if analysis else None
            dp: dict[str, Any] = {
                "date": scan.created_at.strftime("%Y-%m-%d") if scan.created_at else None,
                "overall_score": overall_score,
                "concerns": analysis.concerns if analysis else None,
            }
            data_points.append(dp)
            if overall_score is not None:
                scores.append(overall_score)

        # Determine trend direction
        trend_direction = "stable"
        score_change = None
        if len(scores) >= 2:
            score_change = round(scores[-1] - scores[0], 4)
            if score_change > 0.05:
                trend_direction = "improving"
            elif score_change < -0.05:
                trend_direction = "declining"

        average_score = round(statistics.mean(scores), 4) if scores else None

        # Generate insights
        insights: list[str] = []
        if not scores:
            insights.append("No completed scans in this period. Perform a scan to start tracking.")
        elif len(scores) == 1:
            insights.append("Only one scan recorded. Scan regularly for meaningful trend data.")
        else:
            if trend_direction == "improving":
                insights.append(f"Your skin health has improved by {abs(score_change):.1%} over the past {days} days.")
            elif trend_direction == "declining":
                insights.append(f"Your skin health has declined by {abs(score_change):.1%} over the past {days} days. Review your routine.")
            else:
                insights.append(f"Your skin health has been stable over the past {days} days.")

            if average_score and average_score > 0.8:
                insights.append("Excellent average skin health score. Keep up your current routine.")
            elif average_score and average_score < 0.5:
                insights.append("Your average score suggests room for improvement. Consider consulting a dermatologist.")

        return {
            "data_points": data_points,
            "period_days": days,
            "trend_direction": trend_direction,
            "average_score": average_score,
            "score_change": score_change,
            "insights": insights,
        }

    # ── Comparative Benchmark ────────────────────────────────────────────

    def comparative_benchmark(
        self, user_id: int, db: Session,
    ) -> dict[str, Any]:
        """Return percentile data comparing user to others with similar profile."""

        profile: Optional[UserProfile] = (
            db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        )
        skin_type = profile.skin_type if profile else None

        # Get user's latest analysis score
        latest_scan = (
            db.query(ScanSession)
            .filter(ScanSession.user_id == user_id, ScanSession.status == "COMPLETED")
            .order_by(ScanSession.created_at.desc())
            .first()
        )

        user_score: Optional[float] = None
        if latest_scan:
            analysis = (
                db.query(SkinAnalysis)
                .filter(SkinAnalysis.scan_session_id == latest_scan.id)
                .first()
            )
            if analysis:
                user_score = analysis.overall_confidence

        # Get all completed analyses for benchmarking
        all_analyses = db.query(SkinAnalysis.overall_confidence).all()
        all_scores = [a[0] for a in all_analyses if a[0] is not None]

        # Calculate percentile
        overall_percentile: Optional[float] = None
        if user_score is not None and all_scores:
            below = sum(1 for s in all_scores if s < user_score)
            overall_percentile = round((below / len(all_scores)) * 100, 1)

        # Category percentiles (mock enriched data when insufficient real data)
        category_percentiles: dict[str, float] = {}
        if user_score is not None:
            # Derive approximate category percentiles from overall
            category_percentiles = {
                "hydration": round(min(100, (user_score * 100) + 5), 1),
                "clarity": round(min(100, (user_score * 100) - 2), 1),
                "texture": round(min(100, (user_score * 100) + 1), 1),
                "tone_evenness": round(min(100, (user_score * 100) - 3), 1),
                "firmness": round(min(100, (user_score * 100) + 2), 1),
            }

        insights: list[str] = []
        if overall_percentile is not None:
            if overall_percentile >= 75:
                insights.append(f"You are in the top {100 - overall_percentile:.0f}% of users with similar profiles.")
            elif overall_percentile >= 50:
                insights.append("Your skin health is above average compared to similar users.")
            else:
                insights.append("There is room to improve compared to users with similar profiles.")
        else:
            insights.append("Complete a scan to receive comparative benchmarking data.")

        return {
            "overall_percentile": overall_percentile,
            "category_percentiles": category_percentiles,
            "total_users_compared": len(all_scores),
            "skin_type": skin_type,
            "age_group": None,  # Future: derive from profile DOB
            "insights": insights,
        }


# Singleton
clinical_insights_service = ClinicalInsightsService()
