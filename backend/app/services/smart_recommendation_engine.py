"""
Smart Product Recommendation Engine — Pellicura's competitive advantage.

Multi-signal scoring that gets smarter with every user:
1. AI Analysis (GPT-4o-mini) — ingredient match to user's skin state
2. Effectiveness Data — real outcomes from users with similar profiles
3. Community Signal — reviews weighted by reviewer similarity
4. Shelf Intelligence — what products work well together
5. Scan Correlation — links product usage to actual skin improvement

This builds our proprietary dataset that no competitor has.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.product_models import Product, ProductEffectiveness, ProductReview
from app.models.scan import ScanSession
from app.models.shelf import ShelfProduct
from app.models.user import UserProfile
from app.services.ai_intelligence_service import ai_recommend_products, _call_openai_json, AIServiceError
from app.core.cache import cache_get, cache_set

logger = logging.getLogger(__name__)


class SmartRecommendationEngine:
    """
    Multi-signal recommendation engine.

    Scoring breakdown:
    - 35% AI ingredient analysis (GPT-4o-mini)
    - 25% Effectiveness data (users with similar skin improved with this product)
    - 20% Community reviews (weighted by skin type similarity)
    - 10% Shelf compatibility (no conflicts with current products)
    - 10% Scan correlation (products associated with score improvements)
    """

    WEIGHT_AI = 0.35
    WEIGHT_EFFECTIVENESS = 0.25
    WEIGHT_COMMUNITY = 0.20
    WEIGHT_SHELF_COMPAT = 0.10
    WEIGHT_SCAN_CORR = 0.10

    def __init__(self, db: Session):
        self.db = db

    async def recommend(
        self,
        user_id: int,
        skin_type: str,
        concerns: List[str],
        products: List[Dict[str, Any]],
        budget: Optional[str] = None,
        max_results: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Generate smart recommendations using all available signals.
        Falls back gracefully if any signal is unavailable.
        """
        cache_key = f"smart_recs:{user_id}:{skin_type}:{','.join(sorted(concerns))}:{len(products)}"
        cached = await cache_get(cache_key)
        if cached:
            return cached

        # Gather all signals in parallel-ready structure
        ai_scores = await self._get_ai_scores(skin_type, concerns, products, budget, max_results)
        effectiveness_scores = self._get_effectiveness_scores(products, skin_type, concerns)
        community_scores = self._get_community_scores(products, skin_type)
        shelf_compat_scores = self._get_shelf_compatibility(user_id, products)
        scan_correlation_scores = self._get_scan_correlations(products, skin_type, concerns)

        # Combine signals into final score
        scored_products = []
        for i, product in enumerate(products[:30]):
            product_id = str(product.get("id", i))

            ai = ai_scores.get(product_id, 50)
            eff = effectiveness_scores.get(product_id, 50)
            comm = community_scores.get(product_id, 50)
            shelf = shelf_compat_scores.get(product_id, 50)
            scan = scan_correlation_scores.get(product_id, 50)

            final_score = (
                ai * self.WEIGHT_AI
                + eff * self.WEIGHT_EFFECTIVENESS
                + comm * self.WEIGHT_COMMUNITY
                + shelf * self.WEIGHT_SHELF_COMPAT
                + scan * self.WEIGHT_SCAN_CORR
            )

            # Build explanation showing which signals contributed
            signals = []
            if ai > 70:
                signals.append("Strong ingredient match")
            if eff > 70:
                signals.append("Proven effective for similar skin")
            if comm > 70:
                signals.append("Highly rated by similar users")
            if shelf > 70:
                signals.append("Compatible with your current products")
            if scan > 70:
                signals.append("Users saw score improvements")

            product_copy = dict(product)
            product_copy["smart_score"] = round(final_score, 1)
            product_copy["score_breakdown"] = {
                "ai_analysis": round(ai, 1),
                "effectiveness": round(eff, 1),
                "community": round(comm, 1),
                "shelf_compatibility": round(shelf, 1),
                "scan_correlation": round(scan, 1),
            }
            product_copy["why_recommended"] = signals[:3] if signals else ["General match for your skin type"]
            scored_products.append(product_copy)

        # Sort by final score and return top N
        scored_products.sort(key=lambda p: p["smart_score"], reverse=True)
        result = scored_products[:max_results]

        await cache_set(cache_key, result, ttl=600)
        return result

    async def _get_ai_scores(
        self,
        skin_type: str,
        concerns: List[str],
        products: List[Dict[str, Any]],
        budget: Optional[str],
        max_results: int,
    ) -> Dict[str, float]:
        """Signal 1: AI ingredient analysis via GPT-4o-mini."""
        scores = {}
        try:
            ai_results = await ai_recommend_products(
                skin_type=skin_type,
                concerns=concerns,
                products=products,
                budget=budget,
                max_results=max_results * 2,  # Get more for scoring
            )
            for item in ai_results:
                pid = str(item.get("id", item.get("product_id", "")))
                scores[pid] = item.get("ai_score", item.get("score", 50))
        except Exception as e:
            logger.warning("AI scoring failed, using defaults: %s", e)
        return scores

    def _get_effectiveness_scores(
        self,
        products: List[Dict[str, Any]],
        skin_type: str,
        concerns: List[str],
    ) -> Dict[str, float]:
        """
        Signal 2: How effective is this product for users with similar skin?
        Queries ProductEffectiveness table for real outcome data.
        """
        scores = {}
        try:
            product_ids = [p.get("id") for p in products if p.get("id")]
            if not product_ids:
                return scores

            # Query effectiveness data for similar users
            records = (
                self.db.query(
                    ProductEffectiveness.product_id,
                    func.avg(ProductEffectiveness.overall_improvement).label("avg_improvement"),
                    func.count(ProductEffectiveness.id).label("data_points"),
                    func.avg(
                        func.cast(ProductEffectiveness.would_repurchase, Integer)
                    ).label("repurchase_rate"),
                )
                .filter(
                    ProductEffectiveness.product_id.in_(product_ids),
                    ProductEffectiveness.skin_type == skin_type,
                    ProductEffectiveness.confidence >= 0.3,
                )
                .group_by(ProductEffectiveness.product_id)
                .all()
            )

            for r in records:
                pid = str(r.product_id)
                avg_imp = float(r.avg_improvement or 0)
                data_pts = int(r.data_points or 0)
                repurchase = float(r.repurchase_rate or 0.5) if r.repurchase_rate else 0.5

                # Score: improvement + repurchase rate, weighted by data confidence
                data_confidence = min(1.0, data_pts / 10)
                raw_score = 50 + (avg_imp * 2) + (repurchase * 30)
                scores[pid] = max(0, min(100, raw_score)) * data_confidence + 50 * (1 - data_confidence)

        except Exception as e:
            logger.warning("Effectiveness scoring failed: %s", e)
        return scores

    def _get_community_scores(
        self,
        products: List[Dict[str, Any]],
        skin_type: str,
    ) -> Dict[str, float]:
        """
        Signal 3: Community reviews weighted by skin type similarity.
        Reviews from users with same skin type count more.
        """
        scores = {}
        try:
            product_ids = [p.get("id") for p in products if p.get("id")]
            if not product_ids:
                return scores

            # Get reviews grouped by product, prioritize same skin type
            reviews = (
                self.db.query(
                    ProductReview.product_id,
                    ProductReview.rating,
                    ProductReview.skin_type,
                    ProductReview.would_recommend,
                )
                .filter(ProductReview.product_id.in_(product_ids))
                .all()
            )

            # Group by product
            product_reviews: Dict[str, list] = {}
            for r in reviews:
                pid = str(r.product_id)
                if pid not in product_reviews:
                    product_reviews[pid] = []
                product_reviews[pid].append(r)

            for pid, revs in product_reviews.items():
                total_weight = 0
                weighted_sum = 0
                for r in revs:
                    # Same skin type = weight 2x, different = weight 1x
                    weight = 2.0 if r.skin_type == skin_type else 1.0
                    rating_score = (r.rating / 5) * 100 if r.rating else 50
                    weighted_sum += rating_score * weight
                    total_weight += weight

                if total_weight > 0:
                    scores[pid] = weighted_sum / total_weight

        except Exception as e:
            logger.warning("Community scoring failed: %s", e)
        return scores

    def _get_shelf_compatibility(
        self,
        user_id: int,
        products: List[Dict[str, Any]],
    ) -> Dict[str, float]:
        """
        Signal 4: How compatible is this product with user's current shelf?
        Checks for ingredient conflicts and synergies.
        """
        scores = {}
        try:
            # Get user's current shelf product ingredients
            shelf_items = (
                self.db.query(ShelfProduct)
                .filter(ShelfProduct.user_id == user_id, ShelfProduct.status == "active")
                .limit(20)
                .all()
            )

            shelf_ingredients = set()
            for sp in shelf_items:
                if hasattr(sp, "ingredients_json") and sp.ingredients_json:
                    ings = sp.ingredients_json.get("ingredients", [])
                    shelf_ingredients.update(i.lower() for i in ings if isinstance(i, str))

            # Known conflict pairs
            CONFLICTS = {
                "retinol": {"glycolic acid", "salicylic acid", "benzoyl peroxide", "aha", "bha"},
                "vitamin c": {"benzoyl peroxide"},
                "aha": {"bha"},
            }

            # Known synergy pairs
            SYNERGIES = {
                "hyaluronic acid": {"ceramide", "glycerin", "squalane"},
                "niacinamide": {"zinc", "hyaluronic acid"},
                "vitamin c": {"vitamin e", "ferulic acid"},
            }

            for product in products:
                pid = str(product.get("id", ""))
                product_ings = set()
                key_ings = product.get("key_ingredients", []) or product.get("ingredients", [])
                product_ings.update(i.lower() for i in key_ings if isinstance(i, str))

                score = 70  # Neutral starting point

                # Check conflicts
                for ing in product_ings:
                    for conflict_key, conflict_set in CONFLICTS.items():
                        if conflict_key in ing and any(c in " ".join(shelf_ingredients) for c in conflict_set):
                            score -= 20
                        if ing in conflict_set and any(conflict_key in s for s in shelf_ingredients):
                            score -= 20

                # Check synergies
                for ing in product_ings:
                    for synergy_key, synergy_set in SYNERGIES.items():
                        if synergy_key in ing and any(s in " ".join(shelf_ingredients) for s in synergy_set):
                            score += 10
                        if ing in synergy_set and any(synergy_key in s for s in shelf_ingredients):
                            score += 10

                scores[pid] = max(0, min(100, score))

        except Exception as e:
            logger.warning("Shelf compatibility scoring failed: %s", e)
        return scores

    def _get_scan_correlations(
        self,
        products: List[Dict[str, Any]],
        skin_type: str,
        concerns: List[str],
    ) -> Dict[str, float]:
        """
        Signal 5: Products correlated with scan score improvements.
        Checks if users who used this product saw their scores improve.
        """
        scores = {}
        try:
            product_ids = [p.get("id") for p in products if p.get("id")]
            if not product_ids:
                return scores

            # Get products with positive improvement records
            positive_products = (
                self.db.query(
                    ProductEffectiveness.product_id,
                    func.avg(ProductEffectiveness.overall_improvement).label("avg_imp"),
                    func.count(ProductEffectiveness.id).label("count"),
                )
                .filter(
                    ProductEffectiveness.product_id.in_(product_ids),
                    ProductEffectiveness.overall_improvement > 0,
                )
                .group_by(ProductEffectiveness.product_id)
                .all()
            )

            for r in positive_products:
                pid = str(r.product_id)
                avg_imp = float(r.avg_imp or 0)
                count = int(r.count or 0)
                # Score based on improvement magnitude and data confidence
                confidence = min(1.0, count / 5)
                scores[pid] = min(100, 50 + avg_imp * 3 * confidence)

        except Exception as e:
            logger.warning("Scan correlation scoring failed: %s", e)
        return scores


