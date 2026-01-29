"""Ingredient Service - Persist ingredients to database

Provides functions to save ingredients and link them to products.
Created: January 29, 2026
"""
import logging
import re
import uuid
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.product_models import Ingredient, Product, ProductIngredient

logger = logging.getLogger(__name__)


def parse_percentage(text: str) -> Optional[float]:
    """
    Extract percentage from text like "10%", "2.5%", etc.
    
    Returns the numeric value or None if not found.
    """
    if not text:
        return None
    
    match = re.search(r'(\d+(?:\.\d+)?)\s*%', str(text))
    if match:
        return float(match.group(1))
    return None


def normalize_ingredient_name(name: str) -> str:
    """
    Normalize ingredient name for consistent storage.
    - Strip whitespace
    - Title case for common names
    - Preserve INCI format for technical names
    """
    if not name:
        return ""
    
    name = name.strip()
    
    # Remove percentage suffixes for storage
    name = re.sub(r'\s*\d+(?:\.\d+)?\s*%\s*$', '', name)
    
    return name.strip()


def get_or_create_ingredient(
    db: Session,
    name: str,
    category: Optional[str] = None
) -> Optional[Ingredient]:
    """
    Get existing ingredient by name or create a new one.
    
    Returns the Ingredient object or None if name is empty.
    """
    normalized_name = normalize_ingredient_name(name)
    if not normalized_name:
        return None
    
    # Try to find existing ingredient (case-insensitive)
    existing = db.query(Ingredient).filter(
        Ingredient.name_inci.ilike(normalized_name)
    ).first()
    
    if existing:
        return existing
    
    # Also check common_names JSONB array
    # Note: This is a simple check - could be enhanced with proper JSONB queries
    all_ingredients = db.query(Ingredient).all()
    for ing in all_ingredients:
        if ing.common_names:
            for common_name in ing.common_names:
                if common_name.lower() == normalized_name.lower():
                    return ing
    
    # Create new ingredient
    try:
        new_ingredient = Ingredient(
            id=uuid.uuid4(),
            name_inci=normalized_name,
            common_names=[],
            category=category,
            function=None,
            safety_category=None,
            safety_rating=None,
            comedogenic_rating=None,
        )
        db.add(new_ingredient)
        db.flush()  # Get the ID without committing
        logger.info(f"Created new ingredient: {normalized_name}")
        return new_ingredient
    except Exception as e:
        logger.warning(f"Failed to create ingredient '{normalized_name}': {e}")
        return None


def save_product_ingredients(
    db: Session,
    product_id: uuid.UUID,
    ingredients: List[str],
    key_ingredients: Optional[List[dict]] = None
) -> int:
    """
    Save ingredients for a product and create product-ingredient links.
    
    Args:
        db: Database session
        product_id: UUID of the product
        ingredients: List of ingredient names (in INCI order)
        key_ingredients: Optional list of key ingredients with percentages
                        [{"name": "Niacinamide", "percentage": "10%"}, ...]
    
    Returns:
        Number of ingredients linked to the product
    """
    if not ingredients:
        return 0
    
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        logger.warning(f"Product {product_id} not found, cannot save ingredients")
        return 0
    
    # Build a map of key ingredients with their percentages
    key_ing_map = {}
    if key_ingredients:
        for ki in key_ingredients:
            if isinstance(ki, dict):
                name = normalize_ingredient_name(ki.get("name", ""))
                percentage = ki.get("percentage")
                if name:
                    key_ing_map[name.lower()] = parse_percentage(percentage)
            elif isinstance(ki, str):
                # Parse "Niacinamide 10%" format
                pct = parse_percentage(ki)
                name = normalize_ingredient_name(ki)
                if name:
                    key_ing_map[name.lower()] = pct
    
    # Check if product already has ingredients linked
    existing_links = db.query(ProductIngredient).filter(
        ProductIngredient.product_id == product_id
    ).count()
    
    if existing_links > 0:
        logger.info(f"Product {product_id} already has {existing_links} ingredients, skipping")
        return existing_links
    
    # Process each ingredient
    linked_count = 0
    for position, ing_name in enumerate(ingredients, start=1):
        if not ing_name or not ing_name.strip():
            continue
        
        # Get or create the ingredient
        ingredient = get_or_create_ingredient(db, ing_name)
        if not ingredient:
            continue
        
        # Check for concentration from key ingredients
        normalized_name = normalize_ingredient_name(ing_name)
        concentration = key_ing_map.get(normalized_name.lower())
        
        # Create the product-ingredient link
        try:
            link = ProductIngredient(
                id=uuid.uuid4(),
                product_id=product_id,
                ingredient_id=ingredient.id,
                position=position,
                concentration_percent=concentration
            )
            db.add(link)
            linked_count += 1
        except Exception as e:
            logger.warning(f"Failed to link ingredient '{ing_name}' to product: {e}")
            continue
    
    # Commit all changes
    try:
        db.commit()
        logger.info(f"Saved {linked_count} ingredients for product {product_id}")
    except Exception as e:
        logger.error(f"Failed to commit ingredients for product {product_id}: {e}")
        db.rollback()
        return 0
    
    return linked_count


def get_product_ingredients(
    db: Session,
    product_id: uuid.UUID
) -> List[dict]:
    """
    Get all ingredients for a product with their details.
    
    Returns a list of ingredient dictionaries with name, position, and concentration.
    """
    links = db.query(ProductIngredient).filter(
        ProductIngredient.product_id == product_id
    ).order_by(ProductIngredient.position).all()
    
    result = []
    for link in links:
        ingredient = db.query(Ingredient).filter(
            Ingredient.id == link.ingredient_id
        ).first()
        
        if ingredient:
            result.append({
                "name": ingredient.name_inci,
                "position": link.position,
                "concentration_percent": link.concentration_percent,
                "category": ingredient.category,
                "safety_rating": ingredient.safety_rating,
                "comedogenic_rating": ingredient.comedogenic_rating,
            })
    
    return result


def build_ingredients_snapshot(
    ingredients: List[str],
    key_ingredients: Optional[List[dict]] = None
) -> dict:
    """
    Build a JSON snapshot of ingredients for storing in shelf_products.
    
    This preserves the original ingredient data for historical reference,
    even if the master ingredient data changes later.
    """
    snapshot = {
        "ingredients": ingredients or [],
        "key_ingredients": [],
        "captured_at": None  # Will be set when stored
    }
    
    if key_ingredients:
        for ki in key_ingredients:
            if isinstance(ki, dict):
                snapshot["key_ingredients"].append({
                    "name": ki.get("name", ""),
                    "percentage": ki.get("percentage")
                })
            elif isinstance(ki, str):
                snapshot["key_ingredients"].append({
                    "name": normalize_ingredient_name(ki),
                    "percentage": parse_percentage(ki)
                })
    
    return snapshot
