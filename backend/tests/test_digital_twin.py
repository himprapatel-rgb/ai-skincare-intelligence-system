from datetime import datetime, timedelta

from app.models.scan import ScanSession


def _create_scan(test_db, user_id: int, created_at: datetime, overall_score: float, concerns: list[str]) -> ScanSession:
    scan = ScanSession(
        user_id=user_id,
        status="completed",
        scan_metadata={
            "summary": {
                "overall_score": overall_score,
                "scores": {
                    "acne": 80 if overall_score < 70 else 20,
                    "redness": 70 if overall_score < 70 else 40,
                    "dehydration": 60 if overall_score < 70 else 30,
                    "wrinkles": 50 if overall_score < 70 else 25,
                    "pores": 55 if overall_score < 70 else 35,
                },
                "concerns": concerns,
            },
            "skin_mood": "balanced",
        },
        created_at=created_at,
        completed_at=created_at + timedelta(minutes=5),
    )
    test_db.add(scan)
    test_db.commit()
    test_db.refresh(scan)
    return scan


def test_digital_twin_query_returns_timeline_and_insights(client, test_db, test_user, auth_headers):
    older = _create_scan(
        test_db,
        user_id=test_user.id,
        created_at=datetime(2026, 1, 1, 10, 0, 0),
        overall_score=55,
        concerns=["dehydration", "acne"],
    )
    newer = _create_scan(
        test_db,
        user_id=test_user.id,
        created_at=datetime(2026, 1, 15, 10, 0, 0),
        overall_score=82,
        concerns=["redness", "acne"],
    )

    response = client.get("/api/v1/digital-twin/query", headers=auth_headers)
    assert response.status_code == 200

    data = response.json()
    assert data["latest_snapshot"]["snapshot_id"] == str(newer.id)
    assert data["latest_snapshot"]["meta"]["concerns"] == ["redness", "acne"]
    assert data["timeline"]["total_points"] == 2
    assert data["timeline"]["points"][0]["snapshot_id"] == str(older.id)
    assert data["timeline"]["points"][1]["snapshot_id"] == str(newer.id)
    assert data["timeline"]["summary_insights"]["trend"] == "improving"

    assert data["insights"]["best_improvement"] == "Acne"
    assert data["insights"]["top_concern"] == "Redness"