# =============================================================================
# AUTO-TRACK PRODUCT EFFECTIVENESS
# =============================================================================


from sqlalchemy import Integer


def auto_track_effectiveness(
    db: Session,
    user_id: int,
    scan_session: Any,
) -> None:
    """
    Automatically called after every scan to track product effectiveness.
    Links active shelf products to skin score changes.
    This is what builds our proprietary dataset over time.
    """
    try:
        # Get active shelf products
        shelf_items = (
            db.query(ShelfProduct)
            .filter(ShelfProduct.user_id == user_id, ShelfProduct.status == "active")
            .all()
        )
        if not shelf_items:
            return

        # Get current scan scores
        current_analysis = getattr(scan_session, "analysis_result", None)
        if not current_analysis or not isinstance(current_analysis, dict):
            return
        current_scores = current_analysis.get("summary", {}).get("scores", {})
        current_overall = current_analysis.get("summary", {}).get("overall_score", 0)
        if not current_scores:
            return

        # Get previous scan for comparison
        previous_scan = (
            db.query(ScanSession)
            .filter(
                ScanSession.user_id == user_id,
                ScanSession.id != scan_session.id,
            )
            .order_by(ScanSession.created_at.desc())
            .first()
        )
        if not previous_scan:
            return

        prev_analysis = getattr(previous_scan, "analysis_result", None)
        if not prev_analysis or not isinstance(prev_analysis, dict):
            return
        prev_scores = prev_analysis.get("summary", {}).get("scores", {})
        prev_overall = prev_analysis.get("summary", {}).get("overall_score", 0)
        if not prev_scores:
            return

        # Calculate days between scans
        days_between = 1
        if scan_session.created_at and previous_scan.created_at:
            days_between = max(1, (scan_session.created_at - previous_scan.created_at).days)

        # Get user profile
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        user_skin_type = getattr(profile, "skin_type", None) if profile else None
        user_age = getattr(profile, "age", None) if profile else None
        user_concerns = getattr(profile, "skin_concerns", None) if profile else None

        # Age group
        age_group = None
        if user_age:
            if user_age < 20:
                age_group = "teens"
            elif user_age < 30:
                age_group = "20s"
            elif user_age < 40:
                age_group = "30s"
            elif user_age < 50:
                age_group = "40s"
            else:
                age_group = "50+"

        # Score delta
        delta = {}
        for metric in set(list(current_scores.keys()) + list(prev_scores.keys())):
            curr = current_scores.get(metric, 0)
            prev = prev_scores.get(metric, 0)
            if curr and prev:
                delta[metric] = round(curr - prev, 1)

        overall_improvement = current_overall - prev_overall

        # Confidence: higher if more days between scans (more reliable change)
        confidence = min(1.0, days_between / 14)  # Max confidence at 2+ weeks

        # Create effectiveness record for each active shelf product
        other_product_names = [getattr(sp, "product_name", "") for sp in shelf_items]

        for sp in shelf_items:
            if not hasattr(sp, "product_id") or not sp.product_id:
                continue

            # Calculate days used (from shelf opened_date to now)
            days_used = days_between
            if hasattr(sp, "opened_date") and sp.opened_date:
                days_used = max(1, (datetime.utcnow() - sp.opened_date).days)

            record = ProductEffectiveness(
                user_id=user_id,
                product_id=sp.product_id,
                skin_type=user_skin_type,
                age_group=age_group,
                primary_concerns=user_concerns,
                climate=getattr(profile, "climate", None) if profile else None,
                score_before=prev_scores,
                score_after=current_scores,
                score_delta=delta,
                days_used=days_used,
                used_with_products=[n for n in other_product_names if n != getattr(sp, "product_name", "")],
                scan_before_id=previous_scan.id,
                scan_after_id=scan_session.id,
                overall_improvement=overall_improvement,
                would_repurchase=getattr(sp, "would_repurchase", None),
                user_rating=None,
                measurement_type="auto",
                confidence=confidence,
            )
            db.add(record)

        db.commit()
        logger.info("Tracked effectiveness for %d products, user %d", len(shelf_items), user_id)

    except Exception as e:
        logger.warning("Auto-track effectiveness failed: %s", e)
        try:
            db.rollback()
        except Exception:
            pass
