"""Ingredient Safety Database and Analysis Service

Comprehensive database of potentially harmful cosmetic ingredients
with severity levels, categories, and health concerns.

References:
- EWG Skin Deep Database
- EU Cosmetics Regulation (EC) No 1223/2009
- FDA Prohibited & Restricted Ingredients
- CIR (Cosmetic Ingredient Review)
"""

from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional


class Severity(str, Enum):
    """Severity level of ingredient concern."""
    HIGH = "high"        # Avoid - significant health concerns
    MODERATE = "moderate"  # Use with caution
    LOW = "low"          # Generally safe but may cause issues for some


class ConcernCategory(str, Enum):
    """Category of health/safety concern."""
    IRRITANT = "irritant"
    ALLERGEN = "allergen"
    CARCINOGEN = "carcinogen"
    ENDOCRINE_DISRUPTOR = "endocrine_disruptor"
    ENVIRONMENTAL_TOXIN = "environmental_toxin"
    PREGNANCY_UNSAFE = "pregnancy_unsafe"
    SENSITIZER = "sensitizer"
    COMEDOGENIC = "comedogenic"
    DRYING = "drying"


@dataclass
class HarmfulIngredient:
    """Information about a potentially harmful ingredient."""
    name: str
    aliases: List[str]  # Other names this ingredient goes by
    severity: Severity
    categories: List[ConcernCategory]
    reason: str  # Why it's flagged
    alternatives: List[str]  # Safer alternatives
    avoid_if: List[str]  # Conditions where extra caution is needed


