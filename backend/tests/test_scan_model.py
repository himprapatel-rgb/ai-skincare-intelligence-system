from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from app.models.scan import ScanSession, ScanStatus, SkinAnalysis, SkinType


def test_scan_session_to_dict():
    scan_id = uuid4()
    created_at = datetime.utcnow()
    completed_at = datetime.utcnow()

    session = ScanSession(
        id=scan_id,
        user_id=123,
        status=ScanStatus.COMPLETED,
        image_url="https://example.com/scan.jpg",
        scan_metadata={"summary": {"overall_score": 80}},
        created_at=created_at,
        completed_at=completed_at,
        error_message=None,
    )

    payload = session.to_dict()
    assert payload["id"] == str(scan_id)
    assert payload["user_id"] == "123"
    assert payload["status"] == "completed"
    assert payload["image_url"] == "https://example.com/scan.jpg"
    assert payload["scan_metadata"]["summary"]["overall_score"] == 80
    assert payload["created_at"] == created_at.isoformat()
    assert payload["completed_at"] == completed_at.isoformat()


def test_skin_analysis_to_dict_and_repr():
    analysis_id = uuid4()
    scan_id = uuid4()

    analysis = SkinAnalysis(
        id=analysis_id,
        scan_session_id=scan_id,
        skin_type=SkinType.COMBINATION,
        fitzpatrick_scale=3,
        concerns=[{"concern_type": "redness", "severity": "moderate"}],
        confidence_scores={"redness": 0.7},
        overall_confidence=0.8,
        analysis_version="v1",
    )

    payload = analysis.to_dict()
    assert payload["id"] == str(analysis_id)
    assert payload["scan_session_id"] == str(scan_id)
    assert payload["skin_type"] == "combination"
    assert payload["fitzpatrick_scale"] == 3
    assert payload["concerns"][0]["concern_type"] == "redness"
    assert payload["confidence_scores"]["redness"] == 0.7
    assert payload["overall_confidence"] == 0.8

    assert "SkinAnalysis" in repr(analysis)
