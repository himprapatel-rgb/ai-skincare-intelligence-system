"""
Digital Twin Simulation Service.
Sprint: Final Features - Trend-based what-if predictions
"""
import logging
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
            for s in snapshots:
                val = getattr(s, metric, None)
                if val is None and hasattr(s, 'state_vector') and s.state_vector:
                    val = s.state_vector.get(metric)
                values.append(val if val is not None else 50)
            
            # Simple linear regression
            n = len(times)
            if n < 2:
                continue
                
            sum_x = sum(times)
            sum_y = sum(values)
            sum_xy = sum(t * v for t, v in zip(times, values))
            sum_xx = sum(t * t for t in times)
            
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
            
            # Check for matches
            for key, effect_map in INGREDIENT_EFFECTS.items():
                if key in ing_lower or ing_lower in key:
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
        """
        projected = {}
        days = weeks * 7
        
        for metric, current in current_scores.items():
            # Base projection from trend
            trend = trends.get(metric, 0.0)
            trend_change = trend * days
            
            # Product effect (weekly, with diminishing returns)
            effect = product_effects.get(metric, 0.0)
            # Diminishing returns: 100% first week, 80% second, 60% third, etc.
            total_effect = 0.0
            for w in range(weeks):
                diminish_factor = max(0.2, 1.0 - (w * 0.2))
                total_effect += effect * 100 * diminish_factor  # Convert to percentage
            
            # Calculate new value
            new_value = current + trend_change + total_effect
            
            # Apply bounds (0-100 for most metrics)
            projected[metric] = max(0, min(100, new_value))
        
        return projected
    
    def calculate_confidence(
        self, 
        snapshots: List[SkinStateSnapshot],
        weeks: int
    ) -> float:
        """
        Calculate confidence score for the prediction.
        More historical data and shorter projection = higher confidence.
        """
        data_factor = min(1.0, len(snapshots) / 10)  # Max at 10 snapshots
        time_factor = max(0.3, 1.0 - (weeks * 0.08))  # Decreases with time
        
        return round(data_factor * time_factor, 2)
    
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