# Comprehensive database of harmful/concerning ingredients
HARMFUL_INGREDIENTS_DB: Dict[str, HarmfulIngredient] = {
    # ===== HIGH SEVERITY - AVOID =====
    
    "formaldehyde": HarmfulIngredient(
        name="Formaldehyde",
        aliases=["formalin", "methanal", "methyl aldehyde", "formic aldehyde"],
        severity=Severity.HIGH,
        categories=[ConcernCategory.CARCINOGEN, ConcernCategory.ALLERGEN, ConcernCategory.IRRITANT],
        reason="Known human carcinogen. Causes skin sensitization and allergic reactions.",
        alternatives=["Phenoxyethanol", "Sodium benzoate", "Potassium sorbate"],
        avoid_if=["All users - banned in EU cosmetics"]
    ),
    
    "hydroquinone": HarmfulIngredient(
        name="Hydroquinone",
        aliases=["1,4-benzenediol", "quinol"],
        severity=Severity.HIGH,
        categories=[ConcernCategory.CARCINOGEN, ConcernCategory.IRRITANT],
        reason="Potential carcinogen. Can cause ochronosis (skin discoloration) with prolonged use.",
        alternatives=["Vitamin C", "Niacinamide", "Alpha Arbutin", "Kojic Acid"],
        avoid_if=["Pregnant women", "Long-term use", "Dark skin tones (ochronosis risk)"]
    ),
    
    "mercury": HarmfulIngredient(
        name="Mercury",
        aliases=["mercurous chloride", "calomel", "mercuric", "mercurio"],
        severity=Severity.HIGH,
        categories=[ConcernCategory.CARCINOGEN, ConcernCategory.PREGNANCY_UNSAFE],
        reason="Highly toxic heavy metal. Can cause neurological damage and kidney damage.",
        alternatives=["None - avoid completely"],
        avoid_if=["Everyone - banned ingredient"]
    ),
    
    "lead": HarmfulIngredient(
        name="Lead",
        aliases=["lead acetate", "plumbum"],
        severity=Severity.HIGH,
        categories=[ConcernCategory.CARCINOGEN, ConcernCategory.PREGNANCY_UNSAFE],
        reason="Neurotoxin. Accumulates in body. Linked to developmental issues.",
        alternatives=["Iron oxides for color"],
        avoid_if=["Everyone - especially pregnant women and children"]
    ),
    
    "coal tar": HarmfulIngredient(
        name="Coal Tar",
        aliases=["coal tar solution", "coal", "tar", "carbo-cort", "crude coal tar"],
        severity=Severity.HIGH,
        categories=[ConcernCategory.CARCINOGEN],
        reason="Known carcinogen. Contains PAHs (polycyclic aromatic hydrocarbons).",
        alternatives=["Salicylic acid for scalp conditions", "Tea tree oil"],
        avoid_if=["Prolonged use", "Sun exposure after application"]
    ),
    
    # ===== MODERATE SEVERITY - USE WITH CAUTION =====
    
    "parabens": HarmfulIngredient(
        name="Parabens",
        aliases=["methylparaben", "propylparaben", "butylparaben", "ethylparaben", "isobutylparaben"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.ENDOCRINE_DISRUPTOR, ConcernCategory.ALLERGEN],
        reason="Potential endocrine disruptors. May mimic estrogen. Can cause skin sensitization.",
        alternatives=["Phenoxyethanol", "Sodium benzoate", "Potassium sorbate"],
        avoid_if=["Hormone-sensitive conditions", "Pregnant women", "Sensitive skin"]
    ),
    
    "sodium lauryl sulfate": HarmfulIngredient(
        name="Sodium Lauryl Sulfate (SLS)",
        aliases=["sls", "sodium dodecyl sulfate", "sodium laurilsulfate"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.IRRITANT, ConcernCategory.DRYING],
        reason="Strong surfactant that can strip natural oils and damage skin barrier.",
        alternatives=["Sodium laureth sulfate (gentler)", "Cocamidopropyl betaine", "Decyl glucoside"],
        avoid_if=["Sensitive skin", "Eczema", "Rosacea", "Dry skin"]
    ),
    
    "sodium laureth sulfate": HarmfulIngredient(
        name="Sodium Laureth Sulfate (SLES)",
        aliases=["sles", "sodium lauryl ether sulfate"],
        severity=Severity.LOW,
        categories=[ConcernCategory.IRRITANT],
        reason="Can be contaminated with 1,4-dioxane (carcinogen) during manufacturing.",
        alternatives=["Cocamidopropyl betaine", "Decyl glucoside", "Coco glucoside"],
        avoid_if=["Very sensitive skin"]
    ),
    
    "fragrance": HarmfulIngredient(
        name="Fragrance/Parfum",
        aliases=["parfum", "perfume", "aroma", "fragrance oil"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.ALLERGEN, ConcernCategory.SENSITIZER, ConcernCategory.IRRITANT],
        reason="Umbrella term hiding potentially 3,000+ chemicals. Common cause of contact dermatitis.",
        alternatives=["Essential oils (with caution)", "Fragrance-free products"],
        avoid_if=["Sensitive skin", "Allergies", "Eczema", "Rosacea", "Pregnant women"]
    ),
    
    "alcohol denat": HarmfulIngredient(
        name="Denatured Alcohol",
        aliases=["alcohol denat", "sd alcohol", "denatured alcohol", "isopropyl alcohol", "alcohol denatured"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.DRYING, ConcernCategory.IRRITANT],
        reason="Can severely dry out skin, disrupt skin barrier, and cause irritation.",
        alternatives=["Cetyl alcohol (fatty alcohol - safe)", "Cetearyl alcohol", "Glycerin"],
        avoid_if=["Dry skin", "Sensitive skin", "Rosacea", "Eczema"]
    ),
    
    "phthalates": HarmfulIngredient(
        name="Phthalates",
        aliases=["dibutyl phthalate", "dbp", "diethyl phthalate", "dep", "dimethyl phthalate"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.ENDOCRINE_DISRUPTOR, ConcernCategory.PREGNANCY_UNSAFE],
        reason="Endocrine disruptors linked to reproductive issues and developmental problems.",
        alternatives=["Phthalate-free products"],
        avoid_if=["Pregnant women", "Children", "Hormone-sensitive conditions"]
    ),
    
    "oxybenzone": HarmfulIngredient(
        name="Oxybenzone",
        aliases=["benzophenone-3", "bp-3"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.ENDOCRINE_DISRUPTOR, ConcernCategory.ENVIRONMENTAL_TOXIN, ConcernCategory.ALLERGEN],
        reason="Hormone disruptor. Harmful to coral reefs. Common allergen in sunscreens.",
        alternatives=["Zinc oxide", "Titanium dioxide", "Avobenzone"],
        avoid_if=["Pregnant women", "Children", "Reef-safe requirements"]
    ),
    
    "retinol": HarmfulIngredient(
        name="Retinol (High Concentration)",
        aliases=["retinyl palmitate", "retinaldehyde", "retinoic acid", "vitamin a"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.PREGNANCY_UNSAFE, ConcernCategory.IRRITANT, ConcernCategory.SENSITIZER],
        reason="Can cause birth defects. Causes photosensitivity. Can irritate if overused.",
        alternatives=["Bakuchiol (pregnancy-safe alternative)", "Niacinamide", "Peptides"],
        avoid_if=["Pregnant women", "Breastfeeding", "Very sensitive skin", "Starting retinoids (go slow)"]
    ),
    
    "triclosan": HarmfulIngredient(
        name="Triclosan",
        aliases=["irgasan", "microban"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.ENDOCRINE_DISRUPTOR, ConcernCategory.ENVIRONMENTAL_TOXIN],
        reason="Hormone disruptor. Contributes to antibiotic resistance. Persistent environmental pollutant.",
        alternatives=["Tea tree oil", "Benzalkonium chloride"],
        avoid_if=["Everyone - FDA banned in hand soaps"]
    ),
    
    "toluene": HarmfulIngredient(
        name="Toluene",
        aliases=["methylbenzene", "toluol", "antisal 1a"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.PREGNANCY_UNSAFE, ConcernCategory.IRRITANT],
        reason="Can cause developmental toxicity. Irritates respiratory system.",
        alternatives=["Ethyl acetate (in nail products)"],
        avoid_if=["Pregnant women", "Nail salon workers"]
    ),
    
    # ===== LOW SEVERITY - GENERALLY SAFE BUT MAY CAUSE ISSUES =====
    
    "mineral oil": HarmfulIngredient(
        name="Mineral Oil",
        aliases=["paraffinum liquidum", "petrolatum", "petroleum jelly"],
        severity=Severity.LOW,
        categories=[ConcernCategory.COMEDOGENIC],
        reason="Can clog pores in some people. Creates occlusive barrier that may trap bacteria.",
        alternatives=["Squalane", "Jojoba oil", "Argan oil"],
        avoid_if=["Acne-prone skin", "Oily skin"]
    ),
    
    "coconut oil": HarmfulIngredient(
        name="Coconut Oil",
        aliases=["cocos nucifera oil"],
        severity=Severity.LOW,
        categories=[ConcernCategory.COMEDOGENIC],
        reason="Highly comedogenic (pore-clogging) rating of 4/5.",
        alternatives=["Squalane", "Hemp seed oil", "Argan oil"],
        avoid_if=["Acne-prone skin", "Oily skin"]
    ),
    
    "isopropyl myristate": HarmfulIngredient(
        name="Isopropyl Myristate",
        aliases=["ipm"],
        severity=Severity.LOW,
        categories=[ConcernCategory.COMEDOGENIC],
        reason="Known to clog pores. Comedogenic rating of 5/5.",
        alternatives=["C12-15 alkyl benzoate", "Caprylic/capric triglyceride"],
        avoid_if=["Acne-prone skin"]
    ),
    
    "essential oils": HarmfulIngredient(
        name="Essential Oils (Undiluted/High Concentration)",
        aliases=["tea tree oil", "lavender oil", "peppermint oil", "eucalyptus oil", "citrus oils", "lemon oil", "orange oil"],
        severity=Severity.LOW,
        categories=[ConcernCategory.SENSITIZER, ConcernCategory.IRRITANT],
        reason="Can cause sensitization over time. Citrus oils are photosensitizing.",
        alternatives=["Diluted essential oils (<1%)", "Synthetic fragrance alternatives"],
        avoid_if=["Sensitive skin", "Sun exposure (citrus oils)"]
    ),
    
    "benzoyl peroxide": HarmfulIngredient(
        name="Benzoyl Peroxide (High Concentration)",
        aliases=["bpo"],
        severity=Severity.LOW,
        categories=[ConcernCategory.IRRITANT, ConcernCategory.DRYING],
        reason="Can cause dryness, peeling, and irritation. Bleaches fabrics.",
        alternatives=["Salicylic acid", "Azelaic acid", "Niacinamide"],
        avoid_if=["Sensitive skin", "Very dry skin", "Start with 2.5% concentration"]
    ),
    
    "salicylic acid": HarmfulIngredient(
        name="Salicylic Acid (High Concentration)",
        aliases=["bha", "beta hydroxy acid"],
        severity=Severity.LOW,
        categories=[ConcernCategory.PREGNANCY_UNSAFE, ConcernCategory.DRYING],
        reason="High concentrations can over-exfoliate. Related to aspirin - pregnancy concern.",
        alternatives=["Mandelic acid", "Lactic acid (gentler)"],
        avoid_if=["Pregnant women (high %)", "Over-exfoliated skin", "Very dry skin"]
    ),
    
    "aha acids": HarmfulIngredient(
        name="AHA Acids (High Concentration)",
        aliases=["glycolic acid", "lactic acid", "mandelic acid", "citric acid", "malic acid"],
        severity=Severity.LOW,
        categories=[ConcernCategory.SENSITIZER, ConcernCategory.IRRITANT],
        reason="Can cause irritation and sun sensitivity if overused or at high concentrations.",
        alternatives=["PHAs (polyhydroxy acids) - gentler"],
        avoid_if=["Beginners (start low)", "Very sensitive skin", "Without sunscreen"]
    ),
    
    # ===== ADDITIONAL HIGH SEVERITY =====
    
    "benzene": HarmfulIngredient(
        name="Benzene",
        aliases=["benzol", "phenyl hydride"],
        severity=Severity.HIGH,
        categories=[ConcernCategory.CARCINOGEN],
        reason="Known human carcinogen. Linked to leukemia. Contaminant found in some sunscreens.",
        alternatives=["Choose benzene-free certified products"],
        avoid_if=["Everyone - should not be in cosmetics"]
    ),
    
    "diethanolamine": HarmfulIngredient(
        name="Diethanolamine (DEA)",
        aliases=["dea", "cocamide dea", "lauramide dea", "myristamide dea"],
        severity=Severity.HIGH,
        categories=[ConcernCategory.CARCINOGEN, ConcernCategory.IRRITANT],
        reason="Reacts with other ingredients to form carcinogenic nitrosamines.",
        alternatives=["Cocamidopropyl betaine", "Sodium cocoyl isethionate"],
        avoid_if=["All users - banned in EU"]
    ),
    
    "triethanolamine": HarmfulIngredient(
        name="Triethanolamine (TEA)",
        aliases=["tea", "triethanolamine", "trolamine"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.IRRITANT, ConcernCategory.ALLERGEN],
        reason="Can form carcinogenic nitrosamines. May cause contact dermatitis.",
        alternatives=["Aminomethyl propanol"],
        avoid_if=["Sensitive skin", "Long-term use"]
    ),
    
    "bht": HarmfulIngredient(
        name="BHT (Butylated Hydroxytoluene)",
        aliases=["butylated hydroxytoluene", "e321"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.ENDOCRINE_DISRUPTOR, ConcernCategory.ALLERGEN],
        reason="Potential endocrine disruptor. Can cause skin allergies in some people.",
        alternatives=["Vitamin E (tocopherol)", "Rosemary extract"],
        avoid_if=["Hormone-sensitive conditions", "Skin allergies"]
    ),
    
    "bha preservative": HarmfulIngredient(
        name="BHA (Butylated Hydroxyanisole)",
        aliases=["butylated hydroxyanisole", "e320"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.CARCINOGEN, ConcernCategory.ENDOCRINE_DISRUPTOR],
        reason="Possible human carcinogen. Endocrine disruptor.",
        alternatives=["Vitamin E (tocopherol)", "Natural preservatives"],
        avoid_if=["Long-term use", "Hormone-sensitive conditions"]
    ),
    
    "octinoxate": HarmfulIngredient(
        name="Octinoxate",
        aliases=["ethylhexyl methoxycinnamate", "octyl methoxycinnamate"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.ENDOCRINE_DISRUPTOR, ConcernCategory.ENVIRONMENTAL_TOXIN],
        reason="Hormone disruptor. Harmful to coral reefs. Banned in Hawaii.",
        alternatives=["Zinc oxide", "Titanium dioxide"],
        avoid_if=["Pregnant women", "Ocean swimming", "Reef areas"]
    ),
    
    "homosalate": HarmfulIngredient(
        name="Homosalate",
        aliases=["hms"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.ENDOCRINE_DISRUPTOR],
        reason="May disrupt hormones. Accumulates in body.",
        alternatives=["Zinc oxide", "Titanium dioxide"],
        avoid_if=["Pregnant women", "Daily long-term use"]
    ),
    
    "avobenzone": HarmfulIngredient(
        name="Avobenzone",
        aliases=["butyl methoxydibenzoylmethane", "parsol 1789"],
        severity=Severity.LOW,
        categories=[ConcernCategory.ALLERGEN],
        reason="Can degrade in sunlight and cause allergic reactions in some people.",
        alternatives=["Zinc oxide (more stable)", "Tinosorb"],
        avoid_if=["Avobenzone sensitivity", "Without stabilizers"]
    ),
    
    "propylene glycol": HarmfulIngredient(
        name="Propylene Glycol",
        aliases=["pg", "1,2-propanediol"],
        severity=Severity.LOW,
        categories=[ConcernCategory.IRRITANT, ConcernCategory.ALLERGEN],
        reason="Can cause contact dermatitis in sensitive individuals. Enhances penetration of other ingredients.",
        alternatives=["Glycerin", "Butylene glycol", "Pentylene glycol"],
        avoid_if=["Sensitive skin", "Eczema"]
    ),
    
    "silicones": HarmfulIngredient(
        name="Silicones",
        aliases=["dimethicone", "cyclomethicone", "cyclopentasiloxane", "cyclohexasiloxane"],
        severity=Severity.LOW,
        categories=[ConcernCategory.COMEDOGENIC],
        reason="Can trap debris and cause buildup. May clog pores in some people.",
        alternatives=["Squalane", "Natural oils"],
        avoid_if=["Acne-prone skin (some people)", "Hair that gets weighed down"]
    ),
    
    "artificial colors": HarmfulIngredient(
        name="Artificial Colors",
        aliases=["fd&c", "d&c", "ci 77491", "ci 77492", "ci 77499", "red 40", "yellow 5", "blue 1"],
        severity=Severity.LOW,
        categories=[ConcernCategory.ALLERGEN, ConcernCategory.IRRITANT],
        reason="Coal tar derived colors may contain heavy metal contaminants. Can cause allergic reactions.",
        alternatives=["Plant-derived colorants", "Iron oxides", "Mica"],
        avoid_if=["Sensitive skin", "Color allergies"]
    ),
    
    "lanolin": HarmfulIngredient(
        name="Lanolin",
        aliases=["wool wax", "wool grease", "adeps lanae"],
        severity=Severity.LOW,
        categories=[ConcernCategory.ALLERGEN, ConcernCategory.COMEDOGENIC],
        reason="Common allergen. Can clog pores. May contain pesticide residues.",
        alternatives=["Plant-based waxes", "Shea butter"],
        avoid_if=["Wool allergy", "Acne-prone skin"]
    ),
    
    "menthol": HarmfulIngredient(
        name="Menthol",
        aliases=["peppermint alcohol", "mint camphor"],
        severity=Severity.LOW,
        categories=[ConcernCategory.IRRITANT, ConcernCategory.SENSITIZER],
        reason="Can irritate skin over time. The cooling sensation masks irritation.",
        alternatives=["Aloe vera for soothing"],
        avoid_if=["Sensitive skin", "Rosacea", "Around eyes"]
    ),
    
    "witch hazel": HarmfulIngredient(
        name="Witch Hazel (Alcohol-based)",
        aliases=["hamamelis virginiana"],
        severity=Severity.LOW,
        categories=[ConcernCategory.DRYING, ConcernCategory.IRRITANT],
        reason="Alcohol-based versions are drying. Can irritate skin barrier.",
        alternatives=["Alcohol-free witch hazel", "Niacinamide for pores"],
        avoid_if=["Dry skin", "Sensitive skin"]
    ),
    
    "aluminum compounds": HarmfulIngredient(
        name="Aluminum Compounds",
        aliases=["aluminum chlorohydrate", "aluminum zirconium", "aluminium"],
        severity=Severity.LOW,
        categories=[ConcernCategory.IRRITANT],
        reason="May cause irritation. Controversial links to health issues (unproven).",
        alternatives=["Magnesium-based deodorants", "Arrowroot powder"],
        avoid_if=["Skin irritation", "Personal preference"]
    ),
    
    "imidazolidinyl urea": HarmfulIngredient(
        name="Imidazolidinyl Urea",
        aliases=["germall 115"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.ALLERGEN, ConcernCategory.IRRITANT],
        reason="Formaldehyde-releasing preservative. Can cause contact dermatitis.",
        alternatives=["Phenoxyethanol", "Sodium benzoate"],
        avoid_if=["Sensitive skin", "Formaldehyde sensitivity"]
    ),
    
    "dmdm hydantoin": HarmfulIngredient(
        name="DMDM Hydantoin",
        aliases=["1,3-dimethylol-5,5-dimethylhydantoin", "glydant"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.ALLERGEN, ConcernCategory.IRRITANT],
        reason="Formaldehyde-releasing preservative. Subject of class action lawsuits.",
        alternatives=["Phenoxyethanol", "Sodium benzoate"],
        avoid_if=["Sensitive skin", "Formaldehyde sensitivity"]
    ),
    
    "quaternium-15": HarmfulIngredient(
        name="Quaternium-15",
        aliases=["dowicil 200", "dowicil 75"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.ALLERGEN, ConcernCategory.IRRITANT],
        reason="Most sensitizing formaldehyde-releasing preservative. Common cause of contact dermatitis.",
        alternatives=["Phenoxyethanol", "Sodium benzoate"],
        avoid_if=["All users - high sensitization rate"]
    ),
    
    "polyethylene glycol": HarmfulIngredient(
        name="PEGs (Polyethylene Glycols)",
        aliases=["peg-4", "peg-10", "peg-100", "peg-40", "polyethylene glycol"],
        severity=Severity.LOW,
        categories=[ConcernCategory.IRRITANT],
        reason="Can be contaminated with 1,4-dioxane. May enhance penetration of harmful ingredients.",
        alternatives=["Plant-derived emulsifiers"],
        avoid_if=["Damaged skin barrier"]
    ),
    
    "sodium hydroxide": HarmfulIngredient(
        name="Sodium Hydroxide",
        aliases=["lye", "caustic soda", "naoh"],
        severity=Severity.LOW,
        categories=[ConcernCategory.IRRITANT],
        reason="Strong alkaline. Safe in small amounts for pH adjustment. Irritating at high concentrations.",
        alternatives=["Citric acid for pH adjustment"],
        avoid_if=["Only concerning if improperly formulated"]
    ),
    
    "cinnamates": HarmfulIngredient(
        name="Cinnamates",
        aliases=["cinnamal", "cinnamic aldehyde", "cinnamyl alcohol"],
        severity=Severity.MODERATE,
        categories=[ConcernCategory.ALLERGEN, ConcernCategory.SENSITIZER],
        reason="One of the most common fragrance allergens. Found in many products.",
        alternatives=["Fragrance-free products"],
        avoid_if=["Fragrance allergies", "Sensitive skin"]
    ),
    
    "chlorphenesin": HarmfulIngredient(
        name="Chlorphenesin",
        aliases=["chlorphenesin carbamate"],
        severity=Severity.LOW,
        categories=[ConcernCategory.IRRITANT],
        reason="Can cause skin and eye irritation in some people.",
        alternatives=["Phenoxyethanol", "Benzisothiazolinone"],
        avoid_if=["Sensitive skin", "Eye area products"]
    ),
}


