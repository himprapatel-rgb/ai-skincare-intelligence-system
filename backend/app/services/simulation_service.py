"""
Digital Twin Simulation Service.
Sprint: Final Features - Trend-based what-if predictions
"""
import logging
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.twin_models import SkinStateSnapshot

logger = logging.getLogger(__name__)

# Ingredient effects on skin metrics (per week of use)
INGREDIENT_EFFECTS = {
    "hyaluronic_acid": {"hydration": 0.05, "wrinkles": -0.02},
    "salicylic_acid": {"acne": -0.08, "oiliness": -0.03},
    "benzoyl_peroxide": {"acne": -0.10, "redness": 0.02},
    "retinol": {"wrinkles": -0.06, "dark_spots": -0.04, "acne": -0.03},
    "retinoid": {"wrinkles": -0.06, "dark_spots": -0.04, "acne": -0.03},
    "niacinamide": {"oiliness": -0.04, "redness": -0.03, "dark_spots": -0.02},
    "vitamin_c": {"dark_spots": -0.05, "brightness": 0.04},
    "ascorbic_acid": {"dark_spots": -0.05, "brightness": 0.04},
    "glycolic_acid": {"texture": -0.04, "dark_spots": -0.03},
    "lactic_acid": {"hydration": 0.03, "texture": -0.03},
    "azelaic_acid": {"acne": -0.05, "redness": -0.04},
    "centella": {"redness": -0.04, "hydration": 0.02},
    "ceramide": {"hydration": 0.06, "barrier": 0.04},
    "peptide": {"wrinkles": -0.03, "firmness": 0.03},
    "squalane": {"hydration": 0.04, "oiliness": -0.01},
    "zinc": {"acne": -0.04, "oiliness": -0.03},
    "tea_tree": {"acne": -0.05},
    "aloe": {"redness": -0.02, "hydration": 0.02},
    "snail_mucin": {"hydration": 0.04, "texture": -0.02},
    "sunscreen": {"dark_spots": -0.02, "wrinkles": -0.01},
    "spf": {"dark_spots": -0.02, "wrinkles": -0.01},
    "bakuchiol": {"wrinkles": -0.04, "firmness": 0.03},
    "tranexamic_acid": {"dark_spots": -0.06, "redness": -0.02},
    "arbutin": {"dark_spots": -0.04},
    "kojic_acid": {"dark_spots": -0.05},
    "ferulic_acid": {"dark_spots": -0.03, "wrinkles": -0.02},
    "madecassoside": {"redness": -0.03, "barrier": 0.03},
    "panthenol": {"hydration": 0.04, "barrier": 0.03},
    "allantoin": {"redness": -0.02, "hydration": 0.02},
    "urea": {"hydration": 0.05, "texture": -0.03},
    "bentonite": {"oiliness": -0.05},
    "kaolin": {"oiliness": -0.04},
    "sulfur": {"acne": -0.06, "oiliness": -0.03},
}

# Ingredient SYNERGIES — pairs that work better together
INGREDIENT_SYNERGIES = {
    ("vitamin_c", "vitamin_e"): {"dark_spots": -0.03, "wrinkles": -0.02},  # antioxidant boost
    ("vitamin_c", "ferulic_acid"): {"dark_spots": -0.04},  # stabilized C
    ("niacinamide", "zinc"): {"oiliness": -0.03, "acne": -0.03},  # oil control
    ("hyaluronic_acid", "ceramide"): {"hydration": 0.04, "barrier": 0.03},  # hydration lock
    ("retinol", "peptide"): {"wrinkles": -0.04, "firmness": 0.03},  # anti-aging
    ("centella", "panthenol"): {"redness": -0.03, "barrier": 0.03},  # soothing
    ("salicylic_acid", "niacinamide"): {"acne": -0.04, "pores": -0.03},  # acne + pores
}

# Ingredient CONFLICTS — pairs that cancel or irritate
INGREDIENT_CONFLICTS = {
    ("retinol", "glycolic_acid"): "sensitization",
    ("retinol", "salicylic_acid"): "irritation_risk",
    ("retinol", "benzoyl_peroxide"): "deactivation",
    ("vitamin_c", "benzoyl_peroxide"): "oxidation",
    ("glycolic_acid", "lactic_acid"): "over_exfoliation",
    ("azelaic_acid", "glycolic_acid"): "pH_conflict",
}

