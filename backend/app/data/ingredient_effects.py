"""
Ingredient effect mappings for Digital Twin simulation.
Sprint: Final Features - What-if predictions

Each effect is expressed as percentage change per week of consistent use.
Negative values for concerns (acne, wrinkles) mean improvement.
Positive values for positive metrics (hydration) mean improvement.
"""

INGREDIENT_EFFECTS = {
    # Hydrating ingredients
    "hyaluronic_acid": {"hydration": 0.05, "wrinkles": -0.02, "plumpness": 0.03},
    "glycerin": {"hydration": 0.04, "barrier": 0.02},
    "ceramide": {"hydration": 0.06, "barrier": 0.05, "sensitivity": -0.03},
    "squalane": {"hydration": 0.04, "oiliness": -0.01},
    "snail_mucin": {"hydration": 0.04, "texture": -0.02, "redness": -0.02},
    "aloe_vera": {"hydration": 0.03, "redness": -0.02, "sensitivity": -0.02},
    "honey": {"hydration": 0.03, "antibacterial": 0.02},
    "urea": {"hydration": 0.04, "texture": -0.03},
    
    # Anti-acne ingredients
    "salicylic_acid": {"acne": -0.08, "oiliness": -0.04, "pores": -0.03},
    "benzoyl_peroxide": {"acne": -0.10, "redness": 0.02, "dryness": 0.03},
    "tea_tree_oil": {"acne": -0.05, "antibacterial": 0.03},
    "niacinamide": {"oiliness": -0.04, "redness": -0.03, "pores": -0.03, "dark_spots": -0.02},
    "zinc": {"acne": -0.04, "oiliness": -0.03, "redness": -0.02},
    "sulfur": {"acne": -0.05, "oiliness": -0.03},
    "azelaic_acid": {"acne": -0.05, "redness": -0.04, "dark_spots": -0.03},
    
    # Anti-aging ingredients
    "retinol": {"wrinkles": -0.06, "dark_spots": -0.04, "acne": -0.03, "texture": -0.04},
    "retinoid": {"wrinkles": -0.07, "dark_spots": -0.05, "acne": -0.04, "texture": -0.05},
    "tretinoin": {"wrinkles": -0.08, "dark_spots": -0.06, "acne": -0.05, "texture": -0.06},
    "bakuchiol": {"wrinkles": -0.04, "dark_spots": -0.02},
    "peptide": {"wrinkles": -0.03, "firmness": 0.04, "elasticity": 0.03},
    "collagen": {"firmness": 0.02, "hydration": 0.02},
    "coq10": {"wrinkles": -0.02, "antioxidant": 0.03},
    
    # Brightening ingredients
    "vitamin_c": {"dark_spots": -0.05, "brightness": 0.05, "antioxidant": 0.04},
    "ascorbic_acid": {"dark_spots": -0.06, "brightness": 0.05, "collagen": 0.03},
    "arbutin": {"dark_spots": -0.04, "brightness": 0.03},
    "kojic_acid": {"dark_spots": -0.05, "brightness": 0.03},
    "licorice_extract": {"dark_spots": -0.03, "redness": -0.02},
    "tranexamic_acid": {"dark_spots": -0.05, "redness": -0.02},
    
    # Exfoliating ingredients
    "glycolic_acid": {"texture": -0.05, "dark_spots": -0.03, "brightness": 0.03},
    "lactic_acid": {"hydration": 0.03, "texture": -0.04, "brightness": 0.02},
    "mandelic_acid": {"texture": -0.03, "acne": -0.03},
    "pha": {"texture": -0.03, "hydration": 0.02},
    
    # Soothing ingredients
    "centella_asiatica": {"redness": -0.05, "sensitivity": -0.04, "healing": 0.04},
    "madecassoside": {"redness": -0.04, "sensitivity": -0.03},
    "allantoin": {"redness": -0.03, "healing": 0.03},
    "panthenol": {"hydration": 0.03, "healing": 0.03, "sensitivity": -0.02},
    "chamomile": {"redness": -0.03, "sensitivity": -0.02},
    "green_tea": {"antioxidant": 0.04, "redness": -0.02},
    
    # Sun protection
    "sunscreen": {"dark_spots": -0.02, "wrinkles": -0.02, "protection": 0.10},
    "spf": {"dark_spots": -0.02, "wrinkles": -0.02, "protection": 0.10},
    "zinc_oxide": {"protection": 0.10, "redness": -0.01},
    "titanium_dioxide": {"protection": 0.08},
    
    # Oils
    "jojoba_oil": {"hydration": 0.03, "barrier": 0.02},
    "rosehip_oil": {"dark_spots": -0.02, "hydration": 0.03},
    "argan_oil": {"hydration": 0.03, "elasticity": 0.02},
    "marula_oil": {"hydration": 0.04, "antioxidant": 0.02},
}


def get_ingredient_effects(ingredient_name: str) -> dict:
    """Get effects for a specific ingredient."""
    normalized = ingredient_name.lower().replace(" ", "_").replace("-", "_")
    
    # Direct match
    if normalized in INGREDIENT_EFFECTS:
        return INGREDIENT_EFFECTS[normalized]
    
    # Partial match
    for key, effects in INGREDIENT_EFFECTS.items():
        if key in normalized or normalized in key:
            return effects
    
    return {}


def aggregate_product_effects(ingredients: list) -> dict:
    """Aggregate effects from multiple ingredients."""
    total_effects = {}
    
    for ingredient in ingredients:
        effects = get_ingredient_effects(ingredient)
        for metric, value in effects.items():
            if metric not in total_effects:
                total_effects[metric] = 0.0
            total_effects[metric] += value
    
    return total_effects
