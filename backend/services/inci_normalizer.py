"""INCI Ingredient Name Normalizer Service

Normalizes ingredient names to standardized INCI format using CosIng database.
Converts common variants ("Water" → "Aqua", "Vitamin E" → "Tocopherol") to official INCI names.
Target: ≥ 95% normalization accuracy

"""

import os
import re
from typing import List, Optional, Dict, Tuple
import psycopg2
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

class INCINormalizer:
    """Normalizes ingredient names to official INCI nomenclature"""
    
    def __init__(self, database_url: str = None):
        self.database_url = database_url or os.getenv('DATABASE_URL')
        self.conn = None
        self._ingredient_cache = {}  # In-memory cache for fast lookups
        self._load_ingredient_mappings()
    
    def _connect(self):
        """Establish database connection"""
        if not self.conn or self.conn.closed:
            self.conn = psycopg2.connect(self.database_url)
    
    def _load_ingredient_mappings(self):
        """Load ingredient mappings from database into memory cache"""
        try:
            self._connect()
            with self.conn.cursor() as cur:
                cur.execute("""
                    SELECT LOWER(inci_name), inci_name, ingredient_id
                    FROM ingredients
                """)
                
                for lower_name, inci_name, ingredient_id in cur.fetchall():
                    self._ingredient_cache[lower_name] = {
                        'inci_name': inci_name,
                        'ingredient_id': ingredient_id
                    }
            
            logger.info(f"Loaded {len(self._ingredient_cache)} ingredient mappings")
        except Exception as e:
            logger.error(f"Failed to load ingredient mappings: {e}")
    
    # Common ingredient name variants and their INCI equivalents
    COMMON_VARIANTS = {
        'water': 'Aqua',
        'glycerin': 'Glycerin',
        'glycerol': 'Glycerin',
        'vitamin e': 'Tocopherol',
        'vitamin c': 'Ascorbic Acid',
        'vitamin a': 'Retinol',
        'hyaluronic acid': 'Sodium Hyaluronate',
        'niacinamide': 'Niacinamide',
        'vitamin b3': 'Niacinamide',
        'salicylic acid': 'Salicylic Acid',
        'lactic acid': 'Lactic Acid',
        'glycolic acid': 'Glycolic Acid',
        'retinol': 'Retinol',
        'ceramide': 'Ceramide',
        'peptide': 'Peptide',
        'fragrance': 'Parfum',
        'perfume': 'Parfum',
        'alcohol': 'Alcohol Denat',
        'ethanol': 'Alcohol Denat',
    }
    
    def normalize_ingredient(self, ingredient: str) -> Tuple[str, Optional[str], float]:
        """
        Normalize a single ingredient name to INCI standard.
        
        Args:
            ingredient: Raw ingredient name
            
        Returns:
            Tuple of (normalized_name, ingredient_id, confidence_score)
            confidence_score: 0.0-1.0, where 1.0 = exact match
        """
        if not ingredient:
            return ingredient, None, 0.0
        
        # Clean the input
        cleaned = self._clean_ingredient_name(ingredient)
        
        # Check exact match in cache (case-insensitive)
        lower_cleaned = cleaned.lower()
        if lower_cleaned in self._ingredient_cache:
            match = self._ingredient_cache[lower_cleaned]
            return match['inci_name'], match['ingredient_id'], 1.0
        
        # Check common variants
        if lower_cleaned in self.COMMON_VARIANTS:
            variant_name = self.COMMON_VARIANTS[lower_cleaned]
            # Look up the variant in cache
            variant_lower = variant_name.lower()
            if variant_lower in self._ingredient_cache:
                match = self._ingredient_cache[variant_lower]
                return match['inci_name'], match['ingredient_id'], 0.9
        
        # Try fuzzy matching (partial matches)
        fuzzy_match = self._fuzzy_match(lower_cleaned)
        if fuzzy_match:
            return fuzzy_match[0], fuzzy_match[1], fuzzy_match[2]
        
        # Return original if no match found
        logger.debug(f"No normalization found for: {ingredient}")
        return cleaned, None, 0.0
    
    def _clean_ingredient_name(self, name: str) -> str:
        """Clean and standardize ingredient name"""
        # Remove extra whitespace
        name = ' '.join(name.split())
        
        # Remove common prefixes/suffixes
        name = re.sub(r'\s*\([^)]*\)\s*', '', name)  # Remove parentheses content
        name = re.sub(r'\s*\[[^\]]*\]\s*', '', name)  # Remove brackets content
        
        # Capitalize properly (INCI names are typically title case)
        return name.strip()
    
    def _fuzzy_match(self, name: str) -> Optional[Tuple[str, str, float]]:
        """Perform fuzzy matching against ingredient database"""
        # Try substring matching
        for cached_name, data in self._ingredient_cache.items():
            if name in cached_name or cached_name in name:
                # Calculate similarity score
                score = min(len(name), len(cached_name)) / max(len(name), len(cached_name))
                if score > 0.7:  # At least 70% similarity
                    return data['inci_name'], data['ingredient_id'], score * 0.8
        
        return None
    
    def normalize_ingredient_list(self, ingredients: str) -> List[Dict]:
        """
        Normalize a comma-separated list of ingredients.
        
        Args:
            ingredients: Comma-separated ingredient string
            
        Returns:
            List of dicts with keys: original, normalized, ingredient_id, confidence
        """
        if not ingredients:
            return []
        
        # Split by comma
        ingredient_list = [i.strip() for i in ingredients.split(',') if i.strip()]
        
        results = []
        for ing in ingredient_list:
            normalized, ing_id, confidence = self.normalize_ingredient(ing)
            results.append({
                'original': ing,
                'normalized': normalized,
                'ingredient_id': ing_id,
                'confidence': confidence
            })
        
        return results
    
    def get_normalization_stats(self, ingredients: List[str]) -> Dict:
        """Get normalization statistics for a list of ingredients"""
        results = [self.normalize_ingredient(ing) for ing in ingredients]
        
        total = len(results)
        exact_matches = sum(1 for _, _, conf in results if conf == 1.0)
        fuzzy_matches = sum(1 for _, _, conf in results if 0.7 <= conf < 1.0)
        no_matches = sum(1 for _, _, conf in results if conf < 0.7)
        
        return {
            'total': total,
            'exact_matches': exact_matches,
            'fuzzy_matches': fuzzy_matches,
            'no_matches': no_matches,
            'accuracy': (exact_matches + fuzzy_matches) / total if total > 0 else 0.0
        }
    
    def close(self):
        """Close database connection"""
        if self.conn and not self.conn.closed:
            self.conn.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


