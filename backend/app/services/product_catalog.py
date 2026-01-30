"""Product Catalog Service

Service layer for the in-house product catalog database.
Provides lookup-first logic to reduce API dependency.

This service uses the SEPARATE PRODUCT DATABASE for all operations.
The product database is configured via PRODUCT_DATABASE_URL.

Part of the Product Catalog Database Strategy.
Created: January 29, 2026
Updated: January 27, 2026 - Migrated to separate database
"""
import logging
import re
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.catalog_models import (
    CatalogBrand,
    CatalogIngredient,
    CatalogProduct,
    CatalogProductImage,
    CatalogProductIngredient,
)
from app.services.ingredient_safety import analyze_ingredients_list

logger = logging.getLogger(__name__)


class ProductCatalogService:
    """
    Service for interacting with the in-house product catalog.
    
    Usage:
        catalog = ProductCatalogService(db)
        
        # Lookup by barcode (instant if in catalog)
        product = await catalog.lookup_barcode("3337875559782")
        
        # Search products
        results = catalog.search("niacinamide serum", category="serum")
        
        # Add new product from AI scan
        catalog.add_from_scan(product_data)
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    # =========================================
    # BARCODE LOOKUP (Primary use case)
    # =========================================
    
    def lookup_barcode(self, barcode: str) -> Optional[Dict]:
        """
        Look up a product by barcode in the catalog.
        
        Returns:
            Product dict with all pre-computed data, or None if not found.
        """
        if not barcode:
            return None
        
        barcode = barcode.strip()
        
        product = self.db.query(CatalogProduct).filter(
            CatalogProduct.barcode == barcode
        ).first()
        
        if not product:
            return None
        
        # Increment scan count
        product.scan_count = (product.scan_count or 0) + 1
        product.last_scanned_at = datetime.utcnow()
        self.db.commit()
        
        return self._product_to_dict(product)
    
    def lookup_by_name_brand(self, name: str, brand: str) -> Optional[Dict]:
        """
        Look up a product by name and brand (fuzzy match).
        
        Used when AI identifies a product but no barcode is available.
        """
        if not name or not brand:
            return None
        
        # Try exact match first
        product = self.db.query(CatalogProduct).filter(
            func.lower(CatalogProduct.name) == name.lower(),
            func.lower(CatalogProduct.brand) == brand.lower()
        ).first()
        
        if product:
            return self._product_to_dict(product)
        
        # Try fuzzy match (contains)
        product = self.db.query(CatalogProduct).filter(
            CatalogProduct.name.ilike(f"%{name}%"),
            CatalogProduct.brand.ilike(f"%{brand}%")
        ).first()
        
        if product:
            return self._product_to_dict(product)
        
        return None
    
    # =========================================
    # SEARCH
    # =========================================
    
    def search(
        self,
        query: str,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict]:
        """
        Search products by name, brand, or ingredients.
        
        Uses PostgreSQL full-text search for performance.
        """
        base_query = self.db.query(CatalogProduct)
        
        if query:
            # Use PostgreSQL full-text search
            search_vector = func.to_tsvector('english', 
                CatalogProduct.name + ' ' + CatalogProduct.brand + ' ' + 
                func.coalesce(CatalogProduct.description, '')
            )
            search_query = func.plainto_tsquery('english', query)
            base_query = base_query.filter(search_vector.match(search_query))
        
        if category:
            base_query = base_query.filter(CatalogProduct.category == category)
        
        if brand:
            base_query = base_query.filter(CatalogProduct.brand.ilike(f"%{brand}%"))
        
        products = base_query.order_by(
            CatalogProduct.scan_count.desc().nullslast()
        ).offset(offset).limit(limit).all()
        
        return [self._product_to_dict(p) for p in products]
    
    def get_by_id(self, product_id: str) -> Optional[Dict]:
        """Get a product by its UUID."""
        try:
            pid = uuid.UUID(product_id)
        except ValueError:
            return None
        
        product = self.db.query(CatalogProduct).filter(
            CatalogProduct.id == pid
        ).first()
        
        if product:
            return self._product_to_dict(product)
        return None
    
    # =========================================
    # ADD / UPDATE PRODUCTS
    # =========================================
    
    def add_from_scan(
        self,
        name: str,
        brand: str,
        category: str,
        barcode: Optional[str] = None,
        ingredients: Optional[List[str]] = None,
        key_ingredients: Optional[List[Dict]] = None,
        image_url: Optional[str] = None,
        source: str = "ai_scan"
    ) -> Optional[Dict]:
        """
        Add a new product to the catalog from an AI scan.
        
        Also computes safety analysis and stores it.
        """
        # Check for existing product
        if barcode:
            existing = self.lookup_barcode(barcode)
            if existing:
                logger.info(f"Product already exists with barcode {barcode}")
                return existing
        
        existing = self.lookup_by_name_brand(name, brand)
        if existing:
            logger.info(f"Product already exists: {brand} - {name}")
            return existing
        
        # Compute safety analysis
        safety_data = {}
        if ingredients:
            safety_analysis = analyze_ingredients_list(ingredients)
            safety_data = {
                "safety_score": safety_analysis["safety_score"],
                "flagged_ingredients": safety_analysis["flagged_ingredients"],
                "pregnancy_safe": safety_analysis["is_pregnancy_safe"],
                "sensitive_skin_safe": safety_analysis["is_sensitive_skin_safe"],
            }
        
        # Create product
        product = CatalogProduct(
            id=uuid.uuid4(),
            barcode=barcode,
            name=name,
            brand=brand,
            category=category,
            ingredients_text=", ".join(ingredients) if ingredients else None,
            key_ingredients=key_ingredients,
            image_front_url=image_url,
            thumbnail_url=image_url,
            source=source,
            safety_score=safety_data.get("safety_score"),
            flagged_ingredients=safety_data.get("flagged_ingredients"),
            pregnancy_safe=safety_data.get("pregnancy_safe"),
            sensitive_skin_safe=safety_data.get("sensitive_skin_safe"),
            data_quality_score=70 if ingredients else 50,  # Higher if we have ingredients
            scan_count=1,
            last_scanned_at=datetime.utcnow(),
        )
        
        self.db.add(product)
        
        # Add ingredients if provided
        if ingredients:
            self._add_ingredients(product.id, ingredients, key_ingredients)
        
        try:
            self.db.commit()
            logger.info(f"Added new product to catalog: {brand} - {name}")
            return self._product_to_dict(product)
        except Exception as e:
            logger.error(f"Failed to add product to catalog: {e}")
            self.db.rollback()
            return None
    
    def add_from_obf(
        self,
        obf_data: Dict,
        image_url: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Add a product from Open Beauty Facts data.
        
        Used during bulk import.
        """
        barcode = obf_data.get("code")
        name = obf_data.get("product_name", "").strip()
        brand = obf_data.get("brands", "").strip()
        
        if not name or not brand:
            return None
        
        # Check for existing
        if barcode:
            existing = self.db.query(CatalogProduct).filter(
                CatalogProduct.barcode == barcode
            ).first()
            if existing:
                return None
        
        # Parse category
        categories = obf_data.get("categories", "")
        category = self._parse_category(categories)
        
        # Parse ingredients
        ingredients_text = obf_data.get("ingredients_text", "")
        ingredients = self._parse_ingredients_text(ingredients_text)
        
        # Get image URL
        img_url = image_url or obf_data.get("image_front_url") or obf_data.get("image_url")
        
        # Create product
        product = CatalogProduct(
            id=uuid.uuid4(),
            barcode=barcode,
            barcode_type="ean13" if barcode and len(barcode) == 13 else "upc",
            name=name,
            brand=brand,
            category=category,
            description=obf_data.get("generic_name"),
            ingredients_text=ingredients_text,
            image_front_url=img_url,
            source="obf",
            source_id=barcode,
            data_quality_score=self._calculate_quality_score(obf_data),
        )
        
        self.db.add(product)
        
        # Add ingredients
        if ingredients:
            self._add_ingredients(product.id, ingredients)
        
        return {"id": str(product.id), "name": name, "brand": brand}
    
    # =========================================
    # STATISTICS
    # =========================================
    
    def get_stats(self) -> Dict:
        """Get catalog statistics."""
        total_products = self.db.query(func.count(CatalogProduct.id)).scalar()
        verified_products = self.db.query(func.count(CatalogProduct.id)).filter(
            CatalogProduct.is_verified == True
        ).scalar()
        total_ingredients = self.db.query(func.count(CatalogIngredient.id)).scalar()
        
        # By source
        by_source = {}
        source_counts = self.db.query(
            CatalogProduct.source, func.count(CatalogProduct.id)
        ).group_by(CatalogProduct.source).all()
        for source, count in source_counts:
            by_source[source] = count
        
        # By category
        by_category = {}
        cat_counts = self.db.query(
            CatalogProduct.category, func.count(CatalogProduct.id)
        ).group_by(CatalogProduct.category).order_by(
            func.count(CatalogProduct.id).desc()
        ).limit(10).all()
        for cat, count in cat_counts:
            by_category[cat] = count
        
        return {
            "total_products": total_products,
            "verified_products": verified_products,
            "total_ingredients": total_ingredients,
            "by_source": by_source,
            "by_category": by_category,
        }
    
    # =========================================
    # PRIVATE HELPERS
    # =========================================
    
    def _product_to_dict(self, product: CatalogProduct) -> Dict:
        """Convert a CatalogProduct to a dictionary."""
        return {
            "id": str(product.id),
            "barcode": product.barcode,
            "name": product.name,
            "brand": product.brand,
            "category": product.category,
            "subcategory": product.subcategory,
            "description": product.description,
            "size_ml": product.size_ml,
            "price_usd": product.price_usd,
            "price_range": product.price_range,
            # Images
            "image_url": product.image_front_url or product.thumbnail_url,
            "image_front_url": product.image_front_url,
            "thumbnail_url": product.thumbnail_url,
            # Pre-computed safety (no need to re-analyze!)
            "safety_score": product.safety_score,
            "safety_summary": product.safety_summary,
            "flagged_ingredients": product.flagged_ingredients,
            "pregnancy_safe": product.pregnancy_safe,
            "sensitive_skin_safe": product.sensitive_skin_safe,
            # Ingredients
            "ingredients_text": product.ingredients_text,
            "ingredients": product.ingredients_text.split(", ") if product.ingredients_text else [],
            "key_ingredients": product.key_ingredients,
            # Attributes
            "is_fragrance_free": product.is_fragrance_free,
            "is_vegan": product.is_vegan,
            "is_cruelty_free": product.is_cruelty_free,
            # Skin compatibility
            "suitable_skin_types": product.suitable_skin_types,
            "targets_concerns": product.targets_concerns,
            # Meta
            "is_verified": product.is_verified,
            "data_quality_score": product.data_quality_score,
            "source": product.source,
            "scan_count": product.scan_count,
        }
    
    def _add_ingredients(
        self,
        product_id: uuid.UUID,
        ingredients: List[str],
        key_ingredients: Optional[List[Dict]] = None
    ):
        """Add ingredients to a product."""
        key_ing_map = {}
        if key_ingredients:
            for ki in key_ingredients:
                name = ki.get("name", "").lower().strip()
                if name:
                    key_ing_map[name] = ki.get("percentage")
        
        for position, ing_name in enumerate(ingredients, start=1):
            if not ing_name or not ing_name.strip():
                continue
            
            ing_name = ing_name.strip()
            
            # Get or create ingredient
            ingredient = self.db.query(CatalogIngredient).filter(
                func.lower(CatalogIngredient.inci_name) == ing_name.lower()
            ).first()
            
            if not ingredient:
                ingredient = CatalogIngredient(
                    id=uuid.uuid4(),
                    inci_name=ing_name,
                    common_names=[],
                )
                self.db.add(ingredient)
                self.db.flush()
            
            # Check if it's a key ingredient
            is_key = ing_name.lower() in key_ing_map
            concentration = None
            if is_key and key_ing_map[ing_name.lower()]:
                # Parse percentage like "10%" -> 10.0
                pct = key_ing_map[ing_name.lower()]
                if pct:
                    match = re.search(r'(\d+(?:\.\d+)?)', str(pct))
                    if match:
                        concentration = float(match.group(1))
            
            # Create link
            link = CatalogProductIngredient(
                id=uuid.uuid4(),
                product_id=product_id,
                ingredient_id=ingredient.id,
                position=position,
                concentration_percent=concentration,
                is_key_active=is_key,
            )
            self.db.add(link)
    
    def _parse_category(self, categories_str: str) -> str:
        """Parse OBF category string to our category."""
        if not categories_str:
            return "other"
        
        categories_lower = categories_str.lower()
        
        # Map OBF categories to our categories
        category_map = {
            "cleanser": ["cleanser", "face wash", "cleansing", "micellar"],
            "moisturizer": ["moisturizer", "moisturiser", "cream", "lotion", "hydrat"],
            "serum": ["serum", "essence", "ampoule", "concentrate"],
            "sunscreen": ["sunscreen", "sun protection", "spf", "solar"],
            "toner": ["toner", "tonic", "lotion"],
            "mask": ["mask", "masque"],
            "exfoliant": ["exfoliat", "peel", "scrub"],
            "eye_cream": ["eye cream", "eye care", "eye contour"],
            "lip_care": ["lip", "balm"],
            "body_care": ["body", "hand cream", "foot"],
        }
        
        for our_cat, keywords in category_map.items():
            for keyword in keywords:
                if keyword in categories_lower:
                    return our_cat
        
        return "other"
    
    def _parse_ingredients_text(self, text: str) -> List[str]:
        """Parse ingredients text to list."""
        if not text:
            return []
        
        # Split by comma, handle parentheses
        ingredients = []
        current = ""
        paren_depth = 0
        
        for char in text:
            if char == "(":
                paren_depth += 1
                current += char
            elif char == ")":
                paren_depth -= 1
                current += char
            elif char == "," and paren_depth == 0:
                ing = current.strip()
                if ing:
                    ingredients.append(ing)
                current = ""
            else:
                current += char
        
        # Add last ingredient
        if current.strip():
            ingredients.append(current.strip())
        
        return ingredients[:50]  # Limit to 50 ingredients
    
    def _calculate_quality_score(self, obf_data: Dict) -> int:
        """Calculate data quality score for OBF product."""
        score = 0
        
        if obf_data.get("product_name"):
            score += 20
        if obf_data.get("brands"):
            score += 20
        if obf_data.get("ingredients_text"):
            score += 25
        if obf_data.get("image_front_url"):
            score += 15
        if obf_data.get("categories"):
            score += 10
        if obf_data.get("generic_name"):
            score += 10
        
        return min(score, 100)


# =========================================
# CONVENIENCE FUNCTIONS
# =========================================

def get_catalog_service(db: Session) -> ProductCatalogService:
    """Factory function to get a ProductCatalogService instance."""
    return ProductCatalogService(db)


async def lookup_product_catalog_first(
    db: Session,
    barcode: Optional[str] = None,
    name: Optional[str] = None,
    brand: Optional[str] = None
) -> Tuple[Optional[Dict], bool]:
    """
    Try to find a product in the catalog first.
    
    Returns:
        (product_dict, was_found_in_catalog)
        
    Usage in scanner:
        product, found = await lookup_product_catalog_first(db, barcode="123")
        if found:
            # Use cached data, no AI call needed!
            return product
        else:
            # Call AI for identification
            ...
    """
    catalog = ProductCatalogService(db)
    
    if barcode:
        product = catalog.lookup_barcode(barcode)
        if product:
            return (product, True)
    
    if name and brand:
        product = catalog.lookup_by_name_brand(name, brand)
        if product:
            return (product, True)
    
    return (None, False)