# Environmental impact factors on skin metrics (per day of exposure)
ENVIRONMENTAL_EFFECTS = {
    "high_uv": {"dark_spots": 0.01, "wrinkles": 0.005, "redness": 0.008},
    "low_humidity": {"hydration": -0.02, "barrier": -0.01},
    "high_humidity": {"oiliness": 0.01, "acne": 0.005},
    "cold_temp": {"redness": 0.008, "hydration": -0.015},
    "hot_temp": {"oiliness": 0.01, "redness": 0.005},
    "high_pollution": {"dark_spots": 0.008, "acne": 0.005, "texture": 0.005},
}


class SimulationService:
    """Service for simulating future skin states."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_historical_snapshots(
        self, 
        user_id: int, 
        days: int = 30
    ) -> List[SkinStateSnapshot]:
        """Get user's historical snapshots."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        return self.db.query(SkinStateSnapshot).filter(
            SkinStateSnapshot.user_id == user_id,
            SkinStateSnapshot.recorded_at >= cutoff,
        ).order_by(SkinStateSnapshot.recorded_at.asc()).all()
    
    def calculate_trends(
        self, 
        snapshots: List[SkinStateSnapshot]
    ) -> Dict[str, float]:
        """
        Calculate trend (slope) for each metric using simple linear regression.
        Returns change per day.
        """
        if len(snapshots) < 2:
            return {}
        
        trends = {}
        metrics = ["hydration", "oiliness", "acne", "wrinkles", "dark_spots", "redness"]
        
        # Get time differences in days
        first_time = snapshots[0].recorded_at
        times = [(s.recorded_at - first_time).total_seconds() / 86400 for s in snapshots]
        
        for metric in metrics:
            values = []
            valid_times = []
            for i, s in enumerate(snapshots):
                val = getattr(s, metric, None)
                if val is None and hasattr(s, 'state_vector') and s.state_vector:
                    val = s.state_vector.get(metric)
                if val is not None:
                    values.append(val)
                    valid_times.append(times[i])
            
            # Simple linear regression on valid data points only
            n = len(valid_times)
            if n < 2:
                continue

            sum_x = sum(valid_times)
            sum_y = sum(values)
            sum_xy = sum(t * v for t, v in zip(valid_times, values))
            sum_xx = sum(t * t for t in valid_times)
            
            denominator = n * sum_xx - sum_x * sum_x
            if abs(denominator) < 0.0001:
                trends[metric] = 0.0
            else:
                slope = (n * sum_xy - sum_x * sum_y) / denominator
                trends[metric] = slope
        
        return trends
    
    def get_product_effects(
        self, 
        product_ingredients: List[str]
    ) -> Dict[str, float]:
        """
        Map product ingredients to their effects on skin metrics.
        Returns aggregated effects per week.
        """
        effects = {}
        
        for ingredient in product_ingredients:
            # Normalize ingredient name
            ing_lower = ingredient.lower().replace(" ", "_").replace("-", "_")

            # Word boundary matching to prevent false positives
            # e.g., "acid" should NOT match "salicylic_acid"
            for key, effect_map in INGREDIENT_EFFECTS.items():
                if re.search(rf'(?:^|_){re.escape(key)}(?:_|$)', ing_lower) or re.search(rf'(?:^|_){re.escape(ing_lower)}(?:_|$)', key):
                    for metric, effect in effect_map.items():
                        if metric not in effects:
                            effects[metric] = 0.0
                        effects[metric] += effect
        
        return effects
    
    def project_scores(
        self,
        current_scores: Dict[str, float],
        trends: Dict[str, float],
        product_effects: Dict[str, float],
        weeks: int
    ) -> Dict[str, float]:
        """
        Project future scores based on trends and product effects.
        Applies diminishing returns and caps.

        Effects are fractional changes per week (e.g., 0.05 = 5% improvement).
        Score scale is 0-100. A 0.05 effect on a score of 50 means +2.5 per week.
        """
        projected = {}
        days = weeks * 7

        for metric, current in current_scores.items():
            # Base projection from trend (trend is per-day change in score points)
            trend = trends.get(metric, 0.0)
            trend_change = trend * days

            # Product effect (fractional per week, with diminishing returns)
            # effect=0.05 means 5% of current score improvement per week
            effect = product_effects.get(metric, 0.0)
            total_effect = 0.0
            for w in range(weeks):
                diminish_factor = max(0.2, 1.0 - (w * 0.2))
                # Apply effect as percentage of current score, not raw multiplication
                total_effect += effect * current * diminish_factor

            # Calculate new value
            new_value = current + trend_change + total_effect

            # Apply bounds (0-100 for most metrics)
            projected[metric] = round(max(0, min(100, new_value)), 1)

        return projected
    
    def calculate_confidence(
        self,
        snapshots: List[SkinStateSnapshot],
        weeks: int
    ) -> float:
        """
        Calculate confidence score for the prediction.
        Factors: data quantity, data time span, and projection distance.
        """
        if not snapshots:
            return 0.0

        # Data quantity factor (max at 10 snapshots)
        quantity_factor = min(1.0, len(snapshots) / 10)

        # Data time span factor (30+ days of data = full confidence)
        if len(snapshots) >= 2:
            days_span = (snapshots[-1].recorded_at - snapshots[0].recorded_at).total_seconds() / 86400
            span_factor = min(1.0, days_span / 30)
        else:
            span_factor = 0.3

        # Projection distance factor (further out = less confident)
        time_factor = max(0.3, 1.0 - (weeks * 0.08))

        return round(quantity_factor * span_factor * time_factor, 2)
    
    def simulate(
        self,
        user_id: int,
        product_ingredients: List[str],
        simulation_weeks: int = 4
    ) -> Dict[str, Any]:
        """
        Run a complete simulation.
        
        Returns projected scores, confidence, and analysis.
        """
        # Get historical data
        snapshots = self.get_historical_snapshots(user_id, days=60)
        
        # Use default baseline if no snapshots available
        if snapshots:
            latest = snapshots[-1]
            current_scores = {
                "hydration": getattr(latest, 'hydration_level', 50) or 50,
                "oiliness": getattr(latest, 'oil_level', 50) or 50,
                "acne": getattr(latest, 'acne_severity', 30) or 30,
                "wrinkles": getattr(latest, 'wrinkle_severity', 25) or 25,
                "dark_spots": getattr(latest, 'pigmentation_severity', 20) or 20,
                "redness": getattr(latest, 'redness_severity', 30) or 30,
            }
        else:
            # Default baseline scores for new users
            current_scores = {
                "hydration": 50,
                "oiliness": 50,
                "acne": 30,
                "wrinkles": 25,
                "dark_spots": 20,
                "redness": 30,
            }
        
        # Calculate trends
        trends = self.calculate_trends(snapshots)
        
        # Get product effects
        effects = self.get_product_effects(product_ingredients)
        
        # Project future scores
        projected = self.project_scores(
            current_scores, 
            trends, 
            effects, 
            simulation_weeks
        )
        
        # Calculate confidence
        confidence = self.calculate_confidence(snapshots, simulation_weeks)
        
        # Calculate expected changes
        changes = {
            metric: round(projected[metric] - current_scores[metric], 1)
            for metric in current_scores
        }
        
        # Generate summary
        improvements = [m for m, c in changes.items() if c < -5]  # Lower is better for concerns
        concerns = [m for m, c in changes.items() if c > 5]
        
        return {
            "current_scores": current_scores,
            "projected_scores": projected,
            "changes": changes,
            "confidence": confidence,
            "simulation_weeks": simulation_weeks,
            "improvements": improvements,
            "concerns": concerns,
            "product_effects_detected": list(effects.keys()),
        }

    def get_synergy_effects(
        self,
        product_ingredients: List[str],
    ) -> Dict[str, float]:
        """Calculate bonus effects from ingredient synergies across products."""
        effects = {}
        normalized = [i.lower().replace(" ", "_").replace("-", "_") for i in product_ingredients]

        for (ing1, ing2), synergy_effects in INGREDIENT_SYNERGIES.items():
            found1 = any(ing1 in n or n in ing1 for n in normalized)
            found2 = any(ing2 in n or n in ing2 for n in normalized)
            if found1 and found2:
                for metric, effect in synergy_effects.items():
                    effects[metric] = effects.get(metric, 0.0) + effect
        return effects

    def detect_conflicts(
        self,
        product_ingredients: List[str],
    ) -> List[Dict[str, str]]:
        """Detect ingredient conflicts across all products."""
        conflicts = []
        normalized = [i.lower().replace(" ", "_").replace("-", "_") for i in product_ingredients]

        for (ing1, ing2), conflict_type in INGREDIENT_CONFLICTS.items():
            found1 = any(ing1 in n or n in ing1 for n in normalized)
            found2 = any(ing2 in n or n in ing2 for n in normalized)
            if found1 and found2:
                conflicts.append({
                    "ingredient_1": ing1,
                    "ingredient_2": ing2,
                    "conflict_type": conflict_type,
                })
        return conflicts

    def apply_environmental_effects(
        self,
        current_scores: Dict[str, float],
        env_conditions: Dict[str, Any],
        days: int = 7,
    ) -> Dict[str, float]:
        """Apply environmental impact factors to skin predictions."""
        env_effects = {}
        uv = env_conditions.get("uv_index", 0)
        humidity = env_conditions.get("humidity_percent", 50)
        temp = env_conditions.get("temperature_celsius", 20)
        aqi = env_conditions.get("air_quality_index", 50)

        if uv and uv > 5:
            for metric, effect in ENVIRONMENTAL_EFFECTS["high_uv"].items():
                env_effects[metric] = env_effects.get(metric, 0.0) + effect * days * (uv / 10)
        if humidity and humidity < 30:
            for metric, effect in ENVIRONMENTAL_EFFECTS["low_humidity"].items():
                env_effects[metric] = env_effects.get(metric, 0.0) + effect * days
        if humidity and humidity > 70:
            for metric, effect in ENVIRONMENTAL_EFFECTS["high_humidity"].items():
                env_effects[metric] = env_effects.get(metric, 0.0) + effect * days
        if temp and temp < 5:
            for metric, effect in ENVIRONMENTAL_EFFECTS["cold_temp"].items():
                env_effects[metric] = env_effects.get(metric, 0.0) + effect * days
        if temp and temp > 30:
            for metric, effect in ENVIRONMENTAL_EFFECTS["hot_temp"].items():
                env_effects[metric] = env_effects.get(metric, 0.0) + effect * days
        if aqi and aqi > 100:
            for metric, effect in ENVIRONMENTAL_EFFECTS["high_pollution"].items():
                env_effects[metric] = env_effects.get(metric, 0.0) + effect * days * (aqi / 200)

        adjusted = {}
        for metric, current in current_scores.items():
            # Environmental effects are fractional — apply as % of current score
            env_impact = env_effects.get(metric, 0.0) * current
            adjusted[metric] = round(max(0, min(100, current + env_impact)), 1)
        return adjusted

    def simulate_advanced(
        self,
        user_id: int,
        product_ingredients: List[str],
        simulation_weeks: int = 4,
        environmental_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Advanced simulation with synergies, conflicts, and environmental factors.
        This builds our proprietary prediction dataset.
        """
        base_result = self.simulate(user_id, product_ingredients, simulation_weeks)

        # Add synergy effects
        synergy_effects = self.get_synergy_effects(product_ingredients)
        if synergy_effects:
            for metric, effect in synergy_effects.items():
                if metric in base_result["projected_scores"]:
                    current = base_result["projected_scores"][metric]
                    base_result["projected_scores"][metric] = round(max(0, min(100,
                        current + effect * current * simulation_weeks * 0.5)), 1)
            base_result["synergy_effects"] = synergy_effects

        # Detect conflicts
        conflicts = self.detect_conflicts(product_ingredients)
        if conflicts:
            base_result["conflicts"] = conflicts
            base_result["conflict_warning"] = True

        # Apply environmental factors
        if environmental_data:
            env_adjusted = self.apply_environmental_effects(
                base_result["projected_scores"],
                environmental_data,
                days=simulation_weeks * 7,
            )
            base_result["projected_scores_with_environment"] = env_adjusted
            base_result["environmental_impact"] = {
                metric: round(env_adjusted.get(metric, 0) - base_result["projected_scores"].get(metric, 0), 1)
                for metric in base_result["projected_scores"]
            }

        # Recalculate changes
        base_result["changes"] = {
            metric: round(base_result["projected_scores"][metric] - base_result["current_scores"].get(metric, 50), 1)
            for metric in base_result["projected_scores"]
        }

        return base_result
