#!/usr/bin/env python3
"""
Seed a small set of sample products for local testing.
"""

from datetime import datetime, timezone
import sys
from pathlib import Path

from sqlalchemy.exc import SQLAlchemyError

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Base, SessionLocal, engine
from app.models import product_models  # noqa: F401
from app.models.product_models import Product


def seed_sample_products() -> None:
    if engine.dialect.name == "sqlite":
        raise RuntimeError(
            "Sample product seeding requires PostgreSQL. "
            "SQLite cannot create JSONB/ARRAY columns."
        )

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        samples = [
            Product(
                brand="CeraVe",
                name="Hydrating Facial Cleanser",
                category="cleanser",
                suitable_for=["dry", "normal", "combination"],
                targets=["dryness", "sensitivity"],
                average_rating=4.6,
                price_usd=14.99,
                product_image_url="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9",
                created_at=datetime.now(timezone.utc),
            ),
            Product(
                brand="La Roche-Posay",
                name="Effaclar Duo Acne Treatment",
                category="treatment",
                suitable_for=["oily", "combination"],
                targets=["acne", "pores"],
                average_rating=4.5,
                price_usd=29.99,
                product_image_url="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2",
                created_at=datetime.now(timezone.utc),
            ),
            Product(
                brand="The Ordinary",
                name="Niacinamide 10% + Zinc 1%",
                category="serum",
                suitable_for=["oily", "combination", "normal"],
                targets=["oiliness", "texture", "pores"],
                average_rating=4.4,
                price_usd=6.5,
                product_image_url="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9",
                created_at=datetime.now(timezone.utc),
            ),
            Product(
                brand="Neutrogena",
                name="Hydro Boost Water Gel",
                category="moisturizer",
                suitable_for=["dry", "normal", "combination"],
                targets=["dryness", "texture"],
                average_rating=4.3,
                price_usd=19.99,
                product_image_url="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2",
                created_at=datetime.now(timezone.utc),
            ),
        ]

        added = 0
        for product in samples:
            exists = (
                db.query(Product)
                .filter(Product.name == product.name, Product.brand == product.brand)
                .first()
            )
            if exists:
                continue
            db.add(product)
            added += 1

        db.commit()
        print(f"Seeded {added} sample products.")
    except SQLAlchemyError as exc:
        db.rollback()
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    seed_sample_products()
