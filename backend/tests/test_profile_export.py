from datetime import timedelta

from app.core.security import create_access_token, hash_password
from app.models.user import User, UserProfile


def test_export_profile_data(client, auth_headers, test_db, test_user):
    profile = UserProfile(
        user_id=test_user.id,
        goals=["hydration"],
        secondary_concerns=["dryness"],
        skin_type="combination",
        routine_frequency="twice_daily",
        climate="temperate",
    )
    test_db.add(profile)
    test_db.commit()

    response = client.get("/api/v1/profile/export", headers=auth_headers)
    assert response.status_code == 200
    payload = response.json()
    assert "user" in payload
    assert "profile" in payload
    assert "scans" in payload
    assert "export_timestamp" in payload


def test_delete_profile_removes_user(client, test_db):
    user = User(
        email="delete_me@example.com",
        hashed_password=hash_password("testpassword123"),
        is_active=True,
        is_verified=True,
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=timedelta(minutes=30)
    )
    headers = {"Authorization": f"Bearer {access_token}"}

    response = client.delete("/api/v1/profile", headers=headers)
    assert response.status_code == 200
    assert "Account deletion initiated" in response.json().get("message", "")

    deleted = test_db.query(User).filter(User.id == user.id).first()
    assert deleted is None


def test_baseline_and_update_profile(client, test_db):
    user = User(
        email="baseline@example.com",
        hashed_password=hash_password("testpassword123"),
        is_active=True,
        is_verified=True,
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=timedelta(minutes=30)
    )
    headers = {"Authorization": f"Bearer {access_token}"}

    baseline_payload = {
        "goals": ["anti_aging"],
        "concerns": ["fine_lines"],
        "skin_type": "combination",
        "routine_frequency": "twice_daily",
        "climate": "temperate",
    }
    response = client.post("/api/v1/profile/baseline", json=baseline_payload, headers=headers)
    assert response.status_code == 200

    update_payload = {
        "first_name": "Baseline",
        "last_name": "User",
        "location": "Dublin",
        "preferred_ingredients": ["niacinamide"],
        "email_notifications": False,
        "goals": ["hydration"],
        "concerns": ["dryness"],
        "skin_type": "oily",
    }
    response = client.patch("/api/v1/profile", json=update_payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["first_name"] == "Baseline"

    response = client.get("/api/v1/profile", headers=headers)
    assert response.status_code == 200
    assert response.json()["user_id"] == user.id
