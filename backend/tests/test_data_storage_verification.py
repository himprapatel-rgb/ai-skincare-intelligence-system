"""
Verify that all collected user/data types are actually stored in the database.

Run: pytest tests/test_data_storage_verification.py -v --no-cov

Confirms we persist:
- User profile (user_profiles): skin type, concerns, timezone, etc.
- Scan session: device_context at init; full analysis result (summary, recommendations) in scan_metadata after analysis
- User consent (user_consents): terms/privacy accepted, version, IP
- IP/geolocation: users.last_ip_address, last_geolocation, last_seen_at; user_access_logs per request
- Shelf products (shelf_products)
- Favorites (user_favorites)
"""
import uuid

import pytest
from sqlalchemy.orm import Session

from app.models.favorites import UserFavorite
from app.models.shelf import ShelfProduct
from app.models.user import User, UserAccessLog, UserConsent, UserProfile
from app.models.scan import ScanSession, ScanStatus


# Ensure tables exist (shelf/favorites are loaded via app.main; import here for this test module)
def _ensure_models_loaded():
    import app.models.shelf  # noqa: F401
    import app.models.favorites  # noqa: F401


class TestUserProfileStorage:
    """User profile is persisted to user_profiles."""

    def test_profile_is_stored_and_retrieved(self, test_db: Session, test_user):
        _ensure_models_loaded()
        profile = UserProfile(
            user_id=test_user.id,
            first_name="Test",
            last_name="User",
            skin_type="combination",
            primary_concern="acne",
            secondary_concerns=["hydration", "pores"],
            timezone="America/New_York",
        )
        test_db.add(profile)
        test_db.commit()
        test_db.refresh(profile)
        assert profile.id is not None
        found = test_db.query(UserProfile).filter(UserProfile.user_id == test_user.id).first()
        assert found is not None
        assert found.skin_type == "combination"
        assert found.secondary_concerns == ["hydration", "pores"]


class TestScanStorage:
    """Scan session stores device_context and analysis result in scan_metadata."""

    def test_scan_init_stores_device_context(self, client, auth_headers):
        """POST /api/v1/scan/init with device_context persists it in scan_metadata."""
        body = {
            "device_context": {
                "screen": {"width": 390, "height": 844, "pixelRatio": 2},
                "locale": {"timezone": "Europe/Dublin", "language": "en"},
                "device": {"platform": "Win32", "hardwareConcurrency": 8},
                "collectedAt": "2026-02-04T12:00:00.000Z",
            }
        }
        r = client.post("/api/v1/scan/init", json=body, headers=auth_headers)
        assert r.status_code in (200, 201), r.text
        data = r.json()
        scan_id = data.get("scan_id")
        assert scan_id

        # Fetch scan from DB and verify device_context stored
        from app.database import SessionLocal
        db = SessionLocal()
        try:
            scan = db.query(ScanSession).filter(ScanSession.id == uuid.UUID(scan_id)).first()
            assert scan is not None
            assert scan.scan_metadata is not None
            assert isinstance(scan.scan_metadata, dict)
            assert "device_context" in scan.scan_metadata
            ctx = scan.scan_metadata["device_context"]
            assert ctx["screen"]["width"] == 390
            assert ctx["locale"]["timezone"] == "Europe/Dublin"
            assert ctx["device"]["platform"] == "Win32"
        finally:
            db.close()

    def test_scan_metadata_stores_analysis_result(self, test_db: Session, test_user):
        """scan_metadata can hold full analysis result (summary, recommendations)."""
        scan = ScanSession(
            user_id=test_user.id,
            status=ScanStatus.COMPLETED,
            scan_metadata={
                "device_context": {"screen": {"width": 390}},
                "summary": {"overall_score": 78, "scores": {"acne": 20, "moisture": 85}},
                "recommendations": ["Use gentle cleanser", "Apply SPF"],
            },
        )
        test_db.add(scan)
        test_db.commit()
        test_db.refresh(scan)
        assert scan.id is not None
        found = test_db.query(ScanSession).filter(ScanSession.id == scan.id).first()
        assert found.scan_metadata is not None
        assert found.scan_metadata.get("summary", {}).get("overall_score") == 78
        assert "recommendations" in found.scan_metadata
        assert len(found.scan_metadata["recommendations"]) == 2


class TestConsentStorage:
    """User consent is persisted to user_consents."""

    def test_consent_is_stored(self, test_db: Session, test_user):
        consent = UserConsent(
            user_id=test_user.id,
            terms_accepted=True,
            privacy_accepted=True,
            terms_version="1.0.0",
            privacy_version="1.0.0",
            ip_address="192.168.1.1",
        )
        test_db.add(consent)
        test_db.commit()
        test_db.refresh(consent)
        assert consent.id is not None
        found = test_db.query(UserConsent).filter(UserConsent.user_id == test_user.id).first()
        assert found is not None
        assert found.terms_accepted is True
        assert found.ip_address == "192.168.1.1"


class TestIPGeolocationStorage:
    """IP and geolocation are stored on User and in user_access_logs."""

    def test_user_and_access_log_store_ip_geo(self, test_db: Session, test_user):
        """User.last_* and UserAccessLog are persisted."""
        test_user.last_ip_address = "203.0.113.42"
        test_user.last_geolocation = {"country": "IE", "city": "Dublin", "lat": 53.35, "lon": -6.26}
        test_db.add(test_user)
        log = UserAccessLog(
            user_id=test_user.id,
            ip_address="203.0.113.42",
            geolocation={"country": "IE", "city": "Dublin"},
        )
        test_db.add(log)
        test_db.commit()
        test_db.refresh(test_user)
        test_db.refresh(log)
        assert log.id is not None
        found_user = test_db.query(User).filter(User.id == test_user.id).first()
        assert found_user.last_ip_address == "203.0.113.42"
        assert found_user.last_geolocation.get("country") == "IE"
        found_logs = test_db.query(UserAccessLog).filter(UserAccessLog.user_id == test_user.id).all()
        assert len(found_logs) >= 1
        assert any(l.ip_address == "203.0.113.42" for l in found_logs)


class TestShelfStorage:
    """Shelf products are persisted to shelf_products."""

    def test_shelf_product_is_stored(self, test_db: Session, test_user):
        _ensure_models_loaded()
        shelf = ShelfProduct(
            user_id=test_user.id,
            product_name="Test Serum",
            product_brand="Brand",
            product_category="serum",
            status="active",
        )
        test_db.add(shelf)
        test_db.commit()
        test_db.refresh(shelf)
        assert shelf.id is not None
        found = test_db.query(ShelfProduct).filter(ShelfProduct.user_id == test_user.id).first()
        assert found is not None
        assert found.product_name == "Test Serum"


class TestFavoritesStorage:
    """Favorites are persisted to user_favorites."""

    def test_favorite_is_stored(self, test_db: Session, test_user):
        _ensure_models_loaded()
        fav = UserFavorite(
            user_id=test_user.id,
            product_name="Favorite Moisturizer",
            product_brand="Brand",
        )
        test_db.add(fav)
        test_db.commit()
        test_db.refresh(fav)
        assert fav.id is not None
        found = test_db.query(UserFavorite).filter(UserFavorite.user_id == test_user.id).first()
        assert found is not None
        assert found.product_name == "Favorite Moisturizer"
