import pytest

import app.services.youcam_service as youcam_service
from app.services.youcam_service import YouCamClient, YouCamError, build_youcam_summary


@pytest.mark.unit
@pytest.mark.asyncio
async def test_poll_task_returns_success(monkeypatch):
    client = YouCamClient(
        base_url="https://example.com",
        api_key="test-key",
        timeout_seconds=5,
    )
    calls = {"count": 0}

    async def fake_get_task(task: str, task_id: str):
        calls["count"] += 1
        if calls["count"] == 1:
            return {"data": {"task_status": "running"}}
        return {"data": {"task_status": "success"}}

    async def fake_sleep(_seconds: int):
        return None

    monkeypatch.setattr(client, "get_task", fake_get_task)
    monkeypatch.setattr(youcam_service.asyncio, "sleep", fake_sleep)

    payload = await client.poll_task(
        task="skin-analysis",
        task_id="task-123",
        interval_seconds=1,
        max_wait_seconds=10,
    )

    assert payload["data"]["task_status"] == "success"
    assert calls["count"] == 2


@pytest.mark.unit
@pytest.mark.asyncio
async def test_poll_task_raises_on_error():
    client = YouCamClient(
        base_url="https://example.com",
        api_key="test-key",
        timeout_seconds=5,
    )

    async def fake_get_task(task: str, task_id: str):
        return {"data": {"task_status": "error", "error": "bad_input"}}

    client.get_task = fake_get_task  # type: ignore[assignment]

    with pytest.raises(YouCamError) as exc_info:
        await client.poll_task(
            task="skin-analysis",
            task_id="task-456",
            interval_seconds=1,
            max_wait_seconds=10,
        )

    assert exc_info.value.error_code == "bad_input"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_poll_task_times_out(monkeypatch):
    client = YouCamClient(
        base_url="https://example.com",
        api_key="test-key",
        timeout_seconds=5,
    )

    async def fake_get_task(task: str, task_id: str):
        return {"data": {"task_status": "running"}}

    monkeypatch.setattr(client, "get_task", fake_get_task)

    with pytest.raises(YouCamError) as exc_info:
        await client.poll_task(
            task="skin-analysis",
            task_id="task-789",
            interval_seconds=1,
            max_wait_seconds=0,
        )

    assert "timed out" in str(exc_info.value).lower()


@pytest.mark.unit
def test_build_youcam_summary_extracts_scores():
    payload = {
        "data": {
            "results": {
                "output": [
                    {"type": "wrinkle", "ui_score": 80, "mask_urls": "https://example.com/wrinkle.png"},
                    {"type": "acne", "raw_score": 65.5, "mask_urls": "https://example.com/acne.png"},
                    {"type": "all", "score": 72.5},
                    {"type": "resize_image", "mask_urls": "https://example.com/resize.jpg"},
                ]
            }
        }
    }

    summary = build_youcam_summary(payload)

    assert summary["overall_score"] == 72.5
    assert summary["image_url"] == "https://example.com/resize.jpg"
    assert summary["scores"]["wrinkle"] == 80
    assert summary["scores"]["acne"] == 65.5
    assert "wrinkle" in summary["concerns"]
    assert "acne" in summary["concerns"]
    assert summary["mask_urls"]["wrinkle"] == "https://example.com/wrinkle.png"


@pytest.mark.unit
def test_build_youcam_summary_handles_missing_output():
    summary = build_youcam_summary({"data": {"results": {"output": None}}})
    assert summary["overall_score"] is None
    assert summary["concerns"] == []