# Example usage
if __name__ == '__main__':
    import sys
    
    normalizer = INCINormalizer()
    
    # Test with sample ingredients
    test_ingredients = [
        "Water",
        "Glycerin",
        "Vitamin E",
        "Hyaluronic Acid",
        "Niacinamide",
        "Retinol",
        "Some Unknown Ingredient"
    ]
    
    print("\nINCI Normalization Test:\n")
    for ing in test_ingredients:
        normalized, ing_id, confidence = normalizer.normalize_ingredient(ing)
        print(f"{ing:30} → {normalized:30} (confidence: {confidence:.2f})")
    
    # Test with ingredient list
    print("\n\nIngredient List Normalization:\n")
    ingredient_string = "Water, Glycerin, Vitamin E, Niacinamide, Retinol"
    results = normalizer.normalize_ingredient_list(ingredient_string)
    
    for result in results:
        print(f"{result['original']:30} → {result['normalized']:30} (confidence: {result['confidence']:.2f})")
    
    # Get stats
    stats = normalizer.get_normalization_stats(test_ingredients)
    print(f"\n\nNormalization Stats:")
    print(f"Total: {stats['total']}")
    print(f"Exact matches: {stats['exact_matches']}")
    print(f"Fuzzy matches: {stats['fuzzy_matches']}")
    print(f"No matches: {stats['no_matches']}")
    print(f"Accuracy: {stats['accuracy']:.1%}")
    
    normalizer.close()