def _is_word_match(needle: str, haystack: str) -> bool:
    """
    Check if needle matches haystack as a complete word/phrase.
    Avoids false positives like 'ethanol' matching 'phenoxyethanol'.
    """
    import re

    # Use word boundary matching for more precision
    pattern = r'\b' + re.escape(needle) + r'\b'
    return bool(re.search(pattern, haystack, re.IGNORECASE))


def analyze_ingredient_safety(ingredient_name: str) -> Optional[Dict]:
    """
    Analyze a single ingredient for safety concerns.
    
    Returns dict with safety info or None if ingredient is not in database.
    """
    ingredient_lower = ingredient_name.lower().strip()
    
    for key, harmful in HARMFUL_INGREDIENTS_DB.items():
        # Check main name - exact or word-boundary match
        if _is_word_match(key, ingredient_lower) or ingredient_lower == key:
            return {
                "name": harmful.name,
                "matched_term": ingredient_name,
                "severity": harmful.severity.value,
                "categories": [c.value for c in harmful.categories],
                "reason": harmful.reason,
                "alternatives": harmful.alternatives,
                "avoid_if": harmful.avoid_if
            }
        
        # Check aliases - use word-boundary matching to avoid false positives
        for alias in harmful.aliases:
            if _is_word_match(alias, ingredient_lower) or ingredient_lower == alias.lower():
                return {
                    "name": harmful.name,
                    "matched_term": ingredient_name,
                    "severity": harmful.severity.value,
                    "categories": [c.value for c in harmful.categories],
                    "reason": harmful.reason,
                    "alternatives": harmful.alternatives,
                    "avoid_if": harmful.avoid_if
                }
    
    return None


def analyze_ingredients_list(ingredients: List[str]) -> Dict:
    """
    Analyze a list of ingredients and return safety report.
    
    Returns:
        Dict with flagged_ingredients, overall_safety_score, and recommendations
    """
    flagged = []
    high_severity_count = 0
    moderate_severity_count = 0
    low_severity_count = 0
    
    for ingredient in ingredients:
        result = analyze_ingredient_safety(ingredient)
        if result:
            flagged.append(result)
            if result["severity"] == "high":
                high_severity_count += 1
            elif result["severity"] == "moderate":
                moderate_severity_count += 1
            else:
                low_severity_count += 1
    
    # Calculate overall safety score (0-100, higher = safer)
    # Deduct points based on severity
    safety_score = 100
    safety_score -= high_severity_count * 25  # -25 per high severity
    safety_score -= moderate_severity_count * 10  # -10 per moderate
    safety_score -= low_severity_count * 3  # -3 per low severity
    safety_score = max(0, safety_score)
    
    # Generate recommendations
    recommendations = []
    if high_severity_count > 0:
        recommendations.append("⚠️ Contains ingredients with significant health concerns. Consider alternatives.")
    if moderate_severity_count > 0:
        recommendations.append("Use with caution if you have sensitive skin or specific health conditions.")
    if any(f for f in flagged if "pregnancy_unsafe" in f.get("categories", [])):
        recommendations.append("🤰 Not recommended during pregnancy - consult your doctor.")
    if any(f for f in flagged if "allergen" in f.get("categories", [])):
        recommendations.append("May cause allergic reactions. Patch test before full use.")
    
    return {
        "flagged_ingredients": flagged,
        "total_flagged": len(flagged),
        "high_severity_count": high_severity_count,
        "moderate_severity_count": moderate_severity_count,
        "low_severity_count": low_severity_count,
        "safety_score": safety_score,
        "recommendations": recommendations,
        "is_pregnancy_safe": not any(f for f in flagged if "pregnancy_unsafe" in f.get("categories", [])),
        "is_sensitive_skin_safe": high_severity_count == 0 and moderate_severity_count <= 1
    }
